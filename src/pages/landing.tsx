import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/use-app-store';
import { SocialSidebar } from '@/components/social-sidebar';

const Landing: React.FC = () => {
  const { setFile } = useAppStore();
  const navigate = useNavigate();
  const [videoDownloading, setVideoDownloading] = useState(true);

  return (
    <div className="relative min-h-screen w-screen bg-[#030712] text-slate-50 flex items-center overflow-hidden selection:bg-sky-500/30">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_50%)]" />
      </div>

      <SocialSidebar />

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

          <p className="max-w-sm text-slate-400 text-lg font-light mb-6 leading-relaxed ">
            Immerse yourself in a captivating visualization.
          </p>

          <div className="mb-8 flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-xs text-red-200/70 font-medium tracking-wide">
              Warning: Contains flashing lights & patterns
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="group relative">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/mp3"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFile(file);
                      navigate('/signature/gradient');
                    }
                  }}
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative z-10 px-12 py-5 bg-white text-black font-bold text-xs tracking-widest uppercase rounded-full transition-colors group-hover:bg-sky-400"
                >
                  Upload MP3
                </motion.div>
              </label>
              <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full group-hover:bg-sky-500/40 transition-all" />
            </div>
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
            {videoDownloading ? (
              <div className="absolute inset-0 z-10 overflow-hidden">
                <div className="absolute inset-0 bg-[#030712]" />
                <div className="absolute inset-0 animate-sweep bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            ) : <></>}

            <video
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setVideoDownloading(false)}
              className={`w-full h-auto mix-blend-screen transition-opacity duration-500 ${videoDownloading ? "opacity-0" : "opacity-80"}`}
            >
              <source src="/signature-3.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-transparent" />
          </div>
        </div>

        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-12 -left-12 p-6 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl hidden lg:block"
        >
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Bouncing...</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
};

export default Landing;