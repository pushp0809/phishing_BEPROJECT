import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2, Activity, Timer, Target, Zap, Lock, Eye } from 'lucide-react';

interface MousePoint {
  x: number;
  y: number;
  t: number;
}

interface MouseEvent {
  type: 'move' | 'click' | 'idle';
  x: number;
  y: number;
  t: number;
  button?: 'left' | 'right';
}

interface MouseFeature {
  velocity: number | null;
  acceleration: number | null;
  angle: number | null;
  clickDwell: number | null;
  clickInterval: number | null;
  idleTime: number | null;
}

export default function MouseDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [points, setPoints] = useState<MousePoint[]>([]);
  const [events, setEvents] = useState<MouseEvent[]>([]);
  const [features, setFeatures] = useState<MouseFeature[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [avgVelocity, setAvgVelocity] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  const areaRef = useRef<HTMLDivElement>(null);
  const lastPoint = useRef<MousePoint | null>(null);
  const lastVelocity = useRef<number>(0);
  const lastClickTime = useRef<number>(0);
  const lastMoveTime = useRef<number>(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number>(0);

  const reset = () => {
    setIsRecording(false);
    setPoints([]);
    setEvents([]);
    setFeatures([]);
    setClickCount(0);
    setTotalDistance(0);
    setAvgVelocity(0);
    setIdleTime(0);
    lastPoint.current = null;
    lastVelocity.current = 0;
    lastClickTime.current = 0;
    lastMoveTime.current = 0;
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const startRecording = () => {
    reset();
    setIsRecording(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRecording || !areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    // Throttle: record every 3 frames worth (~50ms)
    frameRef.current++;
    if (frameRef.current % 3 !== 0) return;

    const point: MousePoint = { x, y, t: now };
    setPoints(prev => [...prev.slice(-200), point]);

    // Calculate velocity
    let velocity: number | null = null;
    let acceleration: number | null = null;
    let angle: number | null = null;

    if (lastPoint.current) {
      const dx = x - lastPoint.current.x;
      const dy = y - lastPoint.current.y;
      const dt = now - lastPoint.current.t;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dt > 0) {
        velocity = dist / dt; // px/ms
        setTotalDistance(prev => prev + dist);

        if (lastVelocity.current > 0 && dt > 0) {
          acceleration = (velocity - lastVelocity.current) / dt;
        }
        lastVelocity.current = velocity;

        angle = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      setEvents(prev => [...prev.slice(-100), {
        type: 'move', x, y, t: now
      }]);

      setFeatures(prev => [...prev.slice(-50), {
        velocity,
        acceleration,
        angle,
        clickDwell: null,
        clickInterval: null,
        idleTime: null,
      }]);
    }

    lastPoint.current = point;
    lastMoveTime.current = now;

    // Reset idle timer
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIdleTime(prev => prev + 100);
      setEvents(prev => [...prev, { type: 'idle', x, y, t: performance.now() }]);
    }, 100);

    // Update average velocity
    const allVelocities = features.filter(f => f.velocity !== null).map(f => f.velocity!);
    if (velocity !== null) {
      allVelocities.push(velocity);
      setAvgVelocity(allVelocities.reduce((s, v) => s + v, 0) / allVelocities.length);
    }
  }, [isRecording, features]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRecording || !areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    setClickCount(c => c + 1);

    const clickInterval = lastClickTime.current > 0 ? now - lastClickTime.current : null;
    lastClickTime.current = now;

    setEvents(prev => [...prev, {
      type: 'click', x, y, t: now, button: 'left'
    }]);

    setFeatures(prev => [...prev, {
      velocity: null,
      acceleration: null,
      angle: null,
      clickDwell: 80 + Math.random() * 40, // Simulated click duration
      clickInterval,
      idleTime: null,
    }]);
  }, [isRecording]);

  // Compute summary stats
  const velocities = features.filter(f => f.velocity !== null).map(f => f.velocity!);
  const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;
  const minVelocity = velocities.length > 0 ? Math.min(...velocities) : 0;
  const accelerations = features.filter(f => f.acceleration !== null).map(f => f.acceleration!);
  const avgAcceleration = accelerations.length > 0
    ? accelerations.reduce((s, a) => s + Math.abs(a), 0) / accelerations.length
    : 0;

  return (
    <section id="mouse" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Mouse Dynamics Capture
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Track mouse movement patterns — velocity, acceleration, click rhythm, and idle periods.
            Everyone has a unique way of moving their mouse, just like their typing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mouse Tracking Area */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-gray-400" />
                Move Your Mouse Here
              </h3>
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Tracking
                  </span>
                )}
                <span className="badge">{points.length} samples</span>
              </div>
            </div>

            {/* Tracking area */}
            <div
              ref={areaRef}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              className={`relative w-full h-56 rounded-lg border overflow-hidden cursor-crosshair transition-colors ${
                isRecording
                  ? 'border-gray-300 bg-gradient-to-br from-gray-50 to-white'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Trail visualization */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                {points.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.5"
                    opacity="0.3"
                    points={points.map(p => `${p.x},${p.y}`).join(' ')}
                  />
                )}
                {/* Click markers */}
                {events.filter(e => e.type === 'click').map((e, i) => (
                  <circle
                    key={i}
                    cx={e.x}
                    cy={e.y}
                    r="4"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>

              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                  Click "Start Tracking" to begin
                </div>
              )}

              {isRecording && points.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                  Move your mouse around...
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={startRecording}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isRecording
                    ? 'bg-gray-100 text-gray-500 border border-gray-200'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isRecording ? '● Tracking...' : 'Start Tracking'}
              </button>
              <button
                onClick={reset}
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Reset
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Total Distance', value: `${(totalDistance / 100).toFixed(1)}cm` },
                { label: 'Avg Velocity', value: `${(avgVelocity * 1000).toFixed(0)} px/s` },
                { label: 'Max Velocity', value: `${(maxVelocity * 1000).toFixed(0)} px/s` },
                { label: 'Clicks', value: clickCount },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">{m.label}</div>
                  <div className="text-base font-semibold text-gray-900 font-mono">{m.value}</div>
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Only movement patterns captured — not screen coordinates or content</span>
            </div>
          </div>

          {/* Feature Analysis */}
          <div className="card p-5">
            <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-gray-400" />
              Extracted Mouse Features
            </h3>

            {/* Feature explanation */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong className="text-gray-900">What we measure:</strong> How fast you move (velocity),
                how quickly you speed up/slow down (acceleration), the angles of your movements,
                how long you pause between clicks, and how long your idle periods are.
                These patterns are as unique as your fingerprint.
              </p>
            </div>

            {/* Feature table */}
            <div className="overflow-auto max-h-[240px] rounded-lg border border-gray-100 mb-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th className="text-right">Velocity</th>
                    <th className="text-right">Accel</th>
                    <th className="text-right">Angle</th>
                  </tr>
                </thead>
                <tbody>
                  {features.slice(-12).map((f, i) => (
                    <tr key={i}>
                      <td>
                        <span className="badge text-[10px]">
                          {f.velocity !== null ? 'move' : f.clickDwell !== null ? 'click' : 'idle'}
                        </span>
                      </td>
                      <td className="text-right font-mono text-xs text-gray-600">
                        {f.velocity !== null ? `${(f.velocity * 1000).toFixed(0)}` : '—'}
                      </td>
                      <td className="text-right font-mono text-xs text-gray-500">
                        {f.acceleration !== null ? `${(f.acceleration * 10000).toFixed(1)}` : '—'}
                      </td>
                      <td className="text-right font-mono text-xs text-gray-500">
                        {f.angle !== null ? `${f.angle.toFixed(0)}°` : '—'}
                      </td>
                    </tr>
                  ))}
                  {features.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 text-xs">
                        Move your mouse to see features...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Velocity distribution */}
            {velocities.length > 0 && (
              <div>
                <h4 className="text-[11px] text-gray-500 mb-2 font-medium">Velocity Distribution</h4>
                <div className="flex items-end gap-0.5 h-12">
                  {velocities.slice(-40).map((v, i) => {
                    const height = (v / (maxVelocity || 1)) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-gray-900 min-w-[2px] opacity-60 hover:opacity-100 transition-opacity"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${(v * 1000).toFixed(0)} px/s`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-mono">
                  <span>min: {(minVelocity * 1000).toFixed(0)} px/s</span>
                  <span>max: {(maxVelocity * 1000).toFixed(0)} px/s</span>
                </div>
              </div>
            )}

            {/* Summary stats */}
            {features.length > 5 && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <div className="text-gray-400">Avg Acceleration</div>
                  <div className="font-mono font-semibold text-gray-900">
                    {(avgAcceleration * 10000).toFixed(2)}
                  </div>
                </div>
                <div className="text-xs">
                  <div className="text-gray-400">Movement Smoothness</div>
                  <div className="font-mono font-semibold text-gray-900">
                    {(100 - Math.min(100, avgAcceleration * 1000)).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multi-modal integration note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-6 card p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">
                Multi-Modal Authentication
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Mouse dynamics complement keystroke patterns. Some users type quickly but move the mouse
                erratically; others have slow, deliberate movements for both. By combining both modalities,
                the system achieves higher accuracy — an impostor would need to mimic both your typing rhythm
                <em>and</em> your mouse behavior simultaneously. The embeddings from both channels are
                concatenated before the final similarity comparison.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
