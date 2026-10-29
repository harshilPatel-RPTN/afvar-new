/* eslint-disable */
// Vendored from https://github.com/Sudhakarrupnar/AFVAR_Avatar_Final @ 4e0d45e (public/avatar/AFVAR/robot.js).
// Keep in sync with the avatar repo; do not edit here — change it there and re-vendor.
/** AFVAR: articulated rigid-shell robot. Geometry is modeled from the approved concept images. */
export const EXPRESSIONS = ['happy','neutral','curious','surprised','sad','thinking','concerned','confident','empathetic','focused'];
export function createRobot(T) {
  const root = new T.Group(); root.name = 'AFVAR_Robot';
  const parts = [], joints = {}, bones = [];
  const materials = {
    white: new T.MeshPhysicalMaterial({color:0xf2f3f0,metalness:0.18,roughness:0.22,clearcoat:0.95,clearcoatRoughness:0.13}),
    metal: new T.MeshPhysicalMaterial({color:0x8e999e,metalness:0.92,roughness:0.28,clearcoat:0.24}),
    dark: new T.MeshStandardMaterial({color:0x242b2d,metalness:0.74,roughness:0.3}),
    gasket: new T.MeshStandardMaterial({color:0x101717,metalness:0.1,roughness:0.54}),
    glass: new T.MeshPhysicalMaterial({color:0x040b0b,metalness:0.24,roughness:0.12,clearcoat:1,clearcoatRoughness:0.055}),
    eyes: new T.MeshStandardMaterial({color:0x2d4b12,emissive:0x73ef35,emissiveIntensity:1.1,metalness:0.12,roughness:0.24,toneMapped:false}),
    cyan: new T.MeshStandardMaterial({color:0x10494c,emissive:0x29ddeb,emissiveIntensity:1.2,roughness:0.2,toneMapped:false}),
    cyanDark: new T.MeshStandardMaterial({color:0x007c8d,emissive:0x006474,emissiveIntensity:0.3,roughness:0.3}),
    seam: new T.MeshStandardMaterial({color:0x6b7779,metalness:0.55,roughness:0.34}),
  };
  Object.entries(materials).forEach(([key,mat])=>mat.name='AFVAR_'+key);
  function mesh(geo, mat, parent, name, pos=[0,0,0], scale=[1,1,1]) {
    const m=new T.Mesh(geo,mat); m.name=name; m.position.set(...pos); m.scale.set(...scale); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function part(id,key,name,parent,pos=[0,0,0],explode=[0,0,0],proposed=false) {
    const node=new T.Group(); node.name='Part_'+id+'_'+key; node.position.set(...pos); parent.add(node);
    const p={id,key,name,node,rest:node.position.clone(),explode:new T.Vector3(...explode),proposed};
    node.userData={partId:id,partKey:key,partName:name,proposed}; parts.push(p); return node;
  }
  function bone(key,parent,pos,axis,min,max,rest=0,label=key) {
    const b=new T.Bone(); b.name='Joint_'+key; b.position.set(...pos); b.rotation[axis]=rest; parent.add(b);
    b.userData={joint:key,label,axis,min,max,rest}; joints[key]={bone:b,axis,min,max,rest,label}; bones.push(b); return b;
  }
  const pow=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p);
  function contour(a,b,n=3.4,steps=128,cx=0,cy=0) {
    return Array.from({length:steps+1},(_,i)=>{const t=i/steps*Math.PI*2;return [cx+a*pow(Math.cos(t),2/n),cy+b*pow(Math.sin(t),2/n)];});
  }
  function surface(rings,closed=false) {
    const pos=[],uv=[],index=[],steps=rings[0].length-1;
    rings.forEach((r,j)=>r.forEach((p,i)=>{pos.push(...p);uv.push(i/steps,j/(rings.length-1));}));
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<steps;i++){const a=j*(steps+1)+i,b=a+1,c=a+steps+1,d=c+1;index.push(a,c,b,b,c,d);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();return g;
  }
  function loft(profiles,n=3.4,steps=128) {
    return surface(profiles.map(([a,b,z])=>contour(Math.max(a,.001),Math.max(b,.001),n,steps).map(([x,y])=>[x,y,z])));
  }
  function dome(a,b,z,bulge,n=3.4,steps=128,rings=20) {
    const rows=[];for(let j=0;j<=rings;j++){const r=j/rings;rows.push(contour(a*r,b*r,n,steps).map(([x,y])=>[x,y,z+bulge*(1-r*r)]));}
    return surface(rows);
  }
  function reverse(g) {const ix=g.index.array;for(let i=0;i<ix.length;i+=3){const q=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=q;}g.computeVertexNormals();return g;}
  function lined(g,parent,name,thickness=.035) {
    const inner=g.clone(),p=inner.attributes.position,n=inner.attributes.normal;
    for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)-n.getX(i)*thickness,p.getY(i)-n.getY(i)*thickness,p.getZ(i)-n.getZ(i)*thickness);
    reverse(inner);return mesh(inner,materials.dark,parent,name);
  }
  function frontZ(g,x,y) {
    const a=g.attributes.position,ix=g.index?.array,ray=new T.Ray(new T.Vector3(x,y,8),new T.Vector3(0,0,-1));
    const v0=new T.Vector3(),v1=new T.Vector3(),v2=new T.Vector3(),hit=new T.Vector3();let highest=-Infinity;
    for(let i=0;i<(ix?.length??a.count);i+=3){v0.fromBufferAttribute(a,ix?ix[i]:i);v1.fromBufferAttribute(a,ix?ix[i+1]:i+1);v2.fromBufferAttribute(a,ix?ix[i+2]:i+2);if(ray.intersectTriangle(v0,v1,v2,false,hit))highest=Math.max(highest,hit.z);}
    return highest;
  }
  function tube(points,r,parent,mat,name,closed=false) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed,'centripetal');return mesh(new T.TubeGeometry(curve,Math.max(24,points.length*3),r,8,closed),mat,parent,name);
  }
  function seamContour(a,b,z,parent,name,r=.007,n=3.4) {
    return tube(contour(a,b,n,96).slice(0,-1).map(([x,y])=>[x,y,z]),r,parent,materials.seam,name,true);
  }
  function cyl(radTop,radBottom,h,parent,mat,name,pos=[0,0,0],axis='y') {
    const m=mesh(new T.CylinderGeometry(radTop,radBottom,h,56,1,false),mat,parent,name,pos);
    if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;return m;
  }
  function ball(r,parent,mat,name,pos=[0,0,0],scale=[1,1,1]) {return mesh(new T.SphereGeometry(r,40,28),mat,parent,name,pos,scale);}
  function rounded(w,h,d,r,parent,mat,name,pos=[0,0,0]) {
    const shape=new T.Shape();const x=-w/2,y=-h/2;
    shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
    const bevel=Math.min(r*.34,d*.25);const g=new T.ExtrudeGeometry(shape,{depth:Math.max(.002,d-2*bevel),bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:18});g.translate(0,0,-d/2+bevel);g.computeVertexNormals();return mesh(g,mat,parent,name,pos);
  }
  function bolt(parent,pos,axis='z',r=.027) {
    const screw=cyl(r,r,.014,parent,materials.metal,'Flush_screw',pos,axis);
    const slot=rounded(r*1.1,r*.13,.004,r*.05,parent,materials.dark,'Screw_slot',pos);
    if(axis==='x'){slot.rotation.y=Math.PI/2;slot.position.x+=.009;}else if(axis==='y'){slot.rotation.x=-Math.PI/2;slot.position.y+=.009;}else slot.position.z+=.01;
    return screw;
  }
  const torso=bone('body',root,[0,2.08,0],'y',-.4,.4,0,'Body turn');
  // The front shell is a genuine curved annular surface with a display opening.
  function torsoZ(x,y) {const yn=y/1.07,rx=1.11*(1-.10*yn);const rho=Math.pow(Math.pow(Math.abs(x/rx),2.5)+Math.pow(Math.abs(yn),2.5),1/2.5);return .76*Math.sqrt(Math.max(0,1-rho*rho));}
  function torsoY(x,z,upper=true) {
    let lo=0,hi=1.07;const sign=upper?1:-1;
    for(let i=0;i<44;i++){const v=(lo+hi)/2,yn=sign*v/1.07,rx=1.11*(1-.10*yn),rho=Math.pow(Math.pow(Math.abs(x/rx),2.5)+Math.pow(Math.abs(yn),2.5),1/2.5);if(rho*rho+(z/.76)**2<1)lo=v;else hi=v;}
    return sign*(lo+hi)/2;
  }
  const outer=Array.from({length:161},(_,i)=>{const t=i/160*Math.PI*2,y=1.07*pow(Math.sin(t),.8);return [1.11*(1-.10*y/1.07)*pow(Math.cos(t),.8),y];});
  const hole=contour(.66,.55,3.8,160,0,.24);
  const frontRows=[];
  for(let j=0;j<=30;j++){const f=j/30;frontRows.push(hole.map(([hx,hy],i)=>{const [ox,oy]=outer[i],x=hx+(ox-hx)*f,y=hy+(oy-hy)*f;return [x,y,torsoZ(x,y)];}));}
  const p6=part('06','frontTorso','Front torso shell',torso,[0,0,0],[0,0,.9]);const frontShell=surface(frontRows);mesh(frontShell,materials.white,p6,'Curved_front_shell');lined(frontShell,p6,'Front_inner_structure');
  const p7=part('07','rearTorso','Rear torso shell',torso,[0,0,0],[0,0,-.9],true);
  const rearRows=[];for(let j=0;j<=28;j++){const f=j/28;rearRows.push(outer.map(([x,y])=>[x*f,y*f,-torsoZ(x*f,y*f)]));}const rearShell=reverse(surface(rearRows));mesh(rearShell,materials.white,p7,'Curved_rear_shell');lined(rearShell,p7,'Rear_inner_structure');
  // The body parting seam stops at the underside service-cap rim.
  tube(Array.from({length:161},(_,i)=>{const t=-Math.PI/2+.153+i/160*(Math.PI*2-.306),y=1.07*pow(Math.sin(t),.8);return [1.11*(1-.10*y/1.07)*pow(Math.cos(t),.8),y,0];}),.006,p7,materials.seam,'Torso_side_parting_seam');
  for(const sx of [-1,1])tube(Array.from({length:81},(_,i)=>{const t=i/80,y=.81-t*1.57,yn=y/1.07,x=sx*1.11*(1-.10*yn)*Math.pow(1-Math.abs(yn)**2.5,1/2.5)*(.83+.035*Math.sin(t*Math.PI));const z=frontZ(frontShell,x,y);return [x,y,(Number.isFinite(z)?z:torsoZ(x,y))+.0012];}),.005,p6,materials.seam,'Side_panel_seam');
  const p8=part('08','bellyCover','Lower belly cover',torso,[0,0,0],[0,-.42,.42]);
  const bellyRows=[];for(let j=0;j<=20;j++){const yy=-1.055+j/20*.48,rr=Math.max(.001,1-Math.pow(Math.abs(yy/1.07),2.5)),xr=1.11*(1-.10*yy/1.07)*Math.pow(rr,1/2.5);const row=[];for(let i=0;i<=96;i++){const t=i/96*Math.PI,x=-xr*Math.cos(t);row.push([x,yy,Math.max(.006,torsoZ(x,yy))+.009]);}bellyRows.push(row);}mesh(reverse(surface(bellyRows)),materials.white,p8,'Lower_service_cover');
  const seamY=-.575,seamRx=1.11*(1-.10*seamY/1.07)*Math.pow(1-Math.pow(Math.abs(seamY/1.07),2.5),1/2.5);
  tube(Array.from({length:49},(_,i)=>{const x=(i/48*2-1)*seamRx;return [x,seamY,torsoZ(x,seamY)+.014];}),.007,p8,materials.seam,'Belly_cover_seam');
  const p9=part('09','underside','Underside cap',torso,[0,0,0],[0,-.7,0],true);
  const undersideRows=[];for(let j=0;j<=18;j++)undersideRows.push(Array.from({length:97},(_,i)=>{const a=i/96*Math.PI*2,r=.255*j/18,x=r*Math.cos(a),z=r*Math.sin(a);return [x,torsoY(x,z,false)*1.13-.004,z];}));
  mesh(surface(undersideRows),materials.white,p9,'Conformed_underside_service_cap');
  tube(Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,x=.26*Math.cos(a),z=.26*Math.sin(a);return [x,torsoY(x,z,false)*1.13-.004,z];}),.0045,p9,materials.seam,'Underside_gasket',true);
  // Neck rings are fixed to the yaw bone; head pitch has its own bearing axis.
  const neck=bone('neckYaw',torso,[0,1.035,0],'y',-.9,.9,0,'Neck · turn');
  const p5=part('05','neck','Neck joint',neck,[0,0,0],[0,.25,0],true);
  p5.scale.set(.78,1,.78);
  cyl(.55,.59,.10,p5,materials.metal,'Neck_base',[0,0,0]);cyl(.49,.49,.14,p5,materials.dark,'Neck_flex_bearing',[0,.10,0]);cyl(.52,.51,.055,p5,materials.metal,'Neck_upper_ring',[0,.185,0]);
  for(let i=0;i<3;i++)cyl(.497,.497,.013,p5,materials.seam,'Neck_ring_'+i,[0,.06+i*.045,0]);
  // A fixed socket follows the torso's actual surface and supports the circular neck bearing.
  const neckSocket=new T.Group();neckSocket.name='Fixed_neck_socket';p6.add(neckSocket);neckSocket.scale.y=1/1.13;neckSocket.userData={partId:'06',partKey:'frontTorso',fixedMount:true};
  const socketRows=[];for(let j=0;j<=12;j++){const f=j/12;socketRows.push(Array.from({length:129},(_,i)=>{const a=i/128*Math.PI*2,r=(.59+.018*f)*.78,x=r*Math.cos(a),z=r*Math.sin(a),top=1.035*1.13-.048,bottom=torsoY(x,z,true)*1.13-.004;return [x,top+(bottom-top)*f,z];}));}
  mesh(reverse(surface(socketRows)),materials.white,neckSocket,'Conformed_neck_socket');
  const head=bone('headPitch',neck,[0,.31,0],'x',-.38,.42,0,'Head · nod');
  const headCenter=.91;
  const p1=part('01','headShell','Head shell',head,[0,headCenter,0],[0,.65,-.12]);
  mesh(loft([[1.26,.91,.57],[1.38,1.005,.53],[1.46,1.075,.32],[1.47,1.085,.10],[1.455,1.07,-.27],[1.36,.98,-.53],[1.15,.82,-.69],[.72,.52,-.78],[.001,.001,-.81]],3.45),materials.white,p1,'Ceramic_helmet_shell');
  mesh(reverse(loft([[1.26,.91,.57],[1.255,.905,.49],[1.24,.89,.35],[1.22,.87,-.40]],3.45)),materials.dark,p1,'Helmet_inner_display_seat');
  seamContour(1.46,1.075,-.23,p1,'Helmet_rear_panel_seam',.0055,3.45);
  // The rear helmet is a clean closed shell, without unsupported external screws.
  const p2=part('02','faceDisplay','Face display',head,[0,headCenter,.575],[0,0,.95]);
  mesh(reverse(loft([[1.266,.916,-.025],[1.268,.918,.004],[1.25,.900,.026],[1.217,.868,.032]],3.45)),materials.metal,p2,'Polished_face_bezel');
  mesh(reverse(dome(1.266,.916,-.025,0,3.45)),materials.dark,p2,'Face_display_rear_cover');
  mesh(dome(1.224,.875,.03,.115,3.45),materials.glass,p2,'Convex_black_face_lens');
  seamContour(1.221,.872,.033,p2,'Face_seal',.006,3.45).material=materials.gasket;
  const faceZ=(x,y)=>.03+.115*(1-Math.min(.99,Math.pow(Math.pow(Math.abs(x/1.224),3.45)+Math.pow(Math.abs(y/.875),3.45),1/3.45))**2)+.018;
  const pixelGeo=new T.SphereGeometry(.0195,12,9),eyeGroups=[],eyePixels=[],mouthPixels=[];
  for(const sx of [-1,1]){
    const eye=new T.Group();eye.name=(sx<0?'Right':'Left')+'_LED_eye';eye.position.set(sx*.50,.25,faceZ(sx*.50,.25));p2.add(eye);eyeGroups.push(eye);
    const grid=[];for(let row=0;row<6;row++)for(let col=0;col<4;col++){const px=mesh(pixelGeo,materials.eyes,eye,'Eye_LED_'+sx+'_'+row+'_'+col,[(col-1.5)*.053,(2.5-row)*.055,0],[1,1,.45]);grid.push({px,row,col});}eyePixels.push(grid);
  }
  for(let row=0;row<2;row++)for(let i=0;i<21;i++){
    const x=(i/20*2-1)*.46,y=-.23-.205*(1-(x/.46)**2)-row*.048;
    const m=mesh(pixelGeo,materials.eyes,p2,'Smile_LED_'+row+'_'+i,[x,y,faceZ(x,y)],[.98,.98,.45]);mouthPixels.push({m,i,row});
  }
  // The side ear assemblies each remain separately selectable.
  for(const [side,s] of [['L',1],['R',-1]]){
    const p3=part('03','earHousing'+side,'Ear housing · '+side,head,[s*1.45,headCenter,0],[s*.48,.10,0]);
    cyl(.48,.48,.12,p3,materials.dark,'Ear_isolator',[0,0,0],'x');cyl(.43,.46,.12,p3,materials.white,'Ear_white_shoulder',[s*.08,0,0],'x');cyl(.39,.40,.04,p3,materials.metal,'Ear_metal_rim',[s*.16,0,0],'x');
    const p4=part('04','earCap'+side,'Ear centre cap · '+side,head,[s*1.67,headCenter,0],[s*.72,.10,0]);
    cyl(.345,.36,.09,p4,materials.metal,'Ear_speaker_disc',[0,0,0],'x');cyl(.27,.27,.012,p4,materials.dark,'Ear_centre_inlay',[s*.052,0,0],'x');cyl(.255,.25,.024,p4,materials.metal,'Ear_centre_cap',[s*.062,0,0],'x');
    for(let i=0;i<3;i++){const slot=rounded(.018,.12,.015,.007,p4,materials.dark,'Ear_vent_'+i,[s*.081,(i-1)*.095,-.08]);slot.rotation.y=Math.PI/2;}
  }
  // The display follows the torso surface, including its vertical stretch.
  // A lapped mounting lip closes the opening all around, not just at its centre.
  const chestZ=(x,y,offset=0)=>torsoZ(x,y+.24)+offset;
  const chestRing=(a,b,offset)=>contour(a,b,3.8,160).map(([x,y])=>[x,y,chestZ(x,y,offset)]);
  const p10=part('10','chestBezel','Chest bezel',torso,[0,.24,0],[0,0,.60]);
  mesh(surface([
    chestRing(.629,.519,.009),chestRing(.640,.530,.017),
    chestRing(.660,.550,.011),chestRing(.671,.561,-.003)
  ]),materials.metal,p10,'Chest_flush_mounting_lip');
  mesh(surface([
    chestRing(.671,.561,-.003),chestRing(.671,.561,-.032),
    chestRing(.629,.519,-.032),chestRing(.629,.519,.009)
  ]),materials.gasket,p10,'Chest_sealed_mounting_return');
  const p11=part('11','chestDisplay','Chest display',torso,[0,.24,0],[0,0,.87]);
  const displayRows=[];
  for(let j=0;j<=28;j++)displayRows.push(chestRing(.634*j/28,.524*j/28,.009));
  mesh(surface(displayRows),materials.glass,p11,'Chest_black_glass');
  // A closed shallow rear housing stays inside the torso when assembled.
  mesh(reverse(surface(Array.from({length:17},(_,j)=>chestRing(.634*j/16,.524*j/16,-.042)))),materials.dark,p11,'Chest_internal_back_cover');
  mesh(surface([chestRing(.634,.524,.009),chestRing(.634,.524,-.042)]),materials.gasket,p11,'Chest_display_edge_seal');
  // Display pixels are zero-thickness coloured surfaces on the curved glass,
  // rather than raised emblems. Subdivision keeps their triangles on the lens.
  function displayGraphic(shape,mat,name,dy=0,offset=.0102) {
    const flat=new T.ShapeGeometry(shape,24).toNonIndexed(),a=flat.attributes.position,positions=[];
    function tri(v0,v1,v2,depth=0){
      const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      if(depth<6&&Math.max(dist(v0,v1),dist(v1,v2),dist(v2,v0))>.045){
        const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
        const ab=mid(v0,v1),bc=mid(v1,v2),ca=mid(v2,v0);
        tri(v0,ab,ca,depth+1);tri(ab,v1,bc,depth+1);tri(ca,bc,v2,depth+1);tri(ab,bc,ca,depth+1);
      }else for(const [x,y0] of [v0,v1,v2]){const y=y0+dy;positions.push(x,y,chestZ(x,y,offset));}
    }
    for(let i=0;i<a.count;i+=3)tri([a.getX(i),a.getY(i)],[a.getX(i+1),a.getY(i+1)],[a.getX(i+2),a.getY(i+2)]);
    flat.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();
    const graphic=mesh(g,mat,p11,name);graphic.userData.screenGraphic=true;graphic.castShadow=false;graphic.receiveShadow=false;return graphic;
  }
  const bubble=new T.Shape();bubble.moveTo(-.24,-.17);bubble.lineTo(-.40,-.33);bubble.quadraticCurveTo(-.42,-.35,-.40,-.29);bubble.lineTo(-.31,-.12);bubble.quadraticCurveTo(-.40,-.08,-.40,.05);bubble.lineTo(-.40,.19);bubble.quadraticCurveTo(-.40,.35,-.23,.35);bubble.lineTo(.23,.35);bubble.quadraticCurveTo(.40,.35,.40,.18);bubble.lineTo(.40,-.03);bubble.quadraticCurveTo(.40,-.18,.23,-.18);bubble.lineTo(-.24,-.17);
  displayGraphic(bubble,materials.cyan,'Chest_screen_chat_pixels',-.04);
  for(let i=0;i<2;i++){
    const line=new T.Shape(),x=.065,y=.12-i*.095,r=.018;
    line.moveTo(x+r,y-r);line.lineTo(x+.21-r,y-r);line.quadraticCurveTo(x+.21,y-r,x+.21,y);line.quadraticCurveTo(x+.21,y+r,x+.21-r,y+r);line.lineTo(x+r,y+r);line.quadraticCurveTo(x,y+r,x,y);line.quadraticCurveTo(x,y-r,x+r,y-r);
    displayGraphic(line,materials.cyanDark,'Chest_screen_text_'+i,0,.0114);
  }
  // Runtime status is rendered as flat illuminated pixels on the existing curved
  // lens. It is an interface overlay, not another physical plate or export part.
  const alphabet={
    A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],
    C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],
    E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],
    G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],
    I:['11111','00100','00100','00100','00100','00100','11111'],J:['00111','00010','00010','00010','10010','10010','01100'],
    K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],
    M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],
    O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],
    Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],
    S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],
    U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],
    W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],
    Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111']
  };
  const displayLabels={idle:'',ready:'READY',listening:'LISTENING',thinking:'THINKING',processing:'THINKING',speaking:'SPEAKING',muted:'MUTED',quiet:'QUIET',error:'ERROR',success:'DONE',done:'DONE',connecting:'CONNECTING',cancelled:'CANCELLED',offline:'OFFLINE'};
  const statusGeometry=new Map(),baseGraphics=p11.children.filter(o=>o.userData.screenGraphic);
  function statusPixels(label){
    if(statusGeometry.has(label))return statusGeometry.get(label);
    const points=[],cell=Math.min(.023,1.10/Math.max(1,label.length*6-1)),width=(label.length*6-1)*cell;
    const quad=(x,y,w,h)=>{
      const nx=Math.ceil(w/.02),ny=Math.ceil(h/.02),dx=w/nx,dy=h/ny;
      for(let a=0;a<nx;a++)for(let b=0;b<ny;b++){
        const x0=x+a*dx,y0=y+b*dy;
        for(const [px,py] of [[x0,y0],[x0+dx,y0],[x0,y0+dy],[x0+dx,y0],[x0+dx,y0+dy],[x0,y0+dy]])points.push(px,py,chestZ(px,py,.0106));
      }
    };
    [...label].forEach((letter,i)=>(alphabet[letter]||[]).forEach((row,j)=>[...row].forEach((pixel,k)=>{if(pixel==='1')quad(-width/2+(i*6+k)*cell,.07+(3-j)*cell,cell*.81,cell*.81);})));
    // A restrained baseline anchors the word without flashing or fabricating progress.
    quad(-.16,-.12,.32,.009);
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points,3));geometry.computeVertexNormals();statusGeometry.set(label,geometry);return geometry;
  }
  const statusMesh=mesh(statusPixels('READY'),materials.cyan,p11,'Runtime_display_status');
  statusMesh.userData={screenGraphic:true,exportExclude:true};statusMesh.castShadow=false;statusMesh.receiveShadow=false;statusMesh.visible=false;
  let displayState='idle';
  function setDisplayState(value='idle'){
    const candidate=typeof value==='string'?value:value?.state;
    displayState=Object.prototype.hasOwnProperty.call(displayLabels,candidate)?candidate:'idle';
    const label=displayLabels[displayState];baseGraphics.forEach(o=>o.visible=!label);statusMesh.visible=!!label;
    if(label)statusMesh.geometry=statusPixels(label);
    root.userData.displayState=displayState;return label;
  }
  // Symmetric shoulder > elbow > wrist > finger chains; shells never own child joints.
  for(const [side,s] of [['L',1],['R',-1]]){
    const sh=bone('shoulder'+side,torso,[s*1.12,.83,-.015],'z',s>0?.36:-2.45,s>0?2.45:-.36,s*.36,'Shoulder '+side+' · lift');
    const swing=bone('shoulderSwing'+side,sh,[0,0,0],'x',-1.4,1.0,0,'Shoulder '+side+' · forward');
    const p13=part('13','shoulderJoint'+side,'Shoulder joint · '+side,swing,[0,0,0],[s*.43,0,-.1],true);
    ball(.205,p13,materials.dark,'Shoulder_ball');cyl(.17,.17,.23,p13,materials.metal,'Shoulder_axle',[s*.08,0,0],'x');
    const p12=part('12','shoulderCover'+side,'Shoulder cover · '+side,swing,[0,-.10,0],[s*.62,.17,.09]);
    ball(1,p12,materials.white,'Shoulder_armor',[0,0,.015],[.315,.43,.345]);
    const shoulderSurfaceZ=(x,y)=>.015+.345*Math.sqrt(Math.max(.001,1-(x/.315)**2-(y/.43)**2));
    const shoulderCapRows=[];for(let j=0;j<=12;j++)shoulderCapRows.push(Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2,r=.09*j/12,x=s*.045+r*Math.cos(a),y=.23+r*Math.sin(a);return [x,y,shoulderSurfaceZ(x,y)+.0015];}));
    mesh(surface(shoulderCapRows),materials.metal,p12,'Flush_shoulder_cap');
    tube(Array.from({length:64},(_,i)=>{const a=i/64*Math.PI*2,x=s*.045+.094*Math.cos(a),y=.23+.094*Math.sin(a);return [x,y,shoulderSurfaceZ(x,y)+.0015];}),.003,p12,materials.seam,'Shoulder_cap_gasket',true);
    tube(Array.from({length:21},(_,i)=>{const y=.30-i/20*.61,x=-s*(.10+.035*Math.sin(i/20*Math.PI));return [x,y,.015+.345*Math.sqrt(Math.max(.01,1-(x/.315)**2-(y/.43)**2))+.003];}),.005,p12,materials.seam,'Shoulder_panel_joint');
    const p14=part('14','upperArm'+side,'Upper arm link · '+side,swing,[0,-.38,0],[s*.65,.03,0],true);
    cyl(.14,.145,.43,p14,materials.dark,'Upper_arm_core');cyl(.16,.16,.06,p14,materials.metal,'Upper_arm_upper_ring',[0,.15,0]);cyl(.16,.16,.06,p14,materials.metal,'Upper_arm_lower_ring',[0,-.16,0]);
    const el=bone('elbow'+side,swing,[0,-.61,0],'x',-.78,.20,-.12,'Elbow '+side+' · bend');
    const p15=part('15','elbow'+side,'Elbow hinge · '+side,el,[0,0,0],[s*.62,-.14,0]);
    cyl(.17,.17,.35,p15,materials.dark,'Elbow_hinge',[0,0,0],'x');
    for(const q of [-1,1]){cyl(.136,.136,.025,p15,materials.metal,'Elbow_axis_cap',[q*.18,0,0],'x');bolt(p15,[q*.195,0,0],'x',.035);}
    const p16=part('16','forearm'+side,'Forearm shell · '+side,el,[0,-.35,0],[s*.78,-.3,.10]);
    const foreProfile=[new T.Vector2(.14,-.33),new T.Vector2(.205,-.31),new T.Vector2(.23,-.23),new T.Vector2(.255,-.04),new T.Vector2(.225,.20),new T.Vector2(.19,.30),new T.Vector2(.14,.33)];
    const foreGeometry=new T.LatheGeometry(foreProfile,72);mesh(foreGeometry,materials.white,p16,'Tapered_forearm_shell',[0,0,0],[1,1,1.13]);
    for(const q of [-1,1])tube(Array.from({length:81},(_,i)=>{const t=i/80,y=.29-t*.59,x=q*(.10+.035*Math.sin(t*Math.PI)),z=frontZ(foreGeometry,x,y);return [x,y,z*1.13+.0012];}),.0045,p16,materials.seam,'Forearm_parting_line');
    // Neutral hanging hands: the +Z palm normal faces the torso; thumbs point forward.
    const wrist=bone('wrist'+side,el,[0,-.71,0],'y',-1.8,1.8,-s*Math.PI/2,'Wrist '+side+' · twist');
    const p17=part('17','wrist'+side,'Wrist coupler · '+side,wrist,[0,0,0],[s*.8,-.44,0]);
    cyl(.15,.15,.10,p17,materials.dark,'Wrist_bearing');cyl(.136,.136,.035,p17,materials.metal,'Wrist_retainer',[0,-.057,0]);cyl(.12,.12,.07,p17,materials.metal,'Wrist_coupler',[0,-.10,0]);
    const p18=part('18','palm'+side,'Palm plate · '+side,wrist,[0,-.245,0],[s*.96,-.55,.1]);
    ball(1,p18,materials.white,'Palm_clamshell',[0,0,-.01],[.225,.18,.115]);
    const palmZ=(x,y)=>-.01+.115*Math.sqrt(Math.max(.001,1-(x/.225)**2-(y/.18)**2));
    const palmRows=Array.from({length:17},(_,j)=>contour(.175*j/16,.125*j/16,2.6,80).map(([x,y])=>[x,y,palmZ(x,y)+.0012]));
    mesh(surface(palmRows),materials.metal,p18,'Palm_inner_plate');
    tube(contour(.175,.125,2.6,80).slice(0,-1).map(([x,y])=>[x,y,palmZ(x,y)+.0005]),.002,p18,materials.seam,'Palm_plate_seal',true);
    for(const q of [-1,1]){
      const x=q*.135,y=.08,z=palmZ(x,y),mount=new T.Group();mount.name='Palm_flush_fastener';mount.position.set(x,y,z+.001);p18.add(mount);
      const normal=new T.Vector3(x/(.225*.225),y/(.18*.18),(z+.01)/(.115*.115)).normalize();
      mount.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);bolt(mount,[0,0,0],'z',.014);
    }
    for(let f=0;f<4;f++){
      // Four long fingers: index, middle, ring, little, mirrored with the thumb side.
      const fx=(f-1.5)*.104, anatomicalIndex=s>0?3-f:f;
      const fingerLength=[.97,1.06,1.00,.83][anatomicalIndex];
      // A relaxed hand has a shallow, progressive curl: little finger curls
      // farther than index. Keep this in the rest rig, including exported poses.
      const restingCurl=[[-.10,-.16,-.07],[-.15,-.21,-.10],[-.20,-.26,-.12],[-.25,-.31,-.14]][anatomicalIndex];
      const fa=bone('finger'+side+f+'a',wrist,[fx,-.405,0],'x',-1.5,.15,restingCurl[0],'Finger '+side+(f+1)+' · base');
      const p19a=part('19','finger'+side+f+'a','Finger link '+side+(f+1)+' · base',fa,[0,0,0],[s*(.88+f*.16),-.72,0]);
      cyl(.048,.048,.092,p19a,materials.dark,'Finger_base_hinge',[0,0,0],'x');
      rounded(.086,.107*fingerLength,.092,.024,p19a,materials.white,'Finger_proximal_cover',[0,-.066*fingerLength,0]);
      cyl(.035,.035,.098,p19a,materials.metal,'Finger_pin',[0,0,0],'x');
      const fb=bone('finger'+side+f+'b',fa,[0,-.133*fingerLength,0],'x',-1.55,.1,restingCurl[1],'Finger '+side+(f+1)+' · middle');
      const p19b=part('19','finger'+side+f+'b','Finger link '+side+(f+1)+' · middle',fb,[0,0,0],[s*(1.0+f*.16),-.83,.08]);
      cyl(.043,.043,.088,p19b,materials.dark,'Finger_middle_hinge',[0,0,0],'x');rounded(.077,.096*fingerLength,.084,.022,p19b,materials.white,'Finger_middle_cover',[0,-.06*fingerLength,0]);cyl(.031,.031,.094,p19b,materials.metal,'Finger_middle_pin',[0,0,0],'x');
      const fc=bone('finger'+side+f+'c',fb,[0,-.121*fingerLength,0],'x',-1.4,.1,restingCurl[2],'Finger '+side+(f+1)+' · tip');
      const p20=part('20','tip'+side+f,'Fingertip '+side+(f+1),fc,[0,0,0],[s*(1.12+f*.16),-.96,.14]);
      cyl(.037,.037,.077,p20,materials.dark,'Fingertip_hinge',[0,0,0],'x');rounded(.078,.115*fingerLength,.081,.031,p20,materials.white,'Rounded_fingertip',[0,-.058*fingerLength,0]);rounded(.058,.063*fingerLength,.014,.02,p20,materials.dark,'Fingertip_grip',[0,-.078*fingerLength,.047]);
    }
    const th=bone('thumb'+side+'0',wrist,[s*.235,-.23,.005],'z',s>0?.2:-1.4,s>0?1.4:-.2,s*.56,'Thumb '+side+' · spread');
    const pt=part('21','thumb'+side+'0','Thumb module '+side+' · base',th,[0,0,0],[s*.5,-.56,.38]);
    ball(.068,pt,materials.metal,'Thumb_ball');rounded(.11,.155,.10,.04,pt,materials.white,'Thumb_proximal',[0,-.09,0]);
    const th1=bone('thumb'+side+'1',th,[0,-.18,0],'x',-1.4,.3,-.16,'Thumb '+side+' · curl');
    const pt1=part('21','thumb'+side+'1','Thumb module '+side+' · tip',th1,[0,0,0],[s*.5,-.72,.41]);
    cyl(.05,.05,.11,pt1,materials.metal,'Thumb_hinge',[0,0,0],'x');rounded(.102,.145,.10,.04,pt1,materials.white,'Thumb_tip',[0,-.077,0]);rounded(.08,.07,.012,.025,pt1,materials.dark,'Thumb_grip',[0,-.095,.058]);
  }
  // Match the reference's egg-shaped torso aspect without stretching the neck or limbs.
  for(const p of parts){if(['06','07','08','10','11'].includes(p.id))p.node.scale.y=1.13;if(p.id==='09'){p.node.position.y*=1.13;p.rest.copy(p.node.position);}if(['10','11'].includes(p.id)){p.node.position.y*=1.13;p.rest.copy(p.node.position);}}
  neck.position.y*=1.13;
  let expression='happy';
  function setExpression(name='happy') {
    const alias={friendly:'happy',smile:'happy',calm:'neutral',serious:'focused',uncertain:'curious',sleepy:'neutral'}[name]||name;
    expression=EXPRESSIONS.includes(alias)?alias:'neutral';return expression;
  }
  function updateFace(time=0,options={}) {
    const bounded=(value,min,max,fallback=0)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
    const automaticBlink=Math.pow(Math.max(0,Math.cos(time*.86)),75);
    const blink=bounded(options.blink??(automaticBlink>.72?(automaticBlink-.72)/.28:0),0,1);
    const talk=bounded(options.talk,0,1),speaking=options.speaking===true||talk>0,gx=bounded(options.gazeX,-1,1),gy=bounded(options.gazeY,-1,1);
    const mood=expression;
    eyeGroups.forEach((g,idx)=>{
      const x=(idx===0?-.5:.5)+gx*.09,y=.25+gy*.06;
      g.position.set(x,y,faceZ(x,y));g.scale.set(1,Math.max(.10,1-blink*.93),1);g.rotation.z=0;
      if(mood==='thinking'){g.position.x+=.035;g.position.y+=.018;}
      if(mood==='empathetic'){g.rotation.z=idx===0?-.065:.065;}
    });
    eyePixels.forEach((grid,idx)=>grid.forEach(({px,row,col})=>{
      let lit=true;
      if(mood==='curious')lit=idx===0?row>=2:row<=3;
      else if(mood==='sad')lit=row>=(idx===0?3-col:col);
      else if(mood==='surprised')lit=(row===0||row===5||col===0||col===3);
      else if(mood==='thinking')lit=idx===0?(row>=1&&row<=4):(row>=2&&row<=4);
      else if(mood==='concerned')lit=row>=1&&row<=4;
      else if(mood==='confident')lit=row>=2;
      else if(mood==='empathetic')lit=row>=1;
      else if(mood==='focused')lit=row>=2&&row<=4;
      // Scale, rather than visibility, also preserves pixel masks in exported clips.
      px.visible=true;px.scale.setScalar(lit?1:.001);px.scale.z*=.45;
    }));
    mouthPixels.forEach(({m,i,row})=>{
      let x=(i/20*2-1)*.46,y=-.23-.205*(1-(x/.46)**2)-row*.048;
      if(mood==='surprised'&&!speaking){const angle=i/20*Math.PI*2;x=Math.cos(angle)*(.10+row*.03);y=-.36+Math.sin(angle)*(.13+row*.025);}
      else if(mood==='curious')y=-.37+(x*.14)-row*.045;
      else if(mood==='sad')y=-.50+.16*(1-(x/.46)**2)-row*.048;
      else if(mood==='neutral')y=-.37-row*.045;
      else if(mood==='thinking'){x*=.60;y=-.38+x*.09-row*.04;}
      else if(mood==='concerned'){x*=.78;y=-.39-row*.04;}
      else if(mood==='confident')y=-.31-.12*(1-(x/.46)**2)-row*.045;
      else if(mood==='empathetic'){x*=.85;y=-.32-.07*(1-(x/.40)**2)-row*.04;}
      else if(mood==='focused'){x*=.64;y=-.38-row*.035;}
      if(speaking){
        // Speech remains a wide pixel smile/slit, never a circular O. The
        // supplied audio envelope opens the two rows shallowly and continuously.
        // Host-supplied timed cues use the same wide LED vocabulary. Otherwise
        // fall back to the audio envelope, not inferred phoneme alignment.
        const u=i/20*2-1,edge=1-u*u,weight=options.speaking===true?1:Math.min(1,talk*5);
        const width=bounded(options.mouthWidth,.84,1,.88+.05*talk);
        const height=bounded(options.mouthHeight,.032,Math.min(.14,width/6.4),.032+.11*talk);
        const speechX=u*width/2;
        const speechY=-.32-.055*edge+(row===0?1:-1)*(.016+(height/2-.016)*edge);
        x+=(speechX-x)*weight;y+=(speechY-y)*weight;
      }
      m.position.set(x,y,faceZ(x,y));
    });
  }
  function resetPose(){for(const j of Object.values(joints))j.bone.rotation[j.axis]=j.rest;root.position.set(0,0,0);root.rotation.set(0,0,0);for(const p of parts){p.node.position.copy(p.rest);p.node.visible=true;}setExpression('friendly');setDisplayState('idle');updateFace(1,{blink:0});}
  resetPose();root.updateMatrixWorld(true);
  root.userData={name:'AFVAR',partTypes:21,modelKind:'Articulated rigid-shell character',notes:'Rear surfaces and internal fittings are modeled proposals from 2D references; no manufacturing fit is implied.'};
  return {root,parts,joints,bones,materials,setExpression,getExpression:()=>expression,updateFace,setDisplayState,getDisplayState:()=>displayState,resetPose};
}
