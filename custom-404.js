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
    var GRAV=0.55,JUMP=-11.5;
    var obs=[],nextObs=90;
    var clouds=[{x:120,y:22,w:70},{x:320,y:18,w:55},{x:500,y:26,w:65}];

    function reset(){py=GY-ph;vy=0;onGround=true;obs=[];score=0;frame=0;speed=4;nextObs=90;running=true;over=false;}

    function jump(){
        if(!running&&!over){reset();return;}
        if(over){reset();return;}
        if(onGround){vy=JUMP;onGround=false;}
    }

    document.addEventListener('keydown',function(e){
        if(e.code==='Space'||e.key===' '){
            var el=document.getElementById('cs404-game');
            if(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0){e.preventDefault();jump();}}
        }
    });
    c.addEventListener('click',jump);
    c.addEventListener('touchstart',function(e){e.preventDefault();jump();},{passive:false});

    function drawPlayer(){
        /* body */
        ctx.fillStyle='#f57c00';
        ctx.beginPath();ctx.roundRect(px,py,pw,ph,4);ctx.fill();
        /* visor */
        ctx.fillStyle='rgba(255,255,255,0.9)';
        ctx.beginPath();ctx.roundRect(px+4,py+6,pw-8,10,3);ctx.fill();
        /* pupils */
        ctx.fillStyle='#0d2a4a';
        ctx.fillRect(px+6,py+8,4,4);
        ctx.fillRect(px+16,py+8,4,4);
        /* legs */
        var lleg=running?(Math.sin(frame*0.28)*4|0):0;
        ctx.fillStyle='#e65100';
        ctx.fillRect(px+3,py+ph,7,5+lleg);
        ctx.fillRect(px+pw-10,py+ph,7,5-lleg);
    }

    function drawObs(o){
        /* body */
        ctx.fillStyle='#0d2a4a';
        ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
        ctx.fillStyle='rgba(245,124,0,0.15)';
        ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,3);ctx.fill();
        /* text */
        ctx.fillStyle='#f57c00';
        ctx.font='bold 10px monospace';
        ctx.textAlign='center';
        ctx.fillText('404',o.x+o.w/2,o.y+o.h/2+4);
    }

    function drawCloud(cl){
        ctx.fillStyle='rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.ellipse(cl.x,cl.y,cl.w/2,12,0,0,Math.PI*2);
        ctx.ellipse(cl.x-cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);
        ctx.ellipse(cl.x+cl.w/4,cl.y+4,cl.w/4,9,0,0,Math.PI*2);
        ctx.fill();
    }

    function update(){
        if(!running||over)return;
        frame++;score++;
        speed=4+Math.floor(score/300)*0.4;
        /* gravity */
        vy+=GRAV;py+=vy;
        if(py>=GY-ph){py=GY-ph;vy=0;onGround=true;}
        /* clouds */
        for(var i=0;i<clouds.length;i++){
            clouds[i].x-=speed*0.3;
            if(clouds[i].x+clouds[i].w<0)clouds[i].x=W+clouds[i].w;
        }
        /* spawn */
        nextObs--;
        if(nextObs<=0){
            var h=28+Math.floor(Math.random()*26);
            obs.push({x:W,y:GY-h,w:30,h:h});
            nextObs=65+Math.floor(Math.random()*70);
        }
        /* move & collide */
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
        /* clouds */
        for(var i=0;i<clouds.length;i++)drawCloud(clouds[i]);
        /* ground */
        ctx.fillStyle='rgba(42,96,144,0.35)';
        ctx.fillRect(0,GY,W,H-GY);
        ctx.fillStyle='#2a6090';
        ctx.fillRect(0,GY,W,3);
        /* score */
        ctx.fillStyle='#0d2a4a';
        ctx.font='bold 12px monospace';
        ctx.textAlign='right';
        if(hi>0)ctx.fillText('HI '+String(hi).padStart(5,'0'),W-65,18);
        ctx.fillText(String(score).padStart(5,'0'),W-10,18);
        /* player & obs */
        if(running||over){
            for(var j=0;j<obs.length;j++)drawObs(obs[j]);
            drawPlayer();
        } else {
            drawPlayer();
            ctx.fillStyle='#0d2a4a';
            ctx.font='bold 14px monospace';
        ctx.textAlign='center';
        ctx.fillText('SPACE  or  TAP  to  play',W/2,H/2+4);
        }
        /* game over overlay */
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
