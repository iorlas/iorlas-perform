/* art/vadik_cut.js - Vadik, cut-paper puppet (rig "vadik"). Data-driven + seeded.
   Registers: HF.RIG.vadik (data), HF.RIGS.vadik (draw(st,ch) -> svg markup in actor-local space), HF.EXPR.<8 names>, HF.POSES.<4 names>.
   Local space (same as the old puppet): origin = neck base, +y down, shoulders y~24, hips y=250, floor y=612 (FEET).
   Every part is a flat filled paper shape, no outlines; a soft drop shadow is cast between layers (filter on an UNROTATED wrapper,
   so shadow direction stays constant). All randomness = HF.hash(seed...). Pure function of (st, t). */
(function(){
var HF=window.HF=window.HF||{},PI=Math.PI;
function f(n){return Math.round(n*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function nz(v,d){return v==null||v!==v?d:v}

/* ------------------------------------------------------------------ rig data */
var RIG=HF.RIG=HF.RIG||{};HF.RIGS=HF.RIGS||{};
var R=RIG.vadik={
  version:"1.1.0",seed:7,
  pal:{skin:"#e2bd98",skin2:"#d4aa85",skinSh:"#c4977a",hair:"#a7774c",hair2:"#8c603a",hair3:"#b88a5a",
       tee:"#8d9299",tee2:"#737a83",teeHi:"#9aa0a7",collarIn:"#5d636c",pants:"#5d5b66",pants2:"#4a4853",shoe:"#dfe0dc",shoe2:"#b9bcbc",sole:"#f1ead8",shoeAcc:"#c4673a",
       nose:"#d9a682",noseSh:"#c18b6a",noseHi:"#eccaa6",nostril:"#99614b",
       lan:"#a5492f",badge:"#efe8d6",badge2:"#b4c3d1",frame:"#242a3a",lens:"#e8f3f8",brow:"#6d4b31",lid:"#4a3326",
       eyeW:"#f5f2ea",pupil:"#1e1c22",mouth:"#8c4b3e",mouthIn:"#5a2b2a",cheek:"#d9907a",handset:"#1c2430",handset2:"#2d3a4c",shadow:"#0b1020"},
  dim:{hw:56,sw:62,shY:24,UA:112,FA:104,UL:163,LL:161,hipY:272,hemY:274,ankleY:592,neckY:-28,headCY:-58,eyeY:-62,lanY:78,tufts:6},
  /* named pivots (actor-local, rest pose). Child pivots are relative to the parent's frame in the table below. */
  pivots:{
    root:{at:[0,612],note:"floor contact, between feet"},
    hip:{at:[0,250],parent:"root",note:"upper body lean pivot"},
    torso:{at:[0,0],parent:"hip",note:"neck base"},
    neck:{at:[0,-20],parent:"torso"},
    head:{at:[0,-20],parent:"neck",note:"tilt + yaw pivot (chin/neck joint)"},
    hair_tuft_i:{at:"seeded root on skull (head frame)",parent:"head",note:"6 tufts, sway pivot at root"},
    ear_L_R:{at:[-56,-58],parent:"head"},
    glasses:{at:[0,-62],parent:"head",note:"nose bridge; slides down on nose"},
    face:{at:[0,-58],parent:"head",note:"eyes, lids, brows, mouth layer"},
    upper_arm_L_R:{at:[-56,24],parent:"torso",note:"shoulder; R mirrored"},
    forearm_L_R:{at:"elbow (IK)",parent:"upper_arm"},
    hand_L_R:{at:"wrist (IK, pose target)",parent:"forearm",note:"mitten + separate thumb"},
    lanyard:{at:[0,78],parent:"torso",note:"V strap joins here"},
    badge:{at:[0,78],parent:"lanyard",note:"pendulum, swings"},
    upper_leg_L_R:{at:[-30,250],parent:"root"},
    lower_leg_L_R:{at:"knee (IK)",parent:"upper_leg"},
    pelvis:{at:[0,272],parent:"root",note:"trouser seat + crotch, under tee hem, not leaned"},
    foot_L_R:{at:[-33,595],parent:"lower_leg",note:"ankle; toe direction sign by pose.legs.fl/fr, foreshortened by legs.fsh"}
  }
};
/* ------------------------------------------------------------------ expressions (all numeric => tweenable) */
var EX0={open:1,mt:0,mg:0,lk:0,by:0,bdL:0,bdR:0,btL:8,btR:8,shut:0,pup:1,gl:0,mc:-0.15,mw:1,mo:0,ms:0,wob:0,slide:0,gx:0,gy:0};
function ex(o){var r={},k;for(k in EX0)r[k]=EX0[k];for(k in o)r[k]=o[k];return r}
var X={
  neutral_anxious:ex({open:0.92,by:-1,btL:14,btR:14,pup:0.9,mc:-0.3,mw:0.95,slide:0.12}),
  wince:ex({open:0.1,shut:1,by:4,btL:22,btR:22,pup:1,mc:-0.7,mw:0.95,wob:1,mt:1,slide:0.08}),
  side_glance:ex({open:0.9,by:-1,btL:10,btR:10,bdR:-2,pup:0.95,mc:-0.2,mw:0.95,gx:1,slide:0.12}),
  panic:ex({open:1.5,by:-9,btL:20,btR:20,pup:0.38,mc:-0.1,mw:1.35,mo:0.9,mt:1,mg:0.8,slide:0}),
  pretend:ex({open:0.82,by:-3,btL:10,btR:10,bdR:-2,pup:0.95,mc:0.4,mw:1.2,ms:1,mo:0.16,mt:1,slide:0.1}),
  shame:ex({open:0.62,by:-4,btL:26,btR:26,pup:0.95,mc:-1,mw:0.95,gy:1,slide:0.38}),
  realize:ex({open:1.4,by:-3,bdL:-9,btL:4,btR:12,pup:1,mc:0,mw:0.65,mo:0.5,slide:0}),
  blank:ex({open:1,by:0,btL:6,btR:6,gl:1,mc:-0.1,mw:0.95,slide:0.05})
};
X.side_glance_l=ex({});for(var k0 in X.side_glance)X.side_glance_l[k0]=X.side_glance[k0];X.side_glance_l.gx=-1;
HF.EXPR=HF.EXPR||{};for(var xn in X)HF.EXPR[xn]=X[xn];
/* ------------------------------------------------------------------ poses (data; hand target h = wrist, actor-local) */
function merge(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=merge(o[k]||{},b[k]);else o[k]=b[k]}return o}
var PB={turn:0,back:false,lean:0,hipx:0,sh:0,fid:0,
  head:{yaw:0,tilt:0,dx:0,dy:0,back:false},
  L:{h:[-70,234],bend:1,hand:"mitten",rot:0,s:1,z:1,rcv:0,rr:0},
  R:{h:[70,234],bend:-1,hand:"mitten",rot:0,s:1,z:1,rcv:0,rr:0},
  legs:{spread:24,ank:45,kin:2,k:0,fl:-1,fr:1,fsh:1,fs:1}};
HF.POSES=HF.POSES||{};
var PS={
  stand_still:{sh:5,head:{tilt:3}},
  stand_fidget:{sh:7,fid:1,lean:0.12,head:{tilt:5,dy:2},R:{h:[8,62],bend:-1,rot:-12},L:{h:[-66,230]}},
  hold_receiver:{sh:9,turn:-0.15,lean:0.1,head:{yaw:-0.3,tilt:-7,dx:-2},L:{h:[-104,-2],bend:-1,rot:0,rcv:1,rr:8},R:{h:[66,232]},legs:{spread:24}},
  flinch:{sh:20,turn:0.2,lean:-0.9,head:{yaw:0.3,tilt:-9,dx:-4,dy:6},L:{h:[-22,22],bend:1,rot:0},R:{h:[20,30],bend:-1,rot:0},legs:{spread:26,ank:42,kin:5,k:0,fl:-1,fr:1}}
};
for(var pn in PS)HF.POSES[pn]=merge(PB,PS[pn]);
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
var V0={hw:1,fh:0,ch:0,jw:1,nx:1,ny:1,my:0,es:1,lid:0,bw:6.5,bl:17,bdy:0,bags:0,stub:0,earS:1,th:1,fringe:0,cheek:0.28,st5:0,patch:0,hollow:0,burns:0,beard:0,goat:0,mous:0,shave:0,mess:0,
  g:{lw:41,lh:29,rx:9,sw:2.4,col:null}};
function mv(o){var r=JSON.parse(JSON.stringify(V0)),k;if(o)for(k in o){if(k==="g")for(var j in o.g)r.g[j]=o.g[j];else r[k]=o[k]}return r}
HF.VARIANT_DEFAULT=V0;
/* ------------------------------------------------------------------ parts. Each returns markup around its own pivot (0,0). */
var P={};
P.tuft=function(S,i){var T=S.tufts[i],th=S.v.th;T={w:T.w,h:T.h*th,lean:T.lean,alt:T.alt};
  return '<path d="M'+f(-T.w)+',3 C'+f(-T.w*0.9)+','+f(-T.h*0.5)+' '+f(T.lean-3)+','+f(-T.h*0.88)+' '+f(T.lean)+','+f(-T.h)+' C'+f(T.lean+T.w*0.55)+','+f(-T.h*0.72)+' '+f(T.w*0.95)+','+f(-T.h*0.3)+' '+f(T.w)+',3 Z" fill="'+(T.alt?S.c.hair3:S.c.hair)+'"/>'};
P.hair=function(S){var c=S.c,w=S.hwid+4,fh=S.v.fh;/* cap over the skull, fringe edge */
  if(S.v.fringe){var d0='M'+f(-w-1)+',-64 C'+f(-w-5)+',-104 '+f(-w*0.6)+',-121 0,-122 C'+f(w*0.6)+',-121 '+f(w+5)+',-104 '+f(w+1)+',-64 C'+f(w-2)+',-76 '+f(w*0.9)+',-86 '+f(w*0.62)+',-93 C'+f(w*0.3)+',-87 '+f(-w*0.1)+',-90 '+f(-w*0.42)+',-98 C'+f(-w*0.7)+',-92 '+f(-w+3)+',-80 '+f(-w-1)+',-64 Z';
    return '<g transform="translate(0,-64) scale(1,'+f(1+fh/60)+') translate(0,64)"><path d="'+d0+'" fill="'+c.hair+'"/><path d="M'+f(w*0.1)+',-121 C'+f(w*0.7)+',-118 '+f(w+3)+',-102 '+f(w+1)+',-64 C'+f(w-2)+',-76 '+f(w*0.9)+',-86 '+f(w*0.62)+',-93 C'+f(w*0.5)+',-106 '+f(w*0.35)+',-116 '+f(w*0.1)+',-121 Z" fill="'+c.hair2+'" opacity=".55"/><path d="M'+f(-w*0.42)+',-98 C'+f(-w*0.1)+',-90 '+f(w*0.3)+',-87 '+f(w*0.62)+',-93" fill="none" stroke="'+c.hair2+'" stroke-width="2.4" opacity=".5" stroke-linecap="round"/></g>'}
  return '<g transform="translate(0,-64) scale(1,'+f(1+fh/60)+') translate(0,64)">'+P.hair0(S)+'</g>'};
/* cap silhouette at rest (unshifted), used as the hair clip envelope together with the skull */
P.capD=function(S){var w=S.hwid+4;
  if(S.v.fringe)return 'M'+f(-w-1)+',-64 C'+f(-w-5)+',-104 '+f(-w*0.6)+',-121 0,-122 C'+f(w*0.6)+',-121 '+f(w+5)+',-104 '+f(w+1)+',-64 Z';
  return 'M'+f(-w-1)+',-64 C'+f(-w-5)+',-108 '+f(-w*0.6)+',-128 0,-129 C'+f(w*0.6)+',-128 '+f(w+5)+',-108 '+f(w+1)+',-64 Z'};
/* BACK view of the head (pose.back or pose.head.back): ears at the sides behind the skull, glasses temple hooks, skin skull,
   hair mass from crown to a pointed nape hairline. No face features. Tufts are drawn by the assembler behind it. */
P.head_back=function(S){var c=S.c,u=S.uid,w=S.hwid,hw=w+4,sk=P.skull(S),o='',fc=S.v.g.col||c.frame;
  [-1,1].forEach(function(sd){o+='<g transform="translate('+f(sd*(w+1))+',-58) scale('+S.v.earS+')"><path d="M0,-17 C'+f(sd*13)+',-18 '+f(sd*15)+',-4 '+f(sd*12)+',6 C'+f(sd*9)+',15 '+f(sd*3)+',18 0,15 Z" fill="'+c.skin2+'"/></g>';
    o+='<path d="M'+f(sd*(w-2))+',-66 Q'+f(sd*(w+11))+',-66 '+f(sd*(w+8))+',-50" fill="none" stroke="'+fc+'" stroke-width="'+f(S.v.g.sw*1.05)+'" stroke-linecap="round"/>'});
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs><path d="'+sk+'" fill="'+c.skin+'"/>';
  o+='<g clip-path="url(#'+u+'hc)"><path d="M-90,-30 L90,-30 L90,20 L-90,20 Z" fill="'+c.skinSh+'" opacity=".35"/></g>';
  var d='M'+f(-hw-1)+',-64 C'+f(-hw-5)+',-108 '+f(-hw*0.6)+',-128 0,-129 C'+f(hw*0.6)+',-128 '+f(hw+5)+',-108 '+f(hw+1)+',-64'+
    ' C'+f(w)+',-50 '+f(w-3)+',-40 '+f(w*0.8)+',-30 L'+f(w*0.55)+',-22 L'+f(w*0.42)+',-12 L'+f(w*0.26)+',-21 L'+f(w*0.12)+',-9 L0,-19 L'+f(-w*0.13)+',-10 L'+f(-w*0.28)+',-21 L'+f(-w*0.43)+',-13 L'+f(-w*0.56)+',-23 L'+f(-w*0.8)+',-30 C'+f(-w+3)+',-40 '+f(-w)+',-50 '+f(-hw-1)+',-64 Z';
  var kx=S.key<0?-1:1;
  o+='<g transform="translate(0,-64) scale(1,'+f(1+S.v.fh/60)+') translate(0,64)"><defs><clipPath id="'+u+'hbh"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.hair+'"/>'+
    '<g clip-path="url(#'+u+'hbh)"><path d="M'+f(kx*hw*0.25)+',-132 C'+f(kx*hw*0.7)+',-110 '+f(kx*hw*0.75)+',-60 '+f(kx*hw*0.5)+',0 L'+f(kx*90)+',0 L'+f(kx*90)+',-132 Z" fill="'+c.hair2+'" opacity=".55"/></g>'+
    '<path d="M'+f(w*0.08)+',-104 C'+f(w*0.2)+',-110 '+f(w*0.26)+',-98 '+f(w*0.12)+',-95 C'+f(-w*0.05)+',-93 '+f(-w*0.12)+',-108 '+f(w*0.05)+',-116 C'+f(w*0.25)+',-122 '+f(w*0.42)+',-108 '+f(w*0.36)+',-92" fill="none" stroke="'+c.hair2+'" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>'+
    '<path d="M'+f(-w*0.5)+',-78 C'+f(-w*0.42)+',-60 '+f(-w*0.44)+',-44 '+f(-w*0.5)+',-32 M'+f(-w*0.1)+',-70 C'+f(-w*0.06)+',-52 '+f(-w*0.08)+',-38 '+f(-w*0.12)+',-26" fill="none" stroke="'+c.hair3+'" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></g>';
  return o};
P.hair0=function(S){var c=S.c,w=S.hwid+4;
  return '<path d="M'+f(-w-1)+',-64 C'+f(-w-5)+',-108 '+f(-w*0.6)+',-128 0,-129 C'+f(w*0.6)+',-128 '+f(w+5)+',-108 '+f(w+1)+',-64 C'+f(w-4)+',-80 '+f(w*0.8)+',-95 '+f(w*0.5)+',-100 C'+f(w*0.2)+',-92 '+f(-w*0.3)+',-93 '+f(-w*0.52)+',-101 C'+f(-w*0.82)+',-94 '+f(-w+4)+',-80 '+f(-w-1)+',-64 Z" fill="'+c.hair+'"/>'+
         '<path d="M'+f(w*0.12)+',-127 C'+f(w*0.7)+',-124 '+f(w+3)+',-104 '+f(w+1)+',-64 C'+f(w-4)+',-80 '+f(w*0.8)+',-95 '+f(w*0.5)+',-100 C'+f(w*0.5)+',-112 '+f(w*0.35)+',-122 '+f(w*0.12)+',-127 Z" fill="'+c.hair2+'" opacity=".55"/>'};
P.skull=function(S){var w=S.hwid,v=S.v,T=-122-v.fh,ch=v.ch,jw=v.jw,cw=1+(jw-1)*2.2,a=w*jw;
  return 'M0,'+f(T)+' C'+f(w*0.62)+','+f(T)+' '+f(w)+','+f(-96-v.fh*0.5)+' '+f(w)+',-60 C'+f(a)+','+f(-30+ch*0.4)+' '+f(a*0.68)+','+f(-4+ch*0.8)+' '+f(w*0.22*cw)+','+f(6+ch)+' Q0,'+f(10+ch)+' '+f(-w*0.22*cw)+','+f(6+ch)+' C'+f(-a*0.68)+','+f(-4+ch*0.8)+' '+f(-a)+','+f(-30+ch*0.4)+' '+f(-w)+',-60 C'+f(-w)+','+f(-96-v.fh*0.5)+' '+f(-w*0.62)+','+f(T)+' 0,'+f(T)+' Z'};
P.head=function(S){var c=S.c,u=S.uid,sk=P.skull(S),o='';
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs>';
  o+='<path d="'+sk+'" fill="'+c.skin+'"/>';
  var kx=S.key<0?-1:1;
  o+='<g clip-path="url(#'+u+'hc)"><path d="M'+f(kx*S.hwid*0.15)+',-124 C'+f(kx*S.hwid*0.85)+',-100 '+f(kx*S.hwid*0.95)+',-50 '+f(kx*S.hwid*0.55)+',-12 L'+f(kx*S.hwid*0.2)+',12 L'+f(kx*80)+',12 L'+f(kx*80)+',-124 Z" fill="'+c.skin2+'" opacity=".8"/>';
  o+='<ellipse cx="'+f(S.fx-S.hwid*0.46)+'" cy="-34" rx="9" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/><ellipse cx="'+f(S.fx+S.hwid*0.46)+'" cy="-34" rx="9" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/>';
  if(S.v.stub>0){var w2=S.hwid,sd2='',q,H=function(n){var z=Math.sin(n*127.1+311.7)*43758.5453;return z-Math.floor(z)};
    o+='<path d="M-100,-46 Q'+f(-w2*0.6)+',-30 '+f(-w2*0.3)+',-25 Q0,-21 '+f(w2*0.3)+',-25 Q'+f(w2*0.6)+',-30 100,-46 L100,40 L-100,40 Z" fill="#5f5058" opacity="'+f(S.v.stub*0.3)+'"/>';
    for(q=0;q<110;q++){var px=(H(q*3.1)-0.5)*2*w2*0.95,py=-34+H(q*5.7)*46;if(py<-26-Math.abs(px)*0.12+Math.abs(px)*0.0)continue;sd2+='<circle cx="'+f(px)+'" cy="'+f(py)+'" r="'+f(0.8+H(q*9.3)*0.6)+'" fill="#4a3d42" opacity="'+f(S.v.stub*0.55)+'"/>'}
    o+=sd2}
  o+=P.worn(S,true);
  o+='</g>';
  o+=P.worn(S,false);
  return o};
/* worn / unshaven layers. inClip=true: drawn inside the skull clip; false: volume pieces that stick out past the jaw */
P.worn=function(S,inClip){var v=S.v,c=S.c,u=S.uid,w=S.hwid,fx=S.fx,o='',k;
  var STUB='#6f5a55',BRD=c.hair2;
  var blur=function(m,sd){return '<g filter="url(#'+u+'wb'+(sd||1)+')">'+m+'</g>'};
  if(inClip)o+='<defs><filter id="'+u+'wb1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter><filter id="'+u+'wb2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>';
  /* jaw region below the cheek line, incl. upper lip; dy shifts the top edge */
  var reg=function(dy,side){dy=dy||0;return 'M'+f(-w-6)+','+f(-64+dy)+' C'+f(-w+2)+','+f(-46+dy)+' -42,'+f(-32+dy)+' -27,'+f(-29+dy)+' C-17,'+f(-28+dy)+' -12,'+f(-24+dy)+' 0,'+f(-24+dy)+' C12,'+f(-24+dy)+' 17,'+f(-28+dy)+' 27,'+f(-29+dy)+' C42,'+f(-32+dy)+' '+f(w-2)+','+f(-46+dy)+' '+f(w+6)+','+f(-64+dy)+' L'+f(w+6)+',40 L'+f(-w-6)+',40 Z'};
  var big=function(dc){var S2={hwid:w,v:{ch:v.ch+dc,jw:v.jw*1.03,fh:v.fh}};return P.skull(S2)};
  if(inClip){
    if(v.st5){var sm=blur('<path d="'+reg(0)+'" fill="'+STUB+'" opacity="'+f(0.34*v.st5)+'"/>');
      if(v.shave){/* only the left half still unshaven; the shaved half ends in a clean curved edge */
        o+='<defs><clipPath id="'+u+'shv"><path d="M-90,-70 L'+f(fx+3)+',-70 C'+f(fx+10)+',-40 '+f(fx-3)+',-18 '+f(fx+5)+',40 L-90,40 Z"/></clipPath></defs>';
        sm='<g clip-path="url(#'+u+'shv)">'+sm+'</g>'}
      o+=sm}
    if(v.patch){o+=blur('<ellipse cx="'+f(fx)+'" cy="2" rx="17" ry="10" fill="'+STUB+'" opacity=".42"/>'+
      '<ellipse cx="'+f(-w*0.7)+'" cy="-18" rx="11" ry="17" transform="rotate(-28 '+f(-w*0.7)+' -18)" fill="'+STUB+'" opacity=".38"/>'+
      '<ellipse cx="'+f(w*0.66)+'" cy="-24" rx="8" ry="12" transform="rotate(30 '+f(w*0.66)+' -24)" fill="'+STUB+'" opacity=".34"/>'+
      '<ellipse cx="'+f(fx-9)+'" cy="-21" rx="7" ry="3" fill="'+STUB+'" opacity=".3"/>')}
    if(v.hollow){var hk=v.hollow;
      o+=blur('<ellipse cx="'+f(-w*0.66)+'" cy="-30" rx="9" ry="17" transform="rotate(14 '+f(-w*0.66)+' -30)" fill="'+c.skinSh+'" opacity="'+f(0.55*hk)+'"/>'+
              '<ellipse cx="'+f(w*0.66)+'" cy="-30" rx="9" ry="17" transform="rotate(-14 '+f(w*0.66)+' -30)" fill="'+c.skinSh+'" opacity="'+f(0.7*hk)+'"/>',2);
      o+='<path d="M'+f(fx-15)+',-30 Q'+f(fx-22)+',-20 '+f(fx-19)+',-9 M'+f(fx+15)+',-30 Q'+f(fx+22)+',-20 '+f(fx+19)+',-9" fill="none" stroke="'+c.skinSh+'" stroke-width="2.6" stroke-linecap="round" opacity="'+f(0.6*hk)+'"/>'}
    if(v.burns){[-1,1].forEach(function(sd){o+='<path d="M'+f(sd*(w+2))+',-72 L'+f(sd*(w-11))+',-72 C'+f(sd*(w-12))+',-58 '+f(sd*(w-10))+',-46 '+f(sd*(w-5))+',-36 L'+f(sd*(w-1))+',-40 C'+f(sd*(w+2))+',-52 '+f(sd*(w+2))+',-62 '+f(sd*(w+2))+',-72 Z" fill="'+c.hair2+'"/>'})}
  } else {
    if(v.beard){/* neat short beard: expanded jaw clipped to the cheek line; clean edge, lip cut out */
      o+='<defs><clipPath id="'+u+'bdr"><path d="'+reg(-2)+'"/></clipPath></defs>';
      o+='<g clip-path="url(#'+u+'bdr)"><path d="'+big(6)+'" fill="'+BRD+'"/><path d="'+big(6)+'" fill="'+c.hair+'" opacity=".35" transform="translate('+f(-w*0.08)+',0) scale(.86,.97)"/></g>';
      o+='<path d="M'+f(fx-15)+',-14 Q'+f(fx)+',-18 '+f(fx+15)+',-14 Q'+f(fx)+',-3 '+f(fx-15)+',-14 Z" fill="'+c.skin2+'"/>'}
    if(v.goat){o+='<path d="M'+f(fx-16)+',-1 Q'+f(fx)+',5 '+f(fx+16)+',-1 C'+f(fx+17)+',9 '+f(fx+9)+',17 '+f(fx)+',18 C'+f(fx-9)+',17 '+f(fx-17)+',9 '+f(fx-16)+',-1 Z" fill="'+BRD+'"/>'+
      '<path d="M'+f(fx-5)+',-6 Q'+f(fx)+',-8 '+f(fx+5)+',-6 L'+f(fx+2.5)+',1 Q'+f(fx)+',3 '+f(fx-2.5)+',1 Z" fill="'+BRD+'"/>'}
    if(v.mous){o+='<path d="M'+f(fx-19)+',-11 C'+f(fx-16)+',-21 '+f(fx-6)+',-23 '+f(fx)+',-20 C'+f(fx+6)+',-23 '+f(fx+16)+',-21 '+f(fx+19)+',-11 C'+f(fx+14)+',-16 '+f(fx+7)+',-17 '+f(fx)+',-16 C'+f(fx-7)+',-17 '+f(fx-14)+',-16 '+f(fx-19)+',-11 Z" fill="'+BRD+'"/>'}
    if(v.shave){/* plaster on the shaved side of the chin */
      o+='<g transform="translate('+f(fx+21)+',-1) rotate(-24)"><rect x="-13" y="-5" width="26" height="10" rx="4.5" fill="#ecd0a8"/><rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="#f6e6cc"/>'+
        '<circle cx="-9" cy="-1.5" r=".9" fill="#c9a77e"/><circle cx="-9" cy="1.8" r=".9" fill="#c9a77e"/><circle cx="9" cy="-1.5" r=".9" fill="#c9a77e"/><circle cx="9" cy="1.8" r=".9" fill="#c9a77e"/></g>'}
  }
  return o};
P.ear=function(S,side){var c=S.c;return '<path d="M0,-17 C'+f(side*13)+',-18 '+f(side*15)+',-4 '+f(side*12)+',6 C'+f(side*9)+',15 '+f(side*3)+',18 0,15 Z" fill="'+c.skin2+'"/><path d="M'+f(side*2)+',-10 C'+f(side*9)+',-11 '+f(side*10)+',-2 '+f(side*7)+',5 C'+f(side*5)+',9 '+f(side*3)+',9 '+f(side*2)+',6" fill="none" stroke="'+c.skinSh+'" stroke-width="3" stroke-linecap="round" opacity=".7"/>'};
P.nose=function(S){/* origin = (fx,-52) head frame. bridge top y=-17 (under glasses bridge), bulb, tip bottom y=27 (head -25), mouth at -12 */
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
  var es=S.v.es,rx=12.6*es,ry=10*es*cl(ow,0.02,1.3);
  if(ow<0.12||e.shut>0.6){
    var lw=e.shut>0.6;
    o+='<path d="M-11.5,-1 Q0,'+(lw?7:5)+' 11.5,-1" fill="none" stroke="'+c.lid+'" stroke-width="3" stroke-linecap="round"/>';
    if(lw)o+='<path d="M-8,3 L-10,8 M0,6 L0,11 M8,3 L10,8" stroke="'+c.lid+'" stroke-width="2" stroke-linecap="round"/>';
    return o}
  var gx=cl(S.gx,-1.3,1.3)*5.2,gy=cl(S.gy,-1.3,1.3)*3.6,pr=4.5*es*e.pup*(1.05-0.1*Math.max(0,ow-1));
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
var M=R.mouth={y:-14,wk:17,dk:20,cu:5,bu:4.5,lw:3.4,jd:4,jc:12,chin:8,tmax:7,col:{teeth:"#f2ecdc",teethSh:"#cdc2aa",tongue:"#cf6a66",tongue2:"#a24a4b"}};
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
    if(S.v.bags>0)o+='<g transform="translate('+f(cx)+','+f(ey+13)+') scale('+f(sxs)+',1)"><path d="M-14,-1 Q0,'+f(9+S.v.bags*4)+' 14,-1 Q0,'+f(4+S.v.bags*1.5)+' -14,-1 Z" fill="#a9786a" opacity="'+f(0.3+S.v.bags*0.22)+'"/></g>';
    o+='<g transform="translate('+f(cx)+','+f(ey)+') scale('+f(sxs)+',1)">'+P.eye(S,sd,i)+'</g>';
    var by=ey-24+S.v.bdy+e.by+(sd<0?e.bdL:e.bdR);
    o+='<g transform="translate('+f(cx)+','+f(by)+') scale('+f(Math.max(0.3,sxs))+',1)">'+P.brow(S,sd,i)+'</g>';
  }
  if(only==='mouth')o='';
  if(only!=='eyes')o+='<g transform="translate('+f(fx*1.02)+','+f(M.y+S.v.my+S.pitch)+')">'+P.mouth(S)+'</g>';
  return o};
P.glasses=function(S){/* origin = nose bridge */
  var e=S.e,c=S.c,u=S.uid,sep=S.sep,fx=S.fx,o='',i,sd,lead,sxs,cx,lw=S.v.g.lw,lh=S.v.g.lh,grx=S.v.g.rx,gsw=S.v.g.sw,fc=S.v.g.col||c.frame;
  var sl=e.slide;
  o+='<g transform="translate('+f(fx*0.0)+','+f(sl*13)+') rotate('+f(sl*-3.5)+' '+f(fx)+' 0)">';
  var lens=[];
  for(i=0;i<2;i++){sd=i?1:-1;lead=(sd===S.sg&&S.as>0.15);sxs=lead?1:Math.max(0.05,S.ca*1.05-0.05);if(!lead&&S.as<0.15)sxs=1;
    cx=fx+sd*sep*(lead?1:Math.max(0.5,S.ca));lens.push({cx:cx,sx:sxs,sd:sd,hide:(!lead&&S.ca<0.22)})}
  /* temples */
  var hw=S.hwid;
  lens.forEach(function(L){ if(L.hide)return; var ex2=S.earX?S.earX(L.sd)+L.sd*3:L.sd*(hw+3),x0=L.cx+L.sd*lw*0.5*L.sx;
    o+='<path d="M'+f(x0)+',-3 L'+f(ex2)+',-4" stroke="'+fc+'" stroke-width="'+f(gsw*1.05)+'" stroke-linecap="round" fill="none"/>'});
  lens.forEach(function(L,k2){ if(L.hide)return;
    var id=u+'gl'+k2;
    o+='<g transform="translate('+f(L.cx)+',0) scale('+f(L.sx)+',1)">';
    o+='<defs><clipPath id="'+id+'"><rect x="'+f(-lw/2)+'" y="'+f(-lh/2)+'" width="'+lw+'" height="'+lh+'" rx="'+grx+'"/></clipPath></defs>';
    o+='<rect x="'+f(-lw/2)+'" y="'+f(-lh/2)+'" width="'+lw+'" height="'+lh+'" rx="'+grx+'" fill="'+c.lens+'" fill-opacity="'+f(0.07+e.gl*0.88)+'"/>';
    o+='<g clip-path="url(#'+id+')"><path d="M-18,'+f(lh/2)+' L-4,'+f(-lh/2)+' L6,'+f(-lh/2)+' L-8,'+f(lh/2)+' Z" fill="#fff" opacity="'+f(0.2+e.gl*0.6)+'"/><path d="M4,'+f(lh/2)+' L12,'+f(-lh/2)+' L16,'+f(-lh/2)+' L8,'+f(lh/2)+' Z" fill="#fff" opacity="'+f(0.14+e.gl*0.5)+'"/></g>';
    o+='<rect x="'+f(-lw/2)+'" y="'+f(-lh/2)+'" width="'+lw+'" height="'+lh+'" rx="'+grx+'" fill="none" stroke="'+fc+'" stroke-width="'+gsw+'"/>';
    o+='</g>'});
  var l0=lens[0],l1=lens[1];
  if(!l0.hide&&!l1.hide)o+='<path d="M'+f(l0.cx+lw/2*l0.sx)+',-6 Q'+f((l0.cx+l1.cx)/2)+',-12 '+f(l1.cx-lw/2*l1.sx)+',-6" fill="none" stroke="'+fc+'" stroke-width="'+f(gsw*1.05)+'" stroke-linecap="round"/>';
  return o+'</g>'};
P.neck=function(S){var c=S.c,tx=S.tx;/* from inside the head (y-50) down into the collar (y8) */
  return '<path d="M'+f(tx-14)+',-50 L'+f(tx+14)+',-50 L'+f(tx+16)+',2 Q'+f(tx)+',9 '+f(tx-16)+',2 Z" fill="'+c.skin2+'"/><path d="M'+f(tx-15)+',-30 L'+f(tx+15)+',-30 L'+f(tx+15)+',-19 Q'+f(tx)+',-8 '+f(tx-15)+',-19 Z" fill="'+c.skinSh+'" opacity=".75"/>'};
P.collar=function(S){var tx=S.tx;return '<path d="M'+f(tx-26)+',1 A26,10 0 0 0 '+f(tx+26)+',1" fill="none" stroke="'+S.c.tee2+'" stroke-width="6" stroke-linecap="round"/>'};
P.torso=function(S){var c=S.c,sw=S.sw,tx=S.tx,u=S.uid,sh=S.shr,hy=S.dim.hemY;
  var d='M'+f(tx-24)+',-5 C'+f(tx-40)+',-3 '+f(tx-sw+10)+','+f(8-sh)+' '+f(tx-sw)+','+f(26-sh)+' C'+f(tx-sw-3)+',90 '+f(tx-sw+8)+',190 '+f(tx-sw+7)+','+hy+' Q'+f(tx)+','+(hy+5)+' '+f(tx+sw-7)+','+hy+' C'+f(tx+sw-8)+',190 '+f(tx+sw+3)+',90 '+f(tx+sw)+','+f(26-sh)+' C'+f(tx+sw-10)+','+f(8-sh)+' '+f(tx+40)+',-3 '+f(tx+24)+',-5 Q'+f(tx)+',9 '+f(tx-24)+',-5 Z';
  S.torsoPath=d;
  var kx=S.key<0?-1:1,o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.tee+'"/>';
  o+='<g clip-path="url(#'+u+'tc)"><path d="M'+f(tx+kx*sw*0.18)+',-6 C'+f(tx+kx*sw*0.5)+',60 '+f(tx+kx*sw*0.3)+',200 '+f(tx+kx*sw*0.35)+',292 L'+f(tx+kx*90)+',292 L'+f(tx+kx*90)+',-6 Z" fill="'+c.tee2+'" opacity=".5"/>';
  o+='<path d="M'+f(tx-90)+','+(hy-17)+' Q'+f(tx)+','+(hy-12)+' '+f(tx+90)+','+(hy-17)+' L'+f(tx+90)+','+(hy+12)+' L'+f(tx-90)+','+(hy+12)+' Z" fill="'+c.tee2+'" opacity=".5"/></g>';
  /* crew collar: skin ellipse inside + ribbing ring */
  o+='<ellipse cx="'+f(tx)+'" cy="2" rx="26" ry="10" fill="'+c.collarIn+'"/><ellipse cx="'+f(tx)+'" cy="2" rx="26" ry="10" fill="none" stroke="'+c.tee2+'" stroke-width="6"/>';
  return o};
P.lanyard=function(S){var c=S.c,tx=S.tx,py=S.dim.lanY;
  return '<path d="M'+f(tx-24)+',-1 L'+f(tx+2)+','+f(py)+' M'+f(tx+24)+',-1 L'+f(tx+2)+','+f(py)+'" fill="none" stroke="'+c.lan+'" stroke-width="5.5" stroke-linecap="round"/>'};
P.badge=function(S){var c=S.c;/* origin = lanyard junction */
  return '<path d="M0,0 L0,16" stroke="'+c.lan+'" stroke-width="4"/><rect x="-5" y="12" width="10" height="7" rx="2" fill="'+c.frame+'"/>'+
    '<rect x="-20" y="17" width="40" height="56" rx="5" fill="'+c.badge+'"/><rect x="-13" y="25" width="26" height="22" rx="3" fill="'+c.badge2+'"/><path d="M-13,56 h26 M-13,63 h18" stroke="'+c.badge2+'" stroke-width="3" stroke-linecap="round"/>'};
P.sleeve=function(S,len){return 'M-17,6 Q-17,-13 0,-13 Q17,-13 17,6 L'+f(19.5)+','+f(len)+' Q0,'+f(len+7)+' '+f(-19.5)+','+f(len)+' Z'};
P.upper_arm=function(S){var c=S.c;return '<path d="'+cap(S.dim.UA,22,19)+'" fill="'+c.skin+'"/><path d="'+P.sleeve(S,58)+'" fill="'+c.tee+'"/><path d="M-16,52 Q0,59 16,52" fill="none" stroke="'+c.tee2+'" stroke-width="4" opacity=".6"/>'};
P.forearm=function(S){return '<path d="'+cap(S.dim.FA,19,15)+'" fill="'+S.c.skin+'"/>'};
P.hand=function(S,sd){/* mitten, fingers toward +y; wrist at origin. sd=+1: thumb on +x */
  var c=S.c;
  return '<path d="M-11,-3 L11,-3 C15.5,10 15.5,32 8.5,43 Q0,50 -8.5,43 C-15.5,32 -15.5,10 -11,-3 Z" fill="'+c.skin+'"/>'+
    '<path d="M-4.5,30 L-4,42 M3.5,30 L3.8,42" stroke="'+c.skinSh+'" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>'+
    '<g transform="scale('+sd+',1)"><path d="M8,5 C17,7 21,17 18,27 Q14,32 10,26 C8.5,20 8,14 8,5 Z" fill="'+c.skin2+'"/></g>'};
P.handset=function(S){var c=S.c;/* origin = grip centre; earpiece up (-y), mouthpiece down */
  return '<path d="M-12,-72 Q0,-80 12,-72 L13,-52 Q0,-44 -13,-52 Z" fill="'+c.handset+'"/><path d="M-12,72 Q0,80 12,72 L13,52 Q0,44 -13,52 Z" fill="'+c.handset+'"/><rect x="-8" y="-56" width="16" height="112" rx="7" fill="'+c.handset2+'"/><rect x="-3" y="-50" width="3" height="96" rx="1.5" fill="#ffffff" opacity=".12"/>'};
P.upper_leg=function(S,L){L=L||S.dim.UL;var c=S.c;/* thigh: hip at origin, knee at (0,L); tapers 42 -> 31 */
  return '<path d="M-21,-8 C-22,'+f(L*0.3)+' -18.5,'+f(L*0.72)+' -15.5,'+f(L+4)+' Q0,'+f(L+11)+' 15.5,'+f(L+4)+' C18.5,'+f(L*0.72)+' 22,'+f(L*0.3)+' 21,-8 Z" fill="'+c.pants+'"/>'+
    '<path d="M-5,'+f(L-13)+' Q1,'+f(L-6)+' 8,'+f(L-12)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>'};
P.lower_leg=function(S,L){L=L||S.dim.LL;var c=S.c,hb=L-15;/* shin: knee at origin, ankle at (0,L). hem ends 11 above the ankle pivot so it breaks over the shoe collar */
  return '<path d="M-15.5,-6 C-17,'+f(L*0.26)+' -15,'+f(L*0.6)+' -12.5,'+f(hb-14)+' C-13.5,'+f(hb-6)+' -16.5,'+f(hb-3)+' -17,'+f(hb+1)+' Q0,'+f(hb+8)+' 17,'+f(hb+1)+' C16.5,'+f(hb-3)+' 13.5,'+f(hb-6)+' 12.5,'+f(hb-14)+' C15,'+f(L*0.6)+' 17,'+f(L*0.26)+' 15.5,-6 Z" fill="'+c.pants+'"/>'+
    '<path d="M-14,'+f(hb-9)+' Q0,'+f(hb-3)+' 14,'+f(hb-9)+'" fill="none" stroke="'+c.pants2+'" stroke-width="3" opacity=".75" stroke-linecap="round"/>'+
    '<path d="M-15,'+f(hb+3)+' Q0,'+f(hb+10)+' 15,'+f(hb+3)+' L15,'+f(hb+0)+' Q0,'+f(hb+7)+' -15,'+f(hb+0)+' Z" fill="'+c.pants2+'" opacity=".55"/>'};
P.pelvis=function(S,hs){var c=S.c,w=hs+21;/* plain trouser seat + belt line; hipY at origin; smooth crotch arc, no notch */
  return '<path d="M'+f(-w)+',-16 L'+f(w)+',-16 C'+f(w+1)+',6 '+f(w-1)+',20 '+f(w-6)+',34 Q0,52 '+f(-w+6)+',34 C'+f(-w+1)+',20 '+f(-w-1)+',6 '+f(-w)+',-16 Z" fill="'+c.pants+'"/>'+
    '<path d="M'+f(-w+1)+',9 Q0,13 '+f(w-1)+',9 L'+f(w-1)+',15 Q0,19 '+f(-w+1)+',15 Z" fill="'+c.pants2+'"/><rect x="-6" y="9.5" width="12" height="8" rx="2" fill="#8a8f9b" opacity=".85"/><rect x="-3" y="12" width="6" height="3.5" rx="1" fill="'+c.pants2+'"/>'};
P.foot=function(S){var c=S.c;/* sneaker, ankle pivot at origin; drawn toe toward +x; pose.legs.fl/fr flip it: fl:-1,fr:1 = toes OUT (default); sole bottom y=20. 61 wide, 37 tall */
  /* layered low sneaker in 3/4: heel counter, collar opening, tongue, vamp with laces, rounded toe cap, thin sole with toe spring */
  var o='';
  /* far-side sole sliver (3/4: we see a bit of the far edge) */
  o+='<path d="M-20,19 C-6,22 20,22 34,17 C38,15 41,12 42,9 L36,12 C24,17 0,18 -20,16 Z" fill="'+c.shoe2+'"/>';
  /* sole: thin, heel slightly thicker, toe springs up */
  o+='<path d="M-25,11 C-27,17 -24,21 -17,21 L22,21 C31,21 38,17 43,8 L40,7 C34,13 26,15 18,15 L-20,15 C-23,15 -25,13 -25,11 Z" fill="'+c.sole+'"/>';
  /* upper body */
  o+='<path d="M-24,13 C-27,3 -26,-9 -19,-15 C-14,-18 -6,-18 -1,-16 L6,-12 C14,-7 21,-5 30,-5 C39,-4 44,3 42,9 C41,13 35,15 26,15 L-20,15 C-22,15 -24,14 -24,13 Z" fill="'+c.shoe+'"/>';
  /* lower-side shade band */
  o+='<path d="M-24,9 C-10,11 15,11 41,8 C41,11 37,14 30,15 L-20,15 C-23,15 -24,12 -24,9 Z" fill="'+c.shoe2+'" opacity=".45"/>';
  /* toe cap: separate rounded piece, lighter top where it faces the viewer */
  o+='<path d="M21,-4 C30,-5 39,-1 42,5 C44,10 40,14 32,15 L24,15 C20,9 19,2 21,-4 Z" fill="#eceee9"/><path d="M21,-4 C19,2 20,9 24,15" fill="none" stroke="'+c.shoe2+'" stroke-width="1.5" stroke-linecap="round"/>';
  /* heel counter */
  o+='<path d="M-24,11 C-27,3 -26,-9 -19,-15 L-16,-16 C-19,-6 -19,3 -17,11 Z" fill="'+c.shoeAcc+'"/><path d="M-19,0 C-12,2 -6,4 2,4" fill="none" stroke="'+c.shoe2+'" stroke-width="1.5" stroke-linecap="round"/>';
  /* collar opening (inside of the shoe, seen from above in 3/4) */
  o+='<path d="M-18,-14 C-13,-19 -5,-19 1,-15 C-4,-12 -12,-11 -18,-14 Z" fill="#5d636c"/>';
  /* tongue: sticks up out of the collar, in front of the leg */
  o+='<path d="M4,-12 C6,-24 13,-28 19,-25 C21,-19 19,-12 16,-7 L6,-8 Z" fill="'+c.sole+'"/><path d="M7,-17 C10,-24 14,-26 18,-24" fill="none" stroke="'+c.shoe2+'" stroke-width="1.4" stroke-linecap="round"/>';
  /* lace panel + 3 laces across the instep */
  o+='<path d="M0,-11 C8,-8 14,-5 21,-2 L19,2 C12,0 5,-3 -2,-6 Z" fill="'+c.shoe2+'" opacity=".55"/>';
  var k;for(k=0;k<3;k++){var x=2+k*6.5,y=-9+k*2.6;o+='<path d="M'+f(x-2.5)+','+f(y+4)+' L'+f(x+3)+','+f(y-2.5)+'" stroke="'+c.shoeAcc+'" stroke-width="2.4" stroke-linecap="round"/>'}
  return o};

/* ------------------------------------------------------------------ assembler */
function sh(S,m,soft){return '<g filter="url(#'+S.uid+(soft?'s2':'s1')+')">'+m+'</g>'}
function state(st,ch){
  var D=R.dim,c=R.pal,p=st.pose,e=st.expr,u=st.uid,t=st.t||0,gz=st.gaze||{x:0,y:0,cam:0},hd=p.head;
  var back=!!(p.back||hd.back),yaw=back?0:cl(hd.yaw||0,-1,1),a=yaw*PI/2,ca=Math.cos(a),sa=Math.sin(a),sg=yaw<0?-1:1,as=Math.abs(sa);
  var S={v:mv(st.v),c:c,dim:D,uid:u,e:e,p:p,ca:ca,sa:sa,sg:sg,as:as,key:st.key||1,mouth:st.mouth||0,tufts:R.tufts,t:t,back:back};
  S.hwid=D.hw*S.v.hw*(0.88+0.12*ca);S.sep=27*(0.45+0.55*ca);S.fx=sa*S.hwid*0.62;S.eyeY=D.eyeY;
  S.gx=cl((gz.cam?-sa*0.85:gz.x)+nz(e.gx,0),-1.4,1.4);S.gy=cl((gz.cam?0:gz.y)+nz(e.gy,0),-1.4,1.4);S.pitch=S.gy*2.2;
  var tc=Math.cos((p.turn||0)*PI/2);S.sw=D.sw*(0.42+0.58*tc);S.tx=(p.turn||0)*14;S.shr=nz(p.sh,0);
  return S}
function drawVadik(st,ch){
  var S=state(st,ch),D=S.dim,c=S.c,p=S.p,u=S.uid,t=S.t,shk=st.shake||{x:0,y:0,r:0},o='',i;
  var lean=nz(p.lean,0),sgf=(p.head.yaw||p.turn)<0?-1:1;
  var rotU=lean*5*sgf+shk.r,l16=lean*16,scU=1+lean*0.055;
  o+='<defs><filter id="'+u+'s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="'+c.shadow+'" flood-opacity=".38"/></filter>'+
     '<filter id="'+u+'s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="'+c.shadow+'" flood-opacity=".34"/></filter></defs>';
  o+='<g transform="translate('+f(shk.x)+','+f(shk.y)+')">';
  /* ---- legs (not leaned) ---- */
  if(st.stand){
    var lg=p.legs||{},hs=nz(lg.spread,26),asp=nz(lg.ank,45),kin=nz(lg.kin,2),kk=nz(lg.k,0),fsh=nz(lg.fsh,1),fs=nz(lg.fs,1),fr0=D.UL/(D.UL+D.LL);
    o+='<defs><filter id="'+u+'cb" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><filter id="'+u+'cb2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>';
    [-1,1].forEach(function(sd){var fd=sd<0?nz(lg.fl,1):nz(lg.fr,-1),gx=sd*asp+fd*5,gy=D.ankleY+20*fs;
      o+='<ellipse cx="'+f(gx+fd*3)+'" cy="'+f(gy+2)+'" rx="'+f(44*fs)+'" ry="8" fill="'+c.shadow+'" opacity=".55" filter="url(#'+u+'cb)"/>';
      o+='<ellipse cx="'+f(gx+fd*2)+'" cy="'+f(gy-0.5)+'" rx="'+f(31*fs)+'" ry="3.6" fill="'+c.shadow+'" opacity=".7" filter="url(#'+u+'cb2)"/>'});
    o+=sh(S,'<g transform="translate(0,'+D.hipY+')">'+P.pelvis(S,hs)+'</g>',1);
    [-1,1].forEach(function(sd){
      var hip=[sd*hs,D.hipY],an=[sd*asp,D.ankleY-kk],kn=[hip[0]+(an[0]-hip[0])*fr0-sd*(kin+kk*0.8),hip[1]+(an[1]-hip[1])*fr0-kk*0.4];
      var L1=Math.hypot(kn[0]-hip[0],kn[1]-hip[1]),L2=Math.hypot(an[0]-kn[0],an[1]-kn[1]);
      var fd=sd<0?nz(lg.fl,1):nz(lg.fr,-1);
      /* per-foot 3/4: each shoe foreshortened differently and toe-out V stance (fl:-1/fr:1 puts toes outward; rotL/rotR about -11/+12 deg tip the toes toward the viewer), so the pair is not mirrored twins */
      var q34=sd<0?nz(lg.q34L,0.9):nz(lg.q34R,0.8),rt=sd<0?nz(lg.rotL,-11):nz(lg.rotR,12);
      o+=sh(S,'<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rt)+') scale('+f(fd*fsh*fs*q34)+','+f(fs)+')">'+P.foot(S)+'</g>',1);
      o+=sh(S,'<g transform="'+tr(kn[0],kn[1],ang(kn,an))+'">'+P.lower_leg(S,L2)+'</g>',1);
      o+=sh(S,'<g transform="'+tr(hip[0],hip[1],ang(hip,kn))+'">'+P.upper_leg(S,L1)+'</g>',1);
    });
  }
  /* ---- upper body ---- */
  o+='<g transform="translate(0,'+D.hipY+') rotate('+f(rotU)+') translate(0,-'+D.hipY+') translate(0,'+f(l16)+') scale('+f(scU)+')">';
  var tx=S.tx,shy=D.shY-S.shr,SL=[tx-S.sw+12,shy],SR=[tx+S.sw-12,shy],arms=[],hands='';
  o+=sh(S,P.torso(S),0)+sh(S,P.neck(S),1)+P.collar(S);
  /* lanyard + swinging badge */
  var sw_=7*Math.sin(2*PI*0.62*t+R.seed)+4*Math.sin(2*PI*1.3*t+R.seed*2)-lean*14+shk.r*1.4+(p.turn||0)*-10;
  var lx=tx+2,ly=D.lanY;
  if(!S.back)o+=P.lanyard(S);
  else o+='<path d="M'+f(tx-23)+',1 Q'+f(tx)+',-9 '+f(tx+23)+',1" fill="none" stroke="'+c.lan+'" stroke-width="5.5" stroke-linecap="round"/>';/* back view: strap across the nape */
  var fid=nz(p.fid,0);
  [["L",SL,-1],["R",SR,1]].forEach(function(A){
    var nm=A[0],sp=p[nm]||{},Sh=A[1],sd=A[2],h=(sp.h||[sd*70,234]).slice();
    if(fid&&nm==="R"){h[0]+=fid*3*Math.sin(t*5.3+1);h[1]+=fid*2*Math.cos(t*4.1)}
    var r=ik(Sh,h,D.UA,D.FA,nz(sp.bend,sd*-1)),el=r.e,H=r.h;
    arms.push({nm:nm,Sh:Sh,el:el,H:H,sp:sp,sd:sd});
  });
  /* badge is hidden behind a hand that grips the lanyard (R) only visually; drawn before arms */
  if(!S.back)o+=sh(S,'<g transform="translate('+f(lx)+','+f(ly)+') rotate('+f(sw_)+')">'+P.badge(S)+'</g>',1);
  arms.forEach(function(A){
    o+=sh(S,'<g transform="'+tr(A.Sh[0],A.Sh[1],ang(A.Sh,A.el))+'">'+P.upper_arm(S)+'</g>',1);
    o+=sh(S,'<g transform="'+tr(A.el[0],A.el[1],ang(A.el,A.H))+'">'+P.forearm(S)+'</g>',1);
  });
  /* head */
  var hdx=nz(p.head.dx,0),hdy=nz(p.head.dy,0),tilt=nz(p.head.tilt,0),hp=[hdx,D.neckY+hdy];
  var hg='';
  /* tufts (behind hair cap), sway by tilt + idle. Roots anchored to the CURRENT skull: x foreshortened with the yawed head width,
     shifted with the cap (fx*0.3), clamped inside the crown; y re-evaluated on the crown curve. Yaw 0 = the seeded rest roots exactly. */
  var tk=S.hwid/(D.hw*S.v.hw)*(0.8+0.2*S.ca),tsh=S.fx*0.3,tlim=S.hwid*0.68;
  for(i=0;i<R.tufts.length;i++){var T=R.tufts[i],sway=-tilt*0.5*T.k+3*Math.sin(2*PI*0.5*t+i*1.7+R.seed)+shk.r*-1.2,
      txr=cl(T.x*tk,-tlim,tlim),tyr=T.y+34*(txr*txr-T.x*T.x)/(D.hw*D.hw);
    hg+='<g transform="'+tr(txr+tsh,tyr-S.v.fh,sway)+'">'+P.tuft(S,i)+'</g>'}
  if(S.v.mess){/* unkempt: tufts sticking out over the ears and one at the nape */
    [[-1,-84,-112,0],[-1,-70,-128,1],[1,-86,108,1],[1,-72,124,0],[1,-100,62,0]].forEach(function(m,j){
      var sw2=3*Math.sin(2*PI*0.5*t+j*2.3)-tilt*0.3;
      hg+='<g transform="'+tr(m[0]*(S.hwid-4)+S.fx*0.3,m[1],m[2]+sw2)+'"><path d="M-9,4 C-9,-12 -2,-24 3,-30 C5,-20 10,-10 9,4 Z" fill="'+(m[3]?S.c.hair3:S.c.hair)+'"/></g>'})}
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
  var gl='<g transform="translate('+f(0)+','+f(S.eyeY+S.pitch)+')">'+sh(S,P.glasses(S),1)+'</g>';
  /* hair cap follows yaw by fx*0.3 but is clipped (unshifted wrapper, inside the shadow) to skull + rest cap silhouette, so it never overhangs the head */
  var hk='<defs><clipPath id="'+u+'hk"><path d="'+P.skull(S)+'"/><path d="'+P.capD(S)+'" transform="translate(0,-64) scale(1,'+f(1+S.v.fh/60)+') translate(0,64)"/></clipPath></defs>';
  var hc=sh(S,hk+'<g clip-path="url(#'+u+'hk)"><g transform="translate('+f(S.fx*0.3)+',0)">'+P.hair(S)+'</g></g>',1);
  o+='<g transform="'+tr(hp[0],hp[1],tilt)+'">'+hair+headM+nose+face+gl+hc+'</g>';}
  /* held receiver + cord (drawn above head), then hands */
  arms.forEach(function(A){
    var sp=A.sp,rc=nz(sp.rcv,0);
    if(rc>0.02){var rr=nz(sp.rr,0),fdx=A.H[0]-A.el[0],fdy=A.H[1]-A.el[1],fl_=Math.sqrt(fdx*fdx+fdy*fdy)||1,hx=A.H[0]+fdx/fl_*24,hy=A.H[1]+fdy/fl_*24;
      var hc2=[hx,hy];
      if(st.tether){var tw=st.tether,bx=hc2[0]-Math.sin(rr*PI/180)*70,by2=hc2[1]+Math.cos(rr*PI/180)*70;
        var ex_=tw.x,ey_=tw.y,sag=tw.sag==null?70:tw.sag,mx=(bx+ex_)/2,my=(by2+ey_)/2+sag;
        o+='<g filter="url(#'+u+'s2)"><path d="M'+f(bx)+','+f(by2)+' C'+f(bx+(mx-bx)*0.3)+','+f(by2+sag*0.85)+' '+f(ex_+(mx-ex_)*0.3)+','+f(ey_+sag*0.6)+' '+f(ex_)+','+f(ey_)+'" fill="none" stroke="'+(tw.c||c.handset)+'" stroke-width="'+(tw.w||5)+'" stroke-linecap="round" opacity="'+f(rc)+'"/></g>'}
      o+=sh(S,'<g opacity="'+f(rc)+'" transform="'+tr(hx,hy,rr)+'">'+P.handset(S)+'</g>',1)}
  });
  arms.forEach(function(A){var sp=A.sp,s=nz(sp.s,1);
    o+=sh(S,'<g transform="'+tr(A.H[0],A.H[1],ang(A.el,A.H)+nz(sp.rot,0),s)+'">'+P.hand(S,A.sd>0?-1:1)+'</g>',1);
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
HF.RIGS.vadik=drawVadik;
/* seeded tufts */
(function(){var H=HF.hash||function(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)},n=R.dim.tufts,T=[],i;
  for(i=0;i<n;i++){var u=(i+0.5)/n,x=-34+u*68+(H(R.seed*3.1+i)-0.5)*8,k=Math.abs(x)/34;
    T.push({x:x,y:-117+Math.pow(Math.abs(x)/56,2)*34+2,h:30+H(R.seed*5.3+i)*20-k*8,w:10.5+H(R.seed*7.7+i)*4.5,lean:(x/34)*13+(H(R.seed*9.1+i)-0.5)*9,alt:H(R.seed*2.3+i)>0.5,k:0.6+H(R.seed*4.4+i)*0.8})}
  R.tufts=T})();
/* exploded-parts catalogue for the rig sheet: name, drawer, bbox [x0,y0,x1,y1] in part-local coords */
R.catalogue=function(st){
  var S=state(st),L=[];
  S.sg=1;S.as=0;
  L.push({n:"hair tufts x6",bb:[-60,-70,60,6],d:function(){var s='';for(var i=0;i<6;i++)s+='<g transform="translate('+f((i-2.5)*20)+',0) scale(.7)">'+P.tuft(S,i)+'</g>';return s}});
  L.push({n:"hair cap",bb:[-64,-132,64,-60],d:function(){return P.hair(S)}});
  L.push({n:"head+ears",bb:[-72,-124,72,12],d:function(){return '<g transform="translate(-53,-58)">'+P.ear(S,-1)+'</g><g transform="translate(53,-58)">'+P.ear(S,1)+'</g>'+P.head(S)}});
  L.push({n:"nose",bb:[-18,-20,18,36],d:function(){return P.nose(S)}});
  L.push({n:"face layer",bb:[-60,-100,60,-10],d:function(){return P.face(S)}});
  L.push({n:"glasses",bb:[-62,-26,62,26],d:function(){return P.glasses(S)}});
  L.push({n:"neck",bb:[-20,-52,20,12],d:function(){return P.neck(S)}});
  L.push({n:"torso",bb:[-70,-14,70,272],d:function(){return P.torso(S)}});
  L.push({n:"lanyard",bb:[-30,-8,30,84],d:function(){return P.lanyard(S)}});
  L.push({n:"badge",bb:[-26,-6,26,78],d:function(){return P.badge(S)}});
  L.push({n:"upper arm",bb:[-22,-8,22,114],d:function(){return P.upper_arm(S)}});
  L.push({n:"forearm",bb:[-20,-8,20,104],d:function(){return P.forearm(S)}});
  L.push({n:"hand",bb:[-18,-8,32,54],d:function(){return P.hand(S,1)}});
  L.push({n:"handset",bb:[-18,-84,18,84],d:function(){return P.handset(S)}});
  L.push({n:"pelvis",bb:[-48,-18,48,44],d:function(){return P.pelvis(S,27)}});
  L.push({n:"upper leg",bb:[-20,-8,20,174],d:function(){return P.upper_leg(S)}});
  L.push({n:"lower leg",bb:[-18,-8,18,170],d:function(){return P.lower_leg(S)}});
  L.push({n:"sneaker",bb:[-22,-16,50,20],d:function(){return P.foot(S)}});
  return L};
/* char entry: dispatch to this rig */
HF.CHARS=HF.CHARS||{};
HF.CHARS.vadik_cut={paper:true,rig:"vadik",skin:"#e2bd98",shade:"#c4977a",hair:"#a7774c",hairStyle:"messy",build:1.0,top:"#8d9299",topShade:"#737a83",pants:"#3a4558",shoe:"#d9dbd8",brow:"#6d4b31",glasses:true,hr:56,vr:63};
})();
