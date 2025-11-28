import { Reciter } from './types';

export const RECITERS: Reciter[] = [
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    subfolder: 'Abdurrahmaan_As-Sudais_192kbps',
    image: 'https://picsum.photos/id/1/200/200', 
  },
  {
    id: 'shuraim',
    name: 'سعود الشريم',
    subfolder: 'Saood_ash-Shuraym_128kbps',
    image: 'https://picsum.photos/id/2/200/200',
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    subfolder: 'Yasser_Ad-Dussary_128kbps',
    image: 'https://picsum.photos/id/4/200/200',
  },
  {
    id: 'budair',
    name: 'صلاح البدير',
    subfolder: 'Salah_Al_Budair_128kbps',
    image: 'https://picsum.photos/id/7/200/200',
  },
  {
    id: 'jaber',
    name: 'علي جابر',
    subfolder: 'Ali_Jaber_64kbps',
    image: 'https://picsum.photos/id/8/200/200',
  },
];

export const API_BASE_URL = 'https://api.alquran.cloud/v1';