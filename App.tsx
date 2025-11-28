import React, { useState, useEffect } from 'react';
import { fetchSurahs, fetchAyahAudio } from './services/quranService';
import { RECITERS } from './constants';
import { Surah, AyahResponse, Reciter } from './types';
import ReciterCard from './components/ReciterCard';
import Player from './components/Player';
import { Search, X, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [reciters] = useState<Reciter[]>(RECITERS);
  const [selectedReciter, setSelectedReciter] = useState<Reciter>(RECITERS[0]);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentAyahNum, setCurrentAyahNum] = useState<number>(1);
  const [ayahData, setAyahData] = useState<AyahResponse['data'] | null>(null);
  const [isLoadingAyah, setIsLoadingAyah] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Load
  useEffect(() => {
    const loadSurahs = async () => {
      const data = await fetchSurahs();
      setSurahs(data);
      if (data.length > 0) {
        setSelectedSurah(data[0]); // Default to Fatiha
      }
    };
    loadSurahs();
  }, []);

  // Fetch Ayah
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

  return (
    // h-[100dvh] ensures it fits exactly on mobile browsers with dynamic address bars
    <div className="h-[100dvh] w-full flex flex-col relative overflow-hidden bg-slate-950 text-white selection:bg-amber-500/30">
      
      {/* --- Header / Reciters Area --- */}
      {/* Responsive padding and height */}
      <div className="flex-none w-full py-4 md:py-6 z-40 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent">
        <div className="flex justify-center w-full">
            <div className="flex items-center justify-start md:justify-center gap-3 md:gap-6 overflow-x-auto no-scrollbar px-6 w-full max-w-full mask-linear-fade scroll-smooth">
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
      </div>

      {/* --- Main Player Stage --- */}
      {/* Use flex-1 with min-h-0 to allow scrolling inside children if needed */}
      <main className="flex-1 flex flex-col relative w-full max-w-7xl mx-auto min-h-0">
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
           onOpenSearch={() => setIsSearchOpen(true)}
        />
      </main>

      {/* --- Surah Search / Selection Modal --- */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 flex flex-col h-[100dvh]">
          
          {/* Header */}
          <div className="flex-none p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-black/40">
             <h2 className="text-xl md:text-2xl font-bold text-amber-500 font-quran">فهرس السور</h2>
             <button 
               onClick={() => setIsSearchOpen(false)}
               className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors group"
             >
                <X className="w-6 h-6 text-white group-hover:text-red-400 transition-colors" />
             </button>
          </div>

          {/* Search Input */}
          <div className="flex-none p-4 md:p-6 pb-2">
            <div className="relative max-w-2xl mx-auto">
               <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 pointer-events-none" />
               <input 
                 type="text"
                 placeholder="ابحث عن السورة..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-full py-3 md:py-4 pr-14 pl-6 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 transition-all text-right text-base md:text-lg shadow-inner"
                 autoFocus
               />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-w-7xl mx-auto">
               {filteredSurahs.map(surah => (
                 <button
                   key={surah.number}
                   onClick={() => {
                     setSelectedSurah(surah);
                     setCurrentAyahNum(1);
                     setIsSearchOpen(false);
                   }}
                   className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 group border ${
                     selectedSurah?.number === surah.number 
                       ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                       : 'bg-white/5 hover:bg-white/10 border-white/5 text-white hover:border-white/20'
                   }`}
                 >
                    <div className="flex items-center gap-3 md:gap-4">
                       <span className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-xs md:text-sm font-bold font-mono ${
                          selectedSurah?.number === surah.number ? 'bg-black/20 text-black' : 'bg-black/40 text-amber-500'
                       }`}>
                          {surah.number}
                       </span>
                       <div className="text-right">
                          <h3 className="font-bold text-base md:text-lg font-quran">{surah.name}</h3>
                          <p className={`text-[10px] md:text-xs uppercase tracking-wider ${selectedSurah?.number === surah.number ? 'text-black/60' : 'text-white/30'}`}>
                             {surah.englishName}
                          </p>
                       </div>
                    </div>
                    {selectedSurah?.number === surah.number && <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;