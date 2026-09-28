import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Keyboard, Cpu, Globe, Server, BarChart3, Menu, X, Fingerprint } from 'lucide-react';
import Hero from './components/Hero';
import Architecture from './components/Architecture';
import FeatureExtraction from './components/FeatureExtraction';
import ModelArchitecture from './components/ModelArchitecture';
import KeystrokeDemo from './components/KeystrokeDemo';
import MouseDemo from './components/MouseDemo';
import TrustScore from './components/TrustScore';
import BenchmarkCharts from './components/BenchmarkCharts';
import ApiDemo from './components/ApiDemo';
import Datasets from './components/Datasets';
import { MousePointer2 } from 'lucide-react';

const sections = [
  { id: 'hero', label: 'Overview', icon: Shield },
  { id: 'architecture', label: 'How It Works', icon: Cpu },
  { id: 'features', label: 'Keystroke', icon: Keyboard },
  { id: 'mouse', label: 'Mouse', icon: MousePointer2 },
  { id: 'model', label: 'Model', icon: Cpu },
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
    <div className="min-h-screen bg-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-[15px]">BioAuth</span>
            </div>
            
            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                    activeSection === id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
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
              className="lg:hidden bg-white border-t border-gray-100"
            >
              <div className="px-4 py-3 space-y-0.5">
                {sections.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
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
      <main className="pt-14">
        <Hero />
        <Architecture />
        <FeatureExtraction />
        <MouseDemo />
        <ModelArchitecture />
        <KeystrokeDemo />
        <TrustScore />
        <ApiDemo />
        <BenchmarkCharts />
        <Datasets />
        
        {/* Footer */}
        <footer className="border-t border-gray-200 py-10 text-center text-gray-500 text-sm">
          <p>Behavioral Biometrics Continuous Authentication System</p>
          <p className="mt-1 text-xs text-gray-400">React · PyTorch · FastAPI · Privacy by Design</p>
        </footer>
      </main>
    </div>
  );
}
