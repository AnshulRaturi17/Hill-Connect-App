import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TriangleAlert, 
  MapPin, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Clock, 
  Share2, 
  ThumbsUp, 
  MessageSquare,
  X,
  Target,
  Plus,
  ArrowRight,
  ShieldCheck,
  Mountain,
  Navigation,
  Route,
  Timer,
  AlertTriangle,
  Bell,
  Phone
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import EmergencySOS from '../components/EmergencySOS';
import { Hazard } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  deleteDoc
} from 'firebase/firestore';

export default function HazardMap() {
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'routing'>('alerts');
  const [selectedRoute, setSelectedRoute] = useState<'standard' | 'safe'>('standard');

  const sampleRoutesArr = {
    standard: [
      [30.4599, 78.0664],
      [30.4550, 78.0700],
      [30.4500, 78.0800],
      [30.4450, 78.0900],
    ] as [number, number][],
    safe: [
      [30.4599, 78.0664],
      [30.4650, 78.0750],
      [30.4700, 78.0850],
      [30.4450, 78.0900],
    ] as [number, number][],
  };

  const [reportForm, setReportForm] = useState({
    type: 'weather' as Hazard['type'],
    severity: 'medium' as Hazard['severity'],
    title: '',
    description: '',
    location: '',
    lat: null as number | null,
    lng: null as number | null
  });

  const getSeverityColor = (sev: Hazard['severity']) => {
    switch(sev) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-emerald-500';
      default: return 'bg-emerald-500';
    }
  };

  const getHazardIcon = (type: Hazard['type']) => {
    switch(type) {
      case 'weather': return <CloudRain size={20} />;
      case 'traffic': return <ArrowRight size={20} className="rotate-[-135deg]" />;
      case 'landslide': return <TriangleAlert size={20} className="text-orange-600" />;
      case 'construction': return <Target size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'hazards'), {
        ...reportForm,
        reporter: auth.currentUser.email?.split('@')[0] || 'Anonymous',
        time: 'Just now',
        upvotes: 0,
        comments: 0,
        created_at: serverTimestamp(),
        lat: reportForm.lat || 30.4599 + (Math.random() - 0.5) * 0.05,
        lng: reportForm.lng || 78.0664 + (Math.random() - 0.5) * 0.05
      });
      setIsReporting(false);
      setIsPickingLocation(false);
      setReportForm({
        type: 'weather',
        severity: 'medium',
        title: '',
        description: '',
        location: '',
        lat: null,
        lng: null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'hazards');
    }
  };

  const handleVerify = async (hazardId: string) => {
    try {
      const hazardRef = doc(db, 'hazards', hazardId);
      await updateDoc(hazardRef, {
        upvotes: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hazards/${hazardId}`);
    }
  };

  const handleDeleteHazard = async (e: React.MouseEvent, hazardId: string) => {
    e.stopPropagation();
    console.log('Attempting to delete hazard:', hazardId);
    
    if (!window.confirm('Are you sure you want to remove this hazard alert from the live map?')) {
      console.log('Deletion cancelled by user');
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'hazards', hazardId));
      console.log('Hazard deleted successfully:', hazardId);
      if (selectedHazard?.id === hazardId) {
        setSelectedHazard(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hazards/${hazardId}`);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isPickingLocation) {
      setReportForm(prev => ({ ...prev, lat, lng }));
      setIsPickingLocation(false);
    }
  };

  useEffect(() => {
    // 1. Initial Fetch and Real-time Subscription
    const hazardsQuery = query(collection(db, 'hazards'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(hazardsQuery, (snapshot) => {
      const hazardData: Hazard[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Hazard));
      setHazards(hazardData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hazards');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="h-full flex flex-col md:flex-row relative bg-surface overflow-hidden">
      {/* Map visualization area */}
      <div className="flex-1 relative bg-emerald-50 overflow-hidden">
        <LiveMap 
          height="100%"
          center={[30.4599, 78.0664]} // Mussoorie Coordinates
          zoom={12}
          markers={[
            ...hazards.map(h => ({
              id: h.id,
              position: [h.lat || 30.4599, h.lng || 78.0664] as [number, number],
              title: h.title,
              description: h.description,
              type: (h.severity === 'critical' ? 'danger' : 'hazard') as 'danger' | 'hazard',
              hazardType: h.type
            })),
            ...(reportForm.lat && reportForm.lng ? [{
              id: 'temp-selection',
              position: [reportForm.lat, reportForm.lng] as [number, number],
              title: 'Selected Location',
              type: 'selection' as const
            }] : [])
          ]}
          onClick={handleMapClick}
          routes={activeTab === 'routing' ? [
            {
              id: 'route-standard',
              coordinates: sampleRoutesArr.standard,
              color: selectedRoute === 'standard' ? '#064e3b' : '#94a3b8',
              weight: selectedRoute === 'standard' ? 6 : 4,
              opacity: selectedRoute === 'standard' ? 1 : 0.4
            },
            {
              id: 'route-safe',
              coordinates: sampleRoutesArr.safe,
              color: selectedRoute === 'safe' ? '#fbbf24' : '#94a3b8',
              weight: selectedRoute === 'safe' ? 6 : 4,
              opacity: selectedRoute === 'safe' ? 1 : 0.4
            }
          ] : []}
        />

        {/* Floating SOS Button */}
        <div className="absolute top-6 right-6 z-[400] flex flex-col gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSOSOpen(true)}
            className="w-16 h-16 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center gap-1 border-4 border-white animate-pulse"
          >
            <Phone size={24} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-tighter">SOS</span>
          </motion.button>
        </div>


      </div>

      {/* Hazard Sidebar Information */}
      <aside className="w-full md:w-96 min-h-[50vh] md:min-h-full bg-white border-l border-outline-variant/30 flex flex-col z-30 shadow-2xl md:shadow-none">
        <div className="px-8 pt-8 pb-4">
           {/* Section Title */}
           <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-50 text-emerald-900 rounded-lg">
                <Bell size={20} />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-950">Live Alerts</h2>
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-tight">Active mountain hazards</p>
             </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
           <AnimatePresence mode="wait">
             {selectedHazard ? (
               <motion.div
                 key="hazard-detail"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-6"
               >
                 <button 
                   onClick={() => setSelectedHazard(null)}
                   className="text-[10px] font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2 hover:translate-x-[-4px] transition-transform"
                 >
                   <ArrowRight size={14} className="rotate-180" />
                   Back to list
                 </button>

                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full -mr-12 -mt-12 opacity-50" />
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-white rounded-2xl text-emerald-950 shadow-sm">
                           {selectedHazard.type === 'landslide' ? <TriangleAlert size={24} className="text-red-600" /> : <CloudRain size={24} className="text-emerald-600" />}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60">Incident Report</p>
                            <h3 className="font-serif font-black text-emerald-950 text-xl">{selectedHazard.title}</h3>
                         </div>
                      </div>
                      <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                        {selectedHazard.description}
                      </p>
                      <div className="pt-4 flex items-center justify-between border-t border-emerald-900/10">
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-900 text-[10px] font-black">
                               RV
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-950">Reporter</p>
                               <p className="text-[10px] text-emerald-800 font-bold">{selectedHazard.reporter}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-950">Location</p>
                            <p className="text-[10px] text-emerald-800 font-bold">{selectedHazard.location}</p>
                         </div>
                      </div>
                    </div>
                 </div>

                  <div className="pt-4 flex items-center justify-between border-t border-outline-variant/10">
                     <button 
                       onClick={() => handleVerify(selectedHazard.id)}
                       className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-900 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-100 transition-all"
                     >
                       <ThumbsUp size={14} />
                       Verify ({selectedHazard.upvotes})
                     </button>
                  </div>
               </motion.div>
             ) : (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="space-y-4"
               >
                 {hazards.map(h => (
                   <div 
                    key={h.id} 
                    onClick={() => setSelectedHazard(h)}
                    className="p-5 rounded-[2rem] bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 cursor-pointer group transition-all relative overflow-hidden"
                   >
                     <div className={`absolute top-0 left-0 w-1 h-full ${getSeverityColor(h.severity || 'medium')}`} />
                     <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${h.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {getHazardIcon(h.type)}
                        </div>
                        <div className="min-w-0 pr-4">
                           <h4 className="text-sm font-serif font-black text-emerald-950 uppercase tracking-tight truncate group-hover:text-emerald-800 transition-colors">{h.title}</h4>
                           <p className="text-xs font-bold text-on-surface-variant truncate">{h.location}</p>
                           <div className="flex items-center gap-2 mt-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700/60">{h.time}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white ${getSeverityColor(h.severity || 'medium')}`}>
                                {h.severity || 'medium'}
                              </span>
                           </div>
                        </div>
                        <div className="ml-auto flex flex-col gap-2">
                           <button 
                             onClick={(e) => handleDeleteHazard(e, h.id)}
                             className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                             title="Remove hazard"
                           >
                             <X size={14} />
                           </button>
                           <div className="p-1.5 rounded-lg bg-white/50 text-on-surface-variant group-hover:bg-emerald-950 group-hover:text-white transition-colors">
                              <ArrowRight size={16} />
                           </div>
                        </div>
                     </div>
                   </div>
                 ))}

               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Larger, prominent Report Hazard button at bottom of sidebar with Temperature */}
        <div className="p-6 border-t border-outline-variant/30 bg-white space-y-6">

          
          <button 
           onClick={() => setIsReporting(true)}
           className="w-full bg-emerald-950 text-white py-6 rounded-2xl font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-emerald-950/30 hover:bg-emerald-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-2 border-emerald-950"
          >
            <Plus size={24} strokeWidth={3} className="text-secondary" />
            Report Live Hazard
          </button>
        </div>

        {/* Reporting Modal */}
        {isReporting && createPortal(
          <AnimatePresence mode="wait">
            <motion.div 
              key="reporting-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ 
                  scale: 1, 
                  y: 0,
                  width: isPickingLocation ? 'min(900px, 95vw)' : 'min(400px, 95vw)'
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Form Section */}
                <div className={`flex-1 flex flex-col min-w-0 ${isPickingLocation ? 'md:w-1/2' : 'w-full'}`}>
                  <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                      <h3 className="text-xl font-serif font-black text-emerald-950 uppercase tracking-tighter">Report Hazard</h3>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-0.5">Live Broadcast</p>
                    </div>
                    <button 
                      onClick={() => {
                        setIsReporting(false);
                        setIsPickingLocation(false);
                      }} 
                      className="p-2 hover:bg-surface-container rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReport} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Category</label>
                         <select 
                           value={reportForm.type}
                           onChange={(e) => setReportForm({...reportForm, type: e.target.value as Hazard['type']})}
                           className="w-full h-11 px-3 bg-surface-container rounded-xl border-2 border-transparent focus:border-emerald-600 outline-none font-bold text-emerald-950 text-sm transition-all appearance-none cursor-pointer"
                         >
                           <option value="weather">Weather</option>
                           <option value="traffic">Traffic</option>
                           <option value="landslide">Landslide</option>
                           <option value="construction">Construction</option>
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Severity</label>
                         <select 
                           value={reportForm.severity}
                           onChange={(e) => setReportForm({...reportForm, severity: e.target.value as Hazard['severity']})}
                           className="w-full h-11 px-3 bg-surface-container rounded-xl border-2 border-transparent focus:border-emerald-600 outline-none font-bold text-emerald-950 text-sm transition-all appearance-none cursor-pointer"
                         >
                           <option value="low">Low (🟢)</option>
                           <option value="medium">Medium (🟡)</option>
                           <option value="high">High (🟠)</option>
                           <option value="critical">Critical (🔴)</option>
                         </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Heading/Title</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Landslide near Library Chowk"
                        value={reportForm.title}
                        onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                        className="w-full h-11 px-4 bg-surface-container rounded-xl border-2 border-transparent focus:border-emerald-600 outline-none font-bold text-emerald-950 text-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Location Details</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Mussoorie-Chamba Road"
                          value={reportForm.location}
                          onChange={(e) => setReportForm({...reportForm, location: e.target.value})}
                          className="flex-1 h-11 px-4 bg-surface-container rounded-xl border-2 border-transparent focus:border-emerald-600 outline-none font-bold text-emerald-950 text-sm transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setIsPickingLocation(!isPickingLocation)}
                          className={`w-11 h-11 rounded-xl border-2 transition-all flex items-center justify-center shrink-0 ${
                            isPickingLocation ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-surface-container border-transparent text-emerald-950 hover:bg-emerald-50'
                          }`}
                          title="Select on map"
                        >
                          <MapPin size={20} />
                        </button>
                      </div>
                      {reportForm.lat && reportForm.lng && (
                         <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-tighter flex items-center gap-1">
                           <Target size={10} />
                           Pinned: {reportForm.lat.toFixed(4)}, {reportForm.lng.toFixed(4)}
                         </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40">Description</label>
                      <textarea 
                        required
                        placeholder="Provide more detail..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                        className="w-full h-24 p-4 bg-surface-container rounded-xl border-2 border-transparent focus:border-emerald-600 outline-none font-bold text-emerald-950 text-sm transition-all resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 bg-emerald-950 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] hover:bg-emerald-900 transition-all shadow-xl shadow-emerald-950/20"
                    >
                      Broadcast Hazard
                    </button>
                  </form>
                </div>

                {/* Map Picker Sidebar */}
                {isPickingLocation && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 min-h-[300px] md:min-h-0 md:w-1/2 bg-emerald-50 border-l border-outline-variant/20 relative"
                  >
                    <div className="absolute inset-0 z-0">
                      <LiveMap 
                        height="100%"
                        center={reportForm.lat && reportForm.lng ? [reportForm.lat, reportForm.lng] : [30.4599, 78.0664]}
                        zoom={14}
                        markers={reportForm.lat && reportForm.lng ? [{
                          id: 'picker-site',
                          position: [reportForm.lat, reportForm.lng],
                          title: 'Incident Site',
                          type: 'selection'
                        }] : []}
                        onClick={handleMapClick}
                        className="!rounded-none"
                      />
                    </div>
                    <div className="absolute top-4 left-4 right-4 z-10">
                       <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-emerald-950/10 flex items-center gap-3">
                          <div className="p-2 bg-emerald-600 text-white rounded-lg animate-pulse">
                             <Target size={18} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-tighter text-emerald-950">Location Picker</p>
                             <p className="text-[9px] font-bold text-on-surface-variant leading-tight">Click on the map to set the exact incident point.</p>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </aside>

      {/* SOS Modal */}
      <EmergencySOS 
        isOpen={isSOSOpen} 
        onClose={() => setIsSOSOpen(false)} 
      />

      {/* Floating Add Button Mobile */}
      <button className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center z-40 transform active:scale-95">
        <Plus size={28} />
      </button>
    </div>
  );
}

function UpdateItem({ time, text }: { time: string, text: string }) {
  return (
    <div className="flex gap-4">
       <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
       <div className="space-y-1">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">{time}</p>
          <p className="text-[10px] font-bold text-on-surface-variant">{text}</p>
       </div>
    </div>
  );
}
