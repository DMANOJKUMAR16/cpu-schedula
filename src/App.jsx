import { useState, useEffect, useRef, useCallback } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0d11;--bg1:#111520;--bg2:#181c27;--bg3:#1e2330;--bg4:#252b3a;
  --line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.15);
  --t1:#f4f6ff;--t2:#c8d0e0;--t3:#8892a4;
  --orange:#f97316;--orange2:rgba(249,115,22,.16);--orange3:rgba(249,115,22,.35);
  --blue:#60a5fa;--blue2:rgba(96,165,250,.14);
  --teal:#2dd4bf;--teal2:rgba(45,212,191,.14);
  --green:#4ade80;--green2:rgba(74,222,128,.18);
  --rose:#fb7185;--rose2:rgba(251,113,133,.15);
  --purple:#c084fc;--yellow:#fbbf24;
  --sans:'Outfit',sans-serif;--mono:'JetBrains Mono',monospace;
  --left:300px; --right:300px; --topbar:68px;
}
html,body,#root{height:100%;overflow:hidden}
body{
  font-family:var(--sans);background:var(--bg);color:var(--t1);
  font-size:16px;line-height:1.65;
  -webkit-user-select:none;user-select:none;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
}
input{-webkit-user-select:text;user-select:text}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
button{font-family:var(--sans);cursor:pointer;border:none;outline:none;background:none}
button:focus-visible{outline:2px solid var(--orange);outline-offset:2px}
a{color:inherit;text-decoration:none}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes popIn{0%{opacity:0;transform:scale(.78)}65%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(249,115,22,.55)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes editPulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes cpuSpin{0%,100%{border-color:rgba(249,115,22,.45)}50%{border-color:rgba(249,115,22,1);box-shadow:0 0 36px rgba(249,115,22,.5)}}
@keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes bounceBtn{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.01)}}
@keyframes tooltipIn{from{opacity:0;transform:translateY(6px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes trackGlow{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes completePop{0%{transform:scale(0)}65%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes hungerPulse{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes quizReveal{0%{opacity:0;transform:scale(.88) translateY(12px)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes correctFlash{0%{background:rgba(74,222,128,.0)}50%{background:rgba(74,222,128,.25)}100%{background:rgba(74,222,128,.12)}}
@keyframes wrongShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
@keyframes ytiSlide{from{opacity:0;transform:scale(.96) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
`;

const PC=[
  {bg:"#f97316",t:"#fff",glow:"rgba(249,115,22,.7)",  dim:"rgba(249,115,22,.18)"},
  {bg:"#60a5fa",t:"#fff",glow:"rgba(96,165,250,.7)",  dim:"rgba(96,165,250,.18)"},
  {bg:"#2dd4bf",t:"#000",glow:"rgba(45,212,191,.7)",  dim:"rgba(45,212,191,.18)"},
  {bg:"#c084fc",t:"#fff",glow:"rgba(192,132,252,.7)", dim:"rgba(192,132,252,.18)"},
  {bg:"#fbbf24",t:"#000",glow:"rgba(251,191,36,.7)",  dim:"rgba(251,191,36,.18)"},
];

const DEFAULT_PROCS=[
  {id:"P1",arrival:0,burst:5,priority:3,color:PC[0]},
  {id:"P2",arrival:1,burst:3,priority:1,color:PC[1]},
  {id:"P3",arrival:2,burst:8,priority:4,color:PC[2]},
  {id:"P4",arrival:3,burst:2,priority:2,color:PC[3]},
];

/* ── ALGORITHMS ─────────────────────────────────────────── */
function runFCFS(procs){
  const sorted=[...procs].sort((a,b)=>a.arrival-b.arrival);
  const steps=[];let t=0;
  for(const p of sorted){
    if(t<p.arrival)t=p.arrival;
    steps.push({pid:p.id,start:t,end:t+p.burst,color:p.color,
      why:`${p.id} executes first — it arrived at t=${p.arrival}, earliest in the queue.`,
      detail:`FCFS (First Come First Served): No priority, no reordering. Whoever arrives first gets the CPU first. Simple but can cause long wait if a slow process arrives early.`});
    t+=p.burst;
  }
  return steps;
}
function runSJF(procs){
  const ps=procs.map(p=>({...p,done:false}));
  const steps=[];let t=0;let g=0;
  while(ps.some(p=>!p.done)&&g++<300){
    const av=ps.filter(p=>!p.done&&p.arrival<=t);
    if(!av.length){t++;continue;}
    const pick=av.reduce((a,b)=>a.burst<b.burst?a:b);
    steps.push({pid:pick.id,start:t,end:t+pick.burst,color:pick.color,
      why:`${pick.id} runs next — its burst (${pick.burst}) is shortest among ${av.length} ready process${av.length>1?"es":""}.`,
      detail:`SJF (Shortest Job First): Always picks the process needing the least CPU time. This minimises average waiting time, but longer jobs risk never running if short ones keep arriving.`});
    t+=pick.burst;
    ps.find(p=>p.id===pick.id).done=true;
  }
  return steps;
}
function runRR(procs,q){
  const ps=procs.map(p=>({...p,rem:p.burst}));
  const steps=[];let t=0;const queue=[];const seen=new Set();
  const enq=(time)=>ps.forEach(p=>{if(p.arrival<=time&&!seen.has(p.id)&&p.rem>0){queue.push(p);seen.add(p.id);}});
  enq(0);let g=0;
  while((queue.length||ps.some(p=>p.rem>0))&&g++<600){
    if(!queue.length){t++;enq(t);continue;}
    const p=queue.shift();
    const exec=Math.min(q,p.rem);
    steps.push({pid:p.id,start:t,end:t+exec,color:p.color,
      why:`${p.id} gets a ${exec}-unit time slice. ${p.rem-exec>0?`Still has ${p.rem-exec} units left — rejoins queue.`:`Completes execution now.`}`,
      detail:`Round Robin (q=${q}): Every process gets an equal time slice (quantum). When the slice expires, the process moves to the back. Fair for all — ideal for interactive systems.`});
    t+=exec;p.rem-=exec;
    enq(t);
    if(p.rem>0)queue.push(p);
  }
  return steps;
}

function runPRIORITY(procs){
  const ps=procs.map(p=>({...p,done:false}));
  const steps=[];let t=0;let g=0;
  while(ps.some(p=>!p.done)&&g++<300){
    const av=ps.filter(p=>!p.done&&p.arrival<=t);
    if(!av.length){t++;continue;}
    const pick=av.reduce((a,b)=>(a.priority||99)<(b.priority||99)?a:b);
    steps.push({pid:pick.id,start:t,end:t+pick.burst,color:pick.color,
      why:`${pick.id} runs next — it has priority ${pick.priority||"?"}, highest among ${av.length} ready process${av.length>1?"es":""}. Lower number = higher priority.`,
      detail:`Priority Scheduling: Each process has a priority number. Lower value = higher urgency. The CPU always picks the highest-priority ready process. Risk: low-priority processes may starve if high-priority ones keep arriving.`});
    t+=pick.burst;
    ps.find(p=>p.id===pick.id).done=true;
  }
  return steps;
}

/* ── TOOLTIP ─────────────────────────────────────────────── */
function Tip({label,tip,color}){
  const [show,setShow]=useState(false);
  return(
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",gap:5,cursor:"default"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <span style={{color:color||"var(--t1)",fontWeight:700}}>{label}</span>
      <span style={{width:16,height:16,borderRadius:"50%",background:"var(--bg4)",
        border:"1px solid var(--line2)",display:"inline-flex",alignItems:"center",
        justifyContent:"center",fontSize:10,color:"var(--t3)",cursor:"help",flexShrink:0,fontWeight:700}}>?</span>
      {show&&(
        <div style={{position:"absolute",top:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",
          background:"var(--bg4)",border:"1px solid var(--line2)",borderRadius:10,
          padding:"10px 14px",fontSize:13,color:"var(--t1)",zIndex:9999,
          boxShadow:"0 12px 32px rgba(0,0,0,.7)",animation:"tooltipIn .18s ease both",
          lineHeight:1.55,width:230,textAlign:"center",pointerEvents:"none"}}>
          {tip}
          <div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",
            width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",
            borderBottom:"6px solid var(--bg4)"}}/>
        </div>
      )}
    </span>
  );
}

/* ── SECTION HEADING ─────────────────────────────────────── */
function SH({children,action}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <span style={{fontSize:12,fontWeight:800,color:"var(--t1)",letterSpacing:".14em",
        textTransform:"uppercase",fontFamily:"var(--mono)"}}>{children}</span>
      {action}
    </div>
  );
}

/* ── YET TO BE IMPLEMENTED OVERLAY ──────────────────────── */
function YTIOverlay({topic,onClose}){
  const MAP={
    "Memory Management":{
      icon:"🧠",
      desc:"How an OS manages RAM — allocating, freeing and swapping memory between running processes.",
      concepts:["Paging","Segmentation","Virtual Memory","Page Faults","Memory Allocation"],
    },
    "Process Sync":{
      icon:"🔄",
      desc:"Techniques to coordinate multiple processes accessing shared resources without conflicts.",
      concepts:["Mutex","Semaphore","Deadlock","Race Condition","Critical Section"],
    },
    "Deadlocks":{
      icon:"🔒",
      desc:"A state where processes are permanently blocked waiting for resources held by each other.",
      concepts:["Deadlock Detection","Banker's Algorithm","Resource Graph","Deadlock Prevention","Starvation"],
    },
    "Virtual Memory":{
      icon:"💾",
      desc:"A technique letting processes use more memory than physically available by swapping to disk.",
      concepts:["Page Table","TLB","Demand Paging","Thrashing","Swap Space"],
    },
  };
  const info=MAP[topic]||{icon:"🚧",desc:"This module is part of the full Operating Systems learning path.",concepts:[]};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:22,
        padding:"48px 52px",maxWidth:560,width:"90%",textAlign:"center",
        animation:"ytiSlide .3s ease both",
        boxShadow:"0 0 0 1px rgba(249,115,22,.08),0 32px 80px rgba(0,0,0,.8)"}}>

        <div style={{fontSize:56,marginBottom:20}}>{info.icon}</div>

        <div style={{display:"inline-block",padding:"4px 16px",borderRadius:20,
          background:"var(--orange2)",border:"1px solid var(--orange3)",
          fontSize:12,fontWeight:700,color:"var(--orange)",
          letterSpacing:".1em",fontFamily:"var(--mono)",marginBottom:20}}>
          COMING SOON
        </div>

        <h2 style={{fontSize:34,fontWeight:800,color:"var(--t1)",
          letterSpacing:"-.02em",lineHeight:1.15,marginBottom:14}}>{topic}</h2>

        <div style={{width:60,height:3,borderRadius:2,
          background:"linear-gradient(90deg,var(--orange),var(--purple))",
          margin:"0 auto 20px"}}/>

        <p style={{fontSize:16,color:"var(--t2)",lineHeight:1.75,marginBottom:28,maxWidth:400,margin:"0 auto 28px"}}>
          {info.desc}
        </p>

        {info.concepts.length>0&&(
          <div style={{marginBottom:32}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--t3)",
              letterSpacing:".1em",fontFamily:"var(--mono)",marginBottom:14}}>
              CONCEPTS IN THIS MODULE
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
              {info.concepts.map(c=>(
                <span key={c} style={{padding:"6px 14px",borderRadius:20,
                  background:"var(--bg3)",border:"1px solid var(--line2)",
                  fontSize:13,fontWeight:500,color:"var(--t2)"}}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{padding:"18px 22px",borderRadius:12,
          background:"var(--bg3)",border:"1px solid var(--line)",
          marginBottom:28,textAlign:"left"}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--orange)",
            fontFamily:"var(--mono)",letterSpacing:".08em",marginBottom:6}}>
            🚧 YET TO BE IMPLEMENTED
          </div>
          <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>
            This interactive lab is part of the <strong style={{color:"var(--t1)"}}>Coding Pro Operating Systems</strong> learning path. 
            Complete modules with visual simulations, step-through explanations and knowledge checks are being built right now.
          </p>
        </div>

        <button onClick={onClose}
          style={{padding:"13px 36px",borderRadius:11,background:"var(--orange)",
            color:"#fff",fontSize:15,fontWeight:700,border:"none",
            boxShadow:"0 4px 24px rgba(249,115,22,.45)",transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.04)";e.currentTarget.style.boxShadow="0 6px 32px rgba(249,115,22,.65)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 24px rgba(249,115,22,.45)";}}>
          ← Back to Simulator
        </button>
      </div>
    </div>
  );
}

/* ── PROCESS EDITOR ──────────────────────────────────────── */
function ProcessEditor({procs,onSave,onClose}){
  const [local,setLocal]=useState(procs.map(p=>({...p})));
  const update=(i,field,val)=>{
    const n=[...local];
    n[i]={...n[i],[field]:Math.max(0,Math.min(20,parseInt(val)||0))};
    setLocal(n);
  };
  const addProc=()=>{
    if(local.length>=5)return;
    const idx=local.length;
    setLocal([...local,{id:`P${idx+1}`,arrival:idx,burst:4,color:PC[idx]}]);
  };
  const removeProc=(i)=>{if(local.length<=2)return;setLocal(local.filter((_,j)=>j!==i));};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--orange3)",borderRadius:18,
        padding:"30px 34px",width:480,animation:"popIn .25s ease both",
        boxShadow:"0 0 0 1px rgba(249,115,22,.1),0 24px 80px rgba(0,0,0,.7)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>Edit Processes</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Adjust arrival & burst times</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:"var(--bg3)",
            color:"var(--t2)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>×</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr 1fr 1fr 34px",gap:"9px 10px",alignItems:"center",marginBottom:14}}>
          {["","Process","Arrival","Burst","Priority",""].map((h,i)=>(
            <div key={i} style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",letterSpacing:".08em",paddingBottom:4,fontWeight:700}}>{h}</div>
          ))}
          {local.map((p,i)=>[
            <div key={`dot${i}`} style={{width:13,height:13,borderRadius:"50%",background:p.color.bg,boxShadow:`0 0 10px ${p.color.glow}`,justifySelf:"center"}}/>,
            <div key={`id${i}`} style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:700,color:p.color.bg}}>{p.id}</div>,
            ...["arrival","burst","priority"].map(field=>(
              <input key={`${field}${i}`} type="number" min={field==="priority"?1:0} max={field==="priority"?5:20} value={p[field]??1}
                onChange={e=>update(i,field,e.target.value)}
                style={{background:"var(--bg3)",border:"1px solid var(--line2)",borderRadius:8,
                  color:"var(--t1)",fontFamily:"var(--mono)",fontSize:15,fontWeight:600,
                  padding:"8px 10px",outline:"none",width:"100%",transition:"border .15s"}}
                onFocus={e=>e.target.style.borderColor=field==="priority"?"var(--purple)":"var(--orange)"}
                onBlur={e=>e.target.style.borderColor="var(--line2)"}/>
            )),
            <button key={`del${i}`} onClick={()=>removeProc(i)}
              style={{width:32,height:32,borderRadius:7,background:"var(--rose2)",
                color:"var(--rose)",fontSize:14,display:"flex",alignItems:"center",
                justifyContent:"center",opacity:local.length<=2?.3:1,
                border:"1px solid rgba(251,113,133,.3)",transition:"all .15s"}}
              onMouseEnter={e=>{if(local.length>2)e.currentTarget.style.background="rgba(251,113,133,.3)";}}
              onMouseLeave={e=>e.currentTarget.style.background="var(--rose2)"}>×</button>,
          ])}
        </div>
        <div style={{fontSize:11,color:"var(--t3)",marginBottom:14,padding:"6px 8px",borderRadius:6,
          background:"var(--bg3)",border:"1px solid var(--line)"}}>
          💡 Priority: 1 = highest urgency, 5 = lowest. Used only in Priority Scheduling mode.
        </div>
        {local.length<5&&(
          <button onClick={addProc}
            style={{width:"100%",padding:"9px",borderRadius:9,
              border:"1px dashed rgba(249,115,22,.4)",color:"var(--orange)",
              fontSize:13,fontWeight:600,marginBottom:18,transition:"all .15s",background:"transparent"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--orange2)";e.currentTarget.style.borderColor="var(--orange)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(249,115,22,.4)";}}>
            + Add Process
          </button>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSave(local)}
            style={{flex:1,padding:"13px",borderRadius:10,background:"var(--orange)",
              color:"#fff",fontSize:15,fontWeight:700,boxShadow:"0 4px 20px rgba(249,115,22,.4)",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 6px 28px rgba(249,115,22,.55)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 20px rgba(249,115,22,.4)";}}>
            ✓ Apply Changes
          </button>
          <button onClick={onClose}
            style={{padding:"13px 20px",borderRadius:10,border:"1px solid var(--line2)",
              color:"var(--t2)",fontSize:14,fontWeight:500,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t1)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t2)";}}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── COMPARE MODAL ───────────────────────────────────────── */
function CompareModal({procs,onClose}){
  const algos=[
    {key:"fcfs",label:"FCFS",       color:"#f97316",steps:runFCFS(procs)},
    {key:"sjf", label:"SJF",        color:"#60a5fa",steps:runSJF(procs)},
    {key:"rr2", label:"RR (q=2)",   color:"#2dd4bf",steps:runRR(procs,2)},
    {key:"pri", label:"Priority",   color:"#c084fc",steps:runPRIORITY(procs)},
  ];
  const maxMake=Math.max(...algos.map(a=>Math.max(...a.steps.map(s=>s.end))));
  const stats=algos.map(a=>{
    const makespan=Math.max(...a.steps.map(s=>s.end));
    const waitMap={};
    procs.forEach(p=>{
      const execTotal=a.steps.filter(s=>s.pid===p.id).reduce((acc,s)=>acc+(s.end-s.start),0);
      waitMap[p.id]=makespan-p.arrival-execTotal;
    });
    const avgWait=(Object.values(waitMap).reduce((a,b)=>a+b,0)/procs.length).toFixed(1);
    return{...a,makespan,avgWait};
  });
  const bestWait=Math.min(...stats.map(s=>parseFloat(s.avgWait)));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:18,
        padding:"32px 36px",width:580,animation:"popIn .25s ease both",
        boxShadow:"0 24px 80px rgba(0,0,0,.7)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>Algorithm Comparison</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Same processes, three strategies</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:"var(--bg3)",
            color:"var(--t2)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>×</button>
        </div>
        {stats.map(a=>(
          <div key={a.key} style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontFamily:"var(--mono)",fontSize:15,fontWeight:700,color:a.color}}>{a.label}</span>
              <div style={{display:"flex",gap:20}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",fontWeight:700}}>MAKESPAN</div>
                  <div style={{fontSize:16,fontWeight:700,color:"var(--t1)",fontFamily:"var(--mono)"}}>{a.makespan}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",fontWeight:700}}>AVG WAIT</div>
                  <div style={{fontSize:16,fontWeight:700,
                    color:parseFloat(a.avgWait)===bestWait?"var(--green)":"var(--t1)",
                    fontFamily:"var(--mono)"}}>
                    {a.avgWait}{parseFloat(a.avgWait)===bestWait?" ★":""}
                  </div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",height:38,borderRadius:9,overflow:"hidden",border:"1px solid var(--line2)"}}>
              {a.steps.map((s,i)=>(
                <div key={i} style={{width:`${((s.end-s.start)/maxMake)*100}%`,background:s.color.bg,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:700,color:"#fff",
                  borderRight:"1px solid rgba(0,0,0,.2)",
                  boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}}>
                  {s.pid}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{padding:"14px 18px",borderRadius:10,background:"var(--bg3)",
          border:"1px solid var(--line2)",fontSize:14,color:"var(--t2)",lineHeight:1.65}}>
          <span style={{color:"var(--blue)",fontWeight:700}}>SJF</span> gives lowest avg wait.{" "}
          <span style={{color:"var(--orange)",fontWeight:700}}>FCFS</span> is simplest.{" "}
          <span style={{color:"var(--teal)",fontWeight:700}}>Round Robin</span> is fairest for interactive use.
        </div>
      </div>
    </div>
  );
}

/* ── WALKTHROUGH ─────────────────────────────────────────── */

/* ── QUIZ OVERLAY ────────────────────────────────────────── */
function QuizOverlay({steps,step,onCorrect,onSkip}){
  const [selected,setSelected]=useState(null);
  const nextStep=steps[step+1];
  if(!nextStep) return null;
  const correct=nextStep.pid;
  // build options: correct + up to 2 distractors
  const allPids=[...new Set(steps.map(s=>s.pid))];
  const distractors=allPids.filter(p=>p!==correct).sort(()=>Math.random()-.5).slice(0,2);
  const options=[correct,...distractors].sort(()=>Math.random()-.5);
  const answered=!!selected;
  const isCorrect=selected===correct;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:800,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}
      onClick={e=>{if(e.target===e.currentTarget&&answered)onCorrect();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:18,
        padding:"32px 36px",width:420,animation:"quizReveal .28s ease both",
        boxShadow:"0 24px 60px rgba(0,0,0,.8)"}}>

        <div style={{fontSize:11,color:"var(--purple)",fontFamily:"var(--mono)",
          letterSpacing:".12em",fontWeight:700,marginBottom:12}}>
          🎯 QUIZ MODE · STEP {step+2}
        </div>

        <div style={{fontSize:19,fontWeight:800,color:"var(--t1)",
          lineHeight:1.3,marginBottom:22}}>
          Which process runs next?
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {options.map(opt=>{
            const isSelected=selected===opt;
            const showResult=answered;
            const isRight=opt===correct;
            let bg="var(--bg3)",border="var(--line2)",col="var(--t1)";
            if(showResult&&isRight){bg="rgba(74,222,128,.14)";border="rgba(74,222,128,.5)";col="var(--green)";}
            else if(showResult&&isSelected&&!isRight){bg="rgba(251,113,133,.14)";border="rgba(251,113,133,.5)";col="var(--rose)";}
            return(
              <button key={opt} onClick={()=>{if(!answered)setSelected(opt);}}
                style={{padding:"13px 18px",borderRadius:10,border:`1.5px solid ${border}`,
                  background:bg,color:col,cursor:answered?"default":"pointer",
                  fontSize:15,fontWeight:600,textAlign:"left",fontFamily:"var(--sans)",
                  transition:"all .2s",
                  animation:showResult&&isRight?"correctFlash .4s ease":showResult&&isSelected&&!isRight?"wrongShake .3s ease":""}}
                onMouseEnter={e=>{if(!answered)e.currentTarget.style.background="var(--bg4)";}}
                onMouseLeave={e=>{if(!answered)e.currentTarget.style.background=bg;}}>
                {showResult&&isRight&&"✓ "}{showResult&&isSelected&&!isRight&&"✗ "}{opt}
              </button>
            );
          })}
        </div>

        {answered&&(
          <div style={{padding:"12px 16px",borderRadius:9,marginBottom:16,
            background:isCorrect?"rgba(74,222,128,.08)":"rgba(251,113,133,.08)",
            border:`1px solid ${isCorrect?"rgba(74,222,128,.3)":"rgba(251,113,133,.3)"}`}}>
            <div style={{fontSize:13,fontWeight:700,
              color:isCorrect?"var(--green)":"var(--rose)",marginBottom:4}}>
              {isCorrect?"✓ Correct!":"✗ Not quite."}
            </div>
            <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>
              {nextStep.why}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:8}}>
          {answered&&(
            <button onClick={onCorrect}
              style={{flex:1,padding:"11px",borderRadius:9,background:"var(--orange)",
                color:"#fff",fontSize:14,fontWeight:700,border:"none",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity=".88"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              See it happen →
            </button>
          )}
          <button onClick={onSkip}
            style={{padding:"11px 16px",borderRadius:9,
              border:"1px solid var(--line2)",background:"transparent",
              color:"var(--t3)",fontSize:13,transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.color="var(--t1)";}}
            onMouseLeave={e=>e.currentTarget.style.color="var(--t3)"}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

const WALK_STEPS=[
  {title:"Welcome to CPU Scheduling Lab",
   body:"This simulator shows how an OS decides which program runs next. See it live — 4 algorithms, kernel logs, and interactive controls.",
   cta:"Let's Begin"},
  {title:"These coloured blocks are Processes",
   body:"Each block (P1, P2…) is a program wanting CPU time. Each has an arrival time, burst time, and priority. Edit them via the ✎ Edit button.",
   cta:"Got it"},
  {title:"4 Scheduling Algorithms",
   body:"FCFS, SJF, Round Robin, and Priority Scheduling. Switch between them in the top bar. Compare all 4 at once using ⚖ Compare.",
   cta:"Nice"},
  {title:"Quiz Mode — Test Yourself",
   body:"Toggle Quiz Mode in the controls bar. Before each step, you'll be asked which process runs next. Great for active learning and exam prep.",
   cta:"Sounds good"},
  {title:"Starvation & Kernel Log",
   body:"Watch hunger meters grow on waiting processes — that's starvation visualised. The right panel shows live OS-level kernel events as they happen.",
   cta:"Got it"},
  {title:"Hit ▶ Start Simulation",
   body:"Press the big orange button to autoplay, or use ← → to step manually. Click any Gantt block to jump to that point in time.",
   cta:"Start Simulating →"},
];
function WalkThrough({onDone}){
  const [idx,setIdx]=useState(0);
  const step=WALK_STEPS[idx];
  const isLast=idx===WALK_STEPS.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:900,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--orange3)",borderRadius:20,
        padding:"42px 48px",maxWidth:460,textAlign:"center",animation:"popIn .3s ease both",
        boxShadow:"0 0 0 1px rgba(249,115,22,.1),0 28px 80px rgba(0,0,0,.85)"}}>
        <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:28}}>
          {WALK_STEPS.map((_,i)=>(
            <div key={i} style={{height:3,borderRadius:2,
              width:i===idx?28:8,background:i<=idx?"var(--orange)":"var(--bg4)",
              transition:"all .3s ease"}}/>
          ))}
        </div>
        <div style={{fontSize:26,fontWeight:800,color:"var(--t1)",marginBottom:14,lineHeight:1.25}}>
          {step.title}
        </div>
        <div style={{fontSize:16,color:"var(--t2)",lineHeight:1.8,marginBottom:34}}>{step.body}</div>
        <button onClick={()=>isLast?onDone():setIdx(i=>i+1)}
          style={{padding:"15px 40px",borderRadius:12,background:"var(--orange)",
            color:"#fff",fontSize:17,fontWeight:800,
            boxShadow:"0 4px 28px rgba(249,115,22,.55)",transition:"all .15s",
            animation:isLast?"bounceBtn 1.8s ease infinite":"none",border:"none"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow="0 6px 36px rgba(249,115,22,.7)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 28px rgba(249,115,22,.55)";}}>
          {step.cta}
        </button>
        {!isLast&&(
          <button onClick={onDone}
            style={{display:"block",margin:"14px auto 0",fontSize:13,color:"var(--t3)",
              background:"none",padding:"4px 8px",transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="var(--t2)"}
            onMouseLeave={e=>e.currentTarget.style.color="var(--t3)"}>
            Skip intro
          </button>
        )}
      </div>
    </div>
  );
}

/* ── GANTT CHART ─────────────────────────────────────────── */
function GanttBar({steps,currentStep,onScrub}){
  if(!steps.length)return(
    <div style={{height:50,borderRadius:10,background:"var(--bg3)",border:"1px dashed var(--line2)",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"var(--t3)"}}>
      Gantt chart appears as simulation runs
    </div>
  );
  const maxEnd=Math.max(...steps.map(s=>s.end));
  return(
    <div>
      <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:"1px solid var(--line2)",height:50}}>
        {steps.map((s,i)=>{
          const filled=i<=currentStep;
          const active=i===currentStep;
          return(
            <div key={i}
              onClick={()=>onScrub&&onScrub(i)}
              title={`Jump to step ${i+1}: ${s.pid} (t=${s.start}–${s.end})`}
              style={{
                width:`${((s.end-s.start)/maxEnd)*100}%`,height:"100%",
                background:filled?s.color.bg:"rgba(255,255,255,.03)",
                display:"flex",alignItems:"center",justifyContent:"center",
                borderRight:"1px solid rgba(0,0,0,.25)",position:"relative",overflow:"hidden",
                transition:"background .3s",cursor:"pointer",
                boxShadow:active?`inset 0 0 0 2.5px rgba(255,255,255,.55)`:"none",
              }}
              onMouseEnter={e=>{if(!filled)e.currentTarget.style.background="rgba(255,255,255,.07)";}}
              onMouseLeave={e=>{if(!filled)e.currentTarget.style.background="rgba(255,255,255,.03)";}}>
              <span style={{fontSize:14,fontWeight:700,color:filled?"#fff":"transparent",
                fontFamily:"var(--mono)",position:"relative",zIndex:1}}>
                {filled?s.pid:""}
              </span>
              {active&&<div style={{position:"absolute",inset:0,
                background:"linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)",
                backgroundSize:"200% 100%",animation:"shimmer .9s linear infinite"}}/>}
              {active&&<div style={{position:"absolute",top:0,left:0,right:0,
                height:3,background:"rgba(255,255,255,.9)"}}/>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",marginTop:5}}>
        {steps.map((s,i)=>(
          <div key={i} style={{width:`${((s.end-s.start)/maxEnd)*100}%`,
            textAlign:"right",paddingRight:4}}>
            <span style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)"}}>{s.end}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ── GLOSSARY MODAL ─────────────────────────────────────── */
const GLOSSARY_TERMS = [
  {
    term:"Process",
    color:"#f97316",
    short:"A program in execution.",
    detail:"A process is an active instance of a program. It has its own memory space, program counter, and CPU registers. The OS manages multiple processes simultaneously, switching between them so quickly it feels like parallelism.",
  },
  {
    term:"Burst Time",
    color:"#60a5fa",
    short:"CPU time a process needs to finish.",
    detail:"The total amount of time a process needs to execute on the CPU from start to completion. A short burst means the task finishes quickly. Algorithms like SJF use burst time directly to decide scheduling order.",
  },
  {
    term:"Arrival Time",
    color:"#2dd4bf",
    short:"When a process enters the ready queue.",
    detail:"The exact moment a process becomes available for scheduling. Processes that arrive later cannot be scheduled before they arrive, even if they have a short burst time. FCFS sorts purely by this value.",
  },
  {
    term:"Ready Queue",
    color:"#c084fc",
    short:"Processes waiting for their CPU turn.",
    detail:"A queue maintained by the OS holding all processes that are loaded in memory and ready to run, but waiting for the CPU to become free. Different algorithms sort or manage this queue differently.",
  },
  {
    term:"Wait Time",
    color:"#fbbf24",
    short:"Time spent waiting before execution.",
    detail:"The total time a process spends sitting in the ready queue before it first gets to run on the CPU. Minimising average wait time across all processes is a primary goal of scheduling algorithms.",
  },
  {
    term:"Turnaround Time",
    color:"#4ade80",
    short:"Total time from arrival to completion.",
    detail:"The total elapsed time from when a process arrives in the system to when it fully completes. Turnaround = Wait Time + Burst Time. It measures the overall experience of a process through the system.",
  },
  {
    term:"Preemption",
    color:"#fb7185",
    short:"Forcibly interrupting a running process.",
    detail:"A preemptive scheduler can stop a currently running process mid-execution and switch to another one. Round Robin is preemptive — it forces a context switch after each quantum. FCFS and SJF (non-preemptive) let a process finish once started.",
  },
  {
    term:"Context Switch",
    color:"#a78bfa",
    short:"Saving and restoring process state.",
    detail:"When the CPU switches from one process to another, it must save the current process's state (registers, program counter) and restore the next process's saved state. This has a small overhead cost each time it occurs.",
  },
];

function GlossaryModal({onClose}){
  const [active,setActive]=useState(0);
  const term=GLOSSARY_TERMS[active];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:20,
        width:740,maxWidth:"95vw",overflow:"hidden",animation:"popIn .28s ease both",
        boxShadow:"0 28px 80px rgba(0,0,0,.8)"}}>

        {/* header */}
        <div style={{padding:"22px 28px 18px",borderBottom:"1px solid var(--line)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>📖 Glossary & Key Terms</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Click any term to read its full explanation</div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,borderRadius:8,background:"var(--bg3)",
              color:"var(--t2)",fontSize:18,display:"flex",alignItems:"center",
              justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>×</button>
        </div>

        <div style={{display:"flex",height:380}}>
          {/* term list */}
          <div style={{width:200,borderRight:"1px solid var(--line)",
            padding:"12px 10px",display:"flex",flexDirection:"column",gap:3,
            overflowY:"auto",flexShrink:0}}>
            {GLOSSARY_TERMS.map((g,i)=>(
              <button key={g.term} onClick={()=>setActive(i)}
                style={{padding:"9px 12px",borderRadius:9,textAlign:"left",
                  background:active===i?`${g.color}18`:"transparent",
                  border:`1px solid ${active===i?g.color+"50":"transparent"}`,
                  borderLeft:`3px solid ${active===i?g.color:"transparent"}`,
                  color:active===i?g.color:"var(--t2)",
                  fontSize:13,fontWeight:active===i?700:400,
                  transition:"all .15s",cursor:"pointer"}}
                onMouseEnter={e=>{if(active!==i){e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t1)";}}}
                onMouseLeave={e=>{if(active!==i){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t2)";}}}
              >{g.term}</button>
            ))}
          </div>

          {/* term detail */}
          <div key={active} style={{flex:1,padding:"28px 32px",animation:"fadeUp .25s ease both",
            display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:term.color,
                boxShadow:`0 0 12px ${term.color}80`}}/>
              <span style={{fontSize:12,fontWeight:700,fontFamily:"var(--mono)",
                color:term.color,letterSpacing:".1em"}}>{term.term.toUpperCase()}</span>
            </div>
            <h3 style={{fontSize:26,fontWeight:800,color:"var(--t1)",
              lineHeight:1.25,marginBottom:12}}>{term.short}</h3>
            <div style={{width:40,height:3,borderRadius:2,background:term.color,marginBottom:18}}/>
            <p style={{fontSize:15,color:"var(--t2)",lineHeight:1.8,maxWidth:420}}>{term.detail}</p>

            <div style={{marginTop:24,display:"flex",gap:8}}>
              {active>0&&(
                <button onClick={()=>setActive(a=>a-1)}
                  style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--line2)",
                    background:"transparent",color:"var(--t2)",fontSize:13,fontWeight:600,
                    transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t1)";}}>
                  ← Prev
                </button>
              )}
              {active<GLOSSARY_TERMS.length-1&&(
                <button onClick={()=>setActive(a=>a+1)}
                  style={{padding:"8px 16px",borderRadius:8,
                    background:`${term.color}20`,border:`1px solid ${term.color}50`,
                    color:term.color,fontSize:13,fontWeight:700,transition:"all .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── THEORY MODAL ───────────────────────────────────────── */
const THEORY_ALGOS = [
  {
    id:"fcfs",label:"FCFS",full:"First Come, First Served",color:"#f97316",icon:"→",
    tagline:"The simplest scheduler. Whoever arrives first, runs first.",
    how:"The CPU maintains a queue of incoming processes sorted purely by arrival time. As soon as the CPU is free, the process at the front of the queue gets to run. It runs to completion — no interruptions.",
    example:"P1 arrives at t=0, P2 at t=1, P3 at t=2. FCFS runs them exactly in that order: P1 → P2 → P3, regardless of how long each takes.",
    pros:["Zero complexity — trivial to implement","No process ever starves — every arrival eventually runs","Predictable, deterministic execution order"],
    cons:["Convoy Effect: one long process blocks all short ones behind it","Poor average wait time when burst times vary widely","Not suitable for interactive or time-sensitive systems"],
    metric:"Avg wait = (0 + (t_P1_end - 1) + (t_P2_end - 2)) / 3 — gets worse with long early jobs.",
  },
  {
    id:"sjf",label:"SJF",full:"Shortest Job First",color:"#60a5fa",icon:"↓",
    tagline:"Always run the shortest available job next.",
    how:"At each scheduling decision, the CPU scans all processes currently in the ready queue and picks the one with the smallest burst time. If two processes tie, arrival time breaks the tie. Once running, the process completes without interruption (non-preemptive).",
    example:"P1(burst=6), P2(burst=2), P3(burst=4) all arrive at t=0. SJF runs: P2(2) → P3(4) → P1(6). Average wait = (0+2+6)/3 = 2.67 vs FCFS avg wait of 4.",
    pros:["Provably optimal average waiting time among non-preemptive algorithms","Short tasks get fast responses — good for batch workloads","Minimises turnaround time across the process set"],
    cons:["Starvation: long processes may never run if short ones keep arriving","Requires knowing burst time in advance — often impossible in practice","Poor choice for interactive systems where response time matters equally"],
    metric:"Minimises Σ(wait_i)/n — this is its strongest theoretical guarantee.",
  },
  {
    id:"rr",label:"Round Robin",full:"Round Robin",color:"#2dd4bf",icon:"↻",
    tagline:"Every process gets an equal, fair time slice before rotating.",
    how:"Each process is given a fixed time slice called a quantum. The CPU runs the front process for exactly one quantum. If it hasn't finished, it's moved to the back of the queue. Then the next process gets its quantum. This cycles until all processes complete.",
    example:"Quantum=2. P1(burst=5), P2(burst=3). Execution: P1(2) → P2(2) → P1(2) → P2(1) → P1(1). Every process makes progress before any one monopolises the CPU.",
    pros:["Fair: no process waits more than (n-1)×quantum time","Good response time for interactive systems","Prevents starvation completely — every process rotates through"],
    cons:["High context switch overhead if quantum is too small","Higher turnaround than SJF for CPU-bound workloads","Performance heavily depends on choosing the right quantum size"],
    metric:"Response time ≤ (n−1)×q. Turnaround is typically higher than SJF.",
  },
];

function TheoryModal({onClose}){
  const [active,setActive]=useState("fcfs");
  const algo=THEORY_ALGOS.find(a=>a.id===active);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--line2)",borderRadius:20,
        width:800,maxWidth:"96vw",overflow:"hidden",animation:"popIn .28s ease both",
        boxShadow:"0 28px 80px rgba(0,0,0,.85)"}}>

        {/* header */}
        <div style={{padding:"22px 28px 18px",borderBottom:"1px solid var(--line)",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>🧠 Theory & Algorithms</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Understand how each algorithm works, with examples and trade-offs</div>
          </div>
          <button onClick={onClose}
            style={{width:32,height:32,borderRadius:8,background:"var(--bg3)",
              color:"var(--t2)",fontSize:18,display:"flex",alignItems:"center",
              justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>×</button>
        </div>

        {/* algo tabs */}
        <div style={{display:"flex",gap:3,padding:"14px 20px 0",borderBottom:"1px solid var(--line)"}}>
          {THEORY_ALGOS.map(a=>(
            <button key={a.id} onClick={()=>setActive(a.id)}
              style={{padding:"9px 22px",borderRadius:"9px 9px 0 0",fontSize:14,fontWeight:700,
                background:active===a.id?a.color+"22":"transparent",
                color:active===a.id?a.color:"var(--t3)",
                border:`1px solid ${active===a.id?a.color+"55":"transparent"}`,
                borderBottom:active===a.id?"1px solid transparent":"none",
                transition:"all .18s",cursor:"pointer"}}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div key={active} style={{padding:"28px 32px",animation:"fadeUp .25s ease both",
          maxHeight:"62vh",overflowY:"auto"}}>

          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <span style={{fontFamily:"var(--mono)",fontSize:22,fontWeight:800,color:algo.color}}>{algo.label}</span>
            <span style={{fontSize:14,color:"var(--t3)"}}>· {algo.full}</span>
          </div>
          <div style={{fontSize:18,fontWeight:700,color:"var(--t1)",marginBottom:14,lineHeight:1.35}}>
            "{algo.tagline}"
          </div>
          <div style={{width:48,height:3,borderRadius:2,background:algo.color,marginBottom:20}}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:22}}>
            <div style={{padding:"18px 20px",borderRadius:12,
              background:"var(--bg3)",border:"1px solid var(--line)"}}>
              <div style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",
                letterSpacing:".1em",fontWeight:700,marginBottom:10}}>HOW IT WORKS</div>
              <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.75}}>{algo.how}</p>
            </div>
            <div style={{padding:"18px 20px",borderRadius:12,
              background:`${algo.color}0c`,border:`1px solid ${algo.color}30`}}>
              <div style={{fontSize:11,color:algo.color,fontFamily:"var(--mono)",
                letterSpacing:".1em",fontWeight:700,marginBottom:10}}>EXAMPLE</div>
              <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.75}}>{algo.example}</p>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
            <div style={{padding:"16px 18px",borderRadius:10,
              background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.2)"}}>
              <div style={{fontSize:11,color:"var(--green)",fontFamily:"var(--mono)",
                letterSpacing:".1em",fontWeight:700,marginBottom:10}}>✓ STRENGTHS</div>
              {algo.pros.map((p,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7}}>
                  <span style={{color:"var(--green)",fontSize:12,marginTop:2,flexShrink:0}}>✓</span>
                  <span style={{fontSize:13,color:"var(--t2)",lineHeight:1.55}}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"16px 18px",borderRadius:10,
              background:"rgba(251,113,133,.06)",border:"1px solid rgba(251,113,133,.2)"}}>
              <div style={{fontSize:11,color:"var(--rose)",fontFamily:"var(--mono)",
                letterSpacing:".1em",fontWeight:700,marginBottom:10}}>✗ LIMITATIONS</div>
              {algo.cons.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7}}>
                  <span style={{color:"var(--rose)",fontSize:12,marginTop:2,flexShrink:0}}>✗</span>
                  <span style={{fontSize:13,color:"var(--t2)",lineHeight:1.55}}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{padding:"14px 18px",borderRadius:10,
            background:"var(--bg3)",border:"1px solid var(--line)",
            display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>📊</span>
            <div>
              <div style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",
                letterSpacing:".08em",fontWeight:700,marginBottom:4}}>KEY METRIC</div>
              <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,fontFamily:"var(--mono)"}}>{algo.metric}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN APP
════════════════════════════════════════════════════════════ */
export default function App(){
  const [showWalk,setShowWalk]  = useState(true);
  const [algo,setAlgo]          = useState("fcfs");
  const [quantum,setQ]          = useState(2);
  const [procs,setProcs]        = useState(DEFAULT_PROCS);
  const [step,setStep]          = useState(-1);
  const [playing,setPlay]       = useState(false);
  const [speed,setSpeed]        = useState(1.0);
  const [showEditor,setEditor]  = useState(false);
  const [showCompare,setCompare]= useState(false);
  const [ytiTopic,setYTI]       = useState(null);
  const [showGlossary,setShowGlossary] = useState(false);
  const [showTheory,setShowTheory]     = useState(false);
  const [showExplore,setShowExplore]   = useState(false);
  const [quizMode,setQuizMode]         = useState(false);
  const [quizPending,setQuizPending]   = useState(false);
  const tickRef                 = useRef(null);
  const kernelRef               = useRef(null);
  useEffect(()=>{ if(kernelRef.current){ kernelRef.current.scrollTop=kernelRef.current.scrollHeight; } },[step]);

  const steps=algo==="fcfs"?runFCFS(procs):algo==="sjf"?runSJF(procs):algo==="priority"?runPRIORITY(procs):runRR(procs,quantum);
  const cur=steps[step];
  const done=step>=steps.length-1&&step>=0;

  const reset=useCallback(()=>{setStep(-1);setPlay(false);},[]);
  useEffect(reset,[algo,quantum,procs]);
  useEffect(()=>{
    if(playing){
      tickRef.current=setInterval(()=>{
        setStep(v=>{
          if(v>=steps.length-1){setPlay(false);clearInterval(tickRef.current);return v;}
          if(quizMode){
            setPlay(false);
            clearInterval(tickRef.current);
            setQuizPending(true);
            return v;
          }
          return v+1;
        });
      },Math.round(1300/speed));
    } else clearInterval(tickRef.current);
    return()=>clearInterval(tickRef.current);
  },[playing,steps.length,speed]);

  const ALGO={
    fcfs:    {label:"FCFS",     full:"First Come, First Served",tip:"Runs processes in arrival order. Simple, no priority.",color:"#f97316"},
    sjf:     {label:"SJF",      full:"Shortest Job First",      tip:"Always picks the process needing the least CPU time.",color:"#60a5fa"},
    rr:      {label:"Round Robin",full:"Round Robin",           tip:"Each process gets a fixed time slice before rotating.",color:"#2dd4bf"},
    priority:{label:"Priority", full:"Priority Scheduling",    tip:"Runs the highest-priority process first. 1 = most urgent.",color:"#c084fc"},
  };
  const meta=ALGO[algo];

  const procStatus=procs.map(p=>{
    const pSteps=steps.filter(s=>s.pid===p.id);
    const executed=step>=0?steps.slice(0,step+1).filter(s=>s.pid===p.id).length:0;
    const isRunning=cur?.pid===p.id;
    const isDone=executed>=pSteps.length&&pSteps.length>0&&!isRunning;
    return{...p,isRunning,isDone};
  });
  const statsData=procs.map(p=>{
    const pSteps=steps.filter(s=>s.pid===p.id);
    const finishTime=pSteps.length?pSteps[pSteps.length-1].end:0;
    const execTotal=pSteps.reduce((a,s)=>a+(s.end-s.start),0);
    const wait=Math.max(0,finishTime-p.arrival-execTotal);
    const ta=finishTime-p.arrival;
    const executed=step>=0?steps.slice(0,step+1).filter(s=>s.pid===p.id).length:0;
    const isDone2=executed>=pSteps.length&&pSteps.length>0&&executed>0;
    return{...p,wait,ta,isDone2};
  });

  return(
    <>
      <style>{STYLES}</style>
      {showWalk&&<WalkThrough onDone={()=>setShowWalk(false)}/>}
      {showEditor&&<ProcessEditor procs={procs} onSave={p=>{setProcs(p);setEditor(false);}} onClose={()=>setEditor(false)}/>}
      {showCompare&&<CompareModal procs={procs} onClose={()=>setCompare(false)}/>}
      {ytiTopic&&<YTIOverlay topic={ytiTopic} onClose={()=>setYTI(null)}/>}
      {showGlossary&&<GlossaryModal onClose={()=>setShowGlossary(false)}/>}
      {quizPending&&quizMode&&(
        <QuizOverlay
          steps={steps} step={step}
          onCorrect={()=>{setQuizPending(false);setStep(v=>Math.min(v+1,steps.length-1));setPlay(true);}}
          onSkip={()=>{setQuizPending(false);setStep(v=>Math.min(v+1,steps.length-1));setPlay(true);}}
        />
      )}
      {showTheory&&<TheoryModal onClose={()=>setShowTheory(false)}/>}

      <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ══ TOP BAR — taller ════════════════════════════ */}
        <div style={{height:"var(--topbar)",display:"flex",alignItems:"center",
          padding:"0 22px",borderBottom:"1px solid var(--line)",
          background:"var(--bg1)",flexShrink:0,gap:16}}>

          <div style={{display:"flex",alignItems:"center",gap:10,marginRight:6}}>
            <div style={{width:32,height:32,borderRadius:9,
              background:"linear-gradient(135deg,#f97316,#f43f5e)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>C</div>
            <span style={{fontSize:15,fontWeight:700,color:"var(--t1)"}}>Coding Pro</span>
            <span style={{fontSize:13,color:"var(--t3)",fontFamily:"var(--mono)"}}>/ cpu-scheduling</span>
          </div>

          {/* algo tabs */}
          <div style={{display:"flex",gap:3,padding:"4px",borderRadius:11,
            background:"var(--bg3)",border:"1px solid var(--line)"}}>
            {Object.entries(ALGO).map(([key,m])=>(
              <button key={key} onClick={()=>setAlgo(key)}
                style={{padding:"7px 18px",borderRadius:8,fontSize:14,fontWeight:600,
                  background:algo===key?m.color:"transparent",
                  color:algo===key?"#fff":"var(--t2)",transition:"all .2s",border:"none",
                  boxShadow:algo===key?`0 2px 14px ${m.color}55`:"none"}}>
                {m.label}
              </button>
            ))}
          </div>

          {/* quantum */}
          {algo==="rr"&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",
              borderRadius:10,border:"1px solid var(--teal)",background:"var(--teal2)"}}>
              <Tip label="Quantum" tip="Time slice given to each process before preemption." color="var(--teal)"/>
              <span style={{color:"var(--t3)"}}>:</span>
              {[1,2,3,4].map(v=>(
                <button key={v} onClick={()=>setQ(v)}
                  style={{width:30,height:30,borderRadius:7,fontSize:13,fontWeight:700,
                    background:quantum===v?"var(--teal)":"transparent",
                    color:quantum===v?"#000":"var(--t2)",
                    border:`1px solid ${quantum===v?"var(--teal)":"var(--line2)"}`,
                    transition:"all .15s"}}>{v}</button>
              ))}
            </div>
          )}

          <div style={{marginLeft:"auto",display:"flex",gap:9,alignItems:"center"}}>
            <button onClick={()=>setCompare(true)}
              style={{padding:"7px 16px",borderRadius:9,fontSize:14,fontWeight:500,
                border:"1px solid var(--line2)",color:"var(--t1)",background:"var(--bg2)",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--bg4)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--bg2)"}>
              ⚖ Compare
            </button>
            <button onClick={()=>setShowWalk(true)}
              style={{padding:"7px 16px",borderRadius:9,fontSize:14,fontWeight:500,
                border:"1px solid var(--line2)",color:"var(--t1)",background:"var(--bg2)",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--bg4)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--bg2)"}>
              ? Guide
            </button>
            {/* Explore More button + dropdown */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowExplore(v=>!v)}
                style={{padding:"7px 16px",borderRadius:9,fontSize:14,fontWeight:700,
                  border:`1px solid ${showExplore?"var(--orange)":"var(--orange3)"}`,
                  color:"var(--orange)",background:showExplore?"var(--orange2)":"rgba(249,115,22,.08)",
                  transition:"all .18s",display:"flex",alignItems:"center",gap:6}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--orange2)";e.currentTarget.style.borderColor="var(--orange)";}}
                onMouseLeave={e=>{if(!showExplore){e.currentTarget.style.background="rgba(249,115,22,.08)";e.currentTarget.style.borderColor="var(--orange3)";}}}>
                🧭 Explore More
                <span style={{fontSize:11,transform:showExplore?"rotate(180deg)":"rotate(0deg)",
                  transition:"transform .2s",display:"inline-block"}}>▾</span>
              </button>
              {showExplore&&(
                <div style={{
                  position:"absolute",top:"calc(100% + 8px)",right:0,
                  background:"var(--bg2)",border:"1px solid var(--orange3)",
                  borderRadius:12,padding:"8px",width:220,zIndex:500,
                  boxShadow:"0 16px 40px rgba(0,0,0,.7)",animation:"tooltipIn .18s ease both"}}
                  onMouseLeave={()=>setShowExplore(false)}>
                  <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)",
                    letterSpacing:".1em",padding:"4px 8px 8px",fontWeight:700}}>
                    OS LEARNING MODULES
                  </div>
                  {[
                    {label:"Memory Management", icon:"🧠"},
                    {label:"Process Sync",       icon:"🔄"},
                    {label:"Deadlocks",          icon:"🔒"},
                    {label:"Virtual Memory",     icon:"💾"},
                  ].map(item=>(
                    <button key={item.label}
                      onClick={()=>{setShowExplore(false);setYTI(item.label);}}
                      style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                        padding:"9px 12px",borderRadius:8,border:"none",background:"transparent",
                        color:"var(--t2)",fontSize:13,fontWeight:500,textAlign:"left",
                        cursor:"pointer",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--orange)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t2)";}}>
                      <span style={{fontSize:16}}>{item.icon}</span>
                      <span>{item.label}</span>
                      <span style={{marginLeft:"auto",fontSize:11,color:"var(--t3)"}}>›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ BODY ════════════════════════════════════════ */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* ── LEFT PANEL ──────────────────────────────── */}
          <div style={{width:"var(--left)",borderRight:"1px solid var(--line)",
            background:"var(--bg1)",display:"flex",flexDirection:"column",
            padding:"18px 16px",gap:10,flexShrink:0,overflowY:"auto"}}>

            <SH action={
              <button onClick={()=>setEditor(true)}
                style={{padding:"7px 16px",borderRadius:8,fontSize:13,fontWeight:700,
                  background:"var(--orange)",color:"#fff",border:"none",
                  boxShadow:"0 2px 16px rgba(249,115,22,.55)",transition:"all .18s",
                  animation:"editPulse 2.5s ease infinite"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.boxShadow="0 4px 24px rgba(249,115,22,.75)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 2px 16px rgba(249,115,22,.55)";}}>
                ✎ Edit
              </button>
            }>PROCESSES</SH>

            {procStatus.map(p=>(
              <div key={p.id} style={{
                padding:"12px 14px",borderRadius:12,
                background:p.isRunning?`${p.color.bg}1c`:p.isDone?"rgba(255,255,255,.02)":"var(--bg2)",
                border:`1.5px solid ${p.isRunning?p.color.bg+"80":p.hungerPct>66?"rgba(251,113,133,.5)":"var(--line)"}`,
                transition:"all .35s ease",
                transform:p.isRunning?"translateX(5px)":"translateX(0)",
                opacity:p.isDone?.32:1,
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:12,height:12,borderRadius:"50%",background:p.color.bg,flexShrink:0,
                      boxShadow:p.isRunning?`0 0 14px ${p.color.glow}`:"none",transition:"box-shadow .3s"}}/>
                    <span style={{fontFamily:"var(--mono)",fontSize:16,fontWeight:700,
                      color:p.isRunning?p.color.bg:"var(--t1)"}}>{p.id}</span>
                    {algo==="priority"&&!p.isDone&&(
                      <span style={{fontSize:10,fontFamily:"var(--mono)",fontWeight:800,
                        padding:"1px 6px",borderRadius:4,
                        background:"rgba(192,132,252,.18)",color:"var(--purple)",
                        border:"1px solid rgba(192,132,252,.35)"}}>
                        P{p.priority||"?"}
                      </span>
                    )}
                  </div>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:"var(--mono)",
                    color:p.isRunning?"var(--green)":p.isDone?"var(--t3)":p.hungerPct>66?"var(--rose)":"var(--t2)"}}>
                    {p.isRunning?"▶ EXEC":p.isDone?"✓ DONE":p.hungerPct>50?"STARVING":"READY"}
                  </span>
                </div>
                {/* STARVATION HUNGER METER — full width, prominent */}
                {!p.isDone&&!p.isRunning&&p.waitSoFar>0&&(
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:10,color:p.hungerPct>66?"var(--rose)":p.hungerPct>33?"var(--yellow)":"var(--t3)",
                        fontFamily:"var(--mono)",fontWeight:700}}>
                        {p.hungerPct>66?"⚠ STARVATION":p.hungerPct>33?"⏳ WAITING":"🟡 QUEUED"}
                      </span>
                      <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>
                        {p.waitSoFar}u waiting
                      </span>
                    </div>
                    <div style={{width:"100%",height:6,borderRadius:3,background:"var(--bg4)",overflow:"hidden"}}>
                      <div style={{
                        height:"100%",borderRadius:3,
                        background:p.hungerPct>66?"var(--rose)":p.hungerPct>33?"var(--yellow)":"var(--teal)",
                        width:`${p.hungerPct}%`,
                        transition:"width .5s ease",
                        animation:p.hungerPct>66?"hungerPulse 1s ease infinite":"none",
                        boxShadow:p.hungerPct>66?"0 0 8px var(--rose)":"none",
                      }}/>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:7}}>
                  {[{l:"ARRIVAL",v:p.arrival},{l:"BURST",v:p.burst}].map(f=>(
                    <div key={f.l} style={{flex:1,textAlign:"center",padding:"6px 0",
                      background:"var(--bg3)",borderRadius:7,border:"1px solid var(--line)"}}>
                      <div style={{fontSize:10,color:"var(--t3)",marginBottom:2,fontWeight:700,letterSpacing:".04em"}}>{f.l}</div>
                      <div style={{fontSize:16,fontFamily:"var(--mono)",fontWeight:700,color:"var(--t1)"}}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{marginTop:4,padding:"14px",borderRadius:11,
              background:"var(--bg2)",border:`1.5px solid ${meta.color}45`}}>
              <div style={{fontSize:11,color:"var(--t3)",marginBottom:7,fontWeight:800,letterSpacing:".1em",fontFamily:"var(--mono)"}}>
                ACTIVE ALGORITHM
              </div>
              <div style={{fontSize:16,color:meta.color,fontWeight:800,fontFamily:"var(--mono)",marginBottom:6}}>
                {meta.label}
              </div>
              <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{meta.tip}</div>
            </div>
          </div>

          {/* ── CENTRE ──────────────────────────────────── */}
          <div style={{flex:1,display:"flex",flexDirection:"column",
            overflowY:"auto",overflowX:"hidden",padding:"18px 24px",gap:14,minWidth:0}}>

            {/* simulation controls */}
            <div style={{flexShrink:0,background:"var(--bg2)",borderRadius:14,
              border:"1px solid var(--line2)",padding:"16px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <button
                  onClick={()=>{ if(done){reset();}else{setPlay(v=>!v);} }}
                  style={{
                    flex:1,padding:"14px 0",borderRadius:11,
                    background:done?"var(--green2)":playing?"rgba(251,113,133,.2)":"var(--orange)",
                    border:done?"1.5px solid rgba(74,222,128,.5)":playing?"1.5px solid rgba(251,113,133,.5)":"none",
                    color:done?"var(--green)":playing?"var(--rose)":"#fff",
                    fontSize:17,fontWeight:800,
                    boxShadow:(!done&&!playing)?"0 4px 28px rgba(249,115,22,.55)":"none",
                    animation:(!done&&!playing&&step<0)?"pulseRing 2s ease-in-out infinite,bounceBtn 2.5s ease-in-out infinite":"none",
                    transition:"all .2s ease",letterSpacing:".01em",
                  }}
                  onMouseEnter={e=>{if(!done)e.currentTarget.style.transform="scale(1.02)";}}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  {done?"↺  Restart":playing?"⏸  Pause Simulation":"▶  Start Simulation"}
                </button>
                <button
                  onClick={()=>{if(step>-1&&!playing)setStep(v=>v-1);}}
                  disabled={step<0||playing}
                  title="Step backward"
                  style={{padding:"14px 16px",borderRadius:11,
                    border:"1.5px solid var(--line2)",background:"var(--bg3)",
                    color:step<0||playing?"var(--t3)":"var(--t1)",
                    fontSize:15,fontWeight:600,transition:"all .18s",
                    opacity:step<0||playing?.35:1}}
                  onMouseEnter={e=>{if(step>-1&&!playing)e.currentTarget.style.background="var(--bg4)";}}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--bg3)"}>
                  ←
                </button>
                <button
                  onClick={()=>{if(!done&&!playing){if(quizMode&&step<steps.length-1){setQuizPending(true);}else{setStep(v=>Math.min(v+1,steps.length-1));}}}}
                  disabled={done||playing}
                  title="Step forward"
                  style={{padding:"14px 16px",borderRadius:11,
                    border:"1.5px solid var(--line2)",background:"var(--bg3)",
                    color:done||playing?"var(--t3)":"var(--t1)",
                    fontSize:15,fontWeight:600,transition:"all .18s",
                    opacity:done||playing?.4:1}}
                  onMouseEnter={e=>{if(!done&&!playing)e.currentTarget.style.background="var(--bg4)";}}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--bg3)"}>
                  →
                </button>
                <button onClick={reset}
                  style={{padding:"14px 16px",borderRadius:11,border:"1.5px solid var(--line)",
                    background:"transparent",color:"var(--t2)",fontSize:16,fontWeight:600,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t2)";}}>
                  ↺
                </button>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <span style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Speed:</span>
                {[{v:.5,l:"0.5×"},{v:1,l:"1×"},{v:2,l:"2×"},{v:3,l:"3×"}].map(s=>(
                  <button key={s.v} onClick={()=>setSpeed(s.v)}
                    style={{padding:"5px 13px",borderRadius:7,fontSize:13,fontWeight:600,
                      background:speed===s.v?"var(--orange2)":"transparent",
                      color:speed===s.v?"var(--orange)":"var(--t2)",
                      border:`1px solid ${speed===s.v?"var(--orange)":"var(--line2)"}`,
                      transition:"all .15s"}}>
                    {s.l}
                  </button>
                ))}
                <button onClick={()=>setQuizMode(v=>!v)}
                  style={{padding:"6px 16px",borderRadius:8,fontSize:13,fontWeight:800,
                    background:quizMode?"rgba(192,132,252,.25)":"rgba(192,132,252,.08)",
                    color:quizMode?"var(--purple)":"rgba(192,132,252,.6)",
                    border:`1.5px solid ${quizMode?"var(--purple)":"rgba(192,132,252,.3)"}`,
                    transition:"all .18s",display:"flex",alignItems:"center",gap:6,
                    boxShadow:quizMode?"0 0 14px rgba(192,132,252,.35)":"none",
                    animation:quizMode?"none":"none"}}
                  title="Quiz Mode: test yourself before each step"
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(192,132,252,.2)";e.currentTarget.style.borderColor="var(--purple)";e.currentTarget.style.color="var(--purple)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=quizMode?"rgba(192,132,252,.25)":"rgba(192,132,252,.08)";e.currentTarget.style.borderColor=quizMode?"var(--purple)":"rgba(192,132,252,.3)";e.currentTarget.style.color=quizMode?"var(--purple)":"rgba(192,132,252,.6)";}}>
                  🎯 {quizMode?"Quiz ON ✓":"Quiz Mode"}
                </button>
                {done&&(
                  <div style={{marginLeft:"auto",padding:"5px 16px",borderRadius:8,
                    background:"var(--green2)",border:"1px solid rgba(74,222,128,.35)",
                    fontSize:14,color:"var(--green)",fontWeight:700,
                    animation:"completePop .4s ease"}}>
                    ✓ Complete
                  </div>
                )}
              </div>
            </div>

            {/* queue + cpu */}
            <div style={{display:"flex",alignItems:"stretch",gap:0,flexShrink:0}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:800,color:"var(--t1)",
                  letterSpacing:".12em",fontFamily:"var(--mono)",marginBottom:9}}>
                  <Tip label="READY QUEUE" tip="Processes in memory, waiting for their turn on the CPU." color="var(--t1)"/>
                </div>
                <div style={{display:"flex",gap:14,padding:"16px 20px",
                  borderRadius:"12px 0 0 12px",border:"1.5px solid var(--line2)",
                  borderRight:"none",background:"var(--bg2)",minHeight:86,
                  alignItems:"center",flexWrap:"wrap"}}>
                  {procStatus.map(p=>(
                    <div key={p.id} style={{display:"flex",flexDirection:"column",
                      alignItems:"center",gap:5,
                      transform:p.isRunning?"translateX(10px) scale(1.12)":"scale(1)",
                      opacity:p.isDone&&!p.isRunning?.15:1,
                      transition:"all .45s cubic-bezier(.34,1.56,.64,1)"}}>
                      <div style={{position:"relative"}}>
                        <div style={{
                          width:50,height:50,borderRadius:12,background:p.color.bg,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:15,fontWeight:800,color:p.color.t,
                          boxShadow:p.isRunning?`0 0 0 3px ${p.color.glow},0 0 26px ${p.color.glow}`:"none",
                          border:`2px solid ${p.isRunning?"rgba(255,255,255,.7)":p.hungerPct>50?"rgba(251,113,133,.6)":"transparent"}`,
                          transition:"all .35s ease"}}>
                          {p.id}
                        </div>
                        {algo==="priority"&&!p.isDone&&(
                          <div style={{position:"absolute",top:-6,right:-6,
                            width:18,height:18,borderRadius:"50%",
                            background:"var(--purple)",border:"1.5px solid var(--bg2)",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            fontSize:9,fontWeight:800,color:"#fff"}}>
                            {p.priority||"?"}
                          </div>
                        )}
                      </div>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",fontWeight:700,
                        color:p.isRunning?"var(--green)":p.isDone?"var(--t3)":p.hungerPct>66?"var(--rose)":"var(--t2)"}}>
                        {p.isRunning?"▶ exec":p.isDone?"done":p.waitSoFar>0?`wait:${p.waitSoFar}`:`b=${p.burst}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:5,padding:"0 10px",flexShrink:0,
                background:"transparent"}}>
                <div style={{height:3,width:40,borderRadius:2,
                  background:cur?"linear-gradient(90deg,var(--orange),transparent)":"var(--bg4)",
                  animation:cur?"trackGlow 1s ease infinite":"none",transition:"background .4s"}}/>
                <span style={{fontSize:22,color:cur?"var(--orange)":"var(--t3)",
                  fontWeight:800,transition:"color .4s",
                  animation:cur?"trackGlow 1s ease .5s infinite":"none"}}>→</span>
                <div style={{height:3,width:40,borderRadius:2,
                  background:cur?"linear-gradient(90deg,transparent,var(--orange))":"var(--bg4)",
                  animation:cur?"trackGlow 1s ease 1s infinite":"none",transition:"background .4s"}}/>
              </div>

              <div style={{width:160,flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:800,color:"var(--t1)",
                  letterSpacing:".12em",fontFamily:"var(--mono)",marginBottom:9}}>CPU</div>
                <div style={{
                  padding:"16px 14px",borderRadius:"0 12px 12px 0",
                  border:`1.5px solid ${cur?cur.color.bg+"70":"var(--line2)"}`,
                  background:cur?`${cur.color.bg}10`:"var(--bg2)",
                  minHeight:86,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:7,
                  transition:"all .4s ease",
                  animation:cur?"cpuSpin 2s ease-in-out infinite":"none"}}>
                  {cur?(
                    <>
                      <div style={{width:52,height:52,borderRadius:12,background:cur.color.bg,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:18,fontWeight:800,color:cur.color.t,
                        boxShadow:`0 0 36px ${cur.color.glow}`,animation:"popIn .4s ease"}}>
                        {cur.pid}
                      </div>
                      <span style={{fontSize:12,fontFamily:"var(--mono)",
                        color:cur.color.bg,fontWeight:700}}>
                        {cur.end-cur.start}u executing
                      </span>
                    </>
                  ):(
                    <>
                      <div style={{width:46,height:46,borderRadius:10,
                        border:"1.5px dashed var(--t3)",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:12,color:"var(--t3)",fontFamily:"var(--mono)"}}>
                          {done?"done":"idle"}
                        </span>
                      </div>
                      {!done&&step<0&&(
                        <span style={{fontSize:11,color:"var(--t3)",textAlign:"center",lineHeight:1.5}}>
                          Press ▶ above<br/>to start
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* explanation */}
            <div style={{flexShrink:0,borderRadius:12,
              border:`1.5px solid ${cur?cur.color.bg+"40":"var(--line)"}`,
              background:cur?`${cur.color.bg}0c`:"var(--bg2)",
              padding:"16px 20px",transition:"all .4s ease",minHeight:100}}>
              {cur?(
                <div key={step} style={{animation:"slideUp .25s ease both"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:9}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:cur.color.bg,
                      flexShrink:0,animation:"pulse 1.2s ease infinite"}}/>
                    <span style={{fontSize:12,fontWeight:800,color:"var(--t2)",
                      fontFamily:"var(--mono)",letterSpacing:".1em"}}>
                      EXPLANATION · STEP {step+1} OF {steps.length}
                    </span>
                  </div>
                  <p style={{fontSize:16,fontWeight:700,color:"var(--t1)",marginBottom:7,lineHeight:1.5}}>
                    {cur.why}
                  </p>
                  <p style={{fontSize:14,color:"var(--t2)",lineHeight:1.65}}>{cur.detail}</p>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:14,height:"100%"}}>
                  <span style={{fontSize:32,flexShrink:0}}>💡</span>
                  <p style={{fontSize:15,color:"var(--t2)",lineHeight:1.7}}>
                    {done
                      ?"Simulation complete! All processes have executed. Try a different algorithm or hit Restart."
                      :"Step-by-step explanations appear here as each process executes. Hit ▶ Start above to begin."}
                  </p>
                </div>
              )}
            </div>

            {/* gantt */}
            <div style={{flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"var(--t1)",
                letterSpacing:".12em",fontFamily:"var(--mono)",marginBottom:9}}>
                <Tip label="GANTT CHART" tip="Timeline showing which process ran at each unit of time." color="var(--t1)"/>
              </div>
              <GanttBar steps={steps} currentStep={step} onScrub={(i)=>{setPlay(false);setStep(i);}}/>

            {/* action buttons row */}
            <div style={{flexShrink:0,display:"flex",gap:10}}>
              <button onClick={()=>setShowGlossary(true)}
                style={{flex:1,padding:"11px 0",borderRadius:10,
                  border:"1.5px solid var(--line2)",background:"var(--bg2)",
                  color:"var(--t1)",fontSize:14,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  transition:"all .18s",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.borderColor="rgba(255,255,255,.22)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--bg2)";e.currentTarget.style.borderColor="var(--line2)";}}>
                <span style={{fontSize:16}}>📖</span> Glossary & Terms
              </button>
              <button onClick={()=>setShowTheory(true)}
                style={{flex:1,padding:"11px 0",borderRadius:10,
                  border:"1.5px solid var(--line2)",background:"var(--bg2)",
                  color:"var(--t1)",fontSize:14,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  transition:"all .18s",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.borderColor="rgba(255,255,255,.22)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--bg2)";e.currentTarget.style.borderColor="var(--line2)";}}>
                <span style={{fontSize:16}}>🧠</span> Theory & Algorithms
              </button>
            </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ─────────────────────────────── */}
          <div style={{width:"var(--right)",borderLeft:"1px solid var(--line)",
            background:"var(--bg1)",display:"flex",flexDirection:"column",
            padding:"18px 16px",gap:0,flexShrink:0,overflowY:"hidden"}}>

            {/* ── KERNEL OUTPUT ── */}
            <div style={{display:"flex",flexDirection:"column",flex:"1 1 0",minHeight:0,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:800,color:"var(--t1)",
                  letterSpacing:".14em",textTransform:"uppercase",fontFamily:"var(--mono)"}}>
                  Kernel Log
                </span>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",
                    background:cur?"var(--green)":"var(--t3)",
                    animation:cur?"pulse 1.5s ease infinite":"none"}}/>
                  <span style={{fontSize:10,color:cur?"var(--green)":"var(--t3)",
                    fontFamily:"var(--mono)",fontWeight:600}}>
                    {cur?"RUNNING":"IDLE"}
                  </span>
                </div>
              </div>
              <div ref={kernelRef} style={{flex:1,overflowY:"auto",background:"var(--bg)",
                borderRadius:10,border:"1px solid var(--line2)",
                padding:"10px 12px",fontFamily:"var(--mono)",fontSize:12,
                display:"flex",flexDirection:"column",gap:4}}>
                {(()=>{
                  if(step<0) return(
                    <div style={{color:"var(--t3)",textAlign:"center",marginTop:20,fontSize:12}}>
                      <div style={{fontSize:22,marginBottom:8}}>⬡</div>
                      Kernel waiting...<br/>Start simulation to see OS-level events
                    </div>
                  );
                  const logs=[];
                  logs.push({type:"boot",t:0,msg:`Scheduler initialised · Algorithm: ${algo.toUpperCase()}${algo==="rr"?" (quantum="+quantum+")":""}`,color:"var(--t3)"});
                  procs.forEach(p=>{
                    logs.push({type:"arrive",t:p.arrival,msg:`proc ${p.id} → READY QUEUE (burst=${p.burst}${algo==="priority"?`, pri=${p.priority||"?"}`:""})`,color:"var(--t2)"});
                  });
                  steps.slice(0,step+1).forEach((s,i)=>{
                    const prev=i>0?steps[i-1]:null;
                    if(prev&&prev.pid!==s.pid){
                      logs.push({type:"switch",t:s.start,msg:`context switch: ${prev.pid} ⟶ ${s.pid}`,color:"var(--yellow)"});
                    }
                    logs.push({type:"dispatch",t:s.start,msg:`dispatch ${s.pid} → CPU · slice=${s.end-s.start}u`,color:s.color.bg});
                    const totalExec=steps.slice(0,i+1).filter(x=>x.pid===s.pid).reduce((a,x)=>a+(x.end-x.start),0);
                    const p=procs.find(x=>x.id===s.pid);
                    if(p&&totalExec>=p.burst){
                      logs.push({type:"done",t:s.end,msg:`${s.pid} TERMINATED · turnaround=${s.end-p.arrival}`,color:"var(--green)"});
                    }
                  });
                  const sortedLogs=[...logs].sort((a,b)=>a.t-b.t||["boot","arrive","switch","dispatch","done"].indexOf(a.type)-["boot","arrive","switch","dispatch","done"].indexOf(b.type));
                  const ICONS={boot:"⬡",arrive:"↓",switch:"⟳",dispatch:"▶",done:"✓"};
                  return sortedLogs.map((log,i)=>(
                    <div key={i} style={{
                      display:"flex",gap:8,alignItems:"flex-start",
                      padding:"5px 7px",borderRadius:6,
                      background:log.type==="dispatch"?`${log.color}10`:"transparent",
                      borderTop:i>0?"1px solid rgba(255,255,255,.06)":"none",
                      marginTop:i>0?2:0,
                      animation:i===sortedLogs.length-1?"slideUp .2s ease both":"none",
                    }}>
                      <span style={{color:log.color,flexShrink:0,fontSize:11,marginTop:1}}>{ICONS[log.type]}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{color:"var(--t3)",fontSize:10,fontFamily:"var(--mono)"}}>t={log.t} </span>
                        <span style={{color:log.color,fontSize:11,lineHeight:1.5,wordBreak:"break-all"}}>{log.msg}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div style={{height:1,background:"var(--line)",marginBottom:14}}/>

            {/* ── EXECUTION STATS ── */}
            <div style={{flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"var(--t1)",
                letterSpacing:".14em",textTransform:"uppercase",
                fontFamily:"var(--mono)",marginBottom:10}}>
                Execution Stats
              </div>
              {statsData.map(p=>(
                <div key={p.id} style={{
                  display:"flex",alignItems:"center",
                  padding:"8px 10px",borderRadius:9,marginBottom:6,
                  background:p.isDone2?"var(--green2)":"var(--bg2)",
                  border:`1px solid ${p.isDone2?"rgba(74,222,128,.3)":"var(--line)"}`,
                  transition:"all .4s",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:"50%",
                    background:p.color.bg,flexShrink:0,
                    boxShadow:p.isDone2?`0 0 8px ${p.color.glow}`:"none"}}/>
                  <span style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:800,
                    color:p.color.bg,flex:1}}>{p.id}</span>
                  <div style={{display:"flex",gap:10,textAlign:"right"}}>
                    <div>
                      <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",fontWeight:700}}>WAIT</div>
                      <div style={{fontSize:13,fontWeight:800,fontFamily:"var(--mono)",
                        color:p.isDone2?"var(--t1)":"var(--t3)"}}>{p.isDone2?p.wait:"—"}</div>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:"var(--t3)",fontFamily:"var(--mono)",fontWeight:700}}>TURN</div>
                      <div style={{fontSize:13,fontWeight:800,fontFamily:"var(--mono)",
                        color:p.isDone2?"var(--t1)":"var(--t3)"}}>{p.isDone2?p.ta:"—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}