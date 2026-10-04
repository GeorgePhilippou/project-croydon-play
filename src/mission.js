import { objects } from './objects.js?v=da4a174661bf';
// An injected monotonic clock enforces the deadline even between timer ticks.
export function createMission(now = () => performance.now()) {
 let state='idle', target=null, started=0, deadline=0, elapsed=0, pausedAt=0;
 function snapshot() { const time=state==='paused'?pausedAt:now(); return {state,target,remaining:['running','paused'].includes(state)?Math.max(0,deadline-time):0,elapsed:['running','paused'].includes(state)?time-started:elapsed}; }
 function tick() { if(state==='running'&&now()>=deadline){state='lost';elapsed=deadline-started;} return snapshot(); }
 return {
  start(targetId='red-toolbox',seconds=60) {
   if(!objects[targetId])throw new Error(`Unknown hunt target: ${targetId}`);
   if(!Number.isFinite(seconds)||seconds<=0)throw new Error('Hunt duration must be positive');
   target=targetId;started=now();deadline=started+seconds*1000;elapsed=0;state='running';return snapshot();
  },
  tick,
  pause() { tick();if(state==='running'){pausedAt=now();state='paused';}return snapshot(); },
  resume() {if(state==='paused'){const duration=now()-pausedAt;deadline+=duration;started+=duration;state='running';}return tick();},
  inspect(object) { tick();if(state!=='running'||object!==target)return false;elapsed=now()-started;state='won';return true; },
  cancel() {state='idle';target=null;elapsed=0;return snapshot();},
  get status(){return tick();},
 };
}
