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
    metadata: Optional[dict] = None

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
    
    def get_trust_score(self, session_id: str) -> float:
        return self.sessions.get(session_id, {}).get('trust_score', 1.0)
    
    def update_trust(self, session_id: str, similarity: float) -> float:
        if session_id not in self.sessions:
            self.sessions[session_id] = {'trust_score': 1.0, 'history': []}
        
        prev_trust = self.sessions[session_id]['trust_score']
        new_trust = (self.lambda_decay * prev_trust + 
                     (1 - self.lambda_decay) * similarity)
        
        self.sessions[session_id]['trust_score'] = new_trust
        self.sessions[session_id]['history'].append({
            'similarity': similarity,
            'trust': new_trust,
            'time': time.time()
        })
        return new_trust

cache = SessionCache()

# === Model Loading ===

class InferenceEngine:
    def __init__(self, model_path="model_typenet.onnx"):
        # Use ONNX for low-latency inference
        try:
            import onnxruntime as ort
            self.session = ort.InferenceSession(model_path)
            self.use_onnx = True
        except:
            self.model = torch.load("model_typenet.pt")
            self.model.eval()
            self.use_onnx = False
    
    def predict_embedding(self, intervals: List[float]) -> np.ndarray:
        """Convert intervals to embedding vector."""
        # Pad/truncate to window size
        window = np.zeros((1, 40, 3))  # (batch, seq, features)
        n = min(len(intervals), 40)
        window[0, :n, 0] = intervals[:n]  # Feature channel
        
        if self.use_onnx:
            result = self.session.run(None, {"input": window.astype(np.float32)})
            return result[0][0]
        else:
            with torch.no_grad():
                tensor = torch.FloatTensor(window)
                embedding = self.model(tensor)
                return embedding.numpy()[0]
    
    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Cosine similarity between embeddings."""
        return float(np.dot(emb1, emb2) / 
                    (np.linalg.norm(emb1) * np.linalg.norm(emb2)))

engine = InferenceEngine()

# === Main Endpoint ===

@app.post("/api/v1/auth/evaluate", response_model=AuthResponse)
async def evaluate_authentication(payload: KeystrokePayload):
    """Real-time continuous authentication endpoint."""
    
    try:
        # 1. Generate embedding from incoming keystroke data
        incoming_embedding = engine.predict_embedding(payload.intervals)
        
        # 2. Load user's baseline profile embedding
        baseline = load_user_baseline(payload.user_id)  # From DB/Redis
        
        # 3. Compute similarity
        similarity = engine.compute_similarity(incoming_embedding, baseline)
        
        # 4. Update trust score with EMA decay
        trust_score = cache.update_trust(payload.session_id, similarity)
        
        # 5. Determine status based on thresholds
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
        raise HTTPException(status_code=500, detail=str(e))

# === Health Check ===

@app.get("/api/v1/health")
async def health():
    return {"status": "healthy", "model_loaded": True, "cache_size": len(cache.sessions)}`;

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
    // Attach to all relevant input fields
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="password"], textarea'
    );
    inputs.forEach(input => this.attachListeners(input));
    
    // Watch for dynamically added inputs
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.querySelectorAll) {
            node.querySelectorAll('input, textarea').forEach(el => 
              this.attachListeners(el)
            );
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
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
    if (['Backspace', 'Delete', 'Enter', 'Tab', 'Escape'].includes(key)) return 'functional';
    return 'navigation';
  }

  onPaste() {
    this.buffer.push({
      type: 'paste_event',
      timestamp: performance.now()
    });
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
      intervals: this.buffer.map(e => e.dd_interval || e.dwell_time || 0).filter(v => v > 0 && v < 2000),
      dwell_times: this.buffer.filter(e => e.dwell_time).map(e => e.dwell_time),
      metadata: {
        event_count: this.buffer.length,
        paste_events: this.buffer.filter(e => e.type === 'paste_event').length,
        blur_events: this.blurCount || 0
      }
    };

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      // Handle response
      if (result.status === 'FLAGGED') {
        // Notify background script for potential session lock
        chrome.runtime.sendMessage({ action: 'session_flagged', data: result });
      }
    } catch (err) {
      console.warn('Telemetry transmit failed:', err);
    }
    
    // Clear buffer
    this.buffer = [];
  }
}

// Initialize
const telemetry = new KeystrokeTelemetry();
telemetry.init();`;

export default function ApiDemo() {
  const [activeTab, setActiveTab] = useState<'api' | 'extension'>('api');

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Step 4: Real-Time Scoring Service</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            FastAPI inference engine with ONNX runtime for sub-5ms verification latency, 
            plus the privacy-first Chrome Extension client
          </p>
        </motion.div>

        {/* Endpoint diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="text-xs text-blue-300 font-medium">POST /api/v1/auth/evaluate</div>
              <div className="text-[10px] text-slate-400 mt-1">Accepts timing intervals</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="text-xs text-purple-300 font-medium">ONNX Inference</div>
              <div className="text-[10px] text-slate-400 mt-1">~4ms embedding gen</div>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
              <div className="text-xs text-cyan-300 font-medium">Cosine Similarity</div>
              <div className="text-[10px] text-slate-400 mt-1">vs baseline profile</div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <div className="text-xs text-emerald-300 font-medium">EMA Trust Update</div>
              <div className="text-[10px] text-slate-400 mt-1">Decaying confidence</div>
            </div>
          </div>
        </motion.div>

        {/* Code tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'api'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            FastAPI Backend
          </button>
          <button
            onClick={() => setActiveTab('extension')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'extension'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chrome Extension
          </button>
        </div>

        <div className="code-block p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="text-sm leading-relaxed">
            <code className="text-slate-300">
              {activeTab === 'api' ? fastapiCode : chromeExtensionCode}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
