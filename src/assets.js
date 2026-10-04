// Deduplicate requests and warm compressed assets before the next doorway tap.
export function createAssetCache(load,concurrency=3){
 const entries=new Map(),queue=[];let active=0;
 function pump(){while(active<concurrency&&queue.length){const entry=queue.shift();active++;entry.state='loading';Promise.resolve().then(()=>load(entry.url)).then(ok=>{entry.state=ok===false?'error':'ready';entry.resolve(ok!==false);},()=>{entry.state='error';entry.resolve(false);}).finally(()=>{active--;pump();});}}
 return {
  request(url,urgent=false){if(!url)return Promise.resolve(false);let entry=entries.get(url);if(entry){if(urgent&&entry.state==='queued'){queue.splice(queue.indexOf(entry),1);queue.unshift(entry);pump();}return entry.promise;}entry={url,state:'queued'};entry.promise=new Promise(resolve=>entry.resolve=resolve);entries.set(url,entry);if(urgent)queue.unshift(entry);else queue.push(entry);pump();return entry.promise;},
  ready(url){return entries.get(url)?.state==='ready';},
 };
}
export function loadImage(url){return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=url;});}
export function nearbyAssets(scene,graph,objects){
 const ids=[scene.id,scene.parent,scene.left,scene.right,scene.forward,...scene.hotspots.map(h=>h.target)].filter(Boolean);
 return [...new Set(ids.flatMap(id=>{const s=graph[id];return [s.background,...s.hotspots.flatMap(h=>[h.coverArt,h.object?objects[h.object]?.image:null])].filter(Boolean);} ))];
}
