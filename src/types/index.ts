export interface Menu {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  customer_duration_minutes?: number;
  provider_duration_minutes?: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface User {
  id: string;
  line_user_id: string;
  name: string;
  phone: string;
  is_first_visit: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
  sort_order: number;
}

export interface ReservationState {
  selectedMenu: Menu | null;
  selectedDate: string | null;
  selectedTime: string | null;
  selectedLocation: Location | null;
  isOnline: boolean;
  phone: string;
  referrerName: string;
}

export type Step = 'menu' | 'calendar' | 'time' | 'location' | 'form' | 'confirm' | 'complete';

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  max_bookings: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  menu_id: string;
  location_id?: string | null;
  is_online: boolean;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  referrer_name?: string;
  created_at: string;
  user?: User;
  menu?: Menu;
  location?: Location;
}
