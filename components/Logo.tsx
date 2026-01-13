
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-24 h-24',
    xl: 'w-48 h-48'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center transition-transform duration-500`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A3FFC" />
            <stop offset="100%" stopColor="#1A66FF" />
          </linearGradient>
        </defs>

        {/* Contenedor con borde blanco y degradado (Tal cual la imagen) */}
        <rect 
          x="5" 
          y="5" 
          width="90" 
          height="90" 
          rx="22" 
          fill="url(#logoGradient)" 
          stroke="white" 
          strokeWidth="5"
        />
        
        {/* Silueta del Cerebro (Blanco Puro) */}
        <path 
          d="M50 22C44 22 38 24 34 28C28 26 22 30 20 37C17 40 16 47 18 54C14 60 16 68 21 74C24 84 34 87 42 84C46 88 54 88 58 84C62 88 70 87 74 82C82 84 88 76 88 68C91 62 90 54 86 48C88 40 86 34 80 29C78 22 70 20 62 22C58 18 54 20 50 22Z" 
          fill="white" 
        />
        
        {/* Gráfica de Tendencia Azul Cobalto */}
        {/* Trayectoria: Inicio -> Nodo 1 -> Nodo 2 -> Nodo 3 -> Flecha */}
        <path 
          d="M26 66C30 68 34 64 38 60L52 48L62 54L80 32" 
          stroke="#1E3A8A" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Los 3 Nodos (Círculos) */}
        <circle cx="38" cy="60" r="4.5" fill="#1E3A8A" />
        <circle cx="52" cy="48" r="4.5" fill="#1E3A8A" />
        <circle cx="62" cy="54" r="4.5" fill="#1E3A8A" />
        
        {/* Punta de la flecha */}
        <path 
          d="M76 26L87 30L83 42L76 26Z" 
          fill="#1E3A8A" 
        />

        {/* Detalles internos del cerebro (Pliegues) */}
        <path d="M40 37C42 35 45 35 47 37" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M30 50C33 49 35 51 36 54" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <path d="M70 66C74 66 76 68 77 72" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    </div>
  );
};

export default Logo;
