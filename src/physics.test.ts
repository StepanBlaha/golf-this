import test from 'node:test';
import assert from 'node:assert/strict';
import { randomCourse, preset, decodeCourse, encodeCourse, screen, world } from './course';
import { previewShot, freshBall, stepBall } from './physics';
test('course links round trip and invalid payloads are rejected',()=>{const c=preset(); assert.deepEqual(decodeCourse(encodeCourse(c)),c);assert.equal(decodeCourse('#{}'),null);assert.equal(decodeCourse('#%xx'),null);const p={x:3.5,y:5.5};assert.deepEqual(world(screen(p)),p);});
test('ball bounces from edge and sinks when slow near cup',()=>{const c=preset(2);const bounced=stepBall({...freshBall({x:.14,y:6}),vx:-3,status:'moving'},c,.03);assert.ok(bounced.vx>0);const won=stepBall({...freshBall(c.hole),vx:.2,status:'moving'},c,.02);assert.equal(won.status,'won');});
test('water is a hazard and friction eventually stops the ball',()=>{const c=preset(1);assert.equal(stepBall({...freshBall({x:3,y:3}),vx:1,status:'moving'},c,.01).status,'water');let b={...freshBall({x:1,y:7}),vx:1,status:'moving' as const};let current:ReturnType<typeof freshBall>=b;for(let i=0;i<500;i++)current=stepBall(current,preset(2),.02);assert.equal(current.status,'idle');});

test('challenge scores survive sharing and malformed scores are rejected',()=>{
 const c={...preset(),challenge:3};assert.equal(decodeCourse(encodeCourse(c))?.challenge,3);
 for(const challenge of [0,-1,2.5,10001])assert.equal(decodeCourse(encodeCourse({...c,challenge})),null);
});
test('generated courses always have a clear grass route',()=>{
 let seed=123;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<100;i++){
  const c=randomCourse(rng);assert.ok(decodeCourse(encodeCourse(c)));
  const queue=[56],seen=new Set(queue);
  for(let j=0;j<queue.length;j++){const n=queue[j],x=n%8,y=Math.floor(n/8);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=b*8+a;if(a>=0&&a<8&&b>=0&&b<8&&c.tiles[k]==='grass'&&!seen.has(k)){seen.add(k);queue.push(k);}}}
  assert.ok(seen.has(7));
 }
});
test('shot preview stops before walls and follows friction on a clear course',()=>{
 const c=preset(2);c.tiles.fill('grass');c.tiles[3*8+4]='wall';
 const points=previewShot({x:2.5,y:3.5},{x:7,y:0},c);
 assert.ok(points.length>2);assert.ok(points.every(p=>p.x<3.88));
 c.tiles.fill('grass');const p={x:2,y:4},v={x:1,y:0};const path=previewShot(p,v,c);
 let b={...freshBall(p),vx:v.x,vy:v.y,status:'moving' as const} as ReturnType<typeof freshBall>;
 for(let i=0;i<480&&b.status==='moving';i++)b=stepBall(b,c,1/60);
 assert.ok(Math.hypot(path.at(-1)!.x-b.x,path.at(-1)!.y-b.y)<.01);
});
