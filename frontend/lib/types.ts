export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  timezone?: string;
}

export interface AvailabilityRule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  dateOverride?: string;
}

export interface CustomQuestion {
  id: string;
  questionText: string;
  questionType: 'TEXT' | 'MULTIPLE_CHOICE' | 'CHECKBOX';
  options?: string[];
  isRequired: boolean;
}

export interface EventType {
  id: string;
  userId: string;
  title: string;
  slug: string;
  description?: string;
  durationMinutes: number;
  locationType: 'IN_PERSON' | 'VIRTUAL' | 'PHONE' | 'CUSTOM';
  locationDetails?: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  dailyLimit?: number;
  color: string;
  defaultVideoLink?: string;
  availabilityRules: AvailabilityRule[];
  customQuestions: CustomQuestion[];
  _count?: {
    bookings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicEventType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  dailyLimit?: number;
  locationDetails?: string;
  locationType: 'IN_PERSON' | 'VIRTUAL' | 'PHONE' | 'CUSTOM';
  bufferAfterMinutes: number;
  bufferBeforeMinutes: number;
  color: string;
  user: {
    name: string;
    username: string;
    bio?: string;
    timezone?: string;
  };
  availabilityRules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    dateOverride?: string;
  }[];
  customQuestions: CustomQuestion[];
}

export interface Booking {
  id: string;
  eventTypeId: string;
  userId: string;
  startTime: string;
  endTime: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteeNotes?: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  videoLink?: string;
  cancellationToken: string;
  createdAt: string;
  updatedAt: string;
  eventType?: {
    id: string;
    title: string;
    slug: string;
    durationMinutes: number;
    locationType: string;
    locationDetails?: string;
    defaultVideoLink?: string;
  };
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DaySlots {
  [date: string]: string[];
}
