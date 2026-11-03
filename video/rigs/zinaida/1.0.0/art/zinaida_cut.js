/* art/zinaida_cut.js - Зинаида, the office's old beige CRT computer, cut-paper object rig (rig "zinaida" 1.0.0).
   Faceless object character. Flat filled paper, no outlines, no gradients, one flat shadow shape per solid (face clipped to the solid's rounded silhouette),
   soft drop shadow between layers (filter on an UNROTATED wrapper). Personality = screen content, LED, shake/hum, cables, dust, dent, sticker, cigarette burn.
   Space: matches mihalych 1.0.0 sit poses: x=0 is the user's centre, floor y=478, desk top y=267 (hip 325 - 58), CRT x 70..190, desk leg side x 372..386.
   Tiny solid model: boxes/frustums in (x, y down, z away from the screen plane), yaw 0 (front) .. 90 (side, screen on the left, as the mihalych side desk), small pitch.
   Pure function of (state, t); no randomness (hash noise). */
(function(){
var HF=window.HF=window.HF||{},PI=Math.PI;
function f(n){return Math.round(n*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function nz(v,d){return v==null||v!==v?d:v}
function sub(a,b){return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
var RIG=HF.RIG=HF.RIG||{};HF.RIGS=HF.RIGS||{};
var R=RIG.zinaida={version:"1.0.0",seed:5,
 pal:{crt:"#d4c590",crtSh:"#b3a46c",crtHi:"#e4d8ab",kb:"#cdbb7c",kbSh:"#ab9a5e",kbHi:"#a99a5e",key:"#e2d6a8",keySh:"#bfb07e",keyDown:"#a99a66",keyGap:"#3b3328",
  tower:"#d0c08a",towerSh:"#af9f68",towerHi:"#e0d3a4",bay:"#8d8153",bayDk:"#2a2c30",mouse:"#cdbb7c",mouseSh:"#ab9a5e",mouseHi:"#ddcf9a",
  recess:"#232a2e",glass:"#12201f",amber:"#f3b04a",amberDim:"#b9822c",teal:"#2f6b73",win:"#cfc8b3",winBar:"#2d4f8a",winBtn:"#e5dfcc",red:"#c0392b",bsod:"#1f3fb0",bsodHd:"#c9d3f2",bsodTx:"#e7ecff",
  heart:"#e0556b",sleepZ:"#8fb4d8",offGlass:"#1b2732",offRefl:"#26343f",sand:"#f3b04a",hgGlass:"#55737a",hgFrame:"#cfc7ad",
  ledGreen:"#4fbf72",ledAmber:"#f2a93b",ledRed:"#ff5a4a",ledPink:"#ff8aa6",ledOff:"#6a6a58",
  tape:"#eadfb8",tapeInk:"#2b2723",sticker:"#f1ede0",stain:"#7a5a2e",stainCore:"#3b2a18",dust:"#b9ae95",dust2:"#a2977d",
  desk:"#7d6a54",deskSh:"#5f4f3e",deskHi:"#8f7b63",cableDk:"#20222a",cableGr:"#8d8a7c",strip:"#d7cfb6",stripSh:"#b4aa8c",chair:"#394258",shadow:"#0b1020"},
 dim:{floor:478,deskY:267,deskLeft:-170,deskRight:210,deskZ0:-182,deskZ1:158,xp:130,sideShift:116,crtX0:70,crtX1:190,screen:[80,-114,84,78],towerX0:40,towerX1:124,towerY0:328,pivotX:130}};
var P={};
/* ---------- projection ---------- */
function mkS(st){
 var pz=resolvePose(st.pose),ex=resolveState(st),th=pz.yaw*PI/180,ph=pz.pitch*PI/180;
 var S={c:R.pal,d:R.dim,pz:pz,ex:ex,t:nz(st.t,0),uid:st.uid||"z",n:0,th:th,ph:ph,ct:Math.cos(th),sn:Math.sin(th),cp:Math.cos(ph),sp:Math.sin(ph),T:R.dim.sideShift};
 S.dy=-182*S.ct*S.sp;S.vt=[S.sn*S.cp,-S.sp,-S.ct*S.cp];
 S.id=function(){return S.uid+"c"+(S.n++)};
 return S}
function pj(S,p){var xp=S.d.xp,x=p[0],y=p[1],z=p[2],D=-(x-xp)*S.sn+z*S.ct;
 return [xp+(x-xp)*S.ct+z*S.sn+S.T*S.sn,478+(y-478)*S.cp-D*S.sp+S.dy]}
function mat(S,o,a,b){ /* affine of a face plane: o = origin 3D, a = 3D step of local x, b = 3D step of local y */
 var p0=pj(S,o),pa=pj(S,[o[0]+a[0],o[1]+a[1],o[2]+a[2]]),pb=pj(S,[o[0]+b[0],o[1]+b[1],o[2]+b[2]]);
 return 'matrix('+[pa[0]-p0[0],pa[1]-p0[1],pb[0]-p0[0],pb[1]-p0[1],p0[0],p0[1]].map(function(v){return Math.round(v*1000)/1000}).join(',')+')'}
function matFront(S,z){return mat(S,[0,0,z],[1,0,0],[0,1,0])}   /* local (x,y) = world x,y on the plane z */
function matSide(S,x){return mat(S,[x,0,0],[0,0,1],[0,1,0])}    /* local (z,y) on the plane x */
function matTop(S,y){return mat(S,[0,y,0],[1,0,0],[0,0,1])}     /* local (x,z) on the plane y */
/* ---------- shapes ---------- */
function polyD(q){return q.map(function(p,i){return (i?'L':'M')+f(p[0])+','+f(p[1])}).join(' ')+' Z'}
function rpath(pts,r){var n=pts.length,o='';
 for(var i=0;i<n;i++){var p0=pts[(i+n-1)%n],p1=pts[i],p2=pts[(i+1)%n],d1=Math.hypot(p0[0]-p1[0],p0[1]-p1[1])||1,d2=Math.hypot(p2[0]-p1[0],p2[1]-p1[1])||1,rr=Math.min(r,d1/2.2,d2/2.2),
  a=[p1[0]+(p0[0]-p1[0])*rr/d1,p1[1]+(p0[1]-p1[1])*rr/d1],b=[p1[0]+(p2[0]-p1[0])*rr/d2,p1[1]+(p2[1]-p1[1])*rr/d2];
  o+=(i?'L':'M')+f(a[0])+','+f(a[1])+' Q'+f(p1[0])+','+f(p1[1])+' '+f(b[0])+','+f(b[1])+' '}
 return o+'Z'}
function rr(x,y,w,h,r){return 'M'+f(x+r)+','+f(y)+' H'+f(x+w-r)+' Q'+f(x+w)+','+f(y)+' '+f(x+w)+','+f(y+r)+' V'+f(y+h-r)+' Q'+f(x+w)+','+f(y+h)+' '+f(x+w-r)+','+f(y+h)+' H'+f(x+r)+' Q'+f(x)+','+f(y+h)+' '+f(x)+','+f(y+h-r)+' V'+f(y+r)+' Q'+f(x)+','+f(y)+' '+f(x+r)+','+f(y)+' Z'}
function hull(pts){pts=pts.slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1]});
 function cr(o,a,b){return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])}
 var lo=[],up=[],i;for(i=0;i<pts.length;i++){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],pts[i])<=0)lo.pop();lo.push(pts[i])}
 for(i=pts.length-1;i>=0;i--){while(up.length>1&&cr(up[up.length-2],up[up.length-1],pts[i])<=0)up.pop();up.push(pts[i])}
 lo.pop();up.pop();return lo.concat(up)}
function blob(cx,cy,r,k){var n=7,pts=[],i;for(i=0;i<n;i++){var a=i/n*2*PI,rd=r*(.72+.5*hash(k*13+i));pts.push([cx+Math.cos(a)*rd,cy+Math.sin(a)*rd*.8])}
 var o='M'+f((pts[0][0]+pts[n-1][0])/2)+','+f((pts[0][1]+pts[n-1][1])/2);
 for(i=0;i<n;i++){var p=pts[i],q=pts[(i+1)%n];o+=' Q'+f(p[0])+','+f(p[1])+' '+f((p[0]+q[0])/2)+','+f((p[1]+q[1])/2)}return o+' Z'}
/* ---------- solids ---------- */
function box(x0,x1,y0,y1,z0,z1){return [[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]]}
function frust(a,b,z0,z1){return [[a[0],a[2],z0],[a[1],a[2],z0],[a[1],a[3],z0],[a[0],a[3],z0],[b[0],b[2],z1],[b[1],b[2],z1],[b[1],b[3],z1],[b[0],b[3],z1]]}
var FACES=[[0,1,2,3],[4,5,6,7],[0,3,7,4],[1,5,6,2],[0,1,5,4],[3,2,6,7]];
function normals(V){var c=[0,0,0];V.forEach(function(v){c[0]+=v[0]/8;c[1]+=v[1]/8;c[2]+=v[2]/8});
 return FACES.map(function(fc){var n=cross(sub(V[fc[1]],V[fc[0]]),sub(V[fc[2]],V[fc[0]])),m=Math.hypot(n[0],n[1],n[2])||1,fcen=[0,0,0];
  fc.forEach(function(i){fcen[0]+=V[i][0]/4;fcen[1]+=V[i][1]/4;fcen[2]+=V[i][2]/4});n=[n[0]/m,n[1]/m,n[2]/m];
  if(dot(n,sub(fcen,c))<0)n=[-n[0],-n[1],-n[2]];return n})}
/* col {b base, s shade, h hi}; opt.strip: front-face flat shadow strip share (0..1) */
function solid(S,V,col,r,opt){opt=opt||{};var Q=V.map(function(v){return pj(S,v)}),id=S.id(),hd=rpath(hull(Q),r),N=normals(V),
 o='<clipPath id="'+id+'"><path d="'+hd+'"/></clipPath><path d="'+hd+'" fill="'+col.b+'"/><g clip-path="url(#'+id+')">';
 FACES.forEach(function(fc,k){var n=N[k];if(dot(n,S.vt)<=.001)return;
  var c=n[1]<-.5?col.h:n[0]>.3?col.s:col.b;if(c===col.b)return;
  o+='<path d="'+polyD(fc.map(function(i){return Q[i]}))+'" fill="'+c+'" stroke="'+c+'" stroke-width="1.2" stroke-linejoin="round"/>'});
 if(opt.strip!=null&&S.sn<.35){var w=(V[1][0]-V[0][0])*opt.strip*(1-S.sn/.35),x1=V[1][0],z=V[0][2];
  o+='<path d="'+polyD([[x1-w,V[0][1],z],[x1,V[0][1],z],[x1,V[3][1],z],[x1-w,V[3][1],z]].map(function(p){return pj(S,p)}))+'" fill="'+col.s+'"/>'}
 return o+'</g>'}
function wrapDs(m){return '<g filter="url(#ds)">'+m+'</g>'}
function dpth(S,x,z){return -(x-S.d.xp)*S.sn+z*S.ct}
/* ---------- screen content (local screen coords 0..84 x 0..78) ---------- */
var MONO="Menlo, 'Courier New', monospace";
function tx(x,y,s,t,fill,o){return '<text x="'+f(x)+'" y="'+f(y)+'" font-size="'+s+'" font-family="'+MONO+'" fill="'+fill+'"'+(o||'')+'>'+t+'</text>'}
function wrapText(s,max){var w=String(s||'').split(/\s+/),L=[],cur='';w.forEach(function(x){if(!x)return;if((cur?cur+' '+x:x).length>max){if(cur)L.push(cur);cur=x}else cur=cur?cur+' '+x:x});if(cur)L.push(cur);return L.slice(0,3)}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
var DEF_TEXT={idle:'Резерв: вчера?',boot:'',working:'Копирую...',error:'Всё плохо',bsod:'0x0000007B',love:'',sleep:'',off:'',static:''};
P.screen_content=function(S){var c=S.c,e=S.ex,t=S.t,k=e.screen,txt=e.screen_text!=null&&e.screen_text!==''?e.screen_text:DEF_TEXT[k]||'',o='',i;
 var blink=(t%1)<.55;
 if(k==="off"){o+='<rect width="84" height="78" fill="'+c.offGlass+'"/><path d="M8,78 L34,0 L52,0 L26,78 Z" fill="'+c.offRefl+'"/>'}
 else if(k==="idle"){o+='<rect width="84" height="78" fill="'+c.glass+'"/>'+tx(7,20,12,'C:\\&gt;',c.amber,' font-weight="700"');
  if(blink)o+='<rect x="'+f(7+4*7.2+2)+'" y="9" width="7" height="12" fill="'+c.amber+'"/>';
  var L=wrapText(txt,12);L.forEach(function(l,j){o+=tx(7,40+j*11,7,esc(l),c.amberDim)})}
 else if(k==="boot"){o+='<rect width="84" height="78" fill="'+c.glass+'"/>';
  var lines=['Память: 640К ОК','Диск: найден','Мышь: нет','Клавиш.: есть','Загрузка...'],ph=(t%5)/5,cnt=Math.min(5,Math.floor(ph*6)+1);
  for(i=0;i<cnt;i++)o+=tx(6,13+i*10,6.6,lines[i],i===4?c.amber:c.amberDim);
  var fill=Math.floor(ph*11);for(i=0;i<10;i++)o+='<rect x="'+f(7+i*7.2)+'" y="62" width="5.4" height="8" fill="'+(i<fill?c.amber:'#2d3a36')+'"/>';
  if(blink&&cnt<5)o+='<rect x="6" y="'+f(13+cnt*10-7)+'" width="4.4" height="8" fill="'+c.amber+'"/>'}
 else if(k==="working"){o+='<rect width="84" height="78" fill="'+c.glass+'"/>';
  var p=(t*.45)%1,flip=p>.88?(p-.88)/.12:0,rot=flip*flip*(3-2*flip)*180,sh=Math.min(1,p/.88);
  o+='<g transform="translate(42,31) rotate('+f(rot)+')"><path d="M-12,-17 L12,-17 L2,-1 L-2,-1 Z M-2,1 L2,1 L12,17 L-12,17 Z" fill="'+c.hgGlass+'"/>';
  var th=15*(1-sh),bh=15*sh;
  o+='<path d="M'+f(-10+ (15-th)*.35)+','+f(-15+(15-th))+' L'+f(10-(15-th)*.35)+','+f(-15+(15-th))+' L2,-3 L-2,-3 Z" fill="'+c.sand+'"/>';
  o+='<path d="M'+f(-10+bh*0)+',15 L'+f(10)+',15 L'+f(Math.min(10,2+bh*.55))+','+f(15-bh)+' L'+f(-Math.min(10,2+bh*.55))+','+f(15-bh)+' Z" fill="'+c.sand+'"/>';
  if(sh<.97)o+='<rect x="-1" y="-2" width="2" height="'+f(14*(1-sh*.2))+'" fill="'+c.sand+'"/>';
  o+='<rect x="-16" y="-22" width="32" height="5" rx="1.5" fill="'+c.hgFrame+'"/><rect x="-16" y="17" width="32" height="5" rx="1.5" fill="'+c.hgFrame+'"/></g>';
  wrapText(txt,12).forEach(function(l,j){o+=tx(42,64+j*8,7,esc(l),c.amber,' text-anchor="middle"')})}
 else if(k==="error"){var jx=Math.sin(t*38)*(((t*2)%2)<.5?1.4:0);
  o+='<rect width="84" height="78" fill="'+c.teal+'"/><g transform="translate('+f(jx)+',0)"><path d="'+rr(5,10,74,56,3)+'" fill="'+c.win+'"/><path d="M5,13 Q5,10 8,10 L76,10 Q79,10 79,13 L79,22 L5,22 Z" fill="'+c.winBar+'"/>'+tx(10,19.2,7.4,'Ошибка','#fff',' font-weight="700"')
  +'<path d="'+rr(10,28,15,15,3)+'" fill="'+c.red+'"/><path d="M14.5,32.5 L20.5,38.5 M20.5,32.5 L14.5,38.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>';
  var lw=wrapText(txt,10);lw.forEach(function(l,j){o+=tx(30,35+j*8.4,7,esc(l),'#2b2723')});
  o+='<path d="'+rr(30,48,24,12,2.5)+'" fill="'+c.winBtn+'"/>'+tx(42,57,7.4,'ОК','#2b2723',' text-anchor="middle" font-weight="700"')+'</g>'}
 else if(k==="bsod"){o+='<rect width="84" height="78" fill="'+c.bsod+'"/><path d="'+rr(6,8,46,11,1.5)+'" fill="'+c.bsodHd+'"/>'+tx(10,16.4,7.6,'Зинаида',c.bsod,' font-weight="700"')
  +tx(6,32,6.2,'Обнаружена проблема.',c.bsodTx)+tx(6,41,6.2,'Нажмите любую клавишу',c.bsodTx);
  wrapText(txt,13).forEach(function(l,j){o+=tx(6,54+j*8,7,esc(l),'#fff',' font-weight="700"')});
  if(blink)o+='<rect x="6" y="66" width="5" height="7" fill="'+c.bsodTx+'"/>'}
 else if(k==="love"){var s=1+.07*Math.sin(t*5.2);
  o+='<rect width="84" height="78" fill="'+c.glass+'"/><g transform="translate(42,'+(txt?30:38)+') scale('+f(1.55*s)+')"><path d="M0,11 C-15,-1 -14,-16 -5.5,-16 C-2.5,-16 0,-13.5 0,-11 C0,-13.5 2.5,-16 5.5,-16 C14,-16 15,-1 0,11 Z" fill="'+c.heart+'"/></g>';
  wrapText(txt,12).forEach(function(l,j){o+=tx(42,66+j*8,7,esc(l),c.amber,' text-anchor="middle"')})}
 else if(k==="sleep"){o+='<rect width="84" height="78" fill="#0d151c"/>';
  [[0,16,8],[.33,28,12],[.66,40,16]].forEach(function(a,j){var p=((t*.22)+a[0])%1,y=64-p*54,x=14+a[1]*.9+Math.sin(p*5+j)*5;
   o+=tx(x,y,a[2],j===1?'z':'Z',c.sleepZ,' font-weight="700" opacity="'+f(Math.min(1,p*5)*(1-p))+'"')})}
 else if(k==="static"){var fr=Math.floor(t*14),cols=['#3a4044','#6c7378','#9aa1a4','#cfd3d2','#23282b'];
  for(var yy=0;yy<13;yy++)for(var xx=0;xx<14;xx++)o+='<rect x="'+(xx*6)+'" y="'+(yy*6)+'" width="6" height="6" fill="'+cols[Math.floor(hash(fr*7.3+xx*3.1+yy*17.7)*5)]+'"/>'}
 return o};
/* ---------- LEDs ---------- */
function ledColor(S,which){var e=S.ex,t=S.t,m=e.led;
 if(which==="hdd"){if(m!=="auto")return null;if(e.screen==="working")return hash(Math.floor(t*14))>.4?S.c.ledAmber:null;if(e.screen==="boot")return hash(Math.floor(t*8)+3)>.45?S.c.ledAmber:null;return null}
 if(m==="off")return null;if(m==="green")return S.c.ledGreen;if(m==="amber")return S.c.ledAmber;if(m==="red")return S.c.ledRed;if(m==="pink")return S.c.ledPink;
 if(m==="blink_red")return (t%.8)<.4?S.c.ledRed:null;if(m==="pulse_amber")return (t%2.4)<1.5?S.c.ledAmber:null;
 var k=e.screen;if(k==="off")return null;if(k==="error")return (t%.7)<.35?S.c.ledRed:null;if(k==="love")return S.c.ledPink;if(k==="sleep")return (t%2.4)<1.5?S.c.ledAmber:null;return S.c.ledGreen}
function ledShape(x,y,w,h,col,off,S){var o='';if(col)o+='<path d="'+rr(x-3,y-3,w+6,h+6,(h+6)/2.2)+'" fill="'+col+'" opacity=".3"/>';return o+'<path d="'+rr(x,y,w,h,h/2.4)+'" fill="'+(col||off)+'"/>'}
/* ---------- parts ---------- */
P.crt_hump=function(S){var d=S.d,y0=d.deskY;return solid(S,frust([70,190,y0-124,y0-14],[92,168,y0-92,y0-44],70,130),{b:S.c.crtSh,s:shade(S.c.crtSh,.88),h:S.c.crt},6)};
P.crt_stand=function(S){var y0=S.d.deskY;return solid(S,box(96,164,y0-14,y0,22,106),{b:S.c.crtSh,s:shade(S.c.crtSh,.86),h:S.c.crt},4)};
P.crt_body=function(S){var d=S.d,y0=d.deskY,c=S.c,o=solid(S,box(70,190,y0-124,y0-14,0,78),{b:c.crt,s:c.crtSh,h:c.crtHi},9,{strip:.2}),ct=S.ct;
 if(ct>.1){o+='<g transform="'+matFront(S,0)+'">'+P.crt_face(S)+'</g>'}
 if(S.sn>.08){o+='<g transform="'+matSide(S,190)+'">'+P.crt_side(S)+'</g>'}
 return o};
P.crt_face=function(S){var c=S.c,y0=S.d.deskY,sc=S.d.screen,o='',cid=S.id(),ex=S.ex;
 o+='<path d="'+rr(sc[0]-3,y0+sc[1]-3,sc[2]+6,sc[3]+6,12)+'" fill="'+c.recess+'"/>';
 o+='<clipPath id="'+cid+'"><path d="'+rr(sc[0],y0+sc[1],sc[2],sc[3],9)+'"/></clipPath><g clip-path="url(#'+cid+')"><g transform="translate('+sc[0]+','+(y0+sc[1])+')">'+P.screen_content(S)+'</g></g>';
 /* dented top-left corner: flat shadow bite + chipped edge */
 o+='<path d="M70,'+(y0-110)+' Q72,'+(y0-121)+' 82,'+(y0-124)+' L96,'+(y0-124)+' Q84,'+(y0-120)+' 80,'+(y0-110)+' Q76,'+(y0-104)+' 70,'+(y0-100)+' Z" fill="'+c.crtSh+'"/>';
 o+='<path d="M70,'+(y0-110)+' Q71,'+(y0-118)+' 78,'+(y0-122)+' Q74,'+(y0-114)+' 74,'+(y0-106)+' Z" fill="'+c.crtHi+'"/>';
 /* controls column */
 o+='<path d="'+rr(171,y0-112,12,12,3)+'" fill="'+c.crtSh+'"/>'+P.led_cluster(S);
 o+='<path d="'+rr(171,y0-62,12,10,2.5)+'" fill="'+c.crtSh+'"/><path d="'+rr(171,y0-46,12,10,2.5)+'" fill="'+c.crtSh+'"/>';
 /* sticker */
 o+='<g transform="rotate(-3 112 '+(y0-25)+')"><path d="'+rr(78,y0-33,72,16,1.5)+'" fill="'+c.sticker+'"/>'+tx(114,y0-21.6,7.4,'НЕ ВЫКЛЮЧАТЬ!!!',c.red,' text-anchor="middle" font-weight="700"')+'<path d="M146,'+(y0-17)+' L152,'+(y0-17)+' L152,'+(y0-23)+' Z" fill="'+c.crtSh+'" opacity=".5"/></g>';
 return o};
P.led_cluster=function(S){var c=S.c,y0=S.d.deskY,pw=ledColor(S,"pwr"),hd=ledColor(S,"hdd");
 return ledShape(171,y0-92,12,6,pw,c.ledOff,S)+ledShape(171,y0-80,12,6,hd,c.ledOff,S)};
P.crt_side=function(S){var c=S.c,y0=S.d.deskY;
 return '<g transform="rotate(-2 40 '+(y0-50)+')"><path d="'+rr(18,y0-66,40,22,1.5)+'" fill="'+c.sticker+'"/>'+tx(38,y0-52,7,'ИНВ. №0417',c.tapeInk,' text-anchor="middle" font-weight="700"')+'</g>'
  +'<path d="'+rr(12,y0-112,54,5,2.5)+'" fill="'+c.crtSh+'"/>'};
P.dust=function(S){var c=S.c,y0=S.d.deskY,o='';
 var T=[[104,y0-124,5,1],[128,y0-124,7,2],[152,y0-124,5,3]];
 o+='<g transform="'+matFront(S,0)+'">';T.forEach(function(a){o+='<path d="'+blob(a[0],a[1]+1,a[2],a[3])+'" fill="'+c.dust+'"/>'});o+='</g>';
 if(S.ex.screen==="working"||S.ex.screen==="boot"){var d2=S.d;o+='<g transform="'+matFront(S,-16)+'">';
  for(var i=0;i<3;i++){var p=((S.t*.4)+i/3)%1;o+='<path d="'+blob(112+Math.sin(p*6+i*2)*9+i*6,452-p*70,6+p*10,i+7)+'" fill="'+c.dust2+'" opacity="'+f((1-p)*.9)+'"/>'}o+='</g>'}
 return o};
P.desk_leg=function(S,x0,z0,w,d){var y0=S.d.deskY;return solid(S,box(x0,x0+w,y0+16,478,z0,z0+d),{b:S.c.deskSh,s:shade(S.c.deskSh,.84),h:S.c.desk},3)};
P.desk=function(S){var y0=S.d.deskY,d=S.d;return solid(S,box(d.deskLeft,d.deskRight,y0,y0+16,d.deskZ0,d.deskZ1),{b:S.c.desk,s:S.c.deskSh,h:S.c.deskHi},4,{strip:.12})};
P.tower=function(S){var d=S.d,c=S.c,y0=d.towerY0,o=solid(S,box(d.towerX0,d.towerX1,y0,478,-16,104),{b:c.tower,s:c.towerSh,h:c.towerHi},8,{strip:.22});
 if(S.ct>.1)o+='<g transform="'+matFront(S,-16)+'">'+P.tower_face(S)+'</g>';
 if(S.sn>.08)o+='<g transform="'+matSide(S,d.towerX1)+'">'+P.tower_side(S)+'</g>';
 return o};
P.tower_face=function(S){var c=S.c,o='',e=S.ex,t=S.t;
 o+='<path d="'+rr(47,336,70,15,2.5)+'" fill="'+c.bay+'"/><path d="'+rr(53,340,48,7,2.5)+'" fill="'+c.bayDk+'"/>';
 o+='<path d="'+rr(47,356,70,15,2.5)+'" fill="'+c.bay+'"/><path d="'+rr(53,360,36,7,2.5)+'" fill="'+c.bayDk+'"/><path d="'+rr(96,360,12,7,2)+'" fill="'+c.towerSh+'"/>';
 o+='<path d="'+rr(92,386,22,22,4)+'" fill="'+c.towerSh+'"/>'+ledShape(95,378,16,5,ledColor(S,"pwr"),c.ledOff,S);
 o+='<path d="'+rr(47,386,24,8,2.5)+'" fill="'+c.towerSh+'"/>';
 o+='<g transform="rotate(-2 79 439)"><path d="'+rr(46,430,66,18,1.5)+'" fill="'+c.tape+'"/>'+tx(79,443.4,11,'Зинаида',c.tapeInk,' text-anchor="middle" font-weight="700"')+'</g>';
 [[48,472,6,31],[108,471,7,32]].forEach(function(a){o+='<path d="'+blob(a[0],a[1],a[2],a[3])+'" fill="'+c.dust+'"/>'});
 return o};
P.tower_side=function(S){var c=S.c;
 return '<path d="'+rr(40,356,52,52,6)+'" fill="'+c.bayDk+'"/><path d="'+rr(46,362,40,40,4)+'" fill="'+c.bay+'"/>'
  +'<path d="'+blob(66,386,14,41)+'" fill="'+c.dust+'"/><path d="'+blob(56,372,7,43)+'" fill="'+c.dust2+'"/><path d="'+blob(78,394,6,47)+'" fill="'+c.dust+'"/>'};
P.strip=function(S){var c=S.c,o=solid(S,box(-34,20,462,478,40,70),{b:c.strip,s:c.stripSh,h:'#e6dfc8'},4,{strip:.2});
 if(S.ct>.1)o+='<g transform="'+matFront(S,40)+'">'+ledShape(2,466,14,6,c.ledRed,c.ledOff,S)+'<path d="'+rr(-28,466,14,8,2)+'" fill="'+c.stripSh+'"/></g>';return o};
P.keyboard=function(S){var c=S.c,d=S.d,y0=d.deskY,x0=-80,x1=60,z0=-112,z1=-50,h0=7,h1=15,
 V=[[x0,y0-h0,z0],[x1,y0-h0,z0],[x1,y0,z0],[x0,y0,z0],[x0,y0-h1,z1],[x1,y0-h1,z1],[x1,y0,z1],[x0,y0,z1]],o=solid(S,V,{b:c.kb,s:c.kbSh,h:c.kbHi},4);
 function top(u,v,lift){var y=y0-h0-(h1-h0)*v-(lift||0);return [x0+(x1-x0)*u,y,z0+(z1-z0)*v]}
 function quad(u0,v0,u1,v1,col,lift){var q=[top(u0,v0,lift),top(u1,v0,lift),top(u1,v1,lift),top(u0,v1,lift)].map(function(p){return pj(S,p)});return '<path d="'+polyD(q)+'" fill="'+col+'" stroke="'+col+'" stroke-width="1" stroke-linejoin="round"/>'}
 var rows=[[13,0],[13,.25],[12,.5],[7,.75]],miss={'0,3':1,'1,9':1,'2,5':1};
 for(var r=0;r<4;r++){var vv0=.06+r*.225,vv1=vv0+.18,n=rows[r][0];
  for(var k=0;k<n;k++){var u0=.04+k*(.92/n)+.004,u1=.04+(k+1)*(.92/n)-.004;if(r===3){if(k===2){u0=.04+.92*.2;u1=.04+.92*.68}else if(k>2)continue;if(k<2){u0=.04+k*.092;u1=u0+.086}}
   var key=r+','+k,down=false;
   if(S.ex.screen==="working"){down=hash(Math.floor(S.t*9)*5.3+r*11+k*3)>.8}
   if(miss[key]){o+=quad(u0,vv0,u1,vv1,c.keyGap,0)}
   else{var kv0=vv0,kv1=vv1,du=0;if(key==='2,7'){du=.01;kv0+=.025}o+=quad(u0+du,kv0,u1+du,kv1,down?c.keyDown:c.key,down?.2:1.4)}}}
 /* cigarette burn (Михалыч smokes): flat scorched smear with a darker notch */
 var st=[[.60,.18],[.70,.12],[.80,.2],[.84,.5],[.78,.82],[.66,.9],[.58,.7],[.56,.38]].map(function(a){return pj(S,top(a[0],a[1],0))});
 o+='<path d="'+rpath(st,5)+'" fill="'+c.stain+'"/>';
 var nt=[[.68,.3],[.76,.34],[.77,.6],[.7,.66],[.66,.46]].map(function(a){return pj(S,top(a[0],a[1],0))});o+='<path d="'+rpath(nt,3)+'" fill="'+c.stainCore+'"/>';
 return o};
P.mouse=function(S){var c=S.c,y0=S.d.deskY,x0=94,x1=120,z0=-96,z1=-58,V=box(x0,x1,y0-10,y0,z0,z1),o=solid(S,V,{b:c.mouse,s:c.mouseSh,h:c.mouseHi},7);
 function pt(u,v){return pj(S,[x0+(x1-x0)*u,y0-10,z0+(z1-z0)*v])}
 o+='<path d="'+rpath([pt(.08,.55),pt(.92,.55),pt(.92,.94),pt(.08,.94)].map(function(p){return p}),3)+'" fill="'+c.mouseSh+'"/>';return o};
function cablePath(S,pts,w,col){var q=pts.map(function(p){return pj(S,p)}),o='M'+f(q[0][0])+','+f(q[0][1]);
 for(var i=1;i<q.length-1;i++){var m=[(q[i][0]+q[i+1][0])/2,(q[i][1]+q[i+1][1])/2];o+=' Q'+f(q[i][0])+','+f(q[i][1])+' '+f(m[0])+','+f(m[1])}
 o+=' L'+f(q[q.length-1][0])+','+f(q[q.length-1][1]);return '<path d="'+o+'" stroke="'+col+'" stroke-width="'+w+'" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'}
function bez3(a,b,c,d,n,fn){var out=[];for(var i=0;i<=n;i++){var t=i/n,u=1-t,p=[0,1,2].map(function(k){return u*u*u*a[k]+3*u*u*t*b[k]+3*u*t*t*c[k]+t*t*t*d[k]});if(fn)p=fn(p,t);out.push(p)}return out}
P.cables=function(S,which){var c=S.c,y0=S.d.deskY,t=S.t,cb=S.ex.cable,sw=Math.sin(t*2.1)*13*cb,sw2=Math.sin(t*3.3+1)*5*cb,o='';
 if(which==="desk"){
  o+=cablePath(S,bez3([-10,y0-14,-50],[-10,y0-6,-10],[40+sw2,y0-3,20],[108,y0-8,70],9,function(p,tt){p[1]+=Math.sin(tt*PI)*0;p[0]+=Math.sin(tt*5+t*3)*2.2*cb*Math.sin(tt*PI);return p}),5,c.cableGr);
  o+=cablePath(S,bez3([106,y0-5,-58],[112,y0-2,-20+sw2],[96,y0-2,10],[118,y0-8,76],9,function(p,tt){p[0]+=Math.sin(tt*6+t*3.7)*1.8*cb*Math.sin(tt*PI);return p}),4,c.cableGr)}
 else{
  o+=cablePath(S,bez3([104,y0-24,112],[56+sw,y0+30,130],[34-sw,420,92],[-6,466,56],12,null),6,c.cableDk);
  o+=cablePath(S,bez3([-34,472,56],[-80+sw2*1.2,478,90],[-120,474,120],[-250+sw*.8,476,150],10,null),5,c.cableDk)}
 return o};
P.chair_slot=function(S){var c=S.c,col={b:c.chair,s:c.chair,h:c.chair},o='',hip=325,seat=hip+16;
 o+=solid(S,box(-30,30,seat,seat+14,-300,-176),col,6)+solid(S,box(-30,30,seat-140,seat,-312,-300),col,7);
 [[-24,-296],[18,-296],[-24,-186],[18,-186]].forEach(function(a){o+=solid(S,box(a[0],a[0]+8,seat+14,478,a[1],a[1]+8),col,2)});return o};
function shade(c,a){var n=parseInt(c.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;function q(x){return Math.max(0,Math.min(255,Math.round(x*a)))}return '#'+((1<<24)|(q(r)<<16)|(q(g)<<8)|q(b)).toString(16).slice(1)}
/* ---------- states (expressions) and poses (views) ---------- */
var EX0={screen:"idle",led:"auto",shake:.12,hum:1,cable:.3,bounce:0};
function ex(o){var r={},k;for(k in EX0)r[k]=EX0[k];for(k in o)r[k]=o[k];return r}
var X={
 off:ex({screen:"off",shake:0,hum:0,cable:0}),
 idle:ex({screen:"idle",shake:.12,cable:.25}),
 boot:ex({screen:"boot",shake:.35,cable:.5}),
 working:ex({screen:"working",shake:.4,cable:.7}),
 error:ex({screen:"error",shake:.9,cable:1.1}),
 bsod:ex({screen:"bsod",shake:.2,cable:.15}),
 love:ex({screen:"love",shake:0,cable:.5,bounce:1}),
 sleep:ex({screen:"sleep",shake:.03,cable:.05}),
 static:ex({screen:"static",shake:.25,cable:.4})
};
R.expr=X;
var PB={yaw:0,pitch:8,chair:0};
var POSES={front:{yaw:0,pitch:8},q:{yaw:35,pitch:8},side:{yaw:90,pitch:5},q_chair:{yaw:35,pitch:8,chair:1},side_chair:{yaw:90,pitch:5,chair:1}};
R.poses=POSES;
function resolvePose(p){var o={},k;for(k in PB)o[k]=PB[k];if(typeof p==="string")p=POSES[p];if(p)for(k in p)o[k]=p[k];return o}
function resolveState(st){var e=st.expr,b=typeof e==="string"?X[e]:(e&&typeof e==="object"?e:null);if(!b)b=X[st.state]||X.idle;b=ex(b);
 if(st.screen_text!=null)b.screen_text=st.screen_text;if(st.led!=null)b.led=st.led;if(st.shake!=null)b.shake=st.shake;return b}
/* ---------- draw ---------- */
R.draw=function(st){var S=mkS(st),c=S.c,e=S.ex,t=S.t,pz=S.pz,d=S.d,o='';
 var defs='<defs><filter id="ds" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="2" dy="4" stdDeviation="3.2" flood-color="'+c.shadow+'" flood-opacity=".32"/></filter></defs>';
 var sh=e.shake,env=e.screen==="error"?(((t*3)%3)<.7?1:.15):1;
 var dx=sh*env*2.4*Math.sin(t*2*PI*21),dy=e.hum*.5*Math.sin(t*2*PI*29+1)+sh*env*.8*Math.sin(t*2*PI*17)-e.bounce*2.6*Math.abs(Math.sin(t*PI*1.3)),rot=sh*env*.5*Math.sin(t*2*PI*13+2);
 var shk='translate('+f(dx)+','+f(dy)+') rotate('+f(rot)+' '+f(pj(S,[130,400,40])[0])+' 470)';
 var floor='<path d="'+rpath(hull([[-180,478,-196],[236,478,-196],[236,478,166],[-180,478,166]].map(function(q){return pj(S,q)})),16)+'" fill="'+c.shadow+'" opacity=".22"/>';
 /* under-desk group, far to near */
 var legs=[[d.deskLeft,d.deskZ1-14,14,14],[d.deskRight-14,d.deskZ1-14,14,14],[d.deskLeft,d.deskZ0,14,14],[d.deskRight-14,d.deskZ0,14,14]].map(function(a){return {dp:dpth(S,a[0]+7,a[1]+7),m:function(){return wrapDs(P.desk_leg(S,a[0],a[1],a[2],a[3]))}}});
 var under=legs.concat([{dp:dpth(S,82,44),m:function(){return '<g transform="'+shk+'">'+wrapDs(P.tower(S))+P.dust(S)+'</g>'}},
  {dp:dpth(S,-7,55),m:function(){return wrapDs(P.strip(S))+wrapDs(P.cables(S,"floor"))}}]);
 under.sort(function(a,b){return b.dp-a.dp});
 o+=floor;under.forEach(function(u){o+=u.m()});
 o+=wrapDs(P.desk(S));
 var top=[{dp:dpth(S,-10,-80),m:function(){return wrapDs(P.keyboard(S))}},{dp:dpth(S,107,-77),m:function(){return wrapDs(P.mouse(S))}},
  {dp:dpth(S,130,40),m:function(){return '<g transform="'+shk+'">'+wrapDs(P.crt_hump(S)+P.crt_stand(S)+P.crt_body(S))+'</g>'}}];
 top.sort(function(a,b){return b.dp-a.dp});
 var cabD=dpth(S,60,0);
 o+=wrapDs(P.cables(S,"desk"));
 top.forEach(function(u){o+=u.m()});
 if(pz.chair)o+=wrapDs(P.chair_slot(S));
 return defs+o};
HF.RIGS.zinaida=R.draw;HF.CHARS=HF.CHARS||{};HF.CHARS.zinaida_cut={id:"zinaida"};
HF.EXPR_Z=X;HF.POSES_Z=R.poses;HF.PARTS_Z=P;
})();
