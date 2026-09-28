import { motion } from 'framer-motion';
import { Database, ExternalLink, Users, Keyboard as KeyboardIcon, Mouse } from 'lucide-react';

const datasets = [
  {
    name: 'TypeNet Architecture (BiDAlab)',
    url: 'https://github.com/BiDAlab/TypeNet',
    description: 'Original implementation of the recurrent neural network designed for large-scale typing behavior recognition, including pre-calculated embedding vectors and LSTM layers.',
    icon: KeyboardIcon,
    size: 'Pre-trained weights',
    users: 'Large-scale',
    tags: ['LSTM', 'Embeddings', 'PyTorch']
  },
  {
    name: 'CMU Keystroke Dynamics Benchmark',
    url: 'https://www.kaggle.com/datasets/carnegiecylab/keystroke-dynamics-benchmark-data-set',
    description: 'The standard baseline dataset featuring keystroke-timing information from 51 subjects typing passwords 400 times each.',
    icon: Database,
    size: '51 users × 400 sessions',
    users: '51',
    tags: ['Benchmark', 'Password', 'Standard']
  },
  {
    name: 'CyberSignature Behaviour Biometrics',
    url: 'https://data.mendeley.com/datasets/fnf8b85kr6',
    description: 'Contains 1,760 Keystroke, Mouse, and Touchscreen (KMT) dynamic instances for distinguishing legitimate online card payment entries from fraudulent ones.',
    icon: Mouse,
    size: '1,760 instances',
    users: 'Multi-modal',
    tags: ['KMT', 'Payments', 'Fraud Detection']
  },
  {
    name: 'Balabit Mouse Dynamics Challenge',
    url: 'https://github.com/balabit/Mouse-Dynamics-Challenge',
    description: 'Remote desktop session data tracking cursor coordinates and click states for anomalous mouse movement detection.',
    icon: Mouse,
    size: 'Mouse trajectories',
    users: 'Multiple',
    tags: ['Mouse', 'Anomaly', 'Desktop']
  },
  {
    name: 'Continuous Auth Service (tasoskakour)',
    url: 'https://github.com/tasoskakour/continuous-authentication-service',
    description: 'Open-source MEAN stack microservice backend utilizing One-Class SVMs and GMMs in Python to authenticate users continuously via keystroke dynamics.',
    icon: Database,
    size: 'Full pipeline',
    users: 'Open-source',
    tags: ['SVM', 'GMM', 'MEAN Stack']
  },
  {
    name: 'BehaveFormer (Dual Attention Transformers)',
    url: 'https://github.com/nganntk/BehaveFormer',
    description: 'Advanced framework leveraging multichannel time-series data (keystrokes + swipe/IMU sensor data) for continuous identification using transformer architecture.',
    icon: KeyboardIcon,
    size: 'Transformer-based',
    users: 'Multi-sensor',
    tags: ['Transformer', 'Attention', 'Multi-modal']
  },
  {
    name: 'Aalto 136M Keystrokes Dataset',
    url: 'https://userinterfaces.aalto.fi/136Mkeystrokes/',
    description: 'Massive dataset capturing free-text typing behaviors from 168,000 volunteers, ideal for establishing generalized typing baseline models.',
    icon: Database,
    size: '136 million keystrokes',
    users: '168,000',
    tags: ['Large-scale', 'Free-text', 'Baseline']
  },
  {
    name: 'HuMIdb Dataset (Human Mobile Interaction)',
    url: 'https://github.com/BiDAlab/HuMIdb',
    description: 'Contains multimodal data from 14 smartphone sensors captured during natural interactions by over 600 users.',
    icon: Users,
    size: '14 sensors × 600+ users',
    users: '600+',
    tags: ['Mobile', 'Multi-sensor', 'Natural']
  },
];

export default function Datasets() {
  return (
    <section id="datasets" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Research Datasets & References</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Key datasets and open-source implementations used in behavioral biometrics research
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((dataset, i) => (
            <motion.a
              key={dataset.name}
              href={dataset.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 hover:border-indigo-500/40 transition-all group block"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition">
                  <dataset.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-sm truncate group-hover:text-indigo-300 transition">
                      {dataset.name}
                    </h3>
                    <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {dataset.description}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {dataset.users}
                    </span>
                    <span className="text-[10px] text-slate-500">{dataset.size}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dataset.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
