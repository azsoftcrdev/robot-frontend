import React, { useEffect, useMemo, useState } from "react";
import { useTeleop } from "../hooks/useTeleop";
import { useRobots } from "../robots/RobotsContext";
import "../styles/Stream.css";

const StreamPage: React.FC = () => {
  const { active } = useRobots(); // <-- era activeRobot
  const baseUrl = useMemo(
    () => (active ? `http://${active.host}:${active.httpPort}` : ""),
    [active]
  );

  const [modoActual, setModoActual] = useState<"color"|"face"|"none">("color");
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const snapshotUrl =
    modoActual === "none"
      ? `${baseUrl}/snapshot.jpg`
      : `${baseUrl}/snapshot.jpg?mode=${modoActual}`;

  useEffect(() => {
    if (!baseUrl) return;
    setIsLoading(true);
    const u =
      modoActual === "none"
        ? `${baseUrl}/stream.mjpg`
        : `${baseUrl}/stream.mjpg?mode=${modoActual}`;
    setCurrentImageUrl(u);
  }, [modoActual, baseUrl]);

  const handleTabChange = (mode: "color"|"face"|"none") => {
    if (modoActual !== mode) setModoActual(mode);
  };
  const handleImageLoad  = () => setIsLoading(false);
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Error stream; fallback snapshot");
    setIsLoading(false);
    (e.target as HTMLImageElement).src = snapshotUrl;
  };

  // teleop (si tu hook acepta baseUrl o wsUrl como segundo arg, pásalo aquí)
  const { sp, bumpSpeed } = useTeleop(10);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      <div className="w-full max-w-2xl text-center mb-8">
        <h1 className="text-3xl font-bold mb-4" style={{color:"#004ca5"}}>Control de Cámara</h1>

        <div className="flex justify-center gap-4">
          <button onClick={()=>handleTabChange("color")}
            className={`px-5 py-2 rounded-md font-semibold text-base transition-all duration-300 border
              ${modoActual==="color" ? "boton-tab-enabled" : "boton-tab-disabled"}`}>Detección de colores</button>

          <button onClick={()=>handleTabChange("face")}
            className={`px-5 py-2 rounded-md font-semibold text-base transition-all duration-300 border
              ${modoActual==="face" ? "boton-tab-enabled" : "boton-tab-disabled"}`}>Reconocimiento facial</button>

          <button onClick={()=>handleTabChange("none")}
            className={`px-5 py-2 rounded-md font-semibold text-base transition-all duration-300 border
              ${modoActual==="none" ? "boton-tab-enabled" : "boton-tab-disabled"}`}>Cámara (sin modo)</button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          WASD mover, Q/E girar, Espacio = de pie, Shift = agachado · Vel: {sp.speed}
          <button className="ml-2 px-2 py-1 border rounded" onClick={()=>bumpSpeed(-1)}>-</button>
          <button className="ml-1 px-2 py-1 border rounded" onClick={()=>bumpSpeed(+1)}>+</button>
        </div>
      </div>

      <div className="relative p-4 w-full max-w-2xl min-h-[360px]">
        {isLoading && (
          <div className="d-flex justify-content-center align-items-center min-h-[360px">
            <div className="spiner-carga spinner-border text-primary" style={{ width:"3rem", height:"3rem" }} role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}
        {baseUrl ? (
          <img
            src={currentImageUrl}
            alt="Video Stream"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`rounded mx-auto d-block transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          />
        ) : (
          <p className="text-red-600 font-semibold">No hay robot activo seleccionado</p>
        )}
      </div>
    </div>
  );
};

export default StreamPage;
