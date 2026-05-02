import React from 'react';
import { motion } from 'motion/react';

export default function MountainIllustration() {
  return (
    <div className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-visible">
      {/* Sun/Moon Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/30 blur-[100px] rounded-full"
      />

      {/* Main Illustration Container */}
      <div className="relative w-full max-w-xl aspect-[4/3]">
        <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-2xl overflow-visible">
          {/* Back Mountains */}
          <motion.path
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            d="M0 500 L200 200 L400 450 L600 150 L800 500 Z"
            fill="#064e3b" // emerald-950
            opacity="0.3"
          />
          
          {/* Mid Mountains */}
          <motion.path
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            d="M-100 600 L150 250 L450 550 L750 300 L1000 600 Z"
            fill="#065f46" // emerald-900
            opacity="0.6"
          />

          {/* Front Peaks */}
          <motion.path
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            d="M0 600 L300 350 L500 550 L800 400 L800 600 Z"
            fill="#047857" // emerald-700
          />

          {/* Winding Road */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
            d="M400 600 C 400 550, 600 550, 600 500 C 600 450, 200 450, 200 400 C 200 350, 500 350, 500 300"
            fill="none"
            stroke="#12e56e" // secondary
            strokeWidth="12"
            strokeLinecap="round"
            className="drop-shadow-[0_0_15px_rgba(18,229,110,0.5)]"
          />

          {/* Animated Car/Dot */}
          <motion.circle
            animate={{ 
              offsetDistance: ["0%", "100%"],
              opacity: [0, 1, 1, 0]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "linear",
              times: [0, 0.1, 0.9, 1]
            }}
            r="8"
            fill="white"
            style={{
              offsetPath: "path('M400 600 C 400 550, 600 550, 600 500 C 600 450, 200 450, 200 400 C 200 350, 500 350, 500 300')",
              offsetRotate: "auto"
            }}
            className="shadow-lg"
          />
        </svg>

        {/* Floating Badges for Context */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             <span className="text-white text-xs font-black uppercase tracking-widest leading-none">Live Routes</span>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-0 bg-emerald-900 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-secondary">
                <MapPin size={20} />
             </div>
             <div>
                <p className="text-[10px] text-emerald-100/60 font-black uppercase tracking-widest leading-none mb-1">Destination</p>
                <p className="text-white text-sm font-bold">Munsiyari, UK</p>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MapPin({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
