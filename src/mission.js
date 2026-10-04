import { objects } from './objects.js?v=9f8157d5a6c0';
// One deadline covers all targets; discoveries may be collected in any order.
export function createMission(now = () => performance.now()) {
 let state='idle',targets=[],collected=[],lastCollected=null,started=0,deadline=0,elapsed=0,pausedAt=0;
 const pauses=new Set();
 const pending=()=>targets.filter(id=>!collected.includes(id));
 function snapshot(){const time=state==='paused'?pausedAt:now();return {state,pauseReasons:[...pauses],target:pending()[0]??lastCollected,targets:[...targets],collected:[...collected],pending:pending(),remaining:['running','paused'].includes(state)?Math.max(0,deadline-time):0,elapsed:['running','paused'].includes(state)?time-started:elapsed};}
 function tick(){if(state==='running'&&now()>=deadline){state='lost';elapsed=deadline-started;}return snapshot();}
 return {
  start(ids='red-toolbox',seconds=60){
   const next=Array.isArray(ids)?[...ids]:[ids];
   if(!next.length||new Set(next).size!==next.length||next.some(id=>!objects[id]))throw new Error('Unknown hunt target or duplicate target');
   if(!Number.isFinite(seconds)||seconds<=0)throw new Error('Hunt duration must be positive');
   pauses.clear();targets=next;collected=[];lastCollected=null;started=now();deadline=started+seconds*1000;elapsed=0;state='running';return snapshot();
  },tick,
  pause(reason='inspection'){tick();if(['running','paused'].includes(state)){pauses.add(reason);if(state==='running'){pausedAt=now();state='paused';}}return snapshot();},
  resume(reason='inspection'){pauses.delete(reason);if(state==='paused'&&!pauses.size){const duration=now()-pausedAt;deadline+=duration;started+=duration;state='running';}return tick();},
  inspect(id){tick();if(state!=='running'||!pending().includes(id))return false;collected.push(id);lastCollected=id;if(!pending().length){elapsed=now()-started;state='won';}return true;},
  cancel(){pauses.clear();state='idle';targets=[];collected=[];lastCollected=null;elapsed=0;return snapshot();},
  get status(){return tick();},
 };
}
