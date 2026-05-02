import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CarFront, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  TrendingUp, 
  Users,
  ShieldCheck,
  TriangleAlert,
  Calendar,
  Navigation,
  X,
  Loader2,
  Zap
} from 'lucide-react';
import { Screen, Driver } from '../types';
import LiveMap from '../components/LiveMap';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

interface BookingRequest {
  id: string;
  seats_booked: number;
  status: string;
  passenger: {
    full_name: string;
    avatar_url: string;
  };
  ride: {
    id: string;
    origin: string;
    destination: string;
    price: number;
    departure_time: string;
  };
}

export default function DriverDashboard({ onNavigate }: { onNavigate?: (screen: Screen) => void }) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeBookings: () => void;

    async function initDashboard() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {

        // 1. Fetch Profile
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          setProfile({ id: profileSnap.id, ...profileSnap.data() });
        }

        // 2. Real-time Bookings for this driver
        const bookingsQuery = query(
          collection(db, 'bookings'), 
          where('driver_id', '==', user.uid),
          where('status', '==', 'pending')
        );

          unsubscribeBookings = onSnapshot(bookingsQuery, async (snapshot) => {
            const bookingData: BookingRequest[] = [];
            
            for (const bookingDoc of snapshot.docs) {
              const b = bookingDoc.data();
              
              // Fetch passenger details
              const passengerSnap = await getDoc(doc(db, 'profiles', b.passenger_id));
              const passengerData = passengerSnap.exists() ? passengerSnap.data() : { full_name: 'Unknown', avatar_url: '' };
              
              // Fetch ride details
              const rideSnap = await getDoc(doc(db, 'rides', b.ride_id));
              const rideData = rideSnap.exists() ? rideSnap.data() : null;

              if (rideData) {
                bookingData.push({
                  id: bookingDoc.id,
                  seats_booked: b.seats_booked,
                  status: b.status,
                  passenger: {
                    full_name: passengerData.full_name,
                    avatar_url: passengerData.avatar_url
                  },
                  ride: {
                    id: b.ride_id,
                    origin: rideData.origin,
                    destination: rideData.destination,
                    price: rideData.price,
                    departure_time: rideData.departure_time
                  }
                });
              }
            }
            setBookings(bookingData);
            setLoading(false);
          }, (error) => {
            if (auth.currentUser) {
              handleFirestoreError(error, OperationType.LIST, 'bookings');
            }
            setLoading(false);
          });

      } catch (err) {
        console.error('Error initializing dashboard:', err);
        setLoading(false);
      }
    }

    initDashboard();
    return () => {
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, [auth.currentUser]);

  const handleAction = async (booking: BookingRequest, newStatus: 'confirmed' | 'cancelled') => {
    try {
      // 1. Update Booking Status
      await updateDoc(doc(db, 'bookings', booking.id), { status: newStatus });
      
      // 2. If accepted, decrement available seats in the ride
      if (newStatus === 'confirmed') {
        const rideRef = doc(db, 'rides', booking.ride.id);
        const rideSnap = await getDoc(rideRef);
        if (rideSnap.exists()) {
          const currentSeats = rideSnap.data().available_seats;
          if (currentSeats < booking.seats_booked) {
             alert('Not enough seats available left for this request.');
             // Optionally revert booking status if you want to be strict, 
             // but usually search filters should prevent this.
             return;
          }
          await updateDoc(rideRef, {
            available_seats: Math.max(0, currentSeats - booking.seats_booked)
          });
        }
      }

      alert(`Request ${newStatus === 'confirmed' ? 'Accepted' : 'Rejected'}`);
    } catch (err) {
      console.error('Error updating booking:', err);
      alert('Failed to update request status.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24 md:pb-8 max-w-6xl mx-auto">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Driver')}&background=064e3b&color=fff`} 
              alt="Profile" 
              className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] object-cover border-4 border-emerald-50 shadow-xl" 
            />
            {profile?.role === 'driver' && (
              <div className="absolute -bottom-2 -right-2 bg-emerald-950 text-secondary p-1.5 rounded-xl shadow-lg border-2 border-white">
                <ShieldCheck size={20} />
              </div>
            )}
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
               <h1 className="text-3xl md:text-4xl font-serif font-black text-emerald-950 uppercase tracking-tight">
                 {profile?.full_name || 'Driver'}
               </h1>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <Star size={16} className="text-secondary fill-secondary" />
                   <span className="font-black text-emerald-900">{profile?.rating || '5.0'}</span>
                </div>
                <div className="w-1 h-1 bg-emerald-200 rounded-full" />
                <p className="text-xs font-bold text-on-surface-variant font-black uppercase tracking-wider">
                  {profile?.trips_completed || 0} Total Trips
                </p>
             </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate?.('post-ride')}
            className="flex-1 md:flex-none py-4 px-10 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-950/20 hover:brightness-125 transition-all"
          >
             Post Ride
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard label="Today's Earnings" value="₹1,240" trend="+12%" icon={<IndianRupee />} />
        <StatCard label="Trip Requests" value={bookings.length.toString()} trend="New" icon={<ArrowRight />} highlight />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Active & Pending Requests */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-black text-emerald-950 flex items-center gap-3">
                 Live Feed
                 <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-black uppercase flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                   {bookings.length} requests
                 </span>
              </h3>
              <div className="flex gap-2">
                 <button className="p-2 bg-emerald-950 text-white rounded-lg"><CheckCircle2 size={18} /></button>
              </div>
           </div>            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                   <Loader2 size={32} className="animate-spin text-emerald-950/20" />
                </div>
              ) : bookings.length > 0 ? (
                bookings.map(booking => (
                  <RequestItem 
                    key={booking.id}
                    name={booking.passenger?.full_name || 'Hiker'} 
                    origin={booking.ride.origin} 
                    dest={booking.ride.destination} 
                    party={`${booking.seats_booked} Person${booking.seats_booked > 1 ? 's' : ''}`} 
                    fare={`₹${booking.ride.price}`} 
                    time={new Date(booking.ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    onAccept={() => handleAction(booking, 'confirmed')}
                    onReject={() => handleAction(booking, 'cancelled')}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-surface-container rounded-[2rem] border border-dashed border-outline-variant">
                   <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">No active requests found</p>
                </div>
              )}
            </div>

            {/* Driver Instructions Section */}
            <div className="mt-12 bg-white rounded-[3rem] p-10 border border-emerald-100 shadow-sm">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-950 text-secondary rounded-2xl flex items-center justify-center">
                     <ShieldCheck size={24} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-serif font-black text-emerald-950">Driver Guidelines</h3>
                     <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Essential Mountain Safety</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">01</div>
                        <div>
                           <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide mb-1">Mountain Etiquette</h4>
                           <p className="text-xs text-on-surface-variant leading-relaxed">Always yield to uphill traffic on narrow roads. Use engine braking (lower gears) on steep descents to prevent brake fade.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">02</div>
                        <div>
                           <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide mb-1">Hazard Awareness</h4>
                           <p className="text-xs text-on-surface-variant leading-relaxed">Check the Hazard Map before every trip. Monsoon travel requires extra caution for landslide warnings in 'Critical' zones.</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">03</div>
                        <div>
                           <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide mb-1">Identity Verification</h4>
                           <p className="text-xs text-on-surface-variant leading-relaxed">Confirm the passenger's profile photo and booking ID before allowing them in the vehicle for community safety.</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shrink-0">04</div>
                        <div>
                           <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide mb-1">Timing Precision</h4>
                           <p className="text-xs text-on-surface-variant leading-relaxed">Departure times are critical for shared transit. Aim to be at the pickup point 10 minutes early to ensure thermal efficiency.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Driver Tools Sidebar */}
         <div className="space-y-6">
            <div className="bg-emerald-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="font-serif font-black text-lg">Quick Tools</h3>
                     <Zap size={20} className="text-secondary" />
                  </div>
                  <div className="space-y-3">
                     <SidebarTool icon={<IndianRupee size={16} />} label="Earnings Dashboard" />
                     <SidebarTool icon={<Clock size={16} />} label="Shift History" />
                     <SidebarTool icon={<Users size={16} />} label="Community Forum" />
                  </div>
               </div>
            </div>

            <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100/50">
               <h4 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Performance
               </h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-on-surface-variant font-black">Acceptance Rate</span>
                     <span className="text-xs font-black text-emerald-950">94%</span>
                  </div>
                  <div className="h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-950 w-[94%]" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function SidebarTool({ icon, label }: { icon: React.ReactNode, label: string }) {
   return (
      <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left">
         <div className="text-secondary">{icon}</div>
         <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </button>
   );
}

function StatCard({ label, value, trend, icon, highlight = false }: { label: string, value: string, trend: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:shadow-xl group cursor-pointer ${
      highlight 
        ? 'bg-emerald-950 text-white border-emerald-950' 
        : 'bg-white text-emerald-950 border-outline-variant/30'
    }`}>
      <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 ${
        highlight ? 'bg-secondary text-emerald-950 shadow-lg shadow-secondary/20' : 'bg-emerald-50 text-emerald-950'
      }`}>
        {icon}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-white/60' : 'text-on-surface-variant'}`}>{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-serif font-black tracking-tight">{value}</h4>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
          highlight ? 'bg-white/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
        }`}>{trend}</span>
      </div>
    </div>
  );
}

const RequestItem: React.FC<{ 
  name: string, 
  origin: string, 
  dest: string, 
  party: string, 
  fare: string, 
  time: string,
  onAccept: () => void | Promise<void>,
  onReject: () => void | Promise<void>
}> = ({ name, origin, dest, party, fare, time, onAccept, onReject }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/30 hover:border-secondary transition-all group flex flex-col md:flex-row items-center gap-8">
      <div className="flex-1 w-full space-y-4">
         <div className="flex items-center gap-4">
            <div className="relative">
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Passenger')}&background=064e3b&color=fff`} alt={name} className="w-12 h-12 rounded-2xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h4 className="font-serif font-black text-emerald-950 uppercase tracking-tight">{name}</h4>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{party} • Verified</p>
            </div>
            <div className="ml-auto text-right md:hidden">
              <p className="text-xl font-serif font-black text-emerald-950">{fare}</p>
              <p className="text-[8px] font-black uppercase text-on-surface-variant">{time}</p>
            </div>
         </div>
         
         <div className="flex items-center gap-3 text-xs w-full">
            <div className="flex-1 px-4 py-2 bg-surface-container rounded-xl font-bold flex items-center gap-2 text-emerald-950 truncate">
               <MapPin size={12} className="shrink-0 text-emerald-700" />
               {origin}
            </div>
            <ArrowRight size={14} className="text-on-surface-variant shrink-0" />
            <div className="flex-1 px-4 py-2 bg-surface-container rounded-xl font-bold flex items-center gap-2 text-emerald-950 truncate">
               <Navigation size={12} className="shrink-0 rotate-90 text-orange-600" />
               {dest}
            </div>
         </div>
      </div>

      <div className="shrink-0 flex items-center gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-outline-variant/30 pt-6 md:pt-0 md:pl-8">
         <div className="hidden md:block text-right">
           <p className="text-2xl font-serif font-black text-emerald-950">{fare}</p>
           <p className="text-[9px] font-black tracking-widest text-on-surface-variant uppercase">{time}</p>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={onReject}
              className="flex-1 md:flex-none p-4 rounded-2xl bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
            >
               <X size={20} />
            </button>
            <button 
              onClick={onAccept}
              className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] hover:bg-secondary hover:text-emerald-950 transition-all"
            >
               Accept
            </button>
         </div>
      </div>
    </div>
  );
}

function VehicleGauge({ label, value, status, color }: { label: string, value: string, status: string, color: string }) {
  return (
    <div className="space-y-1">
       <p className="text-[10px] font-black uppercase tracking-tighter text-on-surface-variant/60">{label}</p>
       <p className="text-xs font-black text-emerald-950">{value}</p>
       <p className={`text-[8px] font-bold uppercase ${color}`}>{status}</p>
    </div>
  );
}

function QuickAction({ icon, label, desc }: { icon: React.ReactNode, label: string, desc: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-outline-variant/30 hover:bg-emerald-50 cursor-pointer transition-all flex items-center gap-4 group">
       <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-emerald-950 group-hover:bg-emerald-950 group-hover:text-white transition-all">
         {icon}
       </div>
       <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">{label}</h4>
          <p className="text-[10px] font-bold text-on-surface-variant">{desc}</p>
       </div>
       <ArrowRight size={14} className="ml-auto text-on-surface-variant group-hover:text-emerald-950 group-hover:translate-x-1 transition-all" />
    </div>
  );
}
