// src/robots/robots.types.ts
export type Robot = {
  id?: number;
  name: string;
  host: string;     // ej: "192.168.1.50" o "localhost"
  httpPort: number; // ej: 8000
  wsPath?: string;  // ej: "/ws"
  createdAt?: number;
  updatedAt?: number;
};
