import { Reciter } from './types';

export const RECITERS: Reciter[] = [
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    subfolder: 'Abdurrahmaan_As-Sudais_192kbps',
    image: 'https://static.qurancentral.com/authors/abdur-rahman-as-sudais.jpg', 
  },
  {
    id: 'shuraim',
    name: 'سعود الشريم',
    subfolder: 'Saood_ash-Shuraym_128kbps',
    image: 'https://static.qurancentral.com/authors/saud-ash-shuraym.jpg',
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    image: 'https://static.qurancentral.com/authors/yasser-ad-dussary.jpg',
  },
  {
    id: 'budair',
    name: 'صلاح البدير',
    subfolder: 'Salah_Al_Budair_128kbps',
    image: 'https://static.qurancentral.com/authors/salah-al-budair.jpg',
  },
  {
    id: 'jaber',
    name: 'علي جابر',
    subfolder: 'Ali_Jaber_64kbps',
    image: 'https://static.qurancentral.com/authors/ali-jaber.jpg',
  },
];

export const API_BASE_URL = 'https://api.alquran.cloud/v1';