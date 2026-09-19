'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNotificationStore } from '../store/notifications';

const WebSocketContext = createContext<{ connected: boolean }>({ connected: false });

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { addToast } = useNotificationStore();

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let attempt = 0;

    const connect = () => {
      // Connect to mock endpoint or localhost
      ws = new WebSocket('ws://localhost:8000/api/ws');
      
      ws.onopen = () => {
        setConnected(true);
        attempt = 0;
        addToast('Connected to real-time intelligence stream', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ALERT') {
            addToast(data.message, data.level || 'warning');
          }
        } catch(e) {}
      };

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(10000, 1000 * Math.pow(2, attempt)); // Exponential backoff max 10s
        attempt++;
        
        // Suppress repeated toast on first drop if already warned, but for demo:
        if (attempt === 1) addToast('Connection lost. Reconnecting...', 'warning');
        
        reconnectTimer = setTimeout(connect, delay);
      };
      
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WebSocketContext.Provider value={{ connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
