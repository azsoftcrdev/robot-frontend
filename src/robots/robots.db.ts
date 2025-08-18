// src/robots/robots.db.ts
import Dexie from "dexie";
import type { Table } from "dexie";
import type { Robot } from "./robots.types";

class RobotsDB extends Dexie {
  robots!: Table<Robot, number>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super("robots-db");
    this.version(1).stores({
      robots: "++id, name, host, httpPort, updatedAt",
      meta: "key",
    });
  }
}

export const db = new RobotsDB();

// helpers
export async function getActiveRobotId(): Promise<number | null> {
  const rec = await db.meta.get("activeRobotId");
  return rec?.value ?? null;
}
export async function setActiveRobotId(id: number | null) {
  if (id == null) return db.meta.delete("activeRobotId");
  return db.meta.put({ key: "activeRobotId", value: id });
}
