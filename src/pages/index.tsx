import React from 'react';
import { motion } from 'framer-motion'; // Assuming standard Framer Motion import
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <div className="relative min-h-screen w-screen bg-[#030712] text-slate-50 flex items-center overflow-hidden selection:bg-sky-500/30">
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_50%)]" />
      </div>

      <div className="relative z-20 w-full lg:w-1/2 px-8 md:px-20 lg:ml-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block text-sky-400 text-xs font-bold tracking-[0.3em] uppercase mb-4"
          >
            Try your signature
          </motion.span>

          <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-8 leading-[0.85]">
            Time <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-t from-slate-500 to-white">
              Signature
            </span>
          </h1>
          
          <p className="max-w-sm text-slate-400 text-lg font-light mb-12 leading-relaxed border-l border-sky-500/30 pl-6">
            Immerse yourself in a captivating song visualizer experience.
          </p>

          <div className="flex items-center gap-8">
            <Link to="/signature" className="group relative">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 px-12 py-5 bg-white text-black font-bold text-xs tracking-widest uppercase rounded-full transition-colors group-hover:bg-sky-400"
              >
                Launch App
              </motion.div>
              {/* Button Shadow/Glow */}
              <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-all" />
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute right-[-10%] lg:right-[-5%] top-1/2 -translate-y-1/2 hidden md:block w-3/5"
        initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
        animate={{ opacity: 1, scale: 1, rotate: -2 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative p-4 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative rounded-2xl overflow-hidden border border-white/5">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto mix-blend-screen opacity-80"
            >
              <source src="/signature-3.mp4" type="video/mp4" />
            </video>
            {/* Overlay Gradient to blend the video edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-transparent" />
          </div>
        </div>
        
        {/* Floating Detail Element */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-12 -left-12 p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl hidden lg:block"
        >
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Frequency Response</p>
              <p className="text-sm font-mono tracking-tighter">44.1kHz Active</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
};

export default Landing;