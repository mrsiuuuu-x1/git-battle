import React from "react";

const imageStyle: React.CSSProperties = {
  imageRendering: "pixelated",
  filter: "drop-shadow(2px 2px 0px rgba(0,0,0,0.5))"
};

export function PixelSword({ className }: { className?: string }) {
  return (
    <img 
      src="/pixel-sword.png" 
      alt="Sword" 
      className={className} 
      style={imageStyle}
    />
  );
}

export function PixelShield({ className }: { className?: string }) {
  return (
    <img 
      src="/pixel-shield.png" 
      alt="Shield" 
      className={className}
      style={imageStyle} 
    />
  );
}

export function PixelCrossedSwords({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src="/pixel-sword.png" 
        alt="Crossed Sword" 
        className="absolute w-full h-full"
        style={imageStyle} 
      />
      <img 
        src="/pixel-sword.png" 
        alt="Crossed Sword" 
        className="absolute w-full h-full"
        style={{ 
          ...imageStyle, 
          transform: "scaleX(-1)" 
        }} 
      />
    </div>
  );
}