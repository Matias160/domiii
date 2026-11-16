const KEY='domi2pancho.roomSession';
export class RoomClient {
  constructor({onRoom=()=>{},onState=()=>{},onStatus=()=>{},WebSocketImpl=globalThis.WebSocket}={}){
    this.onRoom=onRoom;this.onState=onState;this.onStatus=onStatus;this.WebSocketImpl=WebSocketImpl;this.pending=new Map();this.counter=0;
    try{this.reservation=JSON.parse(sessionStorage.getItem(KEY));}catch{}
  }
  async connect(url){
    if(this.socket?.readyState===1&&url===this.url)return;
    if(this.connecting)return this.connecting;
    this.url=url;this.manual=false;this.onStatus('Conectando…');
    this.connecting=new Promise((resolve,reject)=>{
      const socket=new this.WebSocketImpl(url);this.socket=socket;
      const timeout=setTimeout(()=>{socket.close();reject(Error('No se pudo conectar al servidor de salas.'));},5000);
      socket.onopen=()=>{clearTimeout(timeout);this.onStatus('Conectado');resolve();};
      socket.onerror=()=>{clearTimeout(timeout);reject(Error('Servidor de salas no disponible.'));};
      socket.onmessage=event=>{
        let msg;try{msg=JSON.parse(event.data);}catch{return;}
        if(msg.type==='ack'){
          const request=this.pending.get(msg.requestId);if(!request)return;
          clearTimeout(request.timeout);this.pending.delete(msg.requestId);
          if(msg.error)request.reject(Error(msg.error));else request.resolve(msg);
        }
        if(msg.type==='room'){this.room=msg.room;this.onRoom(msg.room);}
        if(msg.type==='state')this.onState(msg.state);
        if(msg.type==='notice')this.onStatus(msg.message);
      };
      socket.onclose=()=>{
        clearTimeout(timeout);reject(Error('Conexion cerrada.'));
        for(const request of this.pending.values()){clearTimeout(request.timeout);request.reject(Error('Se perdio la conexion.'));}this.pending.clear();
        if(!this.manual&&this.reservation){this.onStatus('Conexion perdida. Reconectando…');this.retry=setTimeout(()=>this.resume().catch(error=>this.onStatus(error.message)),1500);}
      };
    }).finally(()=>{this.connecting=null;});
    return this.connecting;
  }
  send(type,data={}){if(this.socket?.readyState===1)this.socket.send(JSON.stringify({type,...data}));}
  request(type,data={}){
    if(this.socket?.readyState!==1)return Promise.reject(Error('No hay conexion con el servidor.'));
    const requestId=String(++this.counter);
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{this.pending.delete(requestId);reject(Error('El servidor no respondio.'));},6000);
      this.pending.set(requestId,{resolve,reject,timeout});this.send(type,{...data,requestId});
    });
  }
  async enter(type,data){
    const result=await this.request(type,data);this.reservation={code:result.code,token:result.token,url:this.url};
    try{sessionStorage.setItem(KEY,JSON.stringify(this.reservation));}catch{}
    return result;
  }
  async resume(){
    if(!this.reservation)return;
    await this.connect(this.reservation.url);
    try{await this.request('resume',this.reservation);}catch(error){this.clearReservation();this.onRoom(null);throw error;}
  }
  clearReservation(){this.reservation=null;this.room=null;try{sessionStorage.removeItem(KEY);}catch{}}
  async leave(){
    this.manual=true;clearTimeout(this.retry);
    try{if(this.socket?.readyState===1)await this.request('leave');}finally{this.clearReservation();this.socket?.close();this.onRoom(null);}
  }
}
