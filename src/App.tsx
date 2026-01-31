import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/landing';
import GradientDesign from '@/pages/gradient';
import ConcetricRingsDesign from '@/pages/concentric-rings';
import { AnimationLayout } from '@/layouts/animation-layout';
import { StudioLayout } from './layouts/studio-layout';
import OpenmicStudio from './pages/studio/openmic';
import Metronome from './pages/studio/metronome';
import Looper from './pages/studio/looper';
import { useEffect, useRef } from 'react';
import { useAppStore } from './store/use-app-store';
import { StudioActivationStatus } from './store/schema';

function App() {
    const { setActivateStudio } = useAppStore();

    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        let start: number | null = null;
        let sum: number = 0;
        let count: number = 0;

        function measureAnimationFrameIntervals() {
            if (count == 120) {
                const avgTime = sum / count;
                console.log(avgTime)
                if (avgTime <= 17) {
                    setActivateStudio(StudioActivationStatus.ACTIVE);
                } else {
                    setActivateStudio(StudioActivationStatus.INACTIVE);
                }
                return;
            } 

            if (start == null) {
                start = performance.now();
                requestAnimationFrame(measureAnimationFrameIntervals);
            } else {
                const now = performance.now();
                const diff = now - start!;
                sum += diff;
                count++;
                start = now;
                requestAnimationFrame(measureAnimationFrameIntervals);
            }
        }

        animationFrameRef.current = requestAnimationFrame(measureAnimationFrameIntervals);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="/signature" element={<AnimationLayout />}>
                    <Route path="gradient" element={<GradientDesign />} />
                    <Route path="concentric-rings" element={<ConcetricRingsDesign />} />
                </Route>

                <Route path="/studio" element={<StudioLayout />}>
                    <Route index element={<OpenmicStudio />} />
                    <Route path="metronome" element={<Metronome />} />
                    <Route path="looper" element={<Looper />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;