const KEY = 'domi2pancho.audio';
const tune = [0,7,12,7,3,10,15,10,5,12,17,12,3,10,7,3];
export class AudioSystem {
  constructor() {
    let settings={};try{settings=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
    this.musicEnabled=settings.musicEnabled??false;this.sfxEnabled=settings.sfxEnabled??true;
    this.volume=Math.min(1,Math.max(0,Number(settings.volume??.35)||0));
    this.context=null;this.timer=null;this.step=0;this.scene='menuScreen';this.lastSounds={};
  }
  async unlock() {
    try {
      if(!this.context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;this.context=new Audio();this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')await this.context.resume();
      if(this.musicEnabled&&!this.timer)this.timer=setInterval(()=>this.tick(),125);
    }catch{}
  }
  save(){try{localStorage.setItem(KEY,JSON.stringify({musicEnabled:this.musicEnabled,sfxEnabled:this.sfxEnabled,volume:this.volume}));}catch{}}
  setMusic(value){this.musicEnabled=value;this.save();if(value)this.unlock();else{clearInterval(this.timer);this.timer=null;}}
  setSfx(value){this.sfxEnabled=value;this.save();}
  setVolume(value){this.volume=Math.min(1,Math.max(0,Number(value)));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.03);this.save();}
  setScene(scene){this.scene=scene;}
  tone(freq,duration,volume,type='square',end=freq){
    if(!this.context||this.context.state!=='running')return;
    const now=this.context.currentTime,osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(25,end),now+duration);
    gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(volume,now+.004);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(now+duration+.01);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  tick(){
    if(!this.musicEnabled||document.hidden||['pauseScreen','abilityScreen','gameOverScreen'].includes(this.scene))return;
    const boss=this.scene==='boss',playing=this.scene==='gameScreen'||boss;
    const step=this.step++%32,root=boss?110:130.81;
    if(step%2===0)this.tone(root*2**(tune[(step/2)%16]/12),.14,.032,'triangle');
    if(step%4===0)this.tone(root/2*2**([0,0,5,3][Math.floor(step/8)]/12),.22,.065,'triangle');
    if(playing&&step%8===0)this.tone(115,.10,.075,'sine',38);
    if(playing&&step%8===4)this.tone(180,.055,.025,'sawtooth',70);
    if(boss&&step%2)this.tone(1600,.018,.012,'square',700);
  }
  play(kind='shoot'){
    if(!this.sfxEnabled||!this.context)return;
    const now=this.context.currentTime;if(now-(this.lastSounds[kind]??-1)<.045)return;this.lastSounds[kind]=now;
    if (kind === 'crit') {
      this.tone(1200, .06, .08, 'square', 1850);
      setTimeout(() => this.tone(1850, .14, .09, 'triangle', 2400), 40);
      return;
    }
    if (kind === 'telegraph') {
      this.tone(320, .18, .07, 'sawtooth', 140);
      return;
    }
    if (kind === 'bossPhase') {
      this.tone(130, .45, .14, 'sawtooth', 55);
      setTimeout(() => this.tone(520, .3, .10, 'square', 1040), 90);
      return;
    }
    if (kind === 'synergy') {
      this.tone(587, .12, .07, 'triangle', 880);
      setTimeout(() => this.tone(880, .16, .09, 'triangle', 1320), 80);
      setTimeout(() => this.tone(1320, .22, .11, 'square', 1760), 160);
      return;
    }
    if (kind === 'button_click') {
      this.tone(740, .035, .04, 'square', 980);
      return;
    }
    if (kind === 'victory') {
      this.tone(523, .16, .10, 'triangle', 659);
      setTimeout(() => this.tone(659, .16, .11, 'triangle', 784), 130);
      setTimeout(() => this.tone(784, .18, .12, 'triangle', 1046), 260);
      setTimeout(() => this.tone(1046, .45, .14, 'square', 1318), 400);
      return;
    }
    if (kind === 'heartbeat') {
      this.tone(75, .08, .09, 'sine', 40);
      setTimeout(() => this.tone(90, .09, .07, 'sine', 45), 95);
      return;
    }
    if (kind === 'door_bell') {
      this.tone(784, .14, .08, 'triangle', 784);
      setTimeout(() => this.tone(1174, .28, .10, 'triangle', 1174), 100);
      return;
    }
    if (kind === 'dash_ready') {
      this.tone(880, .07, .045, 'triangle', 1320);
      return;
    }
    const config={navigate:[540,.035,.025,680],confirm:[660,.09,.04,990],purchase:[880,.25,.07,1760],dash:[210,.12,.045,680],shoot:[750,.05,.045,260],pickup:[720,.18,.10,1200],kill:[370,.075,.035,160],damage:[130,.18,.10,45],boss:[110,.45,.12,55],level:[660,.30,.11,1320],death:[220,.65,.12,30]}[kind]||[440,.1,.06,440];
    this.tone(config[0],config[1],config[2],kind==='pickup'||kind==='level'?'triangle':'square',config[3]);
  }
}
