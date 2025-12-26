import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/use-app-store';
import { SocialSidebar } from '@/components/social-sidebar';
import { Play, ArrowRight } from 'lucide-react'; // Assuming lucide-react is installed

const SAMPLES = [
  { id: 1, title: 'Ecstatic Dissolve', artist: 'Me', file: '/mysongs/ecstatic-dissolve.mp3' },
  { id: 2, title: 'Signature', artist: 'Me', file: '/mysongs/signature.mp3' },
];

const Landing: React.FC = () => {
  const { setFile } = useAppStore();
  const navigate = useNavigate();
  const [videoDownloading, setVideoDownloading] = useState(true);
  const [loadingSample, setLoadingSample] = useState<number | null>(null);

  const handleSampleSelect = async (sample: typeof SAMPLES[0]) => {
    setLoadingSample(sample.id);
    try {
      const response = await fetch(sample.file);
      const blob = await response.blob();
      const file = new File([blob], `${sample.title}.mp3`, { type: 'audio/mpeg' });

      setFile(file);
      // Small delay for the "feel" of the interaction
      setTimeout(() => navigate('/signature/gradient'), 400);
    } catch (error) {
      console.error("Error loading sample:", error);
      setLoadingSample(null);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#030712] text-slate-50 flex items-center overflow-hidden selection:bg-sky-500/30 font-sans">
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
            className="inline-block text-sky-400 text-[10px] font-bold tracking-[0.4em] uppercase mb-4"
          >
            Digital Audio Visualizer
          </motion.span>

          <h1 className="text-7xl md:text-9xl font-black tracking-tight mb-8 leading-[0.85]">
            Time <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-t from-slate-500 to-white">
              Signature
            </span>
          </h1>

          <p className="max-w-sm text-slate-400 text-lg font-light mb-10 leading-relaxed ">
            Immerse yourself in a captivating visualization.
          </p>

          <div className="flex flex-col gap-10">
            {/* Primary Action */}
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
                    whileHover={{ scale: 1.05, backgroundColor: '#38bdf8' }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 px-10 py-5 bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(56,189,248,0.4)]"
                  >
                    Upload MP3
                  </motion.div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-px w-8 bg-slate-700" />
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Quick Start with My Production</span>
                <div className="h-px w-8 bg-slate-700" />
              </div>

              <div className="flex flex-wrap gap-4">
                {SAMPLES.map((sample, idx) => (
                  <motion.button
                    key={sample.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                    onClick={() => handleSampleSelect(sample)}
                    disabled={loadingSample !== null}
                    className="group relative flex items-center gap-4 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 group-hover:bg-sky-500 group-hover:text-black transition-colors">
                      {loadingSample === sample.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <Play size={14} fill="currentColor" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold tracking-wide text-slate-200 group-hover:text-white transition-colors">{sample.title}</p>
                    </div>
                    <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-400" />
                  </motion.button>
                ))}
              </div>
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
          <div className="relative rounded-2xl h-[60vh] overflow-hidden border border-white/5">
            {videoDownloading ? (
              <div className="w-full h-full inset-0 z-10 overflow-hidden">
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
              className={`w-full h-full object-cover mix-blend-screen transition-opacity duration-500 ${videoDownloading ? "opacity-0" : "opacity-80"}`}
            >
              <source src="/signature-3.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-transparent to-transparent" />
          </div>
        </div>

  
      </motion.div>

    </div>
  );
};

export default Landing;