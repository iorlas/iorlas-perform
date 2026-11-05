/* art/poses.js - PLACEHOLDER character data: characters, expressions, pose library.
   Poses are data (joint targets); puppet.js draws them. Arms use 2-bone IK: only the hand target is authored.
   Local actor space: origin = neck base, +y down, head centre ~ (0,-70), shoulders at y=8, hip y~250.
   L/R = screen-left/screen-right arm. */
(function(){
var HF=window.HF=window.HF||{};
HF.CHARS={
 palych:{skin:"#d9a27e",shade:"#b27857",hair:"#a3a3a3",hairStyle:"bald",build:1.2,top:"#6d4b37",topShade:"#47301f",tie:"#8f2d2d",
   must:"#a9a9a9",brow:"#8e8e8e",pants:"#2d2a30",shoe:"#17151a",glasses:false,jowl:true,hr:60,vr:66},
 vadik:{skin:"#edc19d",shade:"#c8926f",hair:"#3a2a24",hairStyle:"messy",build:1.0,top:"#86a3cb",topShade:"#566f96",tie:null,
   must:null,brow:"#3b2c26",pants:"#2e3447",shoe:"#1a1a20",glasses:false,hood:true,hr:56,vr:63},
 vadik_cut:{paper:true,skin:"#e2bd98",shade:"#c99c7a",hair:"#a7774c",hairStyle:"messy",build:1.0,top:"#8d9299",topShade:"#6c727a",tie:null,must:null,brow:"#6d4b31",pants:"#3a4558",shoe:"#1a1d28",glasses:true,hood:false,hr:56,vr:63},
 stas:{skin:"#e7c4a8",shade:"#c39b80",hair:"#76563a",hairStyle:"side",build:0.86,top:"#7f9172",topShade:"#566a4d",tie:null,
   must:null,brow:"#6a4e34",pants:"#3a3a42",shoe:"#202024",glasses:true,hr:52,vr:62}
};
/* expressions: brow height y, brow tilt (deg, + = inner end down = angry), lid openness, eye size, mouth curve (-1 frown .. 1 smile), mouth width */
HF.EXPR={
 neutral:  {by:-27,bt:0,  open:1.0,es:1.0,mc:0.0, mw:1.0},
 stern:    {by:-21,bt:17, open:0.78,es:1.0,mc:-0.55,mw:1.1},
 pleading: {by:-36,bt:-15,open:1.2,es:1.18,mc:-0.35,mw:0.85},
 deadpan:  {by:-26,bt:0,  open:0.42,es:1.0,mc:0.0, mw:0.9},
 flat:     {by:-25,bt:0,  open:0.62,es:0.95,mc:0.0,mw:0.8},
 delighted:{by:-35,bt:-7, open:1.05,es:1.05,mc:1.0, mw:1.25},
 eager:    {by:-34,bt:-5, open:1.15,es:1.08,mc:0.6, mw:1.1},
 startled: {by:-41,bt:-8, open:1.45,es:1.2,mc:-0.2,mw:0.9},
 smug:     {by:-24,bt:7,  open:0.6,es:1.0,mc:0.55,mw:0.95},
 puzzled:  {by:-30,bt:-9, open:1.0,es:1.0,mc:-0.1,mw:0.9}
};
function merge(a,b){var o=JSON.parse(JSON.stringify(a));for(var k in b){if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k]))o[k]=merge(o[k]||{},b[k]);else o[k]=b[k]}return o}
var BASE={
 turn:0, back:false, lean:0, hipx:0,
 head:{yaw:0,tilt:0,dx:0,dy:0,back:false},
 L:{h:[-95,205],bend:1,hand:"fist",rot:0,s:1,z:1},
 R:{h:[95,205],bend:-1,hand:"fist",rot:0,s:1,z:1},
 legs:{spread:34}
};
var P=HF.POSES={};
function def(n,o){P[n]=merge(BASE,o)}
def("idle",{});
def("stand_flat",{L:{h:[-92,225],hand:"fist"},R:{h:[92,225],hand:"fist"}});
/* Palych, seated behind desk, facing camera */
def("elbows_desk",{lean:0.4,
  L:{h:[-30,120],bend:1,hand:"clasp",z:2},R:{h:[30,120],bend:-1,hand:"clasp",z:2}});
def("point_cam",{lean:0.65,head:{yaw:0,tilt:-3,dx:0,dy:6},
  L:{h:[-110,100],bend:1,hand:"fist",z:2},R:{h:[66,0],bend:1,hand:"point",rot:-6,s:1.9}});
def("chin_hand",{lean:0.3,head:{yaw:-0.25,tilt:6,dx:-6,dy:4},
  L:{h:[-150,98],bend:1,hand:"fist",z:2},R:{h:[-34,64],bend:-1,hand:"fist",s:1}});
def("slide_left",{lean:0.5,head:{yaw:-0.55,tilt:-2,dx:-8,dy:4},
  L:{h:[-250,104],bend:1,hand:"open",rot:-100,z:2},R:{h:[125,98],bend:-1,hand:"fist",z:2}});
def("fist_up",{lean:-0.1,head:{yaw:0,tilt:-5,dx:0,dy:-4},
  L:{h:[-150,-110],bend:-1,hand:"fist",s:1.1},R:{h:[150,-118],bend:1,hand:"fist",s:1.1}});
/* Vadik */
def("back_shoulders",{back:true,L:{h:[-110,200]},R:{h:[110,200]},head:{yaw:0.05,tilt:0,dx:0,dy:0,back:true}});
def("ear_cup",{turn:-0.25,head:{yaw:-0.45,tilt:8,dx:-6,dy:2},lean:0.2,
  L:{h:[-100,215],hand:"fist"},R:{h:[84,-74],bend:1,hand:"cup",rot:-20,s:1.15}});
def("ear_cup_flat",{turn:-0.25,head:{yaw:-0.5,tilt:5,dx:-6,dy:2},lean:0.2,
  L:{h:[-100,215],hand:"fist"},R:{h:[86,-68],bend:1,hand:"cup",rot:-20,s:1.15}});
def("back_3q_stand",{back:true,turn:0.62,head:{yaw:0.62,tilt:0,dx:12,dy:0,back:false},
  L:{h:[-85,215],hand:"fist"},R:{h:[60,200],bend:-1,hand:"fist"},legs:{spread:30}});
def("flinch",{back:true,turn:0.5,lean:-0.9,head:{yaw:0.55,tilt:-8,dx:-16,dy:10,back:false},
  L:{h:[-70,-30],bend:-1,hand:"open",s:1.05},R:{h:[30,-24],bend:1,hand:"open",s:1.05},legs:{spread:30}});
})();
