const THREE_URL='https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

export async function createSpatialExperience({canvas,kind,entries,onSelect}){
  const T=await import(/* @vite-ignore */ THREE_URL);
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(43,1,.1,100);
  scene.add(new T.HemisphereLight(0xc9e8ee,0x44301e,2.1));
  const key=new T.DirectionalLight(0xffc995,4);key.position.set(4,8,7);scene.add(key);
  const rim=new T.PointLight(0x6adfcb,55,22);rim.position.set(-5,3,-4);scene.add(rim);
  const world=new T.Group();scene.add(world);
  const colors=[0x72cfb5,0xb49ae9,0x7daafa,0xe9a975];
  const geometries=new Set(),materials=new Set(),textures=new Set();
  function geo(g){geometries.add(g);return g;}
  function mat(m){materials.add(m);return m;}
  const metal=mat(new T.MeshStandardMaterial({color:0x24313a,metalness:.72,roughness:.28}));
  const warm=mat(new T.MeshStandardMaterial({color:0xe4ac74,metalness:.68,roughness:.25}));
  function lit(color,opacity=1){return mat(new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1}));}
  function body(geometry,material,parent=world){const mesh=new T.Mesh(geo(geometry),material);parent.add(mesh);return mesh;}
  function tube(points,color,radius=.018,opacity=.7,parent=world){const curve=new T.CatmullRomCurve3(points);return body(new T.TubeGeometry(curve,Math.max(40,points.length*12),radius,6,false),lit(color,opacity),parent);}
  function ring(radius,color,opacity=.5,parent=world){const mesh=body(new T.TorusGeometry(radius,.012,6,96),lit(color,opacity),parent);mesh.rotation.x=-Math.PI/2;return mesh;}
  await document.fonts.ready;
  function label(text,color='#d9e9e5'){
    const c=document.createElement('canvas');c.width=768;c.height=120;const x=c.getContext('2d');
    x.fillStyle=color;x.font='500 42px "Instrument Sans",sans-serif';x.textAlign='center';x.fillText(text,384,64);
    const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;textures.add(texture);
    const sprite=new T.Sprite(mat(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false})));
    sprite.scale.set(2.65,.414,1);return sprite;
  }
  // A softly lit pool anchors objects without a tiled floor or image backdrop.
  const pool=body(new T.PlaneGeometry(22,18),mat(new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv; void main(){vec2 p=(vUv-.5)*2.0;float a=exp(-dot(p,p)*3.5)*.19;gl_FragColor=vec4(.13,.24,.23,a);}'
  })));pool.rotation.x=-Math.PI/2;pool.position.y=-1.55;
  const dust=[];for(let i=0;i<110;i++)dust.push(Math.sin(i*12.98)*10,-1+((i*31)%53)/14,Math.cos(i*7.43)*6);
  const dustGeo=geo(new T.BufferGeometry());dustGeo.setAttribute('position',new T.Float32BufferAttribute(dust,3));
  world.add(new T.Points(dustGeo,mat(new T.PointsMaterial({color:0xc8b69c,size:.021,transparent:true,opacity:.35,depthWrite:false}))));
  const groups=[],pickables=[],halos=[],labels=[];let centerObject,traveler,pathCurve;
  const hitMat=mat(new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  const positions=entries.map((_,i)=>new T.Vector3((i-(entries.length-1)/2)*2.35,-.9+i*.24,Math.sin(i*.83)*1.65));
  function pickSphere(parent,index,radius){const hit=body(new T.SphereGeometry(radius,12,8),hitMat,parent);hit.userData.index=index;pickables.push(hit);}
  if(kind==='stack'){
    centerObject=body(new T.TorusKnotGeometry(.68,.19,112,12,2,3),warm);centerObject.position.y=.2;
    const cage=body(new T.IcosahedronGeometry(1.22,1),mat(new T.MeshBasicMaterial({color:0xa9c7c5,wireframe:true,transparent:true,opacity:.12})));cage.position.y=.2;
    const coreLabel=label('BUILD / CONNECT / LEARN');coreLabel.scale.multiplyScalar(.88);coreLabel.position.set(0,-1.1,0);world.add(coreLabel);
    [3.35,3.9,4.45].forEach((r,i)=>{const orbit=ring(r,i===1?0xcfad82:0x88b6b0,.16);orbit.scale.z=.70;orbit.position.y=-.6+i*.06;});
    entries.forEach((entry,i)=>{
      const group=new T.Group();world.add(group);groups.push(group);
      const material=mat(new T.MeshStandardMaterial({color:colors[i],metalness:.48,roughness:.28,emissive:colors[i],emissiveIntensity:.1}));
      const base=body(new T.CylinderGeometry(.79,.9,.13,48),metal,group);base.position.y=-.43;
      const halo=ring(.94,colors[i],.75,group);halo.position.y=-.48;halos.push(halo);
      if(i===0){[.48,.83,1.18,.66,.95].forEach((h,j)=>{const bar=body(new T.CylinderGeometry(.12,.12,h,12),material,group);bar.position.set((j-2)*.27,h/2-.37,0);});}
      if(i===1){const points=[];for(let j=0;j<7;j++){const p=new T.Vector3(Math.cos(j*2.4)*.6,Math.sin(j*1.5)*.5+.2,Math.sin(j*2.4)*.6);points.push(p);const dot=body(new T.IcosahedronGeometry(.12,1),material,group);dot.position.copy(p);}points.forEach((p,j)=>tube([p,points[(j+2)%7]],colors[i],.013,.7,group));}
      if(i===2){[[0,.05,0],[-.34,.53,0],[.34,.53,0],[0,1.01,0]].forEach(([x,y,z])=>{const block=body(new T.BoxGeometry(.43,.43,.43),material,group);block.position.set(x,y,z);block.rotation.y=Math.PI/4;});}
      if(i===3){for(let j=0;j<3;j++){const loop=body(new T.TorusGeometry(.48,.085,12,48),material,group);loop.position.set((j-1)*.25,.28,0);loop.rotation.set(j*.65,j*.8,.2);}}
      const name=label(`${String(i+1).padStart(2,'0')} / ${entry.sceneLabel}`);name.position.y=1.66;group.add(name);labels.push(name);pickSphere(group,i,1.1);
    });
  }else{
    // A continuous rising route and eight physical waypoints, not floating posters.
    const curvePoints=positions.map(p=>p.clone().add(new T.Vector3(0,.19,0)));
    pathCurve=new T.CatmullRomCurve3(curvePoints);
    body(new T.TubeGeometry(pathCurve,180,.037,8,false),lit(0xe9a776,.85));
    const echo=body(new T.TubeGeometry(pathCurve,180,.1,8,false),lit(0xb57e50,.09));echo.position.y=-.05;
    traveler=body(new T.SphereGeometry(.105,16,12),lit(0xffe0a3));
    entries.forEach((entry,i)=>{
      const group=new T.Group();group.position.copy(positions[i]);world.add(group);groups.push(group);
      const color=i===entries.length-1?0x8fddc2:0xcba079;
      const material=mat(new T.MeshStandardMaterial({color:i%2?0x40545c:0x344148,metalness:.65,roughness:.3}));
      body(new T.CylinderGeometry(.62,.79,.24,6),material,group).rotation.y=Math.PI/6;
      const stem=body(new T.CylinderGeometry(.055,.09,1.4,10),warm,group);stem.position.y=.76;
      const jewel=body(new T.OctahedronGeometry(.21,0),lit(color),group);jewel.position.y=1.52;
      const halo=ring(.82,color,.65,group);halo.position.y=.16;halos.push(halo);
      // Suspended plinths make elevation readable in the landscape.
      const footing=body(new T.CylinderGeometry(.18,.4,.7,6),metal,group);footing.position.y=-.48;
      const name=label(entry.label);name.position.y=2.03;group.add(name);labels.push(name);pickSphere(group,i,.9);
      const hit=body(new T.SphereGeometry(.38,10,8),hitMat,group);hit.position.y=1.5;hit.userData.index=i;pickables.push(hit);
    });
  }
  let selected=0,rotation=0,targetRotation=0,pathProgress=0,targetProgress=0,elapsed=0,raf=0,last=0,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const host=canvas.closest('.scene'),look=new T.Vector3(),targetLook=new T.Vector3();
  const events=new AbortController();
  function select(i){selected=Math.max(0,Math.min(entries.length-1,i));if(kind==='stack')targetRotation=-selected*Math.PI/2-.52;else targetProgress=selected/(entries.length-1);kick();}
  function size(){const w=canvas.clientWidth||700,h=canvas.clientHeight||650;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
  function active(){return !disposed&&!document.hidden&&(!host||host.hasAttribute('data-active'))&&!document.querySelector('.study[data-open]');}
  function frame(now){raf=0;if(!active())return;const dt=Math.min((now-(last||now))/1000,.05);last=now;elapsed+=dt;size();const damping=reduced.matches?1:1-Math.exp(-dt*5);
    rotation+=(targetRotation-rotation)*damping;pathProgress+=(targetProgress-pathProgress)*damping;
    const narrow=camera.aspect<.85;
    if(kind==='stack'){
      camera.position.set(0,narrow?6.6:5.2,narrow?17.5:13.3);camera.lookAt(0,.15,0);
      groups.forEach((g,i)=>{const angle=i*Math.PI/2+rotation;g.position.set(Math.sin(angle)*3.9,.18+Math.sin(angle*2)*.35,Math.cos(angle)*2.6);if(!reduced.matches)g.position.y+=Math.sin(elapsed*.7+i)*.08;g.rotation.y=elapsed*(reduced.matches?0:.08);});
      centerObject.rotation.set(elapsed*(reduced.matches?0:.12),elapsed*(reduced.matches?0:.17),.25);
    }else{
      const p=pathCurve.getPointAt(pathProgress);targetLook.copy(p).multiplyScalar(.48);targetLook.y=.5;look.lerp(targetLook,damping);
      camera.position.set(look.x+Math.sin(rotation)*5,9.8,narrow?23:18);camera.lookAt(look.x,.25,look.z);
      traveler.position.copy(p);traveler.position.y+=.12;
    }
    halos.forEach((h,i)=>{h.material.opacity=i===selected?.95:.22;const pulse=i===selected&&!reduced.matches?1+Math.sin(elapsed*2)*.04:1;h.scale.setScalar(pulse);});
    labels.forEach((l,i)=>l.material.opacity=i===selected?1:.7);
    renderer.render(scene,camera);
    if(!reduced.matches||Math.abs(rotation-targetRotation)>.001||Math.abs(pathProgress-targetProgress)>.001)raf=requestAnimationFrame(frame);
  }
  function kick(){if(!raf&&active()){last=performance.now();raf=requestAnimationFrame(frame);}}
  const ray=new T.Raycaster(),pointer=new T.Vector2();
  function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(pickables,false)[0]?.object.userData.index;}
  let dragging=false,startX=0,lastX=0,moved=0,wheel=0;
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;startX=lastX=event.clientX;moved=0;canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';},{signal:events.signal});
  canvas.addEventListener('pointermove',event=>{if(dragging){const delta=event.clientX-lastX;lastX=event.clientX;moved+=Math.abs(delta);targetRotation+=delta*.006;if(kind==='journey')targetRotation=Math.max(-.65,Math.min(.65,targetRotation));kick();}else canvas.style.cursor=hit(event)!=null?'pointer':'grab';},{signal:events.signal});
  canvas.addEventListener('pointerup',event=>{if(!dragging)return;dragging=false;canvas.releasePointerCapture(event.pointerId);canvas.style.cursor='grab';if(moved<7){const i=hit(event);if(i!=null){select(i);onSelect(i);}}},{signal:events.signal});
  canvas.addEventListener('pointercancel',()=>{dragging=false;canvas.style.cursor='grab';},{signal:events.signal});
  canvas.addEventListener('wheel',event=>{event.preventDefault();wheel+=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:1);if(Math.abs(wheel)>90){const i=Math.max(0,Math.min(entries.length-1,selected+Math.sign(wheel)));wheel=0;if(i!==selected){select(i);onSelect(i);}}},{passive:false,signal:events.signal});
  const resize=new ResizeObserver(()=>kick());resize.observe(canvas);
  const visibility=new MutationObserver(()=>kick());if(host)visibility.observe(host,{attributes:true,attributeFilter:['data-active']});
  const study=document.querySelector('.study');if(study)visibility.observe(study,{attributes:true,attributeFilter:['data-open']});
  document.addEventListener('visibilitychange',kick,{signal:events.signal});reduced.addEventListener('change',kick,{signal:events.signal});
  select(0);size();kick();
  return {select,dispose(){disposed=true;if(raf)cancelAnimationFrame(raf);events.abort();resize.disconnect();visibility.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();}};
}
