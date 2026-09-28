import { motion } from 'framer-motion';
import { Fingerprint, Zap, Lock, Shield, ArrowDown } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-[85vh] flex items-center justify-center px-4 py-20">
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-500 mb-6">
            <Fingerprint className="w-3.5 h-3.5 text-gray-400" />
            Behavioral Biometrics · Continuous Authentication
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 mb-5 tracking-tight leading-[1.1]">
            Keystroke Dynamics
            <br />
            <span className="text-gray-400">Authentication</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            A complete pipeline for verifying who you are based on <em>how</em> you type — 
            from raw keystroke capture to real-time trust scoring with deep learning.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12"
        >
          {[
            { icon: Fingerprint, label: 'Capture', value: 'ms precision' },
            { icon: Zap, label: 'LSTM', value: '64-dim embedding' },
            { icon: Lock, label: 'EER', value: '< 5%' },
            { icon: Shield, label: 'Decision', value: '< 5ms' },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="card p-4 text-center"
            >
              <Icon className="w-4 h-4 text-gray-400 mx-auto mb-2" />
              <div className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
              <div className="text-sm font-medium text-gray-900">{value}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-2 text-xs"
        >
          {['PyTorch', 'FastAPI', 'Manifest V3', 'LSTM', 'Triplet Loss', 'ONNX Runtime', 'Redis'].map(tech => (
            <span key={tech} className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-500">
              {tech}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <a
            href="#architecture"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>See how it works</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
