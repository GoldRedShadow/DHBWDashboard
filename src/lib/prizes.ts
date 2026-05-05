import { Prize } from '../types';

export const PRIZES: Prize[] = [
  // Common Themes
  {
    id: 'theme-dark',
    name: 'Dark Mode',
    type: 'theme',
    rarity: 'common',
    description: 'A classic dark theme for late night study sessions.',
    value: 'theme-dark'
  },
  {
    id: 'theme-sepia',
    name: 'Sepia Oasis',
    type: 'theme',
    rarity: 'common',
    description: 'Easy on the eyes with warm, paper-like tones.',
    value: 'theme-sepia'
  },
  {
    id: 'theme-forest',
    name: 'Deep Forest',
    type: 'theme',
    rarity: 'common',
    description: 'Calming greens to help you stay focused.',
    value: 'theme-forest'
  },
  // Rare Themes & Gimmicks
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk 2077',
    type: 'theme',
    rarity: 'rare',
    description: 'Neon pinks and blues for a futuristic feel.',
    value: 'theme-cyberpunk'
  },
  {
    id: 'theme-retro',
    name: '80s Retro',
    type: 'theme',
    rarity: 'rare',
    description: 'Radical colors from the best decade.',
    value: 'theme-retro'
  },
  {
    id: 'gimmick-coffee',
    name: 'Coffee Addict',
    type: 'gimmick',
    rarity: 'rare',
    description: 'A coffee mug icon next to your name to show your dedication.',
    value: 'Coffee'
  },
  // Legendary Gimmicks (Pets)
  {
    id: 'gimmick-cat',
    name: 'Study Cat',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'A cute cat that keeps you company while you work.',
    value: 'Cat'
  },
  {
    id: 'gimmick-owl',
    name: 'Pixel Owl',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'A wise owl that watches over your progress.',
    value: 'Bird'
  }
];

export const getPrizesByRarity = (rarity: 'common' | 'rare' | 'legendary') => {
  return PRIZES.filter(p => p.rarity === rarity);
};
