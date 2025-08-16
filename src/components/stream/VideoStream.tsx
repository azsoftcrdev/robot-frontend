import React from 'react';

export interface VideoStreamProps {
  src: string;
  fallback?: string;
  width?: string | number;
  height?: string | number;
}

const VideoStream: React.FC<VideoStreamProps> = ({
  src,
  fallback,
}) => {
  return (
    
     <img
      src={src}
      alt="Video Stream"
      onError={(e) => {
        if (fallback) (e.target as HTMLImageElement).src = fallback;
      }}
      className="w-full h-auto object-contain rounded shadow"
     />

    );
};

export default VideoStream;
