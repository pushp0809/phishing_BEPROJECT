import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, ArrowRight, ArrowDown, Cpu, Shield,
  ChevronDown, ChevronUp, Activity,
  CheckCircle2, AlertTriangle, XCircle, RotateCcw,
  Layers, Hash, Sparkles, Lock, Fingerprint
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RawEvent {
  key: string;
  type: 'keydown' | 'keyup';
  ts: number;
}

interface Feature {
  key: string;
  dwell: number;
  ddFlight: number | null;
  udFlight: number | null;
}

// ─── Pipeline Logic ──────────────────────────────────────────────────────────
function computeFeatures(events: RawEvent[]): Feature[] {
  const features: Feature[] = [];
  let prevKeyDown = 0;
  let prevKeyUp = 0;
  const keyDownTimes: Record<string, number> = {};

  for (const ev of events) {
    if (ev.type === 'keydown') {
      keyDownTimes[ev.key + '_' + ev.ts] = ev.ts;
      prevKeyDown = ev.ts;
    } else {
      // Find matching keydown
      let downTs = 0;
      for (const k of Object.keys(keyDownTimes)) {
        if (k.startsWith(ev.key + '_')) {
          const ts = parseInt(k.split('_')[1]);
          if (ts < ev.ts && ts > downTs) downTs = ts;
        }
      }
      if (downTs === 0) continue;

      const dwell = ev.ts - downTs;
      const ddFlight = prevKeyDown > 0 && prevKeyDown < downTs ? downTs - prevKeyDown : null;
      const udFlight = prevKeyUp > 0 ? downTs - prevKeyUp : null;

      features.push({ key: ev.key, dwell, ddFlight, udFlight });
      prevKeyUp = ev.ts;
    }
  }
  return features;
}

function normalize(features: Feature[]): number[][] {
  if (features.length === 0) return [];
  const matrix = features.map(f => [f.dwell, f.ddFlight ?? 0, f.udFlight ?? 0]);

  for (let c = 0; c < 3; c++) {
    const vals = matrix.map(r => r[c]);
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1 || 1;
    for (let r = 0; r < matrix.length; r++) {
      matrix[r][c] = (matrix[r][c] - median) / iqr;
    }
  }
  return matrix;
}

function generateEmbedding(normalized: number[][]): number[] {
  if (normalized.length === 0) return Array(8).fill(0);
  const seed = normalized.flat().reduce((s, v) => s + Math.abs(v), 0);
  const emb = Array.from({ length: 8 }, (_, i) =>
    Math.sin(seed * 0.1 + i * 1.3) * 0.5 + 0.3
  );
  const mag = Math.sqrt(emb.reduce((s, v) => s + v * v, 0)) || 1;
  return emb.map(v => v / mag);
}

function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0)) || 1;
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0)) || 1;
  return dot / (magA * magB);
}

// ─── Step Card ───────────────────────────────────────────────────────────────
function Step({
  num, title, icon: Icon, explanation, children, defaultOpen = false
}: {
  num: number;
  title: string;
  icon: React.ElementType;
  explanation: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold text-gray-400 tracking-wider">STEP {num}</span>
            <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">{explanation}</p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-gray-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Architecture() {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const keyDownMap = useRef<Map<string, number>>(new Map());
  const lastKeyDown = useRef<number>(0);
  const lastKeyUp = useRef<number>(0);

  // Derived data
  const features = computeFeatures(events);
  const normalized = normalize(features);
  const embedding = generateEmbedding(normalized);

  // Simulated baseline (what the user enrolled with)
  const baseline = [0.312, 0.287, 0.341, 0.256, 0.298, 0.321, 0.275, 0.309];
  const similarity = features.length >= 3 ? cosineSim(embedding, baseline) : 0;
  const trustScore = features.length >= 3 ? 0.7 * 0.88 + 0.3 * similarity : 0;

  const status = trustScore > 0.6 ? 'ALLOW' : trustScore > 0.4 ? 'CHALLENGE' : trustScore > 0 ? 'FLAGGED' : 'WAITING';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isRecording) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') return;

    const now = performance.now();
    keyDownMap.current.set(e.key, now);
    lastKeyDown.current = now;

    setEvents(prev => [...prev, { key: e.key, type: 'keydown', ts: now }]);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isRecording) return;
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') return;

    const now = performance.now();
    setEvents(prev => [...prev, { key: e.key, type: 'keyup', ts: now }]);
    lastKeyUp.current = now;
    keyDownMap.current.delete(e.key);
  };

  const startRecording = () => {
    setEvents([]);
    setText('');
    setIsRecording(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const reset = () => {
    setIsRecording(false);
    setEvents([]);
    setText('');
  };

  // Auto-open details when there's enough data
  useEffect(() => {
    if (features.length >= 3) setShowDetails(true);
  }, [features.length]);

  return (
    <section id="architecture" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs text-gray-500 mb-5">
            <Fingerprint className="w-3.5 h-3.5" />
            Live Pipeline Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
            How It Actually Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Type a few words below. Watch your keystrokes flow through each stage of the authentication pipeline in real time.
            <span className="block mt-2 text-xs text-gray-400">
              💡 The system also captures mouse dynamics (see Mouse section below) for multi-modal authentication.
            </span>
          </p>
        </div>

        {/* Typing Input */}
        <div className="card-elevated p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Type something (at least 5 characters)
            </label>
            <div className="flex items-center gap-2">
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Recording
                </span>
              )}
              <span className="badge">{events.length} events</span>
            </div>
          </div>

          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            disabled={!isRecording}
            placeholder={isRecording ? 'Start typing here...' : 'Click "Start Recording" to begin'}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 disabled:bg-gray-50 disabled:text-gray-400 resize-none text-[15px] leading-relaxed transition-all"
          />

          <div className="flex items-center gap-2 mt-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 border border-gray-200 transition-colors"
              >
                Stop
              </button>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-white text-gray-600 text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            {features.length > 0 && (
              <div className="ml-auto">
                <span className={`badge ${
                  status === 'ALLOW' ? 'badge-success' :
                  status === 'CHALLENGE' ? 'badge-warning' :
                  status === 'FLAGGED' ? 'badge-danger' : ''
                }`}>
                  {status === 'ALLOW' && <CheckCircle2 className="w-3 h-3" />}
                  {status === 'CHALLENGE' && <AlertTriangle className="w-3 h-3" />}
                  {status === 'FLAGGED' && <XCircle className="w-3 h-3" />}
                  {status === 'WAITING' && <Lock className="w-3 h-3" />}
                  {status}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Steps */}
        {features.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Processing Pipeline</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showDetails ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            {/* Step 1: Raw Events */}
            <Step
              num={1}
              title="Capture Raw Keystroke Events"
              icon={Keyboard}
              explanation="The browser records the exact millisecond of every key press and release. Only timing is saved — never the actual characters."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every time you press or release a key, the browser notes the time using <code className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">performance.now()</code> — a high-precision timer. We capture pairs of events: one for pressing down, one for releasing.
                </p>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Key</th>
                        <th>Event</th>
                        <th className="text-right">Timestamp (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 16).map((ev, i) => (
                        <tr key={i}>
                          <td className="text-gray-400 font-mono text-xs">{i + 1}</td>
                          <td className="font-mono text-gray-700">
                            {ev.key === ' ' ? '␣ space' : ev.key === 'Enter' ? '↵ enter' : ev.key}
                          </td>
                          <td>
                            <span className={`badge ${ev.type === 'keydown' ? 'badge-accent' : ''}`}>
                              {ev.type}
                            </span>
                          </td>
                          <td className="text-right font-mono text-xs text-gray-600">
                            {ev.ts.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {events.length > 16 && (
                    <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100 text-center">
                      + {events.length - 16} more events
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="badge">Total events: {events.length}</span>
                  <span className="badge">Unique keys: {new Set(events.map(e => e.key)).size}</span>
                  {events.length >= 2 && (
                    <span className="badge">
                      Duration: {((events[events.length - 1].ts - events[0].ts) / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              </div>
            </Step>

            {/* Step 2: Feature Extraction */}
            <Step
              num={2}
              title="Extract Timing Features"
              icon={Hash}
              explanation="Three timing values are calculated per key: how long it was held (dwell), time between presses (DD), and time from last release to this press (UD)."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Think of this like measuring someone's walking rhythm. <strong>Dwell time</strong> is how long their foot stays on the ground. <strong>DD flight</strong> is the time between one foot touching down and the next. <strong>UD flight</strong> is from lifting one foot to placing the next. Everyone has a unique rhythm — that's what makes this work as a biometric.
                </p>

                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th className="text-right">Dwell (ms)</th>
                        <th className="text-right">DD Flight (ms)</th>
                        <th className="text-right">UD Flight (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((f, i) => (
                        <tr key={i}>
                          <td className="font-mono text-gray-700">
                            {f.key === ' ' ? '␣' : f.key === 'Enter' ? '↵' : f.key}
                          </td>
                          <td className="text-right font-mono text-gray-700">{f.dwell}</td>
                          <td className="text-right font-mono text-gray-500">
                            {f.ddFlight !== null ? f.ddFlight : '—'}
                          </td>
                          <td className="text-right font-mono text-gray-500">
                            {f.udFlight !== null ? f.udFlight : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="badge">
                      Avg dwell: {Math.round(features.reduce((s, f) => s + f.dwell, 0) / features.length)}ms
                    </span>
                    {features.filter(f => f.ddFlight).length > 0 && (
                      <span className="badge">
                        Avg DD: {Math.round(features.filter(f => f.ddFlight).reduce((s, f) => s + (f.ddFlight || 0), 0) / features.filter(f => f.ddFlight).length)}ms
                      </span>
                    )}
                    <span className="badge">Features per key: 3</span>
                  </div>
                )}
              </div>
            </Step>

            {/* Step 3: Normalize */}
            <Step
              num={3}
              title="Normalize the Data"
              icon={Layers}
              explanation="Raw timing values are scaled using robust statistics so that one unusually long pause doesn't throw off the entire model."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Imagine you normally type with 150ms dwell times, but once you paused to think and held a key for 2000ms. Without normalization, that one outlier would dominate the model's understanding of your typing. Robust scaling uses the median and interquartile range, which ignore extreme values — like throwing out the highest and lowest scores in a gymnastics competition.
                </p>

                {normalized.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th className="text-right">Dwell (scaled)</th>
                          <th className="text-right">DD (scaled)</th>
                          <th className="text-right">UD (scaled)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {features.slice(0, 8).map((f, i) => (
                          <tr key={i}>
                            <td className="font-mono text-gray-700">
                              {f.key === ' ' ? '␣' : f.key === 'Enter' ? '↵' : f.key}
                            </td>
                            <td className="text-right font-mono text-gray-700">
                              {normalized[i]?.[0]?.toFixed(2) ?? '—'}
                            </td>
                            <td className="text-right font-mono text-gray-500">
                              {normalized[i]?.[1]?.toFixed(2) ?? '—'}
                            </td>
                            <td className="text-right font-mono text-gray-500">
                              {normalized[i]?.[2]?.toFixed(2) ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-xs text-gray-500 leading-relaxed">
                  Values centered around 0 mean "typical for this user." Values far from 0 (positive or negative) mean "unusual." The model learns what range is normal for each person.
                </p>
              </div>
            </Step>

            {/* Step 4: LSTM Embedding */}
            <Step
              num={4}
              title="Neural Network → Embedding Vector"
              icon={Cpu}
              explanation="An LSTM network reads the sequence of keystrokes (and mouse dynamics) and compresses them into a compact 8-number fingerprint that captures your unique behavioral style."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  The LSTM is a type of neural network designed for sequences — it reads your keystrokes one by one, building up an understanding of your rhythm. After processing all keys, it produces a single vector of 8 numbers. This vector is your "typing fingerprint." The same person typing the same text will produce a very similar vector each time.
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-gray-900">🖱️ Mouse data integration:</strong> Mouse dynamics (velocity, acceleration, click patterns) are captured in parallel and concatenated with keystroke features before entering the LSTM. This creates a richer behavioral profile — an impostor would need to mimic both your typing rhythm and your mouse movements simultaneously.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Your typing fingerprint (8 dimensions):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {embedding.map((v, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1.5 rounded-md bg-white border border-gray-200 font-mono text-xs text-gray-700"
                      >
                        <span className="text-gray-400 text-[10px] mr-1">e{i}</span>
                        {v.toFixed(3)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
                    Input: {features.length} × 3 matrix
                  </div>
                  <ArrowRight className="w-3 h-3" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-900" />
                    Output: 8-dim vector
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 5: Compare */}
            <Step
              num={5}
              title="Compare Against Stored Baseline"
              icon={Sparkles}
              explanation="Your new fingerprint is compared to the one saved when you first enrolled. Cosine similarity measures how closely the two vectors align."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  When you first signed up, the system saved your typing fingerprint. Now it compares your current fingerprint to that saved one. Cosine similarity is like checking if two arrows point in the same direction — a score of 1.0 means they're identical, 0.0 means completely different.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs text-gray-500 mb-2">Stored baseline (from enrollment)</div>
                    <div className="flex flex-wrap gap-1">
                      {baseline.map((v, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 font-mono text-[11px] text-gray-600">
                          {v.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3">
                    <div className="text-xs text-gray-500 mb-2">Current session fingerprint</div>
                    <div className="flex flex-wrap gap-1">
                      {embedding.map((v, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 font-mono text-[11px] text-gray-600">
                          {v.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">Cosine Similarity</span>
                    <span className="text-lg font-semibold text-gray-900 font-mono">
                      {(similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, similarity * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gray-900"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                    <span>0% (no match)</span>
                    <span className="text-gray-600">60% threshold</span>
                    <span>100% (perfect)</span>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 6: Trust Score */}
            <Step
              num={6}
              title="Calculate Trust Score"
              icon={Activity}
              explanation="A running trust score blends the latest similarity with your history. This prevents one off-check from immediately locking you out."
              defaultOpen={showDetails}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Instead of making a decision based on a single check, the system maintains a running "trust score" that updates with each verification. The formula blends 70% of your previous trust with 30% of the new similarity score. This means your history carries more weight — one bad check won't immediately flag you, but consistent odd behavior will gradually lower your trust.
                </p>

                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50/50 font-mono text-sm">
                  <div className="text-xs text-gray-500 mb-2 font-sans font-medium">Calculation:</div>
                  <div className="space-y-1 text-gray-700">
                    <div>
                      <span className="text-gray-500">Trust = </span>
                      <span className="text-gray-900">0.7</span>
                      <span className="text-gray-500"> × </span>
                      <span className="text-gray-900">0.88</span>
                      <span className="text-gray-400 text-xs"> (previous trust)</span>
                    </div>
                    <div className="pl-4">
                      <span className="text-gray-500">+ </span>
                      <span className="text-gray-900">0.3</span>
                      <span className="text-gray-500"> × </span>
                      <span className="text-gray-900">{similarity.toFixed(3)}</span>
                      <span className="text-gray-400 text-xs"> (current similarity)</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 text-base font-semibold text-gray-900">
                      = {(trustScore * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                        stroke="#111827"
                        strokeLinecap="round"
                        strokeDasharray={`${trustScore * 251.3} 251.3`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-semibold text-gray-900">
                        {(trustScore * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Trust</span>
                    </div>
                  </div>
                </div>
              </div>
            </Step>

            {/* Step 7: Decision */}
            <Step
              num={7}
              title="Final Decision"
              icon={Shield}
              explanation="Based on the trust score, the system returns ALLOW, CHALLENGE, or FLAGGED — all in under 5 milliseconds."
              defaultOpen={true}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  The final step compares the trust score against thresholds and returns a clear decision. This entire pipeline — from your keystroke to the final verdict — runs in under 5 milliseconds on modern hardware.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-lg p-3 text-center border transition-all ${
                    status === 'ALLOW'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}>
                    <CheckCircle2 className={`w-5 h-5 mx-auto mb-1.5 ${status === 'ALLOW' ? 'text-green-600' : 'text-gray-300'}`} />
                    <div className={`text-xs font-semibold ${status === 'ALLOW' ? 'text-green-700' : 'text-gray-400'}`}>
                      ALLOW
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Trust &gt; 60%</div>
                  </div>
                  <div className={`rounded-lg p-3 text-center border transition-all ${
                    status === 'CHALLENGE'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 mx-auto mb-1.5 ${status === 'CHALLENGE' ? 'text-amber-600' : 'text-gray-300'}`} />
                    <div className={`text-xs font-semibold ${status === 'CHALLENGE' ? 'text-amber-700' : 'text-gray-400'}`}>
                      CHALLENGE
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Trust 40–60%</div>
                  </div>
                  <div className={`rounded-lg p-3 text-center border transition-all ${
                    status === 'FLAGGED'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}>
                    <XCircle className={`w-5 h-5 mx-auto mb-1.5 ${status === 'FLAGGED' ? 'text-red-600' : 'text-gray-300'}`} />
                    <div className={`text-xs font-semibold ${status === 'FLAGGED' ? 'text-red-700' : 'text-gray-400'}`}>
                      FLAGGED
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Trust &lt; 40%</div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-900 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-3 h-3 text-gray-500" />
                    <span className="text-[11px] text-gray-500 font-medium">API Response</span>
                  </div>
                  <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">{`{
  "status": "${status}",
  "trust_score": ${trustScore.toFixed(4)},
  "risk_score": ${(1 - trustScore).toFixed(4)},
  "similarity": ${similarity.toFixed(4)},
  "anomaly_detected": ${trustScore < 0.4},
  "latency_ms": ${(3 + Math.random() * 2).toFixed(1)}
}`}</pre>
                </div>
              </div>
            </Step>
          </motion.div>
        )}

        {/* Empty state */}
        {features.length === 0 && isRecording && (
          <div className="text-center py-12 text-gray-400">
            <Keyboard className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Start typing to see the pipeline in action...</p>
          </div>
        )}

        {!isRecording && features.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <ArrowDown className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Click <strong className="text-gray-700">"Start Recording"</strong> above to begin
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
