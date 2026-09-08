// Accessible content and controls shared by two deliberately different 3D scenes.
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
export function buildSpatialExperience({kind,entries,onProject,certificates=[]}){
  const root=node('section',`spatial-experience experience-${kind}`);
  root.setAttribute('aria-label',kind==='stack'?'Skills constellation':'Journey landscape');
  const canvas=node('canvas','experience-canvas');canvas.setAttribute('aria-hidden','true');
  const heading=node('header','experience-heading');heading.append(node('span','experience-eyebrow',kind==='stack'?'03 / THE SKILL CONSTELLATION':'04 / A PATH THROUGH TIME'),node('h2','',kind==='stack'?'Different skills.\nOne connected practice.':'Every project\nleaves a waypoint.'));
  const hint=node('p','experience-hint',kind==='stack'?'DRAG TO ORBIT · SELECT A DISCIPLINE':'DRAG TO LOOK AROUND · SELECT A MILESTONE');
  const inspector=node('div','experience-inspector');
  const count=node('span','experience-count');
  const title=node('h3');const description=node('p','experience-description');
  const tools=node('div','experience-tools'),links=node('div','experience-projects');
  const facts=node('div','experience-facts');
  const controls=node('div','experience-controls');
  const previous=node('button','','←'),next=node('button','','→');
  previous.type=next.type='button';previous.setAttribute('aria-label',kind==='stack'?'Previous discipline':'Previous milestone');next.setAttribute('aria-label',kind==='stack'?'Next discipline':'Next milestone');
  const progress=node('span','experience-progress');controls.append(previous,progress,next);
  const detail=node('div','experience-selection');detail.setAttribute('aria-live','polite');detail.append(count,title,description,tools,facts,links);
  inspector.append(detail,controls);
  const choices=node('div','experience-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label',kind==='stack'?'Choose a discipline':'Choose a milestone');
  let selected=0,engine=null;
  const buttons=entries.map((entry,i)=>{const b=node('button','');b.type='button';b.setAttribute('aria-label',entry.title);b.append(node('span','',String(i+1).padStart(2,'0')),node('strong','',entry.label));b.addEventListener('click',()=>select(i));choices.append(b);return b;});
  function select(index,fromScene=false){
    selected=Math.max(0,Math.min(entries.length-1,index));const entry=entries[selected];
    root.dataset.selected=String(selected);count.textContent=`${String(selected+1).padStart(2,'0')} / ${entry.eyebrow}`;
    title.textContent=entry.title;description.textContent=entry.description;
    tools.replaceChildren(...(entry.tools||[]).map(t=>node('span','',t)));
    facts.replaceChildren();if(entry.fact)facts.append(node('strong','',entry.fact[0]),node('span','',entry.fact[1]));
    links.replaceChildren();if(entry.projects?.length){links.append(node('span','experience-eyebrow','FOLLOW THE EVIDENCE'));entry.projects.forEach(project=>{const b=node('button','',`${project.title} ↗`);b.type='button';b.addEventListener('click',()=>onProject(project.id));links.append(b);});}
    if(entry.showCertificates){const fold=node('details','experience-certificates');fold.append(node('summary','',`${certificates.length} Google Professional Certificates`));const list=node('ul');certificates.forEach(c=>list.append(node('li','',c)));fold.append(list);links.append(fold);}
    buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===selected)));previous.disabled=selected===0;next.disabled=selected===entries.length-1;progress.textContent=`${selected+1} / ${entries.length}`;
    if(engine&&!fromScene)engine.select(selected);
  }
  previous.addEventListener('click',()=>select(selected-1));next.addEventListener('click',()=>select(selected+1));
  choices.addEventListener('keydown',event=>{let i=selected;if(event.key==='ArrowRight')i++;else if(event.key==='ArrowLeft')i--;else if(event.key==='Home')i=0;else if(event.key==='End')i=entries.length-1;else return;event.preventDefault();select(i);buttons[selected].focus();});
  const fallback=node('div','experience-fallback');fallback.append(node('span','',kind==='stack'?'◉ — ◇ — ◉':'2023 — 2024 — 2025 — 2026'),node('p','',kind==='stack'?'Explore the disciplines and the work that connects them.':'Explore each milestone using the chapter controls.'));
  root.append(canvas,fallback,heading,inspector,choices,hint);select(0);
  let disposed=false,booted=false;
  const observer=new IntersectionObserver(async observations=>{
    if(booted||!observations.some(entry=>entry.isIntersecting))return;booted=true;
    try{const {createSpatialExperience}=await import('../spatial/experience3d.js');engine=await createSpatialExperience({canvas,kind,entries,onSelect:i=>select(i,true)});if(disposed){engine.dispose();return;}root.dataset.ready='';engine.select(selected);}
    catch(error){root.dataset.fallback='';console.warn(`${kind} 3D unavailable; accessible controls remain available.`,error);}
  });
  observer.observe(root);
  root.destroy=()=>{disposed=true;observer.disconnect();engine?.dispose();};return root;
}
