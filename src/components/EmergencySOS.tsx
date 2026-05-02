import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, X, AlertCircle, Shield, Truck, Stethoscope, LifeBuoy } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  icon: React.ReactNode;
  category: 'primary' | 'rescue' | 'health';
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: '112',
    name: 'National Emergency',
    number: '112',
    description: 'All-in-one emergency service (Police, Fire, Medical)',
    icon: <AlertCircle className="text-red-600" />,
    category: 'primary'
  },
  {
    id: 'sdrf',
    name: 'SDRF Uttarakhand',
    number: '1070',
    description: 'State Disaster Response Force for mountain rescue',
    icon: <LifeBuoy className="text-emerald-600" />,
    category: 'rescue'
  },
  {
    id: 'ambulance',
    name: 'Medical Ambulance',
    number: '108',
    description: 'Doon/Mussoorie emergency medical transport',
    icon: <Stethoscope className="text-blue-600" />,
    category: 'health'
  },
  {
    id: 'women',
    name: 'Women Helpline',
    number: '1091',
    description: '24/7 Safety and protection for women',
    icon: <Shield className="text-pink-600" />,
    category: 'primary'
  },
  {
    id: 'forest',
    name: 'Forest Fire Desk',
    number: '1800-180-4127',
    description: 'Report wildfires in the Himalayan foothills',
    icon: <AlertCircle className="text-orange-600" />,
    category: 'rescue'
  },
  {
    id: 'police',
    name: 'Police Control',
    number: '100',
    description: 'Immediate police assistance & security',
    icon: <Shield className="text-indigo-600" />,
    category: 'primary'
  },
  {
    id: 'child',
    name: 'Child Helpline',
    number: '1098',
    description: 'Emergency assistance for children in distress',
    icon: <Shield className="text-cyan-600" />,
    category: 'primary'
  }
];

interface EmergencySOSProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencySOS({ isOpen, onClose }: EmergencySOSProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-red-950/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[600px]"
          >
            {/* Header */}
            <div className="p-6 bg-red-600 text-white relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                  <Phone size={24} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Emergency SOS</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">One-tap critical assistance</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="px-6 py-3 bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest text-center border-b border-red-100 italic">
              Misuse of emergency numbers is a punishable offense
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {EMERGENCY_CONTACTS.map((contact) => (
                <motion.a
                  key={contact.id}
                  href={`tel:${contact.number}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-4 p-4 bg-surface-container-low hover:bg-red-50 rounded-2xl border border-outline-variant/20 hover:border-red-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {contact.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-black text-emerald-950 text-sm uppercase tracking-tight">{contact.name}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant truncate">{contact.description}</p>
                    <p className="text-xs font-black text-red-600 tracking-widest mt-0.5">{contact.number}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/20">
                    <Phone size={18} fill="currentColor" />
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-outline-variant/30 text-center">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] leading-relaxed">
                Stay calm during the call. <br />
                State your location and hazard clearly.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
