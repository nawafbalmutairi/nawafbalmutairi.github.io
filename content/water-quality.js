// The centrepiece dataset, transcribed unchanged from the published results
// table in ml-water-quality-benchmark/docs/index.html (the .pbix summary page).
// Twenty model × target combinations, three error metrics each. Negative R²
// means the model did worse than predicting the mean — those rows are the
// honest half of the result and are rendered, never hidden.

export const models = ['Ridge', 'Random Forest', 'MLP', 'XGBoost'];

export const targets = [
  { key: 'Nitrate as N',      unit: 'mg/l' },
  { key: 'BOD: 5 Day ATU',    unit: 'mg/l' },
  { key: 'Water Temperature', unit: '°C'   },
  { key: 'Dissolved Oxygen',  unit: 'mg/l' },
  { key: 'pH',                unit: ''     },
];

// [target][model] -> { r2, rmse, mae }
// src: ml-water-quality-benchmark/docs/index.html, results table
export const results = [
  [ // Nitrate as N
    { r2: -0.007, rmse: 22.13, mae: 7.90 },
    { r2: -0.322, rmse: 16.36, mae: 5.03 },
    { r2: -1.420, rmse: 14.28, mae: 4.71 },
    { r2: +0.021, rmse: 14.08, mae: 4.34 },
  ],
  [ // BOD: 5 Day ATU
    { r2: -0.007, rmse: 379.93, mae: 89.53 },
    { r2: -3.487, rmse: 779.77, mae: 83.33 },
    { r2: -0.065, rmse: 369.34, mae: 95.69 },
    { r2: -0.269, rmse: 414.71, mae: 75.23 },
  ],
  [ // Water Temperature
    { r2: +0.106, rmse: 9.80, mae: 8.16 },
    { r2: +0.729, rmse: 2.38, mae: 1.84 },
    { r2: -3.611, rmse: 4.31, mae: 3.44 },
    { r2: +0.785, rmse: 2.12, mae: 1.61 },   // the one pairing that cleared the bar
  ],
  [ // Dissolved Oxygen
    { r2: +0.357, rmse: 1.71, mae: 1.21 },
    { r2: +0.179, rmse: 2.10, mae: 1.21 },
    { r2: +0.460, rmse: 1.86, mae: 1.33 },
    { r2: +0.503, rmse: 1.64, mae: 1.13 },
  ],
  [ // pH
    { r2: -0.012, rmse: 0.42, mae: 0.29 },
    { r2: +0.163, rmse: 0.30, mae: 0.23 },
    { r2: +0.083, rmse: 0.28, mae: 0.23 },
    { r2: +0.225, rmse: 0.37, mae: 0.25 },
  ],
];

export const best = { target: 2, model: 3 };   // Water Temperature × XGBoost

// src(pre-redesign index.html #journey) — the six stages of the pipeline.
export const pipeline = [
  { n: '01', k: 'DATA',          v: '8.3M samples', d: '26 years of Environment Agency readings across 14 regions.' },
  { n: '02', k: 'PREPROCESSING', v: '364 CSVs',     d: 'The upstream API was deprecated mid-project. Rebuilt ingestion in Colab.' },
  { n: '03', k: 'FEATURES',      v: '2000 → 2025',  d: 'Chronological split, never random. Forecasting cannot see the future.' },
  { n: '04', k: 'MODELS',        v: '4 × 5 runs',   d: 'Ridge, Random Forest, MLP, XGBoost — identical preprocessing throughout.' },
  { n: '05', k: 'EVALUATION',    v: 'R² · RMSE · MAE', d: 'Three error metrics per combination, twenty combinations.' },
  { n: '06', k: 'RESULTS',       v: 'R² 0.785',     d: 'One pairing of twenty cleared the threshold. A dashboard is only useful if it ends in an action.' },
];
