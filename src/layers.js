// Physical layers have one definition. Project them into ancestor views so
// a prop cannot disappear simply because the player steps back from inspection.
export function physicalLayers(scene,graph,opened){
 const layers=[];
 for(const child of Object.values(graph)){
  if(!child.detail)continue;
  let parent=child.parent,related=child.id===scene.id;
  while(parent&&!related){related=parent===scene.id;parent=graph[parent]?.parent;}
  if(!related)continue;
  const source=child.sourceCrop??child.crop;
  if(child.id!==scene.id&&!source)continue;
  const project=h=>{
   if(child.id===scene.id)return {...h};
   if(h.previews?.[scene.id])return {...h,...h.previews[scene.id]};
   const anchor=child.projections?.[scene.id];
   if(anchor){const own=child.compartment??child.hotspots.find(h=>h.cover);return {...h,x:anchor.x+(h.x-own.x)/own.width*anchor.width,y:anchor.y+(h.y-own.y)/own.height*anchor.height,width:h.width/own.width*anchor.width,height:h.height/own.height*anchor.height};}
   const world={x:source.x+h.x/100*source.width,y:source.y+h.y/100*source.height,width:h.width/100*source.width,height:h.height/100*source.height};
   const target=scene.sourceCrop??scene.crop??{x:0,y:0,width:100,height:100};
   return {...h,x:(world.x-target.x)/target.width*100,y:(world.y-target.y)/target.height*100,width:world.width/target.width*100,height:world.height/target.height*100};
  };
  if(child.compartment&&opened.has(child.compartment.when))layers.push({...project(child.compartment),kind:'interior',origin:child.id});
  for(const h of child.hotspots){
   if((h.when&&!opened.has(h.when))||(h.unless&&opened.has(h.unless)))continue;
   if(h.sprite||(h.previewSprite&&child.id!==scene.id))layers.push({...project(h),kind:'sprite',origin:child.id});
   if(h.cover&&(child.id===scene.id||h.kind!=='drawer'))layers.push({...project(h),kindName:h.kind,kind:'cover',origin:child.id});
  }
 }
 return layers;
}
