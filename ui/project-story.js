import { pipelines } from '../content/pipelines.js';
import { stories } from '../content/project-stories.js';
import { buildExhibit } from './story-exhibits.js';

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
function interactivePipeline(pipeline) {
  const root=section('02 / THE PROCESS',pipeline.title,'Select a stage to follow the decisions, transformations and evidence.');
  const nodes=el('div','story-pipeline');nodes.setAttribute('role','group');nodes.setAttribute('aria-label','Pipeline stages');
  const detail=el('div','story-stage-detail');detail.setAttribute('aria-live','polite');
  const buttons=[];
  function select(i) {buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));const s=pipeline.stages[i];detail.replaceChildren(el('span','story-eyebrow',`STAGE ${s.n} / ${s.k}`),el('h4','',s.name),el('p','',s.d));const result=el('div','story-stage-result');result.append(el('strong','',s.stat),el('span','',s.note));detail.append(result);}
  pipeline.stages.forEach((s,i)=>{const b=el('button','');b.type='button';b.append(el('span','',s.n),el('strong','',s.k));b.addEventListener('click',()=>select(i));buttons.push(b);nodes.append(b);});
  root.append(nodes,detail);select(0);return root;
}
function narrativeCards(entries, cls) {
  const list=el('div',cls);
  entries.forEach(([title,copy],i)=>{const card=el('div','story-narrative-card');card.append(el('span','story-eyebrow',String(i+1).padStart(2,'0')),el('h4','',title),el('p','',copy));list.append(card);});return list;
}
export function buildProjectStory(item, subject) {
  const story=stories[item.face];
  const root=el('article',`project-story story-${item.face}`);
  const [brand,title]=themes[item.face];
  const hero=el('section','story-cover story-cover-editorial');
  hero.append(el('span','story-eyebrow',brand),el('h3','',title),el('span','story-type',story.type),el('p','story-built',story.built));
  const outputs=el('ul','story-outputs');story.outputs.forEach(output=>outputs.append(el('li','',output)));hero.append(outputs);root.append(hero);
  const nav=el('nav','story-chapter-nav');nav.setAttribute('aria-label','Case-study chapters');root.append(nav);
  function chapter(node,label) { const target=`story-${item.face}-${label.toLowerCase().replaceAll(' ','-')}`;node.id=target;const b=el('button','',label);b.type='button';b.addEventListener('click',()=>{node.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});});nav.append(b);root.append(node); }
  chapter(section('01 / WHY THIS EXISTS','The problem worth solving.',story.why),'Why');
  const inside=section('02 / INSIDE THE BUILD','Explore what I built.','Follow a real part of the project. Each view explains an input, a transformation, an output or a decision.');inside.append(buildExhibit(item));chapter(inside,'Inside the build');
  if(pipelines[item.id]) {
    const process=interactivePipeline(pipelines[item.id]);process.querySelector('.story-eyebrow').textContent='03 / HOW IT WORKS';chapter(process,'Pipeline');
  }
  const decisions=section('DESIGN DECISIONS','Why I built it this way.');decisions.append(narrativeCards(story.decisions,'story-decisions'));chapter(decisions,'Decisions');
  const results=section('RESULTS / INTERPRETATION','What the work actually showed.');results.append(narrativeCards(story.findings,'story-findings'));if(subject.c?.note)results.append(el('p','story-diagram-note',subject.c.note));chapter(results,'Results');
  const reflection=section('SCOPE / NEXT ITERATION','Where the evidence ends.',story.next);chapter(reflection,'Next steps');
  const footer=section('SOURCE / EXPLORE FURTHER','Inspect the work behind the story.');const tags=el('div','story-tools');(subject.c?.stack||item.tags).forEach(t=>tags.append(el('span','',t)));
  const link=el('a','story-source','Open project documentation ↗');link.href=story.source;link.target='_blank';link.rel='noopener';footer.append(tags,link);root.append(footer);return root;
}
