(function(root){'use strict';
const detail=(id,label,walking='normal',formal=false)=>({id,label,walking,formal});
const ACTIVITIES=Object.freeze([
 {id:'class',label:'上课',details:[detail('ordinary','日常上课'),detail('presentation','展示汇报','normal',true)]},
 {id:'work',label:'上班',details:[detail('casual','日常办公'),detail('formal','整洁正式','normal',true)]},
 {id:'date',label:'约会',details:[detail('coffee','咖啡散步'),detail('exhibition','看展','many'),detail('dinner','吃饭','few',true)]},
 {id:'party',label:'聚会',details:[detail('friends','朋友聚会','few'),detail('dressy','稍正式','few',true)]},
 {id:'concert',label:'演出',details:[detail('standing','站立观看','many'),detail('seated','坐席观看','few')]},
 {id:'shopping',label:'逛街',details:[detail('mall','室内商场'),detail('street','户外街区','many')]},
 {id:'short-trip',label:'短途旅行',trip:true,range:[1,3],defaultDays:2,details:[detail('city','城市','many'),detail('beach','海边'),detail('park','轻户外','many')]},
 {id:'long-trip',label:'长途旅行',trip:true,range:[4,7],defaultDays:4,details:[detail('city','城市','many'),detail('beach','海边'),detail('park','轻户外','many')]},
 {id:'sightseeing',label:'景点打卡',details:[detail('city','城市街区','many'),detail('town','古镇','many'),detail('beach','海边'),detail('park','自然公园','many')]}
]);
const SEASONS=[{id:'spring',label:'春',warmth:'mild'},{id:'summer',label:'夏',warmth:'hot'},{id:'autumn',label:'秋',warmth:'cool'},{id:'winter',label:'冬',warmth:'cold'}];
const WARMTH=[{id:'hot',label:'热'},{id:'mild',label:'温暖'},{id:'cool',label:'凉'},{id:'cold',label:'冷'}];
const STYLES=[{id:'character',label:'人物风格'},{id:'relaxed',label:'清爽休闲'},{id:'street',label:'利落街头'},{id:'soft',label:'温柔轻盈'},{id:'neat',label:'清新整洁'}];
function normalizeNeed(input){
 const o=input&&typeof input==='object'?input:{};
 const activity=ACTIVITIES.find(x=>x.id===o.activity)||ACTIVITIES[0];
 const d=activity.details.find(x=>x.id===o.detail)||activity.details[0];
 const season=SEASONS.find(x=>x.id===o.season)||SEASONS[2];
 const warmth=WARMTH.some(x=>x.id===o.warmth)?o.warmth:season.warmth;
 const walking=['few','normal','many'].includes(o.walking)?o.walking:d.walking;
 const days=activity.trip?(o.days===undefined?activity.defaultDays:Number(o.days)):1;
 const errors=[];
 if(activity.trip&&(!Number.isInteger(days)||days<activity.range[0]||days>activity.range[1]))errors.push(activity.label+'请选'+activity.range.join('—')+'天');
 return {activity:activity.id,detail:d.id,season:season.id,warmth,walking,style:STYLES.some(x=>x.id===o.style)?o.style:'character',days,destination:activity.trip?d.id:null,formal:d.formal,errors};
}
function summary(input){const n=normalizeNeed(input),a=ACTIVITIES.find(x=>x.id===n.activity),d=a.details.find(x=>x.id===n.detail),w=WARMTH.find(x=>x.id===n.warmth);return [a.label,d.label,w.label,n.walking==='many'?'走路较多':null,a.trip?n.days+'天':null].filter(Boolean).join(' · ');}
const api={ACTIVITIES,SEASONS,WARMTH,STYLES,normalizeNeed,summary};if(typeof module!=='undefined')module.exports=api;else root.PlannerNeeds=api;
})(typeof globalThis!=='undefined'?globalThis:this);
