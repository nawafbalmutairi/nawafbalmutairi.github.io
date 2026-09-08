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
// Submission report, Table 1. Order: Ridge, Random Forest, MLP, XGBoost.
export const results = [
  [
    {
      "r2": -0.007,
      "rmse": 14.279,
      "mae": 4.709
    },
    {
      "r2": -0.322,
      "rmse": 16.357,
      "mae": 5.031
    },
    {
      "r2": -1.42,
      "rmse": 22.13,
      "mae": 7.905
    },
    {
      "r2": 0.021,
      "rmse": 14.075,
      "mae": 4.344
    }
  ],
  [
    {
      "r2": -0.007,
      "rmse": 369.339,
      "mae": 95.691
    },
    {
      "r2": -3.487,
      "rmse": 779.768,
      "mae": 83.334
    },
    {
      "r2": -0.065,
      "rmse": 379.928,
      "mae": 89.534
    },
    {
      "r2": -0.269,
      "rmse": 414.71,
      "mae": 75.232
    }
  ],
  [
    {
      "r2": 0.106,
      "rmse": 4.315,
      "mae": 3.441
    },
    {
      "r2": 0.729,
      "rmse": 2.377,
      "mae": 1.815
    },
    {
      "r2": -3.611,
      "rmse": 9.799,
      "mae": 8.161
    },
    {
      "r2": 0.785,
      "rmse": 2.116,
      "mae": 1.607
    }
  ],
  [
    {
      "r2": 0.357,
      "rmse": 1.861,
      "mae": 1.334
    },
    {
      "r2": 0.179,
      "rmse": 2.103,
      "mae": 1.214
    },
    {
      "r2": 0.46,
      "rmse": 1.706,
      "mae": 1.211
    },
    {
      "r2": 0.503,
      "rmse": 1.636,
      "mae": 1.129
    }
  ],
  [
    {
      "r2": -0.012,
      "rmse": 0.418,
      "mae": 0.294
    },
    {
      "r2": 0.163,
      "rmse": 0.38,
      "mae": 0.261
    },
    {
      "r2": 0.083,
      "rmse": 0.398,
      "mae": 0.281
    },
    {
      "r2": 0.225,
      "rmse": 0.366,
      "mae": 0.247
    }
  ]
];

export const best = { target: 2, model: 3 };   // Water Temperature × XGBoost

// Compact view of the same submission-backed workflow.
export const pipeline = [
 {n:'01',k:'DATA',v:'14 areas',d:'Environment Agency records from 2000–2025, organised by area and year.'},
 {n:'02',k:'PREPROCESSING',v:'Long → wide',d:'Treat censored values as missing and retain target-specific valid records.'},
 {n:'03',k:'INPUTS',v:'4 + 3 features',d:'Other four measurements plus year, month and day; train 2000–2017, test 2018–2025.'},
 {n:'04',k:'MODELS',v:'4 × 5',d:'Ridge, Random Forest, MLP and XGBoost in a consistent benchmark workflow.'},
 {n:'05',k:'EVALUATION',v:'R² · RMSE · MAE',d:'All twenty combinations reported in the study and Power BI dashboard.'},
 {n:'06',k:'RESULTS',v:'Best R² 0.785',d:'XGBoost leads on four targets. All models struggle with BOD.'},
];
