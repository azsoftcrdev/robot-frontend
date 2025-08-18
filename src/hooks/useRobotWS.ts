// src/hooks/useRobotWS.ts
import { useEffect, useRef } from "react";
import { useRobots } from "../robots/RobotsContext";

export function useRobotWS(onMessage?: (msg:any)=>void) {
  const { active } = useRobots();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // cerrar si no hay activo
    if (!active) { wsRef.current?.close(); wsRef.current = null; return; }

    const proto = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${proto}://${active.host}:${active.httpPort}${active.wsPath ?? "/ws"}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try { onMessage?.(JSON.parse(ev.data)); } catch {}
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [active?.host, active?.httpPort, active?.wsPath, onMessage]);

  const send = (obj:any) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  };

  return { active, send, ws: wsRef };
}
