import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages';
import BeatVisualizer from './pages/signature';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signature" element={<BeatVisualizer />} />
            </Routes>
        </Router>
    );
}

export default App;