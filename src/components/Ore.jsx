import React from 'react';

export default function Ore({ ore }) {
  const hpPercent = ((ore.currentHp ?? ore.oreData.hp) / ore.oreData.hp) * 100;

  return (
    <div 
      id={`ore-${ore.id}`}
      className="moving-ore"
      style={{ 
        left: `${ore.x}%`, 
        top: `${ore.y}%`, 
        width: `${ore.size}px`, 
        height: `${ore.size}px` 
      }}
    >
      {/* SVG 광물 디자인 */}
      <svg viewBox="0 0 100 100" className="ore-svg">
        <defs>
          <filter id={`noise-${ore.id}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feDiffuseLighting in="noise" lightingColor={ore.oreData.color} surfaceScale="2">
              <feDistantLight azimuth="45" elevation="60" />
            </feDiffuseLighting>
          </filter>
        </defs>
        <path 
          d="M20,50 Q10,20 50,10 Q90,20 80,50 Q90,80 50,90 Q10,80 20,50" 
          fill={ore.oreData.color} 
          filter={`url(#noise-${ore.id})`}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
        />
      </svg>

      {/* HP 바 */}
      <div className="ore-hp-bar">
        <div className="hp-fill" style={{ width: `${hpPercent}%` }}></div>
      </div>
    </div>
  );
}