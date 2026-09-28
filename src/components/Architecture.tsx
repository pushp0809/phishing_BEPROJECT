import { motion } from 'framer-motion';
import { Keyboard, Cpu, Server, Shield, Globe } from 'lucide-react';

const pipeline = [
  { icon: Keyboard, title: 'Client Extension', desc: 'Manifest V3 Chrome Extension captures keystroke timing events', color: 'from-blue-500 to-cyan-500' },
  { icon: Server, title: 'FastAPI Service', desc: 'Real-time inference engine with ONNX runtime', color: 'from-purple-500 to-pink-500' },
  { icon: Cpu, title: 'LSTM Model', desc: 'Siamese network generating 64-dim embedding vectors', color: 'from-indigo-500 to-violet-500' },
  { icon: Shield, title: 'Trust Engine', desc: 'Decaying sliding window trust score with threshold alerts', color: 'from-emerald-500 to-teal-500' },
  { icon: Globe, title: 'Baseline Store', desc: 'Redis-cached user profiles with enrollment vectors', color: 'from-amber-500 to-orange-500' },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">System Architecture</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            End-to-end pipeline from browser telemetry capture through deep learning inference to real-time trust scoring
          </p>
        </motion.div>

        {/* Pipeline Flow */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-emerald-500/30 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {pipeline.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="glass-card rounded-xl p-6 text-center hover:border-indigo-500/40 transition-all group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  <div className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-slate-800 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                    {i + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Data Flow Diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 glass-card rounded-2xl p-8"
        >
          <h3 className="text-lg font-semibold mb-6 text-center text-slate-200">Data Flow</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            {[
              { label: 'keydown/keyup events', sub: 'performance.now()' },
              { label: 'Dwell + Flight times', sub: 'Δt extraction' },
              { label: '30-50 key window', sub: 'sliding buffer' },
              { label: 'Encrypted JSON', sub: 'batch transmit' },
              { label: '64-dim embedding', sub: 'LSTM forward pass' },
              { label: 'Cosine similarity', sub: 'vs baseline' },
              { label: 'Trust Score', sub: 'EMA decay' },
            ].map((item, i, arr) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-center px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 min-w-[100px]">
                  <div className="text-indigo-300 font-medium text-xs">{item.label}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{item.sub}</div>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-indigo-500 hidden md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
