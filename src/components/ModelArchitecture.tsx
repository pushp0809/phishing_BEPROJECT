import { motion } from 'framer-motion';
import { useState } from 'react';

const modelCode = `import torch
import torch.nn as nn
import torch.nn.functional as F

class TypeNetEmbedder(nn.Module):
    """Siamese LSTM network for keystroke embedding generation."""
    
    def __init__(self, input_dim=3, hidden_dim=128, embed_dim=64, 
                 num_layers=2, dropout=0.3):
        super().__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=False
        )
        
        self.projection = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, embed_dim)
        )
    
    def forward(self, x):
        """
        x: (batch, seq_len, input_dim)
        returns: (batch, embed_dim) normalized embedding
        """
        lstm_out, (h_n, _) = self.lstm(x)
        # Use last hidden state
        last_hidden = h_n[-1]  # (batch, hidden_dim)
        embedding = self.projection(last_hidden)
        # L2 normalize for cosine similarity
        return F.normalize(embedding, p=2, dim=1)


class TripletKeystrokeLoss(nn.Module):
    """Triplet margin loss for keystroke verification."""
    
    def __init__(self, margin=0.2):
        super().__init__()
        self.margin = margin
        self.loss_fn = nn.TripletMarginLoss(
            margin=margin, p=2, reduction='mean'
        )
    
    def forward(self, anchor, positive, negative):
        return self.loss_fn(anchor, positive, negative)


class KeystrokeVerifier:
    """Training and evaluation wrapper."""
    
    def __init__(self, device='cuda'):
        self.device = device
        self.model = TypeNetEmbedder().to(device)
        self.criterion = TripletKeystrokeLoss(margin=0.2)
        self.optimizer = torch.optim.Adam(
            self.model.parameters(), lr=1e-3, weight_decay=1e-5
        )
        self.scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer, T_max=100
        )
    
    def train_step(self, anchor, positive, negative):
        self.model.train()
        anchor_emb = self.model(anchor)
        positive_emb = self.model(positive)
        negative_emb = self.model(negative)
        
        loss = self.criterion(anchor_emb, positive_emb, negative_emb)
        
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
        self.optimizer.step()
        
        return loss.item()
    
    def compute_eer(self, genuine_scores, impostor_scores):
        """Compute Equal Error Rate via threshold sweep."""
        from scipy.optimize import brentq
        from scipy.interpolate import interp1d
        
        all_scores = np.concatenate([genuine_scores, impostor_scores])
        thresholds = np.linspace(all_scores.min(), all_scores.max(), 1000)
        
        far_list, frr_list = [], []
        for t in thresholds:
            far = np.mean(genuine_scores < t)   # False Accept
            frr = np.mean(impostor_scores >= t)  # False Reject
            far_list.append(far)
            frr_list.append(frr)
        
        # EER: where FAR = FRR
        fn = interp1d(far_list, frr_list)
        eer = brentq(lambda x: x - fn(x), 0, 1)
        return eer`;

const configCode = `# Training Configuration
HYPERPARAMS = {
    'learning_rate': 1e-3,
    'batch_size': 64,
    'embed_dim': 64,
    'hidden_dim': 128,
    'num_lstm_layers': 2,
    'dropout': 0.3,
    'triplet_margin': 0.2,
    'window_size': 40,
    'weight_decay': 1e-5,
    'max_epochs': 100,
    'patience': 15,  # early stopping
}

# Evaluation Thresholds
EVAL_CONFIG = {
    'eer_threshold': None,  # computed dynamically
    'far_target': 0.01,     # 1% FAR operating point
    'num_test_sessions': 50,
    'impostor_ratio': 5,    # 5 impostors per genuine
}`;

export default function ModelArchitecture() {
  const [activeTab, setActiveTab] = useState<'model' | 'config'>('model');

  return (
    <section id="model" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Step 2: Model Architecture</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Siamese LSTM network with Triplet Margin Loss — generating 64-dimensional 
            embedding vectors optimized for user discrimination
          </p>
        </motion.div>

        {/* Model Diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-12"
        >
          <h3 className="text-center font-semibold text-white mb-8">TypeNet Architecture</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            {/* Input */}
            <div className="text-center">
              <div className="w-32 h-20 rounded-lg bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center">
                <span className="text-xs text-blue-300 font-medium">Input</span>
                <span className="text-[10px] text-slate-400">(batch, 40, 3)</span>
                <span className="text-[10px] text-slate-500">[dwell, DD, UD]</span>
              </div>
            </div>
            
            <span className="text-indigo-400 text-xl">→</span>
            
            {/* LSTM */}
            <div className="text-center">
              <div className="w-36 h-20 rounded-lg bg-purple-500/10 border border-purple-500/30 flex flex-col items-center justify-center">
                <span className="text-xs text-purple-300 font-medium">2-Layer LSTM</span>
                <span className="text-[10px] text-slate-400">hidden=128</span>
                <span className="text-[10px] text-slate-500">dropout=0.3</span>
              </div>
            </div>
            
            <span className="text-indigo-400 text-xl">→</span>
            
            {/* Projection */}
            <div className="text-center">
              <div className="w-32 h-20 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex flex-col items-center justify-center">
                <span className="text-xs text-cyan-300 font-medium">Projection</span>
                <span className="text-[10px] text-slate-400">128→64→64</span>
                <span className="text-[10px] text-slate-500">ReLU + Dropout</span>
              </div>
            </div>
            
            <span className="text-indigo-400 text-xl">→</span>
            
            {/* Embedding */}
            <div className="text-center">
              <div className="w-32 h-20 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
                <span className="text-xs text-emerald-300 font-medium">Embedding</span>
                <span className="text-[10px] text-slate-400">64-dim vector</span>
                <span className="text-[10px] text-slate-500">L2 normalized</span>
              </div>
            </div>
          </div>

          {/* Triplet Loss visualization */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-center text-sm font-medium text-slate-300 mb-4">Triplet Loss Optimization</h4>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs text-indigo-300">A</span>
                </div>
                <span className="text-[10px] text-slate-400">Anchor</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-[10px] text-emerald-400 mb-1">d(A,P) ↓ minimize</div>
                <div className="text-[10px] text-red-400">d(A,N) ↑ maximize</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs text-emerald-300">P</span>
                </div>
                <span className="text-[10px] text-slate-400">Positive</span>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xs text-red-300">N</span>
                </div>
                <span className="text-[10px] text-slate-400">Negative</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('model')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'model'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Model Implementation
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              activeTab === 'config'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hyperparameters
          </button>
        </div>

        <div className="code-block p-6 overflow-x-auto">
          <pre className="text-sm leading-relaxed">
            <code className="text-slate-300">
              {activeTab === 'model' ? modelCode : configCode}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
