import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Capture from './components/Capture';
import Analyzing from './components/Analyzing';
import Results from './components/Results';
import ManualEntry from './components/ManualEntry';
import Auth from './components/Auth';
import History from './components/History';
import FullDetails from './components/FullDetails';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Alerts from './components/Alerts';
import Insights from './components/Insights'; // Added the new Insights import
import SplashScreen from './components/features/onboarding/SplashScreen';
import WelcomeGuide from './components/features/onboarding/WelcomeGuide';

export default function App() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const hasVisited = window.localStorage.getItem('hasVisitedRxGuard') === 'true';

    const timer = window.setTimeout(() => {
      setStatus(hasVisited ? 'app' : 'onboarding');
    }, 2200);

    return () => window.clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    window.localStorage.setItem('hasVisitedRxGuard', 'true');
    setStatus('app');
  };

  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      {status === 'loading' ? <SplashScreen /> : null}
      {status === 'onboarding' ? <WelcomeGuide onComplete={handleOnboardingComplete} /> : null}
      {status === 'app' ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="capture" element={<Capture />} />
              <Route path="analyze" element={<Analyzing />} />
              <Route path="results" element={<Results />} />
              <Route path="manual" element={<ManualEntry />} />
              <Route path="auth" element={<Auth />} />
              <Route path="history" element={<History />} />
              <Route path="details" element={<FullDetails />} />
              <Route path="profile" element={<Profile />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="insights" element={<Insights />} /> {/* Added the Insights route */}
              <Route path="services" element={<Dashboard />} />
              <Route path="journal" element={<Dashboard />} />
              <Route path="messages" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      ) : null}
    </>
  );
}