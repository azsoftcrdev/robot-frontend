// src/hooks/useRobotWS.ts
import { useEffect, useRef } from "react";
import { useRobots } from "../robots/RobotsContext";

type MsgHandler = (msg: any) => void;

export function useRobotWS(onMessage?: MsgHandler) {
  const { active } = useRobots();
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef<MsgHandler | undefined>(onMessage);
  const retryRef = useRef<number>(0);
  const closedByUserRef = useRef(false);

  // Mantén siempre la referencia más reciente del handler
  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Si no hay robot activo, cierra y sal
    if (!active) {
      closedByUserRef.current = true;
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    // Normaliza el path: montaste /ws y el endpoint interno es "/"
    const basePath = (active.wsPath ?? "/ws").replace(/\/$/, ""); // sin slash final
    const wsUrl = `ws://${active.host}:${active.httpPort}${basePath}/`; // con slash final

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    closedByUserRef.current = false;

    const connect = () => {
      // limpia intento previo
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
      }

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0; // reset backoff
        // opcional: podrías enviar un hello aquí
        // ws.send(JSON.stringify({ topic: "hello", data: { ts: Date.now() } }));
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          handlerRef.current?.(data);
        } catch {
          // ignora no-JSON
        }
      };

      ws.onerror = () => {
        // dejar que onclose maneje el reintento
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUserRef.current) return; // cierre intencional

        // Backoff exponencial suave: 300ms, 800ms, 1500ms, máx 5s
        const delay = Math.min(5000, 300 + 500 * Math.pow(1.5, retryRef.current++));
        reconnectTimer = window.setTimeout(connect, delay) as unknown as number;
      };
    };

    connect();

    return () => {
      closedByUserRef.current = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [active?.host, active?.httpPort, active?.wsPath]);

  const send = (obj: any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
    // si quisieras: podrías bufferizar y enviar al abrir
  };

  return { active, send, ws: wsRef };
}
