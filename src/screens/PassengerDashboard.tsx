import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  TriangleAlert, 
  Bell, 
  Navigation, 
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';
import { Screen, Driver, Hazard } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit,
  onSnapshot
} from 'firebase/firestore';

export default function PassengerDashboard({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [recentDrives, setRecentDrives] = useState<Driver[]>([]);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeBookings: () => void;

    async function fetchData() {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (user) {
          const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }

          // 1. Real-time My Bookings
          const bQuery = query(
            collection(db, 'bookings'),
            where('passenger_id', '==', user.uid)
          );

          unsubscribeBookings = onSnapshot(bQuery, async (snap) => {
            const bookings = [];
            for (const bDoc of snap.docs) {
              const b = bDoc.data();
              const rideSnap = await getDoc(doc(db, 'rides', b.ride_id));
              const ride = rideSnap.exists() ? rideSnap.data() : null;
              
              const driverSnap = await getDoc(doc(db, 'profiles', b.driver_id));
              const driver = driverSnap.exists() ? driverSnap.data() : null;

              bookings.push({
                id: bDoc.id,
                ...b,
                ride,
                driver
              });
            }
            setMyBookings(bookings);
          }, (error) => {
            if (auth.currentUser) {
              handleFirestoreError(error, OperationType.LIST, 'bookings');
            }
          });
        }

        // 2. Fetch Top Rated Drivers
        const driversQuery = query(
          collection(db, 'profiles'),
          where('role', '==', 'driver'),
          orderBy('rating', 'desc'),
          limit(2)
        );
        const driversSnap = await getDocs(driversQuery);

        if (!driversSnap.empty) {
          const mappedDrivers: Driver[] = driversSnap.docs.map(dDoc => {
            const d = dDoc.data();
            return {
              uid: dDoc.id,
              full_name: d.full_name || 'Anonymous',
              username: d.username || 'user',
              email: d.email || '',
              phone_number: d.phone_number || '',
              role: 'driver',
              trips_completed: d.trips_completed || 0,
              avatar_url: d.avatar_url || null,
              created_at: d.created_at || null,
              id: dDoc.id,
              name: d.full_name || 'Anonymous',
              rating: d.rating || 5.0,
              trips: d.trips_completed || 0,
              vehicle: 'Verified Vehicle',
              plate: 'UK07 AD 0000',
              route: 'Local Routes',
              price: 250,
              seats: 4,
              image: d.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.full_name || 'Driver')}&background=064e3b&color=fff`,
              isVerified: true
            };
          });
          setRecentDrives(mappedDrivers);
        }

        // 3. Fetch Latest Hazards
        const hazardsQuery = query(
          collection(db, 'hazards'),
          orderBy('created_at', 'desc'),
          limit(3)
        );
        const hazardsSnap = await getDocs(hazardsQuery);

        if (!hazardsSnap.empty) {
          setHazards(hazardsSnap.docs.map(dDoc => ({ id: dDoc.id, ...dDoc.data() } as Hazard)));
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, [auth.currentUser]);

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8 max-w-6xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-emerald-950 mb-2">Pahadi Safar.</h1>
          <p className="text-on-surface-variant font-medium">Ready for your next hill journey, {profile?.full_name?.split(' ')[0] || 'Aryan'}?</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-emerald-900 text-xs font-black uppercase tracking-widest">Mussoorie Road: All Clear</span>
        </div>
      </div>

      {/* Real-time Bookings Status */}
      {myBookings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-emerald-950 flex items-center gap-2">
            My Ride Status
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {myBookings.map(booking => (
              <div key={booking.id} className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex items-center gap-4">
                <img 
                  src={booking.driver?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.driver?.full_name || 'Driver')}&background=064e3b&color=fff`} 
                  alt="Driver" 
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-950">{booking.driver?.full_name || 'Driver'}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 
                      booking.status === 'cancelled' ? 'bg-red-50 text-red-700' : 
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {booking.status === 'confirmed' && <CheckCircle2 size={10} />}
                      {booking.status === 'cancelled' && <XCircle size={10} />}
                      {booking.status === 'pending' && <Timer size={10} />}
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase truncate">
                    {booking.ride?.origin} → {booking.ride?.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Action Card */}
      <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="p-8 md:p-12 flex-1 space-y-8">
          <h2 className="text-2xl font-serif font-bold text-emerald-950">Where are you heading today?</h2>
          
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 group-hover:scale-110 transition-transform" size={20} />
                <input 
                  type="text" 
                  placeholder="Starting point?" 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-900 placeholder:text-on-surface-variant/50 outline-none"
                  defaultValue="Dehradun ISBT"
                />
              </div>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 group-hover:scale-110 transition-transform" size={20} />
                <input 
                  type="text" 
                  placeholder="Drop-off location?" 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-900 placeholder:text-on-surface-variant/50 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative group col-span-1">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900 group-focus-within:scale-110 group-focus-within:text-emerald-700 transition-all shadow-sm" size={20} />
                <input 
                  type="date" 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-900 outline-none cursor-pointer"
                />
              </div>
              <div className="relative group col-span-1">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900 group-focus-within:scale-110 group-focus-within:text-emerald-700 transition-all shadow-sm" size={20} />
                <input 
                  type="time" 
                  className="w-full pl-12 pr-4 py-4 bg-surface-container rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-900 outline-none cursor-pointer"
                />
              </div>
              <div className="relative group col-span-2 md:col-span-1">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-900 group-focus-within:scale-110 group-focus-within:text-emerald-700 transition-all shadow-sm" size={20} />
                <select className="w-full pl-12 pr-10 py-4 bg-surface-container rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-900 outline-none appearance-none cursor-pointer">
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Passengers</option>)}
                </select>
              </div>
              <button 
                onClick={() => onNavigate('ride-search')}
                className="col-span-2 md:col-span-1 bg-emerald-950 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-950/10 hover:brightness-125 transition-all flex items-center justify-center gap-2"
              >
                <Search size={18} strokeWidth={3} />
                Find Rides
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Recent & Recommended */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-emerald-950 flex items-center gap-3">
              Frequent Drivers
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Recommended</span>
            </h3>
            <button className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-emerald-900 transition-colors">View All</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-40 bg-surface-container animate-pulse rounded-3xl" />)
            ) : recentDrives.length > 0 ? (
              recentDrives.map(drive => (
                <DriverCard key={drive.id} driver={drive} />
              ))
            ) : (
              <div className="col-span-2 py-10 text-center bg-white rounded-3xl border border-dashed border-outline-variant">
                <Users className="mx-auto text-on-surface-variant/30 mb-2" size={32} />
                <p className="text-sm font-bold text-emerald-950">No verified drivers found yet.</p>
              </div>
            )}
          </div>

          {/* Quick Tip / News */}
          <div className="bg-surface-container-high rounded-3xl p-8 border border-outline-variant/20 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 flex items-center justify-center text-secondary shrink-0 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-emerald-900 text-lg">Safety First Policy</h4>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Hill Connect drivers are trained to handle extreme weather & night driving. Always check for the verification badge before booking.</p>
            </div>
            <button className="whitespace-nowrap bg-white text-emerald-950 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm border border-outline-variant/30 hover:bg-emerald-50 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Right Column: Hazards & Alerts */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-emerald-950 flex items-center gap-3">
              Route Hazards
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            </h3>
            <button 
               onClick={() => onNavigate('hazard-map')}
               className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-emerald-900 transition-colors"
            >
              Open Map
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-20 bg-surface-container animate-pulse rounded-2xl" />)
            ) : hazards.length > 0 ? (
              hazards.map(h => (
                <HazardItem 
                  key={h.id}
                  type={h.type}
                  title={h.title}
                  location={h.location}
                  time={h.time || 'Upcoming'}
                  urgency={(h.urgency as any) || 'Low'}
                />
              ))
            ) : (
              <div className="py-6 text-center bg-white rounded-2xl border border-dashed border-outline-variant">
                <ShieldCheck className="mx-auto text-emerald-900/20 mb-2" size={24} />
                <p className="text-[10px] font-black uppercase text-emerald-950">All routes clear</p>
              </div>
            )}
          </div>

          {/* User Achievement / Status */}
          <div className="bg-emerald-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-emerald-950 font-black">
                   HC
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/50">Member Since</p>
                   <p className="font-serif font-bold">JAN 2024</p>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Carbon Saved</span>
                  <span className="text-secondary">42.5 KG</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-secondary"
                  />
                </div>
              </div>

              <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                View My Impact
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DriverCard: React.FC<{ driver: Driver }> = ({ driver }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="flex gap-5">
        <div className="relative shrink-0">
          <img src={driver.image} alt={driver.name} className="w-14 h-14 rounded-2xl object-cover shadow-md" />
          {driver.isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-lg shadow-sm">
              <ShieldCheck size={14} className="text-secondary fill-secondary/20" strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
             <h4 className="font-serif font-black text-emerald-950 truncate group-hover:text-emerald-800 transition-colors uppercase tracking-tight">{driver.name}</h4>
             <div className="flex items-center gap-1 shrink-0">
               <Star size={14} className="text-secondary fill-secondary" />
               <span className="text-xs font-black text-emerald-900">{driver.rating}</span>
             </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-3">{driver.vehicle} • {driver.trips} trips</p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[9px] font-black uppercase tracking-tighter bg-surface-container px-2 py-1 rounded-md text-on-surface-variant">{driver.route}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-5 pt-5 border-t border-dashed border-outline-variant/50 flex items-center justify-between">
        <div>
           <p className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Fare Share</p>
           <p className="text-xl font-serif font-black text-emerald-950">₹{driver.price}</p>
        </div>
        <button className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center group-hover:bg-emerald-900 group-hover:text-white transition-all">
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

const HazardItem: React.FC<{ 
  type: string, 
  title: string, 
  location: string, 
  time: string, 
  urgency: 'High' | 'Medium' | 'Low' 
}> = ({ type, title, location, time, urgency }) => {
  const colors = {
    High: 'bg-red-50 text-red-700 border-red-100',
    Medium: 'bg-orange-50 text-orange-700 border-orange-100',
    Low: 'bg-blue-50 text-blue-700 border-blue-100'
  };

  const icons = {
    landslide: <TriangleAlert className="shrink-0" size={18} />,
    weather: <Bell className="shrink-0" size={18} />,
    blockage: <Navigation className="shrink-0 rotate-90" size={18} />
  };

  return (
    <div className={`p-4 rounded-2xl border flex gap-4 items-start ${colors[urgency]} transition-transform hover:scale-[1.02] cursor-pointer`}>
      <div className="mt-1">
        {(icons as any)[type] || icons.blockage}
      </div>
      <div className="flex-1 space-y-1">
        <h5 className="text-xs font-black uppercase tracking-wider">{title}</h5>
        <p className="text-xs font-medium opacity-80">{location}</p>
        <div className="text-[10px] font-bold opacity-60 flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-current"></div>
          {time}
        </div>
      </div>
      <div className="shrink-0">
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${urgency === 'High' ? 'bg-red-500 text-white' : 'bg-current/10'}`}>
          {urgency}
        </div>
      </div>
    </div>
  );
}
