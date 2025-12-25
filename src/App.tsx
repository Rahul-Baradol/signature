import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing';
import GradientDesign from './pages/gradient';
import ConcetricRingsDesign from './pages/concentric-rings';
import { AnimationLayout } from './layouts/animation-layout';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="/signature" element={<AnimationLayout />}>
                    <Route path="gradient" element={<GradientDesign />} />
                    <Route path="concentric-rings" element={<ConcetricRingsDesign />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;