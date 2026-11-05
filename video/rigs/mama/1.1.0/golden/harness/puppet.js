/* art/puppet.js - PLACEHOLDER vector puppet renderer. Returns SVG markup in actor-local space for one frame.
   Outline strokes + flat fills + gradient shading. Views: front / 3-4 / profile (head.yaw -1..1) and back (pose.back). */
(function(){
var HF=window.HF=window.HF||{};
var INK="#1e1417",SW=3;
function f(n){return Math.round(n*10)/10}
function ik(S,H,u,l,bend){
  var dx=H[0]-S[0],dy=H[1]-S[1],d=Math.sqrt(dx*dx+dy*dy)||1,maxd=u+l-1;
  if(d>maxd){H=[S[0]+dx/d*maxd,S[1]+dy/d*maxd];dx=H[0]-S[0];dy=H[1]-S[1];d=maxd}
  var a=(u*u-l*l+d*d)/(2*d),h=Math.sqrt(Math.max(0,u*u-a*a));
  var mx=S[0]+dx/d*a,my=S[1]+dy/d*a,nx=-dy/d,ny=dx/d;
  return {e:[mx+nx*h*bend,my+ny*h*bend],h:H};
}
function hand(type,H,E,rot,s,c){
  var ang=Math.atan2(H[1]-E[1],H[0]-E[0])*180/Math.PI-90+(rot||0);
  var sk=c.skin,o='<g transform="translate('+f(H[0])+','+f(H[1])+') rotate('+f(ang)+') scale('+(s||1)+')" stroke="'+INK+'" stroke-width="'+SW+'" stroke-linejoin="round" fill="'+sk+'">';
  if(type==="fist"||type==="clasp"){
    o+='<rect x="-15" y="-4" width="30" height="30" rx="12"/><path d="M-9,8 H9 M-9,15 H9" fill="none" stroke-width="2"/>';
    if(type==="clasp")o+='<rect x="-24" y="2" width="48" height="22" rx="10"/><path d="M-6,4 V22 M6,4 V22" fill="none" stroke-width="2"/>';
  }else if(type==="open"){
    o+='<rect x="-15" y="-2" width="30" height="30" rx="9"/><path d="M-14,26 q-1,22 4,26 q5,3 6,-8 M-5,28 v28 q4,3 7,0 v-28 M5,28 v26 q4,3 7,0 v-26 M12,26 q3,18 7,18 q4,-2 1,-18" />';
  }else if(type==="point"){
    o+='<rect x="-15" y="-4" width="30" height="28" rx="11"/><path d="M-5,20 V56 q5,6 10,0 V20 Z"/>';
  }else if(type==="point_cam"){
    /* index finger pointing at the viewer: foreshortened, big fingertip with nail, knuckles behind */
    o+='<rect x="-19" y="-10" width="38" height="36" rx="14"/><path d="M-13,6 H13 M-13,14 H13" fill="none" stroke-width="2"/>'+
       '<ellipse cx="0" cy="34" rx="12" ry="16"/><ellipse cx="0" cy="40" rx="8" ry="9" fill="'+c.shade+'"/><path d="M-5,44 q5,6 10,0" fill="#f3d9cf" stroke-width="2"/>';
  }else if(type==="cup"){
    o+='<path d="M-16,-4 q-6,28 4,40 q14,10 24,-6 q4,-18 -4,-34 Z"/><path d="M-9,10 q8,6 16,0 M-9,20 q8,6 16,0" fill="none" stroke-width="2"/><path d="M14,4 q14,-6 16,8" />';
  }
  return o+'</g>';
}
function arm(S,Hh,spec,c,sw){
  var r=ik(S,Hh,100*c.build,92*c.build,spec.bend),e=r.e,h=r.h,u=30*c.build,l=26*c.build;
  var d='M'+f(S[0])+','+f(S[1])+' L'+f(e[0])+','+f(e[1])+' L'+f(h[0])+','+f(h[1]);
  return '<path d="'+d+'" fill="none" stroke="'+INK+'" stroke-width="'+(l+2*SW)+'" stroke-linecap="round" stroke-linejoin="round"/>'+
         '<path d="'+d+'" fill="none" stroke="'+c.top+'" stroke-width="'+l+'" stroke-linecap="round" stroke-linejoin="round"/>'+
         '<path d="M'+f(S[0])+','+f(S[1])+' L'+f(e[0])+','+f(e[1])+'" fill="none" stroke="'+c.topShade+'" stroke-width="'+(l*0.35)+'" stroke-linecap="round" opacity=".55" transform="translate('+(S[0]<0?-4:4)+',3)"/>'+
         hand(spec.hand,h,e,spec.rot,spec.s,c);
}
function headPath(c,sx,jaw){
  var w=c.hr*sx,vr=c.vr,j=jaw||0.5;
  return 'M0,'+(-vr)+' C'+f(w*.62)+','+(-vr)+' '+f(w)+','+f(-vr*.6)+' '+f(w)+','+f(-vr*.1)+' C'+f(w)+','+f(vr*.45)+' '+f(w*j)+','+vr+' 0,'+vr+
         ' C'+f(-w*j)+','+vr+' '+f(-w)+','+f(vr*.45)+' '+f(-w)+','+f(-vr*.1)+' C'+f(-w)+','+f(-vr*.6)+' '+f(-w*.62)+','+(-vr)+' 0,'+(-vr)+' Z';
}
function head(c,h,e,mouth,gaze,uid,key,rim,back){
  var yaw=HF.clamp(h.yaw,-1,1),a=yaw*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a),sg=yaw<0?-1:1,as=Math.abs(sa);
  var sx=0.9+0.1*ca,w=c.hr*sx,vr=c.vr,hp=headPath(c,sx,c.jowl?0.62:0.5);
  var fx=sa*(w*0.62);                       /* feature centre shift */
  var o='';
  var g1=key<0?'0':'1',g2=key<0?'1':'0';
  o+='<defs><linearGradient id="'+uid+'sk" x1="'+g1+'" y1="0" x2="'+g2+'" y2="0.25"><stop offset="0" stop-color="'+c.skin+'"/><stop offset=".55" stop-color="'+c.skin+'"/><stop offset="1" stop-color="'+c.shade+'"/></linearGradient>'+
     '<clipPath id="'+uid+'hc"><path d="'+hp+'"/></clipPath></defs>';
  /* ears */
  var ex=w*ca;
  function ear(x){return '<ellipse cx="'+f(x)+'" cy="2" rx="11" ry="16" fill="'+c.skin+'" stroke="'+INK+'" stroke-width="'+SW+'"/><path d="M'+f(x-3)+',-3 q6,6 0,14" fill="none" stroke="'+c.shade+'" stroke-width="2"/>'}
  o+=ear(-sg*ex);                              /* trailing ear */
  if(!back&&ca>0.75)o+=ear(sg*ex);
  if(back)o+=ear(sg*ex);
  /* face base */
  o+='<path d="'+hp+'" fill="url(#'+uid+'sk)" stroke="'+INK+'" stroke-width="'+SW+'"/>';
  /* nose bump in profile outside the outline */
  if(!back&&as>0.55){
    var nt=w*0.98+as*20;
    o+='<path d="M'+f(sg*(w*0.9))+',-12 L'+f(sg*nt)+',18 Q'+f(sg*(nt-2))+',26 '+f(sg*(w*0.9))+',25 Z" fill="'+c.skin+'" stroke="'+INK+'" stroke-width="'+SW+'" stroke-linejoin="round"/>';
  }
  /* face detail */
  if(!back){
    var ey=-8,sep=25*ca+3,o2='';
    var ws=Math.max(0.3,ca*0.85+0.15);
    [-1,1].forEach(function(side){
      var lead=(side===sg&&as>0.2),hide=(as>0.8&&side!==sg);
      if(hide)return;
      var cx=fx+side*sep,sc=lead?ws*0.95:(as>0.2?ws*0.75:1),rx=11*sc*Math.max(0.55,e.es),ry=9.5*Math.max(0.12,e.open)*e.es;
      var gx=(gaze.cam?-sa*0.85:gaze.x)*(rx*0.45),gy=(gaze.cam?0:gaze.y)*(ry*0.5);
      o2+='<g><ellipse cx="'+f(cx)+'" cy="'+ey+'" rx="'+f(rx)+'" ry="'+f(ry)+'" fill="#fbfaf6" stroke="'+INK+'" stroke-width="2.2"/>'+
          '<circle cx="'+f(cx+gx)+'" cy="'+f(ey+gy)+'" r="'+f(Math.min(5.2*e.es,ry*0.9))+'" fill="#2a1b14"/><circle cx="'+f(cx+gx-1.6)+'" cy="'+f(ey+gy-1.8)+'" r="1.5" fill="#fff"/>'+
          '<path d="M'+f(cx-rx-1)+','+ey+' Q'+f(cx)+','+f(ey-ry-4)+' '+f(cx+rx+1)+','+ey+'" fill="none" stroke="'+INK+'" stroke-width="3" stroke-linecap="round"/>';
      if(e.open<0.8)o2+='<path d="M'+f(cx-rx)+','+f(ey-1)+' H'+f(cx+rx)+'" stroke="'+c.shade+'" stroke-width="'+f((0.8-e.open)*14)+'" opacity=".85"/>';
      /* brow: tilt + = inner end down; inner side faces face centre */
      var inner=-side,bw=15*sc+3,bt=e.bt*(Math.PI/180),by=e.by+ (lead?0:0.5);
      var ix=cx+inner*bw,ox=cx-inner*bw,iy=by+Math.sin(bt)*bw*0.9,oy=by-Math.sin(bt)*bw*0.9;
      o2+='<path d="M'+f(ox)+','+f(oy)+' Q'+f(cx)+','+f(by-3)+' '+f(ix)+','+f(iy)+'" fill="none" stroke="'+(c.brow)+'" stroke-width="'+(c.must?8:6.5)+'" stroke-linecap="round"/>'+
          '<path d="M'+f(ox)+','+f(oy)+' Q'+f(cx)+','+f(by-3)+' '+f(ix)+','+f(iy)+'" fill="none" stroke="'+INK+'" stroke-width="1.2" opacity=".6"/></g>';
      if(c.glasses)o2+='<ellipse cx="'+f(cx)+'" cy="'+ey+'" rx="'+f(rx+7)+'" ry="'+f(12.5)+'" fill="rgba(255,255,255,.10)" stroke="'+INK+'" stroke-width="2.6"/>';
    });
    if(c.glasses&&as<0.8)o2+='<path d="M'+f(fx-sep+11+ws*8)+',-8 H'+f(fx+sep-11-ws*8)+'" stroke="'+INK+'" stroke-width="2.4"/>';
    o+=o2;
    /* nose (front / 3q) */
    if(as<=0.55)o+='<path d="M'+f(fx+sg*1)+',-4 Q'+f(fx+sg*(7+as*10))+',12 '+f(fx+sg*3)+',16 Q'+f(fx)+',19 '+f(fx-5)+',15" fill="none" stroke="'+INK+'" stroke-width="2.4" stroke-linecap="round"/>';
    /* mouth */
    var mw=(15*e.mw)*(0.45+0.55*ca)+4,my=37,mcx=fx*1.05,mc=e.mc*8;
    if(c.must){
      var mm=c.must;
      o+='<path d="M'+f(mcx-mw-9)+','+(my-5)+' Q'+f(mcx-mw*0.5)+','+(my-17)+' '+f(mcx)+','+(my-9)+' Q'+f(mcx+mw*0.5)+','+(my-17)+' '+f(mcx+mw+9)+','+(my-5)+' Q'+f(mcx+mw*0.5)+','+(my+2)+' '+f(mcx)+','+(my-3)+' Q'+f(mcx-mw*0.5)+','+(my+2)+' '+f(mcx-mw-9)+','+(my-5)+' Z" fill="'+mm+'" stroke="'+INK+'" stroke-width="2" opacity="0"/>';
    }
    var md=[0,9,19][mouth]||0;
    if(mouth===0){
      o+='<path d="M'+f(mcx-mw)+','+my+' Q'+f(mcx)+','+f(my+mc+ (mc<0?-3:3))+' '+f(mcx+mw)+','+my+'" fill="none" stroke="'+INK+'" stroke-width="3" stroke-linecap="round"/>';
    }else{
      o+='<path d="M'+f(mcx-mw)+','+f(my-mc*0.3)+' Q'+f(mcx)+','+f(my+mc-4)+' '+f(mcx+mw)+','+f(my-mc*0.3)+' Q'+f(mcx)+','+f(my+md+mc*0.5+6)+' '+f(mcx-mw)+','+f(my-mc*0.3)+' Z" fill="#5a1f22" stroke="'+INK+'" stroke-width="2.6" stroke-linejoin="round"/>'+
         '<path d="M'+f(mcx-mw*0.7)+','+f(my+md*0.55+4)+' Q'+f(mcx)+','+f(my+md+2)+' '+f(mcx+mw*0.7)+','+f(my+md*0.55+4)+' Q'+f(mcx)+','+f(my+md*0.35)+' '+f(mcx-mw*0.7)+','+f(my+md*0.55+4)+'Z" fill="#c4575c" stroke="none"/>'+
         (mouth===2?'<path d="M'+f(mcx-mw*0.8)+','+f(my-mc*0.3+2)+' Q'+f(mcx)+','+f(my+mc-1)+' '+f(mcx+mw*0.8)+','+f(my-mc*0.3+2)+'" stroke="#f4eee4" stroke-width="5" fill="none"/>':'');
    }
    if(c.must){
      o+='<path d="M'+f(mcx-mw-10)+','+f(my-3)+' Q'+f(mcx-mw*0.5)+','+(my-16)+' '+f(mcx)+','+(my-9)+' Q'+f(mcx+mw*0.5)+','+(my-16)+' '+f(mcx+mw+10)+','+f(my-3)+' Q'+f(mcx+mw*0.5)+','+(my-5)+' '+f(mcx)+','+(my-4)+' Q'+f(mcx-mw*0.5)+','+(my-5)+' '+f(mcx-mw-10)+','+f(my-3)+' Z" fill="'+c.must+'" stroke="'+INK+'" stroke-width="2.4" stroke-linejoin="round"/>';
    }
    if(c.jowl){ /* forehead + jowl lines */
      o+='<path d="M'+f(fx-24)+',-46 q24,-6 48,0 M'+f(fx-18)+',-38 q18,-4 36,0" fill="none" stroke="'+c.shade+'" stroke-width="2" opacity=".8"/><path d="M'+f(fx-w*0.62)+',22 q8,26 22,34 M'+f(fx+w*0.62)+',22 q-8,26 -22,34" fill="none" stroke="'+c.shade+'" stroke-width="2" opacity=".8"/>';
    }
  }
  /* hair */
  var hl=-vr*0.32,hair=c.hair,hs=c.hairStyle,hairs='';
  var rearB=back?38:(as>0.3?(hl+Math.min(1,(as-0.3)/0.5)*(16-hl)):hl);
  if(hs==="bald"){
    if(back){hairs+='<rect x="-90" y="-16" width="180" height="56" fill="'+hair+'"/><ellipse cx="0" cy="-16" rx="'+f(w*0.95)+'" ry="14" fill="'+hair+'"/>';}
    else{
      var tl=-sg*0, vis=as>0.3;
      [-1,1].forEach(function(sd){ if(vis&&sd===sg)return; var cx=(vis?sd*w*0.55:sd*w*0.92);
        hairs+='<ellipse cx="'+f(cx*1.0)+'" cy="'+f(vr*0.16)+'" rx="'+f(w*0.12)+'" ry="'+f(vr*0.2)+'" fill="'+hair+'"/>';});
    }
  }else{
    var N=6,x0=-w-6,x1=w+6,i,fr='',amp=(hs==="messy"?7:3);
    hl=-vr*0.5;
    fr='M-90,-90 L90,-90 L90,'+f(hl)+' L'+f(x1)+','+f(hl);
    for(i=N-1;i>=0;i--){var xa=x0+(x1-x0)*(i+0.5)/N,xb=x0+(x1-x0)*i/N;fr+=' Q'+f(xa)+','+f(hl+amp*2.2+((i%2)?amp:0))+' '+f(xb)+','+f(hl)}
    hairs+='<path d="'+fr+' L-90,'+f(hl)+' Z" fill="'+hair+'"/>';
    if(back){hairs+='<rect x="-90" y="-90" width="180" height="'+f(rearB+90)+'" fill="'+hair+'"/>';}
    else if(as>0.3){
      var edge=fx-sg*(25*ca+24),far=-sg*(w*1.12);
      hairs+='<ellipse cx="'+f((edge+far)/2)+'" cy="'+f(-vr*0.25)+'" rx="'+f(Math.abs(far-edge)/2)+'" ry="'+f(vr*0.62+(Math.min(1,(as-0.3)/0.5))*vr*0.35)+'" fill="'+hair+'"/>';
    }
  }
  o+='<g clip-path="url(#'+uid+'hc)">'+hairs+'</g>';
  if(hs==="messy"){ /* spikes poking out of outline */
    var sp='';for(var k=-3;k<=3;k++){var bx=k*w*0.28,by=-vr*(0.97-Math.abs(k)*0.06);sp+='M'+f(bx-8)+','+f(by+3)+' Q'+f(bx+(k>0?4:-2))+','+f(by-9-((k&1)?5:0))+' '+f(bx+(k>0?7:-5))+','+f(by-12-((k&1)?5:0))+' Q'+f(bx+6)+','+f(by-2)+' '+f(bx+8)+','+f(by+3)+' Z '}
    o+='<path d="'+sp+'" fill="'+hair+'" stroke="'+INK+'" stroke-width="2.4" stroke-linejoin="round"/>';
  }
  o+='<path d="'+hp+'" fill="none" stroke="'+INK+'" stroke-width="'+SW+'"/>';
  if(hs==="bald"&&!back)o+='<ellipse cx="'+f(-w*0.25*(key))+'" cy="'+f(-vr*0.78)+'" rx="14" ry="7" fill="#fff" opacity=".22"/>';
  /* rim light on the lead side (cool, driven by sheet light) */
  if(rim&&rim.k>0.01){
    var rs=rim.side||sg;
    o+='<defs><linearGradient id="'+uid+'rg" gradientUnits="userSpaceOnUse" x1="'+f(rs*w*1.05)+'" y1="0" x2="'+f(rs*w*0.15)+'" y2="0"><stop offset="0" stop-color="'+rim.color+'" stop-opacity="1"/><stop offset="1" stop-color="'+rim.color+'" stop-opacity="0"/></linearGradient>'+
       '<linearGradient id="'+uid+'rh" gradientUnits="userSpaceOnUse" x1="'+f(rs*w*1.05)+'" y1="0" x2="'+f(rs*w*0.5)+'" y2="0"><stop offset="0" stop-color="#eaffff" stop-opacity="1"/><stop offset="1" stop-color="#eaffff" stop-opacity="0"/></linearGradient></defs>'+
       '<g clip-path="url(#'+uid+'hc)" opacity="'+f(rim.k)+'"><path d="'+hp+'" fill="none" stroke="url(#'+uid+'rg)" stroke-width="30" style="filter:blur(5px)"/><path d="'+hp+'" fill="none" stroke="url(#'+uid+'rh)" stroke-width="7"/></g>'+
       '<ellipse cx="'+f(-sg*ex)+'" cy="2" rx="12" ry="17" fill="none" stroke="'+rim.color+'" stroke-width="4" opacity="'+f(rim.k*0.55)+'" style="filter:blur(2.5px)"/>';
  }
  return o;
}
function torso(c,p,sw,tx,key,uid){
  var hw=sw*0.84,t='';
  var g1=key<0?'0':'1',g2=key<0?'1':'0';
  t+='<defs><linearGradient id="'+uid+'tp" x1="'+g1+'" y1="0" x2="'+g2+'" y2="0.15"><stop offset="0" stop-color="'+c.top+'"/><stop offset=".6" stop-color="'+c.top+'"/><stop offset="1" stop-color="'+c.topShade+'"/></linearGradient></defs>';
  var d='M'+f(tx-sw)+',12 C'+f(tx-sw-4)+',80 '+f(tx-hw-10)+',170 '+f(tx-hw)+',256 L'+f(tx+hw)+',256 C'+f(tx+hw+10)+',170 '+f(tx+sw+4)+',80 '+f(tx+sw)+',12 Q'+f(tx)+',-14 '+f(tx-sw)+',12 Z';
  if(c.hood&&p.back)t+='<ellipse cx="'+f(tx)+'" cy="2" rx="'+f(sw*0.62)+'" ry="26" fill="'+c.topShade+'" stroke="'+INK+'" stroke-width="'+SW+'"/>';
  t+='<path d="'+d+'" fill="url(#'+uid+'tp)" stroke="'+INK+'" stroke-width="'+SW+'" stroke-linejoin="round"/>';
  if(p.back){
    t+='<path d="M'+f(tx)+',24 V250" stroke="'+c.topShade+'" stroke-width="2.5" opacity=".7"/>';
    if(c.hood)t+='<path d="M'+f(tx-sw*0.55)+',20 Q'+f(tx)+',64 '+f(tx+sw*0.55)+',20" fill="'+c.topShade+'" stroke="'+INK+'" stroke-width="2.4"/>';
  }else{
    t+='<path d="M'+f(tx-26)+',0 L'+f(tx)+',54 L'+f(tx+26)+',0 Z" fill="'+(c.hood?c.topShade:"#e9e3d6")+'" stroke="'+INK+'" stroke-width="2.4" stroke-linejoin="round"/>';
    if(c.tie)t+='<path d="M'+f(tx-8)+',26 L'+f(tx+8)+',26 L'+f(tx+13)+',150 L'+f(tx)+',166 L'+f(tx-13)+',150 Z" fill="'+c.tie+'" stroke="'+INK+'" stroke-width="2.4" stroke-linejoin="round"/><path d="M'+f(tx-26)+',0 L'+f(tx)+',30 L'+f(tx+26)+',0" fill="none" stroke="'+INK+'" stroke-width="2.4"/>';
    if(c.hood)t+='<path d="M'+f(tx-12)+',50 V92 M'+f(tx+12)+',50 V92" stroke="#dfe3ee" stroke-width="2.4"/><path d="M'+f(tx-hw*0.7)+',170 h'+f(hw*1.4)+'" stroke="'+c.topShade+'" stroke-width="2" opacity=".6"/>';
  }
  return t;
}
function legs(c,p,tx,key){
  var s=p.legs.spread*(1-0.4*Math.abs(p.turn)),o='';
  [-1,1].forEach(function(sd){
    var x=tx+sd*s,tw=26*c.build;
    o+='<path d="M'+f(x-tw)+',248 L'+f(x-tw*0.8+sd*3)+',596 L'+f(x+tw*0.8+sd*3)+',596 L'+f(x+tw)+',248 Z" fill="'+c.pants+'" stroke="'+INK+'" stroke-width="'+SW+'" stroke-linejoin="round"/>'+
       '<path d="M'+f(x-tw*0.8+sd*3)+',596 q-4,16 -20,16 h'+(p.back?50:(sd*0)+56)+' q10,0 10,-10 v-6 Z" fill="'+c.shoe+'" stroke="'+INK+'" stroke-width="'+SW+'" stroke-linejoin="round" transform="translate('+(p.back?0:0)+',0)"/>';
  });
  return o;
}
/* st: {ch, uid, pose, expr, mouth(0-2), gaze{x,y,cam}, key(-1|1), stand, shake{x,y,r}, rim{color,k,side}} */
HF.drawActor=function(st){
  if(HF.CHARS[st.ch].rig)return HF.RIGS[HF.CHARS[st.ch].rig](st,HF.CHARS[st.ch]); /* spike6: rigged cut-paper characters */
  var c=HF.CHARS[st.ch],p=st.pose,e=st.expr,uid=st.uid,key=st.key||1;SW=c.paper?0:3;
  var tc=Math.cos(p.turn*Math.PI/2),sw=76*c.build*(0.32+0.68*tc),tx=p.turn*16;
  var sh=st.shake||{x:0,y:0,r:0};
  var sgf=(p.head.yaw||p.turn)<0?-1:1;
  var tr='translate('+f(sh.x)+','+f(sh.y)+') translate(0,250) rotate('+f(p.lean*5*sgf+sh.r)+') translate(0,-250) translate(0,'+f(p.lean*16)+') scale('+f(1+p.lean*0.055)+')';
  var o='<g transform="'+tr+'">';
  var part=st.part||"all";
  var SL=[tx-sw+4,16],SR=[tx+sw-4,16];
  if(part==="arms"){
    if(p.L.z>1.5)o+=arm(SL,p.L.h,p.L,c);
    if(p.R.z>1.5)o+=arm(SR,p.R.h,p.R,c);
    return o+'</g>';
  }
  if(st.stand)o+=legs(c,p,tx,key);
  if(p.L.z<0.5)o+=arm(SL,p.L.h,p.L,c);
  if(p.R.z<0.5)o+=arm(SR,p.R.h,p.R,c);
  /* neck */
  o+='<rect x="-19" y="-40" width="38" height="56" fill="'+c.shade+'" stroke="'+INK+'" stroke-width="'+SW+'"/>';
  o+=torso(c,p,sw,tx,key,uid);
  if(p.L.z>=0.5&&(p.L.z<1.5||part==="all"))o+=arm(SL,p.L.h,p.L,c);
  if(p.R.z>=0.5&&(p.R.z<1.5||part==="all"))o+=arm(SR,p.R.h,p.R,c);
  var h=p.head;
  o+='<g transform="translate('+f(h.dx)+','+f(-70+h.dy)+') rotate('+f(h.tilt)+' 0 60)">'+head(c,h,e,st.mouth,st.gaze,uid,key,st.rim,!!h.back)+'</g>';
  return o+'</g>';
};
HF.headAnchor=function(pose,lean){ /* head centre in actor-local space (approx., ignores lean scale) */
  return [pose.head.dx,-70+pose.head.dy+(pose.lean||0)*16];
};
})();
