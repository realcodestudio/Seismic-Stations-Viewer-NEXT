'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useAppStore } from '@/src/store/appStore';

interface DocumentPipWindow extends Window {
  document: Document;
}

interface DocumentPictureInPicture {
  requestWindow(options?: {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
  }): Promise<DocumentPipWindow | undefined>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

export function isDocumentPipSupported(): boolean {
  return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'closed' | 'opening' | 'open' | 'unmounting' | 'closing';

export function usePipWindow() {
  // starts false (matches SSR), re-probed in the effect below
  const [supported, setSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<DocumentPipWindow | null>(null);
  const [phase, setPhase] = useState<Phase>('closed');
  const [restartToken, setRestartToken] = useState(0);
  const windowRef = useRef<DocumentPipWindow | null>(null);
  const phaseRef = useRef<Phase>('closed');

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  useEffect(() => {
    setSupported(isDocumentPipSupported());
  }, []);

  const open = useCallback(async () => {
    if (!supported || phaseRef.current !== 'closed' || windowRef.current) return;
    setPhaseBoth('opening');
    try {
      const { pipStyle, pipDims } = useAppStore.getState();
      const dims = pipDims[pipStyle];
      const win = await window.documentPictureInPicture?.requestWindow({
        width: dims.width,
        height: dims.height,
        // ignore the browser's remembered size/position so settings size always wins
        preferInitialWindowPlacement: true,
      });
      if (!win) {
        setPhaseBoth('closed');
        return;
      }
      windowRef.current = win;
      setPipWindow(win);
      setPhaseBoth('open');
      win.focus();
      win.addEventListener('pagehide', () => {
        // Only fires for user-initiated closes: our own closeSequence nulls
        // windowRef before win.close(), so the guard skips that path.
        if (windowRef.current !== win) return;
        windowRef.current = null;
        // Synchronously detach the portal while the document is still alive,
        // then return to 'closed' so the FAB can reopen a fresh window.
        flushSync(() => {
          setPipWindow(null);
          setPhaseBoth('closed');
        });
      });
    } catch (err) {
      console.error('Failed to open Picture-in-Picture window:', err);
      windowRef.current = null;
      setPipWindow(null);
      setPhaseBoth('closed');
    }
  }, [supported, setPhaseBoth]);

  /**
   * The portal must fully unmount from the PiP document BEFORE the window
   * closes; closing first makes React tear down a portal into a destroyed
   * document and crashes the whole opener page. `flushSync` forces React to
   * commit the unmount synchronously — a timing-based rAF wait was not
   * reliable enough and still white-screened on slow switches.
   */
  const closeSequence = useCallback(
    async (reopen: boolean) => {
      const win = windowRef.current;
      if (!win || phaseRef.current !== 'open') return;
      // Lock synchronously so a re-entrant toggle/restart can't start a second
      // sequence, then flush the unmount in a microtask (never inside the
      // passive-effect call stack, where flushSync is not allowed).
      phaseRef.current = 'unmounting';
      await Promise.resolve();
      if (windowRef.current !== win) return;
      // PipBridge renders null while phase !== 'open' → portal detaches.
      flushSync(() => {
        setPhaseBoth('unmounting');
        setRestartToken((n) => n + 1);
      });
      setPhaseBoth('closing');
      windowRef.current = null;
      setPipWindow(null);
      try {
        win.close();
      } catch {
        /* window may already be gone */
      }
      if (reopen) {
        // short gap keeps the click's transient user activation alive for requestWindow
        await wait(80);
        setPhaseBoth('closed');
        void open();
      } else {
        setPhaseBoth('closed');
      }
    },
    [open, setPhaseBoth]
  );

  const toggle = useCallback(() => {
    const p = phaseRef.current;
    if (p === 'open') void closeSequence(false);
    else if (p === 'closed') void open();
    // opening/unmounting/closing: ignore until the sequence settles
  }, [closeSequence, open]);

  const restart = useCallback(() => {
    if (phaseRef.current !== 'open') return;
    void closeSequence(true);
  }, [closeSequence]);

  // Leaving the page should not leave an orphaned PiP window behind.
  // The unmount already detached the portal, so a direct close is safe here.
  useEffect(
    () => () => {
      windowRef.current?.close();
      windowRef.current = null;
    },
    []
  );

  return {
    supported,
    pipWindow: phase === 'open' ? pipWindow : null,
    restartToken,
    toggle,
    restart,
  };
}
