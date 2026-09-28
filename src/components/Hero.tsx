import { motion } from 'framer-motion';
import { Shield, Fingerprint, Lock, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <Fingerprint className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300">Behavioral Biometrics • Continuous Authentication</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">TypeNet</span>
            <br />
            <span className="text-slate-200">Keystroke Dynamics</span>
            <br />
            <span className="text-slate-400 text-4xl sm:text-5xl lg:text-6xl">Authentication System</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            A complete end-to-end pipeline for continuous user verification using deep learning on 
            keystroke timing features — from raw event capture to real-time trust scoring with 
            Siamese LSTM networks and decaying confidence models.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { icon: Fingerprint, label: 'Keystroke Capture', value: 'ms precision' },
            { icon: Zap, label: 'LSTM Embedding', value: '64-dim vector' },
            { icon: Lock, label: 'EER Target', value: '< 5%' },
            { icon: Shield, label: 'Trust Score', value: 'Real-time' },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card rounded-xl p-4 text-center"
            >
              <Icon className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <div className="text-xs text-slate-400 mb-1">{label}</div>
              <div className="text-sm font-semibold text-white">{value}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-16"
        >
          <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500">
            {['PyTorch', 'FastAPI', 'Manifest V3', 'LSTM', 'Triplet Loss', 'Redis', 'ONNX Runtime'].map(tech => (
              <span key={tech} className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50">
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
