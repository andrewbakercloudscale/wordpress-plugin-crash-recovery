/* CloudScale Crash Recovery — 404 Runner mini-game */
(function(){
    var c=document.getElementById('cs404-game');
    if(!c||!c.getContext)return;
    /* roundRect polyfill for Safari <15.4 */
    if(!CanvasRenderingContext2D.prototype.roundRect){
        CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
            r=Math.min(r,w/2,h/2);
            this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.arcTo(x+w,y,x+w,y+r,r);
            this.lineTo(x+w,y+h-r);this.arcTo(x+w,y+h,x+w-r,y+h,r);
            this.lineTo(x+r,y+h);this.arcTo(x,y+h,x,y+h-r,r);
            this.lineTo(x,y+r);this.arcTo(x,y,x+r,y,r);this.closePath();
        };
    }
    var ctx=c.getContext('2d');
    var W=c.width,H=c.height;
    var GY=H-28;
    var running=false,over=false,score=0,hi=0,frame=0,speed=4;
    var px=80,pw=26,ph=30,py=GY-ph,vy=0,onGround=true;
    var jumpsUsed=0,MAX_JUMPS=2;
    var GRAV=0.55,JUMP=-9;
    var obs=[],holes=[],rockets=[],shooters=[],nextObs=20,nextShooter=160;
    var clouds=[{x:120,y:22,w:70},{x:320,y:18,w:55},{x:500,y:26,w:65}];

    function reset(){
        py=GY-ph;vy=0;onGround=true;jumpsUsed=0;
        obs=[];holes=[];rockets=[];shooters=[];
        score=0;frame=0;speed=4;nextObs=20;nextShooter=160;
        running=true;over=false;
    }

    function jump(){
        if(!running&&!over){reset();return;}
        if(over){reset();return;}
        if(jumpsUsed<MAX_JUMPS){vy=JUMP;onGround=false;jumpsUsed++;}
    }

    document.addEventListener('keydown',function(e){
        if(e.code==='Space'||e.key===' '){
            var el=document.getElementById('cs404-game');
            if(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0){e.preventDefault();jump();}}
        }
    });
    c.addEventListener('click',jump);
    c.addEventListener('touchstart',function(e){e.preventDefault();jump();},{passive:false});

    function isOverHole(){
        for(var i=0;i<holes.length;i++){
            if(px+pw-6>holes[i].x+2&&px+6<holes[i].x+holes[i].w-2)return true;
        }
        return false;
    }

    function drawPlayer(){
        ctx.fillStyle='#f57c00';
        ctx.beginPath();ctx.roundRect(px,py,pw,ph,4);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.9)';
        ctx.beginPath();ctx.roundRect(px+4,py+6,pw-8,10,3);ctx.fill();
        ctx.fillStyle='#0d2a4a';
        ctx.fillRect(px+6,py+8,4,4);
        ctx.fillRect(px+16,py+8,4,4);
        var lleg=running?(Math.sin(frame*0.28)*4|0):0;
        ctx.fillStyle='#e65100';
        ctx.fillRect(px+3,py+ph,7,5+lleg);
        ctx.fillRect(px+pw-10,py+ph,7,5-lleg);
        if(jumpsUsed===2&&!onGround){
            ctx.strokeStyle='rgba(255,200,60,0.75)';
            ctx.lineWidth=2;
            ctx.beginPath();
            ctx.arc(px+pw/2,py+ph/2,18+Math.sin(frame*0.4)*3,0,Math.PI*2);
            ctx.stroke();
        }
    }

    function drawShooter(s){
        var sy=s.y;
        /* body */
        ctx.fillStyle='#1a3a5c';
        ctx.beginPath();ctx.roundRect(s.x,sy,s.w,s.h,4);ctx.fill();
        /* red visor */
        ctx.fillStyle='rgba(220,38,38,0.9)';
        ctx.beginPath();ctx.roundRect(s.x+3,sy+7,s.w-6,9,3);ctx.fill();
        /* gun barrel pointing left */
        ctx.fillStyle='#0d2a4a';
        ctx.fillRect(s.x-14,sy+s.h-17,16,7);
        /* muzzle flash */
        if(s.flash>0){
            ctx.fillStyle='rgba(255,180,0,'+(s.flash/12)+')';
            ctx.beginPath();
            ctx.arc(s.x-16,sy+s.h-14,9,0,Math.PI*2);
            ctx.fill();
        }
        /* legs */
        ctx.fillStyle='#0d2a4a';
        ctx.fillRect(s.x+3,GY-8,7,8);
        ctx.fillRect(s.x+s.w-10,GY-8,7,8);
    }

    function drawRocket(r){
        ctx.fillStyle='#dc2626';
        ctx.beginPath();
        ctx.moveTo(r.x,r.y+r.h/2);
        ctx.lineTo(r.x+10,r.y);
        ctx.lineTo(r.x+r.w,r.y);
        ctx.lineTo(r.x+r.w,r.y+r.h);
        ctx.lineTo(r.x+10,r.y+r.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.75)';
        ctx.beginPath();ctx.arc(r.x+18,r.y+r.h/2,3,0,Math.PI*2);ctx.fill();
        var fl=6+Math.sin(frame*0.8)*3;
        ctx.fillStyle='rgba(255,150,0,0.85)';
        ctx.beginPath();
        ctx.moveTo(r.x+r.w,r.y+2);
        ctx.lineTo(r.x+r.w+fl,r.y+r.h/2);
        ctx.lineTo(r.x+r.w,r.y+r.h-2);
        ctx.closePath();
        ctx.fill();
    }

    function drawObs(o){
        if(o.type==='water'){
            ctx.fillStyle='rgba(30,120,200,0.6)';
            ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
            ctx.strokeStyle='rgba(160,220,255,0.8)';ctx.lineWidth=1.5;
            var step=14,waveY=o.y+4;
            for(var wx=o.x+5;wx<o.x+o.w-8;wx+=step){
                ctx.beginPath();
                ctx.moveTo(wx,waveY);
                ctx.quadraticCurveTo(wx+step*0.25,waveY-3,wx+step*0.5,waveY);
                ctx.quadraticCurveTo(wx+step*0.75,waveY+3,wx+step,waveY);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle='#0d2a4a';
            ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
            ctx.fillStyle='rgba(245,124,0,0.15)';
            ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
            ctx.fillStyle='#f57c00';
            ctx.font='bold 10px monospace';
            ctx.textAlign='center';
            ctx.fillText('404',o.x+o.w/2,o.y+o.h/2+4);
        }
    }

    function drawCloud(cl){
        ctx.fillStyle='rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(cl.x,cl.y,cl.w/2,12,0,0,Math.PI*2);
        ctx.ellipse(cl.x-cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);
        ctx.ellipse(cl.x+cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);
        ctx.fill();
    }

    function drawGround(){
        var segs=holes.slice().sort(function(a,b){return a.x-b.x;});
        var sx=0;
        ctx.fillStyle='rgba(42,96,144,0.35)';
        for(var i=0;i<segs.length;i++){
            var hx=segs[i].x,hw=segs[i].w;
            if(hx>sx)ctx.fillRect(sx,GY,hx-sx,H-GY);
            sx=hx+hw;
        }
        if(sx<W)ctx.fillRect(sx,GY,W-sx,H-GY);
        sx=0;
        ctx.fillStyle='#2a6090';
        for(var i=0;i<segs.length;i++){
            var hx=segs[i].x;
            if(hx>sx)ctx.fillRect(sx,GY,hx-sx,3);
            sx=segs[i].x+segs[i].w;
        }
        if(sx<W)ctx.fillRect(sx,GY,W-sx,3);
    }

    function update(){
        if(!running||over)return;
        frame++;score++;
        speed=4+Math.floor(score/300)*0.4;
        vy+=GRAV;py+=vy;
        var oh=isOverHole();
        if(py>=GY-ph){
            if(!oh){py=GY-ph;vy=0;onGround=true;jumpsUsed=0;}
            else{onGround=false;}
        }
        if(py>H+20){over=true;running=false;if(score>hi)hi=score;}
        for(var i=0;i<clouds.length;i++){
            clouds[i].x-=speed*0.3;
            if(clouds[i].x+clouds[i].w<0)clouds[i].x=W+clouds[i].w;
        }
        /* spawn shooters — max one on screen at a time */
        nextShooter--;
        if(nextShooter<=0&&shooters.length===0){
            shooters.push({x:W,y:GY-44,w:24,h:44,rocketTimer:55,rocketInterval:90,flash:0});
            nextShooter=180+Math.floor(Math.random()*120);
        }
        /* update shooters */
        for(var i=shooters.length-1;i>=0;i--){
            var s=shooters[i];
            s.x-=2.4; /* moves left — player must jump over */
            if(s.flash>0)s.flash--;
            /* fire rocket */
            s.rocketTimer--;
            if(s.rocketTimer<=0){
                rockets.push({x:s.x-28,y:GY-20,w:28,h:12,spd:speed+3});
                s.flash=12;
                s.rocketTimer=s.rocketInterval+Math.floor(Math.random()*40);
            }
            /* off screen — start cooldown for next shooter */
            if(s.x+s.w<0){shooters.splice(i,1);nextShooter=180+Math.floor(Math.random()*120);continue;}
            /* collide with player */
            if(px+pw-4>s.x+3&&px+4<s.x+s.w-3&&py+ph>s.y+3&&py<s.y+s.h){
                over=true;running=false;if(score>hi)hi=score;
            }
        }
        /* move rockets */
        for(var i=rockets.length-1;i>=0;i--){
            rockets[i].x-=rockets[i].spd;
            if(rockets[i].x+rockets[i].w<0){rockets.splice(i,1);continue;}
            if(px+pw-4>rockets[i].x+4&&px+4<rockets[i].x+rockets[i].w-4&&py+ph>rockets[i].y+2&&py<rockets[i].y+rockets[i].h){
                over=true;running=false;if(score>hi)hi=score;
            }
        }
        /* spawn ground obstacles */
        nextObs--;
        if(nextObs<=0){
            var r=Math.random();
            if(r<0.22){
                var hw=32+Math.floor(Math.random()*22);
                holes.push({x:W,w:hw});
                nextObs=50+Math.floor(Math.random()*40);
            } else if(r<0.42){
                var ww=38+Math.floor(Math.random()*26);
                obs.push({type:'water',x:W,y:GY-12,w:ww,h:12});
                nextObs=40+Math.floor(Math.random()*35);
            } else if(r<0.60){
                obs.push({type:'block',x:W,y:GY-58,w:28,h:58});
                nextObs=50+Math.floor(Math.random()*40);
            } else {
                var h=24+Math.floor(Math.random()*24);
                obs.push({type:'block',x:W,y:GY-h,w:30,h:h});
                nextObs=40+Math.floor(Math.random()*45);
            }
        }
        for(var j=holes.length-1;j>=0;j--){
            holes[j].x-=speed;
            if(holes[j].x+holes[j].w<0)holes.splice(j,1);
        }
        for(var j=obs.length-1;j>=0;j--){
            obs[j].x-=speed;
            if(obs[j].x+obs[j].w<0){obs.splice(j,1);continue;}
            if(px+pw-5>obs[j].x+4&&px+5<obs[j].x+obs[j].w-4&&py+ph>obs[j].y+3&&py<obs[j].y+obs[j].h){
                over=true;running=false;if(score>hi)hi=score;
            }
        }
    }

    function draw(){
        ctx.clearRect(0,0,W,H);
        for(var i=0;i<clouds.length;i++)drawCloud(clouds[i]);
        drawGround();
        ctx.fillStyle='#0d2a4a';
        ctx.font='bold 12px monospace';
        ctx.textAlign='right';
        if(hi>0)ctx.fillText('HI '+String(hi).padStart(5,'0'),W-65,18);
        ctx.fillText(String(score).padStart(5,'0'),W-10,18);
        if(running||over){
            for(var j=0;j<obs.length;j++)drawObs(obs[j]);
            for(var i=0;i<shooters.length;i++)drawShooter(shooters[i]);
            for(var i=0;i<rockets.length;i++)drawRocket(rockets[i]);
            drawPlayer();
        } else {
            drawPlayer();
            ctx.fillStyle='#0d2a4a';
            ctx.font='bold 14px monospace';
            ctx.textAlign='center';
            ctx.fillText('SPACE  or  TAP  to  play',W/2,H/2+4);
        }
        if(over){
            ctx.fillStyle='rgba(204,233,251,0.82)';
            ctx.beginPath();ctx.roundRect(W/2-110,H/2-28,220,56,8);ctx.fill();
            ctx.strokeStyle='rgba(42,96,144,0.3)';ctx.lineWidth=1.5;
            ctx.beginPath();ctx.roundRect(W/2-110,H/2-28,220,56,8);ctx.stroke();
            ctx.fillStyle='#0d2a4a';
            ctx.font='bold 15px monospace';
            ctx.textAlign='center';
            ctx.fillText('GAME OVER',W/2,H/2-7);
            ctx.font='11px monospace';
            ctx.fillStyle='#3a6080';
            ctx.fillText('SPACE or TAP to retry',W/2,H/2+12);
        }
    }

    function loop(){update();draw();requestAnimationFrame(loop);}
    loop();
})();
