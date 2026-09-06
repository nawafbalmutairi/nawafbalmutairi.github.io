// Stack and journey.
//
// STACK: 28 technologies, all cited to shipped work. `weight` decides visual
// prominence in the spatial arrangement — core tools sit nearer and larger,
// secondary tools recede. Weight is assigned from evidence in the repo (how
// many of the nine documented projects a tool actually appears in), not taste.
// src(pre-redesign index.html #stack) for the groups and membership.

export const groups = [
  {
    id: 'data-bi', label: 'Data & Business Intelligence', note: 'daily use',
    tools: [
      { n: 'Python',   w: 3 }, { n: 'Power BI', w: 3 }, { n: 'SQL',     w: 2 },
      { n: 'DAX',      w: 2 }, { n: 'Pandas',   w: 3 }, { n: 'ETL',     w: 2 },
      { n: 'NumPy',    w: 1 }, { n: 'Chart.js', w: 1 }, { n: 'Excel',   w: 1 },
    ],
  },
  {
    id: 'ml', label: 'Machine Learning', note: 'project-led',
    tools: [
      { n: 'XGBoost',      w: 3 }, { n: 'scikit-learn', w: 3 }, { n: 'PyTorch',  w: 2 },
      { n: 'Azure ML',     w: 2 }, { n: 'DenseNet',     w: 2 }, { n: 'ResNet',   w: 2 },
      { n: 'Computer Vision', w: 1 },
    ],
  },
  {
    id: 'architecture', label: 'Software Architecture', note: 'applied in coursework',
    tools: [
      { n: 'PHP',        w: 2 }, { n: 'REST API',   w: 2 }, { n: 'SQLite',  w: 1 },
      { n: 'Microservices', w: 2 }, { n: 'Kubernetes', w: 1 }, { n: 'AWS',  w: 1 },
      { n: 'Docker',     w: 1 }, { n: 'CI / CD',    w: 1 },
    ],
  },
  {
    id: 'process', label: 'Process & Design', note: 'methodology layer',
    tools: [
      { n: 'Git / GitHub', w: 3 }, { n: 'Figma',  w: 2 }, { n: 'UCD',     w: 2 },
      { n: 'ITIL 4',       w: 2 }, { n: 'CMDB',   w: 1 }, { n: 'Agile / Scrum', w: 2 },
      { n: 'Linux',        w: 1 }, { n: 'Unity',  w: 1 },
    ],
  },
];

// JOURNEY: only dated facts found in the repo. There is no employment history
// in any of the four repositories, so this is education and shipped work —
// TODO(content): roles/internships, if any exist, are missing entirely.
// src(pre-redesign index.html #foundation, #index, #case-01..03)
export const journey = [
  { t: 'Sep 2023', title: 'BSc (Hons) Computer Science begins',
    d: 'Northumbria University, Newcastle upon Tyne.', kind: 'edu' },
  { t: '2024', title: 'US Retail Sales Analysis',
    d: '2,121 transactions through a Python/Pandas ETL pipeline.', kind: 'work' },
  { t: '2024', title: 'Face classification — DenseNet vs ResNet',
    d: 'Four configurations in Azure ML Designer. DenseNet reached 86.7%.', kind: 'work' },
  { t: '2025', title: 'NVIDIA AI-GPU supply chain BI',
    d: 'KV6011. Soft Systems Methodology through to a live Power BI dashboard, 96.4% forecast accuracy.', kind: 'work' },
  { t: '2025', title: 'Architecture, ITSM and UCD coursework',
    d: 'Conference microservices (86%), ITIL CMDB strategy for 87 stores, and a full UCD design cycle.', kind: 'work' },
  { t: '2026', title: 'Dissertation — water-quality model benchmark',
    d: 'KV6013. 8.3M samples, four models, five parameters, twenty runs.', kind: 'work' },
  { t: 'Jul 2026', title: 'Graduated · Class of 2026',
    d: 'Modules: Machine Learning, Business Intelligence, Software Architecture, User-Centred Design, ITSM & ITIL 4, Database Systems, Data Science, Cloud Computing.', kind: 'edu' },
  { t: 'Aug 2026', title: 'Open to graduate roles',
    d: 'Data, business intelligence and machine learning. Based in Riyadh.', kind: 'now' },
];

// src(pre-redesign index.html #foundation)
export const certificates = {
  label: 'Google Professional Certificates',
  note: 'Six issued · Coursera',
  items: ['Data Analytics', 'Advanced Data Analytics', 'Business Intelligence',
          'Project Management', 'Cybersecurity', 'IT Support'],
};
