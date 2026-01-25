import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from '@/pages/landing';
import GradientDesign from '@/pages/gradient';
import ConcetricRingsDesign from '@/pages/concentric-rings';
import { AnimationLayout } from '@/layouts/animation-layout';
import { StudioLayout } from './layouts/studio-layout';
import Studio from './pages/studio';

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
                    <Route index element={<Studio />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;