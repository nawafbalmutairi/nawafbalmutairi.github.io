// The journey each project actually took, stage by stage.
//
// Sources are cited per stage. Most come from the pipeline strips and
// methodology sections already published in each case-study repo; two
// preprocessing details were described by Nawaf directly and are marked
// TODO(copy-review) so he can confirm the wording before it stands.

export const pipelines = {

  // Water quality: submission report §§6–8; manual renaming clarified by Nawaf.
  'water-quality': {
    accent: 'teal', title: 'From monitoring records to a controlled benchmark',
    stages: [
      {n:'01',k:'Collect',name:'Environment Agency records',d:'Monitoring records from 2000–2025 across 14 Environment Agency areas in England, organised by area and year.',stat:'26 years',note:'14 areas · England'},
      {n:'02',k:'Organise',name:'Manual rename & review',d:'I renamed the downloaded files manually and spotted my own naming mistake: the Thames 2000 and 2001 files were swapped. I corrected them before constructing the final dataset.',stat:'2000 / 2001',note:'Thames filenames corrected manually'},
      {n:'03',k:'Clean',name:'Handle censored measurements',d:'Retain the five selected parameters. Treat readings marked < or > as missing, because detection limits are not exact measurements.',stat:'5 parameters',note:'avoid false numerical precision'},
      {n:'04',k:'Reshape',name:'Long to wide',d:'Reshape individual measurements into columns for each sampling point and date. Each target uses its own valid subset, so sample counts differ between targets.',stat:'long → wide',note:'one modelling table per target'},
      {n:'05',k:'Engineer',name:'Water measurements + calendar features',d:'Predict one parameter using the other four selected water-quality measurements plus year, month and day extracted from the observation date.',stat:'4 + 3 inputs',note:'water parameters + calendar features'},
      {n:'06',k:'Split',name:'Evaluate on later observations',d:'Train on 2000–2017 and test on 2018–2025. Approximately 6.7 million training and 1.6 million testing samples across the five target datasets, not multiplied by four models.',stat:'6.7M / 1.6M',note:'train / test · approximate target totals'},
      {n:'07',k:'Benchmark',name:'Four models × five targets',d:'Benchmark Ridge, Random Forest, MLP and XGBoost within the IBM SPSS Modeler workflow. Python, Pandas and NumPy support preparation; scikit-learn and XGBoost support modelling and evaluation.',stat:'20 combinations',note:'shared split and inputs within each target'},
      {n:'08',k:'Evaluate',name:'Metrics, plots and Power BI',d:'Compare R², RMSE and MAE for every combination. Present the results in the report and an interactive Power BI dashboard. XGBoost leads on R² for four targets; Ridge leads on BOD, although all BOD R² scores are negative.',stat:'R² 0.785',note:'best result · XGBoost × water temperature'},
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
