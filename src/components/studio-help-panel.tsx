import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { StudioMode } from '@/store/schema';

const modeContent: Record<StudioMode, { title: string; tips: { heading: string; body: string }[] }> = {
    openmic: {
        title: 'Openmic',
        tips: [
            {
                heading: 'Enable your microphone',
                body: 'Click "Enable Microphone" at the bottom of the screen. The visualizer only activates once mic access is granted.',
            },
            {
                heading: 'Live frequency visualizer',
                body: 'The background gradient shifts in real time based on the frequencies in your audio - louder and higher frequencies push the colors further.',
            },
            {
                heading: 'Intensity pulse',
                body: 'The floating icons animate in response to how loud your signal is. Great for spotting peaks during a performance.',
            },
            {
                heading: 'Free recording',
                body: 'Hit the record button (or press R) to capture audio freely - no bars, no count-in. Hit it again to stop.',
            },
            {
                heading: 'Export as MP3',
                body: 'After stopping, export your take as an MP3 with a custom filename, or discard it and start over.',
            },
        ],
    },
    metronome: {
        title: 'Metronome',
        tips: [
            {
                heading: 'Set your BPM',
                body: 'Use the +/- buttons to nudge the tempo, or click the number to type a value directly. Range is 40-240 BPM.',
            },
            {
                heading: 'Time signature',
                body: 'Choose from 4/4, 3/4, 2/4, or 6/8 using the dropdown. The beat counter and looper bar lengths update automatically.',
            },
            {
                heading: 'Play / Stop',
                body: 'Hit the Play button to start the click track. The metronome drives the Looper count-in and recording - keep it running when recording loops.',
            },
            {
                heading: 'Auto-detect BPM',
                body: 'Use the Detect BPM feature to tap along to a track and let the app calculate your tempo automatically.',
            },
        ],
    },
    looper: {
        title: 'Looper',
        tips: [
            {
                heading: 'Mic required',
                body: 'Enable your microphone first (Openmic mode) before recording any loops - the looper captures live audio input.',
            },
            {
                heading: 'Recording flow',
                body: 'Set your bar count at the top which decides how many bars you want to record for that loop, then hit Record (or press R). You\'ll get 1 bar of count-in, then recording starts automatically in the next bar.',
            },
            {
                heading: 'Playback',
                body: 'After recording, loops play back automatically. Use the Play button (or Space) to stop and restart playback at any time.',
            },
            {
                heading: 'Layer loops',
                body: 'Each recorded take is added as a separate loop. All loops play back together, perfectly synced to the same BPM and time signature.',
            },
            {
                heading: 'Mute / unmute',
                body: 'Toggle individual loops on or off with the mute button next to each track - useful for mixing or isolating parts live.',
            },
            {
                heading: 'Save & export',
                body: 'Save your session as a .signature file to reload later, or export everything as an MP3 with a custom bar length.',
            },
        ],
    },
};

interface StudioHelpPanelProps {
    isOpen: boolean;
    onClose: () => void;
    studioMode: StudioMode;
}

export const StudioHelpPanel = ({ isOpen, onClose, studioMode }: StudioHelpPanelProps) => {
    const content = modeContent[studioMode];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="help-panel"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    className="absolute top-6 left-18 z-60 w-72 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 shadow-2xl text-white overflow-hidden"
                >
                    <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10">
                        <span className="text-sm font-semibold tracking-wide">{content.title}</span>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5 text-white/70" />
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.ul
                            key={studioMode}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col gap-3 px-4 py-4"
                        >
                            {content.tips.map((tip, i) => (
                                <li key={i} className="flex flex-col gap-0.5">
                                    <span className="text-xs font-semibold text-white/90">{tip.heading}</span>
                                    <span className="text-xs text-white/50 leading-relaxed">{tip.body}</span>
                                </li>
                            ))}
                        </motion.ul>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
