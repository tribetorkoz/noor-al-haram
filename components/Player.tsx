import React, { useRef, useEffect, useState } from 'react';
import { AyahResponse } from '../types';
import { Play, Pause, SkipForward, SkipBack, Repeat, Eye, EyeOff, Loader2, Sparkles, X, BookOpen, Infinity as InfinityIcon, Volume2 } from 'lucide-react';
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
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'ayah' | 'infinite' | number>('off');
  const [repeatCount, setRepeatCount] = useState(0); 
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [tafseer, setTafseer] = useState<string | null>(null);
  const [loadingTafseer, setLoadingTafseer] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowLeft') {
            onNext();
        } else if (e.code === 'ArrowRight') {
            onPrev();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onNext, onPrev]);

  // Auto-scroll logic (scroll to top on new ayah)
  useEffect(() => {
    if (textContainerRef.current) {
        textContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ayahData?.numberInSurah]);

  // Auto-play
  useEffect(() => {
    if (audioRef.current && ayahData && !isLoading) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.log("Auto-play prevented:", error);
            setIsPlaying(false);
          });
      }
    }
  }, [ayahData, isLoading]);

  useEffect(() => {
    setTafseer(null);
    setRepeatCount(0); 
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

  const handleRepeatToggle = () => {
      if (repeatMode === 'off') setRepeatMode(3);
      else if (repeatMode === 3) setRepeatMode('infinite');
      else setRepeatMode('off');
  };

  const handleEnded = () => {
    if (repeatMode === 'infinite') {
      audioRef.current?.play();
      setRepeatCount(prev => prev + 1);
      return;
    }
    if (typeof repeatMode === 'number') {
        if (repeatCount < repeatMode - 1) {
            audioRef.current?.play();
            setRepeatCount(prev => prev + 1);
        } else {
            setRepeatMode('off');
            setRepeatCount(0);
            onNext();
        }
        return;
    }
    onNext();
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
      <div className="h-full w-full flex flex-col relative z-10">
        
        {/* --- Header Badge --- */}
        <div className="flex-none pt-2 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700 z-20">
            <div className="glass-panel px-4 py-1.5 rounded-full flex items-center gap-2 text-amber-100/80 hover:text-amber-100 hover:bg-white/5 transition-all cursor-pointer group" onClick={onOpenSearch}>
                <span className="text-[10px] tracking-widest uppercase font-bold opacity-70 group-hover:opacity-100">{ayahData.surah.englishName}</span>
                <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                <span className="font-quran text-sm group-hover:scale-105 transition-transform">{ayahData.surah.name}</span>
            </div>
        </div>

        {/* --- The Stage (Text Area) --- */}
        {/* We use flex-grow to take up all space, but the internal div is the scroll container */}
        <div className="flex-1 w-full relative min-h-0">
            {/* Ambient Light behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none mix-blend-screen"></div>

            {/* Scroll Container */}
            <div 
                ref={textContainerRef}
                className="w-full h-full overflow-y-auto custom-scrollbar px-6 md:px-12 flex flex-col"
            >
                {/* 
                   Content Wrapper:
                   min-h-full: Ensures that if content is short, flex-center works (centering vertically).
                   py-32: Adds enough padding top/bottom so text doesn't hit edges or get hidden by dock/header when scrolling.
                   justify-center: Centers text vertically if it's smaller than the container.
                */}
                <div className="flex-grow min-h-full flex flex-col items-center justify-center py-32 md:py-24">
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center gap-6 opacity-60">
                             <div className="relative">
                                <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                                <Loader2 className="w-10 h-10 text-amber-400 animate-spin relative z-10" />
                             </div>
                            <span className="text-amber-200/50 text-xs tracking-[0.3em] font-light animate-pulse">LOADING</span>
                        </div>
                    ) : (
                        <div className={`relative w-full max-w-4xl transition-all duration-1000 ease-out transform ${isLoading ? 'translate-y-8 opacity-0 blur-sm' : 'translate-y-0 opacity-100 blur-0'}`}>
                            
                            {/* Hifz Status Floating Pill */}
                            {repeatMode !== 'off' && (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 glass-panel rounded-full text-[10px] font-medium text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.1)] animate-in zoom-in duration-300">
                                    <Repeat className="w-3 h-3 text-amber-500" />
                                    <span>
                                        {repeatMode === 'infinite' ? 'Looping' : `${repeatCount + 1} / ${repeatMode}`}
                                    </span>
                                </div>
                            )}

                            <div 
                                className={`transition-all duration-700 ${
                                    isBlindMode 
                                    ? 'blur-xl hover:blur-none opacity-30 hover:opacity-100 cursor-help select-none grayscale hover:grayscale-0' 
                                    : 'blur-0 opacity-100 text-glow'
                                }`}
                            >
                                <h1 
                                    className="font-quran text-center text-[2.2rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.5rem] leading-[1.9] sm:leading-[2.2] md:leading-[2.4] lg:leading-[2.5] font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/95 drop-shadow-2xl py-2"
                                    style={{ 
                                        textWrap: 'balance',
                                    }}
                                    dir="rtl"
                                >
                                    {ayahData.text}
                                    {/* Elegant Verse End Symbol */}
                                    <span className="inline-flex items-center justify-center w-[0.8em] h-[0.8em] mx-3 align-middle relative text-amber-500/80 select-none group cursor-default">
                                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 fill-current opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
                                             <path d="M50 0 L62 12 L85 12 L85 35 L100 50 L85 65 L85 88 L62 88 L50 100 L38 88 L15 88 L15 65 L0 50 L15 35 L15 12 L38 12 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                                        </svg>
                                        <span className="relative z-10 text-[0.35em] font-sans font-bold pt-1 text-amber-100">{ayahData.numberInSurah}</span>
                                    </span>
                                </h1>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* --- The Crystal Dock --- */}
      <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        {/* The Dock Itself */}
        <div className="pointer-events-auto glass-panel rounded-[2rem] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-1 md:gap-4 relative overflow-hidden ring-1 ring-white/10 group hover:ring-white/20 transition-all duration-500">
            
            {/* Visualizer Background Effect inside Dock */}
            {isPlaying && (
                 <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-end justify-center gap-0.5 px-8">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-1.5 bg-gradient-to-t from-amber-500 to-transparent rounded-t-full" style={{ height: `${20 + Math.random() * 80}%`, animation: `pulse 0.5s infinite ${i * 0.05}s alternate` }}></div>
                    ))}
                </div>
            )}

            {/* Left Controls: Learning Tools */}
            <div className="flex items-center gap-0.5 md:gap-1 z-10">
                 <button 
                    onClick={handleRepeatToggle}
                    className={`relative w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${repeatMode !== 'off' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                 >
                    {repeatMode === 'infinite' ? <InfinityIcon className="w-4 h-4 md:w-5 md:h-5" /> : <Repeat className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
                 <button 
                    onClick={() => setIsBlindMode(!isBlindMode)}
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${isBlindMode ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/50' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                 >
                    {isBlindMode ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
            </div>

            {/* Vertical Separator */}
            <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 z-10"></div>

            {/* Center Controls: Playback */}
            <div className="flex items-center gap-2 md:gap-3 z-10">
                <button onClick={onPrev} className="p-2 md:p-3 text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95">
                    <SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                </button>
                
                <button 
                    onClick={togglePlay}
                    className="w-14 h-14 md:w-16 md:h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(251,191,36,0.3)] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-100 via-white to-white opacity-90"></div>
                    {isLoading ? (
                        <Loader2 className="w-6 h-6 md:w-7 md:h-7 animate-spin relative z-10 text-black" />
                    ) : isPlaying ? (
                        <Pause className="w-6 h-6 md:w-7 md:h-7 fill-black relative z-10" />
                    ) : (
                        <Play className="w-6 h-6 md:w-7 md:h-7 fill-black relative z-10 ml-1" />
                    )}
                </button>
                
                <button onClick={onNext} className="p-2 md:p-3 text-white/50 hover:text-white transition-colors hover:scale-110 active:scale-95">
                    <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                </button>
            </div>

            {/* Vertical Separator */}
            <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 z-10"></div>

            {/* Right Controls: Context */}
            <div className="flex items-center gap-0.5 md:gap-1 z-10">
                 <button 
                    onClick={onOpenSearch}
                    className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all duration-300"
                 >
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button 
                    onClick={fetchTafseer}
                    className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${tafseer ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    disabled={loadingTafseer}
                 >
                    {loadingTafseer ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
            </div>
        </div>
      </div>

      {/* --- Tafseer Overlay (Slide Up Sheet) --- */}
      {tafseer && (
        <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300"
            onClick={() => setTafseer(null)}
        >
            <div 
                className="w-full md:max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-t-[2rem] md:rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* Glow Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white font-quran">التفسير الميسر</h3>
                            <p className="text-[10px] text-emerald-400/60 uppercase tracking-widest">AI Powered</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setTafseer(null)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pl-4 relative z-10">
                     <div className="prose prose-invert prose-lg max-w-none text-right font-light leading-loose text-gray-200">
                        {tafseer.split('\n').map((line, i) => (
                            <p key={i} className="mb-4 text-lg md:text-xl border-r-2 border-emerald-500/20 pr-4">{line}</p>
                        ))}
                     </div>
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