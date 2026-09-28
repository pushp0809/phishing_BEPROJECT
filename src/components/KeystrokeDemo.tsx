import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, Clock, Lock, Eye, EyeOff, Timer, Activity } from 'lucide-react';

interface KeystrokeEvent {
  key: string;
  type: 'keydown' | 'keyup';
  timestamp: number;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const keyDownMap = useRef<Map<string, number>>(new Map());
  const lastKeyDown = useRef<number>(0);
  const lastKeyUp = useRef<number>(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isRecording) return;
    e.preventDefault();
    
    const now = performance.now();
    const key = e.key;
    
    if (key === 'Backspace') setBackspaceCount(c => c + 1);
    
    keyDownMap.current.set(key, now);
    const ddFlight = lastKeyDown.current > 0 ? now - lastKeyDown.current : null;
    lastKeyDown.current = now;
    
    setEvents(prev => [...prev, { key, type: 'keydown', timestamp: now }]);
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
    
    setEvents(prev => [...prev, { key, type: 'keyup', timestamp: now }]);
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

  const startRecording = () => {
    setEvents([]);
    setFeatures([]);
    setBackspaceCount(0);
    setPasteCount(0);
    setIsRecording(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const stopRecording = () => setIsRecording(false);

  const avgDwell = features.filter(f => f.dwell !== null).reduce((s, f) => s + (f.dwell || 0), 0) / 
    Math.max(1, features.filter(f => f.dwell !== null).length);
  const avgDD = features.filter(f => f.ddFlight !== null).reduce((s, f) => s + (f.ddFlight || 0), 0) / 
    Math.max(1, features.filter(f => f.ddFlight !== null).length);

  return (
    <section id="demo" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Live Keystroke Capture
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Interactive demonstration of privacy-first keystroke telemetry. Characters are masked by default — only timing data is captured.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Area */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-gray-400" />
                Typing Area
              </h3>
              <button
                onClick={() => setShowKeys(!showKeys)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                title={showKeys ? 'Mask characters' : 'Show characters'}
              >
                {showKeys ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            <input
              ref={inputRef}
              type={showKeys ? 'text' : 'password'}
              placeholder={isRecording ? 'Start typing...' : 'Click Start to begin'}
              disabled={!isRecording}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onPaste={handlePaste}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50 disabled:text-gray-400 text-sm transition-all"
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={startRecording}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isRecording
                    ? 'bg-gray-100 text-gray-500 border border-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isRecording ? '● Recording...' : 'Start Recording'}
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording}
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Stop
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Events', value: events.length },
                { label: 'Avg Dwell', value: `${avgDwell.toFixed(0)}ms` },
                { label: 'Avg DD', value: `${avgDD.toFixed(0)}ms` },
                { label: 'Backspaces', value: backspaceCount },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</div>
                  <div className="text-base font-semibold text-gray-900 font-mono">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Privacy indicators */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="badge badge-success">
                <Lock className="w-3 h-3" /> Characters masked
              </span>
              <span className="badge badge-accent">
                <Timer className="w-3 h-3" /> Only timings
              </span>
              <span className="badge">
                <Activity className="w-3 h-3" /> Pastes: {pasteCount}
              </span>
            </div>
          </div>

          {/* Feature Timeline */}
          <div className="card p-5">
            <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              Extracted Features (last 15)
            </h3>
            
            <div className="overflow-auto max-h-[320px] rounded-lg border border-gray-100">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th className="text-right">Dwell</th>
                    <th className="text-right">DD</th>
                    <th className="text-right">UD</th>
                  </tr>
                </thead>
                <tbody>
                  {features.slice(-15).map((f, i) => (
                    <tr key={i}>
                      <td className="font-mono text-gray-700">{f.key}</td>
                      <td className="text-right font-mono text-gray-600">
                        {f.dwell !== null ? `${f.dwell.toFixed(0)}` : '—'}
                      </td>
                      <td className="text-right font-mono text-gray-500">
                        {f.ddFlight !== null ? `${f.ddFlight.toFixed(0)}` : '—'}
                      </td>
                      <td className="text-right font-mono text-gray-500">
                        {f.udFlight !== null ? `${f.udFlight.toFixed(0)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {features.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-xs">
                        Start typing to see features...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Dwell time bar chart */}
            {features.filter(f => f.dwell !== null).length > 0 && (
              <div className="mt-4">
                <h4 className="text-[11px] text-gray-500 mb-2 font-medium">Dwell Time Distribution</h4>
                <div className="flex items-end gap-0.5 h-14">
                  {features.filter(f => f.dwell !== null).slice(-30).map((f, i) => {
                    const maxDwell = Math.max(...features.filter(x => x.dwell).map(x => x.dwell || 0));
                    const height = ((f.dwell || 0) / maxDwell) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gray-900 min-w-[3px] opacity-60 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${f.dwell?.toFixed(0)}ms`}
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
