import { API_BASE_URL } from '../constants';
import { Surah, AyahResponse } from '../types';

export const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/surah`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw new Error(data.status);
  } catch (error) {
    console.error('Failed to fetch Surahs:', error);
    return [];
  }
};

const pad3 = (num: number): string => {
  return num.toString().padStart(3, '0');
};

export const fetchAyahAudio = async (
  surahNumber: number,
  ayahNumber: number,
  reciterSubfolder: string
): Promise<AyahResponse['data'] | null> => {
  try {
    // We only fetch the text (quran-uthmani) from the API to save bandwidth and ensure consistency
    // We will construct the audio URL manually for everyayah.com
    const response = await fetch(
      `${API_BASE_URL}/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`
    );
    const data = await response.json();
    
    if (data.code === 200) {
      const ayahData = data.data;
      
      // Construct EveryAyah URL: http://everyayah.com/data/{subfolder}/{SSS}{AAA}.mp3
      const audioUrl = `https://everyayah.com/data/${reciterSubfolder}/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
      
      console.log("Playing audio from:", audioUrl);

      // Inject the constructed audio URL into the response object
      return {
        ...ayahData,
        audio: audioUrl,
        audioSecondary: []
      };
    }
    throw new Error(data.status);
  } catch (error) {
    console.error('Failed to fetch Ayah:', error);
    return null;
  }
};