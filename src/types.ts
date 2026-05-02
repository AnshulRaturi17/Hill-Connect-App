export type Screen = 'landing' | 'auth' | 'passenger-dashboard' | 'ride-search' | 'hazard-map' | 'driver-dashboard' | 'post-ride' | 'account';

export interface UserProfile {
  uid: string;
  full_name: string;
  username: string;
  email: string;
  phone_number: string;
  vehicle_details?: string;
  role: 'passenger' | 'driver';
  rating: number;
  trips_completed: number;
  avatar_url: string | null;
  created_at: any;
}

export interface Driver extends UserProfile {
  id: string; // compatibility with existing code
  name?: string; // compatibility
  trips?: number; // compatibility
  vehicle: string;
  plate: string;
  route: string;
  price: number;
  seats: number;
  image: string;
  isVerified: boolean;
  status?: 'Active' | 'Full' | 'Away';
}

export interface Hazard {
  id: string;
  type: 'weather' | 'traffic' | 'infrastructure' | 'safety' | 'construction' | 'landslide' | 'blockage' | 'clear' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: string;
  time: string;
  reporter?: string;
  upvotes?: number;
  comments?: number;
  created_at?: string;
  lat?: number;
  lng?: number;
}
