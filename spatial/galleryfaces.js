// Art-directed project covers, drawn as native canvas graphics. These are
// portfolio compositions, not screenshots or reproductions of project UIs.
import { drawSectionFace } from './sectionfaces.js';
const W = 1400, H = 1050;
const SANS = '"Instrument Sans", sans-serif';
function text(x, value, px, py, size = 24, color = '#fff', font = SANS, weight = 500) {
  x.font = `${weight} ${size}px ${font}`; x.fillStyle = color;
  x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(value, px, py);
}
function box(x, px, py, w, h, color, radius = 0) {
  x.fillStyle = color; x.beginPath(); x.roundRect(px, py, w, h, radius); x.fill();
}
function line(x, points, color, width = 2) {
  x.strokeStyle = color; x.lineWidth = width; x.beginPath();
  points.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.stroke();
}
function circle(x, px, py, r, color) {
  x.fillStyle = color; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
}
function header(x, brand, category, color) {
  text(x, brand, 62, 72, 25, color, SANS, 700);
  x.font = `500 19px ${SANS}`;
  text(x, category, W - 62 - x.measureText(category).width, 72, 19, color);
}

function water(x, item, time) {
  box(x, 0, 0, W, H, '#dcece1');
  // Contour rings suggest a water surface, without inventing scientific data.
  x.save(); x.translate(1080, 565); x.scale(1, 0.84);
  for (let r = 460; r > 30; r -= 22) {
    x.strokeStyle = `rgba(13,94,88,${0.08 + (460-r)/1800})`; x.lineWidth = 3;
    const radius = (r + time * 22) % 460;
    x.beginPath(); x.ellipse(0, 0, radius, radius * 0.92, 0.35, 0, Math.PI * 2); x.stroke();
  }
  x.restore();
  header(x, 'FIELDNOTES / WATER', 'RESEARCH  •  2000—2025', '#163f3a');
  text(x, 'Reading', 65, 288, 158, '#163f3a', 'Georgia, serif', 400);
  text(x, 'the water.', 65, 446, 158, '#163f3a', 'Georgia, serif', 400);
  text(x, 'Four models. Five parameters.', 73, 515, 30, '#315e54');
  text(x, 'A machine-learning study of UK water quality.', 73, 558, 25, '#315e54');
  box(x, 75, 651, 570, 205, '#163f3a', 6);
  text(x, item.stat, 103, 757, 96, '#e6f4df');
  text(x, 'TARGET SAMPLES / APPROX. TOTAL', 106, 806, 20, '#a7cdb7');
  box(x, 810, 618, 415, 216, '#f6f8e9', 6);
  text(x, 'XGBOOST × WATER TEMPERATURE', 839, 660, 18, '#45655c');
  text(x, '+0.785', 835, 756, 88, '#163f3a');
  text(x, 'Best test R²', 843, 800, 22, '#45655c');
}

function nvidia(x, item, time) {
  box(x, 0, 0, W, H, '#10150e');
  header(x, 'NVIDIA / SUPPLY INTELLIGENCE', 'POWER BI  /  SYSTEMS THINKING', '#bbef53');
  text(x, 'Inside the', 66, 229, 102, '#ebf0df');
  text(x, 'AI supply chain.', 66, 342, 102, '#bbef53');
  // Chip routing is a schematic illustration of the system being studied.
  const cx = 1015, cy = 602;
  for (let i = 0; i < 9; i++) {
    const a = 455 + i * 34;
    line(x, [[845,a],[780-i*17,a],[780-i*17,840]], '#426225', 3);
    line(x, [[1185,a],[1240+i*12,a],[1240+i*12,390]], '#426225', 3);
    const progress = (time * 0.35 + i * 0.11) % 1;
    circle(x,780-i*17,840-(840-a)*progress,5,'#caff75');
    circle(x,1240+i*12,390+(a-390)*progress,4,'#caff75');
  }
  box(x, cx-177, cy-177, 354, 354, '#b8ec50', 20);
  box(x, cx-145, cy-145, 290, 290, '#19230f', 10);
  text(x, 'AI', cx-98, cy+39, 124, '#c6fa61', SANS, 700);
  text(x, 'FORECAST → CAPACITY → DELIVERY', 68, 415, 22, '#a6ae9a');
  (item.metrics || []).slice(0,3).forEach((m,i) => {
    const y = 526 + i*118;
    line(x, [[72,y-45],[670,y-45]], '#37432a', 1);
    text(x, m.v, 73, y+26, 66, '#eaf0df');
    text(x, m.k, 360, y+17, 25, '#a6ae9a');
  });
}

function vision(x, item, time) {
  box(x, 0, 0, 700, H, '#f5aa8d'); box(x, 700, 0, 700, H, '#d9c9f0');
  header(x, 'VISION LAB', 'COMPUTER VISION / PYTORCH', '#292137');
  text(x, 'A face.', 62, 235, 135, '#292137', 'Georgia, serif', 400);
  text(x, 'Two ways to see it.', 65, 322, 64, '#292137', 'Georgia, serif', 400);
  text(x, 'DenseNet', 66, 472, 76, '#292137');
  text(x, 'ResNet', 775, 472, 76, '#292137');
  // Geometric face meshes are conceptual architecture art, not face samples.
  for (let side=0; side<2; side++) {
    const pts=[]; const cx=side*700+360;
    for(let r=0;r<8;r++) for(let c=0;c<7;c++) {
      const nx=(c-3)/3, ny=(r-3.5)/3.5;
      const turn = Math.sin(time * 0.65 + side * 0.7) * 0.5;
      const px=cx+nx*155*Math.sqrt(1-ny*ny*0.5)*Math.cos(turn)+Math.sqrt(Math.max(0,1-nx*nx))*45*Math.sin(turn), py=665+ny*142;
      pts.push([px,py]);
      if(c>0) line(x,[pts[pts.length-2],[px,py]],'#5c4466',1.4);
      if(r>0) line(x,[pts[pts.length-8],[px,py]],'#5c4466',1.4);
      if(side===0 && r>0 && c>0) line(x,[pts[pts.length-9],[px,py]],'#a5666c',1);
      circle(x,px,py,3.5,'#292137');
    }
  }
  const best=(item.configs||[]).reduce((a,b)=>b.accuracy>(a?.accuracy||0)?b:a,null);
  text(x, best ? `${(best.accuracy*100).toFixed(2)}% best accuracy` : 'Architecture comparison', 65, 868, 29, '#292137');
}

function conference(x, item, time) {
  box(x,0,0,W,H,'#304de3');
  header(x,'ASSEMBLY / CONFERENCE PLATFORM','MICROSERVICES  •  AWS','#e4eaff');
  text(x,'Small services.',65,228,112,'#f0f0e5');
  text(x,'Big conversations.',65,343,112,'#f0f0e5');
  const labels=['Client','REST API','Kubernetes','AWS'];
  labels.forEach((label,i)=>{
    const px=78+i*325, py=475+(i%2)*120+Math.sin(time*0.8+i)*18;
    if(i<3) line(x,[[px+245,py+80],[px+288,py+80],[px+288,475+((i+1)%2)*120+80],[px+325,475+((i+1)%2)*120+80]],'#96a8ff',3);
    box(x,px,py,244,156,i===1?'#dafc78':'#f1eee4',8);
    text(x,`0${i+1}`,px+22,py+40,20,'#304de3'); text(x,label,px+22,py+108,34,'#25367a');
  });
  text(x,`${item.figs?.endpoints || 5} endpoints. One connected system.`,78,841,35,'#edf0ff');
}

function retail(x,item,time) {
  box(x,0,0,W,H,'#f1e8d8'); header(x,'THE RETAIL REPORT','PYTHON / PANDAS / ANALYTICS','#823d28');
  text(x,'The price',65,249,146,'#823d28','Georgia, serif',400);
  text(x,'of a discount.',65,397,146,'#823d28','Georgia, serif',400);
  text(x,`${item.figs?.rows || '2,121'} transactions. A closer look at profit.`,72,475,31,'#7c6553');
  const colors=['#d77549','#a9442a','#d59b70','#8f4b38','#b88a58'];
  // Editorial receipt strips carry methods, not made-up transaction values.
  ['EXTRACT','CLEAN','ANALYSE','COMPARE','EXPLAIN'].forEach((name,i)=>{
    const px=77+i*253, py=572+(i%2)*48+Math.sin(time*0.85+i*0.9)*24;
    box(x,px,py,221,245,colors[i]);
    text(x,name,px+18,py+40,20,'#fff2df'); text(x,`0${i+1}`,px+17,py+205,92,'#fff2df');
  });
}

function register(x,item,time) {
  box(x,0,0,W,H,'#dfe6ef'); header(x,'ABONA TARN / OPERATIONS','ITIL 4  /  CONFIGURATION MANAGEMENT','#233b5d');
  text(x,'Everything',64,251,133,'#233b5d'); text(x,'in its place.',64,387,133,'#233b5d');
  const metrics=[[String(item.figs?.stores||87),'STORES'],[String(item.figs?.kpis||7),'DESIGNED KPIs'],[item.figs?.accuracy||'95%+','CI ACCURACY TARGET']];
  metrics.forEach(([value,label],i)=>{
    const px=72+i*430;
    box(x,px,519,398,290,['#263e60','#597999','#f8f7ef'][i],12);
    const ink=i===2?'#233b5d':'#f5f2e9';
    line(x,[[px+24,577],[px+374,577]],i===2?'#b8c7d6':'#91a8bd',2);
    text(x,value,px+26,712,101,ink); text(x,label,px+29,762,23,ink);
    const progress=(time*0.2+i*0.3)%1;
    line(x,[[px+24,790],[px+24+350*progress,790]],i===2?'#597999':'#dfe6ef',4);
  });
  text(x,'A configuration strategy for a connected retailer.',76,872,28,'#233b5d');
}

function balance(x,item,time) {
  box(x,0,0,W,H,'#efe3f0'); header(x,'BALANCE / A LITTLE ROOM FOR YOU','USER-CENTRED DESIGN','#593c61');
  text(x,'Make room',66,252,128,'#593c61','Georgia, serif',400);
  text(x,'for living.',66,383,128,'#593c61','Georgia, serif',400);
  text(x,'A calmer relationship with work.',73,457,30,'#795d7e');
  x.save(); x.translate(1020,590); x.rotate(0.10);
  box(x,-177,-308,354,603,'#593c61',47); box(x,-163,-294,326,576,'#fcf6ee',36);
  box(x,-55,-283,110,22,'#593c61',12);
  text(x,'Your breathing space',-137,-214,23,'#593c61');
  circle(x,0,-68,88+Math.sin(time*0.85)*15,'#cedaaf'); text(x,'Pause.',-70,-52,46,'#4c6341','Georgia, serif');
  text(x,'ONE THING AT A TIME',-136,93,17,'#795d7e');
  ['Focus time','A little movement','Switch off'].forEach((s,i)=>{box(x,-140,113+i*46,280,36,'#eee6ed',10);text(x,s,-122,138+i*46,18,'#593c61');});
  x.restore();
  ['Personas','Priorities','Prototype','Evaluation'].forEach((s,i)=>text(x,`0${i+1}  ${s}`,75,590+i*66,32,'#795d7e'));
  text(x,'Concept interface / UCD study',844,919,19,'#795d7e');
}

function saudi(x,item,time) {
  box(x,0,0,W,H,'#073d32'); header(x,'VISION / 2030','PUBLIC SECTOR  •  POWER BI','#ddd5a8');
  text(x,'Progress,',65,252,145,'#efe8c9','Georgia, serif',400);
  text(x,'in perspective.',65,399,145,'#efe8c9','Georgia, serif',400);
  // Abstract architectural arches; no fabricated progress percentages.
  for(let i=0;i<5;i++) {
    const px=75+i*265, py=566-(i%3)*25+Math.sin(time*0.6+i*0.6)*22;
    box(x,px,py,232,400,['#a7b98b','#d9d0a3','#5c9274','#e9dfba','#8aaa83'][i], [116,116,0,0]);
    box(x,px+47,py+114,138,330,'#073d32',[69,69,0,0]);
  }
  text(x,'Saudi Vision 2030 / An indicator study',75,490,28,'#b8c5a7');
}

function github(x,item,time) {
  box(x,0,0,W,H,'#201c26'); header(x,'NA / OPEN SOURCE','ALWAYS A WORK IN PROGRESS','#d5c7ec');
  text(x,'Built to',65,247,149,'#f0eaf6'); text(x,'be opened.',65,400,149,'#cba6f7');
  const labels=['data','machine-learning','business-intelligence','architecture'];
  labels.forEach((s,i)=>{
    const px=75+(i%2)*642, py=518+Math.floor(i/2)*157+Math.sin(time*0.75+i)*13;
    box(x,px,py,605,132,i===0?'#d1b3f0':'#342c3e',10);
    const ink=i===0?'#2b2039':'#e7d9f3'; text(x,'↗',px+24,py+52,32,ink);
    text(x,s,px+25,py+98,30,ink);
  });
  text(x,`${item.figs?.repos || '15+'} public repositories. All sources open.`,77,890,32,'#d5c7ec');
}

const designs = { matrix: water, kpis: nvidia, versus: vision, blueprint: conference,
  analytics: retail, register, screens: balance, dials: saudi, commits: github };

const palettes = {
  matrix: ['#dcece1','#163f3a','#f6f8e9'], kpis: ['#10150e','#bbef53','#26361c'],
  versus: ['#e7d8ed','#55395e','#f2bc98'], blueprint: ['#2346d9','#fff4d2','#1735a7'],
  analytics: ['#eee7da','#843b2c','#e0b19a'], register: ['#dce4e9','#253c50','#f3f5ef'],
  screens: ['#e8d8ec','#593c61','#cedaaf'], dials: ['#073d32','#efe8c9','#5c9274'],
  commits: ['#201c26','#d5c7ec','#342c3e'],
};
function detail(x,item,time) {
  const [bg,ink,card] = palettes[item.face] || palettes.commits;
  box(x,0,0,W,H,bg);
  header(x,item.kind.toUpperCase(),'THE PROJECT / IN DETAIL',ink);
  const headings = {matrix:'What the water tells us.', kpis:'From signals to decisions.', versus:'Two models. One benchmark.', blueprint:'One platform. Many services.', analytics:'Behind every transaction.', register:'Every asset, accounted for.', screens:'Make room for yourself.', dials:'Measuring a national vision.', commits:'Explore the source.'};
  text(x,headings[item.face],65,230,75,ink,'Georgia, serif',400);
  const values = item.metrics?.map(m=>[m.v,m.k]) || (item.figs?.steps ? item.figs.steps.map((step,i)=>[`0${i+1}`,step]) : item.figs ? Object.entries(item.figs).map(([k,v])=>[v,k]) : item.tags.map((tag,i)=>[`0${i+1}`,tag]));
  values.slice(0,4).forEach(([value,label],i)=>{
    const px=65+(i%2)*652, py=305+Math.floor(i/2)*235;
    box(x,px,py,620,210,card,8);
    text(x,String(value),px+30,py+108,Math.min(65,870/String(value).length),ink);
    text(x,String(label),px+32,py+163,22,ink);
  });
  text(x,item.tags.join('  /  '),70,880,24,ink);
  box(x,70,917,1260,3,card);
  box(x,70,917,1260*((time%20)/20),3,ink);
}

export function drawGalleryFace(item, dpr = 1, time = 0, existing = null) {
  if (item.sectionKind) return drawSectionFace(item,dpr,time,existing);
  const c = existing || document.createElement('canvas');
  if (!existing) { c.width=W*dpr; c.height=H*dpr; }
  const x=c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0);
  // An authored, looping page walkthrough: hold the cover, scroll into
  // evidence, then return. Reduced-motion callers pass time zero.
  const phase = time%20;
  const ease = t => t*t*(3-2*t);
  const progress = phase<7 ? 0 : phase<9 ? ease((phase-7)/2) : phase<16 ? 1 : phase<18 ? 1-ease((phase-16)/2) : 0;
  x.save(); x.beginPath(); x.rect(0,0,W,H); x.clip();
  x.translate(0,-H*progress);
  (designs[item.face] || github)(x,item,time);
  if(progress>0) { x.translate(0,H); detail(x,item,time); }
  x.restore();
  return c;
}
