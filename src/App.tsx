import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { LanguageProvider } from './components/LanguageProvider';
import { ToastProvider } from './components/ToastProvider';
import Home from './pages/Home';
import Discover from './pages/Discover';
import TrainerProfile from './pages/TrainerProfile';
import BecomeTrainer from './pages/BecomeTrainer';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import Protocols from './pages/Protocols';
import ClientDashboard from './pages/ClientDashboard';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import SeoLanding from './pages/SeoLanding';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import FindTrainerQuiz from './pages/FindTrainerQuiz';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import About from './pages/About';
import NotFound from './pages/NotFound';
import SavedTrainers from './pages/SavedTrainers';
import Tools from './pages/Tools';
import Transformations from './pages/Transformations';
import FAQ from './pages/FAQ';
import Refer from './pages/Refer';
import Compare from './pages/Compare';
import HowItWorks from './pages/HowItWorks';
import ForTrainers from './pages/ForTrainers';
import AuthGate from './components/AuthGate';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <LanguageProvider>
      <ToastProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/personal-trainer-lahore" element={<SeoLanding />} />
          <Route path="/personal-trainer-karachi" element={<SeoLanding />} />
          <Route path="/personal-trainer-islamabad" element={<SeoLanding />} />
          <Route path="/personal-trainer-rawalpindi" element={<SeoLanding />} />
          <Route path="/personal-trainer-faisalabad" element={<SeoLanding />} />
          <Route path="/personal-trainer-gujranwala" element={<SeoLanding />} />
          <Route path="/personal-trainer-sialkot" element={<SeoLanding />} />
          <Route path="/online-fitness-coach-pakistan" element={<SeoLanding />} />
          <Route path="/female-personal-trainer-lahore" element={<SeoLanding />} />
          <Route path="/home-personal-trainer-karachi" element={<SeoLanding />} />
          <Route path="/trainer/:id" element={<TrainerProfile />} />
          <Route path="/become-trainer" element={<BecomeTrainer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/:role" element={<Register />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/metrics" element={<AuthGate roles={['trainer']}><Dashboard /></AuthGate>} />
          <Route path="/trainer/dashboard" element={<AuthGate roles={['trainer']}><Dashboard /></AuthGate>} />
          <Route path="/inbox" element={<AuthGate roles={['trainer']}><LeadDetail /></AuthGate>} />
          <Route path="/lab" element={<AuthGate roles={['trainer']}><Protocols /></AuthGate>} />
          <Route path="/client" element={<AuthGate roles={['client']}><ClientDashboard /></AuthGate>} />
          <Route path="/client/dashboard" element={<AuthGate roles={['client']}><ClientDashboard /></AuthGate>} />
          <Route path="/admin" element={<AuthGate roles={['admin']}><AdminDashboard /></AuthGate>} />
          <Route path="/quiz" element={<FindTrainerQuiz />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/saved" element={<SavedTrainers />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/transformations" element={<Transformations />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/refer" element={<Refer />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/for-trainers" element={<ForTrainers />} />
          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}
