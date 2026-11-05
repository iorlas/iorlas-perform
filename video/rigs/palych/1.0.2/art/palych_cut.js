/* art/palych_cut.js - Palych, cut-paper puppet (rig "palych"). Same construction, joints and draw contract as rig "vadik" 1.0.0.
   Registers: HF.RIG.palych (data + .expr + .poses + .variantDefault), HF.RIGS.palych (draw(st,ch) -> svg markup in actor-local space), HF.CHARS.palych_cut.
   Expressions / poses are registered PER RIG (HF.RIG.palych.expr / .poses), not in the shared HF.EXPR / HF.POSES, because names like neutral_anxious
   and stand_still collide across rigs.
   Local space: origin = neck base, +y down, shoulders y~24, hips y=230, floor y=516. Every part is a flat filled paper shape, no outlines; soft drop
   shadow between layers (filter on an UNROTATED wrapper). All randomness = HF.hash(seed...). Pure function of (st, t). */
(function(){
var HF=window.HF=window.HF||{},PI=Math.PI;
function f(n){return Math.round(n*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function nz(v,d){return v==null||v!==v?d:v}

/* ------------------------------------------------------------------ rig data */
var RIG=HF.RIG=HF.RIG||{};HF.RIGS=HF.RIGS||{};
var R=RIG.palych={
  version:"1.0.0",seed:11,
  pal:{skin:"#dcab88",skin2:"#c99476",skinSh:"#b27857",hair:"#8f9396",hair2:"#777b7e",hair3:"#a4a8ab",
       shirt:"#c3d1df",shirt2:"#a9bbcd",shirtHi:"#e2eaf2",vest:"#c49a62",vest2:"#a07a46",vestHi:"#d2ab74",button:"#5a3b1f",
       tie:"#2f3c5e",tie2:"#6c7ca2",collarIn:"#a9bbcd",pants:"#3d4557",pants2:"#2f3646",belt:"#2a2220",buckle:"#b9953a",
       shoe:"#4a3226",shoe2:"#2f1f17",sole:"#17110f",lace:"#c9b79c",shoeHi:"#6a4a38",
       nose:"#d1946f",noseSh:"#b97a58",noseHi:"#e6b793",nostril:"#7a4a3a",mustache:"#7a7468",mustache2:"#625d53",
       brow:"#6b675f",lid:"#6c4a38",eyeW:"#f5f2ea",pupil:"#1e1c22",mouth:"#7a3f36",mouthIn:"#4e2423",cheek:"#cd7f68",
       handset:"#1c2430",handset2:"#2d3a4c",thermos:"#9fb1c2",thermos2:"#7f93a6",thermosCap:"#b5452f",thermosBand:"#2f3c5e",shadow:"#0b1020"},
  dim:{hw:62,sw:80,shY:24,UA:100,FA:92,UL:128,LL:126,hipY:230,hemY:230,ankleY:496,neckY:-58,headCY:-116,eyeY:-62,sep:25,tufts:9},
  pivots:{
    root:{at:[0,516],note:"floor contact, between feet"},
    hip:{at:[0,212],parent:"root",note:"upper body lean pivot"},
    torso:{at:[0,0],parent:"hip",note:"neck base"},
    neck:{at:[0,-36],parent:"torso",note:"thick neck, about 36 px visible between chin and collar"},
    head:{at:[0,-36],parent:"neck",note:"tilt + yaw pivot (chin/neck joint)"},
    hair_tuft_i:{at:"seeded root on top of skull (head frame)",parent:"head",note:"9 short bristle spikes, sway pivot at root"},
    ear_L_R:{at:[-62,-58],parent:"head"},
    mustache:{at:[0,-26],parent:"head",note:"over the upper lip, follows face x offset"},
    face:{at:[0,-58],parent:"head",note:"eyes, lids, brows, mouth layer"},
    upper_arm_L_R:{at:[-68,24],parent:"torso",note:"shoulder; R mirrored"},
    forearm_L_R:{at:"elbow (IK)",parent:"upper_arm"},
    hand_L_R:{at:"wrist (IK, pose target)",parent:"forearm",note:"mitten + separate thumb; hand kind point on pose key hand"},
    tie:{at:[0,14],parent:"torso",note:"knot; blade swings slightly"},
    prop_thermos:{at:"hand_L_R palm (hand mode) or torso x=+-44,y=140 (side mode)",parent:"hand_L_R",note:"detachable; st.prop {on,at,hand}; default off"},
    upper_leg_L_R:{at:[-30,230],parent:"root"},
    lower_leg_L_R:{at:"knee (IK)",parent:"upper_leg"},
    pelvis:{at:[0,230],parent:"root",note:"high-waisted trouser seat + belt, under vest hem, not leaned"},
    foot_L_R:{at:[-44,498],parent:"lower_leg",note:"ankle; toe direction sign by pose.legs.fl/fr, foreshortened by legs.fsh"}
  }
};
/* ------------------------------------------------------------------ expressions (all numeric => tweenable) */
var EX0={open:1,mt:0,mg:0,lk:0,by:0,bdL:0,bdR:0,btL:8,btR:8,shut:0,pup:1,gl:0,mc:-0.15,mw:1,mo:0,ms:0,wob:0,slide:0,gx:0,gy:0,big:0,sweat:0};
function ex(o){var r={},k;for(k in EX0)r[k]=EX0[k];for(k in o)r[k]=o[k];return r}
/* brow tilt bt: + = inner end up (worry), - = inner end down (anger). by: + = lower. mc: + smile. slide is unused (no glasses), kept for schema parity. */
var X={
  neutral_anxious:ex({open:0.85,by:1,btL:6,btR:6,pup:0.9,mc:-0.3,mw:1,slide:0}),
  wince:ex({open:0.1,shut:1,by:4,btL:18,btR:18,pup:1,mc:-0.7,mw:1.05,wob:1,mt:1}),
  side_glance:ex({open:0.85,by:0,btL:4,btR:4,bdR:-2,pup:0.95,mc:-0.25,mw:1,gx:1}),
  panic:ex({open:1.5,big:0.6,by:-13,btL:24,btR:24,pup:0.95,lk:1,mc:-1,mw:0.56,mo:0.85,mt:0,mg:0,sweat:1}),
  pretend:ex({open:0.8,by:-2,btL:9,btR:9,bdR:-3,pup:0.9,mc:0.35,mw:1.15,ms:1,gx:0.4}),
  shame:ex({open:0.6,by:-1,btL:22,btR:22,pup:0.95,mc:-1,mw:1,gy:1}),
  realize:ex({open:1.3,by:-3,bdL:-9,btL:2,btR:10,pup:1,mc:0,mw:0.6,mo:0.5}),
  blank:ex({open:1,by:2,btL:0,btR:0,pup:1,mc:-0.05,mw:1}),
  bark:ex({open:0.95,by:6,btL:-17,btR:-17,pup:1.05,mc:-0.1,mw:1.1,mo:1,mt:1,mg:1}),
  clerk:ex({open:0.85,by:-6,btL:10,btR:10,pup:0.9,mc:0.8,mw:0.85,mo:0.3,mt:1}),
  proud:ex({open:0.65,by:-4,btL:-3,btR:-3,pup:0.95,mc:1,mw:1.4,ms:0.6,gy:-0.8})
};
X.side_glance_l=ex({});for(var k0 in X.side_glance)X.side_glance_l[k0]=X.side_glance[k0];X.side_glance_l.gx=-1;
R.expr=X;
/* ------------------------------------------------------------------ poses (data; hand target h = wrist, actor-local) */
function merge(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=merge(o[k]||{},b[k]);else o[k]=b[k]}return o}
var PB={turn:0,back:false,lean:0,hipx:0,sh:0,fid:0,
  head:{yaw:0,tilt:0,dx:0,dy:0,back:false},
  L:{h:[-86,204],bend:1,hand:"mitten",rot:0,s:1.08,z:1,rcv:0,rr:0,pr:0},
  R:{h:[86,204],bend:-1,hand:"mitten",rot:0,s:1.08,z:1,rcv:0,rr:0,pr:0},
  legs:{spread:30,ank:44,kin:2,k:0,fl:-1,fr:1,fsh:1,fs:1}};
var PS={
  stand_still:{sh:2,head:{tilt:1}},
  stand_fidget:{sh:3,fid:1,lean:0.08,head:{tilt:3,dy:1},R:{h:[24,196],bend:-1,rot:24},L:{h:[-86,202]}},
  hold_receiver:{sh:5,turn:-0.12,lean:0.08,head:{yaw:-0.3,tilt:-6,dx:-3},L:{h:[-122,-38],bend:-1,rot:0,rcv:1,rr:8},R:{h:[86,204]},legs:{spread:30}},
  point_order:{sh:6,turn:0.1,lean:0.14,head:{yaw:0.18,tilt:-4,dx:3},R:{h:[272,8],bend:-1,hand:"point",rot:0,s:1.08},L:{h:[-64,170],bend:1,rot:-8},legs:{spread:32,ank:48}},
  hold_prop:{sh:3,head:{tilt:2},R:{h:[34,118],bend:-1,rot:0,pr:0},L:{h:[-86,204]}}
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
var V0={hw:1,jw:1.08,ch:12,nx:1.25,ny:1.1,my:0,es:0.82,lid:0.18,bw:8.5,bl:19,bdy:1,bags:1,earS:1.12,th:1,cheek:0.55,mous:1};
function mv(o){var r=JSON.parse(JSON.stringify(V0)),k;if(o)for(k in o)r[k]=o[k];return r}
R.variantDefault=V0;
/* ------------------------------------------------------------------ parts. Each returns markup around its own pivot (0,0). */
var P={};
P.tuft=function(S,i){var T=S.tufts[i],th=S.v.th;T={w:T.w,h:T.h*th,lean:T.lean,alt:T.alt};
  return '<path d="M'+f(-T.w)+',3 L'+f(T.lean-1)+','+f(-T.h)+' L'+f(T.w)+',3 Z" fill="'+(T.alt?S.c.hair3:S.c.hair2)+'"/>'};
P.hair=function(S){var c=S.c,w=S.hwid+4,g=c.hair,g2=c.hair2,o='',i;/* flat-top bristle crop over the skull; sideburn band down to y=-70 */
  o+='<path d="M'+f(-w-2)+',-70 L'+f(-w+3)+',-120 Q'+f(-w+6)+',-138 '+f(-w+24)+',-138 L'+f(w-24)+',-138 Q'+f(w-6)+',-138 '+f(w-3)+',-120 L'+f(w+2)+',-70 C'+f(w-6)+',-84 '+f(w-14)+',-96 '+f(w-24)+',-102 L'+f(-w+24)+',-102 C'+f(-w+14)+',-96 '+f(-w+6)+',-84 '+f(-w-2)+',-70 Z" fill="'+g+'"/>';
  o+='<path d="M'+f(w*0.2)+',-137 L'+f(w-24)+',-138 Q'+f(w-6)+',-138 '+f(w-3)+',-120 L'+f(w+2)+',-70 C'+f(w-6)+',-84 '+f(w-14)+',-96 '+f(w-24)+',-102 L'+f(w*0.2)+',-102 Z" fill="'+g2+'" opacity=".6"/>';
  for(i=0;i<9;i++)o+='<path d="M'+f(-w+14+i*((2*w-28)/8))+',-130 L'+f(-w+14+i*((2*w-28)/8))+',-112" stroke="'+g2+'" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>';
  return o};
/* crop silhouette at rest (unshifted), used as the hair clip envelope together with the skull */
P.capD=function(S){var w=S.hwid+4;
  return 'M'+f(-w-2)+',-70 L'+f(-w+3)+',-120 Q'+f(-w+6)+',-138 '+f(-w+24)+',-138 L'+f(w-24)+',-138 Q'+f(w-6)+',-138 '+f(w-3)+',-120 L'+f(w+2)+',-70 Z'};
/* BACK view of the head (pose.back or pose.head.back): ears at the sides behind the skull, skin block skull, grey crop from the flat top
   down to a straight clipper line at the nape with a short stubble fade. No face features or mustache. Bristles drawn by the assembler behind it. */
P.head_back=function(S){var c=S.c,u=S.uid,w=S.hwid,hw=w+4,sk=P.skull(S),o='',i;
  [-1,1].forEach(function(sd){o+='<g transform="translate('+f(sd*(w+1))+',-58) scale('+S.v.earS+')"><path d="M0,-17 C'+f(sd*13)+',-18 '+f(sd*15)+',-4 '+f(sd*12)+',6 C'+f(sd*9)+',15 '+f(sd*3)+',18 0,15 Z" fill="'+c.skin2+'"/></g>'});
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs><path d="'+sk+'" fill="'+c.skin+'"/>';
  o+='<g clip-path="url(#'+u+'hc)"><path d="M-90,-40 L90,-40 L90,40 L-90,40 Z" fill="'+c.skinSh+'" opacity=".3"/>'+
    '<path d="M'+f(-w-4)+',-62 L'+f(w+4)+',-62 L'+f(w+4)+',-40 Q0,-34 '+f(-w-4)+',-40 Z" fill="'+c.hair2+'" opacity=".35"/></g>';
  var d='M'+f(-hw-2)+',-70 L'+f(-hw+3)+',-120 Q'+f(-hw+6)+',-138 '+f(-hw+24)+',-138 L'+f(hw-24)+',-138 Q'+f(hw-6)+',-138 '+f(hw-3)+',-120 L'+f(hw+2)+',-70'+
    ' C'+f(w+1)+',-64 '+f(w-1)+',-58 '+f(w-4)+',-54 Q0,-50 '+f(-w+4)+',-54 C'+f(-w+1)+',-58 '+f(-w-1)+',-64 '+f(-hw-2)+',-70 Z';
  var kx=S.key<0?-1:1;
  o+='<defs><clipPath id="'+u+'hbh"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.hair+'"/>'+
    '<g clip-path="url(#'+u+'hbh)"><path d="M'+f(kx*hw*0.2)+',-140 L'+f(kx*hw*0.2)+',-40 L'+f(kx*90)+',-40 L'+f(kx*90)+',-140 Z" fill="'+c.hair2+'" opacity=".6"/></g>';
  for(i=0;i<9;i++){var x=-hw+14+i*((2*hw-28)/8);o+='<path d="M'+f(x)+',-130 L'+f(x)+',-62" stroke="'+c.hair2+'" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>'}
  return o};
P.collar_back=function(S){var tx=S.tx,c=S.c;/* back view: shirt collar band around the nape */
  return '<path d="M'+f(tx-27)+',-12 Q'+f(tx)+',-4 '+f(tx+27)+',-12 L'+f(tx+31)+',4 Q'+f(tx)+',14 '+f(tx-31)+',4 Z" fill="'+c.shirtHi+'"/><path d="M'+f(tx-29)+',-3 Q'+f(tx)+',6 '+f(tx+29)+',-3" stroke="'+c.shirt2+'" stroke-width="1.6" fill="none"/>'};
P.skull=function(S){var w=S.hwid,v=S.v,T=-122,c=v.ch+2,j=w*v.jw;/* block head: flat top, square jaw */
  return 'M'+f(-w*.55)+','+T+' L'+f(w*.55)+','+T+' C'+f(w*.85)+','+T+' '+f(w)+','+(T+14)+' '+f(w)+',-60 C'+f(j)+',-34 '+f(j)+',-8 '+f(j*.86)+','+(c-6)+' Q'+f(j*.8)+','+c+' '+f(j*.5)+','+c+' L'+f(-j*.5)+','+c+' Q'+f(-j*.8)+','+c+' '+f(-j*.86)+','+(c-6)+' C'+f(-j)+',-8 '+f(-j)+',-34 '+f(-w)+',-60 C'+f(-w)+','+(T+14)+' '+f(-w*.85)+','+T+' '+f(-w*.55)+','+T+' Z'};
P.head=function(S){var c=S.c,u=S.uid,sk=P.skull(S),o='',w=S.hwid;
  o+='<defs><clipPath id="'+u+'hc"><path d="'+sk+'"/></clipPath></defs>';
  o+='<path d="'+sk+'" fill="'+c.skin+'"/>';
  var kx=S.key<0?-1:1;
  o+='<g clip-path="url(#'+u+'hc)"><path d="M'+f(kx*w*0.15)+',-124 C'+f(kx*w*0.85)+',-100 '+f(kx*w*0.95)+',-50 '+f(kx*w*0.55)+',-12 L'+f(kx*w*0.2)+',30 L'+f(kx*90)+',30 L'+f(kx*90)+',-124 Z" fill="'+c.skin2+'" opacity=".8"/>';
  o+='<ellipse cx="'+f(S.fx-w*0.46)+'" cy="-32" rx="11" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/><ellipse cx="'+f(S.fx+w*0.46)+'" cy="-32" rx="11" ry="6" fill="'+c.cheek+'" opacity="'+S.v.cheek+'"/>';
  o+='<path d="M'+f(-w)+',-18 Q'+f(-w*.7)+',22 '+f(-w*.3)+',22 L'+f(w*.3)+',22 Q'+f(w*.7)+',22 '+f(w)+',-18 L90,40 L-90,40 Z" fill="'+c.skin2+'" opacity=".35"/>';
  o+='</g>';
  o+='<path d="M'+f(S.fx-30)+',-24 Q'+f(S.fx-26)+',-4 '+f(S.fx-20)+',2 M'+f(S.fx+30)+',-24 Q'+f(S.fx+26)+',-4 '+f(S.fx+20)+',2" stroke="'+c.skinSh+'" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>';
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
var M=R.mouth={y:-16,wk:20,dk:22,cu:6,bu:5,lw:3.6,jd:5,jc:26,chin:2,tmax:8,col:{teeth:"#f2ecdc",teethSh:"#cdc2aa",tongue:"#cf6a66",tongue2:"#a24a4b"}};
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
    if(S.v.bags>0)o+='<g transform="translate('+f(cx)+','+f(ey+13)+') scale('+f(sxs)+',1)"><path d="M-14,-1 Q0,'+f(9+S.v.bags*4)+' 14,-1 Q0,'+f(4+S.v.bags*1.5)+' -14,-1 Z" fill="#a87558" opacity="'+f(0.3+S.v.bags*0.22)+'"/></g>';
    o+='<g transform="translate('+f(cx)+','+f(ey)+') scale('+f(sxs)+',1)">'+P.eye(S,sd,i)+'</g>';
    var by=ey-24+S.v.bdy+e.by+(sd<0?e.bdL:e.bdR);
    o+='<g transform="translate('+f(cx)+','+f(by)+') scale('+f(Math.max(0.3,sxs))+',1)">'+P.brow(S,sd,i)+'</g>';
  }
  if(nz(e.sweat,0)!==0&&only!=='mouth'){var tx=S.hwid*(e.sweat<0?-0.8:0.86);o+='<g transform="translate('+f(fx+tx)+','+f(ey+(e.sweat<0?-3:-26))+') scale(1.15)"><path d="M0,-9 C6,-1 7,5 0,8 C-7,5 -6,-1 0,-9Z" fill="#bfe3f4"/><path d="M-1.6,-3 C-3.4,0 -3.4,3 -2.2,4" stroke="#fff" stroke-width="1.3" fill="none" opacity=".85" stroke-linecap="round"/></g>'}
  if(only==='mouth')o='';
  if(only!=='eyes')o+='<g transform="translate('+f(fx*1.02)+','+f(M.y+S.v.my+S.pitch)+')">'+P.mouth(S)+'</g>';
  return o};
P.mustache=function(S){/* origin = head frame; sits over the upper lip, ends lift with the smile */
  var c=S.c,fx=S.fx,e=S.e,l=cl(e.mc,-1,1)*-3-effOf(S)*3.5,s=S.v.mous;
  return '<g transform="translate('+f(fx*1.02)+','+f(S.pitch)+')"><path d="M-34,'+f(-27+l)+' C-26,-42 -8,-39 0,-35 C8,-39 26,-42 34,'+f(-27+l)+' C26,'+f(-19+l*.5)+' 10,-26 0,-25 C-10,-26 -26,'+f(-19+l*.5)+' -34,'+f(-27+l)+' Z" fill="'+c.mustache+'" opacity="'+s+'"/><path d="M0,-35 C8,-39 26,-42 34,'+f(-27+l)+' C26,'+f(-19+l*.5)+' 10,-26 0,-25 Z" fill="'+c.mustache2+'" opacity="'+f(.6*s)+'"/></g>'};
P.neck=function(S){var c=S.c,tx=S.tx;/* thick neck: from inside the head (y-62) down into the collar (y8) */
  return '<path d="M'+f(tx-21)+',-80 L'+f(tx+21)+',-80 L'+f(tx+25)+',4 Q'+f(tx)+',12 '+f(tx-25)+',4 Z" fill="'+c.skin2+'"/><path d="M'+f(tx-22)+',-48 L'+f(tx+22)+',-48 L'+f(tx+22)+',-30 Q'+f(tx)+',-18 '+f(tx-22)+',-30 Z" fill="'+c.skinSh+'" opacity=".7"/>'};
P.collar=function(S){var tx=S.tx,c=S.c;/* shirt collar points over the vest, around the neck */
  return '<path d="M'+f(tx-24)+',-10 L'+f(tx-50)+',4 L'+f(tx-34)+',32 L'+f(tx-5)+',16 Z" fill="'+c.shirtHi+'"/><path d="M'+f(tx+24)+',-10 L'+f(tx+50)+',4 L'+f(tx+34)+',32 L'+f(tx+5)+',16 Z" fill="'+c.shirt+'"/><path d="M'+f(tx-24)+',-10 L'+f(tx-5)+',16 M'+f(tx+24)+',-10 L'+f(tx+5)+',16" stroke="'+c.shirt2+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>'};
P.torso=function(S){var c=S.c,sw=S.sw,tx=S.tx,u=S.uid,sh=S.shr,hy=S.dim.hemY,bw=sw-8;/* shirt body with knit vest over it; belly slightly wider than the hip */
  var d='M'+f(tx-30)+',-5 C'+f(tx-48)+',-3 '+f(tx-sw+10)+','+f(8-sh)+' '+f(tx-sw)+','+f(26-sh)+' C'+f(tx-sw-3)+',90 '+f(tx-bw-6)+',190 '+f(tx-bw-2)+','+hy+' Q'+f(tx)+','+(hy+5)+' '+f(tx+bw+2)+','+hy+' C'+f(tx+bw+6)+',190 '+f(tx+sw+3)+',90 '+f(tx+sw)+','+f(26-sh)+' C'+f(tx+sw-10)+','+f(8-sh)+' '+f(tx+48)+',-3 '+f(tx+30)+',-5 Q'+f(tx)+',9 '+f(tx-30)+',-5 Z';
  S.torsoPath=d;
  var kx=S.key<0?-1:1,o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.shirt+'"/>';
  o+='<g clip-path="url(#'+u+'tc)">';
  /* vest with a V opening onto shirt + tie */
  if(S.back)o+='<path d="M'+f(tx-sw-12)+',-8 L'+f(tx+sw+12)+',-8 L'+f(tx+sw+12)+','+(hy+8)+' L'+f(tx-sw-12)+','+(hy+8)+' Z" fill="'+c.vest+'"/>';/* back view: plain vest back */
  else o+='<path d="M'+f(tx-26)+',-8 L'+f(tx-sw-12)+',-8 L'+f(tx-sw-12)+','+(hy+8)+' L'+f(tx+sw+12)+','+(hy+8)+' L'+f(tx+sw+12)+',-8 L'+f(tx+26)+',-8 L'+f(tx+3)+',76 L'+f(tx-3)+',76 Z" fill="'+c.vest+'"/>';
  var x;for(x=-bw;x<=bw;x+=9)if(Math.abs(x)>8)o+='<path d="M'+f(tx+x)+',84 L'+f(tx+x*1.03)+','+(hy-12)+'" stroke="'+c.vest2+'" stroke-width="1.6" opacity=".45"/>';
  if(!S.back)o+='<path d="M'+f(tx-26)+',-6 L'+f(tx-3)+',76 M'+f(tx+26)+',-6 L'+f(tx+3)+',76" stroke="'+c.vest2+'" stroke-width="5" stroke-linecap="round" fill="none"/>';
  o+='<path d="M'+f(tx-90)+','+(hy-17)+' Q'+f(tx)+','+(hy-9)+' '+f(tx+90)+','+(hy-17)+' L'+f(tx+90)+','+(hy+12)+' L'+f(tx-90)+','+(hy+12)+' Z" fill="'+c.vest2+'"/>';
  o+='<path d="M'+f(tx+kx*sw*0.18)+',-6 C'+f(tx+kx*sw*0.5)+',60 '+f(tx+kx*sw*0.3)+',200 '+f(tx+kx*sw*0.35)+',292 L'+f(tx+kx*90)+',292 L'+f(tx+kx*90)+',-6 Z" fill="'+c.vest2+'" opacity=".38"/>';
  o+='</g>';
  if(!S.back)[100,128,156].forEach(function(y){o+='<ellipse cx="'+f(tx)+'" cy="'+y+'" rx="6" ry="6" fill="'+c.button+'"/><ellipse cx="'+f(tx-1.4)+'" cy="'+f(y-1.4)+'" rx="1.8" ry="1.8" fill="#a98053"/>'});
  return o};
P.tie=function(S){var c=S.c;/* origin = knot centre; blade hangs +y */
  return '<path d="M-7,-6 L7,-6 L5,10 L-5,10 Z" fill="'+c.tie+'"/><path d="M-5,9 L5,9 L9,48 L0,62 L-9,48 Z" fill="'+c.tie+'"/><path d="M-6,22 L7,17 M-7,34 L8,29 M-8,45 L9,40" stroke="'+c.tie2+'" stroke-width="2.2" opacity=".8" stroke-linecap="round"/>'};
P.sleeveL=function(len,w0,w1){return 'M'+f(-w0)+',6 Q'+f(-w0)+',-14 0,-14 Q'+f(w0)+',-14 '+f(w0)+',6 L'+f(w1)+','+f(len)+' Q0,'+f(len+5)+' '+f(-w1)+','+f(len)+' Z'};
P.upper_arm=function(S){var c=S.c;return '<path d="'+cap(S.dim.UA,26,23)+'" fill="'+c.skin+'"/><path d="'+P.sleeveL(S.dim.UA+4,19,17)+'" fill="'+c.shirt+'"/><path d="M-17,'+f(S.dim.UA-6)+' Q0,'+f(S.dim.UA+1)+' 17,'+f(S.dim.UA-6)+'" fill="none" stroke="'+c.shirt2+'" stroke-width="3" opacity=".6"/>'};
P.forearm=function(S){var c=S.c,F=S.dim.FA,s=F-24;/* ill-fitting shirt sleeve: stops short of the wrist, cuff band, bare wrist below */
  return '<path d="'+cap(F,24,19)+'" fill="'+c.skin+'"/><path d="M-16,-8 L16,-8 L14.5,'+f(s)+' L-14.5,'+f(s)+' Z" fill="'+c.shirt+'"/><rect x="-15.5" y="'+f(s-1)+'" width="31" height="9" rx="2.5" fill="'+c.shirtHi+'"/><path d="M-15.5,'+f(s+8)+' L15.5,'+f(s+8)+'" stroke="'+c.shirt2+'" stroke-width="1.6" opacity=".7"/>'};
P.hand=function(S,sd,kind){/* 1.x patch: palm ~1.27x wrist + 4 separate fingers + thumb, one flat shadow. fingers toward +y; wrist at origin. sd=+1: thumb (and index) on +x. kind "point": index finger out */
  var c=S.c,pt=kind==="point",L=pt?[14,9,9,44]:[17,21,24,22],X=[-6.9,-2.3,2.3,6.9],A=[4,1.4,-1.4,-4],o='',i;
  for(i=0;i<4;i++)o+='<g transform="rotate('+A[i]+' '+X[i]+' 20)"><path d="M'+f(X[i]-2.4)+',20 L'+f(X[i]-2.2)+','+f(20+L[i]-2.2)+' A2.2,2.2 0 0 0 '+f(X[i]+2.2)+','+f(20+L[i]-2.2)+' L'+f(X[i]+2.4)+',20 Z" fill="'+c.skin+'"/></g>';
  o+='<path d="M-8,-3 L8,-3 C10.4,6 10.6,15 9.6,24 L-9.6,24 C-10.6,15 -10.4,6 -8,-3 Z" fill="'+c.skin+'"/>';
  return o+'<g transform="scale('+sd+',1)"><g transform="translate(7.5,6) rotate(-32)"><path d="M-2.9,-3 L-2.7,15.6 A2.8,2.8 0 0 0 2.9,15.6 L3.2,-3 Z" fill="'+c.skin+'"/></g><path d="M9.4,5 C5,7 3.6,14 4.6,24 L9.6,24 C10.4,16 10.4,10 9.4,5 Z" fill="'+c.skin2+'"/></g>'};
P.handset=function(S){var c=S.c;/* origin = grip centre; earpiece up (-y), mouthpiece down */
  return '<path d="M-12,-72 Q0,-80 12,-72 L13,-52 Q0,-44 -13,-52 Z" fill="'+c.handset+'"/><path d="M-12,72 Q0,80 12,72 L13,52 Q0,44 -13,52 Z" fill="'+c.handset+'"/><rect x="-8" y="-56" width="16" height="112" rx="7" fill="'+c.handset2+'"/><rect x="-3" y="-50" width="3" height="96" rx="1.5" fill="#ffffff" opacity=".12"/>'};
P.prop_thermos=function(S){var c=S.c;/* habitual prop: steel thermos, origin = grip centre, upright. Detachable: drawn only when st.prop.on */
  return '<rect x="-14" y="-30" width="28" height="66" rx="9" fill="'+c.thermos+'"/><rect x="-14" y="-30" width="9" height="66" rx="4.5" fill="#ffffff" opacity=".22"/><rect x="2" y="-30" width="12" height="66" rx="6" fill="'+c.thermos2+'" opacity=".55"/>'+
    '<rect x="-14" y="-34" width="28" height="14" rx="5" fill="'+c.thermosCap+'"/><rect x="-14" y="-4" width="28" height="5" fill="'+c.thermosBand+'" opacity=".85"/><rect x="-14" y="22" width="28" height="4" fill="'+c.thermosBand+'" opacity=".5"/>'};
P.upper_leg=function(S,L){L=L||S.dim.UL;var c=S.c;/* thigh: hip at origin, knee at (0,L); stocky, tapers 50 -> 38 */
  return '<path d="M-25,-8 C-26,'+f(L*0.3)+' -22,'+f(L*0.72)+' -19,'+f(L+4)+' Q0,'+f(L+11)+' 19,'+f(L+4)+' C22,'+f(L*0.72)+' 26,'+f(L*0.3)+' 25,-8 Z" fill="'+c.pants+'"/>'+
    '<path d="M-6,'+f(L-13)+' Q1,'+f(L-6)+' 9,'+f(L-12)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.4" stroke-linecap="round" opacity=".7"/><path d="M-1,6 L-1,'+f(L-16)+'" stroke="'+c.pants2+'" stroke-width="1.6" opacity=".45"/>'};
P.lower_leg=function(S,L){L=L||S.dim.LL;var c=S.c,hb=L-15;/* shin: knee at origin, ankle at (0,L). hem ends above the ankle pivot so it breaks over the shoe */
  return '<path d="M-19,-6 C-20,'+f(L*0.26)+' -18,'+f(L*0.6)+' -16,'+f(hb-14)+' C-17,'+f(hb-6)+' -19.5,'+f(hb-3)+' -20,'+f(hb+1)+' Q0,'+f(hb+8)+' 20,'+f(hb+1)+' C19.5,'+f(hb-3)+' 17,'+f(hb-6)+' 16,'+f(hb-14)+' C18,'+f(L*0.6)+' 20,'+f(L*0.26)+' 19,-6 Z" fill="'+c.pants+'"/>'+
    '<path d="M-17,'+f(hb-9)+' Q0,'+f(hb-3)+' 17,'+f(hb-9)+'" fill="none" stroke="'+c.pants2+'" stroke-width="3" opacity=".75" stroke-linecap="round"/>'+
    '<path d="M-18,'+f(hb+3)+' Q0,'+f(hb+10)+' 18,'+f(hb+3)+' L18,'+f(hb+0)+' Q0,'+f(hb+7)+' -18,'+f(hb+0)+' Z" fill="'+c.pants2+'" opacity=".55"/>'};
P.pelvis=function(S,hs){var c=S.c,w=hs+31;/* high-waisted trouser seat + belt with buckle; hipY at origin; smooth crotch arc */
  return '<path d="M'+f(-w)+',-18 L'+f(w)+',-18 C'+f(w+1)+',6 '+f(w-1)+',20 '+f(w-8)+',36 Q0,56 '+f(-w+8)+',36 C'+f(-w+1)+',20 '+f(-w-1)+',6 '+f(-w)+',-18 Z" fill="'+c.pants+'"/>'+
    '<path d="M'+f(-w+1)+',2 Q0,6 '+f(w-1)+',2 L'+f(w-1)+',15 Q0,19 '+f(-w+1)+',15 Z" fill="'+c.belt+'"/><rect x="-12" y="1" width="24" height="16" rx="2.5" fill="'+c.buckle+'"/><rect x="-7" y="5" width="14" height="8" rx="1.5" fill="'+c.belt+'"/><path d="M0,22 L0,40" stroke="'+c.pants2+'" stroke-width="1.6" opacity=".5"/>'};
P.foot=function(S){var c=S.c;/* leather oxford, ankle pivot at origin; drawn toe toward +x; pose.legs.fl/fr flip it: fl:-1,fr:1 = toes OUT (default); sole bottom y=22. 70 wide, 40 tall */
  var o='';
  o+='<path d="M-25,12 C-27,19 -23,23 -15,23 L31,23 C39,23 45,19 47,12 L-25,10 Z" fill="'+c.sole+'"/>';
  o+='<path d="M-24,10 C-27,0 -26,-10 -19,-15 C-14,-18 -6,-18 -1,-16 L8,-12 C18,-8 28,-6 36,-3 C45,-1 49,5 47,11 C45,14 38,14 30,14 L-20,14 C-22,14 -24,13 -24,10 Z" fill="'+c.shoe+'"/>';
  o+='<path d="M-24,9 C-8,12 20,12 46,9 C46,12 42,14 34,14 L-20,14 C-23,14 -24,12 -24,9 Z" fill="'+c.shoe2+'" opacity=".55"/>';
  o+='<path d="M-24,10 C-27,0 -26,-10 -19,-15 L-16,-16 C-20,-6 -20,3 -18,10 Z" fill="'+c.shoe2+'" opacity=".7"/>';
  o+='<path d="M26,-4 C32,0 33,7 32,13" fill="none" stroke="'+c.shoe2+'" stroke-width="1.8" stroke-linecap="round"/><path d="M10,-11 C20,-8 32,-6 41,-2" fill="none" stroke="'+c.shoeHi+'" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>';
  o+='<path d="M-18,-14 C-13,-19 -5,-19 1,-15 C-4,-12 -12,-11 -18,-14 Z" fill="#2a1b14"/>';
  var k;for(k=0;k<3;k++){var x=3+k*6.5,y=-10+k*2.6;o+='<path d="M'+f(x-2.5)+','+f(y+4)+' L'+f(x+3)+','+f(y-2.5)+'" stroke="'+c.lace+'" stroke-width="2.2" stroke-linecap="round"/>'}
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
function drawPalych(st,ch){
  var S=state(st,ch),D=S.dim,c=S.c,p=S.p,u=S.uid,t=S.t,shk=st.shake||{x:0,y:0,r:0},o='',i;
  var pr=st.prop&&st.prop.on?st.prop:null,prH=pr?(pr.hand==="L"?"L":"R"):"R";
  var lean=nz(p.lean,0),sgf=(p.head.yaw||p.turn)<0?-1:1;
  var rotU=lean*5*sgf+shk.r,l16=lean*16,scU=1+lean*0.055;
  o+='<defs><filter id="'+u+'s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="'+c.shadow+'" flood-opacity=".38"/></filter>'+
     '<filter id="'+u+'s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="'+c.shadow+'" flood-opacity=".34"/></filter></defs>';
  o+='<g transform="translate('+f(shk.x)+','+f(shk.y)+')">';
  /* ---- legs (not leaned) ---- */
  if(st.stand){
    var lg=p.legs||{},hs=nz(lg.spread,30),asp=nz(lg.ank,44),kin=nz(lg.kin,2),kk=nz(lg.k,0),fsh=nz(lg.fsh,1),fs=nz(lg.fs,1),fr0=D.UL/(D.UL+D.LL);
    o+='<defs><filter id="'+u+'cb" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><filter id="'+u+'cb2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>';
    [-1,1].forEach(function(sd){var fd=sd<0?nz(lg.fl,1):nz(lg.fr,-1),gx=sd*asp+fd*5,gy=D.ankleY+20*fs;
      o+='<ellipse cx="'+f(gx+fd*3)+'" cy="'+f(gy+2)+'" rx="'+f(46*fs)+'" ry="8" fill="'+c.shadow+'" opacity=".55" filter="url(#'+u+'cb)"/>';
      o+='<ellipse cx="'+f(gx+fd*2)+'" cy="'+f(gy-0.5)+'" rx="'+f(33*fs)+'" ry="3.6" fill="'+c.shadow+'" opacity=".7" filter="url(#'+u+'cb2)"/>'});
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
  o+=sh(S,P.torso(S),0)+sh(S,P.neck(S),1)+sh(S,S.back?P.collar_back(S):P.collar(S),1);
  var swt=3*Math.sin(2*PI*0.5*t+R.seed)+2*Math.sin(2*PI*1.1*t+R.seed*2)-lean*8+shk.r*1+(p.turn||0)*-6;
  if(!S.back)o+=sh(S,'<g transform="translate('+f(tx+1)+',20) rotate('+f(swt)+')">'+P.tie(S)+'</g>',1);
  /* prop, side mode: tucked against the belly, drawn before the arms */
  if(pr&&pr.at==="side"){var ps=prH==="L"?-1:1;
    o+=sh(S,'<g transform="'+tr(tx+ps*46,140,ps*7)+'">'+P.prop_thermos(S)+'</g>',1)}
  var fid=nz(p.fid,0);
  [["L",SL,-1],["R",SR,1]].forEach(function(A){
    var nm=A[0],sp=p[nm]||{},Sh=A[1],sd=A[2],h=(sp.h||[sd*86,204]).slice();
    if(fid&&nm==="R"){h[0]+=fid*3*Math.sin(t*5.3+1);h[1]+=fid*2*Math.cos(t*4.1)}
    var r=ik(Sh,h,D.UA,D.FA,nz(sp.bend,sd*-1)),el=r.e,H=r.h;
    arms.push({nm:nm,Sh:Sh,el:el,H:H,sp:sp,sd:sd});
  });
  arms.forEach(function(A){
    o+=sh(S,'<g transform="'+tr(A.Sh[0],A.Sh[1],ang(A.Sh,A.el))+'">'+P.upper_arm(S)+'</g>',1);
    o+=sh(S,'<g transform="'+tr(A.el[0],A.el[1],ang(A.el,A.H))+'">'+P.forearm(S)+'</g>',1);
  });
  /* head */
  var hdx=nz(p.head.dx,0),hdy=nz(p.head.dy,0),tilt=nz(p.head.tilt,0),hp=[hdx,D.neckY+hdy];
  var hg='';
  /* bristle roots anchored to the CURRENT skull: x foreshortened with the yawed head width, shifted with the crop (fx*0.3),
     clamped to the flat top. Yaw 0 = the seeded rest roots exactly. */
  var tk=S.hwid/(D.hw*S.v.hw)*(0.8+0.2*S.ca),tsh=S.fx*0.3,tlim=S.hwid-12;
  for(i=0;i<R.tufts.length;i++){var T=R.tufts[i],sway=-tilt*0.2*T.k+1.2*Math.sin(2*PI*0.5*t+i*1.7+R.seed)+shk.r*-0.6;
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
  var must=S.v.mous>0?P.mustache(S):'';
  /* hair cap follows yaw by fx*0.3 but is clipped (unshifted wrapper, inside the shadow) to skull + rest cap silhouette, so it never overhangs the head */
  var hk='<defs><clipPath id="'+u+'hk"><path d="'+P.skull(S)+'"/><path d="'+P.capD(S)+'"/></clipPath></defs>';
  var hc=sh(S,hk+'<g clip-path="url(#'+u+'hk)"><g transform="translate('+f(S.fx*0.3)+',0)">'+P.hair(S)+'</g></g>',1);
  o+='<g transform="'+tr(hp[0],hp[1],tilt)+'">'+hair+headM+nose+face+must+hc+'</g>';}
  /* held receiver (drawn above head), then hands */
  arms.forEach(function(A){
    var sp=A.sp,rc=nz(sp.rcv,0);
    if(rc>0.02){var rr=nz(sp.rr,0),fdx=A.H[0]-A.el[0],fdy=A.H[1]-A.el[1],fl_=Math.sqrt(fdx*fdx+fdy*fdy)||1,hx=A.H[0]+fdx/fl_*24,hy=A.H[1]+fdy/fl_*24;
      var hc2=[hx,hy];
      if(st.tether){var tw=st.tether,bx=hc2[0]-Math.sin(rr*PI/180)*70,by2=hc2[1]+Math.cos(rr*PI/180)*70;
        var ex_=tw.x,ey_=tw.y,sag=tw.sag==null?70:tw.sag,mx=(bx+ex_)/2,my=(by2+ey_)/2+sag;
        o+='<g filter="url(#'+u+'s2)"><path d="M'+f(bx)+','+f(by2)+' C'+f(bx+(mx-bx)*0.3)+','+f(by2+sag*0.85)+' '+f(ex_+(mx-ex_)*0.3)+','+f(ey_+sag*0.6)+' '+f(ex_)+','+f(ey_)+'" fill="none" stroke="'+(tw.c||c.handset)+'" stroke-width="'+(tw.w||5)+'" stroke-linecap="round" opacity="'+f(rc)+'"/></g>'}
      o+=sh(S,'<g opacity="'+f(rc)+'" transform="'+tr(hx,hy,rr)+'">'+P.handset(S)+'</g>',1)}
    /* prop, hand mode: upright in the palm of the chosen hand, below the fingers */
    if(pr&&pr.at!=="side"&&A.nm===prH){var fdx2=A.H[0]-A.el[0],fdy2=A.H[1]-A.el[1],fl2=Math.sqrt(fdx2*fdx2+fdy2*fdy2)||1;
      o+=sh(S,'<g transform="'+tr(A.H[0]+fdx2/fl2*22,A.H[1]+fdy2/fl2*22,nz(sp.pr,0))+'">'+P.prop_thermos(S)+'</g>',1)}
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
HF.RIGS.palych=drawPalych;
/* seeded bristles along the flat top of the skull */
(function(){var H=HF.hash||function(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)},n=R.dim.tufts,T=[],i;
  for(i=0;i<n;i++){var u=(i+0.5)/n,x=-52+u*104+(H(R.seed*3.1+i)-0.5)*5;
    T.push({x:x,y:-134,h:9+H(R.seed*5.3+i)*7,w:5+H(R.seed*7.7+i)*2.5,lean:(x/52)*3+(H(R.seed*9.1+i)-0.5)*3,alt:H(R.seed*2.3+i)>0.5,k:0.6+H(R.seed*4.4+i)*0.8})}
  R.tufts=T})();
/* exploded-parts catalogue for the rig sheet: name, drawer, bbox [x0,y0,x1,y1] in part-local coords */
R.catalogue=function(st){
  var S=state(st),L=[];
  S.sg=1;S.as=0;
  L.push({n:"bristles x9",bb:[-60,-30,60,6],d:function(){var s='';for(var i=0;i<9;i++)s+='<g transform="translate('+f((i-4)*13)+',0) scale(1.4)">'+P.tuft(S,i)+'</g>';return s}});
  L.push({n:"hair crop",bb:[-70,-142,70,-66],d:function(){return P.hair(S)}});
  L.push({n:"head+ears",bb:[-78,-128,78,20],d:function(){return '<g transform="translate(-63,-58)">'+P.ear(S,-1)+'</g><g transform="translate(63,-58)">'+P.ear(S,1)+'</g>'+P.head(S)}});
  L.push({n:"nose",bb:[-18,-20,18,36],d:function(){return P.nose(S)}});
  L.push({n:"face layer",bb:[-64,-100,64,-10],d:function(){return P.face(S)}});
  L.push({n:"mustache",bb:[-40,-48,40,-14],d:function(){return P.mustache(S)}});
  L.push({n:"neck",bb:[-28,-64,28,14],d:function(){return P.neck(S)}});
  L.push({n:"torso+vest",bb:[-84,-14,84,246],d:function(){return P.torso(S)}});
  L.push({n:"collar",bb:[-56,-20,56,30],d:function(){return P.collar(S)}});
  L.push({n:"tie",bb:[-14,-10,14,66],d:function(){return P.tie(S)}});
  L.push({n:"upper arm",bb:[-24,-16,24,106],d:function(){return P.upper_arm(S)}});
  L.push({n:"forearm",bb:[-20,-10,20,98],d:function(){return P.forearm(S)}});
  L.push({n:"hand",bb:[-18,-8,32,54],d:function(){return P.hand(S,1)}});
  L.push({n:"handset",bb:[-18,-84,18,84],d:function(){return P.handset(S)}});
  L.push({n:"thermos (prop)",bb:[-20,-40,20,40],d:function(){return P.prop_thermos(S)}});
  L.push({n:"pelvis",bb:[-64,-20,64,56],d:function(){return P.pelvis(S,28)}});
  L.push({n:"upper leg",bb:[-26,-8,26,152],d:function(){return P.upper_leg(S)}});
  L.push({n:"lower leg",bb:[-22,-8,22,148],d:function(){return P.lower_leg(S)}});
  L.push({n:"oxford shoe",bb:[-28,-20,52,24],d:function(){return P.foot(S)}});
  return L};
/* char entry: dispatch to this rig */
HF.CHARS=HF.CHARS||{};
HF.CHARS.palych_cut={paper:true,rig:"palych",skin:"#dcab88",shade:"#b27857",hair:"#8f9396",build:1.2,top:"#c49a62",topShade:"#a07a46",pants:"#3d4557",shoe:"#4a3226",brow:"#6b675f",glasses:false,hr:64,vr:70};
})();
