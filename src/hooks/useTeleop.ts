// src/hooks/useTeleop.ts
import { useEffect, useRef, useState } from "react";
import { useRobotWS } from "./useRobotWS";
import { useRobots } from "../robots/RobotsContext";

export type Setpoint = { x:number; y:number; z:number; speed:number };

function scaleV(speed:number) {
  // Escala simple: 1..5 -> 6,12,18,24,30 (clamp a 30)
  const v = 6 + (Math.max(1, Math.min(5, speed)) - 1) * 6;
  return Math.min(30, v);
}

export function useTeleop(hz = 20) {
  const { active } = useRobots();
  const { send } = useRobotWS();               // ws://<host>:<port>/ws/
  const pressed = useRef<Set<string>>(new Set());
  const spRef   = useRef<Setpoint>({ x:0, y:0, z:0, speed:2 });

  // Estado solo para mostrar en UI (throttled)
  const [uiSp, setUiSp] = useState<Setpoint>(spRef.current);

  const baseUrl = active ? `http://${active.host}:${active.httpPort}` : "";
  const standUp = () => { if (baseUrl) fetch(`${baseUrl}/posture/medium`, { method:"POST" }); };
  const crouch  = () => { if (baseUrl) fetch(`${baseUrl}/posture/low`,    { method:"POST" }); };

  // Actualiza "setpoint visible" sin spamear renders
  const updateUiThrottled = (() => {
    let last = 0;
    const minDt = 0.2; // 200 ms
    return () => {
      const now = performance.now() / 1000;
      if (now - last >= minDt) {
        last = now;
        setUiSp(spRef.current);
      }
    };
  })();

  // Traduce teclado -> setpoint (usando speed para escalar V)
  const compute = (): Setpoint => {
    const speed = spRef.current.speed ?? 2;
    const V = scaleV(speed);
    const p = pressed.current;
    let x=0, y=0, z=0;
    if (p.has("w") && !p.has("s")) x = +V;
    if (p.has("s") && !p.has("w")) x = -V;
    if (p.has("a") && !p.has("d")) y = -V;
    if (p.has("d") && !p.has("a")) y = +V;
    if (p.has("q") && !p.has("e")) z = -V;
    if (p.has("e") && !p.has("q")) z = +V;
    return { x, y, z, speed };
  };

  // Edge-triggered teclado + seguridad
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === " ") { e.preventDefault(); standUp(); return; }
      if (k === "shift") { pressed.current.add(k); crouch(); return; }
      if ("wasdqez".includes(k)) pressed.current.add(k);
      if (k === "escape") { pressed.current.clear(); spRef.current = { ...spRef.current, x:0, y:0, z:0 }; standUp(); updateUiThrottled(); }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") { pressed.current.delete(k); standUp(); return; }
      if ("wasdqez".includes(k)) pressed.current.delete(k);
    };
    const safeStop = () => { pressed.current.clear(); spRef.current = { ...spRef.current, x:0, y:0, z:0 }; standUp(); updateUiThrottled(); };

    window.addEventListener("keydown", dn, { passive:false });
    window.addEventListener("keyup",   up, { passive:false });
    window.addEventListener("blur",    safeStop);
    document.addEventListener("visibilitychange", () => { if (document.hidden) safeStop(); });

    return () => {
      window.removeEventListener("keydown", dn as any);
      window.removeEventListener("keyup",   up as any);
      window.removeEventListener("blur",    safeStop as any);
      document.removeEventListener("visibilitychange", () => {});
    };
  }, []);

  // Heartbeat WS: latest-wins, sólo envía si cambia
  useEffect(() => {
    let prevStr = "";
    const period = Math.max(30, Math.min(1000, 1000 / hz)); // 20 Hz por defecto
    const id = setInterval(() => {
      const next = compute();
      // compara con lo último enviado
      const msgObj = { type:"motion_setpoint", ...next };
      const msgStr = JSON.stringify(msgObj);
      if (msgStr !== prevStr) {
        send(msgObj);
        prevStr = msgStr;
      }
      // guarda y actualiza UI con throttle
      spRef.current = next;
      updateUiThrottled();
    }, period);
    return () => clearInterval(id);
  }, [hz, send]);

  // Cambiar velocidad (1..5)
  const bumpSpeed = (d:number) => {
    const s = Math.max(1, Math.min(5, (spRef.current.speed ?? 2) + d));
    spRef.current = { ...spRef.current, speed: s };
    // manda inmediatamente el cambio de velocidad (aunque no haya teclas)
    const msg = { type:"motion_setpoint", ...spRef.current };
    send(msg);
    updateUiThrottled();
  };

  // API opcional por si quieres forzar envío
  const sendSP = (nextPartial: Partial<Setpoint>) => {
    const merged = { ...spRef.current, ...nextPartial };
    spRef.current = merged;
    send({ type:"motion_setpoint", ...merged });
    updateUiThrottled();
  };

  return { sp: uiSp, sendSP, bumpSpeed, standUp, crouch };
}
