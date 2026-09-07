import { pipelines } from '../content/pipelines.js';

const themes = {
  matrix: ['FIELDNOTES / WATER', 'Reading the water.', 'From millions of readings to an honest benchmark.'],
  kpis: ['NVIDIA / SUPPLY INTELLIGENCE', 'Follow the signal.', 'Demand. Capacity. Delivery. One connected system.'],
  versus: ['AZURE / COMPUTER VISION', 'The architecture matters.', 'Two networks. The same experiment. Four configurations.'],
  blueprint: ['ASSEMBLY / SERVICES', 'Small services. Big conversations.', 'A conference platform viewed through its architecture.'],
  analytics: ['RETAIL / ANALYSIS', 'Behind the discount.', 'Trace the journey from transactions to insight.'],
  register: ['ITIL / CONFIGURATION', 'Know what connects.', 'Configuration management across a retail estate.'],
  screens: ['BALANCE / HUMAN CENTRED DESIGN', 'Make room for life.', 'A design process built around people and their priorities.'],
  dials: ['VISION / 2030', 'Progress in perspective.', 'A public-sector indicator study in Power BI.'],
  commits: ['NA / OPEN SOURCE', 'Built to be explored.', 'A growing collection of data, models and systems.'],
};
function el(tag, className, text) {
  const node=document.createElement(tag); if(className)node.className=className;
  if(text!=null)node.textContent=text; return node;
}
function section(n,title,copy) {
  const node=el('section','story-chapter');
  node.append(el('span','story-eyebrow',n),el('h3','',title));
  if(copy)node.append(el('p','story-intro',copy)); return node;
}
function route(labels,kind='') {
  const flow=el('ol',`story-route ${kind}`);
  labels.forEach((label,i)=>{ const node=el('li');node.append(el('span','story-eyebrow',String(i+1).padStart(2,'0')),el('strong','',label));flow.append(node); });
  return flow;
}
function diagram(item) {
  const scene=el('div',`story-diagram story-diagram-${item.face}`);
  if(item.face==='kpis') {
    scene.append(el('span','story-eyebrow','THE PHYSICAL SYSTEM'));
    scene.append(route(['Demand signal','Advanced-node foundry','Packaging','AI GPUs','Delivery'],'story-supply'));
    const chip=el('div','story-chip');chip.append(el('small','','AI COMPUTE'),el('strong','','H100 / H200'),el('span','','PRODUCT × REGION × TIME'));scene.append(chip);
    scene.append(el('p','story-diagram-note','Foundry concentration and packaging constraints frame the forecasting problem.'));
  } else if(item.face==='matrix') {
    scene.append(el('div','story-rings'),el('span','story-eyebrow','A TIME SERIES, NOT A RANDOM SPLIT'));
    const timeline=el('div','story-timeline');
    ['2000–2017|TRAIN','2018–2025|TEST'].forEach(v=>{const [years,label]=v.split('|');const block=el('div');block.append(el('small','',label),el('strong','',years));timeline.append(block);});scene.append(timeline);
    scene.append(route(['Ridge','Random Forest','MLP','XGBoost']));
    scene.append(el('p','story-diagram-note','Four models × five water-quality parameters = twenty comparable runs.'));
  } else if(item.face==='versus') {
    scene.append(el('span','story-eyebrow','CONTROL THE INPUT. CHANGE THE NETWORK.'));
    scene.append(route(['100 photographs','Identical transformations','GPU training']));
    const fork=el('div','story-network-fork');
    ['DenseNet','ResNet'].forEach((name,j)=>{const lane=el('div','story-network');lane.append(el('h4','',name));const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 440 130');svg.setAttribute('aria-hidden','true');
      for(let i=0;i<5;i++){for(let k=i+1;k<5;k++){if(j===1&&k>i+2)continue;const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${40+i*90} 90 Q ${40+(i+k)*45} ${10-(k-i)*4} ${40+k*90} 90`);svg.append(path);}const dot=document.createElementNS(svg.namespaceURI,'circle');dot.setAttribute('cx',String(40+i*90));dot.setAttribute('cy','90');dot.setAttribute('r','10');svg.append(dot);}lane.append(svg,el('p','',j?'Residual shortcuts':'Dense connections'));fork.append(lane);});scene.append(fork);
    scene.append(el('p','story-diagram-note','Conceptual connectivity diagrams. Both models are evaluated in training and on 30 unseen images.'));
  } else {
    const paths={blueprint:['Client','PHP REST API','Kubernetes','AWS'],analytics:['2,121 transactions','ETL','Time-series analysis','Discount → profit'],register:['87 stores','Configuration items','7 KPIs','95%+ accuracy'],screens:['Personas','MoSCoW','Figma prototype','Cognitive walkthrough'],dials:['Saudi Vision 2030','Indicators','Power BI','Public-sector perspective'],commits:['Data','Machine learning','Business intelligence','Architecture']};
    scene.append(el('span','story-eyebrow',item.face==='screens'?'THE HUMAN-CENTRED DESIGN PROCESS':'THE PROJECT AT A GLANCE'),route(paths[item.face]||item.tags));
    const mark=el('div','story-emblem',item.face==='blueprint'?'{ / }':item.face==='analytics'?'↓ %':item.face==='register'?'87':item.face==='screens'?'Pause.':item.face==='dials'?'2030':'</>');scene.append(mark);
  }
  return scene;
}
function interactivePipeline(pipeline) {
  const root=section('02 / THE PROCESS',pipeline.title,'Select a stage to follow the decisions, transformations and evidence.');
  const nodes=el('div','story-pipeline');nodes.setAttribute('role','group');nodes.setAttribute('aria-label','Pipeline stages');
  const detail=el('div','story-stage-detail');detail.setAttribute('aria-live','polite');
  const buttons=[];
  function select(i) {buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));const s=pipeline.stages[i];detail.replaceChildren(el('span','story-eyebrow',`STAGE ${s.n} / ${s.k}`),el('h4','',s.name),el('p','',s.d));const result=el('div','story-stage-result');result.append(el('strong','',s.stat),el('span','',s.note));detail.append(result);}
  pipeline.stages.forEach((s,i)=>{const b=el('button','');b.type='button';b.append(el('span','',s.n),el('strong','',s.k));b.addEventListener('click',()=>select(i));buttons.push(b);nodes.append(b);});
  root.append(nodes,detail);select(0);return root;
}
export function buildProjectStory(item, subject) {
  const root=el('article',`project-story story-${item.face}`);const [brand,title,sub]=themes[item.face];
  const hero=el('section','story-cover');hero.append(el('span','story-eyebrow',brand),el('h3','',title),el('p','',sub),diagram(item));root.append(hero);
  const context=section('01 / THE QUESTION',item.face==='kpis'?'How do you measure a constrained system?':item.face==='matrix'?'Can past readings predict what comes next?':item.face==='versus'?'What changes when only the architecture changes?':'The purpose behind the project.',subject.c?.body||subject.lede);
  if(item.face==='kpis') {
    const model=el('div','story-data-model');model.append(el('strong','','SUPPLY-CHAIN MEASURES'));
    ['Product','Region','Time'].forEach(v=>model.append(el('span','',v)));
    context.append(model,el('p','story-diagram-note','Star-schema dimensions support six DAX measures. This is a conceptual view of the analytical model.'));
  }
  root.append(context);
  if(pipelines[item.id])root.append(interactivePipeline(pipelines[item.id]));
  const evidence=section('03 / THE EVIDENCE',item.face==='kpis'?'Six measures. Different questions.':item.face==='versus'?'Compare like with like.':'What the project records.');
  const metrics=el('div','story-metrics');
  const facts=subject.c?.figures || (subject.fw?.figures?.steps ? subject.fw.figures.steps.map((step,i)=>({k:`Design stage ${i+1}`,v:step})) : Object.entries(subject.fw?.figures||{}).filter(([,v])=>!Array.isArray(v)).map(([k,v])=>({k,v})));
  facts.forEach(f=>{const card=el('div','story-metric');card.append(el('span','story-eyebrow',f.k),el('strong','',f.v));if(f.n)card.append(el('p','',f.n));metrics.append(card);});evidence.append(metrics);
  if(item.configs) {
    const chart=el('div','story-comparison');
    item.configs.forEach(c=>{const row=el('div','story-comparison-row');row.append(el('span','',`${c.model} / ${c.mode}`));const track=el('div','story-bar');const fill=el('i');fill.style.width=`${c.accuracy*100}%`;track.append(fill);row.append(track,el('strong','',`${(c.accuracy*100).toFixed(2)}%`));chart.append(row);});evidence.append(chart,el('p','story-diagram-note','Accuracy by configuration. Training-pipeline and unseen-image results come from different evaluation sets; these small samples do not establish general performance.'));
  }
  if(subject.c?.note)evidence.append(el('p','story-diagram-note',subject.c.note));
  root.append(evidence);
  const footer=section('04 / EXPLORE','Continue into the project.');const tags=el('div','story-tools');(subject.c?.stack||item.tags).forEach(t=>tags.append(el('span','',t)));const link=el('a','story-source','Open the full project ↗');link.href=subject.href;link.target='_blank';link.rel='noopener';footer.append(tags,link);root.append(footer);return root;
}
