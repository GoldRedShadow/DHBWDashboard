import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cat,
  Bird,
  Sparkles,
  Dog,
  Flame,
  Sun,
  Coffee,
  Bot,
  BookOpen,
  Fish,
  Moon,
  Zap,
  Gem,
  Users,
  Maximize2
} from 'lucide-react';
import { UserProfile, Class, AcademicEvent } from '../types';
import { PRIZES } from '../lib/prizes';
import { cn } from '../lib/utils';

interface PetWidgetProps {
  userProfile: UserProfile;
  classes?: Class[];
  events?: AcademicEvent[];
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
      "Ich hab deine Hausaufgabe NICHT gefressen. Ehrenwort!"
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
  },
  // --- NEW RARE GIMMICKS ---
  Bot: {
    icon: Bot,
    color: "text-cyan-400",
    messages: [
      "01001000 01100101 01101100 01101100 01101111! Du machst das super!",
      "System-Check: Motivation bei 100%. Weiter so!",
      "Du bist effizienter als mein neuester Algorithmus."
    ]
  },
  ReadingOwl: {
    icon: BookOpen,
    color: "text-indigo-500",
    messages: [
      "In Büchern liegen Schätze. Lass uns graben!",
      "Noch eine Seite, dann ist Pause.",
      "Wissen ist die einzige Ressource, die sich vermehrt, wenn man sie teilt."
    ]
  },
  ZenFish: {
    icon: Fish,
    color: "text-blue-300",
    messages: [
      "Blubb... Bleib ganz ruhig.",
      "Atme ein, atme aus. Die Antwort kommt von selbst.",
      "Schwimme mit dem Strom des Wissens."
    ]
  },
  MoonSpirit: {
    icon: Moon,
    color: "text-slate-300",
    messages: [
      "Die Nacht ist jung, dein Geist ist wach.",
      "Sanftes Licht für tiefe Gedanken.",
      "Ich wachse mit jedem deiner Erfolge."
    ]
  },
  // --- NEW LEGENDARY GIMMICKS ---
  Phoenix: {
    icon: Zap,
    color: "text-orange-600",
    messages: [
      "Aus der Asche der Erschöpfung erhebe ich mich!",
      "Jede Pause ist ein Neuanfang.",
      "Dein Wille ist unbesiegbar!"
    ],
    animation: {
      scale: [1, 1.3, 1],
      opacity: [0.7, 1, 0.7],
      y: [0, -10, 0]
    }
  },
  Golem: {
    icon: Gem,
    color: "text-emerald-500",
    messages: [
      "Stein für Stein zum Erfolg.",
      "Meine Kraft wächst mit deiner Konzentration.",
      "Unerschütterlich wie ein Fels."
    ],
    animation: {
      scale: [1, 1.05, 1],
      x: [-2, 2, -2]
    }
  },
  Twin: {
    icon: Users,
    color: "text-rose-400",
    messages: [
      "Ich bin dein bestes Ich. Lass uns dorthin gelangen!",
      "Du bist nicht allein. Ich lerne mit dir.",
      "Parallel zum Erfolg!"
    ],
    animation: {
      x: [0, 5, 0],
      filter: ["hue-rotate(0deg)", "hue-rotate(45deg)", "hue-rotate(0deg)"]
    }
  },
  Mirror: {
    icon: Maximize2,
    color: "text-sky-400",
    messages: [
      "Sieh dir an, was du heute schon geschafft hast!",
      "Ein Spiegelbild deiner harten Arbeit.",
      "Reflektiere deine Ziele."
    ],
    animation: {
      rotateY: [0, 180, 360],
      scale: [1, 1.1, 1]
    }
  }
};

export const PetWidget: React.FC<PetWidgetProps> = ({ userProfile, classes = [], events = [] }) => {
  const [messageIndex, setMessageIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  if (!userProfile.activeGimmick) return null;

  const gimmick = PRIZES.find(p => p.id === userProfile.activeGimmick);
  if (!gimmick) return null;

  const isLegendary = gimmick.rarity === 'legendary';
  const isRare = gimmick.rarity === 'rare';

  if (!isLegendary && !isRare) return null;

  const config = PET_CONFIG[gimmick.value as keyof typeof PET_CONFIG] || {
    icon: Sparkles,
    color: "text-yellow-500",
    messages: ["Lass uns gemeinsam lernen!"]
  };

  const Icon = config.icon;

  const handleHover = () => {
    if (isLegendary) {
      setMessageIndex((prev) => (prev + 1) % config.messages.length);
    }
    setIsHovered(true);
  };

  // --- Growth Logic ---
  const dynamicScale = React.useMemo(() => {
    if (gimmick.value === 'MoonSpirit') {
      return 1 + Math.min(events.length * 0.1, 0.5);
    } else if (gimmick.value === 'Golem') {
      return 1 + Math.min(classes.length * 0.05, 0.4);
    }
    return 1;
  }, [gimmick.value, events.length, classes.length]);

  const animationProps = React.useMemo(() => {
    const baseAnim = isLegendary ? (config.animation || {}) : {};
    const finalAnim = { ...baseAnim };

    // Scale handling to combine growth + animations for scale, scaleX, and scaleY
    let scaleModified = false;
    ['scale', 'scaleX', 'scaleY'].forEach(key => {
      const val = (finalAnim as any)[key];
      if (val !== undefined) {
        scaleModified = true;
        if (Array.isArray(val)) {
          (finalAnim as any)[key] = val.map((s: number) => s * dynamicScale);
        } else if (typeof val === 'number') {
          (finalAnim as any)[key] = val * dynamicScale;
        }
      }
    });

    // If no scale animation exists but we have growth, apply it
    if (!scaleModified && dynamicScale !== 1) {
      finalAnim.scale = dynamicScale;
    }

    return finalAnim;
  }, [isLegendary, config.animation, dynamicScale]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="fixed bottom-8 right-8 z-50 group"
      onMouseEnter={handleHover}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Glow Effect for Legendary */}
        {isLegendary && (
          <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
        )}

        {/* Speech Bubble (Legendary only) */}
        <AnimatePresence>
          {isHovered && isLegendary && (
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

        <Card className={cn(
          "p-4 backdrop-blur-md shadow-xl flex flex-col items-center gap-2 transition-all",
          isLegendary ? "bg-white/80 border-2 border-yellow-400/50" : "bg-white/60 border border-gray-200/50"
        )}>
          <div className="relative">
            {isLegendary && (
              <Sparkles className="absolute -top-2 -right-2 text-yellow-500 animate-spin" size={16} />
            )}
            <motion.div
              animate={animationProps}
              transition={{ repeat: Infinity, duration: 4 }}
              className={cn(gimmick.value === 'Cat' && "rotate-[-10deg] skew-x-[-5deg]")}
            >
              <Icon size={isLegendary ? 64 : 48} className={cn(config.color, "drop-shadow-md")} />
            </motion.div>
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-gray-900 uppercase tracking-tighter">{gimmick.name}</p>
            <p className={cn(
              "text-[10px] font-bold uppercase",
              isLegendary ? "text-yellow-600" : "text-blue-500"
            )}>
              {isLegendary ? 'LEGENDÄR' : 'RARE'}
            </p>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

// Internal Card to avoid prop drilling / complex imports if needed
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);
