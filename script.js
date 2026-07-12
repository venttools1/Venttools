const $=id=>document.getElementById(id);function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');if(id==='offset')calculateOffset();if(id==='ductulator')calculateDuct();if(id==='fireDamper')calcFD()}function rad(d){return d*Math.PI/180}function deg(r){return r*180/Math.PI}function fmt(x){return Number.isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—'}function fmt0(x){return Number.isFinite(x)?String(Math.round(x)):'—'}function getAngle(){return $('angle').value==='custom'?(parseFloat($('angleCustom').value)||45):(parseFloat($('angle').value)||45)}function setMsg(type,txt){let m=$('msg');m.className='msg '+type;m.textContent=txt}
function ductPath(x1,y1,x2,y2,w){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,nx=-vy/L*w/2,ny=vx/L*w/2;return`M ${x1+nx} ${y1+ny} L ${x2+nx} ${y2+ny} L ${x2-nx} ${y2-ny} L ${x1-nx} ${y1-ny} Z`}function spiralLines(x1,y1,x2,y2,w,count){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,ux=vx/L,uy=vy/L,nx=-uy,ny=ux,s='';for(let i=1;i<count;i++){let t=i/count*L,cx=x1+ux*t,cy=y1+uy*t,a=18;s+=`<line x1="${cx+nx*w*.42-ux*a}" y1="${cy+ny*w*.42-uy*a}" x2="${cx-nx*w*.42+ux*a}" y2="${cy-ny*w*.42+uy*a}" stroke="#9aa4b2" stroke-width="1.4"/>`}return s}
function annularSectorPath(cx,cy,rO,rI,a1,a2){const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)],A=p(rO,a1),B=p(rO,a2),C=p(rI,a2),D=p(rI,a1),sw=a2>a1?1:0;return `M ${A[0]} ${A[1]} A ${rO} ${rO} 0 0 ${sw} ${B[0]} ${B[1]} L ${C[0]} ${C[1]} A ${rI} ${rI} 0 0 ${1-sw} ${D[0]} ${D[1]} Z`}

// Manufacturer bend take-off l (mm), transcribed from the supplied data sheets.
// BU pressed 45° covers the smaller sizes. BFU lockseamed tables cover 250–1250 mm.
const BEND_TAKEOFF_DATA = {
  BU: {
    45: {
      63:41, 80:41, 100:41, 112:81, 125:52, 140:56,
      150:62, 160:66, 180:76, 200:83, 224:93, 250:103
    }
  },
  BFU: {
    15: {
      250:33, 280:37, 300:39, 315:41, 355:47, 400:53, 450:59,
      500:66, 560:74, 600:79, 630:83, 710:93, 800:105, 900:118,
      1000:132, 1120:147, 1250:165
    },
    30: {
      250:67, 280:75, 300:80, 315:84, 355:95, 400:107, 450:121,
      500:134, 560:150, 600:161, 630:169, 710:190, 800:214, 900:241,
      1000:268, 1120:300, 1250:335
    },
    45: {
      250:104, 280:116, 300:124, 315:130, 355:147, 400:166, 450:186,
      500:207, 560:232, 600:249, 630:261, 710:294, 800:331, 900:373,
      1000:414, 1120:464, 1250:518
    },
    60: {
      250:144, 280:162, 300:173, 315:182, 355:205, 400:231, 450:260,
      500:289, 560:323, 600:346, 630:364, 710:410, 800:462, 900:520,
      1000:577, 1120:647, 1250:722
    },
    90: {
      250:250, 280:280, 300:300, 315:315, 355:355, 400:400, 450:450,
      500:500, 560:560, 600:600, 630:630, 710:710, 800:800, 900:900,
      1000:1000, 1120:1120, 1250:1250
    }
  }
};

function getBendTakeoff(angle, diameter, rmFactor){
  const roundedAngle = Math.round(angle * 10) / 10;
  const roundedDiameter = Math.round(diameter);

  // For 45° at 250 mm, use the pressed BU value because the current fitting style
  // treats 250 mm and below as pressed.
  if(roundedAngle === 45 && roundedDiameter <= 250){
    const exact = BEND_TAKEOFF_DATA.BU[45][roundedDiameter];
    if(Number.isFinite(exact)){
      return {l:exact, exact:true, family:'BU pressed', source:'Manufacturer table'};
    }
  }

  const angleTable = BEND_TAKEOFF_DATA.BFU[roundedAngle];
  if(angleTable){
    const exact = angleTable[roundedDiameter];
    if(Number.isFinite(exact)){
      return {l:exact, exact:true, family:'BFU lockseamed', source:'Manufacturer table'};
    }
  }

  const estimated = (rmFactor * diameter) * Math.tan(rad(angle) / 2);
  return {
    l:estimated,
    exact:false,
    family:diameter <= 250 ? 'Pressed-style estimate' : 'Lockseamed-style estimate',
    source:'Geometric estimate: rm × tan(θ/2)'
  };
}

function drawOffset(d){
  /*
    Original Vent Tools schematic:
    - The visible fitting angle follows the selected bend angle.
    - The cut-length maths is unchanged.
    - Rise/offset/roll remain calculated values shown as dimensions.
  */
  const svgW=760, svgH=360;
  const A=Math.max(5,Math.min(80,d.A));
  const a=-rad(A);
  const h={x:1,y:0};
  const diag={x:Math.cos(a),y:Math.sin(a)};
  const w=44;
  const radius=72;
  const tangent=radius*Math.tan(rad(A)/2);

  // Keep the technical sketch legible while allowing the middle piece to grow/shrink.
  const visualStraight=Math.max(150,Math.min(360,150+(Math.max(0,d.straight)/700)*210));
  const lowerY=260;
  const v1={x:170,y:lowerY};
  const b1={x:v1.x+diag.x*tangent,y:v1.y+diag.y*tangent};
  const a1={x:v1.x-tangent,y:v1.y};

  const a2={x:b1.x+diag.x*visualStraight,y:b1.y+diag.y*visualStraight};
  const v2={x:a2.x+diag.x*tangent,y:a2.y+diag.y*tangent};
  const b2={x:v2.x+tangent,y:v2.y};

  const p0={x:55,y:lowerY};
  const p3={x:Math.min(700,b2.x+115),y:b2.y};

  const pressed=d.D<=250;
  const fittingType=pressed?'Pressed bend':'Segmented / lockseamed bend';

  function unit(a,b){
    const vx=b.x-a.x,vy=b.y-a.y,L=Math.hypot(vx,vy)||1;
    return{x:vx/L,y:vy/L};
  }
  function normal(u){return{x:-u.y,y:u.x}}
  function point(p,u,t){return{x:p.x+u.x*t,y:p.y+u.y*t}}
  function crossLine(p,u,length=w*.98,colour='#4b5563',width=2){
    const n=normal(u),half=length/2;
    return `<line x1="${p.x+n.x*half}" y1="${p.y+n.y*half}" x2="${p.x-n.x*half}" y2="${p.y-n.y*half}" stroke="${colour}" stroke-width="${width}"/>`;
  }
  function collar(p,u){
    return [
      crossLine(point(p,u,-4),u,w*1.06,'#374151',2.6),
      crossLine(p,u,w*1.12,'#111827',3.2),
      crossLine(point(p,u,5),u,w*1.06,'#6b7280',2)
    ].join('');
  }
  function spiralSeams(a,b,count){
    const u=unit(a,b),n=normal(u),L=Math.hypot(b.x-a.x,b.y-a.y);
    let out='';
    for(let i=1;i<count;i++){
      const c=point(a,u,L*i/count);
      const skew=14;
      out+=`<line x1="${c.x+n.x*w*.42-u.x*skew}" y1="${c.y+n.y*w*.42-u.y*skew}" x2="${c.x-n.x*w*.42+u.x*skew}" y2="${c.y-n.y*w*.42+u.y*skew}" stroke="#9ca3af" stroke-width="1.25"/>`;
    }
    return out;
  }
  function quadPoint(s,c,e,t){
    return{
      x:(1-t)*(1-t)*s.x+2*(1-t)*t*c.x+t*t*e.x,
      y:(1-t)*(1-t)*s.y+2*(1-t)*t*c.y+t*t*e.y
    };
  }
  function quadTangent(s,c,e,t){
    const x=2*(1-t)*(c.x-s.x)+2*t*(e.x-c.x);
    const y=2*(1-t)*(c.y-s.y)+2*t*(e.y-c.y);
    const L=Math.hypot(x,y)||1;
    return{x:x/L,y:y/L};
  }
  function bendBands(s,c,e,count,heavy){
    let out='';
    for(let i=1;i<=count;i++){
      const t=i/(count+1);
      const q=quadPoint(s,c,e,t);
      const u=quadTangent(s,c,e,t);
      out+=crossLine(q,u,w*.96,heavy?'#6b7280':'#a1a8b2',heavy?2.1:1.35);
    }
    return out;
  }

  const centrePath=`M ${p0.x} ${p0.y} L ${a1.x} ${a1.y} Q ${v1.x} ${v1.y} ${b1.x} ${b1.y} L ${a2.x} ${a2.y} Q ${v2.x} ${v2.y} ${b2.x} ${b2.y} L ${p3.x} ${p3.y}`;

  const diagU=unit(b1,a2);
  const lowerU=h,upperU=h;

  // Dimension positions.
  const dimBottomY=326;
  const riseX=Math.min(705,p3.x+24);
  const cutDimOffset=34;
  const nDiag=normal(diagU);
  const cutA={x:b1.x+nDiag.x*cutDimOffset,y:b1.y+nDiag.y*cutDimOffset};
  const cutB={x:a2.x+nDiag.x*cutDimOffset,y:a2.y+nDiag.y*cutDimOffset};

  $('diagramLayer').innerHTML=`
    <style>
      #diagramLayer .body-outline{fill:none;stroke:#374151;stroke-width:${w+5};stroke-linecap:butt;stroke-linejoin:round}
      #diagramLayer .body-metal{fill:none;stroke:url(#ductGrad);stroke-width:${w};stroke-linecap:butt;stroke-linejoin:round}
      #diagramLayer .centreline{fill:none;stroke:#111827;stroke-width:1.6;stroke-dasharray:7 7}
      #diagramLayer .extension{stroke:#94a3b8;stroke-width:1.2;stroke-dasharray:5 5}
      #diagramLayer .dimension{stroke:#064b82;stroke-width:2;marker-start:url(#arrow);marker-end:url(#arrow)}
      #diagramLayer .label{font-family:system-ui,Arial;font-weight:800;fill:#111827}
      #diagramLayer .blue{fill:#064b82}
    </style>

    <path d="${centrePath}" class="body-outline"/>
    <path d="${centrePath}" class="body-metal"/>

    ${spiralSeams(p0,a1,4)}
    ${spiralSeams(b1,a2,7)}
    ${spiralSeams(b2,p3,4)}

    ${collar(a1,lowerU)}
    ${collar(b1,diagU)}
    ${collar(a2,diagU)}
    ${collar(b2,upperU)}

    ${bendBands(a1,v1,b1,pressed?1:4,!pressed)}
    ${bendBands(a2,v2,b2,pressed?1:4,!pressed)}

    <path d="${centrePath}" class="centreline"/>

    <line x1="${v1.x}" y1="${v1.y}" x2="${v1.x}" y2="${dimBottomY}" class="extension"/>
    <line x1="${v2.x}" y1="${v2.y}" x2="${v2.x}" y2="${dimBottomY}" class="extension"/>
    <line x1="${v1.x}" y1="${dimBottomY}" x2="${v2.x}" y2="${dimBottomY}" class="dimension"/>
    <text x="${(v1.x+v2.x)/2}" y="${dimBottomY+24}" text-anchor="middle" font-size="15" class="label blue">Offset ${fmt(d.H)} mm</text>

    <line x1="${v2.x}" y1="${v1.y}" x2="${riseX-8}" y2="${v1.y}" class="extension"/>
    <line x1="${v2.x}" y1="${v2.y}" x2="${riseX-8}" y2="${v2.y}" class="extension"/>
    <line x1="${riseX}" y1="${v1.y}" x2="${riseX}" y2="${v2.y}" class="dimension"/>
    <text x="${riseX-8}" y="${(v1.y+v2.y)/2-8}" text-anchor="end" font-size="15" class="label blue">Rise</text>
    <text x="${riseX-8}" y="${(v1.y+v2.y)/2+12}" text-anchor="end" font-size="14" class="label">${fmt(d.V)} mm</text>

    <line x1="${cutA.x}" y1="${cutA.y}" x2="${cutB.x}" y2="${cutB.y}" class="dimension"/>
    <text x="${(cutA.x+cutB.x)/2+nDiag.x*18}" y="${(cutA.y+cutB.y)/2+nDiag.y*18}" text-anchor="middle" font-size="15" class="label blue">L ${fmt(d.straight)} mm</text>

    <text x="${v1.x+10}" y="${v1.y-62}" font-size="14" class="label">${fmt(A)}°</text>
    <text x="${v2.x-20}" y="${v2.y+62}" font-size="14" class="label">${fmt(A)}°</text>
    <text x="380" y="30" text-anchor="middle" font-size="18" class="label">Roll ${fmt(d.roll)}°</text>
  `;
}
function calculateOffset(){
  const V=parseFloat($('up').value)||0;
  const H=parseFloat($('over').value)||0;
  const A=getAngle();
  const D=parseFloat($('dia').value)||0;
  const minS=parseFloat($('minStraight').value)||0;
  const rmF=parseFloat($('rmFactor').value)||1;

  const th=rad(A);
  const R=Math.hypot(V,H);
  const T=Math.sin(th)>0 ? R/Math.sin(th) : NaN;
  const roll=(V===0&&H===0) ? 0 : deg(Math.atan2(V,H));

  const bend=getBendTakeoff(A,D,rmF);
  const l=bend.l;
  const straight=T-(2*l);

  $('straightBig').textContent=fmt(straight)+' mm';
  $('rollBig').textContent=fmt(roll)+'°';

  const result=`Vent Tools - Offset Calculator

Inputs:
  Rise / Up (V)          = ${fmt(V)} mm
  Offset / Over (H)      = ${fmt(H)} mm
  Bend angle (θ)         = ${fmt(A)}°
  Duct diameter (D)      = ${fmt(D)} mm
  Minimum straight       = ${fmt(minS)} mm

Results:
  Cut straight L         = ${fmt(straight)} mm
  Roll angle             = ${fmt(roll)}°
  Resultant offset R     = ${fmt(R)} mm
  Travel T               = ${fmt(T)} mm
  Bend take-off l        = ${fmt(l)} mm
  Bend family            = ${bend.family}
  Dimension source       = ${bend.source}`;

  $('out').textContent=result;
  drawOffset({V,H,A,D,straight,roll});

  const chip=$('fittingChip');
  if(chip){
    chip.textContent=`${bend.family} • Ø${fmt0(D)} mm • ${bend.exact?'Exact table dimension':'Estimated dimension'}`;
  }

  if(!Number.isFinite(straight)){
    setMsg('bad','⚠ Check your angle input.');
  }else if(straight<0){
    setMsg('bad','❌ Impossible fit: the two bend take-offs overlap. Use a smaller bend angle or increase the available offset.');
  }else if(straight<minS){
    setMsg('warn',`⚠ Straight section under ${fmt(minS)} mm. Check bend spigot depths — opposing swedges may meet inside the straight.`);
  }else if(!bend.exact){
    setMsg('warn','⚠ Cut length uses an estimated bend take-off because this exact angle/diameter is not in the current manufacturer table.');
  }else{
    setMsg('ok','✅ Cut length uses the supplied manufacturer bend take-off. Verify fitting family and site conditions before cutting.');
  }
  return result;
}
function angleUI(){let c=$('angle').value==='custom';$('angleCustom').style.display=c?'block':'none';if(!c)$('angleCustom').value=$('angle').value}function resetOffset(){$('up').value=300;$('over').value=250;$('angle').value='45';$('angleCustom').value=45;$('dia').value=315;$('minStraight').value=120;$('rmFactor').value=1;angleUI();calculateOffset()}async function copyOffset(){let r=calculateOffset();try{await navigator.clipboard.writeText(r);setMsg('ok','✅ Result copied.')}catch(e){setMsg('warn','Could not copy automatically. Long-press working text and copy manually.')}}function toggleWorking(){let o=$('out'),show=o.style.display==='block';o.style.display=show?'none':'block';$('workingBtn').textContent=show?'Show working':'Hide working'}['up','over','dia','minStraight','rmFactor','angle','angleCustom'].forEach(id=>{$(id).addEventListener('input',()=>{angleUI();calculateOffset()});$(id).addEventListener('change',()=>{angleUI();calculateOffset()})});$('resetBtn').addEventListener('click',resetOffset);$('copyBtn').addEventListener('click',copyOffset);$('workingBtn').addEventListener('click',toggleWorking);
const standardSpiral=[80,100,125,150,160,180,200,224,250,280,300,315,355,400,450,500,560,600,630,710,800,900,1000,1120,1250];function nearestStandard(d){let best=standardSpiral[0];for(const s of standardSpiral){if(Math.abs(s-d)<Math.abs(best-d))best=s}return best}function drawDuctulator(w,h,dia){let layer=$('ductDiagramLayer'),rx=90,ry=60,rw=230,rh=115,cx=560,cy=120,r=65;layer.innerHTML=`<defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 Z" fill="#064b82"/></marker></defs><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" fill="#d9dde3" stroke="#111827" stroke-width="3"/><line x1="${rx}" y1="${ry+rh/2}" x2="${rx+rw}" y2="${ry+rh/2}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${rx+rw/2}" y="${ry+rh+32}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${fmt0(w)} × ${fmt0(h)} mm</text><path d="M350 120 L455 120" stroke="#064b82" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9dde3" stroke="#111827" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="18" fill="none" stroke="#9aa4b2" stroke-width="1.6"/><ellipse cx="${cx}" cy="${cy}" rx="${r*.72}" ry="12" fill="none" stroke="#9aa4b2" stroke-width="1.4"/><line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${cx}" y="${cy+r+34}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">Ø ${fmt(dia)} mm</text>`}
function calculateDuct(){const w=parseFloat($('rectW').value)||0,h=parseFloat($('rectH').value)||0,area=w*h,eq=Math.sqrt((4*area)/Math.PI),near=nearestStandard(eq);$('eqRound').textContent=fmt(eq)+' mm';$('nearestRound').textContent='Ø '+fmt0(near);$('rectArea').textContent=fmt0(area)+' mm²';drawDuctulator(w,h,eq);return `Vent Tools - Rect to Round Ductulator\n\nRectangular duct: ${fmt0(w)} × ${fmt0(h)} mm\nArea: ${fmt0(area)} mm²\nSame-area round: Ø ${fmt(eq)} mm\nNearest standard spiral: Ø ${fmt0(near)} mm`}async function copyDuct(){let r=calculateDuct();try{await navigator.clipboard.writeText(r)}catch(e){}}function resetDuct(){$('rectW').value=600;$('rectH').value=300;calculateDuct()}['rectW','rectH'].forEach(id=>$(id).addEventListener('input',calculateDuct));$('copyDuctBtn').addEventListener('click',copyDuct);$('resetDuctBtn').addEventListener('click',resetDuct);angleUI();calculateOffset();calculateDuct();


const FD_MANUFACTURERS={
  BSB:{label:"BSB",products:{
    "FSD-TD":{label:"FSD-TD — Rectangular / square",shape:"rect",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/fsd_td_iom.pdf",guide:"BSB FSD-TD IOM",revision:"current linked edition",methods:{
      M5:{label:"M5 — Drywall, non-cleated frameless",w:121,h:96,reference:"M5"},
      M6:{label:"M6 — Drywall, pattress and cleat",w:156,h:96,reference:"M6"},
      M9:{label:"M9 — Drywall, AF Easy Fix angle frame",w:122,h:99,reference:"M9"},
      M10:{label:"M10 — Masonry wall, AF Easy Fix angle frame",w:122,h:99,reference:"M10"},
      M11:{label:"M11 — Masonry floor, AF Easy Fix angle frame",w:122,h:99,reference:"M11"}
    }},
    "FSD-C":{label:"FSD-C — Circular",shape:"circle",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/fsd_c_iom_11zon.pdf",guide:"BSB FSD-C IOM",revision:"current linked edition",methods:{
      M9:{label:"M9 — Drywall partition",type:"bsb-dry",reference:"M9"},
      M10:{label:"M10 — Masonry wall or floor",type:"bsb-masonry",reference:"M10"},
      M14:{label:"M14 — Flexible fire curtain",type:"bsb-ffc",reference:"M14"}
    }}
  }},
  ACTIONAIR:{label:"Actionair by Swegon",products:{
    CSS:{label:"CSS — Circular fire/smoke damper",shape:"circle",manual:"https://www.swegon.com/globalassets/digizuite/10514-en-css_installation_en.pdf",guide:"Actionair CSS Installation Guide",revision:"LNNN00356 v6.0 • 27 May 2025",methods:{
      CSS_DRY:{label:"Vertical — plasterboard wall",type:"css-dry",reference:"AA/F13440 or AA/F12820",min:10,max:40,step:10,defaultAllowance:20},
      CSS_MASONRY:{label:"Vertical — masonry wall",type:"css-masonry",reference:"AA/F12822",squareMin:10,squareMax:40,circleMin:10,circleMax:30,step:10,defaultAllowance:20},
      CSS_SLAB:{label:"Horizontal — concrete slab",type:"css-slab",reference:"AA/F12821",squareMin:10,squareMax:30,step:10,defaultAllowance:20}
    }},
    "DWFX-F":{label:"DWFX-F / DWFX-3F — Rectangular",shape:"rect",manual:"https://www.swegon.com/globalassets/digizuite/10506-en-smokeshield_fireshield_dwfx-f_installation_en.pdf",guide:"Actionair DWFX-F Installation Guide",revision:"LNNN00354 v6.0 • 17 March 2026",methods:{
      DW_DRY_1:{label:"Vertical plasterboard wall — 1 × Type F board each face",type:"dwfx-dry-fixed",referenceSmoke:"AA/F13412",referenceFire:"AA/F13440",w:30,h:30,boardsW:2,boardsH:2},
      DW_DRY_2:{label:"Vertical plasterboard wall — 2 × Type F boards each face",type:"dwfx-dry-range",referenceSmoke:"AA/F10704",referenceFire:"AA/F10705",smokeW:[10,52],smokeH:[10,40],fireW:[10,40],fireH:[10,40],boardsW:2,boardsH:2},
      DW_UNDER_DRY:{label:"DWFX-3F plasterboard wall under concrete slab",type:"dwfx-under-dry",referenceSmoke:"AA/F11945",referenceFire:"AA/F11944",smokeW:[10,57],smokeH:[10,30],fireW:[10,60],fireH:[5,30],boardsW:2,boardsH:1},
      DW_UNDER_MASONRY:{label:"DWFX-3F masonry wall under concrete slab",type:"dwfx-range",referenceSmoke:"AA/F12394",referenceFire:"AA/F12827",smokeW:[10,57],smokeH:[5,30],fireW:[10,80],fireH:[5,40],boardsW:0,boardsH:0},
      DW_SHAFT:{label:"DWFX-F plasterboard shaftwall — SmokeShield only",type:"dwfx-fixed",referenceSmoke:"AA/F13472",smokeOnly:true,w:30,h:30,boardsW:2,boardsH:2},
      DW_COMPOSITE:{label:"DWFX-F composite panel wall — SmokeShield only",type:"dwfx-fixed",referenceSmoke:"AA/F13396",smokeOnly:true,w:52,h:60,boardsW:0,boardsH:0},
      DW_MASONRY_LINK:{label:"DWFX-F masonry wall — use official hole sizer / drawing",type:"dwfx-link",referenceSmoke:"AA/F12493",referenceFire:"AA/F10707"},
      DW_TIMBER_LINK:{label:"DWFX-F timber stud partition — official drawing required",type:"dwfx-link",referenceSmoke:"AA/F13752",smokeOnly:true}
    }},
    "HEVAC-IF":{label:"HEVAC / HVCA Installation Frame — Rectangular",shape:"rect",manual:"https://www.swegon.com/globalassets/digizuite/10508-en-smokeshield_hevac_hvca_installation_en.pdf",guide:"Actionair I/F Installation Guide",revision:"LNNN00352 v5.1 • 26 May 2022",methods:{
      HEVAC_WALL:{label:"Vertical installation frame in masonry wall",type:"hevac-frame",referenceSmoke:"AA/F10702",referenceFire:"AA/F10703"},
      HEVAC_SLAB:{label:"Horizontal installation frame in concrete slab — FireShield only",type:"hevac-frame",referenceFire:"AA/F10701",fireOnly:true}
    }}
  }}
};
function fdMsg(t,s){const e=$("fdMessage");e.className="msg "+t;e.textContent=s}
function currentFD(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],p=man.products[$("fdSeries").value],m=p.methods[$("fdMethod").value];return{man,p,m,manKey:$("fdManufacturer").value,productKey:$("fdSeries").value,methodKey:$("fdMethod").value}}
function fillFDProducts(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],s=$("fdSeries");s.innerHTML="";Object.entries(man.products).forEach(([k,v])=>{const o=document.createElement("option");o.value=k;o.textContent=v.label;s.appendChild(o)});fillFDMethods()}
function fillFDMethods(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],p=man.products[$("fdSeries").value],m=$("fdMethod");m.innerHTML="";Object.entries(p.methods).forEach(([k,v])=>{const o=document.createElement("option");o.value=k;o.textContent=v.label;m.appendChild(o)});updateFDInputs()}
function setAllowanceOptions(min,max,step,def){const sel=$("fdAllowance");sel.innerHTML="";for(let n=min;n<=max;n+=step){const o=document.createElement("option");o.value=n;o.textContent=`${n} mm total (${n/2} mm nominal each side)`;if(n===def)o.selected=true;sel.appendChild(o)}}

function setNumericOptions(id,min,max,def){const s=$(id);s.innerHTML="";for(let n=min;n<=max;n++){const o=document.createElement("option");o.value=n;o.textContent=n+" mm";if(n===def)o.selected=true;s.appendChild(o)}}
function configureDwfx(m){const variant=$("fdDwfxVariant").value;const isSmoke=variant==="SMOKE";if(m.smokeOnly&&!isSmoke){$("fdDwfxVariant").value="SMOKE"}
 const v=$("fdDwfxVariant").value;let wr=null,hr=null;
 if(m.type==="dwfx-dry-fixed"||m.type==="dwfx-fixed"){wr=[m.w,m.w];hr=[m.h,m.h]}
 else if(m.type.startsWith("dwfx-")&&m.type!=="dwfx-link"){wr=v==="SMOKE"?m.smokeW:m.fireW;hr=v==="SMOKE"?m.smokeH:m.fireH}
 if(wr&&hr){setNumericOptions("fdDwfxWAllowance",wr[0],wr[1],Math.round((wr[0]+wr[1])/2));setNumericOptions("fdDwfxHAllowance",hr[0],hr[1],Math.round((hr[0]+hr[1])/2))}
 $("fdDwfxAllowanceWrap").style.display=m.type==="dwfx-link"?"none":"grid";
 $("fdDwfxBoard").closest("div").style.display=(m.boardsW||m.boardsH)?"block":"none";
 const smokeText='For SmokeShield, the entered width must include the 28 mm PTC shroud. Do not include the peripheral flange.';
 $("fdDwfxHint").textContent=m.type==="dwfx-link"?'This method is listed for reference only because the current guide does not provide one safe universal opening formula. Use the official Actionair hole-sizing tool or installation drawing.':`Enter measured overall casing width × height. ${smokeText}`;
}
function updateFDInputs(){const {p,m,productKey}=currentFD(),circle=p.shape==="circle",dwfx=productKey==="DWFX-F",hevac=productKey==="HEVAC-IF";
  $("fdRectInputs").style.display=p.shape==="rect"?"block":"none";
  $("fdCircularInputs").style.display=circle?"block":"none";
  $("fdDwfxWrap").style.display=dwfx?"block":"none";
  $("fdHevacWrap").style.display=hevac?"block":"none";
  $("fdWidthLabel").textContent=dwfx?"Measured overall casing width (mm)":hevac?"Measured outside frame width (mm)":"Nominal duct width (mm)";
  $("fdHeightLabel").textContent=dwfx?"Measured overall casing height (mm)":hevac?"Measured outside frame height (mm)":"Nominal duct height (mm)";
  $("fdBoardWrap").style.display=["bsb-dry","css-dry"].includes(m.type)?"block":"none";
  $("fdWallBuildWrap").style.display=m.type==="css-dry"?"block":"none";
  $("fdShapeWrap").style.display=["css-masonry"].includes(m.type)?"block":"none";
  $("fdAllowanceWrap").style.display=["css-dry","css-masonry","css-slab"].includes(m.type)?"block":"none";
  $("fdDiameterLabel").textContent=m.type&&m.type.startsWith("css-")?"Overall damper casing diameter (mm)":"Nominal damper diameter (mm)";
  if(m.type==="css-dry")setAllowanceOptions(m.min,m.max,m.step,m.defaultAllowance);
  if(m.type==="css-masonry"){const shape=$("fdApertureShape").value;setAllowanceOptions(shape==="square"?m.squareMin:m.circleMin,shape==="square"?m.squareMax:m.circleMax,m.step,m.defaultAllowance)}
  if(m.type==="css-slab")setAllowanceOptions(m.squareMin,m.squareMax,m.step,m.defaultAllowance);
  if(dwfx)configureDwfx(m);
  if(hevac){
    const g=$("fdHevacGap");g.innerHTML="";
    for(let n=5;n<=75;n+=5){const o=document.createElement("option");o.value=n;o.textContent=`${n} mm each side`;if(n===25)o.selected=true;g.appendChild(o)}
    $("fdHevacVariant").querySelector('option[value="SMOKE"]').disabled=!!m.fireOnly;
    if(m.fireOnly)$("fdHevacVariant").value="FIRE";
  }
  calcFD();
}
function drawFD(r){const g=$("fdDiagramLayer"),title=`${r.manufacturer} • ${r.product}`;
 if(r.shape==="rect"){const ow=420,oh=Math.max(100,Math.min(190,ow*r.openH/r.openW)),x=(760-ow)/2,y=75+(190-oh)/2,gx=28,gy=24;g.innerHTML=`<rect x="${x}" y="${y}" width="${ow}" height="${oh}" rx="6" fill="#eef2f6" stroke="#334155" stroke-width="3"/><rect x="${x+gx}" y="${y+gy}" width="${ow-2*gx}" height="${oh-2*gy}" rx="3" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${x}" y1="${y+oh+28}" x2="${x+ow}" y2="${y+oh+28}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="380" y="${y+oh+52}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="380" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="380" y="300" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="800" fill="#142033">Damper ${r.damper}</text>`}
 else{const cx=380,cy=150,ro=105,ratio=Math.min(.92,r.dia/(r.visualOpen||r.dia+20)),rd=Math.max(52,ro*ratio);if(r.apertureShape==="square"){g.innerHTML=`<rect x="${cx-ro}" y="${cy-ro}" width="${2*ro}" height="${2*ro}" rx="5" fill="#eef2f6" stroke="#334155" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${rd}" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${cx-ro}" y1="${cy+ro+30}" x2="${cx+ro}" y2="${cy+ro+30}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="${cx}" y="${cy+ro+55}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="${cx}" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="${cx}" y="${cy+7}" text-anchor="middle" font-family="system-ui" font-size="15" font-weight="900" fill="#142033">Ø ${fmt0(r.dia)} casing</text>`}else{g.innerHTML=`<circle cx="${cx}" cy="${cy}" r="${ro}" fill="#eef2f6" stroke="#334155" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${rd}" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${cx-ro}" y1="${cy+ro+30}" x2="${cx+ro}" y2="${cy+ro+30}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="${cx}" y="${cy+ro+55}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="${cx}" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="${cx}" y="${cy+7}" text-anchor="middle" font-family="system-ui" font-size="15" font-weight="900" fill="#142033">Ø ${fmt0(r.dia)} casing</text>`}}
}
function calcFD(){if(!$("fdSeries").value)return;const {man,p,m,productKey,methodKey}=currentFD();let r;
 if(p.shape==="rect"){const W=parseFloat($("fdWidth").value)||0,H=parseFloat($("fdHeight").value)||0;
  if(productKey==="DWFX-F"){
    const variant=$("fdDwfxVariant").value,board=parseFloat($("fdDwfxBoard").value)||0;
    if(m.smokeOnly&&variant!=="SMOKE")$("fdDwfxVariant").value="SMOKE";
    const actualVariant=$("fdDwfxVariant").value;
    const ref=actualVariant==="SMOKE"?m.referenceSmoke:m.referenceFire;
    if(m.type==="dwfx-link"){
      r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Official hole sizer / drawing required",damper:`${fmt0(W)} × ${fmt0(H)} mm casing`,rule:"No universal Vent Tools calculation enabled for this method",reference:ref||"See official guide",isLinkOnly:true};
    }else{
      const wa=parseFloat($("fdDwfxWAllowance").value)||0,ha=parseFloat($("fdDwfxHAllowance").value)||0;
      const openW=W+wa+(m.boardsW||0)*board,openH=H+ha+(m.boardsH||0)*board;
      r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm`,damper:`${fmt0(W)} × ${fmt0(H)} mm measured casing`,rule:`Finished opening +${fmt0(wa)} mm width / +${fmt0(ha)} mm height${(m.boardsW||m.boardsH)?`; cut size also adds ${m.boardsW||0} × board to width and ${m.boardsH||0} × board to height`:""}`,reference:ref,variant:actualVariant};
    }
  }else if(productKey==="HEVAC-IF"){
    const gap=parseFloat($("fdHevacGap").value)||25;
    let variant=$("fdHevacVariant").value;if(m.fireOnly)variant="FIRE";
    const ref=variant==="SMOKE"?m.referenceSmoke:m.referenceFire;
    const openW=W+2*gap,openH=H+2*gap;
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm`,damper:`Installation frame ${fmt0(W)} × ${fmt0(H)} mm`,rule:`Measured frame size + 2 × ${fmt0(gap)} mm clear mortar gap`,reference:ref,range:"Official drawing permits 5–75 mm from the installation-frame upstand to the aperture face all round."};
  }else r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W+m.w,openH:H+m.h,opening:`${fmt0(W+m.w)} × ${fmt0(H+m.h)} mm`,damper:`${fmt0(W)} × ${fmt0(H)} mm`,rule:`Width +${m.w} mm; height +${m.h} mm`,reference:m.reference}
 }
 else{const dia=parseFloat($("fdDiameter").value)||0;r={shape:"circle",manufacturer:man.label,product:productKey,method:methodKey,dia,damper:`Ø ${fmt0(dia)} mm`,reference:m.reference};
  if(m.type==="bsb-dry"){const b=parseFloat($("fdBoardThickness").value)||0;r.visualOpen=r.openD=dia+20+2*b;r.apertureShape="square";r.opening=`${fmt0(r.openD)} × ${fmt0(r.openD)} mm cut size`;r.rule=`Diameter +20 mm gap + 2 × ${fmt(b)} mm board`}
  else if(m.type==="bsb-masonry"){r.visualOpen=r.openD=dia+20;r.apertureShape="square";r.opening=`${fmt0(r.openD)} mm square or circular`;r.rule="Diameter +20 mm"}
  else if(m.type==="bsb-ffc"){r.visualOpen=dia+10;r.apertureShape="circle";r.opening=`Ø ${fmt0(dia)} mm nominal (up to +10 mm trim tolerance)`;r.rule="Trim to damper size; plus 10 mm tolerance"}
  else if(m.type==="css-dry"){const a=parseFloat($("fdAllowance").value)||20,b=parseFloat($("fdBoardThickness").value)||12.5,finished=dia+a,cut=finished+2*b;r.visualOpen=cut;r.apertureShape="square";r.opening=`${fmt0(cut)} × ${fmt0(cut)} mm cut size`;r.rule=`Finished square opening Ø casing +${fmt0(a)} mm; cut size +2 × ${fmt(b)} mm board`;r.reference=$("fdWallBuild").value;r.range=`Permitted finished-opening allowance: ${m.min}–${m.max} mm total.`}
  else if(m.type==="css-masonry"){const a=parseFloat($("fdAllowance").value)||20,shape=$("fdApertureShape").value,open=dia+a;r.visualOpen=open;r.apertureShape=shape;r.opening=shape==="square"?`${fmt0(open)} × ${fmt0(open)} mm square`:`Ø ${fmt0(open)} mm circular`;r.rule=`Overall casing diameter +${fmt0(a)} mm total clearance`;r.range=shape==="square"?`Permitted square allowance: ${m.squareMin}–${m.squareMax} mm total.`:`Permitted circular allowance: ${m.circleMin}–${m.circleMax} mm total.`}
  else if(m.type==="css-slab"){const a=parseFloat($("fdAllowance").value)||20,open=dia+a;r.visualOpen=open;r.apertureShape="square";r.opening=`${fmt0(open)} × ${fmt0(open)} mm square`;r.rule=`Overall casing diameter +${fmt0(a)} mm total clearance`;r.range=`Supported square-opening allowance: ${m.squareMin}–${m.squareMax} mm total. Circular slab opening is not enabled because the current guide text and drawing conflict.`}
 }
 $("fdOpeningBig").textContent=r.opening;$("fdMethodBig").textContent=`${r.product} • ${r.reference}`;$("fdDamperSummary").textContent=r.damper;$("fdRuleSummary").textContent=r.rule;$("fdReferenceSummary").textContent=r.reference;$("fdGuideSummary").textContent=`${p.guide} — ${p.revision}`;$("fdManualLink").href=p.manual;drawFD(r);const range=r.range?` ${r.range}`:"";if(r.isLinkOnly)fdMsg("warn","⚠ This installation is identified, but no automatic opening is given because the current guide does not provide one safe universal formula. Use the official Actionair hole sizer or drawing.");else fdMsg("ok",`✅ Independent Vent Tools result based on ${man.label} published installation guidance.${range} Verify the current official manual before construction.`);return r}
async function copyFD(){const r=calcFD(),{man,p}=currentFD();const t=`Vent Tools — Fire Damper Opening\n\nManufacturer: ${man.label}\nProduct: ${r.product}\nMethod/reference: ${r.reference}\nDamper size: ${r.damper}\nBuilder's opening: ${r.opening}\nRule: ${r.rule}\nGuide: ${p.guide} — ${p.revision}\n\nIndependent calculator. Verify against the current official manufacturer installation manual.`;try{await navigator.clipboard.writeText(t);fdMsg("ok","✅ Fire damper result copied.")}catch(e){fdMsg("warn","Could not copy automatically.")}}
function resetFD(){$("fdManufacturer").value="BSB";$("fdWidth").value=500;$("fdHeight").value=300;$("fdDiameter").value=250;$("fdBoardThickness").value=12.5;$("fdDwfxBoard").value=12.5;$("fdDwfxVariant").value="SMOKE";$("fdApertureShape").value="square";fillFDProducts()}
if($("fdSeries")){$("fdManufacturer").addEventListener("change",fillFDProducts);$("fdSeries").addEventListener("change",fillFDMethods);$("fdMethod").addEventListener("change",updateFDInputs);$("fdApertureShape").addEventListener("change",updateFDInputs);["fdWallBuild","fdAllowance","fdDwfxWAllowance","fdDwfxHAllowance","fdHevacGap"].forEach(id=>$(id).addEventListener("change",calcFD));$("fdDwfxVariant").addEventListener("change",()=>{configureDwfx(currentFD().m);calcFD()});$("fdHevacVariant").addEventListener("change",calcFD);["fdWidth","fdHeight","fdDiameter","fdBoardThickness","fdDwfxBoard"].forEach(id=>$(id).addEventListener("input",calcFD));$("fdCopyBtn").addEventListener("click",copyFD);$("fdResetBtn").addEventListener("click",resetFD);fillFDProducts()}

function updateFDManualButtonLabel(){
  const link=$("fdManualLink");
  if(!link) return;
  const manufacturer=$("fdManufacturer").value;
  link.innerHTML=manufacturer==="BSB"
    ? '<span aria-hidden="true">📄</span> Open Official BSB Installation Manual'
    : '<span aria-hidden="true">📄</span> Open Official Actionair Installation Guide';
}
