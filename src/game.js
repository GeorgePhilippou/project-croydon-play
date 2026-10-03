import { rooms, scenes, startScene } from './scenes.js?v=4aa395e82b2f';
import { createNavigator } from './navigation.js?v=4aa395e82b2f';
import { bindInput } from './input.js?v=4aa395e82b2f';
import { createMission } from './mission.js?v=4aa395e82b2f';
import { objects, pickTarget } from './objects.js?v=4aa395e82b2f';
const nav=createNavigator(scenes,startScene), mission=createMission();
const $=id=>document.getElementById(id);
let resultShown=false,lastTarget=null;
const discovered=new Set();
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());}
function render(){
 const scene=nav.current;
 $('backdrop').src=scene.background;
 $('backdrop').alt=`${scene.name}. ${scene.description}`;
 $('scene').dataset.scene=scene.id;
 $('room-name').textContent=scene.name;$('view-description').textContent=scene.description;
 $('progress').textContent=`${nav.visited.size}/${rooms.length} places · ${discovered.size}/${Object.keys(objects).length} objects`;
 $('map-location').textContent=scene.name;
 document.querySelectorAll('[data-map-room]').forEach(el=>el.classList.toggle('current',el.dataset.mapRoom===scene.room));
 document.querySelectorAll('[data-action]').forEach(button=>{button.disabled=button.dataset.action==='back'?!nav.canBack:!scene[button.dataset.action];});
 $('hotspots').replaceChildren();
 $('return-zone').hidden=!nav.canBack;
 $('return-zone').querySelector('span').textContent=scene.room==='hall'?'↓ Back to entrance':'↓ Back to hallway';
 for(const h of scene.hotspots){
  const button=document.createElement('button');
  const label=document.createElement('span');label.textContent=h.object?'⌕':h.label;button.append(label);
  button.className=h.object?'object-hotspot':'door-hotspot';
  if(h.object)button.dataset.object=h.object;
  button.setAttribute('aria-label',h.label);button.title=h.label;
  button.style.left=`${h.x}%`;button.style.top=`${h.y}%`;
  button.style.width=`${h.width}%`;button.style.height=`${h.height}%`;
  button.addEventListener('click',()=>{if(h.object)inspect(h.object);else{nav.go(h.target);render();$('status').textContent=nav.current.name;}});$('hotspots').append(button);
 }
 $('scene').classList.remove('is-changing');void $('scene').offsetWidth;$('scene').classList.add('is-changing');updateTimer();
}
function inspect(object){
 const prop=objects[object],status=mission.status;
 if(['won','lost'].includes(status.state)){updateTimer();return;}
 discovered.add(object);
 $('progress').textContent=`${nav.visited.size}/${rooms.length} places · ${discovered.size}/${Object.keys(objects).length} objects`;
 if(mission.inspect(object)){updateTimer();showResult();return;}
 if(status.state==='running')mission.pause();
 updateTimer();
 if(mission.status.state==='lost')return;
 $('object-name').textContent=prop.name;
 $('object-image').src=prop.image;$('object-image').alt=prop.name;
 $('object-caption').textContent=prop.caption;
 $('object-hunt-status').textContent=status.state==='running'?`Not your target. Keep looking for ${objects[status.target].name}. The hunt is paused while you inspect.`:'A little piece of Flat 5, found.';
 $('object-collection').textContent=`${discovered.size} of ${Object.keys(objects).length} objects discovered`;
 $('object-dialog').showModal();
}
function updateTimer(){
 const status=mission.status, target=objects[status.target];
 $('timer').textContent=status.state==='running'?`${Math.ceil(status.remaining/1000)}s`:status.state==='paused'?'PAUSED':status.state==='won'?'FOUND':status.state==='lost'?'TIME UP':'EXPLORE';
 $('operation').textContent=target?`OPERATION: ${target.operation.toUpperCase()}`:'AT HOME IN FLAT 5';
 $('mission-line').textContent=['running','paused'].includes(status.state)?`Find ${target.name}.`:'Explore the flat at your own pace.';
 $('timer').classList.toggle('urgent',status.state==='running'&&status.remaining<=10000);
 if(status.state==='lost'&&!resultShown)showResult();
}
function showResult(){
 if(resultShown)return;resultShown=true;
 const status=mission.status,target=objects[status.target];
 $('result-image').src=target.image;$('result-image').alt=target.name;
 $('result-caption').textContent=target.caption;
 $('result-art').hidden=status.state!=='won';
 $('result-collection').textContent=status.state==='won'?`${discovered.size} of ${Object.keys(objects).length} objects discovered`:'';
 $('result-operation').textContent=`OPERATION: ${target.operation.toUpperCase()}`;
 $('result-title').textContent=status.state==='won'?'Found it.':'Time’s up.';
 $('result-copy').textContent=status.state==='won'?`You found ${target.name} in ${(status.elapsed/1000).toFixed(1)} seconds. ${target.found}`:`Still missing: ${target.name}. Try the same hunt again, or choose a different object.`;
 closeDialogs();$('result-dialog').showModal();
}
function startHunt(target){
 closeDialogs();lastTarget=target;resultShown=false;nav.reset();mission.start(target);render();$('status').textContent=`Hunt started. Find ${objects[target].name}.`;
}
function chooseHunt(){
 closeDialogs();mission.cancel();resultShown=false;updateTimer();$('start-dialog').showModal();
}
function explore(){closeDialogs();resultShown=false;mission.cancel();nav.reset();render();$('status').textContent='Free exploration. Follow the hallway doorways and inspect anything interesting.';}
bindInput(action=>{
 if(['won','lost'].includes(mission.status.state))return;
 if(nav.move(action)){render();$('status').textContent=`${nav.current.name}.`;}
 else $('status').textContent=action==='back'?'You are at the entrance.':nav.canBack?'No doorway in that direction. Use ↓ to return to the hallway.':'Choose a visible doorway.';
},()=>{
 $('control-heading').textContent='TAP DOORWAYS AND OBJECTS';
 $('control-hint').textContent='Tap a doorway to move. Tap an object to inspect. Tap the bottom edge to return.';
});
document.addEventListener('keydown',event=>{
 if(event.key.toLowerCase()!=='e'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||event.target.closest('input,textarea,select'))return;
 const focused=document.activeElement;
 if(focused?.dataset.object){event.preventDefault();inspect(focused.dataset.object);}
 else{const spot=$('hotspots').querySelector('.object-hotspot');if(spot){event.preventDefault();spot.focus();$('status').textContent='Inspection spot selected. Press E or Enter to examine it.';}else $('status').textContent='Nothing to inspect here. Try one of the rooms.';}
});
for(const [id,prop] of Object.entries(objects)){const option=document.createElement('option');option.value=id;option.textContent=prop.name;$('mission-choice').append(option);}
function updateBrief(){$('hunt-brief').textContent=objects[$('mission-choice').value]?.brief??'A randomly chosen object has gone missing. Find it in the flat before 60 seconds run out.';}
$('mission-choice').addEventListener('change',updateBrief);updateBrief();
$('reset').addEventListener('click',()=>{mission.cancel();nav.reset();resultShown=false;render();chooseHunt();});
$('new-hunt').addEventListener('click',chooseHunt);$('another-hunt').addEventListener('click',chooseHunt);
$('start-hunt').addEventListener('click',()=>startHunt($('mission-choice').value==='random'?pickTarget(lastTarget):$('mission-choice').value));
$('retry').addEventListener('click',()=>startHunt(lastTarget));
$('explore').addEventListener('click',explore);$('result-explore').addEventListener('click',explore);
$('close-object').addEventListener('click',()=>$('object-dialog').close());
$('object-dialog').addEventListener('close',()=>{mission.resume();updateTimer();});
$('map').addEventListener('click',()=>$('map-dialog').showModal());$('close-map').addEventListener('click',()=>$('map-dialog').close());
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());
// Warm the local image cache without blocking the opening screen.
for(const scene of Object.values(scenes)){const img=new Image();img.src=scene.background;}
setInterval(updateTimer,100);render();$('start-dialog').showModal();
