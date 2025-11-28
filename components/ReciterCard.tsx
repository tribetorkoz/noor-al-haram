import React from 'react';
import { Reciter } from '../types';
import { User } from 'lucide-react';

interface ReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  onClick: () => void;
}

const ReciterCard: React.FC<ReciterCardProps> = ({ reciter, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group transition-all duration-500 min-w-[65px] md:min-w-[75px]"
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
            isSelected ? 'border-amber-950 bg-amber-950' : 'border-white/10 bg-black/40'
        }`}>
            {/* Inner background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
                isSelected ? 'from-amber-900/40 to-black' : 'from-slate-800/50 to-black'
            }`}></div>
            
            {/* Icon */}
            <User className={`w-5 h-5 md:w-6 md:h-6 z-10 transition-all duration-500 ${
                isSelected ? 'text-amber-200 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-white/40 group-hover:text-white/80'
            }`} />

            {/* Shine effect */}
            {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-500/10 to-transparent animate-pulse"></div>
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
      <span className={`text-[9px] md:text-xs font-medium tracking-wide transition-all duration-300 px-2 py-0.5 rounded-full ${
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