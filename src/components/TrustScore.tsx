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
  const lambda = 0.7;

  useEffect(() => {
    trustScoreRef.current = trustScore;
  }, [trustScore]);

  const simulateVerification = () => {
    const isImpostor = Math.random() < 0.15;
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
    if (score > 0.6) return { label: 'ALLOW', badge: 'badge-success', icon: CheckCircle };
    if (score > 0.4) return { label: 'CHALLENGE', badge: 'badge-warning', icon: AlertTriangle };
    return { label: 'FLAGGED', badge: 'badge-danger', icon: XCircle };
  };

  const status = getStatus(trustScore);
  const StatusIcon = status.icon;

  return (
    <section id="trust" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Trust Score Engine
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Exponential Moving Average (EMA) decaying trust score — combines historical confidence 
            with real-time similarity measurements.
          </p>
        </div>

        {/* Formula */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card p-5 mb-6 text-center"
        >
          <p className="text-xs text-gray-500 mb-2">Decaying Trust Score Equation</p>
          <div className="text-base font-mono text-gray-900">
            Trust<sub>t</sub> = λ · Trust<sub>t-1</sub> + (1 - λ) · Similarity<sub>t</sub>
          </div>
          <p className="text-xs text-gray-400 mt-2">λ = {lambda} (higher = more weight on history)</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trust Gauge */}
          <div className="card p-5 flex flex-col items-center justify-center">
            <Shield className="w-6 h-6 text-gray-400 mb-3" />
            
            <div className="relative w-36 h-36 mb-3">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                  stroke="#111827"
                  strokeLinecap="round"
                  strokeDasharray={`${trustScore * 264} 264`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-gray-900">{(trustScore * 100).toFixed(0)}%</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Trust</span>
              </div>
            </div>

            <span className={`badge ${status.badge} mb-4`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isRunning
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="font-medium text-gray-900 text-sm mb-3">Similarity & Trust Timeline</h3>
            
            <div className="relative h-40 mb-3">
              <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                <line x1="0" y1="56" x2="500" y2="56" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                <line x1="0" y1="84" x2="500" y2="84" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
                
                {similarities.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="1.5"
                    points={similarities.map((s, i) => 
                      `${(i / Math.max(1, similarities.length - 1)) * 490 + 5},${(1 - s) * 130 + 5}`
                    ).join(' ')}
                  />
                )}
                
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#111827"
                    strokeWidth="2"
                    points={history.map((h, i) => 
                      `${(i / Math.max(1, history.length - 1)) * 490 + 5},${(1 - h.score) * 130 + 5}`
                    ).join(' ')}
                  />
                )}
              </svg>
              
              <div className="absolute top-2 right-2 flex gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-gray-500">
                  <span className="w-3 h-0.5 bg-gray-300 inline-block" /> Similarity
                </span>
                <span className="flex items-center gap-1 text-gray-700">
                  <span className="w-3 h-0.5 bg-gray-900 inline-block" /> Trust
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-[11px] text-gray-500 mb-2 font-medium">Recent Events</h4>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {history.slice(-8).reverse().map((h, i) => {
                  const s = getStatus(h.score);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-gray-50 border border-gray-100">
                      <span className="text-gray-400 font-mono text-[10px]">#{history.length - i}</span>
                      <span className="text-gray-600 font-mono text-[11px]">sim: {h.similarity.toFixed(2)}</span>
                      <span className="text-gray-600 font-mono text-[11px]">trust: {(h.score * 100).toFixed(0)}%</span>
                      <span className={`badge ${s.badge} text-[10px]`}>
                        {h.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* API Response */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 code-block p-4"
        >
          <div className="text-[10px] text-gray-400 mb-2 font-medium">API Response:</div>
          <pre className="text-xs">
            <code className="text-gray-700">{`{
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
