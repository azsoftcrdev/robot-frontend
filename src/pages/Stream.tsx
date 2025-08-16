import React, { useState } from 'react';
import VideoStream from '../components/stream/VideoStream';

const StreamPage: React.FC = () => {
  const [modoFacial, setModoFacial] = useState(false);

  const toggleModo = () => setModoFacial(prev => !prev);

  const streamUrl = `http://localhost:8000/stream.mjpg?mode=${modoFacial ? 'face' : 'color'}`;
  const snapshotUrl = `http://localhost:8000/snapshot.jpg?mode=${modoFacial ? 'face' : 'color'}`;

  return (
    <div className="">
      <div className="w-full max-w-screen-xl">
        <VideoStream
          src={streamUrl}
          fallback={snapshotUrl}
          width="100%"
          height="auto"
        />
      </div>

      <button
        onClick={toggleModo}
        className="mt-6 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        {modoFacial ? 'Cambiar a detección de colores' : 'Cambiar a reconocimiento facial'}
      </button>
    </div>
  );
};

export default StreamPage;
