import React from 'react';
import { Reciter } from '../types';
import { User, Mic2 } from 'lucide-react';

interface ReciterCardProps {
  reciter: Reciter;
  isSelected: boolean;
  onClick: () => void;
}

const ReciterCard: React.FC<ReciterCardProps> = ({ reciter, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group transition-all duration-300 min-w-[60px] md:min-w-[80px]"
    >
      <div className={`relative p-[2px] rounded-full transition-all duration-500 ${
        isSelected 
          ? 'bg-gradient-to-tr from-amber-300 via-amber-500 to-amber-600 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
          : 'bg-white/10 group-hover:bg-white/30'
      }`}>
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
            {/* Simple gradient avatar placeholder */}
            <div className={`absolute inset-0 bg-gradient-to-br ${isSelected ? 'from-amber-900/50 to-slate-900' : 'from-slate-800 to-slate-950'}`}></div>
            <User className={`w-5 h-5 md:w-7 md:h-7 z-10 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
            
            {isSelected && (
                <div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div>
            )}
        </div>
        
        {/* Active Indicator Dot */}
        {isSelected && (
             <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-amber-500 border-2 border-black rounded-full flex items-center justify-center">
                <Mic2 className="w-1.5 h-1.5 md:w-2 md:h-2 text-black" />
             </div>
        )}
      </div>
      
      <span className={`text-[9px] md:text-[11px] font-medium tracking-wide transition-colors ${
        isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
      }`}>
        {reciter.name.split(' ').slice(-1)[0]}
      </span>
    </button>
  );
};

export default ReciterCard;