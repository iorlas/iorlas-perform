/* hf.js - tiny pure helpers: easing, tracks, deterministic hash, turn-reference resolver.
   Everything is a pure function of time t (seconds). No Math.random / Date. */
(function(){
var HF=window.HF=window.HF||{};
HF.clamp=function(v,a,b){return v<a?a:v>b?b:v};
HF.lerp=function(a,b,w){return a+(b-a)*w};
HF.hash=function(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
var E=HF.ease={
  linear:function(x){return x},
  "sine.inOut":function(x){return .5-.5*Math.cos(Math.PI*x)},
  "power2.in":function(x){return x*x},
  "power2.out":function(x){return 1-(1-x)*(1-x)},
  "power2.inOut":function(x){return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2},
  "power4.out":function(x){return 1-Math.pow(1-x,4)},
  "power3.inOut":function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},
  "expo.out":function(x){return x>=1?1:1-Math.pow(2,-10*x)},
  "expo.inOut":function(x){return x<=0?0:x>=1?1:x<.5?Math.pow(2,20*x-10)/2:(2-Math.pow(2,-20*x+10))/2},
  "back.out":function(x){var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)}
};
/* Track: piecewise tween of one numeric (or array / object of numbers) value. */
function blend(a,b,w){
  if(typeof a==="number")return a+(b-a)*w;
  if(Array.isArray(a))return a.map(function(v,i){return blend(v,b[i],w)});
  if(a&&typeof a==="object"){var o={};for(var k in a)o[k]=blend(a[k],b[k],w);return o}
  return w<.5?a:b;
}
HF.blend=blend;
HF.Track=function(start){this.start=start;this.segs=[]};
HF.Track.prototype.add=function(t0,dur,to,ease){
  var from=this.segs.length?this.at(t0):this.start;
  this.segs.push({t0:t0,t1:t0+Math.max(dur,1e-4),from:from,to:to,ease:E[ease||"sine.inOut"]||E["sine.inOut"]});
  this.segs.sort(function(a,b){return a.t0-b.t0});
  return this;
};
HF.Track.prototype.at=function(t){
  var s=this.segs,cur=this.start,i;
  for(i=0;i<s.length;i++){
    var g=s[i];
    if(t<g.t0)return i?cur:this.start;
    if(t<g.t1)return blend(g.from,g.to,g.ease((t-g.t0)/(g.t1-g.t0)));
    cur=g.to;
  }
  return cur;
};
/* damped impulse, used for flinch / jolt */
HF.impulse=function(t,t0,dur,freq){var x=t-t0;if(x<0||x>dur*2.5)return 0;return Math.exp(-3.2*x/dur)*Math.sin(2*Math.PI*(freq||3)*x/dur+0)};
HF.pulse=function(t,t0,dur){var x=(t-t0)/dur;return x<0||x>1?0:Math.sin(Math.PI*x)};

/* Resolver: sheet time refs "<turnIdx>[.start|.end][+-sec]" or "@0"/"@end" -> scene-local seconds.
   The scene audio is a concatenation of slices of turns; a slice is {turn, from, to} (offsets in s from turn start). */
HF.makeResolver=function(tl,segs){
  var acc=0,map=[];
  segs.forEach(function(s){
    acc+=(s.gapBefore||0);
    var t=tl[s.turn],a=t.start+s.from,b=t.start+s.to;
    map.push({a:a,b:b,l:acc,turn:s.turn});acc+=b-a;
  });
  var dur=acc;
  function toLocal(src){
    var best=map[0],bd=1e9,i;
    for(i=0;i<map.length;i++){
      var m=map[i];
      if(src>=m.a-1e-6&&src<=m.b+1e-6)return m.l+src-m.a;
      var d=Math.min(Math.abs(src-m.a),Math.abs(src-m.b));
      if(d<bd){bd=d;best=m}
    }
    return best.l+src-best.a;
  }
  function at(ref){
    if(typeof ref==="number")throw new Error("raw seconds are not allowed in a sheet: "+ref);
    var m=/^@(0|end)([+-][\d.]+)?$/.exec(ref);
    if(m)return (m[1]==="0"?0:dur)+(m[2]?parseFloat(m[2]):0);
    m=/^(\d+)(?:\.(start|end))?([+-][\d.]+)?$/.exec(ref);
    if(!m)throw new Error("bad time ref "+ref);
    var t=tl[+m[1]];
    if(!t)throw new Error("no turn at list index "+m[1]);
    var base=m[2]==="end"?t.end:t.start;
    return toLocal(base)+(m[3]?parseFloat(m[3]):0);
  }
  return {at:at,dur:dur,map:map,toLocal:toLocal};
};
})();
