/* Global Deutschsprechen lesson progress bar */
(function(){"use strict";if(window.__dsPageProgressLoaded)return;window.__dsPageProgressLoaded=true;
function ensure(){var h=document.getElementById("ds-page-progress"),b=document.getElementById("ds-page-progress-bar");if(!h){h=document.createElement("div");h.id="ds-page-progress";h.setAttribute("aria-hidden","true");b=document.createElement("div");b.id="ds-page-progress-bar";h.appendChild(b);document.body.appendChild(h)}else if(!b){b=document.createElement("div");b.id="ds-page-progress-bar";h.appendChild(b)}return b}
var bar,ticking=false;
function ratio(text,zeroBased){var m=(text||"").match(/(\d+)\s*\/\s*(\d+)/);if(!m||!+m[2])return null;var n=+m[1],total=+m[2];if(zeroBased)n=Math.max(0,n-1);return Math.max(0,Math.min(100,n/total*100))}
function activityPct(){
 var c=document.getElementById("progress-count");if(c){var x=ratio(c.textContent,false);if(x!==null)return x}
 var s=document.getElementById("stat-progress");if(s){var y=ratio(s.textContent,true);if(y!==null)return y}
 var fill=document.getElementById("progress-fill");if(fill){var w=parseFloat(fill.style.width);if(isFinite(w))return Math.max(0,Math.min(100,w))}
 return null
}
function update(){ticking=false;if(!bar)bar=ensure();var a=activityPct(),d=document.documentElement,b=document.body,t=window.pageYOffset||d.scrollTop||b.scrollTop||0,f=Math.max(d.scrollHeight,b.scrollHeight,d.offsetHeight,b.offsetHeight,d.clientHeight),m=Math.max(0,f-window.innerHeight),v=a!==null?a:(m>2?Math.max(0,Math.min(100,t/m*100)):0);bar.style.width=v+"%"}
function request(){if(ticking)return;ticking=true;requestAnimationFrame(update)}
function init(){bar=ensure();update();addEventListener("scroll",request,{passive:true});addEventListener("resize",request,{passive:true});addEventListener("load",request,{once:true});document.addEventListener("click",function(){setTimeout(request,0)},true);document.addEventListener("input",request,true);if("ResizeObserver"in window)new ResizeObserver(request).observe(document.documentElement);if("MutationObserver"in window)new MutationObserver(request).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["style","class"]})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init()})();