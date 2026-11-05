/* cast_cut.js - Palych + Stas options in the Vadik cut-paper language. Local space: origin neck base, +y down, shoulders y~24. */
(function(){
var C=window.CAST={};
function f(n){return Math.round(n*10)/10}
var UID=0;function uid(){return 'cc'+(++UID)}
function sh(m,k){return '<g filter="url(#s'+(k||1)+')">'+m+'</g>'}
function P(d,fill,x){return '<path d="'+d+'" fill="'+fill+'"'+(x||'')+'/>'}
function L(pts,w,col,x){return '<path d="M'+pts.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" fill="none"'+(x||'')+'/>'}
function E(cx,cy,rx,ry,fill,x){return '<ellipse cx="'+f(cx)+'" cy="'+f(cy)+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'"'+(x||'')+'/>'}
function lerpPoly(pts,t){var i=Math.min(Math.floor(t),pts.length-2),u=t-i;var a=pts[i],b=pts[i+1];return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]}
function trimPoly(pts,t){var o=[pts[0]],i;for(i=1;i<=Math.floor(t)&&i<pts.length;i++)o.push(pts[i]);if(t<pts.length-1&&t!==Math.floor(t))o.push(lerpPoly(pts,t));return o}

/* arm: pts [shoulder, elbow, hand]; sleeve covers 0..sl along the polyline (2 = whole) */
function arm(pts,aw,skin,sleeve,sleeve2,sl,cuff){
  var o=L(pts,aw*0.8,skin);
  if(sl>0){var sp=trimPoly(pts,sl);o+=L(sp,aw,sleeve);
    if(cuff){var e=sp[sp.length-1],pv=sp[sp.length-2];o+=L([lerpPoly([pv,e],0.82),e],aw+3,cuff)}}
  return o}
function hand(h,skin,skin2,s,rot){return '<g transform="translate('+f(h[0])+','+f(h[1])+') rotate('+(rot||0)+') scale('+(s||1)+')">'+E(0,6,11.5,15,skin)+E(-9,0,4.5,9,skin2,' transform="rotate(14 -9 0)"')+'</g>'}
function shoe(x,fl,d,c){
  var o='<g transform="translate('+f(x)+','+f(fl)+') scale('+d+',1)">';
  o+=P('M-17,-30 L15,-30 C20,-20 40,-22 49,-8 Q53,0 44,0 L-16,0 Q-21,0 -21,-9 Z',c.upper);
  o+=P('M-21,-7 L50,-7 Q52,0 44,0 L-16,0 Q-21,0 -21,-7 Z',c.sole);
  o+=P('M-21,-7 L-18,-14 L-10,-14 L-10,-7Z',c.acc||c.upper);
  if(c.laces){o+=L([[3,-24],[13,-22]],2,c.laces)+L([[0,-18],[14,-17]],2,c.laces)+L([[-3,-12],[16,-12]],2,c.laces)}
  if(c.toe)o+=P('M26,-17 C36,-18 44,-12 49,-8 Q51,-4 46,-3 C38,-5 30,-8 26,-17Z',c.toe);
  return o+'</g>'}

/* skull path */
function skull(H){var w=H.w,T=H.top,c=H.chin,j=w*H.jw;
  if(H.sq)return 'M'+f(-w*.55)+','+T+' L'+f(w*.55)+','+T+' C'+f(w*.85)+','+T+' '+w+','+(T+14)+' '+w+',-60 C'+f(j)+',-34 '+f(j)+',-8 '+f(j*.86)+','+(c-6)+' Q'+f(j*.8)+','+c+' '+f(j*.5)+','+c+' L'+f(-j*.5)+','+c+' Q'+f(-j*.8)+','+c+' '+f(-j*.86)+','+(c-6)+' C'+f(-j)+',-8 '+f(-j)+',-34 '+(-w)+',-60 C'+(-w)+','+(T+14)+' '+f(-w*.85)+','+T+' '+f(-w*.55)+','+T+' Z';
  return 'M0,'+T+' C'+f(w*.62)+','+T+' '+w+',-96 '+w+',-60 C'+f(j)+',-30 '+f(j*.68)+','+(c-10)+' '+f(w*.24)+','+c+' Q0,'+(c+4)+' '+f(-w*.24)+','+c+' C'+f(-j*.68)+','+(c-10)+' '+f(-j)+',-30 '+(-w)+',-60 C'+(-w)+',-96 '+f(-w*.62)+','+T+' 0,'+T+' Z'}
function headBase(H){var u=uid(),sk=skull(H),w=H.w,o='';
  var ey=H.earY||-56;
  o+=E(-w-1,ey,H.earRx||9,H.earRy||14,H.skin)+E(w+1,ey,H.earRx||9,H.earRy||14,H.skin);
  o+=E(-w-1,ey+1,(H.earRx||9)*.5,(H.earRy||14)*.6,H.skin2)+E(w+1,ey+1,(H.earRx||9)*.5,(H.earRy||14)*.6,H.skin2);
  o+='<defs><clipPath id="'+u+'"><path d="'+sk+'"/></clipPath></defs>'+P(sk,H.skin);
  o+='<g clip-path="url(#'+u+')">'+P('M'+f(w*.15)+',-140 C'+f(w*.85)+',-100 '+f(w*.95)+',-50 '+f(w*.55)+',-12 L'+f(w*.2)+',30 L90,30 L90,-140Z',H.skin2,' opacity=".8"');
  o+=E(-w*.46,-30,H.cw||10,6,H.cheek,' opacity="'+H.cheekO+'"')+E(w*.46,-30,H.cw||10,6,H.cheek,' opacity="'+H.cheekO+'"');
  if(H.jowl)o+=P('M'+f(-w)+',-20 Q'+f(-w*.7)+',20 '+f(-w*.3)+',20 L'+f(w*.3)+',20 Q'+f(w*.7)+',20 '+w+',-20 L90,40 L-90,40Z',H.skin2,' opacity=".35"');
  o+='</g>';return o}

function face(F,H){var o='',s,cx,u,ry=F.ry,rx=F.rx,ey=F.ey;
  [-1,1].forEach(function(sg){cx=sg*F.dx;u=uid();
    o+='<defs><clipPath id="'+u+'"><ellipse cx="'+cx+'" cy="'+ey+'" rx="'+rx+'" ry="'+ry+'"/></clipPath></defs>'+E(cx,ey,rx,ry,'#f5f2ea');
    o+='<g clip-path="url(#'+u+')">'+E(cx+F.gx,ey+F.gy,ry*.68,ry*.68,'#1e1c22')+E(cx+F.gx-1.5,ey+F.gy-2,1.6,1.6,'#fff',' opacity=".8"');
    var lh=(ry*2+2)*(1-F.open);o+='<rect x="'+(cx-rx-1)+'" y="'+(ey-ry-1)+'" width="'+(rx*2+2)+'" height="'+f(lh)+'" fill="'+F.lid+'"/>'+L([[cx-rx,ey-ry+lh-1],[cx+rx,ey-ry+lh-1]],2.2,F.lidLine,' opacity=".9"')+'</g>';
    if(F.bags)o+='<path d="M'+(cx-rx)+','+(ey+ry+5)+' Q'+cx+','+(ey+ry+12)+' '+(cx+rx)+','+(ey+ry+5)+'" stroke="'+F.bagCol+'" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".55"';
    if(F.bags)o+='/>';
    var b=F.brow,ix=cx-sg*b.len*.5,ox=cx+sg*b.len*.5;
    o+='<path d="M'+f(ix)+','+(b.y+b.dy)+' Q'+f(cx)+','+(b.y+b.dy*.4-2)+' '+f(ox)+','+(b.y+(b.out||0))+'" stroke="'+b.col+'" stroke-width="'+b.w+'" fill="none" stroke-linecap="round"/>'});
  var n=F.nose,ns=n.s;
  o+='<g transform="translate(0,'+n.y+') scale('+ns+')">'+P('M0,-14 C8,-6 11,2 8,7 Q0,11 -8,7 C-11,2 -8,-6 0,-14Z',H.nose)+P('M0,-14 C8,-6 11,2 8,7 Q4,6 3,0 Q2,-8 0,-14Z',H.noseHi,' opacity=".55"')+E(-4,6,1.8,1.2,H.nostril)+E(4,6,1.8,1.2,H.nostril)+'</g>';
  var m=F.mouth;o+='<path d="M'+(-m.w)+','+m.y+' Q0,'+(m.y+m.c)+' '+m.w+','+m.y+'" stroke="'+m.col+'" stroke-width="'+(m.sw||2.8)+'" fill="none" stroke-linecap="round"/>';
  return o}

function torsoPath(D){var sw=D.sw,bw=D.bw,tl=D.tl;
  return 'M-18,-8 C'+f(-sw*.5)+',-6 '+(-sw)+',6 '+(-sw)+',34 C'+(-sw+2)+','+f(tl*.45)+' '+f(-bw-4)+','+f(tl*.62)+' '+(-bw)+','+tl+' L'+bw+','+tl+' C'+f(bw+4)+','+f(tl*.62)+' '+(sw-2)+','+f(tl*.45)+' '+sw+',34 C'+sw+',6 '+f(sw*.5)+',-6 18,-8 Z'}

/* common body builder. D: dims+colours; D.clothes(), D.head(), D.arms(), D.acc() return markup */
function build(D,full){
  var o='',hx=D.hx,fl=D.floor,tl=D.tl,sk=D.skin;
  if(full)o+=E(0,fl+2,D.sw*1.15,9,'#0b1020',' opacity=".5" filter="url(#sb)"')+E(0,fl,D.sw*.8,4,'#0b1020',' opacity=".6" filter="url(#sb2)"');
  var kn=(tl+fl-24)/2;
  var hw=D.legW;
  var legs=L([[-hx,tl-10],[-hx*.96,kn]],hw,D.pants)+L([[-hx*.96,kn],[-hx*.9,fl-36]],hw*.82,D.pants)+L([[hx,tl-10],[hx*.96,kn]],hw,D.pants)+L([[hx*.96,kn],[hx*.9,fl-36]],hw*.82,D.pants);
  o+=sh(legs,2);
  var pT=D.pTop!=null?D.pTop:tl-10;o+=P('M'+f(-D.bw*.95)+','+pT+' L'+f(D.bw*.95)+','+pT+' L'+f(hx+hw/2)+','+(tl+70)+' L'+f(-hx-hw/2)+','+(tl+70)+'Z',D.pants);
  o+=sh(shoe(-hx-3,fl,-1,D.shoe)+shoe(hx+3,fl,1,D.shoe),2);
  o+=P('M'+(-D.nw)+',-34 L'+D.nw+',-34 L'+D.nw+',6 Q0,22 '+(-D.nw)+',6 Z',D.skin2);
  var tm=P(torsoPath(D),D.top)+(D.torsoSh?P('M'+f(D.sw*.2)+',-8 C'+f(D.sw*.6)+',-6 '+D.sw+',6 '+D.sw+',34 C'+(D.sw-2)+','+f(tl*.45)+' '+f(D.bw+4)+','+f(tl*.62)+' '+D.bw+','+tl+' L'+f(D.bw*.2)+','+tl+'Z',D.torsoSh,' opacity=".5"'):'');if(D.cut!=null){var cu=uid();tm='<defs><clipPath id="'+cu+'"><rect x="-300" y="-80" width="600" height="'+(D.cut+80)+'"/></clipPath></defs><g clip-path="url(#'+cu+')">'+tm+'</g>'}o+=sh(tm);
  o+=D.clothes();
  o+=D.arms();
  o+=sh('<g transform="translate(0,'+(-(D.lift||0))+')">'+D.head()+'</g>');
  if(D.acc)o+=D.acc();
  return o}

function defs(){return '<defs><filter id="s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="#0b1020" flood-opacity=".38"/></filter><filter id="s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#0b1020" flood-opacity=".34"/></filter><filter id="sb" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><filter id="sb2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>'}
C.defs=defs;

/* ---------------- palettes */
var SKP={skin:'#dcab88',skin2:'#c99476',cheek:'#cd7f68',cheekO:.5,nose:'#d1946f',noseHi:'#e6b793',nostril:'#8a5440'};
var SKS={skin:'#e9d0b8',skin2:'#d6b79e',cheek:'#d9a090',cheekO:.14,nose:'#dcb79c',noseHi:'#efd8c2',nostril:'#a8745f'};
function mix(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in b)o[k]=b[k];return o}
var PANTS_P='#3f4439',SHOE_P={upper:'#262a30',sole:'#15181c',laces:null};

/* ================= PALYCH 1: Прапор */
C.p1=function(full){
  var D=mix(SKP,{sw:92,bw:98,tl:236,floor:548,hx:34,legW:46,nw:30,top:'#7d8660',torsoSh:'#6a7352',pants:PANTS_P,pants2:'#34382f',shoe:SHOE_P});
  D.clothes=function(){var o='';
    o+=P('M-12,-6 L-44,-4 L-30,30 L-4,18Z','#8c9570')+P('M12,-6 L44,-4 L30,30 L4,18Z','#8c9570');
    o+=E(-25,-4,14,8,D.skin,' opacity=".0"')+E(26,-4,13,7,D.skin,' opacity="0"');
    o+=L([[0,20],[0,236]],1.6,'#5d6548',' opacity=".7"');
    [[-1],[1]].forEach(function(s){var x=s[0]*70;o+=sh(P('M'+(x-22)+',10 L'+(x+22)+',10 L'+(x+22)+',34 L'+(x-22)+',34Z','#6b7352')+L([[x-22,22],[x+22,22]],3,'#b28b34'),2)});
    o+=P('M-52,62 L-14,62 L-14,104 L-33,112 L-52,104Z','#6f7854')+L([[-52,70],[-14,70]],1.5,'#5d6548');
    o+=L([[-42,66],[-42,50]],4,'#2c3f74')+L([[-30,66],[-29,46]],4,'#26282c');
    o+=P('M-9,18 L9,18 L7,30 L-7,30Z','#8e6c2b')+sh(P('M-8,28 L8,28 L12,70 L0,80 L-12,70Z','#a07c34'));
    o+=L([[-4,34],[4,34]],1.4,'#7b5c22')+L([[-6,52],[6,52]],1.4,'#7b5c22');
    o+=L([[8,150],[22,156]],1.8,'#5d6548')+L([[8,162],[24,160]],1.8,'#5d6548')+L([[-4,176],[-20,172]],1.8,'#5d6548');
    o+=E(-23,-8,12,7,D.skin,' opacity="1"')+E(23,-8,12,7,D.skin,' opacity="1"');
    return o};
  D.arms=function(){var o='';
    [[-1],[1]].forEach(function(s){var d=s[0];var p=[[d*(D.sw-8),30],[d*(D.sw+6),122],[d*(D.sw-2),214]];
      o+=sh(arm(p,40,D.skin,D.top,D.torsoSh,0.82,'#6a7352')+hand(p[2],D.skin,D.skin2,1.05,0),2)});
    return o};
  D.head=function(){var H=mix(SKP,{w:64,top:-122,jw:1.1,chin:8,sq:1,earRx:10,earRy:15}),o=headBase(H);
    var w=H.w,g='#8f9396',g2='#777b7e';
    o+=P('M'+(-w-2)+',-70 L'+(-w+3)+',-120 Q'+(-w+6)+',-138 '+(-w+24)+',-138 L'+(w-24)+',-138 Q'+(w-6)+',-138 '+(w-3)+',-120 L'+(w+2)+',-70 C'+(w-6)+',-84 '+(w-14)+',-96 '+(w-24)+',-102 L'+(-w+24)+',-102 C'+(-w+14)+',-96 '+(-w+6)+',-84 '+(-w-2)+',-70Z',g);
    o+=P('M'+f(w*.2)+',-137 L'+(w-24)+',-138 Q'+(w-6)+',-138 '+(w-3)+',-120 L'+(w+2)+',-70 C'+(w-6)+',-84 '+(w-14)+',-96 '+(w-24)+',-102 L'+f(w*.2)+',-102Z',g2,' opacity=".6"');
    for(var i=0;i<9;i++)o+=L([[-w+14+i*13,-120],[-w+14+i*13,-110]],1.4,g2,' opacity=".55"');
    o+=face({dx:25,ey:-62,rx:9,ry:7,open:.78,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:1,bags:1,bagCol:'#a87558',
      brow:{len:28,y:-80,dy:3,out:-2,w:9,col:'#5b574f'},nose:{y:-34,s:1.3},mouth:{y:-12,c:-3,w:17,col:'#7a3f36',sw:3.4}},mix(H,{nose:'#d1946f',noseHi:'#e6b793',nostril:'#7a4a3a'}));
    o+=P('M-34,-27 C-26,-42 -8,-39 0,-35 C8,-39 26,-42 34,-27 C26,-19 10,-26 0,-25 C-10,-26 -26,-19 -34,-27Z','#7a7468');
    o+=P('M0,-35 C8,-39 26,-42 34,-27 C26,-19 10,-26 0,-25Z','#6a6559',' opacity=".6"');
    return o};
  return build(D,full)};

/* ================= PALYCH 2: Кладовщик-жилет */
C.p2=function(full){
  var D=mix(SKP,{sw:80,bw:104,tl:240,floor:552,hx:36,legW:48,nw:30,top:'#6b7d4e',torsoSh:'#586840',pants:'#4a4a42',pants2:'#3a3a34',shoe:{upper:'#4a3a2e',sole:'#241a14',laces:null}});
  D.clothes=function(){var o='';
    o+=P('M-16,-6 L16,-6 L24,'+D.tl+' L-24,'+D.tl+'Z','#d9d3bd');
    o+=P('M-12,-6 L-34,-2 L-26,26 L-6,14Z','#e8e3d0')+P('M12,-6 L34,-2 L26,26 L6,14Z','#e8e3d0');
    o+=L([[-18,20],[-24,236]],2.2,'#4b5a36')+L([[18,20],[24,236]],2.2,'#4b5a36');
    o+=P('M-62,50 L-26,50 L-26,92 L-44,98 L-62,92Z','#5b6c40')+L([[-62,56],[-26,56]],2,'#46552f')+E(-44,70,3,3,'#c9b26a');
    o+=P('M62,50 L26,50 L26,92 L44,98 L62,92Z','#5b6c40')+L([[62,56],[26,56]],2,'#46552f')+E(44,70,3,3,'#c9b26a');
    o+=P('M-70,140 L-30,140 L-30,176 L-70,176Z','#5b6c40')+P('M-70,140 L-30,140 L-30,152 L-70,152Z','#46552f');
    o+=P('M70,140 L30,140 L30,176 L70,176Z','#5b6c40')+P('M70,140 L30,140 L30,152 L70,152Z','#46552f');
    return o};
  D.arms=function(){var o='',d;
    d=-1;var p=[[d*(D.sw-6),30],[d*(D.sw+8),122],[d*(D.sw+2),214]];
    o+=sh(arm(p,40,D.skin,'#d9d3bd',null,2,null)+hand(p[2],D.skin,D.skin2,1.05),2);
    d=1;var q=[[d*(D.sw-6),30],[d*(D.sw+14),116],[34,138]];
    o+=sh(arm(q,40,D.skin,'#d9d3bd',null,1.6,'#c8c2ab'),2);
    return o};
  D.head=function(){var H=mix(SKP,{w:68,top:-120,jw:.9,chin:2,earRx:10,earRy:16,cw:12,cheekO:.55}),o=headBase(H),w=H.w,g='#9a9da0';
    o+=E(-14,-114,26,7,'#efc9a8',' opacity=".4"');
    o+=P('M'+(-w+1)+',-86 C'+(-w-8)+',-80 '+(-w-8)+',-44 '+(-w+6)+',-34 C'+(-w+12)+',-50 '+(-w+10)+',-72 '+(-w+6)+',-88Z',g)+P('M'+(w-1)+',-86 C'+(w+8)+',-80 '+(w+8)+',-44 '+(w-6)+',-34 C'+(w-12)+',-50 '+(w-10)+',-72 '+(w-6)+',-88Z','#85888b');
    o+=face({dx:25,ey:-60,rx:8,ry:6.5,open:.85,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:1,bags:1,bagCol:'#a87558',
      brow:{len:26,y:-77,dy:-1,out:1,w:8,col:'#8d9093'},nose:{y:-34,s:1.5},mouth:{y:-13,c:-2,w:14,col:'#7a3f36'}},mix(H,{nostril:'#7a4a3a'}));
    o+='<g fill="none" stroke="#b79a52" stroke-width="2.8"><circle cx="-25" cy="-60" r="15" fill="#e8f3f8" fill-opacity=".18"/><circle cx="25" cy="-60" r="15" fill="#e8f3f8" fill-opacity=".18"/><path d="M-10,-62 Q0,-67 10,-62"/><path d="M-40,-62 L'+(-w-2)+',-66 M40,-62 L'+(w+2)+',-66"/></g>';
    return o};
  D.acc=function(){var o='';
    o+='<g filter="url(#s1)">'+P('M24,96 L70,96 L68,142 Q47,148 26,142Z','#efe9d8')+P('M70,106 Q86,106 86,122 Q86,136 68,134','none',' stroke="#efe9d8" stroke-width="7"')+P('M24,96 L70,96 L70,102 L24,102Z','#c4673a')+'</g>';
    o+=P('M36,114 L56,114 L56,128 L36,128Z','#d6a935')+L([[46,116],[46,126]],1.5,'#8c6b1a')+L([[41,121],[51,121]],1.5,'#8c6b1a');
    o+=hand([30,126],D.skin,D.skin2,1.0,-8)+E(24,134,6,9,D.skin);
    o+='<path d="M36,88 Q30,78 38,70 Q46,62 40,52" stroke="#e8e8ee" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".35"/><path d="M54,88 Q60,80 52,72 Q46,64 54,56" stroke="#e8e8ee" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".3"/>';
    return o};
  return build(D,full)};

/* ================= PALYCH 3: Директор в пиджаке */
C.p3=function(full){
  var D=mix(SKP,{sw:98,bw:84,tl:238,floor:550,hx:30,legW:40,nw:24,top:'#7b6a47',torsoSh:'#675838',pants:'#3a3b3a',pants2:'#2d2e2d',shoe:{upper:'#2a2220',sole:'#150f0e',laces:null}});
  D.clothes=function(){var o='';
    o+=P('M-18,-6 L18,-6 L26,150 L-26,150Z','#ddd8c6');
    o+=P('M-10,-6 L-26,0 L-16,24 L-4,12Z','#ece8d8')+P('M10,-6 L26,0 L16,24 L4,12Z','#ece8d8');
    o+=P('M-6,14 L6,14 L5,24 L-5,24Z','#2f3a4d')+sh(P('M-6,24 L6,24 L9,120 L0,128 L-9,120Z','#34425a'),2)+L([[-4,50],[5,60]],3,'#6c7c96')+L([[-5,78],[6,88]],3,'#6c7c96');
    o+=P('M-18,-8 L-62,-2 L-70,30 L-60,60 L-40,150 L-26,150 L-34,66 L-22,22Z','#8a7a56')+P('M18,-8 L62,-2 L70,30 L60,60 L40,150 L26,150 L34,66 L22,22Z','#8a7a56');
    o+=L([[-40,150],[-26,150]],2,'#5d4f33')+E(-28,170,4.4,4.4,'#4a3e28')+E(28,170,4.4,4.4,'#4a3e28');
    o+=P('M-70,86 L-48,86 L-48,98 L-70,98Z','#6a5b3b',' opacity=".0"');
    o+=P('M-74,18 L-52,18 L-52,30 L-74,34Z','#8a7a56',' opacity="0"');
    return o};
  D.arms=function(){var o='',d;
    d=-1;var p=[[d*(D.sw-8),30],[d*(D.sw+2),112],[-24,134]];
    o+=sh(arm(p,40,D.skin,D.top,D.torsoSh,1.78,'#675838'),2);
    d=1;var q=[[d*(D.sw-8),30],[d*(D.sw+4),122],[d*(D.sw-2),214]];
    o+=sh(arm(q,40,D.skin,D.top,D.torsoSh,1.52,'#675838'),2);
    o+=P('M'+(q[2][0]-14)+','+(q[2][1]-34)+' L'+(q[2][0]+12)+','+(q[2][1]-34)+' L'+(q[2][0]+12)+','+(q[2][1]-22)+' L'+(q[2][0]-14)+','+(q[2][1]-22)+'Z','#c9a843',' opacity=".0"');
    o+=hand(q[2],D.skin,D.skin2,1.05)+'<rect x="'+(q[2][0]-14)+'" y="'+(q[2][1]-20)+'" width="28" height="10" rx="4" fill="#c9a843"/><rect x="'+(q[2][0]-8)+'" y="'+(q[2][1]-18)+'" width="16" height="6" rx="2" fill="#e8e3d0"/>';
    return o};
  D.head=function(){var H=mix(SKP,{w:50,top:-130,jw:.82,chin:24,earRx:11,earRy:19,earY:-60,cheekO:.34,jowl:1}),o=headBase(H),w=H.w,g='#9a9da0';
    o+=P('M'+(-w-2)+',-66 C'+(-w-6)+',-116 '+f(-w*.4)+',-140 6,-140 C'+f(w*.8)+',-139 '+(w+6)+',-112 '+(w+2)+',-66 C'+(w-2)+',-84 '+(w-8)+',-94 '+(w-14)+',-106 C'+f(w*.4)+',-100 '+f(-w*.1)+',-102 '+f(-w*.6)+',-92 C'+f(-w*.8)+',-86 '+(-w+2)+',-76 '+(-w-2)+',-66Z',g);
    o+=P('M6,-139 C'+f(w*.8)+',-138 '+(w+6)+',-112 '+(w+2)+',-66 C'+(w-2)+',-84 '+(w-8)+',-94 '+(w-14)+',-106 C'+f(w*.4)+',-112 '+f(w*.2)+',-124 6,-139Z','#85898c',' opacity=".7"');
    o+=L([[-w*.4,-128],[w*.5,-114]],1.6,'#7e8285',' opacity=".6"')+L([[-w*.55,-116],[w*.3,-104]],1.6,'#7e8285',' opacity=".6"');
    o+=face({dx:21,ey:-62,rx:8,ry:6,open:.8,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:1,bags:1,bagCol:'#a87558',
      brow:{len:24,y:-80,dy:-3,out:2,w:8,col:'#6d6a64'},nose:{y:-30,s:1.45},mouth:{y:-8,c:-3,w:13,col:'#7a3f36',sw:2.6}},mix(H,{nostril:'#7a4a3a'}));
    o+='<path d="M-30,-26 Q-26,-6 -20,0 M30,-26 Q26,-6 20,0" stroke="#b98366" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>';
    return o};
  D.acc=function(){var o='';
    o+='<g filter="url(#s1)"><g transform="rotate(6 -20 110)">'+P('M-56,76 L2,76 L2,150 L-56,150Z','#4a3626')+P('M-56,76 L-50,76 L-50,150 L-56,150Z','#33251a')+P('M-2,76 L2,76 L2,88 L-8,76Z','#c9a843')+L([[-44,96],[-10,96]],2,'#c9a843',' opacity=".8"')+'</g></g>';
    o+=hand([-24,134],D.skin,D.skin2,1.05,-60);
    return o};
  return build(D,full)};

/* ================= STAS 1: Капюшон */
C.s1=function(full){
  var D=mix(SKS,{sw:62,bw:60,tl:262,floor:590,hx:24,legW:34,nw:20,top:'#58807f',torsoSh:'#476b6c',pants:'#3a3f4f',pants2:'#2f3342',shoe:{upper:'#4a566c',sole:'#e8e2d2',laces:'#e8e2d2',acc:'#3f9a94',toe:'#e8e2d2'}});
  D.clothes=function(){var o='';
    o+=sh(E(0,-14,58,24,'#476b6c'),2)+E(0,-8,40,16,'#3a5859');
    o+=P('M-20,-4 Q0,26 20,-4 L16,-8 Q0,10 -16,-8Z','#3a5859');
    o+=L([[-9,18],[-11,66]],2.6,'#e6ece8')+L([[9,18],[11,62]],2.6,'#e6ece8')+E(-11,68,3,3,'#e6ece8')+E(11,64,3,3,'#e6ece8');
    o+=L([[-20,-2],[-8,76]],5,'#cfe3df',' opacity="1"')+L([[20,-2],[8,76]],5,'#cfe3df');
    o+='<g filter="url(#s2)"><rect x="-13" y="72" width="26" height="36" rx="3" fill="#f1efe6"/><rect x="-13" y="72" width="26" height="9" fill="#3f9a94"/><rect x="-8" y="88" width="16" height="3" fill="#b4c3d1"/><rect x="-8" y="95" width="12" height="3" fill="#b4c3d1"/></g>';
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-6),30],[d*(D.sw+2),124],[d*(D.sw-4),216]];
      o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.92,'#476b6c')+hand(p[2],D.skin,D.skin2,.95),2)});
    return o};
  D.head=function(){var H=mix(SKS,{w:52,top:-120,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),o=headBase(H),w=H.w,hc='#34303a';
    o+=P('M'+(-w-2)+',-62 C'+(-w-4)+',-104 '+f(-w*.6)+',-122 0,-123 C'+f(w*.6)+',-122 '+(w+4)+',-104 '+(w+2)+',-62 C'+(w-6)+',-80 '+(w*.5)+',-94 '+f(w*.2)+',-98 C'+f(-w*.3)+',-90 '+f(-w*.7)+',-84 '+(-w-2)+',-62Z',hc);
    o+=sh(P('M-30,-110 C-6,-142 '+(w+8)+',-126 '+(w+12)+',-66 L'+(w+8)+',-30 L'+(w-8)+',-36 C'+(w-10)+',-70 '+(w-14)+',-96 '+(w-26)+',-102 C-2,-114 -14,-110 -30,-110Z','#58807f'),2);
    o+=P('M-30,-110 C-6,-142 '+(w+8)+',-126 '+(w+12)+',-66 L'+(w+8)+',-30 L'+(w-8)+',-36 C'+(w-10)+',-70 '+(w-14)+',-96 '+(w-26)+',-102Z','#476b6c',' opacity=".5"');
    o+=P('M-24,-108 C-30,-96 -26,-90 -14,-84 C-8,-92 -10,-100 -6,-106Z',hc);
    o+=face({dx:21,ey:-58,rx:8,ry:6.5,open:.42,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:1.5,bags:1,bagCol:'#b4877b',
      brow:{len:24,y:-72,dy:1,out:-1,w:5.5,col:'#3a3340'},nose:{y:-35,s:.95},mouth:{y:-14,c:-.5,w:10,col:'#9a5a52',sw:2.4}},mix(H,{nostril:'#a8745f'}));
    return o};
  return build(D,full)};

/* ================= STAS 2: Чёлка и блокнот */
C.s2=function(full){
  var D=mix(SKS,{sw:58,bw:56,tl:262,floor:590,hx:23,legW:33,nw:19,top:'#5b5a70',torsoSh:'#4b4a5e',pants:'#34383f',pants2:'#2a2d33',shoe:{upper:'#2e3440',sole:'#c9c6bd',laces:'#c9c6bd',acc:'#3f9a94',toe:'#c9c6bd'}});
  D.clothes=function(){var o='';
    o+=P('M-24,-6 Q0,30 24,-6 L18,-10 Q0,12 -18,-10Z','#4b4a5e')+P('M-20,-6 Q0,22 20,-6','none',' stroke="#6b6a82" stroke-width="3"');
    o+=L([[-18,0],[-6,70]],4.4,'#3f9a94')+L([[18,0],[6,70]],4.4,'#3f9a94');
    o+='<g filter="url(#s2)"><rect x="-12" y="66" width="24" height="32" rx="3" fill="#f1efe6"/><rect x="-12" y="66" width="24" height="8" fill="#3f9a94"/><rect x="-7" y="82" width="14" height="3" fill="#b4c3d1"/></g>';
    return o};
  D.arms=function(){var o='',d;
    d=-1;var p=[[d*(D.sw-6),30],[d*(D.sw+2),124],[d*(D.sw-4),216]];
    o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.9,'#4b4a5e')+hand(p[2],D.skin,D.skin2,.95),2);
    d=1;var q=[[d*(D.sw-6),30],[d*(D.sw+4),118],[26,130]];
    o+=sh(arm(q,34,D.skin,D.top,D.torsoSh,1.9,'#4b4a5e'),2);
    return o};
  D.head=function(){var H=mix(SKS,{w:51,top:-118,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),o=headBase(H),w=H.w,hc='#3d2f2b',hc2='#2f2421';
    o+=P('M'+(-w-5)+',-30 C'+(-w-10)+',-90 '+f(-w*.7)+',-128 0,-128 C'+f(w*.7)+',-128 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(-w*.3)+',-96 C'+f(-w*.7)+',-92 '+(-w+6)+',-70 '+(-w+3)+',-44 C'+(-w+1)+',-40 '+(-w-2)+',-34 '+(-w-5)+',-30Z',hc);
    o+=P('M'+f(w*.2)+',-127 C'+f(w*.7)+',-127 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(w*.1)+',-100Z',hc2,' opacity=".6"');
    o+=face({dx:21,ey:-58,rx:8,ry:6.5,open:.5,lid:H.skin2,lidLine:'#6c4a38',gx:-1,gy:1.5,bags:1,bagCol:'#b4877b',
      brow:{len:24,y:-72,dy:1,out:-1,w:5,col:'#3a2f2b'},nose:{y:-35,s:.95},mouth:{y:-14,c:-.5,w:10,col:'#9a5a52',sw:2.4}},mix(H,{nostril:'#a8745f'}));
    o+=sh(P('M'+(-w+4)+',-100 C'+f(-w*.3)+',-106 '+f(w*.5)+',-100 '+(w-2)+',-78 C'+(w+2)+',-60 '+(w-4)+',-50 '+(w-14)+',-48 C'+f(w*.2)+',-66 '+f(-w*.2)+',-80 '+f(-w*.5)+',-84 C'+f(-w*.8)+',-88 '+(-w+2)+',-94 '+(-w+4)+',-100Z',hc),2);
    o+=P('M'+f(w*.5)+',-92 C'+(w+2)+',-76 '+(w-2)+',-56 '+(w-14)+',-48 C'+f(w*.7)+',-62 '+f(w*.5)+',-78 '+f(w*.3)+',-88Z',hc2,' opacity=".6"');
    return o};
  D.acc=function(){var o='<g filter="url(#s1)"><g transform="rotate(-7 20 110)">'+P('M-4,74 L48,74 L48,146 L-4,146Z','#2c3340')+P('M-4,74 L2,74 L2,146 L-4,146Z','#1e242e')+P('M34,74 L40,74 L40,152 L34,146Z','#3f9a94')+'</g></g>';
    for(var i=0;i<7;i++)o+=E(-2+0,80+i*9.4,2.4,2.4,'#cfd6dc');
    o+=hand([26,130],D.skin,D.skin2,.95,-70);
    return o};
  return build(D,full)};

/* ================= STAS 3: Шапка */
C.s3=function(full){
  var D=mix(SKS,{sw:60,bw:57,tl:262,floor:590,hx:23,legW:33,nw:19,top:'#2c3140',torsoSh:'#232733',pants:'#3a3f4f',pants2:'#2f3342',shoe:{upper:'#4a566c',sole:'#e8e2d2',laces:'#e8e2d2',acc:'#3f9a94',toe:'#e8e2d2'}});
  D.clothes=function(){var o='';
    o+=P('M-24,-6 Q0,30 24,-6 L18,-10 Q0,12 -18,-10Z','#1f2330');
    o+=P('M-18,-8 L-62,-2 L-60,40 L-58,'+D.tl+' L-24,'+D.tl+' L-14,20Z','#3e5a52')+P('M18,-8 L62,-2 L60,40 L58,'+D.tl+' L24,'+D.tl+' L14,20Z','#3e5a52');
    o+=P('M18,-8 L62,-2 L60,40 L58,'+D.tl+' L24,'+D.tl+' L14,20Z','#2f4640',' opacity=".5"');
    o+=L([[-14,22],[-24,200]],1.8,'#2c423b')+L([[14,22],[24,200]],1.8,'#2c423b');
    o+=P('M-12,-6 L-28,0 L-16,24 L-4,10Z','#486a60')+P('M12,-6 L28,0 L16,24 L4,10Z','#486a60');
    o+=L([[-10,0],[-4,64]],4.4,'#3f9a94')+L([[10,0],[4,64]],4.4,'#3f9a94');
    o+='<g filter="url(#s2)"><rect x="-13" y="62" width="26" height="34" rx="3" fill="#f1efe6"/><rect x="-13" y="62" width="26" height="8" fill="#3f9a94"/><rect x="-8" y="78" width="16" height="3" fill="#b4c3d1"/></g>';
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-6),30],[d*(D.sw+4),122],[d*(D.sw-14),196]];
      o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.9,'#232733'),2)});
    [-1,1].forEach(function(d){o+=L([[d*(D.sw-8),198],[d*(D.sw-18),178]],5,'#2f4640')});
    return o};
  D.head=function(){var H=mix(SKS,{w:50,top:-118,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),o=headBase(H),w=H.w,bc='#78879a',bc2='#65738a';
    o+=sh(P('M'+(-w-4)+',-62 C'+(-w-8)+',-120 '+f(-w*.6)+',-140 0,-141 C'+f(w*.6)+',-140 '+(w+8)+',-120 '+(w+4)+',-62Z',bc),2);
    o+=P('M'+f(w*.2)+',-140 C'+f(w*.6)+',-140 '+(w+8)+',-120 '+(w+4)+',-62 L'+f(w*.2)+',-62Z',bc2,' opacity=".5"');
    o+=E(0,-141,6,5,'#8e9bad');
    o+='<g filter="url(#s2)"><path d="M'+(-w-7)+',-90 Q0,-84 '+(w+7)+',-90 L'+(w+6)+',-64 Q0,-58 '+(-w-6)+',-64Z" fill="'+bc2+'"/></g>';
    for(var i=-5;i<=5;i++)o+=L([[i*10,-90+Math.abs(i)*.3],[i*10,-63+Math.abs(i)*.4]],1.6,'#56647a',' opacity=".55"');
    o+=face({dx:20,ey:-48,rx:8,ry:6.5,open:.42,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:1.5,bags:1,bagCol:'#b4877b',
      brow:{len:24,y:-62,dy:1,out:-1,w:5.5,col:'#3a3340'},nose:{y:-30,s:.95},mouth:{y:-10,c:-.5,w:10,col:'#9a5a52',sw:2.4}},mix(H,{nostril:'#a8745f'}));
    return o};
  return build(D,full)};

/* ================= ROUND 2 ================= */
var FNT="'Marker Felt','Marker Felt Wide',Helvetica,sans-serif";
function TX(x,y,s,t,fill,x2){return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="'+s+'" font-family="'+FNT+'" font-weight="700" fill="'+fill+'"'+(x2||'')+'>'+t+'</text>'}
var SHOE_C={upper:'#4a3226',sole:'#17110f',laces:'#a48a72',toe:'#5a3d2f',acc:'#3a281f'};
function palBase(o){return mix(SKP,mix({sw:92,bw:98,tl:236,floor:526,hx:34,legW:46,nw:34,lift:20,pants:'#3d4557',pants2:'#313848',shoe:SHOE_C},o))}
function palHead(){
  var H=mix(SKP,{w:64,top:-122,jw:1.1,chin:8,sq:1,earRx:10,earRy:15,jowl:1,cheekO:.6,cw:12}),o=headBase(H),w=H.w,g='#8f9396',g2='#777b7e';
  o+=P('M'+(-w-2)+',-70 L'+(-w+3)+',-120 Q'+(-w+6)+',-138 '+(-w+24)+',-138 L'+(w-24)+',-138 Q'+(w-6)+',-138 '+(w-3)+',-120 L'+(w+2)+',-70 C'+(w-6)+',-84 '+(w-14)+',-96 '+(w-24)+',-102 L'+(-w+24)+',-102 C'+(-w+14)+',-96 '+(-w+6)+',-84 '+(-w-2)+',-70Z',g);
  o+=P('M'+f(w*.2)+',-137 L'+(w-24)+',-138 Q'+(w-6)+',-138 '+(w-3)+',-120 L'+(w+2)+',-70 C'+(w-6)+',-84 '+(w-14)+',-96 '+(w-24)+',-102 L'+f(w*.2)+',-102Z',g2,' opacity=".6"');
  for(var i=0;i<9;i++)o+=L([[-w+14+i*13,-120],[-w+14+i*13,-110]],1.4,g2,' opacity=".55"');
  o+=face({dx:25,ey:-62,rx:9,ry:7,open:.72,lid:H.skin2,lidLine:'#6c4a38',gx:0,gy:.5,bags:1,bagCol:'#a87558',
    brow:{len:28,y:-80,dy:-.5,out:0,w:8,col:'#6b675f'},nose:{y:-34,s:1.3},mouth:{y:-11,c:1.2,w:16,col:'#7a3f36',sw:3.2}},mix(H,{nose:'#d1946f',noseHi:'#e6b793',nostril:'#7a4a3a'}));
  o+=P('M-34,-27 C-26,-42 -8,-39 0,-35 C8,-39 26,-42 34,-27 C26,-19 10,-26 0,-25 C-10,-26 -26,-19 -34,-27Z','#7a7468');
  o+=P('M0,-35 C8,-39 26,-42 34,-27 C26,-19 10,-26 0,-25Z','#6a6559',' opacity=".6"');
  return o}
function highPants(D,y,belt,buckle){ /* belt band + buckle over the trousers start */
  return P('M'+(-D.bw+4)+','+y+' L'+(D.bw-4)+','+y+' L'+(D.bw-4)+','+(y+13)+' L'+(-D.bw+4)+','+(y+13)+'Z',belt)+'<rect x="-11" y="'+(y-1)+'" width="22" height="15" rx="2" fill="'+buckle+'"/><rect x="-6" y="'+(y+3)+'" width="12" height="7" rx="1" fill="'+belt+'"/>'}
function collarShirt(c1,c2){return P('M-14,-10 L14,-10 L5,26 L-5,26Z','#c99476')+P('M-12,-12 L-46,-6 L-34,28 L-4,14Z',c1)+P('M12,-12 L46,-6 L34,28 L4,14Z',c1)+L([[-12,-12],[-4,14]],1.5,c2)+L([[12,-12],[4,14]],1.5,c2)}

/* ---- a: short-sleeve, short tie, lanyard */
C.pa=function(full){
  var D=palBase({top:'#b3c6da',torsoSh:'#9bb0c7',cut:154,pTop:140});
  D.clothes=function(){var o='';
    o+=P('M-10,10 L10,10 L8,34 L-8,34Z','#7d2f38')+collarShirt('#d4e0ec','#8fa4bb');
    o+=L([[0,34],[0,152]],1.6,'#8fa4bb',' opacity=".7"');
    o+=sh(P('M-9,22 L9,22 L7,36 L-7,36Z','#8c343e')+P('M-8,34 L8,34 L14,74 L0,92 L-14,74Z','#8c343e')+L([[-3,40],[-8,70]],2.4,'#b0535c',' opacity=".8"')+L([[4,44],[9,70]],2.4,'#b0535c',' opacity=".8"'),2);
    o+=L([[-30,128],[-12,134]],1.8,'#8fa4bb',' opacity=".9"')+L([[30,126],[12,132]],1.8,'#8fa4bb',' opacity=".9"')+L([[-60,130],[-40,136]],1.6,'#8fa4bb',' opacity=".7"');
    o+=P('M22,50 L58,50 L58,92 L40,100 L22,92Z','#a9bdd2')+L([[22,57],[58,57]],1.6,'#8fa4bb')+L([[34,38],[34,56]],4.2,'#2c3f74');
    o+=highPants(D,148,'#2a2220','#b9953a');
    o+=L([[-14,2],[-10,106]],5,'#d9683b')+L([[14,2],[10,106]],5,'#d9683b');
    o+='<g filter="url(#s2)"><rect x="-23" y="98" width="46" height="62" rx="5" fill="#f4f1e8"/><rect x="-23" y="98" width="46" height="12" rx="5" fill="#d9683b"/><rect x="-23" y="104" width="46" height="6" fill="#d9683b"/><rect x="-7" y="100" width="14" height="4" rx="2" fill="#a8452a"/>'+E(-8,125,8,8,'#b4c3d1')+P('M-17,152 Q-8,134 1,152Z','#b4c3d1')+TX(8,122,15,'ИТ','#2c3f74')+TX(0,142,8.6,'директор','#2c3f74')+'</g>';
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-8),30],[d*(D.sw+6),122],[d*(D.sw-2),214]];
      o+=sh(arm(p,42,D.skin,D.top,D.torsoSh,.78,'#8fa4bb')+hand(p[2],D.skin,D.skin2,1.05,0),2)});
    return o};
  D.head=palHead;return build(D,full)};

/* ---- b: borrowed double-breasted jacket, tin in pocket */
C.pb=function(full){
  var D=palBase({top:'#6d5f55',torsoSh:'#594d45',cut:182,pTop:170});
  D.clothes=function(){var o='',lp='#85766a',st='#4a3f38';
    o+=P('M-18,-8 L18,-8 L10,76 L-10,76Z','#e0e4e9');
    o+=sh(P('M-6,10 L6,10 L5,22 L-5,22Z','#7d2f38')+P('M-5,22 L5,22 L8,70 L0,76 L-8,70Z','#8c343e'),2);
    o+=P('M-18,-8 L-62,8 L-64,48 L-40,92 L-10,84 L-26,42Z',lp)+P('M18,-8 L62,8 L64,48 L40,92 L10,84 L26,42Z',lp);
    o+=P('M-18,-8 L-62,8 L-52,22 L-26,12Z',st,' opacity=".45"')+P('M18,-8 L62,8 L52,22 L26,12Z',st,' opacity=".45"');
    o+=E(0,-8,32,8,'#85766a');
    o+=L([[-10,84],[-10,184]],2,st,' opacity=".8"')+L([[10,84],[10,184]],1.4,st,' opacity=".6"');
    [[-36,88],[36,88],[-36,126],[36,126],[-36,162],[36,162]].forEach(function(b,i){
      if(i>=2){var s=b[0]<0?1:-1;o+=L([[b[0]+s*10,b[1]-14],[b[0]+s*(-4),b[1]-2]],1.8,st,' opacity=".8"')+L([[b[0]+s*10,b[1]+14],[b[0]+s*(-4),b[1]+2]],1.8,st,' opacity=".8"')+L([[b[0]+s*10,b[1]],[b[0]+s*(-8),b[1]]],1.6,st,' opacity=".8"')}
      o+=sh(E(b[0],b[1],8,8,'#2d2622'),1)+E(b[0]-2,b[1]-2,2.4,2.4,'#8a7d72')});
    o+=P('M-60,176 Q0,196 60,176 L62,184 Q0,206 -62,184Z',st,' opacity=".5"');
    o+=highPants(D,182,'#2a2220','#b9953a');
    o+='<g transform="translate(-14,0)"><g filter="url(#s2)">'+P('M50,56 L78,56 L78,96 Q64,100 50,96Z','#c5ccd2')+P('M50,64 L78,64 L78,90 Q64,94 50,90Z','#b5452f')+P('M50,70 L78,70 L78,73 L50,73Z','#e8c25a')+E(64,56,14,4.4,'#dfe4e8')+E(64,55.6,6,1.8,'#9aa3aa')+TX(64,86,6.6,'ТУШЁНКА','#f4efe2',' textLength="25" lengthAdjust="spacingAndGlyphs"')+'</g>'+P('M44,92 L84,92 L84,106 L44,106Z','#6d5f55')+L([[44,92],[84,92]],2,'#4a3f38')+'</g>';
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-8),30],[d*(D.sw+6),122],[d*(D.sw-2),214]];
      o+=sh(arm(p,42,D.skin,D.top,D.torsoSh,1.6,'#4a3f38')+hand(p[2],D.skin,D.skin2,1.05,0),2)});
    return o};
  D.head=palHead;return build(D,full)};

/* ---- c: knitted vest, keys, thermos */
C.pc=function(full){
  var D=palBase({top:'#c3d1df',torsoSh:'#a9bbcd',cut:166,pTop:150});
  D.clothes=function(){var o='',v='#c49a62',vd='#a07a46';
    o+=collarShirt('#e2eaf2','#9aaabc');
    o+=sh(P('M-8,18 L8,18 L6,32 L-6,32Z','#2f3c5e')+P('M-6,30 L6,30 L10,66 L0,78 L-10,66Z','#2f3c5e'),2)+L([[-7,44],[8,40]],2.4,'#6c7ca2')+L([[-8,56],[9,52]],2.4,'#6c7ca2');
    o+=sh(P('M-22,-6 L-70,-2 L-80,42 L-86,120 L-80,160 L0,170 L80,160 L86,120 L80,42 L70,-2 L22,-6 L12,34 L2,96 L-2,96 L-12,34Z',v),2);
    for(var x=-72;x<=72;x+=9){if(Math.abs(x)>6)o+=L([[x,70],[x*1.03,158]],1.6,vd,' opacity=".45"')}
    o+=L([[-22,-4],[-2,96]],5,vd)+L([[22,-4],[2,96]],5,vd);
    o+=L([[0,96],[0,166]],2,vd);
    [102,126,150].forEach(function(y){o+=sh(E(0,y,6,6,'#5a3b1f'),1)+E(-1.4,y-1.4,1.8,1.8,'#a98053')});
    o+=P('M-82,150 Q0,168 82,150 L80,166 Q0,184 -80,166Z',vd);
    o+=highPants(D,162,'#2a2220','#b9953a');
    o+=L([[-56,176],[-56,190]],3,'#8a9298');
    o+='<g filter="url(#s2)"><circle cx="-56" cy="200" r="12" fill="none" stroke="#aab2b8" stroke-width="3.6"/>';
    [[-70,208,-14],[-62,214,6],[-50,213,-3],[-44,206,20],[-56,218,0]].forEach(function(k,i){var col=['#c9a843','#aab2b8','#c9a843','#aab2b8','#b9953a'][i];o+='<g transform="translate('+k[0]+','+k[1]+') rotate('+k[2]+')"><rect x="-3" y="-4" width="6" height="16" rx="2" fill="'+col+'"/><circle cx="0" cy="-5" r="4.4" fill="'+col+'"/><circle cx="0" cy="-5" r="1.6" fill="#4a4f55"/></g>'});
    o+='</g>';
    return o};
  D.arms=function(){var o='',d=-1;
    var p=[[d*(D.sw-8),30],[d*(D.sw+6),122],[d*(D.sw-2),214]];
    o+=sh(arm(p,42,D.skin,D.top,D.torsoSh,1.9,'#a9bbcd')+hand(p[2],D.skin,D.skin2,1.05,0),2);
    d=1;var q=[[d*(D.sw-8),30],[d*(D.sw+16),116],[40,138]];
    o+=sh(arm(q,42,D.skin,D.top,D.torsoSh,1.9,'#a9bbcd'),2);
    return o};
  D.acc=function(){var o='<g filter="url(#s1)">'+P('M22,98 L58,98 L58,176 L22,176Z','#7f98a8')+P('M44,98 L58,98 L58,176 L44,176Z','#6a8493',' opacity=".7"')+P('M20,84 L60,84 L60,100 L20,100Z','#b5472f')+P('M20,84 L60,84 L60,89 L20,89Z','#d1583c')+P('M22,126 L58,126 L58,131 L22,131Z','#566d7a')+'</g>';
    o+=hand([40,142],D.skin,D.skin2,1.0,-90);
    return o};
  D.head=palHead;return build(D,full)};

/* ---- d: logo polo, belt phone case */
C.pd=function(full){
  var D=palBase({top:'#a0524c',torsoSh:'#88433f',cut:164,pTop:150});
  D.clothes=function(){var o='',c1='#b5645d';
    o+=P('M-14,-10 L14,-10 L7,22 L-7,22Z','#c99476');
    o+=P('M-12,-12 L-48,-4 L-36,24 L-5,12Z',c1)+P('M12,-12 L48,-4 L36,24 L5,12Z',c1)+L([[-12,-12],[-5,12]],1.6,'#7a3a36')+L([[12,-12],[5,12]],1.6,'#7a3a36');
    o+=P('M-8,12 L8,12 L8,62 L-8,62Z','#8e4742')+E(0,26,2.8,2.8,'#efe6d0')+E(0,42,2.8,2.8,'#efe6d0')+E(0,56,2.8,2.8,'#efe6d0');
    o+=P('M26,66 Q22,56 32,56 Q34,46 46,48 Q54,42 60,52 Q70,52 68,66Z','#f4f0e6')+TX(47,80,7.4,'облако 2.0','#f4f0e6',' textLength="38" lengthAdjust="spacingAndGlyphs"');
    o+=L([[-70,104],[-28,114]],2,'#7a3a36',' opacity=".6"')+L([[-74,128],[-26,138]],2,'#7a3a36',' opacity=".6"')+L([[70,110],[28,118]],2,'#7a3a36',' opacity=".6"')+L([[72,134],[24,142]],2,'#7a3a36',' opacity=".6"');
    o+=highPants(D,158,'#2a2220','#b9953a');
    o+='<g filter="url(#s2)">'+P('M34,172 L72,172 L72,222 Q53,228 34,222Z','#2c2623')+P('M34,172 L72,172 L72,188 Q53,194 34,188Z','#3a322d')+L([[34,188],[72,188]],1.6,'#17110f')+E(53,190,3.4,3.4,'#8a7d72')+P('M38,160 L66,160 L66,174 L38,174Z','#2c2623')+'</g>';
    o+=P('M42,164 L62,164 L62,172 L42,172Z','#c8d8e4')+L([[46,167],[58,167]],1.6,'#6c8ca4');
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-8),30],[d*(D.sw+6),122],[d*(D.sw-2),214]];
      o+=sh(arm(p,42,D.skin,D.top,D.torsoSh,.78,'#6f3330')+hand(p[2],D.skin,D.skin2,1.05,0),2)});
    return o};
  D.head=palHead;return build(D,full)};

/* ---- Stas: shared sideways, flat-lidded face */
function stasFace(H,fy,w){
  return face({dx:21,ey:fy,rx:8,ry:6.5,open:.4,lid:H.skin2,lidLine:'#6c4a38',gx:-4.2,gy:1,bags:1,bagCol:'#b4877b',
    brow:{len:24,y:fy-14,dy:0,out:0,w:5,col:'#3a3340'},nose:{y:fy+23,s:.95},mouth:{y:fy+44,c:0,w:10,col:'#9a5a52',sw:2.4}},mix(H,{nostril:'#a8745f'}))}
function hoodPile(){return sh(P('M-74,-6 C-76,-34 -44,-40 0,-38 C44,-40 76,-34 74,-6 C76,24 44,38 0,36 C-44,38 -76,24 -74,-6Z','#4a7271'),2)
  +P('M-74,-6 C-76,-34 -44,-40 0,-38 C-44,-26 -64,-14 -66,6 C-68,20 -60,28 -44,32 C-64,28 -76,20 -74,-6Z','#5d8a89',' opacity=".8"')
  +L([[-52,12],[-34,28],[-10,30]],2.4,'#3a5d5c',' opacity=".8"')+L([[52,12],[34,28],[10,30]],2.4,'#3a5d5c',' opacity=".8"')+L([[-60,-4],[-48,-22]],2,'#3a5d5c',' opacity=".6"')+L([[60,-4],[48,-22]],2,'#3a5d5c',' opacity=".6"')}
function cords(){var o='';[-1,1].forEach(function(d){var x=d*24;
  o+=E(x,16,5.4,5.4,'#98a2a8')+E(x,16,2.6,2.6,'#2f4a4b')
  +L([[x,18],[x+d*3,40],[x-d*2,64],[x+d*1,86]],3.2,'#efe8d6')+'<rect x="'+(x+d*1-2.6)+'" y="84" width="5.2" height="12" rx="2.4" fill="#8a9096"/>'});return o}
function badge(x,y){return '<g filter="url(#s2)"><rect x="'+(x-15)+'" y="'+y+'" width="30" height="42" rx="3" fill="#f1efe6"/><rect x="'+(x-15)+'" y="'+y+'" width="30" height="10" rx="3" fill="#3f9a94"/><rect x="'+(x-15)+'" y="'+(y+6)+'" width="30" height="4" fill="#3f9a94"/><rect x="'+(x-4)+'" y="'+(y+2)+'" width="8" height="3" rx="1.5" fill="#2c6f6a"/>'+TX(x,y+27,9.4,'QA','#2c6f6a')+TX(x,y+38,8.6,'4127','#4a566c')+'</g>'}

C.sa=function(full){
  var D=mix(SKS,{sw:62,bw:60,tl:262,floor:590,hx:24,legW:34,nw:20,top:'#58807f',torsoSh:'#476b6c',pants:'#3a3f4f',pants2:'#2f3342',shoe:{upper:'#4a566c',sole:'#e8e2d2',laces:'#e8e2d2',acc:'#3f9a94',toe:'#e8e2d2'}});
  D.clothes=function(){var o=hoodPile();
    o+=cords();
    o+=L([[-10,0],[-6,86]],4.6,'#3f9a94')+L([[10,0],[6,86]],4.6,'#3f9a94');
    o+=badge(0,84);
    return o};
  D.arms=function(){var o='';
    [-1,1].forEach(function(d){var p=[[d*(D.sw-6),30],[d*(D.sw+2),124],[d*(D.sw-4),216]];
      o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.92,'#476b6c')+hand(p[2],D.skin,D.skin2,.95),2)});
    return o};
  D.head=function(){var H=mix(SKS,{w:52,top:-120,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),w=H.w,hc='#34303a',o='';
    /* hood resting behind head: dome + lining rim */
    o+=sh(P('M-74,-6 C-86,-60 -78,-150 0,-156 C78,-150 86,-60 74,-6 C50,-20 -50,-20 -74,-6Z','#58807f'),2);
    o+=P('M0,-156 C78,-150 86,-60 74,-6 C60,-14 40,-18 36,-20 C62,-60 56,-120 0,-132Z','#476b6c',' opacity=".55"');
    o+=P('M-64,-14 C-76,-60 -68,-136 0,-144 C68,-136 76,-60 64,-14 L58,-20 C68,-60 60,-122 0,-130 C-60,-122 -68,-60 -58,-20Z','#3d5f5f');
    o+=L([[-60,-30],[-62,-100]],1.8,'#3d5f5f',' opacity=".6"')+L([[60,-30],[62,-100]],1.8,'#3d5f5f',' opacity=".6"')+L([[0,-146],[0,-134]],2,'#476b6c');
    o+=headBase(H);
    o+=P('M'+(-w-2)+',-62 C'+(-w-4)+',-104 '+f(-w*.6)+',-122 0,-123 C'+f(w*.6)+',-122 '+(w+4)+',-104 '+(w+2)+',-62 C'+(w-6)+',-80 '+(w*.5)+',-94 '+f(w*.2)+',-98 C'+f(-w*.3)+',-90 '+f(-w*.7)+',-84 '+(-w-2)+',-62Z',hc);
    o+=P('M-30,-110 C-12,-120 22,-116 '+(w-8)+',-100 C'+f(w*.5)+',-92 '+f(-w*.2)+',-96 -30,-90Z',hc);
    o+=stasFace(H,-58,w);
    return o};
  return build(D,full)};

C.sb=function(full){
  var D=mix(SKS,{sw:58,bw:56,tl:262,floor:590,hx:23,legW:33,nw:19,top:'#5b5a70',torsoSh:'#4b4a5e',pants:'#34383f',pants2:'#2a2d33',shoe:{upper:'#2e3440',sole:'#c9c6bd',laces:'#c9c6bd',acc:'#3f9a94',toe:'#c9c6bd'}});
  D.clothes=function(){var o='';
    o+=P('M-24,-6 Q0,30 24,-6 L18,-10 Q0,12 -18,-10Z','#4b4a5e')+P('M-20,-6 Q0,22 20,-6','none',' stroke="#6b6a82" stroke-width="3"');
    o+=L([[-18,0],[-6,56]],4.4,'#3f9a94')+L([[18,0],[6,56]],4.4,'#3f9a94');
    return o};
  D.arms=function(){var o='',d;
    d=-1;var p=[[d*(D.sw-6),30],[d*(D.sw+2),124],[d*(D.sw-4),216]];
    o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.9,'#4b4a5e')+hand(p[2],D.skin,D.skin2,.95),2);
    d=1;var q=[[d*(D.sw-6),30],[d*(D.sw+6),112],[10,128]];
    o+=sh(arm(q,34,D.skin,D.top,D.torsoSh,1.9,'#4b4a5e'),2);
    return o};
  D.head=function(){var H=mix(SKS,{w:51,top:-118,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),o=headBase(H),w=H.w,hc='#3d2f2b',hc2='#2f2421';
    o+=P('M'+(-w-5)+',-30 C'+(-w-10)+',-90 '+f(-w*.7)+',-128 0,-128 C'+f(w*.7)+',-128 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(-w*.3)+',-96 C'+f(-w*.7)+',-92 '+(-w+6)+',-70 '+(-w+3)+',-44 C'+(-w+1)+',-40 '+(-w-2)+',-34 '+(-w-5)+',-30Z',hc);
    o+=P('M'+f(w*.2)+',-127 C'+f(w*.7)+',-127 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(w*.1)+',-100Z',hc2,' opacity=".6"');
    o+=stasFace(H,-58,w);
    o+=sh(P('M'+(-w+4)+',-100 C'+f(-w*.3)+',-106 '+f(w*.5)+',-100 '+(w-2)+',-78 C'+(w+2)+',-60 '+(w-4)+',-50 '+(w-14)+',-48 C'+f(w*.2)+',-66 '+f(-w*.2)+',-80 '+f(-w*.5)+',-84 C'+f(-w*.8)+',-88 '+(-w+2)+',-94 '+(-w+4)+',-100Z',hc),2);
    o+=P('M'+f(w*.5)+',-92 C'+(w+2)+',-76 '+(w-2)+',-56 '+(w-14)+',-48 C'+f(w*.7)+',-62 '+f(w*.5)+',-78 '+f(w*.3)+',-88Z',hc2,' opacity=".6"');
    return o};
  D.acc=function(){var o='<g filter="url(#s1)"><g transform="rotate(-7 20 100)">'+P('M-8,56 L48,56 L48,128 L-8,128Z','#2c3340')+P('M-8,56 L-2,56 L-2,128 L-8,128Z','#1e242e')+P('M34,56 L40,56 L40,134 L34,128Z','#3f9a94')+P('M4,70 L32,70 L32,84 L4,84Z','#e8e2d2')+'</g></g>';
    for(var i=0;i<7;i++)o+=E(-5,62+i*9.4,2.4,2.4,'#cfd6dc');
    o+='<g transform="rotate(-7 20 100)">'+L([[10,75],[26,75]],1.6,'#8a8f98')+'</g>';
    o+=hand([36,124],D.skin,D.skin2,.95,-70);
    return o};
  return build(D,full)};

C.sc=function(full){
  var D=mix(SKS,{sw:60,bw:57,tl:262,floor:590,hx:24,legW:34,nw:20,top:'#58807f',torsoSh:'#476b6c',pants:'#3a3f4f',pants2:'#2f3342',shoe:{upper:'#4a566c',sole:'#e8e2d2',laces:'#e8e2d2',acc:'#3f9a94',toe:'#e8e2d2'}});
  D.clothes=function(){var o='';
    o+=P('M-74,-20 C-90,-10 -80,18 -60,26 L-40,0Z','#4a7271')+P('M74,-20 C90,-10 80,18 60,26 L40,0Z','#4a7271');
    o+=hoodPile();
    o+=cords();
    return o};
  D.arms=function(){var o='',d;
    d=-1;var p=[[d*(D.sw-6),30],[d*(D.sw+2),124],[d*(D.sw-4),216]];
    o+=sh(arm(p,34,D.skin,D.top,D.torsoSh,1.9,'#476b6c')+hand(p[2],D.skin,D.skin2,.95),2);
    d=1;var q=[[d*(D.sw-6),30],[d*(D.sw+6),112],[12,130]];
    o+=sh(arm(q,34,D.skin,D.top,D.torsoSh,1.9,'#476b6c'),2);
    return o};
  D.head=function(){var H=mix(SKS,{w:51,top:-118,jw:.9,chin:6,earRx:8,earRy:13,cheekO:.1}),o=headBase(H),w=H.w,hc='#3d2f2b',hc2='#2f2421';
    o+=P('M'+(-w-5)+',-30 C'+(-w-10)+',-90 '+f(-w*.7)+',-128 0,-128 C'+f(w*.7)+',-128 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(-w*.3)+',-96 C'+f(-w*.7)+',-92 '+(-w+6)+',-70 '+(-w+3)+',-44 C'+(-w+1)+',-40 '+(-w-2)+',-34 '+(-w-5)+',-30Z',hc);
    o+=P('M'+f(w*.2)+',-127 C'+f(w*.7)+',-127 '+(w+10)+',-90 '+(w+5)+',-30 C'+(w+2)+',-46 '+(w-2)+',-56 '+(w-4)+',-66 C'+(w-8)+',-86 '+f(w*.3)+',-96 '+f(w*.1)+',-100Z',hc2,' opacity=".6"');
    o+=stasFace(H,-58,w);
    o+=sh(P('M'+(-w+4)+',-100 C'+f(-w*.3)+',-106 '+f(w*.5)+',-100 '+(w-2)+',-78 C'+(w+2)+',-60 '+(w-4)+',-50 '+(w-14)+',-48 C'+f(w*.2)+',-66 '+f(-w*.2)+',-80 '+f(-w*.5)+',-84 C'+f(-w*.8)+',-88 '+(-w+2)+',-94 '+(-w+4)+',-100Z',hc),2);
    o+=P('M'+f(w*.5)+',-92 C'+(w+2)+',-76 '+(w-2)+',-56 '+(w-14)+',-48 C'+f(w*.7)+',-62 '+f(w*.5)+',-78 '+f(w*.3)+',-88Z',hc2,' opacity=".6"');
    return o};
  D.acc=function(){var o='<g filter="url(#s1)"><g transform="rotate(-7 20 100)">'+P('M-8,56 L48,56 L48,128 L-8,128Z','#2c3340')+P('M-8,56 L-2,56 L-2,128 L-8,128Z','#1e242e')+P('M34,56 L40,56 L40,134 L34,128Z','#3f9a94')+P('M4,70 L32,70 L32,84 L4,84Z','#e8e2d2')+'</g></g>';
    for(var i=0;i<7;i++)o+=E(-5,62+i*9.4,2.4,2.4,'#cfd6dc');
    o+=hand([36,124],D.skin,D.skin2,.95,-70);
    return o};
  return build(D,full)};

/* ===== ROUND 5: Kristina k1-k3, Mama m1-m3 (inserted inside the cast_cut IIFE) ===== */
var SKW={skin:'#ecd3bd',skin2:'#d9baa2',cheek:'#dd9c8e',cheekO:.3,nose:'#e1bfa6',noseHi:'#f2ddca',nostril:'#a8745f'};
var SKM={skin:'#e8c8ac',skin2:'#d5ac8e',cheek:'#dc8e80',cheekO:.5,nose:'#e2b094',noseHi:'#f1d0b8',nostril:'#9a6450'};
var SH_K={upper:'#ebe7de',sole:'#cdc7b9',laces:'#8a8f9c',acc:'#bdb6a6',toe:'#f3f0e8'};
var SH_M={upper:'#8c6b60',sole:'#4a352f',laces:null,acc:'#6f5249'};
function clipTorso(D,inner){var u=uid();return '<defs><clipPath id="'+u+'"><path d="'+torsoPath(D)+'"/></clipPath></defs><g clip-path="url(#'+u+')">'+inner+'</g>'}
function armsH(D,aw,sl,cuff,o){o=o||{};var s='';
  [-1,1].forEach(function(d){var p=[[d*(D.sw-8),30],[d*(D.sw+(o.out==null?6:o.out)),122],[d*(D.sw-2),o.hy||214]];
    if(o.skip===d)return;
    s+=sh(arm(p,aw,D.skin,D.top,D.torsoSh,sl,cuff)+hand(p[2],D.skin,D.skin2,o.hs||1,0),2)});return s}
function lashes(col){var o='';[-1,1].forEach(function(s){o+=L([[s*27.5,-52.5],[s*32,-56.5]],2.6,col)+L([[s*26.5,-49],[s*31,-51]],2,col)});return o}
function hoop(x,y,r,w,col){return '<g filter="url(#s2)"><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="'+w+'"/></g>'}

function kHead(o){
  var H=mix(SKW,{w:46,top:-114,jw:.84,chin:8,earRx:7,earRy:11,cheekO:.28,cw:9}),w=H.w,s='';
  s+=(o.back?o.back(H):'');
  s+=headBase(H);
  s+=face({dx:19,ey:-50,rx:8.5,ry:6.6,open:o.open||.78,lid:H.skin2,lidLine:'#5b4034',gx:o.gx||0,gy:1,
    brow:{len:24,y:-65,dy:0,out:-1,w:o.brows?.01:4.2,col:o.browCol||'#2a2228'},nose:{y:-30,s:.8},mouth:{y:-10,c:0,w:1,col:'#000',sw:.01}},H);
  s+=lashes(o.liner||'#2a2228');
  if(o.brows)s+=o.brows;
  s+=o.mouth||(L([[-9,-10],[-1,-8.6],[8,-12.4]],3.4,'#b0504e')+L([[8,-12.4],[10,-14]],2.4,'#b0504e'));
  s+=(o.front?o.front(H):'');
  if(o.ear)s+=o.ear(H);
  return '<g transform="rotate('+(o.rot||0)+' 0 10)">'+s+'</g>'}

C.k1=function(full){
  var D=mix(SKW,{sw:66,bw:56,tl:252,floor:586,hx:24,legW:36,nw:17,lift:0,top:'#c8a47a',torsoSh:'#b08d66',pants:'#2b2e3b',pants2:'#232632',shoe:SH_K});
  D.clothes=function(){var o='';
    o+=P('M-17,-9 L17,-9 L10,86 L0,238 L-10,86Z','#eee8da');
    o+=P('M-12,-10 Q0,22 12,-10Z',D.skin2);
    o+=sh(P('M-19,-10 L-50,-2 L-36,38 L-8,86 L-14,28Z','#b8946b')+P('M19,-10 L50,-2 L36,38 L8,86 L14,28Z','#b8946b'),2);
    o+=L([[-10,86],[-12,248]],2,'#a38158')+L([[10,86],[12,248]],2,'#a38158');
    o+=sh(E(0,104,5.5,5.5,'#7a5a38'),1)+L([[-46,168],[-26,170]],2.4,'#a38158')+L([[26,170],[46,168]],2.4,'#a38158');
    var sp=[[-46,-4],[-14,60],[34,150],[50,230]];
    o+=sh(L(sp,12,'#1b1e26')+L(sp,2,'#4a4f5e',' stroke-dasharray="5 4" opacity=".7"')+P('M-8,50 L6,50 L6,66 L-8,66Z','#c9a843')+P('M-4,54 L2,54 L2,62 L-4,62Z','#8a6f22'),2);
    o+=L([[-12,-6],[-6,98]],4.4,'#2d4ba0')+L([[12,-6],[6,98]],4.4,'#2d4ba0');
    o+='<g filter="url(#s2)"><rect x="-17" y="96" width="34" height="46" rx="4" fill="#f2efe6"/><rect x="-17" y="96" width="34" height="9" fill="#2d4ba0"/>'+E(0,119,7,7,'#c9b9a6')+'<rect x="-9" y="130" width="18" height="3" fill="#b4c3d1"/></g>';
    return o};
  D.arms=function(){return armsH(D,46,2,'#b08d66',{out:8,hs:.9})};
  D.head=function(){return kHead({rot:-3,open:.74,
    back:function(H){return P('M-52,-76 C-60,-130 -30,-150 0,-150 C30,-150 60,-130 52,-76 L58,72 Q40,86 24,60 L24,10 L-24,10 L-24,60 Q-40,86 -58,72Z','#25212b')},
    front:function(H){var a='M0,-120 C-32,-120 -52,-100 -50,-60 L-49,-26 C-47,-6 -50,22 -54,52 L-40,58 C-38,30 -40,2 -37,-26 C-36,-52 -32,-72 -24,-84 C-14,-96 -6,-104 0,-120Z';
      return P(a,'#2d2833')+'<g transform="scale(-1,1)">'+P(a,'#2d2833')+'</g>'+L([[-30,-96],[-42,-60]],1.6,'#4a4352',' opacity=".6"')},
    brows:L([[-30,-66.5],[-20,-69],[-9,-66]],4.4,'#2a2228')+L([[9,-68],[21,-75],[31,-70.5]],4.4,'#2a2228'),
    ear:function(H){return hoop(-47,-34,12,3.4,'#d8b04a')+hoop(47,-34,12,3.4,'#d8b04a')}})};
  return build(D,full)};

C.k2=function(full){
  var D=mix(SKW,{sw:62,bw:54,tl:250,floor:580,hx:24,legW:38,nw:17,lift:0,top:'#86a08c',torsoSh:'#6f8a76',pants:'#41465a',pants2:'#363a4c',shoe:{upper:'#2e3142',sole:'#e9e5dc',laces:'#e9e5dc',acc:'#e9e5dc',toe:'#3a3e52'}});
  D.clothes=function(){var o='';
    o+=P('M-19,-9 L19,-9 L13,80 L0,238 L-13,80Z','#2a2f45');
    o+=E(0,52,12,12,'#e8d6a8',' opacity=".9"')+L([[-6,52],[6,52]],2.4,'#2a2f45');
    o+=P('M-12,-10 Q0,20 12,-10Z',D.skin2);
    o+=sh(P('M-19,-10 L-48,-2 L-38,30 L-12,80 L-15,24Z','#7b957f')+P('M19,-10 L48,-2 L38,30 L12,80 L15,24Z','#7b957f'),2);
    o+=L([[-13,80],[-14,246]],2,'#6a846f')+L([[13,80],[14,246]],2,'#6a846f');
    o+=sh(E(-1,104,5,5,'#e8e1cf'),1);
    o+=sh(P('M24,92 L46,92 L46,132 L24,132Z','#2fa7a0')+P('M24,92 L46,92 L46,98 L24,98Z','#25857f')+E(40,124,5,5,'#f2c94c')+E(32,106,3.4,3.4,'#e8e1cf'),2);
    o+='<g filter="url(#s2)"><circle cx="-10" cy="22" r="8" fill="#242630" opacity=".92"/><circle cx="10" cy="22" r="8" fill="#242630" opacity=".92"/><path d="M-3,20 Q0,17 3,20" stroke="#242630" stroke-width="2.4" fill="none"/></g>';
    o+=L([[-13,-6],[-9,100]],4.4,'#e07a3c')+L([[13,-6],[9,100]],4.4,'#e07a3c');
    o+='<g filter="url(#s2)"><rect x="-16" y="98" width="32" height="42" rx="4" fill="#f2efe6"/><rect x="-16" y="98" width="32" height="8" fill="#e07a3c"/>'+E(0,120,6.5,6.5,'#c9b9a6')+'</g>';
    return o};
  D.arms=function(){return armsH(D,45,2,'#6f8a76',{out:8,hs:.9})};
  D.head=function(){return kHead({rot:2.5,open:.82,gx:-1,liner:'#3a2f2c',browCol:'#6d5a45',
    back:function(H){var c='#cfae7c';return P('M-44,-70 C-50,-100 -26,-110 0,-110 C26,-110 50,-100 44,-70Z',c)+sh(E(0,-136,27,23,c)+E(-12,-142,12,8,'#dcc08f',' opacity=".7"'),2)},
    front:function(H){var c='#cfae7c';var o=P('M-47,-60 C-52,-112 -26,-124 0,-122 C26,-124 52,-112 47,-60 C42,-80 34,-92 20,-97 C12,-86 5,-86 0,-95 C-5,-86 -12,-86 -20,-97 C-34,-92 -42,-80 -47,-60Z',c);
      o+=L([[-44,-72],[-48,-34],[-45,-6]],3.2,c)+L([[44,-72],[48,-34],[45,-8]],3.2,c);
      o+=L([[-14,-112],[-24,-96]],1.5,'#b89865',' opacity=".7"')+L([[8,-114],[16,-100]],1.5,'#b89865',' opacity=".7"');
      o+=sh(P('M-19,-120 L19,-120 L15,-106 L-15,-106Z','#5a4635')+L([[-12,-119],[-12,-108]],1.6,'#3a2c22')+L([[-4,-119],[-4,-108]],1.6,'#3a2c22')+L([[4,-119],[4,-108]],1.6,'#3a2c22')+L([[12,-119],[12,-108]],1.6,'#3a2c22'),2);return o},
    ear:function(H){return hoop(-47,-30,8,3,'#d8b04a')+hoop(47,-30,8,3,'#d8b04a')+E(-47,-44,2.2,2.2,'#d8b04a')+E(47,-44,2.2,2.2,'#d8b04a')}})};
  return build(D,full)};

C.k3=function(full){
  var D=mix(SKW,{skin:'#e6c6ac',skin2:'#d2b199',sw:64,bw:56,tl:252,floor:584,hx:24,legW:36,nw:17,lift:0,top:'#8d97ad',torsoSh:'#757f97',pants:'#25262e',pants2:'#1d1e25',shoe:{upper:'#2a2b33',sole:'#e1ddd2',laces:'#d9d5c9',acc:'#555',toe:'#33343d'}});
  D.clothes=function(){var o='';
    var g='';for(var x=-96;x<=96;x+=15)g+=L([[x,-10],[x,260]],1.5,'#6c7790',' opacity=".55"');for(var y=0;y<=260;y+=15)g+=L([[-100,y],[100,y]],1.5,'#6c7790',' opacity=".55"');
    o+=clipTorso(D,g);
    o+=P('M-19,-10 L19,-10 L14,86 L0,238 L-14,86Z','#202228');
    o+=P('M-18,-34 L18,-34 L21,8 Q0,24 -21,8Z','#202228')+L([[-18,-12],[18,-12]],2,'#2e3038',' opacity=".8"');
    o+=sh(P('M-20,-10 L-50,-2 L-38,34 L-14,86 L-16,26Z','#7e89a2')+P('M20,-10 L50,-2 L38,34 L14,86 L16,26Z','#7e89a2'),2);
    o+=L([[-14,86],[-16,248]],2,'#5d6881')+L([[14,86],[16,248]],2,'#5d6881');
    [-1,1].forEach(function(d){o+=sh(L([[d*30,-2],[d*36,90],[d*32,200]],12,'#2c3346')+L([[d*30,-2],[d*36,90],[d*32,200]],2,'#576080',' stroke-dasharray="4 4" opacity=".7"'),2)});
    o+=sh(E(0,108,5,5,'#cfd6e6'),1);
    o+=L([[-13,-6],[-9,96]],4.4,'#2f9a8e')+L([[13,-6],[9,96]],4.4,'#2f9a8e');
    o+='<g filter="url(#s2)"><rect x="-17" y="94" width="34" height="40" rx="4" fill="#f2efe6"/><rect x="-17" y="94" width="34" height="8" fill="#2f9a8e"/></g>';
    [[-10,14,'#e05a4a'],[2,10,'#f2c94c'],[8,36,'#4a6cd0'],[-8,56,'#c06ad0'],[3,66,'#e07a3c'],[-4,80,'#3fb0a0']].forEach(function(p){o+=sh(E(p[0],p[1]+30,4.4,4.4,p[2]),1)});
    return o};
  D.arms=function(){return armsH(D,45,2,'#757f97',{out:8,hs:.9})};
  D.head=function(){return kHead({rot:0,open:.8,liner:'#2a1f1d',browCol:'#4a2a22',
    back:function(H){var c='#6e3a2c',o=P('M-54,-70 C-62,-130 -26,-146 0,-146 C26,-146 62,-130 54,-70 C62,-40 60,-8 48,6 C36,18 22,0 24,-12 L-24,-12 C-22,0 -36,18 -48,6 C-60,-8 -62,-40 -54,-70Z',c);
      [[-54,-48],[-58,-26],[-52,-6],[-40,8],[54,-48],[58,-26],[52,-6],[40,8]].forEach(function(p,i){o+=E(p[0],p[1],11,11,i%2?'#7d4636':c)});return o},
    front:function(H){var c='#7a4434';var o=P('M-49,-62 C-48,-112 -22,-124 8,-122 C36,-120 52,-100 49,-62 C42,-84 26,-96 8,-94 C-14,-92 -34,-84 -49,-62Z',c);
      [[-44,-84],[-32,-102],[-12,-112],[10,-114],[30,-104],[44,-84]].forEach(function(p,i){o+=E(p[0],p[1],10,10,i%2?'#8a5040':c)});
      o+=L([[-30,-98],[-14,-90]],1.6,'#5a2e22',' opacity=".6"');return o},
    mouth:L([[-9,-10],[0,-9],[9,-10.5]],3.4,'#a64a4c')+L([[9,-10.5],[10.5,-12]],2.2,'#a64a4c'),
    ear:function(H){var s='';[-1,1].forEach(function(d){s+='<g filter="url(#s2)"><circle cx="'+(d*47)+'" cy="-30" r="9" fill="none" stroke="#b9bfc9" stroke-width="5.2"/></g>'});return s}})};
  return build(D,full)};

/* ---------- MAMA */
function mHead(o){
  var H=mix(SKM,{w:53,top:-110,jw:1.0,chin:10,earRx:8,earRy:12,cheekO:.55,cw:12,jowl:1}),s='';
  s+=(o.back?o.back(H):'');
  s+=headBase(H);
  s+=(o.mid?o.mid(H):'');
  s+=face({dx:21,ey:-47,rx:8.5,ry:7,open:.92,lid:H.skin2,lidLine:'#7a5742',gx:0,gy:1,bags:1,bagCol:'#b38468',
    brow:{len:24,y:-64,dy:-4.5,out:0,w:5,col:o.brow||'#7b6a60'},nose:{y:-28,s:1.0},mouth:{y:-12,c:3.4,w:13,col:'#a4504c',sw:3.4}},H);
  s+=L([[-26,-24],[-24,-12],[-18,-3]],1.8,'#b9876b',' opacity=".5"')+L([[26,-24],[24,-12],[18,-3]],1.8,'#b9876b',' opacity=".5"');
  s+=L([[-33,-52],[-37,-49]],1.6,'#b9876b',' opacity=".55"')+L([[33,-52],[37,-49]],1.6,'#b9876b',' opacity=".55"');
  s+=(o.front?o.front(H):'');
  if(o.ear)s+=o.ear(H);
  return s}

C.m1=function(full){
  var D=mix(SKM,{sw:82,bw:92,tl:236,floor:500,hx:34,legW:46,nw:26,lift:0,top:'#7c93ae',torsoSh:'#667e9a',pants:'#c9a79a',pants2:'#b49488',shoe:SH_M});
  D.clothes=function(){var o='';
    o+=P('M-92,196 L92,196 L106,378 L-106,378Z','#7c93ae')+P('M10,196 L92,196 L106,378 L10,378Z','#667e9a',' opacity=".45"');
    o+=P('M-18,-8 L-48,-2 L-34,34 L-4,18Z','#a9bbd0')+P('M18,-8 L48,-2 L34,34 L4,18Z','#a9bbd0');
    o+=L([[0,18],[0,376]],2,'#5f7690');
    var fl=[[-60,60],[-40,100],[-66,140],[-30,170],[-58,210],[-20,250],[-46,300],[-70,350],[40,64],[62,100],[34,140],[66,176],[44,214],[24,260],[60,300],[36,340],[-90,250],[90,260],[20,110],[-24,30],[-76,100],[76,140]];
    fl.forEach(function(p,i){o+=E(p[0],p[1],5.5,5.5,i%3?'#d5dfeb':'#e6b0a8',' opacity=".85"')+E(p[0],p[1],1.8,1.8,'#f1d77a')});
    [48,96,150,206,262,318].forEach(function(y){o+=sh(E(0,y,4.6,4.6,'#e8dfca'),1)});
    o+=P('M-72,118 L-36,118 L-36,160 L-72,160Z','#8aa0ba')+L([[-72,124],[-36,124]],1.6,'#667e9a');
    return o};
  D.arms=function(){return armsH(D,50,1.25,'#a9bbd0',{out:8,hs:1.0,hy:222})};
  D.head=function(){var sc='#b3484a',scd='#8f3538';
    return mHead({brow:'#6f6258',
      back:function(H){return sh(P('M-67,-50 C-78,-132 -36,-152 0,-152 C36,-152 78,-132 67,-50 C66,-20 52,0 42,12 L-42,12 C-52,0 -66,-20 -67,-50Z',sc),2)+P('M0,-152 C36,-152 78,-132 67,-50 C66,-20 52,0 42,12 L8,12Z',scd,' opacity=".35"')},
      mid:function(H){return P('M-37,-102 Q0,-78 37,-102Z','#8f7a66')},
      front:function(H){var o=P('M-59,-60 C-63,-114 -30,-124 0,-124 C30,-124 63,-114 59,-60 C52,-86 30,-104 0,-103 C-30,-104 -52,-86 -59,-60Z',sc)+P('M0,-124 C30,-124 63,-114 59,-60 C52,-86 30,-104 0,-103Z',scd,' opacity=".3"');
        for(var i=-4;i<=4;i++)o+=E(i*11,-110+Math.abs(i)*1.6+ (i%2?5:0),2.2,2.2,'#f1e6cf',' opacity=".9"');
        o+=sh(P('M-4,12 C-26,18 -40,38 -42,60 C-26,56 -10,46 0,30Z',sc)+P('M4,12 C26,18 40,38 42,60 C26,56 10,46 0,30Z',scd)+E(0,16,11,9,sc),2);
        o+=E(-18,34,2,2,'#f1e6cf')+E(-28,44,2,2,'#f1e6cf')+E(18,34,2,2,'#f1e6cf')+E(28,44,2,2,'#f1e6cf');return o}})};
  return build(D,full)};

C.m2=function(full){
  var D=mix(SKM,{sw:80,bw:90,tl:236,floor:500,hx:34,legW:46,nw:26,lift:0,top:'#c39a46',torsoSh:'#a98235',pants:'#c9a79a',pants2:'#b49488',shoe:SH_M});
  D.clothes=function(){var o='';
    o+=P('M-88,200 L88,200 L100,384 L-100,384Z','#5a4752');
    o+=P('M-20,-9 L20,-9 L14,90 L0,230 L-14,90Z','#efe6d2');
    o+=P('M-12,-10 Q0,22 12,-10Z',D.skin2);
    o+=sh(P('M-18,-8 L-30,-14 L-44,10 L-24,38Z','#f6eedb')+P('M18,-8 L30,-14 L44,10 L24,38Z','#f6eedb'),2);
    o+=sh(P('M-20,-9 L-60,-2 L-80,30 L-84,230 L-14,232 L-14,90Z','#c39a46')+P('M20,-9 L60,-2 L80,30 L84,230 L14,232 L14,90Z','#c39a46'),2);
    o+=P('M-20,-9 L-60,-2 L-80,30 L-84,230 L-14,232 L-14,90Z','#a98235',' opacity=".0"');
    for(var x=-76;x<=-24;x+=11)o+=L([[x,50],[x,226]],1.8,'#a98235',' opacity=".45"');
    for(var x=24;x<=76;x+=11)o+=L([[x,50],[x,226]],1.8,'#a98235',' opacity=".45"');
    o+=L([[-14,90],[-14,230]],2.4,'#8a6a28')+L([[14,90],[14,230]],2.4,'#8a6a28');
    [100,142,184].forEach(function(y){o+=sh(E(-8,y,5,5,'#5a3b1f'),1)+E(-9.4,y-1.4,1.6,1.6,'#b08a57')});
    o+=P('M-70,150 L-34,150 L-34,196 L-70,196Z','#b78d3e')+L([[-70,156],[-34,156]],1.8,'#8a6a28');
    o+=P('M34,150 L70,150 L70,196 L34,196Z','#b78d3e')+L([[34,156],[70,156]],1.8,'#8a6a28');
    return o};
  D.arms=function(){var o='',d=-1;
    var p=[[d*(D.sw-8),30],[d*(D.sw+8),122],[d*(D.sw-2),216]];
    o+=sh(arm(p,50,D.skin,D.top,D.torsoSh,2,'#a98235')+hand(p[2],D.skin,D.skin2,1.0,0),2);
    d=1;var q=[[d*(D.sw-8),30],[d*(D.sw+16),112],[48,124]];
    o+=sh(arm(q,48,D.skin,D.top,D.torsoSh,1.9,'#a98235'),2);
    return o};
  D.acc=function(){var o='<g transform="translate(50,108) rotate(-8)" filter="url(#s1)">';
    o+=P('M-30,18 C-34,-14 -18,-34 2,-34 C22,-34 38,-14 34,18Z','#b4443c');
    for(var x=-24;x<=28;x+=8)o+=L([[x,-26],[x+1,12]],1.6,'#8f3430',' opacity=".55"');
    o+=P('M-34,12 L34,12 L36,30 L-36,30Z','#9c3730');
    for(var x=-28;x<=30;x+=7)o+=L([[x,14],[x,28]],1.5,'#7c2a27',' opacity=".6"');
    o+=E(2,-38,11,10,'#e8dccb')+E(-1,-41,5,4,'#f4ebdc',' opacity=".8"');
    o+='</g>';
    o+=hand([50,128],D.skin,D.skin2,1.0,-8);o+=E(66,92,5.5,11,D.skin,' transform="rotate(14 66 92)"');
    return o};
  D.head=function(){var c='#85705f',c2='#9c8776';
    return mHead({brow:'#6f6258',
      back:function(H){var o='';for(var k=0;k<=10;k++){var a=-Math.PI+k*(Math.PI/10);var cx=Math.cos(a)*66,cy=-70+Math.sin(a)*72;o+=E(cx,cy,16,16,c)}
        [[-64,-38],[64,-38],[-62,-18],[62,-18],[-56,0],[56,0]].forEach(function(p){o+=E(p[0],p[1],13,13,c)});
        for(var k=1;k<10;k+=2){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*66-3,-70+Math.sin(a)*72-4,6,5,c2,' opacity=".6"')}return sh(o,2)},
      front:function(H){var o='';[[-36,-100,11],[-18,-106,12],[2,-108,12],[22,-106,12],[40,-98,11]].forEach(function(p,i){o+=E(p[0],p[1],p[2],p[2],i%2?c2:c)});
        [[-50,-84,11],[50,-84,11]].forEach(function(p){o+=E(p[0],p[1],p[2],p[2],c)});return o},
      ear:function(H){return E(-54,-36,4,4,'#d8b04a')+E(54,-36,4,4,'#d8b04a')}})};
  return build(D,full)};

C.m3=function(full){
  var D=mix(SKM,{sw:80,bw:90,tl:236,floor:500,hx:34,legW:46,nw:26,lift:0,top:'#5d7a7c',torsoSh:'#4a6567',pants:'#bfa395',pants2:'#a88c7f',shoe:SH_M});
  D.clothes=function(){var o='';
    o+=P('M-84,200 L84,200 L96,378 L-96,378Z','#4b3f4a');
    o+=sh(P('M-34,6 L34,6 L32,120 L-32,120Z','#a9bfd6')+P('M-62,120 L62,120 L74,344 L-74,344Z','#a9bfd6'),2);
    for(var x=-70;x<=70;x+=16)o+=L([[x*.9,124],[x*1.05,342]],2.2,'#e8eef5',' opacity=".55"');
    for(var y=134;y<=340;y+=18)o+=L([[-72,y],[72,y]],2.2,'#e8eef5',' opacity=".55"');
    for(var x=-28;x<=28;x+=14)o+=L([[x,8],[x,118]],2.2,'#e8eef5',' opacity=".55"');
    o+=L([[-30,8],[-14,-8]],5,'#8fa8c4')+L([[30,8],[14,-8]],5,'#8fa8c4');
    o+=L([[-62,121],[62,121]],4,'#8fa8c4');
    o+=P('M-52,190 L-20,190 L-20,226 L-52,226Z','#98b0ca')+L([[-52,196],[-20,196]],1.8,'#e8eef5');
    // sweater pilling
    [[-60,60],[-52,90],[66,70],[60,110],[-70,30]].forEach(function(p){o+=E(p[0],p[1],2.2,1.6,'#6f8c8e',' opacity=".8"')});
    return o};
  D.arms=function(){return armsH(D,50,2,'#4a6567',{out:8,hs:1.0,hy:222})};
  D.head=function(){var c='#8a7868';
    return mHead({brow:'#6f6258',
      back:function(H){return sh(E(0,-134,38,22,c)+E(-16,-142,14,8,'#a3917f',' opacity=".6"'),2)},
      mid:function(H){return P('M-44,-62 C-50,-106 -26,-118 0,-118 C26,-118 50,-106 44,-62 C40,-84 30,-96 14,-100 C6,-104 -6,-104 -14,-100 C-30,-96 -40,-84 -44,-62Z',c)},
      front:function(H){var o=L([[-42,-84],[-40,-60]],2,c)+L([[42,-84],[41,-60]],2,c);
        o+=L([[-18,-100],[-10,-90]],2,c)+L([[22,-98],[14,-90]],2,c);
        o+=sh(P('M-30,-130 L30,-130 L26,-114 L-26,-114Z','#d9a89d')+P('M-30,-130 L30,-130 L28,-124 L-28,-124Z','#e8bdb2'),2);
        for(var i=-4;i<=4;i++)o+=L([[i*6.5,-129],[i*6,-116]],1.6,'#b3837a',' opacity=".8"');return o},
      ear:function(H){return E(-54,-36,3.4,3.4,'#d8b04a')+E(54,-36,3.4,3.4,'#d8b04a')}})};
  return build(D,full)};

/* ===== ROUND 7: appealing women w1-w3, friend p1-p2, mama m4-m8 (spliced inside cast_cut IIFE) ===== */
var SKA={skin:'#f2dac6',skin2:'#e0c2a9',cheek:'#e8a090',cheekO:.36,nose:'#e8c8b0',noseHi:'#f8e8da',nostril:'#b98874'};
C.defs7='<defs><radialGradient id="gLight"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="gBlush"><stop offset="0" stop-color="#e8806e" stop-opacity=".55"/><stop offset="1" stop-color="#e8806e" stop-opacity="0"/></radialGradient><radialGradient id="gShade"><stop offset="0" stop-color="#8a5a48" stop-opacity=".35"/><stop offset="1" stop-color="#8a5a48" stop-opacity="0"/></radialGradient></defs>';

function eyeA(cx,ey,o){
  var u=uid(),rx=9.8,ry=8,sg=cx<0?-1:1,ir=o.iris||'#6a4632';
  var shape='M'+(cx-rx)+','+ey+' Q'+cx+','+f(ey-ry*1.5)+' '+(cx+rx)+','+ey+' Q'+cx+','+f(ey+ry*1.15)+' '+(cx-rx)+','+ey+'Z';
  var s='<defs><clipPath id="'+u+'"><path d="'+shape+'"/></clipPath></defs>';
  s+=E(cx,ey-9,12,4.2,o.shadow||'#c98e98',' opacity=".2"');
  s+='<g clip-path="url(#'+u+')">'+P(shape,'#f8f4ee')+E(cx+(o.gx||0),ey+.6,6.3,6.3,ir)+E(cx+(o.gx||0),ey+3.2,5,3.2,'#b58a63',' opacity=".55"')+E(cx+(o.gx||0),ey+.6,3.1,3.1,'#1b1620')+E(cx+(o.gx||0)-2.4,ey-2.4,2.1,2.1,'#fff',' opacity=".95"')+E(cx+(o.gx||0)+2.6,ey+2.6,1,1,'#fff',' opacity=".7"')
    +'<rect x="'+(cx-rx-1)+'" y="'+(ey-ry-2)+'" width="'+(rx*2+2)+'" height="4.6" fill="'+(o.lid||'#e0c2a9')+'" opacity=".5"/></g>';
  s+='<path d="M'+(cx-rx)+','+ey+' Q'+cx+','+f(ey-ry*1.5)+' '+(cx+rx)+','+ey+'" stroke="#2a1d21" stroke-width="3" fill="none" stroke-linecap="round"/>';
  s+=L([[cx+sg*rx,ey],[cx+sg*(rx+4),ey-3.4]],2.6,'#2a1d21');
  s+='<path d="M'+(cx-rx+1)+','+f(ey+1)+' Q'+cx+','+f(ey+ry*1.15)+' '+(cx+rx-1)+','+f(ey+1)+'" stroke="#8a6458" stroke-width="1.1" fill="none" opacity=".4"/>';
  s+='<path d="M'+(cx-rx+2)+','+f(ey-ry*.9)+' Q'+cx+','+f(ey-ry*1.75-2)+' '+(cx+rx)+','+f(ey-ry*.75)+'" stroke="#b58c78" stroke-width="1.3" fill="none" opacity=".55"/>';
  return s}
function browA(cx,col,w,lift){var sg=cx<0?-1:1,ix=cx-sg*11,ox=cx+sg*13.5;
  return '<path d="M'+ix+',-65 Q'+(cx+sg*3)+','+f(-73-(lift||0))+' '+ox+',-65.5" stroke="'+col+'" stroke-width="'+w+'" fill="none" stroke-linecap="round"/>'}
function aHead(o){
  var H=mix(SKA,{w:43,top:-112,jw:.8,chin:10,earRx:6.5,earRy:10,cw:9}),s='';
  s+=(o.back?o.back(H):'');
  s+=headBase(H);
  s+='<ellipse cx="-6" cy="-88" rx="24" ry="12" fill="url(#gLight)"/><ellipse cx="-22" cy="-36" rx="11" ry="6" fill="url(#gLight)" opacity=".6"/>';
  s+='<ellipse cx="-24" cy="-26" rx="13" ry="8" fill="url(#gBlush)"/><ellipse cx="24" cy="-26" rx="13" ry="8" fill="url(#gBlush)"/>';
  s+='<ellipse cx="0" cy="3" rx="14" ry="5" fill="url(#gShade)"/>';
  s+=eyeA(-18.5,-50,o)+eyeA(18.5,-50,o);
  s+=browA(-18.5,o.brow,3.3,o.bl||0)+browA(18.5,o.brow,3.3,0);
  s+='<g transform="translate(0,-31) scale(.72)">'+P('M0,-14 C8,-6 11,2 8,7 Q0,11 -8,7 C-11,2 -8,-6 0,-14Z',H.nose)+P('M0,-14 C8,-6 11,2 8,7 Q4,6 3,0 Q2,-8 0,-14Z',H.noseHi,' opacity=".6"')+E(-3.6,6,1.4,1,H.nostril)+E(3.6,6,1.4,1,H.nostril)+'</g>';
  var lc=o.lip||'#c9726f';
  s+=P('M-10.5,-12.4 Q-5,-17 0,-14.8 Q5,-17 10.5,-12.4 Q0,-11 -10.5,-12.4Z',lc)+P('M-10.5,-12.4 Q0,-4.4 10.5,-12.4 Q0,-10.6 -10.5,-12.4Z',lc,' opacity=".9"')+E(0,-8.8,3.8,1.1,'#f0b0aa',' opacity=".65"')+L([[-10.5,-12.4],[10.5,-12.4]],1.2,'#a85a58',' opacity=".6"')+L([[10.5,-12.4],[12.6,-14.4]],1.5,'#b8706c',' opacity=".7"')+L([[-10.5,-12.4],[-12.4,-14.2]],1.5,'#b8706c',' opacity=".7"');
  s+=(o.front?o.front(H):'');
  if(o.ear)s+=o.ear(H);
  return '<g transform="rotate('+(o.rot||0)+' 0 10)">'+s+'</g>'}
function wBody(o){
  return mix(SKA,{sw:o.sw||56,bw:46,tl:246,floor:580,hx:22,legW:32,nw:14.5,lift:10,top:o.top,torsoSh:o.torsoSh,pants:'#363d52',pants2:'#2c3244',shoe:{upper:'#2e3142',sole:'#e0dbd0',laces:null,acc:'#2e3142'}})}
function wArms(D){return armsH(D,38,2,D.torsoSh,{out:4,hs:.82})}
function pearl(x,y,r){return E(x,y,r,r,'#f6f0e4')+E(x-r*.3,y-r*.3,r*.35,r*.35,'#fff',' opacity=".9"')}

/* WOMAN 1 - long chestnut hair, ivory blouse, thin pendant */
C.w1=function(full){
  var D=wBody({top:'#ede4d4',torsoSh:'#cdbfa8'});
  D.clothes=function(){var o='';
    o+=P('M-16,-10 L16,-10 L0,40Z',D.skin2)+P('M-14,-10 L14,-10 L0,28Z',D.skin);
    o+=sh(P('M-17,-10 L-38,-6 L-26,34 L-2,30Z','#f6efe2')+P('M17,-10 L38,-6 L26,34 L2,30Z','#f6efe2'),2);
    o+=L([[-12,-6],[0,34],[12,-6]],1.3,'#d6b45a')+E(0,36,3,3.6,'#d6b45a')+E(-1,35,1,1.2,'#fff',' opacity=".8"');
    o+=L([[0,40],[0,240]],1.6,'#cdbfa8')+E(0,66,2.6,2.6,'#d8cdb8')+E(0,102,2.6,2.6,'#d8cdb8');
    o+=P('M-40,120 Q-20,150 -46,200 L-60,150Z','#cdbfa8',' opacity=".25"');
    return o};
  D.arms=function(){return wArms(D)};
  D.head=function(){var c='#7a4a36',c2='#a06a4c';return aHead({rot:-3,brow:'#4e3228',iris:'#6a4632',gx:.8,shadow:'#c98e98',lip:'#c4686a',
    back:function(H){return sh(P('M-54,-84 C-64,-140 -26,-152 0,-152 C28,-152 64,-140 54,-84 C60,-40 66,0 70,52 C74,86 60,100 44,96 C48,60 46,20 42,-20 L-42,-20 C-46,20 -48,60 -44,96 C-60,100 -74,86 -70,52 C-66,0 -60,-40 -54,-84Z',c),2)
      +L([[-58,-30],[-62,20],[-64,70]],2,c2,' opacity=".55"')+L([[58,-30],[62,20],[64,70]],2,c2,' opacity=".5"')},
    front:function(H){var o=P('M-12,-120 C-40,-116 -54,-94 -52,-58 L-50,-26 C-46,-54 -38,-78 -22,-90 C-14,-95 -12,-104 -12,-120Z',c)+P('M-12,-120 C20,-126 52,-106 51,-62 L50,-30 C47,-60 38,-82 22,-90 C6,-96 -8,-100 -12,-120Z',c);
      o+=L([[-8,-114],[-30,-100],[-44,-70]],1.8,c2,' opacity=".7"')+L([[6,-112],[30,-98],[44,-70]],1.8,c2,' opacity=".6"');
      o+=L([[-47,-70],[-50,-42],[-47,-18]],2.4,c);return o},
    ear:function(H){return L([[44,-46],[44,-38]],1.5,'#d6b45a')+E(44,-34,3,3,'#d6b45a')+E(-44,-34,3,3,'#d6b45a')+L([[-44,-46],[-44,-38]],1.5,'#d6b45a')}})};
  return build(D,full)};

/* WOMAN 2 - smooth ballerina bun, dusty-rose blazer, pearls */
C.w2=function(full){
  var D=wBody({top:'#cb9a94',torsoSh:'#aa7c78',sw:58});
  D.clothes=function(){var o='';
    o+=P('M-17,-9 L17,-9 L11,80 L0,238 L-11,80Z','#f4efe6');
    o+=P('M-13,-10 Q0,22 13,-10Z',D.skin2);
    o+=sh(P('M-19,-10 L-46,-2 L-34,36 L-10,86 L-14,28Z','#d8aba5')+P('M19,-10 L46,-2 L34,36 L10,86 L14,28Z','#d8aba5'),2);
    o+=L([[-11,86],[-13,248]],1.8,'#b88b86')+L([[11,86],[13,248]],1.8,'#b88b86');
    o+=sh(E(0,100,4.6,4.6,'#8a5f5a'),1);
    o+=L([[-9,-2],[-5,18],[0,24],[5,18],[9,-2]],1.2,'#d9c9a0',' opacity=".0"');
    return o};
  D.arms=function(){return wArms(D)};
  D.head=function(){var c='#3c2a2e',c2='#5c4248';return aHead({rot:3,brow:'#3a2a2e',iris:'#5a3d30',gx:-1,shadow:'#b88098',lip:'#bf6466',bl:1.2,
    back:function(H){return sh(E(0,-148,21,17,c)+E(-7,-153,9,4.6,c2,' opacity=".6"'),2)+P('M-46,-70 C-52,-112 -24,-122 0,-122 C24,-122 52,-112 46,-70Z',c)},
    front:function(H){var a='M0,-124 C-34,-122 -52,-100 -50,-62 L-49,-34 C-46,-60 -40,-80 -28,-92 C-16,-102 -6,-110 0,-124Z';
      var o=P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>';
      o+=L([[-20,-106],[-40,-80]],1.5,c2,' opacity=".7"')+L([[20,-106],[40,-80]],1.5,c2,' opacity=".7"')+L([[0,-124],[0,-104]],1.2,'#d8bcae',' opacity=".6"');
      o+=L([[-42,-66],[-46,-44],[-44,-30]],1.8,c)+L([[42,-66],[45,-48],[43,-36]],1.8,c);return o},
    ear:function(H){return pearl(-44,-35,3.6)+pearl(44,-35,3.6)}})};
  return build(D,full)};

/* WOMAN 3 - honey lob with curtain bangs, lavender knit */
C.w3=function(full){
  var D=wBody({top:'#aaa0c6',torsoSh:'#8c82ac',sw:57});
  D.clothes=function(){var o='';
    o+=P('M-16,-10 L16,-10 L0,46Z',D.skin2)+P('M-14,-10 L14,-10 L0,34Z',D.skin);
    o+=sh(P('M-17,-10 L-30,-12 L-24,6 L-4,26Z','#f3ead8')+P('M17,-10 L30,-12 L24,6 L4,26Z','#f3ead8'),2);
    for(var y=60;y<240;y+=12)o+=L([[-56,y],[56,y]],1.4,'#8c82ac',' opacity=".35"');
    o+=L([[-14,-8],[0,44],[14,-8]],2.6,'#8c82ac',' opacity=".7"');
    return o};
  D.arms=function(){return wArms(D)};
  D.head=function(){var c='#c9995a',c2='#e0b97c';return aHead({rot:-2,brow:'#8a5e36',iris:'#6a5038',gx:1,shadow:'#d09aa0',lip:'#c66c68',
    back:function(H){var o=P('M-54,-80 C-64,-140 -26,-152 0,-152 C28,-152 64,-140 54,-80 C60,-46 62,-14 66,28 C60,40 44,36 38,24 L-38,24 C-44,36 -60,40 -66,28 C-62,-14 -60,-46 -54,-80Z',c);
      return sh(o,2)+L([[-60,-30],[-62,10]],2,c2,' opacity=".6"')+L([[60,-30],[62,10]],2,c2,' opacity=".6"')},
    front:function(H){var a='M0,-124 C-30,-122 -52,-100 -50,-62 L-49,-26 C-46,-50 -40,-68 -30,-80 C-16,-90 -4,-100 0,-124Z';
      var o=P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>';
      o+=L([[-6,-110],[-28,-92],[-42,-66]],1.8,c2,' opacity=".7"')+L([[6,-110],[28,-92],[42,-66]],1.8,c2,' opacity=".7"');
      o+=L([[-47,-60],[-50,-34],[-48,-12]],2.6,c)+L([[47,-60],[50,-34],[48,-12]],2.6,c);return o},
    ear:function(H){return E(-44,-36,2.4,2.4,'#d6b45a')+E(44,-36,2.4,2.4,'#d6b45a')}})};
  return build(D,full)};

/* ---------- FRIEND (from old Kristina 1, face toned down) */
function pHead(o){
  var H=mix(SKW,{skin:'#e8cdb4',skin2:'#d3b29a',w:48,top:-114,jw:.9,chin:8,earRx:7.5,earRy:11,cheekO:.2,cw:9}),s='';
  s+=(o.back?o.back(H):'');
  s+=headBase(H);
  s+=E(-26,-22,1.7,1.4,'#b98470',' opacity=".55"')+E(29,-32,1.5,1.3,'#b98470',' opacity=".5"')+E(-14,-24,1.2,1.1,'#b98470',' opacity=".4"');
  s+=face({dx:19.5,ey:-50,rx:8.2,ry:6.2,open:o.open,lid:H.skin2,lidLine:'#6a4e42',gx:o.gx||0,gy:1,bags:1,bagCol:'#a57b69',brow:{len:24,y:-65,dy:0,out:-1,w:.01,col:'#2a2228'},nose:{y:-29,s:.92},mouth:{y:-10,c:0,w:1,col:'#000',sw:.01}},H);
  s+=o.brows+o.mouth;
  s+=(o.front?o.front(H):'');
  if(o.glasses)s+='<g filter="url(#s2)"><circle cx="-19.5" cy="-50" r="13.5" fill="#cfe0f2" fill-opacity=".12" stroke="#5a4036" stroke-width="2.6"/><circle cx="19.5" cy="-50" r="13.5" fill="#cfe0f2" fill-opacity=".12" stroke="#5a4036" stroke-width="2.6"/></g>'+L([[-6,-52],[6,-52]],2.6,'#5a4036');
  if(o.ear)s+=o.ear(H);
  return '<g transform="rotate('+(o.rot||0)+' 0 10)">'+s+'</g>'}
function pDress(skin){
  var D=mix(SKW,{skin:skin,sw:68,bw:58,tl:252,floor:586,hx:24,legW:36,nw:19,lift:0,top:'#c8a47a',torsoSh:'#b08d66',pants:'#2b2e3b',pants2:'#232632',shoe:SH_K});
  D.clothes=function(){var o='';
    o+=P('M-17,-9 L17,-9 L10,86 L0,238 L-10,86Z','#e4ddcc');
    o+=P('M-12,-10 Q0,22 12,-10Z',D.skin2);
    o+=sh(P('M-19,-10 L-52,-2 L-38,38 L-8,86 L-14,28Z','#b8946b')+P('M19,-10 L52,-2 L38,38 L8,86 L14,28Z','#b8946b'),2);
    o+=L([[-10,86],[-12,248]],2,'#a38158')+L([[10,86],[12,248]],2,'#a38158');
    o+=sh(E(0,104,5.5,5.5,'#7a5a38'),1)+L([[-48,168],[-26,170]],2.4,'#a38158')+L([[26,170],[48,168]],2.4,'#a38158');
    o+=L([[-12,-6],[-6,98]],4.4,'#5a7a6a')+L([[12,-6],[6,98]],4.4,'#5a7a6a');
    o+='<g filter="url(#s2)"><rect x="-17" y="96" width="34" height="46" rx="4" fill="#f2efe6"/><rect x="-17" y="96" width="34" height="9" fill="#5a7a6a"/>'+E(0,119,7,7,'#c9b9a6')+'</g>';
    return o};
  D.arms=function(){return armsH(D,46,2,'#b08d66',{out:8,hs:.9})};
  return D}
var PFR='M0,-120 C-32,-120 -52,-100 -50,-60 L-49,-26 C-47,-6 -50,22 -54,52 L-40,58 C-38,30 -40,2 -37,-26 C-36,-52 -32,-72 -24,-84 C-14,-96 -6,-104 0,-120Z';
var PBK='M-52,-76 C-60,-130 -30,-150 0,-150 C30,-150 60,-130 52,-76 L58,72 Q40,86 24,60 L24,10 L-24,10 L-24,60 Q-40,86 -58,72Z';
C.p1=function(full){var D=pDress('#e4c9b0');
  D.head=function(){return pHead({rot:-2,open:.62,brows:L([[-30,-65],[-20,-66.5],[-9,-65]],4.6,'#2d2630')+L([[9,-67],[21,-75],[31,-70.5]],4.6,'#2d2630'),
    mouth:L([[-9,-10],[-1,-9.6],[8,-12.2]],3.2,'#b07268')+L([[8,-12.2],[10,-14]],2.2,'#b07268'),
    back:function(H){return P(PBK,'#27232d')},
    front:function(H){return P(PFR,'#302b36')+'<g transform="scale(-1,1)">'+P(PFR,'#302b36')+'</g>'},
    ear:function(H){return hoop(-50,-34,12,3.2,'#d0a848')+hoop(50,-34,12,3.2,'#d0a848')}})};
  return build(D,full)};
C.p2=function(full){var D=pDress('#e6cbb2');
  D.head=function(){return pHead({rot:3,open:.86,glasses:1,gx:1,brows:L([[-30,-70],[-20,-76],[-9,-71]],4.6,'#2d2630')+L([[9,-69],[21,-73],[31,-69]],4.6,'#2d2630'),
    mouth:P('M-13,-13 Q0,-1 13,-13Z','#a85650')+P('M-11.4,-12.6 Q0,-8.4 11.4,-12.6 Q0,-5.6 -11.4,-12.6Z','#f5f0e6')+L([[-13,-13],[0,-12],[13,-13]],1.8,'#8a4a44')+L([[13,-13],[15,-16]],2,'#8a4a44')+L([[-13,-13],[-15,-15.5]],2,'#8a4a44'),
    back:function(H){return P(PBK,'#27232d')},
    front:function(H){var o=P(PFR,'#302b36')+L([[-30,-90],[-40,-50]],1.5,'#4a4352',' opacity=".5"');
      var r='M0,-120 C32,-120 52,-100 50,-60 L49,-34 C47,-52 44,-70 40,-80 C32,-94 8,-104 0,-120Z';return o+P(r,'#302b36')+L([[46,-62],[52,-40]],2.2,'#302b36')},
    ear:function(H){return hoop(-50,-34,12,3.2,'#d0a848')+hoop(50,-34,12,3.2,'#d0a848')}})};
  return build(D,full)};

/* ---------- MAMA 55, urban, rounder and shorter than Palych */
function mHead7(o){
  var H=mix(SKM,{w:51,top:-108,jw:.95,chin:9,earRx:7.5,earRy:11,cheekO:o.cheek||.55,cw:12}),s='';
  s+=(o.back?o.back(H):'');
  s+=headBase(H);
  s+=(o.mid?o.mid(H):'');
  s+=face({dx:20,ey:-47,rx:8.5,ry:7,open:.94,lid:H.skin2,lidLine:'#7a5742',gx:o.gx||0,gy:1,bags:o.bags?1:0,bagCol:'#b38468',brow:{len:23,y:-64,dy:-4.5,out:0,w:4.6,col:o.brow||'#6f6258'},nose:{y:-28,s:.95},mouth:{y:-12,c:3.8,w:12,col:'#a4504c',sw:3.4}},H);
  s+=E(-31,-27,12,8,'#e07a6c',' opacity=".26"')+E(31,-27,12,8,'#e07a6c',' opacity=".26"');
  s+=L([[-14,-14],[-16.5,-10]],1.6,'#b9876b',' opacity=".5"')+L([[14,-14],[16.5,-10]],1.6,'#b9876b',' opacity=".5"');
  s+=L([[-33,-52],[-37,-49]],1.4,'#b9876b',' opacity=".4"')+L([[33,-52],[37,-49]],1.4,'#b9876b',' opacity=".4"');
  s+=(o.front?o.front(H):'');
  if(o.glasses)s+='<g filter="url(#s2)"><circle cx="-20" cy="-47" r="14" fill="#cfe0f2" fill-opacity=".12" stroke="#6a4a3a" stroke-width="2.8"/><circle cx="20" cy="-47" r="14" fill="#cfe0f2" fill-opacity=".12" stroke="#6a4a3a" stroke-width="2.8"/></g>'+L([[-6,-50],[6,-50]],2.8,'#6a4a3a')+L([[-34,-50],[-50,-54]],2.4,'#6a4a3a')+L([[34,-50],[50,-54]],2.4,'#6a4a3a');
  if(o.ear)s+=o.ear(H);
  return s}
function mBody(top,sh2,sw){return mix(SKM,{sw:sw||72,bw:84,tl:226,floor:470,hx:32,legW:44,nw:23,lift:0,top:top,torsoSh:sh2,pants:'#8a7f8f',pants2:'#776d7c',shoe:SH_M})}
function dotsOn(D,list,c1,c2,r){var o='';list.forEach(function(p,i){o+=E(p[0],p[1],r||5,r||5,i%3?c1:c2,' opacity=".85"')+E(p[0],p[1],1.7,1.7,'#f1d77a')});return clipTorso(D,o)}
var FLD=[[-60,40],[-40,80],[-62,120],[-26,150],[-56,196],[-18,226],[40,44],[62,84],[34,124],[64,164],[42,204],[22,236],[-84,100],[84,140],[16,90],[-22,24]];
function rose(x,y,k){k=k||1;return E(x,y,4.6*k,4.6*k,'#c0524a')+E(x,y,2.4*k,2.4*k,'#9a3a36')+E(x-5*k,y+3*k,3*k,1.7*k,'#7a9a6a',' transform="rotate(-30 '+(x-5*k)+' '+(y+3*k)+')"')+E(x+5*k,y+3*k,3*k,1.7*k,'#7a9a6a',' transform="rotate(30 '+(x+5*k)+' '+(y+3*k)+')"')}
function chainGlasses(){var o=L([[-24,8],[-30,50],[-14,76],[0,80],[14,76],[30,50],[24,8]],2.2,'#d6b45a',' stroke-dasharray="2.6 3"');
  o+='<g filter="url(#s2)" transform="translate(0,92)"><circle cx="-15" cy="0" r="11.5" fill="#cfe0f2" fill-opacity=".18" stroke="#6a4a3a" stroke-width="2.4"/><circle cx="15" cy="0" r="11.5" fill="#cfe0f2" fill-opacity=".18" stroke="#6a4a3a" stroke-width="2.4"/>'+L([[-3.5,-2],[3.5,-2]],2.4,'#6a4a3a')+'</g>';return o}
var HAIRM='#6e5848',HAIRM2='#8a7664';

/* M4 / 1: scarf under chin, cream with roses, lilac housecoat (closest to old 1) */
C.m4=function(full){var D=mBody('#a99bbf','#8e80a6');
  D.clothes=function(){var o='';
    o+=P('M-86,190 L86,190 L98,350 L-98,350Z','#a99bbf')+P('M10,190 L86,190 L98,350 L10,350Z','#8e80a6',' opacity=".4"');
    o+=dotsOn(D,FLD,'#e8dcc6','#d99a90',5);
    o+=P('M-18,-8 L-48,-2 L-34,36 L-4,18Z','#f0e8d8')+P('M18,-8 L48,-2 L34,36 L4,18Z','#f0e8d8')+L([[-48,-2],[-34,36],[-4,18]],1.4,'#cdbfa8')+L([[48,-2],[34,36],[4,18]],1.4,'#cdbfa8');
    o+=L([[0,18],[0,348]],2,'#8e80a6');
    [60,108,156,204].forEach(function(y){o+=sh(E(0,y,4.4,4.4,'#f0e8d8'),1)});
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#c3b7d3',{out:6,hs:.95,hy:210})};
  D.head=function(){var sc='#eadcc2',scd='#cdb894';
    return mHead7({cheek:.6,brow:'#6f6258',
      back:function(H){return sh(P('M-64,-50 C-74,-128 -36,-148 0,-148 C36,-148 74,-128 64,-50 C63,-20 50,0 40,12 L-40,12 C-50,0 -63,-20 -64,-50Z',sc),2)+P('M0,-148 C36,-148 74,-128 64,-50 C63,-20 50,0 40,12 L8,12Z',scd,' opacity=".3"')},
      mid:function(H){return P('M-44,-96 Q0,-70 44,-96 L44,-70 Q0,-60 -44,-70Z',HAIRM)},
      front:function(H){var o=P('M-56,-60 C-60,-110 -30,-122 0,-122 C30,-122 60,-110 56,-60 C50,-86 30,-102 0,-101 C-30,-102 -50,-86 -56,-60Z',sc)+P('M0,-122 C30,-122 60,-110 56,-60 C50,-86 30,-102 0,-101Z',scd,' opacity=".3"');
        [[-40,-98,.8],[-14,-112,.8],[14,-112,.8],[40,-98,.8],[-52,-72,.7],[52,-72,.7]].forEach(function(p){o+=rose(p[0],p[1],p[2])});
        o+=sh(P('M-4,12 C-26,18 -38,38 -40,60 C-26,56 -10,46 0,30Z',sc)+P('M4,12 C26,18 38,38 40,60 C26,56 10,46 0,30Z',scd)+E(0,16,10,8,sc),2);
        o+=rose(-24,36,.7)+rose(24,38,.7);return o},
      ear:function(H){return E(-54,-34,3.4,3.4,'#d8b04a')+E(54,-34,3.4,3.4,'#d8b04a')}})};
  return build(D,full)};

/* M5 / 2: scarf tied at the back, hair bun under it, dots, glasses on a chain, zipper housecoat */
C.m5=function(full){var D=mBody('#8fb0c8','#7396b0',70);
  D.clothes=function(){var o='';
    o+=P('M-84,190 L84,190 L96,350 L-96,350Z','#8fb0c8');
    var q='';for(var y=30;y<330;y+=22)for(var x=-90;x<=90;x+=22)q+=L([[x+(y%44?0:11),y],[x+(y%44?0:11)+9,y+9]],1.6,'#7396b0',' opacity=".5"');
    o+=clipTorso(D,q);
    o+=P('M-17,-8 L-40,-2 L-26,30 L-3,16Z','#e6eef4')+P('M17,-8 L40,-2 L26,30 L3,16Z','#e6eef4');
    o+=L([[0,16],[0,348]],3,'#e6eef4')+E(0,24,3,4,'#cfd8de');
    o+=P('M-66,118 L-32,118 L-32,158 L-66,158Z','#7aa0bc')+L([[-66,124],[-32,124]],1.5,'#e6eef4');
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#a9c4d6',{out:6,hs:.95,hy:210})};
  D.head=function(){var sc='#3f8a82',scd='#2f6f69';
    function dots(list){var o='';list.forEach(function(p){o+=E(p[0],p[1],2.4,2.4,'#f1e8d0',' opacity=".92"')});return o}
    return mHead7({cheek:.6,brow:'#6f6258',
      back:function(H){return sh(E(0,-152,26,19,sc)+E(-8,-157,10,5,'#58a89f',' opacity=".5"'),2)+sh(P('M-60,-64 C-70,-128 -34,-148 0,-148 C34,-148 70,-128 60,-64 C52,-80 30,-92 0,-92 C-30,-92 -52,-80 -60,-64Z',sc),2)+dots([[-20,-142],[0,-146],[20,-142],[-6,-154],[10,-156],[-40,-124],[40,-124],[-52,-100],[52,-100],[-24,-124],[24,-124],[0,-128]])},
      mid:function(H){return P('M-48,-64 C-50,-100 -28,-110 0,-109 C28,-110 50,-100 48,-64 C42,-84 28,-97 0,-97 C-28,-97 -42,-84 -48,-64Z',HAIRM)+L([[-14,-104],[-4,-96]],2,'#b9b0a8',' opacity=".8"')},
      front:function(H){var o=P('M-60,-70 C-60,-110 -30,-124 0,-124 C30,-124 60,-110 60,-70 C52,-96 30,-110 0,-109 C-30,-110 -52,-96 -60,-70Z',sc)+dots([[-48,-92],[-30,-110],[-8,-116],[14,-116],[34,-108],[50,-90]]);
        return o+L([[-50,-70],[-52,-40]],2,HAIRM)+L([[50,-70],[52,-40]],2,HAIRM)},
      ear:function(H){return E(-54,-34,3.4,3.4,'#d8b04a')+E(54,-34,3.4,3.4,'#d8b04a')}})};
  D.acc=function(){return chainGlasses()};
  return build(D,full)};

/* M6 / 3: perm curls, no scarf, cardigan over a nightgown, glasses on chain */
C.m6=function(full){var D=mBody('#b4806a','#9a6a56',76);
  D.clothes=function(){var o='';
    o+=P('M-82,200 L82,200 L94,350 L-94,350Z','#f0e4e0');
    o+=P('M-20,-9 L20,-9 L14,90 L0,230 L-14,90Z','#f2e8e4');
    o+=P('M-13,-10 Q0,22 13,-10Z',D.skin2);
    for(var x=-18;x<=18;x+=6)o+=E(x,8+Math.abs(x)*.55,3.4,3.4,'#fbf4ee');
    o+=sh(P('M-20,-9 L-58,-2 L-76,30 L-80,230 L-14,232 L-14,90Z','#b4806a')+P('M20,-9 L58,-2 L76,30 L80,230 L14,232 L14,90Z','#b4806a'),2);
    for(var x=-72;x<=-22;x+=9)o+=L([[x,46],[x,226]],1.6,'#9a6a56',' opacity=".4"');
    for(var x=22;x<=72;x+=9)o+=L([[x,46],[x,226]],1.6,'#9a6a56',' opacity=".4"');
    o+=L([[-14,90],[-14,230]],2.2,'#7a5242')+L([[14,90],[14,230]],2.2,'#7a5242');
    [100,140,180].forEach(function(y){o+=sh(E(-8,y,4.6,4.6,'#4a3226'),1)+E(-9.2,y-1.2,1.4,1.4,'#a98a6e')});
    return o};
  D.arms=function(){return armsH(D,48,2,'#9a6a56',{out:6,hs:.95,hy:214})};
  D.head=function(){var c='#7a6150',c2='#98806c';
    return mHead7({cheek:.55,brow:'#6f6258',
      back:function(H){var o='';for(var k=0;k<=10;k++){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*60,-66+Math.sin(a)*66,14,14,c)}
        [[-60,-40],[60,-40],[-56,-18],[56,-18]].forEach(function(p){o+=E(p[0],p[1],11.5,11.5,c)});
        for(var k=1;k<10;k+=2){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*60-3,-66+Math.sin(a)*66-4,5,4.4,c2,' opacity=".6"')}return sh(o,2)},
      front:function(H){var o='';[[-34,-98,10],[-17,-104,11],[2,-106,11],[21,-103,11],[38,-96,10],[-48,-82,10],[48,-82,10]].forEach(function(p,i){o+=E(p[0],p[1],p[2],p[2],i%2?c2:c)});return o},
      ear:function(H){return E(-54,-34,3.6,3.6,'#d8b04a')+E(54,-34,3.6,3.6,'#d8b04a')}})};
  D.acc=function(){return chainGlasses()};
  return build(D,full)};

/* M7 / 4: headband kerchief with a bow, short soft curls, apron with cherries over a sky housecoat, very rosy */
C.m7=function(full){var D=mBody('#8ea8c6','#7690b0',72);
  D.clothes=function(){var o='';
    o+=P('M-84,190 L84,190 L96,350 L-96,350Z','#8ea8c6');
    o+=P('M-18,-8 L-44,-2 L-30,30 L-4,16Z','#e8eef6')+P('M18,-8 L44,-2 L30,30 L4,16Z','#e8eef6');
    o+=sh(L([[-22,-4],[-26,48]],7,'#efe4cc')+L([[22,-4],[26,48]],7,'#efe4cc'),1);
    o+=sh(P('M-34,48 L34,48 L38,350 L-38,350Z','#efe4cc'),2);
    for(var x=-30;x<=30;x+=6)o+=E(x,48,3.4,3.4,'#c0524a');
    [[-18,80],[8,96],[-8,130],[20,150],[-22,176],[10,196],[-4,230],[22,262]].forEach(function(p){o+=L([[p[0],p[1]],[p[0]+5,p[1]-9]],1.4,'#7a9a6a')+E(p[0],p[1],4.2,4.2,'#c0524a')+E(p[0]+9,p[1]+3,4.2,4.2,'#c0524a')+L([[p[0]+5,p[1]-9],[p[0]+9,p[1]+3]],1.4,'#7a9a6a')});
    o+=P('M-34,168 L-12,168 L-12,196 L-34,196Z','#e3d6ba');
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#a9c0d8',{out:6,hs:.95,hy:210})};
  D.head=function(){var c='#7a6150',c2='#98806c',sc='#d98a3e';
    return mHead7({cheek:.85,brow:'#6f6258',
      back:function(H){var o='';for(var k=0;k<=10;k++){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*58,-68+Math.sin(a)*64,13,13,c)}
        [[-58,-40],[58,-40],[-55,-20],[55,-20]].forEach(function(p){o+=E(p[0],p[1],10.5,10.5,c)});return sh(o,2)},
      front:function(H){var o='';[[-34,-100,10],[-17,-106,10.5],[2,-108,10.5],[21,-105,10.5],[38,-98,10],[-48,-84,9.5],[48,-84,9.5]].forEach(function(p,i){o+=E(p[0],p[1],p[2],p[2],i%2?c2:c)});
        o+=sh('<path d="M-50,-84 C-36,-122 36,-122 50,-84" stroke="'+sc+'" stroke-width="13" fill="none" stroke-linecap="round"/>',1);
        for(var i=-3;i<=3;i++)o+=E(i*13,-104-(3-Math.abs(i))*4.2,2,2,'#f6ecd4');
        o+=sh(P('M-44,-100 C-62,-122 -66,-92 -50,-90Z',sc)+P('M-44,-100 C-34,-124 -28,-96 -42,-92Z',sc)+E(-45,-96,5.5,5.5,'#b86a28'),2);return o},
      ear:function(H){return E(-54,-34,3.6,3.6,'#d8b04a')+E(54,-34,3.6,3.6,'#d8b04a')}})};
  return build(D,full)};

/* M8 / 5: low neat bun, glasses on, olive cardigan over a ruffled nightgown, hands folded */
C.m8=function(full){var D=mBody('#738c62','#5c744d',76);
  D.clothes=function(){var o='';
    o+=P('M-82,200 L82,200 L94,350 L-94,350Z','#f2ebe4');
    o+=P('M-20,-9 L20,-9 L14,90 L0,230 L-14,90Z','#f4ede6');
    o+=P('M-13,-10 Q0,22 13,-10Z',D.skin2);
    for(var x=-20;x<=20;x+=7)o+=E(x,10+Math.abs(x)*.5,4,4,'#fbf6f0')+E(x,10+Math.abs(x)*.5,4,4,'none',' stroke="#e0d3c8" stroke-width="1"');
    o+=sh(P('M-20,-9 L-58,-2 L-76,30 L-80,230 L-14,232 L-14,90Z','#738c62')+P('M20,-9 L58,-2 L76,30 L80,230 L14,232 L14,90Z','#738c62'),2);
    for(var x=-72;x<=-22;x+=11)o+=L([[x,50],[x,226]],1.8,'#5c744d',' opacity=".4"');
    for(var x=22;x<=72;x+=11)o+=L([[x,50],[x,226]],1.8,'#5c744d',' opacity=".4"');
    o+=L([[-14,90],[-14,230]],2.4,'#485c3c')+L([[14,90],[14,230]],2.4,'#485c3c');
    [100,140].forEach(function(y){o+=sh(E(-8,y,4.8,4.8,'#d8cdb8'),1)});
    return o};
  D.arms=function(){var o='';[-1,1].forEach(function(d){var p=[[d*(D.sw-8),30],[d*(D.sw-2),96],[d*12,134]];o+=sh(arm(p,48,D.skin,D.top,D.torsoSh,1.8,'#485c3c'),2)});
    o+=sh(hand([-6,134],D.skin,D.skin2,.95,-70)+hand([8,134],D.skin,D.skin2,.95,70),2);return o};
  D.head=function(){var c='#6e5848',c2='#8a7664';
    return mHead7({cheek:.6,glasses:1,brow:'#6f6258',
      back:function(H){return sh(E(0,-136,25,20,c)+E(-7,-140,10,5,c2,' opacity=".5"')+L([[-14,-128],[10,-146]],1.5,c2,' opacity=".6"'),2)+P('M-50,-62 C-56,-110 -26,-122 0,-122 C26,-122 56,-110 50,-62Z',c)},
      front:function(H){var a='M0,-120 C-32,-120 -50,-100 -48,-62 L-47,-36 C-44,-58 -38,-76 -28,-88 C-16,-98 -6,-106 0,-120Z';return P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>'+L([[-20,-104],[-40,-72]],1.5,c2,' opacity=".6"')+L([[0,-120],[0,-102]],1.2,'#c8bdb0',' opacity=".6"')},
      ear:function(H){return E(-54,-34,3.6,3.6,'#d8b04a')+E(54,-34,3.6,3.6,'#d8b04a')}})};
  return build(D,full)};

/* ===== ROUND 9: shorter heads, long hair as BACK layer (behind neck+shoulders), richer face, younger mama ===== */
C.defs9='<defs>'
 +'<radialGradient id="gIrisR" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#b98450"/><stop offset=".6" stop-color="#7a4a2e"/><stop offset="1" stop-color="#3e2418"/></radialGradient>'
 +'<radialGradient id="gIrisM" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#d89a4a"/><stop offset=".6" stop-color="#8a5226"/><stop offset="1" stop-color="#4a2c18"/></radialGradient>'
 +'<radialGradient id="gTaupe"><stop offset="0" stop-color="#b8808a" stop-opacity=".4"/><stop offset="1" stop-color="#b8808a" stop-opacity="0"/></radialGradient>'
 +'<linearGradient id="gSkinR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f9e8d8"/><stop offset=".55" stop-color="#f2d8c3"/><stop offset="1" stop-color="#e6c3aa"/></linearGradient>'
 +'<linearGradient id="gHairR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a5636"/><stop offset=".5" stop-color="#6b3f2b"/><stop offset="1" stop-color="#4e2c20"/></linearGradient>'
 +'</defs>';

/* head wrapper: lift, tilt, vertical squash (pivot y=10) */
function wrapHead(D,m){var r=D.rot||0,sx=D.sx||1,sy=D.sy||1;
  return '<g transform="translate(0,'+(-(D.lift||0))+')"><g transform="rotate('+r+' 0 10)"><g transform="translate(0,10) scale('+sx+','+sy+') translate(0,-10)">'+m+'</g></g></g>'}
/* build9: legs -> hairBack -> neck -> torso -> clothes -> arms -> head(+front hair). Long hair behind neck and shoulders. */
function build9(D,full){
  var o='',hx=D.hx,fl=D.floor,tl=D.tl;
  if(full)o+=E(0,fl+2,D.sw*1.15,9,'#0b1020',' opacity=".5" filter="url(#sb)"')+E(0,fl,D.sw*.8,4,'#0b1020',' opacity=".6" filter="url(#sb2)"');
  var kn=(tl+fl-24)/2,hw=D.legW;
  var legs=L([[-hx,tl-10],[-hx*.96,kn]],hw,D.pants)+L([[-hx*.96,kn],[-hx*.9,fl-36]],hw*.82,D.pants)+L([[hx,tl-10],[hx*.96,kn]],hw,D.pants)+L([[hx*.96,kn],[hx*.9,fl-36]],hw*.82,D.pants);
  o+=sh(legs,2);
  o+=P('M'+f(-D.bw*.95)+','+(tl-10)+' L'+f(D.bw*.95)+','+(tl-10)+' L'+f(hx+hw/2)+','+(tl+70)+' L'+f(-hx-hw/2)+','+(tl+70)+'Z',D.pants);
  o+=sh(shoe(-hx-3,fl,-1,D.shoe)+shoe(hx+3,fl,1,D.shoe),2);
  if(D.hairBack)o+=sh(wrapHead(D,D.hairBack()),2);
  var nw=D.nw;
  o+=P('M'+(-nw)+',-40 L'+nw+',-40 L'+nw+',6 Q0,22 '+(-nw)+',6 Z',D.skin2);
  var tp=D.tp||torsoPath(D);
  var tm=P(tp,D.top)+((D.torsoSh&&!D.tp)?P('M'+f(D.sw*.2)+',-8 C'+f(D.sw*.6)+',-6 '+D.sw+',6 '+D.sw+',34 C'+(D.sw-2)+','+f(tl*.45)+' '+f(D.bw+4)+','+f(tl*.62)+' '+D.bw+','+tl+' L'+f(D.bw*.2)+','+tl+'Z',D.torsoSh,' opacity=".5"'):'');
  o+=sh(tm);
  if(D.neckSh)o+=D.neckSh();
  o+=D.clothes();
  o+=D.arms();
  o+=sh(wrapHead(D,D.head()));
  if(D.acc)o+=D.acc();
  return o}
function clipTP(D,inner){var u=uid();return '<defs><clipPath id="'+u+'"><path d="'+(D.tp||torsoPath(D))+'"/></clipPath></defs><g clip-path="url(#'+u+')">'+inner+'</g>'}

/* ---------- paper women ---------- */
var HA9=mix(SKA,{w:43,top:-112,jw:.84,chin:10,earRx:6.5,earRy:10,cw:9});
function aFace9(o){
  var H=HA9,s='';
  s+=headBase(H);
  s+='<ellipse cx="-6" cy="-88" rx="24" ry="12" fill="url(#gLight)"/><ellipse cx="-22" cy="-36" rx="11" ry="6" fill="url(#gLight)" opacity=".6"/>';
  s+='<ellipse cx="-24" cy="-26" rx="13" ry="8" fill="url(#gBlush)"/><ellipse cx="24" cy="-26" rx="13" ry="8" fill="url(#gBlush)"/>';
  s+='<ellipse cx="0" cy="3" rx="14" ry="5" fill="url(#gShade)"/>';
  s+=eyeA(-18.5,-50,o)+eyeA(18.5,-50,o);
  s+=browA(-18.5,o.brow,3.1,o.bl||0)+browA(18.5,o.brow,3.1,0);
  s+='<g transform="translate(0,-31) scale(.72)">'+P('M0,-14 C8,-6 11,2 8,7 Q0,11 -8,7 C-11,2 -8,-6 0,-14Z',H.nose)+P('M0,-14 C8,-6 11,2 8,7 Q4,6 3,0 Q2,-8 0,-14Z',H.noseHi,' opacity=".6"')+E(-3.6,6,1.4,1,H.nostril)+E(3.6,6,1.4,1,H.nostril)+'</g>';
  var lc=o.lip||'#c9726f';
  s+=P('M-10.5,-12.4 Q-5,-17 0,-14.8 Q5,-17 10.5,-12.4 Q0,-11 -10.5,-12.4Z',lc)+P('M-10.5,-12.4 Q0,-4.4 10.5,-12.4 Q0,-10.6 -10.5,-12.4Z',lc,' opacity=".9"')+E(0,-8.8,3.8,1.1,'#f0b0aa',' opacity=".65"')+L([[-10.5,-12.4],[10.5,-12.4]],1.2,'#a85a58',' opacity=".6"');
  s+=(o.front?o.front(H):'');
  if(o.ear)s+=o.ear(H);
  return s}
function wBody9(o){
  return mix(SKA,{sw:o.sw||56,bw:46,tl:246,floor:580,hx:22,legW:32,nw:14.5,lift:5,sx:1.03,sy:.9,rot:o.rot||0,top:o.top,torsoSh:o.torsoSh,pants:'#363d52',pants2:'#2c3244',shoe:{upper:'#2e3142',sole:'#e0dbd0',laces:null,acc:'#2e3142'}})}

/* Vera: smooth bun, dusty-rose blazer, pearls */
C.rV=function(full){
  var D=wBody9({top:'#cb9a94',torsoSh:'#aa7c78',sw:58,rot:3});
  D.clothes=function(){var o='';
    o+=P('M-17,-9 L17,-9 L11,80 L0,238 L-11,80Z','#f4efe6');
    o+=P('M-13,-10 Q0,22 13,-10Z',D.skin2);
    o+=sh(P('M-19,-10 L-46,-2 L-34,36 L-10,86 L-14,28Z','#d8aba5')+P('M19,-10 L46,-2 L34,36 L10,86 L14,28Z','#d8aba5'),2);
    o+=L([[-11,86],[-13,248]],1.8,'#b88b86')+L([[11,86],[13,248]],1.8,'#b88b86');
    o+=sh(E(0,100,4.6,4.6,'#8a5f5a'),1);
    return o};
  D.arms=function(){return armsH(D,38,2,D.torsoSh,{out:4,hs:.82})};
  var c='#3c2a2e',c2='#5c4248';
  D.hairBack=function(){return sh(E(0,-148,21,17,c)+E(-7,-153,9,4.6,c2,' opacity=".6"'),2)+P('M-46,-70 C-52,-112 -24,-122 0,-122 C24,-122 52,-112 46,-70Z',c)};
  D.head=function(){return aFace9({brow:'#3a2a2e',iris:'#5a3d30',gx:-1,shadow:'#b88098',lip:'#bf6466',bl:1.2,
    front:function(H){var a='M0,-124 C-34,-122 -52,-100 -50,-62 L-49,-34 C-46,-60 -40,-80 -28,-92 C-16,-102 -6,-110 0,-124Z';
      var o=P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>';
      o+=L([[-20,-106],[-40,-80]],1.5,c2,' opacity=".7"')+L([[20,-106],[40,-80]],1.5,c2,' opacity=".7"')+L([[0,-124],[0,-104]],1.2,'#d8bcae',' opacity=".6"');
      o+=L([[-42,-66],[-46,-44],[-44,-30]],1.8,c)+L([[42,-66],[45,-48],[43,-36]],1.8,c);return o},
    ear:function(H){return pearl(-44,-35,3.6)+pearl(44,-35,3.6)}})};
  return build9(D,full)};

/* Alena: honey lob, curtain bangs, lavender knit; lob is a back layer */
C.rL=function(full){
  var D=wBody9({top:'#aaa0c6',torsoSh:'#8c82ac',sw:57,rot:-2});
  D.clothes=function(){var o='';
    o+=P('M-16,-10 L16,-10 L0,46Z',D.skin2)+P('M-14,-10 L14,-10 L0,34Z',D.skin);
    o+=sh(P('M-17,-10 L-30,-12 L-24,6 L-4,26Z','#f3ead8')+P('M17,-10 L30,-12 L24,6 L4,26Z','#f3ead8'),2);
    for(var y=60;y<240;y+=12)o+=L([[-56,y],[56,y]],1.4,'#8c82ac',' opacity=".35"');
    o+=L([[-14,-8],[0,44],[14,-8]],2.6,'#8c82ac',' opacity=".7"');
    return o};
  D.arms=function(){return armsH(D,38,2,D.torsoSh,{out:4,hs:.82})};
  var c='#c9995a',c2='#e0b97c';
  D.hairBack=function(){var o=P('M-54,-80 C-64,-140 -26,-152 0,-152 C28,-152 64,-140 54,-80 C62,-50 68,-10 76,34 C78,52 64,60 50,54 C44,48 40,40 38,34 L-38,34 C-40,40 -44,48 -50,54 C-64,60 -78,52 -76,34 C-68,-10 -62,-50 -54,-80Z',c);
    return o+L([[-60,-30],[-66,10],[-70,40]],2,c2,' opacity=".6"')+L([[60,-30],[66,10],[70,40]],2,c2,' opacity=".6"')};
  D.head=function(){return aFace9({brow:'#8a5e36',iris:'#6a5038',gx:1,shadow:'#d09aa0',lip:'#c66c68',
    front:function(H){var a='M0,-124 C-30,-122 -52,-100 -50,-62 L-49,-26 C-46,-50 -40,-68 -30,-80 C-16,-90 -4,-100 0,-124Z';
      var o=P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>';
      o+=L([[-6,-110],[-28,-92],[-42,-66]],1.8,c2,' opacity=".7"')+L([[6,-110],[28,-92],[42,-66]],1.8,c2,' opacity=".7"');
      o+=L([[-47,-60],[-50,-34],[-48,-12]],2.6,c)+L([[47,-60],[50,-34],[48,-12]],2.6,c);return o},
    ear:function(H){return E(-44,-36,2.4,2.4,'#d6b45a')+E(44,-36,2.4,2.4,'#d6b45a')}})};
  return build9(D,full)};

/* ---------- Alisa: richer face construction ---------- */
function eyeR(cx,ey,gx){
  var u=uid(),m=cx<0?1:-1;
  var shape='M-9,-1 C-6,-7.6 3,-8.4 9,.8 C5,4.8 -4,4 -9,-1Z';
  var s='<g transform="translate('+cx+','+ey+') scale('+m+',1)">';
  s+='<ellipse cx="0" cy="-6.5" rx="11.5" ry="5" fill="url(#gTaupe)"/>';
  s+='<defs><clipPath id="'+u+'"><path d="'+shape+'"/></clipPath></defs>'+P(shape,'#f7f1ed');
  s+='<g clip-path="url(#'+u+')">'+E(gx,.2,5.7,5.7,'url(#gIrisR)')+E(gx,.2,5.7,5.7,'none',' stroke="#3a2418" stroke-width="1" opacity=".55"')+E(gx,.3,2.4,2.4,'#150d10')+E(gx-1.9,-2.2,1.4,1.4,'#fff',' opacity=".95"')+E(gx+2,2,.75,.75,'#fff',' opacity=".6"')
    +'<rect x="-10" y="-9" width="20" height="5" fill="#8a5a56" opacity=".3"/></g>';
  s+='<path d="M-9,-1 C-6,-7.6 3,-8.4 9,.8" stroke="#241619" stroke-width="2.1" fill="none" stroke-linecap="round"/>';
  s+=L([[-9,-1],[-11.8,-3.8]],1.6,'#241619')+L([[-7,-4.4],[-9.4,-7.2]],1.1,'#241619')+L([[-4,-6.4],[-5.8,-9.2]],1.1,'#241619')+L([[-.5,-7.1],[-1.2,-9.8]],1.1,'#241619',' opacity=".85"');
  s+='<path d="M7,2.8 C3,4.8 -4,4.2 -8.4,-.4" stroke="#5a3a3a" stroke-width=".8" fill="none" opacity=".45"/>';
  s+='<path d="M-8,-5.8 C-5,-11.6 4,-12.4 9,-4" stroke="#b07e72" stroke-width="1.1" fill="none" opacity=".5"/>';
  return s+'</g>'}
function browR(sg){return '<g transform="scale('+sg+',1)"><path d="M-8,-60.5 Q-18,-69.5 -31,-63 Q-19,-65 -8,-58.8Z" fill="#4a2c22"/></g>'}
var SK9='#f3dcc8';
C.rA=function(full){
  var D=mix(SKA,{skin:SK9,skin2:'#e2c3ab',sw:50,bw:46,tl:246,floor:580,hx:22,legW:30,nw:11.5,lift:24,rot:-2,top:'#efe6d6',pants:'#363d52',pants2:'#2c3244',shoe:{upper:'#2e3142',sole:'#e0dbd0',laces:null,acc:'#2e3142'}});
  D.tp='M-13,-10 C-26,-8 -42,-4 -51,10 C-56,20 -55,36 -54,60 C-53,100 -50,150 -46,246 L46,246 C50,150 53,100 54,60 C55,36 56,20 51,10 C42,-4 26,-8 13,-10Z';
  D.clothes=function(){var o='';
    /* scoop neck in soft knit, collarbone light, thin chain */
    o+=P('M-15,-9 L15,-9 C17,10 24,20 36,26 C18,40 -18,40 -36,26 C-24,20 -17,10 -15,-9Z',D.skin);
    o+=E(0,-10,12.5,8,'#b88c76',' opacity=".3"');
    o+=L([[-5,17],[-18,17],[-32,24]],1.5,'#f9ebdd',' opacity=".7"')+L([[5,17],[18,17],[32,24]],1.2,'#c99b84',' opacity=".4"');
    o+='<path d="M-14,-4 Q0,34 14,-4" stroke="#d6b45a" stroke-width="1" fill="none"/>'+E(0,26,2.4,3.6,'#d6b45a')+E(-.7,25,.8,1.2,'#fff',' opacity=".8"');
    o+=sh(P('M-36,26 C-18,40 18,40 36,26 C40,34 40,44 38,52 C20,58 -20,58 -38,52 C-40,44 -40,34 -36,26Z','#ece2d0'),1);
    for(var y=66;y<240;y+=14)o+=L([[-52,y],[52,y]],1.2,'#cdbfa8',' opacity=".3"');
    return o};
  D.arms=function(){return armsH(D,34,1.25,'#ece2d0',{out:3,hs:.8})};
  var c='url(#gHairR)',c2='#b07a50';
  D.hairBack=function(){
    var o=P('M-50,-70 C-56,-114 -24,-124 2,-124 C30,-124 56,-112 52,-70 C58,-30 60,10 62,44 C63,64 60,86 66,102 C56,110 42,100 36,92 C30,102 18,106 6,100 L-6,100 C-18,106 -30,102 -36,92 C-42,100 -56,110 -66,102 C-60,86 -63,64 -62,44 C-60,10 -58,-30 -50,-70Z',c);
    return o+'<path d="M-52,-20 C-58,20 -56,60 -58,90" stroke="'+c2+'" stroke-width="3" fill="none" opacity=".35"/><path d="M52,-20 C58,20 56,60 58,90" stroke="#3e2418" stroke-width="3" fill="none" opacity=".3"/>'};
  D.head=function(){var s='';
    var sk='M0,-97 C23,-97 41,-82 42,-58 C42.5,-38 37,-16 22,-2 C15,5 8,10 0,10.5 C-8,10 -15,5 -22,-2 C-37,-16 -42.5,-38 -42,-58 C-41,-82 -23,-97 0,-97Z';
    var u=uid();
    s+='<defs><clipPath id="'+u+'"><path d="'+sk+'"/></clipPath></defs>'+P(sk,'url(#gSkinR)');
    s+='<g clip-path="url(#'+u+')">'+E(-20,-30,15,12,'#fff',' opacity=".22"')+E(-6,-84,22,10,'#fff',' opacity=".25"')+E(-24,-24,14,9,'url(#gBlush)')+E(24,-24,14,9,'url(#gBlush)')+E(0,6,8,3.4,'#fff',' opacity=".22"')+P('M30,-80 C44,-50 40,-16 22,0 L44,10 L44,-90Z','#c99a82',' opacity=".18"')+'</g>';
    s+=eyeR(-17.5,-47,.6)+eyeR(17.5,-47,.6)+browR(1)+browR(-1);
    s+='<path d="M3,-44 C5,-38 6,-33 5,-29" stroke="#c9967e" stroke-width="2.4" fill="none" opacity=".16" stroke-linecap="round"/>'+E(0,-30.4,3.2,2,'#fff',' opacity=".45"')+E(-3.4,-27.6,1.4,.9,'#a87464',' opacity=".8"')+E(3.4,-27.6,1.4,.9,'#a87464',' opacity=".8"')+'<path d="M-6,-29.4 Q-7.6,-27 -5.4,-25.4 M6,-29.4 Q7.6,-27 5.4,-25.4" stroke="#c9967e" stroke-width="1" fill="none" opacity=".5"/>'+E(0,-23.4,6.5,2,'url(#gShade)',' opacity=".7"');
    s+=P('M-11,-12 C-8,-16.2 -4,-17.6 0,-15.4 C4,-17.6 8,-16.2 11,-12 C6,-11 -6,-11 -11,-12Z','#bd5f66')+P('M-10.6,-12 C-6,-5.6 6,-5.6 10.6,-12 C5,-11 -5,-11 -10.6,-12Z','#d27d80')+E(0,-8.2,3.4,.9,'#fff',' opacity=".5"')+'<path d="M-11,-12.4 Q0,-10.4 11,-12.4" stroke="#9c4a52" stroke-width=".9" fill="none"/>'+L([[11,-12.4],[12.6,-14.2]],1.2,'#b4636a',' opacity=".7"')+L([[-11,-12.4],[-12.6,-14.2]],1.2,'#b4636a',' opacity=".7"');
    var l1='M-14,-100 C-36,-100 -50,-84 -48,-56 C-47,-30 -52,10 -52,50 C-44,44 -40,18 -38,-4 C-35,-26 -36,-40 -36,-52 C-34,-70 -22,-86 -14,-100Z';
    var r1='M-14,-100 C14,-108 46,-94 47,-58 C47,-30 50,10 52,50 C44,44 41,18 40,-4 C38,-20 38,-40 33,-60 C29,-70 16,-74 4,-77 C-6,-80 -12,-90 -14,-100Z';
    s+=P(l1,c)+P(r1,c);
    s+='<path d="M-30,-88 C-40,-66 -44,-30 -47,6" stroke="'+c2+'" stroke-width="2.6" fill="none" opacity=".55" stroke-linecap="round"/><path d="M18,-98 C34,-92 42,-76 43,-56" stroke="'+c2+'" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/><path d="M44,-40 C46,-10 48,20 50,44" stroke="#3e2418" stroke-width="2.4" fill="none" opacity=".35" stroke-linecap="round"/>';
    s+=E(-40,-30,2.2,2.6,'#d6b45a')+E(40,-30,2.2,2.6,'#d6b45a',' opacity="0"');
    return s};
  return build9(D,full)};

/* ---------- friend: shorter head, hair behind neck/shoulders, face-framing strands only in front ---------- */
var PFR9='M0,-120 C-32,-120 -52,-100 -50,-60 L-49,-26 C-47,-6 -49,10 -50,30 L-40,34 C-39,14 -40,0 -37,-26 C-36,-52 -32,-72 -24,-84 C-14,-96 -6,-104 0,-120Z';
var PBK9='M-52,-76 C-60,-130 -30,-150 0,-150 C30,-150 60,-130 52,-76 C56,-30 58,30 60,72 Q44,88 30,70 L-30,70 Q-44,88 -60,72 C-58,30 -56,-30 -52,-76Z';
C.fr=function(full){var D=pDress('#e4c9b0');D.sx=1;D.sy=.9;D.rot=-2;D.lift=2;
  D.hairBack=function(){return P(PBK9,'#27232d')+L([[-50,-20],[-54,30],[-56,66]],2,'#3a3544',' opacity=".5"')};
  D.head=function(){var H=mix(SKW,{skin:'#e8cdb4',skin2:'#d3b29a',w:48,top:-114,jw:.9,chin:8,earRx:7.5,earRy:11,cheekO:.2,cw:9}),s='';
    s+=headBase(H);
    s+=E(-26,-22,1.7,1.4,'#b98470',' opacity=".55"')+E(29,-32,1.5,1.3,'#b98470',' opacity=".5"')+E(-14,-24,1.2,1.1,'#b98470',' opacity=".4"');
    s+=face({dx:19.5,ey:-50,rx:8.2,ry:6.2,open:.62,lid:H.skin2,lidLine:'#6a4e42',gx:0,gy:1,bags:1,bagCol:'#a57b69',brow:{len:24,y:-65,dy:0,out:-1,w:.01,col:'#2a2228'},nose:{y:-29,s:.92},mouth:{y:-10,c:0,w:1,col:'#000',sw:.01}},H);
    s+=L([[-30,-65],[-20,-66.5],[-9,-65]],4.6,'#2d2630')+L([[9,-67],[21,-75],[31,-70.5]],4.6,'#2d2630');
    s+=L([[-9,-10],[-1,-9.6],[8,-12.2]],3.2,'#b07268')+L([[8,-12.2],[10,-14]],2.2,'#b07268');
    s+=P(PFR9,'#302b36')+'<g transform="scale(-1,1)">'+P(PFR9,'#302b36')+'</g>';
    s+=hoop(-50,-34,12,3.2,'#d0a848')+hoop(50,-34,12,3.2,'#d0a848');
    return s};
  return build9(D,full)};

/* ---------- MAMA ~47 on screen: younger, bright warm eyes, rosy, no glasses ---------- */
function eyeM(cx,ey,gx){var u=uid(),sg=cx<0?-1:1,sh1='M'+(cx-9.4)+','+ey+' Q'+cx+','+f(ey-13)+' '+(cx+9.4)+','+ey+' Q'+cx+','+f(ey+9.6)+' '+(cx-9.4)+','+ey+'Z';
  var s='<defs><clipPath id="'+u+'"><path d="'+sh1+'"/></clipPath></defs>'+P(sh1,'#fcf8f1');
  s+='<g clip-path="url(#'+u+')">'+E(cx+gx,ey+.4,6,6,'url(#gIrisM)')+E(cx+gx,ey+.6,2.7,2.7,'#1a1012')+E(cx+gx-2.2,ey-2.4,1.9,1.9,'#fff',' opacity=".95"')+E(cx+gx+2.2,ey+2.4,1,1,'#fff',' opacity=".75"')+'</g>';
  s+='<path d="M'+(cx-9.4)+','+ey+' Q'+cx+','+f(ey-13)+' '+(cx+9.4)+','+ey+'" stroke="#4a2c26" stroke-width="2.3" fill="none" stroke-linecap="round"/>';
  s+=L([[cx+sg*9.4,ey],[cx+sg*12.8,ey-3.2]],1.9,'#4a2c26')+L([[cx+sg*7.4,ey-4.6],[cx+sg*10.6,ey-7.4]],1.5,'#4a2c26');
  s+='<path d="M'+(cx-8)+','+f(ey-7.4)+' Q'+cx+','+f(ey-13.6)+' '+(cx+8)+','+f(ey-7)+'" stroke="#b98770" stroke-width="1.2" fill="none" opacity=".45"/>';
  return s}
var HAIRX='#a24f32',HAIRX2='#c2704a',HAIRX3='#7c3a28';
function mFace9(o){
  var H=mix(SKM,{skin:'#f0d3ba',skin2:'#dcb494',cheek:'#e8948a',w:50,top:-106,jw:.92,chin:8,earRx:7,earRy:10,cheekO:.5,cw:12}),s='';
  s+=headBase(H);
  s+=(o.mid?o.mid(H):'');
  s+=E(-30,-26,15,10,'url(#gBlush)')+E(30,-26,15,10,'url(#gBlush)')+E(-30,-26,10,6,'#e8806e',' opacity=".2"')+E(30,-26,10,6,'#e8806e',' opacity=".2"');
  s+='<ellipse cx="-12" cy="-86" rx="22" ry="8" fill="#fff" opacity=".16"/>';
  s+=eyeM(-20,-46,.8)+eyeM(20,-46,.8);
  var bc=o.brow||'#7a3f2c';
  s+='<path d="M-9,-60 Q-20,-68 -31,-61" stroke="'+bc+'" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M9,-60 Q20,-68 31,-61" stroke="'+bc+'" stroke-width="3.6" fill="none" stroke-linecap="round"/>';
  s+='<g transform="translate(0,-27) scale(.9)">'+P('M0,-14 C8,-6 11,2 8,7 Q0,11 -8,7 C-11,2 -8,-6 0,-14Z',H.nose)+P('M0,-14 C8,-6 11,2 8,7 Q4,6 3,0 Q2,-8 0,-14Z',H.noseHi,' opacity=".55"')+E(-4,6,1.8,1.2,H.nostril)+E(4,6,1.8,1.2,H.nostril)+'</g>';
  s+=P('M-12.5,-14.5 Q0,-1.5 12.5,-14.5 Q0,-12.4 -12.5,-14.5Z','#8a2f3a')+P('M-10.8,-13.8 Q0,-12.2 10.8,-13.8 Q0,-10 -10.8,-13.8Z','#fbf6ee')+'<path d="M-12.5,-14.5 Q0,-1.5 12.5,-14.5" stroke="#c4555a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+L([[12.5,-14.5],[14.6,-16.6]],1.6,'#c4555a')+L([[-12.5,-14.5],[-14.6,-16.6]],1.6,'#c4555a');
  s+=(o.front?o.front(H):'');
  if(o.ear)s+=o.ear(H);
  return s}
function mBody9(top,sh2,sw,o){return mix(SKM,mix({skin:'#f0d3ba',skin2:'#dcb494',sw:sw||72,bw:84,tl:226,floor:470,hx:32,legW:44,nw:23,lift:0,top:top,torsoSh:sh2,pants:'#8a7f8f',pants2:'#776d7c',shoe:SH_M},o||{}))}
function studs(){return E(-54,-34,3.4,3.4,'#d8b04a')+E(54,-34,3.4,3.4,'#d8b04a')}
function fringeHair(c,c2){var a='M0,-110 C-30,-112 -52,-94 -50,-60 L-49,-34 C-46,-58 -38,-78 -26,-88 C-14,-98 -6,-100 0,-110Z';
  return P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>'+L([[-20,-100],[-38,-74]],1.6,c2,' opacity=".7"')+L([[20,-100],[38,-74]],1.6,c2,' opacity=".7"')}

/* M1: big copper bun with scrunchie, mustard cardigan over a floral blouse */
C.mA=function(full){var D=mBody9('#d3a04a','#b8833a');
  D.clothes=function(){var o='';
    o+=P('M-20,-9 L20,-9 L14,90 L0,230 L-14,90Z','#f4e8d6');
    [[-6,40],[6,70],[-8,100],[5,130],[-4,160],[7,190],[-6,215]].forEach(function(p){o+=E(p[0],p[1],3.4,3.4,'#d9786a')+E(p[0]+4,p[1]+3,2.2,2.2,'#7a9a6a')});
    o+=P('M-13,-10 Q0,22 13,-10Z',D.skin2);
    o+=sh(P('M-20,-9 L-58,-2 L-76,30 L-80,230 L-14,232 L-14,90Z','#d3a04a')+P('M20,-9 L58,-2 L76,30 L80,230 L14,232 L14,90Z','#d3a04a'),2);
    for(var x=-72;x<=-22;x+=10)o+=L([[x,46],[x,226]],1.6,'#b8833a',' opacity=".4"');
    for(var x=22;x<=72;x+=10)o+=L([[x,46],[x,226]],1.6,'#b8833a',' opacity=".4"');
    o+=L([[-14,90],[-14,230]],2.2,'#96692c')+L([[14,90],[14,230]],2.2,'#96692c');
    [100,140,180].forEach(function(y){o+=sh(E(-8,y,5,5,'#7a4a2c'),1)+E(-9.4,y-1.4,1.5,1.5,'#c9a07a')});
    o+=sh(P('M-70,160 L-34,160 L-34,200 L-70,200Z','#c58f3e'),1);
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#b8833a',{out:6,hs:.95,hy:210})};
  D.hairBack=function(){var c=HAIRX;return sh(E(0,-142,31,25,c)+E(-8,-150,12,6,HAIRX2,' opacity=".6"')+'<path d="M-24,-136 C-8,-148 14,-146 24,-134" stroke="'+HAIRX3+'" stroke-width="2.4" fill="none" opacity=".6"/>',2)+E(0,-116,22,6,'#c0524a')+P('M-52,-60 C-60,-108 -28,-120 0,-120 C28,-120 60,-108 52,-60Z',c)};
  D.head=function(){return mFace9({brow:'#7a3f2c',
    front:function(H){var o=fringeHair(HAIRX,HAIRX2);
      [[-46,-72,6],[46,-72,6],[-50,-50,5],[50,-50,5]].forEach(function(p){o+=E(p[0],p[1],p[2],p[2],HAIRX)});
      return o},ear:studs})};
  return build9(D,full)};

/* M2: short perm in henna, raspberry quilted housecoat with white collar */
C.mB=function(full){var D=mBody9('#bd5a74','#a04862',74);
  D.clothes=function(){var o='';
    o+=P('M-84,190 L84,190 L96,350 L-96,350Z','#bd5a74');
    var q='';for(var y=40;y<330;y+=26)for(var x=-90;x<=90;x+=26)q+=E(x+(y%52?0:13),y,2.6,2.6,'#f6e4ea',' opacity=".8"');
    o+=clipTP(D,q);
    o+=P('M-17,-8 L-46,-2 L-30,34 L-4,16Z','#f8f0ee')+P('M17,-8 L46,-2 L30,34 L4,16Z','#f8f0ee');
    for(var i=0;i<7;i++){o+=E(-22+i*3.4*0-24+i*3,10+i*3,2,2,'#e8d6d2',' opacity="0"')}
    o+=L([[0,16],[0,348]],2.4,'#f6e4ea');
    [56,100,144,188].forEach(function(y){o+=sh(E(0,y,4.6,4.6,'#f6e4ea'),1)});
    o+=P('M-70,150 L-34,150 L-34,190 L-70,190Z','#a04862')+L([[-70,156],[-34,156]],1.4,'#f6e4ea');
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#d27c92',{out:6,hs:.95,hy:210})};
  D.hairBack=function(){var c=HAIRX,c2=HAIRX2,o='';for(var k=0;k<=10;k++){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*56,-62+Math.sin(a)*62,12.5,12.5,c)}
    [[-58,-36],[58,-36],[-54,-16],[54,-16]].forEach(function(p){o+=E(p[0],p[1],10.5,10.5,c)});
    for(var k=1;k<10;k+=2){var a=-Math.PI+k*(Math.PI/10);o+=E(Math.cos(a)*56-3,-62+Math.sin(a)*62-4,4.6,4,c2,' opacity=".6"')}return o};
  D.head=function(){var c=HAIRX,c2=HAIRX2;return mFace9({brow:'#7a3f2c',
    front:function(H){var o='';[[-34,-96,9.5],[-17,-102,10.5],[2,-104,10.5],[21,-101,10.5],[38,-94,9.5],[-47,-80,9],[47,-80,9]].forEach(function(p,i){o+=E(p[0],p[1],p[2],p[2],i%2?c2:c)});return o},ear:studs})};
  return build9(D,full)};

/* M3: padded polka headband, shoulder-length chestnut hair behind, sky housecoat + cherry apron */
C.mC=function(full){var D=mBody9('#8ea8c6','#7690b0',72);
  D.clothes=function(){var o='';
    o+=P('M-84,190 L84,190 L96,350 L-96,350Z','#8ea8c6');
    o+=P('M-18,-8 L-44,-2 L-30,30 L-4,16Z','#e8eef6')+P('M18,-8 L44,-2 L30,30 L4,16Z','#e8eef6');
    o+=sh(L([[-22,-4],[-26,48]],7,'#efe4cc')+L([[22,-4],[26,48]],7,'#efe4cc'),1);
    o+=sh(P('M-34,48 L34,48 L38,350 L-38,350Z','#efe4cc'),2);
    for(var x=-30;x<=30;x+=6)o+=E(x,48,3.4,3.4,'#c0524a');
    [[-18,80],[8,96],[-8,130],[20,150],[-22,176],[10,196],[-4,230],[22,262]].forEach(function(p){o+=L([[p[0],p[1]],[p[0]+5,p[1]-9]],1.4,'#7a9a6a')+E(p[0],p[1],4.2,4.2,'#c0524a')+E(p[0]+9,p[1]+3,4.2,4.2,'#c0524a')+L([[p[0]+5,p[1]-9],[p[0]+9,p[1]+3]],1.4,'#7a9a6a')});
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#a9c0d8',{out:6,hs:.95,hy:210})};
  var c='#8a4a30',c2='#b06a46';
  D.hairBack=function(){return P('M-56,-70 C-64,-120 -30,-128 0,-128 C30,-128 64,-120 56,-70 C62,-40 66,-6 68,34 C62,46 46,44 42,36 L-42,36 C-46,44 -62,46 -68,34 C-66,-6 -62,-40 -56,-70Z',c)+L([[-60,-30],[-64,10],[-64,30]],2,c2,' opacity=".6"')+L([[60,-30],[64,10],[64,30]],2,c2,' opacity=".6"')};
  D.head=function(){return mFace9({brow:'#6a3a28',
    front:function(H){var a='M0,-110 C-32,-112 -52,-92 -50,-60 L-49,-26 C-47,-10 -50,4 -52,16 L-42,20 C-42,6 -40,-6 -38,-26 C-36,-52 -30,-76 -22,-90 C-12,-100 -6,-102 0,-110Z';
      var o=P(a,c)+'<g transform="scale(-1,1)">'+P(a,c)+'</g>';
      o+=sh('<path d="M-50,-80 C-36,-118 36,-118 50,-80" stroke="#3f8a82" stroke-width="13" fill="none" stroke-linecap="round"/>',1);
      for(var i=-3;i<=3;i++)o+=E(i*13,-104-(3-Math.abs(i))*4.4,2,2,'#f6ecd4');
      return o},ear:studs})};
  return build9(D,full)};

/* M4: bright floral scarf knotted on top, curls at the face, mint housecoat, amber beads */
C.mD=function(full){var D=mBody9('#86b8a0','#6c9c86',72);
  D.clothes=function(){var o='';
    o+=P('M-84,190 L84,190 L96,350 L-96,350Z','#86b8a0');
    o+=P('M-17,-8 L-44,-2 L-28,32 L-4,16Z','#f6f0e4')+P('M17,-8 L44,-2 L28,32 L4,16Z','#f6f0e4');
    o+=L([[-44,-2],[-28,32],[-4,16]],1.4,'#d8cdb8')+L([[44,-2],[28,32],[4,16]],1.4,'#d8cdb8');
    o+=L([[0,16],[0,348]],2,'#e6f0ea');
    [52,96,140,184].forEach(function(y){o+=sh(E(0,y,4.6,4.6,'#f6f0e4'),1)});
    o+=P('M-70,150 L-34,150 L-34,192 L-70,192Z','#6c9c86')+L([[-70,156],[-34,156]],1.4,'#e6f0ea');
    for(var y=60;y<330;y+=34)o+=L([[-88,y],[88,y]],1.2,'#6c9c86',' opacity=".35"');
    return o};
  D.arms=function(){return armsH(D,48,1.25,'#a5cdb9',{out:6,hs:.95,hy:210})};
  D.acc=function(){var o='';for(var i=0;i<=10;i++){var t=i/10,x=-26+52*t,y=10+Math.sin(t*Math.PI)*34;o+=sh(E(x,y,4.4,4.4,i%2?'#d9902e':'#e8b45a'),1)}return o};
  var c=HAIRX,c2=HAIRX2,sc='#e6b044',sd='#c88a28';
  D.hairBack=function(){var o='';
    o+=sh(P('M30,-116 C40,-136 58,-142 70,-132 C64,-122 52,-118 42,-112Z',sc)+P('M34,-110 C50,-112 66,-100 72,-86 C60,-90 46,-96 38,-104Z',sd),2);
    o+=P('M-54,-60 C-60,-108 -28,-122 0,-122 C28,-122 60,-108 54,-60Z',c);
    return o};
  D.head=function(){return mFace9({brow:'#6a3a28',
    front:function(H){var o='';[[-48,-70,8],[48,-70,8],[-52,-48,7],[52,-48,7],[-48,-28,6],[48,-28,6]].forEach(function(p,i){o+=E(p[0],p[1],p[2],p[2],i%2?HAIRX2:c)});
      var sp=P('M-56,-76 C-58,-112 -30,-124 0,-124 C30,-124 58,-112 56,-76 C46,-96 28,-106 0,-105 C-28,-106 -46,-96 -56,-76Z',sc);
      sp+=P('M0,-124 C30,-124 58,-112 56,-76 C46,-96 28,-106 0,-105Z',sd,' opacity=".4"');
      [[-40,-104],[-20,-114],[2,-117],[24,-113],[42,-102],[-50,-86],[50,-86]].forEach(function(p){sp+=E(p[0],p[1],3,3,'#c0524a')+E(p[0],p[1],1.1,1.1,'#fbe8b0')});
      o+=sh(sp,1);
      o+=sh(E(36,-110,7,7,sd)+E(36,-110,3,3,'#f6e4a0'),1);
      return o},ear:studs})};
  return build9(D,full)};
/* ===== ROUND 10: busts. shorter rounder face, female shoulders, new hair + eye styles ===== */
C.defs10='<defs>'
 +'<linearGradient id="gNeck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dcb9a2"/><stop offset=".45" stop-color="#ecd0ba"/><stop offset="1" stop-color="#f4dfcc"/></linearGradient>'
 +'<linearGradient id="gSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b1020" stop-opacity=".22"/></linearGradient>'
 +'<radialGradient id="gBag"><stop offset="0" stop-color="#a98aa6" stop-opacity=".22"/><stop offset="1" stop-color="#a98aa6" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gLidSh"><stop offset="0" stop-color="#c88a84" stop-opacity=".4"/><stop offset="1" stop-color="#c88a84" stop-opacity="0"/></radialGradient>'
 +'</defs>';
function mir(d,col,x){return '<g transform="scale(-1,1)">'+P(d,col,x)+'</g>'}
var G={n:0};
var SKULLN='M0,-94.5 C24,-94.5 42,-82 43,-58 C44,-36 39,-15 26,-5 C19,0 9,3.2 0,3.2 C-9,3.2 -19,0 -26,-5 C-39,-15 -44,-36 -43,-58 C-42,-82 -24,-94.5 0,-94.5Z';
var SKULL10='M0,-96 C26,-96 46,-83 47,-58 C48,-36 43,-15 29,-3 C21,3 10,7 0,7 C-10,7 -21,3 -29,-3 C-43,-15 -48,-36 -47,-58 C-46,-83 -26,-96 0,-96Z';
var TORSO10='M-12.5,-8 C-24,-6 -42,2 -54,12 C-62,18 -65,28 -64,46 C-64,80 -62,120 -60,172 L60,172 C62,120 64,80 64,46 C65,28 62,18 54,12 C42,2 24,-6 12.5,-8Z';

/* eye: outer corner at -x for the left eye. o: lid drop, gx, gy, up, iris, bag */
function eyeW(cx,ey,o){
  var m=cx<0?1:-1,u=uid(),d=o.lid||0,gx=(o.gx||0)*m,gy=o.gy||0,ir=o.iris||'#8a5a34',up=o.up==null?0:o.up;
  var oy=-1.8-up*.5,top='M-9.5,'+oy+' C-5.5,'+(-8.2+d-up*.4)+' 3,'+(-9+d)+' 8.5,1.2';
  var shape='M-9.5,'+oy+' C-5.5,-8.2 3,-9 8.5,1.2 C4,5 -4.5,4.4 -9.5,'+oy+'Z';
  var s='<g transform="translate('+cx+','+ey+') scale('+m+',1)">';
  s+='<ellipse cx="0" cy="-5.5" rx="11" ry="5" fill="url(#gLidSh)"/>';
  if(o.bag)s+='<ellipse cx="0" cy="8.5" rx="11" ry="3.6" fill="url(#gBag)"/>';
  s+='<defs><clipPath id="'+u+'"><path d="'+shape+'"/></clipPath></defs>'+P(shape,'#f6efea');
  s+='<g clip-path="url(#'+u+')">'+E(gx*.7,.4+gy,5.3,5.3,ir)+E(gx*.7,3.2+gy,4.2,2.6,'#fff',' opacity=".14"')+E(gx*.7,.5+gy,5.3,5.3,'none',' stroke="#2a1812" stroke-width=".9" opacity=".5"')+E(gx*.7,.5+gy,2.3,2.3,'#150d10')+E(gx*.7-1.7,-1.9+gy,(o.glint?1.8:1.3),(o.glint?1.8:1.3),'#fff',' opacity=".95"')+(o.glint?E(gx*.7+2,1.5+gy,.85,.85,'#fff',' opacity=".8"'):'')
   +'<path d="M-12,-14 L12,-14 L12,1.2 L8.5,1.2 C3,'+(-9+d)+' -5.5,'+(-8.2+d-up*.4)+' -9.5,'+oy+' L-12,'+oy+'Z" fill="'+(o.lidc||'#ead0bc')+'"/>'
   +'<path d="M-12,'+(-3+d*.4)+' L12,'+(-3+d*.4)+' L12,-1 L-12,-1Z" fill="#a87068" opacity="'+(d>0?.18:0)+'"/></g>';
  s+='<path d="'+top.replace('M-9.5,'+oy,'M-9.5,'+oy)+'" stroke="#2c1b1c" stroke-width="'+(o.lw||1.9)+'" fill="none" stroke-linecap="round"/>';
  s+=L([[-9.5,oy],[-12.6,oy-1.8-up*.3]],1.3,'#2c1b1c');
  s+='<path d="M8,2.6 C3.5,4.8 -4.5,4.2 -8.6,'+(oy+.8)+'" stroke="#9a6a60" stroke-width=".8" fill="none" opacity=".5"/>';
  s+='<path d="M-8.6,'+(-5.3+d*.5)+' C-4.5,'+(-10.8+d*.6)+' 3,'+(-11.6+d*.6)+' 8,-4.4" stroke="#b88470" stroke-width="1" fill="none" opacity=".5"/>';
  return s+'</g>'}
function browW(cx,col,a,th,out){var sg=cx<0?-1:1,x1=cx-sg*11,x2=cx+sg*15,t=th||2;
  return P('M'+x1+','+f(-59.5-a*.3)+' Q'+f(cx+sg*1)+','+f(-67-a)+' '+x2+','+f(-57.5-(out||0))+' Q'+f(cx+sg*2)+','+f(-62.6-a)+' '+x1+','+f(-59.5+t-a*.3)+'Z',col)}
function mouthW(o){var lc=o.lip||'#c26e6c',w=o.mw||10,sm=o.sm==null?1.6:o.sm,k=o.smirk||0,lcy=-13.5,ly=lcy-sm,ry=lcy-sm-k*2.2;
  var s=P('M'+(-w)+','+f(ly)+' Q0,'+f(lcy+sm+2.6)+' '+w+','+f(ry)+' Q0,'+f(lcy+4.6+sm*.5)+' '+(-w+1.5)+','+f(ly+.8)+'Z','#dc8d88');
  s=P('M'+(-w+1.6)+','+f(ly+.6)+' Q0,'+f(lcy+sm+7+(o.full||0))+' '+(w-1.6)+','+f(ry+.6)+' Q0,'+f(lcy+sm+1.6)+' '+(-w+1.6)+','+f(ly+.6)+'Z',lc,' opacity=".92"');
  s+=P('M'+(-w)+','+f(ly)+' Q'+f(-w*.5)+','+f(ly-3.6)+' 0,'+f(lcy+sm-3)+' Q'+f(w*.5)+','+f(ry-3.6)+' '+w+','+f(ry)+' Q0,'+f(lcy+sm+2.4)+' '+(-w)+','+f(ly)+'Z',o.lip2||'#b85c5e');
  s+=E(0,f(lcy+sm+3.3),3.4,.9,'#f6c4be',' opacity=".55"');
  s+=L([[w,ry],[w+1.8,ry-1.8]],1.3,'#b0685e',' opacity=".7"')+L([[-w,ly],[-w-1.8,ly-1.8]],1.3,'#b0685e',' opacity=".7"');
  return s}
function freckles(n){var s='';[[-26,-30],[-21,-26],[-15,-31],[-28,-24],[-12,-26],[-19,-35],[26,-30],[21,-26],[15,-31],[28,-24],[12,-26],[19,-35],[-4,-37],[4,-36],[0,-34]].slice(0,n).forEach(function(p,i){s+=E(p[0],p[1],1.1+(i%3)*.15,.9,'#b97a5c',' opacity=".55"')});return s}
function faceW(o){
  var s='',u=uid(),sk=o.skin||'#f3dcc8';
  var SK=G.sk||(G.n?SKULLN:SKULL10),ex=G.ex||(G.n?43.5:47.5);
  s+=E(-ex,-44,5.4,8.2,sk)+E(ex,-44,5.4,8.2,sk)+E(-ex+.5,-43,2.6,4.6,'#d9b199')+E(ex-.5,-43,2.6,4.6,'#d9b199');
  s+='<defs><clipPath id="'+u+'"><path d="'+SK+'"/></clipPath></defs>'+P(SK,'url(#gSkinR)');
  s+='<g clip-path="url(#'+u+')">'+E(-18,-40,14,12,'#fff',' opacity=".2"')+E(-4,-82,22,9,'#fff',' opacity=".22"')+(G.n?(E(-26,-23,11,5.2,'url(#gBlush2)')+E(26,-23,11,5.2,'url(#gBlush2)')+'<path d="M-40,-44 C-38,-30 -33,-16 -22,-8 C-33,-14 -39,-28 -42,-42Z" fill="#b98470" opacity="'+(G.cb||.16)+'"/><path d="M40,-44 C38,-30 33,-16 22,-8 C33,-14 39,-28 42,-42Z" fill="#b98470" opacity="'+(G.cb||.16)+'"/>'+E(0,5,6,2.6,'#fff',' opacity=".22"')+E(0,-2,10,4,'#b98470',' opacity=".16"')+P('M30,-80 C42,-50 38,-18 24,-3 L46,10 L46,-90Z','#c99a82',' opacity=".15"')):(E(-28,-22,15,9,'url(#gBlush)')+E(28,-22,15,9,'url(#gBlush)')+E(0,6,10,3.6,'#fff',' opacity=".18"')+P('M32,-80 C46,-50 42,-16 26,0 L48,10 L48,-90Z','#c99a82',' opacity=".16"')+E(0,-3,16,6,'#b98470',' opacity=".18"')))+'</g>';
  s+=eyeW(-19,-45,o.eye)+eyeW(19,-45,o.eye2||o.eye);
  s+=browW(-19,o.brow||'#4a3028',o.bl||0,o.bt||2.2,o.bo||0)+browW(19,o.brow||'#4a3028',o.br||0,o.bt||2.2,0);
  s+='<g transform="translate(0,-28) scale('+(o.nsx||1)+','+(o.nsy||1)+') translate(0,28)"><path d="M3,-42 C5,-36 6,-31 5,-27" stroke="#c9967e" stroke-width="2.4" fill="none" opacity=".16" stroke-linecap="round"/>'+E(0,-28.8,3.2,2,'#fff',' opacity=".42"')+E(-3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+E(3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+'<path d="M-6,-27.6 Q-7.6,-25.2 -5.4,-23.6 M6,-27.6 Q7.6,-25.2 5.4,-23.6" stroke="#c9967e" stroke-width="1" fill="none" opacity=".5"/></g>';
  if(o.fr)s+=freckles(o.fr);
  s+=mouthW(o.mouth||{});
  return s}

/* neckline skin shapes (neck + chest) */
var NK={
 scoop:'M-11.5,-40 L11.5,-40 L12.5,-8 C14,6 22,18 34,23 C16,36 -16,36 -34,23 C-22,18 -14,6 -12.5,-8Z',
 v:'M-11.5,-40 L11.5,-40 L12.5,-8 Q20,6 27,16 Q10,30 0,38 Q-10,30 -27,16 Q-20,6 -12.5,-8Z',
 boat:'M-11.5,-40 L11.5,-40 L12.5,-8 C30,-3 44,1 50,6 C32,16 -32,16 -50,6 C-44,1 -30,-3 -12.5,-8Z',
 round:'M-11.5,-40 L11.5,-40 L12.5,-8 C13,4 18,12 25,14 C12,22 -12,22 -25,14 C-18,12 -13,4 -12.5,-8Z',
 collar:'M-11.5,-40 L11.5,-40 L12.5,-8 L17,12 L0,34 L-17,12 L-12.5,-8Z'
};
function bust(o,full){
  var lift=o.lift==null?30:o.lift,rot=o.rot||0,s='';
  var hd=function(m){return '<g transform="translate(0,'+(-lift)+') rotate('+rot+' 0 10)">'+m+'</g>'};
  if(o.back)s+=sh(hd(o.back()),2);
  if(full)s+=P('M-58,150 L58,150 L46,330 L40,580 L5,580 L2,380 L-2,380 L-5,580 L-40,580 L-46,330Z','#363d52');
  var u=uid(),u2=uid();
  var TR=o.torso||TORSO10;s+=sh(P(TR,o.top))+'<defs><clipPath id="'+u+'"><path d="'+TR+'"/></clipPath></defs>';
  s+='<g clip-path="url(#'+u+')"><rect x="-70" y="-10" width="140" height="190" fill="url(#gSide)"/>'+L([[-52,34],[-52,60],[-51,172]],2.2,o.top2,' opacity=".4"')+L([[52,34],[52,60],[51,172]],2.2,o.top2,' opacity=".4"')+E(-40,16,16,6,'#fff',' opacity=".12"')+(o.fabric?o.fabric():'')+'</g>';
  s+=sh(P(NK[o.neck],'url(#gNeck)'),1)+'<defs><clipPath id="'+u2+'"><path d="'+NK[o.neck]+'"/></clipPath></defs>';
  s+='<g clip-path="url(#'+u2+')">'+E(0,-10,17,10,'#a8745e',' opacity=".34"')+L([[-20,15],[-9,17]],1.2,'#fff',' opacity=".22"')+L([[20,15],[9,17]],1.2,'#b88470',' opacity=".2"')+'</g>';
  if(o.under)s+=o.under();
  if(o.detail)s+=o.detail();
  s+=sh(hd(faceW(o)+(o.front?o.front():'')+(o.ear?o.ear():'')));
  if(o.over)s+=o.over();
  return s}

/* ---- hair styles. each returns {back,front,ear} using colours c,c2,c3 ---- */
function sweepLines(list,col,w,op){var s='';list.forEach(function(l){s+=L(l,w||2.2,col,' opacity="'+(op||.5)+'"')});return s}

/* 1 soft waves to the shoulder, side part */
function hWaves(c,c2,c3){return {
 back:function(){return P('M-52,-66 C-58,-112 -28,-112 0,-112 C28,-112 58,-110 52,-66 C58,-30 54,0 62,24 C66,38 58,50 66,64 C54,70 44,60 38,52 L-38,52 C-44,60 -54,70 -66,64 C-58,50 -66,38 -62,24 C-54,0 -58,-30 -52,-66Z',c3)},
 front:function(){return P('M-16,-100 C-44,-98 -53,-76 -52,-46 C-51,-20 -58,6 -57,30 C-56,48 -62,58 -58,68 C-48,70 -44,56 -45,40 C-46,18 -41,-4 -40,-26 C-39,-46 -36,-62 -28,-72 C-22,-79 -14,-86 -10,-92 C-12,-95 -14,-98 -16,-100Z',c)
  +P('M-16,-100 C12,-110 46,-96 50,-62 C52,-34 56,-6 56,26 C56,46 62,58 58,68 C48,70 44,56 44,40 C44,16 42,-8 40,-28 C38,-44 36,-56 30,-64 C22,-72 6,-78 -6,-82 C-12,-84 -14,-90 -16,-100Z',c)
  +sweepLines([[[-6,-102],[18,-100],[40,-84]],[[-52,-30],[-50,0],[-52,30],[-50,50]],[[48,-30],[50,0],[48,30],[50,50]]],c2,2.4,.55)}}}
/* 2 high ponytail, visible hairline, crown volume */
function hPony(c,c2,c3){return {
 back:function(){return P('M2,-100 C22,-134 66,-138 76,-104 C84,-76 70,-46 64,-12 C58,-30 62,-52 56,-70 C50,-84 34,-92 18,-96Z',c3)+sweepLines([[[26,-112],[56,-116],[68,-90],[62,-50]]],c2,2.4,.5)+'<g transform="rotate(-18 10 -100)">'+E(10,-100,9,5,'#d6b45a')+E(8,-101.5,4,1.4,'#fff',' opacity=".5"')+'</g>'},
 front:function(){return P('M-49,-56 C-54,-96 -30,-112 2,-112 C34,-112 56,-96 49,-56 C34,-80 14,-90 -8,-88 C-26,-84 -40,-70 -49,-56Z',c)
  +P('M-47,-58 C-46,-44 -45,-34 -43,-26 C-47,-34 -49,-46 -49,-58Z',c)+P('M47,-58 C46,-44 45,-34 43,-26 C47,-34 49,-46 49,-58Z',c)
  +sweepLines([[[-40,-90],[-14,-102],[14,-104]],[[-30,-82],[-8,-94],[24,-98],[44,-84]]],c2,2.2,.55)},
 ear:function(){return pearl(-49,-38,3.4)+pearl(49,-38,3.4)}}}
/* 3 low side braid + soft parted hair */
function hBraid(c,c2,c3){return {
 back:function(){return P('M-52,-62 C-58,-108 -28,-112 0,-112 C28,-112 58,-108 52,-62 C58,-30 54,-4 52,14 L-52,14 C-54,-4 -58,-30 -52,-62Z',c3)},
 front:function(){return P('M-6,-102 C-36,-102 -52,-84 -51,-52 C-50,-30 -50,-16 -50,-2 C-44,-10 -40,-22 -38,-34 C-36,-50 -34,-66 -24,-76 C-18,-82 -10,-88 -6,-102Z',c)
  +P('M-6,-102 C22,-106 50,-94 50,-60 C50,-40 50,-20 52,-6 C44,-12 42,-26 40,-38 C38,-52 36,-62 28,-70 C20,-78 4,-82 -2,-90 C-4,-94 -5,-98 -6,-102Z',c)
  +sweepLines([[[-6,-100],[-28,-92],[-44,-70]],[[-4,-98],[22,-96],[42,-76]]],c2,2.4,.6)},
 over:function(){var s='',n=13;for(var i=0;i<n;i++){var t=i/(n-1),x=-47-6*t+5*Math.sin(Math.PI*t),y=-30+t*148,r=7.6-3.2*t;s+=sh('<g transform="translate('+f(x)+','+f(y)+') rotate('+(i%2?30:-30)+')">'+E(0,0,r,r*.72,i%2?c2:c)+'</g>',1)}
  s+=sh(E(-53,122,8,5,'#e07a62'),1)+P('M-55,124 C-60,138 -58,150 -52,154 C-52,144 -50,132 -50,124Z',c);return s}}}
/* 4 half-up with a clip, waves down */
function hHalfUp(c,c2,c3){return {
 back:function(){return P('M-52,-62 C-58,-108 -28,-112 0,-112 C28,-112 58,-108 52,-62 C58,-30 56,0 60,26 C62,44 56,56 62,66 C50,70 42,58 36,50 L-36,50 C-42,58 -50,70 -62,66 C-56,56 -62,44 -60,26 C-56,0 -58,-30 -52,-62Z',c3)},
 front:function(){return P('M-49,-58 C-54,-96 -28,-110 0,-110 C28,-110 54,-96 49,-58 C34,-76 14,-86 0,-87 C-14,-86 -34,-76 -49,-58Z',c)
  +P('M-49,-60 C-51,-40 -52,-20 -55,0 C-50,-6 -44,-20 -42,-36 C-41,-48 -42,-58 -44,-66Z',c)+P('M49,-60 C51,-40 52,-20 55,0 C50,-6 44,-20 42,-36 C41,-48 42,-58 44,-66Z',c)
  +L([[0,-108],[0,-89]],1.4,'#8a7078',' opacity=".6"')+sweepLines([[[-40,-92],[-18,-100],[-4,-100]],[[40,-92],[18,-100],[4,-100]]],c2,2.2,.55)
  +sh('<g transform="rotate(-26 -33 -92)">'+'<rect x="-46" y="-97" width="26" height="8" rx="4" fill="#d6b45a"/>'+'<rect x="-43" y="-95.4" width="20" height="2" rx="1" fill="#f3dc92" opacity=".8"/></g>',1)},
 ear:function(){return E(-49,-38,2.2,2.2,'#d6b45a')+E(49,-38,2.2,2.2,'#d6b45a')}}}
/* 5 curtain bangs, layered bob */
function hBob(c,c2,c3){var L1='M0,-104 C-30,-104 -52,-88 -51,-56 C-50,-34 -54,-10 -60,12 C-52,20 -44,12 -43,0 C-42,-16 -44,-30 -43,-42 C-40,-58 -30,-70 -18,-78 C-10,-84 -4,-92 0,-104Z';
 return {
 back:function(){return P('M-54,-62 C-60,-110 -28,-114 0,-114 C28,-114 60,-110 54,-62 C60,-36 60,-6 64,16 C58,22 48,24 38,20 L-38,20 C-48,24 -58,22 -64,16 C-60,-6 -60,-36 -54,-62Z',c3)},
 front:function(){return P(L1,c)+mir(L1,c)+sweepLines([[[-4,-98],[-20,-84],[-40,-54],[-46,-20]],[[4,-98],[20,-84],[40,-54],[46,-20]],[[-52,-20],[-54,0]]],c2,2.2,.5)},
 ear:function(){return ''}}}
/* 6 shaggy lob, choppy fringe */
function hShag(c,c2,c3){return {
 back:function(){return P('M-54,-62 C-60,-110 -28,-114 0,-114 C28,-114 60,-110 54,-62 C60,-30 62,0 64,28 C66,44 60,52 58,60 C54,52 52,50 46,56 C44,60 40,60 38,54 L-36,54 C-38,60 -42,62 -46,56 C-52,50 -54,52 -58,60 C-60,52 -66,44 -64,28 C-62,0 -60,-30 -54,-62Z',c3)},
 front:function(){var fr='M-50,-60 C-54,-100 -30,-112 0,-112 C30,-112 54,-100 50,-60 C48,-72 44,-78 40,-80 Q38,-66 33,-80 Q28,-66 22,-82 Q17,-68 10,-82 Q4,-68 -2,-84 Q-8,-68 -14,-84 Q-20,-68 -26,-82 Q-32,-68 -38,-78 Q-44,-70 -50,-60Z';
  return P(fr,c)+P('M-50,-60 C-52,-30 -56,0 -62,34 C-60,44 -54,50 -50,44 C-48,30 -46,10 -44,-10 C-43,-30 -44,-46 -46,-60Z',c)+mir('M-50,-60 C-52,-30 -56,0 -62,34 C-60,44 -54,50 -50,44 C-48,30 -46,10 -44,-10 C-43,-30 -44,-46 -46,-60Z',c)
  +sweepLines([[[-30,-104],[-34,-90]],[[10,-108],[6,-92]],[[-56,-10],[-56,20],[-58,34]],[[56,-10],[56,20],[58,34]]],c2,2.2,.55)}}}
/* 7 French twist: swept hair, twist roll at the side */
function hTwist(c,c2,c3){return {
 back:function(){return P('M-52,-62 C-58,-106 -28,-110 0,-110 C28,-110 58,-106 52,-62 C58,-40 60,-24 54,-6 L-54,-6 C-60,-24 -58,-40 -52,-62Z',c3)+sh(P('M44,-66 C66,-66 74,-34 64,-2 C60,10 48,10 44,0Z',c)+sweepLines([[[52,-60],[66,-40],[62,-14]],[[48,-52],[60,-30],[56,-6]]],c2,2.2,.6),1)},
 front:function(){return P('M-49,-54 C-54,-98 -26,-114 4,-114 C36,-114 56,-98 49,-54 C40,-74 26,-84 8,-88 C-10,-92 -30,-80 -49,-54Z',c)+sweepLines([[[-36,-92],[-12,-104],[14,-108],[38,-96]],[[-40,-80],[-10,-94],[22,-98]]],c2,2.2,.55)},
 ear:function(){var d=function(x){return L([[x,-36],[x,-30]],1,'#d9d4c6')+E(x,-27,3,4.4,'#f0ece0')+E(x-.9,-28.2,1,1.4,'#fff',' opacity=".9"')};return d(-49)+d(49)}}}
/* 8 short pixie, side-swept fringe */
function hPixie(c,c2,c3){return {
 back:null,
 front:function(){return P('M-50,-52 C-58,-92 -30,-110 0,-110 C34,-110 60,-92 50,-52 C48,-60 44,-70 38,-80 C26,-90 4,-84 -12,-76 C-26,-70 -38,-62 -50,-52Z',c)
  +sweepLines([[[-36,-96],[-6,-104],[24,-100]],[[-30,-80],[-4,-90],[26,-92]],[[44,-62],[46,-76]],[[-12,-100],[-6,-86]]],c2,2.2,.55)
},
 ear:function(){return hoop(-49,-30,6.5,1.6,'#d0a848')+hoop(49,-30,6.5,1.6,'#d0a848')}}}
/* 9 curls */
function hCurls(c,c2,c3){return {
 back:function(){var s='';for(var a=195;a<=345;a+=15){var r=a*Math.PI/180;s+=E(Math.cos(r)*58,-50+Math.sin(r)*62,14,14,c3)}
  [[-62,-26],[62,-26],[-65,0],[65,0],[-62,26],[62,26],[-58,50],[58,50],[-46,56],[46,56]].forEach(function(p){s+=E(p[0],p[1],14,14,c3)});return s},
 front:function(){var s='';[[-34,-92,12],[-14,-100,12.5],[8,-101,12.5],[28,-96,12],[44,-84,11],[-46,-80,11],[-50,-58,9.5],[50,-58,9.5],[-52,-38,8.5],[52,-38,8.5],[-54,-18,8],[54,-18,8],[-56,4,9],[56,4,9],[-56,26,10],[56,26,10]].forEach(function(p,i){s+=E(p[0],p[1],p[2],p[2],i%2?c:c2==null?c:c)});
  [[-34,-96],[-14,-104],[8,-105],[28,-100],[-50,-62],[50,-62],[-56,0],[56,0]].forEach(function(p){s+=E(p[0]-2,p[1]-2,4,2.4,c2,' opacity=".55"')});return s}}}

/* ---- bust definitions ---- */
var WCOL={
 w1:{c:'#7c4a31',c2:'#a46a47',c3:'#583220'},
 w2:{c:'#34231f',c2:'#5a4036',c3:'#241814'},
 w3:{c:'#c9985c',c2:'#e8c088',c3:'#9d6f3c'},
 w4:{c:'#2e2228',c2:'#54404a',c3:'#231a1f'},
 w5:{c:'#9a4a2e',c2:'#c0693f',c3:'#74321f'},
 w6:{c:'#6a5240',c2:'#907460',c3:'#4a382c'},
 w7:{c:'#221b26',c2:'#463a4e',c3:'#1a141e'},
 w8:{c:'#3d2a26',c2:'#654540',c3:'#2c1d1a'},
 w9:{c:'#4c2e28',c2:'#774a3c',c3:'#38211d'}
};
function line(y,w,col,op){return L([[-70,y],[70,y]],w||1.3,col,' opacity="'+(op||.3)+'"')}
function ribs(col){return function(){var o='';for(var x=-60;x<=60;x+=8)o+=L([[x,40],[x,172]],1.2,col,' opacity=".22"');return o}}
var defsW={
 w1:{hair:hWaves,top:'#efe6d6',top2:'#cdbfa8',neck:'scoop',fabric:ribs('#b9a98e'),rot:-2,
   eye:{lid:2.2,up:1.4,gx:.8,iris:'#8a5a34'},brow:'#5a3a2c',bl:.4,mouth:{sm:1.8,lip:'#c4706e',mw:10},
   detail:function(){return '<path d="M-14,-6 Q0,32 14,-6" stroke="#d6b45a" stroke-width="1" fill="none"/>'+E(0,22,2.4,3.6,'#d6b45a')+E(-.7,21,.8,1.2,'#fff',' opacity=".8"')+P('M-36,23 C-18,36 18,36 36,23 C40,30 40,40 38,46 C20,52 -20,52 -38,46 C-40,40 -40,30 -36,23Z','#ece2d0','')}},
 w2:{hair:hPony,top:'#c98f8a',top2:'#a87470',neck:'v',rot:3,
   eye:{lid:.4,up:.6,gx:0,iris:'#6f7f66'},fr:7,brow:'#3a2a26',mouth:{sm:1.2,lip:'#bd6a68',mw:9.5},
   under:function(){return P('M-22,10 Q0,24 22,10 L27,16 Q10,30 0,38 Q-10,30 -27,16Z','#f4efe6')},
   detail:function(){return sh(P('M-12.5,-8 L-36,-2 L-42,30 L-6,58 L0,40 L-27,16 Q-20,6 -12.5,-8Z','#dba7a2')+P('M12.5,-8 L36,-2 L42,30 L6,58 L0,40 L27,16 Q20,6 12.5,-8Z','#dba7a2'),1)+L([[-6,58],[-6,172]],1.6,'#a87470',' opacity=".6"')+sh(E(0,74,4,4,'#8a5f5a'),1)}},
 w3:{hair:hBraid,top:'#a99fc7',top2:'#8c82ac',neck:'boat',rot:-2,fabric:ribs('#8c82ac'),
   eye:{lid:1.1,up:1.6,gx:3.8,iris:'#6a86a0'},fr:9,brow:'#9a6a3c',bl:0,br:2.2,mouth:{sm:1.4,smirk:1,lip:'#cc7a72',mw:9.5},
   detail:function(){return L([[-50,6],[-32,15],[0,18],[32,15],[50,6]],2,'#8c82ac',' opacity=".45"')}},
 w4:{hair:hHalfUp,top:'#8fb09a',top2:'#6f9380',neck:'round',rot:-1,fabric:ribs('#6f9380'),
   eye:{lid:3,up:1.2,gx:.6,iris:'#4a2c20',lw:2.2},brow:'#2e2228',bt:2.6,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.5},
   detail:function(){return L([[-25,14],[-12,20],[12,20],[25,14]],2,'#6f9380',' opacity=".5"')}},
 w5:{hair:hBob,top:'#d3a54e',top2:'#b0822f',neck:'v',rot:2,
   eye:{lid:1,up:3,gx:0,iris:'#8a7a36'},fr:5,brow:'#7a3e28',mouth:{sm:2,lip:'#cc6f68',mw:10},
   detail:function(){return sh(P('M-12.5,-8 Q-20,6 -27,16 Q-10,30 0,38 L40,172 L72,172 L66,60 Q40,30 12.5,-8Z','#d3a54e'),1)+L([[-27,16],[0,38],[40,172]],1.6,'#b0822f',' opacity=".6"')}},
 w6:{hair:hShag,top:'#8aa0bd',top2:'#6d84a2',neck:'boat',rot:-2,fabric:function(){var o='';for(var y=50;y<172;y+=11)o+=L([[-66,y],[66,y]],1.5,'#6d84a2',' opacity=".25"');return o},
   eye:{lid:1.6,up:1,gx:-3.6,iris:'#6a5038'},fr:6,brow:'#5a4636',bl:2,mouth:{sm:1.2,smirk:1.4,lip:'#c8736c',mw:9},
   detail:function(){return L([[-50,6],[-32,15],[0,18],[32,15],[50,6]],2.6,'#6d84a2',' opacity=".5"')}},
 w7:{hair:hTwist,top:'#b9674f',top2:'#964e3a',neck:'round',rot:2,
   eye:{lid:2.6,up:2.2,gx:0,iris:'#3e281e',lw:2.2},brow:'#241c26',bt:2.8,bl:1.4,mouth:{sm:1.5,lip:'#a8485a',lip2:'#8e3a4c',mw:9.5},
   detail:function(){return L([[-25,14],[-12,20],[12,20],[25,14]],2,'#964e3a',' opacity=".5"')}},
 w8:{hair:hPixie,top:'#f1ebe0',top2:'#cfc6b4',neck:'collar',rot:-2,
   eye:{lid:.3,up:.6,gx:.4,gy:-.2,iris:'#7a5a3a',lw:2},brow:'#2c1d1a',bt:2.8,bl:-.6,br:-.6,mouth:{sm:1.5,lip:'#c4706e',mw:9.5},
   detail:function(){return sh(P('M-12.5,-8 L-34,-4 L-30,22 L-4,34 L-17,12Z','#fbf8f0')+P('M12.5,-8 L34,-4 L30,22 L4,34 L17,12Z','#fbf8f0'),1)+L([[0,34],[0,172]],1.4,'#cfc6b4',' opacity=".7"')}},
 w9:{hair:hCurls,top:'#4f8f98',top2:'#3a7078',neck:'scoop',rot:-3,fabric:ribs('#3a7078'),
   eye:{lid:1.8,up:1.6,gx:3.2,iris:'#6a4430'},fr:12,brow:'#4c2e28',bl:1.6,mouth:{sm:2.2,mw:11,lip:'#c4686a'},
   detail:function(){return ''}}
};
Object.keys(defsW).forEach(function(k){C[k]=function(full){var d=defsW[k],col=WCOL[k],h=d.hair(col.c,col.c2,col.c3),o=mix(d,{back:h.back,front:h.front,ear:h.ear,over:h.over});return bust(o,full)}});

/* friend: smooth black hair, fringe, hoops, oversize blazer, tired funny look; shorter head, light soft under-eye */
C.fr10=function(full){
  var c='#26222c',c2='#443d50',c3='#1c1922';
  var fr='M-49,-60 C-54,-98 -28,-110 0,-110 C28,-110 54,-98 49,-60 C48,-70 44,-76 38,-80 C26,-74 8,-72 0,-72 C-8,-72 -26,-74 -38,-80 C-44,-76 -48,-70 -49,-60Z';
  var o={top:'#cfa77c',top2:'#a9825a',neck:'v',rot:-3,skin:'#eacdb4',
   back:function(){return P('M-52,-70 C-60,-124 -30,-128 0,-128 C30,-128 60,-124 52,-70 C56,-30 60,6 64,52 Q46,70 30,52 L-30,52 Q-46,70 -64,52 C-60,6 -56,-30 -52,-70Z',c3)},
   front:function(){return P(fr,c)+sweepLines([[[-30,-100],[-6,-106]],[[-24,-90],[0,-80],[24,-90]]],c2,2.2,.45)
    +P('M-49,-62 C-51,-40 -52,-14 -54,16 L-45,18 C-44,-6 -44,-40 -44,-62Z',c)+mir('M-49,-62 C-51,-40 -52,-14 -54,16 L-45,18 C-44,-6 -44,-40 -44,-62Z',c)},
   ear:function(){return hoop(-50,-34,12,3,'#d0a848')+hoop(50,-34,12,3,'#d0a848')},
   eye:{lid:3.4,up:.4,gx:-1,iris:'#4a3228',lw:2,bag:1},brow:'#2a2228',bt:3.2,bl:-1,br:3.6,bo:0,fr:5,
   mouth:{sm:.2,smirk:1.8,lip:'#b8706a',mw:8.5,lip2:'#a45e58'},
   detail:function(){return sh(P('M-12.5,-8 L-40,-4 L-50,40 L-10,76 L-4,50 L-27,16 Q-20,6 -12.5,-8Z','#dcb890')+P('M12.5,-8 L40,-4 L50,40 L10,76 L4,50 L27,16 Q20,6 12.5,-8Z','#dcb890'),1)+'<g filter="url(#s2)"><rect x="-6" y="40" width="12" height="40" rx="3" fill="#2f7a68"/></g>'+L([[-3,-6],[-3,40]],2.4,'#2f7a68')+L([[3,-6],[3,40]],2.4,'#2f7a68')+sh('<rect x="-12" y="82" width="24" height="26" rx="4" fill="#f4f0e6"/>'+E(0,92,5,5,'#2f7a68'),2)},
   under:function(){return P('M-22,10 Q0,24 22,10 L27,16 Q10,30 0,38 Q-10,30 -27,16Z','#eee8da')}};
  return bust(o,full)};
/* ===== ROUND 11: slimmer cheeks (G.n=1), Nika x3, Alisa x3, friend hair attached ===== */
C.SK_OLD=SKULL10;C.SK_NEW=SKULLN;
C.defs11='<defs><radialGradient id="gBlush2"><stop offset="0" stop-color="#e49a88" stop-opacity=".34"/><stop offset=".6" stop-color="#e49a88" stop-opacity=".12"/><stop offset="1" stop-color="#e49a88" stop-opacity="0"/></radialGradient></defs>';

/* Nika c: loose dark waves, deep side part, crown volume */
function hWavy(c,c2,c3){return {
 back:function(){return P('M-52,-66 C-60,-114 -28,-116 0,-116 C28,-116 60,-112 52,-66 C60,-30 56,0 64,26 C70,40 60,52 68,66 C60,72 54,64 50,70 C44,74 40,62 36,54 L-36,54 C-40,62 -44,74 -50,70 C-54,64 -60,72 -68,66 C-60,52 -70,40 -64,26 C-56,0 -60,-30 -52,-66Z',c3)},
 front:function(){return P('M-30,-106 C-50,-98 -54,-76 -53,-46 C-52,-24 -59,-8 -56,12 C-53,28 -60,40 -54,54 C-48,64 -42,52 -45,40 C-48,26 -41,14 -42,-2 C-43,-20 -38,-34 -38,-48 C-38,-62 -30,-72 -22,-80 C-14,-88 -8,-96 -6,-104Z',c)
  +P('M-30,-106 C0,-116 40,-106 50,-70 C54,-40 56,-10 56,18 C56,34 62,46 56,56 C50,64 44,52 46,40 C48,24 42,6 42,-10 C42,-28 40,-46 34,-58 C26,-70 6,-80 -6,-84 C-16,-88 -22,-98 -30,-106Z',c)
  +sweepLines([[[-26,-104],[2,-104],[34,-92]],[[-52,-30],[-48,0],[-54,24],[-50,48]],[[48,-30],[52,0],[46,26],[50,50]],[[10,-90],[28,-80],[40,-60]]],c2,2.4,.55)}}}
/* Alisa a: soft layered waves, crown volume, two layer lengths */
function hLayered(c,c2,c3){return {
 back:function(){return P('M-54,-64 C-64,-118 -30,-124 0,-122 C30,-124 64,-118 54,-64 C62,-30 58,0 66,30 C72,50 62,64 52,72 C46,66 40,60 36,54 L-36,54 C-40,60 -46,66 -52,72 C-62,64 -72,50 -66,30 C-58,0 -62,-30 -54,-64Z',c3)},
 front:function(){return P('M-12,-108 C-44,-106 -55,-80 -54,-46 C-53,-20 -60,2 -58,26 C-56,44 -64,58 -56,70 C-48,72 -46,58 -47,44 C-48,24 -42,4 -42,-20 C-42,-42 -38,-62 -28,-74 C-20,-82 -14,-90 -12,-108Z',c)
  +P('M-12,-108 C10,-118 48,-106 52,-66 C54,-36 58,-6 58,22 C58,40 62,54 56,62 C48,64 46,52 46,38 C46,14 44,-10 42,-30 C40,-46 36,-58 30,-66 C22,-74 4,-80 -6,-84 C-12,-86 -12,-98 -12,-108Z',c)
  +P('M-48,-10 C-50,10 -56,26 -50,40 C-44,48 -40,38 -42,26 C-44,14 -42,0 -42,-10Z',c2,' opacity=".5"')
  +sweepLines([[[-10,-108],[18,-112],[42,-94]],[[-50,-40],[-48,-6],[-52,24],[-52,52]],[[50,-40],[52,-6],[48,24],[50,50]],[[-30,-96],[-6,-100]]],c2,2.4,.6)}}}
/* Alisa b: low loose ponytail resting over one shoulder, hair hugs the scalp */
function hLowPony(c,c2,c3){return {
 back:function(){return P('M-46,-66 C-50,-102 -28,-103 0,-103 C28,-103 50,-102 46,-66 C48,-40 45,-20 40,-6 L-40,-6 C-45,-20 -48,-40 -46,-66Z',c3)},
 front:function(){return P('M-14,-104 C-44,-100 -50,-76 -48,-50 C-46,-34 -44,-20 -42,-8 C-40,-30 -38,-48 -32,-62 C-26,-74 -18,-84 -14,-104Z',c)
  +P('M-14,-104 C16,-110 46,-96 48,-62 C49,-44 46,-26 44,-8 C41,-30 40,-46 34,-58 C26,-70 6,-78 -4,-82 C-10,-86 -12,-94 -14,-104Z',c)
  +sweepLines([[[-14,-104],[10,-102],[36,-86]],[[-24,-92],[-6,-88]]],c2,2.2,.55)},
 ear:function(){return pearl(-44,-36,3)+pearl(44,-36,3)},
 over:function(){var tail='M-22,-2 C-34,2 -40,22 -42,50 C-44,84 -40,110 -34,132 C-28,140 -20,138 -16,128 C-20,104 -18,74 -14,46 C-12,26 -10,10 -6,2Z';
  return sh(P(tail,c)+sweepLines([[[-30,14],[-34,50],[-32,96],[-28,126]],[[-22,10],[-24,50],[-22,90]]],c2,2.2,.5)+'<g transform="rotate(-8 -14 6)">'+'<rect x="-24" y="-2" width="20" height="9" rx="4.5" fill="#d9a35c"/><rect x="-22" y="-.6" width="15" height="2.2" rx="1" fill="#f1cf94" opacity=".75"/></g>',2)}}}
/* Alisa c: shoulder-length layered cut, curtain bangs */
function hLob(c,c2,c3){var BG='M-4,-106 C-34,-106 -53,-90 -52,-58 C-51,-38 -56,-14 -62,16 C-64,30 -68,40 -60,50 C-54,46 -50,52 -44,50 C-42,36 -44,20 -43,6 C-42,-12 -45,-28 -43,-42 C-40,-56 -30,-70 -18,-78 C-10,-84 -4,-94 -4,-106Z';
 return {
 back:function(){return P('M-54,-62 C-60,-112 -28,-116 0,-116 C28,-116 60,-112 54,-62 C60,-34 62,-4 66,24 C70,42 64,50 56,56 C50,52 46,56 38,52 L-38,52 C-46,56 -50,52 -56,56 C-64,50 -70,42 -66,24 C-62,-4 -60,-34 -54,-62Z',c3)},
 front:function(){return P(BG,c)+mir(BG,c)+sweepLines([[[-4,-100],[-20,-86],[-38,-58],[-46,-24]],[[4,-100],[20,-86],[38,-58],[46,-24]],[[-56,20],[-58,40]],[[56,20],[58,40]],[[-48,-6],[-52,18]]],c2,2.2,.5)},
 ear:function(){return ''}}}

var WA={c:'#7c4a31',c2:'#a46a47',c3:'#583220'},WN={c:'#2e2228',c2:'#54404a',c3:'#231a1f'};
function nOpts(base,hair,col,extra){var h=hair(col.c,col.c2,col.c3);return mix(mix(base,extra||{}),{back:h.back,front:h.front,ear:h.ear,over:h.over})}
var NIKA={top:'#8fb09a',top2:'#6f9380',neck:'round',rot:-1,fabric:ribs('#6f9380'),brow:'#2e2228',bt:2.4,
  detail:function(){return L([[-25,14],[-12,20],[12,20],[25,14]],2,'#6f9380',' opacity=".5"')}};
var ALISA={top:'#efe6d6',top2:'#cdbfa8',neck:'scoop',fabric:ribs('#b9a98e'),rot:-2,brow:'#5a3a2c',bl:.4,
  detail:defsW.w1.detail};
var EYN={lid:2.5,up:1.4,gx:.6,iris:'#4a2c20',lw:2},EYA={lid:2,up:1.4,gx:.6,iris:'#8a5a34'};
var NV={
 n4a:function(){return nOpts(NIKA,hHalfUp,WN,{eye:EYN,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2}})},
 n4b:function(){G.cb=.3;return nOpts(NIKA,hHalfUp,WN,{eye:{lid:1.9,up:1.3,gx:0,iris:'#4a2c20',lw:2},mouth:{sm:1.2,smirk:.2,lip:'#b4605e',mw:9.2,full:3.2}})},
 n4c:function(){return nOpts(NIKA,hWavy,WN,{eye:EYN,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2}})},
 a1a:function(){return nOpts(ALISA,hLayered,WA,{eye:EYA,mouth:{sm:1.8,lip:'#c4706e',mw:9.4}})},
 a1b:function(){return nOpts(ALISA,hLowPony,WA,{eye:EYA,mouth:{sm:1.8,lip:'#c4706e',mw:9.4}})},
 a1c:function(){return nOpts(ALISA,hLob,WA,{eye:EYA,mouth:{sm:1.8,lip:'#c4706e',mw:9.4}})}
};
/* old = pre-slim head (G.n=0) with the same hair, for before/after */
Object.keys(NV).forEach(function(k){
  C[k]=function(full){G.n=1;G.cb=0;try{var o=NV[k]();return bust(o,full)}finally{G.n=0;G.cb=0}};
  C[k+'_old']=function(full){G.n=0;G.cb=0;var o=NV[k]();G.cb=0;return bust(o,full)}});

/* friend: hair now hugs the skull (cap top -101, fringe from a real hairline), faint under-eye shadow, shorter head */
C.fr11=function(full){
  G.n=1;G.cb=0;
  try{
  var c='#26222c',c2='#443d50',c3='#1c1922';
  var fr='M-46,-60 C-50,-90 -26,-101 0,-101 C26,-101 50,-90 46,-60 C44,-68 40,-74 34,-78 C22,-72 8,-70 0,-70 C-8,-70 -22,-72 -34,-78 C-40,-74 -44,-68 -46,-60Z';
  var sd='M-46,-62 C-48,-40 -49,-14 -51,16 L-43,18 C-42,-6 -42,-40 -42,-62Z',sd2='M46,-62 C48,-40 49,-14 51,16 L43,18 C42,-6 42,-40 42,-62Z';
  var o={top:'#cfa77c',top2:'#a9825a',neck:'v',rot:-3,skin:'#eacdb4',
   back:function(){return P('M-48,-66 C-54,-98 -28,-103 0,-103 C28,-103 54,-98 48,-66 C54,-30 58,6 62,52 Q46,68 30,52 L-30,52 Q-46,68 -62,52 C-58,6 -54,-30 -48,-66Z',c3)},
   front:function(){return P(fr,c)+sweepLines([[[-28,-94],[-6,-98]],[[-24,-84],[0,-76],[24,-84]]],c2,2.2,.45)+P(sd,c)+P(sd2,c)},
   ear:function(){return hoop(-46,-34,12,3,'#d0a848')+hoop(46,-34,12,3,'#d0a848')},
   eye:{lid:3.4,up:.4,gx:-1,iris:'#4a3228',lw:2,bag:1},brow:'#2a2228',bt:3.2,bl:-1,br:3.6,bo:0,fr:5,
   mouth:{sm:.2,smirk:1.8,lip:'#b8706a',mw:8.5,lip2:'#a45e58'},
   detail:function(){return sh(P('M-12.5,-8 L-40,-4 L-50,40 L-10,76 L-4,50 L-27,16 Q-20,6 -12.5,-8Z','#dcb890')+P('M12.5,-8 L40,-4 L50,40 L10,76 L4,50 L27,16 Q20,6 12.5,-8Z','#dcb890'),1)+'<g filter="url(#s2)"><rect x="-6" y="40" width="12" height="40" rx="3" fill="#2f7a68"/></g>'+L([[-3,-6],[-3,40]],2.4,'#2f7a68')+L([[3,-6],[3,40]],2.4,'#2f7a68')+sh('<rect x="-12" y="82" width="24" height="26" rx="4" fill="#f4f0e6"/>'+E(0,92,5,5,'#2f7a68'),2)},
   under:function(){return P('M-22,10 Q0,24 22,10 L27,16 Q10,30 0,38 Q-10,30 -27,16Z','#eee8da')}};
  return bust(o,full)}finally{G.n=0}};
/* geometry for friend skull + hugging hair (also used by node check) */
var GEO=(function(){
 function f1(v){return Math.round(v*10)/10}
 function bez(p0,p1,p2,p3,n){var o=[];for(var i=0;i<n;i++){var t=i/n,u=1-t;o.push([u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]])}return o}
 /* parse M..C..Z path into dense polygon */
 function poly(d){var t=d.replace(/[MCZ]/g,function(c){return ' '+c+' '}).split(/[\s,]+/).filter(Boolean),i=0,cur=null,out=[];
  while(i<t.length){var c=t[i++];if(c==='M'){cur=[+t[i++],+t[i++]]}else if(c==='C'){var a=[+t[i++],+t[i++]],b=[+t[i++],+t[i++]],e=[+t[i++],+t[i++]];out=out.concat(bez(cur,a,b,e,24));cur=e}}return out}
 /* friend skull from numbers: w half-width, t top, c chin, k lowers widest point */
 function skull(p){var w=p.w,t=p.t,c=p.c,jx=p.jx,jy=p.jy;
  var R=[[[0,t],[w*.6,t],[w*.99,t+10],[w,t+30]],[[w,t+30],[w*1.02,-46],[w*1.0,-31],[w*.94,-18]],[[w*.94,-18],[w*.86,-8],[jx+8,jy-3],[jx,jy]],[[jx,jy],[jx*.7,(jy+c)/2+1.5],[jx*.3,c],[0,c]]];
  var d='M0,'+t,r=[];R.forEach(function(s){r.push(s);d+=' C'+f1(s[1][0])+','+f1(s[1][1])+' '+f1(s[2][0])+','+f1(s[2][1])+' '+f1(s[3][0])+','+f1(s[3][1])});
  var L=[];for(var i=r.length-1;i>=0;i--){var s=r[i];var m=function(q){return [-q[0],q[1]]};
   d+=' C'+f1(-s[2][0])+','+f1(s[2][1])+' '+f1(-s[1][0])+','+f1(s[1][1])+' '+f1(-s[0][0])+','+f1(s[0][1])}
  return d+'Z'}
 function offs(pts,dist){var n=pts.length,o=[];
  /* clockwise from top: normals outward = (dy,-dx) for y-down screen when going clockwise */
  for(var i=0;i<n;i++){var a=pts[(i+n-1)%n],b=pts[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=dy/l,ny=-dx/l,dd=typeof dist==='function'?dist(pts[i]):dist;o.push([pts[i][0]+nx*dd,pts[i][1]+ny*dd])}return o}
 function dist2(p,poly){var m=1e9;for(var i=0;i<poly.length;i++){var d=Math.hypot(p[0]-poly[i][0],p[1]-poly[i][1]);if(d<m)m=d}return m}
 function path(pts){return 'M'+pts.map(function(p){return f1(p[0])+','+f1(p[1])}).join(' L')}
 return {poly:poly,skull:skull,offs:offs,dist2:dist2,path:path,bez:bez,f1:f1}})();
/* hair built from skull: front cap (off dF), back (off dB), curtains inset */
GEO.hair=function(skD,dF,dB){
 var SP=GEO.poly(skD),n=SP.length,f1=GEO.f1;
 var ir=0;while(SP[ir][1]<-10)ir++;           /* right-side index at y=-10 */
 var i62=0;while(SP[i62][1]<-62)i62++;        /* y=-62 */
 var ib=0;while(SP[ib][1]<-20)ib++;           /* y=-20 */
 var OF=GEO.offs(SP,dF),OB=GEO.offs(SP,dB),IN=GEO.offs(SP,-3.2);
 var seqUp=function(O,a){var r=[];for(var i=n-a;i<n;i++)r.push(O[i]);for(i=0;i<=a;i++)r.push(O[i]);return r};
 var out=seqUp(OF,ir),tipR=OF[ir],tipL=OF[n-ir];
 out.push([tipR[0]+2.2,18]);
 out.push([IN[ir][0]+4,18]);
 for(var i=ir;i>=i62;i--)out.push(IN[i]);
 var fr=GEO.path(out)+' C'+f1(IN[i62][0]-1.5)+',-67 36,-70.5 30,-71 Q0,-67.2 -30,-71 C-36,-70.5 '+f1(-IN[i62][0]+1.5)+',-67 '+f1(-IN[i62][0])+','+f1(IN[i62][1]);
 var tail=[];for(i=n-i62;i<=n-ir;i++)tail.push(IN[i]);
 tail.push([-IN[ir][0]-4,18]);tail.push([-tipR[0]-2.2,18]);
 fr+=' L'+tail.map(function(p){return f1(p[0])+','+f1(p[1])}).join(' L')+'Z';
 var up=seqUp(OB,ib),r=OB[ib],l=OB[n-ib];
 var bk=GEO.path(up)+' C'+f1(r[0]+4)+',-4 60,22 62,52 Q46,68 30,52 L-30,52 Q-46,68 -62,52 C-60,22 '+f1(l[0]-4)+',-4 '+f1(l[0])+','+f1(l[1])+'Z';
 return {front:fr,back:bk,SP:SP,OB:OB,OF:OF,ib:ib,n:n};
};
GEO.crown=function(SP,H){var top=Math.min.apply(null,H.OB.map(function(p){return p[1]}));return {top:top,skTop:Math.min.apply(null,SP.map(function(p){return p[1]}))}};
/* ===== ROUND 12: friend plain head + hair hugging the skull; Nika x6 ===== */
NK.vw='M-13.5,-40 L13.5,-40 L14.5,-8 Q22,6 29,16 Q10,30 0,38 Q-10,30 -29,16 Q-22,6 -14.5,-8Z';
NK.wscoop='M-11.5,-40 L11.5,-40 L12.5,-8 C26,-4 40,0 48,8 C34,34 -34,34 -48,8 C-40,0 -26,-4 -12.5,-8Z';
var FSK={a:{w:44,t:-92.5,c:5,jx:20,jy:1.5},b:{w:46,t:-91,c:6,jx:22,jy:3}};
C.FSK=FSK;C.GEO=GEO;
C.OLD_BACK='M-48,-66 C-54,-98 -28,-103 0,-103 C28,-103 54,-98 48,-66 C54,-30 58,6 62,52';
function friend12(kind,glasses,full){
 var P0=FSK[kind],sd=GEO.skull(P0),H=GEO.hair(sd,2.4,3.4);
 var c='#26222c',c2='#443d50',c3='#1c1922';
 G.n=1;G.cb=0;G.sk=sd;G.ex=41;
 try{
  var o={lift:27,top:'#cfa77c',top2:'#a9825a',neck:'vw',rot:-2,skin:'#eacdb4',
   back:function(){return P(H.back,c3)},
   front:function(){return P(H.front,c)+sweepLines([[[-26,-93],[-4,-95]],[[-34,-80],[-4,-77],[30,-82]],[[40,-90],[44,-70]]],c2,2.2,.45)},
   ear:function(){var s=hoop(-44,-32,12,3,'#d0a848')+hoop(44,-32,12,3,'#d0a848');
    if(glasses)s+='<g filter="url(#s1)"><circle cx="-19" cy="-45" r="12.8" fill="#fff" fill-opacity=".1" stroke="#3a2c2c" stroke-width="2.2"/><circle cx="19" cy="-45" r="12.8" fill="#fff" fill-opacity=".1" stroke="#3a2c2c" stroke-width="2.2"/><path d="M-6.4,-47 Q0,-51 6.4,-47" fill="none" stroke="#3a2c2c" stroke-width="2"/><path d="M-31.6,-47 L-41,-50 M31.6,-47 L41,-50" stroke="#3a2c2c" stroke-width="1.8" fill="none"/></g>';
    return s},
   eye:{lid:3.4,up:.4,gx:-1,iris:'#4a3228',lw:2,bag:1},brow:'#2a2228',bt:3.2,bl:-1,br:3.6,bo:0,fr:5,
   mouth:{sm:.2,smirk:1.8,lip:'#b8706a',mw:8.8,lip2:'#a45e58'},
   detail:function(){return sh(P('M-14.5,-8 L-40,-4 L-50,40 L-10,76 L-4,50 L-29,16 Q-22,6 -14.5,-8Z','#dcb890')+P('M14.5,-8 L40,-4 L50,40 L10,76 L4,50 L29,16 Q22,6 14.5,-8Z','#dcb890'),1)+'<g filter="url(#s2)"><rect x="-6" y="40" width="12" height="40" rx="3" fill="#2f7a68"/></g>'+L([[-3,-6],[-3,40]],2.4,'#2f7a68')+L([[3,-6],[3,40]],2.4,'#2f7a68')+sh('<rect x="-12" y="82" width="24" height="26" rx="4" fill="#f4f0e6"/>'+E(0,92,5,5,'#2f7a68'),2)},
   under:function(){return P('M-24,10 Q0,24 24,10 L29,16 Q10,30 0,38 Q-10,30 -29,16Z','#eee8da')}};
  return bust(o,full)}finally{G.n=0;G.sk=null;G.ex=null}}
C.fr12a=function(full){return friend12('a',false,full)};
C.fr12b=function(full){return friend12('b',false,full)};
C.fr12c=function(full){return friend12('a',true,full)};
/* debug overlay in head frame: green skull, red hair outer edge */
C.ovNew=function(kind){var sd=GEO.skull(FSK[kind]),H=GEO.hair(sd,2.4,3.4);
 return '<g transform="translate(0,-27) rotate(-2 0 10)"><path d="'+H.back.split(' C')[0]+'" fill="none" stroke="#ff7a68" stroke-width="1.1" stroke-dasharray="3 2"/><path d="'+sd+'" fill="none" stroke="#7dffb0" stroke-width="1.2"/></g>'};
C.ovOld=function(){return '<g transform="translate(0,-30) rotate(-3 0 10)"><path d="'+C.OLD_BACK+'" fill="none" stroke="#ff7a68" stroke-width="1.1" stroke-dasharray="3 2"/><path d="'+SKULLN+'" fill="none" stroke="#7dffb0" stroke-width="1.2"/></g>'};

/* ---- Nika hair styles ---- */
function hTuck(c,c2,c3){return {
 back:function(){return P('M-52,-66 C-60,-114 -28,-116 0,-116 C28,-116 60,-112 52,-66 C58,-30 56,0 64,28 C70,42 60,54 66,68 C58,74 52,66 48,72 C44,74 40,62 36,54 L-36,54 C-40,62 -46,70 -52,70 C-56,64 -60,70 -66,66 C-60,52 -68,40 -62,26 C-56,0 -58,-30 -52,-66Z',c3)},
 front:function(){return P('M-14,-109 C-36,-106 -52,-90 -51,-62 C-51,-55 -50,-52 -47,-52 C-45,-58 -43,-68 -35,-78 C-27,-86 -19,-96 -14,-109Z',c)
  +P('M-14,-109 C10,-115 46,-104 50,-68 C52,-40 54,-10 56,30 C57,44 62,58 58,68 C50,70 46,56 46,42 C46,20 44,-6 42,-26 C41,-44 38,-60 30,-68 C22,-76 6,-82 -4,-84 C-10,-86 -13,-96 -14,-109Z',c)
  +sweepLines([[[-14,-106],[-8,-90]],[[-8,-108],[20,-104],[44,-84]],[[48,-30],[52,0],[48,30],[52,56]],[[-44,-80],[-30,-92]]],c2,2.3,.55)},
 ear:function(){var g='#d6b45a';return L([[-43.5,-36],[-43.5,-31]],1,g)+sh(E(-43.5,-27.6,2.8,3.6,g)+E(-44.2,-28.8,.9,1.3,'#fff',' opacity=".8"'),1)}}}
function hLoose(c,c2,c3,len){len=len||30;return {
 back:function(){return P('M-52,-66 C-60,-114 -28,-116 0,-116 C28,-116 60,-112 52,-66 C58,-30 56,0 64,26 C70,40 60,52 66,66 C58,72 54,64 50,70 C44,74 40,62 36,54 L-36,54 C-40,62 -44,74 -50,70 C-54,64 -58,72 -66,66 C-60,52 -70,40 -64,26 C-56,0 -58,-30 -52,-66Z',c3)},
 front:function(){var Lp='M-14,-109 C-38,-106 -53,-88 -52,-56 C-51,-34 -55,-14 -54,'+len+' C-50,'+(len+8)+' -44,'+(len+2)+' -45,'+(len-8)+' C-47,-8 -42,-22 -42,-38 C-42,-52 -38,-64 -30,-74 C-22,-84 -16,-96 -14,-109Z';
  var Rp='M-14,-109 C12,-116 48,-104 52,-66 C54,-40 52,-14 54,'+len+' C50,'+(len+8)+' 44,'+(len+2)+' 45,'+(len-8)+' C47,-8 42,-26 41,-42 C40,-56 36,-64 28,-70 C20,-76 4,-82 -4,-84 C-10,-86 -13,-96 -14,-109Z';
  return P(Lp,c)+P(Rp,c)+sweepLines([[[-14,-106],[-8,-90]],[[-8,-108],[22,-104],[46,-84]],[[-48,-40],[-50,-6],[-48,20]],[[48,-40],[50,-6],[48,20]]],c2,2.3,.55)}}}
function hWaveOver(c,c2,c3){var h=hLoose(c,c2,c3,40);
 h.over=function(){var cx=function(y){return 47+7*Math.sin(y/15)},w=function(y){return y>104?Math.max(0,(124-y)*1.35):27-y*.04};
  var a=[],b=[];for(var y=-2;y<=124;y+=2){a.push([cx(y)-w(y)/2,y]);b.push([cx(y)+w(y)/2+2*Math.sin(y/9),y])}
  var d='M'+a.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+b.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';
  var hl='',k;for(k=0;k<3;k++){var pts=[];for(y=4;y<=110;y+=6)pts.push([cx(y)-7+k*7+2*Math.sin(y/9+k),y]);hl+=L(pts,2.3,c2,' opacity=".6"')}
  return sh(P(d,c)+hl+'<g opacity=".5">'+E(cx(30)+8,30,4,12,'#fff',' opacity=".15"')+'</g>',2)};
 return h}
var TAS='M-12.5,-8 C-24,-6 -42,-2 -54,4 C-62,10 -66,24 -65,44 C-65,80 -62,120 -60,172 L60,172 C62,120 63,84 63,60 C63,42 58,28 52,20 C42,10 24,-4 12.5,-8Z';
var GOLD='#d6b45a';
function chain(sag,pend){return '<path d="M-12.4,-6 C-13,'+(sag-14)+' -6,'+(sag-2)+' 0,'+sag+' C6,'+(sag-2)+' 13,'+(sag-14)+' 12.4,-6" fill="none" stroke="'+GOLD+'" stroke-width="1" opacity=".95"/>'+(pend?sh(E(0,sag+2.6,2.1,2.9,GOLD)+E(-.6,sag+1.6,.7,1,'#fff',' opacity=".8"'),1):'')}
function bones(){return ['-1','1'].map(function(s){s=+s;return '<path d="M'+(s*9)+',3 C'+(s*17)+',1.5 '+(s*28)+',2 '+(s*38)+',7" fill="none" stroke="#b98470" stroke-width="1.5" opacity=".38" stroke-linecap="round"/><path d="M'+(s*9)+',5.4 C'+(s*17)+',4 '+(s*28)+',4.4 '+(s*36)+',9" fill="none" stroke="#fff" stroke-width="1" opacity=".28" stroke-linecap="round"/>'}).join('')}
var EY5={lid:2.5,up:1.4,gx:.6,iris:'#4a2c20',lw:2.7,glint:1};
var N12={
 n1:function(){return nOpts(NIKA,hHalfUp,WN,{eye:EYN,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2}})},
 n2:function(){return nOpts(NIKA,hTuck,WN,{eye:EYN,rot:-1,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2}})},
 n3:function(){return nOpts(NIKA,hWaveOver,WN,{eye:EYN,rot:-3,torso:TAS,mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2}})},
 n4:function(){return nOpts(NIKA,hLoose,WN,{eye:EYN,neck:'wscoop',mouth:{sm:1.4,smirk:.6,lip:'#b4605e',mw:9.2},
   detail:function(){return bones()+chain(22,1)+'<path d="M-46,9 C-34,32 34,32 46,9" fill="none" stroke="#6f9380" stroke-width="1.6" opacity=".5"/>'}})},
 n5:function(){return nOpts(NIKA,hHalfUp,WN,{eye:EY5,mouth:{sm:1.0,smirk:.5,lip:'#b4545a',lip2:'#9c4650',mw:9.4,full:3.6}})},
 n6:function(){return nOpts(NIKA,hTuck,WN,{eye:{lid:2.6,up:1.4,gx:0,iris:'#4a2c20',lw:2.5,glint:1},rot:6,bl:-.2,br:1.8,bt:2.4,
   mouth:{sm:1.2,smirk:1.5,lip:'#b4545a',lip2:'#9c4650',mw:9.2,full:2.2},
   detail:function(){return chain(17,1)+L([[-25,14],[-12,20],[12,20],[25,14]],2,'#6f9380',' opacity=".5"')}})}
};
Object.keys(N12).forEach(function(k){C[k]=function(full){G.n=1;G.cb=0;try{return bust(N12[k](),full)}finally{G.n=0;G.cb=0}}});

/* ===== sheet 9: six Slavic-ideal options, Nika A proportions ===== */
function braidOver(sign,x0,n,r0,tie){return function(c,c2){var s='';for(var i=0;i<n;i++){var t=i/(n-1),x=sign*(x0+5*t-4*Math.sin(Math.PI*t)),y=-14+t*(tie-(-14)),r=r0-3.4*t;
  s+=sh('<g transform="translate('+f(x)+','+f(y)+') rotate('+(i%2?30:-30)+')">'+E(0,0,r,r*.74,i%2?c2:c)+'</g>',1)}
  return s+sh(E(sign*(x0+5),tie+3,6.5,4.4,'#d9a35c'),1)+P('M'+(sign*(x0+3))+','+(tie+4)+' C'+(sign*(x0-2))+','+(tie+18)+' '+(sign*(x0-1))+','+(tie+28)+' '+(sign*(x0+4))+','+(tie+32)+' C'+(sign*(x0+4))+','+(tie+22)+' '+(sign*(x0+6))+','+(tie+14)+' '+(sign*(x0+7))+','+(tie+4)+'Z',c)}}
function hS1(c,c2,c3){return {back:function(){return P('M-52,-62 C-58,-108 -28,-112 0,-112 C28,-112 58,-108 52,-62 C58,-30 56,-6 50,12 Q40,20 30,14 L-30,14 Q-40,20 -50,12 C-56,-6 -58,-30 -52,-62Z',c3)},
 front:function(){return P('M-6,-102 C-36,-102 -52,-84 -51,-52 C-50,-30 -50,-16 -50,-2 C-44,-10 -40,-22 -38,-34 C-36,-50 -34,-66 -24,-76 C-18,-82 -10,-88 -6,-102Z',c)+P('M-6,-102 C22,-106 50,-94 50,-60 C50,-40 50,-20 52,-6 C44,-12 42,-26 40,-38 C38,-52 36,-62 28,-70 C20,-78 4,-82 -2,-90 C-4,-94 -5,-98 -6,-102Z',c)+sweepLines([[[-6,-100],[-28,-92],[-44,-70]],[[-4,-98],[22,-96],[42,-76]]],c2,2.4,.6)},
 over:function(){return braidOver(-1,47,13,9.4,124)(c,c2)},ear:function(){return pearl(-44,-30,2.6)+pearl(44,-30,2.6)}}}
function hS2(c,c2,c3){var h=hS1(c,c2,c3),fr=h.front;
 h.front=function(){return fr()+P('M-50,-46 C-54,-14 -50,16 -46,40 L-42,39 C-45,14 -47,-14 -45,-44Z',c)+P('M50,-46 C54,-14 50,16 46,40 L42,39 C45,14 47,-14 45,-44Z',c)+sweepLines([[[-49,-30],[-50,0],[-47,30]],[[49,-30],[50,0],[47,30]]],c2,1.8,.55)};
 h.over=function(){return braidOver(1,40,15,6.4,138)(c,c2)};
 h.ear=function(){return E(-44,-33,2,2,'#d6b45a')+E(44,-33,2,2,'#d6b45a')};
 h.back=function(){return P('M-52,-62 C-58,-108 -28,-112 0,-112 C28,-112 58,-108 52,-62 C58,-30 56,0 60,30 C62,46 54,58 48,62 L-48,62 C-54,58 -62,46 -60,30 C-56,0 -58,-30 -52,-62Z',c3)};return h}
function hS3(c,c2,c3){return {back:function(){return P('M-50,-62 C-56,-106 -28,-110 0,-110 C28,-110 56,-106 50,-62 C53,-36 50,-20 44,-10 Q30,-2 18,-8 L-18,-8 Q-30,-2 -44,-10 C-50,-20 -53,-36 -50,-62Z',c3)+sh(E(24,24,17,13,c)+sweepLines([[[10,22],[24,16],[38,22]],[[12,30],[26,36],[38,30]]],c2,1.8,.6)+E(18,19,5,2.6,'#fff',' opacity=".14"'),1)},
 front:function(){return P('M0,-108 C-30,-108 -52,-92 -50,-58 C-49,-44 -48,-30 -46,-16 C-42,-30 -40,-46 -36,-58 C-30,-72 -20,-82 -8,-90 C-4,-96 -2,-102 0,-108Z',c)+P('M0,-108 C30,-108 52,-92 50,-58 C49,-44 48,-30 46,-16 C42,-30 40,-46 36,-58 C30,-72 20,-82 8,-90 C4,-96 2,-102 0,-108Z',c)+sweepLines([[[0,-106],[-26,-96],[-42,-70]],[[0,-106],[26,-96],[42,-70]],[[-40,-46],[-44,-26]],[[40,-46],[44,-26]]],c2,2.2,.6)+L([[0,-108],[0,-92]],1.3,'#7a604e',' opacity=".5"')},
 ear:function(){return pearl(-44,-32,2.8)+pearl(44,-32,2.8)}}}
function hS4(c,c2,c3){var h=hLoose(c,c2,c3,46),fr=h.front;h.front=function(){return fr()+sweepLines([[[-48,0],[-44,12],[-50,26],[-46,40]],[[48,0],[44,12],[50,26],[46,40]],[[-30,-92],[-42,-70],[-46,-50]]],c2,2.4,.7)};
 h.ear=function(){return hoop(-44,-20,5,1.4,'#d6b45a')};return h}
function hS5(c,c2,c3){var h=hPony(c,c2,c3),fr=h.front;h.front=function(){return fr()+P('M43,-54 C47,-34 45,-14 39,0 L36,-1 C41,-14 43,-34 39,-52Z',c)+P('M-44,-50 C-47,-34 -45,-18 -41,-6 L-39,-7 C-42,-18 -43,-34 -41,-48Z',c)};return h}
function hS6(c,c2,c3){var h=hLoose(c,c2,c3,50),fr=h.front;
 h.front=function(){return fr()+'<path d="M-48,-48 C-48,-82 -28,-100 0,-100 C28,-100 48,-82 48,-48" fill="none" stroke="#c9785a" stroke-width="7" stroke-linecap="round"/><path d="M-46,-52 C-46,-82 -28,-97 0,-97 C28,-97 46,-82 46,-52" fill="none" stroke="#e6a07e" stroke-width="1.6" opacity=".7"/>'};
 h.ear=function(){return ''};return h}
var SLAV={
 s1:{hair:hS1,col:{c:'#cdbb97',c2:'#e6d8b8',c3:'#a8946f'},top:'#8da4bf',top2:'#6f89a6',neck:'round',skin:'#f6e4d4',eye:{lid:2.2,up:1.4,gx:.6,iris:'#8d9cab',lw:1.9},brow:'#8f7b5a',bt:1.8,bl:.8,br:.8,fr:4,nsx:.82,mouth:{sm:1.4,smirk:.3,lip:'#c4707a',lip2:'#b05c68',mw:9,full:2.8}},
 s2:{hair:hS2,col:{c:'#a88a64',c2:'#c9ad82',c3:'#7e6644'},top:'#e3dccb',top2:'#c5b9a2',neck:'scoop',skin:'#f6e4d4',eye:{lid:2.4,up:1.6,gx:.4,iris:'#6a90c2',lw:1.9},brow:'#7a6446',bt:2,bl:1.2,br:1.2,nsx:.9,mouth:{sm:1.6,lip:'#cc7a78',lip2:'#b86466',mw:9.6,full:3.4}},
 s3:{hair:hS3,col:{c:'#8c5c3c',c2:'#b07c56',c3:'#65402a'},top:'#9ba585',top2:'#7d8868',neck:'scoop',skin:'#f3dcc8',eye:{lid:2.6,up:1.2,gx:.5,iris:'#6f9c66',lw:2},brow:'#5e3e2c',bt:2.2,bl:.6,br:.6,fr:7,nsx:1,mouth:{sm:1.3,smirk:.4,lip:'#bc6466',lip2:'#a85258',mw:9.2,full:3}},
 s4:{hair:hS4,col:{c:'#40291f',c2:'#6a4838',c3:'#2c1c16'},top:'#b98f8c',top2:'#9b7370',neck:'round',skin:'#f3dcc8',eye:{lid:2.5,up:1.5,gx:.6,iris:'#7f94ac',lw:2.1},brow:'#34231c',bt:2.4,bl:1.4,br:1.4,nsx:.88,mouth:{sm:1.2,smirk:.5,lip:'#b85a62',lip2:'#a14852',mw:9.4,full:3.2}},
 s5:{hair:hS5,col:{c:'#b99466',c2:'#d9b888',c3:'#8e6c46'},top:'#7d9aa0',top2:'#617f86',neck:'v',skin:'#f6e1cf',eye:{lid:2,up:1.8,gx:.5,iris:'#97a06a',lw:1.9},brow:'#8a6c48',bt:2,bl:1,br:1,fr:5,nsx:.9,mouth:{sm:1.7,smirk:.2,lip:'#c8706c',lip2:'#b45c5c',mw:9.6,full:3}},
 s6:{hair:hS6,col:{c:'#7c4c32',c2:'#a2704a',c3:'#583420'},top:'#d9c795',top2:'#b8a574',neck:'boat',skin:'#f3dcc8',eye:{lid:2.3,up:1.4,gx:.6,iris:'#5f94a2',lw:2},brow:'#5a3826',bt:2.2,bl:.8,br:.8,nsx:.95,mouth:{sm:1.5,smirk:.4,lip:'#c06a68',lip2:'#ab565a',mw:9.2,full:2.8}}
};
Object.keys(SLAV).forEach(function(k){C[k]=function(full){var d=SLAV[k],h=d.hair(d.col.c,d.col.c2,d.col.c3);
 var o={top:d.top,top2:d.top2,neck:d.neck,rot:-1,skin:d.skin,fabric:ribs(d.top2),eye:d.eye,brow:d.brow,bt:d.bt,bl:d.bl,br:d.br,fr:d.fr,nsx:d.nsx,mouth:d.mouth,
  back:h.back,front:h.front,ear:h.ear,over:h.over,detail:function(){return d.neck==='boat'?L([[-50,6],[-32,15],[0,18],[32,15],[50,6]],2,d.top2,' opacity=".45"'):(d.neck==='round'?L([[-25,14],[-12,20],[12,20],[25,14]],2,d.top2,' opacity=".5"'):'')}};
 G.n=1;G.cb=.24;try{return bust(o,full)}finally{G.n=0;G.cb=0}}});
/* ===== ROUND 13: slimmer face 80/48, magnetic expression, 3 faces x 3 hairstyles ===== */
var SKULL13='M0,-94.5 C22,-94.5 39,-83 40,-59 C41,-37 37,-17 24.5,-6.5 C18,-1 9,4 0,4 C-9,4 -18,-1 -24.5,-6.5 C-37,-17 -41,-37 -40,-59 C-39,-83 -22,-94.5 0,-94.5Z';
C.SK13=SKULL13;
C.defs13='<defs><radialGradient id="gBlush2"><stop offset="0" stop-color="#e49a88" stop-opacity=".13"/><stop offset=".6" stop-color="#e49a88" stop-opacity=".04"/><stop offset="1" stop-color="#e49a88" stop-opacity="0"/></radialGradient></defs>';
function mouthX(o){var lc=o.lip||'#c26e6c',w=o.mw||10,sm=o.sm==null?1.6:o.sm,k=o.smirk||0,lcy=-13.5,ly=lcy-sm,ry=lcy-sm-k*2.2,full=o.full||0;
  var s=P('M'+(-w+1.6)+','+f(ly+.6)+' Q0,'+f(lcy+sm+7+full)+' '+(w-1.6)+','+f(ry+.6)+' Q0,'+f(lcy+sm+1.6)+' '+(-w+1.6)+','+f(ly+.6)+'Z',lc,' opacity=".95"');
  s+=P('M'+(-w)+','+f(ly)+' Q'+f(-w*.5)+','+f(ly-3.6)+' 0,'+f(lcy+sm-3)+' Q'+f(w*.5)+','+f(ry-3.6)+' '+w+','+f(ry)+' Q0,'+f(lcy+sm+2.4)+' '+(-w)+','+f(ly)+'Z',o.lip2||'#b85c5e');
  if(o.part){var cs=lcy+sm+2.0,pts=[],pb=[],i,n=12;
   for(i=0;i<=n;i++){var t=.22+.56*i/n,u=1-t,x=u*u*(-w)+2*u*t*0+t*t*w,y=u*u*ly+2*u*t*cs+t*t*ry,g=o.part*Math.sin(Math.PI*i/n);pts.push([x,y-g*.3]);pb.push([x,y+g*.8])}
   var d='M'+pts.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+pb.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';
   s+=P(d,'#7a3a42');
   var tp=[],tb=[];for(i=0;i<=n;i++){var t2=.3+.4*i/n,u2=1-t2,x2=u2*u2*(-w)+t2*t2*w,y2=u2*u2*ly+2*u2*t2*cs+t2*t2*ry,g2=o.part*Math.sin(Math.PI*i/n)*.55;tp.push([x2,y2-g2*.3]);tb.push([x2,y2+g2*.4])}
   s+=P('M'+tp.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+tb.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z','#f4ece4',' opacity=".9"')}
  var yl=.5*(lcy+sm+7+full)+.25*(ly+ry),yt=.5*(lcy+sm+1.6)+.25*(ly+ry);
  s+=E(1.2,f((yt+yl)/2+.9),2.9,.8,'#fff',' opacity=".5"');
  s+=L([[w,ry],[w+1.8,ry-2]],1.3,'#b0685e',' opacity=".75"')+L([[-w,ly],[-w-1.6,ly-1.2]],1.2,'#b0685e',' opacity=".55"');
  return s}
function faceW(o){
  var s='',u=uid(),sk=o.skin||'#f3dcc8',ex=40.8;
  s+=E(-ex,-44,5.2,8,sk)+E(ex,-44,5.2,8,sk)+E(-ex+.5,-43,2.5,4.4,'#d9b199')+E(ex-.5,-43,2.5,4.4,'#d9b199');
  s+='<defs><clipPath id="'+u+'"><path d="'+SKULL13+'"/></clipPath></defs>'+P(SKULL13,'url(#gSkinR)');
  s+='<g clip-path="url(#'+u+')">'+E(-18,-40,14,12,'#fff',' opacity=".14"')+E(-4,-82,20,8,'#fff',' opacity=".2"')
   +E(-23,-22,9,4,'url(#gBlush2)')+E(23,-22,9,4,'url(#gBlush2)')
   +'<g transform="rotate(-14 -24 -33)">'+E(-24,-33,10,4.6,'url(#gLight)',' opacity=".8"')+'</g>'
   +'<g transform="rotate(14 24 -33)">'+E(24,-33,9,4,'url(#gLight)',' opacity=".35"')+'</g>'
   +'<g transform="rotate(-34 -30 -20)">'+E(-30,-20,5.2,12,'url(#gShade)',' opacity=".95"')+'</g>'
   +'<g transform="rotate(34 30 -20)">'+E(30,-20,5.2,12,'url(#gShade)',' opacity="1"')+'</g>'
   +E(0,2.6,6,2.3,'#fff',' opacity=".2"')+E(0,-3.5,9,3.4,'#b98470',' opacity=".13"')+P('M29,-78 C40,-50 36,-18 22,-4 L44,10 L44,-90Z','#c99a82',' opacity=".14"')+'</g>';
  s+=eyeW(-19,-45,o.eye)+eyeW(19,-45,o.eye2||o.eye);
  s+=browW(-19,o.brow||'#4a3028',o.bl||0,o.bt||2.2,o.bo||0)+browW(19,o.brow||'#4a3028',o.br||0,o.bt||2.2,0);
  s+='<g transform="translate(0,-28) scale('+(o.nsx||1)+','+(o.nsy||1)+') translate(0,28)"><path d="M3,-42 C5,-36 6,-31 5,-27" stroke="#c9967e" stroke-width="2.4" fill="none" opacity=".16" stroke-linecap="round"/>'+E(0,-28.8,3.2,2,'#fff',' opacity=".42"')+E(-3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+E(3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+'<path d="M-6,-27.6 Q-7.6,-25.2 -5.4,-23.6 M6,-27.6 Q7.6,-25.2 5.4,-23.6" stroke="#c9967e" stroke-width="1" fill="none" opacity=".5"/></g>';
  if(o.fr)s+=freckles(o.fr);
  s+=mouthX(o.mouth||{});
  return s}
var TOR_L='M-12.5,-8 C-24,-4 -42,7 -54,18 C-62,24 -65,34 -64,50 C-64,84 -62,120 -60,172 L60,172 C62,120 64,80 64,46 C65,28 62,18 54,12 C42,2 24,-6 12.5,-8Z';
var TOR_R='M-12.5,-8 C-24,-6 -42,2 -54,12 C-62,18 -65,28 -64,46 C-64,80 -62,120 -60,172 L60,172 C62,120 64,84 64,50 C65,34 62,24 54,18 C42,7 24,-4 12.5,-8Z';
function sc95(s){return '<g transform="scale(.95,1)">'+s+'</g>'}
function wisps(c,list){return list.map(function(w){return '<path d="'+w+'" fill="none" stroke="'+c+'" stroke-width="1.1" stroke-linecap="round" opacity=".75"/>'}).join('')}
function wv(y,a,ph,r){return a*r*Math.sin(y/11+ph)}
function wavyPath(head,side,y0,y1,xo,xi,ao,ph,ramp){/* closed polygon: outer wavy edge then inner edge */
 var o=[],i=[],y;for(y=y0;y<=y1;y+=3){var r=Math.max(0,Math.min(1,(y-y0)/ramp));o.push([side*(xo+ao*r+ao*r*Math.sin(y/11+ph)),y]);i.push([side*(xi+ao*.5*r*Math.sin(y/11+ph+.7)),y])}
 return head+' L'+o.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+i.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')}
/* H1: Nika A half-up + gold clip */
function h13a(c,c2,c3){var h=hHalfUp(c,c2,c3);return {
 back:function(){return sc95(h.back())},
 front:function(){return sc95(h.front())+wisps(c,['M-39,-60 C-36,-52 -38,-46 -35,-40','M39,-62 C36,-54 38,-48 35,-42'])},
 ear:function(){return sc95(h.ear())}}}
/* H2: dark waves, side part, left side tucked behind the ear, gold ring */
function h13b(c,c2,c3){return {
 back:function(){var d='M-52,-66 C-60,-114 -28,-116 0,-116 C28,-116 60,-112 52,-66';var y,r,R=[],Lf=[];
  for(y=-60;y<=62;y+=3){r=Math.max(0,Math.min(1,(y+40)/50));R.push([52+6*r+6*r*Math.sin(y/11),y]);Lf.push([-(52+6*r+6*r*Math.sin(y/11+1.6)),y])}
  d+=' L'+R.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+Lf.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';return sc95(P(d,c3))},
 front:function(){var cap=P('M-14,-109 C-36,-106 -52,-90 -51,-62 C-51,-55 -50,-52 -47,-52 C-45,-58 -43,-68 -35,-78 C-27,-86 -19,-96 -14,-109Z',c);
  var top='M-14,-109 C10,-115 46,-104 50,-68';var y,o2=[],i2=[];
  for(y=-60;y<=60;y+=3){var r=Math.max(0,Math.min(1,(y+60)/50));o2.push([50+5*r+6*r*Math.sin(y/11+.3),y])}
  for(y=60;y>=-26;y-=3){var q=Math.max(0,(y+26)/86);i2.push([42+4*q*Math.sin(y/11+.9)+2*q,y])}
  var rp=top+' L'+o2.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+i2.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' C41,-44 38,-60 30,-68 C22,-76 6,-82 -4,-84 C-10,-86 -13,-96 -14,-109Z';
  var wl=[];[0,1,2].forEach(function(k){var pts=[];for(y=-40;y<=56;y+=4)pts.push([40+k*5+3.5*Math.sin(y/11+.4+k*.5),y]);wl.push(pts)});
  return sc95(cap+P(rp,c)+sweepLines([[[-14,-106],[-8,-90]],[[-8,-108],[20,-104],[44,-84]],[[-44,-80],[-30,-92]],[[-47,-60],[-44,-64]]].concat(wl),c2,2.2,.55))+wisps(c,['M39,-62 C36,-54 38,-48 35,-42'])},
 ear:function(){return hoop(-41,-31.5,4.6,1.4,'#d6b45a')},
 over:function(){var cx=function(y){return 49+7*Math.sin(y/15)},w=function(y){return y>100?Math.max(0,(124-y)*1.2):26-y*.05};var a=[],b=[],y;
  for(y=-4;y<=124;y+=2){a.push([cx(y)-w(y)/2,y]);b.push([cx(y)+w(y)/2+2*Math.sin(y/9),y])}
  var d='M'+a.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+b.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';
  var hl='',k;for(k=0;k<3;k++){var pts=[];for(y=4;y<=108;y+=5)pts.push([cx(y)-7+k*7+2*Math.sin(y/9+k),y]);hl+=L(pts,2.2,c2,' opacity=".6"')}
  return sh(P(d,c)+hl,2)}}}
/* H3: headband, chestnut hair hugging the skull, layered behind the neck */
function h13c(c,c2,c3){return {
 back:function(){return P('M-44,-62 C-47,-98 -26,-100 0,-100 C26,-100 47,-98 44,-62 C48,-38 54,-14 54,10 C58,28 54,48 60,62 L-60,62 C-54,48 -58,28 -54,10 C-54,-14 -48,-38 -44,-62Z',c3)},
 front:function(){var cap='M-46,-62 C-48,-92 -26,-99 0,-99 C26,-99 48,-92 46,-62 C44,-76 30,-91 0,-92 C-30,-91 -44,-76 -46,-62Z';
  return P(cap,c)+sweepLines([[[-30,-96],[-6,-97],[24,-94]]],c2,2.2,.5)
   +'<path d="M-44,-52 C-45,-82 -26,-92 0,-92 C26,-92 45,-82 44,-52" fill="none" stroke="#c9785a" stroke-width="6.4" stroke-linecap="round"/><path d="M-42,-55 C-43,-80 -26,-90 0,-90 C26,-90 43,-80 42,-55" fill="none" stroke="#eab08c" stroke-width="1.5" opacity=".75"/>'
   +P('M-43,-62 C-47,-46 -46,-28 -44,-8 C-43,2 -45,10 -43,18 C-40,6 -40,-10 -40,-24 C-40,-40 -41,-54 -39,-64Z',c)
   +P('M43,-62 C47,-46 46,-28 44,-8 C43,2 45,10 43,18 C40,6 40,-10 40,-24 C40,-40 41,-54 39,-64Z',c)
   +sweepLines([[[-44,-56],[-45,-30],[-43,0]],[[44,-56],[45,-30],[43,0]]],c2,1.8,.55)+wisps(c,['M-39,-60 C-36,-52 -38,-46 -35,-40','M39,-62 C36,-54 38,-48 35,-42'])},
 ear:function(){return E(-42.5,-30,1.8,1.8,'#d6b45a')},
 over:function(){function lock(sg,cx0,w0,len,ph){var cx=function(y){return sg*(cx0+3*Math.sin(y/13+ph))},w=function(y){return y>len-30?Math.max(0,(len+6-y)*.55*w0/6):w0},a=[],b=[],y;
   for(y=-4;y<=len;y+=2){a.push([cx(y)-w(y)/2,y]);b.push([cx(y)+w(y)/2+1.6*Math.sin(y/8+ph),y])}
   var d='M'+a.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+b.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';
   var hl='',k;for(k=0;k<2;k++){var pts=[];for(y=4;y<=len-14;y+=5)pts.push([cx(y)-w0*.22+k*w0*.4+1.4*Math.sin(y/8+ph+k),y]);hl+=L(pts,1.9,c2,' opacity=".6"')}
   return sh(P(d,c)+hl,2)}
  return lock(-1,47,14,92,.5)+lock(1,49,17,108,1.8)}}}
var H13={a:{h:h13a,col:{c:'#34242b',c2:'#5a444e',c3:'#241a20'},top:'#8fb09a',top2:'#6f9380',neck:'round'},
 b:{h:h13b,col:{c:'#40291f',c2:'#6a4838',c3:'#2c1c16'},top:'#b98f8c',top2:'#9b7370',neck:'scoop'},
 c:{h:h13c,col:{c:'#7c4c32',c2:'#a2704a',c3:'#583420'},top:'#d9c795',top2:'#b8a574',neck:'scoop'}};
var F13={
 1:{skin:'#f3dcc8',eye:{lid:2.2,up:1.5,gx:0,iris:'#7690b4',lw:2.1,glint:1},brow:'#34231c',bt:2.2,bl:1.2,br:2.8,nsx:.88,mouth:{sm:1.0,smirk:.9,lip:'#b85a62',lip2:'#a14852',mw:9.2,full:3.0,part:.7}},
 2:{skin:'#f3dcc8',eye:{lid:1.6,up:1.7,gx:0,iris:'#5a9aaa',lw:1.9,glint:1.6},brow:'#5a3826',bt:2.0,bl:.8,br:2.0,nsx:.95,fr:4,mouth:{sm:1.5,smirk:.8,lip:'#c06a68',lip2:'#ab565a',mw:9.0,full:2.8,part:1.3}},
 3:{skin:'#f3dcc8',eye:{lid:2.6,up:1.5,gx:0,iris:'#5a82b6',lw:2.7,glint:1},brow:'#2e2228',bt:2.7,bl:.4,br:2.2,nsx:1,mouth:{sm:1.3,smirk:1.1,lip:'#b4545a',lip2:'#9c4650',mw:9.4,full:2.4,part:.9}}};
var ROT13={'1a':-5,'1b':6,'1c':-7,'2a':6,'2b':-5,'2c':5,'3a':-6,'3b':7,'3c':-5};
function mk13(fi,hk,rot){var F=F13[fi],H=H13[hk],h=H.h(H.col.c,H.col.c2,H.col.c3),r=rot==null?ROT13[fi+hk]:rot;
 return {top:H.top,top2:H.top2,neck:H.neck,rot:r,torso:r>0?TOR_R:TOR_L,skin:F.skin,fabric:ribs(H.top2),eye:F.eye,brow:F.brow,bt:F.bt,bl:F.bl,br:F.br,nsx:F.nsx,fr:F.fr,mouth:F.mouth,
  back:h.back,front:h.front,ear:h.ear,over:h.over,detail:function(){return H.neck==='round'?L([[-25,14],[-12,20],[12,20],[25,14]],2,H.top2,' opacity=".5"'):''}}}
['1','2','3'].forEach(function(fi){['a','b','c'].forEach(function(hk){C['c13_'+fi+hk]=function(full){G.n=1;try{return bust(mk13(fi,hk),full)}finally{G.n=0}}})});
C.c13_ov=function(full){G.n=1;try{return bust(mk13('3','a',0),full)}finally{G.n=0}};
/* ===== ROUND 14: six different skulls, clean skin (no strokes on the face), tilt >=8, no headband ===== */
var G14={sk:SKULL13,ex:40.8,ed:19};
function skullP(p){var t=p.t,w=p.w,wy=p.wy,jw=p.jw,cy=p.cy,cn=p.cn,jy=-6.5,sp=jy-wy;
 function h(sg){return sg}
 var a=[ 'M0,'+t, ' C'+f(w*.55)+','+t+' '+f(w*.975)+','+f(t+(wy-t)*.324)+' '+w+','+wy,
  ' C'+f(w+1)+','+f(wy+sp*.42)+' '+f(jw+(w-jw)*.8)+','+f(jy-sp*.2)+' '+jw+','+jy,
  ' C'+f(jw*.735)+','+f(jy+(cy-jy)*.5)+' '+cn+','+cy+' 0,'+cy].join('');
 var b=' C'+(-cn)+','+cy+' '+f(-jw*.735)+','+f(jy+(cy-jy)*.5)+' '+(-jw)+','+jy
  +' C'+f(-(jw+(w-jw)*.8))+','+f(jy-sp*.2)+' '+f(-(w+1))+','+f(wy+sp*.42)+' '+(-w)+','+wy
  +' C'+f(-w*.975)+','+f(t+(wy-t)*.324)+' '+f(-w*.55)+','+t+' 0,'+t+'Z';
 return a+b}
var SH14={
 1:{n:'узкий овал',t:-96,w:37.5,wy:-56,jw:22,cy:5.5,cn:8,ed:19,ex:38.3},
 2:{n:'сердце, чёткий подбородок',t:-94,w:40,wy:-63,jw:20,cy:7,cn:3.5,ed:19,ex:40.8},
 3:{n:'длинный овал, короткий подбородок',t:-97,w:37,wy:-54,jw:24.5,cy:1.5,cn:11,ed:19,ex:37.8},
 4:{n:'мягкий квадрат, высокие скулы',t:-93,w:41,wy:-52,jw:29,cy:3.5,cn:15,ed:19,ex:41.8},
 5:{n:'узкое, широко посаженные глаза',t:-95,w:36,wy:-58,jw:21.5,cy:5,cn:7.5,ed:20.5,ex:36.8},
 6:{n:'круглое, но стройное',t:-92.5,w:40.5,wy:-50,jw:26,cy:2.5,cn:12.5,ed:19,ex:41.3}};
Object.keys(SH14).forEach(function(k){SH14[k].d=skullP(SH14[k])});
C.SH14=SH14;
function faceW(o){
  var s='',u=uid(),sk=o.skin||'#f3dcc8',ex=G14.ex,SK=G14.sk,ed=G14.ed,q=ex/40.8;
  s+=E(-ex,-44,5.2,8,sk)+E(ex,-44,5.2,8,sk)+E(-ex+.5,-43,2.5,4.4,'#d9b199')+E(ex-.5,-43,2.5,4.4,'#d9b199');
  s+='<defs><clipPath id="'+u+'"><path d="'+SK+'"/></clipPath></defs>'+P(SK,'url(#gSkinR)');
  s+='<g clip-path="url(#'+u+')">'+E(-16*q,-40,18,14,'url(#gLight)',' opacity=".35"')+E(-4,-80,26,12,'url(#gLight)',' opacity=".4"')
   +E(-23*q,-22,9,4,'url(#gBlush2)')+E(23*q,-22,9,4,'url(#gBlush2)')
   +'<g transform="rotate(-14 '+(-24*q)+' -33)">'+E(-24*q,-33,11,5,'url(#gLight)',' opacity=".9"')+'</g>'
   +'<g transform="rotate(14 '+(24*q)+' -33)">'+E(24*q,-33,10,4.4,'url(#gLight)',' opacity=".4"')+'</g>'
   +'<g transform="rotate(-34 '+(-30*q)+' -20)">'+E(-30*q,-20,6,13,'url(#gShade)',' opacity=".5"')+'</g>'
   +'<g transform="rotate(34 '+(30*q)+' -20)">'+E(30*q,-20,6,13,'url(#gShade)',' opacity=".6"')+'</g>'
   +E(0,2.6,6,3,'url(#gLight)',' opacity=".5"')+E(0,-3.5,10,4,'url(#gShade)',' opacity=".35"')+'</g>';
  s+=eyeW(-ed,-45,o.eye)+eyeW(ed,-45,o.eye2||o.eye);
  s+=browW(-ed,o.brow||'#4a3028',o.bl||0,o.bt||2.2,o.bo||0)+browW(ed,o.brow||'#4a3028',o.br||0,o.bt||2.2,0);
  s+='<g transform="translate(0,-28) scale('+(o.nsx||1)+','+(o.nsy||1)+') translate(0,28)"><path d="M3,-42 C5,-36 6,-31 5,-27" stroke="#c9967e" stroke-width="2.4" fill="none" opacity=".16" stroke-linecap="round"/>'+E(0,-28.8,3.2,2,'#fff',' opacity=".42"')+E(-3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+E(3.4,-26,1.4,.9,'#a87464',' opacity=".8"')+'<path d="M-6,-27.6 Q-7.6,-25.2 -5.4,-23.6 M6,-27.6 Q7.6,-25.2 5.4,-23.6" stroke="#c9967e" stroke-width="1" fill="none" opacity=".5"/></g>';
  if(o.fr)s+=freckles(o.fr);
  s+=mouthX(o.mouth||{});
  return s}
var TOR_L='M-12.5,-8 C-24,-2 -42,12 -54,26 C-62,32 -65,40 -64,56 C-64,88 -62,120 -60,172 L60,172 C62,120 64,80 64,46 C65,28 62,18 54,12 C42,2 24,-6 12.5,-8Z';
var TOR_R='M-12.5,-8 C-24,-6 -42,2 -54,12 C-62,18 -65,28 -64,46 C-64,80 -62,120 -60,172 L60,172 C62,120 64,88 64,56 C65,40 62,32 54,26 C42,12 24,-2 12.5,-8Z';
function h14a(c,c2,c3){var h=hHalfUp(c,c2,c3);return {
 back:function(){return sc95(h.back())},
 front:function(){return sc95(h.front())},
 ear:function(){var x=G14.ex+1.4;return E(-x,-37,2.2,2.2,'#d6b45a')+E(x,-37,2.2,2.2,'#d6b45a')}}}
function h14b(c,c2,c3){var b=h13b(c,c2,c3);return {
 back:b.back,
 front:function(){var cap=P('M-14,-109 C-36,-106 -52,-90 -51,-62 C-51,-55 -50,-52 -47,-52 C-45,-58 -43,-68 -35,-78 C-27,-86 -19,-96 -14,-109Z',c);
  var top='M-14,-109 C10,-115 46,-104 50,-68';var y,o2=[],i2=[];
  for(y=-60;y<=60;y+=3){var r=Math.max(0,Math.min(1,(y+60)/50));o2.push([50+5*r+6*r*Math.sin(y/11+.3),y])}
  for(y=60;y>=-26;y-=3){var qq=Math.max(0,(y+26)/86);i2.push([42+4*qq*Math.sin(y/11+.9)+2*qq,y])}
  var rp=top+' L'+o2.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+i2.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' C41,-44 38,-60 30,-68 C22,-76 6,-82 -4,-84 C-10,-86 -13,-96 -14,-109Z';
  var wl=[];[0,1].forEach(function(k){var pts=[];for(y=-14;y<=56;y+=4)pts.push([47+k*4+2*Math.sin(y/11+.4+k*.5),y]);wl.push(pts)});
  return sc95(cap+P(rp,c)+sweepLines([[[-14,-106],[-8,-90]],[[-8,-108],[20,-104],[44,-84]],[[-44,-80],[-30,-92]]].concat(wl),c2,2.2,.5))},
 ear:function(){return hoop(-G14.ex,-31.5,4.6,1.4,'#d6b45a')},
 over:b.over}}
function h14c(c,c2,c3){var b=h13c(c,c2,c3);return {
 back:function(){return P('M-45,-62 C-48,-100 -26,-102 0,-102 C26,-102 48,-100 45,-62 C49,-38 56,-14 56,10 C60,28 56,48 62,62 L-62,62 C-56,48 -60,28 -56,10 C-56,-14 -49,-38 -45,-62Z',c3)},
 front:function(){return P('M-10,-100 C-34,-98 -46,-84 -45,-58 C-45,-40 -44,-20 -43,0 C-41,6 -43,14 -41,20 C-38,8 -38,-8 -38,-24 C-38,-44 -34,-62 -26,-74 C-20,-82 -12,-90 -10,-100Z',c)
   +P('M-10,-100 C14,-106 44,-94 46,-62 C47,-40 46,-20 44,0 C43,8 45,14 43,20 C40,8 40,-8 39,-24 C38,-42 34,-56 26,-66 C16,-76 2,-80 -6,-84 C-9,-88 -10,-94 -10,-100Z',c)
   +sweepLines([[[-10,-98],[16,-102],[38,-88]],[[-42,-50],[-43,-20],[-42,10]],[[43,-50],[44,-20],[43,10]]],c2,2,.5)},
 ear:function(){return E(-(G14.ex+1.4),-32,1.8,1.8,'#d6b45a')},
 over:function(){function lock(sg,cx0,w0,len,ph){var cx=function(y){return sg*(cx0+3*Math.sin(y/13+ph))},w=function(y){var t=Math.min(1,Math.max(0,(len+2-y)/34));return w0*Math.sqrt(t)},a=[],bb=[],y;
   for(y=-4;y<=len;y+=2){a.push([cx(y)-w(y)/2,y]);bb.push([cx(y)+w(y)/2+1.6*Math.sin(y/8+ph),y])}
   var d='M'+a.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+' L'+bb.reverse().map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z';
   var hl='',k;for(k=0;k<2;k++){var pts=[];for(y=4;y<=len-24;y+=5)pts.push([cx(y)-w0*.22+k*w0*.4+1.4*Math.sin(y/8+ph+k),y]);hl+=L(pts,1.9,c2,' opacity=".5"')}
   return sh(P(d,c)+hl,2)}
  return lock(-1,47,14,92,.5)+lock(1,49,17,108,1.8)}}}
var H14={a:{h:h14a,col:{c:'#34242b',c2:'#5a444e',c3:'#241a20'},top:'#8fb09a',top2:'#6f9380',neck:'round'},
 b:{h:h14b,col:{c:'#40291f',c2:'#6a4838',c3:'#2c1c16'},top:'#b98f8c',top2:'#9b7370',neck:'scoop'},
 c:{h:h14c,col:{c:'#7c4c32',c2:'#a2704a',c3:'#583420'},top:'#d9c795',top2:'#b8a574',neck:'scoop'}};
var F14={
 1:{iris:'#7690b4',brow:'#34231c',bt:2.0,bl:1.6,br:2.6,nsx:.86,lip:['#b85a62','#a14852'],mw:9,full:3.0},
 2:{iris:'#5a84bc',brow:'#3a2a22',bt:2.2,bl:1.4,br:2.4,nsx:.9,lip:['#bc5e66','#a54c56'],mw:9.6,full:3.4},
 3:{iris:'#6f94b8',brow:'#2e2228',bt:2.4,bl:.8,br:1.8,nsx:.95,lip:['#b4545a','#9c4650'],mw:9.4,full:2.6},
 4:{iris:'#5a7fae',brow:'#2e2228',bt:2.9,bl:.2,br:1.4,nsx:1.05,lip:['#b05458','#984650'],mw:10,full:2.8},
 5:{iris:'#8aa0bc',brow:'#4a3228',bt:1.9,bl:1.0,br:2.2,nsx:.84,lip:['#c0646a','#aa525a'],mw:8.8,full:2.6},
 6:{iris:'#5f90c0',brow:'#5a3826',bt:2.1,bl:.9,br:2.0,nsx:.95,fr:3,lip:['#c0646a','#ab565a'],mw:9.4,full:3.0}};
function mk14(si,hk,rot){var F=F14[si],H=H14[hk],h=H.h(H.col.c,H.col.c2,H.col.c3);
 return {top:H.top,top2:H.top2,neck:H.neck,rot:rot,torso:rot>0?TOR_R:TOR_L,skin:'#f3dcc8',fabric:ribs(H.top2),
  eye:{lid:2.3,up:1.5,gx:0,iris:F.iris,lw:2.2,glint:1.2},brow:F.brow,bt:F.bt,bl:F.bl,br:F.br,nsx:F.nsx,fr:F.fr,
  mouth:{sm:1.5,smirk:1.7,lip:F.lip[0],lip2:F.lip[1],mw:F.mw,full:F.full,part:.9},
  back:h.back,front:h.front,ear:h.ear,over:h.over,detail:function(){return H.neck==='round'?L([[-25,14],[-12,20],[12,20],[25,14]],2,H.top2,' opacity=".5"'):''}}}
var PL14=[[1,'a',-9],[2,'b',9],[3,'c',-10],[4,'a',9],[5,'b',-8],[6,'a',10]];
PL14.forEach(function(p,i){C['c14_'+(i+1)]=function(full){var S=SH14[p[0]];G14={sk:S.d,ex:S.ex,ed:S.ed};G.n=1;try{return bust(mk14(p[0],p[1],p[2]),full)}finally{G.n=0}}});
/* ===== ROUND 15: face 1 and face 6, youth (20-25) refinements ===== */
var G15={es:1,cu:0};
function eyeS(cx,ey,o,s){return '<g transform="translate('+cx+','+ey+') scale('+s+') translate('+(-cx)+','+(-ey)+')">'+eyeW(cx,ey,o)+'</g>'}
function faceW(o){
  var s='',u=uid(),sk=o.skin||'#f3dcc8',ex=G14.ex,SK=G14.sk,ed=G14.ed,q=ex/40.8,cu=G15.cu,es=G15.es;
  s+=E(-ex,-44,5.2,8,sk)+E(ex,-44,5.2,8,sk)+E(-ex+.5,-43,2.5,4.4,'#d9b199')+E(ex-.5,-43,2.5,4.4,'#d9b199');
  s+='<defs><clipPath id="'+u+'"><path d="'+SK+'"/></clipPath></defs>'+P(SK,'url(#gSkinR)');
  s+='<g clip-path="url(#'+u+')">'+E(-16*q,-40,18,14,'url(#gLight)',' opacity=".35"')+E(-4,-80,26,12,'url(#gLight)',' opacity=".4"')
   +E(-23*q,-22,9,4,'url(#gBlush2)')+E(23*q,-22,9,4,'url(#gBlush2)')
   +'<g transform="rotate(-14 '+(-24*q)+' '+(-33-cu)+')">'+E(-24*q,-33-cu,11,5.5,'url(#gLight)',' opacity="1"')+'</g>'
   +'<g transform="rotate(14 '+(24*q)+' '+(-33-cu)+')">'+E(24*q,-33-cu,10,4.8,'url(#gLight)',' opacity=".5"')+'</g>'
   +'<g transform="rotate(-34 '+(-30*q)+' '+(-20-cu)+')">'+E(-30*q,-20-cu,6,13,'url(#gShade)',' opacity=".5"')+'</g>'
   +'<g transform="rotate(34 '+(30*q)+' '+(-20-cu)+')">'+E(30*q,-20-cu,6,13,'url(#gShade)',' opacity=".6"')+'</g>'
   +E(0,2.6,6,3,'url(#gLight)',' opacity=".5"')+E(0,-3.5,10,4,'url(#gShade)',' opacity=".3"')+'</g>';
  s+=eyeS(-ed,-45,o.eye,es)+eyeS(ed,-45,o.eye2||o.eye,es);
  s+=browW(-ed,o.brow||'#4a3028',o.bl||0,o.bt||2.2,o.bo||0)+browW(ed,o.brow||'#4a3028',o.br||0,o.bt||2.2,0);
  s+='<g transform="translate(0,-28) scale('+(o.nsx||1)+','+(o.nsy||1)+') translate(0,28)"><path d="M3,-42 C5,-36 6,-31 5,-27" stroke="#c9967e" stroke-width="2.2" fill="none" opacity=".12" stroke-linecap="round"/>'+E(0,-28.8,3.2,2,'#fff',' opacity=".42"')+E(-3.2,-26,1.2,.8,'#a87464',' opacity=".75"')+E(3.2,-26,1.2,.8,'#a87464',' opacity=".75"')+'</g>';
  if(o.fr)s+=freckles(o.fr);
  s+=mouthX(o.mouth||{});
  return s}
var VAR15={
 b:{es:1.14,cu:0,eye:{lid:1.5,up:1.8,gx:0,lw:1.9,glint:1.7},bt:1.7,brAdd:1.2,nsx:.86,nsy:.9,full:3.0,smirk:.8,lipHot:0},
 l:{es:1.06,cu:3,eye:{lid:1.9,up:1.6,gx:0,lw:2.0,glint:1.4},bt:1.9,brAdd:.6,nsx:.8,nsy:.82,full:3.6,smirk:.9,lipHot:1},
 w:{es:1.12,cu:3,eye:{lid:1.6,up:1.8,gx:0,lw:1.9,glint:1.7},bt:1.7,brAdd:1.2,nsx:.82,nsy:.84,full:3.4,smirk:.8,lipHot:1}};
var BASE15={1:{sh:1,iris:'#6f9ad0',brow:'#4a3228',lip:['#c4585f','#ac4750'],mw:8.8,fr:0},6:{sh:6,iris:'#5f9ad6',brow:'#6a4632',lip:['#c85c64','#b24c56'],mw:9.2,fr:3}};
function mk15(face,hk,vk,rot){var B=BASE15[face],V=VAR15[vk],H=H14[hk],h=H.h(H.col.c,H.col.c2,H.col.c3),S=SH14[B.sh];
 G14={sk:S.d,ex:S.ex,ed:S.ed};G15={es:V.es,cu:V.cu};
 var eye=mix(V.eye,{iris:B.iris});
 return {top:H.top,top2:H.top2,neck:H.neck,rot:rot,torso:rot>0?TOR_R:TOR_L,skin:'#f6e0cc',fabric:ribs(H.top2),
  eye:eye,brow:B.brow,bt:V.bt,bl:F14[B.sh].bl+V.brAdd,br:F14[B.sh].br+V.brAdd,nsx:V.nsx,nsy:V.nsy,fr:B.fr||undefined,
  mouth:{sm:1.6,smirk:V.smirk,lip:B.lip[0],lip2:B.lip[1],mw:B.mw,full:V.full,part:.9},
  back:h.back,front:h.front,ear:h.ear,over:h.over,detail:function(){return H.neck==='round'?L([[-25,14],[-12,20],[12,20],[25,14]],2,H.top2,' opacity=".5"'):''}}}
var PL15=[[1,'a','b',-9],[1,'a','l',9],[1,'b','w',-9],[6,'a','b',9],[6,'a','l',-9],[6,'b','w',9]];
PL15.forEach(function(p,i){C['c15_'+(i+1)]=function(full){G.n=1;try{var o=mk15(p[0],p[1],p[2],p[3]);return bust(o,full)}finally{G.n=0;G15={es:1,cu:0}}}});
/* ===== ROUND 16: friend, slightly gothic, six options ===== */
var SD16=GEO.skull(FSK.a),HR16=GEO.hair(SD16,2.4,3.4);
C.defs16='<defs><radialGradient id="gSmudge"><stop offset="0" stop-color="#3a2a48" stop-opacity=".3"/><stop offset=".6" stop-color="#3a2a48" stop-opacity=".16"/><stop offset="1" stop-color="#3a2a48" stop-opacity="0"/></radialGradient></defs>';
var HC16={c:'#1f1b2a',c2:'#3a3050',c3:'#15121e',vio:'#6a3f9a'};
var SILV='#cfd3de';
function back16(Y,w,y2){var H=HR16,bk=H.back,r=H.OB[H.ib],l=H.OB[H.n-H.ib],cut=bk.indexOf(' C'+GEO.f1(r[0]+4)+',-4'),pre=bk.slice(0,cut),f1=GEO.f1;
 y2=y2==null?Math.min(2,Y-12):y2;
 return pre+' C'+f1(r[0]+2)+',-12 '+w+','+y2+' '+w+','+(Y-8)+' Q'+w+','+Y+' '+(w-8)+','+Y+' L'+(-(w-8))+','+Y+' Q'+(-w)+','+Y+' '+(-w)+','+(Y-8)+' C'+(-w)+','+y2+' '+f1(l[0]-2)+',-12 '+f1(l[0])+','+f1(l[1])+'Z'}
var FR16={full:'36,-70.5 30,-71 Q0,-67.2 -30,-71 C-36,-70.5',micro:'36,-79 30,-80 Q0,-77.5 -30,-80 C-36,-79',side:'36,-72 22,-88 Q2,-92 -30,-71 C-36,-70.5',back:'36,-76 28,-82 Q0,-86 -28,-82 C-36,-76'};
function front16(kind,short){var s=HR16.front.replace(FR16.full,FR16[kind]);if(short)s=s.replace(/,18(?![\d.])/g,',-4');return s}
function streak16(side){var x=side*44.8;return P('M'+x+',-60 C'+(x+side*1)+',-36 '+(x+side*1)+',-10 '+x+',12 L'+(x-side*3)+',12 C'+(x-side*2.4)+',-10 '+(x-side*2.4)+',-36 '+(x-side*3)+',-58Z',HC16.vio,' opacity=".92"')}
function smudge16(){return E(-19,-40.6,10,3,'url(#gSmudge)')+E(19,-40.6,10,3,'url(#gSmudge)')}
function ear16(kind){var x=G14.ex;function hp(r){return hoop(-x-.5,-34,r,2.2,SILV)+hoop(x+.5,-34,r,2.2,SILV)}
 function stud(){return E(-x-.5,-36,2,2,SILV)+E(x+.5,-36,2,2,SILV)}
 function cuff(){return '<path d="M'+(-x-4)+',-52 Q'+(-x-8)+',-46 '+(-x-4.5)+',-40" fill="none" stroke="'+SILV+'" stroke-width="1.7" stroke-linecap="round"/><path d="M'+(x+4)+',-52 Q'+(x+8)+',-46 '+(x+4.5)+',-40" fill="none" stroke="'+SILV+'" stroke-width="1.7" stroke-linecap="round"/>'}
 return kind==='none'?'':kind==='h9'?hp(7):kind==='h6'?hp(5):kind==='h12'?hp(9):kind==='sc'?stud()+cuff():kind==='c'?cuff()+hp(5):stud()}
var TOR_B_L='M-12.5,-8 C-26,-4 -48,6 -62,22 C-72,28 -75,38 -74,56 C-74,88 -72,120 -70,172 L70,172 C72,120 74,84 74,50 C75,30 72,18 62,12 C48,0 26,-6 12.5,-8Z';
var TOR_B_R='M-12.5,-8 C-26,-6 -48,0 -62,12 C-72,18 -75,30 -74,50 C-74,84 -72,120 -70,172 L70,172 C72,120 74,88 74,56 C75,38 72,28 62,22 C48,6 26,-4 12.5,-8Z';
function over16(kind){
 if(kind==='pony')return function(){var tail='M-30,-8 C-42,-4 -50,20 -52,52 C-54,92 -50,118 -44,136 C-36,144 -28,140 -26,130 C-30,106 -28,76 -24,46 C-22,28 -20,10 -16,-2Z';
  return sh(P(tail,HC16.c)+sweepLines([[[-38,10],[-42,50],[-40,100],[-36,130]]],HC16.c2,2,.55)+P('M-36,-9 C-30,-12 -18,-8 -14,-2 L-18,6 C-24,2 -32,0 -38,2Z','#2a2236'),2)};
 return null}
function mk16(v){
 var Hc=HC16,eyeC={1:'#6a4632',2:'#6f9a78',3:'#8d9bac',4:'#6a4632',5:'#6f9a78',6:'#8d9bac'}[v.n];
 var back,front,over=null,bunx='';
 var cfg={1:['side',0,22,53,0],2:['full',0,22,53,0],3:['full',0,66,57,0],4:['back',0,2,46,1],5:['micro',1,-2,49,0],6:['back',0,4,46,2]}[v.n];
 back=function(){var b=P(back16(cfg[2],cfg[3]),Hc.c3);if(cfg[4]===2)b+=sh(E(0,-108,15,12,Hc.c)+E(-5,-112,6,2.6,Hc.c2,' opacity=".55"')+E(0,-97,10,3,Hc.c3,' opacity=".6"'),2);return b};
 front=function(){var s=P(front16(cfg[0],cfg[1]),Hc.c)+sweepLines(cfg[0]==='side'?[[[-6,-94],[16,-95],[32,-86]]]:cfg[0]==='full'?[[[-26,-92],[-4,-95]],[[-34,-80],[-4,-77],[30,-82]]]:[[[-26,-93],[-4,-96],[24,-94]]],Hc.c2,2.2,.45);
  if(v.streak)s+=streak16(v.streak);return s+smudge16()};
 if(cfg[4]===1)over=over16('pony');
 var tee=v.tee||'#1b1a21';
 return {lift:27,top:'#3a3a46',top2:'#2a2a34',neck:'vw',rot:v.rot,torso:v.rot>0?TOR_B_R:TOR_B_L,skin:'#ecd2bc',
  back:back,front:front,ear:function(){return ear16(v.ear)},over:over,
  eye:{lid:v.lid,up:.4,gx:v.gx||0,iris:eyeC,lw:2,bag:1},brow:'#1e1a22',bt:3.2,bl:v.bl,br:v.br,bo:0,nsx:1,
  mouth:{sm:v.sm,smirk:v.smirk,lip:v.lip[0],lip2:v.lip[1],mw:8.8,full:v.full||2.6,part:0},
  detail:function(){var lap='#4a4a58',s=sh(P('M-14.5,-8 L-44,-4 L-56,42 L-10,78 L-4,50 L-29,16 Q-22,6 -14.5,-8Z',lap)+P('M14.5,-8 L44,-4 L56,42 L10,78 L4,50 L29,16 Q22,6 14.5,-8Z',lap),1);
   s+=L([[0,40],[0,172]],1.6,'#22222a',' opacity=".7"')+E(0,92,3.2,3.2,'#1c1c24')+E(0,122,3.2,3.2,'#1c1c24');
   if(v.choker)s+=P('M-12,-18 Q0,-13 12,-18 L12,-14 Q0,-9 -12,-14Z','#16141b');
   if(v.pend)s+='<path d="M-11,-12 Q-9,18 0,27 Q9,18 11,-12" fill="none" stroke="#b8bdcb" stroke-width=".9"/>'+E(0,29,2.2,3.2,SILV)+E(-.5,28,.7,1,'#fff',' opacity=".8"');
   return s},
  under:function(){return P('M-24,10 Q0,24 24,10 L29,16 Q10,30 0,38 Q-10,30 -29,16Z',tee)+(v.print?E(0,27,4,3.2,'#b9aed0',' opacity=".75"')+L([[-3,25],[3,25]],.9,tee):'')}}}
var V16=[
 {n:1,rot:-5,lid:3.4,bl:-1,br:.6,sm:.2,smirk:0,lip:['#7a2f4f','#64243f'],ear:'h9',streak:1,choker:1,pend:1},
 {n:2,rot:5,lid:3.6,bl:-1,br:.2,sm:.1,smirk:1.8,lip:['#5e2a52','#4c2042'],ear:'sc',choker:1,print:1},
 {n:3,rot:-4,lid:2.6,bl:4.4,br:-.6,sm:.2,smirk:.6,lip:['#7a2f4f','#64243f'],ear:'h6',streak:-1,pend:1},
 {n:4,rot:5,lid:3.6,bl:-1,br:.2,sm:0,smirk:1.8,lip:['#5e2a52','#4c2042'],ear:'c',choker:1,print:1},
 {n:5,rot:-6,lid:3.3,bl:-1,br:.4,sm:.1,smirk:0,lip:['#7a2f4f','#64243f'],ear:'stud',choker:1,pend:1},
 {n:6,rot:4,lid:2.8,bl:-.6,br:4.2,gx:2.6,sm:.2,smirk:.7,lip:['#5e2a52','#4c2042'],ear:'h12',streak:1,print:1}];
V16.forEach(function(v,i){C['c16_'+(i+1)]=function(full){G14={sk:SD16,ex:43.5,ed:19};G15={es:1,cu:0};G.n=1;try{return bust(mk16(v),full)}finally{G.n=0}}});
/* ===== ROUND 17: tired deadpan friend, less glamorous ===== */
C.defs17='<defs><linearGradient id="gSkinR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e8df"/><stop offset=".55" stop-color="#eedbd0"/><stop offset="1" stop-color="#dfc5b8"/></linearGradient><radialGradient id="gBlushP"><stop offset="0" stop-color="#e4767e" stop-opacity=".3"/><stop offset=".6" stop-color="#e4767e" stop-opacity=".1"/><stop offset="1" stop-color="#e4767e" stop-opacity="0"/></radialGradient></defs>';
var HK='#17141d',HK2='#34303f',HK3='#100d15';
var TOR_S='M-12.5,-8 C-24,-2 -44,12 -58,30 C-64,36 -66,46 -64,60 C-64,92 -62,122 -60,172 L60,172 C62,122 64,92 64,60 C66,46 64,36 58,30 C44,12 24,-2 12.5,-8Z';
var TOR_SB='M-12.5,-8 C-26,-2 -48,12 -64,32 C-72,38 -74,48 -72,64 C-72,94 -70,124 -68,172 L68,172 C70,124 72,94 72,64 C74,48 72,38 64,32 C48,12 26,-2 12.5,-8Z';
function flip17(sg){/* flipped lock outside the skull, behind the head */var x=sg*50;return sh(P('M'+x+',-2 C'+(sg*60)+',2 '+(sg*68)+',10 '+(sg*66)+',20 C'+(sg*64)+',26 '+(sg*58)+',26 '+(sg*57)+',21 C'+(sg*61)+',20 '+(sg*61)+',12 '+(sg*50)+',10Z',HK)+L([[sg*55,4],[sg*62,12],[sg*61,20]],1.6,HK2,' opacity=".6"'),1)}
function bun17(){return sh(E(34,8,12,10,HK)+E(42,3,7,6.5,HK)+E(28,14,7,6,HK)+L([[26,4],[36,0],[46,4]],1.6,HK2,' opacity=".6"')+L([[30,16],[40,10]],1.4,HK2,' opacity=".5"')+'<path d="M24,10 C34,16 44,12 50,6" fill="none" stroke="#2a2434" stroke-width="3" stroke-linecap="round"/>',2)}
function blush17(){return E(-21,-23,13,7.5,'url(#gBlushP)')+E(21,-23,13,7.5,'url(#gBlushP)')+E(0,-26.6,5.2,3.4,'url(#gBlushP)')}
function smudge17(){return E(-19,-40.4,10,3,'url(#gSmudge)',' opacity=".7"')+E(19,-40.4,10,3,'url(#gSmudge)',' opacity=".7"')}
function mk17(v){
 var cfg={1:['full',0,20,52,'flip'],2:['full',0,18,53,''],3:['side',1,-2,49,'flick'],4:['full',0,66,57,''],5:['back',0,4,46,'bun'],6:['micro',0,20,52,'']}[v.n];
 var eyeC={1:'#4a3026',2:'#8d99a8',3:'#6f9a78',4:'#4a3026',5:'#8d99a8',6:'#4a3026'}[v.n];
 var tee=v.tee,top=tee?'#25222c':'#3a3945',top2=tee?'#1c1a22':'#2b2a34';
 var back=function(){var b=P(back16(cfg[2],cfg[3]),HK3);if(cfg[4]==='flip')b+=flip17(-1);if(cfg[4]==='flick')b+=flip17(1);if(cfg[4]==='bun')b+=bun17();return b};
 var front=function(){var s=P(front16(cfg[0],cfg[1]),HK)+sweepLines(cfg[0]==='side'?[[[-6,-94],[16,-95],[32,-86]]]:cfg[0]==='full'?[[[-26,-92],[-4,-95]],[[-34,-80],[-4,-77],[30,-82]]]:[[[-26,-93],[-4,-96],[24,-94]]],HK2,2.2,.4);return s+blush17()+smudge17()};
 var gx=v.gx;
 return {lift:25,top:top,top2:top2,neck:tee?'round':'vw',rot:v.rot,torso:tee?TOR_S:TOR_SB,skin:'#ecd9cf',
  back:back,front:front,ear:function(){return ear16(v.ear)},
  eye:{lid:v.lid,up:0,gx:gx,iris:eyeC,lw:2.6,bag:1,glint:0},eye2:{lid:v.lid+v.l2,up:0,gx:gx,iris:eyeC,lw:2.6,bag:1,glint:0},
  brow:'#14101a',bt:4.3,bl:v.bl,br:v.br,bo:0,nsx:1,nsy:1,
  mouth:{sm:0,smirk:v.smirk,lip:v.lip[0],lip2:v.lip[1],mw:7.2,full:1.6,part:0},
  detail:function(){var s='';
   if(!tee){var lap='#44434f';s+=sh(P('M-14.5,-8 L-40,-2 Q-52,36 -34,62 L-8,64 L-4,46 L-29,16 Q-22,6 -14.5,-8Z',lap)+P('M14.5,-8 L40,-2 Q52,36 34,62 L8,64 L4,46 L29,16 Q22,6 14.5,-8Z',lap),1)+E(0,96,3.6,3.6,'#1f1e27')}
   else{s+='<path d="M-25,13 C-12,24 12,24 25,13" fill="none" stroke="#38343f" stroke-width="3.6" stroke-linecap="round"/>';
    if(v.xx)s+=L([[27,40],[34,47]],1.9,'#6a6478')+L([[34,40],[27,47]],1.9,'#6a6478')+L([[38,41],[45,48]],1.9,'#6a6478')+L([[45,41],[38,48]],1.9,'#6a6478')}
   s+=P('M-12,-17 Q0,-12 12,-17 L12,-13.4 Q0,-8.4 -12,-13.4Z','#14111a')+sh(E(0,-7.4,3.8,3.8,'#14111a')+E(0,-7.4,2.5,2.5,'none',' stroke="#8d8aa0" stroke-width=".8"'),1);
   return s},
  under:function(){return tee?'':P('M-24,10 Q0,24 24,10 L29,16 Q10,30 0,38 Q-10,30 -29,16Z','#1e1c24')}}}
var V17=[
 {n:1,rot:-3,lid:4.4,l2:.7,gx:3.4,bl:3.2,br:-1.2,smirk:.5,lip:['#b98080','#a06a6e'],ear:'stud',tee:1,xx:1},
 {n:2,rot:3,lid:4.2,l2:.8,gx:-3.2,bl:-1,br:3.6,smirk:1.0,lip:['#7e5068','#6a4058'],ear:'none'},
 {n:3,rot:-4,lid:4.4,l2:.6,gx:3.0,bl:3.4,br:-1,smirk:.7,lip:['#b98080','#a06a6e'],ear:'h5',tee:1},
 {n:4,rot:3,lid:4.6,l2:.8,gx:0,bl:-1,br:3.4,smirk:.6,lip:['#7e5068','#6a4058'],ear:'stud'},
 {n:5,rot:4,lid:4.3,l2:.7,gx:-3.4,bl:-1,br:3.4,smirk:.9,lip:['#b98080','#a06a6e'],ear:'none',tee:1,xx:1},
 {n:6,rot:-3,lid:4.2,l2:.9,gx:3.0,bl:3.2,br:-1,smirk:.6,lip:['#7e5068','#6a4058'],ear:'h5'}];
V17.forEach(function(v,i){C['c17_'+(i+1)]=function(full){G14={sk:SD16,ex:43.5,ed:19};G15={es:1.05,cu:0};G.n=1;try{return bust(mk17(v),full)}finally{G.n=0;G15={es:1,cu:0}}}});
function browW(cx,col,a,th,out){var sg=cx<0?-1:1,x1=cx-sg*11,x2=cx+sg*15,t=th||2;out=(out||0)+(G15.ang||0);return P('M'+x1+','+f(-59.5-a*.3)+' Q'+f(cx+sg*1)+','+f(-67-a)+' '+x2+','+f(-57.5-out)+' Q'+f(cx+sg*2)+','+f(-62.6-a)+' '+x1+','+f(-59.5+t-a*.3)+'Z',col)}
/* ===== ROUND 18: friend = variant 2 + tee, narrower face options, neck-fitted choker ===== */
function back18(H,Y,w){var bk=H.back,r=H.OB[H.ib],l=H.OB[H.n-H.ib],f1=GEO.f1,cut=bk.indexOf(' C'+f1(r[0]+4)+',-4'),pre=bk.slice(0,cut),y2=Math.min(2,Y-12);
 return pre+' C'+f1(r[0]+2)+',-12 '+w+','+y2+' '+w+','+(Y-8)+' Q'+w+','+Y+' '+(w-8)+','+Y+' L'+(-(w-8))+','+Y+' Q'+(-w)+','+Y+' '+(-w)+','+(Y-8)+' C'+(-w)+','+y2+' '+f1(l[0]-2)+',-12 '+f1(l[0])+','+f1(l[1])+'Z'}
function front18(H,k){var rep=[36*k,-70.5,30*k,-71].map(function(n){return GEO.f1(n)});
 return H.front.replace('36,-70.5 30,-71 Q0,-67.2 -30,-71 C-36,-70.5',GEO.f1(36*k)+',-70.5 '+GEO.f1(30*k)+',-71 Q0,-67.2 '+GEO.f1(-30*k)+',-71 C'+GEO.f1(-36*k)+',-70.5')}
function blush18(w,fs){var x=w-14;return E(-x,-26,7*fs,4.4*fs,'url(#gBlushP)')+E(x,-26,7*fs,4.4*fs,'url(#gBlushP)')+E(0,-26.8,4.8*fs,3.2*fs,'url(#gBlushP)')}
function mk18(v,H){var k=v.w/44,tee='#25222c';
 var back=function(){return P(back18(H,18,v.w+9),HK3)};
 var front=function(){return P(front18(H,k),HK)+sweepLines([[[-24*k,-92],[-4,-95]],[[-34*k,-80],[-4,-77],[30*k,-82]]],HK2,2.2,.4)+blush18(v.w,v.fs)};
 var ey={lid:v.lid,up:0,gx:v.gx,iris:'#2b1b15',lw:2.4,bag:1,glint:.3},ey2={lid:v.lid+.8,up:0,gx:v.gx,iris:'#2b1b15',lw:2.4,bag:1,glint:.3};
 return {lift:25,top:'#25222c',top2:'#1c1a22',neck:'round',rot:3,torso:TOR_S,skin:'#ecd9cf',back:back,front:front,ear:function(){return ear16('stud')},
  eye:ey,eye2:ey2,brow:'#14101a',bt:4.3,bl:-.6,br:-3.2,bo:0,nsx:1,nsy:1,
  mouth:{sm:-.4,smirk:.9,lip:'#7e5068',lip2:'#6a4058',mw:7.2,full:1.6,part:0},
  detail:function(){var u=uid(),s='<path d="M-25,13 C-12,24 12,24 25,13" fill="none" stroke="#38343f" stroke-width="3.6" stroke-linecap="round"/>';
   s+=L([[27,40],[34,47]],1.9,'#6a6478')+L([[34,40],[27,47]],1.9,'#6a6478')+L([[38,41],[45,48]],1.9,'#6a6478')+L([[45,41],[38,48]],1.9,'#6a6478');
   s+='<defs><clipPath id="'+u+'"><path d="'+NK.round+'"/></clipPath></defs><g clip-path="url(#'+u+')">'+E(0,-10,15,2.6,'#6a4a50',' opacity=".18"')+P('M-16,-19 Q0,-12.5 16,-19 L16,-14.6 Q0,-8 -16,-14.6Z','#14111a')+'</g>';
   s+=sh(E(0,-6.6,3.6,3.6,'#14111a')+E(0,-6.6,2.4,2.4,'none',' stroke="#8d8aa0" stroke-width=".8"'),1);return s},
  under:function(){return ''}}}
var V18=[
 {w:38,t:-91,c:3.5,jx:17,jy:.5,ed:18.5,es:1.22,fs:.9,lid:4.7,gx:-3.2,n:'76'},
 {w:36,t:-90,c:3,jx:16,jy:.5,ed:18,es:1.24,fs:.8,lid:4.7,gx:-3.2,n:'72'},
 {w:34,t:-89,c:2.5,jx:15,jy:.5,ed:17.5,es:1.26,fs:.75,lid:4.7,gx:-3.2,n:'68'},
 {w:36,t:-90,c:4,jx:19,jy:2.5,ed:18,es:1.24,fs:.8,lid:4.7,gx:-3.2,n:'72 мягкая'},
 {w:36,t:-90,c:8,jx:12,jy:-1.5,ed:18,es:1.24,fs:.8,lid:4.7,gx:-3.2,n:'72 острый'},
 {w:35,t:-90,c:6,jx:14,jy:0,ed:17.8,es:1.28,fs:.6,lid:4.7,gx:0,n:'70'}];
C.SD18=V18.map(function(v){return GEO.skull({w:v.w,t:v.t,c:v.c,jx:v.jx,jy:v.jy})});
V18.forEach(function(v,i){C['c18_'+(i+1)]=function(full){var sd=C.SD18[i],H=GEO.hair(sd,2.4,3.4);G14={sk:sd,ex:v.w-.5,ed:v.ed};G15={es:v.es,cu:0,ang:1.6};G.n=1;try{return bust(mk18(v,H),full)}finally{G.n=0;G15={es:1,cu:0}}}});
/* ===== ROUND 19: symmetric hair curtains (no diagonal edge on the jaw), smaller eyes, widths 76/72 ===== */
function front19(H,k){var SP=H.SP,n=SP.length,f1=GEO.f1,IN=GEO.offs(SP,-3.2),OF=H.OF,ir=0,i62=0,i,out=[];
 while(SP[ir][1]<-10)ir++;while(SP[i62][1]<-62)i62++;
 for(i=n-ir;i<n;i++)out.push(OF[i]);for(i=0;i<=ir;i++)out.push(OF[i]);
 var tx=OF[ir][0]+2.2,ix=IN[ir][0];
 var R=[[tx,18],[ix,18],[ix,-10]],Rin=[];for(i=ir;i>=i62;i--)Rin.push(IN[i]);
 var d=GEO.path(out)+' L'+f1(tx)+',18 L'+f1(ix)+',18 L'+f1(ix)+',-10';
 for(i=0;i<Rin.length;i++)d+=' L'+f1(Rin[i][0])+','+f1(Rin[i][1]);
 var ex=IN[i62][0],ey=IN[i62][1];
 d+=' C'+f1(ex-1.5)+',-67 '+f1(36*k)+',-70.5 '+f1(30*k)+',-71 Q0,-67.2 '+f1(-30*k)+',-71 C'+f1(-36*k)+',-70.5 '+f1(-ex+1.5)+',-67 '+f1(-ex)+','+f1(ey);
 for(i=Rin.length-1;i>=0;i--)d+=' L'+f1(-Rin[i][0])+','+f1(Rin[i][1]);
 d+=' L'+f1(-ix)+',-10 L'+f1(-ix)+',18 L'+f1(-tx)+',18Z';
 return d}
function mk19(v,H){var k=v.w/44;
 var back=function(){return P(back18(H,18,v.w+9),HK3)};
 var front=function(){return P(front19(H,k),HK)+sweepLines([[[-24*k,-92],[-4,-95]],[[-34*k,-80],[-4,-77],[30*k,-82]]],HK2,2.2,.4)+blush18(v.w,v.fs)};
 var ey={lid:v.lid,up:0,gx:v.gx,iris:'#2b1b15',lw:2.4,bag:1,glint:.3},ey2={lid:v.lid+.8,up:0,gx:v.gx,iris:'#2b1b15',lw:2.4,bag:1,glint:.3};
 var o=mk18(v,H);o.back=back;o.front=front;o.eye=ey;o.eye2=ey2;
 o.mouth={sm:v.sm,smirk:v.sk,lip:'#7e5068',lip2:'#6a4058',mw:7.2,full:1.6,part:0};return o}
var V19=[
 {w:38,t:-91,c:4,jx:19,jy:2,ed:18.5,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:38,t:-91,c:6.5,jx:15.5,jy:0,ed:18.5,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:38,t:-91,c:3.5,jx:17,jy:.5,ed:18.5,es:1.06,fs:.45,lid:4.6,gx:-3,sm:-.8,sk:1.3},
 {w:36,t:-90,c:4,jx:19,jy:2.5,ed:18,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:36,t:-90,c:6.5,jx:14.5,jy:0,ed:18,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:36,t:-90,c:3,jx:16,jy:.5,ed:18,es:1.06,fs:.45,lid:4.6,gx:-3,sm:-.8,sk:1.3}];
C.SD19=V19.map(function(v){return GEO.skull({w:v.w,t:v.t,c:v.c,jx:v.jx,jy:v.jy})});
V19.forEach(function(v,i){C['c19_'+(i+1)]=function(full){var sd=C.SD19[i],H=GEO.hair(sd,2.4,3.4);G14={sk:sd,ex:v.w-.5,ed:v.ed};G15={es:v.es,cu:0,ang:1.6};G.n=1;try{return bust(mk19(v,H),full)}finally{G.n=0;G15={es:1,cu:0}}}});
/* ===== ROUND 20: egg-shaped skull, one smooth contour (G1 at every joint), hair band tapering along it ===== */
function eggP(p){var t=p.t,w=p.w,wy=p.wy,cy=p.cy,cn=p.cn,h1=(wy-t)*.55,h2=(cy-wy)*.58,f1=GEO.f1;
 return 'M0,'+t+' C'+f1(w*.62)+','+t+' '+w+','+f1(wy-h1)+' '+w+','+wy+' C'+w+','+f1(wy+h2)+' '+cn+','+cy+' 0,'+cy+' C'+(-cn)+','+cy+' '+(-w)+','+f1(wy+h2)+' '+(-w)+','+wy+' C'+(-w)+','+f1(wy-h1)+' '+f1(-w*.62)+','+t+' 0,'+t+'Z'}
function front20(H,k){var SP=H.SP,n=SP.length,f1=GEO.f1,IN=GEO.offs(SP,-3.2),OF=H.OF,i62=0,iIn=0,iOut=0,i,out=[];
 while(SP[i62][1]<-62)i62++;while(SP[iIn][1]<-27)iIn++;while(SP[iOut][1]<-8)iOut++;
 for(i=n-iOut;i<n;i++)out.push(OF[i]);for(i=0;i<=iOut;i++)out.push(OF[i]);
 var d=GEO.path(out)+' L'+f1(IN[iIn][0])+','+f1(IN[iIn][1]);
 for(i=iIn;i>=i62;i--)d+=' L'+f1(IN[i][0])+','+f1(IN[i][1]);
 var ex=IN[i62][0],ey=IN[i62][1];
 d+=' C'+f1(ex-1.5)+',-67 '+f1(36*k)+',-70.5 '+f1(30*k)+',-71 Q0,-67.2 '+f1(-30*k)+',-71 C'+f1(-36*k)+',-70.5 '+f1(-ex+1.5)+',-67 '+f1(-ex)+','+f1(ey);
 for(i=i62;i<=iIn;i++)d+=' L'+f1(-IN[i][0])+','+f1(IN[i][1]);
 d+='Z';return d}
function mk20(v,H){var k=v.w/44,o=mk19(v,H);
 o.front=function(){return P(front20(H,k),HK)+sweepLines([[[-24*k,-92],[-4,-95]],[[-34*k,-80],[-4,-77],[30*k,-82]]],HK2,2.2,.4)+blush18(v.w,v.fs)};return o}
var V20=[
 {w:38,t:-91,wy:-56,cy:4,cn:14,ed:18.5,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:38,t:-91,wy:-56,cy:5.5,cn:9.5,ed:18.5,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:38,t:-91,wy:-56,cy:4,cn:13,ed:18.5,es:1.06,fs:.45,lid:4.6,gx:-3,sm:-.8,sk:1.3},
 {w:36,t:-90,wy:-56,cy:4,cn:13.5,ed:18,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:36,t:-90,wy:-56,cy:5.5,cn:9,ed:18,es:1.06,fs:.9,lid:4.5,gx:-3,sm:-.4,sk:.9},
 {w:36,t:-90,wy:-56,cy:4,cn:12.5,ed:18,es:1.06,fs:.45,lid:4.6,gx:-3,sm:-.8,sk:1.3}];
C.SD20=V20.map(eggP);
V20.forEach(function(v,i){C['c20_'+(i+1)]=function(full){var sd=C.SD20[i],H=GEO.hair(sd,2.4,3.4);G14={sk:sd,ex:v.w-.5,ed:v.ed};G15={es:v.es,cu:0,ang:1.6};G.n=1;try{return bust(mk20(v,H),full)}finally{G.n=0;G15={es:1,cu:0}}}});
/* ===== ROUND 21: magnetic dry goth friend; one-mass hair; wider neckline; egg contour kept ===== */
NK.w21='M-11.5,-40 L11.5,-40 L12.5,-8 C16,4 28,12 36,15 C18,26 -18,26 -36,15 C-28,12 -16,4 -12.5,-8Z';
var TOR21_L='M-12.5,-8 C-24,2 -44,22 -58,40 C-64,46 -66,54 -64,66 C-64,94 -62,124 -60,172 L60,172 C62,124 64,92 64,60 C66,46 64,36 58,30 C44,12 24,-2 12.5,-8Z';
var TOR21_R='M-12.5,-8 C-24,-2 -44,12 -58,30 C-64,36 -66,46 -64,60 C-64,92 -62,124 -60,172 L60,172 C62,124 64,94 64,66 C66,54 64,46 58,40 C44,22 24,2 12.5,-8Z';
function back21(H,o){var bk=H.back,r=H.OB[H.ib],l=H.OB[H.n-H.ib],f1=GEO.f1,cut=bk.indexOf(' C'+f1(r[0]+4)+',-4'),pre=bk.slice(0,cut),r0=r[0],l0=-l[0];
 var wR=r0+4,wL=l0+(o.tuck?1:4),YR=o.YR,YL=o.tuck?o.YL:o.YR;
 return pre+' C'+f1(r0+.5)+',-12 '+f1(wR)+',-6 '+f1(wR)+',0 L'+f1(wR)+','+(YR-5)+' Q'+f1(wR)+','+YR+' '+f1(wR-5)+','+YR+' L'+f1(-(wL-5))+','+YL+' Q'+f1(-wL)+','+YL+' '+f1(-wL)+','+(YL-5)+' L'+f1(-wL)+',0 C'+f1(-wL)+',-6 '+f1(l[0]-.5)+',-12 '+f1(l[0])+','+f1(l[1])+'Z'}
function front21(H,k,o){var SP=H.SP,n=SP.length,f1=GEO.f1,IN=GEO.offs(SP,-3.2),OF=H.OF,i62=0,iIn=0,iOut=0,iInL=0,iOutL=0,i,out=[];
 while(SP[i62][1]<-62)i62++;while(SP[iIn][1]<-27)iIn++;while(SP[iOut][1]<-8)iOut++;
 var yIL=o.tuck?-52:-27,yOL=o.tuck?-47:-8;while(SP[iInL][1]<yIL)iInL++;while(SP[iOutL][1]<yOL)iOutL++;
 for(i=n-iOutL;i<n;i++)out.push(OF[i]);for(i=0;i<=iOut;i++)out.push(OF[i]);
 var d=GEO.path(out)+' L'+f1(IN[iIn][0])+','+f1(IN[iIn][1]);
 for(i=iIn;i>=i62;i--)d+=' L'+f1(IN[i][0])+','+f1(IN[i][1]);
 var ex=IN[i62][0],ey=IN[i62][1],fy=o.micro?[-79,-80,-77.5]:[-70.5,-71,-67.2];
 d+=' C'+f1(ex-1.5)+',-67 '+f1(36*k)+','+fy[0]+' '+f1(30*k)+','+fy[1]+' Q0,'+fy[2]+' '+f1(-30*k)+','+fy[1]+' C'+f1(-36*k)+','+fy[0]+' '+f1(-ex+1.5)+',-67 '+f1(-ex)+','+f1(ey);
 for(i=i62;i<=iInL;i++)d+=' L'+f1(-IN[i][0])+','+f1(IN[i][1]);
 return d+'Z'}
function flush21(sd,w,fs){var u=uid(),x=w-9;return '<defs><clipPath id="'+u+'"><path d="'+sd+'"/></clipPath></defs><g clip-path="url(#'+u+')">'+E(-x,-29,6.5*fs,3.8*fs,'url(#gBlushP)',' opacity=".9"')+E(x,-29,6.5*fs,3.8*fs,'url(#gBlushP)',' opacity=".9"')+E(0,-26.8,4.4,3,'url(#gBlushP)',' opacity=".8"')+'</g>'}
function wing21(ed,es){var s='',yo=-45+(-2.1)*es;[-1,1].forEach(function(sg){var xo=sg*ed+sg*9.5*es,tip=xo+sg*5.2;
  s+=P('M'+f(xo-sg*.6)+','+f(yo+.4)+' Q'+f(xo+sg*2.6)+','+f(yo-.2)+' '+f(tip)+','+f(yo-3.4)+' Q'+f(xo+sg*2.4)+','+f(yo+1.6)+' '+f(xo-sg*1.2)+','+f(yo+2.2)+'Z','#14101a')});return s}
function mk21(v,H){var k=v.w/44,o=mk19(v,H),sd=v.sd;
 o.neck='w21';o.rot=v.rot;o.torso=v.rot>0?TOR21_R:TOR21_L;
 o.back=function(){return P(back21(H,v),HK3)};
 o.front=function(){return P(front21(H,k,v),HK)+sweepLines(v.micro?[[[-24*k,-93],[-4,-96],[20*k,-94]]]:[[[-24*k,-92],[-4,-95]],[[-34*k,-80],[-4,-77],[30*k,-82]]],HK2,2.2,.4)+flush21(sd,v.w,v.fs)+wing21(v.ed,v.es)};
 o.ear=function(){var x=G14.ex+1.4;return E(-x,-37,2.1,2.1,SILV)+E(x,-37,2.1,2.1,SILV)};
 var ey={lid:v.lid,up:.3,gx:v.gx,iris:'#2b1b15',lw:2.8,bag:1,glint:.4},ey2={lid:v.lid+.8,up:.3,gx:v.gx,iris:'#2b1b15',lw:2.8,bag:1,glint:.4};
 o.eye=ey;o.eye2=ey2;o.brow='#16111a';o.bt=3.5;o.bl=-.4;o.br=3.4;
 o.mouth={sm:-.2,smirk:1.2,lip:'#6e2a4a',lip2:'#5a2040',mw:7.8,full:3.4,part:0};
 o.detail=function(){var u=uid(),s='<path d="M-36,15 C-18,26 18,26 36,15" fill="none" stroke="#38343f" stroke-width="3.6" stroke-linecap="round"/>';
  s+=L([[27,44],[34,51]],1.9,'#6a6478')+L([[34,44],[27,51]],1.9,'#6a6478')+L([[38,45],[45,52]],1.9,'#6a6478')+L([[45,45],[38,52]],1.9,'#6a6478');
  s+='<g transform="rotate(7 -20 8)">'+E(-20,8.5,13,2.4,'url(#gShade)',' opacity=".55"')+E(-20,6,11,1.8,'url(#gLight)',' opacity=".7"')+'</g><g transform="rotate(-7 20 8)">'+E(20,8.5,13,2.4,'url(#gShade)',' opacity=".55"')+E(20,6,11,1.8,'url(#gLight)',' opacity=".7"')+'</g>';
  s+='<defs><clipPath id="'+u+'"><path d="'+NK.w21+'"/></clipPath></defs><g clip-path="url(#'+u+')">'+E(0,-10,15,2.6,'#6a4a50',' opacity=".18"')+P('M-16,-19 Q0,-12.5 16,-19 L16,-14.6 Q0,-8 -16,-14.6Z','#14111a')+'</g>';
  s+=sh(E(0,-6.6,3.6,3.6,'#14111a')+E(0,-6.6,2.4,2.4,'none',' stroke="#8d8aa0" stroke-width=".8"'),1);return s};
 return o}
var V21=[
 {i:0,w:38,t:-91,wy:-56,cy:4,cn:14,ed:18.5,es:1.06,fs:.8,lid:4.5,gx:-3,rot:-6,YR:22},
 {i:1,w:38,t:-91,wy:-56,cy:4,cn:14,ed:18.5,es:1.06,fs:.8,lid:4.5,gx:-3,rot:5,YR:22,micro:1},
 {i:2,w:38,t:-91,wy:-56,cy:4,cn:14,ed:18.5,es:1.06,fs:.8,lid:4.5,gx:3,rot:-7,YR:36,YL:8,tuck:1},
 {i:3,w:36,t:-90,wy:-56,cy:4,cn:13.5,ed:18,es:1.06,fs:.8,lid:4.5,gx:-3,rot:6,YR:22},
 {i:4,w:36,t:-90,wy:-56,cy:4,cn:13.5,ed:18,es:1.06,fs:.8,lid:4.5,gx:0,rot:-5,YR:22,micro:1},
 {i:5,w:36,t:-90,wy:-56,cy:4,cn:13.5,ed:18,es:1.06,fs:.8,lid:4.5,gx:3,rot:7,YR:36,YL:8,tuck:1}];
var V21S=[0,1,2,3,4,5];
V21.forEach(function(v,idx){var spec={w:v.w,t:v.t,wy:v.wy,cy:v.cy,cn:v.cn},sd=eggP(spec);v.sd=sd;
 C['c21_'+(idx+1)]=function(full){var H=GEO.hair(sd,2.4,3.4);G14={sk:sd,ex:v.w-.5,ed:v.ed};G15={es:v.es,cu:0,ang:1.6};G.n=1;try{var o=mk21(v,H);return bust(o,full)}finally{G.n=0;G15={es:1,cu:0}}}});
/* ===== ROUND 22: female full-body cut-paper rig. Two rigs: "kristina" (cast15 variant 4 face) and "friend" (cast21 variant 3 face).
   Appended INSIDE the cast_cut IIFE (re-uses P/E/L/sh/uid/mk15/mk21/GEO/eggP/eyeW art). body_type "f".
   Registers: HF.RIGS.kristina, HF.RIGS.friend, HF.RIG.<id>, HF.EXPR_F.<id>, HF.POSES_F, HF.CHARS.<id>.
   Local space (same convention as vadik): origin = neck base, +y down, shoulders y~22, floor y=548. Head scale 1.18 of the cast head. */
var HFg=window.HF=window.HF||{};HFg.RIG=HFg.RIG||{};HFg.RIGS=HFg.RIGS||{};HFg.CHARS=HFg.CHARS||{};HFg.EXPR_F=HFg.EXPR_F||{};
var PIF=Math.PI,HSC=1.18,PF={};
function cF(v,a,b){return v<a?a:v>b?b:v}
function nF(v,d){return v==null||v!==v?d:v}
function trF(x,y,r,s){return 'translate('+f(x)+','+f(y)+')'+(r?' rotate('+f(r)+')':'')+(s!=null&&s!==1?' scale('+s+')':'')}
function ikF(S,H,u,l,bend){var dx=H[0]-S[0],dy=H[1]-S[1],d=Math.sqrt(dx*dx+dy*dy)||1,maxd=u+l-0.5,mind=Math.abs(u-l)+2;
  if(d>maxd){H=[S[0]+dx/d*maxd,S[1]+dy/d*maxd];dx=H[0]-S[0];dy=H[1]-S[1];d=maxd}
  if(d<mind)d=mind;
  var a=(u*u-l*l+d*d)/(2*d),h=Math.sqrt(Math.max(0,u*u-a*a)),ux=dx/(Math.sqrt(dx*dx+dy*dy)||1),uy=dy/(Math.sqrt(dx*dx+dy*dy)||1);
  return {e:[S[0]+ux*a-uy*h*bend,S[1]+uy*a+ux*h*bend],h:H}}
function angF(a,b){return Math.atan2(b[1]-a[1],b[0]-a[0])*180/PIF-90}
function capF(Ln,w0,w1){var a=w0/2,b=w1/2;return 'M'+f(-a)+',0 L'+f(-b)+','+f(Ln)+' A'+f(b)+','+f(b)+' 0 0 0 '+f(b)+','+f(Ln)+' L'+f(a)+',0 A'+f(a)+','+f(a)+' 0 0 0 '+f(-a)+',0 Z'}
function shF(S,m,soft){return '<g filter="url(#'+S.uid+(soft?'s2':'s1')+')">'+m+'</g>'}

/* ---------------------------------------------------------------- shared defs (gradients unique per skin, shadows per actor) */
var F22defs=function(u){return '<defs>'
 +'<linearGradient id="fSkW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f9e8d8"/><stop offset=".55" stop-color="#f2d8c3"/><stop offset="1" stop-color="#e6c3aa"/></linearGradient>'
 +'<linearGradient id="fSkF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e8df"/><stop offset=".55" stop-color="#eedbd0"/><stop offset="1" stop-color="#dfc5b8"/></linearGradient>'
 +'<radialGradient id="gLight"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gShade"><stop offset="0" stop-color="#8a5a48" stop-opacity=".35"/><stop offset="1" stop-color="#8a5a48" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gBlush2"><stop offset="0" stop-color="#e49a88" stop-opacity=".13"/><stop offset=".6" stop-color="#e49a88" stop-opacity=".04"/><stop offset="1" stop-color="#e49a88" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gBlushP"><stop offset="0" stop-color="#e4767e" stop-opacity=".3"/><stop offset=".6" stop-color="#e4767e" stop-opacity=".1"/><stop offset="1" stop-color="#e4767e" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="fBlH"><stop offset="0" stop-color="#e8606c" stop-opacity=".62"/><stop offset=".6" stop-color="#e8606c" stop-opacity=".28"/><stop offset="1" stop-color="#e8606c" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gSmudge"><stop offset="0" stop-color="#3a2a48" stop-opacity=".3"/><stop offset=".6" stop-color="#3a2a48" stop-opacity=".16"/><stop offset="1" stop-color="#3a2a48" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gLidSh"><stop offset="0" stop-color="#c88a84" stop-opacity=".4"/><stop offset="1" stop-color="#c88a84" stop-opacity="0"/></radialGradient>'
 +'<radialGradient id="gBag"><stop offset="0" stop-color="#a98aa6" stop-opacity=".22"/><stop offset="1" stop-color="#a98aa6" stop-opacity="0"/></radialGradient>'
 +'<filter id="'+u+'s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="#0b1020" flood-opacity=".38"/></filter>'
 +'<filter id="'+u+'s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#0b1020" flood-opacity=".34"/></filter>'
 +'<filter id="s1" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="2.5" dy="4" stdDeviation="3" flood-color="#0b1020" flood-opacity=".38"/></filter>'
 +'<filter id="s2" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#0b1020" flood-opacity=".34"/></filter>'
 +'<filter id="'+u+'cb" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="4"/></filter><filter id="'+u+'cb2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="1.6"/></filter>'
 +'<filter id="'+u+'bl" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="6"/></filter>'
 +'<filter id="'+u+'dk"><feComponentTransfer><feFuncR type="linear" slope=".8"/><feFuncG type="linear" slope=".8"/><feFuncB type="linear" slope=".84"/></feComponentTransfer></filter>'
 +'</defs>'};
C.F22defs=F22defs;

/* ---------------------------------------------------------------- character data: reuse the locked cast builders */
function withG(CH,fn){var s14=G14,s15=G15,sn=G.n;G14=CH.g14;G15=CH.g15;G.n=1;try{return fn()}finally{G14=s14;G15=s15;G.n=sn}}
var CHW=(function(){var o,g14,g15;G.n=1;try{o=mk15(6,'a','b',9);g14={sk:G14.sk,ex:G14.ex,ed:G14.ed};g15={es:G15.es,cu:G15.cu,ang:0}}finally{G.n=0;G15={es:1,cu:0}}
  return {id:'kristina',o:o,g14:g14,g15:g15,skGrad:'fSkW',
   pal:{skin:'#f6e0cc',skin2:'#e9c9b2',skinSh:'#d5ab92',hair:'#34242b',hair2:'#5a444e',hair3:'#241a20',gold:'#d6b45a',
        top:'#8fb09a',top2:'#6f9380',topHi:'#a8c4b3',collarIn:'#5f8470',pants:'#363a4a',pants2:'#272a38',pantsHi:'#474c60',
        shoe:'#ecebe6',shoe2:'#c6c5bf',sole:'#f7f2e4',shoeAcc:'#8fb09a',mouthIn:'#4a1c2a',teeth:'#f6efe6',tongue:'#d4666e',shadow:'#0b1020'},
   dim:{sw:54,shY:22,UA:90,FA:84,UL:158,LL:156,hipY:214,hemY:192,waistY:126,ww:37,hemW:43,ankleY:528,floor:548,neckY:-31,
        sitDy:118,hs:20,ank:31,boot:0,tee:0}}})();
var CHF=(function(){var v=V21[2],sd=v.sd,H=GEO.hair(sd,2.4,3.4),o,g14,g15;
  G14={sk:sd,ex:v.w-.5,ed:v.ed};G15={es:v.es,cu:0,ang:1.6};G.n=1;
  try{o=mk21(v,H);g14={sk:G14.sk,ex:G14.ex,ed:G14.ed};g15={es:G15.es,cu:G15.cu,ang:G15.ang}}finally{G.n=0;G15={es:1,cu:0}}
  return {id:'friend',o:o,g14:g14,g15:g15,skGrad:'fSkF',H:H,v:v,sd:sd,
   pal:{skin:'#ecd9cf',skin2:'#dcc4b7',skinSh:'#c6a89b',hair:'#17141d',hair2:'#34303f',hair3:'#100d15',silv:'#cfd3de',
        top:'#25222c',top2:'#1c1a22',topHi:'#36323f',print:'#7a748a',collarIn:'#38343f',pants:'#2e2d37',pants2:'#212029',pantsHi:'#3d3c4a',
        shoe:'#1a1820',shoe2:'#2c2933',sole:'#0e0d12',shoeAcc:'#4a4656',mouthIn:'#3a1830',teeth:'#eee8e2',tongue:'#b05a6c',shadow:'#0b1020'},
   dim:{sw:55,shY:23,UA:90,FA:84,UL:158,LL:156,hipY:214,hemY:232,waistY:136,ww:41,hemW:48,ankleY:528,floor:548,neckY:-31,
        sitDy:118,hs:20,ank:32,boot:1,tee:1}}})();
/* ---- friend hair back: ONE mass hugging the skull (offset outline of the egg), flaring gently past the jaw, blunt cut at jaw/neck level, tuck side shorter */
CHF.backFn=function(S){var H=CHF.H,SP=H.SP,n=SP.length,f1=GEO.f1,i,IN=[];
  function dOf(y){var q=cF((y+52)/52,0,1);return 2.8+q*q*5.2}
  for(i=0;i<n;i++){var p0=SP[(i+n-1)%n],p1=SP[(i+1)%n],dx=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dx,dy)||1,d=dOf(SP[i][1]);IN.push([SP[i][0]+dy/l*d,SP[i][1]-dx/l*d])}
  var yR=16,yL=8,iR=0,iL=0;while(SP[iR][1]<-14)iR++;while(SP[iL][1]<-14)iL++;
  var pts=[];for(i=n-iL;i<n;i++)pts.push(IN[i]);for(i=0;i<=iR;i++)pts.push(IN[i]);
  var R=IN[iR],Lp=IN[n-iL],d=GEO.path(pts);
  d+=' C'+f1(R[0]+.6)+','+f1(R[1]+8)+' '+f1(R[0]-.4)+','+(yR-7)+' '+f1(R[0]-1)+','+(yR-4)+' Q'+f1(R[0]-1.4)+','+yR+' '+f1(R[0]-6)+','+yR+' L'+f1(Lp[0]+6)+','+yL+' Q'+f1(Lp[0]+1.4)+','+yL+' '+f1(Lp[0]+1)+','+(yL-4)+' C'+f1(Lp[0]+.4)+','+(yL-7)+' '+f1(Lp[0]-.6)+','+f1(Lp[1]+8)+' '+f1(Lp[0])+','+f1(Lp[1])+'Z';
  return P(d,CHF.pal.hair3)};
CHW.backFn=function(S){return CHW.o.back()};

/* ---------------------------------------------------------------- expressions (all numeric). Channels:
   open (lid openness, 1 = rig base), lo (lower-lid push), shut 0..1, happy (closed eye as ∩), pup (pupil scale), gx/gy (-1..1),
   by/bdL/bdR brow lift (cast units), btL/btR brow tilt (inner end up +), mc (mouth curve, +smile), mw (width scale), mo (base mouth open 0..1),
   ms (smirk, +right corner up), mp (lip-part line 0..1), mt (teeth 0..1 override, -1 auto), mg (tongue override, -1 auto), blush 0..1, sweat 0..1 */
var EX0F={open:1,lo:0,shut:0,happy:0,pup:1,gx:0,gy:0,by:0,bdL:0,bdR:0,btL:0,btR:0,mc:0,mw:1,mo:0,ms:0,mp:1,mt:-1,mg:-1,blush:0,sweat:0,trap:0,lt:0,pale:0,irs:1};
function ex(o){var r={},k;for(k in EX0F)r[k]=EX0F[k];for(k in o)r[k]=o[k];return r}
var XW={
 neutral:ex({}),
 deadpan:ex({open:.82,mc:-.55,ms:-.8,mp:0,btL:0,btR:0}),
 smile:ex({open:.9,lo:.4,by:.8,btL:.6,btR:.6,mc:.85,ms:-.3,mo:.14,mw:1.1,mp:0,blush:.25}),
 surprised:ex({open:1.7,lo:1.4,pup:.85,by:5,btL:1.5,btR:1.5,mc:-.2,ms:-.8,mo:.55,mw:.62,mp:0,mt:0,mg:.3}),
 annoyed:ex({open:.62,pup:.95,by:-2.5,btL:-3.2,btR:-3.2,mc:-.65,ms:-.8,mp:0,mw:.9}),
 hate_stare:ex({open:.45,lo:-.8,pup:.8,by:-3.5,btL:-4.6,btR:-4.6,mc:-.7,ms:-.8,mp:0,mw:.8}),
 embarrassed:ex({open:.9,by:1,btL:2.6,btR:2.6,mc:.3,ms:-.4,mo:.06,mp:0,gx:.7,gy:.7,blush:1,mw:.9}),
 laughing:ex({shut:1,happy:1,by:2.2,btL:.8,btR:.8,mc:1,ms:-.6,mo:.88,mw:1.12,mp:0,blush:.35}),
 sad:ex({open:.78,by:.5,btL:4.6,btR:4.6,mc:-.7,ms:-.8,mp:0,gy:.8,mw:.8}),
 panic:ex({open:2.6,lo:3,pup:.4,by:9,btL:7,btR:7,mc:-1.1,ms:0,mo:.62,mw:1,mp:0,mt:0,mg:0,sweat:1}),
 sidelong:ex({open:.78,by:-.5,btL:-1,btR:-1,mc:-.2,ms:-.4,mp:0,gx:1}),
 sidelong_l:ex({open:.78,by:-.5,btL:-1,btR:-1,mc:-.2,ms:-.4,mp:0,gx:-1})};
/* friend: same channel set, her own numbers (cold, low-amplitude; smirk lives in ms) */
var XF={
 neutral:ex({}),
 deadpan:ex({open:.92,mc:-.4,ms:-1,mp:0,mw:.95}),
 smile:ex({open:.9,lo:.3,by:.5,btL:0,btR:.8,mc:.35,ms:.9,mp:0,mw:1.05,blush:.15}),
 surprised:ex({open:1.55,lo:1.1,pup:.9,by:6,btL:1,btR:1,mc:-.2,ms:-1,mo:.5,mw:.6,mp:0,mt:0,mg:.3}),
 annoyed:ex({open:.78,pup:.95,by:-2.5,btL:-3,btR:-3.4,mc:-.55,ms:-1,mp:0,mw:.9}),
 hate_stare:ex({open:.62,lo:-1,pup:.85,by:-4,btL:-5,btR:-5.4,mc:-.35,ms:-1.1,mp:0,mw:.95,gx:-1}),
 embarrassed:ex({open:.95,by:1.4,btL:2.4,btR:1.4,mc:.25,ms:-.2,mo:.05,mp:0,gx:1.2,gy:.8,blush:1,mw:.9}),
 laughing:ex({shut:1,happy:1,by:2.6,btL:1,btR:1,mc:.9,ms:-.2,mo:.85,mw:1.1,mp:0,blush:.3}),
 sad:ex({open:.9,by:.4,btL:5,btR:4.4,mc:-.7,ms:-1,mp:0,gy:.9,mw:.8}),
 panic:ex({open:1.85,lo:3.7,pup:.55,irs:.8,by:6.5,bdL:-1.5,bdR:3.5,btL:8,btR:10.5,mc:0,ms:0,mo:.7,mw:1.25,mp:0,mt:0,mg:0,trap:1,sweat:2,pale:1.2,blush:0}),
 panic_soft:ex({open:1.75,lo:3.4,pup:.6,irs:.86,by:6.5,btL:9,btR:9,mc:0,ms:0,mo:.45,mw:1.1,mp:0,mt:0,mg:0,trap:1,sweat:1,pale:1,blush:0}),
 panic_hard:ex({open:2.1,lo:4.2,pup:.42,irs:.72,by:7,bdL:0,bdR:4,btL:10,btR:11,mc:0,ms:0,mo:.8,mw:1.3,mp:0,mt:0,mg:0,trap:1,lt:1,sweat:2,pale:1.4,blush:0}),
 sidelong:ex({open:.85,by:-.5,btL:-1,btR:-1,mc:-.3,ms:-.3,mp:0,gx:1}),
 sidelong_l:ex({open:.85,by:-.5,btL:-1,btR:-1,mc:-.3,ms:-.3,mp:0,gx:-1})};
CHW.expr=XW;CHF.expr=XF;HFg.EXPR_F.kristina=XW;HFg.EXPR_F.friend=XF;

/* ---------------------------------------------------------------- poses (data; hand target h = wrist in torso frame). shared by both rigs */
function mergeF(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=mergeF(o[k]||{},b[k]);else o[k]=b[k]}return o}
var PBF={turn:0,lean:0,hipx:0,sh:0,fid:0,sit:0,view:"front",face:1,
  head:{yaw:0,tilt:0,dx:0,dy:0},
  L:{h:[-58,198],bend:1,hand:"mitten",rot:0,s:1,z:1},
  R:{h:[58,198],bend:-1,hand:"mitten",rot:0,s:1,z:1},
  legs:{spread:20,ank:31,kin:1,k:0,fl:-1,fr:1,fsh:1,fs:1},
  gait:{nx:50,ny:0,nrot:-16,fx:-44,fy:-16,frot:34}};
HFg.POSES_F=HFg.POSES_F||{};
var PSF={
 stand_still:{sh:3,head:{tilt:2}},
 stand_idle:{sh:4,fid:1,lean:.08,head:{tilt:-3,dy:1},R:{h:[56,194]},legs:{spread:20,ank:30}},
 sit_desk:{sit:1,sh:2,lean:.06,head:{tilt:2},L:{h:[-40,128],bend:1,fsh:.55},R:{h:[40,128],bend:-1,fsh:.55},legs:{spread:20,ank:31,kin:2}},
 walk_contact:{view:"side",sh:2,lean:.1,head:{yaw:1,tilt:1},L:{h:[34,170],bend:-1},R:{h:[-30,172],bend:-1},legs:{}},
 arms_crossed:{sh:2,lean:0,head:{tilt:-2},L:{h:[36,112],bend:1,hand:"mitten",rot:-20},R:{h:[-32,102],bend:-1,hand:"mitten",rot:20}},
 hand_on_hip:{sh:2,head:{tilt:4},R:{h:[56,170],bend:-1,rot:-8},L:{h:[-58,198]},legs:{spread:20,ank:32,k:0}},
 hand_to_hair:{sh:3,head:{tilt:5,yaw:-.08},L:{h:[-58,198]},R:{h:[70,-38],bend:1,rot:14,fsh:.8}},
 turn_3q:{turn:.33,sh:3,head:{yaw:.36,tilt:2},legs:{spread:20,ank:31}},
 profile:{view:"side",sh:2,head:{yaw:1,tilt:1},L:{h:[8,190],bend:-1},R:{h:[-6,192],bend:-1},gait:{nx:7,ny:0,nrot:0,fx:-7,fy:0,frot:0}},
 phone_hold:{sh:2,head:{tilt:-4,dy:2},R:{h:[30,96],bend:-1,hand:"grip",rot:-10,fsh:.62},L:{h:[-58,198]}},
 mug_hold:{sh:2,head:{tilt:2},R:{h:[40,100],bend:-1,hand:"grip",rot:0,fsh:.62},L:{h:[-22,126],bend:1,rot:-40,fsh:.7}}};
for(var pn in PSF)HFg.POSES_F[pn]=mergeF(PBF,PSF[pn]);

/* ---------------------------------------------------------------- face parts (head frame, cast units) */
function eyeF(cx,ey,o,X){var m=cx<0?1:-1,u=uid(),d=(o.lid||0)+(1-X.open)*6,gx=cF(o.gx||0,-4.6,4.6)*m,gy=cF(o.gy||0,-3,3.2),ir=o.iris||'#8a5a34',up=o.up==null?0:o.up,lw=o.lw||1.9,lo=X.lo,pp=X.pup,oy=-1.8-up*.5,s='<g transform="translate('+f(cx)+','+f(ey)+') scale('+m+',1)">';
  if(X.shut>=.6){s+='<ellipse cx="0" cy="-3.5" rx="11" ry="5" fill="url(#gLidSh)"/>';
    if(X.happy)s+='<path d="M-10,.8 Q-.5,-9 9,.8" stroke="#2c1b1c" stroke-width="'+f(lw*1.5)+'" fill="none" stroke-linecap="round"/><path d="M-10,.8 L-13,-1" stroke="#2c1b1c" stroke-width="1.4" stroke-linecap="round"/>';
    else s+='<path d="M-9.5,-1.5 Q-.5,5.5 8.5,-.5" stroke="#2c1b1c" stroke-width="'+f(lw*1.4)+'" fill="none" stroke-linecap="round"/><path d="M-9.5,-1.5 L-12.6,-3.2" stroke="#2c1b1c" stroke-width="1.4" stroke-linecap="round"/>';
    return s+'</g>'}
  d+=X.shut*8;
  var top='M-9.5,'+f(oy)+' C-5.5,'+f(-8.2+d-up*.4)+' 3,'+f(-9+d)+' 8.5,1.2',shape='M-9.5,'+f(oy)+' C-5.5,'+f(-8.2+d-up*.4)+' 3,'+f(-9+d)+' 8.5,1.2 C4,'+f(5+lo)+' -4.5,'+f(4.4+lo)+' -9.5,'+f(oy)+'Z';
  s+='<ellipse cx="0" cy="-5.5" rx="11" ry="5" fill="url(#gLidSh)"/>';if(o.bag)s+='<ellipse cx="0" cy="8.5" rx="11" ry="3.6" fill="url(#gBag)"/>';
  var ir_r=5.3*(.92+.08*pp)*(X.irs==null?1:X.irs),pr=2.3*pp*(pp>1?1:1);
  s+='<defs><clipPath id="'+u+'"><path d="'+shape+'"/></clipPath></defs>'+P(shape,'#f6efea');
  s+='<g clip-path="url(#'+u+')">'+E(gx*.7,.4+gy,ir_r,ir_r,ir)+E(gx*.7,3.2+gy,4.2,2.6,'#fff',' opacity=".14"')+E(gx*.7,.5+gy,ir_r,ir_r,'none',' stroke="#2a1812" stroke-width=".9" opacity=".5"')+E(gx*.7,.5+gy,pr*1.0+(pp<1?0:0),pr,'#150d10')+E(gx*.7-1.7,-1.9+gy,(o.glint?1.8:1.3),(o.glint?1.8:1.3),'#fff',' opacity=".95"')+(o.glint?E(gx*.7+2,1.5+gy,.85,.85,'#fff',' opacity=".8"'):'')
   +'<path d="M-12,-14 L12,-14 L12,1.2 L8.5,1.2 C3,'+f(-9+d)+' -5.5,'+f(-8.2+d-up*.4)+' -9.5,'+f(oy)+' L-12,'+f(oy)+'Z" fill="'+(o.lidc||'#ead0bc')+'"/>'
   +'<path d="M-12,'+f(-3+d*.4)+' L12,'+f(-3+d*.4)+' L12,-1 L-12,-1Z" fill="#a87068" opacity="'+(d>0?.18:0)+'"/></g>';
  s+='<path d="'+top+'" stroke="#2c1b1c" stroke-width="'+lw+'" fill="none" stroke-linecap="round"/>';
  s+=L([[-9.5,oy],[-12.6,oy-1.8-up*.3]],1.3,'#2c1b1c');
  s+='<path d="M8,2.6 C3.5,'+f(4.8+lo)+' -4.5,'+f(4.2+lo)+' -8.6,'+f(oy+.8)+'" stroke="#9a6a60" stroke-width=".8" fill="none" opacity=".5"/>';
  s+='<path d="M-8.6,'+f(-5.3+d*.5)+' C-4.5,'+f(-10.8+d*.6)+' 3,'+f(-11.6+d*.6)+' 8,-4.4" stroke="#b88470" stroke-width="1" fill="none" opacity=".5"/>';
  return s+'</g>'}
function browF(cx,col,a,th,out,ti){var sg=cx<0?-1:1,x1=cx-sg*11,x2=cx+sg*15,t=th||2,yi=-59.5-a*.3-ti,yo=-57.5-(out||0)-a*.2+ti*.6,ct=-67-a-ti*.2,cb=-62.6-a-ti*.2;
  return P('M'+f(x1)+','+f(yi)+' Q'+f(cx+sg*1)+','+f(ct)+' '+f(x2)+','+f(yo)+' Q'+f(cx+sg*2)+','+f(cb)+' '+f(x1)+','+f(yi+t)+'Z',col)}
function mouthF(CH,X,e,mouth){var m=CH.o.mouth,lcy=-13.5,w=m.mw*X.mw*(1+.12*e),sm=m.sm+X.mc*3,k=Math.max(0,m.smirk+X.ms),full=m.full,lc=m.lip,lc2=m.lip2,pal=CH.pal;
  var ly=lcy-sm,ry=lcy-sm-k*2.2;
  if(e<.06)return mouthX({sm:sm,smirk:k,lip:lc,lip2:lc2,mw:w,full:full,part:X.mp*(m.part||0)});
  var Hh=e*17.5,cA=lcy+sm+1.6,cB=cA+2*Hh,th=3.4+full*.5,xl=-w+1.6,xr=w-1.6,yl=ly+.6,yr=ry+.6,u=uid(),s='';
  var inner='M'+f(xl)+','+f(yl)+' Q0,'+f(cA)+' '+f(xr)+','+f(yr)+' Q0,'+f(cB)+' '+f(xl)+','+f(yl)+'Z';
  s+='<defs><clipPath id="'+u+'"><path d="'+inner+'"/></clipPath></defs>'+P(inner,pal.mouthIn);
  var yA=(yl+yr)/4+cA/2,yB=yA+Hh;
  var tt=X.mt>=0?X.mt:(e>=.4?cF((e-.35)*1.6,0,1):0),tg=X.mg>=0?X.mg:(e>=.5?cF((e-.45)*2,0,1):0);
  s+='<g clip-path="url(#'+u+')">';
  if(tt>0)s+='<path d="M'+f(xl-2)+','+f(yA-3)+' L'+f(xr+2)+','+f(yA-3)+' L'+f(xr+2)+','+f(yA+Math.min(7,Hh*.55*tt+1.5))+' Q0,'+f(yA+Math.min(7,Hh*.55*tt+1.5)+2)+' '+f(xl-2)+','+f(yA+Math.min(7,Hh*.55*tt+1.5))+'Z" fill="'+pal.teeth+'"/>';
  if(tg>0)s+=E(0,yB-1.2,w*.5,Hh*.42*tg+1,pal.tongue)+E(0,yB-2.6,w*.22,1.1,'#e8909a',' opacity=".55"');
  s+='</g>';
  s+=P('M'+f(xr)+','+f(yr)+' Q0,'+f(cB)+' '+f(xl)+','+f(yl)+' Q0,'+f(cB+2*th)+' '+f(xr)+','+f(yr)+'Z',lc,' opacity=".96"');
  s+=P('M'+f(-w)+','+f(ly)+' Q'+f(-w*.5)+','+f(ly-3.6)+' 0,'+f(lcy+sm-3.2)+' Q'+f(w*.5)+','+f(ry-3.6)+' '+f(w)+','+f(ry)+' Q0,'+f(cA)+' '+f(-w)+','+f(ly)+'Z',lc2);
  s+=E(1.2,yB+th*.55+.6,2.8,.7,'#fff',' opacity=".4"');
  s+=L([[w,ry],[w+1.8,ry-2]],1.3,'#b0685e',' opacity=".75"')+L([[-w,ly],[-w-1.6,ly-1.2]],1.2,'#b0685e',' opacity=".55"');
  return s}
/* skull skin + shading + every feature, clipped to the skull */
PF.skull=function(S){var CH=S.ch,g=CH.g14,g5=CH.g15,ex_=g.ex,SK=g.sk,ed=g.ed,q=ex_/40.8,cu=g5.cu,es=g5.es,sk=CH.o.skin,u=uid(),X=S.X,o='',b=CH.o,ca=S.ca,fx=S.fx;
  var sx=.9+.1*ca;
  o+='<g transform="scale('+f(sx)+',1)">';
  o+=E(-ex_,-44,5.2,8,sk)+E(ex_,-44,5.2,8,sk)+E(-ex_+.5,-43,2.5,4.4,CH.pal.skin2)+E(ex_-.5,-43,2.5,4.4,CH.pal.skin2);
  o+='<defs><clipPath id="'+u+'"><path d="'+SK+'"/></clipPath></defs>'+P(SK,'url(#'+CH.skGrad+')');
  o+='<g clip-path="url(#'+u+')">'+E(-16*q,-40,18,14,'url(#gLight)',' opacity=".35"')+E(-4,-80,26,12,'url(#gLight)',' opacity=".4"')
   +E(-23*q,-22,9,4,'url(#gBlush2)')+E(23*q,-22,9,4,'url(#gBlush2)')
   +'<g transform="rotate(-14 '+f(-24*q)+' '+(-33-cu)+')">'+E(-24*q,-33-cu,11,5.5,'url(#gLight)',' opacity="1"')+'</g>'
   +'<g transform="rotate(14 '+f(24*q)+' '+(-33-cu)+')">'+E(24*q,-33-cu,10,4.8,'url(#gLight)',' opacity=".5"')+'</g>'
   +'<g transform="rotate(-34 '+f(-30*q)+' '+(-20-cu)+')">'+E(-30*q,-20-cu,6,13,'url(#gShade)',' opacity=".5"')+'</g>'
   +'<g transform="rotate(34 '+f(30*q)+' '+(-20-cu)+')">'+E(30*q,-20-cu,6,13,'url(#gShade)',' opacity=".6"')+'</g>'
   +E(0,2.6,6,3,'url(#gLight)',' opacity=".5"')+E(0,-3.5,10,4,'url(#gShade)',' opacity=".3"');
  /* features, shifted/narrowed by the head turn, clipped by the skull */
  var cs=Math.max(.6,ca);
  o+='<g transform="translate('+f(fx)+','+(S.pitch)+') scale('+f(cs)+',1)">';
  if(X.blush>0)o+=E(-23*q,-23,12,6.5,'url(#fBlH)',' opacity="'+f(X.blush)+'"')+E(23*q,-23,12,6.5,'url(#fBlH)',' opacity="'+f(X.blush)+'"');
  if(X.pale>0)o+=E(-22*q,-18,12,8,'url(#gShade)',' opacity="'+f(.3*X.pale)+'"')+E(22*q,-18,12,8,'url(#gShade)',' opacity="'+f(.3*X.pale)+'"');
  var eyeBase=b.eye,eye2=b.eye2||b.eye,exg=S.gxu,eyg=S.gyu;
  function eo(bs){var r={};for(var k in bs)r[k]=bs[k];r.gx=(bs.gx||0)*0+(bs.gx||0)+exg;r.gy=(bs.gy||0)+eyg;return r}
  function eS(cx,e2){return '<g transform="translate('+f(cx)+',-45) scale('+es+') translate('+f(-cx)+',45)">'+eyeF(cx,-45,e2,X)+'</g>'}
  var lead=S.as>.15?S.sg:0;
  o+='<g transform="translate('+f(-ed)+',0) scale('+f(lead===1?1:(lead===-1?1:1))+',1) translate('+f(ed)+',0)">'+eS(-ed,eo(eyeBase))+'</g>'+eS(ed,eo(eye2));
  var ang=g5.ang||0,col=b.brow||'#4a3028';
  o+=browF(-ed,col,(b.bl||0)+X.by+X.bdL,b.bt||2.2,ang,X.btL)+browF(ed,col,(b.br||0)+X.by+X.bdR,b.bt||2.2,ang,X.btR);
  o+='<g transform="translate(0,-28) scale('+(b.nsx||1)+','+(b.nsy||1)+') translate(0,28)"><path d="M3,-42 C5,-36 6,-31 5,-27" stroke="#c9967e" stroke-width="2.2" fill="none" opacity=".12" stroke-linecap="round"/>'+E(0,-28.8,3.2,2,'#fff',' opacity=".42"')+E(-3.2,-26,1.2,.8,'#a87464',' opacity=".75"')+E(3.2,-26,1.2,.8,'#a87464',' opacity=".75"')+'</g>';
  if(b.fr)o+=freckles(b.fr);
  o+=mouthF(CH,X,S.eOpen,S.mouth);
  if(X.sweat>1)o+='<g transform="translate('+f(-ex_*.9)+',-30) scale(.8)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/><path d="M-1.5,-3 C-3,0 -3,2 -2,3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/></g>';
  if(X.sweat>0)o+='<g transform="translate('+f(ex_*.86)+',-60)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/><path d="M-1.5,-3 C-3,0 -3,2 -2,3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/></g>';
  o+='</g></g></g>';
  return o};
PF.hair_back=function(S){var CH=S.ch;return withG(CH,function(){return '<g transform="scale('+f(.9+.1*S.ca)+',1)">'+CH.backFn(S)+'</g>'})};
PF.hair_front=function(S){var CH=S.ch;return withG(CH,function(){var sx=.9+.1*S.ca;return '<g transform="translate('+f(S.fx*.3)+',0) scale('+f(sx)+',1)">'+CH.o.front()+'</g>'})};
PF.ear=function(S){var CH=S.ch;return withG(CH,function(){return '<g transform="translate('+f(S.fx*.3)+',0) scale('+f(.9+.1*S.ca)+',1)">'+CH.o.ear()+'</g>'})};

/* ---------------------------------------------------------------- profile head (yaw = +-1), facing +x, cast units */
var PRO_SK='M0,-93 C22,-93 38,-80 39,-60 C39.5,-54 40,-50 41.5,-46 C43,-42 45.5,-38 47,-32 C48,-29 48.5,-27 46,-25.5 C44,-24.5 41,-24 40,-23 C41,-21 41.2,-18.5 39,-17.5 C38,-16.5 37,-15.5 37.5,-14.5 C39,-13 39,-10 37,-8.5 C35,-6.5 36,-3 33,-.5 C30,2 22,3.5 14,2 C4,0 -4,-6 -10,-14 C-26,-24 -40,-42 -40,-62 C-40,-82 -22,-93 0,-93Z';
PF.head_profile=function(S){var CH=S.ch,X=S.X,pal=CH.pal,fr=CH.id==='friend',o='',u=uid();
  var skin=CH.o.skin,e0=CH.o.eye,lid=(e0.lid||0)+(1-X.open)*5,e=S.eOpen,b=CH.o.brow;
  if(CH.id==='kristina')o+=P('M-40,-70 C-52,-100 -10,-106 12,-104 C30,-102 40,-88 38,-66 L-6,-60 C-8,-30 -14,10 -20,40 C-22,56 -26,62 -34,68 C-48,64 -52,40 -50,10 C-48,-20 -52,-50 -40,-70Z',pal.hair3);
  else o+=P('M-41,-70 C-52,-100 -10,-106 12,-104 C30,-102 40,-88 38,-66 L-6,-60 L-10,12 Q-26,24 -34,19 C-42,18 -46,12 -45,2 C-46,-20 -52,-50 -41,-70Z',pal.hair3);
  o+='<defs><clipPath id="'+u+'"><path d="'+PRO_SK+'"/></clipPath></defs>'+P(PRO_SK,'url(#'+CH.skGrad+')');
  o+='<g clip-path="url(#'+u+')">'+E(14,-30,12,10,'url(#gLight)',' opacity=".4"')+E(26,-24,10,5,'url(#gBlush2)')+E(-12,-30,16,28,'url(#gShade)',' opacity=".5"')+(X.blush>0?E(24,-24,11,6,'url(#fBlH)',' opacity="'+f(X.blush)+'"'):'')+'</g>';
  o+=E(-9,-40,5.6,9,skin)+E(-9.5,-40,2.8,5,pal.skin2);
  /* eye */
  var up=Math.max(0,lid);
  if(X.shut>=.6)o+=X.happy?'<path d="M14,-43 Q21,-50 29,-43" stroke="#2c1b1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>':'<path d="M14,-45 Q22,-39 29,-44" stroke="#2c1b1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  else{var eh=cF(4.2-lid*.8+X.lo*.6,1,6);o+='<path d="M14,-44 C17,'+f(-44-eh)+' 25,'+f(-44-eh)+' 29,-43 C25,-40.5 18,-40.5 14,-44Z" fill="#f6efea"/>'+E(25+S.gxu*.5,-43.8+S.gyu*.5,Math.min(3.6,eh*.95),Math.min(3.6,eh*.95),e0.iris||'#5f9ad6')+E(25+S.gxu*.5,-43.8+S.gyu*.5,1.5*X.pup,1.5*X.pup,'#150d10')+E(24,-45,1,1,'#fff')+'<path d="M13.5,-44 C17,'+f(-44-eh-.6)+' 25,'+f(-44-eh-.6)+' 29.5,-43" stroke="#2c1b1c" stroke-width="'+(e0.lw||2)+'" fill="none" stroke-linecap="round"/>'}
  o+='<path d="M12,'+f(-55-(b.bl||0)*.3-X.by-X.bdR*.5+X.btR*.4)+' Q22,'+f(-61-(b.bl||0)*.3-X.by-X.btR*.2)+' 31,'+f(-55-X.by+X.btR*-.5)+'" stroke="'+(b||'#4a3028')+'" stroke-width="'+(CH.o.bt||2.2)*1.35+'" fill="none" stroke-linecap="round"/>';
  /* lips in profile */
  var lp=CH.o.mouth.lip,lp2=CH.o.mouth.lip2,sm=CH.o.mouth.sm+X.mc*2.4,Hh=e*13;
  o+=P('M39.2,-20.4 C41.4,-19.4 41.4,-16.6 39,-15.6 C38,-15.2 37.4,-14.8 36.4,-14.4 C37,-16 37.4,-18.4 36.6,-20.4Z',lp2);
  if(Hh>1.5){o+=P('M36.2,-14.4 L38.6,-15.2 L39,-15.6 L35,'+f(-14.2+Hh)+'Z',pal.mouthIn);
    o+=P('M36.4,-14.4 C39,-13 39.8,'+f(-11.5+Hh)+' 37,'+f(-9+Hh)+' C35,'+f(-8.5+Hh)+' 34.6,'+f(-11+Hh)+' 35,'+f(-14+Hh)+'Z',lp)}
  else o+=P('M36.4,-14.6 C39,-13.6 39.6,-10.6 37.2,-8.6 C35.4,-9.4 35.4,-12 36.4,-14.6Z',lp);
  o+='<path d="M33,-17.5 Q35,-15.5 36.4,-14.6" stroke="#b0685e" stroke-width="1.1" fill="none" opacity=".6" stroke-linecap="round"/>';
  /* hair front */
  if(CH.id==='kristina'){o+=P('M-38,-62 C-46,-98 -8,-104 14,-102 C30,-100 41,-86 39.5,-66 C36,-76 28,-82 18,-82 C6,-82 -6,-72 -10,-52 C-12,-40 -14,-26 -12,-14 C-20,-24 -34,-40 -38,-62Z',pal.hair)+L([[-30,-92],[-6,-98],[20,-94]],2.2,pal.hair2,' opacity=".5"')+sh('<g transform="rotate(8 14 -96)"><rect x="3" y="-101" width="24" height="7.6" rx="3.8" fill="#d6b45a"/><rect x="6" y="-99.6" width="18" height="1.8" rx=".9" fill="#f3dc92" opacity=".8"/></g>',1)+E(-8,-37,2.2,2.2,'#d6b45a')}
  else{o+=P('M-40,-64 C-48,-98 -8,-104 16,-102 C34,-100 45,-86 42.5,-66 L42,-68.5 C34,-70.5 24,-69.5 14,-67.5 C2,-65 -6,-66 -12,-60 C-14,-40 -14,-20 -12,-8 C-24,-18 -38,-40 -40,-64Z',pal.hair)+L([[-28,-93],[-4,-97],[22,-94]],2.2,pal.hair2,' opacity=".45"')+E(-8.5,-37,2.1,2.1,pal.silv)+sh(E(-8.5,-37,2.1,2.1,pal.silv),1)}
  if(S.X.sweat>0)o+='<g transform="translate(-6,-76)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/></g>';
  return o};
PF.hair_back_profile=function(S){return ''};

/* ---------------------------------------------------------------- body parts */
PF.neck=function(S){var c=S.c,tx=S.tx;
  return '<path d="M'+f(tx-11.5)+',-48 L'+f(tx+11.5)+',-48 L'+f(tx+13)+',2 Q'+f(tx)+',9 '+f(tx-13)+',2 Z" fill="url(#'+(S.ch.id==='friend'?'fSkF':'fSkW')+')"/><path d="M'+f(tx-12)+',-30 L'+f(tx+12)+',-30 L'+f(tx+12.4)+',-17 Q'+f(tx)+',-8 '+f(tx-12.4)+',-17 Z" fill="'+c.skinSh+'" opacity=".62"/>'};
function torsoPath(S){var D=S.dim,sw=S.sw,tx=S.tx,sh_=S.shr,hy=D.hemY,wy=D.waistY,ww=D.ww*(.5+.5*S.tc),hw=D.hemW*(.5+.5*S.tc),k=D.tee?1:0;
  return 'M'+f(tx-14)+',-6 C'+f(tx-30)+',-3 '+f(tx-sw+8)+','+f(7-sh_)+' '+f(tx-sw)+','+f(23-sh_)+' C'+f(tx-sw-1)+',54 '+f(tx-ww-4)+','+(wy-40)+' '+f(tx-ww)+','+wy+' C'+f(tx-ww-1)+','+(wy+28)+' '+f(tx-hw-1)+','+(hy-28)+' '+f(tx-hw)+','+hy+' Q'+f(tx)+','+(hy+5)+' '+f(tx+hw)+','+hy+' C'+f(tx+hw+1)+','+(hy-28)+' '+f(tx+ww+1)+','+(wy+28)+' '+f(tx+ww)+','+wy+' C'+f(tx+ww+4)+','+(wy-40)+' '+f(tx+sw+1)+',54 '+f(tx+sw)+','+f(23-sh_)+' C'+f(tx+sw-8)+','+f(7-sh_)+' '+f(tx+30)+',-3 '+f(tx+14)+',-6 Q'+f(tx)+',8 '+f(tx-14)+',-6 Z'}
PF.torso=function(S){var c=S.c,tx=S.tx,u=S.uid,d=torsoPath(S),D=S.dim,hy=D.hemY,fr=S.ch.id==='friend',kx=S.key<0?-1:1,sw=S.sw;S.torsoPath=d;
  var o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.top+'"/>';
  o+='<g clip-path="url(#'+u+'tc)"><path d="M'+f(tx+kx*sw*.2)+',-6 C'+f(tx+kx*sw*.5)+',60 '+f(tx+kx*sw*.42)+',160 '+f(tx+kx*sw*.45)+',250 L'+f(tx+kx*100)+',250 L'+f(tx+kx*100)+',-6 Z" fill="'+c.top2+'" opacity=".4" filter="url(#'+u+'bl)"/>';
  o+='<path d="M'+f(tx-100)+','+(hy-16)+' Q'+f(tx)+','+(hy-11)+' '+f(tx+100)+','+(hy-16)+' L'+f(tx+100)+','+(hy+12)+' L'+f(tx-100)+','+(hy+12)+' Z" fill="'+c.top2+'" opacity=".5"/>';
  o+=E(tx-sw*.62,18,17,6.4,'#fff',' opacity=".11"');
  if(!fr){var x;for(x=-48;x<=48;x+=7)o+=L([[tx+x*(.5+.5*S.tc),34],[tx+x*(.5+.5*S.tc)*.9,hy-6]],1.2,c.top2,' opacity=".25"');
    o+='<path d="M'+f(tx-44)+','+(D.waistY+8)+' Q'+f(tx)+','+(D.waistY+14)+' '+f(tx+44)+','+(D.waistY+8)+'" stroke="'+c.top2+'" stroke-width="2" fill="none" opacity=".25"/>'}
  else{o+='<path d="M'+f(tx-sw*.6)+',70 C'+f(tx-sw*.5)+',110 '+f(tx-sw*.42)+',150 '+f(tx-sw*.4)+',210" stroke="'+c.topHi+'" stroke-width="2.4" fill="none" opacity=".28"/><path d="M'+f(tx+16)+',60 C'+f(tx+22)+',100 '+f(tx+24)+',150 '+f(tx+22)+',216" stroke="'+c.top2+'" stroke-width="2" fill="none" opacity=".5"/>';
    var px=tx+13,py=66,xl=[[0,0,7,7],[7,0,0,7],[11,1,18,8],[18,1,11,8]];
    o+=L([[px,py],[px+7,py+7]],2,c.print)+L([[px+7,py],[px,py+7]],2,c.print)+L([[px+11,py+1],[px+18,py+8]],2,c.print)+L([[px+18,py+1],[px+11,py+8]],2,c.print)}
  o+='</g>';return o};
PF.collar=function(S){var c=S.c,tx=S.tx,u=S.uid;
  if(S.ch.id==='friend'){/* wide closed scoop: skin chest patch + dark rib band + choker + pendant */
    var nk='M'+f(tx-12)+',-8 C'+f(tx-13)+',4 '+f(tx-26)+',9 '+f(tx-35)+',13 C'+f(tx-18)+',25 '+f(tx+18)+',25 '+f(tx+35)+',13 C'+f(tx+26)+',9 '+f(tx+13)+',4 '+f(tx+12)+',-8Z';
    return '<path d="'+nk+'" fill="url(#fSkF)"/><path d="M'+f(tx-12)+',-6 C'+f(tx-14)+',6 '+f(tx-26)+',10 '+f(tx-35)+',13" stroke="'+c.skinSh+'" stroke-width="1.4" fill="none" opacity=".4" stroke-linecap="round"/><path d="M'+f(tx+12)+',-6 C'+f(tx+14)+',6 '+f(tx+26)+',10 '+f(tx+35)+',13" stroke="'+c.skinSh+'" stroke-width="1.4" fill="none" opacity=".4" stroke-linecap="round"/>'
     +'<path d="M'+f(tx-35)+',13 C'+f(tx-18)+',25 '+f(tx+18)+',25 '+f(tx+35)+',13" fill="none" stroke="'+c.collarIn+'" stroke-width="3.8" stroke-linecap="round"/>'}
  return '<path d="M'+f(tx-23)+',-1 C'+f(tx-22)+',9 '+f(tx+22)+',9 '+f(tx+23)+',-1" fill="none" stroke="'+c.collarIn+'" stroke-width="0"/><path d="M'+f(tx-24)+',-2 C'+f(tx-20)+',10 '+f(tx+20)+',10 '+f(tx+24)+',-2" fill="none" stroke="'+c.top2+'" stroke-width="6" stroke-linecap="round"/><path d="M'+f(tx-24)+',-4 C'+f(tx-20)+',7 '+f(tx+20)+',7 '+f(tx+24)+',-4" fill="none" stroke="'+c.topHi+'" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>'};
PF.choker=function(S){var c=S.c,tx=S.tx;if(S.ch.id!=='friend')return '';
  return '<path d="M'+f(tx-12.6)+',-14 Q'+f(tx)+',-8.4 '+f(tx+12.6)+',-14 L'+f(tx+12.8)+',-9.6 Q'+f(tx)+',-3.4 '+f(tx-12.8)+',-9.6Z" fill="#14111a"/>'};
PF.pendant=function(S){var tx=S.tx;if(S.ch.id!=='friend')return '';
  return '<path d="M'+f(tx-12)+',-6 C'+f(tx-8)+',8 '+f(tx-3)+',12 '+f(tx)+',14 C'+f(tx+3)+',12 '+f(tx+8)+',8 '+f(tx+12)+',-6" fill="none" stroke="#8d8aa0" stroke-width=".9" opacity=".8"/>'+E(tx,-5.4,3.8,3.8,'#14111a')+E(tx,-5.4,2.5,2.5,'none',' stroke="#8d8aa0" stroke-width=".8"')};
PF.upper_arm=function(S){var c=S.c,D=S.dim,fr=S.ch.id==='friend',UA=D.UA;
  if(!fr)return '<path d="'+capF(UA,19,16)+'" fill="'+c.top+'"/><path d="M-9,'+(UA-5)+' Q0,'+(UA+3)+' 9,'+(UA-5)+'" fill="none" stroke="'+c.top2+'" stroke-width="3" opacity=".5"/><path d="M-6,6 L-6,'+(UA-8)+'" stroke="'+c.topHi+'" stroke-width="2.4" opacity=".3" stroke-linecap="round"/>';
  /* oversized tee sleeve: wide cone to mid upper arm, bare skin below */
  return '<path d="'+capF(UA,17,14)+'" fill="'+c.skin+'"/><path d="M-17,4 Q-17,-2 0,-2 Q17,-2 17,4 L20,46 Q0,53 -20,46 Z" fill="'+c.top+'"/><path d="M-19,44 Q0,51 19,44" fill="none" stroke="'+c.top2+'" stroke-width="3.4" opacity=".7"/><path d="M-11,8 L-13,38" stroke="'+c.topHi+'" stroke-width="2" opacity=".3" stroke-linecap="round"/>'};
PF.forearm=function(S){var c=S.c,D=S.dim,fr=S.ch.id==='friend',FA=D.FA;
  if(!fr)return '<path d="'+capF(FA,15,11)+'" fill="'+c.top+'"/><path d="M-9,'+(FA-18)+' Q0,'+(FA-12)+' 9,'+(FA-18)+' L8,'+(FA+1)+' L-8,'+(FA+1)+'Z" fill="'+c.skin+'" opacity="0"/><path d="M-8,'+(FA-4)+' Q0,'+(FA+2)+' 8,'+(FA-4)+'" fill="none" stroke="'+c.top2+'" stroke-width="4.2" stroke-linecap="round"/>'.replace('stroke-width="4.2"','stroke-width="4.2"');
  return '<path d="'+capF(FA,14.5,10.5)+'" fill="'+c.skin+'"/><path d="M-5,6 L-4,'+(FA-10)+'" stroke="'+c.skinSh+'" stroke-width="2" opacity=".35" stroke-linecap="round"/>'};
PF.hand=function(S,sd,type){var c=S.c;
  if(type==='grip')return '<path d="M-9.5,-3 L9.5,-3 C13.5,6 13,20 8,26 Q0,31 -8,26 C-13,20 -13.5,6 -9.5,-3Z" fill="'+c.skin+'"/><path d="M-6,14 L5,14 M-6,19 L5,19" stroke="'+c.skinSh+'" stroke-width="1.5" stroke-linecap="round" opacity=".55"/><g transform="scale('+sd+',1)"><path d="M6,2 C14,3 17,10 15,17 Q11,20 8,15 C7,11 6,7 6,2Z" fill="'+c.skin2+'"/></g>';
  return '<path d="M-8.6,-3 L8.6,-3 C12.6,8 12.6,28 7,38 Q0,44.5 -7,38 C-12.6,28 -12.6,8 -8.6,-3Z" fill="'+c.skin+'"/><path d="M-3.6,26 L-3.2,37 M3,26 L3.2,37" stroke="'+c.skinSh+'" stroke-width="1.5" stroke-linecap="round" opacity=".5"/><g transform="scale('+sd+',1)"><path d="M6.6,4 C14.5,6 17.5,15 15,23.5 Q11.5,28 8.6,22.6 C7.4,17.6 6.8,12 6.6,4Z" fill="'+c.skin2+'"/></g>'};
PF.pelvis=function(S,hs){var c=S.c,w=hs+25,fr=S.ch.id==='friend';
  return '<path d="M'+f(-w)+',-34 L'+f(w)+',-34 C'+f(w+1)+',-8 '+f(w-1)+',10 '+f(w-5)+',28 Q0,50 '+f(-w+5)+',28 C'+f(-w+1)+',10 '+f(-w-1)+',-8 '+f(-w)+',-34Z" fill="'+c.pants+'"/><path d="M-2,22 Q0,36 2,48" stroke="'+c.pants2+'" stroke-width="2" fill="none" opacity=".6"/>'};
PF.upper_leg=function(S,Ln){Ln=Ln||S.dim.UL;var c=S.c,fr=S.ch.id==='friend',a=fr?25:23,b=fr?20:16.5;
  return '<path d="M'+(-a)+',-8 C'+f(-a-.5)+','+f(Ln*.3)+' '+f(-b-2.5)+','+f(Ln*.72)+' '+f(-b)+','+f(Ln+4)+' Q0,'+f(Ln+10)+' '+f(b)+','+f(Ln+4)+' C'+f(b+2.5)+','+f(Ln*.72)+' '+f(a+.5)+','+f(Ln*.3)+' '+a+',-8 Z" fill="'+c.pants+'"/><path d="M-5,'+f(Ln-12)+' Q1,'+f(Ln-5)+' 8,'+f(Ln-11)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><path d="M-'+(a-5)+',12 C-'+(a-6)+','+f(Ln*.4)+' -'+(b-1)+','+f(Ln*.7)+' -'+(b-3)+','+f(Ln-6)+'" fill="none" stroke="'+c.pantsHi+'" stroke-width="3" opacity=".5" stroke-linecap="round"/>'};
PF.lower_leg=function(S,Ln){Ln=Ln||S.dim.LL;var c=S.c,fr=S.ch.id==='friend',hb=Ln-(fr?26:15),kw=fr?20:16.5,hw=fr?19.5:15.5;
  return '<path d="M'+(-kw)+',-6 C'+f(-kw-.5)+','+f(Ln*.26)+' '+f(-hw+.5)+','+f(Ln*.6)+' '+f(-hw)+','+f(hb)+' Q0,'+f(hb+7)+' '+f(hw)+','+f(hb)+' C'+f(hw-.5)+','+f(Ln*.6)+' '+f(kw+.5)+','+f(Ln*.26)+' '+kw+',-6 Z" fill="'+c.pants+'"/><path d="M'+(-hw)+','+f(hb-3)+' Q0,'+f(hb+4)+' '+hw+','+f(hb-3)+'" fill="none" stroke="'+c.pants2+'" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M-'+(kw-4)+',10 C-'+(kw-5)+','+f(Ln*.4)+' -'+(hw-3)+','+f(hb-30)+' -'+(hw-3)+','+f(hb-6)+'" fill="none" stroke="'+c.pantsHi+'" stroke-width="3" opacity=".45" stroke-linecap="round"/>'};
PF.foot=function(S){var c=S.c,o='';
  if(S.ch.id==='friend'){/* ankle boot, chunky sole; ankle pivot at origin, toe toward +x, sole bottom y=21 */
    o+='<path d="M-26,13 C-29,18 -27,22 -20,22 L38,22 C45,22 46,15 42,12 L-20,10Z" fill="'+c.sole+'"/>';
    o+='<path d="M-19,-34 L10,-34 C12,-26 12,-14 15,-9 C20,-6 36,-5 41,4 C44,9 42,13 36,14 L-23,14 C-27,14 -27,8 -26,2 C-25,-10 -20,-20 -19,-34Z" fill="'+c.shoe+'"/>';
    o+='<path d="M-19,-34 L10,-34 L10,-28 L-19,-28Z" fill="'+c.shoe2+'"/><path d="M-26,8 C-8,10 20,10 42,8 C43,11 41,14 36,14 L-23,14 C-27,14 -27,11 -26,8Z" fill="'+c.shoe2+'" opacity=".55"/>';
    o+='<path d="M22,-4 C31,-5 40,-1 42,5 C44,10 40,13 33,14 L25,14 C21,8 20,1 22,-4Z" fill="'+c.shoe2+'"/>';
    var k;for(k=0;k<4;k++)o+='<path d="M'+f(-5+k*3.6)+','+f(-26+k*5.6)+' L'+f(7+k*1.4)+','+f(-27+k*5.6)+'" stroke="'+c.shoeAcc+'" stroke-width="2.2" stroke-linecap="round"/>';
    o+='<path d="M-20,-30 C-21,-14 -26,0 -26,8" stroke="#3a3744" stroke-width="1.6" fill="none" opacity=".6"/>';
    return o}
  /* low sneaker (same construction as vadik, slimmer, sage accent) */
  o+='<path d="M-20,19 C-6,22 20,22 34,17 C38,15 41,12 42,9 L36,12 C24,17 0,18 -20,16 Z" fill="'+c.shoe2+'"/>';
  o+='<path d="M-25,11 C-27,17 -24,21 -17,21 L22,21 C31,21 38,17 43,8 L40,7 C34,13 26,15 18,15 L-20,15 C-23,15 -25,13 -25,11 Z" fill="'+c.sole+'"/>';
  o+='<path d="M-24,13 C-27,3 -26,-9 -19,-15 C-14,-18 -6,-18 -1,-16 L6,-12 C14,-7 21,-5 30,-5 C39,-4 44,3 42,9 C41,13 35,15 26,15 L-20,15 C-22,15 -24,14 -24,13 Z" fill="'+c.shoe+'"/>';
  o+='<path d="M-24,9 C-10,11 15,11 41,8 C41,11 37,14 30,15 L-20,15 C-23,15 -24,12 -24,9 Z" fill="'+c.shoe2+'" opacity=".45"/>';
  o+='<path d="M21,-4 C30,-5 39,-1 42,5 C44,10 40,14 32,15 L24,15 C20,9 19,2 21,-4 Z" fill="#f4f4ef"/><path d="M21,-4 C19,2 20,9 24,15" fill="none" stroke="'+c.shoe2+'" stroke-width="1.5" stroke-linecap="round"/>';
  o+='<path d="M-24,11 C-27,3 -26,-9 -19,-15 L-16,-16 C-19,-6 -19,3 -17,11 Z" fill="'+c.shoeAcc+'"/>';
  o+='<path d="M-18,-14 C-13,-19 -5,-19 1,-15 C-4,-12 -12,-11 -18,-14 Z" fill="#5d6a64"/>';
  o+='<path d="M4,-12 C6,-24 13,-28 19,-25 C21,-19 19,-12 16,-7 L6,-8 Z" fill="'+c.sole+'"/>';
  var k2;for(k2=0;k2<3;k2++){var x=2+k2*6.5,y=-9+k2*2.6;o+='<path d="M'+f(x-2.5)+','+f(y+4)+' L'+f(x+3)+','+f(y-2.5)+'" stroke="'+c.shoeAcc+'" stroke-width="2.2" stroke-linecap="round"/>'}
  return o};
PF.phone=function(S){return '<rect x="-12" y="-26" width="24" height="46" rx="5" fill="#15151b"/><rect x="-10" y="-23" width="20" height="40" rx="3" fill="#2d4a6a"/><path d="M-10,-23 L10,-23 L10,-8 L-10,6Z" fill="#8fb4d6" opacity=".28"/><circle cx="0" cy="13" r="1.4" fill="#cfe4f4" opacity=".6"/>'};
PF.mug=function(S){return '<path d="M-14,-10 L14,-10 L13,18 Q0,22 -13,18Z" fill="#cdd1da"/><path d="M-14,-10 L14,-10 L14,-6 L-14,-6Z" fill="#e8ebf0"/><path d="M-8,-8 L-8,16" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><path d="M13,-4 C22,-5 23,10 13,10" fill="none" stroke="#cdd1da" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="0" cy="-9" rx="12" ry="2.6" fill="#4a2f26"/>'};
PF.chair=function(S,h){h=h||216;var c='#4a4f63',c2='#383c4d',c3='#2a2d3a';
  return '<path d="M-58,-150 Q-58,-164 -44,-164 L44,-164 Q58,-164 58,-150 L56,6 L-56,6Z" fill="'+c+'"/><path d="M-58,-150 Q-58,-164 -44,-164 L44,-164 Q58,-164 58,-150 L57,-140 L-57,-140Z" fill="'+c2+'" opacity=".5"/><rect x="-5" y="30" width="10" height="'+(h-36)+'" fill="'+c3+'"/><path d="M-68,'+(h-10)+' L68,'+(h-10)+' L54,'+(h-1)+' L-54,'+(h-1)+'Z" fill="'+c3+'"/><circle cx="-66" cy="'+(h-2)+'" r="6" fill="#20222c"/><circle cx="66" cy="'+(h-2)+'" r="6" fill="#20222c"/><circle cx="0" cy="'+(h+1)+'" r="6" fill="#20222c"/>'};
PF.chair_seat=function(S){return '<path d="M-66,16 Q-66,8 -54,8 L54,8 Q66,8 66,16 L66,30 Q66,38 54,38 L-54,38 Q-66,38 -66,30Z" fill="#555b72"/><path d="M-60,12 L60,12" stroke="#7a819a" stroke-width="2" opacity=".5" stroke-linecap="round"/>'};
PF.torso_side=function(S){var c=S.c,hy=S.dim.hemY,fr=S.ch.id==='friend',w=fr?31:27;
  return '<path d="M-9,-6 C-20,-2 '+(-w)+',10 '+(-w-1)+',28 C'+(-w-2)+',60 '+(-w+2)+',95 '+(-w+1)+',126 C'+(-w)+',150 '+(-w-2)+',175 '+(-w-2)+','+hy+' Q0,'+(hy+5)+' '+(w+2)+','+hy+' C'+(w+3)+',170 '+(w+1)+',150 '+w+',126 C'+(w+1)+',100 '+(w+3)+',70 '+(w+1)+',48 C'+w+',28 22,8 10,-6 Q0,6 -9,-6Z" fill="'+c.top+'"/><path d="M-8,-4 C-18,0 -24,10 -25,26 C-26,60 -24,95 -23,126 L-23,'+hy+' L-30,'+hy+' C-32,170 -30,150 -31,126 C-30,95 -33,60 -31,28 C-30,10 -20,-2 -9,-6Z" fill="'+c.top2+'" opacity=".5"/>'+(fr?L([[10,64],[16,70]],2,c.print)+L([[16,64],[10,70]],2,c.print):'')};
PF.pelvis_side=function(S){var c=S.c;return '<path d="M-27,-34 L27,-34 C29,-8 24,24 16,38 Q0,48 -16,38 C-24,24 -29,-8 -27,-34Z" fill="'+c.pants+'"/>'};

/* ---------------------------------------------------------------- assembler */
function fstate(st,CH){var D=CH.dim,p=st.pose,e=st.expr,hd=p.head||{},yaw=cF(hd.yaw||0,-1,1),a=yaw*PIF/2,ca=Math.cos(a),sa=Math.sin(a),sg=yaw<0?-1:1,as=Math.abs(sa),gz=st.gaze||{x:0,y:0,cam:0};
  var X={},k;for(k in EX0F)X[k]=nF(e[k],EX0F[k]);
  var S={ch:CH,c:CH.pal,dim:D,uid:st.uid||'f',e:e,X:X,p:p,yaw:yaw,ca:ca,sa:sa,sg:sg,as:as,key:st.key||1,mouth:st.mouth||0,t:st.t||0};
  S.fx=sa*(CH.g14.ex)*.62;
  S.gxu=cF(((gz.cam?-sa*.85:gz.x)||0)*3.4+X.gx*3.4,-4.6,4.6);S.gyu=cF(((gz.cam?0:gz.y)||0)*2.4+X.gy*2.4,-3,3.2);S.pitch=f(S.gyu*.6);
  S.eOpen=1-(1-cF(X.mo,0,1))*(1-cF(S.mouth,0,1));
  S.tc=Math.cos((p.turn||0)*PIF/2);S.sw=D.sw*(.42+.58*S.tc);S.tx=(p.turn||0)*13;S.shr=nF(p.sh,0);
  return S}
function headMarkup(S,front){/* head frame -> actor space */
  var D=S.dim,p=S.p,hd=p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0),hy=D.neckY+nF(hd.dy,0);
  var tf='translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+') scale('+HSC+')';
  var prof=S.as>=.75;
  if(front==='back')return '<g transform="'+tf+'">'+(prof?'':shF(S,PF.hair_back(S),1))+'</g>';
  if(prof)return '<g transform="'+tf+(S.sg<0?' scale(-1,1)':'')+'">'+shF(S,PF.head_profile(S),1)+'</g>';
  return '<g transform="'+tf+'">'+shF(S,PF.skull(S),1)+PF.ear(S)+shF(S,PF.hair_front(S),1)+'</g>'}
function headBackProfile(S){var D=S.dim,hd=S.p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0),hy=D.neckY+nF(hd.dy,0);return ''}
function armsOf(S,p,sh0,tx,sw,lean){var D=S.dim,shy=D.shY-S.shr,SL=[tx-sw+12,shy],SR=[tx+sw-12,shy],arms=[],t=S.t,fid=nF(p.fid,0);
  [["L",SL,-1],["R",SR,1]].forEach(function(A){var sp=p[A[0]]||{},Sh=A[1],sd=A[2],h=(sp.h||[sd*58,198]).slice();
    if(fid&&A[0]==="R"){h[0]+=fid*2.5*Math.sin(t*5.3+1);h[1]+=fid*2*Math.cos(t*4.1)}
    var fq=nF(sp.fsh,1),r=ikF(Sh,h,D.UA,D.FA*fq,nF(sp.bend,sd*-1));arms.push({nm:A[0],Sh:Sh,el:r.e,H:r.h,sp:sp,sd:sd,fq:fq})});
  return arms}
function propFor(S,A,st){var pr=st.prop;if(!pr||!pr.on||(pr.hand||'R')!==A.nm)return '';
  var fdx=A.H[0]-A.el[0],fdy=A.H[1]-A.el[1],fl=Math.sqrt(fdx*fdx+fdy*fdy)||1,at=pr.at||[0,0],cx=A.H[0]+fdx/fl*(pr.on==='mug'?14:18)+at[0],cy=A.H[1]+fdy/fl*(pr.on==='mug'?14:18)+at[1],rot=nF(pr.rot,0);
  return shF(S,'<g transform="'+trF(cx,cy,rot)+'">'+(pr.on==='mug'?PF.mug(S):PF.phone(S))+'</g>',1)}
function drawFront(S,st){var D=S.dim,c=S.c,p=S.p,u=S.uid,o='',t=S.t,shk=st.shake||{x:0,y:0,r:0},CH=S.ch;
  var sit=nF(p.sit,0),dy=sit*D.sitDy,lean=nF(p.lean,0),sgf=((p.head&&p.head.yaw)||p.turn)<0?-1:1,rotU=lean*5*sgf+shk.r,l16=lean*14,scU=1+lean*.05;
  var lg=p.legs||{},hs=nF(lg.spread,D.hs),asp=nF(lg.ank,D.ank),kin=nF(lg.kin,1),kk=nF(lg.k,0),fsh=nF(lg.fsh,1),fs=nF(lg.fs,1),fr0=D.UL/(D.UL+D.LL);
  if(sit>.01)o+=shF(S,'<g transform="translate(0,'+f(D.hipY+dy)+')">'+PF.chair(S,D.floor-D.hipY-dy)+PF.chair_seat(S)+'</g>',1);
  if(st.stand!==false){
    [-1,1].forEach(function(sd){var fd=sd<0?nF(lg.fl,-1):nF(lg.fr,1),gx=sd*asp+fd*5,gy=D.ankleY+20*fs;
      o+='<ellipse cx="'+f(gx+fd*3)+'" cy="'+f(gy+2)+'" rx="'+f(40*fs)+'" ry="7" fill="#0b1020" opacity=".5" filter="url(#'+u+'cb)"/><ellipse cx="'+f(gx+fd*2)+'" cy="'+f(gy-.5)+'" rx="'+f(28*fs)+'" ry="3.4" fill="#0b1020" opacity=".65" filter="url(#'+u+'cb2)"/>'});
    var hy0=D.hipY+dy;
    o+=shF(S,'<g transform="translate(0,'+f(hy0)+')">'+PF.pelvis(S,hs)+'</g>',1);
    [-1,1].forEach(function(sd){var hip=[sd*hs,hy0],an=[sd*asp,D.ankleY-kk],kn;
      if(sit>.01){kn=[sd*(hs+4+sit*3),hy0+40*sit+(1-sit)*(an[1]-hy0)*fr0]}else kn=[hip[0]+(an[0]-hip[0])*fr0-sd*(kin+kk*.8),hip[1]+(an[1]-hip[1])*fr0-kk*.4];
      var L1=Math.hypot(kn[0]-hip[0],kn[1]-hip[1]),L2=Math.hypot(an[0]-kn[0],an[1]-kn[1]),fd=sd<0?nF(lg.fl,-1):nF(lg.fr,1),q34=sd<0?.88:.8,rt=sd<0?-11:12;
      o+=shF(S,'<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rt)+') scale('+f(fd*fsh*fs*q34)+','+f(fs)+')">'+PF.foot(S)+'</g>',1);
      o+=shF(S,'<g transform="'+trF(kn[0],kn[1],angF(kn,an))+'">'+PF.lower_leg(S,L2)+'</g>',1);
      o+=shF(S,'<g transform="'+trF(hip[0],hip[1],angF(hip,kn))+(sit>.01?' scale('+f(1+.1*sit)+',1)':'')+'">'+PF.upper_leg(S,L1)+'</g>',1)})}
  o+='<g transform="translate(0,'+f(dy)+') translate(0,'+D.hipY+') rotate('+f(rotU)+') translate(0,-'+D.hipY+') translate(0,'+f(l16)+') scale('+f(scU)+')">';
  var arms=armsOf(S,p,0,S.tx,S.sw);
  o+=headMarkup(S,'back');
  o+=shF(S,PF.torso(S),0)+shF(S,PF.neck(S),1)+PF.collar(S)+PF.choker(S)+PF.pendant(S);
  arms.forEach(function(A){o+=shF(S,'<g transform="'+trF(A.Sh[0],A.Sh[1],angF(A.Sh,A.el))+'">'+PF.upper_arm(S)+'</g>',1);o+=shF(S,'<g transform="'+trF(A.el[0],A.el[1],angF(A.el,A.H))+(A.fq<1?' scale('+f(1+.22*(1-A.fq))+','+f(A.fq)+')':'')+'">'+PF.forearm(S)+'</g>',1)});
  o+=headMarkup(S,'front');
  arms.forEach(function(A){o+=propFor(S,A,st)});
  arms.forEach(function(A){var sp=A.sp,s=nF(sp.s,1),ty=(st.prop&&st.prop.on&&(st.prop.hand||'R')===A.nm)?'grip':(sp.hand==='grip'?'grip':'mitten');
    o+=shF(S,'<g transform="'+trF(A.H[0],A.H[1],angF(A.el,A.H)+nF(sp.rot,0),s)+'">'+PF.hand(S,A.sd>0?-1:1,ty)+'</g>',1)});
  o+='</g>';return o}
function drawSide(S,st){var D=S.dim,c=S.c,p=S.p,u=S.uid,o='',gt=p.gait||{},fc=nF(p.face,1),hip=[nF(p.hipx,0),D.hipY],CH=S.ch,sh0='<g filter="url(#'+u+'dk)">';
  function leg(an,rot,dark){var kn,r=ikF(hip,an,D.UL,D.LL,-1);kn=r.e;var m='<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rot)+')">'+PF.foot(S)+'</g>'+'<g transform="'+trF(kn[0],kn[1],angF(kn,an))+'">'+PF.lower_leg(S,D.LL)+'</g>'+'<g transform="'+trF(hip[0],hip[1],angF(hip,kn))+'">'+PF.upper_leg(S,D.UL)+'</g>';
    return dark?sh0+shF(S,m,1)+'</g>':shF(S,m,1)}
  var aN=[hip[0]+nF(gt.nx,50),D.ankleY+nF(gt.ny,0)],aF=[hip[0]+nF(gt.fx,-44),D.ankleY+nF(gt.fy,-16)];
  o+='<ellipse cx="'+f(hip[0]+4)+'" cy="'+(D.floor+2)+'" rx="86" ry="8" fill="#0b1020" opacity=".5" filter="url(#'+u+'cb)"/>';
  o+='<g transform="scale('+fc+',1)">';
  var lean=nF(p.lean,0),shy=D.shY-S.shr,SH=[2,shy+2];
  function arm(sp,dark){var r=ikF(SH,sp.h,D.UA,D.FA,nF(sp.bend,-1)),m='<g transform="'+trF(SH[0],SH[1],angF(SH,r.e))+'">'+PF.upper_arm(S)+'</g><g transform="'+trF(r.e[0],r.e[1],angF(r.e,r.h))+'">'+PF.forearm(S)+'</g><g transform="'+trF(r.h[0],r.h[1],angF(r.e,r.h)+nF(sp.rot,0))+'">'+PF.hand(S,1,'mitten')+'</g>';return dark?sh0+shF(S,m,1)+'</g>':shF(S,m,1)}
  o+=leg(aF,nF(gt.frot,0),true);
  o+=arm(p.L||{h:[10,180]},true);
  o+=shF(S,'<g transform="translate('+f(hip[0])+','+D.hipY+')">'+PF.pelvis_side(S)+'</g>',1);
  o+=leg(aN,nF(gt.nrot,0),false);
  o+='<g transform="translate(0,'+D.hipY+') rotate('+f(lean*4)+') translate(0,-'+D.hipY+')">';
  /* head back hair (profile) + body */
  var hd=p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0)+4,hy=D.neckY+nF(hd.dy,0),tf='translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+') scale('+HSC+')';
  var S2=S;
  o+=shF(S,PF.torso_side(S),0);
  o+=shF(S,'<path d="M-9,-46 L9,-46 L10,2 Q0,8 -10,2Z" fill="url(#'+(CH.id==='friend'?'fSkF':'fSkW')+')"/>',1);
  if(CH.id==='friend')o+='<path d="M-10,-14 Q0,-9 10,-14 L10.4,-9.6 Q0,-4.4 -10.4,-9.6Z" fill="#14111a"/>'+E(1,-2,3,3,'#14111a');
  o+=arm(p.R||{h:[-10,180]},false);
  var SP=S;SP.as=1;SP.sg=1;
  o+='<g transform="'+tf+'">'+(CH.id==='kristina'?'':'')+shF(S,PF.head_profile(S),1)+'</g>';
  o+='</g></g>';return o}
function drawChar(CH){return function(st,ch){var S=fstate(st,CH),shk=st.shake||{x:0,y:0,r:0};
  var o=F22defs(S.uid)+'<g transform="translate('+f(shk.x)+','+f(shk.y)+')">';
  o+=(S.p.view==='side')?drawSide(S,st):drawFront(S,st);return o+'</g>'}}
HFg.RIGS.kristina=drawChar(CHW);HFg.RIGS.friend=drawChar(CHF);
HFg.CHARS.kristina={paper:true,rig:'kristina',body_type:'f',skin:CHW.pal.skin,hr:46,vr:56};
HFg.CHARS.friend={paper:true,rig:'friend',body_type:'f',skin:CHF.pal.skin,hr:44,vr:56};
C.CHW=CHW;C.CHF=CHF;C.PF=PF;C.fstate=fstate;
/* ===== ROUND 23 (rig_f 1.1 draft): walk fix, mouths, female bodies, real hands, sit + chair, back view.
   Overlay on r22 (same IIFE): redeclared functions win, PF.* parts and dims are overridden. */
function setDim(CH,o){for(var k in o)CH.dim[k]=o[k]}
setDim(CHW,{sw:42,shY:27,UA:83,FA:77,hemY:170,waistY:122,ww:31,hemW:40,hips:55,wTop:36,hs:19,ank:26,legA:36.5,legB:14.4,calfW:15.8,ankW:9.2,kneeW:14.2,neckY:-33,bw:47.9,rb:40.8,ap:37.5});
setDim(CHF,{sw:43,shY:28,UA:83,FA:77,hemY:236,waistY:124,ww:31,hemW:47.5,hips:54.5,wTop:37,hs:19,ank:27,legA:36,legB:15.6,calfW:16.6,ankW:14,kneeW:15.4,neckY:-33,bw:47.7,rb:41.8,ap:30.5});
HSC=1.109;
CHF.pal.top='#4c4a5a';CHF.pal.top2='#3b3947';CHF.pal.topHi='#625f72';CHF.pal.collarIn='#4a4756';
CHW.lipK=1.3;CHW.mwK=1.42;CHW.wideK=0;CHF.lipK=1;CHF.mwK=1;CHF.wideK=.3;

/* ---------------------------------------------------------------- mouths */
function mouthF(CH,X,e,mouth){var m=CH.o.mouth,lcy=-13.5,bst=CH.mwK||1,lk=CH.lipK||1,w0=m.mw*bst*X.mw,sm=m.sm+X.mc*3,k=Math.max(0,m.smirk+X.ms),full=m.full,lc=m.lip,lc2=m.lip2,pal=CH.pal,lau=X.happy>0&&X.shut>=.6;
  var soft=(lk>1&&!lau)?cF((.95-e)/.5,0,1):0;sm+=soft*1.0;k+=soft*.4;var ly=lcy-sm,ry=lcy-sm-k*2.2,s='';
  if(X.trap>0&&e>=.06)return trapMouth(X,e,lcy,w0,pal,lc);
  if(e<.06){s=mouthX({sm:sm,smirk:k,lip:lc,lip2:lc2,mw:w0*(1+.06*(lk-1)),full:full+(lk-1)*2.4,part:X.mp*(m.part||0)});
    if(lk>1)s+=E(w0*.14,lcy+sm+1.8,w0*.3,.8,'#fff0e4',' opacity=".55"')+E(-w0*.2,lcy+sm-3.4,w0*.12+1,.6,'#fff0e4',' opacity=".4"');
    return s}
  if(lk>1&&!lau&&e<.45){s=mouthX({sm:m.sm+X.mc*3,smirk:Math.max(0,m.smirk+X.ms)*.5,lip:lc,lip2:lc2,mw:w0*(1+.06*(lk-1))*(.92+.1*e),full:full+(lk-1)*2.4,part:cF(.5+(e-.06)*.5,.5,.7)});
    return s+E(w0*.14,lcy+sm+2,w0*.3,.8,'#fff0e4',' opacity=".5"')}
  var w=w0*(.84+.3*e+(CH.wideK||0)*Math.max(0,e-.45)),Hh=e*(lau?15.5:13.5)*(1-.3*soft),cA=lcy+sm+1.6,cB=cA+2*Hh,th=(3.6+full*.5)*lk*(lau?1.1:1)*(1+.14*soft),xl=-w+1.6,xr=w-1.6,yl=ly+.6,yr=ry+.6,u=uid();
  var inner='M'+f(xl)+','+f(yl)+' Q0,'+f(cA)+' '+f(xr)+','+f(yr)+' Q0,'+f(cB)+' '+f(xl)+','+f(yl)+'Z';
  s+='<defs><clipPath id="'+u+'"><path d="'+inner+'"/></clipPath></defs>'+P(inner,pal.mouthIn);
  var yA=(yl+yr)/4+cA/2,yB=yA+Hh;
  /* teeth: a thin strip only (upper), lower strip only at wide; auto from the opening, X.mt overrides */
  var tauto=lau?1:(e>=.4?cF((e-.35)*1.6,0,1)*(1-.35*soft):0),tt=X.mt>=0?X.mt:tauto,tg=X.mg>=0?X.mg:(e>=.6?cF((e-.5)*1.8,0,1):0);
  var thS=(lau?2.8:Math.min(2.6,1.1+(e-.4)*3.4))*(1-.3*soft);tg*=(1-soft);
  s+='<g clip-path="url(#'+u+')">';
  if(tt>0)s+='<path d="M'+f(xl-2)+','+f(yl-1)+' Q0,'+f(cA-1)+' '+f(xr+2)+','+f(yr-1)+' L'+f(xr+2)+','+f(yr+thS*tt)+' Q0,'+f(cA+thS*tt*1.9)+' '+f(xl-2)+','+f(yl+thS*tt)+'Z" fill="'+pal.teeth+'"/>';
  if(e>=.85&&!lau&&X.mt!==0)s+='<path d="M'+f(xl)+','+f(yl)+' Q0,'+f(cB)+' '+f(xr)+','+f(yr)+' Q0,'+f(cB-3.4)+' '+f(xl)+','+f(yl)+'Z" fill="'+pal.teeth+'" opacity=".92"/>';
  if(tg>0)s+=E(0,yB-1.4,w*(lau?.46:.36),Hh*(lau?.34:.24)*tg+.8,pal.tongue)+E(0,yB-2.8,w*.16,.9,'#e8909a',' opacity=".55"');
  s+='</g>';
  s+=P('M'+f(xr)+','+f(yr)+' Q0,'+f(cB)+' '+f(xl)+','+f(yl)+' Q0,'+f(cB+2*th)+' '+f(xr)+','+f(yr)+'Z',lc,' opacity=".97"');
  /* upper lip with a cupid's bow */
  var pk=(3.2+1.2*lk)*(lk>1?1:.72),dp=2.2+.9*lk,cy0=lcy+sm,kr=k*1.1;
  s+=P('M'+f(-w)+','+f(ly)+' Q'+f(-w*.52)+','+f(ly-pk*.6)+' '+f(-w*.2)+','+f(cy0-pk-1.2)+' Q'+f(-w*.08)+','+f(cy0-dp-.4)+' 0,'+f(cy0-dp)+' Q'+f(w*.08)+','+f(cy0-dp-.4-kr*.3)+' '+f(w*.2)+','+f(cy0-pk-1.2-kr)+' Q'+f(w*.52)+','+f(ry-pk*.6)+' '+f(w)+','+f(ry)+' Q0,'+f(cA)+' '+f(-w)+','+f(ly)+'Z',lc2);
  /* warm gloss */
  s+=E(w*.16,yB+th*.55+.4,w*.3,.95,'#fff1e2',' opacity=".62"')+E(-w*.18,yB+th*.6,w*.1+1,.6,'#fff1e2',' opacity=".4"')+E(-w*.2,cy0-pk-.2,w*.14+.8,.7,'#fff1e2',' opacity=".5"');
  s+=L([[w,ry],[w+1.8,ry-2]],1.3,'#b0685e',' opacity=".75"')+L([[-w,ly],[-w-1.6,ly-1.2]],1.2,'#b0685e',' opacity=".55"');
  return s}

/* 1.0.1: flat open (trapezoid) mouth for panic: X.trap, X.lt (lower teeth strip), X.pale (cool cheek shade), X.irs (iris scale), second sweat drop when X.sweat>1 */
function trapMouth(X,e,lcy,w0,pal,lc){var w=w0*(.86+.22*e),Hh=3+Math.min(1,e)*9.5,yT=lcy-.2,cy0=yT+2.4+X.trap*.6,wB=w*.72,yb=yT+Hh,u=uid(),s='',i;
  var inner='M'+f(-w)+','+f(cy0)+' Q0,'+f(yT-1.2)+' '+f(w)+','+f(cy0)+' L'+f(wB)+','+f(yb)+' Q0,'+f(yb+2.6)+' '+f(-wB)+','+f(yb)+'Z';
  s+='<defs><clipPath id="'+u+'"><path d="'+inner+'"/></clipPath></defs>'+P(inner,pal.mouthIn);
  if(X.lt>0){s+='<g clip-path="url(#'+u+')"><path d="M'+f(-w)+','+f(yb-4.4)+' L'+f(w)+','+f(yb-4.4)+' L'+f(w)+','+f(yb+3)+' L'+f(-w)+','+f(yb+3)+'Z" fill="'+pal.teeth+'"/>';
    for(i=-3;i<=3;i++)s+=L([[i*wB*.28,yb-4.4],[i*wB*.28,yb-.4]],.7,'#b9aca2',' opacity=".8"');
    s+='<path d="M'+f(-w)+','+f(yb-4.4)+' L'+f(w)+','+f(yb-4.4)+'" stroke="#3a1830" stroke-width=".8" opacity=".6"/></g>'}
  s+='<path d="M'+f(-w)+','+f(cy0)+' Q0,'+f(yT-1.2)+' '+f(w)+','+f(cy0)+'" stroke="'+lc+'" stroke-width="2.9" stroke-linecap="round" fill="none"/>';
  s+=L([[-w,cy0],[-wB,yb]],1.6,lc,' opacity=".85"')+L([[w,cy0],[wB,yb]],1.6,lc,' opacity=".85"');
  s+='<path d="M'+f(-wB)+','+f(yb)+' Q0,'+f(yb+2.6)+' '+f(wB)+','+f(yb)+'" stroke="'+lc+'" stroke-width="3.2" stroke-linecap="round" fill="none"/>';
  s+=E(0,yb+7.5,w*.65,2,'#b78478',' opacity=".28"');
  return s}
/* ---------------------------------------------------------------- real hands: palm + 4 grouped fingers + thumb, pivot at the wrist (origin) */
PF.hand=function(S,sd,type){var c=S.c,sk=c.skin,sh=c.skinSh,s2=c.skin2,o='',i;
  if(type==='grip'){
    o+='<g transform="scale('+sd+',1)"><path d="M4.6,1 C11,2 14.6,7.4 13.4,13.4 Q10.4,16.2 8,12Z" fill="'+s2+'"/></g>';
    o+='<path d="M-6,-3 L6,-3 C8.4,4 9.4,11 8.8,17.4 Q0,23 -8.8,17.4 C-9.4,11 -8.4,4 -6,-3Z" fill="'+sk+'"/>';
    for(i=0;i<4;i++)o+='<rect x="'+f(-8.8+i*.5)+'" y="'+f(5+i*4.1)+'" width="17.4" height="4.8" rx="2.4" fill="'+sk+'"/><path d="M'+f(-7.4+i*.5)+','+f(9.5+i*4.1)+' L'+f(7.6)+','+f(9.5+i*4.1)+'" stroke="'+sh+'" stroke-width=".9" opacity=".45"/>';
    o+='<g transform="scale('+sd+',1)"><path d="M3,.5 C9.4,1 13.4,5.6 12.4,10.6 Q9.8,12.4 7.4,9.6 C5.2,7.6 3.8,4.6 3,.5Z" fill="'+sk+'"/></g>';
    return o}
  /* smaller hand: palm + 4 slender grouped fingers + thumb, wrist pivot at the origin */
  o+='<g transform="scale('+sd+',1)"><path d="M4,3 C8.6,4 13.4,9.4 14.4,15.6 Q14.6,20.4 11.6,20.2 Q9,19.8 8.4,15.8 C7.6,11.8 6,8.6 3.8,6.6Z" fill="'+s2+'"/></g>';
  o+='<path d="M-5.6,-3 L5.6,-3 C7.4,2.6 8.2,8 8,13 L-8,13 C-8.2,8 -7.4,2.6 -5.6,-3Z" fill="'+sk+'"/>';
  var xs=[-5.6,-1.9,1.9,5.6],ls=[12.4,16.4,15.4,11.8],an=[5,1.5,-1.5,-5];
  for(i=0;i<4;i++){var x=xs[i],l=ls[i];o+='<g transform="rotate('+an[i]+' '+x+' 11)"><path d="M'+f(x-1.85)+',11 L'+f(x-1.75)+','+f(11+l-1.8)+' A1.8,1.8 0 0 0 '+f(x+1.75)+','+f(11+l-1.8)+' L'+f(x+1.85)+',11Z" fill="'+sk+'"/></g>'}
  for(i=0;i<3;i++){var xm=(xs[i]+xs[i+1])/2;o+='<path d="M'+f(xm)+',12 L'+f(xm-(an[i]+an[i+1])*.04)+','+f(10+ls[i+1]*.78)+'" stroke="'+sh+'" stroke-width=".8" stroke-linecap="round" opacity=".5"/>'}
  o+='<path d="M-5,3 Q0,5.2 5,3" fill="none" stroke="'+sh+'" stroke-width="1" opacity=".22"/>';
  return o};
/* ---------------------------------------------------------------- arms: slim, sloped */
PF.upper_arm=function(S){var c=S.c,D=S.dim,fr=S.ch.id==='friend',UA=D.UA;
  if(!fr)return '<path d="'+capF(UA,17,13.4)+'" fill="'+c.top+'"/><path d="M-6.6,'+(UA-4)+' Q0,'+(UA+2)+' 6.6,'+(UA-4)+'" fill="none" stroke="'+c.top2+'" stroke-width="2.6" opacity=".5"/><path d="M-5.2,8 L-5.2,'+(UA-10)+'" stroke="'+c.topHi+'" stroke-width="2.4" opacity=".3" stroke-linecap="round"/>';
  return '<path d="'+capF(UA,15.4,12.6)+'" fill="'+c.skin+'"/><path d="M-16.5,6 C-16.5,-5 -9,-8.4 0,-8.4 C9,-8.4 16.5,-5 16.5,6 L19.6,42 Q0,48 -19.6,42 Z" fill="'+c.top+'"/><path d="M-19.2,40.6 Q0,46.6 19.2,40.6" fill="none" stroke="'+c.top2+'" stroke-width="3" opacity=".7"/><path d="M-11,4 L-13,34" stroke="'+c.topHi+'" stroke-width="2" opacity=".3" stroke-linecap="round"/>'};
PF.forearm=function(S){var c=S.c,D=S.dim,fr=S.ch.id==='friend',FA=D.FA;
  if(!fr)return '<path d="'+capF(FA,13.4,9.6)+'" fill="'+c.top+'"/><path d="M-4.8,'+(FA-3)+' Q0,'+(FA+2)+' 4.8,'+(FA-3)+'" fill="none" stroke="'+c.top2+'" stroke-width="3.4" stroke-linecap="round"/>';
  return '<path d="'+capF(FA,13,9.6)+'" fill="'+c.skin+'"/><path d="M-4,6 L-3.4,'+(FA-10)+'" stroke="'+c.skinSh+'" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>'};
PF.neck=function(S){var c=S.c,tx=S.tx;
  return '<path d="M'+f(tx-10.8)+',-52 L'+f(tx+10.8)+',-52 C'+f(tx+10.8)+',-24 '+f(tx+11.6)+',-8 '+f(tx+17)+',-2 L'+f(tx+13)+',4 Q'+f(tx)+',9 '+f(tx-13)+',4 L'+f(tx-17)+',-2 C'+f(tx-11.6)+',-8 '+f(tx-10.8)+',-24 '+f(tx-10.8)+',-52 Z" fill="'+c.skin+'"/><path d="M'+f(tx-11)+',-30 L'+f(tx+11)+',-30 L'+f(tx+11.6)+',-14 Q'+f(tx)+',-7 '+f(tx-11.6)+',-14 Z" fill="'+c.skinSh+'" opacity=".55"/>'};
/* ---------------------------------------------------------------- torso: shoulders slope, waist, hip flare (friend) / tucked soft knit (Kristina) */
function torsoPath(S){var D=S.dim,sw=S.sw,tx=S.tx,sh_=S.shr,hy=D.hemY,wy=D.waistY,tc=.5+.5*S.tc,kw=sw/D.sw,ww=D.ww*tc,hw=D.hemW*tc,fr=D.tee,rb=D.rb*kw,bw=D.bw*kw;
  var segs=[],P0=[-11.4,-14];
  segs.push([[-13,-7],[-22,-3],[-30,6-sh_*.5]]);
  segs.push([[-sw+9,11-sh_],[-sw+2,18-sh_],[-sw,30-sh_]]);
  segs.push([[-sw-.3,40],[-rb-.3,46],[-rb,54]]);
  segs.push([[-rb-1.2,62],[-bw-1,69],[-bw,78]]);
  segs.push([[-bw+.4,90],[-ww-5.5,wy-24],[-ww,wy]]);
  if(fr)segs.push([[-ww-2,wy+26],[-hw+1.5,hy-58],[-hw,hy]]);else segs.push([[-ww-.8,wy+12],[-hw-2,hy-16],[-hw,hy]]);
  function X(p){return f(tx+p[0])+','+f(p[1])}function M(p){return f(tx-p[0])+','+f(p[1])}
  var d='M'+X(P0),i;for(i=0;i<segs.length;i++)d+=' C'+X(segs[i][0])+' '+X(segs[i][1])+' '+X(segs[i][2]);
  d+=' Q'+f(tx)+','+f(hy+(fr?7:3))+' '+M(segs[segs.length-1][2]);
  for(i=segs.length-1;i>=0;i--){var st=i?segs[i-1][2]:P0;d+=' C'+M(segs[i][1])+' '+M(segs[i][0])+' '+M(st)}
  return d+' Q'+f(tx)+',8 '+X(P0)+' Z'}
/* half-width profile of the garment at height y (front view) */
function torsoW(S,y){var D=S.dim,kw=S.sw/D.sw,tc=.5+.5*S.tc,K=[[30,S.sw],[54,D.rb*kw],[78,D.bw*kw],[D.waistY,D.ww*tc],[D.hemY,D.hemW*tc]],i;
  if(y<=K[0][0])return K[0][1];for(i=1;i<K.length;i++)if(y<=K[i][0]){var t=(y-K[i-1][0])/(K[i][0]-K[i-1][0]);t=t*t*(3-2*t);return K[i-1][1]+(K[i][1]-K[i-1][1])*t}return K[K.length-1][1]}
PF.torso=function(S){var c=S.c,tx=S.tx,u=S.uid,d=torsoPath(S),D=S.dim,hy=D.hemY,fr=S.ch.id==='friend',kx=S.key<0?-1:1,sw=S.sw,back=nF(S.p.back,0),tc=.5+.5*S.tc,wy=D.waistY,ww=D.ww*tc;S.torsoPath=d;
  var o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.top+'"/>';
  o+='<g clip-path="url(#'+u+'tc)"><path d="M'+f(tx+kx*sw*.2)+',-6 C'+f(tx+kx*sw*.5)+',60 '+f(tx+kx*sw*.42)+',160 '+f(tx+kx*sw*.45)+',250 L'+f(tx+kx*100)+',250 L'+f(tx+kx*100)+',-6 Z" fill="'+c.top2+'" opacity=".38" filter="url(#'+u+'bl)"/>';
  o+='<path d="M'+f(tx-70)+','+(wy-8)+' Q'+f(tx)+','+(wy+1)+' '+f(tx+70)+','+(wy-8)+' L'+f(tx+70)+','+(wy+14)+' Q'+f(tx)+','+(wy+22)+' '+f(tx-70)+','+(wy+14)+'Z" fill="'+c.top2+'" opacity=".2"/>';
  o+='<path d="M'+f(tx-100)+','+(hy-14)+' Q'+f(tx)+','+(hy-9)+' '+f(tx+100)+','+(hy-14)+' L'+f(tx+100)+','+(hy+12)+' L'+f(tx-100)+','+(hy+12)+' Z" fill="'+c.top2+'" opacity="'+(fr?.5:.42)+'"/>';
  if(!back){var kw=S.sw/D.sw,bw=D.bw*kw,ax=bw*.47,K_=fr?.7:1,bo=fr?.2:.3,tn_=nF(S.p.turn,0),cxo=tn_*30;
    /* bust: soft crescent shadow under each side, a gentle fold below it, 2-3 horizontal tension folds from the side seam toward the apex */
    [-1,1].forEach(function(sd){var cx=tx+cxo+sd*ax*(1+(sd*tn_>0?-.18:.14)*Math.abs(tn_)*3);
      o+='<path d="M'+f(cx-sd*ax*.52)+',90 Q'+f(cx)+','+f(103+K_*2)+' '+f(cx+sd*(bw-ax)*1.02)+',90 Q'+f(cx+sd*(bw-ax)*.7)+','+f(95+K_*7)+' '+f(cx)+','+f(96+K_*9)+' Q'+f(cx-sd*ax*.4)+',95 '+f(cx-sd*ax*.52)+',90Z" fill="'+c.top2+'" opacity="'+f(bo+.12)+'" filter="url(#'+u+'bl)"/>';
      o+='<path d="M'+f(cx-sd*ax*.46)+','+f(92+K_)+' Q'+f(cx)+','+f(99+K_*3)+' '+f(cx+sd*(bw-ax)*.92)+','+f(90+K_)+'" fill="none" stroke="'+c.top2+'" stroke-width="2" stroke-linecap="round" opacity="'+f(.2+(fr?0:.06))+'"/>';
      [[70,0],[77,1],[84,2]].forEach(function(r){if(fr&&r[1]>1)return;var y=r[0],x1=tx+sd*(bw-1.5),x2=tx+sd*(ax+3+r[1]*2.4);
        o+='<path d="M'+f(x1)+','+f(y-1)+' Q'+f((x1+x2)/2)+','+f(y+2.4)+' '+f(x2)+','+f(y+1.4)+'" fill="none" stroke="'+c.top2+'" stroke-width="1.7" stroke-linecap="round" opacity="'+f(fr?.14:.2)+'"/>'});
      if(!fr)o+='<path d="M'+f(cx+sd*ax*.2)+',68 Q'+f(cx+sd*ax*.5)+',76 '+f(cx+sd*ax*.32)+',86" fill="none" stroke="'+c.topHi+'" stroke-width="2.6" stroke-linecap="round" opacity=".16" filter="url(#'+u+'bl)"/>'})}
  if(!fr){var x,yy,pp;for(x=-38;x<=38;x+=6.5){pp=[];for(yy=36;yy<=hy-4;yy+=14)pp.push([tx+x/D.sw*torsoW(S,yy)+nF(S.p.turn,0)*30*(1-Math.pow(x/D.sw,2)),yy]);
      o+='<path d="M'+f(pp[0][0])+','+f(pp[0][1])+crp(pp)+'" fill="none" stroke="'+c.top2+'" stroke-width="1.1" opacity=".2"/>'}
    o+='<path d="M'+f(tx-44)+','+(hy-12)+' Q'+f(tx)+','+(hy-5)+' '+f(tx+44)+','+(hy-12)+'" fill="none" stroke="'+c.topHi+'" stroke-width="2" opacity=".35"/>';
    if(back)o+=L([[tx,10],[tx,hy-6]],1.4,c.top2,' opacity=".3"')}
  else{o+='<path d="M'+f(tx-sw*.6)+',80 C'+f(tx-sw*.5)+',112 '+f(tx-sw*.44)+',160 '+f(tx-sw*.5)+',226" stroke="'+c.topHi+'" stroke-width="2.4" fill="none" opacity=".24"/><path d="M'+f(tx+16)+',84 C'+f(tx+22)+',116 '+f(tx+26)+',170 '+f(tx+28)+',228" stroke="'+c.top2+'" stroke-width="2" fill="none" opacity=".4"/>';
    /* half tuck / knot gather pulling the tee in at the waist */
    o+='<path d="M'+f(tx-ww-2)+','+(wy+2)+' Q'+f(tx-ww+9)+','+(wy+9)+' '+f(tx-ww+18)+','+(wy+26)+'" stroke="'+c.top2+'" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".55"/><path d="M'+f(tx-ww-1)+','+(wy+12)+' Q'+f(tx-ww+8)+','+(wy+16)+' '+f(tx-ww+14)+','+(wy+36)+'" stroke="'+c.top2+'" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".42"/><path d="M'+f(tx-ww+2)+','+(wy+4)+' Q'+f(tx-ww+12)+','+(wy+12)+' '+f(tx-ww+19)+','+(wy+22)+'" stroke="'+c.topHi+'" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>';
    o+='<path d="M'+f(tx-70)+','+(hy-12)+' Q'+f(tx)+','+(hy-6)+' '+f(tx+70)+','+(hy-12)+' L'+f(tx+70)+','+(hy+14)+' L'+f(tx-70)+','+(hy+14)+'Z" fill="'+c.top2+'" opacity=".5"/>';
    if(!back){var px=tx+12,py=92;o+=L([[px,py],[px+7,py+7]],2,c.print)+L([[px+7,py],[px,py+7]],2,c.print)+L([[px+11,py+1],[px+18,py+8]],2,c.print)+L([[px+18,py+1],[px+11,py+8]],2,c.print)}}
  if(back)o+=E(tx-12,52,10,24,'#000',' opacity=".05"')+E(tx+12,52,10,24,'#000',' opacity=".05"');
  o+='</g>';return o};
PF.collar=function(S){var c=S.c,tx=S.tx,u=S.uid,back=nF(S.p.back,0);
  if(back)return '<path d="M'+f(tx-15)+',-8 Q'+f(tx)+',6 '+f(tx+15)+',-8" fill="none" stroke="'+(S.ch.id==='friend'?c.collarIn:c.top2)+'" stroke-width="4.4" stroke-linecap="round"/>';
  if(S.ch.id==='friend'){/* closed crew neck with a rib band; skin only inside the neck hole */
    var nk='M'+f(tx-14)+',-8 C'+f(tx-14)+',4 '+f(tx-9)+',13 '+f(tx)+',14 C'+f(tx+9)+',13 '+f(tx+14)+',4 '+f(tx+14)+',-8Z';
    return '<path d="'+nk+'" fill="'+c.skin+'"/><path d="M'+f(tx-15.4)+',-8 C'+f(tx-15.6)+',5 '+f(tx-10)+',15.4 '+f(tx)+',16 C'+f(tx+10)+',15.4 '+f(tx+15.6)+',5 '+f(tx+15.4)+',-8" fill="none" stroke="'+c.collarIn+'" stroke-width="3.8" stroke-linecap="round"/>'}
  return '<path d="M'+f(tx-22)+',-3 C'+f(tx-19)+',9 '+f(tx+19)+',9 '+f(tx+22)+',-3" fill="none" stroke="'+c.top2+'" stroke-width="5.6" stroke-linecap="round"/><path d="M'+f(tx-22)+',-5 C'+f(tx-18)+',6 '+f(tx+18)+',6 '+f(tx+22)+',-5" fill="none" stroke="'+c.topHi+'" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>'};

/* ---------------------------------------------------------------- pelvis + legs: hips wider than the lower shoulder edge, waist ~71% of hip width, taper, calf */
PF.pelvis=function(S,hs){var c=S.c,D=S.dim,HW=D.hips+(hs-D.hs),wT=D.wTop,fr=D.tee,by=D.hemY-D.hipY;
  var d='M'+f(-wT)+',-70 C'+f(-wT-.5)+',-46 '+f(-HW-2.6)+',-32 '+f(-HW)+',2 C'+f(-HW+.4)+',22 '+f(-HW+1)+',36 '+f(-HW+4.5)+',47 Q0,66 '+f(HW-4.5)+',47 C'+f(HW-1)+',36 '+f(HW-.4)+',22 '+f(HW)+',2 C'+f(HW+2.6)+',-32 '+f(wT+.5)+',-46 '+f(wT)+',-70Z';
  var o='<path d="'+d+'" fill="'+c.pants+'"/>';
  if(!fr)o+='<path d="M'+f(-wT-.4)+','+(by+1)+' L'+f(wT+.4)+','+(by+1)+' L'+f(wT+.8)+','+(by+9)+' L'+f(-wT-.8)+','+(by+9)+'Z" fill="'+c.pants2+'"/><rect x="-4" y="'+(by+1)+'" width="8" height="8" rx="1.4" fill="#b99a54" opacity=".85"/>';
  if(nF(S.p.back,0)){[-1,1].forEach(function(sd){var cx=sd*HW*.46;o+=E(cx,14,HW*.5,26,c.pantsHi,' opacity=".2" filter="url(#'+S.uid+'bl)"')+'<path d="M'+f(cx-sd*HW*.42)+',36 Q'+f(cx)+',52 '+f(cx+sd*HW*.46)+',38" fill="none" stroke="'+c.pants2+'" stroke-width="3.2" stroke-linecap="round" opacity=".45" filter="url(#'+S.uid+'bl)"/>'});o+='<path d="M0,-4 Q-2,24 0,52" stroke="'+c.pants2+'" stroke-width="2.6" fill="none" opacity=".5" stroke-linecap="round"/>'}
  o+='<path d="M-1,28 Q0,44 1,58" stroke="'+c.pants2+'" stroke-width="2" fill="none" opacity=".5"/>';
  o+='<path d="M'+f(-HW+7)+',-8 C'+f(-HW+6)+',10 '+f(-HW+9)+',26 '+f(-HW+15)+',38" stroke="'+c.pantsHi+'" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>';
  return o};
PF.upper_leg=function(S,Ln,sd){sd=sd||-1;Ln=Ln||S.dim.UL;var c=S.c,D=S.dim,a=D.legA,b=D.legB,ai=a*.78;
  function X(v){return f(sd*v)}
  return '<path d="M'+X(a)+',-12 C'+X(a+3.6)+','+f(Ln*.12)+' '+X(b+8)+','+f(Ln*.56)+' '+X(b)+','+f(Ln+4)+' Q0,'+f(Ln+10)+' '+X(-b)+','+f(Ln+4)+' C'+X(-b-7.5)+','+f(Ln*.62)+' '+X(-ai-3)+','+f(Ln*.2)+' '+X(-ai)+',-12 Z" fill="'+c.pants+'"/><path d="M'+X(-4.4)+','+f(Ln-12)+' Q'+X(1)+','+f(Ln-5)+' '+X(7)+','+f(Ln-11)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.2" stroke-linecap="round" opacity=".55"/><path d="M'+X(a-6)+',8 C'+X(a-6)+','+f(Ln*.4)+' '+X(b+1)+','+f(Ln*.7)+' '+X(b-3)+','+f(Ln-6)+'" fill="none" stroke="'+c.pantsHi+'" stroke-width="3.4" opacity=".42" stroke-linecap="round"/><path d="M'+X(-ai+3)+',6 C'+X(-ai+2)+','+f(Ln*.35)+' '+X(-b-3)+','+f(Ln*.62)+' '+X(-b+1)+','+f(Ln-4)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.4" opacity=".3" stroke-linecap="round"/>'};
PF.lower_leg=function(S,Ln){Ln=Ln||S.dim.LL;var c=S.c,D=S.dim,fr=D.tee,hb=Ln-(fr?26:15),kw=D.kneeW,cw=D.calfW,hw=D.ankW,cy=Ln*.27;
  return '<path d="M'+(-kw)+',-8 C'+f(-kw-.4)+','+f(cy*.4)+' '+f(-cw-.2)+','+f(cy*.7)+' '+f(-cw)+','+f(cy)+' C'+f(-cw+.4)+','+f(Ln*.46)+' '+f(-hw-1.4)+','+f(hb-30)+' '+f(-hw)+','+f(hb)+' Q0,'+f(hb+7)+' '+f(hw)+','+f(hb)+' C'+f(hw+1.4)+','+f(hb-30)+' '+f(cw-.4)+','+f(Ln*.46)+' '+f(cw)+','+f(cy)+' C'+f(cw+.2)+','+f(cy*.7)+' '+f(kw+.4)+','+f(cy*.4)+' '+kw+',-8 Z" fill="'+c.pants+'"/><path d="'+'M'+(-hw)+','+f(hb-3)+' Q0,'+f(hb+4)+' '+hw+','+f(hb-3)+'" fill="none" stroke="'+c.pants2+'" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M-'+(kw-4)+',8 C-'+(kw-4)+','+f(cy)+' -'+(cw-3)+','+f(cy+10)+' -'+(hw-1)+','+f(hb-8)+'" fill="none" stroke="'+c.pantsHi+'" stroke-width="3" opacity=".4" stroke-linecap="round"/>'};
/* seated thigh seen end-on: a tapered tube coming toward the viewer (wide at the hip, narrower at the knee), round soft knee cap, local +y = toward the knee */
PF.thigh_sit=function(S,Ln,sd,sc){Ln=Ln||52;sc=sc||1;var c=S.c,D=S.dim,a=(D.legA-1)*sc,kr=(D.legB+3.8)*sc,p2=c.pants2,ph=c.pantsHi,s=sd||-1;
  return '<path d="M'+f(-a)+',0 A'+f(a)+','+f(a*.55)+' 0 0 1 '+f(a)+',0 C'+f(a*1.04)+','+f(Ln*.3)+' '+f(kr+5)+','+f(Ln*.62)+' '+f(kr)+','+f(Ln)+' A'+f(kr)+','+f(kr)+' 0 0 1 '+f(-kr)+','+f(Ln)+' C'+f(-kr-5)+','+f(Ln*.62)+' '+f(-a*1.04)+','+f(Ln*.3)+' '+f(-a)+',0Z" fill="'+c.pants+'"/>'
   +'<path d="M'+f(-a+7)+',3 C'+f(-a*.8)+','+f(Ln*.3)+' '+f(-kr*.9)+','+f(Ln*.6)+' '+f(-kr*.68)+','+f(Ln-3)+'" fill="none" stroke="'+ph+'" stroke-width="6" stroke-linecap="round" opacity=".5" filter="url(#'+S.uid+'bl)"/>'
   +'<path d="M'+f(a-6)+',2 C'+f(a*.78)+','+f(Ln*.3)+' '+f(kr*.9)+','+f(Ln*.6)+' '+f(kr*.7)+','+f(Ln-3)+'" fill="none" stroke="'+p2+'" stroke-width="6" stroke-linecap="round" opacity=".42" filter="url(#'+S.uid+'bl)"/>'
   +'<path d="M'+f(-a+3)+','+f(-1)+' Q0,'+f(-a*.4)+' '+f(a-3)+','+f(-1)+'" fill="none" stroke="'+p2+'" stroke-width="2.4" opacity=".3" stroke-linecap="round"/>'
   +'<ellipse cx="'+f(-kr*.16)+'" cy="'+f(Ln-kr*.3)+'" rx="'+f(kr*.56)+'" ry="'+f(kr*.46)+'" fill="'+ph+'" opacity=".26"/>'
   +'<path d="M'+f(-kr*.8)+','+f(Ln-1)+' Q0,'+f(Ln+kr*.55)+' '+f(kr*.8)+','+f(Ln-1)+'" fill="none" stroke="'+p2+'" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>'};
PF.foot_back=function(S){var c=S.c,fr=S.ch.id==='friend',body=c.shoe,sole=c.sole,acc=fr?c.shoe2:c.shoeAcc;
  return '<path d="M-12.5,-16 L12.5,-16 C14.6,-2 15.8,10 15,17 Q15,21.4 11,21.4 L-11,21.4 Q-15,21.4 -15,17 C-15.8,10 -14.6,-2 -12.5,-16Z" fill="'+body+'"/><rect x="-15.6" y="16" width="31.2" height="5.8" rx="2.6" fill="'+sole+'"/><path d="M-6.4,-16 L6.4,-16 L5.4,3 Q0,5.4 -5.4,3Z" fill="'+acc+'"/><path d="M-9,8 Q0,11 9,8" fill="none" stroke="'+(fr?'#3a3744':c.shoe2)+'" stroke-width="1.6" opacity=".7"/>'};
/* wooden chair from the front, origin = hip joint of the seated actor, floor at y=h; seat top at +28, back posts wider than her shoulders so the chair reads around her */
PF.chair=function(S,h){h=h||216;var w='#8a6a4c',w2='#6b5039',w3='#4f3b2a',w4='#a3825f',w5='#c4a27c',y0=28;
  return '<ellipse cx="0" cy="'+(h+3)+'" rx="86" ry="9" fill="#0b1020" opacity=".4"/>'
   +'<rect x="-58" y="'+(y0+8)+'" width="7" height="'+(h-y0-12)+'" rx="2" fill="'+w3+'"/><rect x="51" y="'+(y0+8)+'" width="7" height="'+(h-y0-12)+'" rx="2" fill="'+w3+'"/>'
   +'<rect x="-64" y="-176" width="8" height="'+(y0+190)+'" rx="2.6" fill="'+w2+'"/><rect x="56" y="-176" width="8" height="'+(y0+190)+'" rx="2.6" fill="'+w2+'"/>'
   +'<rect x="-66" y="-184" width="132" height="16" rx="7" fill="'+w+'"/><rect x="-61" y="-182" width="122" height="3" rx="1.5" fill="'+w5+'" opacity=".6"/>'
   +'<rect x="-58" y="-138" width="116" height="9" rx="3" fill="'+w2+'"/><rect x="-58" y="-106" width="116" height="9" rx="3" fill="'+w2+'"/>'
   +'<path d="M-56,'+y0+' L56,'+y0+' L74,'+(y0+36)+' L-74,'+(y0+36)+'Z" fill="'+w4+'"/><path d="M-60,'+(y0+4)+' L60,'+(y0+4)+'" stroke="'+w5+'" stroke-width="2" opacity=".55"/>'
   +'<path d="M-74,'+(y0+36)+' L74,'+(y0+36)+' L74,'+(y0+50)+' Q74,'+(y0+53)+' 70,'+(y0+53)+' L-70,'+(y0+53)+' Q-74,'+(y0+53)+' -74,'+(y0+50)+'Z" fill="'+w+'"/>'
   +'<rect x="-72" y="'+(y0+48)+'" width="9" height="'+(h-y0-48)+'" rx="2.4" fill="'+w+'"/><rect x="63" y="'+(y0+48)+'" width="9" height="'+(h-y0-48)+'" rx="2.4" fill="'+w+'"/>'
   +'<rect x="-66" y="'+(h-60)+'" width="132" height="6" rx="2.4" fill="'+w2+'"/>'};
/* chair turned ~28 deg about the vertical, same origin; projected with x'=x*cos+z*sin, y'=y+.2*(z*cos-x*sin) */
PF.chair34=function(S,h){h=h||216;var w='#8a6a4c',w2='#6b5039',w3='#4f3b2a',w4='#a3825f',w5='#c4a27c',th=Math.max(.2,nF(S.p.turn,.31))*PIF/2,cT=Math.cos(th),sT=Math.sin(th),y0=28,e=.2,o='';
  function Q(x,z,y){return [x*cT+z*sT,y+e*(z*cT-x*sT)]}
  function pl(pts,fill,ex){return '<path d="M'+pts.map(function(p){return f(p[0])+','+f(p[1])}).join(' L')+'Z" fill="'+fill+'"'+(ex||'')+'/>'}
  var BL=Q(-54,-40,y0),BR=Q(54,-40,y0),FR=Q(54,48,y0),FL=Q(-54,48,y0),T=12;
  function leg(x,z,wd,col,top){var p=Q(x,z,top),q=Q(x,z,h);return '<rect x="'+f(p[0]-wd/2)+'" y="'+f(p[1])+'" width="'+wd+'" height="'+f(q[1]-p[1])+'" rx="2.2" fill="'+col+'"/>'}
  o+='<ellipse cx="'+f(14)+'" cy="'+f(h+5)+'" rx="96" ry="10" fill="#0b1020" opacity=".4"/>';
  o+=leg(54,-40,8,w3,y0)+leg(-54,-40,8,w3,y0);
  var tl=Q(-54,-40,y0-196),tr=Q(54,-40,y0-196);
  o+=pl([[BR[0]-4,BR[1]],[BR[0]+4,BR[1]],[tr[0]+4,tr[1]],[tr[0]-4,tr[1]]],w2)+pl([[BL[0]-4,BL[1]],[BL[0]+4,BL[1]],[tl[0]+4,tl[1]],[tl[0]-4,tl[1]]],w2);
  [[-120,-130],[-92,-102]].forEach(function(r){var a=Q(-54,-40,y0+r[0]+8),b=Q(54,-40,y0+r[0]+8);o+=pl([[a[0],a[1]],[b[0],b[1]],[b[0],b[1]+9],[a[0],a[1]+9]],w2)});
  o+=pl([[tl[0]-8,tl[1]-6],[tr[0]+6,tr[1]-6],[tr[0]+6,tr[1]+10],[tl[0]-8,tl[1]+10]],w);
  o+=leg(54,48,9,w3,y0+T)+pl([BL,BR,FR,FL],w4)+pl([[BL[0],BL[1]],[FL[0],FL[1]],[FL[0],FL[1]+T],[BL[0],BL[1]+T]],w2)+pl([FL,FR,[FR[0],FR[1]+T],[FL[0],FL[1]+T]],w);
  o+=leg(-54,48,9,w,y0+T);
  var a=Q(-54,48,h-62),b=Q(54,48,h-62);o+=pl([[a[0],a[1]],[b[0],b[1]],[b[0],b[1]+6],[a[0],a[1]+6]],w2);
  return o};
function chairSide(S,hy){var y=hy+29,fl=S.dim.floor,w='#8a6a4c',w2='#6b5039',w3='#4f3b2a',w4='#a3825f';
  return '<rect x="-52" y="'+(y+8)+'" width="9" height="'+(fl-y-8)+'" rx="2.4" fill="'+w3+'"/><rect x="104" y="'+(y+8)+'" width="9" height="'+(fl-y-8)+'" rx="2.4" fill="'+w3+'"/>'
   +'<path d="M-50,'+(y+4)+' L-38,'+(y+4)+' L-44,'+(y-196)+' L-57,'+(y-196)+'Z" fill="'+w2+'"/><rect x="-60" y="'+(y-204)+'" width="20" height="16" rx="6" transform="rotate(-2 -50 '+(y-196)+')" fill="'+w+'"/>'
   +'<rect x="-48" y="'+(y-120)+'" width="8" height="40" rx="3" fill="'+w2+'"/>'
   +'<rect x="-56" y="'+y+'" width="172" height="11" rx="4" fill="'+w4+'"/><rect x="-56" y="'+(y+7)+'" width="172" height="4" rx="2" fill="'+w+'"/>'
   +'<rect x="-48" y="'+(y+11)+'" width="9" height="'+(fl-y-11)+'" rx="2.4" fill="'+w+'"/><rect x="100" y="'+(y+11)+'" width="9" height="'+(fl-y-11)+'" rx="2.4" fill="'+w+'"/>'
   +'<rect x="-44" y="'+(fl-66)+'" width="148" height="6" rx="2.4" fill="'+w2+'"/>'}
PF.chair_seat=function(S){return ''};

/* side-on body: waist, subtle bust and hip */
function crp(pts){var d='',n=pts.length,i;for(i=0;i<n-1;i++){var p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||pts[i+1];
  d+=' C'+f(p1[0]+(p2[0]-p0[0])/6)+','+f(p1[1]+(p2[1]-p0[1])/6)+' '+f(p2[0]-(p3[0]-p1[0])/6)+','+f(p2[1]-(p3[1]-p1[1])/6)+' '+f(p2[0])+','+f(p2[1])}return d}
/* side view torso: ribcage front +17, bust apex +26 (8-10 px forward), waist indent front/back, lumbar arch, rear projects back */
PF.torso_side=function(S){var c=S.c,D=S.dim,hy=D.hemY,fr=D.tee,wy=D.waistY,ap=D.ap,fo,ba,u=S.uid;
  /* ribs +18.5 at y34; bust apex ap is the most forward point (K 37.5 = +19, F 30.5 = +12); waist cinched; lumbar arch; rear projects */
  fo=[[11,-14],[15.5,6],[18.5,34],[fr?21.5:22,50],[fr?25.5:27.5,63],[ap-2.6,74],[ap,82.5],[ap-2.8,91],[ap-(fr?8:9),98],[ap-(fr?13.5:15),104],[fr?16:17,109],[fr?12.5:12.5,wy-5],[11.5,wy]];
  ba=[[-10,-14],[-17,0],[-21.5,24],[-22.5,44],[-19.5,76],[-15,wy-16],[-12.5,wy]];
  if(fr){fo.push([14.5,wy+22],[19.5,wy+60],[23,hy-18],[22.5,hy]);ba.push([-16.5,wy+22],[-27,wy+56],[-37,hy-26],[-37,hy])}
  else{fo.push([14.5,wy+16],[18.5,wy+34],[20.5,hy-4],[20,hy]);ba.push([-15.5,wy+14],[-22,wy+32],[-27,hy-6],[-27,hy])}
  var lf=fo[fo.length-1],lb=ba[ba.length-1],d='M'+f(fo[0][0])+','+f(fo[0][1])+crp(fo)+' Q'+f((lf[0]+lb[0])/2)+','+f(hy+(fr?6:3))+' '+f(lb[0])+','+f(lb[1])+crp(ba.slice().reverse())+' Q0,-6 '+f(fo[0][0])+','+f(fo[0][1])+'Z';
  var o='<defs><clipPath id="'+u+'ts"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.top+'"/><g clip-path="url(#'+u+'ts)">';
  o+='<path d="M-10,-6 C-18,0 -21,20 -22,44 C-21,70 -18,96 -14,'+wy+' L-6,'+wy+' C-8,90 -10,40 -10,-6Z" fill="'+c.top2+'" opacity=".34"/>';
  /* soft diffuse shadow under the bust + a gentle fold + 2-3 horizontal tension folds (stretched knit); no highlights on the bust */
  o+='<ellipse cx="'+(ap-11)+'" cy="99" rx="'+(fr?11:16)+'" ry="'+(fr?5:7)+'" transform="rotate(-24 '+(ap-11)+' 99)" fill="'+c.top2+'" opacity="'+(fr?.26:.34)+'" filter="url(#'+u+'bl)"/>';
  o+='<path d="M'+(ap-3)+',88 Q'+(ap-9)+',96 '+(ap-13.5)+',101" fill="none" stroke="'+c.top2+'" stroke-width="2.4" stroke-linecap="round" opacity=".3"/>';
  [[60,0],[68,1],[76,2]].forEach(function(r){if(fr&&r[1]>1)return;var y=r[0];o+='<path d="M6,'+(y-4)+' Q'+f((6+ap-3)/2)+','+(y+3)+' '+(ap-3.5-r[1]*1.2)+','+(y+4+r[1]*2)+'" fill="none" stroke="'+c.top2+'" stroke-width="1.7" stroke-linecap="round" opacity="'+(fr?.15:.2)+'"/>'});
  if(!fr)o+='<path d="M-20,'+(hy-8)+' Q0,'+(hy-3)+' 19,'+(hy-8)+'" fill="none" stroke="'+c.topHi+'" stroke-width="2" opacity=".32"/>';
  else o+='<path d="M-32,'+(hy-12)+' Q0,'+(hy-6)+' 23,'+(hy-12)+' L23,'+hy+' L-32,'+hy+'Z" fill="'+c.top2+'" opacity=".42"/><path d="M13,'+(wy+4)+' Q4,'+(wy+10)+' -8,'+(wy+20)+'" stroke="'+c.top2+'" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/><path d="M12,'+(wy+14)+' Q3,'+(wy+18)+' -6,'+(wy+34)+'" stroke="'+c.top2+'" stroke-width="2" fill="none" stroke-linecap="round" opacity=".4"/>'+L([[11,102],[16,108]],2,c.print)+L([[16,102],[11,108]],2,c.print);
  return o+'</g>'};
PF.upper_leg_side=function(S,Ln){Ln=Ln||S.dim.UL;var c=S.c,D=S.dim,b=D.legB,ab=33,af=27;
  return '<path d="M'+(-ab)+',-14 C'+f(-ab-.8)+','+f(Ln*.26)+' '+f(-b-3.6)+','+f(Ln*.7)+' '+f(-b)+','+f(Ln+4)+' Q0,'+f(Ln+10)+' '+f(b)+','+f(Ln+4)+' C'+f(b+3.4)+','+f(Ln*.7)+' '+f(af+.8)+','+f(Ln*.26)+' '+af+',-14 Z" fill="'+c.pants+'"/><path d="M-4.4,'+f(Ln-12)+' Q1,'+f(Ln-5)+' 7,'+f(Ln-11)+'" fill="none" stroke="'+c.pants2+'" stroke-width="2.2" stroke-linecap="round" opacity=".5"/><path d="M'+(-ab+1)+',26 Q'+(-ab+9)+',46 -2,38" fill="none" stroke="'+c.pants2+'" stroke-width="3.4" stroke-linecap="round" opacity=".38" filter="url(#'+S.uid+'bl)"/>'};
PF.pelvis_side=function(S){var c=S.c,pts=[[-16,-66],[-21,-50],[-31,-32],[-39,-8],[-39,14],[-34,34],[-22,48],[-6,53],[10,50],[20,40],[25.5,22],[26.5,0],[23,-30],[17,-52],[16,-66]];
  return '<path d="M'+f(pts[0][0])+','+f(pts[0][1])+crp(pts)+'Z" fill="'+c.pants+'"/><path d="M-26,-12 C-28,6 -26,24 -19,38" stroke="'+c.pantsHi+'" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>'};
/* back of head: one hair mass over the whole skull (+ ears, parting, sheen) */
PF.head_back=function(S){var CH=S.ch;return withG(CH,function(){var SK=CH.g14.sk,ex_=CH.g14.ex,pal=CH.pal,o='';
  o+=E(-ex_,-44,5.2,8,CH.o.skin)+E(ex_,-44,5.2,8,CH.o.skin);
  o+=CH.backFn(S)+P(SK,CH.id==='kristina'?pal.hair3:pal.hair);
  o+=L([[0,-92],[0,-60]],1.4,pal.hair3,' opacity=".55"');
  o+='<path d="M-30,-78 C-20,-90 4,-92 24,-84" stroke="'+pal.hair2+'" stroke-width="3.6" fill="none" stroke-linecap="round" opacity=".5"/><path d="M-34,-56 C-30,-66 -22,-72 -12,-76" stroke="'+pal.hair2+'" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".4"/>';
  if(CH.id==='kristina')o+=sh('<g transform="rotate(8 26 -66)"><rect x="14" y="-71" width="24" height="7.6" rx="3.8" fill="#d6b45a"/><rect x="17" y="-69.6" width="18" height="1.8" rx=".9" fill="#f3dc92" opacity=".8"/></g>',1);
  return '<g transform="scale('+f(.9+.1*S.ca)+',1)">'+o+'</g>'})};
function headBackView(S){var D=S.dim,hd=S.p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0),hy=D.neckY+nF(hd.dy,0);
  return '<g transform="translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+') scale('+HSC+')">'+shF(S,PF.head_back(S),1)+'</g>'}

/* ---------------------------------------------------------------- poses */
var PSF2={
 stand_still:{sh:3,head:{tilt:2},hipsh:9,unload:-1,ptilt:-2.6,shrot:3.8,L:{h:[-74,188],bend:1},R:{h:[73,190],bend:-1},legs:{spread:19,ank:26,kin:1}},
 stand_idle:{hipsh:-8,unload:1,ptilt:2.4,shrot:-3.4,L:{h:[-73,190],bend:1},R:{h:[74,188],bend:-1},legs:{spread:19,ank:26,kin:1}},
 sit_desk:{sit:1,sh:2,lean:.04,head:{tilt:2},L:{h:[-41,194],bend:1},R:{h:[41,194],bend:-1},legs:{spread:19,ank:26,kin:2}},
 stand_3q:{turn:.36,sh:3,head:{yaw:.4,tilt:2,dx:3},hipsh:6,ptilt:-2,shrot:2,L:{h:[-62,190],bend:1},R:{h:[76,188],bend:-1},legs:{spread:19,ank:26,kin:1}},
 sit_front:{sit:1,sh:2,lean:.04,head:{tilt:2},L:{h:[-41,194],bend:1},R:{h:[41,194],bend:-1},legs:{spread:19,ank:26,kin:2}},
 sit_3q:{sit:1,sh:2,lean:.05,turn:.36,head:{yaw:.4,tilt:2,dx:3},L:{h:[-26,196],bend:1},R:{h:[40,190],bend:-1},legs:{spread:19,ank:26,kin:2}},
 hand_on_hip:{R:{h:[44,166],bend:-1,rot:-8},L:{h:[-54,192]},hipsh:6,unload:-1,ptilt:-2,shrot:3},
 hand_to_hair:{sh:3,head:{tilt:5,yaw:-.08},L:{h:[-54,192]},R:{h:[48,-34],bend:1,rot:14,fsh:1.32,ush:.45},hipsh:5,unload:-1,ptilt:-1.6,shrot:1},
 stand_side:{view:"side",sh:2,lean:.1,head:{yaw:1,tilt:1},L:{h:[2,190],bend:1},R:{h:[-14,186],bend:1},gait:{nx:5,ny:0,nrot:0,fx:-5,fy:0,frot:0,hipdy:0,hrot:0}},
 sit_side:{view:"side",sh:2,lean:.2,head:{yaw:1,tilt:1},sitS:1,L:{h:[56,176],bend:1},R:{h:[62,176],bend:1},gait:{nx:148,ny:0,nrot:0,fx:138,fy:0,frot:0,hipdy:158,hrot:0}},
 sit_side_crossed:{view:"side",sh:2,lean:.22,head:{yaw:1,tilt:1},sitS:1,L:{h:[66,176],bend:1},R:{h:[92,160],bend:1},gait:{nx:194,ny:-38,nrot:28,fx:146,fy:0,frot:0,hipdy:158,hrot:0}},
 back_view:{back:1,sh:2,head:{tilt:1},L:{h:[-72,190],bend:1},R:{h:[72,190],bend:-1},legs:{fsh:1,fs:1}},
 walk_contact:{view:"side",sh:2,lean:.22,head:{yaw:1,tilt:1},L:{h:[50,170],bend:1},R:{h:[-46,180],bend:1},gait:{nx:44,ny:0,nrot:-16,fx:-40,fy:-18,frot:34,hipdy:8,hrot:3}},
 walk_down:{view:"side",sh:2,lean:.22,head:{yaw:1,tilt:1},L:{h:[36,178],bend:1},R:{h:[-34,184],bend:1},gait:{nx:27,ny:0,nrot:0,fx:-36,fy:-32,frot:40,hipdy:15,hrot:1.5}},
 walk_contact_b:{view:"side",sh:2,lean:.22,head:{yaw:1,tilt:1},L:{h:[-46,180],bend:1},R:{h:[50,170],bend:1},gait:{nx:-40,ny:-18,nrot:34,fx:44,fy:0,frot:-16,hipdy:8,hrot:-3}},
 walk_passing:{view:"side",sh:2,lean:.2,head:{yaw:1,tilt:1},L:{h:[-8,188],bend:1},R:{h:[10,188],bend:1},gait:{nx:2,ny:0,nrot:0,fx:14,fy:-66,frot:22,hipdy:0,hrot:0}}};
for(var pn2 in PSF2)HFg.POSES_F[pn2]=mergeF(HFg.POSES_F[pn2]||PBF,PSF2[pn2]);
HFg.POSES_F.hand_to_hair=mergeF(PBF,mergeF(PSF.hand_to_hair,PSF2.hand_to_hair));
HFg.POSES_F.walk_contact_b=mergeF(PBF,PSF2.walk_contact_b);HFg.POSES_F.walk_passing=mergeF(PBF,PSF2.walk_passing);HFg.POSES_F.walk_down=mergeF(PBF,PSF2.walk_down);
HFg.POSES_F.stand_3q=mergeF(PBF,PSF2.stand_3q);HFg.POSES_F.sit_front=mergeF(PBF,PSF2.sit_front);HFg.POSES_F.sit_3q=mergeF(PBF,PSF2.sit_3q);HFg.POSES_F.back_view=mergeF(PBF,PSF2.back_view);HFg.POSES_F.stand_side=mergeF(PBF,PSF2.stand_side);HFg.POSES_F.sit_side=mergeF(PBF,PSF2.sit_side);HFg.POSES_F.sit_side_crossed=mergeF(PBF,PSF2.sit_side_crossed);
/* ---- walk cycle: half-cycle keys (contact A, down, passing, up) + mirror (contact B...), joint targets eased in-out; 8 frames = phase k/8 */
var WKEYS=[
 [0,{lean:.22,L:{h:[50,170]},R:{h:[-46,180]},gait:{nx:44,ny:0,nrot:-16,fx:-40,fy:-18,frot:34,hipdy:8,hrot:3}}],
 [.1,{lean:.22,L:{h:[36,178]},R:{h:[-34,184]},gait:{nx:27,ny:0,nrot:0,fx:-36,fy:-32,frot:40,hipdy:15,hrot:1.5}}],
 [.25,{lean:.2,L:{h:[-8,188]},R:{h:[10,188]},gait:{nx:3,ny:0,nrot:0,fx:14,fy:-66,frot:22,hipdy:3,hrot:0}}],
 [.4,{lean:.22,L:{h:[-34,184]},R:{h:[38,178]},gait:{nx:-22,ny:0,nrot:10,fx:30,fy:-40,frot:2,hipdy:-1,hrot:-1.5}}],
 [.5,{lean:.22,L:{h:[-46,180]},R:{h:[50,170]},gait:{nx:-40,ny:-18,nrot:34,fx:44,fy:0,frot:-16,hipdy:8,hrot:-3}}]];
function wMirror(o){var r=JSON.parse(JSON.stringify(o)),g=o.gait;r.L=JSON.parse(JSON.stringify(o.R));r.R=JSON.parse(JSON.stringify(o.L));
  r.gait={nx:g.fx,ny:g.fy,nrot:g.frot,fx:g.nx,fy:g.ny,frot:g.nrot,hipdy:g.hipdy,hrot:-g.hrot};return r}
function wLerp(a,b,t){if(Array.isArray(a))return a.map(function(v,i){return v+(b[i]-v)*t});if(typeof a==='object'){var r={},k;for(k in a)r[k]=wLerp(a[k],b[k],t);return r}return a+(b-a)*t}
function walkPose(ph){ph=((ph%1)+1)%1;var half=ph>=.5,q=half?ph-.5:ph,i=0,K=WKEYS;
  while(i<K.length-2&&q>=K[i+1][0])i++;
  var A=K[i],B=K[i+1],t=cF((q-A[0])/(B[0]-A[0]),0,1);t=t*t*(3-2*t);
  var a=A[1],b=B[1];if(half){a=wMirror(a);b=wMirror(b)}
  var m=wLerp(a,b,t);m.view='side';m.sh=2;m.head={yaw:1,tilt:1};m.L.bend=1;m.R.bend=1;
  return mergeF(PBF,m)}
HFg.walkPose=walkPose;
for(var wf=0;wf<8;wf++)HFg.POSES_F['walk_f'+wf]=walkPose(wf/8);

for(var pn2 in PSF2)HFg.POSES_F[pn2]=mergeF(HFg.POSES_F[pn2]||PBF,PSF2[pn2]);
HFg.POSES_F.hand_to_hair=mergeF(PBF,mergeF(PSF.hand_to_hair,PSF2.hand_to_hair));
HFg.POSES_F.walk_contact_b=mergeF(PBF,PSF2.walk_contact_b);HFg.POSES_F.walk_passing=mergeF(PBF,PSF2.walk_passing);

/* ---------------------------------------------------------------- assemblers */
var ARMK=.92;
function armsOf(S,p,sh0,tx,sw,lean){var D=S.dim,shy=D.shY-S.shr,SL=[tx-sw+12,shy],SR=[tx+sw-12,shy],arms=[],t=S.t,fid=nF(p.fid,0);
  [["L",SL,-1],["R",SR,1]].forEach(function(A){var sp=p[A[0]]||{},Sh=A[1],sd=A[2],h=(sp.h||[sd*52,194]).slice();
    h=[Sh[0]+(h[0]-Sh[0])*ARMK,Sh[1]+(h[1]-Sh[1])*ARMK];
    if(fid&&A[0]==="R"){h[0]+=fid*2.5*Math.sin(t*5.3+1);h[1]+=fid*2*Math.cos(t*4.1)}
    var fq=nF(sp.fsh,1),us=nF(sp.ush,1),r=ikF(Sh,h,D.UA*us,D.FA*fq,nF(sp.bend,sd*-1));arms.push({nm:A[0],Sh:Sh,el:r.e,H:r.h,sp:sp,sd:sd,fq:fq,us:us})});
  return arms}
function drawFront(S,st){var D=S.dim,c=S.c,p=S.p,u=S.uid,o='',t=S.t,shk=st.shake||{x:0,y:0,r:0},CH=S.ch,back=nF(p.back,0);
  var sit=nF(p.sit,0),dy=sit*D.sitDy,lean=nF(p.lean,0),sgf=((p.head&&p.head.yaw)||p.turn)<0?-1:1,hsh=nF(p.hipsh,0)*(1-sit),un=nF(p.unload,0),ptl=nF(p.ptilt,0),rotU=lean*5*sgf+shk.r+nF(p.shrot,0)*(1-sit),l16=lean*14,scU=1+lean*.05;
  var lg=p.legs||{},hs=nF(lg.spread,D.hs),asp=nF(lg.ank,D.ank),kin=nF(lg.kin,1),kk=nF(lg.k,0),fsh=nF(lg.fsh,1),fs=nF(lg.fs,1),fr0=D.UL/(D.UL+D.LL),hy0=D.hipY+dy;
  var tn=nF(p.turn,0),q3=sit>.01&&tn>.12,t3=tn>.12,cT=Math.cos(tn*PIF/2),sT=Math.sin(tn*PIF/2);
  if(sit>.01)o+=shF(S,'<g transform="translate('+f(q3?S.tx*.5:0)+','+f(hy0)+')">'+(q3?PF.chair34:PF.chair)(S,D.floor-hy0)+'</g>',1);
  if(st.stand!==false){
    [-1,1].forEach(function(sd){var fd=sd<0?nF(lg.fl,-1):nF(lg.fr,1),gx=sd*asp+fd*5+hsh*.85+(sd===un?sd*9:0),gy=D.ankleY+20*fs;
      o+='<ellipse cx="'+f(gx+fd*3)+'" cy="'+f(gy+2)+'" rx="'+f(40*fs)+'" ry="7" fill="#0b1020" opacity=".5"/><ellipse cx="'+f(gx+fd*2)+'" cy="'+f(gy-.5)+'" rx="'+f(28*fs)+'" ry="3.4" fill="#0b1020" opacity=".65"/>'});
    var pelm='<g transform="translate('+f(hsh+(t3?S.tx*.5:0))+','+f(hy0)+')'+(ptl?' rotate('+f(ptl)+')':'')+(t3?' scale('+f(sit>.01?cT:.97)+',1)':'')+'">'+(sit>.01?'<clipPath id="'+u+'pcs"><rect x="-90" y="-90" width="180" height="'+(q3?86:84)+'"/></clipPath><g clip-path="url(#'+u+'pcs)">'+(window.__LEGDBG?DBGF(PF.pelvis(S,hs),'#888'):PF.pelvis(S,hs))+'</g>':PF.pelvis(S,hs))+'</g>',pel=sit>.01?shF(S,pelm,1):pelm;
    if(sit>.01)o+=pel;
    (q3?[1,-1]:[-1,1]).forEach(function(sd){var rx=(sd===un?1:0),hip=[sd*hs*(t3?cT:1)+hsh+(t3?S.tx*.5:0),hy0],an=[sd*asp*(t3?cT:1)+(t3?S.tx*.5:0)+(sd===un?sd*9:0)+hsh*.85,D.ankleY-kk],kn;
      if(sit>.01){if(q3){kn=[hip[0]+(D.UL*.8)*sT*(sd<0?1.12:.95),hy0+(sd<0?46:26)];an=[kn[0]-8,D.ankleY]}else{kn=[sd*(hs+13),hy0+44];an=[sd*(asp+4),D.ankleY]}}else kn=[hip[0]+(an[0]-hip[0])*fr0-sd*(kin+kk*.8+rx*5),hip[1]+(an[1]-hip[1])*fr0-kk*.4-rx*3];
      var L1=Math.hypot(kn[0]-hip[0],kn[1]-hip[1]),L2=Math.hypot(an[0]-kn[0],an[1]-kn[1]),fd=sd<0?nF(lg.fl,-1):nF(lg.fr,1),q34=sd<0?.88:.8,rt=sd<0?-11:12;if(sit>.01)rt=q3?(sd<0?4:6):(sd<0?-13:13);
      if(back)o+=shF(S,'<g transform="translate('+f(an[0])+','+f(an[1]+2)+')">'+PF.foot_back(S)+'</g>',1);
      else o+=shF(S,'<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rt)+') scale('+f(fd*fsh*fs*q34*(q3?.9:1))+','+f(fs)+')">'+PF.foot(S)+'</g>',1);
      o+=shF(S,'<g transform="'+trF(kn[0],kn[1],angF(kn,an))+'">'+(window.__LEGDBG&&sit>.01?DBGF(PF.lower_leg(S,L2),sd<0?'#f2c23a':'#3cc27a'):PF.lower_leg(S,L2))+'</g>',1);
      if(sit>.01){var tm=PF.thigh_sit(S,L1+4,sd,q3?(sd>0?.86:1.05):1,q3);if(window.__LEGDBG)tm=DBGF(tm,sd<0?'#e8453c':'#3c8be8');o+=shF(S,'<g transform="'+trF(hip[0],hip[1]-4,angF(hip,kn))+'">'+tm+'</g>',1)}
      else o+=shF(S,'<g transform="'+trF(hip[0],hip[1],angF(hip,kn))+'">'+PF.upper_leg(S,L1,sd)+'</g>',1)});
    if(!(sit>.01))o+=pel}
  o+='<g transform="translate('+f(hsh*.5)+','+f(dy)+') translate(0,'+D.hipY+') rotate('+f(rotU)+') translate(0,-'+D.hipY+') translate(0,'+f(l16)+') scale('+f(scU)+')">';
  var arms=armsOf(S,p,0,S.tx,S.sw);
  if(!back)o+=headMarkup(S,'back');
  var hy_=D.hemY;if(sit>.01&&CH.id==='friend')D.hemY=hy_-24*sit;o+=shF(S,PF.torso(S),0);D.hemY=hy_;o+=shF(S,PF.neck(S),1)+PF.collar(S);
  if(!back)o+=PF.choker(S)+PF.pendant(S);
  arms.forEach(function(A){var us=A.us;o+=shF(S,'<g transform="'+trF(A.Sh[0],A.Sh[1],angF(A.Sh,A.el))+(us<1?' scale('+f(1+.3*(1-us))+','+f(us)+')':'')+'">'+PF.upper_arm(S)+'</g>',1);o+=shF(S,'<g transform="'+trF(A.el[0],A.el[1],angF(A.el,A.H))+(A.fq!==1?' scale('+f(A.fq<1?1+.22*(1-A.fq):1)+','+f(A.fq)+')':'')+'">'+PF.forearm(S)+'</g>',1)});
  if(!back)o+=headMarkup(S,'front');
  arms.forEach(function(A){o+=propFor(S,A,st)});
  arms.forEach(function(A){var sp=A.sp,s=nF(sp.s,1),ty=(st.prop&&st.prop.on&&(st.prop.hand||'R')===A.nm)?'grip':(sp.hand==='grip'?'grip':'relaxed');
    o+=shF(S,'<g transform="'+trF(A.H[0],A.H[1],angF(A.el,A.H)+nF(sp.rot,0),s)+'">'+PF.hand(S,A.sd>0?-1:1,ty)+'</g>',1)});
  if(back)o+=headBackView(S);
  o+='</g>';return o}
function drawSide(S,st){var D=S.dim,c=S.c,p=S.p,u=S.uid,o='',gt=p.gait||{},fc=nF(p.face,1),hd0=nF(gt.hipdy,0),hr=nF(gt.hrot,0),hip=[nF(p.hipx,0),D.hipY+hd0],CH=S.ch,sitS=nF(p.sitS,0),sh0='<g filter="url(#'+u+'dk)">';
  function leg(an,rot,dark){var kn,r=ikF(hip,an,D.UL,D.LL,-1);kn=r.e;var m='<g transform="translate('+f(an[0])+','+f(an[1]+2)+') rotate('+f(rot)+')">'+PF.foot(S)+'</g>'+'<g transform="'+trF(kn[0],kn[1],angF(kn,an))+'">'+PF.lower_leg(S,D.LL)+'</g>'+'<g transform="'+trF(hip[0],hip[1],angF(hip,kn))+'">'+PF.upper_leg_side(S,D.UL)+'</g>';
    return dark?sh0+shF(S,m,1)+'</g>':shF(S,m,1)}
  var aN=[hip[0]+nF(gt.nx,44),D.ankleY+nF(gt.ny,0)],aF=[hip[0]+nF(gt.fx,-40),D.ankleY+nF(gt.fy,-16)];
  o+='<ellipse cx="'+f(hip[0]+(sitS?60:4))+'" cy="'+(D.floor+2)+'" rx="'+(sitS?130:86)+'" ry="8" fill="#0b1020" opacity=".5"/>';
  o+='<g transform="scale('+fc+',1)">';
  if(sitS)o+=shF(S,chairSide(S,hip[1]),1);
  var lean=nF(p.lean,0),shy=D.shY-S.shr,SH=[-3,shy+2];
  function arm(sp,dark){var h=[SH[0]+(sp.h[0]-SH[0])*ARMK,SH[1]+(sp.h[1]-SH[1])*ARMK],r=ikF(SH,h,D.UA,D.FA,nF(sp.bend,1)),m='<g transform="'+trF(SH[0],SH[1],angF(SH,r.e))+'">'+PF.upper_arm(S)+'</g><g transform="'+trF(r.e[0],r.e[1],angF(r.e,r.h))+'">'+PF.forearm(S)+'</g><g transform="'+trF(r.h[0],r.h[1],angF(r.e,r.h)+nF(sp.rot,0))+'">'+PF.hand(S,1,'relaxed')+'</g>';return dark?sh0+shF(S,m,1)+'</g>':shF(S,m,1)}
  o+=leg(aF,nF(gt.frot,0),true);
  o+=shF(S,'<g transform="translate('+f(hip[0])+','+f(hip[1])+') rotate('+f(hr-5)+')"><clipPath id="'+u+'pc"><rect x="-90" y="-100" width="180" height="'+(sitS?130:200)+'"/></clipPath><g clip-path="url(#'+u+'pc)">'+PF.pelvis_side(S)+'</g></g>',1);
  o+=leg(aN,nF(gt.nrot,0),false);
  o+='<g transform="translate(0,'+f(D.hipY+hd0)+') rotate('+f(lean*12-hr*.7)+') translate(0,-'+f(D.hipY)+')">';
  o+=arm(p.L||{h:[-6,184]},true);
  var hd=p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0)+4,hy=D.neckY+nF(hd.dy,0),tf='translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+') scale('+HSC+')';
  o+=shF(S,PF.torso_side(S),0);
  o+=shF(S,'<path d="M-10.4,-52 L10.4,-52 L11.8,2 Q0,8 -11.8,2Z" fill="'+CH.pal.skin+'"/>',1);
  if(CH.id==='friend')o+='<path d="M-10,-14 Q0,-9 10,-14 L10.4,-9.6 Q0,-4.4 -10.4,-9.6Z" fill="#14111a"/>'+E(1,-2,3,3,'#14111a');
  o+=arm(p.R||{h:[8,184]},false);
  var SP=S;SP.as=1;SP.sg=1;
  o+='<g transform="'+tf+'">'+shF(S,PF.head_profile(S),1)+'</g>';
  o+='</g></g>';return o}/* ===== ROUND 24 (rig_f 1.7 draft): form lighting + clean seated legs.
   One soft light from the upper left in the body frame (side view: upper front). Every body part is filled with a 3-tone gradient
   (highlight -> base -> shadow, faint cool rim on the shadow edge) and gets a few soft blurred overlays clipped to its own shape. */
function mixc(a,b,t){function h(x){x=x.replace('#','');if(x.length===3)x=x[0]+x[0]+x[1]+x[1]+x[2]+x[2];return [parseInt(x.substr(0,2),16),parseInt(x.substr(2,2),16),parseInt(x.substr(4,2),16)]}
  var A=h(a),B=h(b),r=[0,1,2].map(function(i){return Math.round(A[i]+(B[i]-A[i])*t)});return '#'+r.map(function(v){return (v<16?'0':'')+v.toString(16)}).join('')}
CHW.pal.pantsHi2='#434960';CHW.pal.pantsSh='#2a2e3e';CHW.pal.pantsSh2='#212434';CHW.pal.topHi2='#a1c0ad';CHW.pal.topSh='#79a08b';
CHF.pal.pantsHi2='#3b3a49';CHF.pal.pantsSh='#24232d';CHF.pal.pantsSh2='#1b1a23';CHF.pal.topHi2='#6a687e';CHF.pal.topSh='#43414f';CHF.pal.top='#585668';CHF.pal.top2='#434250';CHF.pal.topHi='#6f6d82';
function DBGF(m,col){m=m.replace(/<defs>[\s\S]*?<\/defs>/g,'');var mm=m.match(/<path[^>]*\/>/);return mm?mm[0].replace(/fill="[^"]*"/,'fill="'+col+'"'):''}
function sideV(S){return S.p&&S.p.view==='side'}
/* 2D cut-paper form: flat base fill + ONE flat shadow shape + ONE flat highlight shape per part (crisp edges, no blur, no gradients) */
function gdefs(S){return ''}
function fp(d,col,op){return '<path d="'+d+'" fill="'+col+'"'+(op&&op<1?' opacity="'+op+'"':'')+'/>'}
function el(cx,cy,rx,ry,col,rot){return '<ellipse cx="'+f(cx)+'" cy="'+f(cy)+'" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="'+col+'"'+(rot?' transform="rotate('+rot+' '+f(cx)+' '+f(cy)+')"':'')+'/>'}
function strip(pf,y0,y1,lo,hi,col){var n=6,L=[],R=[],i,y;for(i=0;i<=n;i++){y=y0+(y1-y0)*i/n;L.push([lo*pf(y),y]);R.push([hi*pf(y),y])}
  return fp('M'+f(L[0][0])+','+f(L[0][1])+crp(L)+' L'+f(R[n][0])+','+f(R[n][1])+crp(R.slice().reverse())+'Z',col)}
function wrapClip(S,m,ov,ix){var ds=m.replace(/<defs>[\s\S]*?<\/defs>/g,'').match(/<path d="([^"]+)"/g)||[],d=(ds[ix||0]||'').replace('<path d="','').replace(/"$/,'');if(!d||!ov)return m;
  var id=S.uid+'lc'+(S.n=(S.n||0)+1);return m+'<clipPath id="'+id+'"><path d="'+d+'"/></clipPath><g clip-path="url(#'+id+')">'+ov+'</g>'}

/* ---- bust treatments (window.__BUST = A | B | C | D) ---- */
function bustOpt(){return window.__BUST||'D'}
function bustFront(S,cx0,bw,fr){var c=S.c,hiT=c.topHi2,shT=c.topSh,o=bustOpt(),ov='',sp=14.5,k=fr?1:1;
  if(o==='A'){[-1,1].forEach(function(sd){var cx=cx0+sd*sp;ov+=el(cx,77,12.8,12,shT)+el(cx,72,12.8,12,mixc(c.top,hiT,.5))})}
  else if(o==='B'){[-1,1].forEach(function(sd){var xo=cx0+sd*(bw-3),xi=cx0+sd*9;ov+=fp('M'+f(xo)+',60 Q'+f(cx0+sd*(bw*.55))+',72 '+f(xi)+',94 Q'+f(cx0+sd*(bw*.5))+',80 '+f(xo)+',71Z',shT)})}
  else if(o==='C'){ov+=fp('M'+f(cx0-bw+2)+',70 Q'+f(cx0)+',44 '+f(cx0+bw-2)+',70 L'+f(cx0+bw-2)+',80 Q'+f(cx0)+',57 '+f(cx0-bw+2)+',80Z',hiT)+fp('M'+f(cx0-bw+2)+',92 Q'+f(cx0)+',108 '+f(cx0+bw-2)+',92 L'+f(cx0+bw-2)+',102 Q'+f(cx0)+',118 '+f(cx0-bw+2)+',102Z',shT)}
  return ov}
function bustSide(S,ap,fr){var c=S.c,hiT=c.topHi2,shT=c.topSh,o=bustOpt(),k=fr?.8:1,sh=fp('M'+f(ap+1)+',88 C'+f(ap-1)+',99 '+f(ap-9*k)+',107 17,112 L13,101 C'+f(ap-12)+',97 '+f(ap-16)+',93 '+f(ap-12)+',85Z',shT);
  if(o==='A')return el(ap-12,89,9.5*k,12.5*k,shT,-18)+el(ap-12,84,9.5*k,12.5*k,mixc(c.top,hiT,.5),-18);
  if(o==='B')return fp('M6,60 Q'+f((6+ap)/2)+',74 '+f(ap-4)+',92 Q'+f(ap-12)+',80 6,70Z',shT);
  if(o==='C')return fp('M7,58 Q'+f(ap*.6)+',62 '+f(ap-1)+',76 L'+f(ap-3)+',86 Q'+f(ap*.55)+',72 7,70Z',hiT)+fp('M'+f(ap-2)+',92 Q'+f(ap-9)+',104 16,110 L14,102 Q'+f(ap-14)+',96 '+f(ap-5)+',86Z',shT);
  return sh}
function LIT(S,m,kind,args){var c=S.c,u=S.uid,fl=sideV(S),D=S.dim,ov='',fr=S.ch.id==='friend';
  m=m.replace(new RegExp('<(path|ellipse)[^>]*filter="url\\(#'+u+'bl\\)"[^>]*/>','g'),'').replace(/ filter="url\(#[^"]*bl\)"/g,'');
  if(kind!=='torso'&&kind!=='torso_side'&&kind!=='neck')m=m.replace(/<path [^>]*fill="none"[^>]*\/>/g,'');/* no crease/cuff/highlight strokes */
  var hiP=c.pantsHi2,shP=c.pantsSh,sh2=c.pantsSh2,hiT=c.topHi2,shT=c.topSh,shS=c.skinSh||'#b98a76';
  /* ONE flat shadow shape on the shadow-side 35% of a limb (right; in profile the back) */
  function half(pf,y0,y1,col){return fl?strip(pf,y0,y1,-1.04,-.3,col):strip(pf,y0,y1,.3,1.04,col)}
  if(kind==='upper_leg'){var Ln=args[1]||D.UL,a=D.legA,b=D.legB;function pf(y){return b+(a-b)*Math.pow(Math.max(0,1-(y+12)/(Ln+16)),1.5)}
    return wrapClip(S,m,half(pf,-4,Ln+4,shP))}
  if(kind==='lower_leg'){var Lq=args[1]||D.LL,kw=D.kneeW,cw=D.calfW,hw=D.ankW,cy=Lq*.27,hb=Lq-(D.tee?26:15);function pf(y){return y<cy?kw+(cw-kw)*(y/cy):cw+(hw-cw)*Math.min(1,(y-cy)/(hb-cy))}
    ov=half(pf,-6,hb+4,shP)+(fl?fp('M'+f(-kw-2)+',-6 Q'+f(-kw+4)+',6 '+f(-1)+',-6 L'+f(-1)+',14 Q'+f(-kw+3)+',14 '+f(-kw-2)+',2Z',sh2):'');return wrapClip(S,m,ov)}
  if(kind==='thigh_sit'){var Ln=args[1]||52,sc=args[3]||1,kr=(D.legB+3.8)*sc,a=(D.legA-1)*sc;function pf(y){return kr+(a-kr)*Math.pow(Math.max(0,1-y/Ln),1.2)}
    return wrapClip(S,m,half(pf,-30,Ln+kr,shP))}
  if(kind==='upper_leg_side'){var Ln=args[1]||D.UL,b=D.legB;function pf(y){return b+(33-b)*Math.pow(Math.max(0,1-(y+14)/(Ln+18)),1.4)}
    ov=half(pf,-14,Ln+4,shP)+fp('M-34,22 Q-28,48 -3,44 L-3,34 Q-22,36 -30,20Z',sh2)+fp('M-7,'+f(Ln-14)+' Q-3,'+f(Ln-2)+' 8,'+f(Ln-14)+' L8,'+f(Ln-2)+' Q-3,'+f(Ln+6)+' -7,'+f(Ln-2)+'Z',shP);return wrapClip(S,m,ov)}
  if(kind==='pelvis'){var HW=D.hips+((args[1]||D.hs)-D.hs),bk=nF(S.p.back,0);
    ov=fp('M'+f(HW*.3)+',-70 L'+f(HW+8)+',-70 L'+f(HW+8)+',70 L'+f(HW*.3)+',70 C'+f(HW*.5)+',30 '+f(HW*.5)+',-20 '+f(HW*.3)+',-70Z',shP)
      +fp('M'+f(-HW-2)+',-30 C'+f(-HW-4)+',-12 '+f(-HW-2)+',8 '+f(-HW+5)+',28 C'+f(-HW+14)+',10 '+f(-HW+16)+',-12 '+f(-HW+14)+',-30Z',hiP)
      +(bk?fp('M'+f(-HW+2)+',38 Q'+f(-HW*.5)+',58 0,38 L0,48 Q'+f(-HW*.5)+',66 '+f(-HW+2)+',48Z',sh2)+fp('M0,38 Q'+f(HW*.5)+',58 '+f(HW-2)+',38 L'+f(HW-2)+',48 Q'+f(HW*.5)+',66 0,48Z',sh2):'');return wrapClip(S,m,ov)}
  if(kind==='pelvis_side'){ov=fp('M-18,-70 L-56,-70 L-56,70 L-14,70 C-26,44 -8,-30 -18,-70Z',shP)+el(-31,-8,8,18,hiP)+fp('M-40,22 C-38,40 -26,50 -8,52 L-8,44 C-24,40 -30,34 -32,20Z',sh2);return wrapClip(S,m,ov)}
  if(kind==='upper_arm'||kind==='forearm'){var sh=fr&&kind==='forearm'?shS:shT,Lq=kind==='upper_arm'?D.UA:D.FA,w=kind==='upper_arm'?(fr?18:15):(fr?10:11);
    ov=half(function(){return w},0,Lq+2,sh);return wrapClip(S,m,ov,fr&&kind==='upper_arm'?1:0)}
  if(kind==='neck'){var tx=S.tx;ov=fp('M'+f(tx-12)+',-52 L'+f(tx+12)+',-52 L'+f(tx+12)+',-36 Q'+f(tx)+',-24 '+f(tx-12)+',-36Z',shS);return wrapClip(S,m,ov)}
  if(kind==='torso'){var tx=S.tx,kw=S.sw/D.sw,bw=D.bw*kw,ax=bw*.47,tc=.5+.5*S.tc,wy=D.waistY,hy=D.hemY,back=nF(S.p.back,0),cxo=nF(S.p.turn,0)*30,x,yy,pp,ex='';
    if(!fr){for(x=-38;x<=38;x+=6.5){pp=[];for(yy=36;yy<=hy-4;yy+=14)pp.push([tx+x/D.sw*torsoW(S,yy)+nF(S.p.turn,0)*30*(1-Math.pow(x/D.sw,2)),yy]);
        ex+='<path d="M'+f(pp[0][0])+','+f(pp[0][1])+crp(pp)+'" fill="none" stroke="'+c.top2+'" stroke-width="1.1" opacity=".16"/>'}}
    else if(!back){var px=tx+12,py=92;ex+=L([[px,py],[px+7,py+7]],2,c.print)+L([[px+7,py],[px,py+7]],2,c.print)+L([[px+11,py+1],[px+18,py+8]],2,c.print)+L([[px+18,py+1],[px+11,py+8]],2,c.print)}
    /* shadow side: one shape (right 38% of the garment, follows the waist), bust: one darker cut shape under the bust line + one lighter crest shape */
    ov='<g transform="translate('+f(tx)+',0)">'+strip(function(y){return torsoW(S,y)},30,hy+2,.4,1.06,shT)+'</g>';
    if(!back)ov+=bustFront(S,tx+cxo,bw,fr);
    var i=m.lastIndexOf('<g clip-path');m=m.slice(0,m.indexOf('>',i)+1)+ex+ov+'</g>';return m}
  if(kind==='torso_side'){var ap=D.ap,wy=D.waistY,hy=D.hemY,k=fr?.8:1,ex='';
    ov=fp('M-48,-10 L-9,-10 C-8,40 -9,'+wy+' -11,'+(wy+14)+' L-13,'+hy+' L-48,'+hy+'Z',shT)+bustSide(S,ap,fr);
    var i=m.lastIndexOf('<g clip-path');m=m.slice(0,m.indexOf('>',i)+1)+ov+'</g>';return m}
  return m}
['upper_arm','forearm','upper_leg','lower_leg','upper_leg_side','pelvis','pelvis_side','torso','torso_side','neck'].forEach(function(nm){var o=PF[nm];PF[nm]=function(S){var m=LIT(S,o.apply(this,arguments),nm,arguments);if(nm==='pelvis'&&!nF(S.p.sit,0)){var u=S.uid;m='<defs><linearGradient id="'+u+'pmg" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="58"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="'+u+'pm" maskUnits="userSpaceOnUse" x="-120" y="-120" width="240" height="240"><rect x="-120" y="-120" width="240" height="240" fill="url(#'+u+'pmg)"/></mask></defs><g mask="url(#'+u+'pm)">'+m+'</g>'}return m}});
/* seated thigh: ONE tapered shape per leg. straight = flat top under the torso hem, inner edge on the centre line (legs meet only at the groin);
   3/4 = round back end. local +y toward the knee. */
PF.thigh_sit=function(S,Ln,sd,sc,q3){Ln=Ln||52;sc=sc||1;var c=S.c,D=S.dim,a=(D.legA-1)*sc,kr=(D.legB+3.8)*sc,hs=nF((S.p.legs||{}).spread,D.hs),s=sd||-1,ai=Math.min(hs+1,a*.9),yt=-26;
  function X(v){return f(s*v)}
  var d;
  if(q3)d='M'+f(-a)+',0 A'+f(a)+','+f(a*.55)+' 0 0 1 '+f(a)+',0 C'+f(a*1.03)+','+f(Ln*.3)+' '+f(kr+5)+','+f(Ln*.62)+' '+f(kr)+','+f(Ln)+' A'+f(kr)+','+f(kr)+' 0 0 1 '+f(-kr)+','+f(Ln)+' C'+f(-kr-5)+','+f(Ln*.62)+' '+f(-a*1.03)+','+f(Ln*.3)+' '+f(-a)+',0Z';
  else d='M'+X(a)+','+f(yt+12)+' Q'+X(a)+','+f(yt)+' '+X(a-12)+','+f(yt)+' L'+X(-ai)+','+f(yt)+' C'+X(-ai)+','+f(Ln*.3)+' '+X(-kr-4)+','+f(Ln*.62)+' '+X(-kr)+','+f(Ln)+' A'+f(kr)+','+f(kr)+' 0 0 '+(s<0?1:0)+' '+X(kr)+','+f(Ln)+' C'+X(kr+5)+','+f(Ln*.62)+' '+X(a*1.03)+','+f(Ln*.3)+' '+X(a)+','+f(yt+12)+'Z';
  return '<path d="'+d+'" fill="'+c.pants+'"/>'};
PF.thigh_sit=(function(o){return function(S,Ln,sd,sc,q3){var m=LIT(S,o.apply(this,arguments),'thigh_sit',arguments),u=S.uid;if(!q3)m='<defs><linearGradient id="'+u+'tmg" gradientUnits="userSpaceOnUse" x1="0" y1="-26" x2="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="'+u+'tm" maskUnits="userSpaceOnUse" x="-120" y="-60" width="240" height="400"><rect x="-120" y="-60" width="240" height="400" fill="url(#'+u+'tmg)"/></mask></defs><g mask="url(#'+u+'tm)">'+m+'</g>';return m}})(PF.thigh_sit);
/* ===== MAMA overlay (rig "mama" 0.2.0-draft): Vadik's mother, ~46. Appended INSIDE the cast_cut IIFE (re-uses P/E/L/sh/uid/PF/drawChar/LIT/strip/capF/torsoPath).
   Look: cast_sheet22 variant 2 (poc_cast24): wavy lob built as hair_back / hair_side / fringe layers, round thin glasses (detachable, default ON), zip knit yellow jacket over a tee,
   straight trousers, white sneakers (house slippers via st.shoes='slipper'), phone prop. Face and hair are drawn flat in the rig head frame (no gradients). Every Mama-only branch is gated on isM(S);
   kristina/friend output is untouched. */
var vM={i:9,w:41,t:-85,wy:-52,cy:1.5,cn:21,ed:19.6,es:1.17,fs:1.3,lid:5,gx:0,rot:-6,YR:22};
vM.sd=eggP({w:vM.w,t:vM.t,wy:vM.wy,cy:vM.cy,cn:vM.cn});
var HM=GEO.hair(vM.sd,4.4,5.4);
var CHM=(function(){var o,g14,g15;G14={sk:vM.sd,ex:vM.w-.5,ed:vM.ed};G15={es:vM.es,cu:0,ang:1.2};G.n=1;
  try{o=mk21(vM,HM);g14={sk:G14.sk,ex:G14.ex,ed:G14.ed};g15={es:G15.es,cu:G15.cu,ang:G15.ang}}finally{G.n=0;G15={es:1,cu:0}}
  return {id:'mama',o:o,g14:g14,g15:g15,skGrad:'fSkM',H:HM,v:vM,sd:vM.sd,
   pal:{skin:'#f0cfb4',skin2:'#d6b090',skinSh:'#d2ab8e',hair:'#8d6a4a',hair2:'#725339',hair3:'#5a4230',silv:'#d9b04e',gold:'#d9b04e',
        top:'#d9ab3e',top2:'#b8862d',topHi:'#e8c46a',collarIn:'#b8862d',blouse:'#93a9bf',blouse2:'#7d93a9',pants:'#4a5873',pants2:'#3a465c',pantsHi:'#5f6e8c',
        shoe:'#f3f1ea',shoe2:'#d9d6cf',sole:'#c9c5bb',shoeAcc:'#e9e4da',mouthIn:'#4a1c26',teeth:'#f7f0e6',tongue:'#d4666e',shadow:'#0b1020',pantsHi2:'#566585',pantsSh:'#37425a',pantsSh2:'#2d3649',topHi2:'#ecc874',topSh:'#bb8c31'},
   dim:{sw:45,shY:27,UA:92,FA:82,UL:143,LL:139,hipY:246,hemY:258,waistY:148,ww:50,hemW:62,ankleY:528,floor:548,neckY:-22,
        sitDy:99,hs:21,ank:28,boot:0,tee:0,hips:61,wTop:46,legA:44,legB:19.5,calfW:19.6,ankW:16.5,kneeW:19,bw:50,rb:46,ap:40}}})();
CHM.lipK=1;CHM.mwK=1;CHM.wideK=0;
CHM.o.skin=CHM.pal.skin;
var SLIP={shoe:'#c9906b',shoe2:'#a8704f',sole:'#7a553f',shoeAcc:'#f1dcc0'},SNEAK={shoe:'#f3f1ea',shoe2:'#d9d6cf',sole:'#c9c5bb',shoeAcc:'#e9e4da'};


/* ================= HEAD (0.2.0): cast_sheet22 variant 2 look, drawn in the rig head frame ================= */
/* head frame of the rig: eye line y=-45, skull top -85, chin +1.6. Own units (cast_sheet22): eye line y=0, top -60, chin +70, scale KH about the eye line. */
var KH=.68,MGL=1,MSH='sneaker';
var MC={sk:'#f0cfb4',sk2:'#d6b090',hair:'#8d6a4a',hair2:'#725339',hl:'#a98262',root:'#bdb7ae',brow:'#6d5240',iris:'#8a7040',lid:'#92705c',gl:'#b0893e',lip:'#ae766d',lip2:'#c4917f',gold:'#d9b04e',mouthIn:'#4a1c26',teeth:'#f7f0e6',tongue:'#d4666e'};
var MB={ir:1.3,up:1.6,lo:1.1,open:1.08,sp:2,tilt:3,dyb:-1.5,cr:.5,lw:1.3};/* base eye/brow treatment = eyes_mama.png cell 2 (hazel, x1.3 iris, kind crease) */
function m2c(c,a){var n=parseInt(c.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,cl=function(x){return Math.max(0,Math.min(255,Math.round(x)))};return '#'+((1<<24)|(cl(r*a)<<16)|(cl(g*a)<<8)|cl(b*a)).toString(16).slice(1)}
function m2sp(pts){var n=pts.length,g=function(i){return pts[((i%n)+n)%n]},d='M'+f(pts[0][0])+','+f(pts[0][1]),i;
  for(i=0;i<n;i++){var p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);d+=' C'+f(p1[0]+(p2[0]-p0[0])/6)+','+f(p1[1]+(p2[1]-p0[1])/6)+' '+f(p2[0]-(p3[0]-p1[0])/6)+','+f(p2[1]-(p3[1]-p1[1])/6)+' '+f(p2[0])+','+f(p2[1])}
  return d+'Z'}
function m2sym(R){var top=R[0],bot=R[R.length-1],mid=R.slice(1,-1);return [top].concat(mid,[bot],mid.slice().reverse().map(function(p){return [-p[0],p[1]]}))}
var M2SK=m2sp(m2sym([[0,-60],[30,-55],[47,-38],[53,-12],[53,12],[50,30],[44,45],[34,58],[18,67],[0,70]]));
var M2PRO=m2sp([[6,-62],[34,-54],[47,-32],[49,-8],[49,14],[48,32],[47,48],[43,61],[33,70],[16,74],[0,73],[-14,67],[-34,58],[-50,38],[-56,10],[-54,-22],[-40,-50],[-18,-61]]);
function m2frame(inner,extra){return '<g transform="translate(0,-45) scale('+KH+')"'+(extra||'')+'>'+inner+'</g>'}
/* ---- hair layers (wavy lob): hair_back (behind neck + shoulders), hair_side (hugs the skull, tucked behind both ears), fringe (swept) ---- */
var M2LOB=[[0,-71],[38,-66],[58,-42],[64,-8],[66,34],[71,56],[65,76],[70,94],[64,108],[0,110]];
function m2backMass(){return P(m2sp(m2sym(M2LOB)),MC.hair2)}
function m2sideFront(){var o='';
  [-1,1].forEach(function(s){o+='<g filter="url(#s2)" transform="scale('+s+',1)">'+P(m2sp([[3,-69],[30,-65],[51,-46],[56,-18],[55,-6],[50,-9],[47,-20],[38,-30],[26,-40],[10,-46]]),MC.hair)
    +P('M54,-32 C58,-24 58,-14 55,-6 C52,-14 50,-22 48,-32Z',MC.hair2,' opacity=".55"')+P('M26,-62 C38,-55 48,-44 52,-28 C44,-42 34,-50 20,-56Z',MC.hl,' opacity=".55"')+'</g>'});
  return o}
function m2fringe(){return '<g filter="url(#s2)">'+P(m2sp([[-11,-69],[22,-67],[46,-54],[55,-34],[46,-32],[33,-39],[18,-46],[2,-52],[-8,-57]]),MC.hair)
  +P('M-9,-69 C6,-72 26,-68 40,-58 C26,-65 8,-67 -4,-65 C-8,-66 -10,-67 -9,-69Z',MC.root)+P('M26,-58 C38,-52 46,-44 49,-34 C42,-42 34,-48 22,-52Z',MC.hl,' opacity=".6"')+'</g>'}
PF.hair_back=function(S){if(!isM(S))return '';if(nF(S.p.back,0))return '';
  return '<g transform="scale('+f(.9+.1*S.ca)+',1)">'+m2frame(m2backMass())+'</g>'};
PF.hair_front=function(S){if(!isM(S))return '';
  return '<g transform="translate('+f(S.fx*.3)+',0) scale('+f(.9+.1*S.ca)+',1)">'+m2frame(m2sideFront()+m2fringe())+'</g>'};
PF.ear=function(S){if(!isM(S))return '';
  return '<g transform="translate('+f(S.fx*.3)+',0) scale('+f(.9+.1*S.ca)+',1)">'+m2frame('<circle cx="-58" cy="24" r="2.6" fill="'+MC.gold+'"/><circle cx="58" cy="24" r="2.6" fill="'+MC.gold+'"/>')+'</g>'};
/* ---- face parts (own units) ---- */
function m2eye(S,s){var X=S.X,sk=S.c.skin,wr=m2c(sk,.84),id=uid(),sht=cF(X.shut,0,1);
  var o_=MB.open*X.open*(1-.75*sht),lo=Math.max(.35,MB.lo+.22*X.lo-.5*X.sq),r=6.2*MB.ir*X.irs,up=MB.up,lc=MC.lid;
  var gx=cF(S.gxu*.45,-3,3)*s,gy=cF(S.gyu*.45,-2,2.2),ix=.8+gx,iy=.2+gy;
  var g='<g transform="translate('+f(s*(22+MB.sp))+',0) scale('+s+',1)">';
  if(X.shut>=.6){
    if(X.happy)return g+'<path d="M-11.5,2.6 Q0,-9.5 11.5,2.6" fill="none" stroke="#6b4a3a" stroke-width="2.6" stroke-linecap="round"/><path d="M-9,8 C-3,12 5,12 10,8 C5,10 -3,10 -9,8Z" fill="'+m2c(sk,.8)+'" opacity=".3"/></g>';
    return g+'<path d="M-11.5,0.6 Q0,7 11.5,0.6" fill="none" stroke="#6b4a3a" stroke-width="2.4" stroke-linecap="round"/></g>'}
  var shape='M-12.5,1 C-6,'+f(1-9.5*o_)+' 6,'+f(1-9.5*o_)+' 12.5,'+f(1-up)+' C6,'+f(1+5.4*lo)+' -6,'+f(1+5.4*lo)+' -12.5,1Z';
  var cl=E(ix-r*.34,iy-r*.38,r*.3,r*.3,'#fff')+E(ix+r*.4,iy+r*.42,r*.17,r*.17,'#fff',' opacity=".9"');
  var lw=1+5.4*lo;
  g+=P('M-14,-7 C-6,-14.5 6,-14.5 14,-7 C6,-10.5 -6,-10.5 -14,-7Z',wr,' opacity=".3"');
  g+=P('M-11,'+f(8+2*lo)+' C-5,'+f(12+2*lo)+' 5,'+f(12+2*lo)+' 11,'+f(8+2*lo)+' C5,'+f(10.4+2*lo)+' -5,'+f(10.4+2*lo)+' -11,'+f(8+2*lo)+'Z',wr,' opacity=".35"');
  var cr=cF(MB.cr+X.cr,0,1.4);if(cr>.05)g+=P('M-9,'+f(12.5+2*lo)+' C-3,'+f(16+2*lo)+' 5,'+f(16+2*lo)+' 11,'+f(12+2*lo)+' C5,'+f(14.4+2*lo)+' -3,'+f(14.4+2*lo)+' -9,'+f(12.5+2*lo)+'Z',m2c(sk,.8),' opacity="'+f(.18+.12*cr)+'"');
  g+='<defs><clipPath id="'+id+'"><path d="'+shape+'"/></clipPath></defs>'+P(shape,'#f6f2ea');
  g+='<g clip-path="url(#'+id+')">'+E(ix,iy,r,r,MC.iris)+E(ix,iy,r*.45*X.pup,r*.45*X.pup,'#1d1511')+cl
    +P('M-10.5,'+f(1+4.6*lo)+' C-5,'+f(1+7.4*lo)+' 5,'+f(1+7.4*lo)+' 10.5,'+f(1+4.6*lo)+' C5,'+f(1+5.4*lo)+' -5,'+f(1+5.4*lo)+' -10.5,'+f(1+4.6*lo)+'Z','#fff',' opacity=".4"')
    +P('M-14,-10 L14,-10 L14,'+f(-2-up*.4)+' C6,-5 -6,-5 -14,-2Z',m2c(sk,.95),' opacity=".35"')+'</g>';
  g+='<path d="M-13,1.4 C-6,'+f(1.4-9.5*o_)+' 6,'+f(1.4-9.5*o_)+' 13,'+f(1.4-up)+'" fill="none" stroke="'+lc+'" stroke-width="'+MB.lw+'" stroke-linecap="round"/>';
  return g+'</g>'}
function m2brow(S,s){var X=S.X,tl=MB.tilt+(s<0?X.btL:X.btR),dy=MB.dyb-(X.by+(s<0?X.bdL:X.bdR)),yi=-16+dy-tl,yo=-16+dy+tl*.4;
  return '<g transform="translate('+f(s*MB.sp)+',0) scale('+s+',1)">'+P('M8,'+f(yi)+' C16,'+f(yi-6)+' 28,'+f(yo-7)+' 38,'+f(yo)+' C29,'+f(yo-2.5)+' 18,'+f(yi-2)+' 8,'+f(yi+4.5),MC.brow)+'</g>'}
function m2nose(sk){var wr=m2c(sk,.86);
  return '<g filter="url(#s2)">'+P('M-3.4,-1 C-4.4,9 -9.4,13.5 -9.8,19 C-9.8,24 -4.6,26.4 0,26 C4.6,26.4 9.8,24 9.8,19 C9.4,13.5 4.4,9 3.4,-1Z',m2c(sk,.975))+'</g>'+P('M1.8,0 C4,9 9.4,13.5 9.8,19 C9.8,24 5,26 0,26Z',wr,' opacity=".4"')+E(-4.6,22,2,1.1,'#b27a6a',' opacity=".6"')+E(4.6,22,2,1.1,'#b27a6a',' opacity=".6"')}
function m2mouth(S){var X=S.X,e=S.eOpen,mc=X.mc,w=14*X.mw+mc,cy=42-mc*2.2,cyR=cy-X.ms*2.2,ly=50+mc*1.5,lip=MC.lip,lip2=MC.lip2,o='';
  if(X.trap){var H=3+e*6.5,rx=7.2*X.mw,oy=cy+3;
    return E(0,oy,rx,H,MC.mouthIn)+'<ellipse cx="0" cy="'+f(oy)+'" rx="'+f(rx)+'" ry="'+f(H)+'" fill="none" stroke="'+lip+'" stroke-width="2.6"/><path d="M'+f(-rx-2)+','+f(oy-1)+' L'+f(-rx-4)+','+f(oy+3.4)+' M'+f(rx+2)+','+f(oy-1)+' L'+f(rx+4)+','+f(oy+3.4)+'" stroke="'+lip+'" stroke-width="2" stroke-linecap="round" fill="none"/>'}
  if(e<.06){
    return P('M'+f(-w)+','+f(cy)+' C-8,'+f(cy-2.2)+' -3,'+f(cy-1.6)+' 0,'+f(cy-1)+' C3,'+f(cy-1.6)+' 8,'+f(cyR-2.2)+' '+f(w)+','+f(cyR)+' C8,'+f(cyR+2.2)+' -8,'+f(cy+2.2)+' '+f(-w)+','+f(cy)+'Z',lip)
      +P('M'+f(-w+1)+','+f(cy+.8)+' C-7,'+f(ly)+' 7,'+f(ly)+' '+f(w-1)+','+f(cyR+.8)+' C7,'+f((cy+cyR)/2+3.4)+' -7,'+f((cy+cyR)/2+3.4)+' '+f(-w+1)+','+f(cy+.8)+'Z',lip2)}
  var Hh=e*17,u=uid(),b0=cy+.5,b1=cyR+.5,hb=Hh*1.3+1;
  var inner='M'+f(-w+1.5)+','+f(b0)+' C'+f(-w*.5)+','+f(cy-2.2)+' '+f(w*.5)+','+f(cyR-2.2)+' '+f(w-1.5)+','+f(b1)+' C'+f(w*.6)+','+f(cy+hb)+' '+f(-w*.6)+','+f(cy+hb)+' '+f(-w+1.5)+','+f(b0)+'Z';
  o+='<defs><clipPath id="'+u+'"><path d="'+inner+'"/></clipPath></defs>'+P(inner,MC.mouthIn)+'<g clip-path="url(#'+u+')">';
  var tt=X.mt>=0?X.mt:(e>=.35?cF((e-.3)*1.5,0,1):0),tg=X.mg>=0?X.mg:(e>=.5?cF((e-.45)*2,0,1):0);
  if(tt>0)o+='<rect x="'+f(-w)+'" y="'+f(cy-3)+'" width="'+f(2*w)+'" height="'+f(3+Math.min(7,Hh*.5*tt+2))+'" fill="'+MC.teeth+'"/>';
  if(tg>0)o+=E(0,cy+Hh*.9,w*.5,Hh*.35*tg+1,MC.tongue);
  o+='</g>';
  o+=P('M'+f(-w)+','+f(b0)+' C'+f(-w*.5)+','+f(cy-6.2)+' '+f(w*.5)+','+f(cyR-6.2)+' '+f(w)+','+f(b1)+' C'+f(w*.5)+','+f(cyR-2.2)+' '+f(-w*.5)+','+f(cy-2.2)+' '+f(-w)+','+f(b0)+'Z',lip);
  o+=P('M'+f(-w+.5)+','+f(cy+.8)+' C'+f(-w*.6)+','+f(cy+Hh*1.3+6)+' '+f(w*.6)+','+f(cy+Hh*1.3+6)+' '+f(w-.5)+','+f(cyR+.8)+' C'+f(w*.6)+','+f(cy+hb)+' '+f(-w*.6)+','+f(cy+hb)+' '+f(-w+.5)+','+f(cy+.8)+'Z',lip2);
  return o}
function m2glasses(S){var fr=MC.gl,o='',a=S?cF(Math.abs(S.fx/KH)/16,0,1):0,far=S&&S.fx>0?1:-1;
  [-1,1].forEach(function(s){var isF=s===far&&a>0,k=isF?1-.3*a:1,cx=s*22-(isF?s*3.5*a:0),rx=15.5*k;
    o+='<ellipse cx="'+f(cx)+'" cy="1" rx="'+f(rx)+'" ry="15.5" fill="rgba(200,222,240,.08)" stroke="'+fr+'" stroke-width="2"/><path d="M'+f(cx-10*k)+',-9 C'+f(cx-8*k)+',-11 '+f(cx-4*k)+',-13 '+f(cx-1*k)+',-13.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>'});
  var fcx=far*(22-3.5*a),fe=fcx-far*15.5*(1-.3*a),ne=-far*37;
  o+='<path d="M'+f(-far*(22-15.5)+0)+',-2 C'+f(-far*3)+',-5 '+f(far*1)+',-5 '+f(fe)+',-2" fill="none" stroke="'+fr+'" stroke-width="2"/>';
  /* near temple arm always; far arm only when almost frontal */
  o+='<path d="M'+ne+',0 L'+f(ne*(1+.45*a))+',-3" stroke="'+fr+'" stroke-width="2" fill="none" stroke-linecap="round"/>';
  if(a<.25)o+='<path d="M'+f(far*37)+',0 L'+f(far*53)+',-3" stroke="'+fr+'" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return o}
PF.glasses=function(S){if(!isM(S)||!MGL)return '';return m2frame(m2glasses(S))};
function m2face(S){var X=S.X,sk=S.c.skin,wr2=m2c(sk,.8),o='',tb=X.blush*.3;
  o+='<ellipse cx="-30" cy="24" rx="13" ry="8" fill="#e2a193" opacity="'+f(.3+tb)+'"/><ellipse cx="30" cy="24" rx="13" ry="8" fill="#e2a193" opacity="'+f(.3+tb)+'"/>';
  if(X.pale>0)o+='<ellipse cx="-30" cy="22" rx="14" ry="10" fill="#c9bdb0" opacity="'+f(.3*X.pale)+'"/><ellipse cx="30" cy="22" rx="14" ry="10" fill="#c9bdb0" opacity="'+f(.3*X.pale)+'"/>';
  [-1,1].forEach(function(s){o+='<g transform="scale('+s+',1)"><path d="M16,28 C21,32 23,36 22,40 C20,37 18,34 14,31Z" fill="'+wr2+'" opacity=".3"/></g>'});
  [-1,1].forEach(function(s){o+=m2eye(S,s)});
  [-1,1].forEach(function(s){o+=m2brow(S,s)});
  o+=m2nose(sk)+m2mouth(S);
  if(X.tear>0)[-1,1].forEach(function(s){var x=s*(22+MB.sp+8);o+='<path d="M'+f(x)+',12 C'+f(x+4.6)+',19 '+f(x+4.8)+',24 '+f(x)+',26.4 C'+f(x-4.8)+',24 '+f(x-4.6)+',19 '+f(x)+',12Z" fill="#bfe3f4"/><path d="M'+f(x-1.4)+',17 C'+f(x-2.6)+',20 '+f(x-2.6)+',21.6 '+f(x-1.6)+',22.8" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/>'});
  if(X.sweat>0)o+='<g transform="translate(36,-40) scale(.9)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/><path d="M-1.5,-3 C-3,0 -3,2 -2,3" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/></g>';
  if(X.sweat>1)o+='<g transform="translate(-42,8) scale(.8)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/></g>';
  if(MGL)o+=m2glasses(S);
  return o}
/* skull (flat skin + one flat shadow shape), ears behind it, features clipped to it */
PF.skull=function(S){if(!isM(S))return '';var sk=S.c.skin,id=uid(),cs=Math.max(.6,S.ca),o='';
  [-1,1].forEach(function(s){o+='<path d="M'+s*52+',-12 C'+s*66+',-14 '+s*68+',8 '+s*60+',22 C'+s*56+',26 '+s*52+',24 '+s*52+',18Z" fill="'+m2c(sk,.95)+'"/><path d="M'+s*55+',-4 C'+s*61+',-4 '+s*62+',7 '+s*58+',14 C'+s*56+',10 '+s*55+',4 '+s*55+',-4Z" fill="'+m2c(sk,.82)+'" opacity=".7"/>'});
  o+=P(M2SK,sk)+'<defs><clipPath id="'+id+'"><path d="'+M2SK+'"/></clipPath></defs>';
  o+='<g clip-path="url(#'+id+')"><path d="M34,-90 L90,-90 L90,90 L18,90 C34,50 40,0 34,-90Z" fill="'+m2c(sk,.92)+'" opacity=".45"/><g transform="translate('+f(S.fx/KH)+','+f(S.pitch/KH)+') scale('+f(cs)+',1)">'+m2face(S)+'</g></g>';
  return '<g transform="scale('+f(.9+.1*S.ca)+',1)">'+m2frame(o)+'</g>'};
/* ---- profile (faces +x) ---- */
function m2backS(){return P(m2sp([[6,-72],[-40,-64],[-66,-22],[-70,36],[-62,54],[-72,72],[-64,90],[-52,104],[-26,102],[-20,60],[-8,-30]]),MC.hair2)}
function m2capS(){return '<g filter="url(#s2)">'+P(m2sp([[6,-72],[38,-62],[50,-38],[44,-32],[30,-34],[16,-26],[6,-17],[-6,-19],[-20,-15],[-26,6],[-28,30],[-30,50],[-44,46],[-56,18],[-60,-26],[-40,-60]]),MC.hair)
  +P('M-26,-68 C-6,-76 18,-72 32,-62 C16,-69 0,-70 -16,-66Z',MC.root)+P('M-56,-10 C-54,18 -48,38 -36,52 C-42,30 -48,6 -48,-20Z',MC.hair2,' opacity=".5"')+P('M4,-70 C20,-68 34,-58 40,-46 C30,-54 16,-60 2,-62Z',MC.hl,' opacity=".6"')+'</g>'}
var M2PX=8;
function m2sideBack(S){var hd=S.p.head||{},tilt=nF(hd.tilt,0),hx=nF(hd.dx,0)+4,hy=S.dim.neckY+nF(hd.dy,0);
  return '<g transform="translate('+f(hx)+','+f(hy)+') rotate('+f(tilt)+') scale('+HSC+')">'+m2frame('<g transform="translate('+M2PX+',0)">'+m2backS()+'</g>')+'</g>'}
PF.head_profile=function(S){if(!isM(S))return '';var X=S.X,sk=S.c.skin,wr=m2c(sk,.86),id=uid(),e=S.eOpen,o='';
  o+=P('M20,66 C25,75 20,84 8,86 C-2,87 -10,81 -14,70Z',m2c(sk,.93))+P('M24,70 C20,77 10,80 -2,79 C6,84 18,84 24,70Z',m2c(sk,.8),' opacity=".7"');
  o+=P(M2PRO,sk)+'<defs><clipPath id="'+id+'"><path d="'+M2PRO+'"/></clipPath></defs>';
  o+='<g clip-path="url(#'+id+')"><path d="M-100,-90 L-40,-90 C-52,-20 -52,40 -44,90 L-100,90Z" fill="'+m2c(sk,.92)+'" opacity=".45"/></g>';
  o+=P('M30,20 C35,25 37,30 36,35 C34,31 31,27 27,23Z',wr,' opacity=".3"')+E(22,22,12,7.5,'#e2a193',' opacity="'+f(.3+X.blush*.3)+'"');
  var sht=cF(X.shut,0,1),o_=MB.open*X.open*(1-.75*sht),lo=Math.max(.35,MB.lo+.22*X.lo-.5*X.sq),r=4.4*X.irs,gx=S.gxu*.3,gy=S.gyu*.3;
  var tl=MB.tilt+X.btR,dy=MB.dyb-(X.by+X.bdR);
  o+='<path d="M28,'+f(-13+dy*.6-tl*.3)+' C34,'+f(-19+dy*.6-tl*.5)+' 46,'+f(-19+dy*.6+tl*.1)+' 52,'+f(-13+dy*.6+tl*.2)+' C45,'+f(-15+dy*.6)+' 35,'+f(-15+dy*.6-tl*.3)+' 28,'+f(-10+dy*.6-tl*.4)+'Z" fill="'+MC.brow+'"/>';
  if(X.shut>=.6)o+=X.happy?'<path d="M26,1 Q36,-9 47,1" fill="none" stroke="#6b4a3a" stroke-width="2.4" stroke-linecap="round"/>':'<path d="M26,0 Q36,6 47,0" fill="none" stroke="#6b4a3a" stroke-width="2.2" stroke-linecap="round"/>';
  else{var shp='M26,0 C31,'+f(-7*o_)+' 41,'+f(-7*o_)+' 47,0 C41,'+f(5.2*lo)+' 31,'+f(5.2*lo)+' 26,0Z',eid=uid();
    o+='<defs><clipPath id="'+eid+'"><path d="'+shp+'"/></clipPath></defs>'+P(shp,'#f6f2ea')+'<g clip-path="url(#'+eid+')">'+E(42+gx,.2+gy,r,r,MC.iris)+E(42.6+gx,.2+gy,r*.45*X.pup,r*.45*X.pup,'#1d1511')+E(41+gx,-1.4+gy,1.1,1.1,'#fff')+E(43.6+gx,1.6+gy,.6,.6,'#fff',' opacity=".8"')+'</g><path d="M25.5,0.6 C31,'+f(-7.2*o_)+' 41,'+f(-7.2*o_)+' 47.4,0.4" fill="none" stroke="'+MC.lid+'" stroke-width="1.5" stroke-linecap="round"/>'}
  o+='<g filter="url(#s2)">'+P('M45,-8 C46.4,0 48,7 52.6,13 C56.4,17.4 57,21.4 54.6,24 C51.6,26 47.6,25.6 44,24.4Z',m2c(sk,.975))+'</g>'+P('M50,14 C54,17 55.6,20.4 54,23 C51.6,24.4 48.6,23.8 47,21Z',wr,' opacity=".4"')+E(50,22.4,2.1,1.1,'#b27a6a',' opacity=".6"');
  /* lips: closed or opening (lower lip drops) */
  var Hh=e*10,mc=X.mc,dyc=-mc*1.2;
  if(X.trap){o+=E(42,43+dyc,4.2,3+e*5,MC.mouthIn)+'<ellipse cx="42" cy="'+f(43+dyc)+'" rx="4.2" ry="'+f(3+e*5)+'" fill="none" stroke="'+MC.lip+'" stroke-width="2.2"/>'}
  else{
    if(Hh>1.2)o+=P('M38,'+f(41.2+dyc)+' L46.2,'+f(41.2+dyc)+' L44.6,'+f(41.6+Hh+dyc)+' L38,'+f(41.2+Hh+dyc)+'Z',MC.mouthIn);
    o+=P('M38,'+f(36.8+dyc)+' C42,'+f(35.8+dyc)+' 46,'+f(37.2+dyc)+' 47,'+f(41.4+dyc)+' C44,'+f(42.4+dyc)+' 41,'+f(42.6+dyc)+' 38,'+f(42.4+dyc)+'Z',MC.lip)
     +P('M38,'+f(42.4+Hh+dyc)+' C42,'+f(42.4+Hh+dyc)+' 46,'+f(43.2+Hh+dyc)+' 46,'+f(46.4+Hh+dyc)+' C45,'+f(50+Hh+dyc)+' 41,'+f(51+Hh+dyc)+' 38,'+f(49+Hh+dyc)+'Z',MC.lip2)}
  if(MGL)o+='<ellipse cx="46" cy="1" rx="5.5" ry="12" fill="rgba(200,222,240,.1)" stroke="'+MC.gl+'" stroke-width="2"/><path d="M42,0 L-14,-3" stroke="'+MC.gl+'" stroke-width="2" stroke-linecap="round"/>';
  if(X.sweat>0)o+='<g transform="translate(30,-44) scale(.8)"><path d="M0,-8 C5,-1 6,4 0,7 C-6,4 -5,-1 0,-8Z" fill="#bfe3f4"/></g>';
  var ear='<g filter="url(#s2)"><path d="M-22,-14 C-8,-20 4,-6 4,8 C2,22 -10,26 -17,20 C-23,14 -26,-8 -22,-14Z" fill="'+m2c(sk,.96)+'"/><path d="M-15,-6 C-8,-8 -4,2 -4,9 C-6,15 -14,15 -16,8Z" fill="'+m2c(sk,.8)+'" opacity=".75"/></g><circle cx="-10" cy="26" r="2.6" fill="'+MC.gold+'"/>';
  o+=m2capS()+ear;
  return m2frame('<g transform="translate('+M2PX+',0)">'+o+'</g>')};
/* back of the head: lob hair hangs in front of the neck and shoulders (seen from behind), parting, soft wave */
PF.head_back=function(S){if(!isM(S))return '';
  /* layers: dark back mass, two side curtains parted at the crown (V of back mass shows below), wave shadow, sheen, strand gaps */
  var side=function(m){var q=function(pts){return pts.map(function(p){return [m*p[0],p[1]]})};
    return P(m2sp(q([[-3,-70],[-34,-64],[-58,-40],[-65,-4],[-67,36],[-62,60],[-66,82],[-60,104],[-44,106],[-26,98],[-12,76],[-6,34],[-3,-10],[-2,-40]])),MC.hair)
     +P(m2sp(q([[-66,40],[-60,62],[-64,84],[-60,104],[-46,104],[-40,86],[-46,66],[-52,48]])),MC.hair2,' opacity=".5"')
     +'<path d="'+m2sp(q([[-30,-58],[-44,-40],[-54,-14],[-57,14]])).replace(/ Z$/,'')+'" fill="none" stroke="'+MC.hair2+'" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>'
     +'<path d="M'+m*-48+',50 C'+m*-40+',66 '+m*-44+',84 '+m*-40+',100" stroke="'+MC.hair2+'" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>'};
  var inner=P(m2sp(m2sym(M2LOB)),MC.hair2)+P('M-26,-30 C-12,10 -14,60 -22,100 L22,100 C14,60 12,10 26,-30Z','#5d4630',' opacity=".4"')+side(1)+side(-1)
    +'<path d="M0,-70 C1,-52 -1,-34 0,-18 C1,-8 -2,2 0,10" stroke="'+MC.root+'" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".5"/><path d="M0,-70 C1,-52 -1,-34 0,-18" stroke="'+MC.hair2+'" stroke-width="1.2" fill="none" opacity=".6"/>'
    +'<path d="M-34,-52 C-22,-64 -4,-66 14,-62 C0,-60 -18,-54 -28,-40Z" fill="'+MC.hl+'" opacity=".55"/><path d="M-60,60 C-40,76 -20,78 -12,70 C-30,70 -48,64 -60,60Z" fill="'+MC.hair2+'" opacity=".45"/><path d="M60,60 C40,76 20,78 12,70 C30,70 48,64 60,60Z" fill="'+MC.hair2+'" opacity=".45"/>';
  return '<g transform="scale('+f(.9+.1*S.ca)+',1)">'+m2frame(inner)+'</g>'};


/* ================= BODY (0.2.0): zip knit jacket over a tee, straight trousers, sneakers (or house slippers), softly rounded ================= */
function isM(S){return S.ch.id==='mama'}
var PFtorso0=PF.torso;
PF.torso=function(S){if(!isM(S))return PFtorso0(S);
  var c=S.c,tx=S.tx,u=S.uid,d=torsoPath(S),D=S.dim,hy=D.hemY,back=nF(S.p.back,0),tn=nF(S.p.turn,0),x0=tx+tn*24,sw=S.sw;S.torsoPath=d;
  var o='<defs><clipPath id="'+u+'tc"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.top+'"/><g clip-path="url(#'+u+'tc)">';
  if(!back){
    /* tee V-neck under the open collar */
    o+='<path d="M'+f(x0-17)+',-16 L'+f(x0+17)+',-16 C'+f(x0+15)+',8 '+f(x0+7)+',22 '+f(x0)+',30 C'+f(x0-7)+',22 '+f(x0-15)+',8 '+f(x0-17)+',-16Z" fill="'+c.blouse+'"/>';
    /* zip: tape, teeth, pull */
    o+='<path d="M'+f(x0)+',30 L'+f(x0)+','+(hy+8)+'" stroke="'+c.top2+'" stroke-width="4.2"/><path d="M'+f(x0)+',30 L'+f(x0)+','+(hy+8)+'" stroke="#efe2b8" stroke-width="1.3" stroke-dasharray="1.8 1.8"/>'
      +'<rect x="'+f(x0-3.4)+'" y="31" width="6.8" height="11" rx="2" fill="#c2c8d0"/>';
    /* knit ribs: soft vertical bands on both halves, flat */
    [-1,1].forEach(function(sd){o+='<path d="M'+f(x0+sd*22)+',44 L'+f(x0+sd*22)+','+(hy-14)+'" stroke="'+c.top2+'" stroke-width="1.6" opacity=".28"/><path d="M'+f(x0+sd*38)+',70 L'+f(x0+sd*40)+','+(hy-14)+'" stroke="'+c.top2+'" stroke-width="1.6" opacity=".22"/>'});
    /* slanted pockets */
    [-1,1].forEach(function(sd){var px=tx+sd*(D.hemW*.55)+tn*8;o+='<path d="M'+f(px-sd*9)+','+(hy-58)+' L'+f(px+sd*9)+','+(hy-50)+' L'+f(px+sd*9)+','+(hy-27)+' Q'+f(px)+','+(hy-22)+' '+f(px-sd*9)+','+(hy-27)+'Z" fill="'+c.top2+'" opacity=".55"/>'})
  }else{
    o+='<path d="M'+f(tx)+',6 L'+f(tx)+','+(hy-8)+'" stroke="'+c.top2+'" stroke-width="1.6" opacity=".3" stroke-linecap="round"/>'}
  /* rib hem band + flat far-side shade */
  o+='<path d="M'+f(tx-100)+','+(hy-13)+' Q'+f(tx)+','+(hy-1)+' '+f(tx+100)+','+(hy-13)+' L'+f(tx+100)+','+(hy+14)+' L'+f(tx-100)+','+(hy+14)+'Z" fill="'+c.top2+'"/>';
  for(var k=-90;k<=90;k+=9)o+='<path d="M'+f(tx+k)+','+f(hy-9+(k*k)/2700)+' L'+f(tx+k)+','+(hy+14)+'" stroke="'+c.topSh+'" stroke-width="1.2" opacity=".4"/>';
  o+='<g transform="translate('+f(tx)+',0)">'+strip(function(y){return torsoW(S,y)},30,hy+2,.4,1.06,c.topSh)+'</g>';
  return o+'</g>'};
var PFcollar0=PF.collar;
PF.collar=function(S){if(!isM(S)||nF(S.p.back,0))return PFcollar0(S);
  var c=S.c,tx=S.tx+nF(S.p.turn,0)*24,s='';
  [-1,1].forEach(function(sd){s+='<path d="M'+f(tx+sd*6)+',-7 L'+f(tx+sd*22)+',-4 Q'+f(tx+sd*25)+',-3 '+f(tx+sd*23.5)+',0 L'+f(tx+sd*5)+',32 L'+f(tx+sd*2.2)+',32 L'+f(tx+sd*14)+',2 Q'+f(tx+sd*15)+',-1 '+f(tx+sd*11)+',-4Z" fill="'+c.top2+'"/>'});
  return s};
/* neck: short and thick, flat skin with ONE flat shadow under the jaw */
var PFneck0=PF.neck;
PF.neck=function(S){if(!isM(S))return PFneck0(S);var c=S.c,tx=S.tx;
  return '<path d="M'+f(tx-17.5)+',-52 L'+f(tx+17.5)+',-52 C'+f(tx+17.5)+',-24 '+f(tx+18)+',-8 '+f(tx+22)+',-2 L'+f(tx+17)+',4 Q'+f(tx)+',9 '+f(tx-17)+',4 L'+f(tx-22)+',-2 C'+f(tx-18)+',-8 '+f(tx-17.5)+',-24 '+f(tx-17.5)+',-52 Z" fill="'+c.skin+'"/>'
   +'<path d="M'+f(tx-17.5)+',-30 L'+f(tx+17.5)+',-30 L'+f(tx+17.7)+',-22 C'+f(tx+10)+',-12 '+f(tx-10)+',-12 '+f(tx-17.7)+',-22Z" fill="'+c.skinSh+'" opacity=".5"/>'};
/* sleeves: knit to the wrist, full soft arms, ribbed cuff */
var PFua0=PF.upper_arm,PFfa0=PF.forearm;
PF.upper_arm=function(S){if(!isM(S))return PFua0(S);var c=S.c,UA=S.dim.UA;
  return LIT(S,'<path d="'+capF(UA,26.4,21.6)+'" fill="'+c.top+'"/>','upper_arm',[S])};
PF.forearm=function(S){if(!isM(S))return PFfa0(S);var c=S.c,FA=S.dim.FA;
  return LIT(S,'<path d="'+capF(FA,21.6,16.4)+'" fill="'+c.top+'"/>','forearm',[S])+'<path d="M-8.2,'+(FA-10)+' Q0,'+(FA-6)+' 8.2,'+(FA-10)+' L8,'+(FA+1)+' Q0,'+(FA+4)+' -8,'+(FA+1)+'Z" fill="'+c.top2+'"/>'};
/* straight trousers: elastic waist, no belt, no buckle */
var PFpel0=PF.pelvis;
PF.pelvis=function(S,hs){var m=PFpel0(S,hs);if(!isM(S))return m;return m.replace(/<rect x="-4"[^>]*\/>/,'')};
/* shoes: white sneakers (default) with an ankle sock, or soft house slippers (st.shoes='slipper') */
var PFfoot0=PF.foot;
PF.foot=function(S){if(!isM(S))return PFfoot0(S);var c=S.c,o='';
  if(MSH==='slipper'){
    o+='<path d="M-13,-14 L9,-14 C10,-6 12,0 17,4 L-17,6 C-15,0 -13,-6 -13,-14Z" fill="'+c.skin+'"/>';
    o+='<path d="M-24,12 C-26,17 -23,21 -16,21 L28,21 C40,21 46,16 44,11 L-22,11Z" fill="'+c.sole+'"/>';
    o+='<path d="M-24,13 C-27,6 -25,-1 -19,-3 L-12,-4 C-5,-5 4,-1 12,-1 C26,-2 40,0 44,9 C45,13 42,16 36,16 L-18,16 C-22,16 -24,15 -24,13Z" fill="'+c.shoe+'"/>';
    o+='<path d="M-24,13 C-27,6 -25,-1 -19,-3 L-12,-4 C-12,1 -13,8 -17,15 C-22,16 -24,15 -24,13Z" fill="'+c.shoe2+'"/>';
    o+='<path d="M-12,-4 C-5,-5 4,-1 12,-1 C8,2 -4,3 -12,-4Z" fill="'+c.shoeAcc+'"/>';
    return o+E(24,-2.5,5.6,4.2,c.shoeAcc)+E(24,-2.5,2.2,1.8,c.shoe2)}
  o+='<path d="M-12.5,-14 L10,-14 C11,-6 12,-2 14,0 L-16,3 C-15,-3 -13,-8 -12.5,-14Z" fill="'+c.shoe+'"/>';
  o+='<path d="M-24,13 C-26,19 -21,23 -14,23 L40,23 C47,23 50,18 48,13 L-22,12Z" fill="'+c.sole+'"/>';
  o+='<path d="M-23,14 C-25,6 -23,-2 -17,-4 L-12,-5 C-4,-6 6,-3 14,-3 C28,-4 42,0 47,11 C48,15 45,18 39,18 L-17,18 C-21,18 -23,16 -23,14Z" fill="'+c.shoe+'"/>';
  o+='<path d="M26,-1 C35,0 43,4 47,11 C41,15 30,15 22,13Z" fill="'+c.shoe2+'"/>';
  o+='<path d="M-23,2 C-25,8 -24,13 -23,14 L-16,14 L-16,1Z" fill="'+c.shoe2+'"/>';
  o+='<path d="M-1,-4 L5,2 M5,-4.4 L11,1.4 M11,-4.6 L17,0.6" stroke="#9aa1ad" stroke-width="1.8" stroke-linecap="round"/>';
  o+='<path d="M-20,15.6 L44,15.6" stroke="'+c.sole+'" stroke-width="1.2" opacity=".7"/>';
  return o};
/* side torso: no knit tension strokes, no blurred bust shadow; the lob's back hair is drawn first (behind neck and shoulders) */
var PFts0=PF.torso_side;
PF.torso_side=function(S){if(!isM(S))return PFts0(S);
  var c=S.c,D=S.dim,hy=D.hemY,wy=D.waistY,ap=36,u=S.uid;
  /* round profile: bust forward, soft belly under the jacket, full back, hem curved over the belly */
  var fo=[[11,-14],[16,6],[20,34],[24,50],[28,63],[ap-2,74],[ap,82],[ap-3,92],[ap-8,100],[ap-9,112],[ap-7,wy-6],[ap-6,wy+16],[ap-3,wy+44],[ap+1,hy-34],[ap+2,hy-12],[ap,hy]];
  var ba=[[-10,-14],[-17,0],[-22,24],[-24,44],[-22,76],[-20,wy-18],[-20,wy],[-23,wy+30],[-33,hy-34],[-36,hy-8],[-36,hy]];
  var lf=fo[fo.length-1],lb=ba[ba.length-1];
  var d='M'+f(fo[0][0])+','+f(fo[0][1])+crp(fo)+' Q'+f((lf[0]+lb[0])/2)+','+f(hy+5)+' '+f(lb[0])+','+f(lb[1])+crp(ba.slice().reverse())+' Q0,-6 '+f(fo[0][0])+','+f(fo[0][1])+'Z';
  var o='<defs><clipPath id="'+u+'ts"><path d="'+d+'"/></clipPath></defs><path d="'+d+'" fill="'+c.top+'"/><g clip-path="url(#'+u+'ts)">';
  o+='<path d="M-10,-6 C-18,0 -22,20 -24,44 C-23,70 -22,96 -20,'+wy+' L-8,'+wy+' C-9,90 -10,40 -10,-6Z" fill="'+c.top2+'" opacity=".34"/>';
  o+='<path d="M-34,'+(hy+14)+' L-34,'+(hy-14)+' Q0,'+(hy-2)+' 40,'+(hy-13)+' L40,'+(hy+14)+'Z" fill="'+c.top2+'"/>';
  /* zip edge along the front */
  o+='<path d="M'+(ap-8)+',26 C'+(ap-7)+',60 '+(ap-7)+','+(wy+10)+' '+(ap-3)+','+(hy-8)+'" fill="none" stroke="'+c.top2+'" stroke-width="2.2" opacity=".5"/>';
  return m2sideBack(S)+'<path d="M-17,-68 L31,-68 L15,-12 L-14,-12Z" fill="'+c.skin+'"/>'+o+'</g>'+'<path d="M'+f(fo[0][0])+','+f(fo[0][1])+'" stroke="none"/>'};
var PFps0=PF.pelvis_side;
PF.pelvis_side=function(S){var m=PFps0(S);return isM(S)?'<g transform="scale(1.07,1)">'+m+'</g>':m};

/* ---- props: ladle, tea cup ---- */
PF.ladle=function(S){return '<path d="M-2.4,44 L-2,-48 L2,-48 L2.4,44Z" fill="#b9bfca"/><circle cx="0" cy="40" r="2.2" fill="#6c7280"/><path d="M-14,-52 C-14,-34 14,-34 14,-52 C14,-62 -14,-62 -14,-52Z" fill="#cdd3dd"/><path d="M-14,-52 C-14,-48 14,-48 14,-52" fill="none" stroke="#8a92a2" stroke-width="2" stroke-linecap="round"/><ellipse cx="0" cy="-52.5" rx="13" ry="3.4" fill="#e6b865"/>'};
PF.cup=function(S){return '<ellipse cx="0" cy="17" rx="19" ry="4.4" fill="#ebe0cb"/><path d="M-13,-8 L13,-8 C13,9 7,16.5 0,16.5 C-7,16.5 -13,9 -13,-8Z" fill="#f8f1e4"/><path d="M-13,-1 L13,-1" stroke="#cf6d7e" stroke-width="2.4"/><path d="M13,-5 C23,-6 23,8 11.5,8.6" fill="none" stroke="#f8f1e4" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="0" cy="-8" rx="13" ry="3.2" fill="#b0622f"/><path d="M-4,-14 C-8,-20 0,-22 -3,-29" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>'};
function propFor(S,A,st){var pr=st.prop;if(!pr||!pr.on||(pr.hand||'R')!==A.nm)return '';
  var fdx=A.H[0]-A.el[0],fdy=A.H[1]-A.el[1],fl=Math.sqrt(fdx*fdx+fdy*fdy)||1,at=pr.at||[0,0],dist={mug:14,cup:12,ladle:10,phone:18}[pr.on]||18,cx=A.H[0]+fdx/fl*dist+at[0],cy=A.H[1]+fdy/fl*dist+at[1],rot=nF(pr.rot,0);
  return shF(S,'<g transform="'+trF(cx,cy,rot)+'">'+(PF[pr.on]||PF.phone)(S)+'</g>',1)}
/* kitchen table seen from the front: drawn between torso and arms so hands rest on its top (pendant hook, Mama only) */
var PFpend0=PF.pendant;
PF.pendant=function(S){if(isM(S)&&S.p.pot)return '<g transform="translate(0,32)"><path d="M-200,196 L200,196 L200,214 L-200,214Z" fill="#a9794f"/><path d="M-200,196 L200,196 L200,200 L-200,200Z" fill="#c89a6a"/><g><path d="M6,150 L58,150 L55,194 Q32,198 9,194Z" fill="#aab2c0"/><path d="M6,150 L58,150 L58,155 L6,155Z" fill="#cdd3dd"/><ellipse cx="32" cy="151" rx="26" ry="4.2" fill="#c0642f"/><path d="M4,162 L-6,162 M60,162 L70,162" stroke="#6c7280" stroke-width="3.4" stroke-linecap="round"/></g></g>';
  if(!isM(S)||!S.p.table)return PFpend0(S);var dy=nF(S.p.sit,0)*S.dim.sitDy,y=NaN;
  y=S.dim.tableY-dy;
  return '<g transform="translate(0,'+f(y)+')"><path d="M-180,0 L180,0 L180,15 Q0,19 -180,15Z" fill="#a9794f"/><path d="M-180,0 L180,0 L180,4 Q0,7 -180,4Z" fill="#c89a6a"/><path d="M-160,15 L160,15 L160,23 L-160,23Z" fill="#8c6039"/><path d="M-176,23 L-164,23 L-164,'+f(S.dim.floor-dy-y)+' L-176,'+f(S.dim.floor-dy-y)+'Z M164,23 L176,23 L176,'+f(S.dim.floor-dy-y)+' L164,'+f(S.dim.floor-dy-y)+'Z" fill="#8c6039"/></g>'};
CHM.dim.tableY=300;
function sideTable(S,st){var D=S.dim,hy=D.floor;return '<g><path d="M18,'+(D.tableSY)+' L250,'+(D.tableSY)+' L250,'+(D.tableSY+14)+' Q120,'+(D.tableSY+18)+' 18,'+(D.tableSY+14)+'Z" fill="#a9794f"/><path d="M18,'+(D.tableSY)+' L250,'+(D.tableSY)+' L250,'+(D.tableSY+4)+' Q120,'+(D.tableSY+7)+' 18,'+(D.tableSY+4)+'Z" fill="#c89a6a"/><path d="M26,'+(D.tableSY+14)+' L236,'+(D.tableSY+14)+' L236,'+(D.tableSY+22)+' L26,'+(D.tableSY+22)+'Z" fill="#8c6039"/><path d="M232,'+(D.tableSY+22)+' L248,'+(D.tableSY+22)+' L249,'+hy+' L231,'+hy+'Z" fill="#8c6039"/></g>'}
CHM.dim.tableSY=338;


/* ---- expressions: channels in head-frame units of the 0.2.0 face (eye line y=0, face height 130) ---- */
EX0F.tear=0;EX0F.sq=0;EX0F.cr=0;
var XM={
 neutral:ex({mc:-.2}),
 warm_default:ex({mc:.3,blush:.15,sq:.1}),
 soft_smile:ex({mc:1,mw:1.06,sq:.25,cr:.4,by:.3,blush:.3}),
 worried_mom:ex({open:1.04,by:.6,btL:2.2,btR:2.2,mc:-.9,mw:.9,pup:.95,gy:.2}),
 proud_beam:ex({open:.92,sq:.5,cr:1,by:1.2,btL:-1.2,btR:-1.2,mc:1.5,mw:1.1,blush:.5}),
 scolding:ex({open:.9,by:-.8,btL:-2.6,btR:-2.6,bdL:.2,bdR:.2,mc:-.4,mw:.92,pup:.95,gy:.2}),
 suspicious:ex({open:.85,gx:1,bdL:2.6,bdR:-.8,btL:1,btR:-1.6,mc:.1,ms:.9,mw:.95,pup:.95}),
 tearful_happy:ex({open:.95,sq:.6,cr:1,by:1,btL:1.5,btR:1.5,mc:1.2,mw:1.08,mo:0,blush:.7,tear:1}),
 laugh:ex({shut:1,happy:1,by:1.5,btL:-.6,btR:-.6,mc:1.5,mw:1.15,mo:.8,cr:1,blush:.5}),
 panic:ex({open:1.5,lo:1.6,pup:.55,irs:.82,by:4.5,btL:5,btR:6,bdR:1,mc:-1.1,mw:.9,mo:.45,trap:1,sweat:2,pale:1,blush:0}),
 disappointed:ex({open:.86,by:-.4,btL:3.5,btR:3.5,mc:-1,mw:.88,gy:.9,gx:-.3,pup:.95})};
CHM.expr=XM;

/* ---- poses (shared pool; Mama-specific names) ---- */
var PSM={
 hands_on_hips:{sh:3,head:{tilt:2},L:{h:[-55,168],bend:1,rot:8},R:{h:[55,168],bend:-1,rot:-8},hipsh:5,unload:-1,ptilt:-1.6,shrot:2,legs:{spread:20,ank:28}},
 stir_hold:{pot:1,sh:2,head:{tilt:3,dx:2},R:{h:[40,136],bend:-1,hand:'grip',rot:0,fsh:.95},L:{h:[-40,150],bend:1,rot:6}},
 phone_ear:{sh:3,head:{tilt:-5,dx:-3},R:{h:[60,-44],bend:1,hand:'grip',rot:14,fsh:1},L:{h:[-48,160],bend:1,rot:4},hipsh:4,unload:-1,ptilt:-1.4,shrot:2},
 stand_3q_m:{turn:.3,sh:3,head:{yaw:.32,tilt:2,dx:2},hipsh:5,ptilt:-2,shrot:2,L:{h:[-58,190],bend:1},R:{h:[72,188],bend:-1},legs:{spread:20,ank:27,kin:1}},
 sit_table:{sit:1,table:1,sh:2,lean:.03,head:{tilt:2},L:{h:[-44,164],bend:1},R:{h:[44,164],bend:-1},legs:{spread:20,ank:26,kin:2}},
 sit_table_cup:{sit:1,table:1,sh:2,lean:.03,head:{tilt:2},L:{h:[-60,166],bend:1},R:{h:[40,160],bend:-1,hand:'grip',fsh:.9},legs:{spread:20,ank:26,kin:2}},
 sit_table_side:{view:'side',table:1,sh:2,lean:.16,head:{yaw:1,tilt:1},sitS:1,L:{h:[76,150],bend:1},R:{h:[86,150],bend:1},gait:{nx:148,ny:0,nrot:0,fx:138,fy:0,frot:0,hipdy:158,hrot:0}}};
for(var pnM in PSM)HFg.POSES_F[pnM]=mergeF(PBF,PSM[pnM]);


/* ---- register ---- */
/* ---- pose adaptor: pose pool is authored for the base body; Mama is torso-long/leg-short and walks a shorter, swayier stride ---- */
function m3clone(o){return JSON.parse(JSON.stringify(o))}
function m3adapt(p0){var p=m3clone(p0);
  ['L','R'].forEach(function(k){var a=p[k];if(!a||!a.h)return;var y=a.h[1];if(p.sitS){if(y>100)a.h[1]=y+22}else if(p.sit){if(y>120)a.h[1]=y+32}else if(y>80)a.h[1]=y+Math.min(34,(y-80)*.31)});
  if(p.view==='side'&&p.gait&&!p.sitS&&p.gait.hipdy<60){var g=p.gait,k=.8;
    g.nx*=k;g.fx*=k;g.ny*=.85;g.fy*=.85;g.nrot*=.85;g.frot*=.85;
    /* sway: bigger hip bob, shoulders counter-rotate, arms swing less and opposite the near leg */
    g.hipdy=g.hipdy*1.25;g.hrot=g.hrot*1.5;p.shrot=-g.hrot*.7;
    ['L','R'].forEach(function(s){var a=p[s];if(a&&a.h){a.h[0]*=.8;a.h[1]+=Math.abs(a.h[0])<20?0:6}})}
  return p}
var drawM0=drawChar(CHM),MSC=1.046,MSX=1.01;
HFg.RIGS.mama=function(st,ch){MGL=(st.glasses==null||st.glasses)?1:0;MSH=st.shoes==='slipper'?'slipper':'sneaker';
  var sp=MSH==='slipper'?SLIP:SNEAK;for(var k in sp)CHM.pal[k]=sp[k];
  st=Object.assign({},st);st.pose=m3adapt(st.pose||{});
  var g=drawM0(st,ch),p=st.pose||{};
  if(p.table&&p.view==='side'){g+=sideTable(fstate(st,CHM),st)}
  return '<g transform="translate(0,548) scale('+f(MSC*MSX)+','+MSC+') translate(0,-548)">'+g+'</g>'};
HFg.CHARS.mama={paper:true,rig:'mama',body_type:'f',skin:CHM.pal.skin,hr:44,vr:54};
HFg.EXPR_F.mama=XM;
C.CHM=CHM;

C.draw=function(key,full){return C[key](full)};
})();
