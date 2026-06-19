var fe=Object.defineProperty;var ue=(e,t,s)=>t in e?fe(e,t,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[t]=s;var d=(e,t,s)=>ue(e,typeof t!="symbol"?t+"":t,s);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))l(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&l(i)}).observe(document,{childList:!0,subtree:!0});function s(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function l(r){if(r.ep)return;r.ep=!0;const n=s(r);fetch(r.href,n)}})();const q="0.1.0",k=20,ye=180*k,O=1e4,m=800,J=300,X=600,Z=2,ge=5,me=300,u={soldier:{name:"士兵",hp:70,damage:8,attackInterval:20,range:150,speed:20,targetsUnits:!0,bonusVs:"cavalry",bonusMultiplier:2},archer:{name:"弓手",hp:35,damage:10,attackInterval:24,range:600,speed:18,targetsUnits:!0},cavalry:{name:"骑兵",hp:110,damage:18,attackInterval:20,range:150,speed:32,targetsUnits:!0,targetTypes:["archer","siege"],bonusVs:"archer",bonusMultiplier:2},siege:{name:"攻城车",hp:320,damage:50,attackInterval:40,range:150,speed:12,targetsUnits:!1}},y={barracks:{name:"兵营",cost:500,spawnInterval:120,unit:"soldier"},range:{name:"靶场",cost:700,spawnInterval:160,unit:"archer"},stable:{name:"马厩",cost:1e3,spawnInterval:240,unit:"cavalry"},workshop:{name:"工坊",cost:1200,spawnInterval:300,unit:"siege"}};function E(){return{soldier:0,archer:0,cavalry:0,siege:0}}function ee(){return{damageToUnits:E(),damageToCastle:E(),losses:E(),spawned:E()}}function be(){return{tick:0,gold:{player:X,enemy:X},castleHp:{player:m,enemy:m},buildings:[],units:[],nextId:1,staging:{player:[],enemy:[]},result:"ongoing",events:[],stats:{player:ee(),enemy:ee()},hpHistory:[{player:m,enemy:m}]}}function ke(e){return e==="player"?"enemy":"player"}function we(e,t){const s=y[t.building];if(e.buildings.reduce((r,n)=>r+(n.side===t.side?1:0),0)>=ge){e.events.push({tick:e.tick,kind:"buildFailed",side:t.side,building:t.building,reason:"slots"});return}if(e.gold[t.side]<s.cost){e.events.push({tick:e.tick,kind:"buildFailed",side:t.side,building:t.building,reason:"gold"});return}e.gold[t.side]-=s.cost,e.buildings.push({id:e.nextId++,side:t.side,type:t.building,builtAt:e.tick}),e.events.push({tick:e.tick,kind:"build",side:t.side,building:t.building})}function $e(e,t,s){const l=u[s];e.units.push({id:e.nextId++,side:t,type:s,pos:t==="player"?J:O-J,hp:l.hp,maxHp:l.hp,cooldown:0}),e.stats[t].spawned[s]++}function ve(e,t){const s=u[t.type],l=ke(t.side);if(s.targetsUnits){let n=null,i=1/0;for(const a of e.units){if(a.side!==l||s.targetTypes&&!s.targetTypes.includes(a.type))continue;const o=Math.abs(a.pos-t.pos);o<=s.range&&o<i&&(n=a,i=o)}if(n)return{attacker:t,targetUnit:n}}const r=t.side==="player"?O:0;return Math.abs(r-t.pos)<=s.range?{attacker:t,targetCastle:l}:null}function te(e){e.events.push({tick:e.tick,kind:"end",result:e.result}),e.hpHistory.push({player:e.castleHp.player,enemy:e.castleHp.enemy})}function xe(e,t){if(e.result!=="ongoing")return;e.gold.player+=Z,e.gold.enemy+=Z;for(const i of t)we(e,i);for(const i of e.buildings){const a=e.tick-i.builtAt;a>0&&a%y[i.type].spawnInterval===0&&e.staging[i.side].push(y[i.type].unit)}if(e.tick>0&&e.tick%me===0)for(const i of["player","enemy"]){for(const a of e.staging[i])$e(e,i,a);e.staging[i]=[]}const s=[];for(const i of e.units){const a=u[i.type];i.cooldown>0&&i.cooldown--;const o=ve(e,i);if(o)i.cooldown===0&&(s.push(o),i.cooldown=a.attackInterval);else{const c=i.side==="player"?1:-1;i.pos=Math.max(0,Math.min(O,i.pos+c*a.speed))}}for(const i of s){const a=u[i.attacker.type];let o=a.damage;if(i.targetUnit&&a.bonusVs===i.targetUnit.type&&(o*=a.bonusMultiplier??1),i.targetUnit){const c=Math.min(o,Math.max(i.targetUnit.hp,0));i.targetUnit.hp-=o,e.stats[i.attacker.side].damageToUnits[i.attacker.type]+=c}else if(i.targetCastle){const c=Math.min(o,e.castleHp[i.targetCastle]);e.castleHp[i.targetCastle]-=c,e.stats[i.attacker.side].damageToCastle[i.attacker.type]+=c}}const l=[];for(const i of e.units)i.hp>0?l.push(i):(e.events.push({tick:e.tick,kind:"death",side:i.side,unit:i.type}),e.stats[i.side].losses[i.type]++);e.units=l;const r=e.castleHp.player<=0,n=e.castleHp.enemy<=0;if(r||n){e.result=r&&n?"draw":r?"enemyWin":"playerWin",te(e);return}e.tick++,e.tick%k===0&&e.hpHistory.push({player:e.castleHp.player,enemy:e.castleHp.enemy}),e.tick>=ye&&(e.result=e.castleHp.player>e.castleHp.enemy?"playerWin":e.castleHp.enemy>e.castleHp.player?"enemyWin":"draw",te(e))}function Te(e){return e.enemyBuildOrder.map(t=>({atTick:t.atTick,side:"enemy",building:t.building}))}function Se(e){const t=[...e].sort((l,r)=>l.atTick-r.atTick||(l.side===r.side?0:l.side==="enemy"?-1:1)),s=new Map;for(const l of t){const r=s.get(l.atTick);r?r.push(l):s.set(l.atTick,[l])}return s}const I={player:{main:"#4da3ff",dark:"#2b6cb0",light:"#cfe7ff"},enemy:{main:"#ff6b57",dark:"#b03a2b",light:"#ffd2c8"}},B="#f0c79b",$="#d3dbe6",D="#8b97a8",f="#9c6b35",h="#5f3e18",R="#c9cedb",g="#8b91a6",F={soldier:e=>`
    <ellipse cx="32" cy="40" rx="9" ry="13" fill="${e.dark}"/>
    <rect x="24" y="30" width="16" height="18" rx="7" fill="${e.main}"/>
    <circle cx="32" cy="24" r="8" fill="${B}"/>
    <path d="M22 24a10 10 0 0120 0z" fill="${$}" stroke="${D}" stroke-width="1.5"/>
    <rect x="30" y="10" width="4" height="9" rx="2" fill="${e.light}"/>
    <rect x="13" y="26" width="11" height="18" rx="4" fill="${e.light}" stroke="${e.dark}" stroke-width="2"/>
    <circle cx="18.5" cy="35" r="2.5" fill="${e.dark}"/>
    <rect x="44" y="14" width="4" height="30" rx="2" fill="${$}" stroke="${D}" stroke-width="1"/>
    <rect x="41" y="40" width="10" height="4" rx="2" fill="${f}"/>`,archer:e=>`
    <ellipse cx="32" cy="40" rx="8" ry="13" fill="${e.dark}"/>
    <path d="M24 48l8-20 8 20z" fill="${e.main}"/>
    <circle cx="32" cy="22" r="7.5" fill="${B}"/>
    <path d="M25 20q-4 -9 4 -14" fill="none" stroke="${e.light}" stroke-width="3" stroke-linecap="round"/>
    <path d="M46 8 Q56 30 46 52" fill="none" stroke="${f}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="46" y1="8" x2="46" y2="52" stroke="#e8e2d0" stroke-width="1.5"/>
    <line x1="20" y1="30" x2="50" y2="30" stroke="${h}" stroke-width="2"/>
    <path d="M16 30l5-3v6z" fill="${$}"/>`,cavalry:e=>`
    <ellipse cx="32" cy="46" rx="18" ry="8" fill="${e.dark}"/>
    <path d="M14 44q-2 -14 12 -16l16 0q12 2 10 16z" fill="#6b5640"/>
    <rect x="16" y="40" width="4" height="12" fill="#4a3a28"/>
    <rect x="44" y="40" width="4" height="12" fill="#4a3a28"/>
    <path d="M44 30q10 -4 12 -12q-6 2 -10 6z" fill="#6b5640"/>
    <circle cx="50" cy="20" r="3" fill="#4a3a28"/>
    <rect x="26" y="14" width="13" height="18" rx="6" fill="${e.main}"/>
    <circle cx="32" cy="12" r="6" fill="${B}"/>
    <path d="M25 12a7 7 0 0114 0z" fill="${$}"/>
    <line x1="22" y1="6" x2="40" y2="34" stroke="${D}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 6l-4 1 3 3z" fill="${$}"/>`,siege:e=>`
    <ellipse cx="32" cy="50" rx="20" ry="6" fill="rgba(0,0,0,0.18)"/>
    <rect x="12" y="30" width="40" height="16" rx="3" fill="${f}" stroke="${h}" stroke-width="2"/>
    <line x1="12" y1="38" x2="52" y2="38" stroke="${h}" stroke-width="2"/>
    <circle cx="20" cy="48" r="7" fill="${h}"/>
    <circle cx="20" cy="48" r="2.5" fill="${f}"/>
    <circle cx="44" cy="48" r="7" fill="${h}"/>
    <circle cx="44" cy="48" r="2.5" fill="${f}"/>
    <line x1="44" y1="34" x2="22" y2="8" stroke="${h}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="22" cy="9" r="7" fill="${g}"/>
    <rect x="46" y="20" width="3" height="14" fill="${e.dark}"/>
    <path d="M49 20h11l-4 4 4 4H49z" fill="${e.main}"/>`},C={barracks:e=>`
    <rect x="10" y="28" width="44" height="28" rx="2" fill="${f}" stroke="${h}" stroke-width="2"/>
    <path d="M6 30L32 12l26 18z" fill="${e.main}" stroke="${e.dark}" stroke-width="2"/>
    <rect x="26" y="40" width="12" height="16" rx="1" fill="${h}"/>
    <rect x="34" y="6" width="2" height="10" fill="${h}"/>
    <path d="M36 6h10l-3 3 3 3H36z" fill="${e.light}"/>`,range:e=>`
    <rect x="10" y="30" width="44" height="26" rx="2" fill="#7d8a5c" stroke="#566042" stroke-width="2"/>
    <path d="M8 32L32 16l24 16z" fill="${e.dark}"/>
    <circle cx="32" cy="42" r="11" fill="#f3efe2"/>
    <circle cx="32" cy="42" r="7.5" fill="${e.light}"/>
    <circle cx="32" cy="42" r="4" fill="#f3efe2"/>
    <circle cx="32" cy="42" r="1.6" fill="${e.main}"/>`,stable:e=>`
    <rect x="9" y="30" width="46" height="26" rx="2" fill="${f}" stroke="${h}" stroke-width="2"/>
    <path d="M6 32L32 14l26 18z" fill="${e.main}" stroke="${e.dark}" stroke-width="2"/>
    <path d="M20 56V40q0-8 12-8t12 8v16h-7V42q0-5-5-5t-5 5v14z" fill="${h}"/>
    <circle cx="44" cy="24" r="2" fill="${e.light}"/>`,workshop:e=>`
    <rect x="9" y="30" width="46" height="26" rx="2" fill="#6c7480" stroke="#474d57" stroke-width="2"/>
    <path d="M6 32L32 16l26 16z" fill="${e.dark}"/>
    <g fill="${e.light}">
      <circle cx="32" cy="44" r="8"/>
      <rect x="29" y="32" width="6" height="24"/>
      <rect x="20" y="41" width="24" height="6"/>
      <rect x="22" y="34" width="20" height="20" transform="rotate(45 32 44)"/>
    </g>
    <circle cx="32" cy="44" r="3" fill="#474d57"/>`},ne=e=>`
  <rect x="14" y="40" width="92" height="34" fill="${R}" stroke="${g}" stroke-width="2"/>
  <g fill="${g}">
    <rect x="14" y="32" width="12" height="10"/>
    <rect x="34" y="32" width="12" height="10"/>
    <rect x="54" y="32" width="12" height="10"/>
    <rect x="74" y="32" width="12" height="10"/>
    <rect x="94" y="32" width="12" height="10"/>
  </g>
  <rect x="8" y="22" width="22" height="52" fill="${R}" stroke="${g}" stroke-width="2"/>
  <rect x="90" y="22" width="22" height="52" fill="${R}" stroke="${g}" stroke-width="2"/>
  <path d="M8 22l11 -12l11 12z" fill="${e.main}"/>
  <path d="M90 22l11 -12l11 12z" fill="${e.main}"/>
  <rect x="50" y="48" width="20" height="26" rx="9" fill="${e.dark}"/>
  <rect x="55" y="54" width="10" height="20" rx="5" fill="#1a2230"/>
  <rect x="59" y="6" width="2" height="8" fill="${g}"/>
  <path d="M61 6h12l-4 4 4 4H61z" fill="${e.light}"/>`;function H(e){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80">${e}</svg>`}function re(e){return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${e}</svg>`}function le(e){return`data:image/svg+xml;charset=utf-8,${encodeURIComponent(e)}`}const ae=new Map;function P(e,t,s){const l=new Image;l.src=le(s),ae.set(`${e}:${t}`,l)}for(const e of["player","enemy"]){const t=I[e];for(const s in F)P(s,e,H(F[s](t)));for(const s in C)P(s,e,H(C[s](t)));P("castle",e,re(ne(t)))}function oe(e,t){const s=ae.get(`${e}:${t}`);return s&&s.complete&&s.naturalWidth>0?s:null}function ce(e,t){const s=e==="castle"?re(ne(I[t])):e in C?H(C[e](I[t])):H(F[e](I[t]));return le(s)}const b=420,p=520,N=44,z=N,_=p-N,Me={player:"#4da3ff",enemy:"#ff6b57"},Ee={player:"#2b6cb0",enemy:"#b03a2b"},Ie={soldier:32,archer:32,cavalry:36,siege:38},Le=64/80;function V(e){return _-e/O*(_-z)}function Ce(e){return 70+e.id*53%280}function se(e,t){const r=b/2-75,n=oe("castle",t);if(n)t==="enemy"?(e.save(),e.translate(0,94),e.scale(1,-1),e.drawImage(n,r,0,150,100),e.restore()):e.drawImage(n,r,p-100+6,150,100);else{const i=t==="enemy"?6:p-N+6;e.fillStyle=Ee[t],e.fillRect(110,i,200,N-12)}e.fillStyle="rgba(255,255,255,0.9)",e.font="11px sans-serif",e.textAlign="center",e.fillText(t==="enemy"?"敌方城堡":"我方城堡",b/2,t==="enemy"?18:p-8)}function He(e,t,s){const l=u[t.type],r=Ce(t),n=V(t.pos),i=Ie[t.type],a=i*Le,o=Math.sin(s/150+t.id*1.3)*1.8,c=l.attackInterval>0?t.cooldown/l.attackInterval:0,v=c>.55?(c-.55)/.45:0,x=t.side==="player"?-1:1,w=v*5*x,U=n+o+w;e.fillStyle="rgba(0,0,0,0.22)",e.beginPath(),e.ellipse(r,n+i/2-2,a*.42,3.5,0,0,Math.PI*2),e.fill();const A=oe(t.type,t.side);if(A){const j=1+v*.12,S=a*j,M=i*j;t.side==="enemy"?(e.save(),e.translate(r,U),e.scale(1,-1),e.drawImage(A,-S/2,-M/2,S,M),e.restore()):e.drawImage(A,r-S/2,U-M/2,S,M)}else e.fillStyle=Me[t.side],e.beginPath(),e.arc(r,U,6,0,Math.PI*2),e.fill();const Q=Math.max(0,t.hp/t.maxHp),T=Math.max(18,a),Y=n-i/2-6;e.fillStyle="#222a36",e.fillRect(r-T/2,Y,T,3),e.fillStyle=Q>.4?"#5ad17a":"#e8c14a",e.fillRect(r-T/2,Y,T*Q,3)}function Ne(e,t){const s=performance.now();e.clearRect(0,0,b,p);const l=e.createLinearGradient(0,0,0,p);l.addColorStop(0,"#2a1d22"),l.addColorStop(.5,"#1d2330"),l.addColorStop(1,"#1b2538"),e.fillStyle=l,e.fillRect(0,0,b,p),e.strokeStyle="rgba(255,255,255,0.12)",e.lineWidth=1,e.beginPath(),e.moveTo(20,(z+_)/2),e.lineTo(b-20,(z+_)/2),e.stroke(),se(e,"enemy"),se(e,"player");const r=[...t.units].sort((n,i)=>V(i.pos)-V(n.pos));for(const n of r)He(e,n,s)}const _e={barracks:"近战前排",range:"远程输出",stable:"快·克远程",workshop:"只拆城堡"};function Oe(e){const t=document.createElement("div");t.className="battle",t.innerHTML=`
    <div class="battle-top">
      <button class="exit-btn" title="退出战斗">✕</button>
      <div class="level-name">${e.name}</div>
      <button class="speed-btn">1x</button>
    </div>
    <div class="castle-row enemy">
      <div class="hp-bar"><div class="hp-fill enemy-fill"></div></div>
      <span class="hp-num enemy-num"></span>
    </div>
    <div class="slots enemy-slots"></div>
    <canvas width="${b}" height="${p}"></canvas>
    <div class="slots player-slots"></div>
    <div class="castle-row player">
      <div class="hp-bar"><div class="hp-fill player-fill"></div></div>
      <span class="hp-num player-num"></span>
    </div>
    <div class="status-row">
      <span class="gold"></span>
      <span class="timer"></span>
    </div>
    <div class="build-btns"></div>
  `;const s=new Map,l=t.querySelector(".build-btns");for(const r of e.playerPool){const n=y[r],i=u[n.unit],a=document.createElement("button");a.className="build-btn",a.dataset.building=r,a.innerHTML=`
      <img class="b-icon" src="${ce(r,"player")}" alt="">
      <span class="b-name">${n.name}</span>
      <span class="b-cost">⛁ ${n.cost/10}</span>
      <span class="b-desc">${i.name}/${n.spawnInterval/k}s</span>
      <span class="b-desc">${_e[r]}</span>
    `,l.appendChild(a),s.set(r,a)}return{root:t,canvas:t.querySelector("canvas"),goldEl:t.querySelector(".gold"),timerEl:t.querySelector(".timer"),speedBtn:t.querySelector(".speed-btn"),exitBtn:t.querySelector(".exit-btn"),hpFill:{player:t.querySelector(".player-fill"),enemy:t.querySelector(".enemy-fill")},hpNum:{player:t.querySelector(".player-num"),enemy:t.querySelector(".enemy-num")},slots:{player:t.querySelector(".player-slots"),enemy:t.querySelector(".enemy-slots")},buildBtns:s}}function Ue(e,t,s){const l=t.buildings.filter(n=>n.side===s);let r="";for(let n=0;n<5;n++){const i=l[n];if(!i){r+='<span class="slot empty"></span>';continue}const a=y[i.type],o=(t.tick-i.builtAt)%a.spawnInterval/a.spawnInterval*100;r+=`<span class="slot ${s}"><i style="background-image:url('${ce(i.type,s)}')"></i><b style="width:${o}%"></b></span>`}e.innerHTML=r}function Ae(e,t){const s=Math.floor(t.gold.player/10);e.goldEl.textContent=`⛁ ${s}`;const l=Math.max(0,Math.ceil((180*k-t.tick)/k));e.timerEl.textContent=`${Math.floor(l/60)}:${String(l%60).padStart(2,"0")}`;for(const n of["player","enemy"]){const i=Math.max(0,t.castleHp[n]);e.hpFill[n].style.width=`${i/m*100}%`,e.hpNum[n].textContent=`${i}`,Ue(e.slots[n],t,n)}const r=t.buildings.reduce((n,i)=>n+(i.side==="player"?1:0),0);for(const[n,i]of e.buildBtns){const a=t.gold.player>=y[n].cost;i.disabled=!a||r>=5||t.result!=="ongoing"}}const ie=50;class qe{constructor(t,s){d(this,"speed",1);d(this,"acc",0);d(this,"last",0);d(this,"raf",0);d(this,"running",!1);this.onTick=t,this.onRender=s}start(){if(this.running)return;this.running=!0,this.last=performance.now();const t=s=>{if(this.running){for(this.acc=Math.min(this.acc+(s-this.last)*this.speed,500),this.last=s;this.acc>=ie;)this.onTick(),this.acc-=ie;this.onRender(),this.raf=requestAnimationFrame(t)}};this.raf=requestAnimationFrame(t)}stop(){this.running=!1,cancelAnimationFrame(this.raf)}}class Be{constructor(t,s,l){d(this,"state",be());d(this,"enemyByTick");d(this,"playerCommands",[]);d(this,"clickQueue",[]);d(this,"loop");d(this,"ctx");d(this,"refs");d(this,"finished",!1);this.callbacks=l,this.enemyByTick=Se(Te(t)),this.refs=Oe(t),s.replaceChildren(this.refs.root),this.ctx=this.refs.canvas.getContext("2d"),this.loop=new qe(()=>this.tick(),()=>this.renderFrame());for(const[r,n]of this.refs.buildBtns)n.addEventListener("click",()=>this.clickQueue.push(r));this.refs.speedBtn.addEventListener("click",()=>{this.loop.speed=this.loop.speed===1?2:1,this.refs.speedBtn.textContent=`${this.loop.speed}x`}),this.refs.exitBtn.addEventListener("click",()=>{this.loop.stop(),this.callbacks.onExit()})}start(){this.renderFrame(),this.loop.start()}tick(){if(this.state.result!=="ongoing")return;const t=[...this.enemyByTick.get(this.state.tick)??[]];for(;this.clickQueue.length>0;){const s={atTick:this.state.tick,side:"player",building:this.clickQueue.shift()};t.push(s),this.playerCommands.push(s)}xe(this.state,t),this.state.result!=="ongoing"&&!this.finished&&(this.finished=!0,this.loop.stop(),this.renderFrame(),setTimeout(()=>this.callbacks.onFinished(this.state,this.playerCommands),600))}renderFrame(){Ne(this.ctx,this.state),Ae(this.refs,this.state)}}const L=[{id:"lv1",name:"第一关 · 新兵营",rulesVersion:q,seed:0,playerPool:["barracks","range","stable","workshop"],enemyBuildOrder:[{atTick:0,building:"barracks"},{atTick:400,building:"barracks"}],hint:"敌人只会出士兵。多造兵营顶住兵线，攒钱上工坊，攻城车会径直去拆城堡。"},{id:"lv2",name:"第二关 · 箭雨",rulesVersion:q,seed:0,playerPool:["barracks","range","stable","workshop"],enemyBuildOrder:[{atTick:60,building:"range"},{atTick:420,building:"range"},{atTick:700,building:"barracks"},{atTick:1100,building:"range"},{atTick:1500,building:"barracks"}],hint:"敌人靠弓手海输出。骑兵速度快、对远程双倍伤害，是弓手的天敌。"},{id:"lv3",name:"第三关 · 铁壁",rulesVersion:q,seed:0,playerPool:["barracks","range","stable","workshop"],enemyBuildOrder:[{atTick:0,building:"barracks"},{atTick:360,building:"range"},{atTick:600,building:"barracks"},{atTick:1e3,building:"range"},{atTick:2400,building:"workshop"}],hint:"敌人步弓混编，120 秒还会上攻城车。先稳住战线，再找时机反推。"}];function De(e,t,s){const l=document.createElement("div");l.className="level-select",l.innerHTML=`
    <h1>Castle VS</h1>
    <p class="tagline">一张地图 · 一套策略 · 一道战术关</p>
    <div class="level-list"></div>
    <p class="footnote">规则：金币每秒 +4，击杀不给钱 · 建筑自动出兵 · 3 分钟内拆掉敌方城堡</p>
  `;const r=l.querySelector(".level-list");for(const n of e){const i=document.createElement("button");i.className="level-card";const a=t.has(n.id);i.innerHTML=`
      <span class="lv-name">${n.name} ${a?'<i class="done">✓ 已通关</i>':""}</span>
      <span class="lv-hint">${n.hint}</span>
    `,i.addEventListener("click",()=>s(n)),r.appendChild(i)}return l}const Re=["soldier","archer","cavalry","siege"],Pe={player:"我方",enemy:"敌方"};function de(e){const t=Math.floor(e/k);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function Fe(e,t){const s=e.getContext("2d"),l=e.width,r=e.height,n=6;s.fillStyle="#141a24",s.fillRect(0,0,l,r);const i=t.hpHistory.length;if(i<2)return;const a=c=>n+c/(i-1)*(l-n*2),o=c=>n+(1-c/m)*(r-n*2);for(const[c,v]of[["player","#4da3ff"],["enemy","#ff6b57"]])s.strokeStyle=v,s.lineWidth=2,s.beginPath(),t.hpHistory.forEach((x,w)=>{w===0?s.moveTo(a(w),o(x[c])):s.lineTo(a(w),o(x[c]))}),s.stroke()}function ze(e){return`<table class="stats-table">
    <thead><tr><th>单位</th><th>我方 出场/阵亡/伤害</th><th>敌方 出场/阵亡/伤害</th></tr></thead>
    <tbody>${Re.map(s=>{const l=e.stats.player,r=e.stats.enemy,n=l.damageToUnits[s]+l.damageToCastle[s],i=r.damageToUnits[s]+r.damageToCastle[s];return l.spawned[s]+r.spawned[s]===0?"":`<tr>
      <td>${u[s].name}</td>
      <td>${l.spawned[s]} / ${l.losses[s]} / ${n}</td>
      <td>${r.spawned[s]} / ${r.losses[s]} / ${i}</td>
    </tr>`}).join("")}</tbody>
  </table>`}function Ve(e){return`<ul class="timeline">${e.events.filter(s=>s.kind==="build").map(s=>`<li class="${s.side}"><span class="t">${de(s.tick)}</span> ${Pe[s.side]}建造 ${y[s.building].name}</li>`).join("")}</ul>`}function We(e,t){const s=e.result==="playerWin",l=s?"🏆 胜利！":e.result==="draw"?"平局 · 惜败":"💥 失败",r=e.castleHp.enemy<=0||e.castleHp.player<=0?`${de(e.tick)} 摧毁城堡`:`时间到 · 我方城堡 ${Math.max(0,e.castleHp.player)} vs 敌方 ${Math.max(0,e.castleHp.enemy)}`,n=document.createElement("div");return n.className="overlay",n.innerHTML=`
    <div class="panel ${s?"win":"lose"}">
      <h2>${l}</h2>
      <p class="subtitle">${r}</p>
      <h3>城堡血量曲线</h3>
      <canvas class="hp-chart" width="380" height="110"></canvas>
      <h3>战斗统计</h3>
      ${ze(e)}
      <h3>建造时间线</h3>
      ${Ve(e)}
      <div class="result-btns">
        <button class="retry">再试一次</button>
        ${t.onNext?'<button class="next">下一关 ›</button>':""}
        <button class="levels">关卡列表</button>
      </div>
    </div>
  `,Fe(n.querySelector(".hp-chart"),e),n.querySelector(".retry").addEventListener("click",t.onRetry),n.querySelector(".levels").addEventListener("click",t.onLevels),t.onNext&&n.querySelector(".next").addEventListener("click",t.onNext),n}const he="castle-vs-progress",W=document.getElementById("app");function pe(){try{return new Set(JSON.parse(localStorage.getItem(he)??"[]"))}catch{return new Set}}function Ge(e){localStorage.setItem(he,JSON.stringify([...e]))}function G(){W.replaceChildren(De(L,pe(),K))}function K(e){new Be(e,W,{onExit:G,onFinished:s=>{const l=s.result==="playerWin";if(l){const a=pe();a.add(e.id),Ge(a)}const r=L.indexOf(e),n=l&&r>=0&&r+1<L.length?L[r+1]:void 0,i=We(s,{onRetry:()=>K(e),onNext:n?()=>K(n):void 0,onLevels:G});W.appendChild(i)}}).start()}G();
