import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Calendar, 
  Users, 
  Filter, 
  SlidersHorizontal,
  Star,
  Zap,
  ShieldCheck,
  ChevronRight,
  Clock,
  CarFront
} from 'lucide-react';
import { Driver, Screen } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default function RideSearch({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [results, setResults] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Search State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  const handleJoinRide = async (rideId: string) => {
    const selectedRide = results.find(r => r.id === rideId) as any;
    if (!selectedRide) return;

    const user = auth.currentUser;
    
    if (!user) {
      // Save intent to session storage and redirect to auth
      sessionStorage.setItem('pending_ride_id', rideId);
      onNavigate('auth');
      return;
    }

    setBookingLoading(rideId);
    try {
      await addDoc(collection(db, 'bookings'), {
        ride_id: rideId,
        driver_id: selectedRide.driverId,
        passenger_id: user.uid,
        seats_booked: passengerCount,
        status: 'pending',
        created_at: serverTimestamp()
      });

      alert('Booking request sent to driver!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bookings');
    } finally {
      setBookingLoading(null);
    }
  };

  const fetchRides = async () => {
    setLoading(true);
    try {
      let ridesQuery = query(collection(db, 'rides'), where('status', '==', 'active'));
      const ridesSnap = await getDocs(ridesQuery);
      
      let mappedRides: Driver[] = [];
      
      for (const rideDoc of ridesSnap.docs) {
        const ride = rideDoc.data();
        
        // Client-side filtering
        const matchesOrigin = !origin || ride.origin.toLowerCase().includes(origin.toLowerCase());
        const matchesDest = !destination || ride.destination.toLowerCase().includes(destination.toLowerCase());
        const matchesSeats = ride.available_seats >= passengerCount;
        
        let matchesDate = true;
        if (departureDate && ride.departure_time) {
          const rideDate = new Date(ride.departure_time).toISOString().split('T')[0];
          matchesDate = rideDate === departureDate;
          
          if (matchesDate && departureTime) {
            const rideTime = new Date(ride.departure_time).getHours();
            const searchTime = parseInt(departureTime.split(':')[0]);
            // Show rides that are at or after the searched time
            matchesDate = rideTime >= searchTime;
          }
        }

        if (!matchesOrigin || !matchesDest || !matchesSeats || !matchesDate) continue;

        // Fetch driver profile (safely)
        let profile = null;
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', ride.driver_id));
          profile = profileSnap.exists() ? profileSnap.data() : null;
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `profiles/${ride.driver_id}`);
        }

        mappedRides.push({
          id: rideDoc.id,
          name: profile?.full_name || 'Anonymous Driver',
          rating: profile?.rating || 5.0,
          trips: profile?.trips_completed || 0,
          vehicle: 'Vehicle Info',
          plate: 'UK07 AD 1234',
          route: `${ride.origin} → ${ride.destination}`,
          price: ride.price,
          seats: ride.available_seats,
          image: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Driver')}&background=064e3b&color=fff`,
          isVerified: true,
          driverId: ride.driver_id
        } as any);
      }

      // Apply UI filters
      if (activeFilter === 'Lowest Fare') {
        mappedRides.sort((a, b) => a.price - b.price);
      } else if (activeFilter === 'Top Rated') {
        mappedRides.sort((a, b) => b.rating - a.rating);
      }

      setResults(mappedRides);
    } catch (err) {
      console.error('Error fetching rides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [activeFilter, passengerCount, origin, destination, departureDate, departureTime]); // Re-fetch on all filters

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Sticky Header with Search Context */}
      <div className="sticky top-0 z-30 bg-white border-b border-outline-variant/30 px-4 md:px-8 py-6 md:py-8 shadow-sm">
        <div className="w-full flex flex-col gap-8 max-w-screen-2xl mx-auto">
           {/* Row 1: Heading */}
           <div className="flex items-center gap-4 shrink-0">
             <button 
               onClick={() => onNavigate('landing')}
               className="p-3 hover:bg-surface-container rounded-xl text-emerald-900 transition-colors border border-outline-variant/20"
              >
               <ArrowLeft size={24} />
             </button>
             <h1 className="text-3xl font-serif font-black text-emerald-950 uppercase tracking-tight">Search Rides</h1>
           </div>
           
           {/* Row 2: Search Bar */}
           <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800 group-focus-within:text-emerald-600 transition-all z-20" size={18} />
                <input 
                  type="text" 
                  placeholder="Rolling from..."
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-sm font-bold border-2 border-emerald-950/5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm hover:border-emerald-900/10 relative z-10"
                />
              </div>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800 group-focus-within:text-emerald-600 transition-all z-20" size={18} />
                <input 
                  type="text" 
                  placeholder="Heading to..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-sm font-bold border-2 border-emerald-950/5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm hover:border-emerald-900/10 relative z-10"
                />
              </div>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800 transition-all z-20" size={18} />
                <input 
                  type="date" 
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-12 text-sm font-bold border-2 border-emerald-950/5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm hover:border-emerald-900/10 cursor-pointer relative z-10"
                  title="Departure Date"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-800 z-20">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
              <div className="relative group">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800 transition-all z-20" size={18} />
                <input 
                  type="time" 
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-12 text-sm font-bold border-2 border-emerald-950/5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm hover:border-emerald-900/10 cursor-pointer relative z-10"
                  title="Departure Time"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-800 z-20">
                  <ChevronRight size={14} className="rotate-90" />
                </div>
              </div>
              <div className="relative group">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-800 transition-all z-20" size={18} />
                <select 
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                  className="w-full h-14 bg-white rounded-2xl pl-12 pr-10 text-sm font-bold border-2 border-emerald-950/5 outline-none appearance-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm hover:border-emerald-900/10 relative z-10"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Passengers</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 z-20">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
           </div>

           {/* Row 3: Filter Buttons */}
           <div className="flex flex-wrap items-center gap-3">
             <FilterButton label="All" active={activeFilter === 'All'} onClick={() => setActiveFilter('All')} />
             <FilterButton label="Lowest Fare" active={activeFilter === 'Lowest Fare'} onClick={() => setActiveFilter('Lowest Fare')} />
             <FilterButton label="Top Rated" active={activeFilter === 'Top Rated'} onClick={() => setActiveFilter('Top Rated')} />
             <FilterButton label="Female Only" active={activeFilter === 'Female Only'} onClick={() => setActiveFilter('Female Only')} />
           </div>
        </div>
      </div>

      {/* Main Content: Results */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-10">
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif font-black text-emerald-950">Recommended Rides <span className="text-on-surface-variant/40 ml-2">({results.length})</span></h2>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
               <Zap size={14} className="fill-emerald-700" />
               Instant Booking Available
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="flex flex-col gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-surface-container animate-pulse rounded-[2rem]"></div>
                ))}
              </div>
            ) : results.length > 0 ? (
              results.map((result, idx) => (
                <SearchResultCard 
                  key={result.id} 
                  result={result} 
                  delay={idx * 0.1} 
                  onJoin={handleJoinRide}
                  bookingLoading={bookingLoading === result.id}
                />
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-outline-variant">
                <CarFront size={48} className="mx-auto text-on-surface-variant/30 mb-4" />
                <h3 className="text-xl font-serif font-black text-emerald-950">No Rides Found</h3>
                <p className="text-on-surface-variant font-medium mt-2">Try adjusting your filters or check back later.</p>
              </div>
            )}
          </div>

          {/* Load More or Suggestion */}
          <div className="mt-12 text-center py-10 border-t border-outline-variant/30 border-dashed">
            <p className="text-on-surface-variant font-medium mb-6">Can't find a ride? Start your own carpool!</p>
            <button className="bg-white border-2 border-emerald-950 text-emerald-950 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-950 hover:text-white transition-all">
              Launch Ride Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border-2 ${
        active 
          ? 'bg-emerald-950 text-white border-emerald-950' 
          : 'bg-white text-emerald-950 border-emerald-950/10 hover:border-emerald-500'
      }`}
    >
      {label}
    </button>
  );
}

const SearchResultCard: React.FC<{ 
  result: Driver, 
  delay: number, 
  onJoin: (id: string) => void | Promise<void>, 
  bookingLoading: boolean 
}> = ({ result, delay, onJoin, bookingLoading }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-[2rem] p-6 md:p-8 border border-outline-variant/30 hover:border-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all group overflow-hidden relative"
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity rotate-45 translate-x-16 -translate-y-16" />

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
        {/* Profile & Vehicle Section */}
        <div className="flex gap-5 shrink-0">
          <div className="relative">
            <img src={result.image} alt={result.name} className="w-16 h-16 md:w-20 md:h-20 rounded-3xl object-cover shadow-lg border-2 border-white" />
            {result.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-xl shadow-md border border-emerald-50">
                <ShieldCheck size={18} className="text-secondary fill-secondary/20" strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <h3 className="text-lg md:text-xl font-serif font-black text-emerald-950 uppercase tracking-tight">{result.name}</h3>
               <div className="flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-lg">
                 <Star size={12} className="text-secondary fill-secondary" />
                 <span className="text-[10px] font-black text-emerald-900">{result.rating}</span>
               </div>
            </div>
            <p className="text-xs font-bold text-on-surface-variant flex items-center gap-2">
              <CarFront size={14} />
              {result.vehicle} • <span className="text-emerald-700">{result.trips} trips</span>
            </p>
            <div className="flex gap-3 pt-2">
              <span className="px-2 py-1 bg-surface-container rounded-lg text-[9px] font-black uppercase text-on-surface-variant tracking-widest">{result.plate}</span>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="flex-1 w-full space-y-4">
           <div className="flex items-center gap-4 text-on-surface-variant">
             <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-700" />
                <div className="w-0.5 h-6 bg-outline-variant/30" />
                <div className="w-2 h-2 rounded-full border-2 border-emerald-700" />
             </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between">
                  <span className="font-bold text-sm text-emerald-950">{result.route.split('→')[0].trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-sm text-emerald-950">{result.route.split('→')[1]?.trim() || 'Destination'}</span>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4 ml-6">
              <div className="flex items-center gap-1 text-emerald-700">
                <Clock size={12} />
                <span className="text-[10px] font-black uppercase">Direct Route</span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <Users size={12} />
                <span className="text-[10px] font-black uppercase">{result.seats} Seats Left</span>
              </div>
           </div>
        </div>

        {/* Pricing & Booking */}
        <div className="w-full md:w-auto shrink-0 md:pl-8 md:border-l border-outline-variant/30 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-4">
           <div className="text-right">
             <p className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase mb-1">Fixed Fare</p>
             <div className="flex items-baseline gap-1">
               <span className="text-sm font-bold text-emerald-900">₹</span>
               <span className="text-3xl font-serif font-black text-emerald-950">{result.price}</span>
             </div>
           </div>
           <button 
             disabled={bookingLoading}
             onClick={() => onJoin(result.id)}
             className="bg-emerald-950 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-950/10 hover:brightness-125 transition-all active:scale-95 disabled:opacity-50"
           >
             {bookingLoading ? 'Joining...' : 'Book Seat'}
           </button>
        </div>
      </div>
    </motion.div>
  );
}
