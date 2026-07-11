const $=id=>document.getElementById(id);function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');if(id==='offset')calculateOffset();if(id==='ductulator')calculateDuct()}function rad(d){return d*Math.PI/180}function deg(r){return r*180/Math.PI}function fmt(x){return Number.isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—'}function fmt0(x){return Number.isFinite(x)?String(Math.round(x)):'—'}function getAngle(){return $('angle').value==='custom'?(parseFloat($('angleCustom').value)||45):(parseFloat($('angle').value)||45)}function setMsg(type,txt){let m=$('msg');m.className='msg '+type;m.textContent=txt}
function ductPath(x1,y1,x2,y2,w){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,nx=-vy/L*w/2,ny=vx/L*w/2;return`M ${x1+nx} ${y1+ny} L ${x2+nx} ${y2+ny} L ${x2-nx} ${y2-ny} L ${x1-nx} ${y1-ny} Z`}function spiralLines(x1,y1,x2,y2,w,count){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,ux=vx/L,uy=vy/L,nx=-uy,ny=ux,s='';for(let i=1;i<count;i++){let t=i/count*L,cx=x1+ux*t,cy=y1+uy*t,a=18;s+=`<line x1="${cx+nx*w*.42-ux*a}" y1="${cy+ny*w*.42-uy*a}" x2="${cx-nx*w*.42+ux*a}" y2="${cy-ny*w*.42+uy*a}" stroke="#9aa4b2" stroke-width="1.4"/>`}return s}
function annularSectorPath(cx,cy,rO,rI,a1,a2){const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)],A=p(rO,a1),B=p(rO,a2),C=p(rI,a2),D=p(rI,a1),sw=a2>a1?1:0;return `M ${A[0]} ${A[1]} A ${rO} ${rO} 0 0 ${sw} ${B[0]} ${B[1]} L ${C[0]} ${C[1]} A ${rI} ${rI} 0 0 ${1-sw} ${D[0]} ${D[1]} Z`}
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

  const chip=$('fittingChip');
  if(chip) chip.textContent=`Fitting style: ${fittingType} • Ø${fmt0(d.D)} mm`;
}
function calculateOffset(){const V=parseFloat($('up').value)||0,H=parseFloat($('over').value)||0,A=getAngle(),D=parseFloat($('dia').value)||0,minS=parseFloat($('minStraight').value)||0,rmF=parseFloat($('rmFactor').value)||1,th=rad(A),R=Math.hypot(V,H),T=Math.sin(th)>0?R/Math.sin(th):NaN,roll=(V===0&&H===0)?0:deg(Math.atan2(V,H)),rm=rmF*D,l=rm*Math.tan(th/2),straight=T-(2*l);$('straightBig').textContent=fmt(straight)+' mm';$('rollBig').textContent=fmt(roll)+'°';const result=`Vent Tools - Offset Calculator\n\nInputs:\n  Rise / Up (V)          = ${fmt(V)} mm\n  Offset / Over (H)      = ${fmt(H)} mm\n  Bend angle (θ)         = ${fmt(A)}°\n  Duct diameter (D)      = ${fmt(D)} mm\n  rm factor              = ${fmt(rmF)}\n  Minimum straight       = ${fmt(minS)} mm\n\nResults:\n  Cut straight L         = ${fmt(straight)} mm\n  Roll angle             = ${fmt(roll)}°\n  Resultant offset R     = ${fmt(R)} mm\n  Travel T               = ${fmt(T)} mm\n  Bend setback l         = ${fmt(l)} mm\n  Drawing fitting style  = ${D<=250?'Pressed':'Segmented / lockseamed'}`;$('out').textContent=result;drawOffset({V,H,A,D,straight,roll});if(!Number.isFinite(straight))setMsg('bad','⚠ Check your angle input.');else if(straight<0)setMsg('bad','❌ Impossible fit: bends overlap. Use smaller angle or increase space.');else if(straight<minS)setMsg('warn',`⚠ Straight section under ${fmt(minS)} mm. Check bend spigot/swedge depths — opposing swedges may meet inside the straight.`);else setMsg('ok','✅ Ready to install — check manufacturer dimensions and site conditions.');return result}
function angleUI(){let c=$('angle').value==='custom';$('angleCustom').style.display=c?'block':'none';if(!c)$('angleCustom').value=$('angle').value}function resetOffset(){$('up').value=300;$('over').value=250;$('angle').value='45';$('angleCustom').value=45;$('dia').value=315;$('minStraight').value=120;$('rmFactor').value=1;angleUI();calculateOffset()}async function copyOffset(){let r=calculateOffset();try{await navigator.clipboard.writeText(r);setMsg('ok','✅ Result copied.')}catch(e){setMsg('warn','Could not copy automatically. Long-press working text and copy manually.')}}function toggleWorking(){let o=$('out'),show=o.style.display==='block';o.style.display=show?'none':'block';$('workingBtn').textContent=show?'Show working':'Hide working'}['up','over','dia','minStraight','rmFactor','angle','angleCustom'].forEach(id=>{$(id).addEventListener('input',()=>{angleUI();calculateOffset()});$(id).addEventListener('change',()=>{angleUI();calculateOffset()})});$('resetBtn').addEventListener('click',resetOffset);$('copyBtn').addEventListener('click',copyOffset);$('workingBtn').addEventListener('click',toggleWorking);
const standardSpiral=[80,100,125,150,160,180,200,224,250,280,300,315,355,400,450,500,560,600,630,710,800,900,1000,1120,1250];function nearestStandard(d){let best=standardSpiral[0];for(const s of standardSpiral){if(Math.abs(s-d)<Math.abs(best-d))best=s}return best}function drawDuctulator(w,h,dia){let layer=$('ductDiagramLayer'),rx=90,ry=60,rw=230,rh=115,cx=560,cy=120,r=65;layer.innerHTML=`<defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 Z" fill="#064b82"/></marker></defs><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" fill="#d9dde3" stroke="#111827" stroke-width="3"/><line x1="${rx}" y1="${ry+rh/2}" x2="${rx+rw}" y2="${ry+rh/2}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${rx+rw/2}" y="${ry+rh+32}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${fmt0(w)} × ${fmt0(h)} mm</text><path d="M350 120 L455 120" stroke="#064b82" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9dde3" stroke="#111827" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="18" fill="none" stroke="#9aa4b2" stroke-width="1.6"/><ellipse cx="${cx}" cy="${cy}" rx="${r*.72}" ry="12" fill="none" stroke="#9aa4b2" stroke-width="1.4"/><line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${cx}" y="${cy+r+34}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">Ø ${fmt(dia)} mm</text>`}
function calculateDuct(){const w=parseFloat($('rectW').value)||0,h=parseFloat($('rectH').value)||0,area=w*h,eq=Math.sqrt((4*area)/Math.PI),near=nearestStandard(eq);$('eqRound').textContent=fmt(eq)+' mm';$('nearestRound').textContent='Ø '+fmt0(near);$('rectArea').textContent=fmt0(area)+' mm²';drawDuctulator(w,h,eq);return `Vent Tools - Rect to Round Ductulator\n\nRectangular duct: ${fmt0(w)} × ${fmt0(h)} mm\nArea: ${fmt0(area)} mm²\nSame-area round: Ø ${fmt(eq)} mm\nNearest standard spiral: Ø ${fmt0(near)} mm`}async function copyDuct(){let r=calculateDuct();try{await navigator.clipboard.writeText(r)}catch(e){}}function resetDuct(){$('rectW').value=600;$('rectH').value=300;calculateDuct()}['rectW','rectH'].forEach(id=>$(id).addEventListener('input',calculateDuct));$('copyDuctBtn').addEventListener('click',copyDuct);$('resetDuctBtn').addEventListener('click',resetDuct);angleUI();calculateOffset();calculateDuct();
