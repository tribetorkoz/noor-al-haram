import React from 'react';
import { Reciter } from '../types';

interface ReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'default' | 'sidebar';
}

const ReciterCard: React.FC<ReciterCardProps> = ({ reciter, isSelected, onClick, variant = 'default' }) => {
  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        title={reciter.name}
        className={`relative flex-none group transition-all duration-300 w-12 h-12 rounded-full overflow-hidden border-2 ${
            isSelected 
            ? 'border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.3)] z-10' 
            : 'border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/20'
        }`}
      >
         <img src={reciter.image} alt={reciter.name} className="w-full h-full object-cover" />
         
         {isSelected && (
             <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay"></div>
         )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group transition-all duration-500 min-w-[65px] md:min-w-[85px]"
    >
      <div className="relative">
        {/* Animated Glow Ring */}
        <div className={`absolute -inset-[3px] rounded-full transition-all duration-500 ${
            isSelected 
            ? 'bg-gradient-to-tr from-amber-300 via-amber-500 to-amber-700 opacity-100 blur-[2px]' 
            : 'bg-white/5 opacity-0 group-hover:opacity-100'
        }`}></div>

        {/* The Avatar Container */}
        <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-500 z-10 ${
            isSelected ? 'border-amber-950' : 'border-white/10 bg-black/40'
        }`}>
            {/* Real Image with effects */}
            <img 
              src={reciter.image} 
              alt={reciter.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                  isSelected 
                  ? 'opacity-100 scale-110 filter-none' 
                  : 'opacity-70 grayscale scale-100 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'
              }`}
            />

            {/* Shine effect overlay */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-transparent mix-blend-overlay"></div>
            )}
        </div>
        
        {/* Status Dot */}
        {isSelected && (
             <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 z-20 w-4 h-4 md:w-5 md:h-5 bg-black rounded-full flex items-center justify-center">
                 <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]"></div>
             </div>
        )}
      </div>
      
      {/* Name Pill */}
      <span className={`text-[9px] md:text-xs font-medium tracking-wide transition-all duration-300 px-2 py-0.5 rounded-full whitespace-nowrap ${
        isSelected 
        ? 'text-amber-300 bg-amber-950/40 border border-amber-500/20' 
        : 'text-white/40 group-hover:text-white/70'
      }`}>
        {reciter.name.split(' ').slice(-1)[0]}
      </span>
    </button>
  );
};

export default ReciterCard;