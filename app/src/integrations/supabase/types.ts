export type EventStatus = 'Planning' | 'Confirmed' | 'Completed';

export interface Event {
  id: string;
  user_id: string;
  name: string;
  event_date: string;
  location: string | null;
  description: string | null;
  status: EventStatus;
  created_at: string;
}

export interface ContactInquiry {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
}
