import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Capture from './components/Capture';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import ManualEntry from './components/ManualEntry'; // <-- 1. Import the component
import Auth from './components/Auth';
import History from './components/History';
import FullDetails from './components/FullDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Capture />} />
          <Route path="analyze" element={<Analyzing />} />
          <Route path="results" element={<Results />} />
          <Route path="manual" element={<ManualEntry />} /> {/* <-- 2. Add the route */}
          <Route path="auth" element={<Auth />} />
          <Route path="history" element={<History />} />
          <Route path="details" element={<FullDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}