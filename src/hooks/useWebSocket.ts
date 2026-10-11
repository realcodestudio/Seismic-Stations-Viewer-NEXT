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

    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectCountRef.current = 0;
    };

    ws.onmessage = (event) => {
      if (debugModeRef.current) return;
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

    ws.onclose = () => {
      console.warn('WebSocket closed');
      if (debugModeRef.current) return;
      if (wsRef.current !== ws) return;
      if (reconnectCountRef.current < MAX_RECONNECT) {
        reconnectCountRef.current++;
        console.log(
          `Reconnecting (${reconnectCountRef.current}/${MAX_RECONNECT})...`
        );
        reconnectTimeoutRef.current = setTimeout(() => {
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
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    reconnectCountRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    connect();
  }, [connect]);

  return { reconnect };
}
