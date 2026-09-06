// The work. Three case studies carry full detail; six further projects are
// summarised. Every figure is cited to the file it was read from.
//
// `visual` describes what the panel renders as its primary content. Per the
// reference image the project's own artefact leads — the Power BI page, the
// Azure pipeline — rather than an abstract stand-in. Where a repo holds no
// figure, `visual.kind` is 'data' and the panel renders the numbers themselves.

export const cases = [
  {
    id: 'water-quality',
    face: 'matrix',
    index: '01',
    kind: 'Machine Learning · Dissertation',
    // src(pre-redesign index.html #case-01)
    meta: 'KV6013 · 2026 · Final-year project',
    title: 'Four models, five parameters, one that worked.',
    lede:
      'Benchmarking four machine-learning models on 8.3 million UK Environment ' +
      'Agency water-quality samples, 2000–2025.',
    body:
      'Mid-project the upstream API was deprecated, so I rebuilt ingestion in ' +
      'Colab, batch-renamed 364 CSVs across 14 regions, and ran a chronological ' +
      'train/test split to benchmark Ridge, Random Forest, MLP and XGBoost. ' +
      'The break became a system-design problem.',
    stack: ['Python', 'XGBoost', 'scikit-learn', 'PyTorch', 'Pandas', 'Power BI'],
    // src(pre-redesign index.html #case-01, #journey)
    figures: [
      { k: 'Samples',            v: '8.3M',  n: 'UK Environment Agency, 2000–2025' },
      { k: 'Train rows',         v: '27M',   n: 'cumulative across 20 runs' },
      { k: 'Test rows',          v: '6M',    n: 'cumulative across 20 runs' },
      { k: 'Best R²',            v: '0.785', n: 'XGBoost × Water Temperature' },
    ],
    note:
      'Row counts are cumulative across all 20 model × target combinations ' +
      '(4 models × 5 parameters). The source dataset is 8.3M samples.',
    visual: { kind: 'matrix' },   // the 20-cell R²/RMSE/MAE surface — see water-quality.js
    href: 'https://nawafbalmutairi.github.io/ml-water-quality-benchmark/',
    accent: 'teal',
  },

  {
    id: 'nvidia-bi',
    face: 'kpis',
    index: '02',
    kind: 'Business Intelligence',
    // src(pre-redesign index.html #case-02)
    meta: 'KV6011 · 2025 · Power BI',
    title: 'A supply chain, running.',
    lede:
      'An integrated BI solution for the NVIDIA AI-GPU supply chain — one of ' +
      'the world’s most volatile.',
    body:
      'Using Soft Systems Methodology, CATWOE and the Balanced Scorecard, I ' +
      'structured NVIDIA’s AI-GPU forecasting problem from rich picture to ' +
      'KPI to live dashboard. The H100, H200 and B-series depend on a single ' +
      'advanced-node foundry and a bottlenecked packaging step.',
    stack: ['Power BI', 'DAX', 'Star Schema', 'Soft Systems Methodology', 'CATWOE', 'Balanced Scorecard'],
    // src(pre-redesign index.html #case-02 — the six dashboard KPIs)
    figures: [
      { k: 'Forecast accuracy', v: '96.4%',  n: 'H100 · H200, EMEA · NA' },
      { k: 'MAPE',              v: '24.3%',  n: 'mean absolute percentage error' },
      { k: 'Backorders',        v: '42.3K',  n: 'units outstanding' },
      { k: 'Capacity util.',    v: '57.0%',  n: 'against available capacity' },
      { k: 'Avg lead time',     v: '59 days', n: 'order to delivery' },
      { k: 'On-time delivery',  v: '95.92%', n: 'against committed dates' },
    ],
    // src(ml/nvidia repo) docs/assets/*.png — real artefacts, licensed MIT in-repo
    visual: {
      kind: 'figure',
      src: 'https://nawafbalmutairi.github.io/nvidia-supply-chain-bi/assets/dashboard.png',
      alt: 'Power BI dashboard page for the NVIDIA AI-GPU supply chain, showing forecast ' +
           'accuracy, backorders and capacity utilisation across products and regions.',
      cap: 'NVIDIA_SUPPLY_CHAIN.pbix — AI-GPU supply chain & forecasting performance',
    },
    href: 'https://nawafbalmutairi.github.io/nvidia-supply-chain-bi/',
    accent: 'ochre',
  },

  {
    id: 'face-classifier',
    face: 'versus',
    // src(ai-face-recognition/docs — results table): all four configurations,
    // precision / recall / accuracy. DenseNet leads ResNet in both modes.
    configs: [
      { model: 'DenseNet', mode: 'Training pipeline',   precision: 0.8000, recall: 0.8000, accuracy: 0.8000 },
      { model: 'ResNet',   mode: 'Training pipeline',   precision: 0.7376, recall: 0.7333, accuracy: 0.7333 },
      { model: 'DenseNet', mode: 'Real-time inference', precision: 0.8667, recall: 0.8667, accuracy: 0.8667 },
      { model: 'ResNet',   mode: 'Real-time inference', precision: 0.8000, recall: 0.8000, accuracy: 0.8000 },
    ],
    index: '03',
    kind: 'Deep Learning · Computer Vision',
    // src(pre-redesign index.html #case-03)
    meta: 'Azure ML Designer · 2024',
    title: 'The wiring is the comparison.',
    lede:
      'Gender classification on faces — DenseNet against ResNet, across four ' +
      'configurations.',
    body:
      'Four model configurations built in Azure ML Designer: DenseNet and ' +
      'ResNet, each evaluated in a training pipeline (Kaggle gender_images, ' +
      '100 photos, 50M/50F) and a real-time inference pipeline against a ' +
      'custom dataset of 30 photos I curated myself.',
    stack: ['Azure ML Designer', 'PyTorch', 'DenseNet', 'ResNet', 'Computer Vision', 'GPU Training'],
    // src(pre-redesign index.html #case-03)
    figures: [
      { k: 'DenseNet accuracy', v: '86.7%', n: 'test set' },
      { k: 'Training set',      v: '100',   n: 'photos, 50M / 50F' },
      { k: 'Inference set',     v: '30',    n: 'unseen photos, self-curated' },
      { k: 'Split',             v: '70/30', n: 'train/test, then train/val' },
    ],
    // TODO(content): this repo holds no figures at all. The panel renders the
    // architecture comparison from the numbers above instead of a screenshot.
    visual: { kind: 'data' },
    href: 'https://nawafbalmutairi.github.io/ai-face-recognition/',
    accent: 'violet',
  },
];

// src(pre-redesign index.html #index) — six further projects.
//
// `face` names the composition each one is drawn as in the Work gallery, and
// `figures` restates the numbers ALREADY PRESENT in that project's own note
// above — structured so a face can lay them out, not newly asserted.

export const further = [
  { y: '2025', title: 'Conference Microservices', face: 'blueprint', figures: { endpoints: 5, score: '86%', model: 'Kruchten 4+1', host: 'Kubernetes on AWS' }, note: 'PHP REST API, 5 endpoints. Kruchten 4+1 architecture, Kubernetes on AWS. Final score 86%.', tags: ['PHP', 'REST', 'AWS', 'K8s'], href: 'https://nawafbalmutairi.github.io/Conference-Info-Platform/' },
  { y: '2024', title: 'US Retail Sales Analysis', face: 'analytics', figures: { rows: '2,121', unit: 'transactions', focus: 'discount → profit' }, note: '2,121 transactions in Python/Pandas. ETL pipeline, time-series breakdown, discount–profit correlation surfaced.', tags: ['Python', 'Pandas', 'Chart.js'], href: 'https://nawafbalmutairi.github.io/furniture-sales-dashboard/' },
  { y: '2025', title: 'ITIL Config Management', face: 'register', figures: { stores: 87, kpis: 7, accuracy: '95%+' }, note: 'CMDB strategy for an 87-store retailer. 7 KPIs designed, CI accuracy maintained above 95%.', tags: ['ITIL 4', 'CMDB', 'ITSM'], href: 'https://nawafbalmutairi.github.io/ITIL-Configuratio-Management-Abona-Tarn-PLC/index.html' },
  { y: '2025', title: 'UCD Work-Life App', face: 'screens', figures: { steps: ['Personas', 'MoSCoW', 'Figma prototype', 'Cognitive walkthrough'] }, note: 'Personas, MoSCoW prioritisation, Figma prototype and cognitive walkthrough — full UCD methodology end to end.', tags: ['Figma', 'UCD', 'Prototyping'], href: 'https://nawafbalmutairi.github.io/UCD-Practical-Work-Work-Life-Balance-App/index.html' },
  { y: '2025', title: 'Vision 2030 KPI Tracker', face: 'dials', figures: { subject: 'Saudi Vision 2030', tool: 'Power BI' }, note: 'Saudi Vision 2030 indicators visualised in an interactive Power BI dashboard. Published on LinkedIn.', tags: ['Power BI', 'DAX', 'Public Sector'], href: 'https://www.linkedin.com/in/nawaf-almutairi-907766290/' },
  { y: 'Ongoing', title: 'GitHub Portfolio', face: 'commits', figures: { repos: '15+', scope: 'data · ML · BI · architecture · ITSM' }, note: '15+ public repositories spanning data analysis, ML, BI, software architecture and ITSM frameworks. All sources open.', tags: ['Git', 'Open source'], href: 'https://github.com/nawafbalmutairi' },
];
