import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cat, Bird, Sparkles, Dog, Flame, Sun, Coffee } from 'lucide-react';
import { UserProfile } from '../types';
import { PRIZES } from '../lib/prizes';
import { cn } from '../lib/utils';

interface PetWidgetProps {
  userProfile: UserProfile;
}

export const PET_CONFIG: Record<string, {
  icon: any;
  color: string;
  messages: string[];
  animation?: any;
}> = {
  Cat: {
    icon: Cat,
    color: "text-orange-400",
    messages: [
      "Miau! Hast du heute schon genug getrunken? Pausen sind wichtig!",
      "Schnurr... Ich glaube, du wirst diese Prüfung mit Leichtigkeit bestehen!",
      "Zeit für ein kurzes Nickerchen? Nur ein kleiner Power-Nap, versprochen!"
    ],
    animation: {
      y: [0, -5, 0],
      rotate: [0, 2, -2, 0],
      scaleX: [1, 1.05, 1]
    }
  },
  Bird: {
    icon: Bird,
    color: "text-blue-400",
    messages: [
      "Huhu! Meine weisen Augen sehen, dass du sehr fleißig bist heute!",
      "Wissen ist der Schlüssel zum Erfolg. Lass uns gemeinsam weiterfliegen!",
      "Hast du schon alle Deadlines für diese Woche im Blick? Ich helfe dir!"
    ],
    animation: {
      y: [0, -15, 0],
      x: [0, 5, -5, 0]
    }
  },
  Dog: {
    icon: Dog,
    color: "text-amber-700",
    messages: [
      "Wuff! Du bist mein absoluter Lieblings-Student!",
      "Stöckchen holen? Nein, lieber gute Noten holen! Los geht's!",
      "Ich hab dein Hausaufgabe NICHT gefressen. Ehrenwort!"
    ],
    animation: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0]
    }
  },
  Flame: {
    icon: Flame,
    color: "text-red-500",
    messages: [
      "Brennst du schon für dein Studium? Oder soll ich nachhelfen?",
      "Prokrastination ist mein Lieblingsessen. Ich hab Hunger!",
      "Heißer Tipp: Fang jetzt an zu lernen!"
    ],
    animation: {
      scale: [1, 1.2, 1],
      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
    }
  },
  Sun: {
    icon: Sun,
    color: "text-yellow-500",
    messages: [
      "Du strahlst heute heller als ich!",
      "Lass dich nicht hängen, nach der Vorlesung kommt der Feierabend!",
      "Ein sonniger Tag beginnt mit einem guten Plan."
    ],
    animation: {
      rotate: [0, 360],
      scale: [1, 1.1, 1]
    }
  },
  Coffee: {
    icon: Coffee,
    color: "text-amber-900",
    messages: [
      "Kaffee läuft, Gehirn läuft! Alles im grünen Bereich.",
      "Noch ein Schluck Erfolg, bitte!",
      "Wach und bereit für alles!"
    ]
  }
};

export const PetWidget: React.FC<PetWidgetProps> = ({ userProfile }) => {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  if (!userProfile.activeGimmick) return null;

  const gimmick = PRIZES.find(p => p.id === userProfile.activeGimmick);
  if (gimmick?.rarity !== 'legendary') return null;

  const config = PET_CONFIG[gimmick.value as keyof typeof PET_CONFIG] || {
    icon: Sparkles,
    color: "text-yellow-500",
    messages: ["Lass uns gemeinsam lernen!"]
  };

  const Icon = config.icon;

  const handleHover = () => {
    setMessageIndex((prev) => (prev + 1) % config.messages.length);
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
              {config.messages[messageIndex]}
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="p-4 bg-white/80 backdrop-blur-md border-2 border-yellow-400/50 shadow-xl flex flex-col items-center gap-2">
          <div className="relative">
            <Sparkles className="absolute -top-2 -right-2 text-yellow-500 animate-spin" size={16} />
            <motion.div
              animate={config.animation}
              transition={{ repeat: Infinity, duration: 4 }}
              className={cn(gimmick.value === 'Cat' && "rotate-[-10deg] skew-x-[-5deg]")}
            >
              <Icon size={64} className={cn(config.color, "drop-shadow-md")} />
            </motion.div>
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
