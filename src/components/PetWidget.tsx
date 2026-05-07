import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cat, Bird, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { PRIZES } from '../lib/prizes';

interface PetWidgetProps {
  userProfile: UserProfile;
}

export const PetWidget: React.FC<PetWidgetProps> = ({ userProfile }) => {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  
  if (!userProfile.activeGimmick) return null;

  const gimmick = PRIZES.find(p => p.id === userProfile.activeGimmick);
  if (gimmick?.rarity !== 'legendary') return null;

  const petMessages = {
    Cat: [
      "Miau! Hast du heute schon genug getrunken? Pausen sind wichtig!",
      "Schnurr... Ich glaube, du wirst diese Prüfung mit Leichtigkeit bestehen!",
      "Zeit für ein kurzes Nickerchen? Nur ein kleiner Power-Nap, versprochen!"
    ],
    Bird: [
      "Huhu! Meine weisen Augen sehen, dass du sehr fleißig bist heute!",
      "Wissen ist der Schlüssel zum Erfolg. Lass uns gemeinsam weiterfliegen!",
      "Hast du schon alle Deadlines für diese Woche im Blick? Ich helfe dir!"
    ],
    Cofee: [
      "Hast du Koffein intus? Sonst siehst du aus, als bräuchtest du eins!"
    ]
  }[gimmick.value as 'Cat' | 'Bird'] || ["Lass uns gemeinsam lernen!"];

  const handleHover = () => {
    setMessageIndex((prev) => (prev + 1) % petMessages.length);
    setIsHovered(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="fixed bottom-8 right-8 z-50 group"
      onMouseEnter={handleHover}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />

        {/* Speech Bubble */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-16 right-0 bg-white px-4 py-2 rounded-2xl shadow-xl text-[11px] font-bold text-gray-700 whitespace-nowrap border border-gray-100 z-50 pointer-events-none"
            >
              {petMessages[messageIndex]}
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="p-4 bg-white/80 backdrop-blur-md border-2 border-yellow-400/50 shadow-xl flex flex-col items-center gap-2">
          <div className="relative">
            <Sparkles className="absolute -top-2 -right-2 text-yellow-500 animate-spin" size={16} />
            {gimmick.value === 'Cat' ? (
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 2, -2, 0],
                  scaleX: [1, 1.05, 1]
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="rotate-[-10deg] skew-x-[-5deg]"
              >
                <Cat size={64} className="text-orange-400 drop-shadow-md" />
              </motion.div>
            ) : (
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  x: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Bird size={64} className="text-blue-400 drop-shadow-md" />
              </motion.div>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{gimmick.name}</p>
            <p className="text-[10px] text-yellow-600 font-bold">LEGENDÄR</p>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

// Internal Card to avoid prop drilling / complex imports if needed
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);
