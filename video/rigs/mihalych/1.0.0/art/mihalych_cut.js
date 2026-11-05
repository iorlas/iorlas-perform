/* art/mihalych_cut.js - Михалыч, cut-paper puppet (rig "mihalych" 0.1.0-draft). Flat filled paper, no outlines, one flat shadow shape per part
   (the part clipped to a half-plane rect, no gradients), soft drop shadow between layers (filter on an UNROTATED wrapper).
   Local space: origin = neck base (standing), +y down, hips y=210, floor y=478. Views: front (+ q: body/head turn up to 30 deg), side (faces +x), back.
   Pure function of (st, t). */
(function(){
var HF=window.HF=window.HF||{},PI=Math.PI;
function f(n){return Math.round(n*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function nz(v,d){return v==null||v!==v?d:v}
function shd(c,a){var n=parseInt(c.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;function q(x){return Math.max(0,Math.min(255,Math.round(x*a)))}return '#'+((1<<24)|(q(r)<<16)|(q(g)<<8)|q(b)).toString(16).slice(1)}
var RIG=HF.RIG=HF.RIG||{};HF.RIGS=HF.RIGS||{};
var R=RIG.mihalych={version:"1.0.0",seed:17,
 pal:{skin:"#dcab8c",skinSh:"#c4896d",skin2:"#d0a083",hair:"#9a9a98",hair2:"#7f7f7d",brow:"#86837b",
  stache:"#b4a37c",stache2:"#9b8a63",stain:"#c9a24a",frame:"#2b2f3d",lens:"#bed7eb",
  coat:"#8e9aa8",coatSh:"#74818f",coatHi:"#a2adba",coatDk:"#667381",button:"#59616e",
  card:"#8b6b58",cardSh:"#6f5445",shirt:"#d7d0bb",shirtSh:"#b9b19b",
  pants:"#444a5f",pantsSh:"#343a4c",boot:"#4b3a2c",bootSh:"#352a20",bootHi:"#6a5340",sole:"#17110f",lace:"#c9b79c",
  pen:"#3d6fa8",plier:"#c0553b",metal:"#a9b2bb",metalSh:"#8590a0",
  eyeW:"#f1ecdf",pupil:"#2a2024",mouth:"#6a3030",mouthIn:"#4a1f20",lip:"#c98572",teeth:"#e3d6a3",tongue:"#c8685f",
  cigW:"#efe9da",cigTip:"#c98a4a",ember:"#e0682f",chair:"#8a6a48",chairSh:"#6d5238",desk:"#7d6a54",deskSh:"#5f4f3e",crt:"#d3cbb1",crtSh:"#b3ab92",crtScreen:"#2c3a4a",crtGlow:"#3d5169",shadow:"#0b1020"},
 hs:{T:58,B:66,L:60,R:60,yL:2,yR:2,k:{tH:.6,rU:.6,rD:.66,bR:.62,bL:.62,lD:.66,lU:.6,tL:.6}},
 dim:{HS:1.2,sw:64,bel:12,shY:24,UA:90,FA:84,UL:123,LL:123,hipY:210,hemY:340,ankleY:454,floor:478,neckY:-20,headCY:-99,eyeY:-99},
 mouth:{y:46,w:12,dk:17,col:{teeth:"#e3d6a3",tongue:"#c8685f"}},
 visemes:{closed:0,small:.3,mid:.6,wide:.9}};
var P=HF.PARTS_M={};
/* ---------- geometry ---------- */
function eggSegs(a){var P0=[a.xt||0,-a.T],P1=[a.R,a.yR],P2=[a.xb||0,a.B],P3=[-a.L,a.yL],k=a.k;
 return [[P0,[P0[0]+k.tH*(P1[0]-P0[0]),P0[1]],[P1[0],P1[1]-k.rU*(P1[1]-P0[1])],P1],[P1,[P1[0],P1[1]+k.rD*(P2[1]-P1[1])],[P2[0]+k.bR*(P1[0]-P2[0]),P2[1]],P2],
  [P2,[P2[0]+k.bL*(P3[0]-P2[0]),P2[1]],[P3[0],P3[1]+k.lD*(P2[1]-P3[1])],P3],[P3,[P3[0],P3[1]-k.lU*(P3[1]-P0[1])],[P0[0]+k.tL*(P3[0]-P0[0]),P0[1]],P0]]}
function segPath(s){return 'M'+f(s[0][0][0])+','+f(s[0][0][1])+s.map(function(c){return ' C'+f(c[1][0])+','+f(c[1][1])+' '+f(c[2][0])+','+f(c[2][1])+' '+f(c[3][0])+','+f(c[3][1])}).join('')+' Z'}
function bz(c,t){var u=1-t;return [0,1].map(function(i){return u*u*u*c[0][i]+3*u*u*t*c[1][i]+3*u*t*t*c[2][i]+t*t*t*c[3][i]})}
function dbz(c,t){var u=1-t;return [0,1].map(function(i){return 3*u*u*(c[1][i]-c[0][i])+6*u*t*(c[2][i]-c[1][i])+3*t*t*(c[3][i]-c[2][i])})}
function edgeX(segs,y,side){var best=null;segs.forEach(function(s){for(var j=0;j<=200;j++){var p=bz(s,j/200);if(Math.abs(p[1]-y)<0.6){if(best===null||(side>0?p[0]>best:p[0]<best))best=p[0]}}});return best}
function segCheck(segs){var worst=0,mt=0,prev=null,i,j;for(i=0;i<4;i++){var a=dbz(segs[i],1),b=dbz(segs[(i+1)%4],0),d=(a[0]*b[0]+a[1]*b[1])/(Math.hypot(a[0],a[1])*Math.hypot(b[0],b[1]));worst=Math.max(worst,Math.acos(Math.min(1,d))*180/PI)}
 segs.forEach(function(s){for(j=0;j<=60;j++){var d=dbz(s,j/60),an=Math.atan2(d[1],d[0]);if(prev!==null){var dd=Math.abs(an-prev);if(dd>PI)dd=2*PI-dd;mt=Math.max(mt,dd*180/PI)}prev=an}});return {joint_deg:worst,max_step_deg:mt}}
R.skullSide=function(){var a=R.hs;return eggSegs({T:a.T,B:a.B,L:a.L+10,R:a.R-6,yL:2,yR:-6,xt:-6,xb:10,k:{tH:a.k.tH,rU:a.k.rU,rD:Math.max(.62,a.k.rD),bR:.62,bL:a.k.bL,lD:a.k.lD,lU:a.k.lU,tL:a.k.tL}})};
R.checkSkull=function(){return {front:segCheck(eggSegs(R.hs)),side:segCheck(R.skullSide())}};
function ik(S,H,u,l,bend){var dx=H[0]-S[0],dy=H[1]-S[1],d=Math.sqrt(dx*dx+dy*dy)||1,maxd=u+l-0.5,mind=Math.abs(u-l)+2;
 if(d>maxd){H=[S[0]+dx/d*maxd,S[1]+dy/d*maxd];dx=H[0]-S[0];dy=H[1]-S[1];d=maxd}if(d<mind)d=mind;
 var a=(u*u-l*l+d*d)/(2*d),h=Math.sqrt(Math.max(0,u*u-a*a)),n=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/n,uy=dy/n;
 return {e:[S[0]+ux*a-uy*h*bend,S[1]+uy*a+ux*h*bend],h:H}}
function ang(a,b){return Math.atan2(b[1]-a[1],b[0]-a[0])*180/PI-90}
function dist(a,b){return Math.hypot(b[0]-a[0],b[1]-a[1])}
function capD(L,w0,w1){var a=w0/2,b=w1/2;return 'M'+f(-a)+',0 L'+f(-b)+','+f(L)+' A'+f(b)+','+f(b)+' 0 0 0 '+f(b)+','+f(L)+' L'+f(a)+',0 A'+f(a)+','+f(a)+' 0 0 0 '+f(-a)+',0 Z'}
function layer(S,d,base,shade,rect){var id=S.id();return '<clipPath id="'+id+'"><path d="'+d+'"/></clipPath><path d="'+d+'" fill="'+base+'"/><g clip-path="url(#'+id+')"><rect x="'+f(rect[0])+'" y="'+f(rect[1])+'" width="'+f(rect[2])+'" height="'+f(rect[3])+'" fill="'+shade+'"/></g>'}
function tr(x,y,r,s){return 'translate('+f(x)+','+f(y)+')'+(r?' rotate('+f(r)+')':'')+(s!=null&&s!==1?' scale('+s+')':'')}
function fold(S,x0,y0,x1,y1,b){var mx=(x0+x1)/2,my=(y0+y1)/2,dx=x1-x0,dy=y1-y0,n=Math.hypot(dx,dy)||1,nx=-dy/n,ny=dx/n;return '<path d="M'+f(x0)+','+f(y0)+' Q'+f(mx+nx*b)+','+f(my+ny*b)+' '+f(x1)+','+f(y1)+' Q'+f(mx+nx*b*.25)+','+f(my+ny*b*.25)+' '+f(x0)+','+f(y0)+' Z" fill="'+S.c.coatDk+'" opacity=".5"/>'}
function recol(m,a,b){return m.split(a).join(b)}
/* ---------- expressions ---------- */
var EX0={open:1,lid:.38,shut:0,by:0,bdL:0,bdR:0,btL:5,btR:5,pup:1,gx:0,gy:0,mc:-.3,mw:1,mo:0,ms:0,mt:0,mg:0,wob:0,hol:0,pk:0,lk:0,bags:1,big:0,sweat:0};
function ex(o){var r={},k;for(k in EX0)r[k]=EX0[k];for(k in o)r[k]=o[k];return r}
var X={
 tired_neutral:ex({lid:.38,by:1,btL:5,btR:5,mc:-.3}),
 deadpan:ex({lid:.46,by:2,btL:0,btR:0,mc:-.05,mw:.9}),
 wince:ex({shut:1,by:4,btL:18,btR:18,mc:-.7,mw:1.05,mo:.2,mt:1,wob:1}),
 panic:ex({open:1.3,big:1,lid:0,lk:1,by:-15,btL:34,btR:34,pup:.4,mc:-1.5,mw:.62,mo:.85,mt:-1,mg:-1,sweat:1}),
 pretend:ex({lid:.3,by:-2,btL:8,btR:8,bdR:-3,mc:.4,mw:1.15,ms:1,mo:.14,mt:1,gx:.4}),
 shame:ex({lid:.55,by:-1,btL:22,btR:22,mc:-1,mw:.95,gy:1}),
 realize:ex({open:1.25,lid:.05,by:-4,bdL:-9,btL:2,btR:12,mc:0,mw:.7,mo:.5}),
 blank:ex({open:1.05,lid:.2,by:0,btL:0,btR:0,mc:-.05,mw:.95}),
 soft_smile:ex({lid:.55,by:-2,btL:-2,btR:-2,mc:1,mw:1.15,mo:.08,bags:1.2}),
 drag:ex({lid:.74,by:1,btL:6,btR:6,mc:0,mw:.5,mo:0,pk:1,hol:1})
};
R.expr=X;
/* ---------- poses ---------- */
function merge(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=merge(o[k]||{},b[k]);else o[k]=b[k]}return o}
var PB={view:"front",turn:0,lean:7,dy:0,sh:0,sit:0,walk:-1,flip:0,desk:0,
 head:{yaw:0,tilt:0,dx:0,dy:0},
 L:{h:[-70,202],bend:1,hand:"relaxed",rot:0,fs:1},R:{h:[70,202],bend:-1,hand:"relaxed",rot:0,fs:1},
 legs:{spread:22,ank:30,kin:3},
 N:{h:[8,200],bend:1,hand:"relaxed",rot:0},F:{h:[-2,202],bend:1,hand:"relaxed",rot:0},
 Ln:{a:[10,454]},Lf:{a:[-10,454]},prop:null};
var PS={
 stand_still:{lean:7},
 stand_slump:{lean:11,sh:6,head:{tilt:5,dy:6,dx:4},L:{h:[-66,204]},R:{h:[66,204]}},
 hold_receiver:{lean:7,turn:12,head:{yaw:14,tilt:-5},L:{h:[-100,-24],bend:-1,hand:"relaxed"},R:{h:[70,202]},prop:"handset_L"},
 smoke_hand:{lean:7,head:{tilt:2},R:{h:[36,56],bend:-1,hand:"pinch",rot:-10},L:{h:[-70,202]},prop:"cig_R"},
 pliers_hand:{lean:8,R:{h:[56,150],bend:-1,hand:"fist"},L:{h:[-70,202]},prop:"pliers_R"},
 stand_q:{turn:28,lean:7,head:{yaw:25,tilt:3}},
 stand_side:{view:"side",lean:12,N:{h:[8,200]},F:{h:[-2,202]},head:{tilt:6,dy:3}},
 stand_back:{view:"back",lean:6},
 sit_front:{sit:1,dy:115,desk:1,lean:10,legs:{spread:24,ank:30,kin:6},L:{h:[-52,150],bend:1,fs:.75},R:{h:[52,150],bend:-1,fs:.75},head:{tilt:3}},
 sit_side:{view:"side",sit:1,dy:115,desk:1,lean:20,N:{h:[84,112],bend:1},F:{h:[78,110],bend:1},head:{tilt:8,dy:4}},
 walk_0:{view:"side",walk:0,lean:10},walk_1:{view:"side",walk:1,lean:10},walk_2:{view:"side",walk:2,lean:10},walk_3:{view:"side",walk:3,lean:10},
 walk_4:{view:"side",walk:4,lean:10},walk_5:{view:"side",walk:5,lean:10},walk_6:{view:"side",walk:6,lean:10},walk_7:{view:"side",walk:7,lean:10}
};
R.poses={};for(var pn in PS)R.poses[pn]=merge(PB,PS[pn]);
/* ---------- state ---------- */
function mkS(st){var S={st:st,c:R.pal,d:R.dim,e:{},pose:st.pose||R.poses.stand_still,uid:(st.uid||"m")+"_",n:0};
 var k;for(k in EX0)S.e[k]=nz(st.expr&&st.expr[k],EX0[k]);
 S.eff=1-(1-S.e.mo)*(1-nz(st.mouth,0));
 S.id=function(){return S.uid+(S.n++)};S.skF=eggSegs(R.hs);S.skS=R.skullSide();
 S.gx=nz(st.gaze&&st.gaze.x,0)+S.e.gx;S.gy=nz(st.gaze&&st.gaze.y,0)+S.e.gy;return S}
R.mkS=mkS;
var SHD='filter="url(#ds)"';
/* ---------- parts: each returns markup around its own pivot (0,0) ---------- */
P.skull=function(S,mode){var c=S.c,sk=segPath(mode==="side"?S.skS:S.skF);return layer(S,sk,c.skin,c.skinSh,mode==="side"?[46,-100,80,220]:[44,-100,80,220])};
P.ear=function(S,s,mode){var c=S.c,L=R.hs.L;s=s||-1;
 if(mode==="side")return '<path d="M-14,-12 C-2,-18 6,-6 6,8 C4,20 -6,24 -12,20 C-18,14 -18,-6 -14,-12 Z" fill="'+c.skin2+'"/><path d="M-8,-4 C-2,-6 0,2 0,8 C-2,14 -8,14 -10,8 Z" fill="'+c.skinSh+'"/>';
 var ex=s*(L-1);return '<path d="M'+ex+',-14 C'+f(ex+s*17)+',-16 '+f(ex+s*19)+',6 '+f(ex+s*13)+',18 C'+f(ex+s*9)+',24 '+f(ex+s*3)+',22 '+ex+',16 Z" fill="'+c.skin2+'"/><path d="M'+f(ex+s*4)+',-6 C'+f(ex+s*11)+',-6 '+f(ex+s*12)+',6 '+f(ex+s*8)+',13 C'+f(ex+s*5)+',8 '+f(ex+s*4)+',2 '+f(ex+s*4)+',-6 Z" fill="'+c.skinSh+'"/>'};
P.hair=function(S,mode,idn){var c=S.c,L=R.hs.L,Rr=R.hs.R,T=R.hs.T,h=c.hair,h2=c.hair2;
 if(mode==="side"){L=L+10;
  return '<g clip-path="url(#'+idn+')"><path d="M-100,-110 L-20,-110 L-20,'+f(-T-4)+' C-34,'+f(-T+6)+' '+f(-(L-6))+',-30 '+f(-(L-8))+',-14 C'+f(-(L-8))+',4 '+f(-(L-18))+',16 '+f(-(L-28))+',28 L-100,28 Z" fill="'+h+'"/><path d="M'+f(-L+10)+',-30 C-30,'+f(-T+2)+' 10,'+f(-T+2)+' 34,'+f(-T+14)+' C10,'+f(-T+10)+' -30,'+f(-T+14)+' '+f(-L+22)+',-24 Z" fill="'+h+'"/></g>'}
 return '<g clip-path="url(#'+idn+')"><path d="M-100,-110 L-100,30 L'+f(-(L-26))+',30 C'+f(-(L-6))+',12 '+f(-(L-8))+',-24 '+f(-(L-22))+',-38 C'+f(-(L-30))+',-50 '+f(-(L-34))+','+f(-(T-2))+' -30,'+f(-(T+4))+' L-30,-110 Z M100,-110 L100,30 L'+f(Rr-26)+',30 C'+f(Rr-6)+',12 '+f(Rr-8)+',-24 '+f(Rr-22)+',-38 C'+f(Rr-30)+',-50 '+f(Rr-34)+','+f(-(T-2))+' 30,'+f(-(T+4))+' L30,-110 Z" fill="'+h+'"/>'+
 '<path d="M'+f(-L+6)+',-30 C'+f(-L+8)+','+f(-(T-8))+' 10,'+f(-(T+6))+' '+f(Rr-14)+','+f(-(T-14))+' C20,'+f(-(T-8))+' -20,'+f(-(T-8))+' '+f(-L+26)+',-34 Z" fill="'+h+'"/><path d="M'+f(-L+16)+','+f(-(T-12))+' C-10,'+f(-(T+2))+' 18,'+f(-(T-2))+' '+f(Rr-24)+','+f(-(T-14))+'" stroke="'+h2+'" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>'};
P.nose=function(S,mode,ns){var c=S.c,sk=c.skin;ns=ns||1;
 if(mode==="side"){var E=function(y){return edgeX(S.skS,y,1)},nb=E(-6),nx=E(14)+ns*13;
  return '<path d="M'+f(nb-3)+',-8 C'+f(nb+4)+',0 '+f(nx-8)+',8 '+f(nx)+',18 C'+f(nx+3)+',25 '+f(nx-6)+',28 '+f(E(26)-1)+',27 L'+f(E(26)-6)+',22 C'+f(nb+6)+',12 '+f(nb-2)+',4 '+f(nb-5)+',-4 Z" fill="'+shd(sk,.93)+'"/><path d="M'+f(nx-4)+',12 C'+f(nx+2)+',20 '+f(nx-2)+',26 '+f(E(26)-2)+',27 L'+f(E(24)-6)+',20 Z" fill="'+c.skinSh+'" opacity=".8"/>'}
 return '<g transform="scale('+ns+','+f(1+(ns-1)*.7)+')"><path d="M-5,-7 C-8,6 -14,12 -14,21 C-14,28 -4,30 0,29 C4,30 14,28 14,21 C14,12 8,6 5,-7 Z" fill="'+shd(sk,.9)+'"/><path d="M1,-7 C5,2 9,10 11,16 C14,24 12,28 0,29 Z" fill="'+c.skinSh+'" opacity=".85"/><ellipse cx="-6" cy="25" rx="3.2" ry="1.8" fill="#6b3d33" opacity=".7"/><ellipse cx="6" cy="25" rx="3.2" ry="1.8" fill="#6b3d33" opacity=".7"/></g>'};
P.face=function(S){var c=S.c,e=S.e;
 var swt=e.sweat>0?'<g transform="translate(48,-24) scale(1.25)"><path d="M0,-9 C6,-1 7,5 0,8 C-7,5 -6,-1 0,-9Z" fill="#bfe3f4"/><path d="M-1.6,-3 C-3.4,0 -3.4,3 -2.2,4" stroke="#fff" stroke-width="1.3" fill="none" opacity=".85" stroke-linecap="round"/></g>':'';
 var open=cl(e.open,0.1,1.4),lidF=e.lk?0:cl(e.lid+(1-open)*.5,0,.95),bg=e.big||0,rxE=8*(1+.36*bg);
 function eye(x,s){var ry=5.4*Math.min(open,1.2)*(1+.5*bg),gz=S.gx*3,gy=S.gy*1.6,q='',idc=S.id();
  q+='<clipPath id="'+idc+'"><ellipse cx="'+x+'" cy="0" rx="'+f(rxE)+'" ry="'+f(ry)+'"/></clipPath><ellipse cx="'+x+'" cy="0" rx="'+f(rxE)+'" ry="'+f(ry)+'" fill="'+c.eyeW+'"/>';
  q+='<g clip-path="url(#'+idc+')"><circle cx="'+f(x+gz+s*0.5)+'" cy="'+f(1.4-2.4*bg+gy)+'" r="'+f(3.2*e.pup+.4)+'" fill="'+c.pupil+'"/><circle cx="'+f(x+gz+1.5)+'"  cy="'+f(.4-2.4*bg+gy)+'" r="0.9" fill="'+c.eyeW+'"/>';
  var lidY=-ry+(e.shut>0.5?2*ry+1.5:lidF*2*ry);
  q+='<path d="M'+(x-10)+',-12 L'+(x+10)+',-12 L'+(x+10)+','+f(lidY)+' C'+f(x+4)+','+f(lidY+1.4)+' '+f(x-4)+','+f(lidY+1.4)+' '+(x-10)+','+f(lidY)+' Z" fill="'+shd(c.skin,.78)+'"/></g>';
  q+='<path d="M'+(x-9.5)+','+f(-ry-.6)+' C'+(x-6)+','+f(-ry-4.5)+' '+(x+6)+','+f(-ry-4.5)+' '+(x+9.5)+','+f(-ry-.6)+' L'+(x+8.5)+','+f(-ry+1.4)+' C'+(x+5)+','+f(-ry-2.4)+' '+(x-5)+','+f(-ry-2.4)+' '+(x-8.5)+','+f(-ry+1.4)+' Z" fill="'+shd(c.skin,.7)+'"/>';
  if(bg<.5)q+='<ellipse cx="'+x+'" cy="9.5" rx="10" ry="'+f(3.2*e.bags)+'" fill="'+shd(c.skin,.8)+'" opacity=".65"/>';return q}
 function brow(x,s,bt,bd){var b0=-12+e.by*.6+bd*.5,yi=b0-bt*.2,yo=b0+2,xi=x-s*10,xo=x+s*12,ay=(yi+yo)/2-4;
  return '<path d="M'+f(xi)+','+f(yi)+' C'+f(x-s*4)+','+f(ay)+' '+f(x+s*6)+','+f(ay)+' '+f(xo)+','+f(yo)+' L'+f(xo)+','+f(yo+3.6)+' C'+f(x+s*6)+','+f(ay+3.6)+' '+f(x-s*4)+','+f(ay+3.6)+' '+f(xi)+','+f(yi+3.6)+' Z" fill="'+c.brow+'"/>'}
 return eye(-23,-1)+eye(23,1)+brow(-23,-1,e.btL,e.bdL)+brow(23,1,e.btR,e.bdR)+swt};
P.mouth=function(S){var c=S.c,e=S.e,y=R.mouth.y,w=12*e.mw,eff=S.eff,dk=R.mouth.dk*eff,o='';
 var cL=y-e.mc*3.5+e.ms*2,cR=y-e.mc*3.5-e.ms*3,ty=y+e.mc*4;
 if(e.pk>.5&&eff<.3)return '<ellipse cx="0" cy="'+(y+1)+'" rx="8" ry="6" fill="'+c.lip+'"/><ellipse cx="0" cy="'+(y+1)+'" rx="3.6" ry="2.6" fill="'+c.mouthIn+'"/>';
 var top='M'+f(-w)+','+f(cL)+' Q0,'+f(ty)+' '+f(w)+','+f(cR);
 if(dk<1.2&&e.wob<.3)return '<path d="'+top+' Q0,'+f(ty+3.2)+' '+f(-w)+','+f(cL)+' Z" fill="'+c.mouth+'"/><path d="M'+f(-w*.8)+','+f(cL+3)+' Q0,'+f(ty+8)+' '+f(w*.8)+','+f(cR+3)+' Q0,'+f(ty+5.5)+' '+f(-w*.8)+','+f(cL+3)+' Z" fill="'+c.lip+'" opacity=".85"/>';
 var oh=Math.max(dk,e.wob>.3?4:0),id=S.id();
 var d=top+' C'+f(w*.75)+','+f(cR+oh*1.15)+' '+f(-w*.75)+','+f(cL+oh*1.15)+' '+f(-w)+','+f(cL)+' Z';
 o+='<clipPath id="'+id+'"><path d="'+d+'"/></clipPath><path d="'+d+'" fill="'+c.mouthIn+'"/><g clip-path="url(#'+id+')">';
 if(e.mt>=0&&(e.mt>.4||eff>.4))o+='<rect x="'+f(-w)+'" y="'+f(Math.min(cL,cR)-2)+'" width="'+f(2*w)+'" height="'+f(e.wob>.3?oh*.75:Math.min(6.5,oh*.5))+'" fill="'+c.teeth+'"/>';
 if(e.mg>=0&&(e.mg>.3||eff>.55))o+='<ellipse cx="0" cy="'+f(y+oh*1.0)+'" rx="'+f(w*.55)+'" ry="'+f(oh*.4)+'" fill="'+c.tongue+'"/>';
 o+='</g><path d="M'+f(-w*.85)+','+f(cL+oh*.95+1)+' C'+f(-w*.5)+','+f(cL+oh*1.2+7)+' '+f(w*.5)+','+f(cR+oh*1.2+7)+' '+f(w*.85)+','+f(cR+oh*.95+1)+' C'+f(w*.5)+','+f(cR+oh*1.0+3)+' '+f(-w*.5)+','+f(cL+oh*1.0+3)+' '+f(-w*.85)+','+f(cL+oh*.95+1)+' Z" fill="'+c.lip+'" opacity=".9"/>';return o};
P.mustache=function(S,mode){var c=S.c,m=c.stache;
 if(mode==="side"){var E=function(y){return edgeX(S.skS,y,1)},lx=E(26);return '<path d="M'+f(lx-25)+',26 C'+f(lx-8)+',22 '+f(lx+6)+',24 '+f(lx+8)+',32 C'+f(lx+8)+',42 '+f(lx+3)+',50 '+f(lx-1)+',48 C'+f(lx-6)+',37 '+f(lx-10)+',36 '+f(lx-25)+',38 Z" fill="'+m+'"/><ellipse cx="'+f(lx-4)+'" cy="30" rx="7" ry="3" fill="'+c.stain+'" opacity=".5"/>'}
 return '<path d="M0,24 C14,22 26,25 31,34 C34,44 30,52 25,50 C22,42 12,36 0,36 C-12,36 -22,42 -25,50 C-30,52 -34,44 -31,34 C-26,25 -14,22 0,24 Z" fill="'+m+'"/><path d="M-10,28 C-5,26 5,26 10,28 C6,33 -6,33 -10,28 Z" fill="'+c.stain+'" opacity=".55"/><path d="M0,24 L0,36" stroke="'+c.stache2+'" stroke-width="1.6" opacity=".5"/>'};
P.glasses=function(S,mode){var c=S.c,fr=c.frame,ln="rgba(190,215,235,.28)",o='';
 if(mode==="side"){var E=function(y){return edgeX(S.skS,y,1)},gx=E(0)-16;return '<circle cx="'+f(gx+4)+'" cy="1" r="13" fill="'+ln+'"/><path fill-rule="evenodd" d="M'+f(gx-9.5)+',1 a13.5,13.5 0 1,0 27,0 a13.5,13.5 0 1,0 -27,0 Z M'+f(gx-6.6)+',1 a10.6,10.6 0 1,1 21.2,0 a10.6,10.6 0 1,1 -21.2,0 Z" fill="'+fr+'"/><path d="M'+f(gx-8)+',-2 L-16,-5 L-16,-2.5 L'+f(gx-8)+',0.5 Z" fill="'+fr+'"/>'}
 [-1,1].forEach(function(s){o+='<circle cx="'+s*23+'" cy="1" r="14.5" fill="'+ln+'"/><path fill-rule="evenodd" d="M'+(s*23-15.5)+',1 a15.5,15.5 0 1,0 31,0 a15.5,15.5 0 1,0 -31,0 Z M'+f(s*23-12.6)+',1 a12.6,12.6 0 1,1 25.2,0 a12.6,12.6 0 1,1 -25.2,0 Z" fill="'+fr+'"/>'});
 return o+'<path d="M-8,-1 C-3,-5 3,-5 8,-1 L8,1.6 C3,-2 -3,-2 -8,1.6 Z" fill="'+fr+'"/><path d="M-38,-2 L-52,-6 L-52,-3.5 L-38,0.5 Z M38,-2 L52,-6 L52,-3.5 L38,0.5 Z" fill="'+fr+'"/>'};
P.cig=function(S){var c=S.c;return '<rect x="-2.6" y="-4" width="5.2" height="34" rx="2.6" fill="'+c.cigW+'"/><rect x="-2.6" y="22" width="5.2" height="8" rx="2.4" fill="'+c.cigTip+'"/>'};
P.cheek=function(S){var c=S.c,h=S.e.hol;if(h<.3)return '';return '<path d="M-38,14 C-30,22 -26,36 -22,46 C-30,40 -36,30 -38,14 Z" fill="'+c.skinSh+'" opacity=".7"/><path d="M38,14 C30,22 26,36 22,46 C30,40 36,30 38,14 Z" fill="'+c.skinSh+'" opacity=".7"/>'};
P.wrinkles=function(S){var c=S.c;return '<path d="M-30,-31 C-12,-36 12,-36 30,-31 L30,-29.5 C12,-34 -12,-34 -30,-29.5 Z" fill="'+c.skinSh+'" opacity=".45"/><path d="M-17,14 C-24,24 -25,34 -22,42 C-24,34 -22,24 -14,12 Z" fill="'+c.skinSh+'" opacity=".55"/><path d="M17,14 C24,24 25,34 22,42 C24,34 22,24 14,12 Z" fill="'+c.skinSh+'" opacity=".55"/>'};
function scaleSegs(segs,sx,sy,cy){return segs.map(function(c){return c.map(function(p){return [p[0]*sx,cy+(p[1]-cy)*sy]})})}
P.head_back=function(S){var c=S.c,L=R.hs.L,sk=segPath(S.skF),id=S.id(),o='';
 [-1,1].forEach(function(s){o+='<g '+SHD+'>'+P.ear(S,s,"front")+'</g>'});
 o+='<g '+SHD+'>'+layer(S,sk,c.hair,shd(c.hair,.82),[44,-100,80,220])+'</g>';
 var inner=segPath(scaleSegs(S.skF,.8,.78,16));
 o+='<clipPath id="'+id+'"><path d="'+sk+'"/></clipPath><g clip-path="url(#'+id+')"><rect x="-100" y="-120" width="200" height="104" fill="'+c.skin+'"/><rect x="44" y="-120" width="60" height="104" fill="'+c.skinSh+'"/></g>';
 o+=layer(S,inner,c.skin,c.skinSh,[44,-100,80,220]).replace('<path d="'+inner+'" fill="'+c.skin+'"/>','<path d="'+inner+'" fill="'+c.skin+'"/>');
 o+='<path d="M-52,-8 L-64,-12 L-64,-9.5 L-52,-5 Z M52,-8 L64,-12 L64,-9.5 L52,-5 Z" fill="'+c.frame+'"/>';
 o+='<g transform="translate('+f(-(L+8))+',-12) rotate(-18)">'+P.cig(S)+'</g>';return o};
function headFront(S,yaw){var c=S.c,o='',sk=segPath(S.skF),id=S.id(),cy=Math.cos(yaw*PI/180),sy=Math.sin(yaw*PI/180),fx=sy*40,L=R.hs.L;
 o+='<clipPath id="'+id+'"><path d="'+sk+'"/></clipPath><g transform="scale('+f(cy)+',1)">';
 o+='<g '+SHD+'>'+P.ear(S,-1,"front")+(yaw<8?P.ear(S,1,"front"):'')+'</g>';
  var cgx=yaw<8?(L+7):-(L+7),cgr=yaw<8?18:-18;o+='<g transform="translate('+f(cgx)+',-12) rotate('+cgr+')">'+P.cig(S)+'</g>';
 o+='<g '+SHD+'>'+P.skull(S,"front")+'</g></g>';
 o+='<g transform="translate('+f(fx)+',0) scale('+f(Math.max(.9,cy))+',1)">'+P.cheek(S)+P.wrinkles(S)+P.face(S)+'<g transform="translate('+f(fx*.35)+',0)">'+P.nose(S,"front",1.0)+'</g>'+P.mouth(S)+'<g transform="translate('+f(fx*.2)+',0)">'+P.mustache(S)+'</g>'+P.glasses(S)+'</g>';
 o+='<g transform="scale('+f(cy)+',1)"><g clip-path="url(#'+id+')">'+P.hair(S,"front",id)+'</g></g>';
 return o}
function headSide(S){var c=S.c,o='',sk=segPath(S.skS),id=S.id(),e=S.e;
 o+='<clipPath id="'+id+'"><path d="'+sk+'"/></clipPath><g '+SHD+'>'+P.skull(S,"side")+'</g>'+P.hair(S,"side",id);
 o+='<g '+SHD+'>'+P.ear(S,-1,"side")+'</g><g transform="translate(-9,-14) rotate(52)">'+P.cig(S)+'</g>';
 var E=function(y){return edgeX(S.skS,y,1)},ex=E(0)-18,ry=5.4*Math.min(e.open,1.2)*(1+.42*(e.big||0)),rxS=8*(1+.26*(e.big||0)),lidF=e.lk?0:cl(e.lid+(1-e.open)*.5,0,.95),lidY=-ry+(e.shut>.5?2*ry+1.5:lidF*2*ry);
 var idc=S.id();o+='<clipPath id="'+idc+'"><ellipse cx="'+f(ex)+'" cy="0" rx="'+f(rxS)+'" ry="'+f(ry)+'"/></clipPath><ellipse cx="'+f(ex)+'" cy="0" rx="'+f(rxS)+'" ry="'+f(ry)+'" fill="'+c.eyeW+'"/><g clip-path="url(#'+idc+')"><circle cx="'+f(ex+4+S.gx*2)+'" cy="'+f(1.4+S.gy)+'" r="'+f(3.2*e.pup+.3)+'" fill="'+c.pupil+'"/><path d="M'+f(ex-10)+',-12 L'+f(ex+10)+',-12 L'+f(ex+10)+','+f(lidY)+' L'+f(ex-10)+','+f(lidY)+' Z" fill="'+shd(c.skin,.78)+'"/></g>';
 o+='<path d="M'+f(ex-9)+','+f(-ry-.6)+' C'+f(ex-5)+','+f(-ry-5)+' '+f(ex+6)+','+f(-ry-5)+' '+f(ex+10)+','+f(-ry-.6)+' L'+f(ex+9)+','+f(-ry+1.4)+' C'+f(ex+5)+','+f(-ry-2.6)+' '+f(ex-5)+','+f(-ry-2.6)+' '+f(ex-8)+','+f(-ry+1.4)+' Z" fill="'+shd(c.skin,.7)+'"/>';
 var b0=-12+e.by*.6,yi=b0-e.btR*.2;o+='<path d="M'+f(ex-8)+','+f(yi+1)+' C'+f(ex-2)+','+f(b0-3)+' '+f(ex+8)+','+f(b0-3)+' '+f(ex+13)+','+f(b0+2)+' L'+f(ex+13)+','+f(b0+5.6)+' C'+f(ex+8)+','+f(b0+.6)+' '+f(ex-2)+','+f(b0+.6)+' '+f(ex-8)+','+f(yi+4.6)+' Z" fill="'+c.brow+'"/><ellipse cx="'+f(ex)+'" cy="9.5" rx="9" ry="'+f(3.2*e.bags)+'" fill="'+shd(c.skin,.8)+'" opacity=".6"/>';
 o+='<g '+SHD+'>'+P.nose(S,"side",1.0)+'</g>';
 if(e.hol>.3)o+='<path d="M'+f(E(20)-26)+',16 C'+f(E(30)-30)+',26 '+f(E(36)-30)+',38 '+f(E(40)-24)+',46 C'+f(E(34)-34)+',38 '+f(E(26)-34)+',26 '+f(E(14)-18)+',14 Z" fill="'+c.skinSh+'" opacity=".7"/>';
 o+=P.glasses(S,"side");
 var my=R.mouth.y,mx=E(my)-2,eff=S.eff,dk=R.mouth.dk*.7*eff,wi=14*e.mw;
 if(e.pk>.5&&eff<.3)o+='<ellipse cx="'+f(mx-3)+'" cy="'+(my+1)+'" rx="5" ry="5.5" fill="'+c.lip+'"/><ellipse cx="'+f(mx-2)+'" cy="'+(my+1)+'" rx="2" ry="2.4" fill="'+c.mouthIn+'"/>';
 else{
 if(dk>1.2)o+='<path d="M'+f(mx-wi)+','+f(my)+' C'+f(mx-wi*.5)+','+f(my-1.5)+' '+f(mx)+','+f(my-1.5)+' '+f(mx+3)+','+f(my)+' C'+f(mx+1)+','+f(my+dk*1.1)+' '+f(mx-wi*.7)+','+f(my+dk*1.1)+' '+f(mx-wi)+','+f(my)+' Z" fill="'+c.mouthIn+'"/><rect x="'+f(mx-wi*.7)+'" y="'+f(my-.6)+'" width="'+f(wi*.6)+'" height="'+f(Math.min(4,dk*.45))+'" fill="'+c.teeth+'"/>';
 else o+='<path d="M'+f(mx-wi)+','+f(my)+' C'+f(mx-wi*.5)+','+f(my-1.5)+' '+f(mx)+','+f(my-1.5)+' '+f(mx+3)+','+f(my)+' C'+f(mx)+','+f(my+4.5)+' '+f(mx-wi*.8)+','+f(my+4.5)+' '+f(mx-wi)+','+f(my)+' Z" fill="'+c.mouth+'"/>';
 o+='<path d="M'+f(mx-wi+2)+','+f(my+3+dk)+' C'+f(mx-wi*.5)+','+f(my+9+dk)+' '+f(mx)+','+f(my+9+dk)+' '+f(mx+2)+','+f(my+3+dk)+' C'+f(mx-2)+','+f(my+6.5+dk)+' '+f(mx-wi*.6)+','+f(my+6.5+dk)+' '+f(mx-wi+2)+','+f(my+3+dk)+' Z" fill="'+c.lip+'" opacity=".85"/>'}
 o+=P.mustache(S,"side");return o}
/* ---------- body parts ---------- */
P.neck=function(S){var c=S.c;return layer(S,'M-19,-34 L-21,10 L21,10 L19,-34 Z',shd(c.skin,.9),c.skinSh,[4,-40,30,60])};
P.neck_side=function(S){var c=S.c;return layer(S,'M-30,-40 L-34,12 L24,12 L22,-40 Z',shd(c.skin,.9),c.skinSh,[-6,-50,40,70])};
function rr(x,y,w,h,r){return 'M'+f(x+r)+','+f(y)+' H'+f(x+w-r)+' A'+r+','+r+' 0 0 1 '+f(x+w)+','+f(y+r)+' V'+f(y+h-r)+' A'+r+','+r+' 0 0 1 '+f(x+w-r)+','+f(y+h)+' H'+f(x+r)+' A'+r+','+r+' 0 0 1 '+f(x)+','+f(y+h-r)+' V'+f(y+r)+' A'+r+','+r+' 0 0 1 '+f(x+r)+','+f(y)+' Z'}
function circ(cx,cy,r){return 'M'+f(cx-r)+','+f(cy)+' a'+r+','+r+' 0 1,0 '+2*r+',0 a'+r+','+r+' 0 1,0 '+(-2*r)+',0 Z'}
function cpath(S,o){var sw=S.d.sw,hem=o.hem,kl=o.kl,kr=o.kr,cx=o.cx,g=o.gap,v=o.vent,sg=o.swing||0;
 function X(x){return f(x<0?x*kl:x*kr)}
 var hr=hem-sg,hl=hem+sg*.5,yH=Math.min(250,hem-34),ym=function(a,b){return f(yH+(hem-yH)*a)};
 return 'M'+X(-sw)+',30 C'+X(-sw)+',8 '+X(-34)+',3 '+X(-22)+',3 L'+f(cx)+',64 L'+X(22)+',3 C'+X(34)+',3 '+X(sw)+',8 '+X(sw)+',30'
 +' C'+X(sw+2)+',70 '+X(sw-3)+',120 '+X(sw-3)+',165 C'+X(sw-3)+',195 '+X(sw+14)+','+f(yH-35)+' '+X(sw+16)+','+f(yH)+' C'+X(sw+18)+','+ym(.45)+' '+X(sw+28)+','+ym(.8)+' '+X(sw+34)+','+f(hr)
 +' C'+X(sw+20)+','+f(hr+8)+' '+f(cx+30)+','+f(hem+6)+' '+f(cx+g)+','+f(hem)+' L'+f(cx)+','+f(hem-v)+' L'+f(cx-g)+','+f(hem)
 +' C'+f(cx-30)+','+f(hem+6)+' '+X(-sw-20)+','+f(hl+8)+' '+X(-sw-34)+','+f(hl)
 +' C'+X(-sw-28)+','+ym(.8)+' '+X(-sw-18)+','+ym(.45)+' '+X(-sw-16)+','+f(yH)+' C'+X(-sw-14)+','+f(yH-35)+' '+X(-sw+3)+',195 '+X(-sw+3)+',165 C'+X(-sw+3)+',120 '+X(-sw-2)+',70 '+X(-sw)+',30 Z'}
P.torso=function(S,mode,o){var c=S.c,sw=S.d.sw,bel=S.d.bel;o=o||{};var kl=o.kl||1,kr=o.kr||1,cx=o.cx||0;
 function X(x){return f(x<0?x*kl:x*kr)}
 if(mode==="side")return layer(S,'M-62,70 C-70,16 -34,4 0,4 C34,4 54,16 58,52 C'+(62+bel*.6)+',100 '+(56+bel*.6)+',150 50,214 L-56,214 Z',c.card,c.cardSh,[10,0,70,230])+'<path d="M16,10 L34,40 L40,214 L22,214 Z" fill="'+c.shirt+'"/>';
 var d='M'+X(-sw)+',30 C'+X(-sw)+',8 '+X(-34)+',3 0,3 C'+X(34)+',3 '+X(sw)+',8 '+X(sw)+',30 C'+X(sw+bel)+',80 '+X(sw+bel)+',150 '+X(sw-6)+',215 L'+X(-sw+6)+',215 C'+X(-sw-bel)+',150 '+X(-sw-bel)+',80 '+X(-sw)+',30 Z';
 return layer(S,d,c.card,c.cardSh,[cx+16,0,100,230])+'<path d="M'+X(-18)+',3 L'+f(cx)+',60 L'+X(18)+',3 Z" fill="'+c.shirt+'"/><path d="M'+X(-12)+',3 L'+X(-3)+',12 L'+f(cx)+',60 Z" fill="'+c.shirtSh+'" opacity=".7"/><path d="M'+X(-22)+',3 L'+X(-14)+',3 L'+f(cx)+',60 L'+f(cx-4)+',62 Z M'+X(22)+',3 L'+X(14)+',3 L'+f(cx)+',60 L'+f(cx+4)+',62 Z" fill="'+c.cardSh+'"/>'+[88,128,168].map(function(y){return '<circle cx="'+f(cx)+'" cy="'+y+'" r="3.4" fill="#3a2a20"/>'}).join('')};
P.coat=function(S,mode,o){var c=S.c,sw=S.d.sw,out='';
 if(typeof o==='number')o={hem:o};o=Object.assign({hem:340,gap:3,vent:16,kl:1,kr:1,cx:0,swing:6},o||{});var hem=o.hem,kl=o.kl,kr=o.kr,cx=o.cx;
 function X(x){return f(x<0?x*kl:x*kr)}
 if(mode==="side"){var d='M-72,128 C-92,96 -90,52 -62,24 C-46,8 -30,4 0,4 C34,4 56,16 62,52 C68,100 66,160 64,216 L-62,216 C-64,190 -68,160 -72,128 Z';
  return layer(S,d,c.coat,c.coatSh,[10,0,80,230])+'<path d="M-26,3 C-10,-6 14,-6 30,8 L14,34 C0,28 -14,26 -26,30 Z" fill="'+c.coatHi+'"/><path d="M-12,40 C-4,90 2,140 -2,190 L20,190 C28,140 20,90 8,40 Z" fill="'+c.coatDk+'" opacity=".32"/><rect x="14" y="100" width="34" height="36" rx="4" fill="'+c.coatSh+'"/><rect x="26" y="84" width="5" height="26" rx="2" fill="'+c.pen+'"/><rect x="18" y="160" width="36" height="40" rx="4" fill="'+c.coatSh+'"/><g transform="translate(36,168) rotate(6)">'+P.pliers(S)+'</g>'+fold(S,-62,168,52,170,10)+fold(S,-80,80,-70,140,-6)}
 var d2=cpath(S,o);
 if(mode==="back"){return layer(S,d2,c.coat,c.coatSh,[10,0,140,hem+20])+'<path d="M-28,2 C-10,-6 10,-6 28,2 L22,24 C8,18 -8,18 -22,24 Z" fill="'+c.coatHi+'"/>'+fold(S,-50,172,50,172,10)+fold(S,-sw-4,236,-sw+22,290,-8)+fold(S,sw+4,240,sw-22,292,8)}
 out+=layer(S,d2,c.coat,c.coatSh,[cx+10,0,140,hem+20]);
 out+='<path d="M'+X(-30)+',12 L'+f(cx-9)+',84 L'+f(cx)+',90 L'+X(-14)+',34 Z M'+X(30)+',12 L'+f(cx+9)+',84 L'+f(cx)+',90 L'+X(14)+',34 Z" fill="'+c.coatDk+'" opacity=".38"/>';
 out+='<path d="M'+X(-30)+',0 L'+X(-22)+',3 L'+f(cx)+',64 L'+f(cx-9)+',72 L'+X(-36)+',24 Z M'+X(30)+',0 L'+X(22)+',3 L'+f(cx)+',64 L'+f(cx+9)+',72 L'+X(36)+',24 Z" fill="'+c.coatHi+'"/>';
 out+='<path d="M'+X(-44)+',50 C'+X(-38)+',90 '+X(-36)+',140 '+X(-40)+',184 L'+X(-28)+',184 C'+X(-24)+',140 '+X(-26)+',92 '+X(-30)+',52 Z M'+X(44)+',50 C'+X(38)+',90 '+X(36)+',140 '+X(40)+',184 L'+X(28)+',184 C'+X(24)+',140 '+X(26)+',92 '+X(30)+',52 Z" fill="'+c.coatDk+'" opacity=".3"/>';
 out+=[96,150,204,258,312].filter(function(y){return y<hem-8}).map(function(y){return '<circle cx="'+f(cx+9)+'" cy="'+y+'" r="4" fill="'+c.button+'"/>'}).join('');
 out+='<path d="'+rr(X(sw-46),96,34*kr,34,3)+'" fill="'+c.coatSh+'"/><path d="'+rr(X(sw-41),80,5,26,2)+'" fill="'+c.pen+'"/>';
 if(hem>280){out+='<path d="'+rr(X(-sw+2),206,40*kl,44,3)+'" fill="'+c.coatSh+'"/><path d="'+rr(X(sw-42),206,40*kr,44,3)+'" fill="'+c.coatSh+'"/><g transform="translate('+X(-sw+22)+',214) rotate(-10)">'+P.pliers(S)+'</g>'}
 out+=fold(S,X(-50),172,X(46),172,9);
 if(hem>280)out+=fold(S,X(-sw-2),240,X(-sw+22),296,-8)+fold(S,X(sw+2),244,X(sw-22),298,8);
 return out};
P.coat_flap=function(S,which,H){var c=S.c;H=H==null?140:H;which=which||'front';
 if(which==='front')return layer(S,'M-30,0 L38,0 C40,44 46,'+f(H*.7)+' 52,'+H+' C24,'+(H+6)+' -6,'+(H+4)+' -28,'+H+' Z',c.coat,c.coatSh,[8,-2,70,H+20])+fold(S,-10,H-30,30,H-26,6);
 return layer(S,'M-24,0 L26,0 C30,'+f(H*.4)+' 34,'+f(H*.7)+' 36,'+H+' C8,'+(H+6)+' -22,'+(H+4)+' -40,'+H+' C-34,'+f(H*.7)+' -28,'+f(H*.35)+' -24,0 Z',shd(c.coat,.92),c.coatSh,[-4,-2,60,H+20])};
P.desk=function(S,mode,hipY){var c=S.c,fl=S.d.floor,o='';hipY=hipY==null?325:hipY;var y0=hipY-58;
 if(mode==="side"){o+='<path d="M246,'+(y0-14)+' L246,'+(y0-124)+' L324,'+(y0-124)+' L376,'+(y0-92)+' L376,'+(y0-44)+' L324,'+(y0-14)+' Z" fill="'+c.crt+'"/><path d="M300,'+(y0-124)+' L324,'+(y0-124)+' L376,'+(y0-92)+' L376,'+(y0-44)+' L324,'+(y0-14)+' L300,'+(y0-14)+' Z" fill="'+c.crtSh+'"/><path d="'+rr(246,y0-118,10,96,3)+'" fill="'+c.crtScreen+'"/><path d="'+rr(268,y0-14,84,14,3)+'" fill="'+c.crtSh+'"/>';
  o+=layer(S,rr(64,y0,340,16,4),c.desk,c.deskSh,[64,y0+8,340,10])+'<path d="'+rr(372,y0+16,14,fl-(y0+16),3)+'" fill="'+c.deskSh+'"/>';return o}
 o+='<path d="'+rr(70,y0-124,120,110,12)+'" fill="'+c.crt+'"/><path d="'+rr(130,y0-124,60,110,12)+'" fill="'+c.crtSh+'"/><path d="'+rr(80,y0-114,84,78,9)+'" fill="'+c.crtScreen+'"/><path d="'+rr(88,y0-106,40,32,6)+'" fill="'+c.crtGlow+'"/><path d="'+rr(100,y0-14,68,14,3)+'" fill="'+c.crtSh+'"/>';
 o+=layer(S,rr(-170,y0,340,16,4),c.desk,c.deskSh,[-170,y0+8,340,10]);return o};
P.pliers=function(S){var c=S.c;return '<path d="M-3.5,16 L-7,-16 L-1.5,-16 L0,-5 L1.5,-16 L7,-16 L3.5,16 Z" fill="'+c.plier+'"/><path d="M-6,-16 C-6,-30 -1,-32 0,-24 C1,-32 6,-30 6,-16 Z" fill="'+c.metal+'"/><circle cx="0" cy="-8" r="2.4" fill="'+c.metalSh+'"/>'};
P.upper_arm=function(S,L){var c=S.c;L=L||88;return layer(S,capD(L,32,28),c.coat,c.coatSh,[2,-4,40,L+30])};
P.forearm=function(S,L){var c=S.c;L=L||84;return layer(S,capD(L,28,24),c.coat,c.coatSh,[2,-4,40,L+30])+'<path d="'+rr(-12,L-6,24,10,4)+'" fill="'+c.shirt+'"/><path d="'+rr(-14.5,L-16,29,12,4)+'" fill="'+c.coatHi+'"/>'+fold(S,-10,8,10,8,5)};
P.hand=function(S,kind,s){var c=S.c,sk=c.skin,th,tips='',d;kind=kind||"relaxed";if(kind==="mitten")kind="relaxed";s=s||1;var sh=shd(sk,.92);
 if(kind==="fist"){d=rr(-11,-2,22,26,8)+' '+circ(-6.6,26,5)+' '+circ(0,27.5,5)+' '+circ(6.6,26,5);th='<g transform="translate('+f(-s*1)+',17) rotate('+f(-s*10)+')"><path d="'+rr(-9,0,18,8,4)+'" fill="'+sh+'"/></g>';tips='<ellipse cx="-6.6" cy="29.5" rx="3" ry="2.4" fill="'+c.stain+'" opacity=".7"/><ellipse cx="0" cy="31" rx="3" ry="2.4" fill="'+c.stain+'" opacity=".7"/>'}
 else if(kind==="pinch"){d=rr(-10,-2,20,24,6)+' '+rr(-3.5,18,11,28,5.5)+' '+circ(-6.5,26,4.6);th='<g transform="translate('+f(-s*9)+',8) rotate('+f(s*34)+')"><path d="'+rr(-3.6,0,7.2,20,3.6)+'" fill="'+sh+'"/></g>';tips='<ellipse cx="2" cy="44" rx="4.4" ry="3" fill="'+c.stain+'" opacity=".8"/>'}
 else{d=rr(-10,-2,20,26,6)+' '+rr(-10,20,6.8,23,3.4)+' '+rr(-3.4,20,6.8,26,3.4)+' '+rr(3.2,20,6.8,22,3.4);th='<g transform="translate('+f(-s*10.5)+',6) rotate('+f(s*14)+')"><path d="'+rr(-3.6,0,7.2,19,3.6)+'" fill="'+sh+'"/></g>';tips='<ellipse cx="-6.6" cy="40.5" rx="2.9" ry="2.8" fill="'+c.stain+'" opacity=".7"/><ellipse cx="0" cy="43.5" rx="2.9" ry="2.8" fill="'+c.stain+'" opacity=".7"/><ellipse cx="6.6" cy="39.5" rx="2.9" ry="2.8" fill="'+c.stain+'" opacity=".6"/>'}
 return layer(S,d,sk,c.skinSh,[2,-6,40,70])+th+tips};
P.pelvis=function(S,mode){var c=S.c;if(mode==="side")return layer(S,'M-44,-4 C-52,10 -50,40 -30,50 L40,50 C56,40 54,6 44,-4 Z',c.pants,c.pantsSh,[8,-6,60,70]);return layer(S,'M-50,-4 L50,-4 C54,16 52,40 46,52 L-46,52 C-52,40 -54,16 -50,-4 Z',c.pants,c.pantsSh,[8,-6,60,70])};
P.upper_leg=function(S,L,w0,w1){var c=S.c;L=L||120;return layer(S,capD(L,w0||46,w1||40),c.pants,c.pantsSh,[2,-4,40,L+30])};
P.lower_leg=function(S,L,w0,w1){var c=S.c;L=L||118;return layer(S,capD(L,w0||40,w1||34),c.pants,c.pantsSh,[2,-4,40,L+30])+'<ellipse cx="0" cy="'+f(L-4)+'" rx="'+f((w1||34)/2+1)+'" ry="5" fill="'+c.pantsSh+'"/>'};
P.boot=function(S,mode,s){var c=S.c;s=s||1;
 if(mode==="side")return layer(S,'M-17,-34 L15,-34 L15,-8 C26,-6 40,0 42,12 C43,20 36,22 30,22 L-17,22 C-21,22 -19,2 -17,-10 Z',c.boot,c.bootSh,[-30,4,90,30])+'<path d="M-17,-34 L15,-34 L15,-28 L-17,-28 Z" fill="'+c.bootSh+'"/><path d="M24,0 C34,2 40,8 40,14 C34,14 30,8 24,6 Z" fill="'+c.bootHi+'" opacity=".8"/><rect x="-17" y="16" width="62" height="6" fill="'+c.sole+'"/><path d="M-4,-20 L8,-18 M-4,-12 L8,-10" stroke="'+c.lace+'" stroke-width="2.2" opacity=".8"/>';
 return '<g transform="rotate('+f(s*9)+')"><rect x="-19" y="-34" width="38" height="36" rx="7" fill="'+c.boot+'"/><rect x="-19" y="-34" width="38" height="7" rx="3" fill="'+c.bootSh+'"/><path d="M'+f(s*-17)+',-8 C'+f(s*-17)+',-18 '+f(s*14)+',-18 '+f(s*18)+',-6 C'+f(s*34)+',2 '+f(s*36)+',18 '+f(s*28)+',20 L'+f(s*-17)+',20 C'+f(s*-22)+',20 '+f(s*-19)+',-2 '+f(s*-17)+',-8 Z" fill="'+c.boot+'"/><path d="M'+f(s*18)+',-4 C'+f(s*30)+',2 '+f(s*34)+',12 '+f(s*28)+',16 C'+f(s*24)+',8 '+f(s*20)+',2 '+f(s*16)+',0 Z" fill="'+c.bootHi+'" opacity=".8"/><rect x="'+(s>0?-19:-31)+'" y="16" width="50" height="5" fill="'+c.sole+'"/></g>'};
P.cigarette=function(S,lit){var c=S.c;return '<rect x="-2.6" y="-34" width="5.2" height="36" rx="2.6" fill="'+c.cigW+'"/><rect x="-2.6" y="-34" width="5.2" height="8" rx="2.4" fill="'+c.cigTip+'"/>'+(lit?'<circle cx="0" cy="-35" r="2.6" fill="'+c.ember+'"/>':'')};
P.handset=function(S){return '<rect x="-7" y="-34" width="14" height="68" rx="6" fill="#1c2430"/><rect x="-7" y="-34" width="14" height="16" rx="6" fill="#2d3a4c"/><rect x="-7" y="18" width="14" height="16" rx="6" fill="#2d3a4c"/>'};
P.chair=function(S,mode,hipY){var c=S.c,fl=S.d.floor;hipY=hipY==null?325:hipY;var seat=hipY+16,o='';
 if(mode==="side")return '<rect x="-80" y="'+(seat-170)+'" width="16" height="'+(fl-seat+170)+'" rx="5" fill="'+c.chair+'"/><rect x="-66" y="'+(seat-120)+'" width="14" height="8" fill="'+c.chairSh+'"/><rect x="-78" y="'+seat+'" width="154" height="14" rx="4" fill="'+c.chair+'"/><rect x="62" y="'+(seat+10)+'" width="10" height="'+(fl-seat-10)+'" fill="'+c.chairSh+'"/><rect x="-60" y="'+(seat+10)+'" width="10" height="'+(fl-seat-10)+'" fill="'+c.chairSh+'"/>';
 return '<rect x="-76" y="'+(seat-176)+'" width="12" height="'+(fl-seat+176)+'" rx="4" fill="'+c.chairSh+'"/><rect x="64" y="'+(seat-176)+'" width="12" height="'+(fl-seat+176)+'" rx="4" fill="'+c.chairSh+'"/><rect x="-66" y="'+(seat-166)+'" width="132" height="14" rx="4" fill="'+c.chair+'"/><rect x="-66" y="'+(seat-126)+'" width="132" height="12" rx="4" fill="'+c.chair+'"/><rect x="-72" y="'+seat+'" width="144" height="14" rx="4" fill="'+c.chair+'"/>'};
/* ---------- assembly ---------- */
function G(A,part){return '<g '+SHD+'><g transform="'+tr(A[0],A[1],A[2])+'">'+part+'</g></g>'}
function dark(S,m){var c=S.c;['pants','pantsSh','boot','bootSh','bootHi','sole','coat','coatSh','coatDk','coatHi','skin','skinSh','stain','shirt'].forEach(function(k){m=recol(m,c[k],shd(c[k],.74))});return m}
function armFront(S,s,sp,sh,shx){var d=S.d,fs=sp.fs||1,Sh=[shx,36+sh],r=ik(Sh,sp.h,d.UA*fs,d.FA*fs,sp.bend),E=r.e,H=r.h;
 return {o:G([Sh[0],Sh[1],ang(Sh,E)],P.upper_arm(S,dist(Sh,E)))+G([E[0],E[1],ang(E,H)],P.forearm(S,dist(E,H)))+G([H[0],H[1]-3,ang(E,H)+(sp.rot||0)],P.hand(S,sp.hand,s)),E:E,H:H}}
function headTf(S,hx,hy,tilt,sg){var hs=S.d.HS;return '<g transform="translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+',0,'+f(R.hs.B*hs)+') scale('+f(hs*(sg||1))+','+hs+')">'}
function wrapUp(S,inner,dy,lean){var d=S.d;return '<g transform="'+tr(0,dy)+'"><g transform="translate(0,'+d.hipY+') skewX('+f(-lean*.4)+') translate(0,'+(-d.hipY)+')">'+inner+'</g></g>'}
function drawFront(S){var pz=S.pose,d=S.d,c=S.c,dy=pz.dy||0,sit=pz.sit,sh=pz.sh||0,lean=pz.lean||0,sw=d.sw;
 var turn=Math.abs(pz.turn||0),cb=Math.cos(turn*PI/180),sb=Math.sin(turn*PI/180),q=turn>3,kl=1,kr=1,cx=0;
 if(q){kl=(sw*cb+26*sb)/sw;kr=(sw*cb-26*sb)/sw;cx=26*sb*.9}
 var yawH=pz.head.yaw||0,hip=d.hipY+dy,legs='',kin=pz.legs.kin,sp=pz.legs.spread*(q?cb:1),ox=q?4:0;
 if(sit){legs+=P.chair(S,"front",hip);
  [-1,1].forEach(function(s){var hp=[s*sp,hip+2],kn=[hp[0]+s*8,hip+18],an=[s*(pz.legs.ank+4),d.ankleY];
   legs+='<g '+SHD+'><ellipse cx="'+f(hp[0])+'" cy="'+f(hip+14)+'" rx="24" ry="22" fill="'+c.pants+'"/></g>'+G([kn[0],kn[1],ang(kn,an)],P.lower_leg(S,dist(kn,an)))+G([an[0],an[1]+3,0],P.boot(S,"front",s))})}
 else [-1,1].forEach(function(s){var hp=[s*sp+ox,hip+2],an=[s*pz.legs.ank*(q?cb:1)+ox,d.ankleY],kn=[(hp[0]+an[0])/2+s*kin,(hp[1]+an[1])/2];
   legs+=G([hp[0],hp[1],ang(hp,kn)],P.upper_leg(S,dist(hp,kn)))+G([kn[0],kn[1],ang(kn,an)],P.lower_leg(S,dist(kn,an)))+G([an[0],an[1]+3,q?7:0],P.boot(S,"front",q?1:s))});
 var o={hem:sit?250:d.hemY,gap:sit?22:3,vent:sit?60:16,kl:kl,kr:kr,cx:cx,swing:6};
 var body='<g '+SHD+'>'+P.neck(S)+'</g><g '+SHD+'>'+P.torso(S,"front",o)+'</g>';
 var lx=-(sw*kl-6),rx=sw*kr-6,Lp=JSON.parse(JSON.stringify(pz.L)),Rp=JSON.parse(JSON.stringify(pz.R));
 if(q){Rp.h=[Rp.h[0]*kr+6,Rp.h[1]];Lp.h=[Lp.h[0]*kl,Lp.h[1]];rx=sw*kr-18}
 var aL=armFront(S,-1,Lp,sh,lx),aR=armFront(S,1,Rp,sh,rx);
 var coat='<g '+SHD+'>'+P.coat(S,"front",o)+'</g>',arms,prop='';
 if(q)body+=aR.o+coat,arms=aL.o;else body+=coat,arms=aL.o+aR.o;
 if(pz.prop==="cig_R")prop='<g transform="'+tr(aR.H[0]+8,aR.H[1]+34,-30)+'">'+P.cigarette(S,1)+'</g>';
 if(pz.prop==="pliers_R")prop='<g transform="'+tr(aR.H[0],aR.H[1]+22,-4)+'">'+P.pliers(S)+'</g>';
 if(pz.prop==="handset_L")prop='<g transform="'+tr(aL.H[0]-2,aL.H[1]-8,6)+'">'+P.handset(S)+'</g>';
 var hs=d.HS,hy=-(20+R.hs.B*hs),sg=yawH<0?-1:1;
 var head=headTf(S,pz.head.dx+lean*.55,hy+pz.head.dy+lean*.9,pz.head.tilt+lean*.25,sg)+headFront(S,Math.abs(yawH))+'</g>';
 var out=legs;
 if(sit&&pz.desk){out+=wrapUp(S,body,dy,lean)+P.desk(S,"front",hip)+wrapUp(S,arms+prop+head,dy,lean)}
 else out+=wrapUp(S,body+arms+prop+head,dy,lean);
 return out}
function walkFeet(k){var ph=k/8,S0=62,lift=26;function foot(p){p=((p%1)+1)%1;var x,y;if(p<.5){x=S0*(1-4*p);y=0}else{var u=(p-.5)*2;x=-S0+2*S0*(u*u*(3-2*u));y=lift*Math.sin(PI*u)}return [x,y]}
 function heel(p){p=((p%1)+1)%1;if(p<.5)return p>.36?-16*((p-.36)/.14):0;if(p<.62)return -16;return p>.9?12:-4}
 return {n:foot(ph),f:foot(ph+.5),hn:heel(ph),hf:heel(ph+.5)}}
function drawSide(S){var pz=S.pose,d=S.d,c=S.c,dy=pz.dy||0,sit=pz.sit,lean=pz.lean||0,walk=pz.walk>=0,wl=walk?walkFeet(pz.walk):null;
 if(walk)dy=14+3*Math.cos(PI*pz.walk/2);var hip=d.hipY+dy,hp=[0,hip+4];
 function leg(an,ft,far){var r=ik(hp,an,d.UL,d.LL,-1),kn=r.e,ank=r.h,m=G([hp[0],hp[1],ang(hp,kn)],P.upper_leg(S,dist(hp,kn),44,38))+G([kn[0],kn[1],ang(kn,ank)],P.lower_leg(S,dist(kn,ank),38,32))+G([ank[0],ank[1]+3,ft],P.boot(S,"side"));return far?dark(S,m):m}
 var an,af,ftn=0,ftf=0;
 if(walk){an=[wl.n[0]+4,d.ankleY-wl.n[1]];af=[wl.f[0]-4,d.ankleY-wl.f[1]];ftn=wl.hn;ftf=wl.hf}
 else if(sit){an=[122,d.ankleY];af=[116,d.ankleY]}else{an=pz.Ln.a;af=pz.Lf.a}
 var o=sit?P.chair(S,"side",hip):'';
 o+=leg(af,ftf,1)+leg(an,ftn,0);
 o+='<g '+SHD+'><g transform="'+tr(0,hip)+'">'+P.pelvis(S,"side")+'</g></g>';
 if(sit&&pz.desk)o+=P.desk(S,"side",hip);
 if(!sit){var fa=2,ra=-2;if(walk){var fx=Math.max(wl.n[0],wl.f[0]),bx=Math.min(wl.n[0],wl.f[0]);fa=-(fx/62)*17-2;ra=-(bx/62)*17+2}else{fa=-2;ra=3}
  var H=d.hemY-200;o+='<g '+SHD+'><g transform="'+tr(-18,hip-14,ra)+'">'+P.coat_flap(S,"rear",H)+'</g></g><g '+SHD+'><g transform="'+tr(28,hip-14,fa)+'">'+P.coat_flap(S,"front",H)+'</g></g>'}
 var nsp=pz.N,fsp=pz.F;
 if(walk){var th=function(x){var a=x/62*0.85,L=d.UA+d.FA-10;return {h:[Math.sin(a)*L,34+Math.cos(a)*L],bend:1,hand:"relaxed",rot:0}};nsp=th(wl.f[0]);fsp=th(wl.n[0])}
 function armSide(sp,far){var Sh=[far?-2:2,34],r=ik(Sh,sp.h,d.UA,d.FA,sp.bend),E=r.e,H=r.h,m=G([Sh[0],Sh[1],ang(Sh,E)],P.upper_arm(S,dist(Sh,E)))+G([E[0],E[1],ang(E,H)],P.forearm(S,dist(E,H)))+G([H[0],H[1]-3,ang(E,H)+(sp.rot||0)],P.hand(S,sp.hand,-1));return {o:far?dark(S,m):m,H:H}}
 var aF=armSide(fsp,1),aN=armSide(nsp,0);
 var up='<g '+SHD+'>'+P.neck_side(S)+'</g>'+aF.o+'<g '+SHD+'>'+P.torso(S,"side")+'</g><g '+SHD+'>'+P.coat(S,"side")+'</g>'+aN.o;
 if(pz.prop==="cig_R")up+='<g transform="'+tr(aN.H[0]+4,aN.H[1]+28,-40)+'">'+P.cigarette(S,1)+'</g>';
 var hs=d.HS,hy=-(20+R.hs.B*hs);
 var head=headTf(S,pz.head.dx+lean*.6+2,hy+pz.head.dy+lean*.55+3,pz.head.tilt+lean*.25,1)+headSide(S)+'</g>';
 var drape='';
 if(sit)drape='<g '+SHD+'><path d="M-52,'+(hip-16)+' C20,'+(hip-20)+' 90,'+(hip-20)+' 128,'+(hip-14)+' C144,'+(hip-8)+' 146,'+(hip+22)+' 138,'+(hip+38)+' C128,'+(hip+44)+' 118,'+(hip+40)+' 112,'+(hip+32)+' L-52,'+(hip+30)+' Z" fill="'+c.coat+'"/>'+fold(S,-30,hip+14,120,hip+16,8)+'</g>';
 return o+drape+'<g transform="'+tr(0,dy)+'"><g transform="rotate('+f(lean)+',0,'+d.hipY+')">'+up+head+'</g></g>'}
function drawBack(S){var pz=S.pose,d=S.d,c=S.c,lean=pz.lean||0,hip=d.hipY,legs='';
 [-1,1].forEach(function(s){var hp=[s*pz.legs.spread,hip+2],a=[s*pz.legs.ank,d.ankleY],kn=[(hp[0]+a[0])/2+s*pz.legs.kin,(hp[1]+a[1])/2];
  legs+=G([hp[0],hp[1],ang(hp,kn)],P.upper_leg(S,dist(hp,kn)))+G([kn[0],kn[1],ang(kn,a)],P.lower_leg(S,dist(kn,a)))+G([a[0],a[1]+3,0],P.boot(S,"front",s))});
 var up='<g '+SHD+'>'+P.neck(S)+'</g><g '+SHD+'>'+P.coat(S,"back",{hem:d.hemY,gap:8,vent:70,swing:6})+'</g>';
 var aL=armFront(S,-1,pz.L,pz.sh||0,-(d.sw-6)),aR=armFront(S,1,pz.R,pz.sh||0,d.sw-6);up+=aL.o+aR.o;
 var hs=d.HS,hy=-(20+R.hs.B*hs);
 var head=headTf(S,pz.head.dx,hy+pz.head.dy+lean*.7,pz.head.tilt,1)+P.head_back(S)+'</g>';
 return legs+wrapUp(S,up+head,0,-lean*.3/.4*-1*0+lean*-0.75)}
R.draw=function(st){var S=mkS(st),pz=S.pose;
 var defs='<defs><filter id="ds" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="2" dy="4" stdDeviation="3.2" flood-color="'+S.c.shadow+'" flood-opacity=".32"/></filter></defs>';
 var body=pz.view==="side"?drawSide(S):pz.view==="back"?drawBack(S):drawFront(S);
 var floor='<ellipse cx="0" cy="'+(S.d.floor+4)+'" rx="'+(pz.view==="side"?100:86)+'" ry="9" fill="'+S.c.shadow+'" opacity=".28"/>';
 return defs+floor+(pz.flip?'<g transform="scale(-1,1)">'+body+'</g>':body)};
HF.RIGS.mihalych=R.draw;HF.CHARS=HF.CHARS||{};HF.CHARS.mihalych_cut={id:"mihalych"};
HF.EXPR_M=X;HF.POSES_M=R.poses;
})();
