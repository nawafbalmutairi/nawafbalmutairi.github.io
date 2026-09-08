// Original motion posters for the skill atlas and chronological ribbon.
export function drawSectionFace(item,dpr,time,existing){
 const c=existing||document.createElement('canvas');if(!existing){c.width=1400*dpr;c.height=1050*dpr;}
 const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.textBaseline='alphabetic';x.globalAlpha=1;
 const palettes=[['#dcebe2','#163f36','#5d9c83'],['#241e32','#eddef6','#b89be3'],['#243ec4','#f4efd7','#d6f66e'],['#ead8cb','#593c32','#b87852']];
 const [bg,ink,accent]=palettes[item.posterIndex%4];x.fillStyle=bg;x.fillRect(0,0,1400,1050);
 const text=(s,px,py,size,color=ink,font='Instrument Sans')=>{x.fillStyle=color;x.font=`500 ${size}px "${font}", sans-serif`;x.textAlign='left';x.fillText(s,px,py);};
 text(item.sectionKind==='skills'?'THE STACK / AN APPLIED ATLAS':'THE JOURNEY / CHAPTER '+String(item.posterIndex+1).padStart(2,'0'),65,76,23);
 text(item.kicker.toUpperCase(),1040,76,22);
 if(item.sectionKind==='skills'){
   const titles=[['From data','to decisions.'],['Learn. Test.','Compare.'],['Systems,','connected.'],['People before','pixels.']][item.posterIndex];
   text(titles[0],65,252,118);text(titles[1],65,382,118);
   if(item.posterIndex===0){for(let i=0;i<15;i++){const h=70+(Math.sin(i*.6+time*.5)+1)*95;x.fillStyle=i%4===0?ink:accent;x.fillRect(75+i*85,790-h,60,h);}text('COLLECT → MODEL → EXPLAIN',75,860,26);}
   if(item.posterIndex===1){for(let layer=0;layer<5;layer++)for(let row=0;row<4;row++){const px=100+layer*295,py=510+row*85; x.strokeStyle=accent;x.globalAlpha=.2;for(let next=0;next<4&&layer<4;next++){x.beginPath();x.moveTo(px,py);x.lineTo(px+295,510+next*85);x.stroke();}x.globalAlpha=1;x.fillStyle=(row+layer+Math.floor(time))%4===0?ink:accent;x.beginPath();x.arc(px,py,11,0,Math.PI*2);x.fill();}}
   if(item.posterIndex===2){['CLIENT','API','DATA','CLOUD'].forEach((v,i)=>{const px=75+i*320,py=540+(i%2)*95; x.strokeStyle=accent;x.lineWidth=2;x.strokeRect(px,py,275,145);text(v,px+24,py+82,32);if(i<3){text('→',px+283,py+88,32,accent);}});}
   if(item.posterIndex===3){['Listen','Sketch','Test'].forEach((v,i)=>{const px=280+i*425,py=650+Math.sin(time*.5+i)*15;x.fillStyle=i===1?ink:accent;x.beginPath();x.arc(px,py,160,0,Math.PI*2);x.fill();text(v,px-95,py+15,50,bg,'Georgia');});}
   text(item.tags.slice(0,5).join('   /   '),72,943,24);
 }else{
   text(item.year,65,410,340,ink,'Georgia');
   text(item.posterTitle,76,510,65);
   x.strokeStyle=accent;x.lineWidth=3;x.beginPath();x.moveTo(80,626);x.lineTo(1320,626);x.stroke();
   const milestones=item.milestones.slice(0,3);
   milestones.forEach((m,i)=>{const px=85+i*(1170/Math.max(1,milestones.length));x.fillStyle=accent;x.beginPath();x.arc(px,626,9+Math.sin(time+i)*2,0,Math.PI*2);x.fill();text(m.t,px,690,26);const words=m.title.split(' ');let line='',y=750;for(const word of words){if((line+word).length>24){text(line,px,y,27);line='';y+=38;}line+=word+' ';}if(line)text(line,px,y,27);});
   text(item.posterIndex===0?'NORTHUMBRIA UNIVERSITY  /  COMPUTER SCIENCE':item.posterIndex===3?'CLASS OF 2026  /  RIYADH':'A CHAPTER BUILT THROUGH PROJECTS',75,936,22);
 }
 return c;
}
