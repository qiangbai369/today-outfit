"""Package reviewed image edits with consistent framing; originals stay untouched.
Usage: python3 tools/build-mobile-unified-figures.py source-art/.../inputs.json
"""
import hashlib,json,sys
from pathlib import Path
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
inputs=json.loads(Path(sys.argv[1]).read_text())
meta_path=ROOT/'mobile/拆解小样信息.json';meta=json.loads(meta_path.read_text())
assert set(inputs)==set(meta),'Every complete look needs a reviewed edit'
folder=ROOT/'mobile/images/unified';folder.mkdir(exist_ok=True)
records={}
for id,source in sorted(inputs.items()):
    im=Image.open(source).convert('RGBA');a=np.asarray(im)[:,:,3];ys,xs=np.where(a>=128)
    assert len(xs)>im.width*im.height*.15,id+' missing subject'
    top,bottom=int(ys.min()),int(ys.max())+1
    head_ys,head_xs=np.where(a[top:top+int((bottom-top)*.22)]>=128)
    center=(int(head_xs.min())+int(head_xs.max())+1)/2
    scale=1440/(bottom-top)
    width,height=round(im.width*scale),round(im.height*scale)
    offset_x=round(512-center*scale);offset_y=round(48-top*scale)
    canvas=Image.new('RGBA',(1024,1536),(0,0,0,0))
    canvas.alpha_composite(im.resize((width,height),Image.Resampling.LANCZOS),(offset_x,offset_y))
    b=np.asarray(canvas)[:,:,3];fy,fx=np.where(b>=128)
    assert fx.min()>16 and fx.max()<1007,id+' clips sideways'
    assert abs(int(fy.min())-48)<=2 and abs(int(fy.max())+1-1488)<=2,id+' invalid framing'
    file=folder/(id+'.webp');canvas.save(file,format='WEBP',quality=96,method=6,exact=True)
    thumb=canvas.copy();thumb.thumbnail((420,630),Image.Resampling.LANCZOS)
    thumb.save(ROOT/'mobile/thumbnails'/(id+'.webp'),format='WEBP',quality=92,method=6,exact=True)
    meta[id]['figure']='images/unified/'+id+'.webp'
    records[id]={'figure':meta[id]['figure'],'canonical':{'sweet':'sweet-summer-a','cool':'cool-summer-a','literary':'literary-spring-a'}[id.split('-')[0]],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'editSha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'bodyBounds':[int(fx.min()),int(fy.min()),int(fx.max())+1,int(fy.max())+1],'headCenterX':round(center*scale+offset_x,2),'scale':round(scale,6),'offset':[offset_x,offset_y]}
meta_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
(ROOT/'mobile/figure-audit.json').write_text(json.dumps({'version':'20261012-unified1','canvas':[1024,1536],'headTop':48,'soleBottom':1488,'figures':records},ensure_ascii=False,indent=2)+'\n')
print('Packaged',len(records),'reviewed figures; shared head-top/sole baseline, centered heads.')
