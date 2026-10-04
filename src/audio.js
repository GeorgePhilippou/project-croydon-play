// Quiet procedural Foley/room tone; no show clips, voices or music.
export function createAudio(){
 let context=null,master=null,hum=null,humGain=null,enabled=false,room='entrance';
 function setup(){if(context)return;const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Sound unavailable');context=new Audio();master=context.createGain();master.gain.value=.12;master.connect(context.destination);hum=context.createOscillator();humGain=context.createGain();hum.type='sine';hum.connect(humGain);humGain.connect(master);humGain.gain.value=0;hum.start();}
 function roomTone(){if(!context)return;const hz={kitchen:60,jez:90,bathroom:110,living:75,mark:70}[room]??55;hum.frequency.setTargetAtTime(hz,context.currentTime,.3);humGain.gain.setTargetAtTime(enabled?(room==='kitchen'?.08:.025):0,context.currentTime,.2);}
 function effect(kind){
  if(!enabled||!context||context.state!=='running')return;
  const time=context.currentTime,duration=kind==='paper'?.3:kind==='found'?.22:.16;
  const gain=context.createGain();gain.gain.setValueAtTime(.001,time);gain.gain.exponentialRampToValueAtTime(kind==='found'?.16:.35,time+.012);gain.gain.exponentialRampToValueAtTime(.001,time+duration);gain.connect(master);
  let node,filter;
  if(kind==='found'){node=context.createOscillator();node.type='sine';node.frequency.setValueAtTime(520,time);node.frequency.exponentialRampToValueAtTime(690,time+duration);node.connect(gain);}
  else{const samples=Math.ceil(context.sampleRate*duration),buffer=context.createBuffer(1,samples,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<samples;i++)data[i]=Math.random()*2-1;node=context.createBufferSource();node.buffer=buffer;filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='paper'?1400:190;node.connect(filter);filter.connect(gain);}
  node.start(time);node.stop(time+duration+.02);node.onended=()=>{node.disconnect();filter?.disconnect();gain.disconnect();};
 }
 return {
  async setEnabled(value){if(value){try{setup();await context.resume();enabled=true;}catch{enabled=false;}}else enabled=false;roomTone();return enabled;},
  setRoom(value){room=value;roomTone();},effect,
  async suspend(){if(context)await context.suspend();},
  async resume(){if(enabled&&context)try{await context.resume();}catch{}},
  get enabled(){return enabled;},
 };
}
