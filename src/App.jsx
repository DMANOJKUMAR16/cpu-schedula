import { useState, useEffect, useRef, useCallback } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0c0e12;
  --bg1:      #111318;
  --bg2:      #161a22;
  --bg3:      #1c212c;
  --bg4:      #232834;
  --line:     rgba(255,255,255,0.06);
  --line2:    rgba(255,255,255,0.10);
  --t1:       #eef0f5;
  --t2:       #7c8494;
  --t3:       #454d5c;
  --accent:   #f97316;
  --accent2:  rgba(249,115,22,0.12);
  --accent3:  rgba(249,115,22,0.25);
  --blue:     #60a5fa;
  --blue2:    rgba(96,165,250,0.12);
  --teal:     #2dd4bf;
  --teal2:    rgba(45,212,191,0.12);
  --green:    #4ade80;
  --green2:   rgba(74,222,128,0.12);
  --rose:     #fb7185;
  --rose2:    rgba(251,113,133,0.12);
  --purple:   #c084fc;
  --purple2:  rgba(192,132,252,0.12);
  --yellow:   #fbbf24;
  --yellow2:  rgba(251,191,36,0.12);
  --r8:  8px;
  --r12: 12px;
  --r16: 16px;
  --sans: 'Outfit', sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --sidebar: 240px;
  --header:  52px;
}

html, body { height: 100%; overflow: hidden; }
body { font-family: var(--sans); background: var(--bg); color: var(--t1); line-height: 1.6; font-size: 14px; }
#root { height: 100%; }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--t3); }

@keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
@keyframes popIn    { 0%{opacity:0;transform:scale(.82)} 65%{transform:scale(1.04)} 100%{opacity:1;transform:scale(1)} }
@keyframes slideIn  { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
@keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes pulse    { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes cpuGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,.2)} 50%{box-shadow:0 0 20px 4px rgba(249,115,22,.35)} }
@keyframes shimmer  { 0%{background-position:-300% center} 100%{background-position:300% center} }
@keyframes barFill  { from{width:0} to{width:var(--w,100%)} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes bounce   { 0%{transform:scale(0)} 60%{transform:scale(1.18)} 100%{transform:scale(1)} }
@keyframes runningDot { 0%,100%{opacity:.3} 50%{opacity:1} }
`;

/* ── colours per process ─────────────────────────────────── */
const PC = [
  { bg:"#f97316", t:"#fff", glow:"rgba(249,115,22,.5)",  dim:"rgba(249,115,22,.14)" },
  { bg:"#60a5fa", t:"#fff", glow:"rgba(96,165,250,.5)",  dim:"rgba(96,165,250,.14)" },
  { bg:"#2dd4bf", t:"#000", glow:"rgba(45,212,191,.5)",  dim:"rgba(45,212,191,.14)" },
  { bg:"#c084fc", t:"#fff", glow:"rgba(192,132,252,.5)", dim:"rgba(192,132,252,.14)" },
  { bg:"#fbbf24", t:"#000", glow:"rgba(251,191,36,.5)",  dim:"rgba(251,191,36,.14)" },
];

/* ── default processes ───────────────────────────────────── */
const BASE_PROCS = [
  { id:"P1", arrival:0, burst:5, color:PC[0] },
  { id:"P2", arrival:1, burst:3, color:PC[1] },
  { id:"P3", arrival:2, burst:8, color:PC[2] },
  { id:"P4", arrival:3, burst:2, color:PC[3] },
];

/* ── scheduling algorithms ───────────────────────────────── */
function runFCFS(procs) {
  const sorted = [...procs].sort((a,b)=>a.arrival-b.arrival);
  const steps=[]; let t=0;
  for(const p of sorted){
    if(t<p.arrival) t=p.arrival;
    steps.push({ pid:p.id, start:t, end:t+p.burst, color:p.color,
      note:`${p.id} runs next — it arrived at t=${p.arrival}, earliest in the queue. FCFS never reorders.` });
    t+=p.burst;
  }
  return steps;
}
function runSJF(procs) {
  const ps=procs.map(p=>({...p,done:false}));
  const steps=[]; let t=0; let guard=0;
  while(ps.some(p=>!p.done)&&guard++<200){
    const avail=ps.filter(p=>!p.done&&p.arrival<=t);
    if(!avail.length){t++;continue;}
    const pick=avail.reduce((a,b)=>a.burst<b.burst?a:b);
    steps.push({ pid:pick.id, start:t, end:t+pick.burst, color:pick.color,
      note:`${pick.id} runs next — burst time is ${pick.burst}, the shortest among ${avail.length} ready process${avail.length>1?"es":""}. SJF minimises wait.` });
    t+=pick.burst;
    ps.find(p=>p.id===pick.id).done=true;
  }
  return steps;
}
function runRR(procs, q) {
  const ps=procs.map(p=>({...p,rem:p.burst}));
  const steps=[]; let t=0; const queue=[]; const seen=new Set();
  const enqueue=(time)=>ps.forEach(p=>{if(p.arrival<=time&&!seen.has(p.id)&&p.rem>0){queue.push(p);seen.add(p.id);}});
  enqueue(0);
  let guard=0;
  while((queue.length||ps.some(p=>p.rem>0))&&guard++<500){
    if(!queue.length){t++;enqueue(t);continue;}
    const p=queue.shift();
    const exec=Math.min(q,p.rem);
    steps.push({ pid:p.id, start:t, end:t+exec, color:p.color,
      note:`${p.id} gets a ${exec}-unit slice (quantum=${q}). After this, it ${p.rem-exec>0?`has ${p.rem-exec} units left and rejoins the queue`:"completes"}.` });
    t+=exec; p.rem-=exec;
    enqueue(t);
    if(p.rem>0) queue.push(p);
  }
  return steps;
}

/* ── tiny helpers ─────────────────────────────────────────── */
const Tag = ({children,color="#f97316"}) => (
  <span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,
    fontSize:11,fontWeight:600,background:`${color}18`,color,border:`1px solid ${color}30`,
    fontFamily:"var(--mono)",letterSpacing:".04em"}}>
    {children}
  </span>
);

const SectionLabel = ({children}) => (
  <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--t3)",letterSpacing:".12em",
    textTransform:"uppercase",marginBottom:8}}>
    {children}
  </div>
);

const Divider = () => (
  <div style={{height:1,background:"var(--line)",margin:"40px 0"}} />
);

/* ── NAV ITEMS ────────────────────────────────────────────── */
const NAV = [
  { id:"intro",    label:"Introduction",   icon:"◎", tag:"START" },
  { id:"concepts", label:"Core Concepts",  icon:"◈", tag:"6 TERMS" },
  { id:"fcfs",     label:"FCFS",           icon:"→", tag:"ALGORITHM" },
  { id:"sjf",      label:"SJF",            icon:"↓", tag:"ALGORITHM" },
  { id:"rr",       label:"Round Robin",    icon:"↻", tag:"ALGORITHM" },
  { id:"lab",      label:"Live Simulator", icon:"⬡", tag:"LAB"  },
  { id:"quiz",     label:"Quiz",           icon:"◇", tag:"4 Qs" },
];

const CHAPTER_IDS = NAV.map(n=>n.id);
/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */
function Sidebar({ active, onNav, progress }) {
  return (
    <aside style={{
      width:"var(--sidebar)", flexShrink:0, height:"100%",
      borderRight:"1px solid var(--line)", background:"var(--bg1)",
      display:"flex", flexDirection:"column", userSelect:"none",
    }}>
      {/* brand */}
      <div style={{padding:"16px 20px", borderBottom:"1px solid var(--line)",
        display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:30,height:30,borderRadius:8,
          background:"linear-gradient(135deg,var(--accent),#f43f5e)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:13,fontWeight:800,color:"#fff",flexShrink:0}}>C</div>
        <div>
          <div style={{fontSize:13,fontWeight:700,lineHeight:1.2}}>Coding Pro</div>
          <div style={{fontSize:10,color:"var(--t3)",letterSpacing:".08em"}}>OS · CPU SCHEDULING</div>
        </div>
      </div>

      {/* progress bar */}
      <div style={{padding:"12px 20px",borderBottom:"1px solid var(--line)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:"var(--t3)"}}>Module progress</span>
          <span style={{fontSize:11,color:"var(--accent)",fontFamily:"var(--mono)"}}>{progress}%</span>
        </div>
        <div style={{height:3,borderRadius:2,background:"var(--bg3)"}}>
          <div style={{height:"100%",borderRadius:2,background:"var(--accent)",
            width:`${progress}%`,transition:"width .5s ease"}} />
        </div>
      </div>

      {/* nav */}
      <nav style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
        <div style={{fontSize:10,color:"var(--t3)",letterSpacing:".1em",
          padding:"8px 10px 4px",textTransform:"uppercase"}}>Learning Path</div>
        {NAV.map((item,i) => {
          const isActive = active===item.id;
          const isDone   = NAV.findIndex(n=>n.id===active) > i;
          return (
            <button key={item.id} onClick={()=>onNav(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,
                padding:"8px 10px",borderRadius:"var(--r8)",border:"none",cursor:"pointer",
                background: isActive ? "var(--accent2)" : "transparent",
                borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                color: isActive ? "var(--t1)" : isDone ? "var(--t2)" : "var(--t2)",
                textAlign:"left",transition:"all .15s ease",marginBottom:2,
              }}
              onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="rgba(255,255,255,.04)"; }}
              onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background="transparent"; }}>
              <span style={{
                width:22,height:22,borderRadius:6,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,
                background: isActive ? "var(--accent)" : isDone ? "var(--green2)" : "var(--bg3)",
                color: isActive ? "#fff" : isDone ? "var(--green)" : "var(--t3)",
                fontFamily:"var(--mono)",fontWeight:600,
              }}>
                {isDone ? "✓" : i+1}
              </span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight: isActive?600:400,
                  color: isActive?"var(--t1)":"var(--t2)"}}>{item.label}</div>
                <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>{item.tag}</div>
              </div>
              {isActive&&<div style={{width:5,height:5,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>}
            </button>
          );
        })}
      </nav>

      {/* footer */}
      <div style={{padding:"14px 20px",borderTop:"1px solid var(--line)"}}>
        <div style={{fontSize:10,color:"var(--t3)",marginBottom:8}}>Continue Learning</div>
        {["Memory Management","Process Synchronization"].map(t=>(
          <a key={t} href="#" style={{display:"block",fontSize:11,color:"var(--t2)",
            textDecoration:"none",padding:"4px 0",transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--t2)"}>
            → {t}
          </a>
        ))}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   HEADER BAR
═══════════════════════════════════════════════════════════ */
function Header({ chapter, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <header style={{height:"var(--header)",borderBottom:"1px solid var(--line)",
      display:"flex",alignItems:"center",padding:"0 28px",gap:16,
      background:"var(--bg1)",flexShrink:0}}>
      <Tag color="var(--accent)">CHAPTER {chapter.num}</Tag>
      <span style={{fontSize:15,fontWeight:600,color:"var(--t1)"}}>{chapter.label}</span>
      <span style={{fontSize:13,color:"var(--t3)"}}>{chapter.sub}</span>
      <div style={{marginLeft:"auto",display:"flex",gap:8}}>
        <button onClick={onPrev} disabled={!hasPrev}
          style={{padding:"5px 14px",borderRadius:6,border:"1px solid var(--line2)",
            background:"transparent",color:hasPrev?"var(--t2)":"var(--t3)",
            cursor:hasPrev?"pointer":"not-allowed",fontSize:12,transition:"all .15s"}}
          onMouseEnter={e=>{ if(hasPrev) e.currentTarget.style.background="var(--bg3)";}}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          ← Prev
        </button>
        <button onClick={onNext} disabled={!hasNext}
          style={{padding:"5px 14px",borderRadius:6,border:"1px solid var(--accent3)",
            background: hasNext?"var(--accent2)":"transparent",
            color:hasNext?"var(--accent)":"var(--t3)",
            cursor:hasNext?"pointer":"not-allowed",fontSize:12,fontWeight:500,transition:"all .15s"}}>
          Next →
        </button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: INTRO
═══════════════════════════════════════════════════════════ */
function LiveProcessFlow() {
  const [tick, setTick] = useState(0);
  useEffect(()=>{
    const id=setInterval(()=>setTick(t=>(t+1)%100),140);
    return ()=>clearInterval(id);
  },[]);

  const procs=[
    {id:"P1",offset:0,  speed:1.8,color:PC[0]},
    {id:"P2",offset:30, speed:1.3,color:PC[1]},
    {id:"P3",offset:60, speed:1.0,color:PC[2]},
  ];

  return (
    <div style={{height:100,borderRadius:"var(--r12)",border:"1px solid var(--line)",
      background:"var(--bg2)",position:"relative",overflow:"hidden",marginTop:28}}>
      {/* track line */}
      <div style={{position:"absolute",top:"50%",left:20,right:90,height:1,
        background:"var(--line2)",transform:"translateY(-50%)"}}/>
      {/* CPU box */}
      <div style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
        width:58,height:58,borderRadius:10,border:"1.5px solid var(--accent)",
        background:"rgba(249,115,22,.07)",display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",gap:3,
        animation:"cpuGlow 2.2s ease-in-out infinite"}}>
        <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:".06em"}}>CPU</span>
        <div style={{display:"flex",gap:2}}>
          {[0,1,2,3].map(n=>(
            <div key={n} style={{width:6,height:6,borderRadius:1,
              background:"var(--accent)",
              opacity:(tick%4===n)?1:.15,transition:"opacity .1s"}}/>
          ))}
        </div>
      </div>
      {/* processes */}
      {procs.map((p)=>{
        const x = ((tick*p.speed + p.offset) % 100);
        const px = Math.min(x/100*260+20, 240);
        return (
          <div key={p.id} style={{position:"absolute",top:"50%",
            left:px, transform:"translateY(-50%)",
            width:36,height:36,borderRadius:9,
            background:p.color.bg,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:600,color:p.color.t,
            boxShadow:`0 0 14px ${p.color.glow}`,
            transition:"left .14s linear"}}>
            {p.id}
          </div>
        );
      })}
    </div>
  );
}

function IntroChapter() {
  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <SectionLabel>Operating Systems · Module 3</SectionLabel>
      <h1 style={{fontSize:"clamp(30px,4.5vw,52px)",fontWeight:800,
        letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:16}}>
        CPU Scheduling
      </h1>
      <p style={{fontSize:17,color:"var(--t2)",maxWidth:560,lineHeight:1.75,marginBottom:8}}>
        Your computer runs dozens of programs simultaneously.
        But the CPU can only execute <span style={{color:"var(--t1)",fontWeight:500}}>one process at a time.</span>
      </p>
      <p style={{fontSize:17,color:"var(--t2)",maxWidth:560,lineHeight:1.75}}>
        CPU Scheduling is the set of algorithms that decide{" "}
        <span style={{color:"var(--accent)",fontWeight:600}}>which process runs next, and for how long.</span>
      </p>

      <LiveProcessFlow />

      <Divider />

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:600}}>
        {[
          {label:"The Problem",   body:"Multiple processes compete for a single CPU resource.",  color:"var(--rose)"},
          {label:"The Goal",      body:"Maximize CPU utilization and minimize waiting time.",     color:"var(--green)"},
          {label:"The Solution",  body:"Scheduling algorithms that decide execution order.",      color:"var(--accent)"},
        ].map(card=>(
          <div key={card.label} style={{padding:"16px 18px",borderRadius:"var(--r12)",
            border:`1px solid ${card.color}25`,background:`${card.color}08`}}>
            <div style={{fontSize:10,color:card.color,fontFamily:"var(--mono)",
              letterSpacing:".1em",marginBottom:6}}>{card.label.toUpperCase()}</div>
            <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.55}}>{card.body}</div>
          </div>
        ))}
      </div>

      <Divider />

      <div style={{padding:"18px 20px",borderRadius:"var(--r12)",border:"1px solid var(--line2)",
        background:"var(--bg2)",maxWidth:560}}>
        <div style={{fontSize:12,color:"var(--t3)",marginBottom:6}}>Why is this hard to learn?</div>
        <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>
          Textbooks describe scheduling with static Gantt charts.
          Without seeing processes move, wait, and execute in real time — the mental model never fully forms.
          This module fixes that.
        </p>
      </div>

      <div style={{marginTop:36,padding:"14px 20px",borderRadius:"var(--r8)",
        border:"1px solid var(--line)",display:"inline-flex",alignItems:"center",gap:8}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",
          animation:"pulse 2s ease infinite"}}/>
        <span style={{fontSize:12,color:"var(--t2)"}}>
          Explore interactive operating system concepts on{" "}
          <a href="#" style={{color:"var(--accent)",textDecoration:"none"}}
            onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"}
            onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
            Coding Pro
          </a>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: CORE CONCEPTS
═══════════════════════════════════════════════════════════ */
const CONCEPTS = [
  { id:"process",  label:"Process",      color:"var(--accent)", icon:"⬡",
    body:"A program currently in execution. Each process has its own memory space, state, and needs CPU time to complete.",
    visual:"process" },
  { id:"burst",    label:"Burst Time",   color:"var(--blue)", icon:"⏱",
    body:"The total CPU time a process needs to finish. Processes with short burst times complete quickly; long bursts take more time.",
    visual:"burst" },
  { id:"arrival",  label:"Arrival Time", color:"var(--teal)", icon:"→",
    body:"The moment a process enters the ready queue and becomes eligible for CPU scheduling.",
    visual:"arrival" },
  { id:"queue",    label:"Ready Queue",  color:"var(--purple)", icon:"▦",
    body:"A list of all processes that are loaded in memory, ready to execute, waiting for CPU time to be allocated.",
    visual:"queue" },
  { id:"waiting",  label:"Waiting Time", color:"var(--yellow)", icon:"⌛",
    body:"Total time a process spends in the ready queue waiting before it actually gets to execute on the CPU.",
    visual:"waiting" },
  { id:"turnaround",label:"Turnaround",  color:"var(--rose)", icon:"↺",
    body:"Total time from process arrival to completion. Turnaround = Burst Time + Waiting Time. A key performance metric.",
    visual:"turnaround" },
];

function ConceptVisual({ id, color }) {
  const [t, setT] = useState(0);
  useEffect(()=>{const id2=setInterval(()=>setT(v=>v+1),220);return()=>clearInterval(id2);},[]);

  const base = {
    width:"100%",minHeight:150,borderRadius:"var(--r12)",
    border:"1px solid var(--line)",background:"var(--bg3)",
    display:"flex",alignItems:"center",justifyContent:"center",
    padding:"20px",position:"relative",overflow:"hidden",
  };

  if(id==="process") return (
    <div style={base}>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        {PC.slice(0,4).map((c,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div style={{width:42,height:42,borderRadius:10,background:c.bg,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:600,color:c.t,
              boxShadow:`0 0 16px ${c.glow}`,
              animation:`float ${2+i*.3}s ease-in-out ${i*.2}s infinite`}}>
              P{i+1}
            </div>
            <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>proc</span>
          </div>
        ))}
      </div>
    </div>
  );

  if(id==="burst") return (
    <div style={base}>
      <div style={{display:"flex",gap:20,alignItems:"flex-end",paddingBottom:16}}>
        {[{id:"P1",b:2,c:PC[0]},{id:"P2",b:6,c:PC[1]},{id:"P3",b:4,c:PC[2]}].map(p=>(
          <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>{p.b}u</span>
            <div style={{width:32,borderRadius:"4px 4px 0 0",
              height:p.b*14,background:p.c.bg,
              boxShadow:`0 0 12px ${p.c.glow}`,transition:"height .4s"}}/>
            <span style={{fontSize:10,color:"var(--t2)",fontWeight:500}}>{p.id}</span>
          </div>
        ))}
      </div>
      <div style={{position:"absolute",bottom:8,fontSize:10,color:"var(--t3)"}}>
        Short burst → faster completion
      </div>
    </div>
  );

  if(id==="arrival") return (
    <div style={base}>
      <div style={{width:"88%",position:"relative",paddingBottom:28}}>
        <div style={{height:1,background:"var(--line2)",position:"relative"}}>
          {[{p:"P1",t:0,c:PC[0]},{p:"P2",t:2,c:PC[1]},{p:"P3",t:5,c:PC[2]}].map((a,i)=>(
            <div key={a.p} style={{position:"absolute",left:`${a.t*14}%`,
              display:"flex",flexDirection:"column",alignItems:"center",transform:"translateX(-50%)"}}>
              <div style={{width:32,height:32,borderRadius:8,background:a.c.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:10,fontWeight:600,color:a.c.t,marginBottom:6,
                boxShadow:`0 0 10px ${a.c.glow}`}}>{a.p}</div>
              <div style={{width:1,height:14,background:"var(--line2)"}}/>
              <span style={{fontSize:10,color:"var(--t3)",marginTop:4,fontFamily:"var(--mono)"}}>t={a.t}</span>
            </div>
          ))}
        </div>
        <div style={{position:"absolute",bottom:0,right:0,fontSize:10,color:"var(--t3)"}}>
          time →
        </div>
      </div>
    </div>
  );

  if(id==="queue") return (
    <div style={base}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:10,color:"var(--t3)",marginRight:4,fontFamily:"var(--mono)"}}>QUEUE</span>
        {PC.slice(0,4).map((c,i)=>{
          const active=i < (3 - (t%3===0?0:t%3>1?1:0));
          return (
            <div key={i} style={{width:34,height:34,borderRadius:8,background:c.bg,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:10,fontWeight:600,color:c.t,
              opacity:active?1:.25,
              transform:active?"scale(1)":"scale(.88)",
              transition:"all .35s ease",
              boxShadow:active?`0 0 10px ${c.glow}`:"none"}}>
              P{i+1}
            </div>
          );
        })}
        <span style={{fontSize:16,color:"var(--t3)",marginLeft:4}}>→</span>
        <div style={{width:44,height:44,borderRadius:10,border:"1.5px solid var(--accent)",
          background:"rgba(249,115,22,.07)",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:10,color:"var(--accent)",
          fontFamily:"var(--mono)",animation:"cpuGlow 2s ease infinite"}}>CPU</div>
      </div>
    </div>
  );

  if(id==="waiting") return (
    <div style={base}>
      <div style={{width:"90%"}}>
        {[{p:"P2",w:5,c:PC[1]},{p:"P3",w:8,c:PC[2]},{p:"P4",w:6,c:PC[3]}].map(item=>(
          <div key={item.p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <div style={{width:26,height:26,borderRadius:6,background:item.c.bg,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:9,fontWeight:600,color:item.c.t,flexShrink:0}}>{item.p}</div>
            <div style={{flex:1,height:5,borderRadius:3,background:"var(--bg4)"}}>
              <div style={{
                "--w":`${item.w*9}%`,
                height:"100%",borderRadius:3,background:item.c.bg,
                animation:"barFill 1.2s ease forwards"}}/>
            </div>
            <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",minWidth:24}}>{item.w}u</span>
          </div>
        ))}
        <div style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginTop:4}}>
          waiting time per process
        </div>
      </div>
    </div>
  );

  if(id==="turnaround") return (
    <div style={base}>
      <div style={{width:"88%"}}>
        <div style={{display:"flex",gap:0,height:28,borderRadius:6,overflow:"hidden",marginBottom:10}}>
          <div style={{flex:3,background:"var(--accent)",display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:10,fontWeight:600,color:"#fff"}}>Wait (3)</div>
          <div style={{flex:4,background:PC[1].bg,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:10,fontWeight:600,color:"#fff"}}>Burst (4)</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <div style={{height:2,flex:1,background:"var(--line2)"}}/>
          <span style={{fontSize:10,color:"var(--t2)",fontFamily:"var(--mono)"}}>Turnaround = 7 units</span>
          <div style={{height:2,flex:1,background:"var(--line2)"}}/>
        </div>
        <div style={{fontSize:10,color:"var(--t3)",textAlign:"center",marginTop:6}}>
          arrival → completion
        </div>
      </div>
    </div>
  );

  return <div style={{...base,minHeight:100}}/>;
}

function ConceptsChapter() {
  const [active,setActive]=useState("process");
  const concept=CONCEPTS.find(c=>c.id===active);
  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <SectionLabel>Core Concepts</SectionLabel>
      <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,
        letterSpacing:"-0.025em",marginBottom:8}}>
        The building blocks
      </h2>
      <p style={{fontSize:15,color:"var(--t2)",marginBottom:28,maxWidth:500}}>
        Click any concept to see an interactive explanation.
      </p>

      {/* pills */}
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:32}}>
        {CONCEPTS.map(c=>(
          <button key={c.id} onClick={()=>setActive(c.id)}
            style={{padding:"7px 16px",borderRadius:40,border:`1px solid ${active===c.id?c.color:"var(--line2)"}`,
              background:active===c.id?`${c.color}15`:"transparent",
              color:active===c.id?c.color:"var(--t2)",
              cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .18s ease",
              fontFamily:"var(--sans)"}}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* detail panel */}
      <div key={active} style={{display:"grid",gridTemplateColumns:"1fr 1fr",
        gap:20,animation:"fadeUp .3s ease both"}}>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:12}}>
          <Tag color={concept.color}>{concept.label.toUpperCase()}</Tag>
          <p style={{fontSize:16,color:"var(--t1)",lineHeight:1.72}}>{concept.body}</p>
          <div style={{fontSize:12,color:"var(--t3)",fontFamily:"var(--mono)",
            padding:"8px 12px",borderRadius:6,background:"var(--bg2)",
            border:"1px solid var(--line)"}}>
            key_term: <span style={{color:concept.color}}>{concept.id}</span>
          </div>
        </div>
        <ConceptVisual id={active} color={concept.color}/>
      </div>

      <Divider />
      <a href="#" style={{fontSize:12,color:"var(--t3)",textDecoration:"none",
        display:"inline-flex",alignItems:"center",gap:6,transition:"color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"}
        onMouseLeave={e=>e.currentTarget.style.color="var(--t3)"}>
        Explore more visual learning labs on Coding Pro →
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED: ALGO ANIMATED VISUAL
═══════════════════════════════════════════════════════════ */
function AlgoVisual({ steps, currentStep }) {
  if(!steps.length) return null;
  const maxEnd = Math.max(...steps.map(s=>s.end));
  return (
    <div style={{marginTop:20}}>
      <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
        letterSpacing:".08em",marginBottom:8}}>GANTT TIMELINE</div>
      <div style={{borderRadius:"var(--r8)",overflow:"hidden",border:"1px solid var(--line)"}}>
        <div style={{display:"flex",height:36}}>
          {steps.map((s,i)=>(
            <div key={i} style={{
              width:`${((s.end-s.start)/maxEnd)*100}%`,
              background: i<=currentStep ? s.color.bg : `${s.color.bg}28`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,fontWeight:600,color:"#fff",
              borderRight:"1px solid rgba(0,0,0,.2)",
              position:"relative",overflow:"hidden",
              transition:"background .4s ease",
            }}>
              {i<=currentStep?s.pid:""}
              {i===currentStep&&(
                <div style={{position:"absolute",inset:0,
                  background:"linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent)",
                  backgroundSize:"300% 100%",animation:"shimmer 1.2s linear infinite"}}/>
              )}
            </div>
          ))}
        </div>
        <div style={{display:"flex",background:"var(--bg2)"}}>
          {steps.map((s,i)=>(
            <div key={i} style={{width:`${((s.end-s.start)/maxEnd)*100}%`,
              textAlign:"right",paddingRight:4,fontSize:9,
              color:"var(--t3)",fontFamily:"var(--mono)",padding:"3px 4px 3px 0"}}>
              {s.end}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: FCFS
═══════════════════════════════════════════════════════════ */
function FCFSChapter() {
  const [step,setStep]=useState(-1);
  const steps=runFCFS(BASE_PROCS);
  const cur=steps[step];

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <Tag color="var(--accent)">ALGORITHM 1</Tag>
      <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,
        letterSpacing:"-0.025em",marginTop:10,marginBottom:6}}>
        First Come, First Served
      </h2>
      <p style={{fontSize:15,color:"var(--t2)",maxWidth:540,lineHeight:1.7,marginBottom:24}}>
        The simplest scheduler. Processes execute in the exact order they arrive —
        no priority, no reordering. Like a queue at a ticket counter.
      </p>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:28}}>
        {[
          {l:"Rule",     v:"Arrival order",      c:"var(--accent)"},
          {l:"Strength", v:"No starvation",      c:"var(--green)"},
          {l:"Weakness", v:"Convoy effect",      c:"var(--rose)"},
          {l:"Preemptive",v:"No",                c:"var(--t3)"},
        ].map(item=>(
          <div key={item.l} style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid var(--line)",background:"var(--bg2)"}}>
            <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:2}}>{item.l}</div>
            <div style={{fontSize:12,color:item.c,fontWeight:500}}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* processes table */}
      <div style={{border:"1px solid var(--line)",borderRadius:"var(--r12)",overflow:"hidden",marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
          padding:"8px 16px",background:"var(--bg3)",
          fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",letterSpacing:".08em",
          borderBottom:"1px solid var(--line)"}}>
          <span>PROCESS</span><span>ARRIVAL</span><span>BURST</span>
        </div>
        {BASE_PROCS.map((p,i)=>(
          <div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
            padding:"10px 16px",borderBottom:i<BASE_PROCS.length-1?"1px solid var(--line)":"none",
            background: cur?.pid===p.id ? `${p.color.bg}12` : "transparent",
            transition:"background .3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:p.color.bg,
                boxShadow:`0 0 6px ${p.color.glow}`}}/>
              <span style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:500}}>{p.id}</span>
            </div>
            <span style={{fontFamily:"var(--mono)",fontSize:13,color:"var(--t2)"}}>t={p.arrival}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:13,color:"var(--t2)"}}>{p.burst} units</span>
          </div>
        ))}
      </div>

      <AlgoVisual steps={steps} currentStep={step}/>

      {/* explanation */}
      {cur&&(
        <div key={step} style={{marginTop:16,padding:"14px 16px",borderRadius:"var(--r8)",
          border:`1px solid ${cur.color.bg}30`,background:`${cur.color.bg}0a`,
          animation:"fadeUp .25s ease both"}}>
          <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:4}}>
            STEP {step+1} / {steps.length}
          </div>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{cur.note}</p>
        </div>
      )}

      {/* controls */}
      <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
        <button onClick={()=>setStep(v=>Math.min(v+1,steps.length-1))}
          disabled={step>=steps.length-1}
          style={{padding:"8px 20px",borderRadius:"var(--r8)",border:"1px solid var(--accent3)",
            background:"var(--accent2)",color:"var(--accent)",cursor:"pointer",
            fontSize:12,fontWeight:500,opacity:step>=steps.length-1?.45:1}}>
          Step Through →
        </button>
        <button onClick={()=>setStep(-1)}
          style={{padding:"8px 16px",borderRadius:"var(--r8)",border:"1px solid var(--line2)",
            background:"transparent",color:"var(--t2)",cursor:"pointer",fontSize:12}}>
          ↺ Reset
        </button>
        {step===steps.length-1&&(
          <div style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid rgba(74,222,128,.25)",background:"var(--green2)",
            fontSize:12,color:"var(--green)",animation:"popIn .35s ease"}}>
            ✓ Simulation complete
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: SJF
═══════════════════════════════════════════════════════════ */
function SJFChapter() {
  const [step,setStep]=useState(-1);
  const steps=runSJF(BASE_PROCS);
  const cur=steps[step];

  const sorted=[...BASE_PROCS].sort((a,b)=>a.burst-b.burst);

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <Tag color="var(--blue)">ALGORITHM 2</Tag>
      <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,
        letterSpacing:"-0.025em",marginTop:10,marginBottom:6}}>
        Shortest Job First
      </h2>
      <p style={{fontSize:15,color:"var(--t2)",maxWidth:540,lineHeight:1.7,marginBottom:24}}>
        Always picks the process with the smallest burst time from the ready queue.
        Provably optimal for average waiting time — but requires knowing burst times upfront.
      </p>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:28}}>
        {[
          {l:"Rule",      v:"Shortest burst first", c:"var(--blue)"},
          {l:"Strength",  v:"Min avg wait time",    c:"var(--green)"},
          {l:"Weakness",  v:"Starvation possible",  c:"var(--rose)"},
          {l:"Preemptive",v:"No (non-preemptive)",  c:"var(--t3)"},
        ].map(item=>(
          <div key={item.l} style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid var(--line)",background:"var(--bg2)"}}>
            <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:2}}>{item.l}</div>
            <div style={{fontSize:12,color:item.c,fontWeight:500}}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* visual: sort by burst */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",
          letterSpacing:".08em",marginBottom:10}}>SJF EXECUTION ORDER (sorted by burst)</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {sorted.map((p,i)=>(
            <div key={p.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{width:44,height:44,borderRadius:10,background:p.color.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:12,fontWeight:600,color:p.color.t,
                boxShadow:`0 0 12px ${p.color.glow}`,
                border: cur?.pid===p.id ? `2px solid #fff` : "2px solid transparent",
                transition:"border .3s"}}>
                {p.id}
              </div>
              <span style={{fontSize:10,fontFamily:"var(--mono)",color:"var(--t3)"}}>
                b={p.burst}
              </span>
              {i<sorted.length-1&&<span style={{fontSize:14,color:"var(--t3)",marginTop:2}}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <AlgoVisual steps={steps} currentStep={step}/>

      {cur&&(
        <div key={step} style={{marginTop:16,padding:"14px 16px",borderRadius:"var(--r8)",
          border:`1px solid ${cur.color.bg}30`,background:`${cur.color.bg}0a`,
          animation:"fadeUp .25s ease both"}}>
          <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:4}}>
            STEP {step+1} / {steps.length}
          </div>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{cur.note}</p>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
        <button onClick={()=>setStep(v=>Math.min(v+1,steps.length-1))}
          disabled={step>=steps.length-1}
          style={{padding:"8px 20px",borderRadius:"var(--r8)",border:"1px solid rgba(96,165,250,.3)",
            background:"rgba(96,165,250,.1)",color:"var(--blue)",cursor:"pointer",
            fontSize:12,fontWeight:500,opacity:step>=steps.length-1?.45:1}}>
          Step Through →
        </button>
        <button onClick={()=>setStep(-1)}
          style={{padding:"8px 16px",borderRadius:"var(--r8)",border:"1px solid var(--line2)",
            background:"transparent",color:"var(--t2)",cursor:"pointer",fontSize:12}}>
          ↺ Reset
        </button>
        {step===steps.length-1&&(
          <div style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid rgba(74,222,128,.25)",background:"var(--green2)",
            fontSize:12,color:"var(--green)",animation:"popIn .35s ease"}}>
            ✓ Simulation complete
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: ROUND ROBIN
═══════════════════════════════════════════════════════════ */
function RRChapter() {
  const [step,setStep]=useState(-1);
  const [q,setQ]=useState(2);
  const steps=runRR(BASE_PROCS,q);
  const cur=steps[step];

  useEffect(()=>setStep(-1),[q]);

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <Tag color="var(--teal)">ALGORITHM 3</Tag>
      <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,
        letterSpacing:"-0.025em",marginTop:10,marginBottom:6}}>
        Round Robin
      </h2>
      <p style={{fontSize:15,color:"var(--t2)",maxWidth:540,lineHeight:1.7,marginBottom:24}}>
        Each process gets a fixed time slice called a <span style={{color:"var(--teal)",fontWeight:500}}>quantum</span>.
        When the quantum expires, the process is preempted and cycles to the back of the queue.
        Fair, but more context switches.
      </p>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:28}}>
        {[
          {l:"Rule",      v:"Fixed time quantum",  c:"var(--teal)"},
          {l:"Strength",  v:"Fair & responsive",   c:"var(--green)"},
          {l:"Weakness",  v:"Context switch cost",  c:"var(--rose)"},
          {l:"Preemptive",v:"Yes",                  c:"var(--yellow)"},
        ].map(item=>(
          <div key={item.l} style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid var(--line)",background:"var(--bg2)"}}>
            <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:2}}>{item.l}</div>
            <div style={{fontSize:12,color:item.c,fontWeight:500}}>{item.v}</div>
          </div>
        ))}
      </div>

      {/* quantum selector */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24,
        padding:"12px 16px",borderRadius:"var(--r8)",border:"1px solid var(--line)",
        background:"var(--bg2)",width:"fit-content"}}>
        <span style={{fontSize:12,color:"var(--t2)"}}>Time Quantum:</span>
        {[1,2,3,4].map(v=>(
          <button key={v} onClick={()=>setQ(v)}
            style={{width:30,height:30,borderRadius:6,border:`1px solid ${q===v?"var(--teal)":"var(--line2)"}`,
              background:q===v?"var(--teal2)":"transparent",
              color:q===v?"var(--teal)":"var(--t3)",
              cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s"}}>
            {v}
          </button>
        ))}
        <span style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",marginLeft:4}}>
          → {steps.length} total slices
        </span>
      </div>

      <AlgoVisual steps={steps} currentStep={step}/>

      {cur&&(
        <div key={`${step}-${q}`} style={{marginTop:16,padding:"14px 16px",borderRadius:"var(--r8)",
          border:`1px solid ${cur.color.bg}30`,background:`${cur.color.bg}0a`,
          animation:"fadeUp .25s ease both"}}>
          <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:4}}>
            SLICE {step+1} / {steps.length} · QUANTUM = {q}
          </div>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{cur.note}</p>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
        <button onClick={()=>setStep(v=>Math.min(v+1,steps.length-1))}
          disabled={step>=steps.length-1}
          style={{padding:"8px 20px",borderRadius:"var(--r8)",border:"1px solid rgba(45,212,191,.3)",
            background:"rgba(45,212,191,.1)",color:"var(--teal)",cursor:"pointer",
            fontSize:12,fontWeight:500,opacity:step>=steps.length-1?.45:1}}>
          Next Slice →
        </button>
        <button onClick={()=>setStep(-1)}
          style={{padding:"8px 16px",borderRadius:"var(--r8)",border:"1px solid var(--line2)",
            background:"transparent",color:"var(--t2)",cursor:"pointer",fontSize:12}}>
          ↺ Reset
        </button>
        {step===steps.length-1&&(
          <div style={{padding:"8px 14px",borderRadius:"var(--r8)",
            border:"1px solid rgba(74,222,128,.25)",background:"var(--green2)",
            fontSize:12,color:"var(--green)",animation:"popIn .35s ease"}}>
            ✓ Simulation complete
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: LIVE SIMULATOR (THE CENTREPIECE)
═══════════════════════════════════════════════════════════ */
function LiveSimulator() {
  const [algo,setAlgo]    = useState("fcfs");
  const [quantum,setQ]    = useState(2);
  const [step,setStep]    = useState(-1);
  const [playing,setPlay] = useState(false);
  const tickRef           = useRef(null);

  const steps = (() => {
    if(algo==="fcfs") return runFCFS(BASE_PROCS);
    if(algo==="sjf")  return runSJF(BASE_PROCS);
    return runRR(BASE_PROCS,quantum);
  })();

  const cur = steps[step];
  const done = step >= steps.length-1;
  const maxEnd = steps.length ? Math.max(...steps.map(s=>s.end)) : 1;

  const reset = useCallback(()=>{ setStep(-1); setPlay(false); },[]);
  useEffect(reset,[algo,quantum]);

  useEffect(()=>{
    if(playing){
      tickRef.current=setInterval(()=>{
        setStep(v=>{
          if(v>=steps.length-1){ setPlay(false); clearInterval(tickRef.current); return v; }
          return v+1;
        });
      },1200);
    } else clearInterval(tickRef.current);
    return ()=>clearInterval(tickRef.current);
  },[playing,steps.length]);

  const ALGO_META = {
    fcfs:{ label:"FCFS", full:"First Come First Served", color:"var(--accent)",  colorRaw:"#f97316" },
    sjf: { label:"SJF",  full:"Shortest Job First",      color:"var(--blue)",    colorRaw:"#60a5fa" },
    rr:  { label:"RR",   full:"Round Robin",             color:"var(--teal)",    colorRaw:"#2dd4bf" },
  };
  const meta = ALGO_META[algo];

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <SectionLabel>Interactive Lab</SectionLabel>
      <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,
        letterSpacing:"-0.025em",marginBottom:8}}>
        Live Simulator
      </h2>
      <p style={{fontSize:15,color:"var(--t2)",maxWidth:520,lineHeight:1.7,marginBottom:28}}>
        Select an algorithm and watch processes move through the CPU in real time.
        Step manually or let autoplay run the full simulation.
      </p>

      {/* ── algo + quantum selector ─────────────────────── */}
      <div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap",alignItems:"center"}}>
        {Object.entries(ALGO_META).map(([key,m])=>(
          <button key={key} onClick={()=>setAlgo(key)}
            style={{padding:"9px 20px",borderRadius:"var(--r8)",
              border:`1px solid ${algo===key?m.colorRaw+"55":"var(--line2)"}`,
              background:algo===key?`${m.colorRaw}15`:"var(--bg2)",
              color:algo===key?m.color:"var(--t2)",
              cursor:"pointer",fontSize:13,fontWeight:500,transition:"all .18s",
              fontFamily:"var(--sans)"}}>
            <span style={{fontFamily:"var(--mono)",fontWeight:600,marginRight:5}}>{m.label}</span>
            <span style={{fontSize:11,opacity:.7}}>{m.full}</span>
          </button>
        ))}
        {algo==="rr"&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",
            borderRadius:"var(--r8)",border:"1px solid var(--line)",background:"var(--bg2)"}}>
            <span style={{fontSize:11,color:"var(--t3)"}}>Quantum:</span>
            {[1,2,3,4].map(v=>(
              <button key={v} onClick={()=>setQ(v)}
                style={{width:26,height:26,borderRadius:5,
                  border:`1px solid ${quantum===v?"var(--teal)":"var(--line2)"}`,
                  background:quantum===v?"var(--teal2)":"transparent",
                  color:quantum===v?"var(--teal)":"var(--t3)",
                  cursor:"pointer",fontSize:11,fontWeight:600,transition:"all .15s"}}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ready queue ────────────────────────────────── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
          letterSpacing:".08em",marginBottom:10}}>READY QUEUE</div>
        <div style={{display:"flex",gap:12,padding:"16px 20px",
          borderRadius:"var(--r12)",border:"1px solid var(--line)",
          background:"var(--bg2)",minHeight:80,alignItems:"center",flexWrap:"wrap"}}>
          {BASE_PROCS.map(p=>{
            const procSteps = steps.filter(s=>s.pid===p.id);
            const lastIdx   = step>=0 ? steps.slice(0,step+1).filter(s=>s.pid===p.id).length : 0;
            const totalSlices = procSteps.length;
            const isRunning = cur?.pid===p.id;
            const allDone   = totalSlices>0 && lastIdx>=totalSlices && !isRunning;
            return (
              <div key={p.id} style={{display:"flex",flexDirection:"column",
                alignItems:"center",gap:5,
                transform:isRunning?"translateY(-4px)":"translateY(0)",
                transition:"all .4s cubic-bezier(.34,1.56,.64,1)",
                opacity:allDone&&!isRunning?.3:1}}>
                <div style={{width:46,height:46,borderRadius:11,background:p.color.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:13,fontWeight:700,color:p.color.t,
                  border:`2px solid ${isRunning?"#fff":"transparent"}`,
                  boxShadow:isRunning?`0 0 0 4px ${p.color.glow},0 0 24px ${p.color.glow}`:"none",
                  transition:"all .4s ease"}}>
                  {p.id}
                </div>
                <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)"}}>
                  {allDone&&!isRunning ? "✓ done" : isRunning ? "▶ run" : `b:${p.burst}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CPU execution ──────────────────────────────── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
          letterSpacing:".08em",marginBottom:10}}>CPU EXECUTION</div>
        <div style={{
          padding:"24px 28px",borderRadius:"var(--r16)",
          border:cur?`1px solid ${cur.color.bg}40`:"1px solid var(--line)",
          background:cur?`${cur.color.bg}08`:"var(--bg2)",
          display:"flex",alignItems:"center",gap:20,minHeight:96,
          transition:"all .45s ease",
          animation:cur?"cpuGlow 2.5s ease infinite":"none",
        }}>
          {cur ? (
            <>
              <div style={{width:60,height:60,borderRadius:13,background:cur.color.bg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:18,fontWeight:700,color:cur.color.t,
                boxShadow:`0 0 28px ${cur.color.glow}`,
                animation:"popIn .4s ease",flexShrink:0}}>
                {cur.pid}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:"var(--t3)",marginBottom:3}}>Currently executing</div>
                <div style={{fontSize:22,fontWeight:700,color:cur.color.bg,letterSpacing:"-.02em"}}>
                  {cur.pid}
                </div>
                <div style={{fontSize:12,color:"var(--t2)",fontFamily:"var(--mono)",marginTop:2}}>
                  t={cur.start} → t={cur.end} · {cur.end-cur.start} unit{cur.end-cur.start>1?"s":""}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,fontFamily:"var(--mono)"}}>
                  {step+1} / {steps.length}
                </div>
                <div style={{width:100,height:4,borderRadius:2,background:"var(--bg3)"}}>
                  <div style={{height:"100%",borderRadius:2,background:cur.color.bg,
                    width:`${((step+1)/steps.length)*100}%`,transition:"width .4s ease"}}/>
                </div>
                <div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>
                  {Math.round(((step+1)/steps.length)*100)}% complete
                </div>
              </div>
            </>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:12,color:"var(--t3)"}}>
              <div style={{width:48,height:48,borderRadius:10,
                border:"1.5px dashed var(--t3)",display:"flex",
                alignItems:"center",justifyContent:"center",
                fontSize:10,fontFamily:"var(--mono)"}}>idle</div>
              <span style={{fontSize:13}}>
                {done ? "Simulation ended — press Reset to restart" : "Press Autoplay or Step Through to begin"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── gantt ──────────────────────────────────────── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
          letterSpacing:".08em",marginBottom:10}}>GANTT CHART</div>
        <div style={{borderRadius:"var(--r8)",overflow:"hidden",border:"1px solid var(--line)"}}>
          <div style={{display:"flex",height:40}}>
            {steps.map((s,i)=>(
              <div key={i} style={{
                width:`${((s.end-s.start)/maxEnd)*100}%`,
                background:i<=step?s.color.bg:`${s.color.bg}22`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:600,color:"#fff",
                borderRight:"1px solid rgba(0,0,0,.2)",
                position:"relative",overflow:"hidden",transition:"background .4s",
              }}>
                {i<=step?s.pid:""}
                {i===step&&(
                  <div style={{position:"absolute",inset:0,
                    background:"linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent)",
                    backgroundSize:"300% 100%",animation:"shimmer 1s linear infinite"}}/>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",background:"var(--bg3)"}}>
            {steps.map((s,i)=>(
              <div key={i} style={{width:`${((s.end-s.start)/maxEnd)*100}%`,
                textAlign:"right",padding:"3px 4px 3px 0",
                fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)"}}>
                {s.end}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── live explanation ───────────────────────────── */}
      {cur&&(
        <div key={step} style={{padding:"14px 18px",borderRadius:"var(--r8)",
          border:`1px solid ${cur.color.bg}30`,background:`${cur.color.bg}0a`,
          marginBottom:20,animation:"fadeUp .3s ease both"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:cur.color.bg,
              animation:"pulse 1.5s ease infinite"}}/>
            <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
              letterSpacing:".08em"}}>LIVE EXPLANATION</span>
          </div>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>{cur.note}</p>
        </div>
      )}

      {/* ── controls ───────────────────────────────────── */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={()=>setPlay(v=>!v)} disabled={done}
          style={{padding:"9px 22px",borderRadius:"var(--r8)",
            border:`1px solid ${playing?"rgba(251,113,133,.4)":meta.colorRaw+"55"}`,
            background:playing?"var(--rose2)":`${meta.colorRaw}15`,
            color:playing?"var(--rose)":meta.color,
            cursor:done?"not-allowed":"pointer",fontSize:13,fontWeight:500,
            transition:"all .18s",opacity:done?.4:1}}>
          {playing?"⏸ Pause":"▶ Autoplay"}
        </button>
        <button onClick={()=>setStep(v=>Math.min(v+1,steps.length-1))}
          disabled={done||playing}
          style={{padding:"9px 20px",borderRadius:"var(--r8)",
            border:"1px solid var(--line2)",background:"var(--bg2)",
            color:"var(--t2)",cursor:(done||playing)?"not-allowed":"pointer",
            fontSize:13,transition:"all .18s",opacity:(done||playing)?.4:1}}>
          Next Step →
        </button>
        <button onClick={reset}
          style={{padding:"9px 16px",borderRadius:"var(--r8)",
            border:"1px solid var(--line)",background:"transparent",
            color:"var(--t3)",cursor:"pointer",fontSize:13}}>
          ↺ Reset
        </button>
        {done&&(
          <div style={{padding:"9px 14px",borderRadius:"var(--r8)",
            border:"1px solid rgba(74,222,128,.3)",background:"var(--green2)",
            fontSize:12,color:"var(--green)",animation:"popIn .4s ease"}}>
            ✓ All processes complete
          </div>
        )}
      </div>

      <Divider />
      <a href="#" style={{fontSize:12,color:"var(--t3)",textDecoration:"none",
        display:"inline-flex",alignItems:"center",gap:6,transition:"color .15s"}}
        onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"}
        onMouseLeave={e=>e.currentTarget.style.color="var(--t3)"}>
        Learn advanced scheduling — SRTF, Priority, Multilevel Queue →
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHAPTER: QUIZ
═══════════════════════════════════════════════════════════ */
const QS = [
  { q:"With FCFS — P1 arrives at t=0, P3 at t=1, P2 at t=2. Which executes first?",
    opts:["P1","P2","P3"], ans:"P1",
    exp:"FCFS always picks the earliest arriving process. P1 arrived at t=0 — it goes first, regardless of burst time." },
  { q:"SJF — all arrive at t=0 with bursts P1=6, P2=2, P3=4. Which runs first?",
    opts:["P1","P2","P3"], ans:"P2",
    exp:"SJF selects the shortest burst. P2 has burst=2, the minimum. It executes first to minimise average wait time." },
  { q:"Round Robin with quantum=2. P1 has burst=5. After P1's first slice, how much CPU time does it still need?",
    opts:["5 units","3 units","2 units"], ans:"3 units",
    exp:"P1 runs for 1 quantum (2 units), leaving 5−2=3 units. It then rejoins the back of the queue." },
  { q:"Which algorithm can cause 'starvation' — where a process never gets to run?",
    opts:["FCFS","Round Robin","SJF"], ans:"SJF",
    exp:"SJF can starve long processes if a stream of short jobs keeps arriving. They will always get picked first, indefinitely delaying the long process." },
];

function QuizChapter({ onComplete }) {
  const [idx,setIdx]    = useState(0);
  const [sel,setSel]    = useState(null);
  const [score,setScore]= useState(0);
  const [done,setDone]  = useState(false);
  const q = QS[idx];

  const pick = (opt) => {
    if(sel) return;
    setSel(opt);
    if(opt===q.ans) setScore(s=>s+1);
  };
  const next = () => {
    if(idx<QS.length-1){ setIdx(i=>i+1); setSel(null); }
    else { setDone(true); onComplete && onComplete(score+(sel===q.ans?1:0)); }
  };
  const restart = () => { setIdx(0); setSel(null); setScore(0); setDone(false); };

  if(done) {
    const final = score;
    const pct = Math.round((final/QS.length)*100);
    return (
      <div style={{animation:"fadeUp .5s ease both",textAlign:"center",paddingTop:20}}>
        <div style={{fontSize:52,marginBottom:16}}>
          {pct===100?"🎉":pct>=75?"✨":pct>=50?"📖":"🔄"}
        </div>
        <h2 style={{fontSize:32,fontWeight:800,marginBottom:6}}>
          {final} / {QS.length} correct
        </h2>
        <p style={{fontSize:15,color:"var(--t2)",marginBottom:32,maxWidth:420,margin:"0 auto 32px"}}>
          {pct===100?"Perfect — you've mastered CPU scheduling fundamentals."
            :pct>=75?"Strong understanding. Review the simulator to solidify the rest."
            :"Keep exploring the simulator above — these will click with more practice."}
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={restart}
            style={{padding:"10px 24px",borderRadius:"var(--r8)",
              border:"1px solid var(--accent3)",background:"var(--accent2)",
              color:"var(--accent)",cursor:"pointer",fontSize:13,fontWeight:500}}>
            Retry Quiz
          </button>
          <a href="#" style={{padding:"10px 24px",borderRadius:"var(--r8)",
            border:"1px solid var(--line2)",background:"var(--bg2)",
            color:"var(--t2)",textDecoration:"none",fontSize:13,
            display:"flex",alignItems:"center",gap:6,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="var(--t1)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--t2)"}>
            Explore More Concepts →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <SectionLabel>Knowledge Check</SectionLabel>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <h2 style={{fontSize:"clamp(24px,3.5vw,40px)",fontWeight:800,letterSpacing:"-0.025em"}}>
          Quiz
        </h2>
        <span style={{padding:"4px 12px",borderRadius:20,background:"var(--bg2)",
          border:"1px solid var(--line)",fontSize:12,color:"var(--t3)",fontFamily:"var(--mono)"}}>
          {idx+1} / {QS.length}
        </span>
      </div>

      {/* progress */}
      <div style={{height:2,borderRadius:1,background:"var(--bg3)",marginBottom:32}}>
        <div style={{height:"100%",borderRadius:1,background:"var(--accent)",
          width:`${(idx/QS.length)*100}%`,transition:"width .5s ease"}}/>
      </div>

      <div key={idx} style={{animation:"fadeUp .3s ease both"}}>
        <p style={{fontSize:17,fontWeight:500,lineHeight:1.65,marginBottom:24,maxWidth:580}}>
          {q.q}
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:520}}>
          {q.opts.map(opt=>{
            const isChosen  = sel===opt;
            const isRight   = opt===q.ans;
            const shown     = !!sel;
            let bg = "var(--bg2)", border = "var(--line2)", color = "var(--t2)";
            if(shown&&isRight)           { bg="var(--green2)"; border="rgba(74,222,128,.4)"; color="var(--green)"; }
            else if(shown&&isChosen&&!isRight) { bg="var(--rose2)";  border="rgba(251,113,133,.4)"; color="var(--rose)"; }
            return (
              <button key={opt} onClick={()=>pick(opt)}
                style={{padding:"13px 18px",borderRadius:"var(--r8)",border:`1px solid ${border}`,
                  background:bg,color,cursor:sel?"default":"pointer",
                  fontSize:14,textAlign:"left",fontFamily:"var(--sans)",
                  transition:"all .22s ease",fontWeight:isChosen||(shown&&isRight)?500:400,
                  animation:shown&&(isRight||isChosen)?"popIn .3s ease":"none"}}>
                {shown&&isRight&&"✓ "}{shown&&isChosen&&!isRight&&"✗ "}{opt}
              </button>
            );
          })}
        </div>

        {sel&&(
          <div style={{marginTop:16,padding:"13px 16px",borderRadius:"var(--r8)",
            border:"1px solid var(--line2)",background:"var(--bg2)",
            maxWidth:520,animation:"fadeUp .25s ease both"}}>
            <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",marginBottom:4}}>
              EXPLANATION
            </div>
            <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>{q.exp}</p>
          </div>
        )}

        {sel&&(
          <button onClick={next}
            style={{marginTop:16,padding:"9px 22px",borderRadius:"var(--r8)",
              border:"1px solid var(--accent3)",background:"var(--accent2)",
              color:"var(--accent)",cursor:"pointer",fontSize:13,fontWeight:500,
              animation:"fadeUp .3s ease .15s both"}}>
            {idx<QS.length-1?"Next Question →":"See Results →"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */

export default function App() {
  const [active,setActive]=useState("intro");
  const [visited,setVisited]=useState(new Set(["intro"]));
  const scrollRef = useRef(null);

  const goTo = (id) => {
    setActive(id);
    setVisited(v=>new Set([...v,id]));
    if(scrollRef.current) scrollRef.current.scrollTop=0;
  };

  const curIdx  = CHAPTER_IDS.indexOf(active);
  const hasPrev = curIdx>0;
  const hasNext = curIdx<CHAPTER_IDS.length-1;
  const chapter = NAV.find(n=>n.id===active);
  const progress= Math.round((visited.size/NAV.length)*100);

  const content = {
    intro:    <IntroChapter/>,
    concepts: <ConceptsChapter/>,
    fcfs:     <FCFSChapter/>,
    sjf:      <SJFChapter/>,
    rr:       <RRChapter/>,
    lab:      <LiveSimulator/>,
    quiz:     <QuizChapter onComplete={()=>{ setVisited(v=>new Set([...v,"quiz"])); }}/>,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <Sidebar active={active} onNav={goTo} progress={progress}/>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <Header
              chapter={chapter}
              onPrev={()=>goTo(CHAPTER_IDS[curIdx-1])}
              onNext={()=>goTo(CHAPTER_IDS[curIdx+1])}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
            <main ref={scrollRef} style={{flex:1,overflowY:"auto",
              padding:"40px clamp(24px,5vw,72px) 60px"}}>
              {content[active]}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}