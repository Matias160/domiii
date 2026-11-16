const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const output = process.env.QA_OUTPUT || path.join(require('node:os').tmpdir(), 'domi-team-qa');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER ? { executablePath: process.env.QA_BROWSER } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('domi2pancho.achievements.invitado', JSON.stringify({ kills:10, seconds:600, bosses:1, pickups:{} }));
    });
    await page.goto(process.env.QA_URL || 'http://127.0.0.1:4177/');
    await page.locator('#splashScreen').waitFor({ state:'hidden', timeout:15000 });
    await page.locator('#lobbyAchievements').click();
    assert.match(await page.locator('#achievementsScreen h2').textContent(), /1 \/ 3/);
    assert.equal(await page.locator('.achievement-frame--locked').count(), 2);
    await page.screenshot({ path:path.join(output,'achievements-half.png') });
    await page.evaluate(() => localStorage.setItem('domi2pancho.achievements.invitado', JSON.stringify({kills:10,seconds:600,bosses:3,distance:1000000,pickups:{ketchup:20}})));
    await page.locator('#achievementsBackButton').click();
    await page.locator('#lobbyAchievements').click();
    assert.match(await page.locator('#achievementsScreen h2').textContent(), /3 \/ 3/);
    assert.equal(await page.locator('.achievement-frame__particles i').count(), 64);
    for (const card of await page.locator('.achievement-frame').all()) {
      const art=await card.locator('.achievement-frame__art').boundingBox(),copy=await card.locator('.achievement-frame__copy').boundingBox();
      assert.ok(copy.y>=art.y+art.height-1,'Text does not overlap the frame');
    }
    await page.screenshot({ path:path.join(output,'achievements-gold.png') });
    await page.setViewportSize({width:390,height:844});
    const overflow=await page.locator('#achievementsScreen').evaluate(root=>({width:root.clientWidth,scroll:root.scrollWidth,items:[...root.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth||r.left<0}).map(e=>({class:e.className,width:e.getBoundingClientRect().width,x:e.getBoundingClientRect().x})).slice(0,8)}));
    assert.ok(overflow.scroll<=overflow.width+1,JSON.stringify(overflow));
    await page.setViewportSize({width:844,height:390});
    await page.screenshot({ path:path.join(output,'achievements-mobile.png') });
    await page.setViewportSize({width:1440,height:900});
    await page.locator('#achievementsBackButton').click();
    await page.keyboard.down('d');await page.waitForTimeout(2200);await page.keyboard.up('d');
    await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');
    await page.keyboard.press('e');
    await page.locator('#multiScreen.screen--active').waitFor();
    assert.equal(await page.locator('#multiTrainButton').isDisabled(),true);
    await page.locator('#multiAddBot').click();await page.locator('#multiAddBot').click();
    await page.locator('[data-support-class="green"]').click();
    await page.locator('#multiReadyButton').click();
    await page.screenshot({path:path.join(output,'party-desktop.png')});
    const profile=await page.evaluate(()=>localStorage.getItem('domi2pancho.accounts.v1'));
    await page.locator('#multiTrainButton').click();
    await page.locator('#multiArenaScreen.screen--active').waitFor();
    await page.keyboard.press('q');await page.waitForTimeout(700);
    assert.equal(await page.locator('#multiSkillButton').isDisabled(),true);
    const colors=await page.locator('#multiArenaCanvas').evaluate(canvas=>{
      const data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,colors=new Set();
      for(let i=0;i<data.length;i+=32)colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
      return colors.size;
    });
    assert.ok(colors>30,'Arena is not blank');
    await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');
    await page.screenshot({path:path.join(output,'training-desktop.png')});
    await page.locator('#multiPauseButton').click();
    const time=await page.locator('#multiArenaTime').textContent();await page.waitForTimeout(1100);
    assert.equal(await page.locator('#multiArenaTime').textContent(),time);
    await page.locator('#multiPauseButton').click();
    await page.setViewportSize({width:844,height:390});
    assert.ok(await page.locator('#multiArenaScreen').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
    assert.ok(await page.locator('#multiSkillButton').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'Support button stays on-screen');
    await page.screenshot({path:path.join(output,'training-mobile.png')});
    await page.locator('#multiArenaBack').click();
    await page.locator('[data-multi-mode="versus"]').click();
    await page.locator('[data-support-class="blue"]').click();await page.locator('#multiReadyButton').click();
    await page.locator('#multiTrainButton').click();await page.keyboard.press('q');await page.waitForTimeout(400);
    assert.match(await page.locator('#multiArenaScore').textContent(),/A \d+ : \d+ B/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('domi2pancho.accounts.v1')),profile,'Training cannot change account progress');
    await page.locator('#multiArenaBack').click();await page.locator('#multiBackButton').click();
    assert.equal(await page.locator('#app').getAttribute('data-screen'),'lobbyScreen');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,canvasColors:colors,screenshots:output}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
