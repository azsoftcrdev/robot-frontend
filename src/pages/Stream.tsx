import React, { useState } from 'react';

const StreamPage: React.FC = () => {
  const [modoActual, setModoActual] = useState<'color' | 'face'>('color');

  const streamUrl = `http://localhost:8000/stream.mjpg?mode=${modoActual}`;
  const snapshotUrl = `http://localhost:8000/snapshot.jpg?mode=${modoActual}`;

  const handleTabChange = (mode: 'color' | 'face') => {
    setModoActual(mode);
  };

  return (
    // Contenedor principal para centrar el contenido y aplicar un espaciado consistente.
    <div className="flex flex-col items-center p-6 bg-gray-50 min-h-screen">
      
      {/* Contenedor del título y tabs */}
      <div className="w-full max-w-2xl text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Control de Cámara</h1>
        
        {/* Pestañas de navegación con un diseño más moderno */}
        <div className="flex justify-center rounded-lg p-1">
          {/* Botón de Detección de Colores */}
          <button
            onClick={() => handleTabChange('color')}
            className={`
              flex-1 px-6 py-2 rounded-md font-semibold text-base transition-all duration-300
              ${modoActual === 'color'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            Detección de colores
          </button>
          
          <button
            onClick={() => handleTabChange('face')}
            className={`
              flex-1 px-6 py-2 rounded-md font-semibold text-base transition-all duration-300
              ${modoActual === 'face'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            Reconocimiento facial
          </button>
        </div>
      </div>


    

      <div className='img-centrada'>
        <img
        src={streamUrl}
        alt="Video Stream"
        onError={(e) => {
          if (snapshotUrl) (e.target as HTMLImageElement).src = snapshotUrl;
        }}
        className="rounded mx-auto d-block"
      />
      </div>

    </div>
  );
};

export default StreamPage;