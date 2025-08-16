import React, { useState, useEffect } from "react";
import { Menu, Button } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { FiLogOut } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

type MenuItem = Required<MenuProps>["items"][number];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const handleLogout = () => {
    // Acción mínima: recarga
    window.location.reload();
  };

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(false); // nunca colapsado en móvil
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const items: MenuItem[] = [
    {
      key: "robots",
      icon: <RobotOutlined />,
      label: "Robots",
      onClick: () => navigate("/robots"),
    },
    {
      key: "stream",
      icon: <VideoCameraOutlined />,
      label: "Stream",
      onClick: () => navigate("/stream"),
    },
    {
      key: "ajustes",
      icon: <SettingOutlined />,
      label: "Ajustes",
      onClick: () => navigate("/ajustes"),
    },
    {
      key: "logout",
      icon: <FiLogOut />,
      label: "Cerrar sesión",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Botón de colapsar solo en escritorio */}
      {!isMobile && (
        <div className="p-2 text-end">
          <Button type="text" onClick={toggleCollapsed}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </Button>
        </div>
      )}

      {/* Logo */}
    <div className="text-center p-2 flex-shrink-0">
        <img
            src="/Logo-hexamind.png"
            alt="Logo"
            className="mx-auto"
            style={{ maxWidth: 100, objectFit: "contain" }}
        />
    </div>
      {/* Menú principal */}
      <Menu
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        items={items}
        selectedKeys={[location.pathname.replace("/", "")]}
        className="flex-grow"
        style={{ width: collapsed && !isMobile ? 120 : 200 }}
      />
    </div>
  );
};

export default Sidebar;
