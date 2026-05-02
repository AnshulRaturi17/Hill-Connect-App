import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, TriangleAlert, Info, ShieldCheck, Zap } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Hazard } from '../types';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<any | null>(null);

  useEffect(() => {
    // Listen for NEW high/critical hazards reported in the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const q = query(
      collection(db, 'hazards'),
      where('severity', 'in', ['high', 'critical']),
      where('created_at', '>=', Timestamp.fromDate(oneHourAgo)),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const hazard = { id: change.doc.id, ...change.doc.data() } as Hazard;
          // Show toast for new ones
          setShowToast(hazard);
          setNotifications(prev => [hazard, ...prev].slice(0, 10));
          
          // Auto-hide toast
          setTimeout(() => setShowToast(null), 5000);
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hazards');
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Real-time Toast Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[200] w-full max-w-sm px-4"
          >
            <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-4 border-2 ${
              showToast.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <div className={`p-2 rounded-xl ${showToast.severity === 'critical' ? 'bg-red-600' : 'bg-orange-500'} text-white`}>
                <TriangleAlert size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950/40">Urgent Alert</p>
                <h4 className="font-serif font-black text-emerald-950 uppercase text-sm leading-tight mt-0.5">{showToast.title}</h4>
                <p className="text-[10px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-tight">{showToast.location}</p>
              </div>
              <button onClick={() => setShowToast(null)} className="p-1 hover:bg-black/5 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
