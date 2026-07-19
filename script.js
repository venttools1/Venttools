const $=id=>document.getElementById(id);function showPage(id){
 const page=$(id)||$("home");
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 page.classList.add("active");
 if(id==="offset")calculateOffset();
 if(id==="ductulator")calculateDuct();
 if(id==="fireDamper")calcFD();
 if(history.replaceState)history.replaceState(null,"",id==="home"?"#home":`#${id}`);
 if(window.venttoolsConsent&&window.venttoolsConsent.analytics)sendVentToolsPageView();
 window.scrollTo({top:0,behavior:"smooth"});
}function rad(d){return d*Math.PI/180}function deg(r){return r*180/Math.PI}function fmt(x){return Number.isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—'}function fmt0(x){return Number.isFinite(x)?String(Math.round(x)):'—'}function getAngle(){return $('angle').value==='custom'?(parseFloat($('angleCustom').value)||45):(parseFloat($('angle').value)||45)}function setMsg(type,txt){let m=$('msg');m.className='msg '+type;m.textContent=txt}
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
  const sinA=Math.sin(th);
  const R=Math.hypot(V,H);
  const T=sinA>0 ? R/sinA : NaN;
  const roll=(V===0&&H===0) ? 0 : deg(Math.atan2(V,H));

  const bend=getBendTakeoff(A,D,rmF);
  const l=bend.l;
  const straight=T-(2*l);

  // Work backwards from the selected minimum straight.
  // Required resultant offset R = sin(angle) × (minimum straight + two bend take-offs).
  const requiredR=sinA>0 ? sinA*(minS+(2*l)) : NaN;
  const minRise=Number.isFinite(requiredR) ? Math.sqrt(Math.max(0,(requiredR*requiredR)-(H*H))) : NaN;
  const riseChange=Number.isFinite(minRise) ? Math.max(0,minRise-V) : NaN;

  $('straightBig').textContent=fmt(straight)+' mm';
  $('rollBig').textContent=fmt(roll)+'°';
  if($('minRiseBig')) $('minRiseBig').textContent=fmt(minRise)+' mm';
  if($('riseChangeBig')) $('riseChangeBig').textContent=riseChange>0 ? '+'+fmt(riseChange)+' mm' : 'No increase';
  if($('minRiseSub')){
    $('minRiseSub').textContent=H>=requiredR
      ? `Your ${fmt(H)} mm offset already provides enough resultant distance, even with zero rise.`
      : `Minimum rise needed with ${fmt(H)} mm offset / over.`;
  }
  if($('riseChangeSub')){
    $('riseChangeSub').textContent=riseChange>0
      ? `Increase the rise from ${fmt(V)} mm to at least ${fmt(minRise)} mm.`
      : `Current rise of ${fmt(V)} mm already achieves at least ${fmt(minS)} mm straight.`;
  }

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
  Minimum rise required  = ${fmt(minRise)} mm
  Rise increase required = ${fmt(riseChange)} mm
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
    setMsg('bad',`❌ Impossible fit. Increase the rise to at least ${fmt(minRise)} mm for a ${fmt(minS)} mm straight, or reduce the offset / bend angle.`);
  }else if(straight<minS){
    setMsg('warn',`⚠ Straight is ${fmt(straight)} mm. Increase rise by ${fmt(riseChange)} mm to at least ${fmt(minRise)} mm for a ${fmt(minS)} mm straight.`);
  }else if(!bend.exact){
    setMsg('warn','⚠ Cut length uses an estimated bend take-off because this exact angle/diameter is not in the current manufacturer table.');
  }else{
    setMsg('ok',`✅ Straight is ${fmt(straight)} mm, which meets the selected ${fmt(minS)} mm minimum.`);
  }
  return result;
}
function angleUI(){let c=$('angle').value==='custom';$('angleCustom').style.display=c?'block':'none';if(!c)$('angleCustom').value=$('angle').value}function resetOffset(){$('up').value=300;$('over').value=250;$('angle').value='45';$('angleCustom').value=45;$('dia').value=315;$('minStraight').value=120;$('rmFactor').value=1;angleUI();calculateOffset()}async function copyOffset(){let r=calculateOffset();try{await navigator.clipboard.writeText(r);setMsg('ok','✅ Result copied.')}catch(e){setMsg('warn','Could not copy automatically. Long-press working text and copy manually.')}}function toggleWorking(){let o=$('out'),show=o.style.display==='block';o.style.display=show?'none':'block';$('workingBtn').textContent=show?'Show working':'Hide working'}['up','over','dia','minStraight','rmFactor','angle','angleCustom'].forEach(id=>{$(id).addEventListener('input',()=>{angleUI();calculateOffset()});$(id).addEventListener('change',()=>{angleUI();calculateOffset()})});$('resetBtn').addEventListener('click',resetOffset);$('copyBtn').addEventListener('click',copyOffset);$('workingBtn').addEventListener('click',toggleWorking);
const standardSpiral=[80,100,125,150,160,180,200,224,250,280,300,315,355,400,450,500,560,600,630,710,800,900,1000,1120,1250];function nearestStandard(d){let best=standardSpiral[0];for(const s of standardSpiral){if(Math.abs(s-d)<Math.abs(best-d))best=s}return best}function drawDuctulator(w,h,dia){let layer=$('ductDiagramLayer'),rx=90,ry=60,rw=230,rh=115,cx=560,cy=120,r=65;layer.innerHTML=`<defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 Z" fill="#064b82"/></marker></defs><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" fill="#d9dde3" stroke="#111827" stroke-width="3"/><line x1="${rx}" y1="${ry+rh/2}" x2="${rx+rw}" y2="${ry+rh/2}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${rx+rw/2}" y="${ry+rh+32}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${fmt0(w)} × ${fmt0(h)} mm</text><path d="M350 120 L455 120" stroke="#064b82" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9dde3" stroke="#111827" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="18" fill="none" stroke="#9aa4b2" stroke-width="1.6"/><ellipse cx="${cx}" cy="${cy}" rx="${r*.72}" ry="12" fill="none" stroke="#9aa4b2" stroke-width="1.4"/><line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${cx}" y="${cy+r+34}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">Ø ${fmt(dia)} mm</text>`}
function calculateDuct(){const w=parseFloat($('rectW').value)||0,h=parseFloat($('rectH').value)||0,area=w*h,eq=Math.sqrt((4*area)/Math.PI),near=nearestStandard(eq);$('eqRound').textContent=fmt(eq)+' mm';$('nearestRound').textContent='Ø '+fmt0(near);$('rectArea').textContent=fmt0(area)+' mm²';drawDuctulator(w,h,eq);return `Vent Tools - Rect to Round Ductulator\n\nRectangular duct: ${fmt0(w)} × ${fmt0(h)} mm\nArea: ${fmt0(area)} mm²\nSame-area round: Ø ${fmt(eq)} mm\nNearest standard spiral: Ø ${fmt0(near)} mm`}async function copyDuct(){let r=calculateDuct();try{await navigator.clipboard.writeText(r)}catch(e){}}function resetDuct(){$('rectW').value=600;$('rectH').value=300;calculateDuct()}['rectW','rectH'].forEach(id=>$(id).addEventListener('input',calculateDuct));$('copyDuctBtn').addEventListener('click',copyDuct);$('resetDuctBtn').addEventListener('click',resetDuct);angleUI();calculateOffset();calculateDuct();


const ADVANCED_AIR_DOCUMENTS={
  IOM_0160:{url:"https://www.advancedair.co.uk/app/uploads/0160_IOM_Rev1.0.pdf",title:"0160 Installation Manual"},
  IOM_2530:{url:"https://www.advancedair.co.uk/app/uploads/2530_IOM_Rev1.1.pdf",title:"2530 Installation Manual"},
  IOM_0400_0500:{url:"https://www.advancedair.co.uk/app/uploads/0400-0500_IOM_Rev1.1.pdf",title:"0400/0500 Installation Manual"},
  IOM_26SCD:{url:"https://www.advancedair.co.uk/app/uploads/26SCD_IOM_Rev1.0.pdf",title:"26SCD Installation Manual"}
};

const FD_MANUFACTURERS={
  BSB:{label:"BSB",products:{
    "FSD-TD":{label:"FSD-TD — Rectangular fire/smoke damper",shape:"rect",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/fsd_td_iom.pdf",guide:"BSB FSD-TD Installation, Operation and Maintenance Instructions",revision:"V62904",methods:{
      M5:{label:"M5 — Drywall, non-cleated frameless",type:"bsb-rect-dry",finishedW:121,finishedH:96,reference:"FSD-TD M5",wall:"Symmetrical drywall: 50 mm steel frame with two layers of 12.5 mm D&F fire board on each wall face. These wall-face layers are separate from the single aperture-lining board fitted around each internal edge",seal:"Two-layer plasterboard pattress each side; void filling is not required",classification:"See BSB method M5",note:"Finished aperture allows 10 mm top/bottom, 10 mm non-actuator side and 35 mm actuator side.",settingOut:{basis:"casing-edge",casingProjectionBottom:38,casingProjectionTop:38,bottomClearance:10,topClearance:10,source:"BSB FSD-TD M5 sections 8.1.2 and 8.2.9: finished aperture is nominal height +96 mm, with 10 mm clearance above and below the damper case; the damper is positioned centrally. This gives a 38 mm casing projection beyond the nominal duct at both top and bottom."}},
      M6:{label:"M6 — Drywall, pattress and cleat",type:"bsb-rect-dry",finishedW:156,finishedH:96,settingOut:{basis:"nominal-duct",bottomFinished:48,topFinished:48,source:"BSB FSD-TD M6: nominal height +96 mm and damper positioned centrally in the lined opening."},reference:"FSD-TD M6",wall:"Symmetrical drywall: 50 mm steel frame with two layers of 12.5 mm D&F fire board on each wall face. These wall-face layers are separate from the single aperture-lining board fitted around each internal edge",seal:"Lined opening with tested pattress and cleat arrangement",classification:"See BSB method M6",note:"Use every fixing position and ensure screws pick up the aperture track."},
      M9:{label:"M9 — Drywall, AF Easy Fix angle frame",type:"bsb-rect-dry",finishedW:122,finishedH:99,casingAddW:102,casingAddH:79,clearanceLeft:10,clearanceRight:10,clearanceBottom:10,clearanceTop:10,reference:"FSD-TD M9",settingOut:{basis:"casing-edge",casingProjectionBottom:39.5,casingProjectionTop:39.5,bottomClearance:10,topClearance:10,source:"BSB FSD-TD M9: overall casing is derived from the published nominal-size build-up and the finished aperture provides 10 mm clearance above and below the casing."},wall:"Symmetrical drywall: 50 mm steel frame with two layers of 12.5 mm D&F fire board on each wall face. These wall-face layers are separate from the single aperture-lining board fitted around each internal edge",seal:"Lined opening; Easy Fix angle frame fixed through the tested pilot holes",classification:"See BSB method M9",note:"Finished aperture includes the manufacturer-specified installation/expansion gaps around the casing. Use the inner row of pilot holes for drywall."},
      M10:{label:"M10 — Masonry wall, AF Easy Fix angle frame",type:"bsb-rect-solid",finishedW:122,finishedH:99,settingOut:{basis:"nominal-duct",bottomFinished:49.5,topFinished:49.5,source:"BSB FSD-TD M10: published opening height is nominal +99 mm and the damper is positioned centrally."},reference:"FSD-TD M10",wall:"Masonry wall matching the BSB tested construction",seal:"Easy Fix angle frame; void behind the frame does not require filling where stated",classification:"See BSB method M10",note:"Use the outer pilot holes and keep fixing anchors at least 20 mm from aperture edges."},
      M11:{label:"M11 — Masonry floor, AF Easy Fix angle frame",type:"bsb-rect-solid",finishedW:122,finishedH:99,settingOut:{basis:"nominal-duct",bottomFinished:49.5,topFinished:49.5,source:"BSB FSD-TD M11: published opening height is nominal +99 mm and the damper is positioned centrally."},reference:"FSD-TD M11",wall:"Masonry floor, minimum 150 mm, density 580 kg/m³",seal:"Easy Fix angle frame; no need to fill the opening void",classification:"E 120 (ho i←o) S",note:"Finished aperture: nominal width +122 mm and nominal height +99 mm."}
    }},
    "FD-C":{label:"FD-C — Circular fire damper",shape:"circle",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/fd_c_series_iom.pdf",guide:"BSB FD-C Installation, Operation and Maintenance Instructions",revision:"V62904",minSize:100,maxSize:315,methods:{
      M9:{label:"M9 — Drywall partition, lined opening",type:"bsb-circle-dry-lined",add:20,reference:"FD-C M9",wall:"Fire-rated drywall supporting construction",seal:"10 mm nominal gap all round; opening lined with fire-rated wall board",note:"Finished aperture is square and nominal diameter +20 mm.",settingOut:{basis:"nominal-duct",bottomFinished:10,topFinished:10,source:"BSB FD-C M9: 10 mm nominal gap all round"}},
      M10:{label:"M10 — Masonry wall",type:"bsb-circle-solid",add:20,reference:"FD-C M10",settingOut:{basis:"nominal-duct",bottomFinished:10,topFinished:10,source:"BSB FD M10: opening is 10 mm larger than the casing on each side and the damper is centred."},wall:"Masonry wall matching the tested detail",seal:"Follow the tested BSB masonry sealing and plate fixing arrangement",note:"Opening is nominal diameter +20 mm."},
      M11:{label:"M11 — Masonry floor",type:"bsb-circle-solid",add:20,reference:"FD-C M11",settingOut:{basis:"nominal-duct",bottomFinished:10,topFinished:10,source:"BSB FD M11: opening is 10 mm larger than the casing on each side and the damper is centred."},wall:"Concrete/masonry floor matching the tested detail",seal:"Follow the tested BSB floor sealing and plate fixing arrangement",note:"Opening is nominal diameter +20 mm."},
      M14:{label:"M14 — Flexible fire curtain",type:"bsb-circle-trim",add:10,reference:"FD-C M14",wall:"Tested flexible fire-curtain construction",seal:"Trim opening to the BSB tested fire-curtain detail",note:"Use nominal diameter with up to 10 mm trim tolerance."}
    }},
    "FSD-C":{label:"FSD-C — Circular fire/smoke damper",shape:"circle",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/fsd_c_iom_11zon.pdf",guide:"BSB FSD-C Installation, Operation and Maintenance Instructions",revision:"V62904",minSize:100,maxSize:315,methods:{
      M9:{label:"M9 — Drywall partition, lined opening",type:"bsb-circle-dry-lined",add:20,reference:"FSD-C M9",wall:"Fire-rated drywall supporting construction",seal:"10 mm nominal gap all round; line opening to the tested BSB detail",note:"Use every installation-plate fixing position.",settingOut:{basis:"nominal-duct",bottomFinished:10,topFinished:10,source:"BSB FSD-C M9: 10 mm nominal gap all round"}},
      M10:{label:"M10 — Masonry wall",type:"bsb-circle-solid",add:20,reference:"FSD-C M10",settingOut:{basis:"nominal-duct",bottomFinished:10,topFinished:10,source:"BSB FSD-C M10: nominal diameter +20 mm opening, damper centred."},wall:"Masonry wall matching the tested detail",seal:"Tested plate and penetration-seal arrangement",note:"Opening is nominal diameter +20 mm."},
      M11:{label:"M11 — Masonry floor / Batt infill",type:"bsb-circle-solid",add:20,reference:"FSD-C M11",wall:"Masonry floor matching the tested detail",seal:"Ablative Batt infill where required by the selected drawing",note:"Use all fixing holes and the exact Batt arrangement."},
      M14:{label:"M14 — Flexible fire curtain",type:"bsb-circle-trim",add:10,reference:"FSD-C M14",wall:"Tested flexible fire-curtain construction",seal:"Trim and fix only as shown in the BSB drawing",note:"Use nominal diameter with up to 10 mm trim tolerance."}
    }},
    "MFD-IC":{label:"MFD-IC — Motorised insulated circular fire damper",shape:"circle",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2026/06/MFD-IC-IOM.pdf",guide:"BSB MFD-IC Installation, Operation and Maintenance Instructions",revision:"V012606",minSize:100,maxSize:315,methods:{
      M9:{label:"M9 — Drywall, Batt installation — opening NOT lined",type:"bsb-circle-square-table",openingTable:{100:140,125:165,150:190,160:200,200:240,250:290,300:340,315:355},settingOut:{basis:"table-centred",source:"BSB MFD-IC M9 opening table; damper positioned centrally and opening is not lined."},reference:"MFD-IC M9",wall:"Group A 50 mm steel stud; 2 × 12.5 mm Type F board each side",seal:"Two layers of 50 mm ablative-coated Batt; seal exposed insulation faces",note:"The wall opening must not be lined. Fix the plate into the steel track using all applicable holes."},
      M10:{label:"M10 — Masonry wall, Batt infill",type:"bsb-circle-square-table",openingTable:{100:140,125:165,150:190,160:200,200:240,250:290,300:340,315:355},settingOut:{basis:"table-centred",source:"BSB MFD-IC M10 opening table; damper positioned centrally."},reference:"MFD-IC M10",wall:"Masonry wall, minimum 100 mm and density 600 kg/m³",seal:"Ablative-coated Batt infill",note:"Use fire-rated steel anchors and all fixing positions."},
      M11:{label:"M11 — Masonry floor, Batt infill",type:"bsb-circle-square-table",openingTable:{100:140,125:165,150:190,160:200,200:240,250:290,300:340,315:355},settingOut:{basis:"table-centred",source:"BSB MFD-IC M11 opening table; damper positioned centrally."},reference:"MFD-IC M11",wall:"Concrete floor, minimum 150 mm and density 600 kg/m³",seal:"Ablative-coated Batt infill",note:"Use fire-rated steel anchors and all fixing positions."},
      M15:{label:"M15 — Masonry floor, mortar infill",type:"bsb-circle-round-table",openingTable:{100:178.5,125:203.5,150:228.5,160:238.5,200:278.5,250:328.5,300:378.5,315:393.5},settingOut:{basis:"table-centred",source:"BSB MFD-IC M15 published round opening table; damper positioned centrally."},reference:"MFD-IC M15",wall:"Concrete floor, minimum 150 mm and density 600 kg/m³",seal:"Tested mortar infill arrangement",note:"Follow the current M15 drawing for mortar depth and fixing detail."}
    }},
    "AT-FSD":{label:"AT-FSD — Air-transfer fire/smoke damper",shape:"rect",manual:"https://www.bsb-dampers.co.uk/wp-content/uploads/2024/07/at_fsd_iom_compressed.pdf",guide:"BSB AT-FSD Installation, Operation and Maintenance Instructions",revision:"V12204",methods:{
      M9:{label:"M9 — Drywall, fully lined unducted opening",type:"bsb-at-dry",reference:"AT-FSD M9",wall:"Tested drywall construction, fully lined on all four internal sides",seal:"No intumescent mastic is required for fire integrity; it may be used only where an airtight everyday joint is required",classification:"E 120 (ve i→o) S",note:"Actual sleeve is 10 mm below nominal size, giving 5 mm clearance per side. Finished aperture is the ordered nominal size with the BSB +5/-0 mm tolerance.",settingOut:{basis:"nominal-duct",bottomFinished:0,topFinished:0,source:"BSB AT-FSD IOM 10.7–10.9: finished aperture is nominal size and the sleeve is nominal minus 10 mm."}},
      M10:{label:"M10 — Masonry wall, unducted opening",type:"bsb-at-solid",reference:"AT-FSD M10",wall:"Masonry/concrete wall with lintel over the aperture where required",seal:"No intumescent mastic is required for fire integrity; it may be used only where an airtight everyday joint is required",classification:"E 120 (ve i→o) S",note:"Use 5 mm diameter × 40 mm minimum steel fixings through the outer flange holes. Actual sleeve is 10 mm below nominal size.",settingOut:{basis:"nominal-duct",bottomFinished:0,topFinished:0,source:"BSB AT-FSD IOM 10.7–10.8 and M10 drawing."}}
    }}
  }},
  ADVANCED_AIR:{label:"Advanced Air",products:{
    "0160":{label:"0160 — Curtain fire damper",shape:"rect",documentId:"IOM_0160",manual:ADVANCED_AIR_DOCUMENTS.IOM_0160.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_0160.title,guide:"Advanced Air 0160 Installation, Operation and Maintenance Manual",revision:"Rev 1.1 • April 2026",methods:{
      AFS_60:{label:"AFS — 60 minute flexible/rigid wall",type:"advanced-afs-0160",reference:"0160 AFS • E60",wall:"Flexible or rigid supporting construction, minimum 94 mm",seal:"Two layers of 50 mm, 140 kg/m³ coated fire batt with tested intumescent sealant",classification:"E60",note:"Opening shown is the manufacturer table minimum. Letterbox lining is part of the wall construction and is not added again by VentTools."},
      AFS_120:{label:"AFS — 120 minute flexible/rigid wall",type:"advanced-afs-0160",reference:"0160 AFS • E120",wall:"Flexible or rigid supporting construction, minimum 131 mm",seal:"Two layers of 50 mm, 140 kg/m³ coated fire batt with tested intumescent sealant",classification:"E120",note:"Opening shown is the manufacturer table minimum. Letterbox lining is part of the wall construction and is not added again by VentTools."},
      TRIMOTERM:{label:"Trimoterm wall — E120",type:"advanced-rect-fixed",addW:55,addH:55,tolerance:10,reference:"0160 Trimoterm • E120",wall:"Trimoterm sandwich panel, minimum 120 mm",seal:"Tested capping, Astroflame Astro INTU Mastic or equivalent, and retaining flanges",classification:"E120",note:"Opening is nominal width and height +55 mm, tolerance ±10 mm."}
    }},
    "2530":{label:"2530 — Motorised fire damper",shape:"rect",documentId:"IOM_2530",manual:ADVANCED_AIR_DOCUMENTS.IOM_2530.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_2530.title,guide:"Advanced Air 2530 Installation, Operation and Maintenance Manual",revision:"Rev 1.1 • April 2026",methods:{
      AFS:{label:"AFS — flexible/rigid wall",type:"advanced-afs-2530",reference:"2530 AFS",wall:"Flexible or rigid wall matching the selected 60/120 minute tested construction",seal:"Two layers of 50 mm, 140 kg/m³ coated fire batt with tested intumescent sealant",classification:"E60/E120 S",note:"The opening shown is the published minimum for the entered nominal size. The AFS frame and fire-batt zone are already included."},
      HEVAC:{label:"HEVAC frame — rigid wall E120",type:"advanced-hevac-2530",reference:"2530 HEVAC • E120",wall:"Rigid wall, minimum 150 mm",seal:"HEVAC frame with turnback tabs and 4:1 mortar mix",classification:"E120 S",note:"The damper must remain able to move within the HEVAC frame. Do not fill mortar onto the damper spigots."}
    }},
    "26SCD":{label:"26SCD — Smoke control damper",shape:"rect",documentId:"IOM_26SCD",manual:ADVANCED_AIR_DOCUMENTS.IOM_26SCD.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_26SCD.title,guide:"Advanced Air 26SCD Installation, Operation and Maintenance Manual",revision:"Rev 1.0 • April 2026",methods:{
      OFFICIAL:{label:"AFS wall / remote installation — official opening table required",type:"advanced-link",reference:"26SCD tested installation",note:"The 26SCD has wall and remote-from-wall methods. VentTools will not apply the 0160/2530 opening table without the exact selected 26SCD dimensional table."}
    }},
    "0400MAN":{label:"0400MAN — Circular fire damper",shape:"circle",documentId:"IOM_0400_0500",manual:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.title,guide:"Advanced Air 0400/0500 Installation, Operation and Maintenance Manual",revision:"Rev 1.1 • December 2025",minSize:100,maxSize:315,methods:{
      FLEX_60:{label:"60 minute flexible wall — square letterbox",type:"advanced-circle-fixed",add:55,openingShape:"square",reference:"0400MAN flexible wall • E60",wall:"Flexible wall, minimum 106 mm, two layers of 12.5 mm Type F board each side",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening to form: nominal diameter +55 mm, square, tolerance ±4 mm."},
      FLEX_120:{label:"120 minute flexible wall — square letterbox",type:"advanced-circle-fixed",add:55,openingShape:"square",reference:"0400MAN flexible wall • E120",wall:"Flexible wall, minimum 131 mm, two layers of 15 mm Type F board each side",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening to form: nominal diameter +55 mm, square, tolerance ±4 mm."},
      RIGID_60:{label:"60 minute rigid wall — square/circular opening",type:"advanced-circle-fixed",add:35,openingShape:"square",reference:"0400MAN rigid wall • E60",wall:"Rigid wall, minimum 106 mm",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening: nominal diameter +35 mm; stated tolerance ±25 mm."},
      RIGID_120:{label:"120 minute rigid wall — square/circular opening",type:"advanced-circle-fixed",add:35,openingShape:"square",reference:"0400MAN rigid wall • E120",wall:"Rigid wall, minimum 131 mm",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening: nominal diameter +35 mm; stated tolerance ±25 mm."}
    }},
    "0400FME":{label:"0400FME — Circular motorised fire damper",shape:"circle",documentId:"IOM_0400_0500",manual:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.title,guide:"Advanced Air 0400/0500 Installation, Operation and Maintenance Manual",revision:"Rev 1.1 • December 2025",minSize:100,maxSize:315,methods:{
      FLEX_60:{label:"60 minute flexible wall — square letterbox",type:"advanced-circle-fixed",add:55,openingShape:"square",reference:"0400FME flexible wall • E60 S",wall:"Flexible wall, minimum 106 mm",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening to form: nominal diameter +55 mm, square."},
      FLEX_120:{label:"120 minute flexible wall — square letterbox",type:"advanced-circle-fixed",add:55,openingShape:"square",reference:"0400FME flexible wall • E120 S",wall:"Flexible wall, minimum 131 mm",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening to form: nominal diameter +55 mm, square."},
      RIGID:{label:"Rigid wall — square/circular opening",type:"advanced-circle-fixed",add:35,openingShape:"square",reference:"0400FME rigid wall",wall:"Rigid wall matching the selected tested construction",seal:"Two layers of 50 mm, 140 kg/m³ fire batt",note:"Manufacturer opening: nominal diameter +35 mm."}
    }},
    "0500MAN":{label:"0500MAN — Circular floor fire damper",shape:"circle",documentId:"IOM_0400_0500",manual:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.url,manualTitle:ADVANCED_AIR_DOCUMENTS.IOM_0400_0500.title,guide:"Advanced Air 0400/0500 Installation, Operation and Maintenance Manual",revision:"Rev 1.1 • December 2025",minSize:100,maxSize:315,methods:{
      FLOOR:{label:"Rigid floor — compound infill E120",type:"advanced-circle-floor",add:10,reference:"0500MAN floor • E120",wall:"Aerated concrete floor, minimum 150 mm, density 575 kg/m³ ±50 kg/m³",seal:"Silverseal HS Compound, minimum 100 mm thick",note:"Minimum opening is nominal diameter +10 mm. Maximum permitted opening is 1800 × 1800 mm."}
    }}
  }},
  ACTIONAIR:{label:"Swegon (Actionair products)",products:{
    CSS:{label:"CSS — Circular fire/smoke damper",shape:"circle",manual:"https://www.swegon.com/globalassets/digizuite/10514-en-css_installation_en.pdf",guide:"Actionair CSS Installation Guide",revision:"LNNN00356 v6.0 • 27 May 2025",methods:{
      CSS_DRY:{label:"Vertical — plasterboard wall",type:"css-dry",reference:"AA/F13413 / AA/F12820",min:10,max:40,step:10,defaultAllowance:30},
      CSS_MASONRY:{label:"Vertical — masonry wall",type:"css-masonry",reference:"AA/F12822",squareMin:10,squareMax:40,circleMin:10,circleMax:30,step:10,defaultAllowance:30},
      CSS_SLAB:{label:"Horizontal — concrete slab",type:"css-slab",reference:"AA/F12821",squareMin:10,squareMax:40,step:10,defaultAllowance:30}
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
    "SPAN":{label:"SPAN — SmokeShield builder's opening",shape:"span",manual:"https://www.swegon.com/uk/products/fire-and-smoke-control/fire-and-smoke-dampers/fire-dampers/smokeshield/",guide:"Actionair SPAN builder's opening data",revision:"VentTools checked against uploaded Actionair V5 opening calculator",methods:{
      SPAN_STANDARD:{label:"SPAN slab installation — recommended opening",type:"actionair-span",reference:"SmokeShield PTC SPAN"}
    }},
    "HEVAC-IF":{label:"HEVAC / HVCA Installation Frame — Rectangular",shape:"rect",manual:"https://www.swegon.com/globalassets/digizuite/10508-en-smokeshield_hevac_hvca_installation_en.pdf",guide:"Actionair I/F Installation Guide",revision:"LNNN00352 v5.1 • 26 May 2022",methods:{
      HEVAC_WALL:{label:"Vertical installation frame in masonry wall",type:"hevac-frame",referenceSmoke:"AA/F10702",referenceFire:"AA/F10703"},
      HEVAC_SLAB:{label:"Horizontal installation frame in concrete slab — FireShield only",type:"hevac-frame",referenceFire:"AA/F10701",fireOnly:true}
    }}
  }},
  LINDAB:{label:"Lindab",products:{
    "FNC1":{label:"FNC1 — Circular 300 Pa",shape:"circle",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/ywe3nwrhmtqtmgmwoc00njm2ltliotatywzjzjiwmty0otdh/5249534188784331220/fnc1_booklet_document_en_l.pdf?v=1783815510",guide:"Lindab FNC1 Installation Booklet",revision:"1MUBFNC1EN-LIND rev 20-12",minSize:100,maxSize:400,methods:{
      FNC1_WET30:{label:"Rigid/flexible wall — wet or rock wool seal",type:"lindab-circle-fixed",reference:"EI 60 S",add:30,openingShape:"circle",note:"Wall minimum thickness 95 mm."},
      FNC1_DRY10:{label:"Rigid/flexible wall — acrylic dry seal",type:"lindab-circle-fixed",reference:"EI 60 S",add:10,openingShape:"circle",note:"Wall minimum thickness 95 mm."},
      FNC1_FLOOR:{label:"Floor — mortar/plaster/rock wool seal",type:"lindab-circle-range",reference:"EI 60 S",minAdd:30,maxAdd:55,recommendedAdd:30,openingShape:"circle",note:"Floor minimum thickness 100 mm; density 550 kg/m³."}
    }},
    "WH25":{label:"WH25 — Circular 500 Pa",shape:"circle",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/ntaxztfkngitmzcwny00n2yxlwflodutzmm4mtqyowvlyju0/5249534188948240062/wh25_booklet_document_en_l.pdf?v=1783815573",guide:"Lindab WH25 Installation Booklet",revision:"1MUBWH25EN-LIND rev 20-10",minSize:100,maxSize:315,methods:{
      WH25_RIGID_WET:{label:"Rigid wall — mortar/plaster seal",type:"lindab-circle-range",reference:"EI 120 S",minAdd:25,maxAdd:440,recommendedAdd:25,openingShape:"circle",note:"Wall minimum thickness 100 mm; density 550 kg/m³."},
      WH25_RIGID_DRY:{label:"Rigid wall — plasterboard and rock wool",type:"lindab-circle-square-range",reference:"EI 90 S",minAdd:50,maxAdd:70,recommendedAdd:50,note:"Square opening. Wall minimum thickness 100 mm."},
      WH25_FLOOR:{label:"Floor — mortar seal",type:"lindab-circle-range",reference:"EI 90/120 S",minAdd:25,maxAdd:35,recommendedAdd:25,openingShape:"circle",note:"Floor minimum thickness 100 mm for EI90 or 150 mm for EI120."}
    }},
    "WH45":{label:"WH45 — Circular 500 Pa",shape:"circle",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/ytgxowu4ytgtmwviyi00otk0lwe4mzqtyjjhmja0ymqwmgy4/5249534189216862126/wh45_booklet_document_en_l.pdf?v=1783815574",guide:"Lindab WH45 Installation Booklet",revision:"1MUBWH45EN-LIND rev 20-10",minSize:200,maxSize:800,methods:{
      WH45_RIGID_DRY:{label:"Rigid/flexible wall — plasterboard and rock wool",type:"lindab-circle-square-range",reference:"EI 90 S",minAdd:35,maxAdd:50,recommendedAdd:35,note:"Square opening. Wall minimum thickness 100 mm."},
      WH45_RIGID_WET:{label:"Rigid/flexible wall — mortar or plaster",type:"lindab-circle-range",reference:"EI 120 S",minAdd:25,maxAdd:580,recommendedAdd:25,openingShape:"circle",note:"Wall minimum thickness 100 mm."},
      WH45_FLOOR:{label:"Floor — mortar seal",type:"lindab-circle-range",reference:"EI 90/120/180 S",minAdd:40,maxAdd:55,recommendedAdd:40,openingShape:"circle",note:"Floor minimum thickness 100 or 150 mm depending on classification."}
    }},
    "WK25":{label:"WK25 — Rectangular 500 Pa",shape:"rect",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/mme2zdgzzjuty2u2ns00ndu4ltgzzwmtzjrjyzu4zmfmm2y3/5250840905260342233/wk25_booklet_document_en_l.pdf?v=1783821298",guide:"Lindab WK25 Installation Booklet",revision:"1MUBWK25EN-LIND rev 25-03",methods:{
WK25_RIGID_WET:{label:"Rigid wall — inside — mortar/plaster",type:"wk25-range",reference:"EI 120 S • 500 Pa • page 26",minW:50,maxW:440,minH:50,maxH:440,recommendedW:50,recommendedH:50,wall:"Rigid wall, minimum 100 mm, 550 kg/m³",seal:"Mortar or plaster putty",spacingA:44,spacingB:75,pairAllowed:true,note:"Single or approved paired assembly."},
WK25_RIGID_DRY:{label:"Rigid wall — inside — rock wool/plasterboard",type:"wk25-range",reference:"EI 120 S • 500 Pa • page 26",minW:50,maxW:70,minH:50,maxH:70,recommendedW:50,recommendedH:50,wall:"Rigid wall, minimum 100 mm, 550 kg/m³",seal:"100 kg/m³ rock wool with plasterboard or calcium silicate",spacingA:44,spacingB:75,pairAllowed:true,note:"Single or approved paired assembly."},
WK25_RIGID_WEICH:{label:"Rigid wall — inside — Fire Batt / Weichschott",type:"wk25-fixed",reference:"EI 120 S • 300 Pa • page 27",w:800,h:800,wall:"Rigid wall, minimum 100 mm, 550 kg/m³",seal:"140 kg/m³ rock-wool boards with approved coating/sealant",spacingA:44,spacingB:50,pairAllowed:true,note:"Fixed square opening allowance."},
WK25_RIGID_ON:{label:"Rigid wall — face mounted — KITFP",type:"wk25-fixed",reference:"EI 90 S • 300 Pa • page 28",w:50,h:50,wall:"Rigid wall, minimum 100 mm",seal:"Factory-fitted face-wall kit with mortar wall seal",spacingA:165,spacingB:80,pairAllowed:false,note:"KITFP must be factory assembled."},
WK25_RIGID_REMOTE_WET:{label:"Rigid wall — remote — mortar/plaster",type:"wk25-range",reference:"EI 90/120 S • page 29",minW:50,maxW:440,minH:50,maxH:440,recommendedW:50,recommendedH:50,wall:"Rigid wall, minimum 100 mm, 550 kg/m³",seal:"140 kg/m³ duct insulation with approved coating; mortar/plaster wall seal",spacingA:200,spacingB:110,pairAllowed:false,note:"Follow official suspension and distance details."},
WK25_RIGID_REMOTE_WEICH:{label:"Rigid wall — remote — Fire Batt / Weichschott",type:"wk25-fixed",reference:"EI 90/120 S • page 30",w:800,h:800,wall:"Rigid wall, minimum 100 mm, 550 kg/m³",seal:"140 kg/m³ duct insulation and Weichschott wall seal",spacingA:200,spacingB:110,pairAllowed:false,note:"Remote installation."},
WK25_RIGID_REMOTE_KIT:{label:"Rigid wall — remote — KITFP + Promat 478",type:"wk25-fixed",reference:"EI 90 S • page 31",w:50,h:50,wall:"Rigid wall, minimum 100 mm",seal:"Factory KITFP; Promat 478 duct insulation; mortar wall seal",spacingA:165,spacingB:80,pairAllowed:false,note:"Use specified KITSRP components."},
WK25_LIGHTF_DRY:{label:"Light wall type F — inside — rock wool/plasterboard",type:"wk25-range",reference:"EI 120 S • 500 Pa • page 32",minW:75,maxW:95,minH:75,maxH:95,recommendedW:75,recommendedH:75,wall:"Light wall type F, minimum 100 mm",seal:"100 kg/m³ rock wool with plasterboard both sides or calcium silicate",spacingA:44,spacingB:75,pairAllowed:true,note:"Single or approved paired assembly."},
WK25_LIGHTF_WET:{label:"Light wall type F — inside — mortar/plaster",type:"wk25-range",reference:"EI 120 S • 500 Pa • page 32",minW:75,maxW:440,minH:75,maxH:440,recommendedW:75,recommendedH:75,wall:"Light wall type F, minimum 100 mm",seal:"Mortar or plaster putty",spacingA:44,spacingB:75,pairAllowed:true,note:"Single or approved paired assembly."},
WK25_LIGHT_REMOTE_DRY:{label:"Light wall — remote — rock wool/plasterboard",type:"wk25-range",reference:"EI 90/120 S • page 39",minW:75,maxW:95,minH:75,maxH:95,recommendedW:75,recommendedH:75,wall:"Certified light wall, minimum 100 mm",seal:"100 kg/m³ wall infill; 140 kg/m³ insulated duct with approved coating",spacingA:200,spacingB:110,pairAllowed:false,note:"Maximum wall distance 1000 mm; maximum connected duct 2100 mm."},
WK25_LIGHT_REMOTE_WET:{label:"Light wall — remote — mortar/plaster",type:"wk25-range",reference:"EI 90/120 S • page 39",minW:75,maxW:440,minH:75,maxH:440,recommendedW:75,recommendedH:75,wall:"Certified light wall, minimum 100 mm",seal:"Mortar/plaster wall seal; 140 kg/m³ insulated duct with approved coating",spacingA:200,spacingB:110,pairAllowed:false,note:"Maximum wall distance 1000 mm; maximum connected duct 2100 mm."},
WK25_GYPSUM_DRY:{label:"Solid gypsum-block wall — inside",type:"wk25-range",reference:"EI 120 S • manual method",minW:75,maxW:95,minH:75,maxH:95,recommendedW:75,recommendedH:75,wall:"Solid gypsum blocks, minimum 100 mm, 995 kg/m³",seal:"Plasterboard on both sides",spacingA:44,spacingB:75,pairAllowed:true,note:"Approved paired assembly permitted."},
WK25_GYPSUM_WEICH:{label:"Solid gypsum-block wall — Fire Batt / Weichschott",type:"wk25-fixed",reference:"EI 120 S • manual method",w:800,h:800,wall:"Solid gypsum blocks, minimum 100 mm, 995 kg/m³",seal:"140 kg/m³ rock-wool boards with approved coating/sealant",spacingA:44,spacingB:50,pairAllowed:true,note:"Fixed square opening allowance."},
WK25_SHAFT:{label:"Shaft wall — inside",type:"wk25-range",reference:"EI 60 S • manual method",minW:75,maxW:95,minH:75,maxH:95,recommendedW:75,recommendedH:75,wall:"Certified shaft-wall construction",seal:"Mortar or plaster putty on motor side",spacingA:200,spacingB:75,pairAllowed:false,note:"Paired installation not permitted."},
WK25_FLOOR_WET:{label:"Floor — inside slab — mortar",type:"wk25-range",reference:"EI 90/120/180 S • floor methods",minW:50,maxW:440,minH:50,maxH:440,recommendedW:50,recommendedH:50,wall:"Certified floor; required thickness/density depends on EI rating",seal:"Mortar",spacingC:44,spacingD:75,pairAllowed:true,note:"Paired assembly permitted with separate ducts."},
WK25_FLOOR_WEICH:{label:"Floor — Fire Batt / Weichschott",type:"wk25-fixed",reference:"EI 120 S • floor method",w:800,h:800,wall:"Certified floor construction",seal:"140 kg/m³ rock-wool boards with approved coating/sealant",spacingC:200,spacingD:75,pairAllowed:false,note:"Paired installation not permitted."}
}},
    "WK45":{label:"WK45 — Rectangular 500/300 Pa",shape:"rect",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/yzk1nduxndytztk1my00odhlltlkztutztdkyweymta3zti5/5250833076614407765/wk45_booklet_document_en_l.pdf?v=1783821283",guide:"Lindab WK45 Installation Booklet",revision:"1MUBWK45EN-LIND rev 25-12",methods:{
      WK45_RIGID_180:{label:"Rigid wall 140 mm — mortar — EI 180 S",type:"lindab-rect-range",reference:"EI 180 S • 500 Pa • page 22",minW:80,maxW:110,minH:80,maxH:110,recommendedW:80,recommendedH:80,wall:"Rigid wall, minimum 140 mm, minimum density 550 kg/m³",seal:"Mortar",spacing:0,edge:75,classification:"EI 180 S",pairAllowed:true,note:"Inside the wall; horizontal or vertical blade axis."},
      WK45_RIGID_WET:{label:"Rigid wall 100 mm — mortar/plaster — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 22",minW:80,maxW:580,minH:80,maxH:580,recommendedW:80,recommendedH:80,wall:"Rigid wall, minimum 100 mm, minimum density 550 kg/m³",seal:"Mortar or plaster putty",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Inside the wall; installation without duct connection permitted."},
      WK45_RIGID_DRY:{label:"Rigid wall 100 mm — rock wool/plasterboard — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 22",minW:80,maxW:110,minH:80,maxH:110,recommendedW:80,recommendedH:80,wall:"Rigid wall, minimum 100 mm, minimum density 550 kg/m³",seal:"100 kg/m³ rock wool with plasterboard",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Dry-seal arrangement."},
      WK45_RIGID_FIREBATT:{label:"Rigid wall — Fire Batt / Weichschott — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 300 Pa • page 23",minW:100,maxW:800,minH:100,maxH:800,recommendedW:100,recommendedH:100,wall:"Rigid wall, minimum 100 mm, minimum density 550 kg/m³",seal:"140 kg/m³ coated rock-wool panel / Weichschott",spacing:0,edge:50,classification:"EI 90 S",pairAllowed:true,note:"Use the tested coated-panel sealing arrangement."},
      WK45_LIGHT_WET:{label:"Type F light wall — mortar/plaster — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 24",minW:100,maxW:580,minH:100,maxH:580,recommendedW:100,recommendedH:100,wall:"Type F plasterboard wall, minimum 100 mm",seal:"Mortar or plaster putty",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Inside the wall; metal studs; optional rock-wool insulation."},
      WK45_LIGHT_DRY:{label:"Type F light wall — rock wool/plasterboard — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 500 Pa • page 24",minW:75,maxW:95,minH:75,maxH:95,recommendedW:75,recommendedH:75,wall:"Type F plasterboard wall, minimum 100 mm",seal:"100 kg/m³ rock wool with plasterboard on both sides",spacing:0,edge:75,classification:"EI 90 S",pairAllowed:true,note:"Dry-seal arrangement."},
      WK45_LIGHT_FIREBATT:{label:"Type F light wall — Fire Batt / Weichschott — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 300 Pa • page 25",minW:100,maxW:800,minH:100,maxH:800,recommendedW:100,recommendedH:100,wall:"Type F plasterboard wall, minimum 100 mm",seal:"140 kg/m³ coated rock-wool panel / Weichschott",spacing:0,edge:50,classification:"EI 90 S",pairAllowed:true,note:"Use the tested coated-panel arrangement."},
      WK45_SAFETY_WALL:{label:"Safety light wall — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 26",minW:100,maxW:580,minH:100,maxH:580,recommendedW:100,recommendedH:100,wall:"Safety light wall, minimum 100 mm",seal:"Mortar/plaster or 100 kg/m³ rock wool with plasterboard",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Use the sealing option that matches the certified drawing."},
      WK45_GYPSUM_120:{label:"Solid gypsum blocks 100 mm — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 26",minW:80,maxW:110,minH:80,maxH:110,recommendedW:80,recommendedH:80,wall:"Solid gypsum blocks, minimum 100 mm, minimum density 995 kg/m³",seal:"Plaster putty",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Inside the wall."},
      WK45_GYPSUM_90:{label:"Solid gypsum blocks 70 mm — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 500 Pa • page 26",minW:80,maxW:110,minH:80,maxH:110,recommendedW:80,recommendedH:80,wall:"Solid gypsum blocks, minimum 70 mm, minimum density 995 kg/m³",seal:"Plaster putty",spacing:200,edge:75,classification:"EI 90 S",pairAllowed:false,note:"Maintain the manufacturer-stated separation for independent dampers."},
      WK45_SANDWICH:{label:"Sandwich wall — Fire Batt / Weichschott — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 300 Pa • page 28",minW:100,maxW:800,minH:100,maxH:800,recommendedW:100,recommendedH:100,wall:"Sandwich wall, minimum 100 mm",seal:"140 kg/m³ pre-coated rock-wool panel",spacing:0,edge:50,classification:"EI 90 S",pairAllowed:true,note:"Use the tested sandwich-wall detail."},
      WK45_FLOOR_180:{label:"Floor 140 mm / 2200 kg/m³ — mortar — EI 180 S",type:"lindab-rect-range",reference:"EI 180 S • 500 Pa • page 29",minW:130,maxW:170,minH:130,maxH:170,recommendedW:130,recommendedH:130,wall:"Floor, minimum 140 mm, minimum density 2200 kg/m³",seal:"Mortar",spacing:0,edge:75,classification:"EI 180 S",pairAllowed:true,note:"Inside the floor; axis irrelevant."},
      WK45_FLOOR_120:{label:"Floor 150 mm / 650 kg/m³ — mortar — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 500 Pa • page 29",minW:130,maxW:170,minH:130,maxH:170,recommendedW:130,recommendedH:130,wall:"Floor, minimum 150 mm, minimum density 650 kg/m³",seal:"Mortar",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Inside the floor."},
      WK45_FLOOR_90:{label:"Floor 100 mm / 650 kg/m³ — mortar — EI 90 S",type:"lindab-rect-range",reference:"EI 90 S • 500 Pa • page 29",minW:130,maxW:170,minH:130,maxH:170,recommendedW:130,recommendedH:130,wall:"Floor, minimum 100 mm, minimum density 650 kg/m³",seal:"Mortar",spacing:0,edge:75,classification:"EI 90 S",pairAllowed:true,note:"Inside the floor."},
      WK45_FLOOR_FIREBATT:{label:"Floor 150 mm — Fire Batt / Weichschott — EI 120 S",type:"lindab-rect-range",reference:"EI 120 S • 300 Pa • page 30",minW:100,maxW:800,minH:100,maxH:800,recommendedW:100,recommendedH:100,wall:"Floor, minimum 150 mm, minimum density 650 kg/m³",seal:"140 kg/m³ coated rock-wool panel / Weichschott",spacing:0,edge:75,classification:"EI 120 S",pairAllowed:true,note:"Use the tested floor Fire Batt detail."}
    }},
    "WKS25":{label:"WKS25 — Slim rectangular 500 Pa",shape:"rect",manual:"https://www.lindab.com/globalassets/commerce/lindabwebproductsdoc/assets/production/mgqwzwe0zdmtm2vmni00nzfklwiwmgitn2zhywi0ntfhnmiy/5250833079139246718/wks25_booklet_document_en_l.pdf?v=1783821283",guide:"Lindab WKS25 Installation Booklet",revision:"1MUBWKS25EN-LIND rev 25-03",methods:{
      WKS25_RIGID:{label:"Vertical rigid wall",type:"lindab-rect-fixed",reference:"EI 120 S",w:50,h:50,note:"Wall minimum thickness 100 mm; density 550 kg/m³."},
      WKS25_LIGHT:{label:"Vertical light wall — plasterboard",type:"lindab-rect-fixed",reference:"EI 60/120 S",w:75,h:75,note:"Wall minimum thickness 100 mm."},
      WKS25_GYPSUM:{label:"Solid gypsum block wall",type:"lindab-rect-fixed",reference:"EI 90/120 S",w:50,h:50,note:"Wall minimum thickness 70 or 100 mm; density 995 kg/m³."},
      WKS25_SHAFT:{label:"Shaft wall",type:"lindab-rect-fixed",reference:"EI 120 S",w:90,h:90,note:"Do not exceed the stated opening by more than 10 mm."}
    }}
  }}
};
function fdMsg(t,s){const e=$("fdMessage");e.className="msg "+t;e.textContent=s}
function currentFD(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],p=man.products[$("fdSeries").value],m=p.methods[$("fdMethod").value];return{man,p,m,manKey:$("fdManufacturer").value,productKey:$("fdSeries").value,methodKey:$("fdMethod").value}}
function fillFDProducts(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],s=$("fdSeries");s.innerHTML="";Object.entries(man.products).forEach(([k,v])=>{const o=document.createElement("option");o.value=k;o.textContent=v.label;s.appendChild(o)});fillFDMethods()}
function fillFDMethods(){const man=FD_MANUFACTURERS[$("fdManufacturer").value],p=man.products[$("fdSeries").value],m=$("fdMethod");m.innerHTML="";Object.entries(p.methods).forEach(([k,v])=>{const o=document.createElement("option");o.value=k;o.textContent=v.label;m.appendChild(o)});updateFDInputs();updateFDManualButtonLabel()}
function setAllowanceOptions(min,max,step,def){const sel=$("fdAllowance");sel.innerHTML="";for(let n=min;n<=max;n+=step){const o=document.createElement("option");o.value=n;o.textContent=`${n} mm total (${n/2} mm nominal each side)`;if(n===def)o.selected=true;sel.appendChild(o)}}

function setNumericOptions(id,min,max,def){const s=$(id);s.innerHTML="";for(let n=min;n<=max;n++){const o=document.createElement("option");o.value=n;o.textContent=n+" mm";if(n===def)o.selected=true;s.appendChild(o)}}
function configureDwfx(m){const variant=$("fdDwfxVariant").value;const isSmoke=variant==="SMOKE";if(m.smokeOnly&&!isSmoke){$("fdDwfxVariant").value="SMOKE"}
 const v=$("fdDwfxVariant").value;let wr=null,hr=null;
 if(m.type==="dwfx-dry-fixed"||m.type==="dwfx-fixed"){wr=[m.w,m.w];hr=[m.h,m.h]}
 else if(m.type.startsWith("dwfx-")&&m.type!=="dwfx-link"){wr=v==="SMOKE"?m.smokeW:m.fireW;hr=v==="SMOKE"?m.smokeH:m.fireH}
 if(wr&&hr){setNumericOptions("fdDwfxWAllowance",wr[0],wr[1],Math.round((wr[0]+wr[1])/2));setNumericOptions("fdDwfxHAllowance",hr[0],hr[1],Math.round((hr[0]+hr[1])/2))}
 $("fdDwfxAllowanceWrap").style.display=m.type==="dwfx-link"?"none":"grid";
 $("fdDwfxBoard").closest("div").style.display=(m.boardsW||m.boardsH)?"block":"none";
 const basis=$("fdDwfxInputBasis")?.value||"NOMINAL";
 const isAuto=isSmoke&&basis==="NOMINAL";
 $("fdDwfxInputBasis").querySelector('option[value="NOMINAL"]').disabled=!isSmoke;
 if(!isSmoke&&basis==="NOMINAL")$("fdDwfxInputBasis").value="MEASURED";
 $("fdDwfxDimensionKey").style.display=isAuto?"flex":"none";
 $("fdDwfxHint").textContent=m.type==="dwfx-link"
   ?'This method is listed for reference only because the current guide does not provide one safe universal opening formula. Use the official Actionair hole-sizing tool or installation drawing.'
   :isAuto
     ?'Enter the ordered nominal duct width and height. VentTools calculates the rectangular SmokeShield casing, adds the separate 28 mm PTC interface shroud on the actuator side, then applies the selected certified opening allowance.'
     :'Enter the measured overall casing width and height. For SmokeShield, the measured width must include the 28 mm PTC shroud. Do not include the peripheral flange.';
}
function updateFDInputs(){const {p,m,productKey}=currentFD(),circle=p.shape==="circle",dwfx=productKey==="DWFX-F",hevac=productKey==="HEVAC-IF",span=productKey==="SPAN",wk25=productKey==="WK25";
  $("fdRectInputs").style.display=p.shape==="rect"?"block":"none";
  $("fdCircularInputs").style.display=circle?"block":"none";
  $("fdDwfxWrap").style.display=dwfx?"block":"none";
  $("fdHevacWrap").style.display=hevac?"block":"none";
  $("fdSpanWrap").style.display=span?"block":"none";
  $("fdWk25Wrap").style.display=wk25?"block":"none";
  const wkConfig=$("fdWk25Config")?.value||"single";
  const dwBasis=$("fdDwfxInputBasis")?.value||"NOMINAL",dwSmoke=$("fdDwfxVariant")?.value==="SMOKE",dwAuto=dwfx&&dwSmoke&&dwBasis==="NOMINAL";
  $("fdWidthLabel").textContent=dwfx?(dwAuto?"Nominal duct width (mm)":"Measured overall casing width (mm)"):hevac?"Measured outside frame width (mm)":wk25&&wkConfig!=="single"?"Measured overall joined assembly width (mm)":"Nominal duct width (mm)";
  $("fdHeightLabel").textContent=dwfx?(dwAuto?"Nominal duct height (mm)":"Measured overall casing height (mm)"):hevac?"Measured outside frame height (mm)":wk25&&wkConfig!=="single"?"Measured overall joined assembly height (mm)":"Nominal duct height (mm)";
  $("fdBoardWrap").style.display=["bsb-dry","bsb-rect-dry","bsb-circle-dry-lined","bsb-at-dry","css-dry"].includes(m.type)?"block":"none";
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
  if(span)updateSpanInputs();
  calcFD();
}
function updateSpanInputs(){
  const circular=$("fdSpanVariant").value==="601";
  $("fdSpanWidthWrap").style.display=circular?"none":"block";
  $("fdSpanHeightWrap").style.display=circular?"none":"block";
  $("fdSpanDiameterWrap").style.display=circular?"block":"none";
}
function drawFD(r){const g=$("fdDiagramLayer"),title=`${r.manufacturer} • ${r.product}`;
 if(r.shape==="rect"){const ow=420,oh=Math.max(100,Math.min(190,ow*r.openH/r.openW)),x=(760-ow)/2,y=75+(190-oh)/2,gx=28,gy=24;g.innerHTML=`<rect x="${x}" y="${y}" width="${ow}" height="${oh}" rx="6" fill="#eef2f6" stroke="#334155" stroke-width="3"/><rect x="${x+gx}" y="${y+gy}" width="${ow-2*gx}" height="${oh-2*gy}" rx="3" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${x}" y1="${y+oh+28}" x2="${x+ow}" y2="${y+oh+28}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="380" y="${y+oh+52}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="380" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="380" y="300" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="800" fill="#142033">Damper ${r.damper}</text>`}
 else{const cx=380,cy=150,ro=105,ratio=Math.min(.92,r.dia/(r.visualOpen||r.dia+20)),rd=Math.max(52,ro*ratio);if(r.apertureShape==="square"){g.innerHTML=`<rect x="${cx-ro}" y="${cy-ro}" width="${2*ro}" height="${2*ro}" rx="5" fill="#eef2f6" stroke="#334155" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${rd}" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${cx-ro}" y1="${cy+ro+30}" x2="${cx+ro}" y2="${cy+ro+30}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="${cx}" y="${cy+ro+55}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="${cx}" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="${cx}" y="${cy+7}" text-anchor="middle" font-family="system-ui" font-size="15" font-weight="900" fill="#142033">Ø ${fmt0(r.dia)} casing</text>`}else{g.innerHTML=`<circle cx="${cx}" cy="${cy}" r="${ro}" fill="#eef2f6" stroke="#334155" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${rd}" fill="#cbd5e1" stroke="#064b82" stroke-width="3"/><line x1="${cx-ro}" y1="${cy+ro+30}" x2="${cx+ro}" y2="${cy+ro+30}" stroke="#064b82" stroke-width="2" marker-start="url(#fdArrow)" marker-end="url(#fdArrow)"/><text x="${cx}" y="${cy+ro+55}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${r.opening}</text><text x="${cx}" y="32" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#142033">${title}</text><text x="${cx}" y="${cy+7}" text-anchor="middle" font-family="system-ui" font-size="15" font-weight="900" fill="#142033">Ø ${fmt0(r.dia)} casing</text>`}}
}

function actionairSpanCase501(w,h){
  if(w<100||h<100||w>1000||h>1000)return null;
  const caseW=w<151?273:(w<200?323:w+73);
  const caseH=h<151?270:(h<200?320:h+70);
  return {caseW,caseH};
}
function actionairSpanCase601(d){
  if(d<100||d>1000)return null;
  const caseW=d<151?275:(d<200?325:(d<950?d+125:(d<970?1075:d+105)));
  const caseH=d<151?272:(d<200?322:(d<950?d+122:(d<970?1072:d+102)));
  return {caseW,caseH};
}
function calculateActionairSpan(){
  const variant=$("fdSpanVariant").value;
  let dims,damper;
  if(variant==="501"){
    const w=parseFloat($("fdSpanWidth").value)||0,h=parseFloat($("fdSpanHeight").value)||0;
    dims=actionairSpanCase501(w,h);
    damper=`SmokeShield 501 PTC • ${fmt0(w)} × ${fmt0(h)} mm duct`;
  }else{
    const d=parseFloat($("fdSpanDiameter").value)||0;
    dims=actionairSpanCase601(d);
    damper=`SmokeShield 601 PTC • Ø ${fmt0(d)} mm duct`;
  }
  if(!dims)return {error:"Supported SPAN sizes are 100–1000 mm."};
  const minW=dims.caseW+122,minH=dims.caseH+122;
  const recW=dims.caseW+172,recH=dims.caseH+172;
  const maxW=dims.caseW+572,maxH=dims.caseH+572;
  return {
    shape:"rect",
    manufacturer:"Swegon (Actionair products)",
    product:"SPAN",
    method:"SPAN_STANDARD",
    opening:`${fmt0(recW)} × ${fmt0(recH)} mm recommended`,
    damper,
    openW:recW,openH:recH,
    nomW:dims.caseW,nomH:dims.caseH,
    reference:"SmokeShield PTC SPAN",
    rule:`Recommended opening = overall case +172 mm in width and height`,
    range:`Permitted range: ${fmt0(minW)} × ${fmt0(minH)} mm minimum to ${fmt0(maxW)} × ${fmt0(maxH)} mm maximum. Recommended opening allows 100 mm infill on all four sides.`
  };
}
function advancedHeightAllowance(h){
  if(h<=100)return 100;
  if(h<=300)return 125;
  if(h<=525)return 150;
  if(h<=700)return 175;
  if(h<=925)return 200;
  return 225;
}
function advanced2530Min(W,H){
  if(W>=200 && H>=200)return {w:W+194,h:H+100,maxW:W+310,maxH:H+310};
  if(W>=175 && H>=175)return {w:W+219,h:H+125,maxW:W+335,maxH:H+335};
  return {w:394,h:300,maxW:510,maxH:510};
}
function advanced2530Hevac(W,H){
  if(W>=200 && H>=200)return {w:W+170,h:H+170,maxW:W+200,maxH:H+200};
  return {w:370,h:370,maxW:400,maxH:400};
}
function calcFD(){if(!$("fdSeries").value)return;const {man,p,m,productKey,methodKey}=currentFD();let r;
 if(productKey==="SPAN"){
   r=calculateActionairSpan();
   if(r.error){
     $("fdOpeningBig").textContent="Check size";
     $("fdMethodBig").textContent="SPAN";
     $("fdDamperSummary").textContent="—";
     $("fdRuleSummary").textContent=r.error;
     $("fdReferenceSummary").textContent="SmokeShield PTC SPAN";
     $("fdGuideSummary").textContent=`${p.manualTitle||p.guide} — ${p.revision}`;
     $("fdManualLink").href=p.manual;
     fdMsg("bad","⚠ "+r.error);
     return r;
   }
 }
 else if(p.shape==="rect"){const W=parseFloat($("fdWidth").value)||0,H=parseFloat($("fdHeight").value)||0;
  if(m.type==="bsb-link"){
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Official BSB drawing required",damper:`${fmt0(W)} × ${fmt0(H)} mm entered size`,rule:"No universal opening formula is enabled for this product.",reference:m.reference,isLinkOnly:true,range:m.note,sourceStatus:"Official drawing required",statusType:"manual",criticalRules:[m.note,"Confirm the ordered overall damper dimensions with BSB before forming the opening.","Install only to the tested supporting-construction detail."]};
  }else if(m.type==="bsb-rect-dry" || m.type==="bsb-rect-solid"){
    const b=parseFloat($("fdBoardThickness").value)||12.5;
    const finishedW=W+m.finishedW,finishedH=H+m.finishedH;
    const lined=m.type==="bsb-rect-dry";
    const cutW=finishedW+(lined?2*b:0),cutH=finishedH+(lined?2*b:0);
    const hasMappedCasing=Number.isFinite(m.casingAddW)&&Number.isFinite(m.casingAddH);
    const casingW=hasMappedCasing?W+m.casingAddW:null,casingH=hasMappedCasing?H+m.casingAddH:null;
    const casingText=hasMappedCasing
      ?`Overall damper casing: ${fmt0(W)} + ${fmt0(m.casingAddW)} = ${fmt0(casingW)} mm wide; ${fmt0(H)} + ${fmt0(m.casingAddH)} = ${fmt0(casingH)} mm high. No physical damper measurement is required for this recorded size method.`
      :`Published finished-aperture allowance: nominal +${fmt0(m.finishedW)} mm width and +${fmt0(m.finishedH)} mm height.`;
    const clearanceText=hasMappedCasing
      ?`Tested aperture clearance: ${fmt0(m.clearanceLeft)} mm left + ${fmt0(m.clearanceRight)} mm right, and ${fmt0(m.clearanceBottom)} mm below + ${fmt0(m.clearanceTop)} mm above the casing.`
      :"";
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:cutW,openH:cutH,opening:`${fmt0(cutW)} × ${fmt0(cutH)} mm ${lined?"structural cut":"finished aperture"}`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:`${casingText}${clearanceText?` ${clearanceText}`:""} Finished aperture: ${fmt0(finishedW)} × ${fmt0(finishedH)} mm${lined?`; structural cut adds one ${fmt(b)} mm lining board at each opposite edge (${fmt0(2*b)} mm overall per dimension)`:"; no aperture lining added by VentTools"}`,reference:m.reference,range:m.note,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm ordered nominal size`,casingStage:hasMappedCasing?`${fmt0(casingW)} × ${fmt0(casingH)} mm overall casing — derived from manufacturer dimensions; no site measurement required`:`Published method allowance — see finished opening stage`,finishedStage:hasMappedCasing?`${fmt0(finishedW)} × ${fmt0(finishedH)} mm lined aperture, including tested casing clearances`:`${fmt0(finishedW)} × ${fmt0(finishedH)} mm${lined?" before aperture lining":""}`,cutStage:lined?`Width: ${fmt0(finishedW)} + 2 × ${fmt(b)} mm aperture lining = ${fmt0(cutW)} mm; height: ${fmt0(finishedH)} + 2 × ${fmt(b)} mm aperture lining = ${fmt0(cutH)} mm`:`${fmt0(cutW)} × ${fmt0(cutH)} mm`,sourceStatus:"Verified from manufacturer method",statusType:"verified",includesLining:lined,criticalRules:[`Supporting construction: ${m.wall}.`,`BSB case/frame build-up: nominal ${fmt0(W)} × ${fmt0(H)} mm plus ${fmt0(m.finishedW)} mm width and ${fmt0(m.finishedH)} mm height = ${fmt0(finishedW)} × ${fmt0(finishedH)} mm finished aperture.`,`Opening treatment: ${lined?`fit one ${fmt(b)} mm fire-rated lining board to each internal edge of the aperture. That adds ${fmt(b)} mm at the left and right (${fmt0(2*b)} mm overall width) and ${fmt(b)} mm at the top and bottom (${fmt0(2*b)} mm overall height). The two wall-face boards are not added again`:"do not add a board lining unless the selected BSB drawing requires it"}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Minimum clear structural separation: 200 mm between separate damper casings.`,`Minimum distance from damper casing to adjacent wall, floor or ceiling: 75 mm.`,m.note,"Other services must not share the damper opening."]};
  }else if(m.type==="bsb-at-dry" || m.type==="bsb-at-solid"){
    const lined=m.type==="bsb-at-dry";
    const b=parseFloat($("fdBoardThickness").value)||12.5;
    const finishedW=W,finishedH=H;
    const cutW=finishedW+(lined?2*b:0),cutH=finishedH+(lined?2*b:0);
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:cutW,openH:cutH,
      opening:`${fmt0(cutW)} × ${fmt0(cutH)} mm ${lined?"structural cut":"finished masonry aperture"}`,
      damper:`${fmt0(W)} × ${fmt0(H)} mm ordered nominal opening`,
      rule:lined?`Finished lined aperture = ordered nominal size. Structural cut adds 2 × ${fmt(b)} mm aperture lining in each dimension.`:`Finished masonry aperture = ordered nominal size (+5/-0 mm manufacturer tolerance).`,
      reference:m.reference,range:m.note,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm ordered nominal aperture`,
      casingStage:`${fmt0(W-10)} × ${fmt0(H-10)} mm actual sleeve (nominal minus 10 mm)`,
      finishedStage:`${fmt0(finishedW)} × ${fmt0(finishedH)} mm finished aperture (+5/-0 mm tolerance)`,
      cutStage:lined?`${fmt0(finishedW)} + 2 × ${fmt(b)} = ${fmt0(cutW)} mm wide; ${fmt0(finishedH)} + 2 × ${fmt(b)} = ${fmt0(cutH)} mm high`:`${fmt0(finishedW)} × ${fmt0(finishedH)} mm`,
      sourceStatus:"Verified from manufacturer method",statusType:"verified",includesLining:lined,
      criticalRules:[`Supporting construction: ${m.wall}.`,lined?`Opening treatment: fully line all four internal sides with ${fmt(b)} mm fire-rated plasterboard and track.`:"Opening treatment: form the masonry aperture to the ordered nominal size.",`Damper fixing: ${lined?"3.5 mm × 38 mm drywall screws through the outer flange holes into the aperture track":"5 mm diameter × 40 mm minimum steel fixings through the outer flange holes"}.`,`Certified joint treatment: ${m.seal}.`,`Position the damper centrally in the prepared opening.`,`This is an unducted air-transfer damper; no duct connection is required.`,`Minimum separation: 200 mm between separate dampers and 75 mm to adjacent wall or floor.`,m.note]};
  }else if(productKey==="DWFX-F"){
    const variant=$("fdDwfxVariant").value,board=parseFloat($("fdDwfxBoard").value)||0;
    if(m.smokeOnly&&variant!=="SMOKE")$("fdDwfxVariant").value="SMOKE";
    const actualVariant=$("fdDwfxVariant").value;
    const ref=actualVariant==="SMOKE"?m.referenceSmoke:m.referenceFire;
    if(m.type==="dwfx-link"){
      r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Official hole sizer / drawing required",damper:`${fmt0(W)} × ${fmt0(H)} mm casing`,rule:"No universal Vent Tools calculation enabled for this method",reference:ref||"See official guide",isLinkOnly:true};
    }else{
      const wa=parseFloat($("fdDwfxWAllowance").value)||0,ha=parseFloat($("fdDwfxHAllowance").value)||0;
      const basis=$("fdDwfxInputBasis")?.value||"NOMINAL";
      const automatic=actualVariant==="SMOKE"&&basis==="NOMINAL";
      if(automatic&&(W<200||H<200||W>1000||H>1000)){
        r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Use measured casing mode",damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:"Automatic casing conversion is enabled for rectangular SmokeShield PTC sizes from 200 × 200 mm to 1000 × 1000 mm. Smaller dimensional bands use fixed-width casing arrangements and should be physically measured.",reference:ref,isLinkOnly:true,range:"Select “Measured overall casing size” and enter the casing including the 28 mm PTC shroud, excluding the peripheral flange."};
      }else{
        let casingW=W,casingH=H,baseCasingW=null,baseCasingH=null,spigotW=null,spigotH=null,flangeW=null,flangeH=null;
        if(automatic){
          spigotW=W-5; spigotH=H-5;
          baseCasingW=W+50; baseCasingH=H+100;
          casingW=baseCasingW+28; casingH=baseCasingH;
          flangeW=W+198; flangeH=H+195;
        }
        const finishedW=casingW+wa,finishedH=casingH+ha;
        const cutW=finishedW+(m.boardsW||0)*board,cutH=finishedH+(m.boardsH||0)*board;
        const hasBoards=(m.boardsW||m.boardsH);
        const breakdown=automatic
          ?`Nominal duct ${fmt0(W)} × ${fmt0(H)} mm. Spigot ${fmt0(spigotW)} × ${fmt0(spigotH)} mm. Base casing ${fmt0(baseCasingW)} × ${fmt0(baseCasingH)} mm. PTC shroud adds 28 mm on the actuator side, giving the opening-measurement casing ${fmt0(casingW)} × ${fmt0(casingH)} mm. Overall peripheral flange ${fmt0(flangeW)} × ${fmt0(flangeH)} mm (not included in the opening calculation). Minimum actuator removal clearance: 120 mm.`
          :`Measured casing used directly: ${fmt0(casingW)} × ${fmt0(casingH)} mm${actualVariant==="SMOKE"?" including the PTC shroud":""}, excluding the peripheral flange.`;
        r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:cutW,openH:cutH,opening:`${fmt0(cutW)} × ${fmt0(cutH)} mm${hasBoards?" cut size":""}`,damper:automatic?`${fmt0(W)} × ${fmt0(H)} mm nominal duct`:`${fmt0(W)} × ${fmt0(H)} mm measured casing`,rule:`Finished opening ${fmt0(finishedW)} × ${fmt0(finishedH)} mm: casing +${fmt0(wa)} mm width / +${fmt0(ha)} mm height${hasBoards?`; cut size adds ${m.boardsW||0} × ${fmt0(board)} mm board to width and ${m.boardsH||0} × ${fmt0(board)} mm board to height`:""}`,reference:ref,variant:actualVariant,range:`${breakdown} Minimum separation: 200 mm between dampers in separate ducts and 75 mm from a damper to an adjacent wall or floor.`,nominalStage:automatic?`${fmt0(W)} × ${fmt0(H)} mm`:"Measured casing input",casingStage:automatic?`${fmt0(casingW)} × ${fmt0(casingH)} mm incl. PTC shroud`:`${fmt0(casingW)} × ${fmt0(casingH)} mm measured`,finishedStage:`${fmt0(finishedW)} × ${fmt0(finishedH)} mm`,cutStage:`${fmt0(cutW)} × ${fmt0(cutH)} mm`,sourceStatus:automatic?"Derived from published manufacturer dimensions":"Manual casing measurement required",statusType:automatic?"derived":"manual",criticalRules:[`Permitted finished-opening allowance selected: +${fmt0(wa)} mm width and +${fmt0(ha)} mm height.`,`Include the 28 mm PTC shroud in the casing width; exclude the peripheral flange.`,hasBoards?`Structural cut includes the certified board build-up (${m.boardsW||0} board thicknesses in width and ${m.boardsH||0} in height).`:"No additional board build-up is applied by this selected method.",`Minimum spacing: 200 mm between separate dampers and 75 mm from adjacent wall/floor for this Actionair method.`,`Allow at least 120 mm actuator removal clearance.`]};
      }
    }
  }else if(productKey==="HEVAC-IF"){
    const gap=parseFloat($("fdHevacGap").value)||25;
    let variant=$("fdHevacVariant").value;if(m.fireOnly)variant="FIRE";
    const ref=variant==="SMOKE"?m.referenceSmoke:m.referenceFire;
    const openW=W+2*gap,openH=H+2*gap;
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm`,damper:`Installation frame ${fmt0(W)} × ${fmt0(H)} mm`,rule:`Measured frame size + 2 × ${fmt0(gap)} mm clear mortar gap`,reference:ref,range:"Official drawing permits 5–75 mm from the installation-frame upstand to the aperture face all round."};
  }else if(m.type==="wk25-fixed" || m.type==="wk25-range"){
 const config=$("fdWk25Config")?.value||"single",axis=$("fdWk25Axis")?.value||"horizontal",paired=config!=="single";
 if(paired&&!m.pairAllowed)r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Paired arrangement not certified",damper:`${fmt0(W)} × ${fmt0(H)} mm entered assembly`,rule:"Choose a method that permits paired dampers.",reference:m.reference,isLinkOnly:true,range:`Minimum separation to another damper: ${m.spacingA||m.spacingC} mm. Minimum distance to wall/floor: ${m.spacingB||m.spacingD} mm. ${m.note}`};
 else if(config==="pair-stack"&&axis==="vertical")r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Orientation not permitted",damper:`${fmt0(W)} × ${fmt0(H)} mm entered assembly`,rule:"Two vertically stacked WK25 dampers must not both have vertical blade axes.",reference:"WK25 booklet page 2",isLinkOnly:true,range:"Select horizontal or mixed blade-axis arrangement."};
 else{const aw=m.type==="wk25-fixed"?m.w:m.recommendedW,ah=m.type==="wk25-fixed"?m.h:m.recommendedH,openW=W+aw,openH=H+ah,sd=m.spacingA||m.spacingC,se=m.spacingB||m.spacingD,rr=m.type==="wk25-range"?`Permitted allowance: width +${m.minW} to +${m.maxW} mm; height +${m.minH} to +${m.maxH} mm.`:`Fixed allowance: width +${m.w} mm; height +${m.h} mm.`;
 r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm${m.type==="wk25-range"?" recommended":""}`,damper:`${fmt0(W)} × ${fmt0(H)} mm ${paired?"measured joined assembly":"nominal damper"}`,rule:`${rr} ${paired?"Use the approved Lindab pairing kit and intumescent gasket.":""}`,reference:m.reference,range:`Construction: ${m.wall}. Seal: ${m.seal}. Minimum separation to another independent damper/assembly: ${sd} mm. Minimum distance to adjacent wall/floor: ${se} mm. ${m.note}`};}
}else if(m.type==="lindab-rect-fixed"){
    const openW=W+m.w,openH=H+m.h;
    const critical=[`Supporting construction: ${m.wall||m.note||"See official Lindab method"}.`,`Certified sealing arrangement: ${m.seal||"See official Lindab method"}.`,`Opening allowance: +${m.w} mm width and +${m.h} mm height.`,m.spacing!==undefined?`Minimum separation between independent dampers: ${m.spacing} mm.`:"Check the official separation detail.",m.edge!==undefined?`Minimum distance to adjacent wall/floor/ceiling: ${m.edge} mm.`:"Check the official edge-distance detail.",m.note||"Install exactly to the selected certified detail."];
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal`,rule:`Nominal width +${m.w} mm; nominal height +${m.h} mm`,reference:m.reference,range:m.note,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:`${fmt0(W)} × ${fmt0(H)} mm nominal damper`,finishedStage:`${fmt0(openW)} × ${fmt0(openH)} mm`,cutStage:`${fmt0(openW)} × ${fmt0(openH)} mm`,sourceStatus:"Verified from manufacturer method",statusType:"verified",criticalRules:critical};
  }else if(m.type==="lindab-rect-range"){
    const openW=W+m.recommendedW,openH=H+m.recommendedH;
    const critical=[`Supporting construction: ${m.wall||m.note||"See official Lindab method"}.`,`Certified sealing arrangement: ${m.seal||"See official Lindab method"}.`,`Permitted opening allowance: width +${m.minW} to +${m.maxW} mm; height +${m.minH} to +${m.maxH} mm.`,m.spacing!==undefined?`Minimum separation between independent dampers: ${m.spacing} mm.`:"Check the official separation detail.",m.edge!==undefined?`Minimum distance to adjacent wall/floor/ceiling: ${m.edge} mm.`:"Check the official edge-distance detail.",m.pairAllowed===false?"Paired installation is not enabled for this method.":m.pairAllowed===true?"A paired assembly is permitted only with the official Lindab kit and tested arrangement.":"Verify whether pairing is permitted.",m.note||"Install exactly to the selected certified detail."];
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm selected`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal`,rule:`Selected opening: width +${m.recommendedW} mm; height +${m.recommendedH} mm`,reference:m.reference,range:`Permitted range: width +${m.minW} to +${m.maxW} mm; height +${m.minH} to +${m.maxH} mm. ${m.note||""}`,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:`${fmt0(W)} × ${fmt0(H)} mm nominal damper`,finishedStage:`${fmt0(openW)} × ${fmt0(openH)} mm selected`,cutStage:`${fmt0(openW)} × ${fmt0(openH)} mm`,sourceStatus:"Verified from manufacturer method",statusType:"verified",criticalRules:critical};
  }else if(m.type==="advanced-afs-0160"){
    const addH=advancedHeightAllowance(H),openW=W+194,openH=H+addH,maxW=W+350,maxH=H+addH+250;
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm minimum opening to form`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:`Published AFS minimum: width = nominal +194 mm; height = nominal +${fmt0(addH)} mm for this height band`,reference:m.reference,range:`Published range: width ${fmt0(openW)}–${fmt0(maxW)} mm; height ${fmt0(openH)}–${fmt0(maxH)} mm.`,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:"AFS outer frame and bracket envelope included in manufacturer table",finishedStage:`${fmt0(openW)} × ${fmt0(openH)} mm minimum formed opening`,cutStage:`${fmt0(openW)} × ${fmt0(openH)} mm minimum opening to form`,sourceStatus:"Verified from manufacturer opening table",statusType:"verified",includesLining:false,minOpenW:openW,minOpenH:openH,maxOpenW:maxW,maxOpenH:maxH,rangeNote:"The minimum published opening is shown as the main result. Any opening within this published range must still follow the selected tested method.",criticalRules:[`Supporting construction: ${m.wall}.`,`Certified penetration seal: ${m.seal}.`,`The opening is a letterbox construction where the selected wall method requires it; do not add the wall-board thickness again to the published opening table.`,`AFS brackets and rails project nearly 50 mm from the damper case and are included in the opening method.`,`Maximum distance from damper case to opening edge is 130 mm; Advanced Air recommends at least 25 mm room for fire batt.`,`Ductwork must leave a 10 mm expansion gap at the damper case and be independently supported within 1 metre.`,m.note]};
  }else if(m.type==="advanced-afs-2530"){
    const d=advanced2530Min(W,H);
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:d.w,openH:d.h,opening:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum opening to form`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:`Published 2530 AFS minimum opening selected from the nominal-size band`,reference:m.reference,range:`Published range: width ${fmt0(d.w)}–${fmt0(d.maxW)} mm; height ${fmt0(d.h)}–${fmt0(d.maxH)} mm.`,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:"AFS frame, rail and fire-batt zone included in manufacturer table",finishedStage:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum formed opening`,cutStage:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum opening to form`,sourceStatus:"Verified from manufacturer opening table",statusType:"verified",includesLining:false,minOpenW:d.w,minOpenH:d.h,maxOpenW:d.maxW,maxOpenH:d.maxH,rangeNote:"The minimum published opening is shown as the main result. Openings up to the published maximum remain subject to every requirement of the selected AFS method.",criticalRules:[`Supporting construction: ${m.wall}.`,`Certified penetration seal: ${m.seal}.`,`Letterbox board construction is part of the tested wall method; do not add board thickness again to this published opening.`,`Maximum case-to-opening-edge distance is 130 mm; Advanced Air recommends a minimum 25 mm fire-batt zone.`,`Use tested M10 drop-rod support and AFS rails.`,`Leave 10 mm between damper case and ductwork for expansion; support ductwork within 1 metre.`,m.note]};
  }else if(m.type==="advanced-hevac-2530"){
    const d=advanced2530Hevac(W,H);
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:d.w,openH:d.h,opening:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum opening`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:`Published HEVAC opening range selected from nominal-size band`,reference:m.reference,range:`Published range: ${fmt0(d.w)} × ${fmt0(d.h)} mm minimum to ${fmt0(d.maxW)} × ${fmt0(d.maxH)} mm maximum.`,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:"HEVAC frame allowance included in manufacturer table",finishedStage:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum opening`,cutStage:`${fmt0(d.w)} × ${fmt0(d.h)} mm minimum opening`,sourceStatus:"Verified from manufacturer opening table",statusType:"verified",includesLining:false,minOpenW:d.w,minOpenH:d.h,maxOpenW:d.maxW,maxOpenH:d.maxH,rangeNote:"The minimum published opening is shown as the main result. Do not exceed the published maximum for the selected HEVAC size band.",criticalRules:[`Supporting construction: ${m.wall}.`,`Certified sealing arrangement: ${m.seal}.`,`Create the tested pockets for turnback tabs and centre the damper evenly in the opening.`,`Mortar must stop at the HEVAC frame so the damper can expand within the frame.`,`Leave 10 mm between damper case and ductwork for expansion; support ductwork within 1 metre.`,m.note]};
  }else if(m.type==="advanced-rect-fixed"){
    const openW=W+m.addW,openH=H+m.addH;
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW,openH,opening:`${fmt0(openW)} × ${fmt0(openH)} mm`,damper:`${fmt0(W)} × ${fmt0(H)} mm nominal duct`,rule:`Nominal width +${m.addW} mm; nominal height +${m.addH} mm`,reference:m.reference,range:`Tolerance ±${m.tolerance} mm.`,nominalStage:`${fmt0(W)} × ${fmt0(H)} mm`,casingStage:"Manufacturer fixed opening allowance",finishedStage:`${fmt0(openW)} × ${fmt0(openH)} mm`,cutStage:`${fmt0(openW)} × ${fmt0(openH)} mm`,sourceStatus:"Verified from manufacturer method",statusType:"verified",includesLining:false,criticalRules:[`Supporting construction: ${m.wall}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Opening tolerance: ±${m.tolerance} mm.`,`Use all specified retaining-flange fixings at the stated centres.`,m.note]};
  }else if(m.type==="advanced-link"){
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Official product opening table required",damper:`${fmt0(W)} × ${fmt0(H)} mm entered size`,rule:"No 0160/2530 opening rule has been reused for this product.",reference:m.reference,isLinkOnly:true,range:m.note,sourceStatus:"Official drawing required",statusType:"manual",criticalRules:[m.note,"Select the exact wall or remote installation from the current Advanced Air IOM.","Do not form an opening from another Advanced Air product table."]};
  }else if(m.type==="lindab-link"){
    r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W,openH:H,opening:"Select official installation method",damper:`${fmt0(W)} × ${fmt0(H)} mm nominal`,rule:"No single universal builder's opening applies to every WK25 installation.",reference:m.reference,isLinkOnly:true,range:m.note};
  }else r={shape:"rect",manufacturer:man.label,product:productKey,method:methodKey,nomW:W,nomH:H,openW:W+m.w,openH:H+m.h,opening:`${fmt0(W+m.w)} × ${fmt0(H+m.h)} mm`,damper:`${fmt0(W)} × ${fmt0(H)} mm`,rule:`Width +${m.w} mm; height +${m.h} mm`,reference:m.reference}
 }
 else if(productKey!=="SPAN"){const dia=parseFloat($("fdDiameter").value)||0;r={shape:"circle",manufacturer:man.label,product:productKey,method:methodKey,dia,damper:`Ø ${fmt0(dia)} mm`,reference:m.reference};
  if(m.type==="bsb-circle-dry-lined"){
    const b=parseFloat($("fdBoardThickness").value)||12.5,finished=dia+m.add,cut=finished+2*b;r.visualOpen=r.openD=cut;r.apertureShape="square";r.opening=`${fmt0(cut)} × ${fmt0(cut)} mm structural cut`;r.rule=`Finished square aperture ${fmt0(finished)} mm; cut adds 2 × ${fmt(b)} mm lining board`;r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=`${fmt0(finished)} × ${fmt0(finished)} mm`;r.cutStage=`${fmt0(finished)} + 2 × ${fmt(b)} mm aperture lining = ${fmt0(cut)} mm each way`;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";r.includesLining=true;r.criticalRules=[`Supporting construction: ${m.wall}.`,`The drywall opening must be lined with one fire-rated board around each internal edge; wall-face board layers are not added again.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Minimum clear structural separation: 200 mm between separate damper casings.`,`Minimum distance from casing to adjacent construction: 75 mm.`,m.note,"Provide adjacent access for commissioning, servicing and cleaning."];
  }
  else if(m.type==="bsb-circle-solid"){
    const open=dia+m.add;r.visualOpen=r.openD=open;r.apertureShape="square";r.opening=`${fmt0(open)} × ${fmt0(open)} mm finished aperture`;r.rule=`Nominal diameter +${m.add} mm`;r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";r.criticalRules=[`Supporting construction: ${m.wall}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Use all installation-plate fixing positions.`,`Minimum clear structural separation: 200 mm between separate damper casings, except where a specific tested Batt detail states otherwise.`,`Minimum distance from casing to adjacent construction: 75 mm unless the selected tested drawing states a reduced distance.`,m.note];
  }
  else if(m.type==="bsb-circle-trim"){
    r.visualOpen=r.openD=dia+m.add;r.apertureShape="circle";r.opening=`Ø ${fmt0(dia)} mm nominal — maximum trim Ø ${fmt0(dia+m.add)} mm`;r.rule=`Nominal diameter with up to +${m.add} mm trim tolerance`;r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";r.criticalRules=[`Supporting construction: ${m.wall}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,m.note,"Do not apply the standard drywall or masonry opening rule to this method."];
  }
  else if(m.type==="bsb-circle-square-table"){
    const open=Number(m.openingTable?.[dia]);
    if(!Number.isFinite(open)){
      r.opening="Size outside published BSB table";r.rule="Select a listed MFD-IC diameter";r.invalidSize=true;
    }else{
      r.visualOpen=r.openD=open;r.apertureShape="square";r.opening=`${fmt(open)} × ${fmt(open)} mm square opening`;r.rule=`Published BSB opening table for Ø${fmt0(dia)} mm`;
      r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer opening table";r.statusType="verified";
      r.criticalRules=[`Supporting construction: ${m.wall}.`,`Opening treatment: ${m.reference==="MFD-IC M9"?"the opening must NOT be lined":"do not add aperture lining; fit the tested two-layer ablative Batt arrangement"}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Duct connection: connect in accordance with DW144/DW145 using aluminium rivets as breakaway fixings.`,`Supports: connected ductwork must be independently and adequately supported.`,`Minimum clear separation: 200 mm between damper casings and 75 mm to adjacent construction.`,`Use every required installation-plate fixing position.`,m.note];
    }
  }
  else if(m.type==="bsb-circle-round-table"){
    const open=Number(m.openingTable?.[dia]);
    if(!Number.isFinite(open)){
      r.opening="Size outside published BSB table";r.rule="Select a listed MFD-IC diameter";r.invalidSize=true;
    }else{
      r.visualOpen=r.openD=open;r.apertureShape="circle";r.opening=`Ø ${fmt(open)} mm opening`;r.rule=`Published BSB M15 mortar-infill opening table for Ø${fmt0(dia)} mm`;
      r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer opening table";r.statusType="verified";
      r.criticalRules=[`Supporting construction: ${m.wall}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Duct connection: connect in accordance with DW144/DW145 using aluminium rivets as breakaway fixings.`,`Supports: connected ductwork must be independently and adequately supported.`,`Use fire-rated steel fixings and every required installation-plate fixing position.`,`Minimum clear separation: 200 mm between damper casings and 75 mm to adjacent construction.`,m.note];
    }
  }
  else if(m.type==="bsb-circle-square-fixed"){
    const open=dia+m.add;r.visualOpen=r.openD=open;r.apertureShape="square";r.opening=`${fmt0(open)} × ${fmt0(open)} mm square opening`;r.rule=`Nominal diameter +${m.add} mm`;r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";r.criticalRules=[`Supporting construction: ${m.wall}.`,`Opening treatment: ${m.reference==="MFD-IC M9"?"the opening must NOT be lined":"do not add lining unless shown in the selected drawing"}.`,`Certified sealing/fixing arrangement: ${m.seal}.`,`Minimum clear separation: 200 mm between damper casings and 75 mm to adjacent construction.`,`Use all required installation-plate fixing holes.`,m.note];
  }
  else if(m.type==="advanced-circle-fixed"){
    const open=dia+m.add;r.visualOpen=open;r.apertureShape=m.openingShape||"square";r.openD=open;
    r.opening=r.apertureShape==="square"?`${fmt0(open)} × ${fmt0(open)} mm opening to form`:`Ø ${fmt0(open)} mm opening`;
    r.rule=`Nominal diameter +${m.add} mm`;
    r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;
    r.sourceStatus="Verified from manufacturer opening table";r.statusType="verified";r.includesLining=false;
    r.criticalRules=[`Supporting construction: ${m.wall}.`,`Certified penetration seal: ${m.seal}.`,`The published opening is the opening to form; where the wall is letterboxed, do not add the board thickness again.`,m.note,"Populate all pre-drilled flange fixing holes.","Leave the stated 10 mm duct expansion clearance and independently support connected ductwork within 1 metre."];
  }
  else if(m.type==="advanced-circle-floor"){
    const open=dia+m.add;r.visualOpen=open;r.apertureShape="square";r.openD=open;
    r.opening=`${fmt0(open)} × ${fmt0(open)} mm minimum opening`;
    r.rule=`Minimum opening = nominal diameter +${m.add} mm`;
    r.range="Maximum opening: 1800 × 1800 mm.";
    r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;
    r.sourceStatus="Verified from manufacturer method";r.statusType="verified";r.includesLining=false;
    r.criticalRules=[`Supporting construction: ${m.wall}.`,`Certified infill: ${m.seal}.`,`Minimum opening: nominal diameter +${m.add} mm; maximum 1800 × 1800 mm.`,"Use shuttering and the compound manufacturer's tested mixing/curing instructions.","Independently support connected ductwork within 1 metre.",m.note];
  }
  else if(m.type==="css-dry"){const a=parseFloat($("fdAllowance").value)||30,b=parseFloat($("fdBoardThickness").value)||12.5,finished=dia+a,cut=finished+2*b;r.visualOpen=cut;r.apertureShape="square";r.opening=`${fmt0(cut)} × ${fmt0(cut)} mm cut size`;r.rule=`Finished square opening Ø casing +${fmt0(a)} mm; cut size +2 × ${fmt(b)} mm board`;r.reference=$("fdWallBuild").value;r.range=`Permitted finished-opening allowance: ${m.min}–${m.max} mm total.`}
  else if(m.type==="css-masonry"){const a=parseFloat($("fdAllowance").value)||30,shape=$("fdApertureShape").value,open=dia+a;r.visualOpen=open;r.apertureShape=shape;r.opening=shape==="square"?`${fmt0(open)} × ${fmt0(open)} mm square`:`Ø ${fmt0(open)} mm circular`;r.rule=`Overall casing diameter +${fmt0(a)} mm total clearance`;r.range=shape==="square"?`Permitted square allowance: ${m.squareMin}–${m.squareMax} mm total.`:`Permitted circular allowance: ${m.circleMin}–${m.circleMax} mm total.`}
  else if(m.type==="css-slab"){const a=parseFloat($("fdAllowance").value)||30,open=dia+a;r.visualOpen=open;r.apertureShape="square";r.opening=`${fmt0(open)} × ${fmt0(open)} mm square`;r.rule=`Overall casing diameter +${fmt0(a)} mm total clearance`;r.range=`Supported square-opening allowance: ${m.squareMin}–${m.squareMax} mm total. Circular slab opening is not enabled because the current guide text and drawing conflict.`}
  else if(m.type==="lindab-circle-fixed"){
    const open=dia+m.add;r.visualOpen=open;r.apertureShape=m.openingShape||"circle";r.openD=open;
    r.opening=r.apertureShape==="circle"?`Ø ${fmt0(open)} mm`:`${fmt0(open)} × ${fmt0(open)} mm square`;
    r.rule=`Nominal diameter +${m.add} mm`;r.range=m.note;
    r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";
    r.criticalRules=[m.note||"Use the supporting construction stated in the official method.",`Opening allowance: nominal diameter +${m.add} mm.`,`Use only the sealing system shown for the selected certified method.`,"Verify wall/floor thickness, fire classification and size range in the current Lindab booklet."];
  }
  else if(m.type==="lindab-circle-range"){
    const open=dia+m.recommendedAdd;r.visualOpen=open;r.apertureShape=m.openingShape||"circle";r.openD=open;
    r.opening=r.apertureShape==="circle"?`Ø ${fmt0(open)} mm selected`:`${fmt0(open)} × ${fmt0(open)} mm selected`;
    r.rule=`Selected opening: nominal diameter +${m.recommendedAdd} mm`;
    r.range=`Permitted allowance: +${m.minAdd} to +${m.maxAdd} mm. ${m.note||""}`;
    r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";
    r.criticalRules=[m.note||"Use the supporting construction stated in the official method.",`Permitted opening allowance: +${m.minAdd} to +${m.maxAdd} mm.`,`Selected allowance: +${m.recommendedAdd} mm.`,`Use only the sealing system shown for the selected certified method.`,"Verify the current Lindab booklet before construction."];
  }
  else if(m.type==="lindab-circle-square-range"){
    const open=dia+m.recommendedAdd;r.visualOpen=open;r.apertureShape="square";r.openD=open;
    r.opening=`${fmt0(open)} × ${fmt0(open)} mm square selected`;
    r.rule=`Selected square opening: nominal diameter +${m.recommendedAdd} mm`;
    r.range=`Permitted square allowance: +${m.minAdd} to +${m.maxAdd} mm. ${m.note||""}`;
    r.nominalStage=`Ø ${fmt0(dia)} mm`;r.casingStage=`Ø ${fmt0(dia)} mm nominal damper`;r.finishedStage=r.opening;r.cutStage=r.opening;r.sourceStatus="Verified from manufacturer method";r.statusType="verified";
    r.criticalRules=[m.note||"Use the supporting construction stated in the official method.",`Square opening allowance: +${m.minAdd} to +${m.maxAdd} mm.`,`Selected allowance: +${m.recommendedAdd} mm.`,`Use only the sealing system shown for the selected certified method.`,"Verify the current Lindab booklet before construction."];
  }
  if((man.label==="Lindab" || man.label==="BSB" || man.label==="Advanced Air") && p.minSize && (dia<p.minSize || dia>p.maxSize)){
    r.opening="Size outside manual range";
    r.rule=`Supported nominal range: Ø${p.minSize}–${p.maxSize} mm`;
    r.range="Check the current Lindab manual before proceeding.";
    r.invalidSize=true;
  }
 }
 
 const nominalStage=r.nominalStage||(r.shape==="circle"?r.damper:(r.damper||"—"));
 const casingStage=r.casingStage||(r.damper||"—");
 const finishedStage=r.finishedStage||(r.opening||"—");
 const cutStage=r.cutStage||(r.opening||"—");
 let sourceStatus=r.sourceStatus;
 let statusType=r.statusType;
 if(!sourceStatus){
   if(r.isLinkOnly){sourceStatus="Official drawing or manual input required";statusType="manual";}
   else if(r.invalidSize){sourceStatus="Outside recorded manufacturer range";statusType="warning";}
   else{sourceStatus="Verified from manufacturer method";statusType="verified";}
 }
 const genericRules=[
   r.range||"Verify the permitted opening and supporting construction in the current manufacturer document.",
   "The selected wall/floor construction, sealing system and accessories must match the tested installation method.",
   "Do not substitute materials or alter the tested arrangement without manufacturer approval."
 ].filter(Boolean);
 let criticalRules=(r.criticalRules&&r.criticalRules.length?r.criticalRules:genericRules);
 if(man.label==="BSB" && productKey!=="AT-FSD"){
   const hasDuct=criticalRules.some(x=>/aluminium rivet|breakaway|duct connection/i.test(String(x)));
   const hasSupport=criticalRules.some(x=>/independently supported|independent support/i.test(String(x)));
   if(!hasDuct)criticalRules=[...criticalRules,"Duct connection: connect in accordance with DW144/DW145 using aluminium rivets as breakaway fixings."];
   if(!hasSupport)criticalRules=[...criticalRules,"Supports: connected ductwork must be independently and adequately supported."];
 }
 $("fdOpeningLabel").textContent=r.includesLining
   ?"Structural Hole to Cut (including aperture lining)"
   :"Opening Required by Selected Method";
 $("fdOpeningBig").textContent=r.opening;
 $("fdMethodBig").textContent=`${r.product} • ${r.reference}`;
 $("fdDamperSummary").textContent=r.damper;
 $("fdRuleSummary").textContent=r.rule;
 $("fdReferenceSummary").textContent=r.reference;
 $("fdGuideSummary").textContent=`${p.manualTitle||p.guide} — ${p.revision}`;
 $("fdNominalStage").textContent=nominalStage;
 $("fdCasingStage").textContent=casingStage;
 $("fdFinishedStage").textContent=finishedStage;
 $("fdCutStage").textContent=cutStage;
 const statusEl=$("fdResultStatus");
 statusEl.textContent=sourceStatus;
 statusEl.className=`fd-result-status ${statusType||"verified"}`;
 const rangePanel=$("fdOpeningRange");
 const hasStructuredRange=[r.minOpenW,r.minOpenH,r.maxOpenW,r.maxOpenH].every(Number.isFinite);
 if(rangePanel){
   rangePanel.hidden=!hasStructuredRange;
   if(hasStructuredRange){
     $("fdRangeMinW").textContent=`${fmt0(r.minOpenW)} mm`;
     $("fdRangeMinH").textContent=`${fmt0(r.minOpenH)} mm`;
     $("fdRangeMaxW").textContent=`${fmt0(r.maxOpenW)} mm`;
     $("fdRangeMaxH").textContent=`${fmt0(r.maxOpenH)} mm`;
     $("fdRangeNote").textContent=r.rangeNote||"The minimum published opening is used as the main result.";
   }
 }
 renderFDInstallationRequirements(criticalRules);
 $("fdManualLink").href=p.manual;
 updateFDManualButtonLabel();
 updateFDSettingOut(r);
 drawFD(r);const range=r.range?` ${r.range}`:"";if(r.invalidSize)fdMsg("bad",`⚠ Size is outside the range recorded from the uploaded ${p.guide}.`);
else if(r.isLinkOnly)fdMsg("warn",`⚠ This product has multiple installation-specific opening rules. Select and verify the applicable official ${man.label} drawing before construction.`);
else fdMsg("ok",`✅ Verified from the selected ${man.label} tested installation method.${hasStructuredRange?" Permitted minimum and maximum openings are shown below.":range} The stated opening includes the manufacturer-specified casing build-up and installation/expansion gaps where published. Verify the current official manual before construction.`);return r}

function renderFDInstallationRequirements(rules){
  const groups={construction:[],duct:[],supports:[],access:[],position:[],critical:[]};
  const clean=(rules||[]).filter(Boolean);
  clean.forEach(rule=>{
    const t=String(rule).toLowerCase();
    if(/ductwork|duct connection|expansion gap|expansion clearance|spigot|overlap|rivet|breakaway|duct seal|connected duct/.test(t)){groups.duct.push(rule);return;}
    if(/hanger|drop-rod|drop rod|independently supported|independent support|support within|afs rails|support rail/.test(t)){groups.supports.push(rule);return;}
    if(/actuator|access|commissioning|servicing|cleaning|maintenance/.test(t)){groups.access.push(rule);return;}
    if(/separation|distance from|adjacent construction|adjacent wall|adjacent floor|adjacent ceiling|centred|centered|position|orientation/.test(t)){groups.position.push(rule);return;}
    if(/supporting construction|wall|floor|opening treatment|penetration seal|sealing\/fixing|sealing arrangement|fire batt|mortar|plaster|board lining|lined opening/.test(t)){groups.construction.push(rule);return;}
    groups.critical.push(rule);
  });
  const map={
    construction:"fdReqConstruction",duct:"fdReqDuct",supports:"fdReqSupports",
    access:"fdReqAccess",position:"fdReqPosition",critical:"fdReqCritical"
  };
  Object.entries(map).forEach(([key,id])=>{
    const el=$(id); if(!el)return;
    const content=el.querySelector(".fd-requirement-content");
    if(!content)return;
    const items=groups[key];
    if(key==="duct" && !items.length){
      el.hidden=false;
      content.innerHTML='<p class="fd-no-specific-data">No manufacturer-specific duct connection detail is recorded for this selected method. Check the current official installation manual before connecting the ductwork.</p>';
      return;
    }
    el.hidden=!items.length;
    if(items.length)content.innerHTML=`<ul class="fd-checklist">${items.map(x=>`<li><span aria-hidden="true">✓</span><span>${x}</span></li>`).join("")}</ul>`;
  });
}

function updateFDSettingOut(r){
  const ids=["fdSetOpeningBottom","fdSetOpeningTop","fdSetDuctBottom","fdSetDuctTop","fdSetBottomOffset"];
  const clear=()=>ids.forEach(id=>{if($(id))$(id).textContent="—"});
  const answer=$("fdSettingAnswer"),warning=$("fdSettingWarning"),status=$("fdSettingStatus");
  if(!r || r.error || r.isLinkOnly || r.invalidSize){
    clear();
    if(answer)answer.textContent="A setting-out answer is not available for this selection.";
    if(status){status.textContent="Check manual";status.className="fd-setting-badge warning";}
    return;
  }
  const {m}=currentFD();
  const ductH=Number(r.nomH ?? r.dia);
  const openingH=Number(r.openH ?? r.openD ?? r.visualOpen);
  const board=r.includesLining?(parseFloat($("fdBoardThickness")?.value)||0):0;
  const rule=m.settingOut;
  const casingMapped=rule?.basis==="casing-edge" && Number.isFinite(rule.casingProjectionBottom) && Number.isFinite(rule.bottomClearance);
  const nominalMapped=rule?.basis==="nominal-duct" && Number.isFinite(rule.bottomFinished);
  const tableMapped=rule?.basis==="table-centred" && Number.isFinite(openingH) && Number.isFinite(ductH);
  if(!casingMapped && !nominalMapped && !tableMapped){
    clear();
    if($("fdSetDuctBottom"))$("fdSetDuctBottom").textContent=`${fmt(parseFloat($("fdDatumLevel")?.value)||0)} mm AFFL`;
    if(answer)answer.innerHTML="<strong>Do not guess the hole start.</strong> This method has not yet been fully mapped from nominal duct edge → damper casing edge → manufacturer clearance → structural lining.";
    if(warning)warning.textContent="No centred or user-entered assumption has been applied. VentTools will show a setting-out instruction only after every part of that dimension chain has been verified from the official method.";
    if(status){status.textContent="Manual check required";status.className="fd-setting-badge warning";}
    return;
  }
  const casingBottom=casingMapped?Number(rule.casingProjectionBottom):0;
  const casingTop=casingMapped?Number(rule.casingProjectionTop):0;
  const tableHalf=tableMapped?(openingH-ductH)/2:NaN;
  const clearanceBottom=tableMapped?tableHalf:(casingMapped?Number(rule.bottomClearance):Number(rule.bottomFinished));
  const clearanceTop=tableMapped?tableHalf:(casingMapped?Number(rule.topClearance):Number(rule.topFinished));
  const bottomOffset=casingBottom+clearanceBottom+board;
  const topOffset=Number.isFinite(clearanceTop)?(casingTop+clearanceTop+board):NaN;
  const ductBottom=parseFloat($("fdDatumLevel")?.value)||0;
  const openingBottom=ductBottom-bottomOffset;
  const ductTop=Number.isFinite(ductH)?ductBottom+ductH:NaN;
  const openingTop=Number.isFinite(ductTop)?ductTop+topOffset:(Number.isFinite(openingH)?openingBottom+openingH:NaN);
  if($("fdSetOpeningBottom"))$("fdSetOpeningBottom").textContent=`${fmt(openingBottom)} mm AFFL`;
  if($("fdSetOpeningTop"))$("fdSetOpeningTop").textContent=Number.isFinite(openingTop)?`${fmt(openingTop)} mm AFFL`:"—";
  if($("fdSetDuctBottom"))$("fdSetDuctBottom").textContent=`${fmt(ductBottom)} mm AFFL`;
  if($("fdSetDuctTop"))$("fdSetDuctTop").textContent=Number.isFinite(ductTop)?`${fmt(ductTop)} mm AFFL`:"—";
  if($("fdSetBottomOffset"))$("fdSetBottomOffset").textContent=`${fmt(bottomOffset)} mm`;
  if(answer)answer.innerHTML=`Mark the bottom of the <strong>structural opening</strong> <strong>${fmt(bottomOffset)} mm below the bottom of the nominal duct</strong>. This is the cut line before the aperture lining is fitted.`;
  if(warning){
    const chain=casingMapped
      ? `${fmt(casingBottom)} mm from nominal duct to casing edge + ${fmt(clearanceBottom)} mm manufacturer gap below the casing`
      : `${fmt(clearanceBottom)} mm manufacturer gap below the nominal duct edge`;
    warning.textContent=`Breakdown: ${chain}${board?` + ${fmt(board)} mm aperture lining`:""} = ${fmt(bottomOffset)} mm. Source: ${rule.source} Confirm the selected method and official drawing before cutting.`;
  }
  if(status){status.textContent="Verified setting-out";status.className="fd-setting-badge verified";}
}

function getFDSiteSheetDetails(){
  return new Promise(resolve=>{
    document.getElementById("fdSiteSheetDetailsOverlay")?.remove();
    const overlay=document.createElement("div");
    overlay.id="fdSiteSheetDetailsOverlay";
    overlay.setAttribute("role","presentation");
    overlay.innerHTML=`
      <div class="fd-sheet-dialog" role="dialog" aria-modal="true" aria-labelledby="fdSheetDialogTitle">
        <div class="fd-sheet-dialog-head">
          <div>
            <span class="fd-sheet-dialog-kicker">VentTools site instruction</span>
            <h2 id="fdSheetDialogTitle">Sheet details</h2>
          </div>
          <button type="button" class="fd-sheet-dialog-close" aria-label="Cancel and close">&times;</button>
        </div>
        <p class="fd-sheet-dialog-copy">Add the project details for this damper. The verified calculation will be saved into the project pack.</p>
        <label class="fd-sheet-dialog-field">
          <span>Drawing reference / damper tag</span>
          <input id="fdSheetReference" type="text" inputmode="text" autocomplete="off" placeholder="For example FD-01" maxlength="80">
        </label>
        <label class="fd-sheet-dialog-field">
          <span>Location</span>
          <input id="fdSheetLocation" type="text" inputmode="text" autocomplete="off" placeholder="For example Level 1 corridor" maxlength="120">
        </label>
        <div class="fd-sheet-dialog-actions">
          <button type="button" class="fd-sheet-dialog-cancel">Cancel</button>
          <button type="button" class="fd-sheet-dialog-create">Add to Pack</button>
        </div>
      </div>`;
    const style=document.createElement("style");
    style.textContent=`
      #fdSiteSheetDetailsOverlay{position:fixed;inset:0;z-index:99999;display:grid;place-items:end center;padding:16px;background:rgba(10,20,32,.62);backdrop-filter:blur(3px)}
      .fd-sheet-dialog{width:min(100%,560px);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:22px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.3);color:#142234}
      .fd-sheet-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.fd-sheet-dialog-head h2{margin:3px 0 0;font-size:24px;line-height:1.15}.fd-sheet-dialog-kicker{display:block;color:#075a93;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .fd-sheet-dialog-close{border:0;background:#eef3f6;border-radius:50%;width:40px;height:40px;font-size:28px;line-height:1;cursor:pointer;color:#263746}.fd-sheet-dialog-copy{margin:14px 0 18px;color:#5c6b7a;font-size:14px}
      .fd-sheet-dialog-field{display:block;margin-top:14px}.fd-sheet-dialog-field span{display:block;margin-bottom:7px;font-size:13px;font-weight:800}.fd-sheet-dialog-field input{display:block;width:100%;min-height:52px;padding:12px 14px;border:1px solid #bfcbd5;border-radius:12px;background:#fff;color:#142234;font:inherit;font-size:16px;outline:none}.fd-sheet-dialog-field input:focus{border-color:#075a93;box-shadow:0 0 0 3px rgba(7,90,147,.14)}
      .fd-sheet-dialog-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:10px;margin-top:22px}.fd-sheet-dialog-actions button{min-height:50px;border-radius:12px;font:inherit;font-weight:800;cursor:pointer}.fd-sheet-dialog-cancel{border:1px solid #bfcbd5;background:#fff;color:#263746}.fd-sheet-dialog-create{border:1px solid #075a93;background:#075a93;color:#fff}
      @media(min-width:620px){#fdSiteSheetDetailsOverlay{place-items:center}.fd-sheet-dialog{padding:24px}}
    `;
    overlay.appendChild(style);
    document.body.appendChild(overlay);
    const refInput=overlay.querySelector("#fdSheetReference");
    const locInput=overlay.querySelector("#fdSheetLocation");
    const finish=value=>{overlay.remove();resolve(value)};
    overlay.querySelector(".fd-sheet-dialog-close").addEventListener("click",()=>finish(null));
    overlay.querySelector(".fd-sheet-dialog-cancel").addEventListener("click",()=>finish(null));
    overlay.querySelector(".fd-sheet-dialog-create").addEventListener("click",()=>finish({
      ref:refInput.value.trim()||"Not entered",
      loc:locInput.value.trim()||"Not entered"
    }));
    overlay.addEventListener("click",e=>{if(e.target===overlay)finish(null)});
    overlay.addEventListener("keydown",e=>{
      if(e.key==="Escape")finish(null);
      if(e.key==="Enter" && e.target.tagName==="INPUT") overlay.querySelector(".fd-sheet-dialog-create").click();
    });
    requestAnimationFrame(()=>refInput.focus());
  });
}

async function buildFDSiteSheet(){
  const r=calcFD();
  if(!r || r.error || r.invalidSize){
    fdMsg("warn","Select a valid damper and method first.");
    return;
  }

  const details=await getFDSiteSheetDetails();
  if(!details)return;
  const {ref,loc}=details;
  const {man,p,m}=currentFD();
  const esc=v=>String(v??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
  const datum=parseFloat($("fdDatumLevel")?.value)||0;
  const openingBottom=$("fdSetOpeningBottom")?.textContent||"Manual setting-out check required";
  const openingTop=$("fdSetOpeningTop")?.textContent||"—";
  const ductBottom=$("fdSetDuctBottom")?.textContent||`${fmt(datum)} mm AFFL`;
  const ductTop=$("fdSetDuctTop")?.textContent||"—";
  const bottomOffset=$("fdSetBottomOffset")?.textContent||"—";
  const settingAnswer=$("fdSettingAnswer")?.textContent?.trim()||"Confirm the official manufacturer setting-out method before cutting.";
  const settingWarning=$("fdSettingWarning")?.textContent?.trim()||"No unverified assumption has been applied.";
  const generated=new Date().toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"});
  const requirements=[];
  document.querySelectorAll("#fdRequirementsGrid .fd-requirement-group:not([hidden]) li span:last-child").forEach(el=>requirements.push(el.textContent.trim()));
  const builderItems=requirements.filter(x=>/wall|floor|board|track|opening|batt|mortar|separation|construction|lined|fixing/i.test(x));
  const hvacItems=requirements.filter(x=>/duct|rivet|support|actuator|access|thermal|commission|orientation/i.test(x));
  const otherItems=requirements.filter(x=>!builderItems.includes(x)&&!hvacItems.includes(x));
  const rule=m?.settingOut||{};
  const board=r.includesLining?(parseFloat($("fdBoardThickness")?.value)||0):0;
  const casingBottom=Number.isFinite(Number(rule.casingProjectionBottom))?`${fmt(Number(rule.casingProjectionBottom))} mm`:"Not separately published";
  const casingTop=Number.isFinite(Number(rule.casingProjectionTop))?`${fmt(Number(rule.casingProjectionTop))} mm`:"Not separately published";
  const clearanceBottom=Number.isFinite(Number(rule.bottomClearance))?`${fmt(Number(rule.bottomClearance))} mm`:Number.isFinite(Number(rule.bottomFinished))?`${fmt(Number(rule.bottomFinished))} mm`:"See selected method";
  const clearanceTop=Number.isFinite(Number(rule.topClearance))?`${fmt(Number(rule.topClearance))} mm`:Number.isFinite(Number(rule.topFinished))?`${fmt(Number(rule.topFinished))} mm`:"See selected method";
  const list=items=>items.length?items.map(x=>`<li>${esc(x)}</li>`).join(""):'<li>Follow the selected official manufacturer installation drawing.</li>';
  const isCircle=r.shape==="circle";
  const diagram=isCircle
    ? `<svg viewBox="0 0 560 400" role="img" aria-label="Circular structural opening and nominal damper schematic"><rect x="20" y="20" width="520" height="330" rx="18" class="construction"/><circle cx="280" cy="185" r="132" class="opening"/><circle cx="280" cy="185" r="91" class="damper"/><text x="280" y="181" text-anchor="middle" class="diagram-title">Nominal damper</text><text x="280" y="207" text-anchor="middle" class="diagram-value">${esc(r.damper)}</text><text x="280" y="43" text-anchor="middle" class="diagram-label">STRUCTURAL / FINISHED OPENING</text><line x1="148" y1="370" x2="412" y2="370" class="dimension"/><path d="M148 361v18M412 361v18" class="dimension"/><text x="280" y="396" text-anchor="middle" class="diagram-dimension">${esc(r.opening)}</text></svg>`
    : `<svg viewBox="0 0 660 430" role="img" aria-label="Rectangular structural opening and nominal damper schematic"><rect x="24" y="20" width="612" height="355" rx="18" class="construction"/><rect x="105" y="72" width="450" height="250" class="opening"/><rect x="172" y="120" width="316" height="154" class="damper"/><text x="330" y="191" text-anchor="middle" class="diagram-title">Nominal damper</text><text x="330" y="218" text-anchor="middle" class="diagram-value">${esc(r.damper)}</text><text x="330" y="56" text-anchor="middle" class="diagram-label">STRUCTURAL / FINISHED OPENING</text><line x1="105" y1="397" x2="555" y2="397" class="dimension"/><path d="M105 388v18M555 388v18" class="dimension"/><text x="330" y="425" text-anchor="middle" class="diagram-dimension">${esc(r.opening)}</text></svg>`;

  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=yes,viewport-fit=cover"><meta name="color-scheme" content="light"><title>${esc(ref)} — VentTools Site Instruction Sheet</title>
<style>
:root{--ink:#142234;--muted:#5c6b7a;--line:#d7e0e8;--soft:#f3f6f8;--blue:#075a93;--blue-dark:#063e67;--blue-soft:#eaf5fc;--amber:#9a6500;--amber-soft:#fff7df;--green:#176b45;--white:#fff}
*{box-sizing:border-box}html{width:100%;min-width:0;background:#e9eef2}body{width:100%;min-width:0;margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);line-height:1.45;-webkit-font-smoothing:antialiased}.toolbar{position:sticky;top:0;z-index:20;display:flex;gap:10px;justify-content:center;padding:12px max(12px,env(safe-area-inset-right)) 12px max(12px,env(safe-area-inset-left));background:rgba(20,34,52,.96);box-shadow:0 4px 18px rgba(0,0,0,.18)}button{appearance:none;border:0;border-radius:9px;padding:11px 15px;font:700 14px Arial;cursor:pointer}.primary{background:#fff;color:var(--blue-dark)}.secondary{background:#2f465d;color:#fff}.sheet{width:calc(100% - 32px);max-width:210mm;min-height:297mm;margin:22px auto;background:#fff;box-shadow:0 10px 38px rgba(20,34,52,.16);padding:15mm}.report-header{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;border-bottom:4px solid var(--blue);padding-bottom:14px}.brand{display:flex;gap:12px;align-items:center}.mark{width:52px;height:52px;border-radius:12px;background:var(--blue);color:#fff;display:grid;place-items:center;font-size:23px;font-weight:900}.eyebrow,.label{font-size:10px;line-height:1.2;letter-spacing:.09em;text-transform:uppercase;font-weight:800;color:var(--muted)}h1{font-size:27px;line-height:1.1;margin:3px 0 0;color:var(--blue-dark)}h2{font-size:16px;margin:0;color:var(--blue-dark)}.doc-meta{text-align:right;font-size:12px;color:var(--muted)}.doc-meta strong{display:block;color:var(--ink);font-size:13px}.identity{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.field{border:1px solid var(--line);border-radius:9px;padding:10px 11px;min-height:60px}.field strong{display:block;margin-top:5px;font-size:14px;overflow-wrap:anywhere}.hero{margin-top:14px;border:2px solid #78b9df;background:var(--blue-soft);border-radius:12px;padding:17px;text-align:center}.hero .value{display:block;font-size:30px;line-height:1.15;font-weight:900;color:var(--blue-dark);margin-top:5px}.hero p{margin:8px 0 0;font-size:12px;color:#3f5a6f}.section{margin-top:14px;border:1px solid var(--line);border-radius:11px;overflow:hidden;break-inside:avoid}.section-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 13px;background:var(--soft);border-bottom:1px solid var(--line)}.verified{font-size:10px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:.06em}.grid{display:grid}.setting-grid{grid-template-columns:repeat(5,1fr)}.engineering-grid{grid-template-columns:repeat(3,1fr)}.cell{padding:11px 12px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);min-height:67px}.cell:nth-child(5n){border-right:0}.engineering-grid .cell:nth-child(3n){border-right:0}.cell strong{display:block;margin-top:5px;font-size:14px}.instruction{padding:13px;border-top:1px solid var(--line);background:#fbfcfd;font-size:13px}.instruction strong{color:var(--blue-dark)}.breakdown{padding:11px 13px;background:var(--amber-soft);border-top:1px solid #ead49e;font-size:12px;color:#634b18}.diagram-wrap{padding:12px 14px 6px}.diagram-wrap svg{display:block;width:100%;max-height:290px}.construction{fill:#f1f3f5;stroke:#65798b;stroke-width:4}.opening{fill:#d9edf8;stroke:#0875b6;stroke-width:5}.damper{fill:#fff;stroke:#273b4d;stroke-width:5}.diagram-title{font-size:19px;font-weight:800;fill:#142234}.diagram-value{font-size:17px;fill:#405263}.diagram-label{font-size:14px;font-weight:800;fill:#0875b6}.dimension{stroke:#142234;stroke-width:3;fill:none}.diagram-dimension{font-size:18px;font-weight:800;fill:#142234}.diagram-note{margin:0;padding:0 14px 12px;text-align:center;font-size:10px;color:var(--muted)}.requirements{display:grid;grid-template-columns:1fr 1fr}.req{padding:13px 15px}.req+ .req{border-left:1px solid var(--line)}.req h3{font-size:14px;margin:0 0 8px;color:var(--blue-dark)}ul{margin:0;padding-left:20px}li{margin:0 0 7px;font-size:12px}.warning{margin-top:14px;border:1px solid #dfbd62;background:var(--amber-soft);border-radius:10px;padding:12px 14px;font-size:12px}.warning strong{color:#714b00}.signoff{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-top:14px}.sign{border-bottom:1px solid #70808f;min-height:44px;padding-top:24px;font-size:10px;color:var(--muted)}footer{display:flex;justify-content:space-between;gap:16px;margin-top:15px;padding-top:10px;border-top:1px solid var(--line);font-size:9px;color:var(--muted)}
@media screen and (max-width:760px){html{background:#fff}.toolbar{width:100%;max-width:100vw}.sheet{max-width:none!important}.diagram-wrap,.section,.identity,.hero{max-width:100%}.toolbar{justify-content:stretch}.toolbar button{flex:1;min-width:0}.sheet{width:100%!important;min-height:0;margin:0;box-shadow:none;padding:18px 14px 28px}.report-header{grid-template-columns:1fr}.doc-meta{text-align:left}.identity{grid-template-columns:1fr 1fr}.hero .value{font-size:26px}.setting-grid,.engineering-grid{grid-template-columns:1fr 1fr}.cell,.cell:nth-child(5n),.engineering-grid .cell:nth-child(3n){border-right:1px solid var(--line)}.cell:nth-child(2n){border-right:0}.requirements{grid-template-columns:1fr}.req+ .req{border-left:0;border-top:1px solid var(--line)}.signoff{grid-template-columns:1fr}footer{display:block}footer span{display:block;margin-top:4px}}
@media(max-width:430px){.identity{grid-template-columns:1fr}.setting-grid,.engineering-grid{grid-template-columns:1fr}.cell,.cell:nth-child(2n){border-right:0}.brand{align-items:flex-start}.mark{width:45px;height:45px}h1{font-size:23px}}
@page{size:A4;margin:11mm}@media print{html,body{background:#fff}.toolbar{display:none!important}.sheet{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.report-header{padding-bottom:10px}.identity,.hero,.section,.warning,.signoff{break-inside:avoid}.hero{padding:12px}.hero .value{font-size:25px}.section{margin-top:10px}.cell{min-height:55px;padding:8px 9px}.diagram-wrap svg{max-height:230px}.req{padding:10px 12px}li{margin-bottom:4px;font-size:10.5px}.warning{margin-top:10px;padding:9px 11px}.signoff{margin-top:10px}footer{margin-top:10px}}
</style></head><body>
<div class="toolbar"><button class="primary" onclick="window.print()">Print / Save PDF</button><button class="secondary" onclick="shareSheet()">Share</button><button class="secondary" onclick="window.close()">Close</button></div>
<main class="sheet">
<header class="report-header"><div class="brand"><div class="mark">VT</div><div><div class="eyebrow">VentTools engineering output</div><h1>Site Instruction Sheet</h1></div></div><div class="doc-meta"><span class="eyebrow">Generated</span><strong>${esc(generated)}</strong><span>V6.5 RC9 · Independent site aid</span></div></header>
<section class="identity"><div class="field"><span class="label">Drawing reference / tag</span><strong>${esc(ref)}</strong></div><div class="field"><span class="label">Location</span><strong>${esc(loc)}</strong></div><div class="field"><span class="label">Manufacturer / product</span><strong>${esc(man.label)} ${esc(r.product)}</strong></div><div class="field"><span class="label">Tested method / reference</span><strong>${esc(r.reference)}</strong></div></section>
<section class="hero"><span class="label">Structural opening / required aperture</span><span class="value">${esc(r.opening)}</span><p>${esc(r.finishedStage||"Finished opening required for the selected verified installation method.")}</p></section>
<section class="section"><div class="section-head"><h2>Setting-out levels</h2><span class="verified">Manufacturer-mapped method</span></div><div class="grid setting-grid"><div class="cell"><span class="label">Nominal duct bottom</span><strong>${esc(ductBottom)}</strong></div><div class="cell"><span class="label">Nominal duct top</span><strong>${esc(ductTop)}</strong></div><div class="cell"><span class="label">Structural opening bottom</span><strong>${esc(openingBottom)}</strong></div><div class="cell"><span class="label">Structural opening top</span><strong>${esc(openingTop)}</strong></div><div class="cell"><span class="label">Bottom cut-line offset</span><strong>${esc(bottomOffset)}</strong></div></div><div class="instruction"><strong>Site instruction:</strong> ${esc(settingAnswer)}</div><div class="breakdown"><strong>Verified dimension chain:</strong> ${esc(settingWarning)}</div></section>
<section class="section"><div class="section-head"><h2>Engineering data</h2><span class="verified">Keep duct, casing and opening separate</span></div><div class="grid engineering-grid"><div class="cell"><span class="label">Nominal duct / damper</span><strong>${esc(r.damper)}</strong></div><div class="cell"><span class="label">Finished opening</span><strong>${esc(r.finishedStage||r.opening)}</strong></div><div class="cell"><span class="label">Structural hole to cut</span><strong>${esc(r.cutStage||r.opening)}</strong></div><div class="cell"><span class="label">Casing projection below / above duct</span><strong>${esc(casingBottom)} / ${esc(casingTop)}</strong></div><div class="cell"><span class="label">Manufacturer clearance below / above casing</span><strong>${esc(clearanceBottom)} / ${esc(clearanceTop)}</strong></div><div class="cell"><span class="label">Aperture lining included</span><strong>${board?`${esc(fmt(board))} mm`:(r.includesLining?"Included by selected method":"No separate lining entered")}</strong></div></div></section>
<section class="section"><div class="section-head"><h2>Finished opening setup</h2><span class="label">Schematic · not to scale</span></div><div class="diagram-wrap">${diagram}</div><p class="diagram-note">VentTools-generated schematic based on the selected verified calculation. It is not a copied manufacturer drawing.</p></section>
<section class="section"><div class="section-head"><h2>Trade requirements</h2><span class="label">Read before installation</span></div><div class="requirements"><div class="req"><h3>Builder / dryliner</h3><ul>${list(builderItems)}</ul></div><div class="req"><h3>HVAC installer</h3><ul>${list(hvacItems)}</ul></div>${otherItems.length?`<div class="req" style="grid-column:1/-1;border-top:1px solid var(--line)"><h3>Additional critical requirements</h3><ul>${list(otherItems)}</ul></div>`:""}</div></section>
<div class="warning"><strong>Important:</strong> This sheet is an independent site aid. The current ${esc(man.label)} manual, tested installation drawing, project fire strategy and approved supporting construction take precedence. Do not substitute unverified dimensions or installation methods.</div>
<div class="signoff"><div class="sign">Issued / explained by</div><div class="sign">Date</div><div class="sign">Accepted by</div></div>
<footer><span>Source: ${esc(p.guide)} — ${esc(p.revision)}</span><span>Generated by VentTools V6.5 RC9</span></footer>
</main><script>function shareSheet(){const data={title:document.title,text:'VentTools Site Instruction Sheet — ${esc(ref)}'};if(navigator.share){navigator.share(data).catch(()=>{});return}window.print()}</script></body></html>`;

  try{
    const key="venttoolsProjectPackV1";
    const existing=JSON.parse(localStorage.getItem(key)||"[]");
    const entry={
      id:"fd-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),
      createdAt:new Date().toISOString(),
      ref,loc,manufacturer:man.label,product:r.product,reference:r.reference,
      damper:r.damper,opening:r.opening,finishedOpening:r.finishedStage||r.opening,
      structuralOpening:r.cutStage||r.opening,openingBottom,openingTop,ductBottom,ductTop,bottomOffset,
      settingAnswer,settingWarning,source:`${p.guide} — ${p.revision}`,html
    };
    existing.push(entry);
    localStorage.setItem(key,JSON.stringify(existing));
    sessionStorage.setItem("venttoolsSiteSheetReturn",window.location.href);
    window.location.assign("pack-builder.html");
  }catch(e){
    fdMsg("warn","The damper could not be added to the project pack on this device.");
  }
}
async function copyFD(){const r=calcFD(),{man,p}=currentFD();const t=`Vent Tools — Fire Damper Opening\n\nManufacturer: ${man.label}\nProduct: ${r.product}\nMethod/reference: ${r.reference}\nDamper size: ${r.damper}\nFinished opening: ${r.finishedStage||r.opening}\nStructural hole to cut: ${r.cutStage||r.opening}\nRule: ${r.rule}\nGuide: ${p.guide} — ${p.revision}\n\nIndependent calculator. Verify against the current official manufacturer installation manual.`;try{await navigator.clipboard.writeText(t);fdMsg("ok","✅ Fire damper result copied.")}catch(e){fdMsg("warn","Could not copy automatically.")}}
function resetFD(){$("fdDatumLevel")&&( $("fdDatumLevel").value=2400);$("fdManufacturer").value="BSB";$("fdWidth").value=500;$("fdHeight").value=300;$("fdDiameter").value=250;$("fdBoardThickness").value=12.5;$("fdDwfxBoard").value=12.5;$("fdDwfxVariant").value="SMOKE";$("fdApertureShape").value="square";fillFDProducts()}
if($("fdSeries")){$("fdManufacturer").addEventListener("change",fillFDProducts);$("fdSeries").addEventListener("change",()=>{fillFDMethods();updateFDManualButtonLabel()});
$("fdWk25Config")?.addEventListener("change",updateFDInputs);
$("fdWk25Axis")?.addEventListener("change",calcFD);$("fdMethod").addEventListener("change",updateFDInputs);$("fdApertureShape").addEventListener("change",updateFDInputs);["fdWallBuild","fdAllowance","fdDwfxWAllowance","fdDwfxHAllowance","fdHevacGap"].forEach(id=>$(id).addEventListener("change",calcFD));$("fdDwfxVariant").addEventListener("change",()=>{configureDwfx(currentFD().m);updateFDInputs()});
$("fdDwfxInputBasis")?.addEventListener("change",updateFDInputs);
["fdDatumLevel"].forEach(id=>$(id)?.addEventListener("input",()=>updateFDSettingOut(calcFD())));$("fdHevacVariant").addEventListener("change",calcFD);$("fdSpanVariant").addEventListener("change",()=>{updateSpanInputs();calcFD()});["fdWidth","fdHeight","fdDiameter","fdBoardThickness","fdDwfxBoard","fdSpanWidth","fdSpanHeight","fdSpanDiameter"].forEach(id=>$(id).addEventListener("input",calcFD));$("fdCopyBtn").addEventListener("click",copyFD);$("fdSiteSheetBtn")?.addEventListener("click",buildFDSiteSheet);$("fdResetBtn").addEventListener("click",resetFD);fillFDProducts()}

function updateFDManualButtonLabel(){
  const link=$("fdManualLink");
  if(!link || !$("fdSeries")?.value) return;
  const {man,p}=currentFD();
  const product=$("fdSeries")?.value||"";
  const title=p.manualTitle||p.guide||`${man.label} installation manual`;
  link.href=p.manual||"#";
  link.innerHTML=p.manualTitle
    ? `<span aria-hidden="true">📄</span> Open Official ${p.manualTitle}`
    : man.label==="BSB"
      ? '<span aria-hidden="true">📄</span> Open Official BSB Installation Manual'
      : man.label==="Lindab"
        ? `<span aria-hidden="true">📄</span> Open Official ${product} Installation Booklet`
        : `<span aria-hidden="true">📄</span> Open Official ${man.label} Installation Guide`;
  const titleEl=$("fdManualTitle");
  if(titleEl) titleEl.textContent=`${man.label} • ${title} • ${p.revision||"current revision"}`;
}


['up','over','dia','minStraight','rmFactor','angleCustom'].forEach(id=>{
  const el=$(id);
  if(el) el.addEventListener('input',calculateOffset);
});
if($('angle')) $('angle').addEventListener('change',()=>{angleUI();calculateOffset()});


// VentTools install-to-home-screen support.
let deferredInstallPrompt=null;
const installBtn=document.getElementById('installVentToolsBtn');
const installModal=document.getElementById('installHelpModal');
const installHelpText=document.getElementById('installHelpText');

function isIOSDevice(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isStandaloneMode(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
}
function closeInstallModal(){
  if(installModal) installModal.hidden=true;
}

window.addEventListener('beforeinstallprompt',(event)=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  if(installBtn && !isStandaloneMode()) installBtn.hidden=false;
});

window.addEventListener('appinstalled',()=>{
  deferredInstallPrompt=null;
  if(installBtn) installBtn.hidden=true;
});

if(installBtn){
  if(isIOSDevice() && !isStandaloneMode()) installBtn.hidden=false;
  installBtn.addEventListener('click',async()=>{
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt=null;
      installBtn.hidden=true;
      return;
    }
    if(isIOSDevice()){
      installHelpText.textContent='In Safari, tap the Share button, then choose “Add to Home Screen”.';
    }else{
      installHelpText.textContent='Open your browser menu and choose “Install app” or “Add to Home screen”.';
    }
    installModal.hidden=false;
  });
}
document.getElementById('closeInstallHelp')?.addEventListener('click',closeInstallModal);
document.getElementById('installHelpOkay')?.addEventListener('click',closeInstallModal);
installModal?.addEventListener('click',(event)=>{if(event.target===installModal)closeInstallModal()});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
}


const VT_GA_ID=window.VENTTOOLS_GA_ID||"G-KWBWNN0WCB";
let vtAnalyticsLoaded=false;

function loadVentToolsAnalytics(){
  if(vtAnalyticsLoaded || !VT_GA_ID) return;
  vtAnalyticsLoaded=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  window.gtag("consent","default",{
    analytics_storage:"granted",
    ad_storage:"denied",
    ad_user_data:"denied",
    ad_personalization:"denied"
  });
  window.gtag("js",new Date());
  window.gtag("config",VT_GA_ID,{
    anonymize_ip:true,
    send_page_view:false
  });
  const tag=document.createElement("script");
  tag.async=true;
  tag.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(VT_GA_ID)}`;
  document.head.appendChild(tag);
  sendVentToolsPageView();
}

function sendVentToolsPageView(){
  if(!vtAnalyticsLoaded || typeof window.gtag!=="function") return;
  const page=(location.hash||"#home").slice(1);
  window.gtag("event","page_view",{
    page_title:`VentTools — ${page}`,
    page_location:location.href,
    page_path:`/${page==="home"?"":`#${page}`}`
  });
}

function disableVentToolsAnalytics(){
  if(typeof window.gtag==="function"){
    window.gtag("consent","update",{analytics_storage:"denied"});
  }
}

const VT_CONSENT_KEY="venttools-consent-v1";
function getCookieConsent(){
  try{return JSON.parse(localStorage.getItem(VT_CONSENT_KEY)||"null")}catch(e){return null}
}
function applyCookieConsent(consent){
  window.venttoolsConsent={essential:true,analytics:!!(consent&&consent.analytics)};
  if(window.venttoolsConsent.analytics){
    loadVentToolsAnalytics();
    if(typeof window.gtag==="function"){
      window.gtag("consent","update",{analytics_storage:"granted"});
    }
  }else{
    disableVentToolsAnalytics();
  }
  document.dispatchEvent(new CustomEvent("venttools:consent",{detail:window.venttoolsConsent}));
}
function saveCookieConsent(analytics){
  const consent={essential:true,analytics:!!analytics,updated:new Date().toISOString()};
  localStorage.setItem(VT_CONSENT_KEY,JSON.stringify(consent));
  applyCookieConsent(consent);
  const banner=$("cookieBanner");if(banner)banner.hidden=true;
  closeCookiePreferences();
}
function openCookiePreferences(){
  const consent=getCookieConsent();
  const toggle=$("analyticsConsentToggle");
  if(toggle)toggle.checked=!!(consent&&consent.analytics);
  const modal=$("cookieModal");if(modal)modal.hidden=false;
}
function closeCookiePreferences(){
  const modal=$("cookieModal");if(modal)modal.hidden=true;
}
function saveCookiePreferences(){
  const toggle=$("analyticsConsentToggle");
  saveCookieConsent(!!(toggle&&toggle.checked));
}
function initialiseVentToolsSite(){
  const consent=getCookieConsent();
  applyCookieConsent(consent||{analytics:false});
  const banner=$("cookieBanner");
  if(banner)banner.hidden=!!consent;
  const requested=(location.hash||"#home").slice(1);
  const allowed=["home","offset","ductulator","ductwrap","fireDamper","contact","about","privacy","cookies","terms","disclaimer"];
  showPage(allowed.includes(requested)?requested:"home");
}
window.addEventListener("DOMContentLoaded",initialiseVentToolsSite);
