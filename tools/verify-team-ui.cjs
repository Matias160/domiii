const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const waitFor=async condition=>{const start=Date.now();while(!condition()){if(Date.now()-start>15000)throw Error('Network state timeout');await new Promise(r=>setTimeout(r,50));}};

(async()=>{
  const output=process.env.QA_OUTPUT||path.join(require('node:os').tmpdir(),'domi-coop-qa');fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,...(process.env.QA_BROWSER?{executablePath:process.env.QA_BROWSER}:{})});
  try{
    const errors=[],peers=[];
    for(const name of ['Anfitrion','Companero']){
      const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      await context.addInitScript(name=>{
        const draw=CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage=function(...args){
          if(this.canvas.id==='shopPreview'&&args[0]?.naturalWidth>0&&args.length===5){const transform=this.getTransform();window.__shopPetSize={width:args[3]*transform.a,height:args[4]*transform.d,y:transform.f+args[2]*transform.d};}
          return draw.apply(this,args);
        };
        localStorage.setItem('domi2pancho.accounts.v1',JSON.stringify({test:{name,bank:0,totalEarned:0,purchases:['pet:cosmo','pet:mate','pet:dulce_leche','pet:choco_heart','pet:icecream_pet','skin:nugget'],runs:[],loadout:{skin:name==='Companero'?'nugget':'pancho',map:'diner',pet:name==='Companero'?'mate':'cosmo',accessory:'none'}}}));
        sessionStorage.setItem('domi2pancho.session.v1','test');
        localStorage.setItem('domi2pancho.achievements.test',JSON.stringify({kills:10,seconds:600,bosses:1,pickups:{}}));
      },name);
      const page=await context.newPage(),peer={page};peers.push(peer);page.setDefaultTimeout(20000);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('websocket',ws=>ws.on('framereceived',frame=>{
        try{const msg=JSON.parse(String(frame.payload));if(msg.type==='room')peer.room=msg.room;if(msg.type==='state')peer.state=msg.state;}catch{}
      }));
      await page.goto(process.env.QA_URL||'http://127.0.0.1:4178/');await page.locator('#splashScreen').waitFor({state:'hidden'});
    }
    const [a,b]=peers;
    await a.page.locator('#lobbyAchievements').click();assert.match(await a.page.locator('#achievementsScreen h2').textContent(),/1 \/ 3/);
    await a.page.locator('#achievementsBackButton').click();
    await a.page.locator('#lobbyTeamStatus').click();
    assert.equal(await a.page.locator('.multi-slot__portrait').count(),1);
    await a.page.waitForFunction(()=>[...document.querySelectorAll('.multi-class-gif')].every(img=>img.complete&&img.naturalWidth>0));
    assert.equal(await a.page.locator('.multi-class-gif').count(),3);
    await a.page.screenshot({path:path.join(output,'class-selection.png')});
    await a.page.locator('#multiCreate').click();
    await waitFor(()=>a.room?.code);
    await b.page.locator('#lobbyTeamStatus').click();await b.page.locator('[data-support-class="green"]').click();
    await b.page.locator('#multiCodeInput').fill(a.room.code);await b.page.locator('#multiJoin').click();
    await waitFor(()=>a.room.members.length===2&&b.room?.members.length===2);
    assert.equal(b.room.members[1].supportClass,'green');
    await a.page.locator('#lobbyTeamStatus').click();
    assert.equal(await a.page.locator('.multi-slot__portrait').count(),2);
    assert.equal(await a.page.locator('.multi-slot__copy strong').nth(1).textContent(),'Companero');
    const portraitHashes=await a.page.locator('.multi-slot__portrait').evaluateAll(canvases=>canvases.map(canvas=>{const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let total=0;for(let i=0;i<data.length;i+=16)total=(total+data[i]*i+data[i+1])%1000000007;return total;}));
    assert.notEqual(portraitHashes[0],portraitHashes[1]);
    await a.page.screenshot({path:path.join(output,'team-portraits.png')});
    await a.page.locator('#multiBackButton').click();
    const before=b.room.members[0].x;
    await a.page.keyboard.down('d');await waitFor(()=>b.room.members[0].x>before+10);await a.page.keyboard.up('d');
    await a.page.screenshot({path:path.join(output,'shared-lobby.png')});
    for(const peer of peers){
      await peer.page.locator('#lobbyTeamStatus').click();await peer.page.locator('#multiBackButton').click();
      await peer.page.keyboard.down('w');
      try{await peer.page.waitForFunction(()=>{const tip=document.querySelector('#lobbyTip');return !tip.hidden&&tip.textContent==='JUGAR';});}finally{await peer.page.keyboard.up('w');}
      await peer.page.keyboard.press('e');await peer.page.locator('#setupScreen.screen--active').waitFor();
      assert.equal(await peer.page.locator('#rowCompanion .setup-option-card').count(),11);
      assert.equal(await peer.page.locator('#companionSelect option').count(),11);
      for(const id of ['cosmo','mate','dulce_leche','choco_heart','icecream_pet']){
        await peer.page.locator(`#rowCompanion [data-value="${id}"]`).click();
        assert.equal(await peer.page.locator('#companionSelect').inputValue(),id);
        assert.equal(await peer.page.locator(`#rowCompanion [data-value="${id}"]`).getAttribute('aria-checked'),'true');
      }
      await peer.page.locator(`#rowCompanion [data-value="${peer===a?'cosmo':'mate'}"]`).click();
      if(peer===a)await peer.page.screenshot({path:path.join(output,'pet-selector.png')});
      if(peer===a){
        await peer.page.locator('[data-category="mode"][data-value="survival"]').click();
        await peer.page.locator('[data-category="map"][data-value="diner"]').click();
      }else assert.equal(await peer.page.locator('#catBarMap').evaluate(el=>el.inert),true);
      await peer.page.locator('#setupNextBtn').click();await peer.page.locator('#startRunButton').click();
    }
    await waitFor(()=>a.state&&b.state);assert.equal(a.state.online.id,b.state.online.id);
    await a.page.locator('#onlineRunScreen.screen--active').waitFor();await b.page.locator('#onlineRunScreen.screen--active').waitFor();
    assert.equal(a.state.players.length,2);assert.equal(b.state.mapId,'diner');
    assert.equal(a.state.companion.id,'cosmo');assert.equal(b.state.companion.id,'mate');
    await a.page.keyboard.press('f');await waitFor(()=>a.state.online.supportCooldown>0);
    await waitFor(()=>a.state.enemies.length>0);
    await a.page.screenshot({path:path.join(output,'cooperative-match.png')});
    await a.page.keyboard.press('Escape');await a.page.locator('#pauseScreen.screen--active').waitFor();
    const time=b.state.time;await waitFor(()=>b.state.time>time+.5);
    await a.page.locator('#resumeButton').click();await a.page.locator('#onlineRunScreen.screen--active').waitFor();
    await b.page.reload();await waitFor(()=>b.room?.phase==='match'&&b.state.time>time);
    await b.page.locator('#onlineRunScreen.screen--active').waitFor();
    await a.page.keyboard.press('Escape');await a.page.locator('#abandonButton').click();
    for(const peer of peers)await peer.page.locator('#lobbyScreen.screen--active').waitFor();
    await a.page.keyboard.down('a');
    try{await waitFor(()=>a.room.members.find(m=>m.id===a.room.selfId).x<480);}finally{await a.page.keyboard.up('a');}
    await a.page.keyboard.down('w');
    try{await a.page.waitForFunction(()=>{const tip=document.querySelector('#lobbyTip');return !tip.hidden&&tip.textContent==='TIENDA ARCADE';});}finally{await a.page.keyboard.up('w');}
    await a.page.keyboard.press('e');await a.page.locator('#shopScreen.screen--active').waitFor();
    await a.page.locator('#shopTabs [data-type="pet"]').click();
    for(const id of ['cosmo','mate','dulce_leche','choco_heart','icecream_pet']){
      await a.page.evaluate(()=>{window.__shopPetSize=null;});
      await a.page.locator(`#shopGrid [data-item="${id}"]`).click();
      await a.page.waitForFunction(()=>window.__shopPetSize?.height>0);
      const size=await a.page.evaluate(()=>window.__shopPetSize);
      assert.ok(size.height<195&&size.height>80,`${id}: comparable pet preview height`);
      assert.ok(size.y>=0&&size.y+size.height<=300,`${id}: preview is not clipped`);
    }
    await a.page.screenshot({path:path.join(output,'pet-shop-scale.png')});
    await a.page.locator('#shopBackButton').click();
    assert.deepEqual(errors,[]);
    await a.page.locator('#lobbyTeamStatus').click();await a.page.setViewportSize({width:844,height:390});
    assert.ok(await a.page.locator('#multiScreen').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    await a.page.screenshot({path:path.join(output,'team-mobile.png')});
    console.log(JSON.stringify({passed:true,sharedRoom:a.room.code,matchId:a.state.online.id,screenshots:output}));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
