import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, AlertCircle, Sparkles, Trophy, Ticket } from 'lucide-react';
import { Prize, UserProfile } from '../types';
import { PRIZES, getPrizesByRarity } from '../lib/prizes';
import { db, doc, updateDoc, arrayUnion, increment } from '../firebase';
import { cn } from '../lib/utils';

interface SlotMachineProps {
  userProfile: UserProfile;
}

const RARITY_CHANCES = {
  legendary: 0.01,
  rare: 0.05,
  common: 0.15
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

    if (rand < RARITY_CHANCES.legendary) {
      const prizes = getPrizesByRarity('legendary');
      wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
    } else if (rand < RARITY_CHANCES.legendary + RARITY_CHANCES.rare) {
      const prizes = getPrizesByRarity('rare');
      wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
    } else if (rand < RARITY_CHANCES.legendary + RARITY_CHANCES.rare + RARITY_CHANCES.common) {
      const prizes = getPrizesByRarity('common');
      wonPrize = prizes[Math.floor(Math.random() * prizes.length)];
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
                        result.rarity === 'legendary' ? <Trophy size={48} className="text-yellow-400" /> :
                        result.rarity === 'rare' ? <Sparkles size={48} className="text-blue-400" /> :
                        <Gift size={48} className="text-primary-400" />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl text-center space-y-4"
          >
            <div className="inline-block p-3 bg-yellow-100 rounded-full">
              <Trophy size={32} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">GEWONNEN!</h3>
              <p className="text-gray-600">Du hast <span className="font-bold text-primary-600">{result.name}</span> erhalten!</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Seltenheit: {result.rarity}</p>
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

