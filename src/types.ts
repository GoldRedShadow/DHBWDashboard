export interface Class {
  id: string;
  name: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  instructor: string;
  date?: string; // ISO 8601 (YYYY-MM-DD) for specific overrides
  semester?: number;
}

export interface AcademicEvent {
  id: string;
  title: string;
  type: 'Assignment' | 'Exam' | 'Project' | 'Other';
  dueDate: string; // ISO 8601
  courseId?: string;
  description: string;
  semester?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'student';
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  category: string;
  icon?: string; // Lucide icon name
  description?: string;
}
