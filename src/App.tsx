/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  UserCircle, 
  Home, 
  History, 
  ShieldCheck, 
  Settings, 
  HelpCircle, 
  PhoneCall,
  Search,
  TriangleAlert,
  CarFront,
  Menu,
  X,
  Mountain,
  Plus,
  LogOut
} from 'lucide-react';
import { Screen } from './types';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Importing screens
import Landing from './screens/Landing';
import PassengerDashboard from './screens/PassengerDashboard';
import RideSearch from './screens/RideSearch';
import HazardMap from './screens/HazardMap';
import DriverDashboard from './screens/DriverDashboard';
import PostRide from './screens/PostRide';
import AccountProfile from './screens/AccountProfile';
import Auth from './screens/Auth';
import NotificationCenter from './components/NotificationCenter';
import EmergencySOS from './components/EmergencySOS';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user);
      if (user) {
        fetchProfile(user.uid);
      } else {
        setProfile(null);
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Automatic redirect after login/signup
  useEffect(() => {
    if (session && currentScreen === 'auth') {
      // Wait for profile to load (or fail)
      if (!loadingProfile) {
        const pendingRide = sessionStorage.getItem('pending_ride_id');
        if (pendingRide) {
          setCurrentScreen('ride-search');
        } else {
          // If no profile yet, maybe it's a new account still indexing or failed creation
          // Default to passenger-dashboard as a fallback
          const dashboard = profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard';
          setCurrentScreen(dashboard as Screen);
        }
      }
    }
  }, [session, profile, currentScreen, loadingProfile]);

  const fetchProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentScreen('landing');
  };

  const navigate = (screen: Screen) => {
    const protectedScreens: Screen[] = ['passenger-dashboard', 'driver-dashboard', 'post-ride', 'account'];
    if (protectedScreens.includes(screen) && !session) {
      setCurrentScreen('auth');
    } else {
      setCurrentScreen(screen);
    }
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-6 px-4 overflow-y-auto no-scrollbar">
      {session && (
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-950/10 overflow-hidden bg-surface flex items-center justify-center text-emerald-900 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={28} />
            )}
          </div>
          <div>
            <p className="font-serif font-black text-emerald-950 uppercase tracking-tight leading-none mb-1">{profile?.full_name || 'Hiker'}</p>
            <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">{profile?.role || 'Member'}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-2">
        <SidebarItem 
          icon={<Home size={20} />} 
          label="Home" 
          active={currentScreen === (profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard')} 
          onClick={() => navigate(profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard' as any)} 
        />
        <SidebarItem 
          icon={<Search size={20} />} 
          label="Search Rides" 
          active={currentScreen === 'ride-search'} 
          onClick={() => navigate('ride-search')} 
        />
        <SidebarItem 
          icon={<TriangleAlert size={20} />} 
          label="Hazards" 
          active={currentScreen === 'hazard-map'} 
          onClick={() => navigate('hazard-map')} 
        />
        {profile?.role === 'driver' && (
          <SidebarItem 
            icon={<Plus size={20} />} 
            label="Post Ride" 
            active={currentScreen === 'post-ride'} 
            onClick={() => navigate('post-ride')} 
          />
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/30 space-y-2">
        <SidebarItem 
          icon={<LogOut size={20} className="text-red-600" />} 
          label="Sign Out" 
          onClick={handleLogout} 
        />
        
        <div 
          onClick={() => setIsSOSOpen(true)}
          className="mt-4 p-4 bg-red-50 rounded-2xl flex items-center gap-3 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <TriangleAlert className="text-red-600" size={20} />
          <div>
            <p className="font-black text-[10px] text-red-600 uppercase tracking-widest">Emergency SOS</p>
            <p className="text-[9px] text-red-900/60 font-bold leading-tight mt-0.5 uppercase tracking-tighter">Tap for immediate help</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <NotificationCenter />
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 md:h-20 px-4 md:px-8 bg-white border-b border-outline-variant/30 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          {(currentScreen !== 'landing' && currentScreen !== 'auth') && (
            <button 
              className="md:hidden p-2 hover:bg-surface-container rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <button 
            className="flex items-center gap-2 cursor-pointer group outline-none" 
            onClick={() => navigate('landing')}
            aria-label="Go to landing page"
          >
            <Mountain className="text-emerald-800 transition-transform group-hover:scale-110" size={28} />
            <span className="text-xl md:text-2xl font-black tracking-tight text-emerald-900 font-serif">Hill Connect</span>
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {currentScreen === 'landing' || currentScreen === 'auth' ? (
            <div className="hidden md:flex items-center gap-8 mr-8">
              <a href="#" className="font-black text-sm uppercase tracking-widest text-emerald-900 border-b-2 border-emerald-900 pb-1">About</a>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 md:p-3 rounded-full hover:bg-surface-container transition-all text-on-surface-variant relative"
              >
                <Bell size={24} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute top-20 right-4 w-72 bg-white rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden z-50">
                  <div className="p-4 border-b border-outline-variant/30 bg-surface">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-950">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-4 border-b border-outline-variant/10 hover:bg-surface transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-emerald-900 mb-1">Welcome to Hill Connect!</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">Your mountain travel partner is now active.</p>
                    </div>
                    <div className="p-4 hover:bg-surface transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-emerald-900 mb-1">Identity Verified</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">Your profile badge has been updated.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 hover:bg-surface transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
              <button 
                onClick={() => navigate('account')}
                className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-emerald-50 bg-white flex items-center justify-center text-on-surface-variant shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                {profile?.avatar_url ? (
                   <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <UserCircle size={24} />
                )}
              </button>
            </>
          )}
          
          {(currentScreen === 'landing' && !session) && (
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('auth')}
                className="px-8 py-3.5 rounded-xl bg-surface-container-high text-emerald-950 font-black uppercase tracking-widest text-xs hover:bg-surface-container-highest transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('auth')}
                className="px-8 py-3.5 rounded-xl bg-emerald-950 text-white font-black uppercase tracking-widest text-xs hover:brightness-125 transition-all shadow-lg shadow-emerald-900/10"
              >
                Join Now
              </button>
            </div>
          )}
          
          {(currentScreen === 'landing' && session) && (
            <button 
              onClick={() => navigate(profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard')}
              className="px-6 py-2.5 rounded-xl bg-emerald-950 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-125 transition-all shadow-lg shadow-emerald-900/10"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 pt-16 md:pt-20">
        {/* Sidebar Desktop */}
        {(currentScreen !== 'landing' && currentScreen !== 'auth') && (
          <aside className="hidden md:block w-72 lg:w-80 border-r border-outline-variant/30 sticky top-20 h-[calc(100vh-80px)] bg-white">
            <SidebarContent />
          </aside>
        )}

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-[55] md:hidden"
              />
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-80 bg-white z-[60] md:hidden shadow-2xl pt-4"
              >
                 <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {currentScreen === 'landing' && <Landing onNavigate={navigate} />}
              {currentScreen === 'auth' && (
                <Auth 
                  onAuthSuccess={() => {
                     // Redirection handled by useEffect once profile is loaded
                  }} 
                  onNavigate={navigate}
                />
              )}
              {currentScreen === 'passenger-dashboard' && <PassengerDashboard onNavigate={navigate} />}
              {currentScreen === 'ride-search' && <RideSearch onNavigate={navigate} />}
              {currentScreen === 'hazard-map' && <HazardMap />}
              {currentScreen === 'driver-dashboard' && <DriverDashboard onNavigate={navigate} />}
              {currentScreen === 'post-ride' && <PostRide onNavigate={navigate} />}
              {currentScreen === 'account' && <AccountProfile onNavigate={navigate} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <EmergencySOS 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
      />

      {/* Bottom Nav Mobile */}
      {(currentScreen !== 'landing' && currentScreen !== 'auth') && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t border-outline-variant/30 flex justify-around items-center px-2 z-[50] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <BottomNavItem 
            icon={<Home size={22} />} 
            label="Home" 
            active={currentScreen === 'passenger-dashboard' || currentScreen === 'driver-dashboard'} 
            onClick={() => navigate(profile?.role === 'driver' ? 'driver-dashboard' : 'passenger-dashboard')} 
          />
          <BottomNavItem 
            icon={<Search size={22} />} 
            label="Search" 
            active={currentScreen === 'ride-search'} 
            onClick={() => navigate('ride-search')} 
          />
          <BottomNavItem 
            icon={<TriangleAlert size={22} />} 
            label="Hazards" 
            active={currentScreen === 'hazard-map'} 
            onClick={() => navigate('hazard-map')} 
          />
          <BottomNavItem 
            icon={<LogOut size={22} />} 
            label="Logout" 
            active={false} 
            onClick={handleLogout} 
          />
        </nav>
      )}

      {/* FAB Mobile Contextual */}
      {(currentScreen === 'passenger-dashboard' && session) && (
        <button 
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-emerald-950 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-90"
          onClick={() => navigate('ride-search')}
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-emerald-50 text-emerald-900 border-l-4 border-emerald-800' 
          : 'text-on-surface-variant hover:bg-surface-container hover:pl-6'
      }`}
    >
      <span className={active ? 'text-emerald-800' : 'group-hover:text-emerald-700 transition-colors'}>
        {icon}
      </span>
      <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
    </button>
  );
}

function BottomNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
        active ? 'text-emerald-900' : 'text-on-surface-variant'
      }`}
    >
      <div className={`p-1.5 rounded-xl ${active ? 'bg-emerald-50' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase mt-1 tracking-tighter">{label}</span>
    </button>
  );
}
