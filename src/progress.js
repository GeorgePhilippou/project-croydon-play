const KEY='project-croydon-progress-v1';
export function createProgress(storage,validIds){
 const valid=new Set(validIds);let state={version:1,discovered:[],records:{},sound:false},saved=!!storage;
 try{const raw=JSON.parse(storage?.getItem(KEY)??'null');if(raw?.version===1){state.discovered=[...new Set(Array.isArray(raw.discovered)?raw.discovered.filter(id=>valid.has(id)):[])];state.sound=raw.sound===true;for(const [id,v]of Object.entries(raw.records??{}))if(/^[a-z][a-z0-9:-]*$/.test(id)&&v&&Number.isFinite(v.best)&&v.best>=0&&Number.isInteger(v.wins)&&v.wins>0)state.records[id]={best:v.best,wins:v.wins};}}catch{saved=false;}
 const write=()=>{try{if(!storage)throw new Error('No storage');storage.setItem(KEY,JSON.stringify(state));saved=true;}catch{saved=false;}};
 return {
  get snapshot(){return {discovered:[...state.discovered],records:structuredClone(state.records),sound:state.sound,saved};},
  discover(id){if(valid.has(id)&&!state.discovered.includes(id)){state.discovered.push(id);write();}},
  complete(id,elapsed){if(typeof id!=='string'||!/^[a-z][a-z0-9:-]*$/.test(id)||!Number.isFinite(elapsed)||elapsed<0)return;const old=state.records[id];state.records[id]={best:Math.min(old?.best??Infinity,elapsed),wins:(old?.wins??0)+1};write();},
  setSound(value){state.sound=!!value;write();},
 };
}
