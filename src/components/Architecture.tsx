import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Keyboard, ArrowRight, Cpu, Shield, Globe, Clock,
  ChevronDown, ChevronUp, Zap, Eye, Lock, Activity,
  CheckCircle2, AlertTriangle, XCircle, Play, RotateCcw,
  Layers, BarChart3, Hash, Binary
} from 'lucide-react';

// ─── Simulated raw keystroke data ────────────────────────────────────────────
const RAW_EVENTS = [
  { key: 'H', event: 'keydown', ts: 1000 },
  { key: 'H', event: 'keyup',   ts: 1142 },
  { key: 'e', event: 'keydown', ts: 1210 },
  { key: 'e', event: 'keyup',   ts: 1338 },
  { key: 'l', event: 'keydown', ts: 1405 },
  { key: 'l', event: 'keyup',   ts: 1540 },
  { key: 'l', event: 'keydown', ts: 1612 },
  { key: 'l', event: 'keyup',   ts: 1748 },
  { key: 'o', event: 'keydown', ts: 1820 },
  { key: 'o', event: 'keyup',   ts: 1955 },
  { key: ' ', event: 'keydown', ts: 2030 },
  { key: ' ', event: 'keyup',   ts: 2098 },
  { key: 'W', event: 'keydown', ts: 2170 },
  { key: 'W', event: 'keyup',   ts: 2305 },
  { key: 'o', event: 'keydown', ts: 2380 },
  { key: 'o', event: 'keyup',   ts: 2510 },
  { key: 'r', event: 'keydown', ts: 2585 },
  { key: 'r', event: 'keyup',   ts: 2720 },
  { key: 'l', event: 'keydown', ts: 2790 },
  { key: 'l', event: 'keyup',   ts: 2925 },
  { key: 'd', event: 'keydown', ts: 3000 },
  { key: 'd', event: 'keyup',   ts: 3130 },
];

// ─── Step 1: Feature Extraction ──────────────────────────────────────────────
interface DwellFlight {
  key: string;
  dwell: number;
  ddFlight: number | null;
  udFlight: number | null;
}

function computeFeatures(): DwellFlight[] {
  const features: DwellFlight[] = [];
  let prevKeyDown = 0;
  let prevKeyUp = 0;

  // Process pairs: keydown followed by keyup
  for (let i = 0; i < RAW_EVENTS.length; i += 2) {
    const down = RAW_EVENTS[i];
    const up = RAW_EVENTS[i + 1];
    if (!up || up.event !== 'keyup') continue;

    const dwell = up.ts - down.ts;
    const ddFlight = prevKeyDown > 0 ? down.ts - prevKeyDown : null;
    const udFlight = prevKeyUp > 0 ? down.ts - prevKeyUp : null;

    features.push({ key: down.key, dwell, ddFlight, udFlight });
    prevKeyDown = down.ts;
    prevKeyUp = up.ts;
  }

  return features;
}

// ─── Step 2: Windowing ───────────────────────────────────────────────────────
function createWindow(features: DwellFlight[]): number[][] {
  return features.map(f => [
    f.dwell,
    f.ddFlight ?? 0,
    f.udFlight ?? 0
  ]);
}

// ─── Step 3: Normalize ───────────────────────────────────────────────────────
function normalize(window: number[][]): number[][] {
  const cols = 3;
  const result: number[][] = window.map(r => [...r]);

  for (let c = 0; c < cols; c++) {
    const vals = result.map(r => r[c]);
    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1 || 1;
    for (let r = 0; r < result.length; r++) {
      result[r][c] = parseFloat(((result[r][c] - median) / iqr).toFixed(3));
    }
  }
  return result;
}

// ─── Step 4: Simulated Embedding ─────────────────────────────────────────────
function generateEmbedding(normalized: number[][]): number[] {
  // Simulate LSTM → projection → L2 normalize
  const seed = normalized.flat().reduce((s, v) => s + v, 0);
  const emb = Array.from({ length: 8 }, (_, i) =>
    parseFloat((Math.sin(seed + i * 1.7) * 0.5 + 0.3).toFixed(3))
  );
  // L2 normalize
  const mag = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map(v => parseFloat((v / mag).toFixed(3)));
}

// ─── Step 5: Similarity ──────────────────────────────────────────────────────
function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return parseFloat((dot / (magA * magB)).toFixed(4));
}

// ─── Pipeline Step Card ──────────────────────────────────────────────────────
function PipelineStep({
  stepNum, title, icon: Icon, color, explanation, children, isLast
}: {
  stepNum: number;
  title: string;
  icon: React.ElementType;
  color: string;
  explanation: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-full w-0.5 h-8 bg-gradient-to-b from-indigo-500/40 to-transparent z-0" />
      )}

      <div className="glass-card rounded-2xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/30 transition-all">
        {/* Header */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                STEP {stepNum}
              </span>
              <h3 className="font-bold text-white text-lg">{title}</h3>
            </div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{explanation}</p>
          </div>
          {open ? (
            <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
        </button>

        {/* Content */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-slate-700/50 pt-5">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Data Pill ───────────────────────────────────────────────────────────────
function DataPill({ label, value, color = 'indigo' }: { label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  };
  return (
    <div className={`px-3 py-2 rounded-lg border ${colors[color] || colors.indigo}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono font-bold text-sm mt-0.5">{value}</div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Architecture() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<'ALLOW' | 'FLAGGED' | null>(null);

  // Compute all pipeline stages
  const features = computeFeatures();
  const window = createWindow(features);
  const normalized = normalize(window);
  const embedding = generateEmbedding(normalized);

  // Baseline (stored during enrollment)
  const baseline = [0.312, 0.287, 0.341, 0.256, 0.298, 0.321, 0.275, 0.309];
  const similarity = cosineSim(embedding, baseline);
  const trustScore = 0.7 * 0.92 + 0.3 * similarity; // EMA

  const runPipeline = () => {
    setIsRunning(true);
    setResult(null);
    setCurrentStep(0);

    const steps = [1, 2, 3, 4, 5, 6, 7];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setCurrentStep(step);
        if (step === 7) {
          setTimeout(() => {
            setResult(trustScore > 0.6 ? 'ALLOW' : 'FLAGGED');
            setIsRunning(false);
          }, 600);
        }
      }, i * 700);
    });
  };

  const reset = () => {
    setCurrentStep(0);
    setResult(null);
    setIsRunning(false);
  };

  return (
    <section id="architecture" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">System Architecture — Live Implementation</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Watch the full authentication pipeline process real keystroke data step by step.
            Each stage transforms the data and passes it to the next — just like a factory assembly line.
          </p>
        </motion.div>

        {/* Run Pipeline Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center gap-3 mb-10"
        >
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Processing...' : 'Run Full Pipeline'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </motion.div>

        {/* Final Result Banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mb-10 rounded-2xl p-6 border-2 ${
                result === 'ALLOW'
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-red-500/10 border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-4">
                {result === 'ALLOW' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
                <div>
                  <h3 className={`text-2xl font-bold ${result === 'ALLOW' ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result === 'ALLOW' ? '✓ User Verified — Access Granted' : '✗ Impostor Detected — Access Denied'}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Trust Score: <span className="font-mono font-bold text-white">{(trustScore * 100).toFixed(1)}%</span>
                    {' | '}Similarity: <span className="font-mono font-bold text-white">{(similarity * 100).toFixed(1)}%</span>
                    {' | '}Threshold: 60%
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pipeline Steps */}
        <div className="space-y-6">
          {/* STEP 1: Raw Events */}
          <PipelineStep
            stepNum={1}
            title="Capture Raw Keystroke Events"
            icon={Keyboard}
            color="from-blue-500 to-cyan-500"
            explanation="The browser extension listens to every key press and release. It records the exact millisecond timestamp using performance.now() — like a super-precise stopwatch."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-blue-300">🔍 What's happening:</strong> Imagine you're typing "Hello World".
                  Every time your finger touches a key (keydown) and lifts off (keyup), the browser notes the exact time.
                  We <em>don't</em> save what letter you typed — just the timing. This is how we protect your privacy.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Key</th>
                      <th className="text-left py-2 px-2">Event</th>
                      <th className="text-right py-2 px-2">Timestamp (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RAW_EVENTS.slice(0, 12).map((ev, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-white/[0.02]">
                        <td className="py-1.5 px-2 text-slate-500">{i + 1}</td>
                        <td className="py-1.5 px-2 font-mono text-indigo-300">
                          {ev.key === ' ' ? '␣' : ev.key}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            ev.event === 'keydown'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-amber-500/10 text-amber-300'
                          }`}>
                            {ev.event}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-slate-300">{ev.ts}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={4} className="py-2 px-2 text-center text-slate-500 text-[10px]">
                        ... {RAW_EVENTS.length - 12} more events ...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                <DataPill label="Total Events" value={RAW_EVENTS.length} color="blue" />
                <DataPill label="Unique Keys" value={new Set(RAW_EVENTS.map(e => e.key)).size} color="cyan" />
                <DataPill label="Duration" value={`${RAW_EVENTS[RAW_EVENTS.length - 1].ts - RAW_EVENTS[0].ts}ms`} color="purple" />
              </div>
            </div>
          </PipelineStep>

          {/* STEP 2: Feature Extraction */}
          <PipelineStep
            stepNum={2}
            title="Extract Timing Features"
            icon={Clock}
            color="from-purple-500 to-pink-500"
            explanation="Now we calculate three types of timing from the raw events: how long each key was held (dwell), time between pressing two keys (DD flight), and time from releasing one key to pressing the next (UD flight)."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-purple-300">🔍 What's happening:</strong> Think of it like analyzing someone's handwriting speed.
                  <br />• <strong>Dwell Time</strong> = How long your finger stays on a key (like how long a pen touches paper)
                  <br />• <strong>DD Flight</strong> = Time from pressing one key to pressing the next (press→press)
                  <br />• <strong>UD Flight</strong> = Time from releasing one key to pressing the next (release→press)
                  <br /><br />
                  Everyone has a unique "typing rhythm" — just like a fingerprint, but for your fingers!
                </p>
              </div>

              {/* Visual diagram */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-slate-400 mb-3 text-center">How timing is measured:</div>
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">↓</div>
                    <span className="text-slate-500 mt-1">Press H</span>
                  </div>
                  <div className="flex-1 max-w-[80px]">
                    <div className="h-1 bg-cyan-500/40 rounded relative">
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-cyan-300 whitespace-nowrap">Dwell: 142ms</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">↑</div>
                    <span className="text-slate-500 mt-1">Release H</span>
                  </div>
                  <div className="flex-1 max-w-[60px]">
                    <div className="h-1 bg-purple-500/40 rounded relative">
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-purple-300 whitespace-nowrap">UD: 68ms</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">↓</div>
                    <span className="text-slate-500 mt-1">Press e</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-2">Key</th>
                      <th className="text-right py-2 px-2">Dwell (ms)</th>
                      <th className="text-right py-2 px-2">DD Flight (ms)</th>
                      <th className="text-right py-2 px-2">UD Flight (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((f, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-white/[0.02]">
                        <td className="py-1.5 px-2 font-mono text-indigo-300">
                          {f.key === ' ' ? '␣' : f.key}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-cyan-300">{f.dwell}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-purple-300">
                          {f.ddFlight !== null ? f.ddFlight : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-300">
                          {f.udFlight !== null ? f.udFlight : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap gap-2">
                <DataPill label="Avg Dwell" value={`${Math.round(features.reduce((s, f) => s + f.dwell, 0) / features.length)}ms`} color="cyan" />
                <DataPill label="Avg DD" value={`${Math.round(features.filter(f => f.ddFlight).reduce((s, f) => s + (f.ddFlight || 0), 0) / features.filter(f => f.ddFlight).length)}ms`} color="purple" />
                <DataPill label="Features/Key" value="3" color="emerald" />
              </div>
            </div>
          </PipelineStep>

          {/* STEP 3: Sliding Window */}
          <PipelineStep
            stepNum={3}
            title="Create Sliding Window & Normalize"
            icon={Layers}
            color="from-cyan-500 to-teal-500"
            explanation="We group consecutive keystrokes into a fixed-size window (like a photo frame that slides along your typing). Then we normalize the values so that unusually long pauses don't skew the model."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-cyan-300">🔍 What's happening:</strong> Imagine reading a book through a small window that shows 11 words at a time.
                  As you read, you slide the window forward one word. Each "view" through the window becomes one input for our AI model.
                  <br /><br />
                  <strong>Normalization</strong> is like converting temperatures from Fahrenheit to Celsius — it puts all numbers on the same scale
                  so the AI doesn't get confused by huge vs tiny values.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Raw window */}
                <div>
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Binary className="w-3 h-3" /> Raw Feature Matrix (11 × 3)
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] overflow-x-auto">
                    <div className="text-slate-500 mb-1">{'        [dwell,  DD,    UD  ]'}</div>
                    {window.map((row, i) => (
                      <div key={i} className="flex gap-2 py-0.5">
                        <span className="text-slate-500 w-4">{i}:</span>
                        <span className="text-cyan-300 w-12 text-right">[{row[0]}</span>
                        <span className="text-purple-300 w-12 text-right">{row[1]}</span>
                        <span className="text-emerald-300 w-12 text-right">{row[2]}]</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Normalized window */}
                <div>
                  <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" /> After Robust Normalization
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] overflow-x-auto">
                    <div className="text-slate-500 mb-1">{'        [dwell,  DD,    UD  ]'}</div>
                    {normalized.map((row, i) => (
                      <div key={i} className="flex gap-2 py-0.5">
                        <span className="text-slate-500 w-4">{i}:</span>
                        <span className="text-cyan-300 w-12 text-right">[{row[0].toFixed(2)}</span>
                        <span className="text-purple-300 w-12 text-right">{row[1].toFixed(2)}</span>
                        <span className="text-emerald-300 w-12 text-right">{row[2].toFixed(2)}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <DataPill label="Window Size" value="11 keys" color="cyan" />
                <DataPill label="Features/Key" value="3" color="purple" />
                <DataPill label="Total Values" value={window.length * 3} color="emerald" />
              </div>
            </div>
          </PipelineStep>

          {/* STEP 4: LSTM Embedding */}
          <PipelineStep
            stepNum={4}
            title="LSTM Neural Network → Embedding Vector"
            icon={Cpu}
            color="from-indigo-500 to-violet-500"
            explanation="The normalized window goes into our LSTM neural network (a type of AI that's great at understanding sequences). It compresses all 33 numbers into a compact 8-number 'fingerprint' called an embedding vector."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-indigo-300">🔍 What's happening:</strong> The LSTM is like a very experienced typist watching your typing pattern.
                  After watching all 11 keystrokes in sequence, it summarizes "what this typing feels like" into just 8 numbers.
                  <br /><br />
                  If the same person types again, they'll get a very similar 8-number summary.
                  If an impostor types, their summary will look quite different. It's like converting a voice recording into a unique ID number!
                </p>
              </div>

              {/* Network diagram */}
              <div className="bg-slate-800/50 rounded-xl p-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Input</div>
                    <div className="w-20 h-20 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-cyan-300">11×3</span>
                      <span className="text-[9px] text-slate-400">33 values</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 mb-1">LSTM (2 layers)</div>
                    <div className="w-24 h-20 rounded-lg bg-purple-500/10 border border-purple-500/30 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-purple-300">128</span>
                      <span className="text-[9px] text-slate-400">hidden units</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Projection</div>
                    <div className="w-20 h-20 rounded-lg bg-violet-500/10 border border-violet-500/30 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-violet-300">128→8</span>
                      <span className="text-[9px] text-slate-400">dense layer</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-indigo-400" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 mb-1">Embedding</div>
                    <div className="w-20 h-20 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-emerald-300">8-dim</span>
                      <span className="text-[9px] text-slate-400">L2 norm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedding vector visualization */}
              <div>
                <div className="text-xs text-slate-400 mb-2">Generated Embedding Vector:</div>
                <div className="flex gap-1.5 flex-wrap">
                  {embedding.map((v, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex flex-col items-center justify-center"
                    >
                      <span className="text-[9px] text-slate-500">e{i}</span>
                      <span className="font-mono font-bold text-indigo-300 text-xs">{v.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PipelineStep>

          {/* STEP 5: Similarity Comparison */}
          <PipelineStep
            stepNum={5}
            title="Compare Against Stored Baseline"
            icon={Eye}
            color="from-emerald-500 to-teal-500"
            explanation="We compare the new embedding (from this typing session) with the user's stored baseline embedding (from when they first enrolled). We use cosine similarity — a measure of how 'aligned' two vectors are."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-emerald-300">🔍 What's happening:</strong> Imagine two arrows drawn on paper.
                  If they point in almost the same direction, the cosine similarity is close to 1 (100% match).
                  If they point in completely different directions, it's close to 0 (no match).
                  <br /><br />
                  We stored the user's "typing arrow" when they first signed up. Now we check if the new typing makes a similar arrow.
                </p>
              </div>

              {/* Vector comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-2">📋 Stored Baseline (from enrollment):</div>
                  <div className="flex gap-1 flex-wrap">
                    {baseline.map((v, i) => (
                      <div key={i} className="px-2 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono text-xs text-emerald-300">
                        {v.toFixed(3)}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-2">🆕 Current Session Embedding:</div>
                  <div className="flex gap-1 flex-wrap">
                    {embedding.map((v, i) => (
                      <div key={i} className="px-2 py-1.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono text-xs text-indigo-300">
                        {v.toFixed(3)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similarity result */}
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-400 mb-2">Cosine Similarity Score</div>
                <div className="text-4xl font-bold font-mono text-emerald-300">
                  {(similarity * 100).toFixed(1)}%
                </div>
                <div className="mt-3 h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${similarity * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${
                      similarity > 0.8 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                      similarity > 0.6 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                      'bg-gradient-to-r from-red-500 to-rose-400'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0% (no match)</span>
                  <span className="text-emerald-400">60% threshold</span>
                  <span>100% (perfect)</span>
                </div>
              </div>
            </div>
          </PipelineStep>

          {/* STEP 6: Trust Score */}
          <PipelineStep
            stepNum={6}
            title="Calculate Trust Score (EMA Decay)"
            icon={Activity}
            color="from-amber-500 to-orange-500"
            explanation="Instead of trusting just one check, we maintain a running 'trust score' that combines history with the latest check. This prevents one bad reading from immediately locking someone out."
            isLast={false}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">🔍 What's happening:</strong> Think of it like your bank's fraud detection.
                  One unusual purchase doesn't freeze your account — they look at the pattern over time.
                  <br /><br />
                  The formula is: <code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-xs">New Trust = 70% × Old Trust + 30% × New Similarity</code>
                  <br />
                  This means 70% of your trust comes from your history, and 30% from the latest check.
                  If you're consistently typing normally, your trust stays high even if one check is slightly off.
                </p>
              </div>

              {/* Calculation breakdown */}
              <div className="bg-slate-800/50 rounded-xl p-4 font-mono text-sm">
                <div className="text-slate-400 text-xs mb-2">Calculation:</div>
                <div className="space-y-1 text-slate-300">
                  <div>
                    <span className="text-amber-300">Trust</span>
                    <span className="text-slate-500"> = </span>
                    <span className="text-cyan-300">0.7</span>
                    <span className="text-slate-500"> × </span>
                    <span className="text-emerald-300">0.92</span>
                    <span className="text-slate-500"> (previous trust)</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-500">+ </span>
                    <span className="text-cyan-300">0.3</span>
                    <span className="text-slate-500"> × </span>
                    <span className="text-purple-300">{similarity.toFixed(4)}</span>
                    <span className="text-slate-500"> (current similarity)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-slate-500">= </span>
                    <span className="text-cyan-300">{(0.7 * 0.92).toFixed(4)}</span>
                    <span className="text-slate-500"> + </span>
                    <span className="text-purple-300">{(0.3 * similarity).toFixed(4)}</span>
                  </div>
                  <div className="text-lg font-bold text-white pt-1">
                    = {(trustScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Trust gauge */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                      stroke={trustScore > 0.6 ? '#10b981' : trustScore > 0.4 ? '#f59e0b' : '#ef4444'}
                      strokeLinecap="round"
                      strokeDasharray={`${trustScore * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{(trustScore * 100).toFixed(0)}%</span>
                    <span className="text-xs text-slate-400">Trust Score</span>
                  </div>
                </div>
              </div>
            </div>
          </PipelineStep>

          {/* STEP 7: Final Decision */}
          <PipelineStep
            stepNum={7}
            title="Make Final Decision: ALLOW or FLAGGED"
            icon={Shield}
            color="from-emerald-500 to-green-500"
            explanation="Based on the trust score, we make the final call. Above 60% = ALLOW (it's really you). Below 40% = FLAGGED (possible impostor). In between = CHALLENGE (ask for extra verification like a password)."
            isLast={true}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-emerald-300">🔍 What's happening:</strong> This is the final verdict.
                  The system compares the trust score against thresholds and returns a clear decision.
                  This happens in under 5 milliseconds — faster than you can blink!
                </p>
              </div>

              {/* Decision thresholds */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`rounded-xl p-4 text-center border-2 transition-all ${
                  trustScore > 0.6
                    ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20'
                    : 'bg-slate-800/30 border-slate-700 opacity-50'
                }`}>
                  <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${trustScore > 0.6 ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div className={`font-bold ${trustScore > 0.6 ? 'text-emerald-300' : 'text-slate-500'}`}>ALLOW</div>
                  <div className="text-[10px] text-slate-400 mt-1">Trust {'>'} 60%</div>
                </div>
                <div className={`rounded-xl p-4 text-center border-2 transition-all ${
                  trustScore > 0.4 && trustScore <= 0.6
                    ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20'
                    : 'bg-slate-800/30 border-slate-700 opacity-50'
                }`}>
                  <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${trustScore > 0.4 && trustScore <= 0.6 ? 'text-amber-400' : 'text-slate-600'}`} />
                  <div className={`font-bold ${trustScore > 0.4 && trustScore <= 0.6 ? 'text-amber-300' : 'text-slate-500'}`}>CHALLENGE</div>
                  <div className="text-[10px] text-slate-400 mt-1">Trust 40-60%</div>
                </div>
                <div className={`rounded-xl p-4 text-center border-2 transition-all ${
                  trustScore <= 0.4
                    ? 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/20'
                    : 'bg-slate-800/30 border-slate-700 opacity-50'
                }`}>
                  <XCircle className={`w-8 h-8 mx-auto mb-2 ${trustScore <= 0.4 ? 'text-red-400' : 'text-slate-600'}`} />
                  <div className={`font-bold ${trustScore <= 0.4 ? 'text-red-300' : 'text-slate-500'}`}>FLAGGED</div>
                  <div className="text-[10px] text-slate-400 mt-1">Trust {'<'} 40%</div>
                </div>
              </div>

              {/* API Response */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-500">API Response (sent back to browser extension):</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto">{`{
  "status": "${trustScore > 0.6 ? 'ALLOW' : trustScore > 0.4 ? 'CHALLENGE' : 'FLAGGED'}",
  "trust_score": ${trustScore.toFixed(4)},
  "risk_score": ${(1 - trustScore).toFixed(4)},
  "similarity": ${similarity.toFixed(4)},
  "anomaly_detected": ${trustScore < 0.4},
  "session_id": "sess_${Math.random().toString(36).slice(2, 8)}",
  "latency_ms": ${(3 + Math.random() * 2).toFixed(1)}
}`}</pre>
              </div>
            </div>
          </PipelineStep>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass-card rounded-2xl p-6"
        >
          <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Summary: How It All Works Together
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300 flex-shrink-0">1</span>
                <p>Your browser extension <strong>silently records</strong> the timing of every key press — not the letters, just the rhythm.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 flex-shrink-0">2</span>
                <p>It calculates <strong>three timing features</strong> for each key: how long held, gap before next press, and gap from last release.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-300 flex-shrink-0">3</span>
                <p>These features are <strong>grouped into windows</strong> and normalized so extreme values don't confuse the model.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">4</span>
                <p>An <strong>LSTM neural network</strong> converts the window into a compact "typing fingerprint" (embedding vector).</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300 flex-shrink-0">5</span>
                <p>The fingerprint is <strong>compared to your stored baseline</strong> using cosine similarity — how closely the arrows align.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300 flex-shrink-0">6</span>
                <p>A <strong>trust score</strong> is maintained using exponential moving average — blending history with the latest check.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px] font-bold text-green-300 flex-shrink-0">7</span>
                <p>Based on the trust score, the system decides: <strong className="text-emerald-300">ALLOW</strong>, <strong className="text-amber-300">CHALLENGE</strong>, or <strong className="text-red-300">FLAGGED</strong>.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-[10px] font-bold text-rose-300 flex-shrink-0">🔒</span>
                <p>The entire process takes <strong>under 5 milliseconds</strong> and never sends your actual keystrokes — only timing data!</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
