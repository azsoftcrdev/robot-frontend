import React, { useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import { Outlet, Link, useLocation } from "react-router-dom";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import "./Layout.css";

type RouteKey = "/home" | "/robots" | "/stream" | "/ajustes";

const ROUTE_META: Record<RouteKey, { title: string; parent?: RouteKey }> = {
  "/home": { title: "Inicio" },
  "/robots": { title: "Robots", parent: "/home" },
  "/stream": { title: "Stream", parent: "/home" },
  "/ajustes": { title: "Ajustes", parent: "/home" },
};

const Layout: React.FC = () => {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);

  // Detectar ruta actual
  const path = ((): RouteKey | null => {
    const p = location.pathname as RouteKey;
    return ROUTE_META[p] ? p : null;
  })();

  // Construir migas por jerarquía
  const crumbs = ((): { label: React.ReactNode; to?: string }[] => {
    const items: { label: React.ReactNode; to?: string }[] = [];
    items.push({ label: <i className="bi bi-house-door-fill" />, to: "/home" });

    if (!path) return items;

    const chain: RouteKey[] = [];
    let cur: RouteKey | undefined = path;
    while (cur) {
      chain.unshift(cur);
      cur = ROUTE_META[cur]?.parent;
    }

    const startIndex = chain[0] === "/home" ? 1 : 0;

    chain.slice(startIndex).forEach((r, idx, arr) => {
      const isLast = idx === arr.length - 1;
      const title = ROUTE_META[r].title;
      if (isLast) {
        items.push({ label: title });
      } else {
        items.push({ label: title, to: r });
      }
    });

    return items;
  })();

  return (
    <div className="layout-container">
      {/* Sidebar fijo escritorio */}
      <div className="sidebar-container d-none d-md-block">
        <Sidebar />
      </div>

      {/* Sidebar móvil */}
      {showSidebar && (
        <>
          <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
          <div className="sidebar-mobile">
            <div className="sidebar-header-close">
              <button className="btn btn-light" onClick={() => setShowSidebar(false)}>
                <CloseOutlined />
              </button>
            </div>
            <Sidebar />
          </div>
        </>
      )}

      {/* Área principal */}
      <div className="main-area">
   
        <div className="main-header">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light d-md-none" onClick={() => setShowSidebar(true)}>
              <MenuOutlined />
            </button>
            <h5 className="mb-0 bold" style={{color: '#004ca5'}}>
              HexaMind UI
            </h5>
          </div>

          {/* Migas */}
          <nav aria-label="breadcrumb" className="mt-2 breadcrumb-wrapper">
            <ol className="breadcrumb mb-0">
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <li
                    key={`${i}-${String(c.to ?? "last")}`}
                    className={`breadcrumb-item ${isLast ? "active" : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {c.to && !isLast ? (
                      <Link to={c.to} className="breadcrumb-link">{c.label}</Link>
                    ) : (
                      <span className="breadcrumb-current">{c.label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Contenido */}
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;