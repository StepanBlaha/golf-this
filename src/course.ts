export type Tile = 'grass' | 'wall' | 'sand' | 'water';
export type Point = { x: number; y: number };
export type Course = { name: string; tiles: Tile[]; start: Point; hole: Point; par: number; challenge?: number };
export const size = 8;
const at = (x: number, y: number) => y * size + x;
export function preset(index = 0): Course {
  const course: Course = { name: ['A little detour', 'Across the blue', 'Sunday afternoon'][index] ?? 'A little detour', tiles: Array<Tile>(64).fill('grass'), start: { x: 1.5, y: 6.5 }, hole: { x: 6.5, y: 1.5 }, par: 3 };
  const place = (type: Tile, coords: number[][]) => coords.forEach(([x,y]) => { course.tiles[at(x,y)] = type; });
  if (index === 0) { place('wall', [[3,2],[3,3],[3,4],[4,4],[5,4]]); place('sand',[[1,1],[2,1],[1,2],[6,6],[6,5]]); }
  if (index === 1) { place('water',[[2,2],[3,2],[4,2],[2,3],[3,3],[4,3]]); place('wall',[[5,5],[6,5]]); place('sand',[[1,4],[1,5]]); }
  if (index === 2) { place('sand',[[3,2],[4,2],[3,3],[4,3]]); course.par=2; }
  return course;
}
export function decodeCourse(hash: string): Course | null {
  try {
    if (hash.length > 5000) return null;
    const value: unknown = JSON.parse(decodeURIComponent(hash.replace(/^#/, '')));
    if (!value || typeof value !== 'object') return null;
    const c = value as Course;
    const point = (p: Point) => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= .5 && p.x <= 7.5 && p.y >= .5 && p.y <= 7.5;
    if (typeof c.name !== 'string' || c.name.length > 48 || !Array.isArray(c.tiles) || c.tiles.length !== 64 || !c.tiles.every(t => ['grass','wall','sand','water'].includes(t)) || !point(c.start) || !point(c.hole) || !Number.isInteger(c.par) || c.par < 1 || c.par > 9) return null;
    if (c.challenge !== undefined && (!Number.isInteger(c.challenge) || c.challenge < 1 || c.challenge > 10000)) return null;
    if (Math.hypot(c.start.x-c.hole.x,c.start.y-c.hole.y)<.7) return null;
    if (c.tiles[at(Math.floor(c.start.x), Math.floor(c.start.y))] !== 'grass' || c.tiles[at(Math.floor(c.hole.x),Math.floor(c.hole.y))] !== 'grass') return null;
    return c;
  } catch { return null; }
}
export const encodeCourse = (course: Course) => `#${encodeURIComponent(JSON.stringify(course))}`;
export const screen = (p: Point) => ({ x: 330 + (p.x - p.y) * 34, y: 48 + (p.x + p.y) * 18 });
export const world = (p: Point) => ({ x: ((p.x-330)/34+(p.y-48)/18)/2, y: ((p.y-48)/18-(p.x-330)/34)/2 });

// Keep a clear staircase route so every generated layout can be completed.
export function randomCourse(random = Math.random): Course {
  const c = preset(2);
  c.name = ['Pocket paradise', 'The zigzag club', 'Mint condition', 'Splash landing', 'Lucky links'][Math.floor(random()*5)];
  c.start={x:.5,y:7.5}; c.hole={x:7.5,y:.5}; c.par=5;
  c.tiles=Array.from({length:64},()=>{const r=random();return r<.16?'wall':r<.29?'water':r<.39?'sand':'grass';});
  let x=0,y=7;c.tiles[y*8+x]='grass';
  while(x<7||y>0){if(x<7&&(y===0||random()<.5))x++;else y--;c.tiles[y*8+x]='grass';}
  return c;
}
