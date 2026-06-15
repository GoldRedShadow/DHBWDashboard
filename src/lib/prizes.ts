import { Prize } from '../types';

export const PRIZES: Prize[] = [
  // --- EXISTING THEMES ---
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
    id: 'theme-hell',
    name: 'Hölle',
    type: 'theme',
    rarity: 'rare',
    description: 'Heiß, feurig und verdammt produktiv.',
    value: 'theme-hell'
  },
  {
    id: 'theme-heaven',
    name: 'Himmel',
    type: 'theme',
    rarity: 'rare',
    description: 'Himmlische Ruhe für fokussiertes Lernen.',
    value: 'theme-heaven'
  },
  {
    id: 'theme-space',
    name: 'Weltraum',
    type: 'theme',
    rarity: 'rare',
    description: 'Unendliche Weiten für deine Gedanken.',
    value: 'theme-space'
  },

  // --- NEW COMMON THEMES ---
  {
    id: 'theme-midnight-ocean',
    name: 'Midnight Ocean',
    type: 'theme',
    rarity: 'common',
    description: 'Beruhigende Blautöne wie das Meer bei Nacht.',
    value: 'theme-midnight-ocean'
  },
  {
    id: 'theme-forest-green',
    name: 'Forest Green',
    type: 'theme',
    rarity: 'common',
    description: 'Natürliche Grüntöne für entspanntes Lernen.',
    value: 'theme-forest-green'
  },
  {
    id: 'theme-sunset-amber',
    name: 'Sunset Amber',
    type: 'theme',
    rarity: 'common',
    description: 'Warme, goldene Töne für entspannte Sessions.',
    value: 'theme-sunset-amber'
  },

  // --- NEW RARE THEMES ---
  {
    id: 'theme-synthwave',
    name: 'Synthwave',
    type: 'theme',
    rarity: 'rare',
    description: 'Neonfarben und 80er-Synthwave-Ästhetik.',
    value: 'theme-synthwave'
  },
  {
    id: 'theme-monochrom',
    name: 'Monochrom',
    type: 'theme',
    rarity: 'rare',
    description: 'Nur Grauwerte für minimale Ablenkung.',
    value: 'theme-monochrom'
  },
  {
    id: 'theme-cybernetic',
    name: 'Cybernetic',
    type: 'theme',
    rarity: 'rare',
    description: 'Kalte, technische Grün-Schwarz-Töne.',
    value: 'theme-cybernetic'
  },
  {
    id: 'theme-sakura',
    name: 'Sakura',
    type: 'theme',
    rarity: 'rare',
    description: 'Zartes Rosa und Weiß inspiriert von Kirschblüten.',
    value: 'theme-sakura'
  },
  {
    id: 'theme-void',
    name: 'Void',
    type: 'theme',
    rarity: 'rare',
    description: 'Extremes Schwarz mit minimalen Akzenten.',
    value: 'theme-void'
  },

  // --- NEW LEGENDARY THEMES ---
  {
    id: 'theme-aurora',
    name: 'Aurora Borealis',
    type: 'theme',
    rarity: 'legendary',
    description: 'Tanzende grüne und violette Lichter.',
    value: 'theme-aurora'
  },
  {
    id: 'theme-cosmic-void',
    name: 'Cosmic Void',
    type: 'theme',
    rarity: 'legendary',
    description: 'Dunkler Weltraum mit funkelnden Sternen.',
    value: 'theme-cosmic-void'
  },
  {
    id: 'theme-dragon-gold',
    name: 'Drachen Gold',
    type: 'theme',
    rarity: 'legendary',
    description: 'Luxuriöses Gold und tiefes Violett.',
    value: 'theme-dragon-gold'
  },

  // --- NEW RARE GIMMICKS ---
  {
    id: 'gimmick-bot',
    name: 'Motivations-Bot',
    type: 'gimmick',
    rarity: 'rare',
    description: 'Ein kleiner Roboter, der dir Komplimente macht.',
    value: 'Bot'
  },
  {
    id: 'gimmick-reading-owl',
    name: 'Lese-Eule',
    type: 'gimmick',
    rarity: 'rare',
    description: 'Eine Eule, die deine Lernzeit verfolgt.',
    value: 'ReadingOwl'
  },
  {
    id: 'gimmick-zen-fish',
    name: 'Zen-Fisch',
    type: 'gimmick',
    rarity: 'rare',
    description: 'Ein Fisch in einem digitalen Aquarium.',
    value: 'ZenFish'
  },
  {
    id: 'gimmick-moon-spirit',
    name: 'Mond-Geist',
    type: 'gimmick',
    rarity: 'rare',
    description: 'Ein schwebendes Mondgesicht, das mit deinen Erfolgen wächst.',
    value: 'MoonSpirit'
  },

  // --- NEW LEGENDARY GIMMICKS (PETS) ---
  {
    id: 'gimmick-phoenix',
    name: 'Phönix',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Erhebt sich nach jeder Lernpause neu.',
    value: 'Phoenix'
  },
  {
    id: 'gimmick-golem',
    name: 'Kristall-Golem',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Wird stärker, je länger du konzentriert lernst.',
    value: 'Golem'
  },
  {
    id: 'gimmick-twin',
    name: 'Zeit-Zwilling',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Zeigt dein „bestes Selbst" parallel.',
    value: 'Twin'
  },
  {
    id: 'gimmick-mirror',
    name: 'Magischer Spiegel',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Reflektiert deine täglichen Fortschritte.',
    value: 'Mirror'
  },

  // --- EXISTING GIMMICKS ---
  {
    id: 'gimmick-coffee',
    name: 'Coffee Addict',
    type: 'gimmick',
    rarity: 'rare',
    description: 'A coffee mug icon next to your name.',
    value: 'Coffee'
  },
  {
    id: 'gimmick-sun',
    name: 'Sonnen Pet',
    type: 'gimmick',
    rarity: 'rare',
    description: 'Ein strahlender Begleiter.',
    value: 'Sun'
  },
  {
    id: 'gimmick-cat',
    name: 'Study Cat',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'A cute cat that keeps you company.',
    value: 'Cat'
  },
  {
    id: 'gimmick-owl',
    name: 'Pixel Owl',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'A wise owl that watches over you.',
    value: 'Bird'
  },
  {
    id: 'gimmick-dog',
    name: 'Bester Freund',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Ein treuer Hund.',
    value: 'Dog'
  },
  {
    id: 'gimmick-demon',
    name: 'Dämonen Pet',
    type: 'gimmick',
    rarity: 'legendary',
    description: 'Frisst deine Prokrastination.',
    value: 'Flame'
  }
];

export const getPrizesByRarity = (rarity: 'common' | 'rare' | 'legendary') => {
  return PRIZES.filter(p => p.rarity === rarity);
};
