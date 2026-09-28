import { motion } from 'framer-motion';
import { useState } from 'react';

const pythonCode = `import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler

class KeystrokeFeatureExtractor:
    """Extract timing features from raw keystroke events."""
    
    def __init__(self, pause_threshold_ms=2000, window_size=40):
        self.pause_threshold = pause_threshold_ms
        self.window_size = window_size
        self.scaler = RobustScaler()
    
    def extract_dwell_time(self, events: pd.DataFrame) -> pd.Series:
        """Dwell time = keyup_timestamp - keydown_timestamp"""
        merged = events.merge(
            events[events['event_type'] == 'keyup'][['key_code', 'timestamp']],
            on='key_code', suffixes=('_down', '_up')
        )
        return merged['timestamp_up'] - merged['timestamp_down']
    
    def extract_flight_times(self, events: pd.DataFrame) -> dict:
        """Calculate DD (press-to-press) and UD (release-to-press) latencies."""
        keydowns = events[events['event_type'] == 'keydown'].sort_values('timestamp')
        keyups = events[events['event_type'] == 'keyup'].sort_values('timestamp')
        
        dd_times = np.diff(keydowns['timestamp'].values)  # press-to-press
        ud_times = (keydowns['timestamp'].values[1:] - 
                    keyups['timestamp'].values[:-1])        # release-to-press
        
        return {'DD': dd_times, 'UD': ud_times}
    
    def filter_pauses(self, features: np.ndarray) -> np.ndarray:
        """Flag sequences with pauses > threshold as hesitation points."""
        mask = features < self.pause_threshold
        return features[mask]
    
    def create_windows(self, sequences: np.ndarray) -> np.ndarray:
        """Create sliding windows of fixed-size for LSTM input."""
        windows = []
        for i in range(0, len(sequences) - self.window_size + 1):
            windows.append(sequences[i:i + self.window_size])
        return np.array(windows)
    
    def normalize(self, features: np.ndarray) -> np.ndarray:
        """Robust scaling to minimize outlier impact."""
        return self.scaler.fit_transform(features)
    
    def process_pipeline(self, raw_events: pd.DataFrame) -> np.ndarray:
        """Full preprocessing pipeline."""
        dwell = self.extract_dwell_time(raw_events)
        flights = self.extract_flight_times(raw_events)
        
        # Combine features: [dwell, DD, UD]
        combined = np.column_stack([
            dwell.values[:-1],
            flights['DD'],
            flights['UD']
        ])
        
        # Filter hesitation pauses
        filtered = self.filter_pauses(combined)
        
        # Normalize
        normalized = self.normalize(filtered)
        
        # Create sliding windows
        windows = self.create_windows(normalized)
        
        return windows  # Shape: (n_windows, window_size, n_features)`;

const testCode = `import unittest

class TestKeystrokeExtractor(unittest.TestCase):
    def setUp(self):
        self.extractor = KeystrokeFeatureExtractor(
            pause_threshold_ms=2000, window_size=40
        )
    
    def test_dwell_time_calculation(self):
        events = pd.DataFrame({
            'user_id': [1, 1],
            'key_code': ['A', 'A'],
            'event_type': ['keydown', 'keyup'],
            'timestamp': [1000, 1150]
        })
        dwell = self.extractor.extract_dwell_time(events)
        self.assertEqual(dwell.iloc[0], 150)  # 150ms hold
    
    def test_pause_filtering(self):
        features = np.array([100, 50, 3000, 200, 5000, 80])
        filtered = self.extractor.filter_pauses(features)
        self.assertEqual(len(filtered), 3)  # Only 100, 50, 80 remain
    
    def test_window_creation(self):
        data = np.random.randn(100, 3)
        windows = self.extractor.create_windows(data)
        self.assertEqual(windows.shape[1], 40)  # window_size
        self.assertEqual(windows.shape[2], 3)   # n_features`;

export default function FeatureExtraction() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'tests'>('pipeline');

  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Step 1: Feature Extraction</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Raw timing extraction pipeline — computing dwell times, flight times, and creating 
            sliding windows suitable for LSTM/RNN time-series input
          </p>
        </motion.div>

        {/* Feature visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            {
              title: 'Dwell Time (Hold)',
              formula: 't_release − t_press',
              desc: 'Duration a key is held down',
              example: 'Key A: 145ms',
              color: 'border-blue-500/30 bg-blue-500/5'
            },
            {
              title: 'DD Flight Time',
              formula: 't_press(n) − t_press(n-1)',
              desc: 'Press-to-press latency between consecutive keys',
              example: 'A→B: 210ms',
              color: 'border-purple-500/30 bg-purple-500/5'
            },
            {
              title: 'UD Flight Time',
              formula: 't_press(n) − t_release(n-1)',
              desc: 'Release-to-press latency (digraph)',
              example: 'A↑→B↓: 65ms',
              color: 'border-cyan-500/30 bg-cyan-500/5'
            }
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl p-5 border ${feature.color}`}
            >
              <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
              <code className="text-xs text-indigo-300 block mb-2">{feature.formula}</code>
              <p className="text-xs text-slate-400 mb-2">{feature.desc}</p>
              <div className="text-xs text-slate-500 bg-slate-800/50 rounded px-2 py-1">
                Example: {feature.example}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Code Block */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'pipeline'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline Code
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === 'tests'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Unit Tests
            </button>
          </div>

          <div className="code-block p-6 overflow-x-auto">
            <pre className="text-sm leading-relaxed">
              <code className="text-slate-300">
                {activeTab === 'pipeline' ? pythonCode : testCode}
              </code>
            </pre>
          </div>
        </motion.div>

        {/* Window visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 glass-card rounded-xl p-6"
        >
          <h4 className="font-semibold text-white mb-4">Sliding Window Construction (30-50 keystrokes)</h4>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-[10px] font-mono ${
                  i >= 10 && i < 50
                    ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-500'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500/50" />
              Active window (40 keystrokes)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
              Outside window
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
