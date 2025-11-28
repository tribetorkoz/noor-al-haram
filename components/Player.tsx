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
  
  // Hifz Engine State - ENABLED BY DEFAULT
  const [repeatCount, setRepeatCount] = useState<number>(3); 
  const [currentRepeat, setCurrentRepeat] = useState(0); 
  const [isLooping, setIsLooping] = useState(true); // Default ON
  const [echoMode, setEchoMode] = useState(true); // Default ON (Talqeen Mode)
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
    // Modified logic: Allow Talqeen (Echo) even if Looping is OFF
    // This supports "Listen -> Repeat -> Next" flow
    if (echoMode) {
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

  // Helper to process text (Fix Al-Fatiha Basmalah Issue)
  const getProcessedText = () => {
      if (!ayahData) return "";
      // If it is Surah 1 and Ayah 1, keep the text as is (It IS the Basmalah).
      if (ayahData.surah.number === 1 && ayahData.numberInSurah === 1) {
          return ayahData.text;
      }
      // For all other Surahs/Ayahs, remove the Basmalah if it exists at the start
      return ayahData.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
  };

  if (!ayahData) return null;

  const currentText = getProcessedText();

  return (
    <>
      <div className="h-full w-full flex flex-col relative z-10 md:bg-black/20">
        
        {/* --- Header Info (Mobile Only) --- */}
        <div className="flex-none pt-2 flex justify-center z-20 md:hidden">
            <button 
                onClick={onOpenSearch}
                className="bg-white/5 border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 text-amber-100 transition-all active:scale-95"
            >
                <span className="text-xs text-amber-500 font-bold tracking-widest uppercase">{ayahData.surah.englishName}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span className="font-quran text-lg">{ayahData.surah.name}</span>
            </button>
        </div>

        {/* --- Main Content Area (The Floating Stage) --- */}
        <div className="flex-1 w-full relative min-h-0 flex flex-col md:p-8 lg:p-12 overflow-hidden">
            
            {/* Scrollable Text Area Container */}
            <div 
                ref={textContainerRef}
                className="flex-1 w-full h-full overflow-y-auto custom-scrollbar relative flex items-center justify-center"
            >
                {/* Desktop "Floating Glass" Container */}
                <div className="w-full h-full md:h-auto min-h-[50vh] flex flex-col items-center justify-center relative md:bg-[#0f172a]/40 md:backdrop-blur-xl md:border md:border-white/5 md:rounded-[2rem] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-12 lg:p-20 transition-all duration-700">
                    
                    {/* Background Ambience inside the card */}
                    <div 
                        className={`absolute inset-0 rounded-[2rem] transition-all duration-1000 -z-10 opacity-30 ${
                            isUserTurn ? 'bg-gradient-to-t from-emerald-900/30 to-transparent' : 'bg-gradient-to-t from-amber-900/20 to-transparent'
                        }`}
                    />

                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4 animate-pulse">
                            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                            <span className="text-sm text-amber-500/50 tracking-[0.3em] font-light">J A R I &nbsp; A L T A H M I L</span>
                        </div>
                    ) : (
                        <div className={`relative w-full text-center transition-all duration-500 ${isUserTurn ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                            
                            {/* Echo Mode Status Indicator (Floating above text) */}
                            {isUserTurn && (
                                <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 z-30">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md">
                                        <Mic className="w-5 h-5 animate-pulse" />
                                        <span>دورك الآن.. ردد الآية</span>
                                    </div>
                                    <div className="w-40 h-1 bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" 
                                            style={{ width: `${userTurnProgress}%`, transition: 'width 0.1s linear' }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Decorative Basmalah (Only for Surahs other than Fatiha and Tawbah, at Ayah 1) */}
                            {ayahData.numberInSurah === 1 && ayahData.surah.number !== 1 && ayahData.surah.number !== 9 && (
                                <div className="mb-10 md:mb-16 text-amber-500/60 font-quran text-3xl md:text-5xl opacity-80 select-none drop-shadow-2xl">
                                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                                </div>
                            )}

                            {/* The Ayah Text - MASSIVE TYPOGRAPHY */}
                            <h1 
                                className={`font-quran text-[2rem] sm:text-4xl md:text-[4rem] lg:text-[5rem] xl:text-[6rem] leading-[2.6] md:leading-[2.5] text-white transition-all duration-500 ${
                                    viewMode === 'hidden' ? 'blur-2xl opacity-0 hover:opacity-100 hover:blur-0 cursor-pointer' : ''
                                }`}
                                dir="rtl"
                                style={{ textWrap: 'balance' }}
                            >
                                {viewMode === 'read' && currentText}
                                
                                {viewMode === 'blur' && (
                                    <>
                                        {/* Show first word, blur rest */}
                                        <span className="text-amber-200">{currentText.split(' ')[0]}</span>
                                        {' '}
                                        <span className="blur-md opacity-30 transition-all duration-300 hover:blur-0 hover:opacity-100 cursor-help">
                                            {currentText.split(' ').slice(1).join(' ')}
                                        </span>
                                    </>
                                )}

                                {viewMode === 'hidden' && currentText}

                                {/* Ayah End Symbol */}
                                <span className="inline-flex items-center justify-center w-[0.7em] h-[0.7em] mx-2 align-middle relative text-amber-500/60 select-none">
                                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 fill-current opacity-100">
                                            <path d="M50 0 L62 12 L85 12 L85 35 L100 50 L85 65 L85 88 L62 88 L50 100 L38 88 L15 88 L15 65 L0 50 L15 35 L15 12 L38 12 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                                    </svg>
                                    <span className="relative z-10 text-[0.4em] font-sans font-bold pt-1 text-amber-100">{ayahData.numberInSurah}</span>
                                </span>
                            </h1>

                            {/* Info Label for Desktop */}
                            <div className="hidden md:block mt-12 text-white/20 text-sm tracking-[0.5em] font-sans uppercase">
                                {ayahData.surah.englishName} • VERSE {ayahData.numberInSurah}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- Slimline Workstation Dock (Desktop) vs Floating Dock (Mobile) --- */}
        <div className={`
            flex-none z-50 flex flex-col items-center justify-center gap-6 relative transition-all duration-500
            p-4 pb-8 md:p-0 md:h-24 md:w-full md:border-t md:border-white/10 md:bg-[#020617]/90 md:backdrop-blur-xl
        `}>
            
            {/* Dock Container */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-6 w-full max-w-7xl px-8 justify-between">
                
                {/* 1. Playback Controls (Center) */}
                <div className="flex items-center gap-8 md:flex-1 md:justify-center">
                    <button onClick={onPrev} className="text-white/40 hover:text-white transition-transform active:scale-90" title="الآية السابقة"><SkipBack className="w-6 h-6 md:w-5 md:h-5" /></button>
                    
                    <button 
                        onClick={togglePlay}
                        className={`relative w-16 h-16 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 z-10 ${
                            isPlaying ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-white text-black shadow-white/20 hover:scale-105'
                        }`}
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                    </button>

                    <button onClick={onNext} className="text-white/40 hover:text-white transition-transform active:scale-90" title="الآية التالية"><SkipForward className="w-6 h-6 md:w-5 md:h-5" /></button>
                </div>

                {/* 2. Hifz Tools (Right on Desktop) */}
                <div className="flex items-center gap-3 bg-[#0f172a] md:bg-transparent md:shadow-none md:border-none border border-white/10 rounded-2xl p-2 shadow-2xl md:order-3 md:justify-end md:w-1/3">
                    
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
                            <div className="flex items-center gap-1 font-mono text-xs">
                                <span className="text-white/50 px-1">x</span>
                                <span className="text-amber-500 font-bold text-lg w-5 text-center">{repeatCount}</span>
                                <div className="flex flex-col">
                                    <button onClick={() => setRepeatCount(Math.min(20, repeatCount + 1))} className="text-white/40 hover:text-white leading-none text-[10px] mb-0.5">▲</button>
                                    <button onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))} className="text-white/40 hover:text-white leading-none text-[10px]">▼</button>
                                </div>
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
                        <span className="text-[10px] font-bold hidden xl:inline">تلقين</span>
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

                {/* 3. Extra Tools (Left on Desktop) */}
                <div className="flex items-center gap-2 text-white/30 md:order-1 md:justify-start md:w-1/3">
                    <button onClick={handleOpenFullSurah} className="flex items-center gap-2 hover:text-amber-400 transition-colors p-2 px-3 hover:bg-white/5 rounded-lg group">
                        <BookOpenText className="w-5 h-5" />
                        <span className="text-xs font-medium hidden lg:inline group-hover:text-amber-400/80 transition-colors">قراءة السورة</span>
                    </button>
                    <button onClick={fetchTafseer} className="flex items-center gap-2 hover:text-emerald-400 transition-colors p-2 px-3 hover:bg-white/5 rounded-lg group">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs font-medium hidden lg:inline group-hover:text-emerald-400/80 transition-colors">التفسير الميسر</span>
                    </button>
                </div>
            </div>

        </div>
      </div>

      {/* --- Full Surah Overlay --- */}
      {showFullSurah && (
        <div className="fixed inset-0 z-[60] bg-[#020617] flex flex-col animate-in slide-in-from-bottom-10 duration-300">
             <div className="flex-none p-4 md:p-6 flex justify-between items-center border-b border-white/5 bg-[#020617]/80 backdrop-blur">
                 <h2 className="text-amber-100 font-quran text-2xl md:text-3xl">{ayahData.surah.name}</h2>
                 <button onClick={() => setShowFullSurah(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                <div className="max-w-4xl mx-auto font-quran text-2xl md:text-4xl leading-[2.8] md:leading-[3] text-justify text-white/90" dir="rtl">
                    {loadingFullSurah ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>
                    ) : (
                        fullSurahAyahs.map(ayah => (
                            <span key={ayah.number} className={`${ayah.numberInSurah === ayahData.numberInSurah ? 'text-amber-400 bg-amber-500/10 rounded px-1' : 'hover:text-white/80 transition-colors'}`}>
                                {ayah.numberInSurah === 1 && ayahData.surah.number !== 1 && ayahData.surah.number !== 9 
                                    ? ayah.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim() 
                                    : ayah.text
                                } 
                                <span className="inline-flex items-center justify-center w-[1em] h-[1em] mx-1 align-middle text-amber-500/40 text-[0.6em] border border-current rounded-full">{ayah.numberInSurah}</span>
                            </span>
                        ))
                    )}
                </div>
             </div>
        </div>
      )}

      {/* --- Tafseer Overlay --- */}
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