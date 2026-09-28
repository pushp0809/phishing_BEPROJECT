import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function TrustScore() {
  const [trustScore, setTrustScore] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [similarities, setSimilarities] = useState<number[]>([]);
  const [history, setHistory] = useState<{ score: number; similarity: number; status: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trustScoreRef = useRef(trustScore);
  const lambda = 0.7; // EMA decay factor

  // Keep ref in sync
  useEffect(() => {
    trustScoreRef.current = trustScore;
  }, [trustScore]);

  const simulateVerification = () => {
    // Simulate cosine similarity (genuine user: 0.7-0.95, impostor: 0.2-0.5)
    const isImpostor = Math.random() < 0.15; // 15% chance of impostor
    const similarity = isImpostor 
      ? 0.2 + Math.random() * 0.3 
      : 0.7 + Math.random() * 0.25;
    
    const currentTrust = trustScoreRef.current;
    const newTrust = lambda * currentTrust + (1 - lambda) * similarity;
    
    setTrustScore(newTrust);
    setSimilarities(prev => [...prev.slice(-49), similarity]);
    setHistory(prev => [...prev.slice(-29), {
      score: newTrust,
      similarity,
      status: newTrust > 0.6 ? 'ALLOW' : newTrust > 0.4 ? 'CHALLENGE' : 'FLAGGED'
    }]);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(simulateVerification, 800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const reset = () => {
    setIsRunning(false);
    setTrustScore(1.0);
    setSimilarities([]);
    setHistory([]);
  };

  const getStatus = (score: number) => {
    if (score > 0.6) return { label: 'ALLOW', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
    if (score > 0.4) return { label: 'CHALLENGE', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle };
    return { label: 'FLAGGED', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle };
  };

  const status = getStatus(trustScore);
  const StatusIcon = status.icon;

  return (
    <section id="trust" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Step 4: Trust Score Engine</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Exponential Moving Average (EMA) decaying trust score — combines historical confidence 
            with real-time similarity measurements
          </p>
        </motion.div>

        {/* Formula */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-xl p-6 mb-8 text-center"
        >
          <p className="text-sm text-slate-400 mb-2">Decaying Trust Score Equation</p>
          <div className="text-xl font-mono text-indigo-300">
            Trust<sub>t</sub> = λ · Trust<sub>t-1</sub> + (1 - λ) · Similarity<sub>t</sub>
          </div>
          <p className="text-xs text-slate-500 mt-2">λ = {lambda} (higher = more weight on history, slower adaptation)</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trust Gauge */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
            <Shield className={`w-8 h-8 mb-4 ${status.color}`} />
            
            {/* Circular gauge */}
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-700" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                  stroke={trustScore > 0.6 ? '#10b981' : trustScore > 0.4 ? '#f59e0b' : '#ef4444'}
                  strokeLinecap="round"
                  strokeDasharray={`${trustScore * 264} 264`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{(trustScore * 100).toFixed(0)}%</span>
                <span className="text-xs text-slate-400">Trust</span>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-full ${status.bg} ${status.color} flex items-center gap-2`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">{status.label}</span>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  isRunning
                    ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                    : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                }`}
              >
                {isRunning ? 'Pause' : 'Start Simulation'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Similarity Timeline */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4">Similarity & Trust Timeline</h3>
            
            {/* Chart */}
            <div className="relative h-48 mb-4">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Threshold lines */}
                <line x1="0" y1="60" x2="500" y2="60" stroke="#10b981" strokeWidth="0.5" strokeDasharray="4" opacity="0.5" />
                <line x1="0" y1="90" x2="500" y2="90" stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="4" opacity="0.5" />
                
                {/* Labels */}
                <text x="505" y="63" fill="#10b981" fontSize="8" className="hidden">ALLOW</text>
                
                {/* Similarity line */}
                {similarities.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    opacity="0.6"
                    points={similarities.map((s, i) => 
                      `${(i / Math.max(1, similarities.length - 1)) * 490 + 5},${(1 - s) * 140 + 5}`
                    ).join(' ')}
                  />
                )}
                
                {/* Trust score line */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={trustScore > 0.6 ? '#10b981' : trustScore > 0.4 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="2"
                    points={history.map((h, i) => 
                      `${(i / Math.max(1, history.length - 1)) * 490 + 5},${(1 - h.score) * 140 + 5}`
                    ).join(' ')}
                  />
                )}
              </svg>
              
              {/* Legend */}
              <div className="absolute top-2 right-2 flex gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-indigo-500 inline-block" /> Similarity
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Trust Score
                </span>
              </div>
            </div>

            {/* Recent events */}
            <div className="border-t border-slate-700 pt-4">
              <h4 className="text-xs text-slate-400 mb-2">Recent Verification Events</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {history.slice(-8).reverse().map((h, i) => {
                  const s = getStatus(h.score);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-800/50">
                      <span className="text-slate-400">#{history.length - i}</span>
                      <span className="text-slate-300">sim: {h.similarity.toFixed(3)}</span>
                      <span className="text-slate-300">trust: {(h.score * 100).toFixed(1)}%</span>
                      <span className={`px-2 py-0.5 rounded ${s.bg} ${s.color} font-medium`}>
                        {h.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* API Response Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 code-block p-4"
        >
          <div className="text-xs text-slate-500 mb-2">API Response:</div>
          <pre className="text-sm">
            <code className="text-slate-300">{`{
  "status": "${status.label}",
  "current_risk_score": ${(1 - trustScore).toFixed(4)},
  "trust_score": ${trustScore.toFixed(4)},
  "anomaly_detected": ${trustScore < 0.4},
  "session_id": "sess_abc123",
  "timestamp": "${new Date().toISOString()}"
}`}</code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}
