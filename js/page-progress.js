/* Global lesson progress — scroll when available, activity progress on app-like pages */
(function(){"use strict";if(window.__dsPageProgressLoaded)return;window.__dsPageProgressLoaded=true;
function ensure(){var h=document.getElementById("ds-page-progress"),b=document.getElementById("ds-page-progress-bar");if(!h){var l=document.querySelector(".page-progress-container");if(l){h=l;h.id="ds-page-progress";b=l.querySelector(".page-progress-bar");if(b)b.id="ds-page-progress-bar"}}if(!h){h=document.createElement("div");h.id="ds-page-progress";h.setAttribute("aria-hidden","true");b=document.createElement("div");b.id="ds-page-progress-bar";h.appendChild(b);document.body.appendChild(h)}else if(!b){b=document.createElement("div");b.id="ds-page-progress-bar";h.appendChild(b)}return b}
var bar,ticking=false,lastActivity=-1;
function activityPct(){
 var fill=document.getElementById("progress-fill"); if(fill){var w=parseFloat(fill.style.width);if(isFinite(w))return w}
 var count=document.getElementById("progress-count");if(count){var m=count.textContent.match(/(\d+)\s*\/\s*(\d+)/);if(m&&+m[2])return Math.max(0,Math.min(100,+m[1]/+m[2]*100))}
 var stat=document.getElementById("stat-progress");if(stat){var m2=stat.textContent.match(/(\d+)\s*\/\s*(\d+)/);if(m2&&+m2[2])return Math.max(0,Math.min(100,+m2[1]/+m2[2]*100))}
 return null
}
function update(){ticking=false;if(!bar)bar=ensure();var d=document.documentElement,b=document.body,t=window.pageYOffset||d.scrollTop||b.scrollTop||0,f=Math.max(d.scrollHeight,b.scrollHeight,d.offsetHeight,b.offsetHeight,d.clientHeight),m=Math.max(0,f-window.innerHeight),v;
 if(m>2)v=Math.max(0,Math.min(100,t/m*100));else{var a=activityPct();v=a===null?0:a}
 bar.style.width=v+"%";
}
function request(){if(ticking)return;ticking=true;requestAnimationFrame(update)}
function init(){bar=ensure();update();addEventListener("scroll",request,{passive:true});addEventListener("resize",request,{passive:true});addEventListener("load",request,{once:true});document.addEventListener("click",()=>setTimeout(request,0),true);document.addEventListener("input",request,true);if("ResizeObserver"in window)new ResizeObserver(request).observe(document.documentElement);if("MutationObserver"in window)new MutationObserver(request).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["style","class"]})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()})();