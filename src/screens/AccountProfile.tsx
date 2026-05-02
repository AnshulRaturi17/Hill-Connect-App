import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft, 
  Shield, 
  LogOut,
  Camera,
  Star,
  MapPin,
  Clock
} from 'lucide-react';
import { Screen } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, signOut, verifyBeforeUpdateEmail } from 'firebase/auth';

export default function AccountProfile({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const user = auth.currentUser;
      if (!user) {
        onNavigate('auth');
        return;
      }

      try {
        const docRef = doc(db, 'profiles', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setFullName(data.full_name || '');
          setEmail(data.email || user.email || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Update Auth Profile (Display Name)
      await updateProfile(user, { displayName: fullName });

      let emailPending = false;
      // 2. Send Verification for Auth Email (if changed)
      if (email !== user.email) {
        try {
           await verifyBeforeUpdateEmail(user, email);
           emailPending = true;
        } catch (e: any) {
          if (e.code === 'auth/requires-recent-login') {
            throw new Error('Please log in again to change your email address for security.');
          }
          throw e;
        }
      }

      // 3. Update Firestore Profile (always update name, only update email if it wasn't a "change" or handle as pending)
      const docRef = doc(db, 'profiles', user.uid);
      await updateDoc(docRef, {
        full_name: fullName,
        // We only update the email in firestore if it's confirmed or if we want it to match
        // For simplicity and to match user expectation:
        email: email, 
        updated_at: serverTimestamp()
      });

      if (emailPending) {
        setSuccess('Profile updated! A verification email has been sent to your new address. Please confirm it to complete the email change.');
      } else {
        setSuccess('Profile updated successfully!');
      }
      
      setProfile(prev => ({ ...prev, full_name: fullName, email: email }));
    } catch (err: any) {
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        setError('Permission denied. Please ensure you are logged in correctly.');
      } else {
        setError(err.message || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onNavigate('landing');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-emerald-950/10 border-t-emerald-950 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-outline-variant/30 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const screen = profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard';
                onNavigate(screen as any);
              }}
              className="p-2 hover:bg-surface-container rounded-xl text-emerald-950 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-serif font-black text-emerald-950">Settings</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-[2.5rem] border border-outline-variant/30 shadow-sm p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-emerald-950/5" />
            
            <div className="relative mb-6 inline-block">
              <div className="w-32 h-32 rounded-[2.5rem] bg-surface border-4 border-white shadow-xl overflow-hidden mx-auto flex items-center justify-center text-emerald-950">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="opacity-20" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-3 bg-emerald-950 text-white rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all">
                <Camera size={20} />
              </button>
            </div>

            <h2 className="text-2xl font-serif font-black text-emerald-950 mb-1">{profile?.full_name}</h2>
            <div className="flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest text-on-surface-variant">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                <Shield size={12} /> {profile?.role}
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={12} className="fill-emerald-500 text-emerald-500" /> {profile?.rating || '5.0'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={20} />
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-outline-variant/30 rounded-2xl px-12 py-3.5 font-bold focus:ring-2 ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={20} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-outline-variant/30 rounded-2xl px-12 py-3.5 font-bold focus:ring-2 ring-emerald-500/20 focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold animate-shake">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold">
                {success}
              </div>
            )}

            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-950 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:bg-emerald-900 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Save Changes
            </button>
          </form>

          {/* Stats/History Preview */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-[2.5rem] border border-outline-variant/30 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-emerald-900">
                  <Clock size={24} />
                </div>
                <div>
                   <div className="text-2xl font-serif font-black text-emerald-950">{profile?.trips_completed || 0}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Trips Completed</div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2.5rem] border border-outline-variant/30 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-emerald-900">
                  <MapPin size={24} />
                </div>
                <div>
                   <div className="text-2xl font-serif font-black text-emerald-950">Local</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Primary Region</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
