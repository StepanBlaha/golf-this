import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { decodeCourse, encodeCourse, preset, randomCourse, screen, world, type Course, type Point, type Tile } from './course';
import { freshBall, stepBall, previewShot, type Ball } from './physics';

import { ToolIcon, Logo, ActionIcon } from './Icons';

type Tool = Tile | 'start' | 'hole';
const tools: { id: Tool; name: string; icon: string; help: string }[] = [
  {id:'grass',name:'Green',icon:'◇',help:'Clear a tile'}, {id:'wall',name:'Block',icon:'▱',help:'Add a bouncing obstacle'},
  {id:'sand',name:'Sand',icon:'∴',help:'Slow the ball down'}, {id:'water',name:'Water',icon:'≈',help:'A one-stroke hazard'},
  {id:'start',name:'Tee',icon:'●',help:'Choose where to start'}, {id:'hole',name:'Flag',icon:'⚑',help:'Place the cup'},
];
function initialCourse() {
  const shared=decodeCourse(location.hash);if(shared)return shared;
  try { const saved=localStorage.getItem('little-links-course');if(saved){const c=decodeCourse(saved);if(c)return c;} } catch { /* Optional storage. */ }
  return preset();
}
function pointString(p: Point[]) { return p.map(v=>`${v.x},${v.y}`).join(' '); }
function tilePoints(x:number,y:number,z=0) { return [{x,y},{x:x+1,y},{x:x+1,y:y+1},{x,y:y+1}].map(p=>{const v=screen(p);return{x:v.x,y:v.y-z};}); }
function TileArt({x,y,type,highlight}:{x:number;y:number;type:Tile;highlight:boolean}) {
  const top=tilePoints(x,y), raised=tilePoints(x,y,25),center=screen({x:x+.5,y:y+.5});
  const color=type==='water'?'#37bbef':type==='sand'?'#ffdc76':(x+y)%2?'#71d56e':'#81de7b';
  return <>
    <polygon points={pointString(top)} fill={highlight?'#caff99':color} stroke="#56bd60" strokeOpacity=".32" strokeWidth=".5" />
    {type==='wall'?<g><polygon points={pointString([raised[1],raised[2],top[2],top[1]])} fill="#7b62cd"/><polygon points={pointString([raised[2],raised[3],top[3],top[2]])} fill="#9578e4"/><polygon points={pointString(raised)} fill="#c6a7ff"/><path d={`M${raised[0].x} ${raised[0].y+2}L${raised[1].x} ${raised[1].y+2}`} stroke="#e6d5ff"/></g>:null}
    {type==='sand'?<g fill="#d5a740" opacity=".75"><circle cx={center.x-10} cy={center.y} r="1"/><circle cx={center.x+8} cy={center.y-4} r="1"/><circle cx={center.x+3} cy={center.y+6} r="1"/></g>:null}
    {type==='water'?<path d={`M${center.x-13} ${center.y-2}l12 6m1-8 11 5`} stroke="#b5f1ff" strokeWidth="1.4"/>:null}
  </>;
}
export default function App() {
  const [course,setCourse]=useState(initialCourse);
  const [isShared,setIsShared]=useState(()=>Boolean(decodeCourse(location.hash)));
  const [selectedMode,setMode]=useState<'edit'|'play'>('edit');
  const mode=isShared?'play':selectedMode;
  const [tool,setTool]=useState<Tool>('wall');
  const [hover,setHover]=useState<number|null>(null);
  const [history,setHistory]=useState<Course[]>([]);
  const [ball,setBall]=useState<Ball>(()=>freshBall(course.start));
  const [shots,setShots]=useState(0);
  const [angle,setAngle]=useState(-45);
  const [power,setPower]=useState(45);
  const [aim,setAim]=useState<Point|null>(null);
  const [toast,setToast]=useState({text:location.hash&&!decodeCourse(location.hash)?'That course link is invalid. Here is a fresh course.':'',id:0});
  const [sharing,setSharing]=useState(false);
  const sharingRef=useRef(false);
  function setMessage(text:string){setToast(previous=>({text,id:previous.id+1}));}
  useEffect(()=>{if(!toast.text||sharing)return;const timer=setTimeout(()=>setToast(current=>current.id===toast.id?{...current,text:''}:current),4500);return()=>clearTimeout(timer);},[toast,sharing]);
  const [shareValue,setShareValue]=useState('');
  const svgRef=useRef<SVGSVGElement>(null);
  const dragRef=useRef<Point|null>(null);
  const shotStart=useRef(course.start);
  const shareRef=useRef<HTMLInputElement>(null);
  const paintStroke=useRef<{before:Course;current:Course;seen:Set<number>;last:Point;changed:boolean}|null>(null);
  const [sound,setSound]=useState(false);
  const audioRef=useRef<AudioContext|null>(null);
  const moving=ball.status==='moving';
  useEffect(()=>{
    const openShared=()=>{const next=decodeCourse(location.hash);setIsShared(Boolean(next));setCourse(next??initialCourse());setMode(next?'play':'edit');setHistory([]);setMessage('');paintStroke.current=null;dragRef.current=null;setAim(null);};
    window.addEventListener('hashchange',openShared);return()=>window.removeEventListener('hashchange',openShared);
  },[]);
  useEffect(()=>{if(isShared)return;try{localStorage.setItem('little-links-course',encodeCourse(course));}catch{}},[course,isShared]);
  useEffect(()=>{setBall(freshBall(course.start));setShots(0);setAim(null);},[course]);
  useEffect(()=>{
    if(!moving)return;
    let frame=0,last=0;
    const tick=(now:number)=>{const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;setBall(current=>stepBall(current,course,dt));frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[moving,course]);
  useEffect(()=>{if(shareValue){shareRef.current?.focus();shareRef.current?.select();}},[shareValue]);
  function update(next:Course,feedback='Course updated'){if(isShared)return;next={...next,challenge:undefined};setHistory(h=>[...h,course].slice(-25));setCourse(next);setMessage(feedback);}
  const currentCourse=course;
  function paint(x:number,y:number){
    if(isShared||mode!=='edit'||x<0||x>7||y<0||y>7)return;
    const stroke=paintStroke.current;
    const course=stroke?.current??currentCourse;
    if(stroke?.seen.has(y*8+x))return;
    stroke?.seen.add(y*8+x);
    const point={x:x+.5,y:y+.5};
    const isStart=Math.floor(course.start.x)===x&&Math.floor(course.start.y)===y;
    const isHole=Math.floor(course.hole.x)===x&&Math.floor(course.hole.y)===y;
    if((tool==='start'&&isHole)||(tool==='hole'&&isStart)||(!['start','hole','grass'].includes(tool)&&(isStart||isHole))){setMessage('Keep the tee and flag on separate, clear tiles.');return;}
    const next={...course,tiles:[...course.tiles]};
    if(tool==='start'||tool==='hole'){next[tool]=point;next.tiles[y*8+x]='grass';}else next.tiles[y*8+x]=tool;
    if(JSON.stringify(next)===JSON.stringify(course))return;
    next.challenge=undefined;
    if(stroke){if(!stroke.changed){setHistory(h=>[...h,stroke.before].slice(-25));stroke.changed=true;}stroke.current=next;setCourse(next);setMessage('');}else update(next);
  }
  function reset(feedback='Ready for another round'){setBall(freshBall(course.start));setShots(0);setAim(null);setMessage(feedback);}
  function shoot(v:Point){
    if(mode!=='play'||moving||ball.status!=='idle')return;
    const speed=Math.hypot(v.x,v.y);if(speed<.15)return;
    const factor=Math.min(1,9/speed);shotStart.current={x:ball.x,y:ball.y};
    setBall({...ball,vx:v.x*factor,vy:v.y*factor,status:'moving'});setShots(n=>n+1);setAim(null);
  }
  function pointerPoint(event:ReactPointerEvent<SVGSVGElement>):Point {
    const matrix=svgRef.current?.getScreenCTM();if(!matrix)return{x:0,y:0};
    const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return world(p);
  }
  function paintTo(p:Point){
    const stroke=paintStroke.current;if(!stroke)return;
    const from=stroke.last,steps=Math.max(1,Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)*8));
    for(let i=1;i<=steps;i++)paint(Math.floor(from.x+(p.x-from.x)*i/steps),Math.floor(from.y+(p.y-from.y)*i/steps));
    stroke.last=p;
  }
  function down(event:ReactPointerEvent<SVGSVGElement>){
    if(event.button!==0)return;
    const p=pointerPoint(event);
    if(mode==='edit'){
      if(p.x<0||p.x>=8||p.y<0||p.y>=8)return;
      paintStroke.current={before:course,current:course,seen:new Set(),last:p,changed:false};paintTo(p);
    }else {if(ball.status!=='idle')return;dragRef.current=p;}
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event:ReactPointerEvent<SVGSVGElement>){
    const p=pointerPoint(event);
    if(paintStroke.current){if(tool!=='start'&&tool!=='hole')paintTo(p);return;}
    if(dragRef.current)setAim({x:(dragRef.current.x-p.x)*2.4,y:(dragRef.current.y-p.y)*2.4});
  }
  function up(event:ReactPointerEvent<SVGSVGElement>){
    if(paintStroke.current){if(tool!=='start'&&tool!=='hole')paintTo(pointerPoint(event));if(paintStroke.current.changed)setMessage('Tiles updated');paintStroke.current=null;return;}
    if(!dragRef.current)return;const p=pointerPoint(event);const v={x:(dragRef.current.x-p.x)*2.4,y:(dragRef.current.y-p.y)*2.4};dragRef.current=null;shoot(v);setAim(null);
  }
  function toggleSound(){
    if(!sound){try{audioRef.current??=new AudioContext();void audioRef.current.resume();}catch{setMessage('Sound is unavailable in this browser.');return;}}
    setSound(!sound);setMessage(sound?'Sound off':'Sound on');
  }
  useEffect(()=>{
    if(ball.status!=='won'||!sound||!audioRef.current)return;
    const context=audioRef.current;
    [523.25,659.25,783.99,1046.5].forEach((note,i)=>{
      const oscillator=context.createOscillator(),gain=context.createGain();
      const time=context.currentTime+i*.11;
      oscillator.frequency.value=note;oscillator.type='sine';gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.09,time+.02);gain.gain.exponentialRampToValueAtTime(.001,time+.35);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(time);oscillator.stop(time+.36);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    });
  },[ball.status,sound]);
  async function share(){
    if(sharingRef.current)return;
    sharingRef.current=true;setSharing(true);setShareValue('');setMessage('Copying link…');
    const url=new URL(location.href);url.hash=encodeCourse(ball.status==='won'&&shots<=10000?{...course,challenge:shots}:course);
    try{await navigator.clipboard.writeText(url.href);setMessage(ball.status==='won'?'Challenge link copied with your score!':'Course link copied! Ready to share.');}
    catch{setShareValue(url.href);setMessage('Couldn’t copy automatically. Select and copy the link below.');}
    finally{sharingRef.current=false;setSharing(false);}
  }

  const ballPoint=screen(mode==='edit'?course.start:ball),holePoint=screen(course.hole);
  const aimVector=aim??{x:Math.cos(angle*Math.PI/180)*power/11,y:Math.sin(angle*Math.PI/180)*power/11};
  const preview=useMemo(()=>mode==='play'&&ball.status==='idle'?previewShot(ball,aimVector,course).map(screen):[],[mode,ball,aimVector.x,aimVector.y,course]);
  return <div className={`app-shell ${mode}`}>
    <header><a href="/" className="wordmark"><span className="brand-icon"><Logo /></span> golf this!</a><button className="share-button" onClick={share} disabled={sharing} aria-busy={sharing}>Share course <span><ActionIcon kind="share"/></span></button></header>
    <main>
      <aside className="workbench">
        <h1>{mode==='edit'?'Make it yours.':'Let’s putt!'}</h1>
        {!isShared&&<div className="mode-switch" aria-label="Course mode"><button aria-pressed={mode==='edit'} onClick={()=>{setMode('edit');reset('Builder ready');}}><strong>Build</strong></button><button aria-pressed={mode==='play'} onClick={()=>{setMode('play');reset('Ready to putt');}}><strong>Play</strong> <span><ActionIcon kind="play"/></span></button></div>}
        {mode==='edit'?<>
          <label className="field-label" htmlFor="course-name">Course name</label><input id="course-name" className="name-input" maxLength={48} value={course.name} onChange={e=>setCourse({...course,name:e.target.value,challenge:undefined})}/>
          <div className="field-label toolbox-label">Choose a tile</div>
          <div className="toolbox">{tools.map(t=><button key={t.id} className={`tool tool-${t.id}`} aria-pressed={tool===t.id} title={t.help} onClick={()=>{setTool(t.id);setMessage(`${t.name} selected. ${t.help}.`);}}><span className="tool-icon" aria-hidden="true"><ToolIcon kind={t.id}/></span>{t.name}</button>)}</div>
          <div className="editor-bottom"><label htmlFor="par">Par <select id="par" value={course.par} onChange={e=>update({...course,par:Number(e.target.value)})}>{[1,2,3,4,5,6,7,8,9].map(n=><option key={n}>{n}</option>)}</select></label><button className="text-button" disabled={!history.length} onClick={()=>{setCourse(history[history.length-1]);setHistory(h=>h.slice(0,-1));setMessage('Last edit undone');}}>Undo <ActionIcon kind="undo"/></button></div>
          <div className="starter-label">Try a course</div><div className="templates">{['The detour','Water garden','Easy Sunday'].map((label,index)=><button key={label} onClick={()=>update(preset(index),`${label} loaded`)}>{label}</button>)}<button className="random-button" onClick={()=>update(randomCourse(),'Fresh course generated!')}>Surprise me <ActionIcon kind="restart"/></button></div>
        </>:<>
          {course.challenge?<p className="challenge-target">Score to beat: <strong>{course.challenge} {course.challenge===1?'stroke':'strokes'}</strong></p>:null}
          <div className="scoreboard"><div><span>STROKES</span><strong>{shots.toString().padStart(2,'0')}</strong></div><div><span>PAR</span><strong>{course.par.toString().padStart(2,'0')}</strong></div></div>
          <p className="play-instruction">Drag back on the course, then release to putt.</p>
          <label className="range-label" htmlFor="angle">Aim <span>{angle}°</span></label><input id="angle" type="range" min="-180" max="180" value={angle} disabled={moving} onChange={e=>setAngle(Number(e.target.value))}/>
          <label className="range-label" htmlFor="power">Power <span>{power}%</span></label><input id="power" type="range" min="5" max="100" value={power} disabled={moving} onChange={e=>setPower(Number(e.target.value))}/>
          <button className="putt-button" disabled={ball.status!=='idle'} onClick={()=>shoot(aimVector)}>{moving?'Rolling…':'Putt'} <span><ActionIcon/></span></button><button className="text-button restart" onClick={()=>reset()}>Start over <ActionIcon kind="restart"/></button>
        </>}
        <button className="text-button sound-toggle" aria-pressed={sound} onClick={toggleSound}>Sound {sound?'on':'off'}</button>
      </aside>
      <section className="course-stage" aria-label="Isometric mini golf course">
        
        <h2>{course.name||'Your little course'}</h2>
        <svg ref={svgRef} viewBox="0 0 660 390" className={`course-board ${mode}`} role="group" aria-label={mode==='edit'?'Course editor. Select a tool, then click a tile.':'Golf course. Drag backwards and release, or use the aim and power controls.'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{paintStroke.current=null;dragRef.current=null;setAim(null);}}>
          <polygon points="68,226 340,82 612,226 340,370" fill="#236bd0" opacity=".45" pointerEvents="none"/>
          <polygon points="58,192 330,336 330,358 58,214" fill="#38aa68"/><polygon points="330,336 602,192 602,214 330,358" fill="#278e61"/>
          {Array.from({length:15},(_,sum)=>Array.from({length:8},(_,x)=>({x,y:sum-x})).filter(p=>p.y>=0&&p.y<8)).flat().map(({x,y})=><g key={`${x}-${y}`} role={mode==='edit'?'button':undefined} tabIndex={mode==='edit'?0:undefined} aria-label={`Tile ${x+1}, ${y+1}: ${course.tiles[y*8+x]}`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();paint(x,y);}}} onMouseEnter={()=>setHover(y*8+x)} onMouseLeave={()=>setHover(null)}><TileArt x={x} y={y} type={course.tiles[y*8+x]==='wall'?'grass':course.tiles[y*8+x]} highlight={mode==='edit'&&hover===y*8+x}/></g>)}
          <g pointerEvents="none">
          {mode==='play'&&ball.status==='idle'?<polyline points={pointString(preview)} fill="none" stroke="#fefcf5" strokeWidth="2" strokeDasharray="4 5"/>:null}
</g>
        {[
          ...course.tiles.flatMap((type,index)=>type==='wall'?[{key:`wall-${index}`,depth:index%8+Math.floor(index/8)+1,node:<TileArt x={index%8} y={Math.floor(index/8)} type="wall" highlight={false}/>}]:[]),
          {key:'flag',depth:course.hole.x+course.hole.y,node:<g pointerEvents="none"><ellipse cx={holePoint.x} cy={holePoint.y} rx="8" ry="4.4" fill="#344b30"/><ellipse cx={holePoint.x} cy={holePoint.y+1} rx="4.5" ry="2.2" fill="#18251b"/><path d={`M${holePoint.x} ${holePoint.y}v-57`} stroke="#59664c" strokeWidth="2.2"/><path d={`M${holePoint.x+1} ${holePoint.y-57}l27 9-27 9Z`} fill="#ff6259"/></g>},
          {key:'ball',depth:(mode==='edit'?course.start.x+course.start.y:ball.x+ball.y),node:ball.status!=='won'||mode==='edit'?<g><ellipse cx={ballPoint.x+2} cy={ballPoint.y+2} rx="6" ry="3" fill="#566846" opacity=".25"/><circle cx={ballPoint.x} cy={ballPoint.y-4} r="6" fill="#fffdf5" stroke="#b9bea9" strokeWidth=".8"/><circle cx={ballPoint.x-2} cy={ballPoint.y-6} r="1.5" fill="white"/></g>:null}
        ].sort((a,b)=>a.depth-b.depth).map(item=><g key={item.key} pointerEvents="none">{item.node}</g>)}
        </svg>
        <p className="course-hint">{mode==='edit'?'Drag to paint. Tap to place.':moving?'Keep rolling…':'Drag back. Let it fly.'}</p>
        {ball.status==='won'&&mode==='play'?<div className="outcome" role="status"><div className="confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,background:['#ffda69','#ff6259','#81de7b','#c6a7ff'][i%4],animationDelay:`${i%6*.06}s`,rotate:`${i*47}deg`}}/>)}</div><span className="outcome-icon">⚑</span><h3>{shots===1?'A hole in one!':'Nicely done.'}</h3><p>{shots} {shots===1?'stroke':'strokes'}. {shots<=course.par?'A little masterpiece.':'Worth another round.'}</p>{course.challenge?<p className="challenge-result">{shots<course.challenge?'You beat the challenge!':shots===course.challenge?'You matched the challenge!':'Challenge still stands. Try again?'}</p>:null}<div><button onClick={()=>reset()}>Play again</button><button onClick={share} disabled={sharing} aria-busy={sharing}>Pass it on <ActionIcon kind="share"/></button></div></div>:null}
        {ball.status==='water'&&mode==='play'?<div className="outcome small" role="status"><h3>A little splash.</h3><p>Back to your last spot. One penalty stroke.</p><button onClick={()=>{setBall(freshBall(shotStart.current));setShots(n=>n+1);setMessage('Back on the green. One penalty stroke added.');}}>Take a drop <ActionIcon kind="restart"/></button></div>:null}
      </section>
    </main>
    <footer className="site-footer"><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="https://www.stepanblaha.com/">Made by Štěpán Bláha</a></footer>
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{toast.text&&<div className="action-toast" key={toast.id}><span className="toast-mark" aria-hidden="true">{sharing?'…':'●'}</span><span>{toast.text}</span><button className="toast-dismiss" aria-label="Dismiss notification" onClick={()=>setMessage('')}>×</button></div>}</div>{shareValue?<input className="share-fallback" ref={shareRef} aria-label="Shareable course link" value={shareValue} readOnly/>:null}
    
  </div>;
}
