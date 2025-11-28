import React, { useState, useEffect } from 'react';
import { fetchSurahs, fetchAyahAudio } from './services/quranService';
import { RECITERS } from './constants';
import { Surah, AyahResponse, Reciter } from './types';
import ReciterCard from './components/ReciterCard';
import Player from './components/Player';
import { Search, X, ChevronRight, BookOpen } from 'lucide-react';

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
    // Main Container: Fixed height to viewport, no body scroll
    <div className="fixed inset-0 w-full h-[100dvh] flex flex-col bg-transparent text-white overflow-hidden selection:bg-amber-500/30">
      
      {/* 1. Header / Reciters (Fixed Height) */}
      <div className="flex-none z-40 w-full pt-4 pb-2 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex justify-center w-full px-4">
            <div className="flex items-center justify-start md:justify-center gap-3 md:gap-6 overflow-x-auto no-scrollbar w-full max-w-5xl mask-linear-fade scroll-smooth py-2">
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

      {/* 2. Main Player Area (Flexible Height) */}
      {/* This consumes all remaining space between Header and the bottom edge */}
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

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[100dvh]">
          {/* Search Header */}
          <div className="flex-none p-4 flex items-center justify-between border-b border-white/10 bg-black/50">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-500/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                 </div>
                 <h2 className="text-xl font-bold text-white font-quran">المصحف الشريف</h2>
             </div>
             <button 
               onClick={() => setIsSearchOpen(false)}
               className="p-2 bg-white/5 rounded-full hover:bg-white/10 hover:rotate-90 transition-all duration-300"
             >
                <X className="w-6 h-6 text-white" />
             </button>
          </div>

          {/* Search Input Area */}
          <div className="flex-none p-4">
            <div className="relative max-w-2xl mx-auto group">
               <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500/50 group-focus-within:text-amber-500 transition-colors w-5 h-5 pointer-events-none" />
               <input 
                 type="text"
                 placeholder="ابحث باسم السورة أو رقمها..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-6 text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:bg-white/10 focus:ring-1 focus:ring-amber-500/20 transition-all text-right text-lg shadow-inner"
                 autoFocus
               />
            </div>
          </div>

          {/* Surah List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-7xl mx-auto pb-8">
               {filteredSurahs.map(surah => (
                 <button
                   key={surah.number}
                   onClick={() => {
                     setSelectedSurah(surah);
                     setCurrentAyahNum(1);
                     setIsSearchOpen(false);
                   }}
                   className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group border relative overflow-hidden ${
                     selectedSurah?.number === surah.number 
                       ? 'bg-amber-500 text-black border-amber-400' 
                       : 'bg-white/5 hover:bg-white/10 border-white/5 text-white hover:border-white/20'
                   }`}
                 >
                    <div className="flex items-center gap-4 z-10">
                       <span className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold font-mono ${
                          selectedSurah?.number === surah.number ? 'bg-black/20 text-black' : 'bg-black/30 text-amber-500'
                       }`}>
                          {surah.number}
                       </span>
                       <div className="text-right">
                          <h3 className="font-bold text-lg font-quran leading-none mb-1">{surah.name}</h3>
                          <p className={`text-[10px] uppercase tracking-widest font-medium ${selectedSurah?.number === surah.number ? 'text-black/70' : 'text-white/40'}`}>
                             {surah.englishName}
                          </p>
                       </div>
                    </div>
                    {/* Subtle BG number decoration */}
                    <span className={`absolute -left-2 -bottom-4 text-6xl font-bold opacity-5 pointer-events-none font-sans ${selectedSurah?.number === surah.number ? 'text-black' : 'text-white'}`}>
                        {surah.number}
                    </span>
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