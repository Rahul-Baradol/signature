import { useAppStore } from '@/store/use-app-store';
import { motion } from 'framer-motion';
import { AlarmClockCheck, MicVocal, Repeat } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export const StudioPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { microphonePermission, isMetronomeActive } = useAppStore();

  const disablePanel = () => {
    return microphonePermission === "loading" || isMetronomeActive;
  };

  const panelItems = [
    { path: '/studio/metronome', label: 'Metronome', icon: <AlarmClockCheck className='w-5 h-5' /> },
    { path: '/studio', label: 'Openmic', icon: <MicVocal className='w-5 h-5' /> },
    { path: '/studio/looper', label: 'Looper', icon: <Repeat className='w-5 h-5' /> },
  ];

  return (
    <div className="flex flex-col gap-4 z-5 rounded-full bg-transparent/20 ">
      {panelItems.map((item, index) => (
        <motion.button
          key={index}
          disabled={disablePanel()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: disablePanel() ? 0.4 : 1, scale: 1, backgroundColor: (location.pathname === item.path) ? "rgba(255, 255, 255, 0.15)" : "black" }}
          whileHover={{ scale: 1.1, backgroundColor:  "rgba(255, 255, 255, 0.15)" }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            navigate(item.path);
          }}
          className={`z-50 p-2 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg`}
          title={item.label}
        >
          {item.icon}
        </motion.button>
      ))}
    </div>
  );
};