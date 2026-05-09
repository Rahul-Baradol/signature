import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { AnimationLayout } from '@/layouts/animation-layout';
import { StudioLayout } from './layouts/studio-layout';

const Landing = lazy(() => import('@/pages/landing'));
const OpenmicStudio = lazy(() => import('./pages/studio/openmic'));
const Metronome = lazy(() => import('./pages/studio/metronome'));
const Looper = lazy(() => import('./pages/studio/looper'));

import { useAppStore } from './store/use-app-store';
import { StudioActivationStatus } from './store/schema';
import GradientDesign from './pages/gradient';

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
            <Suspense>
                <Routes>
                    <Route path="/" element={<Landing />} />

                    <Route path="/signature" element={<AnimationLayout />}>
                        <Route path="gradient" element={<GradientDesign />} />
                    </Route>

                    <Route path="/studio" element={<StudioLayout />}>
                        <Route index element={<OpenmicStudio />} />
                        <Route path="metronome" element={<Metronome />} />
                        <Route path="looper" element={<Looper />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;