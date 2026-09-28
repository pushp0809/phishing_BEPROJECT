import { motion } from 'framer-motion';
import { Database, ExternalLink, Users, Keyboard as KeyboardIcon, Mouse } from 'lucide-react';

const datasets = [
  {
    name: 'TypeNet Architecture (BiDAlab)',
    url: 'https://github.com/BiDAlab/TypeNet',
    description: 'Original implementation of the recurrent neural network for large-scale typing behavior recognition, with pre-calculated embedding vectors and LSTM layers.',
    icon: KeyboardIcon,
    size: 'Pre-trained weights',
    users: 'Large-scale',
    tags: ['LSTM', 'Embeddings', 'PyTorch']
  },
  {
    name: 'CMU Keystroke Dynamics Benchmark',
    url: 'https://www.kaggle.com/datasets/carnegiecylab/keystroke-dynamics-benchmark-data-set',
    description: 'Standard baseline dataset with keystroke-timing information from 51 subjects typing passwords 400 times each.',
    icon: Database,
    size: '51 users × 400 sessions',
    users: '51',
    tags: ['Benchmark', 'Password', 'Standard']
  },
  {
    name: 'CyberSignature Behaviour Biometrics',
    url: 'https://data.mendeley.com/datasets/fnf8b85kr6',
    description: '1,760 Keystroke, Mouse, and Touchscreen (KMT) instances for distinguishing legitimate online card payments from fraudulent ones.',
    icon: Mouse,
    size: '1,760 instances',
    users: 'Multi-modal',
    tags: ['KMT', 'Payments', 'Fraud']
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
    name: 'Continuous Auth Service',
    url: 'https://github.com/tasoskakour/continuous-authentication-service',
    description: 'Open-source MEAN stack microservice using One-Class SVMs and GMMs to authenticate users continuously via keystroke dynamics.',
    icon: Database,
    size: 'Full pipeline',
    users: 'Open-source',
    tags: ['SVM', 'GMM', 'MEAN Stack']
  },
  {
    name: 'BehaveFormer (Dual Attention)',
    url: 'https://github.com/nganntk/BehaveFormer',
    description: 'Advanced framework leveraging multichannel time-series data (keystrokes + swipe/IMU) for continuous identification using transformers.',
    icon: KeyboardIcon,
    size: 'Transformer-based',
    users: 'Multi-sensor',
    tags: ['Transformer', 'Attention', 'Multi-modal']
  },
  {
    name: 'Aalto 136M Keystrokes',
    url: 'https://userinterfaces.aalto.fi/136Mkeystrokes/',
    description: 'Massive dataset capturing free-text typing behaviors from 168,000 volunteers for generalized typing baseline models.',
    icon: Database,
    size: '136M keystrokes',
    users: '168,000',
    tags: ['Large-scale', 'Free-text', 'Baseline']
  },
  {
    name: 'HuMIdb (Human Mobile Interaction)',
    url: 'https://github.com/BiDAlab/HuMIdb',
    description: 'Multimodal data from 14 smartphone sensors captured during natural interactions by over 600 users.',
    icon: Users,
    size: '14 sensors × 600+ users',
    users: '600+',
    tags: ['Mobile', 'Multi-sensor', 'Natural']
  },
];

export default function Datasets() {
  return (
    <section id="datasets" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3 tracking-tight">
            Research Datasets & References
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Key datasets and open-source implementations used in behavioral biometrics research.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {datasets.map((dataset, i) => (
            <motion.a
              key={dataset.name}
              href={dataset.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="card p-4 hover:border-gray-300 transition-all group block"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:border-gray-900 transition-colors">
                  <dataset.icon className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate group-hover:text-gray-700 transition">
                      {dataset.name}
                    </h3>
                    <ExternalLink className="w-3 h-3 text-gray-300 flex-shrink-0 group-hover:text-gray-500 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
                    {dataset.description}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> {dataset.users}
                    </span>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{dataset.size}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {dataset.tags.map(tag => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-gray-500">
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
