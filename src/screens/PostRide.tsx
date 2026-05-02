import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Navigation, 
  Calendar, 
  IndianRupee, 
  Users, 
  CheckCircle2, 
  Loader2,
  Mountain,
  Clock
} from 'lucide-react';
import { Screen } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function PostRide({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departure_time: '',
    price: '',
    available_seats: '4'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('You must be logged in to post a ride.');
      }

      await addDoc(collection(db, 'rides'), {
        driver_id: user.uid,
        origin: formData.origin,
        destination: formData.destination,
        departure_time: new Date(formData.departure_time).toISOString(),
        price: parseFloat(formData.price),
        available_seats: parseInt(formData.available_seats),
        status: 'active',
        created_at: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => onNavigate('driver-dashboard'), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'rides');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-2xl border border-emerald-100 flex flex-col items-center text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
            <CheckCircle2 size={48} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-serif font-black text-emerald-950">Ride Published!</h2>
          <p className="text-on-surface-variant font-medium">Your climb is now live. Safe travels on the hills!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface min-h-full">
      {/* Header */}
      <div className="p-4 md:p-8 flex items-center gap-6">
        <button 
          onClick={() => onNavigate('driver-dashboard')} 
          className="p-3 bg-white hover:bg-surface-container rounded-2xl border border-outline-variant/30 text-emerald-950 transition-all flex items-center justify-center"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-black text-emerald-950">Launch New Ride</h1>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mt-1">Fill in the journey details</p>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-outline-variant/30 shadow-xl space-y-10 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Mountain size={200} />
          </div>

          <div className="grid md:grid-cols-2 gap-10 relative z-10">
            {/* Route Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <MapPin size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-950">Route Details</h3>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Departure Point</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Dehradun ISBT"
                    value={formData.origin}
                    onChange={e => setFormData({...formData, origin: e.target.value})}
                    className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-950 outline-none"
                  />
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Destination</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Mussoorie Mall Road"
                    value={formData.destination}
                    onChange={e => setFormData({...formData, destination: e.target.value})}
                    className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-950 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Logistics Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Calendar size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-950">Timing & Fare</h3>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Departure Time</label>
                  <div className="relative">
                    <input 
                      required
                      type="datetime-local" 
                      value={formData.departure_time}
                      onChange={e => setFormData({...formData, departure_time: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-950 outline-none appearance-none cursor-pointer"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-700/40">
                      <Clock size={18} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        now.setHours(now.getHours() + 1, 0, 0, 0);
                        setFormData({...formData, departure_time: now.toISOString().slice(0, 16)});
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      In 1 Hour
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0);
                        setFormData({...formData, departure_time: tomorrow.toISOString().slice(0, 16)});
                      }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      Tomorrow 9AM
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Fixed Price (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <input 
                        required
                        type="number" 
                        placeholder="250"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full pl-10 pr-4 py-4 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-950 outline-none"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 ml-1">Seats</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                      <select 
                        value={formData.available_seats}
                        onChange={e => setFormData({...formData, available_seats: e.target.value})}
                        className="w-full pl-10 pr-4 py-4 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-emerald-600 focus:bg-white transition-all font-bold text-emerald-950 outline-none appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <option key={num} value={num}>{num} Seats</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submission */}
          <div className="pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-on-surface-variant">
              <div className="p-3 bg-secondary/10 rounded-xl text-emerald-950">
                <Navigation size={20} className="rotate-45" />
              </div>
              <p className="text-xs font-medium leading-relaxed max-w-xs">
                By publishing, you agree to Hill Connect's safety guidelines and price transparency policy.
              </p>
            </div>
            <button 
              disabled={loading}
              type="submit"
              className="w-full md:w-auto px-12 py-5 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-900/20 hover:brightness-125 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Ride
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
