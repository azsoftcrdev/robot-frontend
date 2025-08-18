// src/robots/RobotsContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db, getActiveRobotId, setActiveRobotId } from "./robots.db";
import type { Robot } from "./robots.types";

type Ctx = {
  robots: Robot[];
  active: Robot | null;
  loading: boolean;
  add(robot: Omit<Robot,"id"|"createdAt"|"updatedAt">): Promise<void>;
  update(id: number, patch: Partial<Robot>): Promise<void>;
  remove(id: number): Promise<void>;
  select(id: number | null): Promise<void>;
};

const RobotsCtx = createContext<Ctx | undefined>(undefined);

export function RobotsProvider({ children }: { children: React.ReactNode }) {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // load all + active
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [list, act] = await Promise.all([db.robots.toArray(), getActiveRobotId()]);
      if (!cancelled) {
        setRobots(list.sort((a,b)=> (b.updatedAt??0)-(a.updatedAt??0)));
        setActiveId(act);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const active = useMemo(
    () => robots.find(r => r.id === activeId) ?? null,
    [robots, activeId]
  );

  const add: Ctx["add"] = async (robot) => {
    const now = Date.now();
    const id = await db.robots.add({ ...robot, createdAt: now, updatedAt: now });
    setRobots(await db.robots.toArray());
    await select(id);
  };

  const update: Ctx["update"] = async (id, patch) => {
    await db.robots.update(id, { ...patch, updatedAt: Date.now() });
    setRobots(await db.robots.toArray());
  };

  const remove: Ctx["remove"] = async (id) => {
    await db.robots.delete(id);
    setRobots(await db.robots.toArray());
    if (activeId === id) await select(null);
  };

  const select: Ctx["select"] = async (id) => {
    setActiveId(id);
    await setActiveRobotId(id);
  };

  const value: Ctx = { robots, active, loading, add, update, remove, select };
  return <RobotsCtx.Provider value={value}>{children}</RobotsCtx.Provider>;
}

export function useRobots() {
  const ctx = useContext(RobotsCtx);
  if (!ctx) throw new Error("useRobots must be used within RobotsProvider");
  return ctx;
}
