import { motion } from 'framer-motion';
import { useState } from 'react';

const fastapiCode = `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import torch
import numpy as np
import time

app = FastAPI(title="BioAuth Continuous Authentication API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic Schemas ===

class KeystrokePayload(BaseModel):
    session_id: str
    user_id: str
    intervals: List[float]  # Relative timing intervals
    dwell_times: Optional[List[float]] = None

class AuthResponse(BaseModel):
    status: str  # "ALLOW" | "FLAGGED" | "CHALLENGE"
    current_risk_score: float
    trust_score: float
    anomaly_detected: bool
    session_id: str
    timestamp: str

# === In-Memory Session Cache (Redis in production) ===

class SessionCache:
    def __init__(self):
        self.sessions = {}
        self.lambda_decay = 0.7
    
    def update_trust(self, session_id: str, similarity: float) -> float:
        if session_id not in self.sessions:
            self.sessions[session_id] = {'trust_score': 1.0}
        
        prev_trust = self.sessions[session_id]['trust_score']
        new_trust = (self.lambda_decay * prev_trust + 
                     (1 - self.lambda_decay) * similarity)
        
        self.sessions[session_id]['trust_score'] = new_trust
        return new_trust

cache = SessionCache()

# === Model Loading ===

class InferenceEngine:
    def __init__(self, model_path="model_typenet.onnx"):
        import onnxruntime as ort
        self.session = ort.InferenceSession(model_path)
    
    def predict_embedding(self, intervals: List[float]) -> np.ndarray:
        window = np.zeros((1, 40, 3))
        n = min(len(intervals), 40)
        window[0, :n, 0] = intervals[:n]
        result = self.session.run(None, {"input": window.astype(np.float32)})
        return result[0][0]
    
    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        return float(np.dot(emb1, emb2) / 
                    (np.linalg.norm(emb1) * np.linalg.norm(emb2)))

engine = InferenceEngine()

# === Main Endpoint ===

@app.post("/api/v1/auth/evaluate", response_model=AuthResponse)
async def evaluate_authentication(payload: KeystrokePayload):
    try:
        incoming_embedding = engine.predict_embedding(payload.intervals)
        baseline = load_user_baseline(payload.user_id)
        similarity = engine.compute_similarity(incoming_embedding, baseline)
        trust_score = cache.update_trust(payload.session_id, similarity)
        
        if trust_score > 0.6:
            status = "ALLOW"
        elif trust_score > 0.4:
            status = "CHALLENGE"
        else:
            status = "FLAGGED"
        
        return AuthResponse(
            status=status,
            current_risk_score=1.0 - trust_score,
            trust_score=trust_score,
            anomaly_detected=trust_score < 0.4,
            session_id=payload.session_id,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))`;

const chromeExtensionCode = `// content-script.js - Manifest V3 Keystroke Logger

class KeystrokeTelemetry {
  constructor() {
    this.buffer = [];
    this.BUFFER_SIZE = 30;
    this.API_ENDPOINT = 'http://localhost:8000/api/v1/auth/evaluate';
    this.sessionId = crypto.randomUUID();
    this.lastKeyDown = 0;
    this.lastKeyUp = 0;
    this.keyDownMap = new Map();
  }

  init() {
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="password"], textarea'
    );
    inputs.forEach(input => this.attachListeners(input));
  }

  attachListeners(element) {
    element.addEventListener('keydown', e => this.onKeyDown(e));
    element.addEventListener('keyup', e => this.onKeyUp(e));
    element.addEventListener('paste', () => this.onPaste());
  }

  onKeyDown(event) {
    const now = performance.now();
    this.keyDownMap.set(event.key, now);
    
    // Privacy: DO NOT store the actual character
    const keyClass = this.classifyKey(event.key);
    
    this.buffer.push({
      type: 'keydown',
      key_class: keyClass,  // 'alphanumeric' | 'functional' | 'navigation'
      timestamp: now,
      dd_interval: this.lastKeyDown > 0 ? now - this.lastKeyDown : null
    });
    this.lastKeyDown = now;
    this.checkBuffer();
  }

  onKeyUp(event) {
    const now = performance.now();
    const downTime = this.keyDownMap.get(event.key);
    const dwell = downTime ? now - downTime : null;
    this.keyDownMap.delete(event.key);
    
    this.buffer.push({
      type: 'keyup',
      key_class: this.classifyKey(event.key),
      timestamp: now,
      dwell_time: dwell,
      ud_interval: this.lastKeyUp > 0 ? now - this.lastKeyUp : null
    });
    this.lastKeyUp = now;
    this.checkBuffer();
  }

  classifyKey(key) {
    if (/^[a-zA-Z0-9]$/.test(key)) return 'alphanumeric';
    if (['Backspace', 'Delete', 'Enter', 'Tab'].includes(key)) return 'functional';
    return 'navigation';
  }

  async checkBuffer() {
    if (this.buffer.length >= this.BUFFER_SIZE) {
      await this.transmit();
    }
  }

  async transmit() {
    const payload = {
      session_id: this.sessionId,
      user_id: await this.getUserId(),
      intervals: this.buffer
        .map(e => e.dd_interval || e.dwell_time || 0)
        .filter(v => v > 0 && v < 2000),
      dwell_times: this.buffer
        .filter(e => e.dwell_time)
        .map(e => e.dwell_time),
    };

    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (result.status === 'FLAGGED') {
      chrome.runtime.sendMessage({ action: 'session_flagged',  result });
    }
    
    this.buffer = [];
  }
}

const telemetry = new KeystrokeTelemetry();
telemetry.init();`;

export default function ApiDemo() {
  const [activeTab, setActiveTab] = useState<'api' | 'extension'>('api');

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Real-Time Scoring Service
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            FastAPI inference engine with ONNX runtime for sub-5ms verification latency, 
            plus the privacy-first Chrome Extension client.
          </p>
        </div>

        {/* Endpoint flow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card p-5 mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: 'POST /evaluate', sub: 'Accepts intervals' },
              { label: 'ONNX Inference', sub: '~4ms' },
              { label: 'Cosine Similarity', sub: 'vs baseline' },
              { label: 'EMA Trust', sub: 'Decaying score' },
            ].map(step => (
              <div key={step.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs font-medium text-gray-900">{step.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{step.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Code tabs */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'api'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            FastAPI Backend
          </button>
          <button
            onClick={() => setActiveTab('extension')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'extension'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Chrome Extension
          </button>
        </div>

        <div className="code-block p-5 overflow-x-auto max-h-[500px] overflow-y-auto">
          <pre className="text-xs leading-relaxed">
            <code className="text-gray-700">
              {activeTab === 'api' ? fastapiCode : chromeExtensionCode}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
