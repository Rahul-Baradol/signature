import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { House } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-screen bg-[#030712] text-slate-50 flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.06),transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[10rem] md:text-[16rem] font-black tracking-tight leading-none mb-4 select-none">
            <span className="text-transparent bg-clip-text bg-linear-to-t from-slate-600 to-slate-300">
              404
            </span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-8"
        >
          <p className="text-slate-400 text-lg font-light max-w-xs leading-relaxed">
            This frequency is in inaudible range.
          </p>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#38bdf8' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 px-8 py-4 bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] cursor-pointer"
          >
            <House className="w-3.5 h-3.5" />
            Back to Home
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
