import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  CarFront, 
  Users,
  ChevronLeft,
  Mountain
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Screen } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function Auth({ onAuthSuccess, onNavigate }: { onAuthSuccess: () => void, onNavigate: (screen: Screen) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const docRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(docRef);

      if (!profileSnap.exists()) {
        const profilePath = `profiles/${user.uid}`;
        try {
          await setDoc(docRef, {
            full_name: user.displayName || 'Google User',
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            phone_number: '',
            role: role,
            rating: 5.0,
            trips_completed: 0,
            avatar_url: user.photoURL,
            created_at: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, profilePath);
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        let message = 'An unexpected error occurred. Please try again.';
        if (err.code === 'auth/invalid-credential') {
          message = 'Invalid email or password.';
        } else if (err.code === 'auth/network-request-failed') {
          message = 'Network error. Please check your connection.';
        }
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase Auth profile
        await updateProfile(user, { displayName: fullName });

        // Send Email Verification
        await sendEmailVerification(user);
        setVerificationSent(true);

        // Create Firestore profile
        const profilePath = `profiles/${user.uid}`;
        try {
          await setDoc(doc(db, 'profiles', user.uid), {
            full_name: fullName,
            username: username,
            email: email,
            phone_number: phoneNumber,
            vehicle_details: role === 'driver' ? vehicleDetails : null,
            role: role,
            rating: 5.0,
            trips_completed: 0,
            avatar_url: null,
            created_at: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, profilePath);
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      let message = 'An unexpected error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Try logging in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <button 
          onClick={() => onNavigate('landing')}
          className="mx-auto flex flex-col items-center mb-8 cursor-pointer group outline-none"
          aria-label="Go to landing page"
        >
          <div className="w-14 h-14 bg-emerald-950 rounded-2xl flex items-center justify-center text-secondary shadow-xl mb-3 group-hover:scale-110 transition-all">
             <Mountain size={28} />
          </div>
          <h1 className="text-2xl font-serif font-black text-emerald-950 tracking-tight uppercase leading-none">Hill Connect</h1>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60 mt-1">Transit Intelligence</p>
        </button>

        <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-emerald-900/5 border border-outline-variant/30 relative">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-black text-emerald-950 capitalize">
              {isLogin ? 'Welcome Back' : 'Join the Climb'}
            </h2>
            <p className="text-xs font-bold text-on-surface-variant mt-2">
              {isLogin ? 'Access your high-altitude dashboard' : 'Create an account to start carpooling'}
            </p>
          </div>

          {/* Google Auth removed as per user request to use manual verification flow */}


          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <div className="space-y-4 mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Select Your Role</p>
                <div className="grid grid-cols-2 gap-3">
                  <RoleButton 
                    active={role === 'passenger'} 
                    onClick={() => setRole('passenger')} 
                    icon={<Users size={18} />} 
                    label="Passenger" 
                  />
                  <RoleButton 
                    active={role === 'driver'} 
                    onClick={() => setRole('driver')} 
                    icon={<CarFront size={18} />} 
                    label="Driver" 
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                    <ShieldCheck size={20} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                    <Users size={20} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input 
                    type="tel"
                    placeholder="Phone Number"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
                  />
                </div>

                {role === 'driver' && (
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                      <CarFront size={20} />
                    </div>
                    <input 
                      type="text"
                      placeholder="Vehicle Details (Model, Plate)"
                      required
                      value={vehicleDetails}
                      onChange={(e) => setVehicleDetails(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
                    />
                  </div>
                )}
              </>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                <Mail size={20} />
              </div>
              <input 
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-emerald-700 transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-surface rounded-2xl border-2 border-transparent focus:border-emerald-950 focus:bg-white outline-none transition-all font-bold text-base"
              />
            </div>

            {verificationSent && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[13px] font-bold text-emerald-600 bg-emerald-50 py-3 px-[10px] rounded-xl border border-emerald-100"
              >
                Verification email sent! Please check your inbox.
              </motion.p>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[13px] font-bold text-red-600 bg-red-50 py-3 px-[10px] rounded-xl border border-red-100"
              >
                {error}
              </motion.p>
            )}

            <button 
              disabled={loading}
              className="w-full py-5 bg-emerald-950 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-900/20 hover:brightness-125 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center pb-2">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-black uppercase tracking-widest text-on-surface-variant hover:text-emerald-950 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </div>

        <button 
          onClick={() => onNavigate('landing')}
          className="mt-8 mx-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/60 hover:text-emerald-950 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}

function RoleButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
        active 
          ? 'bg-emerald-950 border-emerald-950 text-white shadow-lg' 
          : 'bg-surface border-transparent text-on-surface-variant hover:border-outline-variant'
      }`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
