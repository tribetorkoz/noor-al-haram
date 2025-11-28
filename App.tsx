import React, { useState, useEffect } from 'react';
import { fetchSurahs, fetchAyahAudio } from './services/quranService';
import { RECITERS } from './constants';
import { Surah, AyahResponse, Reciter } from './types';
import ReciterCard from './components/ReciterCard';
import Player from './components/Player';
import { Search, ChevronLeft, BookOpen } from 'lucide-react';

interface SurahItemProps {
  surah: Surah;
  compact?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const SurahItem: React.FC<SurahItemProps> = ({ surah, compact = false, isSelected, onSelect }) => (
  <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group border relative overflow-hidden text-right ${
          isSelected 
          ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' 
          : 'bg-white/5 hover:bg-white/10 border-white/5 text-white hover:border-white/20'
      }`}
  >
      <div className="flex items-center gap-3 z-10 w-full justify-between">
          <div className="flex items-center gap-3">
               {/* Number Badge */}
              <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold font-mono ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-black/30 text-amber-500'
              }`}>
                  {surah.number}
              </span>
              <div className="flex flex-col items-start">
                  <h3 className={`font-bold font-quran leading-none mb-1 ${compact ? 'text-sm' : 'text-lg'}`}>{surah.name}</h3>
                  {!compact && (
                       <p className={`text-[10px] uppercase tracking-widest font-medium ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                          {surah.englishName}
                       </p>
                  )}
              </div>
          </div>
          
          {/* Verse Count */}
          <span className={`text-[10px] ${isSelected ? 'text-black/60' : 'text-white/30'}`}>
              {surah.numberOfAyahs} آية
          </span>
      </div>
  </button>
);

const App: React.FC = () => {
  const [reciters] = useState<Reciter[]>(RECITERS);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [ayahData, setAyahData] = useState<AyahResponse['data'] | null>(null);
  const [isLoadingAyah, setIsLoadingAyah] = useState(false);
  
  // -- State with Persistence --
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(() => {
      const saved = localStorage.getItem('noor_reciter');
      if (saved) {
          const found = RECITERS.find(r => r.id === saved);
          if (found) return found;
      }
      return RECITERS[0];
  });

  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentAyahNum, setCurrentAyahNum] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mobile Search State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load Surahs & Restore State
  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      setSurahs(data);
      
      // Restore saved progress
      const savedSurahNum = localStorage.getItem('noor_surah');
      const savedAyahNum = localStorage.getItem('noor_ayah');
      
      if (data.length > 0) {
        if (savedSurahNum) {
            const foundSurah = data.find(s => s.number === parseInt(savedSurahNum));
            setSelectedSurah(foundSurah || data[0]);
        } else {
            setSelectedSurah(data[0]); // Default to Fatiha
        }

        if (savedAyahNum) {
            setCurrentAyahNum(parseInt(savedAyahNum));
        }
      }
      setIsInitialized(true);
    };
    loadSurahs();
  }, []);

  // 2. Persist State Changes
  useEffect(() => {
      if (isInitialized && selectedSurah) {
          localStorage.setItem('noor_reciter', selectedReciter.id);
          localStorage.setItem('noor_surah', selectedSurah.number.toString());
          localStorage.setItem('noor_ayah', currentAyahNum.toString());
      }
  }, [selectedReciter, selectedSurah, currentAyahNum, isInitialized]);

  // 3. Fetch Ayah Audio
  useEffect(() => {
    if (selectedSurah) {
      const loadAyah = async () => {
        setIsLoadingAyah(true);
        const data = await fetchAyahAudio(
          selectedSurah.number,
          currentAyahNum,
          selectedReciter.subfolder
        );
        setAyahData(data);
        setIsLoadingAyah(false);
      };
      loadAyah();
    }
  }, [selectedSurah, currentAyahNum, selectedReciter]);

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || 
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.number.toString() === searchQuery
  );

  const handleSurahSelect = (surah: Surah) => {
    setSelectedSurah(surah);
    setCurrentAyahNum(1); // Reset to first Ayah on new Surah
    setIsMobileSearchOpen(false);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#020617] text-white overflow-hidden flex flex-col md:flex-row">
      
      {/* =========================================================================
          DESKTOP SIDEBAR (Visible only on md+)
          "The Library" - UNIFIED DASHBOARD
      ========================================================================== */}
      <aside className="hidden md:flex flex-col w-80 lg:w-96 border-r border-white/5 bg-[#0b1221] h-full shadow-[5px_0_30px_rgba(0,0,0,0.3)] z-50">
          {/* Sidebar Header containing Brand + Reciters + Search */}
          <div className="flex-none p-6 space-y-8 bg-gradient-to-b from-[#0f172a] to-[#0b1221] border-b border-white/5">
              
              {/* Brand */}
              <div className="flex items-center gap-3 select-none">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                      <BookOpen className="text-black w-6 h-6" />
                  </div>
                  <div>
                      <h1 className="font-quran text-2xl font-bold text-white leading-none mb-1">نور الحرم</h1>
                      <span className="text-[10px] text-amber-500 font-bold tracking-[0.2em] uppercase opacity-80">Quran Workstation</span>
                  </div>
              </div>

              {/* Reciters List (Integrated into Sidebar) */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">اختيار القارئ</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                      {reciters.map(reciter => (
                          <ReciterCard 
                              key={reciter.id}
                              reciter={reciter}
                              variant="sidebar"
                              isSelected={selectedReciter.id === reciter.id}
                              onClick={() => setSelectedReciter(reciter)}
                          />
                      ))}
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-quran text-amber-500">{selectedReciter.name}</span>
                  </div>
              </div>

              {/* Search Box */}
              <div className="relative group">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                  <input 
                      type="text" 
                      placeholder="بحث عن سورة..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-amber-500/30 focus:bg-black/40 transition-all placeholder-white/20"
                  />
              </div>
          </div>

          {/* Surah List (Desktop) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3 px-2 pt-2">المكتبة القرآنية</div>
              {filteredSurahs.map(surah => (
                  <SurahItem 
                    key={surah.number} 
                    surah={surah} 
                    compact 
                    isSelected={selectedSurah?.number === surah.number}
                    onSelect={() => handleSurahSelect(surah)}
                  />
              ))}
          </div>
      </aside>


      {/* =========================================================================
          MAIN CONTENT AREA (Mobile & Desktop)
          "The Studio"
      ========================================================================== */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 bg-[#020617] md:bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#020617] via-[#0f172a] to-[#020617] opacity-90 z-0"></div>
        
        {/* --- Top Bar: Reciters (MOBILE ONLY) --- */}
        <div className="flex-none z-30 w-full pt-4 pb-2 px-4 md:hidden relative">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full mask-linear-fade scroll-smooth py-2">
                {reciters.map(reciter => (
                    <ReciterCard 
                    key={reciter.id}
                    reciter={reciter}
                    isSelected={selectedReciter.id === reciter.id}
                    onClick={() => setSelectedReciter(reciter)}
                    />
                ))}
            </div>
        </div>

        {/* --- Player Stage --- */}
        <div className="flex-1 relative w-full h-full min-h-0 z-10">
            <Player 
                ayahData={ayahData}
                isLoading={isLoadingAyah}
                onNext={() => {
                    if (selectedSurah && currentAyahNum < selectedSurah.numberOfAyahs) {
                        setCurrentAyahNum(prev => prev + 1);
                    }
                }}
                onPrev={() => {
                    if (currentAyahNum > 1) setCurrentAyahNum(prev => prev - 1);
                }}
                onOpenSearch={() => setIsMobileSearchOpen(true)}
            />
        </div>

      </main>

      {/* =========================================================================
          MOBILE SEARCH MODAL (Visible only on Mobile when triggered)
      ========================================================================== */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#020617] animate-in slide-in-from-bottom-10 flex flex-col h-[100dvh]">
          {/* Header */}
          <div className="flex-none p-4 border-b border-white/10 bg-[#0f172a] flex items-center gap-3">
             <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                 <ChevronLeft className="w-6 h-6 text-white" />
             </button>
             <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input 
                    type="text" 
                    placeholder="ابحث..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pr-10 pl-4 text-white focus:outline-none"
                    autoFocus
                />
             </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
             {filteredSurahs.map(surah => (
                 <SurahItem 
                    key={surah.number} 
                    surah={surah} 
                    isSelected={selectedSurah?.number === surah.number}
                    onSelect={() => handleSurahSelect(surah)}
                 />
             ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;