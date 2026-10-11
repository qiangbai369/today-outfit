const fs=require('node:fs'),vm=require('node:vm'),data=require('../../previews/complete-looks/data.js');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function boot({metadataFails=false,failedImages=new Set(),favorites=[],sessions=null,historyEnabled=false,sample='sweet-summer-a',route=null}={}) {
 const elements=new Map(), requests=[];
 class Element {
  constructor(){this.children=[];this.dataset={};this.attrs={};this.hidden=false;this.handlers={};this.classes=new Set();this.classList={toggle:(c,v)=>v?this.classes.add(c):this.classes.delete(c),add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)};this.style={};}
  setAttribute(k,v){this.attrs[k]=v;} addEventListener(k,f){this.handlers[k]=f;} append(...n){this.children.push(...n);} replaceChildren(...n){this.children=n;} focus(){} getBoundingClientRect(){return {left:0,top:0,width:390,height:844};}
 }
 const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(tag){return tag === "img" ? new Photo() : new Element();},createElementNS(){return new Element();},handlers:{},addEventListener(k,f){this.handlers[k]=f;}};
 class Photo extends Element {constructor(){super();this.naturalWidth=1254;this.naturalHeight=1254;} decode(){requests.push(this.src);return failedImages.has(this.src)?Promise.reject(new Error('network')):Promise.resolve();}}
 const store=new Map();
 store.set('today-outfit-complete-preview-favorites-v1',typeof favorites === 'string' ? favorites : JSON.stringify(favorites));
 if (sessions) store.set('today-outfit-mobile-demo-sessions-v1',JSON.stringify(sessions));
 const context={document,Image:Photo,URLSearchParams,URL,AbortSignal,location:{search:sample?'?sample='+sample:'',href:'http://localhost/mobile/'+(sample?'?sample='+sample:'')},performance:{now:()=>0},setTimeout,clearTimeout,fetch:async()=>({ok:!metadataFails,json:async()=>JSON.parse(fs.readFileSync('mobile/拆解小样信息.json'))})};
 context.window={CompleteLookData:data,OutfitFavorites:require('../../mobile/收藏逻辑.js'),OutfitGestures:{...require('../../mobile/手势逻辑.js'),createTapController:()=>({reset(){},secondPress(){},tap(){}})},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},handlers:{},addEventListener(k,f){this.handlers[k]=f;},matchMedia:()=>({matches:true})};
 if(historyEnabled){
  const stack=[{state:route?{outfitMobile:route}:null,url:context.location.href}];let pointer=0;
  const navigate=()=>{const entry=stack[pointer];context.location.href=entry.url;context.location.search=new URL(entry.url).search;context.window.handlers.popstate({state:entry.state});};
  context.window.history={get state(){return stack[pointer].state;},pushState(state,_,url){stack.splice(pointer+1);stack.push({state,url:String(url)});pointer++;context.location.href=String(url);context.location.search=new URL(url).search;},replaceState(state,_,url){stack[pointer]={state,url:String(url)};context.location.href=String(url);context.location.search=new URL(url).search;},back(){if(pointer>0){pointer--;navigate();}},forward(){if(pointer<stack.length-1){pointer++;navigate();}}};
 }
 vm.runInNewContext(fs.readFileSync('mobile/拆解演示.js','utf8'),context);
 return {elements,requests,failedImages,store,document,location:context.location,history:context.window.history};
}
module.exports={boot,flush};
