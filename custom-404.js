/* CloudScale Crash Recovery — 404 Olympics v2 */
(function(){
'use strict';
var c=document.getElementById('cs404-game');
if(!c||!c.getContext)return;
if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
        r=Math.min(r,w/2,h/2);
        this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.arcTo(x+w,y,x+w,y+r,r);
        this.lineTo(x+w,y+h-r);this.arcTo(x+w,y+h,x+w-r,y+h,r);
        this.lineTo(x+r,y+h);this.arcTo(x,y+h,x,y+h-r,r);
        this.lineTo(x,y+r);this.arcTo(x,y,x+r,y,r);this.closePath();
    };
}
var ctx=c.getContext('2d'),W=c.width,H=c.height;

/* ── Per-game leaderboards (top 10) ─────────────── */
var GNAMES=['runner','jetpack','racer','miner','asteroids'];
var lbData={};
GNAMES.forEach(function(g){
    var raw=localStorage.getItem('cs404_lb_'+g);
    lbData[g]=raw?JSON.parse(raw):[];
});
function lbInsert(game,score,name){
    if(!score||score<=0)return false;
    var lb=lbData[game];
    if(lb.length>=10&&score<=lb[9].s)return false;
    lb.push({s:score,n:name||''});
    lb.sort(function(a,b){return b.s-a.s;});
    if(lb.length>10)lb.length=10;
    localStorage.setItem('cs404_lb_'+game,JSON.stringify(lb));
    return true;
}
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function renderLeaderboard(game){
    var panel=document.getElementById('cs404-lb-body');
    var title=document.getElementById('cs404-lb-title');
    if(!panel)return;
    var gname={runner:'Runner',jetpack:'Jetpack',racer:'Racer',miner:'Miner',asteroids:'Asteroids'};
    if(title)title.textContent='\uD83C\uDFC6 '+(gname[game]||game)+' \u2014 Top 10';
    var lb=lbData[game];
    if(!lb||lb.length===0){panel.innerHTML='<p class="cs404-lb-empty">No scores yet \u2014 be the first!</p>';return;}
    var html='',medals=['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49'];
    for(var i=0;i<lb.length;i++){
        var medal=i<3?medals[i]:(i+1)+'.';
        html+='<div class="cs404-lb-row'+(i===0?' cs404-lb-row-gold':'')+'">'+
            '<span class="cs404-lb-rank">'+medal+'</span>'+
            '<span class="cs404-lb-name">'+escHtml(lb[i].n||'Anonymous')+'</span>'+
            '<span class="cs404-lb-score">'+String(lb[i].s).padStart(5,'0')+'</span>'+
            '</div>';
    }
    panel.innerHTML=html;
}
if(typeof CS_PCR_API!=='undefined'){
    GNAMES.forEach(function(g){
        fetch(CS_PCR_API+'/hiscore/'+g)
            .then(function(r){return r.json();})
            .then(function(d){
                if(d.leaderboard&&Array.isArray(d.leaderboard)){
                    d.leaderboard.forEach(function(e){lbInsert(g,e.score,e.name);});
                    renderLeaderboard(currentGame);
                }
            })
            .catch(function(){});
    });
}

/* ── Name overlay ───────────────────────────────── */
var namePending=false,pendingGame='runner',pendingScore=0;
var saveBtn=document.getElementById('cs404-name-save');
var nameInput=document.getElementById('cs404-name-input');
var nameOverlay=document.getElementById('cs404-name-overlay');
function saveName(){
    var n=(nameInput?nameInput.value.trim():'')||'Anonymous';
    var g=pendingGame,s=pendingScore;
    lbInsert(g,s,n);
    renderLeaderboard(g);
    if(typeof CS_PCR_API!=='undefined'){
        fetch(CS_PCR_API+'/hiscore/'+g,{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({game:g,score:s,name:n})})
            .then(function(r){return r.json();})
            .then(function(d){
                if(d.leaderboard&&Array.isArray(d.leaderboard)){
                    lbData[g]=d.leaderboard.map(function(e){return{s:e.score,n:e.name};});
                    localStorage.setItem('cs404_lb_'+g,JSON.stringify(lbData[g]));
                    renderLeaderboard(g);
                }
            })
            .catch(function(){});
    }
    if(nameOverlay)nameOverlay.style.display='none';
    if(nameInput)nameInput.value='';
    namePending=false;
}
if(saveBtn)saveBtn.addEventListener('click',saveName);
if(nameInput)nameInput.addEventListener('keydown',function(e){if(e.key==='Enter')saveName();});

function checkNewHi(game,score){
    if(score<=0)return 0;
    var lb=lbData[game];
    var qualifies=lb.length<10||score>lb[lb.length-1].s;
    if(!qualifies)return 0;
    var rank=lb.length+1;
    for(var i=0;i<lb.length;i++){if(score>lb[i].s){rank=i+1;break;}}
    pendingScore=score;pendingGame=game;namePending=true;
    var hd=document.querySelector('#cs404-name-overlay p:first-child');
    if(hd)hd.textContent=rank===1?'\uD83C\uDFC6 New Record!':'\uD83C\uDFC6 Top 10 Entry!';
    burstFireworks();
    setTimeout(function(){if(nameOverlay)nameOverlay.style.display='flex';if(nameInput)nameInput.focus();},700);
    return rank;
}

/* ── Particles ──────────────────────────────────── */
var particles=[];
var FW=['#f57c00','#ffa726','#ff9800','#ffcc02','#ff6b6b','#a78bfa','#34d399','#60a5fa'];
function burstFireworks(){
    for(var b=0;b<6;b++){
        var bx=W*0.2+Math.random()*W*0.6,by=H*0.15+Math.random()*H*0.5;
        for(var p=0;p<22;p++){
            var a=Math.random()*Math.PI*2,sp=2+Math.random()*4;
            particles.push({x:bx,y:by,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,dec:0.018+Math.random()*0.012,r:3+Math.random()*3,col:FW[Math.floor(Math.random()*FW.length)]});
        }
    }
}
function updateParticles(){
    for(var i=particles.length-1;i>=0;i--){
        var p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life-=p.dec;
        if(p.life<=0)particles.splice(i,1);
    }
}
function drawParticles(){
    for(var i=0;i<particles.length;i++){
        var p=particles[i];ctx.globalAlpha=p.life;ctx.fillStyle=p.col;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
}

/* ── Shared overlays ────────────────────────────── */
function drawHiPanel(game){
    var lb=lbData[game];
    ctx.save();ctx.font='bold 12px monospace';
    if(lb.length>0&&lb[0].s>0){
        ctx.fillStyle='#f57c00';ctx.textAlign='left';
        ctx.fillText('\uD83C\uDFC6 '+(lb[0].n||'Anonymous')+' \u2014 '+lb[0].s,10,18);
    }
    ctx.restore();
}
function drawScore(score){
    ctx.save();ctx.font='bold 12px monospace';ctx.fillStyle='#0d2a4a';ctx.textAlign='right';
    ctx.fillText(String(score).padStart(5,'0'),W-10,18);ctx.restore();
}
function drawGameOver(score,rank){
    var isNew=rank>0;
    var bh=isNew?86:62;
    ctx.fillStyle='rgba(204,233,251,0.92)';
    ctx.beginPath();ctx.roundRect(W/2-125,H/2-34,250,bh,8);ctx.fill();
    ctx.strokeStyle=isNew?'rgba(245,124,0,0.5)':'rgba(42,96,144,0.3)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(W/2-125,H/2-34,250,bh,8);ctx.stroke();
    ctx.textAlign='center';
    ctx.fillStyle='#0d2a4a';ctx.font='bold 15px monospace';ctx.fillText('GAME OVER',W/2,H/2-14);
    ctx.font='12px monospace';ctx.fillStyle='#6b7280';ctx.fillText('Score: '+score,W/2,H/2+6);
    if(isNew){
        var msg=rank===1?'\uD83C\uDFC6 NEW RECORD!':'\uD83C\uDFC6 TOP 10 (#'+rank+')!';
        ctx.fillStyle='#f57c00';ctx.font='bold 13px monospace';ctx.fillText(msg,W/2,H/2+26);
        ctx.font='10px monospace';ctx.fillStyle='#3a6080';ctx.fillText('SPACE or TAP to retry',W/2,H/2+46);
    } else {
        ctx.font='10px monospace';ctx.fillStyle='#3a6080';ctx.fillText('SPACE or TAP to retry',W/2,H/2+26);
    }
}
function drawWelcome(title,sub){
    ctx.save();ctx.textAlign='center';
    var lb=lbData[currentGame];
    var rows=Math.min(lb.length,10);
    if(rows>0){
        var bh=48+rows*15+24;
        var by=Math.max(22,H/2-bh/2);
        ctx.fillStyle='rgba(13,42,74,0.84)';
        ctx.beginPath();ctx.roundRect(W/2-195,by,390,bh,8);ctx.fill();
        ctx.strokeStyle='rgba(245,124,0,0.25)';ctx.lineWidth=1;
        ctx.beginPath();ctx.roundRect(W/2-195,by,390,bh,8);ctx.stroke();
        // header
        ctx.fillStyle='#f59e0b';ctx.font='bold 12px monospace';
        ctx.fillText('\uD83C\uDFC6 '+title+' \u2014 Leaderboard',W/2,by+15);
        ctx.fillStyle='rgba(204,233,251,0.6)';ctx.font='9px monospace';
        ctx.fillText(sub,W/2,by+28);
        // divider
        ctx.strokeStyle='rgba(245,124,0,0.2)';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(W/2-175,by+35);ctx.lineTo(W/2+175,by+35);ctx.stroke();
        // entries
        var medals=['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49'];
        for(var i=0;i<rows;i++){
            var ey=by+48+i*15;
            var medal=i<3?medals[i]:(i+1)+'.';
            ctx.font=(i===0?'bold ':'')+'10px monospace';
            ctx.fillStyle=i===0?'#fbbf24':i<3?'#e2e8f0':'#94a3b8';
            ctx.textAlign='left';
            ctx.fillText(medal+' '+(lb[i].n||'Anonymous').substring(0,18),W/2-180,ey);
            ctx.textAlign='right';
            ctx.fillText(String(lb[i].s).padStart(5,'0'),W/2+180,ey);
        }
        // play prompt
        ctx.textAlign='center';
        ctx.fillStyle='#f57c00';ctx.font='bold 12px monospace';
        ctx.fillText('SPACE or TAP to play',W/2,by+bh-8);
    } else {
        ctx.fillStyle='rgba(13,42,74,0.72)';ctx.beginPath();ctx.roundRect(W/2-150,H/2-44,300,88,8);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='bold 16px monospace';ctx.fillText(title,W/2,H/2-16);
        ctx.fillStyle='#cce9fb';ctx.font='11px monospace';ctx.fillText(sub,W/2,H/2+6);
        ctx.fillStyle='#f57c00';ctx.font='bold 13px monospace';ctx.fillText('SPACE or TAP to play',W/2,H/2+28);
    }
    ctx.restore();
}

/* ── Current game ───────────────────────────────── */
var currentGame='runner';

/* ═══════════════════════════════════════════════
   GAME 1 — RUNNER
   ═══════════════════════════════════════════════ */
var GY=H-28;
var RN={run:false,over:false,score:0,fr:0,spd:4,
    px:80,py:0,pw:26,ph:30,vy:0,grnd:true,jmps:0,
    obs:[],holes:[],rockets:[],shooters:[],nObs:20,nShoot:160,
    clouds:[{x:120,y:30,w:70},{x:320,y:26,w:55},{x:500,y:34,w:65}],newHi:false};
RN.py=GY-RN.ph;
function rnReset(){
    RN.py=GY-RN.ph;RN.vy=0;RN.grnd=true;RN.jmps=0;
    RN.obs=[];RN.holes=[];RN.rockets=[];RN.shooters=[];particles=[];
    RN.score=0;RN.fr=0;RN.spd=4;RN.nObs=20;RN.nShoot=160;
    RN.newHi=false;namePending=false;
    if(nameOverlay)nameOverlay.style.display='none';
    RN.run=true;RN.over=false;
}
function rnJump(){
    if(namePending)return;
    if(!RN.run&&!RN.over){rnReset();return;}
    if(RN.over){rnReset();return;}
    if(RN.jmps<2){RN.vy=-9;RN.grnd=false;RN.jmps++;}
}
function rnOverHole(){
    for(var i=0;i<RN.holes.length;i++){
        if(RN.px+RN.pw-6>RN.holes[i].x+2&&RN.px+6<RN.holes[i].x+RN.holes[i].w-2)return true;
    }
    return false;
}
function rnDie(){
    if(RN.over)return;RN.over=true;RN.run=false;RN.newHi=checkNewHi('runner',RN.score);
}
function rnUpdate(){
    if(!RN.run||RN.over)return;
    RN.fr++;RN.score++;RN.spd=4+Math.floor(RN.score/300)*0.4;
    RN.vy+=0.55;RN.py+=RN.vy;
    if(RN.py>=GY-RN.ph){if(!rnOverHole()){RN.py=GY-RN.ph;RN.vy=0;RN.grnd=true;RN.jmps=0;}else RN.grnd=false;}
    if(RN.py>H+20){rnDie();return;}
    for(var i=0;i<RN.clouds.length;i++){
        RN.clouds[i].x-=RN.spd*0.3;
        if(RN.clouds[i].x+RN.clouds[i].w<0)RN.clouds[i].x=W+RN.clouds[i].w;
    }
    RN.nShoot--;
    if(RN.nShoot<=0&&RN.shooters.length===0){
        RN.shooters.push({x:W-60,y:GY-44,w:24,h:44,rt:55,ri:90,fl:0,life:320+Math.floor(Math.random()*120)});
        RN.nShoot=180+Math.floor(Math.random()*120);
    }
    for(var i=RN.shooters.length-1;i>=0;i--){
        var s=RN.shooters[i];if(s.fl>0)s.fl--;s.rt--;
        if(s.rt<=0){RN.rockets.push({x:s.x-28,y:GY-20,w:28,h:12,spd:RN.spd+3});s.fl=12;s.rt=s.ri+Math.floor(Math.random()*40);}
        s.life--;
        if(s.life<=0){RN.shooters.splice(i,1);RN.nShoot=180+Math.floor(Math.random()*120);continue;}
        if(RN.px+RN.pw-4>s.x+3&&RN.px+4<s.x+s.w-3&&RN.py+RN.ph>s.y+3&&RN.py<s.y+s.h){rnDie();return;}
    }
    for(var i=RN.rockets.length-1;i>=0;i--){
        RN.rockets[i].x-=RN.rockets[i].spd;
        if(RN.rockets[i].x+RN.rockets[i].w<0){RN.rockets.splice(i,1);continue;}
        if(RN.px+RN.pw-4>RN.rockets[i].x+4&&RN.px+4<RN.rockets[i].x+RN.rockets[i].w-4&&RN.py+RN.ph>RN.rockets[i].y+2&&RN.py<RN.rockets[i].y+RN.rockets[i].h){rnDie();return;}
    }
    RN.nObs--;
    if(RN.nObs<=0){
        var r=Math.random();
        if(r<0.22){RN.holes.push({x:W,w:32+Math.floor(Math.random()*22)});RN.nObs=50+Math.floor(Math.random()*40);}
        else if(r<0.42){RN.obs.push({type:'water',x:W,y:GY-12,w:38+Math.floor(Math.random()*26),h:12});RN.nObs=40+Math.floor(Math.random()*35);}
        else if(r<0.60){RN.obs.push({type:'block',x:W,y:GY-58,w:28,h:58});RN.nObs=50+Math.floor(Math.random()*40);}
        else{var h=24+Math.floor(Math.random()*24);RN.obs.push({type:'block',x:W,y:GY-h,w:30,h:h});RN.nObs=40+Math.floor(Math.random()*45);}
    }
    for(var j=RN.holes.length-1;j>=0;j--){RN.holes[j].x-=RN.spd;if(RN.holes[j].x+RN.holes[j].w<0)RN.holes.splice(j,1);}
    for(var j=RN.obs.length-1;j>=0;j--){
        RN.obs[j].x-=RN.spd;
        if(RN.obs[j].x+RN.obs[j].w<0){RN.obs.splice(j,1);continue;}
        if(RN.px+RN.pw-5>RN.obs[j].x+4&&RN.px+5<RN.obs[j].x+RN.obs[j].w-4&&RN.py+RN.ph>RN.obs[j].y+3&&RN.py<RN.obs[j].y+RN.obs[j].h){rnDie();return;}
    }
}
function rnDraw(){
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<RN.clouds.length;i++){
        var cl=RN.clouds[i];ctx.fillStyle='rgba(255,255,255,0.55)';ctx.beginPath();
        ctx.ellipse(cl.x,cl.y,cl.w/2,12,0,0,Math.PI*2);ctx.ellipse(cl.x-cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);ctx.ellipse(cl.x+cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);ctx.fill();
    }
    var segs=RN.holes.slice().sort(function(a,b){return a.x-b.x;});
    var sx=0;ctx.fillStyle='rgba(42,96,144,0.35)';
    for(var i=0;i<segs.length;i++){if(segs[i].x>sx)ctx.fillRect(sx,GY,segs[i].x-sx,H-GY);sx=segs[i].x+segs[i].w;}
    if(sx<W)ctx.fillRect(sx,GY,W-sx,H-GY);
    sx=0;ctx.fillStyle='#2a6090';
    for(var i=0;i<segs.length;i++){if(segs[i].x>sx)ctx.fillRect(sx,GY,segs[i].x-sx,3);sx=segs[i].x+segs[i].w;}
    if(sx<W)ctx.fillRect(sx,GY,W-sx,3);
    drawHiPanel('runner');drawScore(RN.score);
    if(RN.run||RN.over){
        for(var j=0;j<RN.obs.length;j++){
            var o=RN.obs[j];
            if(o.type==='water'){
                ctx.fillStyle='rgba(30,120,200,0.6)';ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
                ctx.strokeStyle='rgba(160,220,255,0.8)';ctx.lineWidth=1.5;
                for(var wx=o.x+5;wx<o.x+o.w-8;wx+=14){ctx.beginPath();ctx.moveTo(wx,o.y+4);ctx.quadraticCurveTo(wx+3.5,o.y+1,wx+7,o.y+4);ctx.quadraticCurveTo(wx+10.5,o.y+7,wx+14,o.y+4);ctx.stroke();}
            } else {
                ctx.fillStyle='#0d2a4a';ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
                ctx.fillStyle='#f57c00';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('404',o.x+o.w/2,o.y+o.h/2+4);
            }
        }
        for(var i=0;i<RN.shooters.length;i++){
            var s=RN.shooters[i];
            ctx.fillStyle='#1a3a5c';ctx.beginPath();ctx.roundRect(s.x,s.y,s.w,s.h,4);ctx.fill();
            ctx.fillStyle='rgba(220,38,38,0.9)';ctx.beginPath();ctx.roundRect(s.x+3,s.y+7,s.w-6,9,3);ctx.fill();
            ctx.fillStyle='#0d2a4a';ctx.fillRect(s.x-14,s.y+s.h-17,16,7);
            if(s.fl>0){ctx.fillStyle='rgba(255,180,0,'+(s.fl/12)+')';ctx.beginPath();ctx.arc(s.x-16,s.y+s.h-14,9,0,Math.PI*2);ctx.fill();}
            ctx.fillStyle='#0d2a4a';ctx.fillRect(s.x+3,GY-8,7,8);ctx.fillRect(s.x+s.w-10,GY-8,7,8);
        }
        for(var i=0;i<RN.rockets.length;i++){
            var r=RN.rockets[i];ctx.fillStyle='#dc2626';
            ctx.beginPath();ctx.moveTo(r.x,r.y+r.h/2);ctx.lineTo(r.x+10,r.y);ctx.lineTo(r.x+r.w,r.y);ctx.lineTo(r.x+r.w,r.y+r.h);ctx.lineTo(r.x+10,r.y+r.h);ctx.closePath();ctx.fill();
            ctx.fillStyle='rgba(255,255,255,0.75)';ctx.beginPath();ctx.arc(r.x+18,r.y+r.h/2,3,0,Math.PI*2);ctx.fill();
            var fl=6+Math.sin(RN.fr*0.8)*3;ctx.fillStyle='rgba(255,150,0,0.85)';ctx.beginPath();ctx.moveTo(r.x+r.w,r.y+2);ctx.lineTo(r.x+r.w+fl,r.y+r.h/2);ctx.lineTo(r.x+r.w,r.y+r.h-2);ctx.closePath();ctx.fill();
        }
        ctx.fillStyle='#f57c00';ctx.beginPath();ctx.roundRect(RN.px,RN.py,RN.pw,RN.ph,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.roundRect(RN.px+4,RN.py+6,RN.pw-8,10,3);ctx.fill();
        ctx.fillStyle='#0d2a4a';ctx.fillRect(RN.px+6,RN.py+8,4,4);ctx.fillRect(RN.px+16,RN.py+8,4,4);
        var ll=RN.run?(Math.sin(RN.fr*0.28)*4|0):0;
        ctx.fillStyle='#e65100';ctx.fillRect(RN.px+3,RN.py+RN.ph,7,5+ll);ctx.fillRect(RN.px+RN.pw-10,RN.py+RN.ph,7,5-ll);
        if(RN.jmps===2&&!RN.grnd){ctx.strokeStyle='rgba(255,200,60,0.75)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(RN.px+RN.pw/2,RN.py+RN.ph/2,18+Math.sin(RN.fr*0.4)*3,0,Math.PI*2);ctx.stroke();}
    } else {
        ctx.fillStyle='#f57c00';ctx.beginPath();ctx.roundRect(RN.px,RN.py,RN.pw,RN.ph,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.roundRect(RN.px+4,RN.py+6,RN.pw-8,10,3);ctx.fill();
        ctx.fillStyle='#0d2a4a';ctx.fillRect(RN.px+6,RN.py+8,4,4);ctx.fillRect(RN.px+16,RN.py+8,4,4);
        ctx.fillStyle='#e65100';ctx.fillRect(RN.px+3,RN.py+RN.ph,7,5);ctx.fillRect(RN.px+RN.pw-10,RN.py+RN.ph,7,5);
        drawWelcome('404 Runner','Dodge obstacles & rockets');
    }
    drawParticles();
    if(RN.over)drawGameOver(RN.score,RN.newHi);
}

/* ═══════════════════════════════════════════════
   GAME 2 — JETPACK (Flappy Bird style)
   ═══════════════════════════════════════════════ */
var JP_GAP=80,JP_OBW=38;
var JP={run:false,over:false,score:0,fr:0,spd:3,py:H/2,vy:0,obs:[],next:90,pipes:0,newHi:false};
function jpReset(){
    JP.py=H/2;JP.vy=0;JP.obs=[];JP.score=0;JP.fr=0;JP.spd=3;JP.next=90;JP.pipes=0;
    JP.newHi=false;namePending=false;particles=[];
    if(nameOverlay)nameOverlay.style.display='none';
    JP.run=true;JP.over=false;
}
function jpBoost(){
    if(namePending)return;
    if(!JP.run&&!JP.over){jpReset();return;}
    if(JP.over){jpReset();return;}
    JP.vy=-5.5;
}
function jpDie(){if(JP.over)return;JP.over=true;JP.run=false;JP.newHi=checkNewHi('jetpack',JP.pipes);}
function jpUpdate(){
    if(!JP.run||JP.over)return;
    JP.fr++;JP.score++;JP.spd=3+Math.floor(JP.score/300)*0.3;
    JP.vy+=0.4;JP.py+=JP.vy;
    if(JP.py<8||JP.py>H-8){jpDie();return;}
    JP.next--;
    if(JP.next<=0){
        var gy=36+Math.floor(Math.random()*(H-JP_GAP-60));
        JP.obs.push({x:W,gy:gy,done:false});JP.next=110+Math.floor(Math.random()*40);
    }
    for(var i=JP.obs.length-1;i>=0;i--){
        JP.obs[i].x-=JP.spd;
        if(!JP.obs[i].done&&JP.obs[i].x+JP_OBW<80){JP.obs[i].done=true;JP.pipes++;}
        if(JP.obs[i].x+JP_OBW<0){JP.obs.splice(i,1);continue;}
        if(80+9>JP.obs[i].x&&80-9<JP.obs[i].x+JP_OBW){
            if(JP.py-9<JP.obs[i].gy||JP.py+9>JP.obs[i].gy+JP_GAP){jpDie();return;}
        }
    }
}
function jpDraw(){
    ctx.clearRect(0,0,W,H);
    var g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1e3a5f');g.addColorStop(1,'#1d4ed8');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,0.35)';
    for(var i=0;i<24;i++){ctx.beginPath();ctx.arc((i*37+JP.fr*0.15)%W,28+i*10,1,0,Math.PI*2);ctx.fill();}
    drawHiPanel('jetpack');drawScore(JP.pipes);
    for(var i=0;i<JP.obs.length;i++){
        var o=JP.obs[i];
        ctx.fillStyle='#15803d';ctx.beginPath();ctx.roundRect(o.x,0,JP_OBW,o.gy,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(o.x+4,0,8,o.gy);
        ctx.fillStyle='#15803d';ctx.beginPath();ctx.roundRect(o.x,o.gy+JP_GAP,JP_OBW,H-o.gy-JP_GAP,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(o.x+4,o.gy+JP_GAP,8,H-o.gy-JP_GAP);
    }
    var py=JP.py;
    if(JP.run&&JP.vy<0){
        var fl=8+Math.random()*5;ctx.fillStyle='rgba(255,150,0,0.85)';
        ctx.beginPath();ctx.moveTo(76,py+8);ctx.lineTo(72,py+fl);ctx.lineTo(68,py+8);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle='#f57c00';ctx.beginPath();ctx.roundRect(70,py-10,20,22,4);ctx.fill();
    ctx.fillStyle='#1a3a5c';ctx.beginPath();ctx.roundRect(66,py-8,8,18,3);ctx.fill();
    ctx.fillStyle='rgba(245,124,0,0.6)';ctx.beginPath();ctx.arc(70,py+8,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.roundRect(73,py-7,14,9,3);ctx.fill();
    ctx.fillStyle='#0d2a4a';ctx.fillRect(75,py-5,3,3);ctx.fillRect(81,py-5,3,3);
    if(!JP.run&&!JP.over)drawWelcome('Jetpack Pilot','Fly through the gaps');
    drawParticles();
    if(JP.over)drawGameOver(JP.pipes,JP.newHi);
}

/* ═══════════════════════════════════════════════
   GAME 3 — RACER (top-down 3-lane)
   ═══════════════════════════════════════════════ */
var RD_X=Math.floor((W-360)/2),RD_W=360,LN_W=120;
var LNS=[RD_X+60,RD_X+180,RD_X+300];
var RC_COLS=['#dc2626','#2563eb','#16a34a','#d97706','#7c3aed','#db2777'];
var RC={run:false,over:false,score:0,fr:0,spd:5,lane:1,tx:0,cx:0,cars:[],next:40,dash:0,newHi:false};
RC.tx=LNS[1];RC.cx=LNS[1];
function rcReset(){
    RC.lane=1;RC.tx=LNS[1];RC.cx=LNS[1];RC.cars=[];RC.score=0;RC.fr=0;RC.spd=5;RC.next=40;RC.dash=0;
    RC.newHi=false;namePending=false;particles=[];
    if(nameOverlay)nameOverlay.style.display='none';RC.run=true;RC.over=false;
}
function rcMove(dir){
    if(namePending)return;
    if(!RC.run&&!RC.over){rcReset();return;}
    if(RC.over){rcReset();return;}
    if(dir==='l'&&RC.lane>0){RC.lane--;RC.tx=LNS[RC.lane];}
    if(dir==='r'&&RC.lane<2){RC.lane++;RC.tx=LNS[RC.lane];}
}
function rcDie(){if(RC.over)return;RC.over=true;RC.run=false;RC.newHi=checkNewHi('racer',RC.score);}
function rcUpdate(){
    if(!RC.run||RC.over)return;
    RC.fr++;RC.score++;RC.spd=5+Math.floor(RC.score/400)*0.5;
    RC.dash=(RC.dash+RC.spd*2)%40;RC.cx+=(RC.tx-RC.cx)*0.18;
    RC.next--;
    if(RC.next<=0){
        var ln=Math.floor(Math.random()*3);
        RC.cars.push({x:LNS[ln],y:-50,col:RC_COLS[Math.floor(Math.random()*RC_COLS.length)]});
        RC.next=36+Math.floor(Math.random()*36);
    }
    for(var i=RC.cars.length-1;i>=0;i--){
        RC.cars[i].y+=RC.spd*2;
        if(RC.cars[i].y>H+60){RC.cars.splice(i,1);continue;}
        if(Math.abs(RC.cx-RC.cars[i].x)<22&&Math.abs(H-70-RC.cars[i].y)<36){rcDie();return;}
    }
}
function rcDrawCar(cx,cy,col,pl){
    var x=cx-15,y=cy-25;
    ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y+8,30,34,6);ctx.fill();
    ctx.fillStyle=pl?'#c2410c':'rgba(0,0,0,0.35)';ctx.beginPath();ctx.roundRect(x+4,y+14,22,22,3);ctx.fill();
    ctx.fillStyle='rgba(200,240,255,0.75)';ctx.beginPath();ctx.roundRect(x+5,y+15,20,8,2);ctx.fill();ctx.beginPath();ctx.roundRect(x+5,y+28,20,7,2);ctx.fill();
    ctx.fillStyle='#111';ctx.fillRect(x-2,y+10,5,9);ctx.fillRect(x+27,y+10,5,9);ctx.fillRect(x-2,y+31,5,9);ctx.fillRect(x+27,y+31,5,9);
    if(pl){ctx.fillStyle='#fbbf24';ctx.fillRect(x+2,y+8,6,3);ctx.fillRect(x+22,y+8,6,3);}
    else{ctx.fillStyle='#ef4444';ctx.fillRect(x+2,y+39,6,3);ctx.fillRect(x+22,y+39,6,3);}
}
function rcDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#22c55e';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#374151';ctx.fillRect(RD_X,0,RD_W,H);
    ctx.fillStyle='#fff';ctx.fillRect(RD_X,0,4,H);ctx.fillRect(RD_X+RD_W-4,0,4,H);
    ctx.save();ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=2;ctx.setLineDash([20,20]);ctx.lineDashOffset=-RC.dash;
    ctx.beginPath();ctx.moveTo(RD_X+LN_W,0);ctx.lineTo(RD_X+LN_W,H);ctx.stroke();
    ctx.beginPath();ctx.moveTo(RD_X+LN_W*2,0);ctx.lineTo(RD_X+LN_W*2,H);ctx.stroke();
    ctx.restore();
    drawHiPanel('racer');drawScore(RC.score);
    for(var i=0;i<RC.cars.length;i++)rcDrawCar(RC.cars[i].x,RC.cars[i].y,RC.cars[i].col,false);
    rcDrawCar(RC.cx,H-70,'#f57c00',true);
    if(!RC.run&&!RC.over)drawWelcome('Street Racer','← left half  |  right half → steer');
    drawParticles();
    if(RC.over)drawGameOver(RC.score,RC.newHi);
}

/* ═══════════════════════════════════════════════
   GAME 4 — MANIC MINER (10 levels)
   ═══════════════════════════════════════════════ */
var MM_PW=16,MM_PH=20,MM_SB=24,MM_PH8=8;
// Level data: plat=[x,y,w], en={x,py,pa,pb,sp,d}, keys=[{x,y}], sx,sy,ex,ey
// py = bottom-y of character/enemy when standing on that platform
// Platform at y=268 → player py=268, player top = 248
var MM_LEVELS=[
    // 1 - Introduction
    {plat:[[0,268,620],[60,220,110],[250,190,100],[420,220,110],[160,152,90],[430,152,80]],
     en:[{x:280,py:268,pa:160,pb:440,sp:1.5,d:1},{x:260,py:190,pa:250,pb:340,sp:1.6,d:1}],
     keys:[{x:95,y:206},{x:285,y:176},{x:455,y:206},{x:195,y:138},{x:465,y:138}],
     sx:30,sy:268,ex:570,ey:268},
    // 2 - Two tiers
    {plat:[[0,268,120],[170,268,120],[340,268,120],[500,268,120],[80,218,100],[260,218,100],[440,218,100],[150,165,100],[370,165,100]],
     en:[{x:90,py:218,pa:80,pb:180,sp:1.8,d:1},{x:270,py:218,pa:260,pb:360,sp:1.8,d:-1},{x:385,py:165,pa:370,pb:470,sp:2,d:1}],
     keys:[{x:110,y:204},{x:300,y:204},{x:470,y:204},{x:190,y:151},{x:410,y:151}],
     sx:10,sy:268,ex:565,ey:268},
    // 3 - Stepping stones
    {plat:[[0,268,80],[110,268,60],[220,268,60],[330,268,60],[450,268,80],[560,268,60],[50,225,60],[160,205,60],[270,185,60],[380,205,60],[490,225,60],[560,185,60]],
     en:[{x:115,py:268,pa:110,pb:170,sp:2,d:1},{x:335,py:268,pa:330,pb:390,sp:2,d:-1},{x:395,py:205,pa:380,pb:440,sp:2.2,d:1}],
     keys:[{x:70,y:243},{x:175,y:181},{x:290,y:161},{x:405,y:181},{x:575,y:161}],
     sx:10,sy:268,ex:570,ey:185},
    // 4 - Towers
    {plat:[[0,268,620],[60,238,40],[140,208,40],[220,178,40],[310,148,40],[400,178,40],[480,208,40],[560,238,40],[80,118,70],[300,100,70],[520,118,70]],
     en:[{x:220,py:268,pa:80,pb:540,sp:2,d:1},{x:145,py:208,pa:140,pb:220,sp:2.2,d:1},{x:405,py:208,pa:400,pb:480,sp:2.2,d:-1},{x:310,py:100,pa:300,pb:370,sp:3,d:1}],
     keys:[{x:75,y:214},{x:155,y:184},{x:235,y:154},{x:325,y:124},{x:415,y:154},{x:495,y:184},{x:575,y:214},{x:325,y:76}],
     sx:10,sy:268,ex:545,ey:268},
    // 5 - Zigzag
    {plat:[[0,268,100],[150,248,80],[290,228,80],[430,208,80],[530,188,90],[420,158,80],[290,170,80],[150,158,80],[50,138,80],[170,118,80],[340,108,80],[510,118,80]],
     en:[{x:155,py:248,pa:150,pb:230,sp:2,d:1},{x:295,py:228,pa:290,pb:370,sp:2.3,d:1},{x:435,py:208,pa:430,pb:510,sp:2,d:-1},{x:295,py:170,pa:290,pb:370,sp:2.5,d:1},{x:340,py:108,pa:340,pb:420,sp:3,d:1}],
     keys:[{x:175,y:224},{x:315,y:204},{x:455,y:184},{x:440,y:134},{x:180,y:94},{x:355,y:84},{x:530,y:94}],
     sx:10,sy:268,ex:510,ey:118},
    // 6 - Gauntlet
    {plat:[[0,268,620],[0,218,180],[200,218,60],[420,218,200],[100,168,100],[280,158,80],[440,168,100],[0,118,100],[200,113,80],[420,118,100],[540,113,80],[180,68,260]],
     en:[{x:50,py:218,pa:0,pb:180,sp:2.5,d:1},{x:430,py:218,pa:420,pb:620,sp:2.5,d:-1},{x:115,py:168,pa:100,pb:200,sp:2.5,d:1},{x:455,py:168,pa:440,pb:540,sp:2.5,d:-1},{x:10,py:118,pa:0,pb:100,sp:3,d:1},{x:435,py:118,pa:420,pb:620,sp:3,d:-1},{x:250,py:68,pa:180,pb:440,sp:3.5,d:1}],
     keys:[{x:80,y:194},{x:450,y:194},{x:135,y:144},{x:475,y:144},{x:50,y:94},{x:475,y:94},{x:305,y:44}],
     sx:10,sy:268,ex:570,ey:268},
    // 7 - Island hopping
    {plat:[[0,268,60],[100,268,80],[240,268,60],[360,268,80],[480,268,60],[570,268,50],[50,220,70],[180,200,70],[320,200,70],[460,220,70],[555,200,65],[80,155,60],[240,140,70],[400,155,60],[520,133,60],[160,100,70],[360,100,70],[500,103,60]],
     en:[{x:110,py:268,pa:100,pb:180,sp:2.2,d:1},{x:370,py:268,pa:360,pb:440,sp:2.2,d:-1},{x:195,py:200,pa:180,pb:250,sp:2.5,d:1},{x:475,py:220,pa:460,pb:530,sp:2.5,d:-1},{x:255,py:140,pa:240,pb:310,sp:3,d:1},{x:370,py:100,pa:360,pb:430,sp:3,d:-1}],
     keys:[{x:75,y:244},{x:210,y:176},{x:345,y:176},{x:580,y:244},{x:95,y:131},{x:535,y:109},{x:185,y:76},{x:375,y:76}],
     sx:10,sy:268,ex:520,ey:103},
    // 8 - Speed run
    {plat:[[0,268,620],[80,228,80],[220,208,80],[360,228,80],[500,208,80],[140,173,60],[300,153,60],[440,173,60],[570,153,60],[80,118,60],[220,98,60],[380,118,60],[500,98,60]],
     en:[{x:90,py:228,pa:80,pb:160,sp:3,d:1},{x:230,py:208,pa:220,pb:300,sp:3.2,d:-1},{x:370,py:228,pa:360,pb:440,sp:3,d:1},{x:510,py:208,pa:500,pb:580,sp:3.2,d:-1},{x:150,py:173,pa:140,pb:200,sp:3.5,d:1},{x:310,py:153,pa:300,pb:360,sp:3.5,d:-1},{x:450,py:173,pa:440,pb:500,sp:3.5,d:1}],
     keys:[{x:100,y:204},{x:250,y:184},{x:390,y:204},{x:530,y:184},{x:160,y:149},{x:320,y:129},{x:460,y:149},{x:530,y:74}],
     sx:10,sy:268,ex:500,ey:98},
    // 9 - The Maze
    {plat:[[0,268,620],[0,228,80],[180,228,80],[360,228,80],[540,228,80],[80,193,80],[260,193,80],[440,193,80],[0,156,60],[140,156,60],[280,156,80],[440,156,60],[560,156,60],[60,118,70],[200,118,70],[360,118,70],[500,118,70],[0,80,60],[160,80,70],[310,80,70],[460,80,70],[560,80,60]],
     en:[{x:0,py:228,pa:0,pb:80,sp:2.5,d:1},{x:190,py:228,pa:180,pb:260,sp:2.5,d:-1},{x:370,py:228,pa:360,pb:440,sp:2.5,d:1},{x:550,py:228,pa:540,pb:620,sp:2.5,d:-1},{x:90,py:193,pa:80,pb:160,sp:3,d:1},{x:270,py:193,pa:260,pb:340,sp:3,d:-1},{x:450,py:193,pa:440,pb:520,sp:3,d:1},{x:70,py:118,pa:60,pb:130,sp:3.5,d:1},{x:210,py:118,pa:200,pb:270,sp:3.5,d:-1},{x:370,py:118,pa:360,pb:430,sp:3.5,d:1},{x:510,py:118,pa:500,pb:570,sp:3.5,d:-1}],
     keys:[{x:30,y:204},{x:210,y:204},{x:390,y:204},{x:570,y:204},{x:100,y:169},{x:280,y:169},{x:460,y:169},{x:80,y:94},{x:225,y:94},{x:375,y:94},{x:510,y:56}],
     sx:10,sy:268,ex:540,ey:268},
    // 10 - Final Challenge
    {plat:[[0,268,620],[0,240,50],[90,240,50],[180,240,50],[270,240,50],[360,240,50],[450,240,50],[540,240,80],[45,208,50],[135,208,50],[225,208,50],[315,208,50],[405,208,50],[495,208,50],[0,176,50],[90,176,50],[200,176,50],[310,176,50],[420,176,50],[530,176,90],[0,143,60],[140,143,60],[280,143,60],[420,143,60],[540,143,80],[80,108,50],[200,108,50],[330,108,50],[460,108,50],[160,73,60],[310,73,70],[470,73,60]],
     en:[{x:0,py:240,pa:0,pb:50,sp:3,d:1},{x:90,py:240,pa:90,pb:140,sp:3.2,d:1},{x:180,py:240,pa:180,pb:230,sp:3,d:-1},{x:270,py:240,pa:270,pb:320,sp:3.2,d:1},{x:360,py:240,pa:360,pb:410,sp:3,d:-1},{x:450,py:240,pa:450,pb:500,sp:3.2,d:1},{x:55,py:208,pa:45,pb:95,sp:3.5,d:1},{x:145,py:208,pa:135,pb:185,sp:3.5,d:-1},{x:235,py:208,pa:225,pb:275,sp:3.5,d:1},{x:325,py:208,pa:315,pb:365,sp:3.5,d:-1},{x:415,py:208,pa:405,pb:455,sp:3.5,d:1},{x:510,py:208,pa:495,pb:545,sp:3.5,d:-1},{x:10,py:176,pa:0,pb:50,sp:4,d:1},{x:100,py:176,pa:90,pb:140,sp:4,d:-1},{x:210,py:176,pa:200,pb:250,sp:4,d:1},{x:320,py:176,pa:310,pb:360,sp:4,d:-1},{x:430,py:176,pa:420,pb:470,sp:4,d:1},{x:540,py:176,pa:530,pb:620,sp:4,d:-1}],
     keys:[{x:15,y:216},{x:105,y:216},{x:195,y:216},{x:285,y:216},{x:375,y:216},{x:465,y:216},{x:555,y:216},{x:60,y:184},{x:150,y:184},{x:320,y:184},{x:510,y:184},{x:100,y:84},{x:220,y:84},{x:345,y:84},{x:490,y:84}],
     sx:10,sy:268,ex:490,ey:108}
];
var MM={run:false,over:false,won:false,score:0,fr:0,lives:3,level:0,
    px:30,py:268,pvx:0,pvy:0,pgrnd:false,
    plat:[],enemies:[],keys:[],exit:{x:0,y:0},exitOpen:false,
    dyingTimer:0,newHi:false};
function mmLoad(lvl){
    var d=MM_LEVELS[lvl];
    MM.plat=d.plat.map(function(p){return{x:p[0],y:p[1],w:p[2]};});
    MM.enemies=d.en.map(function(e){return{x:e.x,py:e.py,pa:e.pa,pb:e.pb,sp:e.sp,d:e.d};});
    MM.keys=d.keys.map(function(k){return{x:k.x,y:k.y,got:false};});
    MM.exit={x:d.ex,y:d.ey};MM.exitOpen=false;
    MM.px=d.sx;MM.py=d.sy;MM.pvx=0;MM.pvy=0;MM.pgrnd=false;MM.dyingTimer=0;
}
function mmReset(){
    MM.run=false;MM.over=false;MM.won=false;MM.score=0;MM.fr=0;MM.lives=3;MM.level=0;
    MM.newHi=false;namePending=false;particles=[];
    if(nameOverlay)nameOverlay.style.display='none';
    mmLoad(0);MM.run=true;
}
function mmDie(){
    if(MM.dyingTimer>0||MM.over)return;
    MM.dyingTimer=50;MM.pvx=0;MM.pvy=0;
}
var mmKeys={left:false,right:false,jump:false};
var mmJumpLock=false;
function mmUpdate(){
    if(!MM.run||MM.over)return;
    if(MM.dyingTimer>0){
        MM.dyingTimer--;
        if(MM.dyingTimer===0){
            MM.lives--;
            if(MM.lives<=0){MM.over=true;MM.run=false;MM.newHi=checkNewHi('miner',MM.score);}
            else{var d=MM_LEVELS[MM.level];MM.px=d.sx;MM.py=d.sy;MM.pvx=0;MM.pvy=0;}
        }
        return;
    }
    MM.fr++;
    if(mmKeys.left){MM.pvx=-2;}else if(mmKeys.right){MM.pvx=2;}else MM.pvx*=0.5;
    if(mmKeys.jump&&MM.pgrnd&&!mmJumpLock){MM.pvy=-9;MM.pgrnd=false;mmJumpLock=true;}
    if(!mmKeys.jump)mmJumpLock=false;
    MM.pvy+=0.5;
    MM.px+=MM.pvx;MM.py+=MM.pvy;
    if(MM.px<0)MM.px=0;if(MM.px+MM_PW>W)MM.px=W-MM_PW;
    // Platform landing (top only)
    MM.pgrnd=false;
    for(var i=0;i<MM.plat.length;i++){
        var p=MM.plat[i];
        if(MM.px+MM_PW>p.x+3&&MM.px<p.x+p.w-3){
            if(MM.pvy>=0&&MM.py>=p.y&&MM.py-MM.pvy<p.y+1){
                MM.py=p.y;MM.pvy=0;MM.pgrnd=true;break;
            }
        }
    }
    if(MM.py>H+30){mmDie();return;}
    // Enemy collisions
    for(var i=0;i<MM.enemies.length;i++){
        var e=MM.enemies[i];
        e.x+=e.sp*e.d;
        if(e.x<=e.pa)e.d=1;if(e.x+16>=e.pb)e.d=-1;
        if(MM.px+MM_PW-3>e.x+2&&MM.px+3<e.x+13&&MM.py>e.py-17&&MM.py-MM_PH<e.py+1){mmDie();return;}
    }
    // Key collection
    var allGot=true;
    for(var i=0;i<MM.keys.length;i++){
        if(!MM.keys[i].got){
            allGot=false;
            if(Math.abs(MM.px+MM_PW/2-MM.keys[i].x)<14&&Math.abs(MM.py-MM.keys[i].y)<14){
                MM.keys[i].got=true;MM.score+=10;
            }
        }
    }
    if(allGot&&!MM.exitOpen)MM.exitOpen=true;
    // Exit
    if(MM.exitOpen&&Math.abs(MM.px+MM_PW/2-MM.exit.x)<20&&Math.abs(MM.py-MM.exit.y)<22){
        MM.score+=100;MM.level++;
        if(MM.level>=MM_LEVELS.length){
            MM.won=true;MM.over=true;MM.run=false;MM.newHi=checkNewHi('miner',MM.score);
            burstFireworks();burstFireworks();
        } else mmLoad(MM.level);
    }
}
function mmDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#0d1b2e';ctx.fillRect(0,0,W,H);
    // Platforms
    for(var i=0;i<MM.plat.length;i++){
        var p=MM.plat[i];
        ctx.fillStyle=i===0?'#1a3a5f':'#234e7a';
        ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,MM_PH8,2);ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.25)';ctx.fillRect(p.x+2,p.y,p.w-4,2);
    }
    // Keys
    for(var i=0;i<MM.keys.length;i++){
        if(!MM.keys[i].got){
            var kx=MM.keys[i].x,ky=MM.keys[i].y;
            ctx.save();ctx.translate(kx,ky);ctx.rotate(Math.sin(MM.fr*0.08+i)*0.15);
            ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,0);ctx.lineTo(0,8);ctx.lineTo(-6,0);ctx.closePath();ctx.fill();
            ctx.fillStyle='rgba(255,230,100,0.55)';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
            ctx.restore();
        }
    }
    // Exit door
    if(MM.exitOpen){
        var fl=0.7+Math.sin(MM.fr*0.2)*0.3;
        ctx.fillStyle='rgba(34,197,94,'+fl+')';
        ctx.beginPath();ctx.roundRect(MM.exit.x-12,MM.exit.y-22,24,24,3);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 8px monospace';ctx.textAlign='center';
        ctx.fillText('EXIT',MM.exit.x,MM.exit.y-10);
    }
    // Enemies
    for(var i=0;i<MM.enemies.length;i++){
        var e=MM.enemies[i];var ey=e.py-16;
        ctx.fillStyle='#dc2626';ctx.beginPath();ctx.roundRect(e.x,ey,16,16,3);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(e.x+2,ey+3,5,5);ctx.fillRect(e.x+9,ey+3,5,5);
        ctx.fillStyle='#111';ctx.fillRect(e.x+3,ey+4,3,3);ctx.fillRect(e.x+10,ey+4,3,3);
        var el=Math.sin(MM.fr*0.3)*2|0;
        ctx.fillStyle='#991b1b';ctx.fillRect(e.x+2,e.py,5,4+el);ctx.fillRect(e.x+9,e.py,5,4-el);
    }
    // Player (flicker when dying)
    if(MM.dyingTimer===0||Math.floor(MM.dyingTimer/5)%2===0){
        var ppx=MM.px,ppy=MM.py-MM_PH;
        ctx.fillStyle=MM.dyingTimer>0?'#fff':'#f57c00';
        ctx.beginPath();ctx.roundRect(ppx,ppy,MM_PW,MM_PH,3);ctx.fill();
        if(MM.dyingTimer===0){
            ctx.fillStyle='rgba(255,255,255,0.9)';ctx.beginPath();ctx.roundRect(ppx+3,ppy+4,MM_PW-6,8,2);ctx.fill();
            ctx.fillStyle='#0d2a4a';ctx.fillRect(ppx+4,ppy+5,3,3);ctx.fillRect(ppx+9,ppy+5,3,3);
            var ll=Math.abs(MM.pvx)>0.2?(Math.sin(MM.fr*0.4)*3|0):0;
            ctx.fillStyle='#e65100';ctx.fillRect(ppx+2,MM.py,5,4+ll);ctx.fillRect(ppx+9,MM.py,5,4-ll);
        }
    }
    // Status bar
    ctx.fillStyle='rgba(9,20,40,0.92)';ctx.fillRect(0,0,W,MM_SB);
    ctx.font='bold 11px monospace';ctx.fillStyle='#f57c00';ctx.textAlign='left';
    ctx.fillText('Lvl '+(MM.level+1)+'/'+MM_LEVELS.length,8,16);
    ctx.fillStyle='#60a5fa';ctx.textAlign='center';
    ctx.fillText('Score: '+MM.score,W/2,16);
    ctx.textAlign='right';
    for(var i=0;i<MM.lives;i++){ctx.fillStyle='#f57c00';ctx.beginPath();ctx.roundRect(W-14-i*18,4,10,14,2);ctx.fill();}
    var kl=MM.keys.filter(function(k){return!k.got;}).length;
    if(kl>0){ctx.fillStyle='#f59e0b';ctx.textAlign='center';ctx.font='10px monospace';ctx.fillText('\u25C6\xD7'+kl,W/2+50,16);}
    if(!MM.run&&!MM.over){drawWelcome('Manic Miner','10 levels  \u2014  collect all keys \u2192 exit');}
    drawParticles();
    if(MM.over){
        if(MM.won){
            ctx.fillStyle='rgba(204,233,251,0.92)';ctx.beginPath();ctx.roundRect(W/2-140,H/2-40,280,80,8);ctx.fill();
            ctx.textAlign='center';ctx.fillStyle='#f57c00';ctx.font='bold 15px monospace';
            ctx.fillText('\uD83C\uDFC6 YOU BEAT ALL 10 LEVELS!',W/2,H/2-12);
            ctx.fillStyle='#0d2a4a';ctx.font='12px monospace';ctx.fillText('Score: '+MM.score,W/2,H/2+10);
            ctx.font='10px monospace';ctx.fillStyle='#3a6080';ctx.fillText('SPACE or TAP to play again',W/2,H/2+30);
        } else drawGameOver(MM.score,MM.newHi);
    }
}
// Miner mobile controls
['ml','mj','mr'].forEach(function(id){
    var el=document.getElementById('cs404-'+id);
    if(!el)return;
    function dn(e){
        e.preventDefault();
        if(id==='ml')mmKeys.left=true;
        else if(id==='mr')mmKeys.right=true;
        else mmKeys.jump=true;
    }
    function up(){
        if(id==='ml')mmKeys.left=false;
        else if(id==='mr')mmKeys.right=false;
        else mmKeys.jump=false;
    }
    el.addEventListener('touchstart',dn,{passive:false});
    el.addEventListener('touchend',up);
    el.addEventListener('mousedown',dn);
    el.addEventListener('mouseup',up);
});

/* ═══════════════════════════════════════════════
   GAME 5 — ASTEROIDS
   ═══════════════════════════════════════════════ */
var AS_STARS=[];
(function(){for(var i=0;i<55;i++)AS_STARS.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()<0.2?1.2:0.6});}());
var AS={run:false,over:false,score:0,fr:0,lives:3,wave:1,
    ship:{x:W/2,y:H/2,angle:-Math.PI/2,vx:0,vy:0,dead:false,deathTimer:0,invTimer:0},
    bullets:[],asteroids:[],newHi:false};
var AS_SHOOT_CD=0;
function asNewAsteroid(x,y,size){
    var a=Math.random()*Math.PI*2,sp=(3-size)*0.7+0.6+Math.random()*0.8;
    var verts=7+Math.floor(Math.random()*4),pts=[],br=size===1?34:size===2?18:9;
    for(var i=0;i<verts;i++){var ang=i/verts*Math.PI*2,r=br*(0.75+Math.random()*0.45);pts.push({x:Math.cos(ang)*r,y:Math.sin(ang)*r});}
    return{x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,size:size,pts:pts,angle:Math.random()*Math.PI*2,spin:(Math.random()-0.5)*0.04};
}
function asSpawnWave(){
    AS.asteroids=[];
    var n=Math.min(3+AS.wave,9);
    for(var i=0;i<n;i++){
        var x,y,tries=0;
        do{x=Math.random()*W;y=Math.random()*H;tries++;}
        while(tries<20&&Math.abs(x-AS.ship.x)<90&&Math.abs(y-AS.ship.y)<90);
        AS.asteroids.push(asNewAsteroid(x,y,1));
    }
}
function asReset(){
    AS.score=0;AS.fr=0;AS.lives=3;AS.wave=1;AS.bullets=[];
    AS.ship={x:W/2,y:H/2,angle:-Math.PI/2,vx:0,vy:0,dead:false,deathTimer:0,invTimer:60};
    AS.newHi=false;namePending=false;particles=[];AS_SHOOT_CD=0;
    if(nameOverlay)nameOverlay.style.display='none';
    asSpawnWave();AS.run=true;AS.over=false;
}
var asKeys={left:false,right:false,up:false,shoot:false};
var asShootLock=false;
function asUpdate(){
    if(!AS.run||AS.over)return;
    AS.fr++;AS_SHOOT_CD=Math.max(0,AS_SHOOT_CD-1);
    var sh=AS.ship;
    if(sh.dead){
        sh.deathTimer--;
        if(sh.deathTimer<=0){
            AS.lives--;
            if(AS.lives<=0){AS.over=true;AS.run=false;AS.newHi=checkNewHi('asteroids',AS.score);return;}
            sh.x=W/2;sh.y=H/2;sh.vx=0;sh.vy=0;sh.angle=-Math.PI/2;sh.dead=false;sh.invTimer=90;
        }
    } else {
        if(asKeys.left)sh.angle-=0.07;
        if(asKeys.right)sh.angle+=0.07;
        if(asKeys.up){sh.vx+=Math.cos(sh.angle)*0.28;sh.vy+=Math.sin(sh.angle)*0.28;}
        sh.vx*=0.985;sh.vy*=0.985;
        var spd=Math.sqrt(sh.vx*sh.vx+sh.vy*sh.vy);if(spd>5.5){sh.vx=sh.vx/spd*5.5;sh.vy=sh.vy/spd*5.5;}
        sh.x=(sh.x+sh.vx+W)%W;sh.y=(sh.y+sh.vy+H)%H;
        if(sh.invTimer>0)sh.invTimer--;
        if(asKeys.shoot&&!asShootLock&&AS_SHOOT_CD===0){
            AS.bullets.push({x:sh.x+Math.cos(sh.angle)*15,y:sh.y+Math.sin(sh.angle)*15,vx:Math.cos(sh.angle)*7.5+sh.vx,vy:Math.sin(sh.angle)*7.5+sh.vy,life:52});
            AS_SHOOT_CD=10;asShootLock=true;
        }
        if(!asKeys.shoot)asShootLock=false;
    }
    for(var i=AS.bullets.length-1;i>=0;i--){
        var b=AS.bullets[i];b.x=(b.x+b.vx+W)%W;b.y=(b.y+b.vy+H)%H;b.life--;
        if(b.life<=0)AS.bullets.splice(i,1);
    }
    for(var i=0;i<AS.asteroids.length;i++){
        var a=AS.asteroids[i];a.x=(a.x+a.vx+W)%W;a.y=(a.y+a.vy+H)%H;a.angle+=a.spin;
    }
    // bullet-asteroid collisions
    for(var bi=AS.bullets.length-1;bi>=0;bi--){
        var b=AS.bullets[bi],hit=false;
        for(var ai=AS.asteroids.length-1;ai>=0;ai--){
            var a=AS.asteroids[ai],r=a.size===1?34:a.size===2?18:9;
            var dx=b.x-a.x,dy=b.y-a.y;
            if(dx*dx+dy*dy<r*r){
                AS.score+=a.size===1?10:a.size===2?20:50;
                if(a.size<3){AS.asteroids.push(asNewAsteroid(a.x,a.y,a.size+1));AS.asteroids.push(asNewAsteroid(a.x,a.y,a.size+1));}
                for(var p=0;p<8;p++){var pa=Math.random()*Math.PI*2,ps=1+Math.random()*2;particles.push({x:a.x,y:a.y,vx:Math.cos(pa)*ps,vy:Math.sin(pa)*ps,life:1,dec:0.04+Math.random()*0.03,r:2+Math.random()*2,col:'#4a8ab5'});}
                AS.asteroids.splice(ai,1);AS.bullets.splice(bi,1);hit=true;break;
            }
        }
        if(hit)continue;
    }
    // ship-asteroid collision
    if(!sh.dead&&sh.invTimer===0){
        for(var ai=0;ai<AS.asteroids.length;ai++){
            var a=AS.asteroids[ai],r=(a.size===1?34:a.size===2?18:9)+9;
            var dx=sh.x-a.x,dy=sh.y-a.y;
            if(dx*dx+dy*dy<r*r){sh.dead=true;sh.deathTimer=60;burstFireworks();break;}
        }
    }
    if(AS.asteroids.length===0){AS.wave++;asSpawnWave();}
}
function asDraw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#080d1a';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,0.7)';
    for(var i=0;i<AS_STARS.length;i++){ctx.beginPath();ctx.arc(AS_STARS[i].x,AS_STARS[i].y,AS_STARS[i].r,0,Math.PI*2);ctx.fill();}
    drawHiPanel('asteroids');drawScore(AS.score);
    for(var i=0;i<AS.asteroids.length;i++){
        var a=AS.asteroids[i];
        ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);
        ctx.strokeStyle='#4a8ab5';ctx.lineWidth=1.8;ctx.fillStyle='rgba(13,42,74,0.75)';
        ctx.beginPath();ctx.moveTo(a.pts[0].x,a.pts[0].y);
        for(var j=1;j<a.pts.length;j++)ctx.lineTo(a.pts[j].x,a.pts[j].y);
        ctx.closePath();ctx.fill();ctx.stroke();
        ctx.restore();
    }
    ctx.fillStyle='#f59e0b';
    for(var i=0;i<AS.bullets.length;i++){ctx.beginPath();ctx.arc(AS.bullets[i].x,AS.bullets[i].y,2.5,0,Math.PI*2);ctx.fill();}
    var sh=AS.ship;
    if(!sh.dead&&(sh.invTimer===0||Math.floor(sh.invTimer/6)%2===0)){
        ctx.save();ctx.translate(sh.x,sh.y);ctx.rotate(sh.angle);
        if(asKeys.up&&AS.fr%4<2){
            ctx.fillStyle='rgba(255,140,0,0.85)';
            ctx.beginPath();ctx.moveTo(-10,5);ctx.lineTo(-19,0);ctx.lineTo(-10,-5);ctx.closePath();ctx.fill();
        }
        ctx.strokeStyle='#f57c00';ctx.lineWidth=2;ctx.fillStyle='rgba(245,124,0,0.18)';
        ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-10,9);ctx.lineTo(-6,0);ctx.lineTo(-10,-9);ctx.closePath();
        ctx.fill();ctx.stroke();
        ctx.restore();
    }
    // status bar
    ctx.fillStyle='rgba(8,13,26,0.88)';ctx.fillRect(0,0,W,20);
    ctx.font='bold 11px monospace';ctx.fillStyle='#f57c00';ctx.textAlign='left';
    ctx.fillText('Wave '+AS.wave,8,14);
    ctx.textAlign='right';
    for(var i=0;i<AS.lives;i++){
        ctx.save();ctx.translate(W-14-i*20,10);ctx.rotate(-Math.PI/2);
        ctx.strokeStyle='#f57c00';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,4);ctx.lineTo(-2,0);ctx.lineTo(-4,-4);ctx.closePath();ctx.stroke();
        ctx.restore();
    }
    if(!AS.run&&!AS.over)drawWelcome('Asteroids','\u2190\u2192 rotate  \u2191 thrust  SPACE shoot');
    drawParticles();
    if(AS.over)drawGameOver(AS.score,AS.newHi);
}
// Asteroids touch controls
['asl','asu','ass','asr'].forEach(function(id){
    var el=document.getElementById('cs404-'+id);
    if(!el)return;
    function dn(e){
        e.preventDefault();
        if(id==='asl')asKeys.left=true;
        else if(id==='asr')asKeys.right=true;
        else if(id==='asu')asKeys.up=true;
        else{asKeys.shoot=true;if(!AS.run&&!AS.over)asReset();else if(AS.over)asReset();}
    }
    function up(){
        if(id==='asl')asKeys.left=false;
        else if(id==='asr')asKeys.right=false;
        else if(id==='asu')asKeys.up=false;
        else asKeys.shoot=false;
    }
    el.addEventListener('touchstart',dn,{passive:false});
    el.addEventListener('touchend',up);
    el.addEventListener('mousedown',dn);
    el.addEventListener('mouseup',up);
});

/* ── Input ──────────────────────────────────────── */
var keysDown={};
document.addEventListener('keydown',function(e){
    if(e.target&&e.target.tagName==='INPUT')return;
    keysDown[e.code]=true;
    if(currentGame==='miner'){
        if(e.code==='ArrowLeft'||e.code==='KeyA')mmKeys.left=true;
        if(e.code==='ArrowRight'||e.code==='KeyD')mmKeys.right=true;
        if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space')mmKeys.jump=true;
        if(e.code==='Space'){
            var el=document.getElementById('cs404-game');
            if(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)e.preventDefault();}
            if(!MM.run&&!MM.over)mmReset();else if(MM.over)mmReset();
        }
        return;
    }
    if(currentGame==='asteroids'){
        if(e.code==='ArrowLeft'||e.code==='KeyA')asKeys.left=true;
        if(e.code==='ArrowRight'||e.code==='KeyD')asKeys.right=true;
        if(e.code==='ArrowUp'||e.code==='KeyW')asKeys.up=true;
        if(e.code==='Space'){
            var el=document.getElementById('cs404-game');
            if(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0)e.preventDefault();}
            asKeys.shoot=true;
            if(!AS.run&&!AS.over)asReset();else if(AS.over)asReset();
        }
        return;
    }
    if(e.code==='Space'||e.key===' '){
        var el=document.getElementById('cs404-game');
        if(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0){e.preventDefault();onAction();}}
    }
    if(currentGame==='racer'){
        if(e.key==='ArrowLeft'||e.code==='KeyA')rcMove('l');
        if(e.key==='ArrowRight'||e.code==='KeyD')rcMove('r');
    }
});
document.addEventListener('keyup',function(e){
    keysDown[e.code]=false;
    if(e.code==='ArrowLeft'||e.code==='KeyA'){mmKeys.left=false;asKeys.left=false;}
    if(e.code==='ArrowRight'||e.code==='KeyD'){mmKeys.right=false;asKeys.right=false;}
    if(e.code==='ArrowUp'||e.code==='KeyW'){mmKeys.jump=false;asKeys.up=false;}
    if(e.code==='Space'){mmKeys.jump=false;asKeys.shoot=false;}
});
c.addEventListener('click',function(e){
    if(currentGame==='racer'){
        var r=c.getBoundingClientRect(),cx=e.clientX-r.left;
        if(cx<W/2)rcMove('l');else rcMove('r');
    } else if(currentGame==='miner'){
        if(!MM.run&&!MM.over)mmReset();else if(MM.over)mmReset();
    } else if(currentGame==='asteroids'){
        if(!AS.run&&!AS.over)asReset();else if(AS.over)asReset();
    } else onAction();
});
document.addEventListener('touchstart',function(e){
    var t=e.target;
    if(t.tagName==='A'||t.tagName==='BUTTON'||t.tagName==='INPUT')return;
    var inCanvas=(t===c);
    if(currentGame==='racer'&&inCanvas){
        var r=c.getBoundingClientRect(),cx=e.touches[0].clientX-r.left;
        e.preventDefault();if(cx<W/2)rcMove('l');else rcMove('r');
    } else if(currentGame==='miner'){
        /* handled by miner buttons above */
    } else {
        e.preventDefault();onAction();
    }
},{passive:false});
function onAction(){
    if(currentGame==='runner')rnJump();
    else if(currentGame==='jetpack')jpBoost();
    else if(currentGame==='racer'){if(!RC.run&&!RC.over)rcReset();else if(RC.over)rcReset();}
    else if(currentGame==='miner'){if(!MM.run&&!MM.over)mmReset();else if(MM.over)mmReset();}
    else if(currentGame==='asteroids'){if(!AS.run&&!AS.over)asReset();else if(AS.over)asReset();}
}

/* ── Tab switching ──────────────────────────────── */
var mcCtrl=document.getElementById('cs404-miner-ctrl');
var asCtrl=document.getElementById('cs404-asteroids-ctrl');
document.querySelectorAll('.cs404-tab').forEach(function(tab){
    tab.addEventListener('click',function(){
        currentGame=tab.getAttribute('data-game');
        document.querySelectorAll('.cs404-tab').forEach(function(t){t.classList.remove('active');});
        tab.classList.add('active');
        particles=[];namePending=false;
        if(nameOverlay)nameOverlay.style.display='none';
        mmKeys.left=false;mmKeys.right=false;mmKeys.jump=false;
        asKeys.left=false;asKeys.right=false;asKeys.up=false;asKeys.shoot=false;
        if(mcCtrl)mcCtrl.style.display=currentGame==='miner'?'flex':'none';
        if(asCtrl)asCtrl.style.display=currentGame==='asteroids'?'flex':'none';
        renderLeaderboard(currentGame);
    });
});

/* ── Main loop ──────────────────────────────────── */
function loop(){
    if(currentGame==='runner'){rnUpdate();rnDraw();}
    else if(currentGame==='jetpack'){jpUpdate();jpDraw();}
    else if(currentGame==='racer'){rcUpdate();rcDraw();}
    else if(currentGame==='miner'){mmUpdate();mmDraw();}
    else if(currentGame==='asteroids'){asUpdate();asDraw();}
    updateParticles();
    requestAnimationFrame(loop);
}
renderLeaderboard(currentGame);
loop();
})();
