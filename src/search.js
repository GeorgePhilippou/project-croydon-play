export function visibleHotspots(scene,opened){return scene.hotspots.filter(h=>(!h.when||opened.has(h.when))&&(!h.unless||!opened.has(h.unless)));}
export function toggleCover(opened,id){if(opened.has(id))opened.delete(id);else opened.add(id);}
