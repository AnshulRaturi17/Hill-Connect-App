import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function HillscapeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      const drawMountain = (height: number, color: string, speed: number, offset: number) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = canvas.height - height - Math.sin(x * 0.003 + time * speed + offset) * 40 - Math.cos(x * 0.001 + time * speed * 0.5) * 60;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fillStyle = color;
        ctx.fill();
      };

      // Background layer
      drawMountain(200, 'rgba(6, 78, 59, 0.2)', 0.5, 0); // emerald-950/20
      // Middle layer
      drawMountain(150, 'rgba(16, 185, 129, 0.1)', 0.8, 2); // emerald-500/10
      // Foreground layer
      drawMountain(100, 'rgba(18, 229, 110, 0.05)', 1.2, 4); // secondary/5

      // Draw some "floating nodes" representing network connections
      for (let i = 0; i < 10; i++) {
        const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.8 + i) * 0.5 + 0.5) * (canvas.height - 200);
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(18, 229, 110, 0.4)';
        ctx.fill();
        
        // Connections
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(canvas.width / 2, canvas.height / 2);
        ctx.strokeStyle = 'rgba(18, 229, 110, 0.05)';
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] bg-emerald-950 rounded-[4rem] overflow-hidden shadow-2xl group border border-white/10">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      <div className="absolute inset-0 flex items-center justify-center p-12 text-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-5xl md:text-7xl font-serif font-black text-white mb-8 leading-tight">
            Our Mission is <span className="text-secondary italic">Movement.</span>
          </h2>
          <p className="text-xl text-emerald-100/60 max-w-2xl mx-auto font-medium leading-relaxed">
            Bridging the gap between remote villages and urban centers in Uttarakhand. Built by locals, for locals and travelers alike.
          </p>
        </motion.div>
      </div>

      {/* Decorative Overlays */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-950 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-emerald-950 to-transparent" />
      
      {/* Corner Accents */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-secondary/30 rounded-tl-3xl group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-secondary/30 rounded-br-3xl group-hover:scale-110 transition-transform duration-700" />
    </div>
  );
}
