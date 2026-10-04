// Keep hit rectangles anchored to the image in any screen shape.
export function fitArtwork(width,height,ratio,maxWidth=Infinity,maxHeight=Infinity) {
 const w=Math.min(width,height*ratio,maxWidth,maxHeight*ratio);
 return {width:w,height:w/ratio};
}
export function cropPresentation(crop={x:0,y:0,width:100,height:100},ratio=1.6) {
 return {ratio:ratio*crop.width/crop.height,width:10000/crop.width,height:10000/crop.height,left:-crop.x/crop.width*100,top:-crop.y/crop.height*100};
}
export function bindView() {
 const image=document.getElementById('backdrop'),art=document.getElementById('artwork');
 const fit=()=>{
  const bounds=document.getElementById('scene').getBoundingClientRect();
  const crop=JSON.parse(art.dataset.crop||'null')||undefined;
  const view=cropPresentation(crop,(image.naturalWidth||1600)/(image.naturalHeight||1000));
  const sharp=document.getElementById('scene').dataset.detail==='true';
  const density=window.devicePixelRatio||1;
  const size=fitArtwork(bounds.width,bounds.height,view.ratio,sharp?image.naturalWidth/density:Infinity,sharp?image.naturalHeight/density:Infinity);
  Object.assign(image.style,{position:'absolute',objectFit:'fill',width:view.width+'%',height:view.height+'%',left:view.left+'%',top:view.top+'%'});
  art.style.width=size.width+'px';art.style.height=size.height+'px';
 };
 new ResizeObserver(fit).observe(document.getElementById('scene'));
 image.addEventListener('load',fit);document.addEventListener('sceneviewchange',fit);fit();
 const button=document.getElementById('fullscreen');
 const sync=()=>{const active=!!document.fullscreenElement;button.textContent=active?'Exit full screen':'Full screen';button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');};
 if(!document.documentElement.requestFullscreen){button.hidden=true;}
 else button.addEventListener('click',async()=>{
  try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch {document.getElementById('status').textContent='Full screen is unavailable here. On iPad, use Safari Share → Add to Home Screen.';document.getElementById('help-dialog').showModal();}
 });
 document.addEventListener('fullscreenchange',sync);sync();
}
