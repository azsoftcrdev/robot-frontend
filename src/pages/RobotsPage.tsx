// src/pages/RobotsPage.tsx
import React, { useState } from "react";
import { useRobots } from "../robots/RobotsContext";

const RobotsPage: React.FC = () => {
  const { robots, active, loading, add, remove, select, update } = useRobots();
  const [form, setForm] = useState({ name:"Robot 1", host:"localhost", httpPort:8000, wsPath:"/ws" });

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Robots</h1>

      {/* Form Add */}
      <div className="border rounded p-3 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input className="border p-2 rounded" placeholder="Nombre"
            value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <input className="border p-2 rounded" placeholder="Host/IP"
            value={form.host} onChange={e=>setForm({...form, host:e.target.value})}/>
          <input className="border p-2 rounded" type="number" placeholder="HTTP Port"
            value={form.httpPort} onChange={e=>setForm({...form, httpPort: Number(e.target.value)})}/>
          <input className="border p-2 rounded" placeholder="WS Path" value={form.wsPath}
            onChange={e=>setForm({...form, wsPath:e.target.value})}/>
        </div>
        <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={()=>add(form)}>Agregar</button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {robots.map(r => (
          <div key={r.id} className={`flex items-center justify-between border rounded p-3 ${active?.id===r.id ? "bg-blue-50" : ""}`}>
            <div className="text-sm">
              <div className="font-semibold">{r.name} {active?.id===r.id && <span className="ml-2 text-blue-600">(Activo)</span>}</div>
              <div className="opacity-70">{r.host}:{r.httpPort} · WS: {r.wsPath ?? "/ws"}</div>
            </div>
            <div className="space-x-2">
              <button className="px-3 py-1 border rounded" onClick={()=>select(r.id!)}>Seleccionar</button>
              <button className="px-3 py-1 border rounded" onClick={()=>update(r.id!, { name: prompt("Nuevo nombre", r.name) || r.name })}>Renombrar</button>
              <button className="px-3 py-1 border rounded text-red-600" onClick={()=>remove(r.id!)}>Eliminar</button>
            </div>
          </div>
        ))}
        {robots.length===0 && <div className="text-sm opacity-70">No hay robots. Agrega uno arriba.</div>}
      </div>
    </div>
  );
};

export default RobotsPage;
