import { Reciter } from './types';

export const RECITERS: Reciter[] = [
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    subfolder: 'Abdurrahmaan_As-Sudais_192kbps',
    image: '/reciters/img1.jpg',   // الصورة 1
  },
  {
    id: 'shuraim',
    name: 'سعود الشريم',
    subfolder: 'Saood_ash-Shuraym_128kbps',
    image: '/reciters/img2.jpg',   // الصورة 2
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    image: '/reciters/img3.jpg',   // الصورة 3
  },
  {
    id: 'budair',
    name: 'صلاح البدير',
    subfolder: 'Salah_Al_Budair_128kbps',
    image: '/reciters/img4.jpg',   // الصورة 4
  },
];

export const API_BASE_URL = 'https://api.alquran.cloud/v1';
