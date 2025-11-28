import React, { useRef, useEffect, useState } from 'react';
import { AyahResponse, Ayah } from '../types';
import { Play, Pause, SkipForward, SkipBack, Repeat, Eye, EyeOff, Loader2, Sparkles, X, Mic, RotateCcw, BookOpenText } from 'lucide-react';
import { getTafseer } from '../services/geminiService';
import { fetchFullSurah } from '../services/quranService';

interface PlayerProps {
  ayahData: AyahResponse['data'] | null;
  isLoading: boolean;
  onNext: () => void;
  onPrev: () => void;
  onOpenSearch: () => void;
}

type ViewMode = 'read' | 'blur' | 'hidden';

const Player: React.FC<PlayerProps> = ({ ayahData, isLoading, onNext, onPrev, onOpenSearch }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Hifz Engine State
  const [repeatCount, setRepeatCount] = useState<number>(3); 
  const [currentRepeat, setCurrentRepeat] = useState(0); 
  const [isLooping, setIsLooping] = useState(false);
  const [echoMode, setEchoMode] = useState(false); // Talqeen Mode
  const [viewMode, setViewMode] = useState<ViewMode>('read');
  
  // Echo/Talqeen Logic
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [userTurnProgress, setUserTurnProgress] = useState(0);

  // Aux Features
  const [tafseer, setTafseer] = useState<string | null>(null);
  const [loadingTafseer, setLoadingTafseer] = useState(false);
  const [showFullSurah, setShowFullSurah] = useState(false);
  const [fullSurahAyahs, setFullSurahAyahs] = useState<Ayah[]>([]);
  const [loadingFullSurah, setLoadingFullSurah] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
        } else if (e.code === 'ArrowLeft') onNext();
        else if (e.code === 'ArrowRight') onPrev();
        else if (e.code === 'KeyR') handleMistake(); // R for Reset/Retry
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onNext, onPrev]);

  // Reset state on new Ayah
  useEffect(() => {
    if (audioRef.current && ayahData && !isLoading) {
      setCurrentRepeat(0);
      setIsUserTurn(false);
      setUserTurnProgress(0);
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.log("Autoplay blocked", e));
      }
    }
    // Auto scroll to center text
    if (textContainerRef.current) {
        textContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ayahData, isLoading]);

  // Echo Timer
  useEffect(() => {
    let interval: number;
    if (isUserTurn && echoMode && audioRef.current) {
        // Give user slightly more time than the reciter (1.2x)
        const duration = audioRef.current.duration * 1200; 
        const step = 50;
        let elapsed = 0;

        interval = window.setInterval(() => {
            elapsed += step;
            const progress = (elapsed / duration) * 100;
            setUserTurnProgress(progress);

            if (elapsed >= duration) {
                clearInterval(interval);
                setIsUserTurn(false);
                handleLoopLogic(); // Proceed after user turn
            }
        }, step);
    }
    return () => clearInterval(interval);
  }, [isUserTurn, echoMode]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsUserTurn(false); // Cancel echo if paused
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLoopLogic = () => {
      if (!isLooping) {
          onNext();
          return;
      }
      if (currentRepeat < repeatCount - 1) {
          setCurrentRepeat(prev => prev + 1);
          audioRef.current?.play();
          setIsPlaying(true);
      } else {
          onNext();
      }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (echoMode && isLooping) {
        // Start Talqeen phase
        setIsUserTurn(true);
    } else {
        handleLoopLogic();
    }
  };

  const handleMistake = () => {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
          setIsPlaying(true);
          setIsUserTurn(false); 
          setCurrentRepeat(0); 
      }
  };

  const fetchTafseer = async () => {
    if (!ayahData) return;
    setLoadingTafseer(true);
    const text = await getTafseer(ayahData.surah.name, ayahData.numberInSurah, ayahData.text);
    setTafseer(text);
    setLoadingTafseer(false);
  };

  const handleOpenFullSurah = async () => {
    setShowFullSurah(true);
    if (ayahData && fullSurahAyahs.length === 0) {
        setLoadingFullSurah(true);
        const ayahs = await fetchFullSurah(ayahData.surah.number);
        setFullSurahAyahs(ayahs);
        setLoadingFullSurah(false);
    }
  };

  const cycleViewMode = () => {
      if (viewMode === 'read') setViewMode('blur');
      else if (viewMode === 'blur') setViewMode('hidden');
      else setViewMode('read');
  };

  if (!ayahData) return null;

  return (
    <>
      <div className="h-full w-full flex flex-col relative z-10">
        
        {/* --- Header Info (Mobile Only mainly, but adapted for desktop) --- */}
        <div className="flex-none pt-2 flex justify-center z-20 md:absolute md:top-8 md:left-8 md:pt-0">
            {/* On Mobile: Click to open search. On Desktop: Just a label (search is in sidebar) */}
            <button 
                onClick={onOpenSearch}
                className={`bg-white/5 border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 text-amber-100 transition-all group ${
                    // Disable pointer events on desktop because sidebar exists
                    'md:pointer-events-none md:bg-transparent md:border-none md:px-0'
                }`}
            >
                <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">{ayahData.surah.englishName}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span className="font-quran text-lg md:text-2xl group-hover:scale-105 transition-transform">{ayahData.surah.name}</span>
            </button>
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex-1 w-full relative min-h-0 flex flex-col">
            
            {/* Scrollable Text Area */}
            <div 
                ref={textContainerRef}
                className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-12 relative flex items-center justify-center"
            >
                <div className="w-full flex flex-col items-center justify-center py-20 md:py-10">
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            <span className="text-xs text-amber-500/50 tracking-[0.2em]">جاري التحميل</span>
                        </div>
                    ) : (
                        <div className={`relative w-full max-w-5xl text-center transition-all duration-500 ${isUserTurn ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                            
                            {/* Echo Mode Status Indicator */}
                            {isUserTurn && (
                                <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                        <Mic className="w-4 h-4 animate-pulse" />
                                        <span>دورك الآن.. ردد الآية</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                            style={{ width: `${userTurnProgress}%`, transition: 'width 0.1s linear' }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Loop Indicator */}
                            {isLooping && !isUserTurn && (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-amber-500/50 text-xs font-mono tracking-widest bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                    LOOP {currentRepeat + 1}/{repeatCount}
                                </div>
                            )}

                            {/* The Ayah Text - MASSIVE ON DESKTOP */}
                            <h1 
                                className={`font-quran text-[2rem] sm:text-4xl md:text-[3.5rem] lg:text-[5rem] leading-[2.6] md:leading-[2.8] text-white transition-all duration-500 ${
                                    viewMode === 'hidden' ? 'blur-2xl opacity-0 hover:opacity-100 hover:blur-0 cursor-pointer' : ''
                                }`}
                                dir="rtl"
                                style={{ textWrap: 'balance' }}
                            >
                                {viewMode === 'read' && ayahData.text}
                                
                                {viewMode === 'blur' && (
                                    <>
                                        {/* Show first word, blur rest */}
                                        <span className="text-amber-200">{ayahData.text.split(' ')[0]}</span>
                                        {' '}
                                        <span className="blur-md opacity-30 transition-all duration-300 hover:blur-0 hover:opacity-100 cursor-help">
                                            {ayahData.text.split(' ').slice(1).join(' ')}
                                        </span>
                                    </>
                                )}

                                {viewMode === 'hidden' && ayahData.text}

                                {/* Ayah End Symbol */}
                                <span className="inline-flex items-center justify-center w-[0.7em] h-[0.7em] mx-2 align-middle relative text-amber-500/60 select-none">
                                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 fill-current opacity-100">
                                            <path d="M50 0 L62 12 L85 12 L85 35 L100 50 L85 65 L85 88 L62 88 L50 100 L38 88 L15 88 L15 65 L0 50 L15 35 L15 12 L38 12 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                                    </svg>
                                    <span className="relative z-10 text-[0.4em] font-sans font-bold pt-1 text-amber-100">{ayahData.numberInSurah}</span>
                                </span>
                            </h1>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- Genius Control Bar (Bottom) --- */}
        {/* On desktop, allow it to span wider */}
        <div className="flex-none p-4 pb-8 md:pb-6 flex flex-col items-center justify-center gap-6 relative z-50 md:bg-black/20 md:backdrop-blur-md md:border-t md:border-white/5 md:w-full">
            
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 w-full max-w-5xl justify-between">
                
                {/* 1. Playback Controls (Center on Mobile, Left on Desktop) */}
                <div className="flex items-center gap-6 md:order-2 md:flex-1 md:justify-center">
                    <button onClick={onPrev} className="text-white/40 hover:text-white transition-transform active:scale-90"><SkipBack className="w-6 h-6" /></button>
                    
                    <button 
                        onClick={togglePlay}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                            isPlaying ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-white text-black shadow-white/20 hover:scale-105'
                        }`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>

                    <button onClick={onNext} className="text-white/40 hover:text-white transition-transform active:scale-90"><SkipForward className="w-6 h-6" /></button>
                </div>

                {/* 2. Hifz Tools (Top on Mobile, Right on Desktop) */}
                <div className="flex items-center gap-4 bg-[#0f172a] md:bg-transparent md:shadow-none md:border-none border border-white/10 rounded-2xl p-2 shadow-2xl md:order-3 md:justify-end">
                    
                    {/* Loop Controls */}
                    <div className="flex items-center gap-2 pl-4 border-l border-white/10 md:border-white/20">
                        <button 
                            onClick={() => setIsLooping(!isLooping)}
                            className={`p-2 rounded-lg transition-colors ${isLooping ? 'bg-amber-500 text-black' : 'text-white/40 hover:text-white'}`}
                            title="تفعيل التكرار"
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                        {isLooping && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))} className="text-white/50 hover:text-white text-lg font-bold px-1">-</button>
                                <span className="text-xs font-mono w-4 text-center">{repeatCount}</span>
                                <button onClick={() => setRepeatCount(Math.min(20, repeatCount + 1))} className="text-white/50 hover:text-white text-lg font-bold px-1">+</button>
                            </div>
                        )}
                    </div>

                    {/* Echo Mode */}
                    <button 
                        onClick={() => setEchoMode(!echoMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                            echoMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                        title="نظام التلقين (صمت للترديد)"
                    >
                        <Mic className="w-4 h-4" />
                        <span className="text-[10px] font-bold hidden md:inline">تلقين</span>
                    </button>

                    {/* View Mode (Eye) */}
                    <button 
                        onClick={cycleViewMode}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                            viewMode !== 'read' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white'
                        }`}
                        title="مستويات الإخفاء"
                    >
                        {viewMode === 'read' ? <Eye className="w-4 h-4" /> : viewMode === 'blur' ? <span className="text-xs font-bold">1st</span> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Mistake Button (Panic) */}
                    <button 
                        onClick={handleMistake}
                        className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="أعد الآية (أخطأت)"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* 3. Extra Tools (Links) */}
                <div className="flex items-center gap-4 text-white/30 md:order-1 md:justify-start">
                    <button onClick={handleOpenFullSurah} className="hover:text-amber-400 transition-colors p-2" title="قراءة السورة"><BookOpenText className="w-5 h-5" /></button>
                    <button onClick={fetchTafseer} className="hover:text-amber-400 transition-colors p-2" title="تفسير"><Sparkles className="w-5 h-5" /></button>
                </div>
            </div>

        </div>
      </div>

      {/* --- Full Surah Overlay --- */}
      {showFullSurah && (
        <div className="fixed inset-0 z-[60] bg-[#020617] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
             <div className="flex-none p-4 flex justify-between items-center border-b border-white/5 bg-[#020617]/80 backdrop-blur">
                 <h2 className="text-amber-100 font-quran text-xl">{ayahData.surah.name}</h2>
                 <button onClick={() => setShowFullSurah(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-3xl mx-auto font-quran text-2xl leading-[2.8] text-justify text-white/90" dir="rtl">
                    {loadingFullSurah ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
                    ) : (
                        fullSurahAyahs.map(ayah => (
                            <span key={ayah.number} className={`${ayah.numberInSurah === ayahData.numberInSurah ? 'text-amber-400' : ''}`}>
                                {ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim()} 
                                <span className="inline-flex items-center justify-center w-[1em] h-[1em] mx-1 align-middle text-amber-500/40 text-[0.6em] border border-current rounded-full">{ayah.numberInSurah}</span>
                            </span>
                        ))
                    )}
                </div>
             </div>
        </div>
      )}

      {/* --- Tafseer Overlay (Slide-over on Desktop maybe? Keeping modal for now but styled) --- */}
      {tafseer && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTafseer(null)}>
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> التفسير الميسر</h3>
                    <button onClick={() => setTafseer(null)}><X className="w-5 h-5 text-white/50 hover:text-white" /></button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <p className="text-right text-xl leading-loose text-gray-200 font-light whitespace-pre-line font-quran">{tafseer}</p>
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
          onPlay={() => {
              setIsPlaying(true);
              if(!isUserTurn) setIsUserTurn(false); 
          }}
          onPause={() => !isUserTurn && setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </>
  );
};

export default Player;