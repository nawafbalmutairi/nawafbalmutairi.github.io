// The journey each project actually took, stage by stage.
//
// Sources are cited per stage. Most come from the pipeline strips and
// methodology sections already published in each case-study repo; two
// preprocessing details were described by Nawaf directly and are marked
// TODO(copy-review) so he can confirm the wording before it stands.

export const pipelines = {

  /* ── 01 · Water quality ────────────────────────────────────────────
     src: ml-water-quality-benchmark/docs — .pl-step strip, plus the
     Methodology section: "The same preprocessing pipeline ran for all four
     models: missing-value handling, type coercion, lag-feature generation,
     and standardisation." */
  'water-quality': {
    accent: 'teal',
    title: 'From a broken API to twenty benchmarked runs',
    stages: [
      { n: '01', k: 'Collect',
        name: 'Environment Agency data',
        d: 'The upstream EA endpoint was deprecated mid-project. Ingestion was rebuilt in Colab against the new beta endpoint, auto-downloading 364 monthly CSVs across 26 years and 14 regions.',
        stat: '364 CSVs', note: '26 years · 14 regions' },

      { n: '02', k: 'Organise',
        name: 'Batch rename & verify',
        d: 'A PowerShell pass renamed every file by region prefix and year. A validation script ran before training and caught a year-number mismatch in the Thames data.',
        stat: '1 bug caught', note: 'verification before training' },

      { n: '03', k: 'Clean',
        name: 'Missing values & types',
        d: 'Missing-value handling and type coercion across all five parameters — applied identically for every model so that architecture, not preprocessing, is the variable under test.',
        stat: '5 parameters', note: 'identical for all four models' },

      { n: '04', k: 'Reshape',
        name: 'Long to wide',
        // TODO(copy-review): described by Nawaf in conversation, 6 Sep 2026 —
        // the published methodology names the preprocessing steps but not the
        // reshape explicitly. Confirm wording.
        d: 'Readings arrive one row per measurement. They are pivoted from long to wide so each timestamp carries all five parameters as columns — the shape a tabular regressor needs.',
        stat: 'long → wide', note: 'one row per timestamp' },

      { n: '05', k: 'Engineer',
        name: 'Lag features',
        d: 'Time features generated from the series itself: autocorrelative lag features plus standardisation. Only lag features are used — no external rainfall or discharge signal.',
        stat: 'lag + scale', note: 'autocorrelative only' },

      { n: '06', k: 'Split',
        name: 'Chronological, never random',
        d: 'Train on 2000–2017, test on 2018–2025. A random split would let the model see the future; forecasting cannot.',
        stat: '27M / 6M', note: 'train / test rows, all 20 runs' },

      { n: '07', k: 'Benchmark',
        name: 'Four models × five parameters',
        d: 'Ridge, Random Forest, MLP and XGBoost, each run against all five targets under the same preprocessing and the same split.',
        stat: '20 runs', note: 'like-for-like comparison' },

      { n: '08', k: 'Evaluate',
        name: 'R² · RMSE · MAE',
        d: 'Three error metrics per combination. Nine of twenty land below zero — worse than predicting the mean — and they are reported, because they are the result.',
        stat: 'R² 0.785', note: 'XGBoost × Water Temperature' },
    ],
  },

  /* ── 02 · NVIDIA supply chain ──────────────────────────────────────
     src: nvidia-supply-chain-bi/docs — section headings, which are the
     Soft Systems Methodology layers the study is structured around. */
  'nvidia-bi': {
    accent: 'ochre',
    title: 'From rich picture to a live scorecard',
    stages: [
      { n: '01', k: 'Frame', name: 'Rich picture',
        d: 'SSM Layer 1. The AI-GPU supply chain drawn as a whole system — foundry, packaging, demand signal and the actors around them — before any measure is chosen.',
        stat: 'Layer 1', note: 'Soft Systems Methodology' },
      { n: '02', k: 'Model', name: 'Causal loop diagram',
        d: 'SSM Layer 2. Reinforcing and balancing loops made explicit, so the dashboard measures causes rather than symptoms.',
        stat: 'Layer 2', note: 'R and B loops' },
      { n: '03', k: 'Structure', name: 'Balanced Scorecard',
        d: 'SSM Layer 3. CATWOE and the Balanced Scorecard turn the system view into four perspectives and a defensible KPI set.',
        stat: 'Layer 3', note: 'CATWOE · four perspectives' },
      { n: '04', k: 'Shape', name: 'Star schema',
        d: 'The data modelled as a star schema so the measures compose cleanly across product, region and time.',
        stat: 'star schema', note: 'product · region · time' },
      { n: '05', k: 'Measure', name: 'DAX measures',
        d: 'Forecast accuracy, MAPE, backorders, capacity utilisation, lead time and on-time delivery, each written as a DAX measure over the model.',
        stat: '6 KPIs', note: 'written in DAX' },
      { n: '06', k: 'Deliver', name: 'Dashboard',
        d: 'The live Power BI report: H100 and H200 across EMEA and NA, with inventory and backorder breakdowns by region.',
        stat: '96.4%', note: 'forecast accuracy' },
      { n: '07', k: 'Decide', name: 'Insight',
        d: 'The May/November pattern the causal loops predicted, read off the dashboard — the point where a report becomes an action.',
        stat: 'MAPE 24.3%', note: 'what the loops predicted' },
    ],
  },

  /* ── 03 · Face classification ──────────────────────────────────────
     src: ai-face-recognition/docs — both .pl-step strips (the training
     pipeline and the real-time inference pipeline). */
  'face-classifier': {
    accent: 'violet',
    title: 'One pipeline, two architectures, twice',
    stages: [
      { n: '01', k: 'Dataset', name: 'gender_images',
        d: 'Kaggle dataset of 100 photos, evenly split 50 male / 50 female.',
        stat: '100 imgs', note: '50M / 50F' },
      { n: '02', k: 'Convert', name: 'Convert & split',
        d: 'Converted to an Azure Image Directory, then split 70/30 into train and test, and the training portion split 70/30 again into train and validation.',
        stat: '70 / 30', note: 'twice' },
      { n: '03', k: 'Transform', name: 'Image transformation',
        d: 'Init Image Transformation and Apply Transformation run identically across train, validation and test, so the only variable is the architecture.',
        stat: 'identical', note: 'across all three splits' },
      { n: '04', k: 'Train', name: 'DenseNet vs ResNet',
        d: 'Train PyTorch Model on GPU compute. The same pipeline is run twice — once wired to DenseNet, once to ResNet.',
        stat: 'GPU', note: 'two architectures' },
      { n: '05', k: 'Evaluate', name: 'Score & evaluate',
        d: 'Score Image Model into Evaluate Model — precision, recall and accuracy for each configuration.',
        stat: '4 configs', note: 'precision · recall · accuracy' },
      { n: '06', k: 'Infer', name: 'Real-time inference',
        d: 'A second pipeline reuses the trained weights against Nawaf_data_inference — 30 photos curated by hand, never seen in training.',
        stat: '30 unseen', note: 'self-curated set' },
      { n: '07', k: 'Result', name: 'DenseNet wins',
        d: 'Dense connectivity beats residual shortcuts on this small, scarce dataset — the wiring is the comparison.',
        stat: '86.67%', note: 'DenseNet, real-time inference' },
    ],
  },
};
