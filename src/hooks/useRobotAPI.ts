// src/hooks/useRobotAPI.ts
import { useRobots } from "../robots/RobotsContext";

export function useRobotAPI() {
  const { active } = useRobots();
  const base = active ? `${location.protocol}//${active.host}:${active.httpPort}` : null;

  const url = (p: string) => (base ? `${base}${p}` : "");
  const post = async (path: string, body?: unknown) => {
    if (!base) throw new Error("No hay robot activo");
    return fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  return { active, url, post };
}