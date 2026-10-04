import { bindView } from './view.js?v=9f8157d5a6c0';
import { rooms, scenes, startScene } from './scenes.js?v=9f8157d5a6c0';
import { createNavigator } from './navigation.js?v=9f8157d5a6c0';
import { bindInput } from './input.js?v=9f8157d5a6c0';
import { createMission } from './mission.js?v=9f8157d5a6c0';
import { objects, pickTarget } from './objects.js?v=9f8157d5a6c0';
import { hunts } from './hunts.js?v=9f8157d5a6c0';
import { createProgress } from './progress.js?v=9f8157d5a6c0';
import { visibleHotspots, toggleCover } from './search.js?v=9f8157d5a6c0';
import { createAudio } from './audio.js?v=9f8157d5a6c0';
import { createAssetCache,loadImage,nearbyAssets } from './assets.js?v=9f8157d5a6c0';
import { physicalLayers } from './layers.js?v=9f8157d5a6c0';
const assets=createAssetCache(loadImage);
let loadingNotice=null;
const nav=createNavigator(scenes,startScene), mission=createMission(), audio=createAudio();
const $=id=>document.getElementById(id);
let storage;try{storage=window.localStorage;}catch{}
const progress=createProgress(storage,Object.keys(objects));
let resultShown=false,lastTarget=null,lastChoice=null,selectedHunt=null;
const discovered=new Set(progress.snapshot.discovered),opened=new Set();
const placeCount=()=>new Set([...nav.visited].map(id=>scenes[id].room)).size;
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
function position(el,h){el.style.left=`${h.x}%`;el.style.top=`${h.y}%`;el.style.width=`${h.width}%`;el.style.height=`${h.height}%`;}
function collection(){return `${placeCount()}/${rooms.length} places · ${discovered.size}/${Object.keys(objects).length} objects`;}
function render(){
 const scene=nav.current;
 $('artwork').dataset.crop=JSON.stringify(scene.crop??null);
 if($('backdrop').getAttribute('src')!==scene.background){$('backdrop').dataset.failed='';$('backdrop').src=scene.background;}
 $('scene').dataset.detail=scene.detail?'true':'false';
 document.dispatchEvent(new Event('sceneviewchange'));
 $('scene-fill').style.backgroundImage=`url("${scene.background}")`;
 $('backdrop').alt=`${scene.name}. ${scene.description}`;
 $('scene').dataset.scene=scene.id;
 $('room-name').textContent=scene.name;$('view-description').textContent=scene.description;
 $('progress').textContent=collection();$('map-location').textContent=scene.name;
 document.querySelectorAll('[data-map-room]').forEach(el=>el.classList.toggle('current',el.dataset.mapRoom===(scene.room==='vestibule'?'entrance':scene.room)));
 document.querySelectorAll('[data-action]').forEach(button=>{button.disabled=button.dataset.action==='back'?!nav.canBack:!scene[button.dataset.action];});
 $('hotspots').replaceChildren();$('return-zone').hidden=!nav.canBack;
 $('return-zone').setAttribute('aria-label',scene.detail?'Return to previous inspection':'Return to previous scene');
 $('return-zone').querySelector('span').textContent='↓ Step back';
 for(const layer of physicalLayers(scene,scenes,opened)){
  if(layer.kind==='cover'&&layer.origin===scene.id)continue;
  const el=document.createElement(layer.kind==='sprite'?'img':'div');
  el.className=layer.kind==='sprite'?'prop-sprite':layer.kind==='interior'?`drawer-interior ${layer.origin!==scene.id?'scenery-interior':''}`:`search-cover cover-${layer.kindName} scenery-cover`;
  el.setAttribute('aria-hidden','true');position(el,layer);
  if(layer.kind==='sprite'){el.src=objects[layer.object].image;el.dataset.prop=layer.object;}
  if(layer.coverArt){const img=document.createElement('img');img.src=layer.coverArt;img.alt='';el.append(img);}
  $('hotspots').append(el);
 }
 for(const h of visibleHotspots(scene,opened)){
  const button=document.createElement('button');
  const label=document.createElement('span');label.textContent=h.object?'⌕':h.label;button.append(label);
  button.className=h.cover?`search-cover cover-${h.kind}`:h.object?'object-hotspot':h.detail?'area-hotspot':'door-hotspot';
  if(h.object)button.dataset.object=h.object;if(h.detail)button.dataset.detail=h.target;if(h.cover)button.dataset.cover=h.cover;
  button.setAttribute('aria-label',h.label);position(button,h);
  if(h.coverArt){const img=document.createElement('img');img.src=h.coverArt;img.alt='';button.append(img);}
  button.addEventListener('click',()=>{
   if($('scene').classList.contains('is-loading')||$('scene').classList.contains('load-error'))return;
   if(['won','lost'].includes(mission.status.state)){updateTimer();return;}
   if(h.cover){toggleCover(opened,h.cover);audio.effect('paper');render();$('status').textContent='Moved aside. Look carefully underneath.';}
   else if(h.object)inspect(h.object);
   else{nav.go(h.target);audio.effect('step');render();$('status').textContent=nav.current.name;}
  });$('hotspots').append(button);
 }
 audio.setRoom(scene.room);
 for(const img of $('artwork').querySelectorAll('img')){img.addEventListener('load',syncLoading,{once:true});img.addEventListener('error',()=>{img.dataset.failed='true';syncLoading();},{once:true});}
 syncLoading();
 assets.request(scene.background,true);
 for(const url of nearbyAssets(scene,scenes,objects))assets.request(url);

 $('scene').classList.remove('is-changing');void $('scene').offsetWidth;$('scene').classList.add('is-changing');updateTimer();
}
function inspect(object){
 if($('scene').classList.contains('is-loading')||$('scene').classList.contains('load-error'))return;
 if(!visibleHotspots(nav.current,opened).some(h=>h.object===object))return;
 const prop=objects[object],status=mission.status;
 if(['won','lost'].includes(status.state)){updateTimer();return;}
 const accepted=mission.inspect(object);
 // A delayed timer callback must never allow a late collection.
 if(mission.status.state==='lost'){updateTimer();return;}
 discovered.add(object);progress.discover(object);audio.effect('found');$('progress').textContent=collection();
 if(accepted&&mission.status.state==='won'){updateTimer();showResult();return;}
 if(status.state==='running')mission.pause();updateTimer();
 $('object-name').textContent=prop.name;$('object-image').src=prop.image;$('object-image').alt=prop.name;$('object-caption').textContent=prop.caption;
 const current=mission.status;
 $('object-hunt-status').textContent=status.state==='running'?(accepted?`${current.collected.length} of ${current.targets.length} found. `:'Not on this hunt’s list. ')+`Still looking for ${current.pending.map(id=>objects[id].name).join(', ')}. The hunt is paused while you inspect.`:'A little piece of Flat 5, found.';
 $('object-collection').textContent=`${discovered.size} of ${Object.keys(objects).length} objects discovered`;$('object-dialog').showModal();
}
function updateTimer(){
 const status=mission.status,target=objects[status.target];
 $('timer').textContent=status.state==='running'?`${Math.ceil(status.remaining/1000)}s`:status.state==='paused'?(status.pauseReasons.includes('loading')?'LOADING':'PAUSED'):status.state==='won'?'FOUND':status.state==='lost'?'TIME UP':'EXPLORE';
 $('operation').textContent=selectedHunt?selectedHunt.name.toUpperCase():target?`OPERATION: ${target.operation.toUpperCase()}`:'AT HOME IN FLAT 5';
 $('mission-line').textContent=['running','paused'].includes(status.state)?`${status.collected.length}/${status.targets.length} · Find ${status.pending.map(id=>objects[id].name).join(', ')}.`:'Explore the flat at your own pace.';
 $('timer').classList.toggle('urgent',status.state==='running'&&status.remaining<=10000);
 if(status.state==='lost'&&!resultShown)showResult();
}
function showResult(){
 if(resultShown)return;resultShown=true;
 const status=mission.status,target=objects[status.target];
 if(status.state==='won')progress.complete(lastChoice,status.elapsed);
 $('result-image').src=target.image;$('result-image').alt=target.name;$('result-caption').textContent=target.caption;$('result-art').hidden=status.state!=='won';
 $('result-collection').textContent=status.state==='won'?`${discovered.size} of ${Object.keys(objects).length} objects discovered`:'';
 $('result-operation').textContent=selectedHunt?.name??`OPERATION: ${target.operation.toUpperCase()}`;
 $('result-title').textContent=status.state==='won'?(status.targets.length>1?'All accounted for.':'Found it.'):'Time’s up.';
 $('result-copy').textContent=status.state==='won'?`${status.targets.length>1?'All three objects':target.name} found in ${(status.elapsed/1000).toFixed(1)} seconds. ${target.found}`:`Still missing: ${status.pending.map(id=>objects[id].name).join(', ')}. Try again, or choose another hunt.`;
 closeDialogs();$('result-dialog').showModal();
}
function startHunt(choice){
 closeDialogs();lastChoice=choice;selectedHunt=choice.startsWith('hunt:')?hunts[choice.slice(5)]:null;
 const targets=selectedHunt?.targets??choice;lastTarget=selectedHunt?lastTarget:choice;
 resultShown=false;opened.clear();nav.reset();mission.start(targets,selectedHunt?.seconds??60);render();$('status').textContent='Hunt started. Search the flat.';
}
function chooseHunt(){closeDialogs();mission.cancel();selectedHunt=null;resultShown=false;updateTimer();$('start-dialog').showModal();}
function explore(){closeDialogs();resultShown=false;selectedHunt=null;opened.clear();mission.cancel();nav.reset();render();$('status').textContent='Free exploration. Follow the hallway doorways and inspect anything interesting.';}
bindInput(action=>{
 if(['won','lost'].includes(mission.status.state))return;
 if(nav.move(action)){audio.effect('step');render();$('status').textContent=`${nav.current.name}.`;}
 else $('status').textContent=action==='back'?'You are at the entrance.':nav.canBack?'No doorway in that direction. Use ↓ to step back.':'Choose a visible doorway.';
},()=>{$('control-heading').textContent='TAP DOORWAYS AND OBJECTS';$('control-hint').textContent='Tap a doorway to move. Tap furniture to look closer, then search underneath the clutter. Tap the bottom edge to step back.';});
document.addEventListener('keydown',event=>{
 if(event.key.toLowerCase()!=='e'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||event.target.closest('input,textarea,select'))return;
 const focused=document.activeElement;
 if(focused?.matches('#hotspots button')){event.preventDefault();focused.click();}
 else{const spot=$('hotspots').querySelector('.area-hotspot,.search-cover,.object-hotspot');if(spot){event.preventDefault();spot.focus();$('status').textContent='Inspection area selected. Press E or Enter to inspect.';}else $('status').textContent='Nothing to inspect here. Try one of the rooms.';}
});
for(const [id,prop] of Object.entries(objects)){const option=document.createElement('option');option.value=id;option.textContent=prop.name;$('mission-choice').append(option);}
const group=document.createElement('optgroup');group.label='Longer hunts · three minutes';
for(const [id,hunt] of Object.entries(hunts)){const option=document.createElement('option');option.value='hunt:'+id;option.textContent=hunt.name;group.append(option);}$('mission-choice').append(group);
function updateBrief(){const choice=$('mission-choice').value,hunt=hunts[choice.replace('hunt:','')];$('hunt-brief').textContent=hunt?`${hunt.brief} Find ${hunt.targets.map(id=>objects[id].name).join(', ')}.`:objects[choice]?.brief??'A randomly chosen object has gone missing. Find it before 60 seconds run out.';$('start-hunt').textContent=hunt?'Start three-minute hunt':'Start 60-second hunt';}
$('mission-choice').addEventListener('change',updateBrief);updateBrief();
$('reset').addEventListener('click',()=>{mission.cancel();nav.reset();resultShown=false;render();chooseHunt();});
$('new-hunt').addEventListener('click',chooseHunt);$('another-hunt').addEventListener('click',chooseHunt);
$('start-hunt').addEventListener('click',()=>startHunt($('mission-choice').value==='random'?pickTarget(lastTarget):$('mission-choice').value));
$('retry').addEventListener('click',()=>startHunt(lastChoice));$('explore').addEventListener('click',explore);$('result-explore').addEventListener('click',explore);
$('close-object').addEventListener('click',()=>$('object-dialog').close());$('object-dialog').addEventListener('close',()=>{mission.resume();updateTimer();});
$('map').addEventListener('click',()=>$('map-dialog').showModal());$('close-map').addEventListener('click',()=>$('map-dialog').close());
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());
$('journal').addEventListener('click',()=>{
 const data=progress.snapshot;$('journal-summary').textContent=`${discovered.size} of ${Object.keys(objects).length} found. Unfound objects stay unlisted.`;$('journal-items').replaceChildren();
 for(const id of discovered){const prop=objects[id],card=document.createElement('article'),img=document.createElement('img'),title=document.createElement('h3'),copy=document.createElement('p');img.src=prop.image;img.alt=prop.name;img.loading='lazy';title.textContent=prop.name;copy.textContent=prop.caption;card.append(img,title,copy);$('journal-items').append(card);}
 $('journal-records').replaceChildren();for(const [id,record]of Object.entries(data.records)){const name=id.startsWith('hunt:')?hunts[id.slice(5)]?.name:objects[id]?.name;if(!name)continue;const row=document.createElement('p');row.textContent=`${name} · best ${(record.best/1000).toFixed(1)}s · ${record.wins} completed`;$('journal-records').append(row);}
 if(!$('journal-records').children.length)$('journal-records').textContent='No completed hunts yet.';
 $('save-status').textContent=data.saved?'Saved on this browser. Your discoveries survive a refresh.':'Saving is unavailable on this browser. You can still play this session.';$('journal-dialog').showModal();
});$('close-journal').addEventListener('click',()=>$('journal-dialog').close());
async function sound(value){const enabled=await audio.setEnabled(value);progress.setSound(enabled);$('sound').textContent=enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(enabled));if(value&&!enabled)$('status').textContent='Sound is unavailable here. You can keep playing.';}
$('sound').addEventListener('click',()=>sound(!audio.enabled));
if(progress.snapshot.sound)document.addEventListener('pointerdown',()=>sound(true),{once:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.suspend().catch(()=>{});else audio.resume();});
function syncLoading(){
 const images=[...$('artwork').querySelectorAll('img')],failed=images.some(img=>img.dataset.failed==='true'),loading=!failed&&images.some(img=>!img.complete||!img.naturalWidth);
 $('scene').classList.toggle('is-loading',loading);$('scene').classList.toggle('load-error',failed);$('retry-art').hidden=!failed;
 clearTimeout(loadingNotice);if(!loading)$('scene').classList.remove('show-loading');else loadingNotice=setTimeout(()=>{$('scene').classList.add('show-loading');},250);
 for(const button of $('hotspots').querySelectorAll('button'))button.disabled=loading||failed;
 if(loading||failed)mission.pause('loading');else mission.resume('loading');
 if(failed)$('status').textContent='Artwork could not load. Retry the room before searching.';
}
$('retry-art').addEventListener('click',()=>{$('backdrop').removeAttribute('src');render();});
// Warm connected overview rooms while the opening dialog is on screen; detail
// art/foreground props are queued for the current room as the player approaches.
for(const scene of Object.values(scenes).filter(s=>!s.detail))assets.request(scene.background);
bindView();setInterval(updateTimer,100);render();$('start-dialog').showModal();
