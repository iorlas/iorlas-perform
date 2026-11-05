/* art/stas_cut.js - Stas, cut-paper puppet (rig "stas"). Same construction, joints and draw contract as rig "vadik" 1.0.0.
   Registers: HF.RIG.stas (data + .expr + .poses + .variantDefault), HF.RIGS.stas (draw(st,ch) -> svg markup in actor-local space), HF.CHARS.stas_cut.
   Expressions / poses are registered PER RIG (HF.RIG.stas.expr / .poses), not in the shared HF.EXPR / HF.POSES, because names like neutral_anxious
   and stand_still collide across rigs.
   Local space: origin = neck base, +y down, shoulders y~24, hips y=250, floor y=568. Every part is a flat filled paper shape, no outlines; soft drop
   shadow between layers (filter on an UNROTATED wrapper). All randomness = HF.hash(seed...). Pure function of (st, t). */
(function(){
var HF=window.HF=window.HF||{},PI=Math.PI;
function f(n){return Math.round(n*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function nz(v,d){return v==null||v!==v?d:v}

/* ------------------------------------------------------------------ rig data */
var RIG=HF.RIG=HF.RIG||{};HF.RIGS=HF.RIGS||{};
var R=RIG.stas={
  version:"1.0.0",seed:13,
  pal:{skin:"#e9d0b8",skin2:"#d6b79e",skinSh:"#c39b80",hair:"#3d2f2b",hair2:"#2f2421",hair3:"#4a3a35",
       sweater:"#5b5a70",sweater2:"#4b4a5e",sweaterHi:"#6b6a82",collarIn:"#34333f",pants:"#34383f",pants2:"#2a2d33",
       shoe:"#3b4658",shoe2:"#2d3646",sole:"#e8e2d2",shoeAcc:"#3f9a94",toeCap:"#4a566c",shoeIn:"#23262e",
       nose:"#dcb79c",noseSh:"#c79a80",noseHi:"#efd8c2",nostril:"#a8745f",
       lan:"#3f9a94",badge:"#f1efe6",badge2:"#3f9a94",badgeInk:"#2c3340",brow:"#3a2f2b",lid:"#6c4a38",
       eyeW:"#f5f2ea",pupil:"#1e1c22",mouth:"#9a5a52",mouthIn:"#5a2b2a",cheek:"#d9a090",handset:"#1c2430",handset2:"#2d3a4c",
       notebook:"#2c3340",notebook2:"#1e242e",paper:"#e8e3d0",spiral:"#cfd6dc",bookmark:"#3f9a94",shadow:"#0b1020"},
  dim:{hw:50,sw:54,shY:24,UA:108,FA:100,UL:140,LL:138,hipY:250,hemY:250,ankleY:548,neckY:-32,headCY:-58,eyeY:-60,sep:22,lanY:70,tufts:5},
  pivots:{
    root:{at:[0,568],note:"floor contact, between feet"},
    hip:{at:[0,228],parent:"root",note:"upper body lean pivot"},
    torso:{at:[0,0],parent:"hip",note:"neck base"},
    neck:{at:[0,-22],parent:"torso"},
    head:{at:[0,-22],parent:"neck",note:"tilt + yaw pivot (chin/neck joint)"},
    hair_tuft_i:{at:"seeded root on crown (head frame)",parent:"head",note:"5 small loose strands, sway pivot at root"},
    ear_L_R:{at:[-50,-58],parent:"head"},
    fringe:{at:[0,-60],parent:"head",note:"dark fringe sweeping over the screen-right eye; follows face x offset"},
    face:{at:[0,-58],parent:"head",note:"eyes, lids, brows, mouth layer"},
    upper_arm_L_R:{at:[-42,24],parent:"torso",note:"shoulder; R mirrored"},
    forearm_L_R:{at:"elbow (IK)",parent:"upper_arm"},
    hand_L_R:{at:"wrist (IK, pose target)",parent:"forearm",note:"mitten + separate thumb"},
    lanyard:{at:[0,70],parent:"torso",note:"teal V strap joins here"},
    badge:{at:[0,70],parent:"lanyard",note:"pendulum, swings"},
    prop_notebook:{at:"hand_L_R palm (hand mode) or torso x=+-34,y=150 (side mode)",parent:"hand_L_R",note:"detachable; st.prop {on,at,hand}; default off"},
    upper_leg_L_R:{at:[-24,250],parent:"root"},
    lower_leg_L_R:{at:"knee (IK)",parent:"upper_leg"},
    pelvis:{at:[0,250],parent:"root",note:"trouser seat + belt line, under sweater hem, not leaned"},
    foot_L_R:{at:[-40,550],parent:"lower_leg",note:"ankle; toe direction sign by pose.legs.fl/fr, foreshortened by legs.fsh"}
  }
};
/* ------------------------------------------------------------------ expressions (all numeric => tweenable) */
var EX0={open:1,mt:0,mg:0,lk:0,fl:0,by:0,bdL:0,bdR:0,btL:8,btR:8,shut:0,pup:1,gl:0,mc:-0.15,mw:1,mo:0,ms:0,wob:0,slide:0,gx:0,gy:0,big:0,sweat:0};
function ex(o){var r={},k;for(k in EX0)r[k]=EX0[k];for(k in o)r[k]=o[k];return r}
/* brow tilt bt: + = inner end up (worry). by: + = lower. mc: + smile. slide is unused (no glasses), kept for schema parity.
   Baseline has the eyes slightly off-axis (gx 0.35): the deadpan "not looking at you". */
var X={
  deadpan:ex({open:0.8,by:0,btL:0,btR:0,pup:0.9,mc:0,mw:0.9,gx:0.35,gy:0.1}),
  neutral_anxious:ex({open:0.85,by:-1,btL:8,btR:8,pup:0.9,mc:-0.4,mw:0.9,gx:0.35}),
  wince:ex({open:0.1,shut:1,by:3,btL:12,btR:12,pup:1,mc:-0.6,mw:0.9,wob:1,mt:1}),
  side_glance:ex({open:0.85,by:-1,btL:3,btR:3,bdR:-1,pup:0.95,mc:-0.15,mw:0.9,gx:1}),
  panic:ex({open:1.5,big:0.6,by:-6,btL:20,btR:20,bdL:-2,pup:0.95,lk:1,fl:1,mc:-1,mw:0.54,mo:0.85,mt:0,mg:0,sweat:-1}),
  pretend:ex({open:0.8,by:-2,btL:4,btR:4,pup:0.95,mc:0.3,mw:1,ms:1,gx:0.35}),
  shame:ex({open:0.55,by:-2,btL:14,btR:14,pup:0.95,mc:-1,mw:0.9,gy:1}),
  realize:ex({open:1.2,by:-3,bdL:-6,btL:3,btR:8,pup:1,mc:0,mw:0.65,mo:0.5}),
  blank:ex({open:0.95,by:0,btL:0,btR:0,pup:1,mc:-0.05,mw:0.9}),
  flat_stare_at_off:ex({open:0.68,by:1,btL:0,btR:0,pup:0.85,mc:0,mw:0.85,gx:1.2,gy:0.25}),
  file_it:ex({open:0.8,by:0,bdL:-17,bdR:3,btL:9,btR:-2,pup:0.9,mc:0.15,mw:0.7,ms:1,gx:0.35,gy:0.1})
};
X.side_glance_l=ex({});for(var k0 in X.side_glance)X.side_glance_l[k0]=X.side_glance[k0];X.side_glance_l.gx=-1;
R.expr=X;
/* ------------------------------------------------------------------ poses (data; hand target h = wrist, actor-local) */
function merge(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=merge(o[k]||{},b[k]);else o[k]=b[k]}return o}
var PB={turn:0,back:false,lean:0,hipx:0,sh:0,fid:0,
  head:{yaw:0,tilt:0,dx:0,dy:0,back:false},
  L:{h:[-58,230],bend:1,hand:"mitten",rot:0,s:0.95,z:1,rcv:0,rr:0,pr:0},
  R:{h:[58,230],bend:-1,hand:"mitten",rot:0,s:0.95,z:1,rcv:0,rr:0,pr:0},
  legs:{spread:24,ank:40,kin:2,k:0,fl:-1,fr:1,fsh:1,fs:1}};
var PS={
  stand_still:{sh:6,head:{tilt:3,dy:2}},
  stand_fidget:{sh:7,fid:1,lean:0.1,head:{tilt:4,dy:2},R:{h:[20,72],bend:-1,rot:-12},L:{h:[-56,226]}},
  hold_receiver:{sh:8,turn:-0.12,lean:0.08,head:{yaw:-0.3,tilt:-6,dx:-2,dy:1},L:{h:[-98,-4],bend:-1,rot:0,rcv:1,rr:8},R:{h:[58,228]}},
  hold_prop:{sh:6,head:{tilt:3,dy:2},R:{h:[24,122],bend:-1,rot:0,pr:0},L:{h:[-58,230]}}
};
R.poses={};
for(var pn in PS)R.poses[pn]=merge(PB,PS[pn]);
/* ------------------------------------------------------------------ geometry helpers */
function ik(S,H,u,l,bend){
  var dx=H[0]-S[0],dy=H[1]-S[1],d=Math.sqrt(dx*dx+dy*dy)||1,maxd=u+l-0.5,mind=Math.abs(u-l)+2;
  if(d>maxd){H=[S[0]+dx/d*maxd,S[1]+dy/d*maxd];dx=H[0]-S[0];dy=H[1]-S[1];d=maxd}
  if(d<mind){d=mind}
  var a=(u*u-l*l+d*d)/(2*d),h=Math.sqrt(Math.max(0,u*u-a*a));
  var ux=dx/(Math.sqrt(dx*dx+dy*dy)||1),uy=dy/(Math.sqrt(dx*dx+dy*dy)||1);
  return {e:[S[0]+ux*a-uy*h*bend,S[1]+uy*a+ux*h*bend],h:H};
}
function ang(a,b){return Math.atan2(b[1]-a[1],b[0]-a[0])*180/PI-90}
function cap(L,w0,w1){var a=w0/2,b=w1/2;return 'M'+f(-a)+',0 L'+f(-b)+','+f(L)+' A'+f(b)+','+f(b)+' 0 0 0 '+f(b)+','+f(L)+' L'+f(a)+',0 A'+f(a)+','+f(a)+' 0 0 0 '+f(-a)+',0 Z'}
function tr(x,y,r,s){return 'translate('+f(x)+','+f(y)+')'+(r?' rotate('+f(r)+')':'')+(s!=null&&s!==1?' scale('+s+')':'')}


/* design-variant parameters (st.v overrides; all optional) */
var V0={hw:1,jw:0.92,ch:0,nx:0.95,ny:0.95,my:0,es:0.85,lid:0.38,bw:5,bl:15,bdy:2,bags:1,earS:0.95,th:1,cheek:0.14};
function mv(o){var r=JSON.parse(JSON.stringify(V0)),k;if(o)for(k in o)r[k]=o[k];return r}
R.variantDefault=V0;
/* ------------------------------------------------------------------ parts. Each returns markup around its own pivot (0,0). */
var P={};
P.tuft=function(S,i){var T=S.tufts[i],th=S.v.th;T={w:T.w,h:T.h*th,lean:T.lean,alt:T.alt};
  return '<path d="M'+f(-T.w)+',3 C'+f(-T.w*0.9)+','+f(-T.h*0.5)+' '+f(T.lean-3)+','+f(-T.h*0.88)+' '+f(T.lean)+','+f(-T.h)+' C'+f(T.lean+T.w*0.55)+','+f(-T.h*0.72)+' '+f(T.w*0.95)+','+f(-T.h*0.3)+' '+f(T.w)+',3 Z" fill="'+(T.alt?S.c.hair3:S.c.hair)+'"/>'};
P.hair=function(S){var c=S.c,w=S.hwid+4,o='';/* dark bowl cap: top, sides down over the ears' upper edge, parted hairline */
  o+='<path d="M'+f(-w-5)+',-30 C'+f(-w-10)+',-90 '+f(-w*.7)+',-128 0,-128 C'+f(w*.7)+',-128 '+f(w+10)+',-90 '+f(w+5)+',-30 C'+f(w+2)+',-46 '+f(w-2)+',-56 '+f(w-4)+',-66 C'+f(w-8)+',-86 '+f(w*.3)+',-96 '+f(-w*.3)+',-96 C'+f(-w*.7)+',-92 '+f(-w+6)+',-70 '+f(-w+3)+',-44 C'+f(-w+1)+',-40 '+f(-w-2)+',-34 '+f(-w-5)+',-30 Z" fill="'+c.hair+'"/>';
  o+='<path d="M'+f(w*.2)+',-127 C'+f(w*.7)+',-127 '+f(w+10)+',-90 '+f(w+5)+',-30 C'+f(w+2)+',-46 '+f(w-2)+',-56 '+f(w-4)+',-66 C'+f(w-8)+',-86 '+f(w*.3)+',-96 '+f(w*.1)+',-100 Z" fill="'+c.hair2+'" opacity=".6"/>';
  return o};
P.fringe=function(S){var c=S.c,w=S.hwid+4,o;/* swept fringe: from the left of the hairline across the forehead, dropping over the screen-right eye and brow */
  o='<path d="M'+f(-w+4)+',-100 C'+f(-w*.3)+',-106 '+f(w*.5)+',-100 '+f(w-2)+',-78 C'+f(w+2)+',-60 '+f(w-4)+',-50 '+f(w-14)+',-50 C'+f(w*.2)+',-68 '+f(-w*.2)+',-80 '+f(-w*.5)+',-84 C'+f(-w*.8)+',-88 '+f(-w+2)+',-94 '+f(-w+4)+',-100 Z" fill="'+c.hair+'"/>';
  o+='<path d="M'+f(w*.5)+',-92 C'+f(w+2)+',-76 '+f(w-2)+',-56 '+f(w-14)+',-48 C'+f(w*.7)+',-62 '+f(w*.5)+',-78 '+f(w*.3)+',-88 Z" fill="'+c.hair2+'" opacity=".6"/>';
  var fl=nz(S.e.fl,0);return '<g transform="translate('+f(S.fx*0.4)+','+f(S.pitch-fl*15)+') rotate('+f(-fl*7)+' '+f(-w+4)+' -100)">'+o+'</g>'};
/* bowl-cap silhouette at rest (unshifted), used as the hair + fringe clip envelope together with the skull */
P.capD=function(S){var w=S.hwid+4;
  return 'M'+f(-w-5)+',-30 C'+f(-w-10)+',-90 '+f(-w*.7)+',-128 0,-128 C'+f(w*.7)+',-128 '+f(w+10)+',-90 '+f(w+5)+',-30 Z'};
/* BACK view of the head (pose.back or pose.head.back): ears at the sides behind the skull, dark bowl from crown to a soft nape line.
   No face features or fringe. Crown strands drawn by the assembler behind it. */
P.head_back=function(S){var c=S.c,u=S.uid,w=S.hwid,hw=w+4,sk=P.skull(S),o='';
  [-1,1].forEach(function(sd){o+='<g transform="translate('+f(sd*(w+1))+',-58) scale('+S.v.earS+')"><path d="M0,-17 C'+f(sd*13)+',-18 '+f(sd*15)+',-4 '+f(sd*12)+',6 C'+f(sd*9)+',15 '+f(sd*3)+',18 0,15 Z" fill="'+c.skin2+'"/></g>'});
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs><path d="'+sk+'" fill="'+c.skin+'"/>';
  o+='<g clip-path="url(#'+u+'hc)"><path d="M-90,-26 L90,-26 L90,40 L-90,40 Z" fill="'+c.skinSh+'" opacity=".3"/></g>';
  var d='M'+f(-hw-5)+',-30 C'+f(-hw-10)+',-90 '+f(-hw*.7)+',-128 0,-128 C'+f(hw*.7)+',-128 '+f(hw+10)+',-90 '+f(hw+5)+',-30'+
    ' C'+f(w)+',-24 '+f(w*0.6)+',-20 '+f(w*0.3)+',-16 L'+f(w*0.18)+',-22 L'+f(w*0.05)+',-14 L'+f(-w*0.1)+',-21 L'+f(-w*0.24)+',-15 C'+f(-w*0.6)+',-20 '+f(-w)+',-24 '+f(-hw-5)+',-30 Z';
  var kx=S.key<0?-1:1;
  o+='<defs><clipPath id="'+u+'hbh"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.hair+'"/>'+
    '<g clip-path="url(#'+u+'hbh)"><path d="M'+f(kx*hw*0.2)+',-130 C'+f(kx*hw*0.6)+',-100 '+f(kx*hw*0.7)+',-60 '+f(kx*hw*0.5)+',0 L'+f(kx*90)+',0 L'+f(kx*90)+',-130 Z" fill="'+c.hair2+'" opacity=".6"/></g>'+
    '<path d="M'+f(-w*0.45)+',-96 C'+f(-w*0.4)+',-70 '+f(-w*0.42)+',-48 '+f(-w*0.5)+',-30 M'+f(w*0.05)+',-104 C'+f(w*0.1)+',-76 '+f(w*0.08)+',-50 '+f(w*0.02)+',-24" fill="none" stroke="'+c.hair3+'" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>';
  return o};
P.skull=function(S){var w=S.hwid,v=S.v,T=-120,ch=v.ch,jw=v.jw,cw=1+(jw-1)*2.2,a=w*jw;
  return 'M0,'+f(T)+' C'+f(w*0.62)+','+f(T)+' '+f(w)+','+f(-96)+' '+f(w)+',-60 C'+f(a)+','+f(-30+ch*0.4)+' '+f(a*0.68)+','+f(-4+ch*0.8)+' '+f(w*0.22*cw)+','+f(6+ch)+' Q0,'+f(10+ch)+' '+f(-w*0.22*cw)+','+f(6+ch)+' C'+f(-a*0.68)+','+f(-4+ch*0.8)+' '+f(-a)+','+f(-30+ch*0.4)+' '+f(-w)+',-60 C'+f(-w)+','+f(-96)+' '+f(-w*0.62)+','+f(T)+' 0,'+f(T)+' Z'};
P.head=function(S){var c=S.c,u=S.uid,sk=P.skull(S),o='';
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs>';
  o+='<path d="'+sk+'" fill="'+c.skin+'"/>';
  var kx=S.key<0?-1:1;
  o+='<g clip-path="url(#'+u+'hc)"><path d="M'+f(kx*S.hwid*0.15)+',-124 C'+f(kx*S.hwid*0.85)+',-100 '+f(kx*S.hwid*0.95)+',-50 '+f(kx*S.hwid*0.55)+',-12 L'+f(kx*S.hwid*0.2)+',12 L'+f(kx*80)+',12 L'+f(kx*80)+',-124 Z" fill="'+c.skin2+'" opacity=".8"/>';
  o+='<ellipse cx="'+f(S.fx-S.hwid*0.46)+'" cy="-30" rx="9" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/><ellipse cx="'+f(S.fx+S.hwid*0.46)+'" cy="-30" rx="9" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/>';
  o+='</g>';
  return o};
P.ear=function(S,side){var c=S.c;return '<path d="M0,-17 C'+f(side*13)+',-18 '+f(side*15)+',-4 '+f(side*12)+',6 C'+f(side*9)+',15 '+f(side*3)+',18 0,15 Z" fill="'+c.skin2+'"/><path d="M'+f(side*2)+',-10 C'+f(side*9)+',-11 '+f(side*10)+',-2 '+f(side*7)+',5 C'+f(side*5)+',9 '+f(side*3)+',9 '+f(side*2)+',6" fill="none" stroke="'+c.skinSh+'" stroke-width="3" stroke-linecap="round" opacity=".7"/>'};
P.nose=function(S){/* origin = (fx,-52) head frame. bridge top y=-17, bulb, tip bottom y=27 (head -25) */
  var c=S.c,u=S.uid,b=S.sg*S.as*12,nr=1-S.as*0.55,fr=1+S.as*0.25,L=S.sg>0?nr:fr,Rr=S.sg>0?fr:nr,kx=S.key<0?-1:1;
  var d='M-4,-17 C-5,-5 -6,3 '+f(-7*L+b*0.5)+',10 C'+f(-12.5*L+b)+',12 '+f(-13.5*L+b)+',23 '+f(-7*L+b)+',26 Q'+f(b)+',30 '+f(8*Rr+b)+',26 C'+f(13.5*Rr+b)+',23 '+f(12.5*Rr+b)+',12 '+f(7*Rr+b*0.5)+',10 C6,3 5,-5 4,-17 Z';
  var o='<defs><clipPath id="'+u+'nc"><path d="'+d+'"/></clipPath></defs>';
  o+='<path d="'+d+'" fill="'+c.nose+'"/>';
  o+='<g clip-path="url(#'+u+'nc)"><path d="M'+f(kx*1)+',-20 L'+f(kx*2.5+b*0.6)+',8 C'+f(kx*7+b)+',13 '+f(kx*7+b)+',21 '+f(kx*3+b)+',30 L'+f(kx*40)+',40 L'+f(kx*40)+',-20 Z" fill="'+c.noseSh+'" opacity=".75"/>'+
     '<path d="M'+f(-16+b)+',25 Q'+f(b)+',33 '+f(16+b)+',25 L'+f(16+b)+',34 L'+f(-16+b)+',34 Z" fill="'+c.noseSh+'" opacity=".6"/></g>';
  o+='<ellipse cx="'+f(b-4*kx)+'" cy="15" rx="3" ry="2.4" fill="'+c.noseHi+'" opacity=".55"/>';
  var nl=S.sg>0?1-S.as*1.2:1,nrr=S.sg<0?1-S.as*1.2:1;
  if(nl>0.15)o+='<ellipse cx="'+f(b-5*L)+'" cy="25" rx="'+f(2.2*nl)+'" ry="1.3" fill="'+c.nostril+'" opacity=".6"/>';
  if(nrr>0.15)o+='<ellipse cx="'+f(b+5*Rr)+'" cy="25" rx="'+f(2.2*nrr)+'" ry="1.3" fill="'+c.nostril+'" opacity=".6"/>';
  return o};
P.eye=function(S,side,k){/* side -1 = screen-left eye. Origin = eye centre. */
  var e=S.e,c=S.c,u=S.uid,o='',ow=cl(e.open,0,1.5)*(1-e.shut);
  var es=S.v.es,bg=nz(e.big,0),rx=12.6*es*(1+0.22*bg),ry=10*es*cl(ow,0.02,1.3)*(1+0.3*bg);
  if(ow<0.12||e.shut>0.6){
    var lw=e.shut>0.6;
    o+='<path d="M-11.5,-1 Q0,'+(lw?7:5)+' 11.5,-1" fill="none" stroke="'+c.lid+'" stroke-width="3" stroke-linecap="round"/>';
    if(lw)o+='<path d="M-8,3 L-10,8 M0,6 L0,11 M8,3 L10,8" stroke="'+c.lid+'" stroke-width="2" stroke-linecap="round"/>';
    return o}
  var gx=cl(S.gx,-1.3,1.3)*5.2*es,gy=cl(S.gy,-1.3,1.3)*3.6*es,pr=4.5*es*(1+0.12*bg)*e.pup*(1.05-0.1*Math.max(0,ow-1));
  o+='<defs><clipPath id="'+u+'e'+k+'"><ellipse cx="0" cy="0" rx="'+f(rx)+'" ry="'+f(ry)+'"/></clipPath></defs>';
  o+='<ellipse cx="0" cy="0" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="'+c.eyeW+'"/>';
  o+='<g clip-path="url(#'+u+'e'+k+')"><circle cx="'+f(gx)+'" cy="'+f(gy)+'" r="'+f(pr)+'" fill="'+c.pupil+'"/><circle cx="'+f(gx-1.4)+'" cy="'+f(gy-1.6)+'" r="1.3" fill="#fff" opacity=".9"/>';
  var lq=S.v.lid*(1-cl(nz(e.lk,0),0,1));if(lq>0){var ly=-ry+lq*2*ry;o+='<path d="M-16,'+f(-ry-4)+' L16,'+f(-ry-4)+' L16,'+f(ly)+' Q0,'+f(ly+3.5)+' -16,'+f(ly)+' Z" fill="'+c.skin2+'"/><path d="M-12.6,'+f(ly)+' Q0,'+f(ly+3.5)+' 12.6,'+f(ly)+'" fill="none" stroke="'+c.lid+'" stroke-width="2.4" stroke-linecap="round"/>'}
  o+='</g>';
  o+='<path d="M-12,-0.5 Q0,'+f(-ry*1.5-1)+' 12,-0.5" fill="none" stroke="'+c.lid+'" stroke-width="2.6" stroke-linecap="round"/>';
  return o};
P.brow=function(S,side,k){/* origin = brow centre; inner end up by tilt */
  var e=S.e,t=(side<0?e.btL:e.btR)*1.5*PI/180,Lh=S.v.bl,ix=-side*Lh*Math.cos(t),iy=-Lh*Math.sin(t),ox=side*Lh*Math.cos(t),oy=Lh*Math.sin(t);
  return '<path d="M'+f(ox)+','+f(oy)+' Q'+f((ix+ox)/2)+','+f((iy+oy)/2-2.5)+' '+f(ix)+','+f(iy)+'" fill="none" stroke="'+S.c.brow+'" stroke-width="'+S.v.bw+'" stroke-linecap="round"/>'};
/* ---- mouth system v2 (identical code in every rig; per-character styling = R.mouth). Expression channels: mw width, mc curve (+smile / -frown),
   ms lopsided (screen-right corner up), mo base open 0..1, mt upper-teeth strip 0..1, mg tongue 0..1, wob gritted-teeth grimace.
   State key st.mouth = mouth_open 0..1 (lip-sync amplitude) layered on the expression: eff = 1-(1-mo)*(1-mouth_open).
   Visemes: closed 0, small .3, mid .6, wide 1 (R.visemes). Opening height = eff * R.mouth.dk; jaw drops eff * R.mouth.jd. */
var M=R.mouth={y:-12,wk:15,dk:16,cu:4.5,bu:4,lw:3,jd:3,jc:11,chin:7,tmax:6,col:{teeth:"#f2ecdc",teethSh:"#cdc2aa",tongue:"#cf6a66",tongue2:"#a24a4b"}};
R.visemes={closed:0,small:0.3,mid:0.6,wide:1};
function effOf(S){return 1-(1-cl(nz(S.e.mo,0),0,1))*(1-cl(S.mouth,0,1))}
P.mouth=function(S){
  var e=S.e,c=S.c,K=M.col,mop=cl(S.mouth,0,1),eff=effOf(S),grit=nz(e.wob,0)>0.3,u=S.uid,
      W=M.wk*e.mw*(0.5+0.5*S.ca)*(1+0.1*eff),mc=cl(e.mc,-1,1),ms=nz(e.ms,0),
      yl=-mc*M.cu+ms*M.cu*0.5,yr=-mc*M.cu-ms*M.cu*1.5,ym=(yl+yr)/2,o='',lw=M.lw;
  if(grit)eff=Math.max(eff,0.22);
  if(eff<0.06)return '<path d="M'+f(-W)+','+f(yl)+' Q0,'+f(ym+2*mc*M.bu)+' '+f(W)+','+f(yr)+'" fill="none" stroke="'+c.mouth+'" stroke-width="'+lw+'" stroke-linecap="round"/>';
  var D=eff*M.dk,midU=ym+mc*M.bu*0.5*(1-eff),cU=2*midU-ym,jd=eff*M.jd,yb=M.chin+S.v.ch-M.y,
      tA=Math.max(grit?1:0,nz(e.mt,0),0.9*cl((mop-0.45)/0.3,0,1)),gA=Math.max(nz(e.mg,0),0.9*cl((mop-0.55)/0.35,0,1));
  /* jaw drop: skin patch under the chin */
  if(jd>0.5)o+='<path d="M'+f(-M.jc)+','+f(yb-8)+' C'+f(-M.jc*0.8)+','+f(yb-8+(jd+8)/0.75)+' '+f(M.jc*0.8)+','+f(yb-8+(jd+8)/0.75)+' '+f(M.jc)+','+f(yb-8)+' Z" fill="'+c.skin+'"/>';
  var up='M'+f(-W)+','+f(yl)+' Q0,'+f(cU)+' '+f(W)+','+f(yr),
      d=up+' C'+f(W*0.92)+','+f(yr+D*1.3)+' '+f(-W*0.92)+','+f(yl+D*1.3)+' '+f(-W)+','+f(yl)+' Z';
  o+='<defs><clipPath id="'+u+'mc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.mouthIn+'" stroke="'+c.mouth+'" stroke-width="'+f(lw*0.85)+'" stroke-linejoin="round"/>';
  o+='<g clip-path="url(#'+u+'mc)">';
  if(gA>0.05&&D>6){o+='<ellipse cx="'+f(ms*-W*0.1)+'" cy="'+f(ym+D*0.95)+'" rx="'+f(W*0.52)+'" ry="'+f(D*0.42*gA)+'" fill="'+K.tongue+'"/><path d="M0,'+f(ym+D*0.95-D*0.3*gA)+' L0,'+f(ym+D*0.9)+'" stroke="'+K.tongue2+'" stroke-width="1.6" stroke-linecap="round"/>'}
  if(tA>0.05){var th=Math.min(D*0.95,M.tmax)*Math.min(1,tA)+(grit?D:0),i,x,t,yy;
    o+='<path d="M'+f(-W-3)+','+f(yl-4)+' Q0,'+f(cU-4)+' '+f(W+3)+','+f(yr-4)+' L'+f(W+3)+','+f(yr+th)+' Q0,'+f(cU+th)+' '+f(-W-3)+','+f(yl+th)+' Z" fill="'+K.teeth+'"/>';
    for(i=-2;i<=2;i++){x=i*W*0.3;t=(x+W)/(2*W);yy=(1-t)*(1-t)*yl+2*t*(1-t)*cU+t*t*yr;
      o+='<path d="M'+f(x)+','+f(yy)+' L'+f(x)+','+f(yy+th)+'" stroke="'+K.teethSh+'" stroke-width="1.3"/>'}
    if(grit)o+='<path d="M'+f(-W)+','+f(yl+D*0.5)+' Q0,'+f(cU+D*0.5)+' '+f(W)+','+f(yr+D*0.5)+'" fill="none" stroke="'+K.teethSh+'" stroke-width="1.6"/>';
    o+='<path d="M'+f(-W)+','+f(yl+th)+' Q0,'+f(cU+th)+' '+f(W)+','+f(yr+th)+'" fill="none" stroke="'+K.teethSh+'" stroke-width="1" opacity=".7"/>'}
  return o+'</g>'};
P.face=function(S,only){/* eyes + lids + brows + mouth layer; origin = head frame. only: 'eyes' (eyes+brows) | 'mouth' | undefined (both) */
  var e=S.e,o='',sep=S.sep,fx=S.fx,ey=S.eyeY+S.pitch,i,sd,cx,sxs,lead;
  for(i=0;i<2;i++){sd=i?1:-1;lead=(sd===S.sg&&S.as>0.15);
    sxs=lead?1:Math.max(0.05,S.ca*1.05-0.05);if(!lead&&S.as<0.15)sxs=1;
    if(!lead&&S.ca<0.22)continue;
    cx=fx+sd*sep*(lead?1:Math.max(0.5,S.ca));
    if(S.v.bags>0)o+='<g transform="translate('+f(cx)+','+f(ey+13)+') scale('+f(sxs)+',1)"><path d="M-14,-1 Q0,'+f(9+S.v.bags*4)+' 14,-1 Q0,'+f(4+S.v.bags*1.5)+' -14,-1 Z" fill="#b4877b" opacity="'+f(0.3+S.v.bags*0.22)+'"/></g>';
    o+='<g transform="translate('+f(cx)+','+f(ey)+') scale('+f(sxs)+',1)">'+P.eye(S,sd,i)+'</g>';
    var by=ey-24+S.v.bdy+e.by+(sd<0?e.bdL:e.bdR);
    o+='<g transform="translate('+f(cx)+','+f(by)+') scale('+f(Math.max(0.3,sxs))+',1)">'+P.brow(S,sd,i)+'</g>';
  }
  if(nz(e.sweat,0)!==0&&only!=='mouth'){var tx=S.hwid*(e.sweat<0?-0.8:0.86);o+='<g transform="translate('+f(fx+tx)+','+f(ey+(e.sweat<0?-3:-26))+') scale(1.15)"><path d="M0,-9 C6,-1 7,5 0,8 C-7,5 -6,-1 0,-9Z" fill="#bfe3f4"/><path d="M-1.6,-3 C-3.4,0 -3.4,3 -2.2,4" stroke="#fff" stroke-width="1.3" fill="none" opacity=".85" stroke-linecap="round"/></g>'}
  if(only==='mouth')o='';
  if(only!=='eyes')o+='<g transform="translate('+f(fx*1.02)+','+f(M.y+S.v.my+S.pitch)+')">'+P.mouth(S)+'</g>';
  return o};
P.neck=function(S){var c=S.c,tx=S.tx;/* slim neck, from inside the head (y-50) down into the collar (y8) */
  return '<path d="M'+f(tx-13)+',-50 L'+f(tx+13)+',-50 L'+f(tx+15)+',2 Q'+f(tx)+',9 '+f(tx-15)+',2 Z" fill="'+c.skin2+'"/><path d="M'+f(tx-14)+',-34 L'+f(tx+14)+',-34 L'+f(tx+14)+',-22 Q'+f(tx)+',-10 '+f(tx-14)+',-22 Z" fill="'+c.skinSh+'" opacity=".75"/>'};
P.collar=function(S){var tx=S.tx;return '<path d="M'+f(tx-24)+',1 A24,10 0 0 0 '+f(tx+24)+',1" fill="none" stroke="'+S.c.sweater2+'" stroke-width="7" stroke-linecap="round"/>'};
P.torso=function(S){var c=S.c,sw=S.sw,tx=S.tx,u=S.uid,sh=S.shr,hy=S.dim.hemY;/* sweater body: slim, straight, ribbed hem and crew collar */
  var d='M'+f(tx-22)+',-5 C'+f(tx-38)+',-3 '+f(tx-sw+10)+','+f(8-sh)+' '+f(tx-sw)+','+f(26-sh)+' C'+f(tx-sw-2)+',90 '+f(tx-sw+4)+',190 '+f(tx-sw+4)+','+hy+' Q'+f(tx)+','+(hy+5)+' '+f(tx+sw-4)+','+hy+' C'+f(tx+sw-4)+',190 '+f(tx+sw+2)+',90 '+f(tx+sw)+','+f(26-sh)+' C'+f(tx+sw-10)+','+f(8-sh)+' '+f(tx+38)+',-3 '+f(tx+22)+',-5 Q'+f(tx)+',9 '+f(tx-22)+',-5 Z';
  S.torsoPath=d;
  var kx=S.key<0?-1:1,o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.sweater+'"/>';
  o+='<g clip-path="url(#'+u+'tc)"><path d="M'+f(tx+kx*sw*0.18)+',-6 C'+f(tx+kx*sw*0.5)+',60 '+f(tx+kx*sw*0.3)+',200 '+f(tx+kx*sw*0.35)+',292 L'+f(tx+kx*90)+',292 L'+f(tx+kx*90)+',-6 Z" fill="'+c.sweater2+'" opacity=".5"/>';
  var x;for(x=-sw+10;x<=sw-10;x+=10)o+='<path d="M'+f(tx+x)+',40 L'+f(tx+x*1.02)+','+(hy-22)+'" stroke="'+c.sweater2+'" stroke-width="1.6" opacity=".35"/>';
  o+='<path d="M'+f(tx-90)+','+(hy-19)+' Q'+f(tx)+','+(hy-14)+' '+f(tx+90)+','+(hy-19)+' L'+f(tx+90)+','+(hy+12)+' L'+f(tx-90)+','+(hy+12)+' Z" fill="'+c.sweater2+'" opacity=".85"/>';
  o+='<path d="M'+f(tx-90)+','+(hy-9)+' Q'+f(tx)+','+(hy-4)+' '+f(tx+90)+','+(hy-9)+'" stroke="'+c.sweaterHi+'" stroke-width="1.5" fill="none" opacity=".5"/></g>';
  o+='<ellipse cx="'+f(tx)+'" cy="2" rx="24" ry="10" fill="'+c.collarIn+'"/><ellipse cx="'+f(tx)+'" cy="2" rx="24" ry="10" fill="none" stroke="'+c.sweater2+'" stroke-width="7"/>';
  return o};
P.lanyard=function(S){var c=S.c,tx=S.tx,py=S.dim.lanY;
  return '<path d="M'+f(tx-22)+',-1 L'+f(tx+2)+','+f(py)+' M'+f(tx+22)+',-1 L'+f(tx+2)+','+f(py)+'" fill="none" stroke="'+c.lan+'" stroke-width="4.6" stroke-linecap="round"/>'};
P.badge=function(S){var c=S.c;/* origin = lanyard junction; ticket-number card */
  return '<path d="M0,0 L0,13" stroke="'+c.lan+'" stroke-width="3.6"/><rect x="-5" y="9" width="10" height="6" rx="2" fill="'+c.badgeInk+'"/>'+
    '<rect x="-15" y="14" width="30" height="42" rx="4" fill="'+c.badge+'"/><rect x="-15" y="14" width="30" height="10" rx="4" fill="'+c.badge2+'"/><rect x="-15" y="19" width="30" height="5" fill="'+c.badge2+'"/>'+
    '<circle cx="-5.5" cy="35" r="4" fill="none" stroke="'+c.badgeInk+'" stroke-width="1.8"/><path d="M-3,37.5 L0,40 M3,40 L7,30 L11,40 M4.6,36.5 L9.4,36.5" fill="none" stroke="'+c.badgeInk+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M-10,46 h20 M-10,51 h13" stroke="'+c.badgeInk+'" stroke-width="2" stroke-linecap="round" opacity=".5"/>'};
P.sleeveL=function(len,w0,w1){return 'M'+f(-w0)+',6 Q'+f(-w0)+',-14 0,-14 Q'+f(w0)+',-14 '+f(w0)+',6 L'+f(w1)+','+f(len)+' Q0,'+f(len+5)+' '+f(-w1)+','+f(len)+' Z'};
P.upper_arm=function(S){var c=S.c;return '<path d="'+cap(S.dim.UA,20,17)+'" fill="'+c.skin+'"/><path d="'+P.sleeveL(S.dim.UA+4,16,14.5)+'" fill="'+c.sweater+'"/><path d="M-12,'+f(S.dim.UA-12)+' Q0,'+f(S.dim.UA-6)+' 12,'+f(S.dim.UA-12)+'" fill="none" stroke="'+c.sweater2+'" stroke-width="3" opacity=".55"/>'};
P.forearm=function(S){var c=S.c,F=S.dim.FA,s=F-10;/* knit sleeve to the wrist with a ribbed cuff */
  return '<path d="'+cap(F,17,13)+'" fill="'+c.skin+'"/><path d="M-14.5,-8 L14.5,-8 L12.5,'+f(s)+' L-12.5,'+f(s)+' Z" fill="'+c.sweater+'"/><rect x="-13.5" y="'+f(s-2)+'" width="27" height="11" rx="3.5" fill="'+c.sweater2+'"/><path d="M-13,'+f(s+3)+' L13,'+f(s+3)+' M-13,'+f(s+6)+' L13,'+f(s+6)+'" stroke="'+c.sweaterHi+'" stroke-width="1.2" opacity=".5"/>'};
P.hand=function(S,sd,kind){/* 1.x patch: palm ~1.27x wrist + 4 separate fingers + thumb, one flat shadow. fingers toward +y; wrist at origin. sd=+1: thumb (and index) on +x. kind "point": index finger out */
  var c=S.c,pt=kind==="point",L=pt?[14,9,9,44]:[17,21,24,22],X=[-6.9,-2.3,2.3,6.9],A=[4,1.4,-1.4,-4],o='',i;
  for(i=0;i<4;i++)o+='<g transform="rotate('+A[i]+' '+X[i]+' 20)"><path d="M'+f(X[i]-2.4)+',20 L'+f(X[i]-2.2)+','+f(20+L[i]-2.2)+' A2.2,2.2 0 0 0 '+f(X[i]+2.2)+','+f(20+L[i]-2.2)+' L'+f(X[i]+2.4)+',20 Z" fill="'+c.skin+'"/></g>';
  o+='<path d="M-8,-3 L8,-3 C10.4,6 10.6,15 9.6,24 L-9.6,24 C-10.6,15 -10.4,6 -8,-3 Z" fill="'+c.skin+'"/>';
  return o+'<g transform="scale('+sd+',1)"><g transform="translate(7.5,6) rotate(-32)"><path d="M-2.9,-3 L-2.7,15.6 A2.8,2.8 0 0 0 2.9,15.6 L3.2,-3 Z" fill="'+c.skin+'"/></g><path d="M9.4,5 C5,7 3.6,14 4.6,24 L9.6,24 C10.4,16 10.4,10 9.4,5 Z" fill="'+c.skin2+'"/></g>'};
P.handset=function(S){var c=S.c;/* origin = grip centre; earpiece up (-y), mouthpiece down */
  return '<path d="M-12,-72 Q0,-80 12,-72 L13,-52 Q0,-44 -13,-52 Z" fill="'+c.handset+'"/><path d="M-12,72 Q0,80 12,72 L13,52 Q0,44 -13,52 Z" fill="'+c.handset+'"/><rect x="-8" y="-56" width="16" height="112" rx="7" fill="'+c.handset2+'"/><rect x="-3" y="-50" width="3" height="96" rx="1.5" fill="#ffffff" opacity=".12"/>'};
P.prop_notebook=function(S){var c=S.c;/* habitual prop: spiral notebook, origin = grip centre, upright. Detachable: drawn only when st.prop.on */
  var o='<rect x="-24" y="-34" width="48" height="68" rx="3.5" fill="'+c.notebook+'"/><rect x="-24" y="-34" width="7" height="68" rx="3" fill="'+c.notebook2+'"/><rect x="14" y="-34" width="5" height="76" fill="'+c.bookmark+'" opacity="0"/><path d="M12,-34 L18,-34 L18,42 L15,38 L12,42 Z" fill="'+c.bookmark+'"/><rect x="-10" y="-16" width="24" height="14" rx="2" fill="'+c.paper+'"/><path d="M-6,-10 h16" stroke="'+c.notebook+'" stroke-width="1.6" opacity=".5"/>',i;
  for(i=0;i<7;i++)o+='<circle cx="-21" cy="'+f(-27+i*9.4)+'" r="2.4" fill="'+c.spiral+'"/>';
  return o};
P.upper_leg=function(S,L){L=L||S.dim.UL;var c=S.c;/* thigh: hip at origin, knee at (0,L); tapers 38 -> 30 */
  return '<path d="M-19,-8 C-20,'+f(L*0.3)+' -17,'+f(L*0.72)+' -14.5,'+f(L+4)+' Q0,'+f(L+10)+' 14.5,'+f(L+4)+' C17,'+f(L*0.72)+' 20,'+f(L*0.3)+' 19,-8 Z" fill="'+c.pants+'"/>'+
    '<path d="M-5,'+f(L-13)+' Q1,'+f(L-6)+' 8,'+f(L-12)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>'};
P.lower_leg=function(S,L){L=L||S.dim.LL;var c=S.c,hb=L-15;/* shin: knee at origin, ankle at (0,L). hem ends 11 above the ankle pivot so it breaks over the shoe collar */
  return '<path d="M-14.5,-6 C-16,'+f(L*0.26)+' -14,'+f(L*0.6)+' -12,'+f(hb-14)+' C-13,'+f(hb-6)+' -16,'+f(hb-3)+' -16.5,'+f(hb+1)+' Q0,'+f(hb+8)+' 16.5,'+f(hb+1)+' C16,'+f(hb-3)+' 13,'+f(hb-6)+' 12,'+f(hb-14)+' C14,'+f(L*0.6)+' 16,'+f(L*0.26)+' 14.5,-6 Z" fill="'+c.pants+'"/>'+
    '<path d="M-14,'+f(hb-9)+' Q0,'+f(hb-3)+' 14,'+f(hb-9)+'" fill="none" stroke="'+c.pants2+'" stroke-width="3" opacity=".75" stroke-linecap="round"/>'+
    '<path d="M-15,'+f(hb+3)+' Q0,'+f(hb+10)+' 15,'+f(hb+3)+' L15,'+f(hb+0)+' Q0,'+f(hb+7)+' -15,'+f(hb+0)+' Z" fill="'+c.pants2+'" opacity=".55"/>'};
P.pelvis=function(S,hs){var c=S.c,w=hs+21;/* plain trouser seat + belt line; hipY at origin; smooth crotch arc, no notch */
  return '<path d="M'+f(-w)+',-16 L'+f(w)+',-16 C'+f(w+1)+',6 '+f(w-1)+',20 '+f(w-6)+',34 Q0,52 '+f(-w+6)+',34 C'+f(-w+1)+',20 '+f(-w-1)+',6 '+f(-w)+',-16 Z" fill="'+c.pants+'"/>'+
    '<path d="M'+f(-w+1)+',9 Q0,13 '+f(w-1)+',9 L'+f(w-1)+',15 Q0,19 '+f(-w+1)+',15 Z" fill="'+c.pants2+'"/><rect x="-6" y="9.5" width="12" height="8" rx="2" fill="#8a8f9b" opacity=".85"/><rect x="-3" y="12" width="6" height="3.5" rx="1" fill="'+c.pants2+'"/>'};
P.foot=function(S){var c=S.c;/* sneaker, ankle pivot at origin; drawn toe toward +x; pose.legs.fl/fr flip it: fl:-1,fr:1 = toes OUT (default); sole bottom y=20. 61 wide, 37 tall */
  var o='';
  o+='<path d="M-20,19 C-6,22 20,22 34,17 C38,15 41,12 42,9 L36,12 C24,17 0,18 -20,16 Z" fill="'+c.shoe2+'"/>';
  o+='<path d="M-25,11 C-27,17 -24,21 -17,21 L22,21 C31,21 38,17 43,8 L40,7 C34,13 26,15 18,15 L-20,15 C-23,15 -25,13 -25,11 Z" fill="'+c.sole+'"/>';
  o+='<path d="M-24,13 C-27,3 -26,-9 -19,-15 C-14,-18 -6,-18 -1,-16 L6,-12 C14,-7 21,-5 30,-5 C39,-4 44,3 42,9 C41,13 35,15 26,15 L-20,15 C-22,15 -24,14 -24,13 Z" fill="'+c.shoe+'"/>';
  o+='<path d="M-24,9 C-10,11 15,11 41,8 C41,11 37,14 30,15 L-20,15 C-23,15 -24,12 -24,9 Z" fill="'+c.shoe2+'" opacity=".45"/>';
  o+='<path d="M21,-4 C30,-5 39,-1 42,5 C44,10 40,14 32,15 L24,15 C20,9 19,2 21,-4 Z" fill="'+c.toeCap+'"/><path d="M21,-4 C19,2 20,9 24,15" fill="none" stroke="'+c.shoe2+'" stroke-width="1.5" stroke-linecap="round"/>';
  o+='<path d="M-24,11 C-27,3 -26,-9 -19,-15 L-16,-16 C-19,-6 -19,3 -17,11 Z" fill="'+c.shoeAcc+'"/><path d="M-19,0 C-12,2 -6,4 2,4" fill="none" stroke="'+c.shoe2+'" stroke-width="1.5" stroke-linecap="round"/>';
  o+='<path d="M-18,-14 C-13,-19 -5,-19 1,-15 C-4,-12 -12,-11 -18,-14 Z" fill="'+c.shoeIn+'"/>';
  o+='<path d="M4,-12 C6,-24 13,-28 19,-25 C21,-19 19,-12 16,-7 L6,-8 Z" fill="'+c.sole+'"/><path d="M7,-17 C10,-24 14,-26 18,-24" fill="none" stroke="'+c.shoe2+'" stroke-width="1.4" stroke-linecap="round"/>';
  o+='<path d="M0,-11 C8,-8 14,-5 21,-2 L19,2 C12,0 5,-3 -2,-6 Z" fill="'+c.shoe2+'" opacity=".55"/>';
  var k;for(k=0;k<3;k++){var x=2+k*6.5,y=-9+k*2.6;o+='<path d="M'+f(x-2.5)+','+f(y+4)+' L'+f(x+3)+','+f(y-2.5)+'" stroke="'+c.shoeAcc+'" stroke-width="2.4" stroke-linecap="round"/>'}
  return o};

/* ------------------------------------------------------------------ assembler */
function sh(S,m,soft){return '<g filter="url(#'+S.uid+(soft?'s2':'s1')+')">'+m+'</g>'}
function state(st,ch){
  var D=R.dim,c=R.pal,p=st.pose,e=st.expr,u=st.uid,t=st.t||0,gz=st.gaze||{x:0,y:0,cam:0},hd=p.head;
  var back=!!(p.back||hd.back),yaw=back?0:cl(hd.yaw||0,-1,1),a=yaw*PI/2,ca=Math.cos(a),sa=Math.sin(a),sg=yaw<0?-1:1,as=Math.abs(sa);
  var S={v:mv(st.v),c:c,dim:D,uid:u,e:e,p:p,ca:ca,sa:sa,sg:sg,as:as,key:st.key||1,mouth:st.mouth||0,tufts:R.tufts,t:t,back:back};
  S.hwid=D.hw*S.v.hw*(0.88+0.12*ca);S.sep=D.sep*(0.45+0.55*ca);S.fx=sa*S.hwid*0.62;S.eyeY=D.eyeY;
  S.gx=cl((gz.cam?-sa*0.85:gz.x)+nz(e.gx,0),-1.4,1.4);S.gy=cl((gz.cam?0:gz.y)+nz(e.gy,0),-1.4,1.4);S.pitch=S.gy*2.2;
  var tc=Math.cos((p.turn||0)*PI/2);S.sw=D.sw*(0.42+0.58*tc);S.tx=(p.turn||0)*14;S.shr=nz(p.sh,0);
  return S}
function drawStas(st,ch){
  var S=state(st,ch),D=S.dim,c=S.c,p=S.p,u=S.uid,t=S.t,shk=st.shake||{x:0,y:0,r:0},o='',i;
  var pr=st.prop&&st.prop.on?st.prop:null,prH=pr?(pr.hand==="L"?"L":"R"):"R";
  var lean=nz(p.lean,0),sgf=(p.head.yaw||p.turn)<0?-1:1;
  var rotU=lean*5*sgf+shk.r,l16=lean*16,scU=1+lean*0.055;
  o+='<defs><filter id="'+u+'s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="'+c.shadow+'" flood-opacity=".38"/></filter>'+
     '<filter id="'+u+'s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="'+c.shadow+'" flood-opacity=".34"/></filter></defs>';
  o+='<g transform="translate('+f(shk.x)+','+f(shk.y)+')">';
  /* ---- legs (not leaned) ---- */
  if(st.stand){
    var lg=p.legs||{},hs=nz(lg.spread,24),asp=nz(lg.ank,40),kin=nz(lg.kin,2),kk=nz(lg.k,0),fsh=nz(lg.fsh,1),fs=nz(lg.fs,1),fr0=D.UL/(D.UL+D.LL);
    o+='<defs><filter id="'+u+'cb" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><filter id="'+u+'cb2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>';
    [-1,1].forEach(function(sd){var fd=sd<0?nz(lg.fl,1):nz(lg.fr,-1),gx=sd*asp+fd*5,gy=D.ankleY+20*fs;
      o+='<ellipse cx="'+f(gx+fd*3)+'" cy="'+f(gy+2)+'" rx="'+f(44*fs)+'" ry="8" fill="'+c.shadow+'" opacity=".55" filter="url(#'+u+'cb)"/>';
      o+='<ellipse cx="'+f(gx+fd*2)+'" cy="'+f(gy-0.5)+'" rx="'+f(31*fs)+'" ry="3.6" fill="'+c.shadow+'" opacity=".7" filter="url(#'+u+'cb2)"/>'});
    o+=sh(S,'<g transform="translate(0,'+D.hipY+')">'+P.pelvis(S,hs)+'</g>',1);
    [-1,1].forEach(function(sd){
      var hip=[sd*hs,D.hipY],an=[sd*asp,D.ankleY-kk],kn=[hip[0]+(an[0]-hip[0])*fr0-sd*(kin+kk*0.8),hip[1]+(an[1]-hip[1])*fr0-kk*0.4];
      var L1=Math.hypot(kn[0]-hip[0],kn[1]-hip[1]),L2=Math.hypot(an[0]-kn[0],an[1]-kn[1]);
      var fd=sd<0?nz(lg.fl,1):nz(lg.fr,-1);
      var q34=sd<0?nz(lg.q34L,0.9):nz(lg.q34R,0.8),rt=sd<0?nz(lg.rotL,-11):nz(lg.rotR,12);
      o+=sh(S,'<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rt)+') scale('+f(fd*fsh*fs*q34)+','+f(fs)+')">'+P.foot(S)+'</g>',1);
      o+=sh(S,'<g transform="'+tr(kn[0],kn[1],ang(kn,an))+'">'+P.lower_leg(S,L2)+'</g>',1);
      o+=sh(S,'<g transform="'+tr(hip[0],hip[1],ang(hip,kn))+'">'+P.upper_leg(S,L1)+'</g>',1);
    });
  }
  /* ---- upper body ---- */
  o+='<g transform="translate(0,'+D.hipY+') rotate('+f(rotU)+') translate(0,-'+D.hipY+') translate(0,'+f(l16)+') scale('+f(scU)+')">';
  var tx=S.tx,shy=D.shY-S.shr,SL=[tx-S.sw+12,shy],SR=[tx+S.sw-12,shy],arms=[];
  o+=sh(S,P.torso(S),0)+sh(S,P.neck(S),1)+P.collar(S);
  /* lanyard + swinging badge */
  var sw_=7*Math.sin(2*PI*0.62*t+R.seed)+4*Math.sin(2*PI*1.3*t+R.seed*2)-lean*14+shk.r*1.4+(p.turn||0)*-10;
  var lx=tx+2,ly=D.lanY;
  if(!S.back)o+=P.lanyard(S);
  else o+='<path d="M'+f(S.tx-21)+',1 Q'+f(S.tx)+',-9 '+f(S.tx+21)+',1" fill="none" stroke="'+c.lan+'" stroke-width="5" stroke-linecap="round"/>';/* back view: strap across the nape */
  /* prop, side mode: tucked against the hip, drawn before the arms */
  if(pr&&pr.at==="side"){var ps=prH==="L"?-1:1;
    o+=sh(S,'<g transform="'+tr(tx+ps*34,162,ps*6)+'">'+P.prop_notebook(S)+'</g>',1)}
  var fid=nz(p.fid,0);
  [["L",SL,-1],["R",SR,1]].forEach(function(A){
    var nm=A[0],sp=p[nm]||{},Sh=A[1],sd=A[2],h=(sp.h||[sd*58,230]).slice();
    if(fid&&nm==="R"){h[0]+=fid*3*Math.sin(t*5.3+1);h[1]+=fid*2*Math.cos(t*4.1)}
    var r=ik(Sh,h,D.UA,D.FA,nz(sp.bend,sd*-1)),el=r.e,H=r.h;
    arms.push({nm:nm,Sh:Sh,el:el,H:H,sp:sp,sd:sd});
  });
  if(!S.back)o+=sh(S,'<g transform="translate('+f(lx)+','+f(ly)+') rotate('+f(sw_)+')">'+P.badge(S)+'</g>',1);
  arms.forEach(function(A){
    o+=sh(S,'<g transform="'+tr(A.Sh[0],A.Sh[1],ang(A.Sh,A.el))+'">'+P.upper_arm(S)+'</g>',1);
    o+=sh(S,'<g transform="'+tr(A.el[0],A.el[1],ang(A.el,A.H))+'">'+P.forearm(S)+'</g>',1);
  });
  /* head */
  var hdx=nz(p.head.dx,0),hdy=nz(p.head.dy,0),tilt=nz(p.head.tilt,0),hp=[hdx,D.neckY+hdy];
  var hg='';
  /* crown strand roots anchored to the CURRENT skull: x foreshortened with the yawed head width, shifted with the cap (fx*0.3),
     clamped to the crown. Yaw 0 = the seeded rest roots exactly. */
  var tk=S.hwid/(D.hw*S.v.hw)*(0.8+0.2*S.ca),tsh=S.fx*0.3,tlim=S.hwid*0.6;
  for(i=0;i<R.tufts.length;i++){var T=R.tufts[i],sway=-tilt*0.4*T.k+2*Math.sin(2*PI*0.5*t+i*1.7+R.seed)+shk.r*-1;
    hg+='<g transform="'+tr(cl(T.x*tk,-tlim,tlim)+tsh,T.y,sway)+'">'+P.tuft(S,i)+'</g>'}
  var hair=sh(S,hg,1);
  var earS='',earF='',turned=S.as>0.15;
  S.earX=function(sd){return turned?(sd===S.sg?sd*S.hwid:sd*S.hwid*Math.max(0.55,S.ca)*0.98):sd*(S.hwid+1)};
  [-1,1].forEach(function(sd){if(turned&&sd===S.sg&&S.as>0.3)return;
    var m='<g transform="translate('+f(S.earX(sd))+',-58) scale('+S.v.earS+')">'+P.ear(S,sd)+'</g>';
    if(turned&&sd!==S.sg)earF+=m;else earS+=m});
  if(S.back){o+='<g transform="'+tr(hp[0],hp[1],tilt)+'">'+hair+sh(S,P.head_back(S),1)+'</g>'}
  else{
  var headM=sh(S,earS,1)+sh(S,P.head(S),1)+(earF?sh(S,earF,1):'');
  var nose='<g transform="translate('+f(S.fx)+','+f(-52+S.pitch)+')"><g transform="translate(0,-17) scale('+S.v.nx+','+S.v.ny+') translate(0,17)">'+sh(S,P.nose(S),1)+'</g></g>';
  var face='<g clip-path="url(#'+u+'hc)">'+P.face(S,'eyes')+'</g>'+P.face(S,'mouth');/* eyes/brows clipped to the skull (yaw >= 45 pushed the lead brow out past the head); mouth unclipped, its jaw drop extends below the chin */
  /* hair cap follows yaw by fx*0.3 but is clipped (unshifted wrapper, inside the shadow) to skull + rest cap silhouette, so it never overhangs the head */
  var hk='<defs><clipPath id="'+u+'hk"><path d="'+P.skull(S)+'"/><path d="'+P.capD(S)+'"/></clipPath></defs>';
  var hc=sh(S,hk+'<g clip-path="url(#'+u+'hk)"><g transform="translate('+f(S.fx*0.3)+',0)">'+P.hair(S)+'</g></g>',1);
  var fr=sh(S,'<g clip-path="url(#'+u+'hk)">'+P.fringe(S)+'</g>',1);/* fringe clipped to the same skull + rest-cap envelope */
  o+='<g transform="'+tr(hp[0],hp[1],tilt)+'">'+hair+headM+nose+face+hc+fr+'</g>';}
  /* held receiver (drawn above head), then hands */
  arms.forEach(function(A){
    var sp=A.sp,rc=nz(sp.rcv,0);
    if(rc>0.02){var rr=nz(sp.rr,0),fdx=A.H[0]-A.el[0],fdy=A.H[1]-A.el[1],fl_=Math.sqrt(fdx*fdx+fdy*fdy)||1,hx=A.H[0]+fdx/fl_*24,hy=A.H[1]+fdy/fl_*24;
      var hc2=[hx,hy];
      if(st.tether){var tw=st.tether,bx=hc2[0]-Math.sin(rr*PI/180)*70,by2=hc2[1]+Math.cos(rr*PI/180)*70;
        var ex_=tw.x,ey_=tw.y,sag=tw.sag==null?70:tw.sag,mx=(bx+ex_)/2,my=(by2+ey_)/2+sag;
        o+='<g filter="url(#'+u+'s2)"><path d="M'+f(bx)+','+f(by2)+' C'+f(bx+(mx-bx)*0.3)+','+f(by2+sag*0.85)+' '+f(ex_+(mx-ex_)*0.3)+','+f(ey_+sag*0.6)+' '+f(ex_)+','+f(ey_)+'" fill="none" stroke="'+(tw.c||c.handset)+'" stroke-width="'+(tw.w||5)+'" stroke-linecap="round" opacity="'+f(rc)+'"/></g>'}
      o+=sh(S,'<g opacity="'+f(rc)+'" transform="'+tr(hx,hy,rr)+'">'+P.handset(S)+'</g>',1)}
    /* prop, hand mode: upright at the palm of the chosen hand, the hand is drawn over it */
    if(pr&&pr.at!=="side"&&A.nm===prH){var fdx2=A.H[0]-A.el[0],fdy2=A.H[1]-A.el[1],fl2=Math.sqrt(fdx2*fdx2+fdy2*fdy2)||1;
      o+=sh(S,'<g transform="'+tr(A.H[0]+fdx2/fl2*22,A.H[1]+fdy2/fl2*22,nz(sp.pr,0))+'">'+P.prop_notebook(S)+'</g>',1)}
  });
  arms.forEach(function(A){var sp=A.sp,s=nz(sp.s,1);
    o+=sh(S,'<g transform="'+tr(A.H[0],A.H[1],ang(A.el,A.H)+nz(sp.rot,0),s)+'">'+P.hand(S,A.sd>0?-1:1,sp.hand)+'</g>',1);
  });
  /* rim light (cool key from the lit side) on head + torso */
  var rm=st.rim;
  if(rm&&rm.k>0.01){var rs=rm.side||S.sg,w=S.hwid;
    o+='<defs><linearGradient id="'+u+'rg" gradientUnits="userSpaceOnUse" x1="'+f(rs*w*1.05)+'" y1="0" x2="'+f(rs*w*0.2)+'" y2="0"><stop offset="0" stop-color="'+rm.color+'" stop-opacity="1"/><stop offset="1" stop-color="'+rm.color+'" stop-opacity="0"/></linearGradient>'+
       '<linearGradient id="'+u+'rt" gradientUnits="userSpaceOnUse" x1="'+f(tx+rs*S.sw)+'" y1="0" x2="'+f(tx+rs*S.sw*0.3)+'" y2="0"><stop offset="0" stop-color="'+rm.color+'" stop-opacity="1"/><stop offset="1" stop-color="'+rm.color+'" stop-opacity="0"/></linearGradient></defs>';
    o+='<g transform="'+tr(hp[0],hp[1],tilt)+'"><g clip-path="url(#'+u+'hc)" opacity="'+f(rm.k*0.9)+'"><path d="'+P.skull(S)+'" fill="none" stroke="url(#'+u+'rg)" stroke-width="16"/></g></g>';
    o+='<g clip-path="url(#'+u+'tc)" opacity="'+f(rm.k*0.8)+'"><path d="'+S.torsoPath+'" fill="none" stroke="url(#'+u+'rt)" stroke-width="22"/></g>';
  }
  o+='</g></g>';
  return o}
HF.RIGS.stas=drawStas;
/* seeded loose strands on the crown */
(function(){var H=HF.hash||function(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)},n=R.dim.tufts,T=[],i;
  for(i=0;i<n;i++){var u=(i+0.5)/n,x=-28+u*56+(H(R.seed*3.1+i)-0.5)*6;
    T.push({x:x,y:-122,h:6+H(R.seed*5.3+i)*5,w:6+H(R.seed*7.7+i)*3,lean:(x/30)*8+(H(R.seed*9.1+i)-0.5)*6,alt:H(R.seed*2.3+i)>0.5,k:0.6+H(R.seed*4.4+i)*0.8})}
  R.tufts=T})();
/* exploded-parts catalogue for the rig sheet: name, drawer, bbox [x0,y0,x1,y1] in part-local coords */
R.catalogue=function(st){
  var S=state(st),L=[];
  S.sg=1;S.as=0;
  L.push({n:"loose strands x5",bb:[-40,-30,40,6],d:function(){var s='';for(var i=0;i<5;i++)s+='<g transform="translate('+f((i-2)*16)+',0)">'+P.tuft(S,i)+'</g>';return s}});
  L.push({n:"hair cap",bb:[-64,-132,64,-26],d:function(){return P.hair(S)}});
  L.push({n:"fringe",bb:[-60,-104,60,-44],d:function(){return P.fringe(S)}});
  L.push({n:"head+ears",bb:[-66,-124,66,12],d:function(){return '<g transform="translate(-51,-58)">'+P.ear(S,-1)+'</g><g transform="translate(51,-58)">'+P.ear(S,1)+'</g>'+P.head(S)}});
  L.push({n:"nose",bb:[-18,-20,18,36],d:function(){return P.nose(S)}});
  L.push({n:"face layer",bb:[-60,-100,60,-10],d:function(){return P.face(S)}});
  L.push({n:"neck",bb:[-20,-52,20,12],d:function(){return P.neck(S)}});
  L.push({n:"torso",bb:[-64,-14,64,268],d:function(){return P.torso(S)}});
  L.push({n:"lanyard",bb:[-30,-8,30,76],d:function(){return P.lanyard(S)}});
  L.push({n:"badge",bb:[-22,-6,22,62],d:function(){return P.badge(S)}});
  L.push({n:"upper arm",bb:[-22,-16,22,114],d:function(){return P.upper_arm(S)}});
  L.push({n:"forearm",bb:[-20,-10,20,106],d:function(){return P.forearm(S)}});
  L.push({n:"hand",bb:[-18,-8,32,54],d:function(){return P.hand(S,1)}});
  L.push({n:"handset",bb:[-18,-84,18,84],d:function(){return P.handset(S)}});
  L.push({n:"notebook (prop)",bb:[-30,-40,30,46],d:function(){return P.prop_notebook(S)}});
  L.push({n:"pelvis",bb:[-48,-18,48,44],d:function(){return P.pelvis(S,24)}});
  L.push({n:"upper leg",bb:[-20,-8,20,160],d:function(){return P.upper_leg(S)}});
  L.push({n:"lower leg",bb:[-18,-8,18,158],d:function(){return P.lower_leg(S)}});
  L.push({n:"sneaker",bb:[-22,-16,50,20],d:function(){return P.foot(S)}});
  return L};
/* char entry: dispatch to this rig */
HF.CHARS=HF.CHARS||{};
HF.CHARS.stas_cut={paper:true,rig:"stas",skin:"#e9d0b8",shade:"#c39b80",hair:"#3d2f2b",build:0.9,top:"#5b5a70",topShade:"#4b4a5e",pants:"#34383f",shoe:"#3b4658",brow:"#3a2f2b",glasses:false,hr:50,vr:62};
})();
