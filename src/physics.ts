import { type Course, type Point, size } from './course';
export type Ball = Point & { vx: number; vy: number; status: 'idle' | 'moving' | 'water' | 'won' };
export const freshBall = (p: Point): Ball => ({ ...p, vx: 0, vy: 0, status: 'idle' });
const radius = .13;
export function stepBall(input: Ball, course: Course, seconds: number): Ball {
  if (input.status !== 'moving') return input;
  const b = { ...input };
  const steps = Math.ceil(Math.min(.05,seconds) / (1/240));
  const dt = Math.min(.05,seconds) / steps;
  for (let step=0;step<steps;step++) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < radius) { b.x=radius; b.vx=Math.abs(b.vx)*.78; }
    if (b.x > size-radius) { b.x=size-radius; b.vx=-Math.abs(b.vx)*.78; }
    if (b.y < radius) { b.y=radius; b.vy=Math.abs(b.vy)*.78; }
    if (b.y > size-radius) { b.y=size-radius; b.vy=-Math.abs(b.vy)*.78; }
    for (let y=Math.max(0,Math.floor(b.y)-1);y<=Math.min(7,Math.floor(b.y)+1);y++) for (let x=Math.max(0,Math.floor(b.x)-1);x<=Math.min(7,Math.floor(b.x)+1);x++) {
      if (course.tiles[y*8+x] !== 'wall') continue;
      const nx=Math.max(x,Math.min(x+1,b.x)), ny=Math.max(y,Math.min(y+1,b.y));
      const dx=b.x-nx,dy=b.y-ny,d=Math.hypot(dx,dy);
      if (d < radius && d > 0) {
        const ux=dx/d,uy=dy/d,along=b.vx*ux+b.vy*uy;
        b.x=nx+ux*radius; b.y=ny+uy*radius;
        if(along<0){b.vx-=1.8*along*ux;b.vy-=1.8*along*uy;}
      }
    }
    const tile=course.tiles[Math.floor(b.y)*8+Math.floor(b.x)];
    if(tile==='water') return { ...b,vx:0,vy:0,status:'water' };
    const speed=Math.hypot(b.vx,b.vy);
    if(Math.hypot(b.x-course.hole.x,b.y-course.hole.y)<.22 && speed<2.7) return { ...course.hole,vx:0,vy:0,status:'won' };
    const drag=Math.exp(-(tile==='sand'?3.8:.72)*dt);
    b.vx*=drag; b.vy*=drag;
    if(Math.hypot(b.vx,b.vy)<.08) return { ...b,vx:0,vy:0,status:'idle' };
  }
  return b;
}

// Use the same friction and collision model as the actual shot, ending at the first impact.
export function previewShot(start: Point, velocity: Point, course: Course): Point[] {
  const speed=Math.hypot(velocity.x,velocity.y);
  if(speed<.15)return [start];
  const factor=Math.min(1,9/speed);
  let b:Ball={...start,vx:velocity.x*factor,vy:velocity.y*factor,status:'moving'};
  const points:Point[]=[start];
  for(let i=0;i<480;i++){
    const next=stepBall(b,course,1/60);
    const cross=Math.abs(b.vx*next.vy-b.vy*next.vx);
    if(cross>1e-5||b.vx*next.vx+b.vy*next.vy<0){points.push({x:b.x,y:b.y});break;}
    if(i%4===0||next.status!=='moving')points.push({x:next.x,y:next.y});
    b=next;if(b.status!=='moving')break;
  }
  return points;
}
