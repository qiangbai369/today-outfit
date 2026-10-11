// Convert accepted artwork for mobile delivery; preserve originals and atlas geometry.
const fs=require('fs'),path=require('path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const looks=require('../previews/complete-looks/data.js').LOOKS;
(async()=>{const meta=JSON.parse(fs.readFileSync('mobile/拆解小样信息.json')),folder='mobile/images';fs.mkdirSync(folder,{recursive:true});let before=0,after=0;const made=new Map();
async function convert(source,name){if(made.has(source))return made.get(source);const image=await loadImage(source),c=createCanvas(image.width,image.height);c.getContext('2d').drawImage(image,0,0);const bytes=await c.encode('webp',94),file=path.join(folder,name+'.webp');fs.writeFileSync(file,bytes);before+=fs.statSync(source).size;after+=bytes.length;made.set(source,'images/'+name+'.webp');return made.get(source);}
for(const look of looks){meta[look.id].figure=await convert('previews/complete-looks/'+(look.display||look.image),look.id);for(const item of meta[look.id].items){const source='mobile/'+path.basename(item.image,path.extname(item.image))+'.png';item.image=await convert(source,path.basename(source,path.extname(source)));}}
fs.writeFileSync('mobile/拆解小样信息.json',JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify({images:made.size,before,after,reduction:Math.round((1-after/before)*100)+'%'}));})();
