export function ToolIcon({kind}:{kind:string}) {
  const color=kind==='water'?'#37bbef':kind==='sand'?'#ffdc76':'#81de7b';
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="m4 26 20 11 20-11v5L24 42 4 31Z" fill={kind==='water'?'#1592cb':kind==='sand'?'#d5a740':'#38aa68'}/>
    <path d="m4 26 20-11 20 11-20 11Z" fill={color}/>
    {kind==='grass'&&<path d="m15 26 3-5 1 6m7 2 3-5 1 4" stroke="#339c50" strokeWidth="2" strokeLinecap="round"/>}
    {kind==='water'&&<path d="m13 26 6 3m4-7 8 4m-8 6 6 3" stroke="#c6f4ff" strokeWidth="2" strokeLinecap="round"/>}
    {kind==='sand'&&<g fill="#c39739"><circle cx="16" cy="26" r="1.3"/><circle cx="27" cy="24" r="1.3"/><circle cx="27" cy="31" r="1.3"/></g>}
    {kind==='wall'&&<><path d="m10 16 14 8 14-8v13l-14 8-14-8Z" fill="#9578e4"/><path d="m24 24 14-8v13l-14 8Z" fill="#7b62cd"/><path d="m10 16 14-8 14 8-14 8Z" fill="#c6a7ff"/></>}
    {kind==='start'&&<><ellipse cx="24" cy="29" rx="7" ry="3" fill="#38aa68"/><circle cx="24" cy="23" r="7" fill="white"/><path d="M27 20a5 5 0 0 1-1 7" stroke="#dde4ee" strokeWidth="2" strokeLinecap="round"/></>}
    {kind==='hole'&&<><ellipse cx="23" cy="28" rx="6" ry="3" fill="#23325b"/><path d="M23 28V5" stroke="#23325b" strokeWidth="2.5" strokeLinecap="round"/><path d="m24 5 14 5-14 6Z" fill="#ff6259"/></>}
  </svg>;
}
export function Logo(){return <svg viewBox="0 0 56 56" fill="none" aria-hidden="true"><path d="m4 32 24 13 24-13v6L28 51 4 38Z" fill="#278e61"/><path d="m4 32 24-13 24 13-24 13Z" fill="#81de7b"/><ellipse cx="31" cy="31" rx="6" ry="3" fill="#23325b"/><path d="M31 31V6" stroke="#23325b" strokeWidth="3" strokeLinecap="round"/><path d="m32 6 17 6-17 7Z" fill="#ff6259"/><circle cx="18" cy="32" r="5" fill="white"/></svg>}

export function ActionIcon({kind='arrow'}:{kind?:'arrow'|'share'|'play'|'undo'|'restart'}) {
  return <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind==='play'?<path d="m9 5 10 7-10 7Z" fill="currentColor" stroke="none"/>:
      kind==='share'?<><path d="M12 15V3m-5 5 5-5 5 5"/><path d="M5 14v6h14v-6"/></>:
      kind==='undo'?<><path d="m8 5-5 5 5 5"/><path d="M3 10h10a7 7 0 0 1 7 7v2"/></>:
      kind==='restart'?<><path d="M4 4v6h6"/><path d="M4 10a8 8 0 1 1 1 8"/></>:
      <path d="M4 12h16m-6-6 6 6-6 6"/>}
  </svg>;
}
