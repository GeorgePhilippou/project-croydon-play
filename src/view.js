// Keep hit rectangles anchored to the image in any screen shape.
export function fitArtwork(width,height,ratio) {
 const w=Math.min(width,height*ratio);
 return {width:w,height:w/ratio};
}
export function bindView() {
 const image=document.getElementById('backdrop'),art=document.getElementById('artwork');
 const fit=()=>{
  const bounds=document.getElementById('scene').getBoundingClientRect();
  const size=fitArtwork(bounds.width,bounds.height,(image.naturalWidth||1600)/(image.naturalHeight||1000));
  art.style.width=size.width+'px';art.style.height=size.height+'px';
 };
 new ResizeObserver(fit).observe(document.getElementById('scene'));
 image.addEventListener('load',fit);fit();
 const button=document.getElementById('fullscreen');
 const sync=()=>{const active=!!document.fullscreenElement;button.textContent=active?'Exit full screen':'Full screen';button.setAttribute('aria-label',active?'Exit full screen':'Enter full screen');};
 if(!document.documentElement.requestFullscreen){button.hidden=true;}
 else button.addEventListener('click',async()=>{
  try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch {document.getElementById('status').textContent='Full screen is unavailable here. On iPad, use Safari Share → Add to Home Screen.';document.getElementById('help-dialog').showModal();}
 });
 document.addEventListener('fullscreenchange',sync);sync();
}
