const $=id=>document.getElementById(id);function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(id).classList.add('active');if(id==='offset')calculateOffset();if(id==='ductulator')calculateDuct()}function rad(d){return d*Math.PI/180}function deg(r){return r*180/Math.PI}function fmt(x){return Number.isFinite(x)?(Math.round(x*10)/10).toFixed(1):'—'}function fmt0(x){return Number.isFinite(x)?String(Math.round(x)):'—'}function getAngle(){return $('angle').value==='custom'?(parseFloat($('angleCustom').value)||45):(parseFloat($('angle').value)||45)}function setMsg(type,txt){let m=$('msg');m.className='msg '+type;m.textContent=txt}
function ductPath(x1,y1,x2,y2,w){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,nx=-vy/L*w/2,ny=vx/L*w/2;return`M ${x1+nx} ${y1+ny} L ${x2+nx} ${y2+ny} L ${x2-nx} ${y2-ny} L ${x1-nx} ${y1-ny} Z`}function spiralLines(x1,y1,x2,y2,w,count){let vx=x2-x1,vy=y2-y1,L=Math.hypot(vx,vy)||1,ux=vx/L,uy=vy/L,nx=-uy,ny=ux,s='';for(let i=1;i<count;i++){let t=i/count*L,cx=x1+ux*t,cy=y1+uy*t,a=18;s+=`<line x1="${cx+nx*w*.42-ux*a}" y1="${cy+ny*w*.42-uy*a}" x2="${cx-nx*w*.42+ux*a}" y2="${cy-ny*w*.42+uy*a}" stroke="#9aa4b2" stroke-width="1.4"/>`}return s}
function annularSectorPath(cx,cy,rO,rI,a1,a2){const p=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)],A=p(rO,a1),B=p(rO,a2),C=p(rI,a2),D=p(rI,a1),sw=a2>a1?1:0;return `M ${A[0]} ${A[1]} A ${rO} ${rO} 0 0 ${sw} ${B[0]} ${B[1]} L ${C[0]} ${C[1]} A ${rI} ${rI} 0 0 ${1-sw} ${D[0]} ${D[1]} Z`}
function drawOffset(d){
  const baseX=145,baseY=255,maxRun=400,maxRise=145;
  const scale=Math.min(maxRun/Math.max(d.H,240),maxRise/Math.max(d.V,180));
  const dx=Math.max(120,d.H*scale),dy=Math.max(70,d.V*scale);
  const p0={x:baseX-95,y:baseY},p1={x:baseX,y:baseY},p2={x:baseX+dx,y:baseY-dy},p3={x:baseX+dx+95,y:baseY-dy};
  const w=42,corner=48,dimY=315,dimX=p2.x+52;
  const fittingType=d.D<=250?'Pressed bend':'Segmented / lockseamed bend';

  function unit(a,b){const vx=b.x-a.x,vy=b.y-a.y,L=Math.hypot(vx,vy)||1;return{x:vx/L,y:vy/L}}
  function pt(p,u,t){return{x:p.x+u.x*t,y:p.y+u.y*t}}
  function normal(u){return{x:-u.y,y:u.x}}
  const u01=unit(p0,p1),u12=unit(p1,p2),u23=unit(p2,p3);
  const a1=pt(p1,u01,-corner),b1=pt(p1,u12,corner);
  const a2=pt(p2,u12,-corner),b2=pt(p2,u23,corner);
  const path=`M ${p0.x} ${p0.y} L ${a1.x} ${a1.y} Q ${p1.x} ${p1.y} ${b1.x} ${b1.y} L ${a2.x} ${a2.y} Q ${p2.x} ${p2.y} ${b2.x} ${b2.y} L ${p3.x} ${p3.y}`;

  function seamSet(a,b,count){
    const u=unit(a,b),n=normal(u),L=Math.hypot(b.x-a.x,b.y-a.y);let out='';
    for(let i=1;i<count;i++){
      const c=pt(a,u,L*i/count),sl=15;
      out+=`<line x1="${c.x+n.x*w*.40-u.x*sl}" y1="${c.y+n.y*w*.40-u.y*sl}" x2="${c.x-n.x*w*.40+u.x*sl}" y2="${c.y-n.y*w*.40+u.y*sl}" stroke="#9aa4b2" stroke-width="1.3"/>`;
    }
    return out;
  }
  function bandAt(p,u,width=2.2,colour='#6b7280'){
    const n=normal(u);
    return `<line x1="${p.x+n.x*w*.49}" y1="${p.y+n.y*w*.49}" x2="${p.x-n.x*w*.49}" y2="${p.y-n.y*w*.49}" stroke="${colour}" stroke-width="${width}"/>`;
  }
  function bendBands(vertex,inU,outU,pressed){
    const count=pressed?2:4;
    let out='';
    for(let i=1;i<=count;i++){
      const t=i/(count+1);
      const q={
        x:(1-t)*(1-t)*a1.x+2*(1-t)*t*vertex.x+t*t*b1.x,
        y:(1-t)*(1-t)*a1.y+2*(1-t)*t*vertex.y+t*t*b1.y
      };
      const tangent={
        x:2*(1-t)*(vertex.x-a1.x)+2*t*(b1.x-vertex.x),
        y:2*(1-t)*(vertex.y-a1.y)+2*t*(b1.y-vertex.y)
      };
      const L=Math.hypot(tangent.x,tangent.y)||1;
      out+=bandAt(q,{x:tangent.x/L,y:tangent.y/L},pressed?1.5:2.1,pressed?'#9ca3af':'#667085');
    }
    return out;
  }
  function secondBendBands(vertex,pressed){
    const count=pressed?2:4;
    let out='';
    for(let i=1;i<=count;i++){
      const t=i/(count+1);
      const q={
        x:(1-t)*(1-t)*a2.x+2*(1-t)*t*vertex.x+t*t*b2.x,
        y:(1-t)*(1-t)*a2.y+2*(1-t)*t*vertex.y+t*t*b2.y
      };
      const tangent={
        x:2*(1-t)*(vertex.x-a2.x)+2*t*(b2.x-vertex.x),
        y:2*(1-t)*(vertex.y-a2.y)+2*t*(b2.y-vertex.y)
      };
      const L=Math.hypot(tangent.x,tangent.y)||1;
      out+=bandAt(q,{x:tangent.x/L,y:tangent.y/L},pressed?1.5:2.1,pressed?'#9ca3af':'#667085');
    }
    return out;
  }

  const pressed=d.D<=250;
  const bendDetail1=bendBands(p1,u01,u12,pressed);
  const bendDetail2=secondBendBands(p2,pressed);

  $('diagramLayer').innerHTML=`
    <path d="${path}" fill="none" stroke="#4b5563" stroke-width="${w+4}" stroke-linecap="butt" stroke-linejoin="round"/>
    <path d="${path}" fill="none" stroke="url(#ductGrad)" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="round"/>

    ${seamSet(p0,a1,4)}
    ${seamSet(b1,a2,8)}
    ${seamSet(b2,p3,4)}

    ${bandAt(a1,u01,3)}
    ${bendDetail1}
    ${bandAt(b1,u12,3)}
    ${bandAt(a2,u12,3)}
    ${bendDetail2}
    ${bandAt(b2,u23,3)}

    <path d="${path}" fill="none" stroke="#111827" stroke-width="1.8" stroke-dasharray="7 7"/>

    <line x1="${p1.x}" y1="${p1.y}" x2="${p1.x}" y2="${dimY}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 5"/>
    <line x1="${p2.x}" y1="${p2.y}" x2="${p2.x}" y2="${dimY}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 5"/>
    <line x1="${p1.x}" y1="${dimY}" x2="${p2.x}" y2="${dimY}" stroke="#064b82" stroke-width="2.2" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
    <text x="${(p1.x+p2.x)/2}" y="${dimY+27}" text-anchor="middle" font-family="system-ui" font-size="15" font-weight="800" fill="#064b82">Offset ${fmt(d.H)} mm</text>

    <line x1="${p2.x}" y1="${p1.y}" x2="${p2.x+42}" y2="${p1.y}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 5"/>
    <line x1="${p2.x}" y1="${p2.y}" x2="${p2.x+42}" y2="${p2.y}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5 5"/>
    <line x1="${dimX}" y1="${p1.y}" x2="${dimX}" y2="${p2.y}" stroke="#064b82" stroke-width="2.2" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
    <text x="${dimX+13}" y="${(p1.y+p2.y)/2}" text-anchor="start" font-family="system-ui" font-size="15" font-weight="800" fill="#064b82">Rise ${fmt(d.V)} mm</text>

    <text x="${(b1.x+a2.x)/2}" y="${(b1.y+a2.y)/2-25}" text-anchor="middle" font-family="system-ui" font-size="17" font-weight="900" fill="#111827">L ${fmt(d.straight)} mm</text>
    <text x="${p1.x+5}" y="${p1.y-63}" font-family="system-ui" font-size="14" font-weight="800" fill="#111827">${fmt(d.A)}° ${pressed?'pressed':'segmented'} bend</text>
    <text x="380" y="34" text-anchor="middle" font-family="system-ui" font-size="18" font-weight="950" fill="#111827">Roll ${fmt(d.roll)}°</text>`;

  const chip=$('fittingChip');
  if(chip) chip.textContent=`Fitting style: ${fittingType} • Ø${fmt0(d.D)} mm`;
}
function calculateOffset(){const V=parseFloat($('up').value)||0,H=parseFloat($('over').value)||0,A=getAngle(),D=parseFloat($('dia').value)||0,minS=parseFloat($('minStraight').value)||0,rmF=parseFloat($('rmFactor').value)||1,th=rad(A),R=Math.hypot(V,H),T=Math.sin(th)>0?R/Math.sin(th):NaN,roll=(V===0&&H===0)?0:deg(Math.atan2(V,H)),rm=rmF*D,l=rm*Math.tan(th/2),straight=T-(2*l);$('straightBig').textContent=fmt(straight)+' mm';$('rollBig').textContent=fmt(roll)+'°';const result=`Vent Tools - Offset Calculator\n\nInputs:\n  Rise / Up (V)          = ${fmt(V)} mm\n  Offset / Over (H)      = ${fmt(H)} mm\n  Bend angle (θ)         = ${fmt(A)}°\n  Duct diameter (D)      = ${fmt(D)} mm\n  rm factor              = ${fmt(rmF)}\n  Minimum straight       = ${fmt(minS)} mm\n\nResults:\n  Cut straight L         = ${fmt(straight)} mm\n  Roll angle             = ${fmt(roll)}°\n  Resultant offset R     = ${fmt(R)} mm\n  Travel T               = ${fmt(T)} mm\n  Bend setback l         = ${fmt(l)} mm\n  Drawing fitting style  = ${D<=250?'Pressed':'Segmented / lockseamed'}`;$('out').textContent=result;drawOffset({V,H,A,D,straight,roll});if(!Number.isFinite(straight))setMsg('bad','⚠ Check your angle input.');else if(straight<0)setMsg('bad','❌ Impossible fit: bends overlap. Use smaller angle or increase space.');else if(straight<minS)setMsg('warn',`⚠ Straight section under ${fmt(minS)} mm. Check bend spigot/swedge depths — opposing swedges may meet inside the straight.`);else setMsg('ok','✅ Ready to install — check manufacturer dimensions and site conditions.');return result}
function angleUI(){let c=$('angle').value==='custom';$('angleCustom').style.display=c?'block':'none';if(!c)$('angleCustom').value=$('angle').value}function resetOffset(){$('up').value=300;$('over').value=250;$('angle').value='45';$('angleCustom').value=45;$('dia').value=315;$('minStraight').value=120;$('rmFactor').value=1;angleUI();calculateOffset()}async function copyOffset(){let r=calculateOffset();try{await navigator.clipboard.writeText(r);setMsg('ok','✅ Result copied.')}catch(e){setMsg('warn','Could not copy automatically. Long-press working text and copy manually.')}}function toggleWorking(){let o=$('out'),show=o.style.display==='block';o.style.display=show?'none':'block';$('workingBtn').textContent=show?'Show working':'Hide working'}['up','over','dia','minStraight','rmFactor','angle','angleCustom'].forEach(id=>{$(id).addEventListener('input',()=>{angleUI();calculateOffset()});$(id).addEventListener('change',()=>{angleUI();calculateOffset()})});$('resetBtn').addEventListener('click',resetOffset);$('copyBtn').addEventListener('click',copyOffset);$('workingBtn').addEventListener('click',toggleWorking);
const standardSpiral=[80,100,125,150,160,180,200,224,250,280,300,315,355,400,450,500,560,600,630,710,800,900,1000,1120,1250];function nearestStandard(d){let best=standardSpiral[0];for(const s of standardSpiral){if(Math.abs(s-d)<Math.abs(best-d))best=s}return best}function drawDuctulator(w,h,dia){let layer=$('ductDiagramLayer'),rx=90,ry=60,rw=230,rh=115,cx=560,cy=120,r=65;layer.innerHTML=`<defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,4 L0,8 Z" fill="#064b82"/></marker></defs><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="8" fill="#d9dde3" stroke="#111827" stroke-width="3"/><line x1="${rx}" y1="${ry+rh/2}" x2="${rx+rw}" y2="${ry+rh/2}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${rx+rw/2}" y="${ry+rh+32}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">${fmt0(w)} × ${fmt0(h)} mm</text><path d="M350 120 L455 120" stroke="#064b82" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9dde3" stroke="#111827" stroke-width="3"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="18" fill="none" stroke="#9aa4b2" stroke-width="1.6"/><ellipse cx="${cx}" cy="${cy}" rx="${r*.72}" ry="12" fill="none" stroke="#9aa4b2" stroke-width="1.4"/><line x1="${cx-r}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#111827" stroke-width="2" stroke-dasharray="7 7"/><text x="${cx}" y="${cy+r+34}" text-anchor="middle" font-family="system-ui" font-size="16" font-weight="900" fill="#064b82">Ø ${fmt(dia)} mm</text>`}
function calculateDuct(){const w=parseFloat($('rectW').value)||0,h=parseFloat($('rectH').value)||0,area=w*h,eq=Math.sqrt((4*area)/Math.PI),near=nearestStandard(eq);$('eqRound').textContent=fmt(eq)+' mm';$('nearestRound').textContent='Ø '+fmt0(near);$('rectArea').textContent=fmt0(area)+' mm²';drawDuctulator(w,h,eq);return `Vent Tools - Rect to Round Ductulator\n\nRectangular duct: ${fmt0(w)} × ${fmt0(h)} mm\nArea: ${fmt0(area)} mm²\nSame-area round: Ø ${fmt(eq)} mm\nNearest standard spiral: Ø ${fmt0(near)} mm`}async function copyDuct(){let r=calculateDuct();try{await navigator.clipboard.writeText(r)}catch(e){}}function resetDuct(){$('rectW').value=600;$('rectH').value=300;calculateDuct()}['rectW','rectH'].forEach(id=>$(id).addEventListener('input',calculateDuct));$('copyDuctBtn').addEventListener('click',copyDuct);$('resetDuctBtn').addEventListener('click',resetDuct);angleUI();calculateOffset();calculateDuct();
