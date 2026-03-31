import { Class, AcademicEvent, QuickLink } from './types';
import { db, collection, doc, setDoc } from './firebase';

const classes: Partial<Class>[] = [
  // KW 15
  { name: 'Semesterbegrüßung', room: 'Aula', day: 'Tuesday', startTime: '08:30', endTime: '09:30', instructor: 'Lehmann', date: '2026-04-07' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Bergmann', date: '2026-04-07' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Wednesday', startTime: '10:45', endTime: '13:15', instructor: 'Bergmann', date: '2026-04-08' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '17:15', instructor: 'Kirchberg', date: '2026-04-08' },
  { name: 'ERP-Systeme: Fallstudie', room: 'RV-WWIBE124', day: 'Thursday', startTime: '08:00', endTime: '10:30', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-04-09' },
  { name: 'ERP-Systeme: Fallstudie', room: 'RV-WWIBE124', day: 'Thursday', startTime: '10:45', endTime: '13:15', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-04-09' },
  { name: 'ERP-Systeme: Fallstudie', room: 'RV-WWIBE124', day: 'Thursday', startTime: '14:00', endTime: '16:30', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-04-09' },
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Friday', startTime: '09:00', endTime: '12:15', instructor: 'Jeske', date: '2026-04-10' },
  { name: 'ERP-Systeme: Fallstudie', room: 'MP2-3.12', day: 'Friday', startTime: '13:00', endTime: '17:15', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-04-10' },

  // KW 16
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-04-13' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '13:15', instructor: 'Kirchberg', date: '2026-04-13' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Monday', startTime: '14:00', endTime: '15:30', instructor: 'Kirchberg', date: '2026-04-13' },
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-04-14' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Möslein-Tröppner', date: '2026-04-14' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Tuesday', startTime: '14:00', endTime: '18:15', instructor: 'Remschel', date: '2026-04-14' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Wednesday', startTime: '08:00', endTime: '10:30', instructor: 'Möslein-Tröppner', date: '2026-04-15' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Wednesday', startTime: '10:45', endTime: '13:15', instructor: 'Kirchberg', date: '2026-04-15' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '17:15', instructor: 'Bergmann', date: '2026-04-15' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Friday', startTime: '13:00', endTime: '16:15', instructor: 'Jeske', date: '2026-04-17' },

  // KW 17
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-04-20' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-04-20' },
  { name: 'Teamarbeit I', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Dannenberger', date: '2026-04-21' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-04-21' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Tuesday', startTime: '14:00', endTime: '18:15', instructor: 'Remschel', date: '2026-04-21' },
  { name: 'Fallstudie Systemanalyse', room: 'MP2-3.12', day: 'Wednesday', startTime: '09:00', endTime: '10:30', instructor: 'Bächle', date: '2026-04-22' },
  { name: 'Teamarbeit I', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '18:15', instructor: 'Dannenberger', date: '2026-04-22' },
  { name: 'Teamarbeit I', room: 'MP2-3.12', day: 'Thursday', startTime: '08:00', endTime: '13:15', instructor: 'Dannenberger', date: '2026-04-23' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Thursday', startTime: '14:00', endTime: '18:15', instructor: 'Krumm', date: '2026-04-23' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Friday', startTime: '08:00', endTime: '10:30', instructor: 'Möslein-Tröppner', date: '2026-04-24' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Friday', startTime: '10:45', endTime: '13:15', instructor: 'Möslein-Tröppner', date: '2026-04-24' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Friday', startTime: '14:00', endTime: '16:30', instructor: 'Möslein-Tröppner', date: '2026-04-24' },

  // KW 18
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-04-27' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Monday', startTime: '14:00', endTime: '18:15', instructor: 'Krumm', date: '2026-04-27' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-04-28' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-04-28' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Tuesday', startTime: '14:00', endTime: '18:15', instructor: 'Remschel', date: '2026-04-28' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Wednesday', startTime: '09:00', endTime: '12:15', instructor: 'Kirchberg', date: '2026-04-29' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '17:15', instructor: 'Bergmann', date: '2026-04-29' },

  // KW 19
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Gomez', date: '2026-05-04' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '13:15', instructor: 'Gomez', date: '2026-05-04' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Monday', startTime: '14:00', endTime: '17:15', instructor: 'Gomez', date: '2026-05-04' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Gomez', date: '2026-05-05' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Gomez', date: '2026-05-05' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Tuesday', startTime: '14:00', endTime: '17:15', instructor: 'Gomez', date: '2026-05-05' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Wednesday', startTime: '08:00', endTime: '10:30', instructor: 'Gomez', date: '2026-05-06' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Wednesday', startTime: '10:45', endTime: '13:15', instructor: 'Gomez', date: '2026-05-06' },
  { name: 'SCM-Consulting: Einführung', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '15:30', instructor: 'Gomez', date: '2026-05-06' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Thursday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-05-07' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Friday', startTime: '08:30', endTime: '12:45', instructor: 'Krumm', date: '2026-05-08' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Friday', startTime: '14:00', endTime: '18:15', instructor: 'Remschel', date: '2026-05-08' },

  // KW 20
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-05-11' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-05-12' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-05-12' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Wednesday', startTime: '08:00', endTime: '10:30', instructor: 'Möslein-Tröppner', date: '2026-05-13' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Wednesday', startTime: '10:45', endTime: '13:15', instructor: 'Möslein-Tröppner', date: '2026-05-13' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Wednesday', startTime: '14:00', endTime: '16:30', instructor: 'Möslein-Tröppner', date: '2026-05-13' },

  // KW 21
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-05-18' },
  { name: 'SCM-Consulting: SCM', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '13:15', instructor: 'Möslein-Tröppner', date: '2026-05-18' },
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-05-19' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-05-19' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Tuesday', startTime: '14:00', endTime: '17:15', instructor: 'Krumm', date: '2026-05-19' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Wednesday', startTime: '09:00', endTime: '12:15', instructor: 'Kirchberg', date: '2026-05-20' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Thursday', startTime: '08:00', endTime: '13:15', instructor: 'Krumm', date: '2026-05-21' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Thursday', startTime: '14:00', endTime: '17:15', instructor: 'Krumm', date: '2026-05-21' },
  { name: 'ERP-Systeme: Fallstudie', room: 'RV-WWIBE124', day: 'Friday', startTime: '09:00', endTime: '11:30', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-05-22' },
  { name: 'ERP-Systeme: Fallstudie', room: 'RV-WWIBE124', day: 'Friday', startTime: '12:00', endTime: '14:30', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-05-22' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Friday', startTime: '15:00', endTime: '18:15', instructor: 'Remschel', date: '2026-05-22' },

  // KW 22
  { name: 'Datenbanken: Projekt', room: 'MP2-3.12', day: 'Wednesday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-05-27' },

  // KW 23
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-06-01' },
  { name: 'Interkulturelle Kompetenz', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Krumm', date: '2026-06-02' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-06-02' },

  // KW 24
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-06-08' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '13:15', instructor: 'Kirchberg', date: '2026-06-08' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Tuesday', startTime: '08:00', endTime: '10:30', instructor: 'Kirchberg', date: '2026-06-09' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-06-09' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Wednesday', startTime: '09:00', endTime: '12:15', instructor: 'Kirchberg', date: '2026-06-10' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Thursday', startTime: '09:00', endTime: '12:15', instructor: 'Kirchberg', date: '2026-06-11' },
  { name: 'Datenbanken: Neue Konzepte', room: 'MP2-3.12', day: 'Friday', startTime: '10:45', endTime: '13:15', instructor: 'Kirchberg', date: '2026-06-12' },

  // KW 25
  { name: 'Mathematik II: Statistik', room: 'MP2-3.12', day: 'Monday', startTime: '08:00', endTime: '10:30', instructor: 'Jeske', date: '2026-06-15' },
  { name: 'Fallstudie Systemanalyse', room: 'MP2-3.12', day: 'Monday', startTime: '10:45', endTime: '16:30', instructor: 'Bächle', date: '2026-06-15' },
  { name: 'Mathematik II: Operations Research', room: 'MP2-3.12', day: 'Tuesday', startTime: '10:45', endTime: '13:15', instructor: 'Jeske', date: '2026-06-16' },
  { name: 'VWL: Geld, Währung, Politik', room: 'MP2-3.12', day: 'Thursday', startTime: '15:30', endTime: '18:00', instructor: 'Remschel', date: '2026-06-18' },
  { name: 'ERP-Systeme: Fallstudie', room: 'MP2-3.12', day: 'Friday', startTime: '09:00', endTime: '12:15', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-06-19' },
  { name: 'ERP-Systeme: Fallstudie', room: 'MP2-3.12', day: 'Friday', startTime: '13:00', endTime: '16:15', instructor: 'Dehring/Unkauf/de Vegt', date: '2026-06-19' },

  // KW 27
  { name: 'Semesterabschlussbesprechung', room: 'MP2-3.12', day: 'Monday', startTime: '10:15', endTime: '11:15', instructor: 'Lehmann', date: '2026-06-29' },
];

const events: Partial<AcademicEvent>[] = [
  { title: 'Klausur VWL', type: 'Exam', dueDate: '2026-06-24T08:00', description: 'Geld, Währung, Außenwirtschaft, Wirtschaftspolitik (60 min)' },
  { title: 'Klausur Mathematik II', type: 'Exam', dueDate: '2026-06-29T08:00', description: 'Modulklausur (120 min) in MP2-2.08 Aula' },
];

const quickLinks: Partial<QuickLink>[] = [
  { title: 'University Portal', url: 'https://portal.university.edu', category: 'General', icon: 'Globe', description: 'Access your student dashboard and personal information' },
  { title: 'Library Search', url: 'https://library.university.edu', category: 'Research', icon: 'Book', description: 'Find books, articles, and digital resources' },
  { title: 'Moodle / LMS', url: 'https://lms.university.edu', category: 'Learning', icon: 'GraduationCap', description: 'Course materials, assignments, and online learning' },
  { title: 'Student Email', url: 'https://mail.university.edu', category: 'Communication', icon: 'Mail', description: 'Official university communication channel' },
  { title: 'IT Support', url: 'https://it.university.edu', category: 'Support', icon: 'LifeBuoy', description: 'Technical assistance and software downloads' },
];

export async function seedData() {
  const classCol = collection(db, 'classes');
  const eventCol = collection(db, 'events');
  const linkCol = collection(db, 'quickLinks');

  for (const c of classes) {
    const id = Math.random().toString(36).substr(2, 9);
    await setDoc(doc(classCol, id), { ...c, id });
  }

  for (const e of events) {
    const id = Math.random().toString(36).substr(2, 9);
    await setDoc(doc(eventCol, id), { ...e, id, description: e.description || '' });
  }

  for (const l of quickLinks) {
    const id = Math.random().toString(36).substr(2, 9);
    await setDoc(doc(linkCol, id), { ...l, id });
  }
}
