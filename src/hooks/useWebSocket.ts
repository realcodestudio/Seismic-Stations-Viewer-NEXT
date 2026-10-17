'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSeismicStore } from '@/src/store/seismicStore';
import { useAppStore } from '@/src/store/appStore';
import type { SeismicData } from '@/src/types/seismic';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reconnectCountRef = useRef(0);
  const debugModeRef = useRef(false);
  const lastMsgAtRef = useRef(Date.now());
  const MAX_RECONNECT = 256;
  const RECONNECT_INTERVAL = 10000;

  const updateSeismicData = useSeismicStore((s) => s.updateSeismicData);
  const websocketUrl = useAppStore((s) => s.websocketUrl);
  const debugMode = useAppStore((s) => s.debugMode);

  // Keep ref in sync with current debugMode
  useEffect(() => {
    debugModeRef.current = debugMode;
  }, [debugMode]);

  const connect = useCallback(() => {
    if (debugModeRef.current) {
      console.log('Debug mode active - WebSocket paused');
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;
    lastMsgAtRef.current = Date.now();

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectCountRef.current = 0;
      lastMsgAtRef.current = Date.now();
    };

    ws.onmessage = (event) => {
      if (debugModeRef.current) return;
      lastMsgAtRef.current = Date.now();
      try {
        const data = JSON.parse(event.data) as SeismicData;
        if (!data || typeof data.PGA === 'undefined') return;
        updateSeismicData(data);
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = (event) => {
      console.warn(`WebSocket closed (code ${event.code}${event.reason ? ': ' + event.reason : ''})`);
      if (debugModeRef.current) return;
      if (wsRef.current !== ws) return;
      if (reconnectCountRef.current < MAX_RECONNECT) {
        reconnectCountRef.current++;
        console.log(
          `Reconnecting (${reconnectCountRef.current}/${MAX_RECONNECT})...`
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = undefined;
          connect();
        }, RECONNECT_INTERVAL);
      } else {
        console.error('Max reconnection attempts reached');
        reconnectCountRef.current = 0;
      }
    };
  }, [websocketUrl, updateSeismicData]);

  useEffect(() => {
    reconnectCountRef.current = 0;
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // A tab that was backgrounded, asleep or cut off from the network keeps
  // `readyState: OPEN` on a dead socket, so onclose never fires and the retry
  // loop above never starts. Detect the silence instead and reconnect.
  const resync = useCallback(
    (reason: string, silenceMs: number) => {
      if (debugModeRef.current) return;
      const state = wsRef.current?.readyState;
      if (state === WebSocket.CONNECTING || reconnectTimeoutRef.current !== undefined) return;
      const open = state === WebSocket.OPEN;
      const silentFor = Date.now() - lastMsgAtRef.current;
      if (open && silentFor < silenceMs) return;
      console.warn(
        `WebSocket resync (${reason}): ${open ? `silent ${Math.round(silentFor / 1000)}s` : 'socket not open'}`
      );
      reconnectCountRef.current = 0;
      connect();
    },
    [connect]
  );

  useEffect(() => {
    // Runs (throttled to ~1/min) while the tab is hidden too, so an unfocused
    // background window or OBS source recovers a dead socket on its own.
    const watchdog = setInterval(() => resync('watchdog', 30000), 5000);

    const onResume = () => {
      if (document.visibilityState !== 'visible') return;
      resync('resume', 10000);
    };
    const onOnline = () => resync('network online', 10000);

    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', onResume);
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(watchdog);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', onResume);
      window.removeEventListener('online', onOnline);
    };
  }, [resync]);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    connect();
  }, [connect]);

  return { reconnect };
}
