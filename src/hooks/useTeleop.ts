// src/hooks/useTeleop.ts
import { useEffect, useRef, useState } from "react";
import { useRobotWS } from "./useRobotWS";
import { useRobots } from "../robots/RobotsContext";

export type Setpoint = { x:number; y:number; z:number; speed:number };
export type PoseState = { h:number; cur_h?:number };

function scaleV(speed:number) {
  // Escala simple: 1..5 -> 6,12,18,24,30 (clamp 30)
  const v = 6 + (Math.max(1, Math.min(5, speed)) - 1) * 6;
  return Math.min(30, v);
}

export function useTeleop(hz = 20) {
  const { active } = useRobots();
  const { send } = useRobotWS();               // ws://<host>:<port>/ws/
  const pressed = useRef<Set<string>>(new Set());
  const spRef   = useRef<Setpoint>({ x:0, y:0, z:0, speed:2 });
  const poseRef = useRef<PoseState>({ h: 0 });

  // Estado visible para UI (throttled)
  const [uiSp, setUiSp]     = useState<Setpoint>(spRef.current);
  const [uiPose, setUiPose] = useState<PoseState>(poseRef.current);

  // ---- Helpers de envío WS ----
  const sendMotion = (next: Setpoint) => send({ type:"motion_setpoint", ...next });
  const sendPoseSet = (h:number)      => send({ type:"pose_setpoint",  h });
  const sendPoseNudge = (dh:number)   => send({ type:"pose_nudge",     dh });

  // Altura presets (reemplazan fetch HTTP)
  const standUp = (h:number = +20) => { poseRef.current = { ...poseRef.current, h }; sendPoseSet(h); };
  const crouch  = (h:number = -20) => { poseRef.current = { ...poseRef.current, h }; sendPoseSet(h); };

  // Actualiza UI con throttle para evitar renders excesivos
  const updateUiThrottled = (() => {
    let last = 0;
    const minDt = 0.2; // 200 ms
    return () => {
      const now = performance.now() / 1000;
      if (now - last >= minDt) {
        last = now;
        setUiSp(spRef.current);
        setUiPose(poseRef.current);
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
      // Altura por teclado:
      if (k === " ") { e.preventDefault(); standUp(); updateUiThrottled(); return; } // Space: stand
      if (k === "shift") { pressed.current.add(k); crouch(); updateUiThrottled(); return; } // Shift: crouch

      if ("wasdqez".includes(k)) pressed.current.add(k);

      // Emergencia
      if (k === "escape") {
        pressed.current.clear();
        spRef.current = { ...spRef.current, x:0, y:0, z:0 };
        standUp();
        updateUiThrottled();
      }

      // Altura incremental con flechas ↑/↓ (opcional)
      if (k === "arrowup")   { sendPoseNudge(+1); poseRef.current = { ...poseRef.current, h: Math.min(30, (poseRef.current.h ?? 0) + 1) }; updateUiThrottled(); }
      if (k === "arrowdown") { sendPoseNudge(-1); poseRef.current = { ...poseRef.current, h: Math.max(-30,(poseRef.current.h ?? 0) - 1) }; updateUiThrottled(); }
    };

    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "shift") { pressed.current.delete(k); standUp(); updateUiThrottled(); return; }
      if ("wasdqez".includes(k)) pressed.current.delete(k);
    };

    const safeStop = () => {
      pressed.current.clear();
      spRef.current = { ...spRef.current, x:0, y:0, z:0 };
      standUp();
      updateUiThrottled();
    };

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
      const msgObj = { type:"motion_setpoint", ...next };
      const msgStr = JSON.stringify(msgObj);
      if (msgStr !== prevStr) {
        send(msgObj);
        prevStr = msgStr;
      }
      spRef.current = next;
      updateUiThrottled();
    }, period);
    return () => clearInterval(id);
  }, [hz, send]);

  // Cambiar velocidad (1..5)
  const bumpSpeed = (d:number) => {
    const s = Math.max(1, Math.min(5, (spRef.current.speed ?? 2) + d));
    spRef.current = { ...spRef.current, speed: s };
    // manda inmediatamente el cambio
    sendMotion(spRef.current);
    updateUiThrottled();
  };

  // Forzar envío parcial
  const sendSP = (nextPartial: Partial<Setpoint>) => {
    const merged = { ...spRef.current, ...nextPartial };
    spRef.current = merged;
    sendMotion(merged);
    updateUiThrottled();
  };

  // Nudge de altura (+/- 1 por tick); útil para rueda del ratón o slider fino
  const nudgeHeight = (dh:number) => {
    sendPoseNudge(dh);
    poseRef.current = { ...poseRef.current, h: Math.max(-30, Math.min(30, (poseRef.current.h ?? 0) + dh)) };
    updateUiThrottled();
  };

  // Set directo de altura (slider grande)
  const setHeight = (h:number) => {
    const hh = Math.max(-30, Math.min(30, h));
    poseRef.current = { ...poseRef.current, h: hh };
    sendPoseSet(hh);
    updateUiThrottled();
  };

  // (Opcional) handler para rueda del mouse en un canvas/área:
  // úsalo en el componente: onWheel={(e)=>{ e.preventDefault(); nudgeHeight(e.deltaY>0?-1:+1); }}
  const onWheelHeight = (e: WheelEvent) => {
    e.preventDefault();
    nudgeHeight(e.deltaY > 0 ? -1 : +1);
  };

  return {
    sp: uiSp,
    pose: uiPose,
    sendSP,
    bumpSpeed,
    // Altura
    setHeight,
    nudgeHeight,
    standUp,
    crouch,
    onWheelHeight,
  };
}
