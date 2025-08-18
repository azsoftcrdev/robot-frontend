// src/pages/RobotsPage.tsx
import React, { useState } from "react";
import { useRobots } from "../robots/RobotsContext";
import "../styles/Robots.css"; // Importa el archivo CSS

const RobotsPage: React.FC = () => {
  const { robots, active, loading, add, remove, select, update } = useRobots();
  const [form, setForm] = useState({ name: "Robot 1", host: "localhost", httpPort: 8000, wsPath: "/ws" });

  if (loading) return <div className="loading-message">Cargando…</div>;

  return (
    <div className="robots-container">
      <h1 className="robots-title">Robots</h1>

      {/* Form Add */}
      <div className="form-add">
        <div className="form-grid">
          <input className="form-input shadow-custom" placeholder="Nombre"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="form-input shadow-custom" placeholder="Host/IP"
            value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} />
          <input className="form-input shadow-custom" type="number" placeholder="HTTP Port"
            value={form.httpPort} onChange={e => setForm({ ...form, httpPort: Number(e.target.value) })} />
          <input className="form-input shadow-custom" placeholder="WS Path" value={form.wsPath}
            onChange={e => setForm({ ...form, wsPath: e.target.value })} />
        </div>
        <button className="add-button shadow-custom"
          onClick={() => add(form)}>Agregar</button>
      </div>

      {/* List */}
      <div className="robots-list-container">
        {robots.map(r => (
          <div key={r.id} className={`robot-item ${active?.id === r.id ? "robot-item-active" : ""}`}>
            <div className="robot-info">
              <div className="robot-name">{r.name} {active?.id === r.id && <span className="active-status">(Activo)</span>}</div>
              <div className="robot-details">{r.host}:{r.httpPort} · WS: {r.wsPath ?? "/ws"}</div>
            </div>
            <div className="robot-actions">
              <button className="action-button select-button shadow-custom" onClick={() => select(r.id!)}>Seleccionar</button>
              <button className="action-button update-button shadow-custom" onClick={() => update(r.id!, { name: prompt("Nuevo nombre", r.name) || r.name })}>Renombrar</button>
              <button className="action-button remove-button shadow-custom" onClick={() => remove(r.id!)}>Eliminar</button>
            </div>
          </div>
        ))}
        {robots.length === 0 && <div className="no-robots-message">No hay robots. Agrega uno arriba.</div>}
      </div>
    </div>
  );
};

export default RobotsPage;