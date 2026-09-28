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
        
        combined = np.column_stack([
            dwell.values[:-1],
            flights['DD'],
            flights['UD']
        ])
        
        filtered = self.filter_pauses(combined)
        normalized = self.normalize(filtered)
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
    <section id="features" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Feature Extraction Pipeline
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Raw timing extraction — computing dwell times, flight times, and creating 
            sliding windows suitable for LSTM input.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {[
            {
              title: 'Dwell Time',
              formula: 't_release − t_press',
              desc: 'How long a key is held down',
              example: 'Key A: 145ms'
            },
            {
              title: 'DD Flight',
              formula: 't_press(n) − t_press(n-1)',
              desc: 'Time between consecutive key presses',
              example: 'A→B: 210ms'
            },
            {
              title: 'UD Flight',
              formula: 't_press(n) − t_release(n-1)',
              desc: 'Release-to-next-press latency',
              example: 'A↑→B↓: 65ms'
            }
          ].map((feature) => (
            <div key={feature.title} className="card p-4">
              <h4 className="font-medium text-gray-900 text-sm mb-1">{feature.title}</h4>
              <code className="text-xs text-gray-500 block mb-2 font-mono">{feature.formula}</code>
              <p className="text-xs text-gray-500 mb-2">{feature.desc}</p>
              <div className="text-xs text-gray-400 bg-gray-50 rounded px-2 py-1 border border-gray-100">
                {feature.example}
              </div>
            </div>
          ))}
        </div>

        {/* Code Block */}
        <div>
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Pipeline Code
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'tests'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Unit Tests
            </button>
          </div>

          <div className="code-block p-5 overflow-x-auto">
            <pre className="text-xs leading-relaxed">
              <code className="text-gray-700">
                {activeTab === 'pipeline' ? pythonCode : testCode}
              </code>
            </pre>
          </div>
        </div>

        {/* Window visualization */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 card p-5"
        >
          <h4 className="font-medium text-gray-900 text-sm mb-3">Sliding Window (30–50 keystrokes)</h4>
          <div className="flex gap-0.5 overflow-x-auto pb-2">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono ${
                  i >= 10 && i < 50
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 border border-gray-200 text-gray-400'
                }`}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-900" />
              Active window (40 keys)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200" />
              Outside
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
