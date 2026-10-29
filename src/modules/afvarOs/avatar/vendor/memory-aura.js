// Vendored from https://github.com/Sudhakarrupnar/AFVAR_Avatar_Final @ 4e0d45e (public/avatar/AFVAR/memory-aura.js).
// Keep in sync with the avatar repo; do not edit here — change it there and re-vendor.
// Procedural 3D hologram: no images, texture loads, or baked animation frames.
// All geometry is scene-anchored and all moving data reuses fixed typed buffers.
const FLOOR_Y=-.025,LAYERS=3,BUBBLES=96,LOW_BUBBLES=32,LOOPS=4,SEGMENTS=64,PACKETS=4;
const bound=(v,lo,hi,fallback=0)=>Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):fallback;
export const MEMORY_AURA_PHASES={idle:.28,ready:.28,listening:.4,connecting:.85,processing:1,thinking:1,speaking:.58,serious:.4,error:.2};

export function createMemoryAura(T,scene){
  const group=new T.Group();group.name='Procedural_ground_hologram';group.position.y=FLOOR_Y;scene.add(group);
  let disposed=false,time=0,energy=.28,speed=.746,quality='balanced',reduced=false,bubbleCount=BUBBLES,loopCount=LOOPS;
  let endX=0,endY=.89,endZ=0,platformHeight=.42;
  const ringGroups=[],ringMaterials=[],ringSpeeds=[.10,-.18,.24],ringRadii=[2.2,1.78,1.31];
  function ringGeometry(radius,layer){
    const positions=[],colors=[],edges=[];
    function vertex(r,a,intensity,edge){positions.push(Math.cos(a)*r,0,Math.sin(a)*r);colors.push(.002*intensity,.59*intensity,intensity);edges.push(edge);}
    function band(r,width,start,end,steps,intensity=1){
      const spread=Math.max(.026,width*2.8),inner=r-spread*.5,outer=r+spread*.5;
      for(let n=0;n<steps;n++){
        const a=start+(end-start)*n/steps,b=start+(end-start)*(n+1)/steps;
        vertex(inner,a,intensity,-1);vertex(outer,a,intensity,1);vertex(outer,b,intensity,1);
        vertex(inner,a,intensity,-1);vertex(outer,b,intensity,1);vertex(inner,b,intensity,-1);
      }
    }
    const TAU=Math.PI*2;
    band(radius,layer===1?.045:.021,0,TAU,160,1);
    band(radius-.085,.012,0,TAU,144,.7);
    const ticks=layer===0?128:layer===1?80:48;
    for(let i=0;i<ticks;i++){
      const major=i%8===0,angle=i/ticks*TAU;
      band(radius-(major?.16:.13),major?.19:.075,angle,angle+(major?.009:.004),1,major?1:.64);
    }
    const sectors=layer===0?12:layer===1?16:8;
    for(let i=0;i<sectors;i++){
      const a=i/sectors*TAU,gap=i%3===0?.11:.045;
      band(radius*.78,layer===1?.075:.045,a+gap,a+TAU/sectors-.07,12,i%3===0?.9:.65);
      band(radius*.66,.012,a+.04,a+TAU/sectors-.15,10,.68);
    }
    if(layer===0){
      for(let i=0;i<8;i++){
        const a=i/8*TAU;
        band(radius+.075,.12,a-.015,a+.015,1,.9);
        band(radius*.49,.01,a+.06,a+.4,8,.4);
      }
    }else if(layer===1){
      band(radius*.55,.025,0,TAU,112,.7);
      for(let i=0;i<48;i++){const a=i/48*TAU;band(radius*.50,.045,a,a+.055,2,.76);}
    }else{
      band(.35,.014,0,TAU,96,.75);band(.30,.009,0,TAU,96,.5);
      for(let i=0;i<12;i++){const a=i/12*TAU;band(radius*.43,.03,a+.04,a+.22,5,.7);}
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('edge',new T.Float32BufferAttribute(edges,1));geometry.computeBoundingSphere();return geometry;
  }
  for(let i=0;i<LAYERS;i++){
    const layer=new T.Group();layer.name='HUD_platform_'+(i+1);layer.userData.angularSpeed=ringSpeeds[i];
    const material=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,uniforms:{uStrength:{value:.76}},
      vertexShader:'attribute vec3 color;attribute float edge;varying vec3 vColor;varying float vEdge;void main(){vColor=color;vEdge=edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:`uniform float uStrength;varying vec3 vColor;varying float vEdge;void main(){float edge=abs(vEdge);float core=1.0-smoothstep(.24,.48,edge);float glow=pow(max(0.0,1.0-edge),2.0)*.42;
      gl_FragColor=vec4(vColor,(core+glow)*uStrength);
      #include <colorspace_fragment>
      }`});
    const rings=new T.Mesh(ringGeometry(ringRadii[i],i),material);rings.name='Concentric_arcs_ticks_'+(i+1);rings.renderOrder=2;layer.add(rings);group.add(layer);ringGroups.push(layer);ringMaterials.push(material);
  }
  // A procedural radial glow under the circular geometry, with no texture map.
  const haloMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{uStrength:{value:.2}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform float uStrength;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.0;
      float rim=exp(-pow((r-.87)/.065,2.0));float center=exp(-r*r*16.0)*.32;
      gl_FragColor=vec4(.015,.63,1.0,(rim+center)*uStrength);
      #include <colorspace_fragment>
    }`});
  const halo=new T.Mesh(new T.RingGeometry(.001,2.5,128),haloMaterial);halo.name='Procedural_projection_glow';halo.rotation.x=-Math.PI/2;halo.position.y=.006;halo.renderOrder=1;group.add(halo);
  const beamMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false,uniforms:{uStrength:{value:.08},uTime:{value:0}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform float uStrength;uniform float uTime;varying vec2 vUv;void main(){
      float ends=pow(max(0.0,sin(vUv.y*3.14159265)),.55);float ribs=pow(.5+.5*cos(vUv.x*50.26548+uTime*.35),10.0);
      gl_FragColor=vec4(.035,.72,1.0,ends*(.45+.55*ribs)*uStrength*(1.0-vUv.y*.55));
      #include <colorspace_fragment>
    }`});
  const beam=new T.Mesh(new T.CylinderGeometry(.15,.62,1,48,1,true),beamMaterial);beam.name='Central_projection_beam';beam.renderOrder=1;group.add(beam);
  const beamDirection=new T.Vector3(),beamUp=new T.Vector3(0,1,0);
  function glowMaterial(bubble=false){return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,uniforms:{uStrength:{value:.8}},
    vertexShader:`attribute vec3 color;attribute float pointSize;attribute float alpha;varying vec3 vColor;varying float vAlpha;
      void main(){vColor=color;vAlpha=alpha;vec4 eye=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*eye;gl_PointSize=clamp(pointSize*12.0/max(.5,-eye.z),2.0,22.0);}`,
    fragmentShader:`uniform float uStrength;varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;
      float soft=1.0-smoothstep(.05,1.0,r);float ring=exp(-pow((r-.54)/.18,2.0));
      gl_FragColor=vec4(vColor,${bubble?'(.68*ring+.62*soft*soft)':'soft*soft'}*vAlpha*uStrength);
      #include <colorspace_fragment>
    }`});}
  const bubblePositions=new Float32Array(BUBBLES*3),bubbleColors=new Float32Array(BUBBLES*3),bubbleSizes=new Float32Array(BUBBLES),bubbleAlpha=new Float32Array(BUBBLES),seeds=new Float32Array(BUBBLES);
  for(let i=0;i<BUBBLES;i++){seeds[i]=(.17+i*.61803398875)%1;bubbleSizes[i]=i%8===0?14:4.0+(i%5)*.85;bubbleColors.set([.025,.70+(i%3)*.08,1],i*3);}
  const bubbleGeometry=new T.BufferGeometry();bubbleGeometry.setAttribute('position',new T.BufferAttribute(bubblePositions,3).setUsage(T.DynamicDrawUsage));bubbleGeometry.setAttribute('color',new T.BufferAttribute(bubbleColors,3));bubbleGeometry.setAttribute('pointSize',new T.BufferAttribute(bubbleSizes,1));bubbleGeometry.setAttribute('alpha',new T.BufferAttribute(bubbleAlpha,1).setUsage(T.DynamicDrawUsage));
  const bubbles=new T.Points(bubbleGeometry,glowMaterial(true));bubbles.name='Ascending_hologram_bubbles';bubbles.frustumCulled=false;bubbles.renderOrder=3;group.add(bubbles);
  const loopPositions=new Float32Array(LOOPS*SEGMENTS*2*3),loopColors=new Float32Array(loopPositions.length),packetPositions=new Float32Array(LOOPS*PACKETS*3),packetColors=new Float32Array(packetPositions.length),packetSizes=new Float32Array(LOOPS*PACKETS).fill(8.5),packetAlpha=new Float32Array(LOOPS*PACKETS).fill(1),packetProgress=new Float32Array(LOOPS*PACKETS);
  for(let p=0;p<LOOPS;p++)for(let n=0;n<SEGMENTS*2;n++){const incoming=n<SEGMENTS;loopColors.set([.02,incoming?.9:.52,1],(p*SEGMENTS*2+n)*3);}
  const loopGeometry=new T.BufferGeometry();loopGeometry.setAttribute('position',new T.BufferAttribute(loopPositions,3).setUsage(T.DynamicDrawUsage));loopGeometry.setAttribute('color',new T.BufferAttribute(loopColors,3));
  const wires=new T.LineSegments(loopGeometry,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.24,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));wires.name='Bidirectional_data_loops';wires.frustumCulled=false;wires.renderOrder=2;group.add(wires);
  const packetGeometry=new T.BufferGeometry();packetGeometry.setAttribute('position',new T.BufferAttribute(packetPositions,3).setUsage(T.DynamicDrawUsage));packetGeometry.setAttribute('color',new T.BufferAttribute(packetColors,3).setUsage(T.DynamicDrawUsage));packetGeometry.setAttribute('pointSize',new T.BufferAttribute(packetSizes,1));packetGeometry.setAttribute('alpha',new T.BufferAttribute(packetAlpha,1));packetGeometry.setAttribute('progress',new T.BufferAttribute(packetProgress,1).setUsage(T.DynamicDrawUsage));
  const packets=new T.Points(packetGeometry,glowMaterial());packets.name='Incoming_and_outgoing_packets';packets.frustumCulled=false;packets.renderOrder=4;group.add(packets);
  function loopPoint(out,offset,p,u){
    const angle=p*Math.PI*.5+.56,cos=Math.cos(angle),sin=Math.sin(angle),rise=.5-.5*Math.cos(u*Math.PI*2),side=Math.sin(u*Math.PI*2)*.24;
    const startX=cos*1.55,startZ=sin*1.55,topX=endX+cos*.1,topZ=endZ+sin*.1;
    out[offset]=startX+(topX-startX)*rise-side*sin;
    out[offset+1]=.10+(endY-.10)*rise;
    out[offset+2]=startZ+(topZ-startZ)*rise+side*cos;
  }
  function update(dt,settings={}){
    if(disposed)return;group.visible=settings.enabled!==false;if(!group.visible||settings.hidden)return;
    const anchor=settings.anchor,endpoint=settings.endpoint;
    group.position.set(bound(anchor?.x,-10000,10000),FLOOR_Y,bound(anchor?.z,-10000,10000));
    endX=bound(endpoint?.x,-10000,10000,group.position.x)-group.position.x;endZ=bound(endpoint?.z,-10000,10000,group.position.z)-group.position.z;
    endY=Math.max(.16,bound(endpoint?.y,-10000,10000,.865)-FLOOR_Y);platformHeight=Math.min(.51,Math.max(.045,endY*.56));
    const target=bound((MEMORY_AURA_PHASES[settings.phase]??.28)+bound(settings.amplitude,0,1)*.07,0,1),elapsed=Number.isFinite(dt)?Math.max(0,dt):0;
    // Integrate the same exponential easing and speed analytically. A 30/60/120
    // FPS cap or a blocked render frame changes sampling, never animation speed.
    const previousEnergy=energy,decay=Math.exp(-elapsed*2.4);
    reduced=!!settings.reducedMotion;energy=target+(previousEnergy-target)*decay;speed=.34+energy*1.45;
    if(!reduced)time+=.34*elapsed+1.45*(target*elapsed+(previousEnergy-target)*(1-decay)/2.4);
    quality=settings.quality==='performance'?'performance':'balanced';bubbleCount=quality==='performance'?LOW_BUBBLES:BUBBLES;loopCount=quality==='performance'?2:LOOPS;
    for(let i=0;i<LAYERS;i++){ringGroups[i].position.y=.018+platformHeight*i/2;ringGroups[i].rotation.y=time*ringSpeeds[i];ringGroups[i].visible=quality!=='performance'||i!==1;ringMaterials[i].uniforms.uStrength.value=.67+energy*.23;}
    haloMaterial.uniforms.uStrength.value=.18+energy*.12;beamMaterial.uniforms.uStrength.value=.19+energy*.16;beamMaterial.uniforms.uTime.value=time;
    beamDirection.set(endX,endY-.07,endZ);const beamLength=beamDirection.length();beam.position.set(endX*.5,(endY+.07)*.5,endZ*.5);beam.scale.y=beamLength;beam.quaternion.setFromUnitVectors(beamUp,beamDirection.normalize());
    bubbles.material.uniforms.uStrength.value=.80+energy*.20;packets.material.uniforms.uStrength.value=.92+energy*.08;wires.material.opacity=.28+energy*.22;
    bubbleGeometry.setDrawRange(0,bubbleCount);loopGeometry.setDrawRange(0,loopCount*SEGMENTS*2);packetGeometry.setDrawRange(0,loopCount*PACKETS);
    for(let i=0;i<bubbleCount;i++){
      const seed=seeds[i],progress=(seed+time*(.12+seed*.055))%1,angle=i*2.39996322973+time*.075,radius=(i%3===0?1.12+.48*seed:.20+1.02*Math.sqrt(seed))*(1-progress*.16);
      bubblePositions[i*3]=Math.cos(angle)*radius+endX*progress;bubblePositions[i*3+1]=.075+progress*(endY+.45);bubblePositions[i*3+2]=Math.sin(angle)*radius+endZ*progress;
      bubbleAlpha[i]=Math.pow(Math.max(0,Math.sin(progress*Math.PI)),.65);
    }
    for(let p=0;p<loopCount;p++){
      for(let s=0;s<SEGMENTS;s++){loopPoint(loopPositions,(p*SEGMENTS*2+s*2)*3,p,s/SEGMENTS);loopPoint(loopPositions,(p*SEGMENTS*2+s*2+1)*3,p,(s+1)/SEGMENTS);}
      for(let n=0;n<PACKETS;n++){
        const index=p*PACKETS+n,u=(time*.19+n/PACKETS+p*.037+.07)%1;packetProgress[index]=u;loopPoint(packetPositions,index*3,p,u);
        packetColors[index*3]=.025;packetColors[index*3+1]=u<.5?.94:.59;packetColors[index*3+2]=1;
      }
    }
    bubbleGeometry.attributes.position.needsUpdate=true;bubbleGeometry.attributes.alpha.needsUpdate=true;loopGeometry.attributes.position.needsUpdate=true;packetGeometry.attributes.position.needsUpdate=true;packetGeometry.attributes.color.needsUpdate=true;packetGeometry.attributes.progress.needsUpdate=true;
  }
  update(0,{});
  return {group,update,getState:()=>({time,energy,speed,quality,reducedMotion:reduced,points:bubbleCount,paths:loopCount,packets:loopCount*PACKETS,layers:quality==='performance'?2:3,drawCalls:quality==='performance'?7:8,groundY:FLOOR_Y,platformTop:FLOOR_Y+.018+platformHeight,bellyY:FLOOR_Y+endY,procedural:true,disposed}),dispose(){if(disposed)return;disposed=true;scene.remove(group);group.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});}};
}
