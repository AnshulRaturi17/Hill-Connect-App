import React from 'react';
import { motion } from 'motion/react';
import { Mountain, ShieldCheck, Zap, Users, ArrowRight, Play, Search, UserCheck, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Screen } from '../types';
import MountainIllustration from '../components/MountainIllustration';
import HillscapeCanvas from '../components/HillscapeCanvas';

export default function Landing({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-10 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 to-emerald-900/40 z-10" />
          <video 
            autoPlay 
            muted 
            loop 
            playsInline
            poster="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-winding-mountain-road-2342-large.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="container-custom relative z-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-serif font-black text-white leading-[1.1] mb-6">
              Navigate the <span className="text-[#12e56e]">Hills</span> with Confidence.
            </h1>
            
            <p className="text-lg md:text-xl text-emerald-50/80 mb-10 max-w-xl leading-relaxed">
              Uttarakhand's first community-driven transit network. Connecting local drivers with passengers for safe, reliable, and shared mountain travel.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onNavigate('ride-search')}
                className="group flex items-center justify-center gap-3 bg-secondary text-on-secondary px-8 py-4 rounded-xl font-black uppercase tracking-wider text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                Find a Ride
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={scrollToHowItWorks}
                className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-black uppercase tracking-wider text-sm hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-secondary/50"
              >
                <Play size={20} fill="currentColor" />
                How it works
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hidden lg:block relative min-h-[500px]"
          >
            <MountainIllustration />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-emerald-950 mb-6">Designed for the Terrain.</h2>
            <p className="text-lg text-on-surface-variant font-medium">Standard map apps don't understand the hills. Hill Connect is built from the ground up for mountain travel dynamics.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} />} 
              title="Verified Experience" 
              description="Every driver undergoes local verification and specialized hill driving assessment for maximum safety."
            />
            <FeatureCard 
              icon={<Zap size={32} />} 
              title="Real-time Hazard Map" 
              description="Get instant alerts for landslides, weather shifts, and road blockages reported by users currently on the route."
              highlight
            />
            <FeatureCard 
              icon={<Users size={32} />} 
              title="Community Driven" 
              description="Share rides to reduce costs and carbon footprint. Connect with fellow travelers heading to the same remote villages."
            />
          </div>
        </div>
      </section>

      {/* About & Why Choose Us Section */}
      <section className="py-24 bg-emerald-50/50">
        <div className="container-custom">
          <div className="mb-32">
            <HillscapeCanvas />
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-emerald-950 mb-4">Why Choose Hill Connect?</h2>
            <div className="w-20 h-1 bg-secondary mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WhyCard 
              title="Local Expertise"
              description="Our drivers are residents who navigate these curves daily. They know exactly when to stay back and when to go."
            />
            <WhyCard 
              title="Safety Anchor"
              description="Integrated 24/7 emergency SOS, live location sharing, and hazard reporting keep you protected in remote zones."
            />
            <WhyCard 
              title="Shared Journey"
              description="Reduce travel costs significantly while meeting fellow explorers. A collective approach to mountain logistics."
            />
            <WhyCard 
              title="Impact Driven"
              description="By optimizing vehicle usage, we minimize the ecological footprint on delicate mountain ecosystems."
            />
          </div>
        </div>
      </section>

      {/* How it Works / Journey Timeline Section */}
      <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
        <div className="container-custom">
          <div className="text-center mb-20">
            <h3 className="text-secondary font-black uppercase tracking-widest text-xs mb-4">The Journey</h3>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-emerald-950">How Hill Connect Works</h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-100 -translate-x-1/2 hidden md:block" />
            
            <div className="space-y-12 relative z-10">
              <TimelineStep 
                index={1}
                icon={<Search size={24} />}
                title="Search A Ride"
                description="Enter your destination and find available drivers traveling the same mountain routes. Filter by price, vehicle type, and ratings."
              />
              <TimelineStep 
                index={2}
                icon={<UserCheck size={24} />}
                title="Authenticate Yourself"
                description="Secure login with Google ensures every community member is verified. Trust is the foundation of mountain travel."
                reverse
              />
              <TimelineStep 
                index={3}
                icon={<MapPin size={24} />}
                title="Booking a Ride"
                description="Confirm your seat with one tap. Get instant driver location, coordinates, and vehicle details for easy pickup."
              />
              <TimelineStep 
                index={4}
                icon={<AlertTriangle size={24} />}
                title="Mark Hazards"
                description="During your trip, contribute to the community by flagging road blockages, landslides, or weather hazards in real-time."
                reverse
              />
              <TimelineStep 
                index={5}
                icon={<CheckCircle size={24} />}
                title="Complete & Rate"
                description="Arrive safely at your mountain destination. Rate your experience to help maintain high community standards."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white overflow-hidden pb-32">
        <div className="container-custom">
          <div className="relative bg-secondary rounded-[2rem] p-12 md:p-20 overflow-hidden flex flex-col md:flex-row items-center gap-12">
            <div className="absolute inset-0 bg-black/5 opacity-40 mix-blend-overlay flex items-center justify-center pointer-events-none">
              <div className="w-[800px] h-[800px] border-[50px] border-white/20 rounded-full" />
            </div>
            
            <div className="relative z-10 flex-1 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-6">Ready to climb?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-md font-medium">Join thousands of travelers who trust Hill Connect for their daily commute and weekend gateways.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => onNavigate('ride-search')}
                  className="bg-emerald-950 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Start Booking
                </button>
                <button 
                  onClick={() => onNavigate('driver-dashboard')}
                  className="bg-white text-emerald-900 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  Drive with Us
                </button>
              </div>
            </div>

            <div className="relative z-10 hidden lg:block">
              <div className="w-72 h-[500px] bg-emerald-950 rounded-[4rem] border-[12px] border-black shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 w-full h-8 bg-black/10 flex items-center justify-center z-20">
                  <div className="w-20 h-5 bg-black rounded-b-2xl" />
                </div>
                <div className="p-8 h-full flex flex-col justify-between relative bg-emerald-950">
                  <div className="space-y-6 pt-12">
                     <div 
                       className="flex items-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity"
                       onClick={() => onNavigate('landing')}
                     >
                        <Mountain className="text-secondary" size={24} />
                        <span className="text-white font-serif font-black text-lg">Hill Connect</span>
                     </div>
                     <div className="space-y-4">
                        <div className="w-full h-1 bg-white/10 rounded-full" />
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] uppercase font-black tracking-widest text-secondary mb-1">Developer</p>
                          <p className="text-white font-bold">Anshul Raturi</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] uppercase font-black tracking-widest text-secondary mb-1">Contact</p>
                          <p className="text-white font-bold italic">7819041779</p>
                        </div>
                     </div>
                  </div>
                  <div className="text-center pb-4">
                    <p className="text-[8px] text-white/40 uppercase tracking-tighter">© 2026 Hill Connect</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, highlight }: { icon: React.ReactNode, title: string, description: string, highlight?: boolean }) {
  return (
    <div className={`p-10 rounded-[2rem] transition-all duration-300 group ${
      highlight 
        ? 'bg-emerald-50 border-2 border-emerald-100 shadow-xl shadow-emerald-900/5' 
        : 'bg-white hover:bg-surface-container border-2 border-transparent hover:border-outline-variant'
    }`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-300 ${
        highlight ? 'bg-secondary text-white' : 'bg-emerald-100 text-emerald-900'
      }`}>
        {icon}
      </div>
      <h3 className="text-2xl font-serif font-bold text-emerald-950 mb-4">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-serif font-black text-secondary mb-2 tracking-tight">{value}</p>
      <p className="text-xs uppercase font-black tracking-[0.2em] text-emerald-100/60">{label}</p>
    </div>
  );
}

function WhyCard({ title, description }: { title: string, description: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-8 bg-white rounded-3xl border border-emerald-100 shadow-sm hover:shadow-md transition-all group"
    >
      <h4 className="text-xl font-serif font-black text-emerald-950 mb-3 group-hover:text-emerald-700 transition-colors">{title}</h4>
      <p className="text-sm text-on-surface-variant font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TimelineStep({ index, icon, title, description, reverse }: { index: number, icon: React.ReactNode, title: string, description: string, reverse?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: reverse ? 50 : -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className={`flex flex-col md:flex-row items-center gap-8 ${reverse ? 'md:flex-row-reverse' : ''}`}
    >
      <div className={`flex-1 w-full text-center ${reverse ? 'md:text-left' : 'md:text-right'}`}>
        <h4 className="text-2xl font-serif font-black text-emerald-950 mb-3">{title}</h4>
        <div className={`flex ${reverse ? 'justify-start' : 'justify-end'} justify-center`}>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed max-w-sm">
            {description}
          </p>
        </div>
      </div>
      
      <div className="relative flex-shrink-0 z-20">
        <div className="w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg border-4 border-white">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-950 text-white flex items-center justify-center text-[10px] font-black">
          {index}
        </div>
      </div>
      
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

function TriangleAlert(props: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
