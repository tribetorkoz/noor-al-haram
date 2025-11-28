import React, { useRef, useEffect, useState } from 'react';
import { AyahResponse } from '../types';
import { Play, Pause, SkipForward, SkipBack, Repeat, Eye, EyeOff, Loader2, Sparkles, X, BookOpen } from 'lucide-react';
import { getTafseer } from '../services/geminiService';

interface PlayerProps {
  ayahData: AyahResponse['data'] | null;
  isLoading: boolean;
  onNext: () => void;
  onPrev: () => void;
  onOpenSearch: () => void;
}

const Player: React.FC<PlayerProps> = ({ ayahData, isLoading, onNext, onPrev, onOpenSearch }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'ayah' | 'infinite'>('off');
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [tafseer, setTafseer] = useState<string | null>(null);
  const [loadingTafseer, setLoadingTafseer] = useState(false);

  // Auto-play effect
  useEffect(() => {
    if (audioRef.current && ayahData && !isLoading) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.log("Auto-play prevented or interrupted:", error);
            setIsPlaying(false);
          });
      }
    }
  }, [ayahData, isLoading]);

  // Clear tafseer on ayah change
  useEffect(() => {
    setTafseer(null);
  }, [ayahData]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'infinite' || repeatMode === 'ayah') {
      audioRef.current?.play();
      if(repeatMode === 'ayah') setRepeatMode('off');
    } else {
      onNext();
    }
  };

  const fetchTafseer = async () => {
    if (!ayahData) return;
    setLoadingTafseer(true);
    const text = await getTafseer(ayahData.surah.name, ayahData.numberInSurah, ayahData.text);
    setTafseer(text);
    setLoadingTafseer(false);
  };

  if (!ayahData) return null;

  return (
    <>
      {/* --- Main Content Area --- */}
      {/* 
         Structure:
         1. Top info (Surah Name)
         2. Visualizer
         3. Text Area (Flexible height, centered, scrollable if HUGE)
         4. Dock spacer
      */}
      <div className="flex-1 flex flex-col items-center w-full px-4 md:px-8 relative overflow-hidden">
        
        {/* Info Header */}
        <div className="flex flex-col items-center gap-1 mt-2 md:mt-6 mb-4 md:mb-8 opacity-60 hover:opacity-100 transition-opacity flex-none">
            <div className="flex items-center gap-2 text-amber-500/80 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold">
                <BookOpen className="w-3 h-3" />
                <span>{ayahData.surah.englishName}</span>
            </div>
            <div className="text-white/40 text-[9px] md:text-[10px] tracking-widest">
                JUZ {ayahData.juz} • AYAH {ayahData.numberInSurah}
            </div>
        </div>

        {/* Visualizer - Hidden on very small screens to save vertical space */}
        <div className={`hidden sm:flex items-center justify-center gap-1 h-6 md:h-8 mb-4 md:mb-8 transition-all duration-700 flex-none ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            {[...Array(8)].map((_, i) => (
                <div 
                    key={i} 
                    className="w-1 bg-gradient-to-t from-amber-600 to-amber-300 rounded-full"
                    style={{ 
                        animation: `equalizer ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                        height: isPlaying ? '100%' : '4px' 
                    }}
                ></div>
            ))}
        </div>

        {/* The Verse Container - The Genius Part */}
        {/* Calculates max height to ensure it doesn't overlap header or dock. 
            Allows scrolling for very long verses on mobile. */}
        <div className="flex-1 w-full max-w-4xl flex items-center justify-center min-h-0">
            <div className="w-full text-center max-h-[calc(100dvh-280px)] overflow-y-auto custom-scrollbar px-2 py-4">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-amber-500 animate-spin" />
                        <span className="text-amber-500/50 text-xs md:text-sm tracking-wider font-light">Loading Recitation...</span>
                    </div>
                ) : (
                    <div 
                    className={`transition-all duration-1000 transform ${
                        isBlindMode 
                        ? 'blur-xl hover:blur-none opacity-50 hover:opacity-100 cursor-help' 
                        : 'blur-0 opacity-100'
                    }`}
                    >
                        {/* 
                            Fixed typography:
                            1. Removed text-transparent bg-clip-text (causes blur on Arabic)
                            2. Increased line-height (leading-[2.5]) to prevent overlap
                            3. Added py-4 to ensure tall glyphs aren't cut off
                        */}
                        <h1 
                            className="font-quran text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[2.3] md:leading-[2.5] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] select-none py-4"
                            style={{ textWrap: 'balance' }}
                            dir="rtl"
                        >
                            {ayahData.text}
                            <span className="inline-flex items-center justify-center w-[0.8em] h-[0.8em] mx-1 md:mx-2 align-middle bg-[url('https://upload.wikimedia.org/wikipedia/commons/6/68/Aya-symbol.png')] bg-contain bg-no-repeat bg-center text-[0.35em] text-[#d4af37] font-sans font-bold translate-y-1 md:translate-y-2">
                            {ayahData.numberInSurah}
                            </span>
                        </h1>
                    </div>
                )}
            </div>
        </div>
        
        {/* Spacer for Dock Area */}
        <div className="h-32 flex-none w-full"></div>

      </div>

      {/* --- Floating Dock (Controls) --- */}
      {/* Lifted bottom-8/10 for better mobile touch area (home indicator) */}
      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[90%] md:max-w-lg">
        {/* Dock Container */}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 md:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex items-center justify-between gap-2 md:gap-6 transition-all duration-500 hover:bg-black/70 hover:border-white/20">
            
            {/* Left Tools */}
            <div className="flex items-center gap-0 md:gap-1">
                 <button 
                    onClick={() => setRepeatMode(prev => prev === 'off' ? 'infinite' : 'off')}
                    className={`p-3 rounded-full transition-all duration-300 ${repeatMode === 'infinite' ? 'bg-amber-500/20 text-amber-400 rotate-180' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                 >
                    <Repeat className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button 
                    onClick={() => setIsBlindMode(!isBlindMode)}
                    className={`p-3 rounded-full transition-all duration-300 ${isBlindMode ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                 >
                    {isBlindMode ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
            </div>

            {/* Main Playback Controls */}
            <div className="flex items-center gap-2 md:gap-3">
                <button onClick={onPrev} className="p-2 text-white/60 hover:text-amber-400 transition-colors active:scale-90">
                    <SkipBack className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-amber-400 to-amber-600 text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(245,158,11,0.4)] group"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                    ) : (
                        <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-1" />
                    )}
                </button>
                
                <button onClick={onNext} className="p-2 text-white/60 hover:text-amber-400 transition-colors active:scale-90">
                    <SkipForward className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                </button>
            </div>

            {/* Right Tools */}
            <div className="flex items-center gap-0 md:gap-1">
                 <button 
                    onClick={onOpenSearch}
                    className="p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                 >
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button 
                    onClick={fetchTafseer}
                    className={`p-3 rounded-full transition-all duration-300 ${tafseer ? 'bg-amber-500 text-black' : 'hover:bg-white/10 text-white/40 hover:text-white'}`}
                    disabled={loadingTafseer}
                 >
                    {loadingTafseer ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
            </div>
        </div>
      </div>

      {/* --- Tafseer Overlay --- */}
      {tafseer && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 relative shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4 flex-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white font-quran">التفسير والفوائد</h3>
                    </div>
                    <button 
                        onClick={() => setTafseer(null)}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
                
                <div className="prose prose-invert prose-lg max-w-none text-right font-light leading-loose text-white/90 overflow-y-auto custom-scrollbar pr-2 pl-4 flex-1">
                    {tafseer.split('\n').map((line, i) => (
                        <p key={i} className="mb-4 text-base md:text-lg">{line}</p>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Audio Element */}
      {!isLoading && (
        <audio
          ref={audioRef}
          key={ayahData.audio}
          src={ayahData.audio}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
             console.error("Audio error", e);
             setIsPlaying(false);
          }}
          className="hidden"
        />
      )}
    </>
  );
};

export default Player;