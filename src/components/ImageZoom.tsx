import { useState, useRef, MouseEvent } from "react";
import { motion } from "framer-motion";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

const ImageZoom = ({ src, alt, className = "", zoomLevel = 2 }: ImageZoomProps) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const { left, top, width, height } = container.getBoundingClientRect();
    
    // Calculate mouse position relative to container (0 to 1)
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    // Clamp values between 0 and 1
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));
    
    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden cursor-zoom-in ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base image */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        draggable={false}
        style={{ 
          imageRendering: 'auto',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          backfaceVisibility: 'hidden'
        }}
      />
      
      {/* Zoomed image overlay using transform for better quality */}
      {isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
          style={{
            clipPath: 'inset(0)',
          }}
        >
          <img
            src={src}
            alt={alt}
            className="absolute w-full h-full object-cover"
            draggable={false}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${position.x * 100}% ${position.y * 100}%`,
              transition: 'transform 0.05s linear',
              imageRendering: 'auto',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
              filter: 'none',
            }}
          />
        </motion.div>
      )}
      
      {/* Subtle zoom lens indicator */}
      {isZoomed && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute border-2 border-primary/50 pointer-events-none z-60 rounded-full"
          style={{
            width: '60px',
            height: '60px',
            left: `${position.x * 100}%`,
            top: `${position.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(1px)',
          }}
        />
      )}
      
      {/* Zoom indicator text */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none font-medium">
        Hover to zoom
      </div>
    </div>
  );
};

export default ImageZoom;
