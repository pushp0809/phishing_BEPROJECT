import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

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
        last_hidden = h_n[-1]  # (batch, hidden_dim)
        embedding = self.projection(last_hidden)
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
            far = np.mean(genuine_scores < t)
            frr = np.mean(impostor_scores >= t)
            far_list.append(far)
            frr_list.append(frr)
        
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
    <section id="model" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Model Architecture
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Siamese LSTM network with Triplet Margin Loss — generating 64-dimensional 
            embedding vectors optimized for user discrimination.
          </p>
        </div>

        {/* Model Diagram */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card p-6 mb-8"
        >
          <h3 className="text-center font-medium text-gray-900 mb-6 text-sm">TypeNet Architecture</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {[
              { label: 'Input', sub: '(batch, 40, 3)', detail: '[dwell, DD, UD]' },
              { label: '2-Layer LSTM', sub: 'hidden=128', detail: 'dropout=0.3' },
              { label: 'Projection', sub: '128 → 64', detail: 'ReLU + Dropout' },
              { label: 'Embedding', sub: '64-dim', detail: 'L2 normalized' },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="text-center">
                  <div className="w-28 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center px-2">
                    <span className="text-xs font-medium text-gray-900">{step.label}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{step.sub}</span>
                    <span className="text-[10px] text-gray-400">{step.detail}</span>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Triplet Loss */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-center text-xs font-medium text-gray-500 mb-4 uppercase tracking-wider">Triplet Loss Optimization</h4>
            <div className="flex justify-center gap-6">
              {[
                { label: 'Anchor', letter: 'A', color: 'border-gray-900 bg-gray-50 text-gray-900' },
                { label: 'Positive', letter: 'P', color: 'border-gray-400 bg-gray-50 text-gray-600' },
                { label: 'Negative', letter: 'N', color: 'border-gray-300 bg-gray-50 text-gray-400' },
              ].map(({ label, letter, color }) => (
                <div key={label} className="text-center">
                  <div className={`w-12 h-12 rounded-full border-2 ${color} flex items-center justify-center mx-auto mb-1.5`}>
                    <span className="text-xs font-medium">{letter}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-3">
              Minimize distance(A, P) · Maximize distance(A, N)
            </p>
          </div>
        </motion.div>

        {/* Code */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'model'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Model Implementation
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Hyperparameters
          </button>
        </div>

        <div className="code-block p-5 overflow-x-auto">
          <pre className="text-xs leading-relaxed">
            <code className="text-gray-700">
              {activeTab === 'model' ? modelCode : configCode}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
