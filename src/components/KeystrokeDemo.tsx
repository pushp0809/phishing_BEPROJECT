import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Clock, Timer, Activity, Lock, Eye, EyeOff } from 'lucide-react';

interface KeystrokeEvent {
  key: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
  masked: boolean;
}

interface TimingFeature {
  key: string;
  dwell: number | null;
  ddFlight: number | null;
  udFlight: number | null;
}

export default function KeystrokeDemo() {
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [features, setFeatures] = useState<TimingFeature[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [blurCount, setBlurCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyDownMap = useRef<Map<string, number>>(new Map());
  const lastKeyDown = useRef<number>(0);
  const lastKeyUp = useRef<number>(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;
    e.preventDefault();
    
    const now = performance.now();
    const key = e.key;
    
    if (key === 'Backspace') {
      setBackspaceCount(c => c + 1);
    }
    
    keyDownMap.current.set(key, now);
    const ddFlight = lastKeyDown.current > 0 ? now - lastKeyDown.current : null;
    lastKeyDown.current = now;
    
    setEvents(prev => [...prev, { key, type: 'keydown', timestamp: now, masked: !showKeys }]);
    
    setFeatures(prev => [...prev, {
      key: showKeys ? key : '•',
      dwell: null,
      ddFlight,
      udFlight: lastKeyUp.current > 0 ? now - lastKeyUp.current : null
    }]);
  }, [isRecording, showKeys]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;
    
    const now = performance.now();
    const key = e.key;
    const downTime = keyDownMap.current.get(key);
    const dwell = downTime ? now - downTime : null;
    
    lastKeyUp.current = now;
    keyDownMap.current.delete(key);
    
    setEvents(prev => [...prev, { key, type: 'keyup', timestamp: now, masked: !showKeys }]);
    
    // Update last feature with dwell time
    setFeatures(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].dwell === null) {
          updated[i] = { ...updated[i], dwell };
          break;
        }
      }
      return updated;
    });
  }, [isRecording]);

  const handlePaste = useCallback(() => {
    if (isRecording) setPasteCount(c => c + 1);
  }, [isRecording]);

  useEffect(() => {
    const handleBlur = () => {
      if (isRecording) setBlurCount(c => c + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isRecording]);

  const startRecording = () => {
    setEvents([]);
    setFeatures([]);
    setBackspaceCount(0);
    setPasteCount(0);
    setBlurCount(0);
    setIsRecording(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const avgDwell = features.filter(f => f.dwell !== null).reduce((s, f) => s + (f.dwell || 0), 0) / 
    Math.max(1, features.filter(f => f.dwell !== null).length);
  const avgDD = features.filter(f => f.ddFlight !== null).reduce((s, f) => s + (f.ddFlight || 0), 0) / 
    Math.max(1, features.filter(f => f.ddFlight !== null).length);

  return (
    <section id="demo" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Step 3: Live Keystroke Capture</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Interactive demonstration of privacy-first keystroke telemetry — type below to see 
            real-time timing feature extraction (characters are masked by default)
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Area */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                Typing Area
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition"
                  title={showKeys ? 'Mask characters' : 'Show characters'}
                >
                  {showKeys ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <input
              ref={inputRef}
              type={showKeys ? 'text' : 'password'}
              placeholder={isRecording ? 'Start typing...' : 'Click Start to begin recording'}
              disabled={!isRecording}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onPaste={handlePaste}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-50"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={startRecording}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm hover:bg-indigo-500/30 transition"
              >
                {isRecording ? '● Recording...' : 'Start Recording'}
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition disabled:opacity-50"
              >
                Stop
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Events</div>
                <div className="text-lg font-bold text-white">{events.length}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Dwell</div>
                <div className="text-lg font-bold text-cyan-300">{avgDwell.toFixed(1)}ms</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg DD Flight</div>
                <div className="text-lg font-bold text-purple-300">{avgDD.toFixed(1)}ms</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Backspaces</div>
                <div className="text-lg font-bold text-amber-300">{backspaceCount}</div>
              </div>
            </div>

            {/* Privacy indicators */}
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-300">Characters masked</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                <Timer className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-blue-300">Only timings sent</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                <Activity className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-300">Pastes: {pasteCount} | Blurs: {blurCount}</span>
              </div>
            </div>
          </div>

          {/* Feature Timeline */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-400" />
              Extracted Features (last 15)
            </h3>
            
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-800">
                  <tr className="text-slate-400">
                    <th className="text-left py-2 px-2">Key</th>
                    <th className="text-right py-2 px-2">Dwell (ms)</th>
                    <th className="text-right py-2 px-2">DD (ms)</th>
                    <th className="text-right py-2 px-2">UD (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {features.slice(-15).map((f, i) => (
                    <tr key={i} className="border-t border-slate-700/50 hover:bg-white/5">
                      <td className="py-1.5 px-2 font-mono text-indigo-300">{f.key}</td>
                      <td className="py-1.5 px-2 text-right text-cyan-300">
                        {f.dwell !== null ? f.dwell.toFixed(1) : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-right text-purple-300">
                        {f.ddFlight !== null ? f.ddFlight.toFixed(1) : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-right text-emerald-300">
                        {f.udFlight !== null ? f.udFlight.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                  {features.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Start typing to see features...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Dwell time bar chart */}
            {features.filter(f => f.dwell !== null).length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs text-slate-400 mb-2">Dwell Time Distribution</h4>
                <div className="flex items-end gap-0.5 h-16">
                  {features.filter(f => f.dwell !== null).slice(-30).map((f, i) => {
                    const maxDwell = Math.max(...features.filter(x => x.dwell).map(x => x.dwell || 0));
                    const height = ((f.dwell || 0) / maxDwell) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-cyan-400 min-w-[3px]"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${f.dwell?.toFixed(1)}ms`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
