import sharp from 'sharp';
const root=new URL('../',import.meta.url);
const point=(x,y,z=0)=>`${750+(x-y)*42},${160+(x+y)*23-z}`;
const poly=(points,fill)=>`<polygon points="${points.join(' ')}" fill="${fill}"/>`;
let scene=poly([point(0,0,-35),point(8,0,-35),point(8,8,-35),point(0,8,-35)],'#3578d6');
scene+=poly([point(0,8),point(8,8),point(8,8,-23),point(0,8,-23)],'#38aa68');
scene+=poly([point(8,0),point(8,8),point(8,8,-23),point(8,0,-23)],'#278e61');
for(let sum=0;sum<15;sum++)for(let x=0;x<8;x++){const y=sum-x;if(y<0||y>7)continue;const water=x>=4&&x<=5&&y>=1&&y<=3;const sand=x===2&&y>=2&&y<=5;
scene+=poly([point(x,y),point(x+1,y),point(x+1,y+1),point(x,y+1)],water?'#37bbef':sand?'#ffdc76':sum%2?'#71d56e':'#81de7b');
if(water){const [cx,cy]=point(x+.5,y+.5).split(',').map(Number);scene+=`<path d="M${cx-12} ${cy-3}l12 6m2-8 10 5" fill="none" stroke="#b5f1ff" stroke-width="2"/>`;}
if(x===4&&y>=4&&y<=6){scene+=poly([point(x+1,y,32),point(x+1,y+1,32),point(x+1,y+1),point(x+1,y)],'#7b62cd')+poly([point(x,y+1,32),point(x+1,y+1,32),point(x+1,y+1),point(x,y+1)],'#9578e4')+poly([point(x,y,32),point(x+1,y,32),point(x+1,y+1,32),point(x,y+1,32)],'#c6a7ff');}}
const [hx,hy]=point(6.5,1.5).split(',').map(Number);const [bx,by]=point(1.5,6.5).split(',').map(Number);
scene+=`<ellipse cx="${hx}" cy="${hy}" rx="10" ry="5" fill="#23325b"/><path d="M${hx} ${hy}v-75" stroke="#23325b" stroke-width="3"/><path d="M${hx+1} ${hy-75}l39 13-39 13Z" fill="#ff6259"/><ellipse cx="${bx+2}" cy="${by+2}" rx="9" ry="4" fill="#38aa68"/><circle cx="${bx}" cy="${by-7}" r="9" fill="white"/>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#448bea"/><text x="65" y="150" fill="white" font-family="Arial,sans-serif" font-size="78" font-weight="900" letter-spacing="-4">golf this!</text><text x="70" y="220" fill="white" font-family="Arial,sans-serif" font-size="29" font-weight="700">Build. Putt. Repeat.</text><rect x="70" y="265" width="196" height="53" rx="15" fill="#d9af3e"/><rect x="70" y="260" width="196" height="53" rx="15" fill="#ffda69"/><text x="93" y="294" fill="#23325b" font-family="Arial,sans-serif" font-size="21" font-weight="700">Your tiny course</text>${scene}<text x="70" y="575" fill="white" font-family="Arial,sans-serif" font-size="19">Make it yours. Send a challenge.</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('public/og.png',root).pathname);
