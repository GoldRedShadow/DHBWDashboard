import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, AlertCircle, Sparkles, Trophy, Ticket, Cat, Bird, Dog, Flame, Sun, Coffee, Palette } from 'lucide-react';
import { Prize, UserProfile } from '../types';
import { PRIZES, getPrizesByRarity } from '../lib/prizes';
import { db, doc, updateDoc, arrayUnion, increment } from '../firebase';
import { cn } from '../lib/utils';
import { PET_CONFIG } from './PetWidget';

interface SlotMachineProps {
  userProfile: UserProfile;
}

const RARITY_CHANCES = {
  legendary: 0.05,
  rare: 0.10,
  common: 0.20
};

const PrizeIcon = ({ prize, size = 48, className = "" }: { prize: Prize, size?: number, className?: string }) => {
  if (prize.type === 'theme') {
    return <Palette size={size} className={cn("text-purple-400", className)} />;
  }

  const config = PET_CONFIG[prize.value as keyof typeof PET_CONFIG];
  if (config) {
    const Icon = config.icon;
    return <Icon size={size} className={cn(config.color, className)} />;
  }

  return <Gift size={size} className={cn("text-primary-400", className)} />;
};

export const SlotMachine: React.FC<SlotMachineProps> = ({ userProfile }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningReels, setSpinningReels] = useState([false, false, false]);
  const [result, setResult] = useState<Prize | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spin = async () => {
    if (!userProfile.tokens || userProfile.tokens <= 0) {
      setError('Nicht genügend Tokens!');
      return;
    }

    setIsSpinning(true);
    setSpinningReels([true, true, true]);
    setResult(null);
    setError(null);

    const rand = Math.random();
    let wonPrize: Prize | null = null;

    const availablePrizes = (rarity: 'legendary' | 'rare' | 'common') => {
      const prizes = getPrizesByRarity(rarity);
      return prizes.filter(p => !userProfile.inventory?.includes(p.id));
    };

    if (rand < RARITY_CHANCES.legendary) {
      const prizes = availablePrizes('legendary');
      if (prizes.length > 0) wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
      else {
        const fallback = availablePrizes('rare');
        if (fallback.length > 0) wonPrize = fallback[Math.floor(Math.random() * fallback.length)];
      }
    } else if (rand < RARITY_CHANCES.legendary + RARITY_CHANCES.rare) {
      const prizes = availablePrizes('rare');
      if (prizes.length > 0) wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
      else {
        const fallback = availablePrizes('common');
        if (fallback.length > 0) wonPrize = fallback[Math.floor(Math.random() * fallback.length)];
      }
    } else if (rand < RARITY_CHANCES.legendary + RARITY_CHANCES.rare + RARITY_CHANCES.common) {
      const prizes = availablePrizes('common');
      if (prizes.length > 0) wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
    }

    // Staggered stop for the reels
    setTimeout(() => setSpinningReels([false, true, true]), 1500);
    setTimeout(() => setSpinningReels([false, false, true]), 2500);
    setTimeout(async () => {
      setSpinningReels([false, false, false]);

      
      try {
        const userDoc = doc(db, 'users', userProfile.uid);
        if (wonPrize) {
          await updateDoc(userDoc, {
            tokens: increment(-1),
            inventory: arrayUnion(wonPrize.id)
          });
          setResult(wonPrize);
        } else {
          await updateDoc(userDoc, {
            tokens: increment(-1)
          });
        }
      } catch (err) {
        console.error('Update failed', err);
        setError('Fehler beim Aktualisieren des Profils.');
      } finally {
        setIsSpinning(false);
      }
    }, 3500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-gray-900 flex items-center justify-center gap-3">
          <Sparkles className="text-yellow-500" />
          Slot Maschine
          <Sparkles className="text-yellow-500" />
        </h2>
        <p className="text-gray-500">Versuche dein Glück und gewinne exklusive Themes und Gimmicks!</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border-4 border-primary-600 shadow-2xl relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary-600 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-600 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Token Display */}
          <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-full border border-primary-100">
            <Coins size={20} className="text-primary-600" />
            <span className="font-bold text-primary-700">{userProfile.tokens ?? 0} Tokens verfügbar</span>
          </div>

          {/* Slot Display */}
          <div className="flex gap-4">
            {spinningReels.map((spinning, i) => (
              <div key={i} className="w-24 h-32 bg-gray-900 rounded-xl flex items-center justify-center border-b-4 border-black overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {spinning ? (
                    <motion.div
                      key="spinning"
                      initial={{ y: -100 }}
                      animate={{ y: 100 }}
                      transition={{ repeat: Infinity, duration: 0.15 + (i * 0.05), ease: "linear" }}
                      className="flex flex-col gap-4"
                    >
                      <Gift size={40} className="text-primary-400" />
                      <Sparkles size={40} className="text-yellow-400" />
                      <Trophy size={40} className="text-primary-400" />
                      <Ticket size={40} className="text-blue-400" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="static"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-white"
                    >
                      {result ? (
                        <div className="relative">
                          {result.rarity === 'legendary' && (
                            <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full animate-pulse" />
                          )}
                          <PrizeIcon prize={result} className="relative" />
                        </div>
                      ) : (
                        <Gift size={48} className="text-gray-700" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Spin Button */}
          <button
            onClick={spin}
            disabled={isSpinning || (userProfile.tokens ?? 0) <= 0}
            className={cn(
              "px-12 py-4 rounded-2xl font-black text-xl shadow-lg transform transition-all active:scale-95",
              isSpinning ? "bg-gray-200 text-gray-400" :
              (userProfile.tokens ?? 0) > 0 ? "bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-1" :
              "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSpinning ? 'GLÜCKSRAD DREHT...' : 'JETZT SPIELEN (1 TOKEN)'}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-500 font-bold">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result Announcement */}
      <AnimatePresence>
        {!isSpinning && result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white border-4 border-yellow-400 p-8 rounded-[2rem] text-center space-y-4 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/10 to-transparent pointer-events-none" />

            <div className="inline-block p-6 bg-yellow-100 rounded-3xl relative mb-2">
              {result.rarity === 'legendary' && (
                <div className="absolute inset-0 bg-yellow-400/40 blur-2xl rounded-full animate-pulse" />
              )}
              <PrizeIcon prize={result} size={64} className="relative" />
            </div>

            <div>
              <motion.h3
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-3xl font-black text-gray-900 uppercase tracking-tighter"
              >
                {result.rarity === 'legendary' ? '✨ LEGENDÄRER GEWINN! ✨' :
                 result.rarity === 'rare' ? '🔥 SELTENER FUND! 🔥' : 'GEWONNEN!'}
              </motion.h3>
              <p className="text-xl text-gray-600 mt-2">
                Du hast <span className="font-extrabold text-primary-600 underline decoration-yellow-400 underline-offset-4">{result.name}</span> erhalten!
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className={cn(
                  "px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2",
                  result.rarity === 'legendary' ? "bg-yellow-400 text-yellow-950 border-yellow-500" :
                  result.rarity === 'rare' ? "bg-blue-500 text-white border-blue-600" :
                  "bg-gray-200 text-gray-700 border-gray-300"
                )}>
                  {result.rarity}
                </span>
              </div>
            </div>
          </motion.div>
        )}
        {!isSpinning && result === null && !error && (
          <div className="text-center text-gray-400 font-medium">
            Viel Glück beim nächsten Mal!
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

