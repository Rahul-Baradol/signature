import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/landing';
import GradientDesign from '@/pages/gradient';
import ConcetricRingsDesign from '@/pages/concentric-rings';
import { AnimationLayout } from '@/layouts/animation-layout';
import { StudioLayout } from './layouts/studio-layout';
import OpenmicStudio from './pages/studio/openmic';
import Metronome from './pages/studio/metronome';
import Looper from './pages/studio/looper';

function App() {
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