/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  where,
  updateDoc
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getDocFromServer } from 'firebase/firestore';
import { Class, AcademicEvent, UserProfile, QuickLink } from './types';
import { seedData } from './seed';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  differenceInDays
} from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  LogOut, 
  LogIn, 
  Settings, 
  LayoutDashboard, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Timer,
  Edit2,
  Move,
  X,
  Menu,
  ExternalLink,
  Link as LinkIcon,
  Globe,
  Book,
  GraduationCap,
  Mail,
  LifeBuoy
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className, 
  disabled,
  type = 'button',
  ...props
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  [key: string]: any;
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-500 hover:bg-gray-100'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden', className)} {...props}>
    {children}
  </div>
);

const Input = ({ 
  label, 
  ...props 
}: { 
  label: string; 
  [key: string]: any 
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
    />
  </div>
);

const Select = ({ 
  label, 
  options, 
  ...props 
}: { 
  label: string; 
  options: { value: string; label: string }[]; 
  [key: string]: any 
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't throw here to avoid crashing the whole app, but we log it clearly.
}

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [view, setView] = useState<'dashboard' | 'calendar' | 'deadlines' | 'links' | 'admin' | 'modules'>('dashboard');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<number>(4);
  const [dashboardMode, setDashboardMode] = useState<'day' | 'week'>('day');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');
  const [adminView, setAdminView] = useState<'forms' | 'calendar' | 'links'>('calendar');
  const [adminCalendarDate, setAdminCalendarDate] = useState(new Date());
  const [editingItem, setEditingItem] = useState<{ type: 'class' | 'event' | 'link', data: any } | null>(null);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isAdminUser = useMemo(() => {
    return user?.email === 'lukas.spraul@gmail.com' || userProfile?.role === 'admin';
  }, [user, userProfile]);

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // User Profile Listener
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userDoc = doc(db, 'users', user.uid);
    setProfileLoading(true);
    const unsubscribe = onSnapshot(userDoc, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      } else {
        // Default to student if not exists
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          role: user.email === 'lukas.spraul@gmail.com' ? 'admin' : 'student'
        };
        setDoc(userDoc, newProfile).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
        setUserProfile(newProfile);
      }
      setProfileLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      setProfileLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Data Listeners
  useEffect(() => {
    const qClasses = query(collection(db, 'classes'), orderBy('startTime'));
    const unsubscribeClasses = onSnapshot(qClasses, (snapshot) => {
      setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Class)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });

    const qEvents = query(collection(db, 'events'), orderBy('dueDate'));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AcademicEvent)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });

    const qLinks = query(collection(db, 'quickLinks'), orderBy('category'));
    const unsubscribeLinks = onSnapshot(qLinks, (snapshot) => {
      setQuickLinks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuickLink)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quickLinks');
    });

    return () => {
      unsubscribeClasses();
      unsubscribeEvents();
      unsubscribeLinks();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await seedData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 5000);
    } catch (err) {
      console.error('Seeding failed', err);
    } finally {
      setSeeding(false);
    }
  };

  // --- Live Clock ---
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Dashboard Logic ---

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [selectedDate]);

  const filteredClasses = useMemo(() => {
    const dayName = format(selectedDate, 'EEEE', { locale: de });
    const dateStr = format(selectedDate, 'yyyy-MM-dd', { locale: de });
    return classes
      .filter(c => !c.semester || c.semester === selectedSemester)
      .filter(c => {
        if (c.date) {
          return c.date === dateStr;
        }
        return c.day === dayName;
      });
  }, [classes, selectedDate, selectedSemester]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => !e.semester || e.semester === selectedSemester)
      .filter(e => isSameDay(parseISO(e.dueDate), selectedDate));
  }, [events, selectedDate, selectedSemester]);

  const upcomingDeadlines = useMemo(() => {
    const today = startOfDay(new Date());
    const twoWeeksLater = addDays(today, 14);
    return events
      .filter(e => !e.semester || e.semester === selectedSemester)
      .filter(e => {
        const dueDate = parseISO(e.dueDate);
        return dueDate >= today && dueDate <= twoWeeksLater;
      })
      .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());
  }, [events, selectedSemester]);

  // --- Next/Current Lesson (looks across all days) ---
  const nextOrCurrentLesson = useMemo(() => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const todayDayName = format(now, 'EEEE', { locale: de });
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const deDayIndex: Record<string, number> = {
      'Sonntag': 0, 'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3,
      'Donnerstag': 4, 'Freitag': 5, 'Samstag': 6
    };

    const getNextOccurrence = (c: Class): Date | null => {
      if (c.date) {
        // Specific-date class
        if (c.date < todayStr) return null; // past
        if (c.date === todayStr && toMinutes(c.endTime) <= nowMinutes) return null; // ended today
        const d = parseISO(c.date);
        const [h, m] = c.startTime.split(':').map(Number);
        d.setHours(h, m, 0, 0);
        return d;
      } else {
        // Recurring weekday class
        if (c.day === todayDayName) {
          if (toMinutes(c.endTime) > nowMinutes) {
            // Still has time today
            const d = startOfDay(now);
            const [h, m] = c.startTime.split(':').map(Number);
            d.setHours(h, m, 0, 0);
            return d;
          }
          // Already ended today — next occurrence is in 7 days
          const d = addDays(startOfDay(now), 7);
          const [h, m] = c.startTime.split(':').map(Number);
          d.setHours(h, m, 0, 0);
          return d;
        } else {
          const targetIdx = deDayIndex[c.day] ?? -1;
          if (targetIdx === -1) return null;
          const todayIdx = now.getDay();
          const daysUntil = ((targetIdx - todayIdx + 7) % 7) || 7;
          const d = addDays(startOfDay(now), daysUntil);
          const [h, m] = c.startTime.split(':').map(Number);
          d.setHours(h, m, 0, 0);
          return d;
        }
      }
    };

    const withDates = classes
      .map(c => ({ lesson: c, nextDate: getNextOccurrence(c) }))
      .filter((item): item is { lesson: Class; nextDate: Date } => item.nextDate !== null)
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    return withDates[0] ?? null;
  }, [classes, now]);

  const lessonStatus = useMemo(() => {
    if (!nextOrCurrentLesson) return null;
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const todayStr = format(now, 'yyyy-MM-dd');
    const lessonDateStr = format(nextOrCurrentLesson.nextDate, 'yyyy-MM-dd');
    const isToday = lessonDateStr === todayStr;

    if (isToday) {
      const startMin = toMinutes(nextOrCurrentLesson.lesson.startTime);
      const endMin = toMinutes(nextOrCurrentLesson.lesson.endTime);
      if (nowMinutes >= startMin) {
        return { running: true, isToday: true as const, minutes: endMin - nowMinutes };
      }
      const until = startMin - nowMinutes;
      return { running: false, isToday: true as const, minutes: until };
    }
    return { running: false, isToday: false as const, nextDate: nextOrCurrentLesson.nextDate };
  }, [nextOrCurrentLesson, now]);

  const moduleGroups = useMemo(() => {
    const groups: Record<string, {
      name: string;
      instructor: string;
      lessons: Class[];
      events: AcademicEvent[];
    }> = {};

    classes
      .filter(c => !c.semester || c.semester === selectedSemester)
      .forEach(c => {
      // Split by colon to get the base module name
      const moduleName = c.name.split(':')[0].trim();
      
      if (!groups[moduleName]) {
        groups[moduleName] = {
          name: moduleName,
          instructor: c.instructor,
          lessons: [],
          events: []
        };
      }
      groups[moduleName].lessons.push(c);
      // Update instructor if it's currently empty or specifically set
      if (!groups[moduleName].instructor && c.instructor) {
        groups[moduleName].instructor = c.instructor;
      }
    });

    // Match events to modules
    events.forEach(e => {
      // Try to find a module that matches the event title or courseId
      const matchedModule = Object.keys(groups).find(moduleName => 
        e.title.toLowerCase().includes(moduleName.toLowerCase()) || 
        (e.description && e.description.toLowerCase().includes(moduleName.toLowerCase()))
      );
      
      if (matchedModule) {
        groups[matchedModule].events.push(e);
      }
    });

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, events, selectedSemester]);

  // --- Admin Logic ---

  const [newClass, setNewClass] = useState<Partial<Class>>({
    instructor: '',
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    semester: 4,
  });

  const [newEvent, setNewEvent] = useState<Partial<AcademicEvent>>({
    title: '',
    type: 'Assignment',
    dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: '',
    semester: 4,
  });

  const [newLink, setNewLink] = useState<Partial<QuickLink>>({
    category: 'General',
    icon: 'Globe'
  });

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name || !newClass.startTime || !newClass.endTime) return;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'classes', id), { ...newClass, id });
      setNewClass({ day: 'Monday', startTime: '08:00', endTime: '10:00', date: '', semester: selectedSemester, instructor: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${id}`);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.dueDate) return;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'events', id), { ...newEvent, id });
      setNewEvent({ type: 'Assignment', dueDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), description: '', semester: selectedSemester });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `events/${id}`);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'quickLinks', id), { ...newLink, id });
      setNewLink({ category: 'General', icon: 'Globe' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quickLinks/${id}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'quickLinks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `quickLinks/${id}`);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { type, data } = editingItem;
    try {
      const collectionName = type === 'class' ? 'classes' : type === 'event' ? 'events' : 'quickLinks';
      const docRef = doc(db, collectionName, data.id);
      await updateDoc(docRef, data);
      setEditingItem(null);
    } catch (err) {
      const collectionName = type === 'class' ? 'classes' : type === 'event' ? 'events' : 'quickLinks';
      handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${data.id}`);
    }
  };

  const onDragStart = (e: React.DragEvent, item: any, type: 'class' | 'event') => {
    e.dataTransfer.setData('item', JSON.stringify(item));
    e.dataTransfer.setData('type', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const itemStr = e.dataTransfer.getData('item');
    const type = e.dataTransfer.getData('type') as 'class' | 'event';
    if (!itemStr) return;
    
    const item = JSON.parse(itemStr);

    try {
      const docRef = doc(db, type === 'class' ? 'classes' : 'events', item.id);
      if (type === 'class') {
        if (item.date) {
          await updateDoc(docRef, { date: format(targetDate, 'yyyy-MM-dd', { locale: de }) });
        } else {
          await updateDoc(docRef, { day: format(targetDate, 'EEEE', { locale: de }) });
        }
      } else {
        const oldDate = parseISO(item.dueDate);
        const newDate = new Date(targetDate);
        newDate.setHours(oldDate.getHours());
        newDate.setMinutes(oldDate.getMinutes());
        await updateDoc(docRef, { dueDate: newDate.toISOString() });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${type === 'class' ? 'classes' : 'events'}/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-600">
            <LayoutDashboard size={24} />
            <span className="font-bold text-xl tracking-tight">Uni Dashboard</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button 
              variant={view === 'dashboard' ? 'primary' : 'ghost'} 
              onClick={() => setView('dashboard')}
              className="px-3 py-1.5 text-sm"
            >
              Dashboard
            </Button>
            <Button 
              variant={view === 'calendar' ? 'primary' : 'ghost'} 
              onClick={() => setView('calendar')}
              className="px-3 py-1.5 text-sm"
            >
              Kalender
            </Button>
            <Button 
              variant={view === 'deadlines' ? 'primary' : 'ghost'} 
              onClick={() => setView('deadlines')}
              className="px-3 py-1.5 text-sm"
            >
              Deadlines
            </Button>
            <Button 
              variant={view === 'modules' ? 'primary' : 'ghost'} 
              onClick={() => setView('modules')}
              className="px-3 py-1.5 text-sm"
            >
              Module
            </Button>
            <Button 
              variant={view === 'links' ? 'primary' : 'ghost'} 
              onClick={() => setView('links')}
              className="px-3 py-1.5 text-sm"
            >
              Links
            </Button>
            <Button 
              variant={view === 'admin' ? 'primary' : 'ghost'} 
              onClick={() => setView('admin')}
              className="px-3 py-1.5 text-sm"
            >
              Admin-Bereich
            </Button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-900">{user.displayName}</span>
                  <span className="text-xs text-gray-500 capitalize">{userProfile?.role}</span>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="p-2">
                  <LogOut size={20} />
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={handleLogin} className="text-sm hidden md:flex">
                <LogIn size={18} />
                Admin Login
              </Button>
            )}
            
            {/* Burger Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed top-0 right-0 bottom-0 w-64 bg-white z-50 md:hidden shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-600">
                    <LayoutDashboard size={20} />
                    <span className="font-bold text-lg">Menu</span>
                  </div>
                  <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-2 overflow-y-auto">
                  {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'calendar', label: 'Kalender' },
                    { id: 'deadlines', label: 'Deadlines' },
                    { id: 'modules', label: 'Module' },
                    { id: 'links', label: 'Links' },
                    { id: 'admin', label: 'Admin-Bereich' }
                  ].map((navItem) => (
                    <Button 
                      key={navItem.id}
                      variant={view === navItem.id ? 'primary' : 'ghost'} 
                      onClick={() => {
                        setView(navItem.id as any);
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start px-4 py-3 text-base"
                    >
                      {navItem.label}
                    </Button>
                  ))}
                  
                  {user && (
                    <div className="pt-4 mt-4 border-t border-gray-100 sm:hidden">
                      <div className="px-4 py-2">
                        <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500 capitalize">{userProfile?.role}</p>
                      </div>
                      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start px-4 py-3 text-red-600 hover:bg-red-50">
                        <LogOut size={20} className="mr-2" />
                        Abmelden
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left: Calendar & Schedule */}
              <div className="lg:col-span-8 space-y-6">
                {/* Week Selector */}
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={20} className="text-primary-600" />
                      <h2 className="font-bold text-lg">
                        {dashboardMode === 'day' ? format(selectedDate, 'MMMM yyyy', { locale: de }) : `Woche vom ${format(weekDays[0], 'do MMM', { locale: de })}`}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setDashboardMode('day')}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded-md transition-all",
                          dashboardMode === 'day' ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Tag
                      </button>
                      <button 
                        onClick={() => setDashboardMode('week')}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded-md transition-all",
                          dashboardMode === 'week' ? "bg-white text-primary-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Woche
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setSelectedDate(addDays(selectedDate, dashboardMode === 'day' ? -1 : -7))} className="p-2">
                        <ChevronLeft size={18} />
                      </Button>
                      <Button variant="secondary" onClick={() => setSelectedDate(new Date())} className="text-xs">
                        Heute
                      </Button>
                      <Button variant="secondary" onClick={() => setSelectedDate(addDays(selectedDate, dashboardMode === 'day' ? 1 : 7))} className="p-2">
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </div>
                  {dashboardMode === 'day' && (
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day, i) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              'flex flex-col items-center p-2 rounded-xl transition-all',
                              isSelected ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600',
                              isToday && !isSelected && 'text-primary-600 font-bold'
                            )}
                          >
                            <span className="text-xs uppercase font-medium">{format(day, 'EEE', { locale: de })}</span>
                            <span className="text-lg font-bold">{format(day, 'd', { locale: de })}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>

                {/* Daily or Weekly Schedule */}
                <div className="space-y-4">
                  {dashboardMode === 'day' ? (
                    <>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock size={18} className="text-primary-600" />
                        Stundenplan für {format(selectedDate, 'EEEE, do MMM', { locale: de })}
                      </h3>
                      
                      {filteredClasses.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                          <p className="text-gray-500">Heute finden keine Vorlesungen statt.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredClasses.map(c => (
                            <Card key={c.id} className="p-4 flex items-center justify-between hover:border-primary-200 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-16 text-center">
                                  <span className="text-sm font-bold text-primary-600">{c.startTime}</span>
                                  <div className="h-4 w-px bg-gray-200 mx-auto my-1" />
                                  <span className="text-xs text-gray-400">{c.endTime}</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{c.name}</h4>
                                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><MapPin size={14} /> {c.room}</span>
                                    <span className="flex items-center gap-1"><UserIcon size={14} /> {c.instructor}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-10 w-1 bg-primary-600 rounded-full" />
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-8">
                      {weekDays.map((day, idx) => {
                        const dayName = format(day, 'EEEE', { locale: de });
                        const dateStr = format(day, 'yyyy-MM-dd', { locale: de });
                        const dayClasses = classes.filter(c => {
                          if (c.date) return c.date === dateStr;
                          return c.day === dayName;
                        });
                        const dayEvents = events.filter(e => isSameDay(parseISO(e.dueDate), day));
                        const isToday = isSameDay(day, new Date());

                        return (
                          <div key={idx} className="space-y-4">
                            <div className={cn(
                              "flex items-center gap-2 pb-2 border-b-2",
                              isToday ? "border-primary-600" : "border-gray-100"
                            )}>
                              <span className={cn(
                                "font-bold text-lg",
                                isToday ? "text-primary-600" : "text-gray-900"
                              )}>
                                {format(day, 'EEEE, do MMM', { locale: de })}
                              </span>
                              {isToday && <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Heute</span>}
                            </div>
                            
                            {dayClasses.length === 0 && dayEvents.length === 0 ? (
                              <div className="py-4 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                                <p className="text-sm text-gray-400">Keine Termine geplant</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {dayClasses.map(c => (
                                  <Card key={c.id} className="p-4 flex items-center justify-between hover:border-primary-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 text-center">
                                        <span className="text-sm font-bold text-primary-600">{c.startTime}</span>
                                        <div className="h-4 w-px bg-gray-200 mx-auto my-1" />
                                        <span className="text-xs text-gray-400">{c.endTime}</span>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-gray-900">{c.name}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                          <span className="flex items-center gap-1"><MapPin size={14} /> {c.room}</span>
                                          <span className="flex items-center gap-1"><UserIcon size={14} /> {c.instructor}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="h-10 w-1 bg-primary-600 rounded-full" />
                                  </Card>
                                ))}
                                {dayEvents.map(e => (
                                  <Card key={e.id} className="p-4 flex items-center justify-between border-l-4 border-l-red-500 hover:border-red-200 transition-colors bg-red-50/30">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 text-center">
                                        <AlertCircle size={18} className="text-red-500 mx-auto mb-1" />
                                        <span className="text-xs font-bold text-red-600">{format(parseISO(e.dueDate), 'HH:mm', { locale: de })}</span>
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className={cn(
                                            'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full',
                                            e.type === 'Exam' ? 'bg-red-100 text-red-600' :
                                            e.type === 'Assignment' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                          )}>
                                            {e.type}
                                          </span>
                                          <h4 className="font-bold text-gray-900">{e.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{e.description}</p>
                                      </div>
                                    </div>
                                    <div className="h-10 w-1 bg-red-500 rounded-full" />
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Next Lesson + Events & Deadlines */}
              <div className="lg:col-span-4 space-y-6">

                {/* Next / Current Lesson Card */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Clock size={18} className="text-primary-600" />
                    {lessonStatus?.running ? 'Aktuelle Vorlesung' : 'Nächste Vorlesung'}
                  </h3>
                  {nextOrCurrentLesson && lessonStatus ? (() => {
                    const lesson = nextOrCurrentLesson.lesson;
                    return (
                      <Card className={`p-4 border-l-4 ${
                        lessonStatus.running
                          ? 'border-l-green-500 bg-green-50/40'
                          : !lessonStatus.isToday
                            ? 'border-l-gray-400 bg-gray-50/60'
                            : 'border-l-primary-500 bg-primary-50/40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            lessonStatus.running
                              ? 'bg-green-100 text-green-700'
                              : !lessonStatus.isToday
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-primary-100 text-primary-700'
                          }`}>
                            {lessonStatus.running ? '● Läuft gerade' : !lessonStatus.isToday ? 'Demnächst' : 'Kommt bald'}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-gray-500">
                            <Timer size={13} />
                            {lessonStatus.running
                              ? `Noch ${lessonStatus.minutes} Min.`
                              : lessonStatus.isToday
                                ? lessonStatus.minutes < 60
                                  ? `In ${lessonStatus.minutes} Min.`
                                  : `In ${Math.floor(lessonStatus.minutes / 60)}h ${lessonStatus.minutes % 60}m`
                                : format(lessonStatus.nextDate, 'EEE, do MMM', { locale: de })
                            }
                          </div>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">{lesson.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {lesson.startTime} – {lesson.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={13} />
                            {lesson.room}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{lesson.instructor}</p>
                      </Card>
                    );
                  })() : (
                    <Card className="p-6 text-center">
                      <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Keine Vorlesungen geplant.</p>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle size={18} className="text-red-500" />
                    Deadlines (Nächste 2 Wochen)
                  </h3>
                  
                  {upcomingDeadlines.length === 0 ? (
                    <Card className="p-6 text-center">
                      <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Keine Deadlines in den nächsten 2 Wochen! Entspann dich.</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {upcomingDeadlines.map(e => {
                        const semesterStart = new Date(2026, 3, 1);
                        const dueDate = parseISO(e.dueDate);
                        const daysLeft = differenceInDays(dueDate, startOfDay(new Date()));
                        const totalDuration = Math.max(1, differenceInDays(dueDate, semesterStart));
                        const percentLeft = (daysLeft / totalDuration) * 100;

                        let statusColor = "text-primary-600";
                        let bgColor = "bg-white";
                        let borderColor = "border-gray-200";

                        if (percentLeft <= 20) {
                          statusColor = "text-red-600";
                          bgColor = "bg-red-50/40";
                          borderColor = "border-red-200";
                        } else if (percentLeft <= 50) {
                          statusColor = "text-amber-600";
                          bgColor = "bg-amber-50/40";
                          borderColor = "border-amber-200";
                        } else {
                          statusColor = "text-green-600";
                          bgColor = "bg-green-50/40";
                          borderColor = "border-green-200";
                        }

                        return (
                          <Card key={e.id} className={cn("p-4 border-l-4", bgColor, borderColor)}>
                            <div className="flex justify-between items-start">
                              <span className={cn(
                                'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-2 inline-block',
                                e.type === 'Exam' ? 'bg-red-100 text-red-600' :
                                e.type === 'Assignment' ? 'bg-blue-100 text-blue-600' :
                                'bg-gray-100 text-gray-600'
                              )}>
                                {e.type}
                              </span>
                              <span className={cn("text-xs font-bold", statusColor)}>noch {daysLeft} T.</span>
                            </div>
                            <h4 className="font-bold text-gray-900">{e.title}</h4>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">{format(parseISO(e.dueDate), 'MMM do', { locale: de })}</span>
                              <span className="text-xs text-gray-400">{format(parseISO(e.dueDate), 'HH:mm', { locale: de })}</span>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CalendarIcon size={24} className="text-primary-600" />
                  {calendarViewMode === 'month' ? 'Monatsübersicht' : 'Wochenplan'}
                </h2>
                <div className="flex items-center gap-3">
                  {/* View toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setCalendarViewMode('month')}
                      className={cn(
                        'px-3 py-1 text-xs font-bold rounded-md transition-all',
                        calendarViewMode === 'month' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Monat
                    </button>
                    <button
                      onClick={() => setCalendarViewMode('week')}
                      className={cn(
                        'px-3 py-1 text-xs font-bold rounded-md transition-all',
                        calendarViewMode === 'week' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      Woche
                    </button>
                  </div>
                  {/* Navigation */}
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setSelectedDate(
                      calendarViewMode === 'month' ? addMonths(selectedDate, -1) : addDays(selectedDate, -7)
                    )} className="p-2">
                      <ChevronLeft size={18} />
                    </Button>
                    <Button variant="secondary" onClick={() => setSelectedDate(new Date())} className="text-sm">
                      Heute
                    </Button>
                    <Button variant="secondary" onClick={() => setSelectedDate(
                      calendarViewMode === 'month' ? addMonths(selectedDate, 1) : addDays(selectedDate, 7)
                    )} className="p-2">
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {calendarViewMode === 'month' ? (
                <>
                  <Card className="p-0 overflow-hidden bg-white shadow-sm border-gray-200">
                    <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-7">
                      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                      {(() => {
                        const monthStart = startOfMonth(selectedDate);
                        const monthEnd = endOfMonth(monthStart);
                        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                        return calendarDays.map((day, i) => {
                          const isCurrentMonth = isSameMonth(day, monthStart);
                          const isToday = isSameDay(day, new Date());
                          const isSelected = isSameDay(day, selectedDate);
                          const dayName = format(day, 'EEEE', { locale: de });
                          const dateStr = format(day, 'yyyy-MM-dd', { locale: de });
                          
                          const dayClasses = classes.filter(c => {
                            if (c.date) return c.date === dateStr;
                            return c.day === dayName;
                          });
                          const dayEvents = events.filter(e => isSameDay(parseISO(e.dueDate), day));

                          return (
                            <div 
                              key={i}
                              onClick={() => {
                                setSelectedDate(day);
                                setView('dashboard');
                                setDashboardMode('day');
                              }}
                              className={cn(
                                "min-h-[120px] p-2 border-r border-b border-gray-100 transition-all cursor-pointer hover:bg-primary-50/30",
                                !isCurrentMonth && "bg-gray-50/50 opacity-40",
                                isSelected && "bg-primary-50 ring-1 ring-inset ring-primary-200 z-10"
                              )}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={cn(
                                  "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                                  isToday ? "bg-primary-600 text-white" : "text-gray-700"
                                )}>
                                  {format(day, 'd', { locale: de })}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                {dayClasses.slice(0, 3).map(c => (
                                  <div key={c.id} className="text-[10px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded truncate font-medium border border-primary-200">
                                    {c.startTime}-{c.endTime} {c.name}
                                  </div>
                                ))}
                                {dayClasses.length > 3 && (
                                  <div className="text-[9px] text-gray-400 pl-1">+{dayClasses.length - 3} weitere</div>
                                )}
                                {dayEvents.map(e => (
                                  <div key={e.id} className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded truncate font-bold border border-red-200">
                                    {e.title}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </Card>
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-primary-100 border border-primary-200 rounded" />
                      <span>Vorlesung</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
                      <span>Frist / Prüfung</span>
                    </div>
                    <div className="text-gray-400 italic">Tipp: Klicke auf einen Tag für die Detailansicht</div>
                  </div>
                </>
              ) : (() => {
                /* ---- WEEK TIMETABLE VIEW ---- */
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const weekDaysArr = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
                const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

                const HOUR_START = 7;   // 07:00
                const HOUR_END   = 19;  // 20:00
                const TOTAL_HOURS = HOUR_END - HOUR_START;
                const PX_PER_HOUR = 64; // px height per hour slot
                const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

                const toMinutes = (t: string) => {
                  const [h, m] = t.split(':').map(Number);
                  return h * 60 + m;
                };

                const timeLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

                return (
                  <Card className="p-0 overflow-hidden bg-white shadow-sm border-gray-200">
                    <div className="overflow-auto max-h-[calc(100vh-260px)]">
                      {/* Week header - sticky so it stays visible while scrolling vertically */}
                      <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-gray-50" style={{ minWidth: '600px' }}>
                        <div className="flex-none w-[52px] py-3 text-center text-[10px] font-bold text-gray-400 uppercase border-r border-gray-200">
                          KW {format(weekStart, 'w', { locale: de })}
                        </div>
                        {weekDaysArr.map((day, idx) => {
                          const isToday = isSameDay(day, new Date());
                          return (
                            <div key={idx} className={cn(
                              'flex-1 py-3 text-center border-r border-gray-100 last:border-r-0',
                              isToday && 'bg-primary-50'
                            )}>
                              <div className={cn('text-[10px] font-bold uppercase tracking-wider', isToday ? 'text-primary-600' : 'text-gray-500')}>
                                {dayLabels[idx]}
                              </div>
                              <div className={cn(
                                'text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto',
                                isToday ? 'bg-primary-600 text-white' : 'text-gray-700'
                              )}>
                                {format(day, 'd', { locale: de })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Time grid body */}
                      <div className="relative flex" style={{ minWidth: '600px' }}>
                        {/* Time labels column */}
                        <div className="flex-none w-[52px] border-r border-gray-200 relative" style={{ height: GRID_HEIGHT }}>
                          {timeLabels.map(h => (
                            <div
                              key={h}
                              className="absolute w-full flex items-start justify-end pr-2"
                              style={{ top: (h - HOUR_START) * PX_PER_HOUR - 8, height: PX_PER_HOUR }}
                            >
                              <span className="text-[10px] text-gray-400 font-mono leading-none">{String(h).padStart(2,'0')}:00</span>
                            </div>
                          ))}
                        </div>

                        {/* Day columns */}
                        {weekDaysArr.map((day, colIdx) => {
                          const isToday = isSameDay(day, new Date());
                          const dayName = format(day, 'EEEE', { locale: de });
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const dayClasses = classes
                            .filter(c => (c.date ? c.date === dateStr : c.day === dayName))
                            .sort((a, b) => a.startTime.localeCompare(b.startTime));
                          const dayEvents = events.filter(e => isSameDay(parseISO(e.dueDate), day));

                          return (
                            <div
                              key={colIdx}
                              className={cn(
                                'flex-1 relative border-r border-gray-100 last:border-r-0',
                                isToday && 'bg-primary-50/20'
                              )}
                              style={{ height: GRID_HEIGHT }}
                            >
                              {/* Hour grid lines */}
                              {timeLabels.map(h => (
                                <div
                                  key={h}
                                  className="absolute w-full border-t border-gray-100"
                                  style={{ top: (h - HOUR_START) * PX_PER_HOUR }}
                                />
                              ))}

                              {/* Lesson blocks */}
                              {dayClasses.map(c => {
                                const startMin = toMinutes(c.startTime);
                                const endMin   = toMinutes(c.endTime);
                                const top      = ((startMin - HOUR_START * 60) / 60) * PX_PER_HOUR;
                                const height   = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR - 2, 20);

                                return (
                                  <div
                                    key={c.id}
                                    className="absolute left-1 right-1 rounded-md px-1.5 py-1 bg-primary-100 border border-primary-300 text-primary-800 overflow-hidden cursor-default hover:bg-primary-200 transition-colors shadow-sm"
                                    style={{ top: top + 1, height }}
                                    title={`${c.name} (${c.startTime}–${c.endTime})`}
                                  >
                                    <p className="text-[10px] font-bold leading-tight truncate">{c.startTime}–{c.endTime}</p>
                                    <p className="text-[11px] font-semibold leading-tight mt-0.5 line-clamp-2">{c.name}</p>
                                    {height > 50 && <p className="text-[9px] text-primary-600 mt-0.5 truncate">{c.instructor}</p>}
                                    {height > 66 && <p className="text-[9px] text-primary-500 truncate">{c.room}</p>}
                                  </div>
                                );
                              })}

                              {/* Event/deadline dots */}
                              {dayEvents.map(e => {
                                const dueMin = toMinutes(format(parseISO(e.dueDate), 'HH:mm'));
                                const top    = Math.max(0, ((dueMin - HOUR_START * 60) / 60) * PX_PER_HOUR);
                                return (
                                  <div
                                    key={e.id}
                                    className="absolute left-1 right-1 rounded px-1.5 py-0.5 bg-red-100 border border-red-300 text-red-700 text-[9px] font-bold truncate shadow-sm"
                                    style={{ top: Math.min(top, GRID_HEIGHT - 18), height: 16 }}
                                    title={`${e.title} (${e.type})`}
                                  >
                                    ⚠ {e.title}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                );
              })()}
            </motion.div>
          ) : view === 'deadlines' ? (
            <motion.div
              key="deadlines"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Timer size={24} className="text-red-500" />
                  Anstehende Deadlines & Prüfungen
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()).map(e => {
                  const semesterStart = new Date(2026, 3, 1); // April 1st, 2026
                  const dueDate = parseISO(e.dueDate);
                  const daysLeft = differenceInDays(dueDate, startOfDay(new Date()));
                  const totalDuration = Math.max(1, differenceInDays(dueDate, semesterStart));
                  const percentLeft = (daysLeft / totalDuration) * 100;
                  const isPast = daysLeft < 0;

                  let statusColor = "text-primary-600";
                  let bgColor = "bg-white";
                  let borderColor = "border-gray-200";
                  let progressColor = "bg-primary-600";

                  if (isPast) {
                    statusColor = "text-gray-400";
                    bgColor = "bg-gray-50/50";
                    borderColor = "border-gray-100";
                  } else if (percentLeft <= 20) {
                    statusColor = "text-red-600";
                    bgColor = "bg-red-50/40";
                    borderColor = "border-red-200";
                    progressColor = "bg-red-500";
                  } else if (percentLeft <= 50) {
                    statusColor = "text-amber-600";
                    bgColor = "bg-amber-50/40";
                    borderColor = "border-amber-200";
                    progressColor = "bg-amber-500";
                  } else {
                    statusColor = "text-green-600";
                    bgColor = "bg-green-50/40";
                    borderColor = "border-green-200";
                    progressColor = "bg-green-500";
                  }

                  return (
                    <Card key={e.id} className={cn(
                      "p-6 flex flex-col justify-between h-full transition-all hover:shadow-md border-2",
                      bgColor,
                      borderColor,
                      isPast && "opacity-60 grayscale"
                    )}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={cn(
                            'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full',
                            e.type === 'Exam' ? 'bg-red-100 text-red-600' :
                            e.type === 'Assignment' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {e.type}
                          </span>
                          <div className={cn(
                            "text-2xl font-black",
                            statusColor
                          )}>
                            {isPast ? "Erledigt" : `noch ${daysLeft} T.`}
                          </div>
                        </div>
                        <h4 className="font-bold text-xl text-gray-900 mb-2">{e.title}</h4>
                        <p className="text-sm text-gray-500 mb-4">{e.description}</p>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100 mt-auto">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon size={14} />
                            {format(parseISO(e.dueDate), 'MMM do, yyyy', { locale: de })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(parseISO(e.dueDate), 'HH:mm', { locale: de })}
                          </div>
                        </div>
                        {!isPast && (
                          <div className="mt-3 w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full transition-all", progressColor)}
                              style={{ width: `${Math.max(0, Math.min(100, percentLeft))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
              {events.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">Keine Deadlines gefunden</h3>
                  <p className="text-gray-500">Alles erledigt! Genieß deine freie Zeit.</p>
                </div>
              )}
            </motion.div>
          ) : view === 'links' ? (
            <motion.div
              key="links"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <LinkIcon size={24} className="text-primary-600" />
                  Wichtige Links
                </h2>
              </div>

              <div className="space-y-12">
                {Array.from(new Set(quickLinks.map(l => l.category))).map(category => (
                  <div key={category} className="space-y-4">
                    <h3 className="font-bold text-gray-400 uppercase tracking-wider text-xs flex items-center gap-2">
                      <div className="w-1 h-4 bg-primary-600 rounded-full" />
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickLinks.filter(l => l.category === category).map(link => (
                        <a 
                          key={link.id} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group block"
                        >
                          <Card className="p-4 hover:border-primary-200 hover:shadow-md transition-all flex items-center justify-between group-hover:translate-x-1 duration-200">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                  {link.icon === 'Globe' && <Globe size={20} />}
                                  {link.icon === 'Book' && <Book size={20} />}
                                  {link.icon === 'GraduationCap' && <GraduationCap size={20} />}
                                  {link.icon === 'Mail' && <Mail size={20} />}
                                  {link.icon === 'LifeBuoy' && <LifeBuoy size={20} />}
                                  {link.icon === 'LinkIcon' && <LinkIcon size={20} />}
                                </div>
                                <span className="font-bold text-gray-900">{link.title}</span>
                              </div>
                              {link.description && <p className="text-xs text-gray-500 mt-1 ml-11">{link.description}</p>}
                            </div>
                            <ExternalLink size={16} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
                          </Card>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {quickLinks.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <LinkIcon size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">Keine Links verfügbar</h3>
                  <p className="text-gray-500">Schau später für aktualisierte Ressourcen vorbei.</p>
                </div>
              )}
            </motion.div>
          ) : view === 'modules' ? (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Book size={24} className="text-primary-600" />
                    Semester {selectedSemester} - Modulübersicht
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Alle Vorlesungen und Prüfungsleistungen nach Modulen gruppiert</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {[1, 2, 3, 4, 5, 6].map(sem => (
                      <button 
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded-md transition-all",
                          selectedSemester === sem ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        S{sem}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-xl border border-primary-100">
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-primary-700">{moduleGroups.length} Module gesamt</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {moduleGroups.map((module) => (
                  <motion.div
                    key={module.name}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className="h-full cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all duration-300 flex flex-col group overflow-hidden"
                      onClick={() => setSelectedModule(module.name)}
                    >
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                            <GraduationCap size={24} />
                          </div>
                          {module.events.length > 0 && (
                            <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold ring-2 ring-white">
                              <AlertCircle size={12} />
                              {module.events.length} {module.events.length === 1 ? 'Deadline' : 'Deadlines'}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary-600 transition-colors">
                          {module.name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                          <UserIcon size={14} />
                          {module.instructor}
                        </p>

                        <div className="space-y-2 mt-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Termine</p>
                          {/* Summarize schedule */}
                          {Array.from(new Set(module.lessons.map(l => `${l.day.substring(0, 2)} ${l.startTime}`))).slice(0, 3).map((slot, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                              {slot}
                            </div>
                          ))}
                          {module.lessons.length > 3 && (
                            <p className="text-[10px] text-primary-600 font-bold ml-3 pt-1">+ weitere Termine</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-primary-50 transition-colors">
                        <span className="text-xs font-bold text-gray-400">{module.lessons.length} Einzellektionen</span>
                        <div className="flex items-center gap-1 text-primary-600 font-bold text-xs">
                          Details <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Module Detail Modal */}
              <AnimatePresence>
                {selectedModule && (
<div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                      {/* Modal Header */}
                      <div className="relative p-6 md:p-10 bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden flex-shrink-0">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
                        
                        <div className="relative flex justify-between items-start">
                          <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">
                              <Book size={14} />
                              Moduldetails
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{selectedModule}</h3>
                            <div className="flex flex-wrap gap-4 text-primary-100">
                              <div className="flex items-center gap-2">
                                <UserIcon size={18} className="text-white" />
                                <span className="font-medium">{moduleGroups.find(m => m.name === selectedModule)?.instructor}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={18} className="text-white" />
                                <span className="font-medium">{moduleGroups.find(m => m.name === selectedModule)?.lessons.length} Lektionen Gesamt</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedModule(null)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/20"
                          >
                            <X size={24} />
                          </button>
                        </div>
                      </div>

                      {/* Modal Content */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-hide">
                        {/* Events / Deadlines Section */}
                        {moduleGroups.find(m => m.name === selectedModule)?.events.length! > 0 && (
                          <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b-2 border-red-100">
                              <AlertCircle size={20} className="text-red-500" />
                              <h4 className="font-bold text-gray-900">Anstehende Prüfungsleistungen</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {moduleGroups.find(m => m.name === selectedModule)?.events.map(event => (
                                <Card key={event.id} className="p-4 border-l-4 border-red-500 bg-red-50/30">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                      'text-[10px] uppercase font-bold px-2 py-0.5 rounded-full',
                                      event.type === 'Exam' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    )}>
                                      {event.type}
                                    </span>
                                    <span className="text-xs font-bold text-red-600">
                                      {format(parseISO(event.dueDate), 'do MMM', { locale: de })}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-gray-900">{event.title}</h5>
                                  <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                                </Card>
                              ))}
                            </div>
                          </section>
                        )}

                        {/* Lessons List Section */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-100">
                            <CalendarIcon size={20} className="text-primary-600" />
                            <h4 className="font-bold text-gray-900">Alle Vorlesungstermine</h4>
                          </div>
                          <div className="space-y-3">
                            {moduleGroups.find(m => m.name === selectedModule)?.lessons
                              .sort((a, b) => {
                                // Sort by day and then by start time
                                const daysOrder: Record<string, number> = { 'Montag': 1, 'Dienstag': 2, 'Mittwoch': 3, 'Donnerstag': 4, 'Freitag': 5, 'Samstag': 6, 'Sonntag': 7 };
                                if (a.date && b.date) return a.date.localeCompare(b.date);
                                if (a.date) return -1;
                                if (b.date) return 1;
                                if (daysOrder[a.day] !== daysOrder[b.day]) return daysOrder[a.day] - daysOrder[b.day];
                                return a.startTime.localeCompare(b.startTime);
                              })
                              .map((lesson, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-primary-100 transition-all duration-200">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-gray-100 shadow-sm">
                                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tighter">
                                        {lesson.day.substring(0, 2)}
                                      </span>
                                      <span className="text-xs font-black text-gray-400">
                                        {lesson.date ? format(parseISO(lesson.date), 'dd') : idx + 1}
                                      </span>
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-gray-900 text-sm">{lesson.name}</h5>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {lesson.startTime} - {lesson.endTime}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {lesson.room}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-8 w-1 bg-primary-200 rounded-full" />
                                </div>
                              ))}
                          </div>
                        </section>
                      </div>
                      
                      {/* Modal Footer */}
                      <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <Button variant="primary" onClick={() => setSelectedModule(null)}>
                          Schließen
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              {!user ? (
                <Card className="max-w-md w-full p-8 text-center space-y-6 mx-auto mt-12">
                  <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Settings size={32} />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                    <p className="text-gray-500">Bitte melde dich mit einem Admin-Konto an, um Daten zu verwalten.</p>
                  </div>
                  <Button onClick={handleLogin} className="w-full py-3">
                    <LogIn size={20} />
                    Mit Google anmelden
                  </Button>
                </Card>
              ) : profileLoading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
                  />
                </div>
              ) : !isAdminUser ? (
                <Card className="max-w-md w-full p-8 text-center space-y-6 mx-auto mt-12 border-red-200 bg-red-50">
                  <AlertCircle size={48} className="text-red-500 mx-auto" />
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-red-900">Zugriff verweigert</h1>
                    <p className="text-red-700">Du hast keine Admin-Rechte. Bitte wende dich an den Systemadministrator, falls dies ein Fehler ist.</p>
                  </div>
                  <Button variant="secondary" onClick={() => setView('dashboard')} className="w-full">
                    Zurück zur Übersicht
                  </Button>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-bold text-gray-900">Admin-Verwaltung</h2>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button 
                          onClick={() => setAdminView('calendar')}
                          className={cn(
                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                            adminView === 'calendar' ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Kalender
                        </button>
                        <button 
                          onClick={() => setAdminView('forms')}
                          className={cn(
                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                            adminView === 'forms' ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Formulare
                        </button>
                        <button 
                          onClick={() => setAdminView('links')}
                          className={cn(
                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                            adminView === 'links' ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Links
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {seedSuccess && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-bold animate-pulse">
                          <CheckCircle2 size={14} />
                          Geladen!
                        </div>
                      )}
                      <Button 
                        variant="secondary" 
                        onClick={handleSeed} 
                        disabled={true}
                        className="bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      >
                        Beispieldaten bereits geladen
                      </Button>
                      <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        {[1, 2, 3, 4, 5, 6].map(sem => (
                          <button 
                            key={sem}
                            onClick={() => setSelectedSemester(sem)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-black rounded transition-all",
                              selectedSemester === sem ? "bg-white shadow-sm text-primary-600" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            S{sem}
                          </button>
                        ))}
                      </div>
                      <Button variant="secondary" onClick={() => setView('dashboard')}>Zurück zur Übersicht</Button>
                    </div>
                  </div>

                  {adminView === 'calendar' ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                          <h3 className="font-bold text-lg text-gray-900">
                            {format(adminCalendarDate, 'MMMM yyyy', { locale: de })}
                          </h3>
                          <div className="flex gap-1">
                            <Button variant="secondary" onClick={() => setAdminCalendarDate(addMonths(adminCalendarDate, -1))} className="p-1.5">
                              <ChevronLeft size={16} />
                            </Button>
                            <Button variant="secondary" onClick={() => setAdminCalendarDate(new Date())} className="text-xs px-2">
                              Heute
                            </Button>
                            <Button variant="secondary" onClick={() => setAdminCalendarDate(addMonths(adminCalendarDate, 1))} className="p-1.5">
                              <ChevronRight size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary-500 rounded-full" />
                            <span>Vorlesung</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span>Frist</span>
                          </div>
                          <div className="flex items-center gap-1 italic">
                            <Move size={12} />
                            <span>Ziehen zum Verschieben</span>
                          </div>
                        </div>
                      </div>

                      <Card className="p-0 overflow-hidden bg-white shadow-sm border-gray-200">
                        <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-7">
                          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                            <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {d}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 auto-rows-fr">
                          {(() => {
                            const monthStart = startOfMonth(adminCalendarDate);
                            const monthEnd = endOfMonth(monthStart);
                            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                            const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                            const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                            return calendarDays.map((day, i) => {
                              const isCurrentMonth = isSameMonth(day, monthStart);
                              const isToday = isSameDay(day, new Date());
                              const dayName = format(day, 'EEEE', { locale: de });
                              const dateStr = format(day, 'yyyy-MM-dd', { locale: de });
                              
                              const dayClasses = classes.filter(c => {
                                if (c.date) return c.date === dateStr;
                                return c.day === dayName;
                              });
                              const dayEvents = events.filter(e => isSameDay(parseISO(e.dueDate), day));

                              return (
                                <div 
                                  key={i}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => onDrop(e, day)}
                                  className={cn(
                                    "min-h-[100px] p-1 border-r border-b border-gray-100 transition-all",
                                    !isCurrentMonth && "bg-gray-50/50 opacity-40"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                      "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full",
                                      isToday ? "bg-primary-600 text-white" : "text-gray-400"
                                    )}>
                                      {format(day, 'd', { locale: de })}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    {dayClasses.map(c => (
                                      <div 
                                        key={c.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, c, 'class')}
                                        onClick={() => setEditingItem({ type: 'class', data: { ...c } })}
                                        className="text-[9px] p-1 bg-primary-50 text-primary-700 rounded border border-primary-100 truncate cursor-pointer hover:bg-primary-100 transition-colors flex items-center gap-1"
                                      >
                                        <div className="w-1 h-1 bg-primary-500 rounded-full shrink-0" />
                                        {c.startTime}-{c.endTime} {c.name}
                                      </div>
                                    ))}
                                    {dayEvents.map(e => (
                                      <div 
                                        key={e.id}
                                        draggable
                                        onDragStart={(dragEv) => onDragStart(dragEv, e, 'event')}
                                        onClick={() => setEditingItem({ type: 'event', data: { ...e } })}
                                        className="text-[9px] p-1 bg-red-50 text-red-700 rounded border border-red-100 truncate cursor-pointer hover:bg-red-100 transition-colors flex items-center gap-1"
                                      >
                                        <div className="w-1 h-1 bg-red-500 rounded-full shrink-0" />
                                        {format(parseISO(e.dueDate), 'HH:mm', { locale: de })} {e.title}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </Card>
                    </div>
                  ) : adminView === 'forms' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Manage Classes */}
                      <section className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Plus size={20} className="text-primary-600" />
                          Add New Class
                        </h3>
                        <Card className="p-6">
                          <form onSubmit={handleAddClass} className="space-y-4">
                            <Input 
                              label="Course Name" 
                              value={newClass.name || ''} 
                              onChange={(e: any) => setNewClass({...newClass, name: e.target.value})}
                              placeholder="e.g. Advanced Mathematics"
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Room" 
                                value={newClass.room || ''} 
                                onChange={(e: any) => setNewClass({...newClass, room: e.target.value})}
                                placeholder="e.g. Room 402"
                              />
                              <Input 
                                label="Instructor" 
                                value={newClass.instructor || ''} 
                                onChange={(e: any) => setNewClass({...newClass, instructor: e.target.value})}
                                placeholder="e.g. Dr. Smith"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Select 
                                label="Day of Week" 
                                value={newClass.day} 
                                onChange={(e: any) => setNewClass({...newClass, day: e.target.value})}
                                options={[
                                  { value: 'Monday', label: 'Monday' },
                                  { value: 'Tuesday', label: 'Tuesday' },
                                  { value: 'Wednesday', label: 'Wednesday' },
                                  { value: 'Thursday', label: 'Thursday' },
                                  { value: 'Friday', label: 'Friday' },
                                  { value: 'Saturday', label: 'Saturday' },
                                  { value: 'Sunday', label: 'Sunday' },
                                ]}
                              />
                              <Input 
                                label="Specific Date (Optional)" 
                                type="date"
                                value={newClass.date || ''} 
                                onChange={(e: any) => setNewClass({...newClass, date: e.target.value})}
                                placeholder="YYYY-MM-DD"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Semester" 
                                type="number"
                                value={newClass.semester || 4} 
                                onChange={(e: any) => setNewClass({...newClass, semester: parseInt(e.target.value)})}
                              />
                              <div />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Start Time" 
                                type="time" 
                                value={newClass.startTime} 
                                onChange={(e: any) => setNewClass({...newClass, startTime: e.target.value})}
                              />
                              <Input 
                                label="End Time" 
                                type="time" 
                                value={newClass.endTime} 
                                onChange={(e: any) => setNewClass({...newClass, endTime: e.target.value})}
                              />
                            </div>
                            <Button type="submit" className="w-full">Add Class</Button>
                          </form>
                        </Card>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">Existing Classes ({classes.length})</h4>
                          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {classes.map(c => (
                              <div key={c.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm">{c.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {c.date ? format(parseISO(c.date), 'MMM do, yyyy', { locale: de }) : c.day} • {c.startTime} - {c.endTime}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" onClick={() => setEditingItem({ type: 'class', data: { ...c } })} className="p-1.5 text-primary-500 hover:bg-primary-50">
                                    <Edit2 size={16} />
                                  </Button>
                                  <Button variant="ghost" onClick={() => handleDeleteClass(c.id)} className="p-1.5 text-red-500 hover:bg-red-50">
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* Manage Events */}
                      <section className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Plus size={20} className="text-primary-600" />
                          Add New Event
                        </h3>
                        <Card className="p-6">
                          <form onSubmit={handleAddEvent} className="space-y-4">
                            <Input 
                              label="Event Title" 
                              value={newEvent.title || ''} 
                              onChange={(e: any) => setNewEvent({...newEvent, title: e.target.value})}
                              placeholder="e.g. Midterm Exam"
                            />
                            <Select 
                              label="Event Type" 
                              value={newEvent.type} 
                              onChange={(e: any) => setNewEvent({...newEvent, type: e.target.value as any})}
                              options={[
                                { value: 'Assignment', label: 'Assignment' },
                                { value: 'Exam', label: 'Exam' },
                                { value: 'Project', label: 'Project' },
                                { value: 'Other', label: 'Other' },
                              ]}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Semester" 
                                type="number"
                                value={newEvent.semester || 4} 
                                onChange={(e: any) => setNewEvent({...newEvent, semester: parseInt(e.target.value)})}
                              />
                              <Input 
                                label="Due Date & Time" 
                                type="datetime-local" 
                                value={newEvent.dueDate} 
                                onChange={(e: any) => setNewEvent({...newEvent, dueDate: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium text-gray-700">Description</label>
                              <textarea
                                value={newEvent.description || ''}
                                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all h-24"
                                placeholder="Event details..."
                              />
                            </div>
                            <Button type="submit" className="w-full">Add Event</Button>
                          </form>
                        </Card>

                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">Existing Events ({events.length})</h4>
                          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                            {events.map(e => (
                              <div key={e.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-sm">{e.title}</p>
                                  <p className="text-xs text-gray-500">{format(parseISO(e.dueDate), 'MMM do, HH:mm', { locale: de })}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" onClick={() => setEditingItem({ type: 'event', data: { ...e } })} className="p-1.5 text-primary-500 hover:bg-primary-50">
                                    <Edit2 size={16} />
                                  </Button>
                                  <Button variant="ghost" onClick={() => handleDeleteEvent(e.id)} className="p-1.5 text-red-500 hover:bg-red-50">
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Manage Links */}
                      <section className="space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Plus size={20} className="text-primary-600" />
                          Add New Quick Link
                        </h3>
                        <Card className="p-6">
                          <form onSubmit={handleAddLink} className="space-y-4">
                            <Input 
                              label="Link Title" 
                              value={newLink.title || ''} 
                              onChange={(e: any) => setNewLink({...newLink, title: e.target.value})}
                              placeholder="e.g. University Portal"
                            />
                            <Input 
                              label="URL" 
                              value={newLink.url || ''} 
                              onChange={(e: any) => setNewLink({...newLink, url: e.target.value})}
                              placeholder="https://..."
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <Input 
                                label="Category" 
                                value={newLink.category || ''} 
                                onChange={(e: any) => setNewLink({...newLink, category: e.target.value})}
                                placeholder="e.g. General"
                              />
                              <Select 
                                label="Icon" 
                                value={newLink.icon} 
                                onChange={(e: any) => setNewLink({...newLink, icon: e.target.value})}
                                options={[
                                  { value: 'Globe', label: 'Globe' },
                                  { value: 'Book', label: 'Book' },
                                  { value: 'GraduationCap', label: 'Graduation Cap' },
                                  { value: 'Mail', label: 'Mail' },
                                  { value: 'LifeBuoy', label: 'Support' },
                                  { value: 'LinkIcon', label: 'Link' },
                                ]}
                              />
                            </div>
                            <Input 
                              label="Description (Optional)" 
                              value={newLink.description || ''} 
                              onChange={(e: any) => setNewLink({...newLink, description: e.target.value})}
                              placeholder="Short description of the resource"
                            />
                            <Button type="submit" className="w-full">Add Link</Button>
                          </form>
                        </Card>
                      </section>

                      <section className="space-y-4">
                        <h3 className="font-bold text-lg">Existing Links ({quickLinks.length})</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {quickLinks.map(l => (
                            <div key={l.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                                  {l.icon === 'Globe' && <Globe size={18} />}
                                  {l.icon === 'Book' && <Book size={18} />}
                                  {l.icon === 'GraduationCap' && <GraduationCap size={18} />}
                                  {l.icon === 'Mail' && <Mail size={18} />}
                                  {l.icon === 'LifeBuoy' && <LifeBuoy size={18} />}
                                  {l.icon === 'LinkIcon' && <LinkIcon size={18} />}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{l.title}</p>
                                  <p className="text-xs text-gray-400 truncate max-w-[200px]">{l.url}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" onClick={() => setEditingItem({ type: 'link', data: { ...l } })} className="p-1.5 text-primary-500 hover:bg-primary-50">
                                  <Edit2 size={16} />
                                </Button>
                                <Button variant="ghost" onClick={() => handleDeleteLink(l.id)} className="p-1.5 text-red-500 hover:bg-red-50">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                
                {/* Edit Modal */}
                  <AnimatePresence>
                    {editingItem && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                              <Edit2 size={18} className="text-primary-600" />
                              Edit {editingItem.type === 'class' ? 'Class' : editingItem.type === 'event' ? 'Event' : 'Link'}
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                              <X size={20} />
                            </button>
                          </div>
                          
                          <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
                            {editingItem.type === 'class' ? (
                              <>
                                <Input 
                                  label="Course Name" 
                                  value={editingItem.data.name} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, name: e.target.value}})}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <Input 
                                    label="Room" 
                                    value={editingItem.data.room} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, room: e.target.value}})}
                                  />
                                  <Input 
                                    label="Instructor" 
                                    value={editingItem.data.instructor} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, instructor: e.target.value}})}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <Select 
                                    label="Day" 
                                    value={editingItem.data.day} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, day: e.target.value}})}
                                    options={[
                                      { value: 'Monday', label: 'Monday' },
                                      { value: 'Tuesday', label: 'Tuesday' },
                                      { value: 'Wednesday', label: 'Wednesday' },
                                      { value: 'Thursday', label: 'Thursday' },
                                      { value: 'Friday', label: 'Friday' },
                                      { value: 'Saturday', label: 'Saturday' },
                                      { value: 'Sunday', label: 'Sunday' },
                                    ]}
                                  />
                                  <Input 
                                    label="Date (Optional)" 
                                    type="date"
                                    value={editingItem.data.date || ''} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, date: e.target.value}})}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <Input 
                                    label="Start" 
                                    type="time" 
                                    value={editingItem.data.startTime} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, startTime: e.target.value}})}
                                  />
                                  <Input 
                                    label="End" 
                                    type="time" 
                                    value={editingItem.data.endTime} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, endTime: e.target.value}})}
                                  />
                                </div>
                                <Input 
                                  label="Semester" 
                                  type="number" 
                                  value={editingItem.data.semester || 4} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, semester: parseInt(e.target.value)}})}
                                />
                              </>
                            ) : editingItem.type === 'event' ? (
                              <>
                                <Input 
                                  label="Title" 
                                  value={editingItem.data.title} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, title: e.target.value}})}
                                />
                                <Select 
                                  label="Type" 
                                  value={editingItem.data.type} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, type: e.target.value as any}})}
                                  options={[
                                    { value: 'Assignment', label: 'Assignment' },
                                    { value: 'Exam', label: 'Exam' },
                                    { value: 'Project', label: 'Project' },
                                    { value: 'Other', label: 'Other' },
                                  ]}
                                />
                                <Input 
                                  label="Due Date" 
                                  type="datetime-local" 
                                  value={editingItem.data.dueDate} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, dueDate: e.target.value}})}
                                />
                                <Input 
                                  label="Semester" 
                                  type="number" 
                                  value={editingItem.data.semester || 4} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, semester: parseInt(e.target.value)}})}
                                />
                                <div className="space-y-1">
                                  <label className="text-sm font-medium text-gray-700">Description</label>
                                  <textarea
                                    value={editingItem.data.description}
                                    onChange={(e) => setEditingItem({...editingItem, data: {...editingItem.data, description: e.target.value}})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all h-24"
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <Input 
                                  label="Link Title" 
                                  value={editingItem.data.title} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, title: e.target.value}})}
                                />
                                <Input 
                                  label="URL" 
                                  value={editingItem.data.url} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, url: e.target.value}})}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <Input 
                                    label="Category" 
                                    value={editingItem.data.category} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, category: e.target.value}})}
                                  />
                                  <Select 
                                    label="Icon" 
                                    value={editingItem.data.icon} 
                                    onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, icon: e.target.value}})}
                                    options={[
                                      { value: 'Globe', label: 'Globe' },
                                      { value: 'Book', label: 'Book' },
                                      { value: 'GraduationCap', label: 'Graduation Cap' },
                                      { value: 'Mail', label: 'Mail' },
                                      { value: 'LifeBuoy', label: 'Support' },
                                      { value: 'LinkIcon', label: 'Link' },
                                    ]}
                                  />
                                </div>
                                <Input 
                                  label="Description" 
                                  value={editingItem.data.description || ''} 
                                  onChange={(e: any) => setEditingItem({...editingItem, data: {...editingItem.data, description: e.target.value}})}
                                />
                              </>
                            )}
                            
                            <div className="flex gap-3 pt-4">
                              <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={() => {
                                  if (editingItem.type === 'class') handleDeleteClass(editingItem.data.id);
                                  else if (editingItem.type === 'event') handleDeleteEvent(editingItem.data.id);
                                  else handleDeleteLink(editingItem.data.id);
                                  setEditingItem(null);
                                }}
                                className="flex-1 bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                              >
                                <Trash2 size={18} />
                                Delete
                              </Button>
                              <Button type="submit" className="flex-[2]">Save Changes</Button>
                            </div>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 text-center text-gray-500 text-sm">
          &copy; 2026 UniDash University Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
