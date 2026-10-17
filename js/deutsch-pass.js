/* Mein Deutsch-Pass v1: local, additive activity evidence. No automatic mastery. */
(function(global){
  "use strict";
  const KEY="ds-deutsch-pass-v1";
  const ALLOWED=new Set(["aktiv","ubungen","dialoge","sprich-nach","diktat","wiederholen"]);
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.version===1&&x.lessons?x:{version:1,lessons:{}}}catch(_){return {version:1,lessons:{}}}}
  function save(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}}
  function record(lesson,activity,unit,details){
    if(!/^([AB][12])\.\d{1,2}$/.test(lesson)||!ALLOWED.has(activity)||typeof unit!=="string"||!unit||unit.length>80)return false;
    const data=read(),entry=data.lessons[lesson]||(data.lessons[lesson]={activities:{}});
    const group=entry.activities[activity]||(entry.activities[activity]={});
    const old=group[unit]||{};
    group[unit]={completed:true,firstCompletedAt:old.firstCompletedAt||new Date().toISOString(),lastCompletedAt:new Date().toISOString(),attempts:(old.attempts||0)+1,assisted:!!(details&&details.assisted)||!!old.assisted};
    const ok=save(data);if(ok)global.dispatchEvent(new CustomEvent("deutsch-pass-updated",{detail:{lesson,activity,unit}}));return ok;
  }
  function summary(lesson){const data=read(),a=data.lessons[lesson]?.activities||{};return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,Object.keys(v).length]));}
  global.DeutschPass={read,record,summary};
})(window);
