import { useEffect, useRef, useState } from "react";
import { useWebSocket } from "./useWebSocket";

export type Setpoint = { x:number; y:number; z:number; speed?:number };

export function useTeleop(hz = 10) {
  const { send } = useWebSocket("/ws");
  const pressed = useRef<Set<string>>(new Set());
  const [sp, setSp] = useState<Setpoint>({ x:0, y:0, z:0, speed:2 });

  const sendSP = (next: Setpoint) => {
    send({ type:"motion_setpoint", ...next });
    setSp(next);
  };

  // helpers de postura (puedes cambiarlos por endpoints reales)
  const standUp = () => fetch("/posture/medium", { method:"POST" });
  const crouch  = () => fetch("/posture/low",    { method:"POST" });

  // traduce teclas → setpoint
  const compute = (prev: Setpoint): Setpoint => {
    const V = 15, speed = prev.speed ?? 2;
    const p = pressed.current;
    let x=0,y=0,z=0;
    if (p.has("w") && !p.has("s")) x=+V;
    if (p.has("s") && !p.has("w")) x=-V;
    if (p.has("a") && !p.has("d")) y=-V;
    if (p.has("d") && !p.has("a")) y=+V;
    if (p.has("q") && !p.has("e")) z=-V;
    if (p.has("e") && !p.has("q")) z=+V;
    return { x,y,z,speed };
  };

  // teclado (edge-triggered) + seguridad
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === " ") { e.preventDefault(); standUp(); return; }
      if (k === "shift") { pressed.current.add(k); crouch(); return; }
      if ("wasdqez".includes(k)) pressed.current.add(k);
      if (k === "escape") { pressed.current.clear(); sendSP({ x:0,y:0,z:0, speed: sp.speed }); standUp(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") { pressed.current.delete(k); standUp(); return; }
      if ("wasdqez".includes(k)) pressed.current.delete(k);
    };
    const safeStop = () => { pressed.current.clear(); sendSP({ x:0,y:0,z:0, speed: sp.speed }); standUp(); };

    window.addEventListener("keydown", dn, { passive:false });
    window.addEventListener("keyup",   up, { passive:false });
    window.addEventListener("blur", safeStop);
    document.addEventListener("visibilitychange", () => { if (document.hidden) safeStop(); });

    return () => {
      window.removeEventListener("keydown", dn as any);
      window.removeEventListener("keyup",   up as any);
      window.removeEventListener("blur",    safeStop as any);
      document.removeEventListener("visibilitychange", () => {});
    };
  }, [sp.speed]);

  // heartbeat (para watchdog del backend)
  useEffect(() => {
    let last = "";
    const id = setInterval(() => {
      setSp(prev => {
        const next = compute(prev);
        const active = !!(next.x || next.y || next.z);
        const msg = JSON.stringify({ type:"motion_setpoint", ...next });
        if (active || msg !== last) send(JSON.parse(msg));
        last = msg;
        return next;
      });
    }, Math.max(50, Math.min(1000, 1000/ hz))); // ~10Hz por default
    return () => clearInterval(id);
  }, [hz, send]);

  const bumpSpeed = (d:number) => {
    const s = Math.max(1, Math.min(5, (sp.speed ?? 2) + d));
    sendSP({ ...sp, speed: s });
  };

  return { sp, sendSP, bumpSpeed, standUp, crouch };
}
