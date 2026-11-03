/* neyroset_cut.js - Нейросеть asset set, cut-paper look «Вырезка».
   Flat smooth-edged layered paper, one flat shade shape per part, soft drop shadow between layers only, no gradients.
   Pure function of (state, t). Self-contained: needs no engine globals. Registers window.NEY (and HF.RIGS.neyroset if HF exists).
   Head local space: origin = head centre, +y down, units px at scale 1 (head ~190 wide). */
(function(){
var NEY=window.NEY={};
var FONT="'Marker Felt','Marker Felt Wide',Helvetica,sans-serif";
var C={navy:'#1f3568',navy2:'#172a54',navy3:'#2b4a8c',skin:'#fbdccb',skin2:'#efc0ae',cheek:'#f6a9a6',lip:'#b04a63',inside:'#5a1f3a',tongue:'#e0708a',teeth:'#fbf6ea',
  sclera:'#ffffff',iris:'#26407f',blouse:'#4f86d6',blouse2:'#3d6fd0',
  win:'#1c2a4a',win2:'#2c3d66',field:'#101a31',aiB:'#2f4f8f',aiT:'#eaf2ff',usB:'#e6dcc4',usT:'#2b2723',amber:'#f3b04a',amber2:'#ffd27a',
  red:'#e0705f',yel:'#e0b341',grn:'#58d68d',ice:'#9ec8ff',txt:'#b9c9e6',scr:'#0d1730',scr2:'#16285a',body:'#3a4258',cloud:'#eef3fb',cloud2:'#c8d6ea',cloudT:'#26407f',shadow:'#0b1020'};
NEY.PALETTE=C;
function f(v){return Math.round(v*10)/10}
function cl(v,a,b){return v<a?a:v>b?b:v}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function Pa(d,fill,x2){return '<path d="'+d+'" fill="'+fill+'"'+(x2||'')+'/>'}
function Ln(d,col,w,x2){return '<path d="'+d+'" stroke="'+col+'" stroke-width="'+w+'" fill="none" stroke-linecap="round" stroke-linejoin="round"'+(x2||'')+'/>'}
function R(x,y,w,h,r,fill,x2){return '<rect x="'+f(x)+'" y="'+f(y)+'" width="'+f(w)+'" height="'+f(h)+'" rx="'+r+'" fill="'+fill+'"'+(x2||'')+'/>'}
function El(x,y,rx,ry,fill,x2){return '<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="'+fill+'"'+(x2||'')+'/>'}
function T(x,y,s,t,fill,a,x2){return '<text x="'+f(x)+'" y="'+f(y)+'" font-size="'+s+'" text-anchor="'+(a||'middle')+'" font-family="'+FONT+'" fill="'+fill+'"'+(x2||'')+'>'+esc(t)+'</text>'}
function S1(m){return '<g filter="url(#ney_s1)">'+m+'</g>'}
function S2(m){return '<g filter="url(#ney_s2)">'+m+'</g>'}
NEY.defs=function(){return '<defs><filter id="ney_s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="'+C.shadow+'" flood-opacity=".38"/></filter>'
  +'<filter id="ney_s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="'+C.shadow+'" flood-opacity=".34"/></filter></defs>'};

/* ---------- text measure / wrap (canvas when available, else 0.56 em per char) ---------- */
var _cv=null,_memo={};
function measure(s,fs){
  var k=fs+'|'+s;if(_memo[k]!=null)return _memo[k];
  var w;try{if(!_cv)_cv=document.createElement('canvas').getContext('2d');_cv.font=fs+'px '+FONT;w=_cv.measureText(s).width}catch(e){w=s.length*fs*.56}
  return(_memo[k]=w)}
NEY.measure=measure;
function fit(s,fs,maxW){ /* single line, ellipsis if too wide */
  if(measure(s,fs)<=maxW)return s;
  while(s.length>1&&measure(s+'…',fs)>maxW)s=s.slice(0,-1);
  return s.replace(/\s+$/,'')+'…'}
function wrap(s,fs,maxW,maxLines){
  var words=String(s).split(/\s+/),lines=[],cur='';
  words.forEach(function(w){var t=cur?cur+' '+w:w;if(measure(t,fs)<=maxW||!cur)cur=t;else{lines.push(cur);cur=w}});
  if(cur)lines.push(cur);
  if(maxLines&&lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=fit(lines[maxLines-1]+' …',fs,maxW)}
  return lines}
NEY.wrap=wrap;

/* ---------- expressions ----------
   eye: t 'open'|'arc'|'x'; sL,sR eye scale; lidL,lidR 0..1 lid cover; slL,slR lid slant; pup iris scale; gx,gy gaze -1..1
   brow: yL,yR height (up +), aL,aR inner-end raise (worried +, angry -)
   mouth: w half width, mc curve (+smile), ms smirk (+ lifts viewer-right corner), mo base open 0..1, mt thin teeth strip, mg tongue, type 'zig'|'wave'
   ck cheek size, tilt deg, dy, fx list. */
var X=NEY.EXPR={};
X.neutral_helpful={eye:{t:'open',sL:1,sR:1,lidL:0,lidR:0,slL:0,slR:0,pup:1,gx:0,gy:0},brow:{yL:5,yR:5,aL:1,aR:1},mouth:{w:24,mc:.55,ms:0,mo:0,mt:0,mg:0},ck:1,tilt:0,dy:0,fx:[]};
X.thinking={eye:{t:'open',sL:1,sR:1,lidL:.1,lidR:.1,slL:0,slR:0,pup:.95,gx:-.8,gy:-.9},brow:{yL:8,yR:-2,aL:-6,aR:-4},mouth:{w:13,mc:0,ms:.8,mo:0,mt:0,mg:0},ck:.8,tilt:-5,dy:0,fx:['dots']};
X.confident_wrong={eye:{t:'open',sL:1.05,sR:1.05,lidL:.12,lidR:.12,slL:0,slR:0,pup:1.05,gx:.1,gy:0},brow:{yL:6,yR:6,aL:-3,aR:-3},mouth:{w:36,mc:1,ms:.1,mo:.3,mt:1,mg:0},ck:1.15,tilt:4,dy:-3,fx:['check']};
X.apologetic={eye:{t:'open',sL:1.1,sR:1.1,lidL:0,lidR:0,slL:0,slR:0,pup:1.12,gx:.3,gy:.6},brow:{yL:4,yR:4,aL:9,aR:9},mouth:{w:17,mc:-.55,ms:0,mo:0,mt:0,mg:0},ck:1.3,tilt:-4,dy:3,fx:['sweat']};
X.cheerful={eye:{t:'arc',sL:1,sR:1,lidL:0,lidR:0,slL:0,slR:0,pup:1,gx:0,gy:0},brow:{yL:6,yR:6,aL:-3,aR:-3},mouth:{w:36,mc:1,ms:0,mo:.55,mt:1,mg:1},ck:1.4,tilt:0,dy:-2,fx:['sparks']};
X.typing={eye:{t:'open',sL:1,sR:1,lidL:.28,lidR:.28,slL:0,slR:0,pup:1,gx:.1,gy:1},brow:{yL:0,yR:0,aL:0,aR:0},mouth:{w:11,mc:.1,ms:0,mo:0,mt:0,mg:0},ck:.9,tilt:0,dy:4,fx:['typing']};
X.error={eye:{t:'x',sL:1,sR:1,lidL:0,lidR:0,slL:0,slR:0,pup:1,gx:0,gy:0},brow:{yL:3,yR:3,aL:5,aR:5},mouth:{w:24,mc:0,ms:0,mo:0,mt:0,mg:0,type:'zig'},ck:.6,tilt:0,dy:0,fx:['warn']};
X.hallucinating={eye:{t:'open',sL:1.2,sR:.82,lidL:0,lidR:.05,slL:0,slR:0,pup:1.1,gx:-.9,gy:-.7,gxR:.9,gyR:.8,pupR:.6},brow:{yL:10,yR:-4,aL:-4,aR:4},mouth:{w:26,mc:0,ms:0,mo:0,mt:0,mg:0,type:'wave'},ck:1,tilt:6,dy:0,fx:['glitch']};
X.smug={eye:{t:'open',sL:1,sR:1,lidL:.5,lidR:.5,slL:-1,slR:1,pup:1,gx:.4,gy:.1},brow:{yL:0,yR:9,aL:-2,aR:-5},mouth:{w:26,mc:.5,ms:1,mo:0,mt:0,mg:0},ck:1,tilt:-6,dy:-2,fx:[]};
X.sleepy={eye:{t:'open',sL:1,sR:1,lidL:.84,lidR:.84,slL:0,slR:0,pup:.9,gx:0,gy:.4},brow:{yL:-3,yR:-3,aL:3,aR:3},mouth:{w:13,mc:0,ms:0,mo:.28,mt:0,mg:0},ck:.8,tilt:8,dy:5,fx:['zzz']};
X.sarcastic={eye:{t:'open',sL:1,sR:1,lidL:.38,lidR:.38,slL:0,slR:0,pup:1,gx:-.9,gy:-.8},brow:{yL:11,yR:-5,aL:-7,aR:-8},mouth:{w:22,mc:-.05,ms:-.7,mo:0,mt:0,mg:0},ck:.7,tilt:-3,dy:0,fx:[]};
X.panicked={eye:{t:'open',sL:1.22,sR:1.22,lidL:0,lidR:0,slL:0,slR:0,pup:.6,gx:0,gy:0},brow:{yL:6,yR:6,aL:9,aR:9},mouth:{w:15,mc:-.65,ms:0,mo:.45,mt:0,mg:0,nt:1},ck:.6,tilt:0,dy:-3,fx:['sweat','sweat2']};
NEY.EXPR_ORDER=['neutral_helpful','thinking','confident_wrong','apologetic','cheerful','typing','error','hallucinating','smug','sleepy','sarcastic','panicked'];
NEY.EXPR_RU={neutral_helpful:'нейтральная, готова помочь',thinking:'думает',confident_wrong:'уверена, но не права',apologetic:'извиняется',cheerful:'радуется',typing:'печатает',error:'ошибка',hallucinating:'галлюцинирует',smug:'самодовольна',sleepy:'дремлет',sarcastic:'язвит',panicked:'паника от пользователя'};
NEY.VISEMES={closed:0,small:.3,mid:.6,wide:1};

/* ---------- parts ---------- */
var P=NEY.P={};
var HEAD='M-95,-10 C-95,-72 -52,-90 0,-90 C52,-90 95,-72 95,-10 C95,50 62,86 0,86 C-62,86 -95,50 -95,-10Z';
var BOB='M-112,-8 C-118,-92 -60,-112 0,-112 C60,-112 118,-92 112,-8 L117,66 Q102,98 76,86 L-76,86 Q-102,98 -117,66Z';
var FRL='M-4,-100 C-40,-100 -92,-84 -99,-30 L-98,-14 C-84,-24 -62,-34 -34,-52 C-20,-62 -10,-76 -4,-100Z';
var FRR='M4,-100 C40,-100 92,-84 99,-30 L98,-18 C80,-30 52,-40 26,-56 C14,-66 8,-80 4,-100Z';

/* hair_back: darker bob mass behind the head, one flat shade shape */
P.hair_back=function(){return S1(Pa(BOB,C.navy2))};
/* skull: face shape + one jaw shade */
P.skull=function(uid){return S1(Pa(HEAD,C.skin))+'<clipPath id="'+uid+'_hd"><path d="'+HEAD+'"/></clipPath><g clip-path="url(#'+uid+'_hd)">'+Pa('M95,-30 C98,50 62,86 0,86 C34,78 74,44 76,-30Z',C.skin2)+'</g>'};
/* cap: fringe + parting, casts one flat shadow on the forehead */
P.cap=function(uid){return '<g clip-path="url(#'+uid+'_hd)" transform="translate(0,0)"><g transform="translate(0,9)">'+Pa(FRL,C.skin2)+Pa(FRR,C.skin2)+'</g></g>'+S2(Pa(FRL,C.navy)+Pa(FRR,C.navy))};
P.cheeks=function(ex){var k=ex.ck;return El(-64,24,13*k,8*k,C.cheek)+El(64,24,13*k,8*k,C.cheek)};
P.eyes=function(ex,t,uid,blink){
  var e=ex.eye,o='';
  [-1,1].forEach(function(d){
    var L=d<0,s=L?e.sL:e.sR,lid=cl((L?e.lidL:e.lidR)+blink,0,1),sl=L?e.slL:e.slR,cx=d*38,cy=-2,w=14.5*s,h=18*s;
    if(e.t==='arc'){o+=Pa('M'+f(cx-15)+','+(cy+5)+' Q'+cx+','+(cy-21)+' '+f(cx+15)+','+(cy+5)+' Q'+cx+','+(cy-7)+' '+f(cx-15)+','+(cy+5)+'Z',C.iris,' stroke="'+C.iris+'" stroke-width="3" stroke-linejoin="round"');return}
    if(e.t==='x'){o+=Ln('M'+(cx-11)+','+(cy-11)+' L'+(cx+11)+','+(cy+11)+' M'+(cx+11)+','+(cy-11)+' L'+(cx-11)+','+(cy+11),C.iris,8);return}
    var gx=(d>0&&e.gxR!=null?e.gxR:e.gx),gy=(d>0&&e.gyR!=null?e.gyR:e.gy),pu=(d>0&&e.pupR!=null?e.pupR:e.pup);
    var id=uid+'_e'+(L?'l':'r');
    o+='<clipPath id="'+id+'"><rect x="'+f(cx-w)+'" y="'+f(cy-h)+'" width="'+f(2*w)+'" height="'+f(2*h)+'" rx="'+f(w*.95)+'"/></clipPath>';
    o+=R(cx-w,cy-h,2*w,2*h,w*.95,C.sclera);
    var ix=cx+gx*w*.42,iy=cy+gy*h*.38,iw=w*.62*pu,ih=h*.72*pu;
    o+='<g clip-path="url(#'+id+')">'+R(ix-iw,iy-ih,2*iw,2*ih,iw*.95,C.iris)+R(ix-iw*.15,iy-ih*.6,iw*.5,ih*.36,2,'#fff')
      +(lid>0?Pa('M'+f(cx-w-2)+','+f(cy-h-2)+' L'+f(cx+w+2)+','+f(cy-h-2)+' L'+f(cx+w+2)+','+f(cy-h+lid*2*h+sl*4)+' L'+f(cx-w-2)+','+f(cy-h+lid*2*h-sl*4)+'Z',C.skin2):'')+'</g>'});
  return o};
P.brows=function(ex){
  var b=ex.brow,o='';
  [-1,1].forEach(function(d){var L=d<0,y=-34-(L?b.yL:b.yR),a=L?b.aL:b.aR,xi=d*13,xo=d*62;
    o+=Ln('M'+xi+','+f(y-a)+' Q'+d*38+','+f(y-6)+' '+xo+','+f(y+a*.8),C.navy,9)});
  return o};
function mouthPath(m,a){
  var w=m.w*(1+a*.12),yc=44,cl0=yc-m.mc*10,yL=cl0+3*m.ms,yR=cl0-8*m.ms,uy=yc+m.mc*16-a*4,openH=a*36,dl=Math.max(9,openH*1.35+2);
  return {up:'M'+f(-w)+','+f(yL)+' Q0,'+f(uy)+' '+f(w)+','+f(yR),
    d:'M'+f(-w)+','+f(yL)+' Q0,'+f(uy)+' '+f(w)+','+f(yR)+' C'+f(w*.82)+','+f(yR+dl)+' '+f(-w*.82)+','+f(yL+dl)+' '+f(-w)+','+f(yL)+'Z',
    w:w,yL:yL,yR:yR,uy:uy,dl:dl,yc:yc}}
P.mouth=function(ex,mouth,uid,t){
  var m=ex.mouth,a=cl(m.mo+mouth*(1-m.mo*.5),0,1),yc=44,o='';
  if(a<.08&&m.type==='zig'){return Ln('M-24,'+yc+' L-12,'+(yc-8)+' L0,'+(yc+5)+' L12,'+(yc-8)+' L24,'+(yc+3),C.lip,8)}
  if(a<.08&&m.type==='wave'){return Ln('M-26,'+(yc+2)+' Q-13,'+(yc-12)+' 0,'+(yc+2)+' Q13,'+(yc+16)+' 26,'+(yc+2),C.lip,8)}
  var mp=mouthPath(m,a),open=a>.12;
  o+='<clipPath id="'+uid+'_mo"><path d="'+mp.d+'"/></clipPath>';
  o+=Pa(mp.d,open?C.inside:C.lip,' stroke="'+C.lip+'" stroke-width="5" stroke-linejoin="round"');
  if(open){
    o+='<g clip-path="url(#'+uid+'_mo)">';
    if((m.mt||a>.55)&&a>.25&&!m.nt)o+=Pa(mp.up+' Q0,'+f(mp.uy+16)+' '+f(-mp.w)+','+f(mp.yL)+'Z',C.teeth);
    if(a>.55&&!m.nt&&(m.mg||a>.9))o+=El(0,mp.yc+mp.dl*.72,mp.w*.5,9,C.tongue);
    o+='</g>'}
  return o};
/* teeth strip fix: crescent following the upper lip, thin (max ~8px) */
P.mouth_teeth_note='teeth: crescent along the upper lip, clipped to the mouth interior';
P.shoulders=function(){return S1('<path d="M-104,168 C-104,112 -62,98 -26,96 L26,96 C62,98 104,112 104,168Z" fill="'+C.blouse+'"/>')
  +Pa('M-26,96 L26,96 L0,128Z',C.skin2)+Pa('M-30,94 L-26,96 L0,128 L-14,128 L-40,102Z',C.blouse2)+Pa('M30,94 L26,96 L0,128 L14,128 L40,102Z',C.blouse2)};
P.neck=function(){return Pa('M-24,60 L24,60 L28,104 L-28,104Z',C.skin2)};
/* clean back of head: navy cap over the whole skull, parting from crown, nape hairline, no face features */
P.head_back=function(){
  return S1(Pa('M-26,66 L26,66 L30,112 L-30,112Z',C.skin2))
   +S1(Pa('M-108,-10 C-112,-98 -56,-108 0,-108 C56,-108 112,-98 108,-10 C108,30 100,66 84,92 Q72,100 56,90 C30,80 -30,80 -56,90 Q-72,100 -84,92 C-100,66 -108,30 -108,-10Z',C.navy))
   +Pa('M70,-96 C106,-82 114,-36 108,-6 C108,30 100,66 84,92 Q76,98 68,94 C90,50 90,-30 70,-96Z',C.navy2)
   +Pa('M-60,-80 C-86,-64 -92,-20 -88,10 C-76,-20 -66,-50 -60,-80Z',C.navy3)
   +Pa('M-4,-108 L4,-108 L1.5,-52 L-1.5,-52Z',C.skin2)
   +Pa('M-56,90 C-30,80 30,80 56,90 L46,100 C24,92 -24,92 -46,100Z',C.navy2)};

/* head: composition + expression + mouth + gaze; fx outside the skull */
function fxSvg(name,t){
  switch(name){
  case 'sweat':return S2(Pa('M104,-60 C112,-46 116,-40 116,-33 C116,-26 110,-21 104,-21 C98,-21 92,-26 92,-33 C92,-40 96,-46 104,-60Z',C.ice));
  case 'sweat2':return S2(Pa('M-104,-20 C-97,-8 -94,-3 -94,3 C-94,9 -99,13 -104,13 C-109,13 -114,9 -114,3 C-114,-3 -111,-8 -104,-20Z',C.ice));
  case 'dots':{var o='';[0,1,2].forEach(function(i){var s=8+i*3;o+=R(112+i*20-s/2,-82-i*16-s/2,s,s,3,C.txt)});return S2(o)}
  case 'typing':{var o2='';[0,1,2].forEach(function(i){var by=Math.sin((t||0)*7-i*1.1)*4;o2+=R(-17+i*17-5,-124-by,10,10,3,C.txt)});return S2(o2)}
  case 'check':return S2(R(78,-100,42,42,10,C.grn)+Ln('M88,-78 L97,-69 L112,-90','#fff',7));
  case 'warn':return S2(Pa('M104,-104 L128,-62 L80,-62Z',C.red,' stroke="'+C.red+'" stroke-width="8" stroke-linejoin="round"')+R(101,-92,6,16,2,'#fff')+R(101,-71,6,6,2,'#fff'));
  case 'zzz':return T(92,-62,30,'z',C.txt,'middle',' font-weight="700"')+T(114,-86,40,'Z',C.txt,'middle',' font-weight="700"')+T(88,-92,22,'z',C.txt,'middle',' font-weight="700"');
  case 'sparks':return S2(spark(100,-70,16,C.amber2)+spark(-104,-64,12,C.amber2)+spark(118,-30,9,C.amber2));
  case 'glitch':return S2(Pa('M106,-96 L124,-64 L88,-64Z',C.yel)+R(-122,-84,22,22,5,C.cheek,' transform="rotate(20 -111 -73)"')+Pa('M-106,-24 L-94,-36 L-82,-24 L-94,-12Z',C.ice)+R(98,-40,14,14,3,C.grn,' transform="rotate(-25 105 -33)"'));
  }return ''}
function spark(x,y,r,fill){return Pa('M'+x+','+(y-r)+' Q'+(x+r*.2)+','+(y-r*.2)+' '+(x+r)+','+y+' Q'+(x+r*.2)+','+(y+r*.2)+' '+x+','+(y+r)+' Q'+(x-r*.2)+','+(y+r*.2)+' '+(x-r)+','+y+' Q'+(x-r*.2)+','+(y-r*.2)+' '+x+','+(y-r)+'Z',fill)}
NEY.fx=fxSvg;
P.fx=function(n,t){return fxSvg(n,t)};
NEY.head=function(st,t){
  t=t||0;var ex=X[st.expr||'neutral_helpful']||X.neutral_helpful,uid=st.uid||'n',mouth=st.mouth||0;
  var bob=Math.sin(t*2.1)*1.4,tilt=ex.tilt,dy=ex.dy+bob;
  var o='<g>';
  if(st.bust)o+=P.shoulders()+P.neck();
  if(st.back){o+='<g transform="translate(0,'+f(dy)+')">'+P.head_back()+'</g></g>';return o}
  var bl=0;if(ex.eye.t==='open'&&st.blink!==false){var ph=(t%3.4);bl=ph>3.22?1-Math.abs((ph-3.31)/.09):0;bl=cl(bl,0,1)}
  var g=(st.gaze||{x:0,y:0});
  var e2={};for(var k in ex)e2[k]=ex[k];e2.eye={};for(var k2 in ex.eye)e2.eye[k2]=ex.eye[k2];
  if(g.x||g.y){e2.eye.gx=cl(e2.eye.gx+g.x,-1,1);e2.eye.gy=cl(e2.eye.gy+g.y,-1,1);if(e2.eye.gxR!=null){e2.eye.gxR=cl(e2.eye.gxR+g.x,-1,1);e2.eye.gyR=cl(e2.eye.gyR+g.y,-1,1)}}
  o+='<g transform="rotate('+tilt+' 0 80) translate(0,'+f(dy)+')">'+P.hair_back()+P.skull(uid)+P.cheeks(ex)+P.brows(ex)+P.eyes(e2,t,uid,bl)+P.mouth(ex,mouth,uid,t)+P.cap(uid)+'</g>';
  if(st.fx!==false)ex.fx.forEach(function(n){o+='<g transform="translate(0,'+f(dy*.5)+')">'+fxSvg(n,t)+'</g>'});
  return o+'</g>'};
NEY.HEAD_BOX=[-150,-140,300,320];

/* ---------- emoji: flat paper icons, box -12..12 ---------- */
var E=NEY.EMOJI={};
E.heart=function(){return Pa('M0,11 C-14,2 -13,-9 -6,-9 C-3,-9 -1,-7 0,-5 C1,-7 3,-9 6,-9 C13,-9 14,2 0,11Z','#e0505f')};
E.star=function(){return Pa('M0,-12 L3.4,-4 L12,-3.4 L5.6,2.4 L7.6,11 L0,6.4 L-7.6,11 L-5.6,2.4 L-12,-3.4 L-3.4,-4Z','#f3b04a',' stroke="#f3b04a" stroke-width="2" stroke-linejoin="round"')};
E.fire=function(){return Pa('M0,-13 C3,-6 10,-2 9,5 C8,11 4,13 0,13 C-5,13 -9,10 -9,4 C-9,0 -6,-3 -5,-6 C-3,-4 -2,-3 -1,-3 C-1,-7 -1,-10 0,-13Z','#f08a3c')+Pa('M0,3 C3,6 5,8 4,10 C3,12 -3,12 -4,10 C-5,8 -2,6 0,3Z','#ffd27a')};
E.check=function(){return R(-11,-11,22,22,6,'#58d68d')+Ln('M-6,0 L-2,5 L7,-5','#fff',4)};
E.cross=function(){return R(-11,-11,22,22,6,'#e0705f')+Ln('M-5,-5 L5,5 M5,-5 L-5,5','#fff',4)};
E.laugh=function(){return R(-11,-11,22,22,9,'#f6c64a')+Pa('M-8,-3 Q-5,-8 -2,-3 Q-5,-5 -8,-3Z','#6b4a1c')+Pa('M2,-3 Q5,-8 8,-3 Q5,-5 2,-3Z','#6b4a1c')+Pa('M-7,2 Q0,3 7,2 Q5,9 0,9 Q-5,9 -7,2Z','#6b4a1c')};
E.sparkle=function(){return spark(0,0,12,'#f3d27a')+spark(8,-8,4,'#f3d27a')};
E.bulb=function(){return Pa('M0,-12 C8,-12 11,-6 9,-1 C8,2 5,4 5,7 L-5,7 C-5,4 -8,2 -9,-1 C-11,-6 -8,-12 0,-12Z','#f3d27a')+R(-5,8,10,4,2,'#8e8670')};
E.question=function(){return T(0,8,24,'?','#9ec8ff','middle',' font-weight="700"')};
NEY.EMOJI_ORDER=['heart','star','fire','check','cross','laugh','sparkle','bulb','question'];
NEY.emoji=function(name,x,y,k,rot){var fn=E[name];if(!fn)return '';return '<g transform="translate('+f(x)+','+f(y)+') scale('+(k||1)+')'+(rot?' rotate('+rot+')':'')+'">'+fn()+'</g>'};

/* ---------- mode 1: chat window (520 x 440) ---------- */
NEY.SIZE={chat_window:[520,440],monitor_smiley:[520,380],thought_cloud:[400,360]};
function miniHead(cx,cy,k,expr,uid,t){return '<g transform="translate('+f(cx)+','+f(cy)+') scale('+k+')">'+NEY.head({expr:expr,uid:uid,fx:false,blink:false},t)+'</g>'}
P.chat_window=function(st,t){
  var uid=st.uid||'c',lines=st.chat_lines||[],o='<g>';
  var AX=0,AY=0,AW=520,AH=440,top=52,bot=372,areaH=bot-top;
  o+=S1(R(0,0,AW,AH,16,C.win)+Pa('M0,16 Q0,0 16,0 L504,0 Q520,0 520,16 L520,44 L0,44Z',C.win2));
  [[C.red],[C.yel],[C.grn]].forEach(function(c,i){o+=R(18+i*20,16,12,12,4,c[0])});
  o+=T(260,34,16,'Нейросеть · сеанс 1',C.txt);
  o+=S2(R(468,6,36,32,10,'#e6edf9'))+miniHead(486,24,.1,st.expr||'neutral_helpful',uid+'h',t);
  /* layout */
  var items=[],y=0,fs=15,lh=20,fmaxW=300;
  lines.forEach(function(L,i){
    var ai=L.from!=='user',ls=wrap(L.text||'',fs,fmaxW-(L.emoji?24:0),5),tw=0;
    ls.forEach(function(s){tw=Math.max(tw,measure(s,fs))});
    if(L.emoji)tw+=24;
    var bw=Math.max(tw+26,48),bh=ls.length*lh+14;
    items.push({L:L,ai:ai,ls:ls,bw:bw,bh:bh,y:y,react:L.react||[]});
    y+=bh+(L.react&&L.react.length?30:12)});
  if(st.typing){items.push({typing:true,ai:true,bw:62,bh:32,y:y});y+=44}
  var H=Math.max(y,areaH),over=Math.max(0,y-areaH),off=over*(1-cl(st.scroll==null?0:st.scroll,0,1)),base=top+(y<areaH?(areaH-y):0)-off;
  o+='<clipPath id="'+uid+'_ca"><rect x="0" y="'+top+'" width="520" height="'+areaH+'"/></clipPath><g clip-path="url(#'+uid+'_ca)">';
  items.forEach(function(it,i){
    var by=base+it.y,bx=it.ai?70:506-it.bw,fill=it.ai?C.aiB:C.usB,tc=it.ai?C.aiT:C.usT;
    if(it.ai){var ex=(it.L&&it.L.expr)||(it.typing?'typing':'neutral_helpful');o+=S2(R(16,by+it.bh-40,42,40,13,'#e6edf9'))+miniHead(37,by+it.bh-18,.165,ex,uid+'a'+i,t)}
    var tail=it.ai?'M'+(bx+2)+','+f(by+it.bh-14)+' L'+(bx-10)+','+f(by+it.bh)+' L'+(bx+16)+','+f(by+it.bh-4)+'Z':'M'+(bx+it.bw-2)+','+f(by+it.bh-14)+' L'+(bx+it.bw+10)+','+f(by+it.bh)+' L'+(bx+it.bw-16)+','+f(by+it.bh-4)+'Z';
    o+=S2(R(bx,by,it.bw,it.bh,14,fill)+Pa(tail,fill));
    if(it.typing){[0,1,2].forEach(function(j){var bo=Math.sin(t*7-j*1.1)*3;o+=R(bx+16+j*14,by+it.bh/2-5-bo,10,10,3,'#cfe0ff',j===2?' opacity=".7"':'')})}
    else{it.ls.forEach(function(s,j){o+=T(bx+13,by+22+j*lh,fs,s,tc,'start')});
      if(it.L.emoji)o+=NEY.emoji(it.L.emoji,bx+it.bw-20,by+it.bh-17,.95);
      it.react.forEach(function(r,j){var rx=bx+j*54,ry=by+it.bh+3;o+=S2(R(rx,ry,48,22,8,it.ai?'#1f3568':'#c9bda1'))+NEY.emoji(r.e,rx+14,ry+11,.62)+T(rx+32,ry+16,13,String(r.n==null?1:r.n),it.ai?C.aiT:C.usT,'start')})}});
  o+='</g>';
  if(over>0){var th=Math.max(26,areaH*areaH/y),tp=top+4+(areaH-8-th)*(off>0&&over?1-off/over:1);o+=R(510,top+2,5,areaH-4,2.5,'#101a31')+R(510,f(tp),5,f(th),2.5,'#6f83aa')}
  o+=R(14,384,492,42,13,C.field)+T(30,411,14,'> пожелание…','#6f83aa','start')
   +'<g>'+R(150,392,9,22,1,C.amber)+'</g>'+S2(R(464,390,34,30,10,C.amber)+Pa('M473,405 L489,397 L484,413 L481,406Z','#fff'));
  return o+'</g>'};

/* ---------- mode 2: monitor smiley (520 x 380); st.frame false = bare screen content 460x260 at (30,24) ---------- */
P.monitor_smiley=function(st,t){
  var uid=st.uid||'m',o='<g>',sx=30,sy=24,sw=460,sh=264;
  if(st.frame!==false){
    o+=S1(R(10,6,500,300,18,C.body))+S1(R(220,306,80,26,3,'#2e3752')+R(170,330,180,16,6,'#3a4258'));
    o+=R(sx-6,sy-6,sw+12,sh+12,12,'#262e46')}
  o+=R(sx,sy,sw,sh,9,C.scr)+R(sx+42,sy+14,sw-84,sh-62,40,C.scr2);
  o+='<g transform="translate('+(sx+sw/2)+','+(sy+114)+') scale(.62)">'+NEY.head({expr:st.expr||'neutral_helpful',mouth:st.mouth,uid:uid,gaze:st.gaze,bust:false},t)+'</g>';
  var ph=fit(st.phrase||'',20,sw-40);
  o+=T(sx+sw/2,sy+sh-22,20,ph,'#cfe6ff');
  if(st.emoji)o+=S2(NEY.emoji(st.emoji,sx+sw-46,sy+40,1.9,8));
  return o+'</g>'};

/* ---------- mode 3: thought cloud (400 x 360), tail toward bottom-left, pivot at tail tip (40,350) ---------- */
P.thought_cloud=function(st,t){
  var uid=st.uid||'k',o='<g>',cs=[[96,150,52,46],[150,98,58,50],[220,84,62,54],[290,104,56,50],[330,160,50,44],[282,206,58,48],[200,218,62,48],[120,206,54,44]];
  var cloud='';cs.forEach(function(c){cloud+=El(c[0],c[1],c[2],c[3],C.cloud)});cloud+=R(96,120,236,90,36,C.cloud);
  o+=S1(cloud+El(74,262,16,12,C.cloud)+El(52,300,11,8.5,C.cloud)+El(38,334,7,5.5,C.cloud));
  o+=Pa('M130,236 C180,262 270,262 318,206 C312,238 270,262 214,268 C176,268 148,256 130,236Z',C.cloud2);
  o+='<g transform="translate(216,138) scale(.55)">'+NEY.head({expr:st.expr||'neutral_helpful',mouth:st.mouth,uid:uid,gaze:st.gaze,bust:false,fx:false},t)+'</g>';
  if(st.phrase)o+=T(216,224,17,fit(st.phrase,17,232),C.cloudT);
  if(st.emoji)o+=S2(NEY.emoji(st.emoji,330,64,1.7,10));
  return o+'</g>'};

/* ---------- registry ---------- */
NEY.draw=function(st,t){
  var m=st.mode||'head',fn=P[m];
  if(m==='head')return NEY.head(st,t);
  if(m==='head_back')return NEY.head({back:true,bust:st.bust,uid:st.uid},t);
  if(!fn)throw new Error('neyroset: unknown mode '+m);
  return fn(st,t)};
NEY.MODES={
  chat_window:{size:NEY.SIZE.chat_window,slots:['chat_lines','typing','emoji','scroll','expr']},
  monitor_smiley:{size:NEY.SIZE.monitor_smiley,slots:['phrase','emoji','expr','mouth','frame']},
  thought_cloud:{size:NEY.SIZE.thought_cloud,slots:['phrase','emoji','expr','mouth']},
  head:{size:NEY.HEAD_BOX,slots:['expr','mouth','gaze','bust','fx']},
  head_back:{slots:['bust']}};
if(window.HF){HF.RIGS=HF.RIGS||{};HF.RIGS.neyroset=NEY}
})();
