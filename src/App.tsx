import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AnimationLayout } from '@/layouts/animation-layout';
import { StudioLayout } from './layouts/studio-layout';
import GradientDesign from './pages/gradient';

const Landing = lazy(() => import('@/pages/landing'));
const NotFound = lazy(() => import('@/pages/not-found'));
const OpenmicStudio = lazy(() => import('./pages/studio/openmic'));
const Metronome = lazy(() => import('./pages/studio/metronome'));
const Looper = lazy(() => import('./pages/studio/looper'));

function App() {
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

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
