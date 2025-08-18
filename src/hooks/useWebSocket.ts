import { useEffect, useRef, useCallback } from "react";
import { useRobots } from "../robots/RobotsContext"; // <- contexto actual

export type WSListener = (msg: any) => void;

export function useWebSocket(path = "/ws") {
  const {  active } = useRobots(); // robot seleccionado
  const ws = useRef<WebSocket | null>(null);
  const listeners = useRef<Set<WSListener>>(new Set());

  useEffect(() => {
    if (!active) return;
    const url = `ws://${active.host}:${active.httpPort ?? 8000}${path}`;
    const sock = new WebSocket(url);
    ws.current = sock;

    sock.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        listeners.current.forEach((l) => l(data));
      } catch {
        /* ignora no-JSON */
      }
    };

    return () => {
      sock.close();
      ws.current = null;
      listeners.current.clear();
    };
  }, [path, active]);

  const send = useCallback((obj: any) => {
    const s = ws.current;
    if (s && s.readyState === WebSocket.OPEN) {
      s.send(JSON.stringify(obj));
    }
  }, []);

  const onMessage = useCallback((cb: WSListener) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  }, []);

  return { ws, send, onMessage };
}
