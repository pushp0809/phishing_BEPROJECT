import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Keyboard, Cpu, Globe, Server, BarChart3, Menu, X } from 'lucide-react';
import Hero from './components/Hero';
import Architecture from './components/Architecture';
import FeatureExtraction from './components/FeatureExtraction';
import ModelArchitecture from './components/ModelArchitecture';
import KeystrokeDemo from './components/KeystrokeDemo';
import TrustScore from './components/TrustScore';
import BenchmarkCharts from './components/BenchmarkCharts';
import ApiDemo from './components/ApiDemo';
import Datasets from './components/Datasets';

const sections = [
  { id: 'hero', label: 'Overview', icon: Shield },
  { id: 'architecture', label: 'Architecture', icon: Cpu },
  { id: 'features', label: 'Feature Extraction', icon: Keyboard },
  { id: 'model', label: 'Model Design', icon: Cpu },
  { id: 'demo', label: 'Live Demo', icon: Keyboard },
  { id: 'trust', label: 'Trust Engine', icon: Server },
  { id: 'benchmark', label: 'Benchmarks', icon: BarChart3 },
  { id: 'datasets', label: 'Datasets', icon: Globe },
];

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-400" />
              <span className="font-bold text-lg gradient-text">BioAuth</span>
            </div>
            
            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeSection === id
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden glass-card border-t border-indigo-500/20"
            >
              <div className="px-4 py-3 space-y-1">
                {sections.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Hero />
        <Architecture />
        <FeatureExtraction />
        <ModelArchitecture />
        <KeystrokeDemo />
        <TrustScore />
        <ApiDemo />
        <BenchmarkCharts />
        <Datasets />
        
        {/* Footer */}
        <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-sm">
          <p>Behavioral Biometrics Continuous Authentication System</p>
          <p className="mt-2">Built with React • PyTorch • FastAPI • Privacy by Design</p>
        </footer>
      </main>
    </div>
  );
}
