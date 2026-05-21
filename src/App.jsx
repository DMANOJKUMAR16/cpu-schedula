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
}
html,body,#root{height:100%;overflow:hidden}
body{
  font-family:var(--sans);background:var(--bg);color:var(--t1);
  font-size:15px;line-height:1.6;
  -webkit-user-select:none;user-select:none;
  -webkit-font-smoothing:antialiased;
}
input,-webkit-user-select:text;
input{user-select:text}
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
@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(249,115,22,.55)}70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes editPulse{0%{box-shadow:0 0 0 0 rgba(249,115,22,.5)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes cpuSpin{0%,100%{border-color:rgba(249,115,22,.45)}50%{border-color:rgba(249,115,22,1);box-shadow:0 0 32px rgba(249,115,22,.45)}}
@keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes bounceBtn{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes tooltipIn{from{opacity:0;transform:translateY(6px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes trackGlow{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes completePop{0%{transform:scale(0)}65%{transform:scale(1.15)}100%{transform:scale(1)}}
`;

const PC = [
  {bg:"#f97316",t:"#fff",glow:"rgba(249,115,22,.7)",  dim:"rgba(249,115,22,.18)"},
  {bg:"#60a5fa",t:"#fff",glow:"rgba(96,165,250,.7)",  dim:"rgba(96,165,250,.18)"},
  {bg:"#2dd4bf",t:"#000",glow:"rgba(45,212,191,.7)",  dim:"rgba(45,212,191,.18)"},
  {bg:"#c084fc",t:"#fff",glow:"rgba(192,132,252,.7)", dim:"rgba(192,132,252,.18)"},
  {bg:"#fbbf24",t:"#000",glow:"rgba(251,191,36,.7)",  dim:"rgba(251,191,36,.18)"},
];

const DEFAULT_PROCS=[
  {id:"P1",arrival:0,burst:5,color:PC[0]},
  {id:"P2",arrival:1,burst:3,color:PC[1]},
  {id:"P3",arrival:2,burst:8,color:PC[2]},
  {id:"P4",arrival:3,burst:2,color:PC[3]},
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
      why:`${pick.id} runs next — its burst time (${pick.burst}) is the shortest among ${av.length} ready process${av.length>1?"es":""}.`,
      detail:`SJF (Shortest Job First): Always picks the process needing the least CPU time. This provably minimises average waiting time, but longer jobs risk never running if short ones keep arriving.`});
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
      why:`${p.id} gets a ${exec}-unit time slice. ${p.rem-exec>0?`Still has ${p.rem-exec} units remaining — rejoins queue.`:`Completes execution now.`}`,
      detail:`Round Robin (q=${q}): Every process gets an equal time slice (quantum). When the slice expires the process moves to the back of the queue. Fair for all — good for interactive systems.`});
    t+=exec;p.rem-=exec;
    enq(t);
    if(p.rem>0)queue.push(p);
  }
  return steps;
}

/* ── TOOLTIP ─────────────────────────────────────────────── */
function Tip({label,tip,color}){
  const [show,setShow]=useState(false);
  return(
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4,cursor:"default"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <span style={{color:color||"var(--t1)",fontWeight:600}}>{label}</span>
      <span style={{
        width:15,height:15,borderRadius:"50%",background:"var(--bg4)",
        border:"1px solid var(--line2)",
        display:"inline-flex",alignItems:"center",justifyContent:"center",
        fontSize:9,color:"var(--t3)",cursor:"help",flexShrink:0,fontWeight:700,
      }}>?</span>
      {show&&(
        <div style={{
          position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",
          background:"var(--bg4)",border:"1px solid var(--line2)",borderRadius:10,
          padding:"10px 14px",fontSize:12,color:"var(--t1)",
          zIndex:9999,boxShadow:"0 12px 32px rgba(0,0,0,.7)",
          animation:"tooltipIn .18s ease both",lineHeight:1.55,
          width:220,textAlign:"center",pointerEvents:"none",
        }}>
          {tip}
          <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",
            width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",
            borderTop:"6px solid var(--bg4)"}}/>
        </div>
      )}
    </span>
  );
}

/* ── SECTION HEADING ─────────────────────────────────────── */
function SH({children,action}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <span style={{
        fontSize:11,fontWeight:700,color:"var(--t1)",
        letterSpacing:".12em",textTransform:"uppercase",
        fontFamily:"var(--mono)",
      }}>{children}</span>
      {action}
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
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(6px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--orange3)",borderRadius:18,
        padding:"28px 32px",width:460,animation:"popIn .25s ease both",
        boxShadow:"0 0 0 1px rgba(249,115,22,.1), 0 24px 80px rgba(0,0,0,.7)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>Edit Processes</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Adjust arrival & burst times — changes apply instantly</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,
            background:"var(--bg3)",color:"var(--t2)",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>
            ×
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"36px 1fr 1fr 1fr 34px",
          gap:"8px 10px",alignItems:"center",marginBottom:14}}>
          {["","Process","Arrival","Burst",""].map((h,i)=>(
            <div key={i} style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)",
              letterSpacing:".08em",paddingBottom:4,fontWeight:600}}>{h.toUpperCase()}</div>
          ))}
          {local.map((p,i)=>(
            [
              <div key={`dot${i}`} style={{width:12,height:12,borderRadius:"50%",
                background:p.color.bg,boxShadow:`0 0 10px ${p.color.glow}`,justifySelf:"center"}}/>,
              <div key={`id${i}`} style={{fontFamily:"var(--mono)",fontSize:15,fontWeight:700,color:p.color.bg}}>{p.id}</div>,
              ...["arrival","burst"].map(field=>(
                <input key={`${field}${i}`} type="number" min="0" max="20" value={p[field]}
                  onChange={e=>update(i,field,e.target.value)}
                  style={{
                    background:"var(--bg3)",border:"1px solid var(--line2)",borderRadius:8,
                    color:"var(--t1)",fontFamily:"var(--mono)",fontSize:14,fontWeight:600,
                    padding:"8px 10px",outline:"none",width:"100%",
                    WebkitUserSelect:"text",userSelect:"text",transition:"border .15s",
                  }}
                  onFocus={e=>e.target.style.borderColor="var(--orange)"}
                  onBlur={e=>e.target.style.borderColor="var(--line2)"}/>
              )),
              <button key={`del${i}`} onClick={()=>removeProc(i)}
                style={{width:30,height:30,borderRadius:7,background:"var(--rose2)",
                  color:"var(--rose)",fontSize:14,display:"flex",alignItems:"center",
                  justifyContent:"center",opacity:local.length<=2?.3:1,
                  border:"1px solid rgba(251,113,133,.3)",transition:"all .15s"}}
                onMouseEnter={e=>{if(local.length>2)e.currentTarget.style.background="rgba(251,113,133,.3)";}}
                onMouseLeave={e=>e.currentTarget.style.background="var(--rose2)"}>
                ×
              </button>
            ]
          ))}
        </div>

        {local.length<5&&(
          <button onClick={addProc}
            style={{width:"100%",padding:"9px",borderRadius:9,
              border:"1px dashed rgba(249,115,22,.4)",
              color:"var(--orange)",fontSize:13,fontWeight:600,marginBottom:18,
              transition:"all .15s",background:"transparent"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--orange2)";e.currentTarget.style.borderColor="var(--orange)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(249,115,22,.4)";}}>
            + Add Process
          </button>
        )}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSave(local)}
            style={{flex:1,padding:"12px",borderRadius:10,
              background:"var(--orange)",color:"#fff",fontSize:15,fontWeight:700,
              boxShadow:"0 4px 20px rgba(249,115,22,.4)",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 6px 28px rgba(249,115,22,.55)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 20px rgba(249,115,22,.4)";}}>
            ✓ Apply Changes
          </button>
          <button onClick={onClose}
            style={{padding:"12px 18px",borderRadius:10,border:"1px solid var(--line2)",
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
    {key:"fcfs",label:"FCFS",  color:"#f97316",steps:runFCFS(procs)},
    {key:"sjf", label:"SJF",   color:"#60a5fa",steps:runSJF(procs)},
    {key:"rr2", label:"RR (q=2)",color:"#2dd4bf",steps:runRR(procs,2)},
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
        padding:"30px 34px",width:560,animation:"popIn .25s ease both",
        boxShadow:"0 24px 80px rgba(0,0,0,.7)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"var(--t1)"}}>Algorithm Comparison</div>
            <div style={{fontSize:13,color:"var(--t3)",marginTop:3}}>Same processes, three different strategies</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:8,
            background:"var(--bg3)",color:"var(--t2)",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="var(--rose2)";e.currentTarget.style.color="var(--rose)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t2)";}}>×</button>
        </div>

        {stats.map(a=>(
          <div key={a.key} style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:700,color:a.color}}>{a.label}</span>
              <div style={{display:"flex",gap:18}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>MAKESPAN</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--t1)",fontFamily:"var(--mono)"}}>{a.makespan}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>AVG WAIT</div>
                  <div style={{fontSize:15,fontWeight:700,
                    color:parseFloat(a.avgWait)===bestWait?"var(--green)":"var(--t1)",
                    fontFamily:"var(--mono)"}}>
                    {a.avgWait} {parseFloat(a.avgWait)===bestWait&&"★"}
                  </div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",height:36,borderRadius:9,overflow:"hidden",
              border:"1px solid var(--line2)"}}>
              {a.steps.map((s,i)=>{
                const w=((s.end-s.start)/maxMake)*100;
                return(
                  <div key={i} style={{
                    width:`${w}%`,background:s.color.bg,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:700,color:"#fff",
                    borderRight:"1px solid rgba(0,0,0,.2)",
                    boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)",
                  }}>{s.pid}</div>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{padding:"14px 18px",borderRadius:10,background:"var(--bg3)",
          border:"1px solid var(--line2)",fontSize:13,color:"var(--t2)",lineHeight:1.65}}>
          <span style={{color:"var(--blue)",fontWeight:700}}>SJF</span> gives the lowest average wait time.{" "}
          <span style={{color:"var(--orange)",fontWeight:700}}>FCFS</span> is simplest but can be slow.{" "}
          <span style={{color:"var(--teal)",fontWeight:700}}>Round Robin</span> is fairest for interactive systems.
        </div>
      </div>
    </div>
  );
}

/* ── WALKTHROUGH ─────────────────────────────────────────── */
const WALK_STEPS=[
  {title:"Welcome to CPU Scheduling Lab",
   body:"This simulator shows how an operating system decides which program runs next. You'll see it happen live — no reading required.",
   cta:"Let's Begin"},
  {title:"These coloured blocks are Processes",
   body:"Each block (P1, P2…) is a program wanting CPU time. They each arrive at a different time and need a different amount of work done.",
   cta:"Got it"},
  {title:"One CPU. Many processes waiting.",
   body:"The CPU can only run ONE process at a time. The scheduling algorithm decides the order. Watch the arrow — that's a process moving into the CPU.",
   cta:"Show Me"},
  {title:"Hit ▶ Start Simulation",
   body:"The big orange button starts the animation. Every step is explained automatically. You can also step through manually.",
   cta:"Start Simulating →"},
];

function WalkThrough({onDone}){
  const [idx,setIdx]=useState(0);
  const step=WALK_STEPS[idx];
  const isLast=idx===WALK_STEPS.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:900,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{background:"var(--bg2)",border:"1px solid var(--orange3)",borderRadius:20,
        padding:"38px 44px",maxWidth:440,textAlign:"center",
        animation:"popIn .3s ease both",
        boxShadow:"0 0 0 1px rgba(249,115,22,.1),0 28px 80px rgba(0,0,0,.8)"}}>
        <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:26}}>
          {WALK_STEPS.map((_,i)=>(
            <div key={i} style={{height:3,borderRadius:2,
              width:i===idx?28:8,
              background:i<=idx?"var(--orange)":"var(--bg4)",
              transition:"all .3s ease"}}/>
          ))}
        </div>
        <div style={{fontSize:24,fontWeight:800,color:"var(--t1)",marginBottom:14,lineHeight:1.25}}>
          {step.title}
        </div>
        <div style={{fontSize:16,color:"var(--t2)",lineHeight:1.75,marginBottom:32}}>{step.body}</div>
        <button onClick={()=>isLast?onDone():setIdx(i=>i+1)}
          style={{padding:"14px 36px",borderRadius:12,
            background:"var(--orange)",color:"#fff",fontSize:16,fontWeight:700,
            boxShadow:"0 4px 24px rgba(249,115,22,.5)",transition:"all .15s",
            animation:isLast?"bounceBtn 1.8s ease infinite":"none",border:"none"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.05)";e.currentTarget.style.boxShadow="0 6px 32px rgba(249,115,22,.65)";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 4px 24px rgba(249,115,22,.5)";}}>
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
function GanttBar({steps,currentStep}){
  if(!steps.length)return(
    <div style={{height:46,borderRadius:10,background:"var(--bg3)",
      border:"1px dashed var(--line2)",display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:13,color:"var(--t3)"}}>
      Gantt chart will appear here as simulation runs
    </div>
  );
  const maxEnd=Math.max(...steps.map(s=>s.end));
  return(
    <div>
      <div style={{display:"flex",borderRadius:10,overflow:"hidden",
        border:"1px solid var(--line2)",height:46}}>
        {steps.map((s,i)=>{
          const w=((s.end-s.start)/maxEnd)*100;
          const filled=i<=currentStep;
          const active=i===currentStep;
          return(
            <div key={i} style={{
              width:`${w}%`,height:"100%",
              background:filled?s.color.bg:"rgba(255,255,255,.03)",
              display:"flex",alignItems:"center",justifyContent:"center",
              borderRight:"1px solid rgba(0,0,0,.25)",
              position:"relative",overflow:"hidden",
              transition:"background .3s",
              boxShadow:active?`inset 0 0 0 2.5px rgba(255,255,255,.5)`:"none",
            }}>
              <span style={{fontSize:13,fontWeight:700,
                color:filled?"#fff":"transparent",
                fontFamily:"var(--mono)",position:"relative",zIndex:1}}>
                {filled?s.pid:""}
              </span>
              {active&&(
                <div style={{position:"absolute",inset:0,
                  background:"linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)",
                  backgroundSize:"200% 100%",animation:"shimmer .9s linear infinite"}}/>
              )}
              {active&&(
                <div style={{position:"absolute",top:0,left:0,right:0,
                  height:3,background:"rgba(255,255,255,.9)",borderRadius:"0 0 2px 2px"}}/>
              )}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",marginTop:4}}>
        {steps.map((s,i)=>{
          const w=((s.end-s.start)/maxEnd)*100;
          return(
            <div key={i} style={{width:`${w}%`,textAlign:"right",paddingRight:4}}>
              <span style={{fontSize:10,color:"var(--t3)",fontFamily:"var(--mono)"}}>{s.end}</span>
            </div>
          );
        })}
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
  const tickRef                 = useRef(null);

  const steps = algo==="fcfs"?runFCFS(procs):algo==="sjf"?runSJF(procs):runRR(procs,quantum);
  const cur   = steps[step];
  const done  = step>=steps.length-1 && step>=0;

  const reset=useCallback(()=>{setStep(-1);setPlay(false);},[]);
  useEffect(reset,[algo,quantum,procs]);
  useEffect(()=>{
    if(playing){
      tickRef.current=setInterval(()=>{
        setStep(v=>{
          if(v>=steps.length-1){setPlay(false);clearInterval(tickRef.current);return v;}
          return v+1;
        });
      },Math.round(1300/speed));
    } else clearInterval(tickRef.current);
    return()=>clearInterval(tickRef.current);
  },[playing,steps.length,speed]);

  const ALGO={
    fcfs:{label:"FCFS",       full:"First Come, First Served", tip:"Runs processes in arrival order. Simple, no priority.", color:"#f97316"},
    sjf: {label:"SJF",        full:"Shortest Job First",       tip:"Always picks the process needing the least CPU time.",  color:"#60a5fa"},
    rr:  {label:"Round Robin",full:"Round Robin",              tip:"Each process gets a fixed time slice before rotating.", color:"#2dd4bf"},
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

      <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ══ TOP BAR ═════════════════════════════════════ */}
        <div style={{height:52,display:"flex",alignItems:"center",padding:"0 20px",
          borderBottom:"1px solid var(--line)",background:"var(--bg1)",
          flexShrink:0,gap:14}}>

          <div style={{display:"flex",alignItems:"center",gap:9,marginRight:4}}>
            <div style={{width:28,height:28,borderRadius:8,
              background:"linear-gradient(135deg,#f97316,#f43f5e)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>C</div>
            <span style={{fontSize:14,fontWeight:700,color:"var(--t1)"}}>Coding Pro</span>
            <span style={{fontSize:12,color:"var(--t3)",fontFamily:"var(--mono)"}}>/ cpu-scheduling</span>
          </div>

          {/* algo tabs */}
          <div style={{display:"flex",gap:3,padding:"3px",borderRadius:10,
            background:"var(--bg3)",border:"1px solid var(--line)"}}>
            {Object.entries(ALGO).map(([key,m])=>(
              <button key={key} onClick={()=>setAlgo(key)}
                style={{padding:"6px 16px",borderRadius:7,fontSize:13,fontWeight:600,
                  background:algo===key?m.color:"transparent",
                  color:algo===key?"#fff":"var(--t2)",
                  transition:"all .2s",border:"none",
                  boxShadow:algo===key?`0 2px 12px ${m.color}55`:"none"}}>
                {m.label}
              </button>
            ))}
          </div>

          {/* quantum (RR only) */}
          {algo==="rr"&&(
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 12px",
              borderRadius:9,border:"1px solid var(--teal)",background:"var(--teal2)"}}>
              <Tip label="Quantum" tip="Time slice given to each process before preemption." color="var(--teal)"/>
              <span style={{color:"var(--t3)"}}>:</span>
              {[1,2,3,4].map(v=>(
                <button key={v} onClick={()=>setQ(v)}
                  style={{width:28,height:28,borderRadius:6,fontSize:12,fontWeight:700,
                    background:quantum===v?"var(--teal)":"transparent",
                    color:quantum===v?"#000":"var(--t2)",
                    border:`1px solid ${quantum===v?"var(--teal)":"var(--line2)"}`,
                    transition:"all .15s"}}>
                  {v}
                </button>
              ))}
            </div>
          )}

          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <button onClick={()=>setCompare(true)}
              style={{padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:500,
                border:"1px solid var(--line2)",color:"var(--t1)",background:"var(--bg2)",
                transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--bg4)";e.currentTarget.style.borderColor="var(--line2)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--bg2)";}}>
              ⚖ Compare
            </button>
            <button onClick={()=>setShowWalk(true)}
              style={{padding:"6px 14px",borderRadius:8,fontSize:13,fontWeight:500,
                border:"1px solid var(--line2)",color:"var(--t1)",background:"var(--bg2)",
                transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--bg4)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--bg2)"}>
              ? Guide
            </button>
          </div>
        </div>

        {/* ══ MAIN CONTENT ════════════════════════════════ */}
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* ── LEFT: PROCESSES ─────────────────────────── */}
          <div style={{width:210,borderRight:"1px solid var(--line)",
            background:"var(--bg1)",display:"flex",flexDirection:"column",
            padding:"16px 14px",gap:8,flexShrink:0,overflowY:"auto"}}>

            <SH action={
              <button onClick={()=>setEditor(true)}
                style={{
                  padding:"5px 13px",borderRadius:7,fontSize:12,fontWeight:700,
                  background:"var(--orange)",color:"#fff",
                  boxShadow:"0 2px 14px rgba(249,115,22,.5)",
                  border:"none",transition:"all .18s",
                  animation:"editPulse 2.5s ease infinite",
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.07)";e.currentTarget.style.boxShadow="0 4px 20px rgba(249,115,22,.7)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 2px 14px rgba(249,115,22,.5)";}}>
                ✎ Edit
              </button>
            }>PROCESSES</SH>

            {procStatus.map(p=>(
              <div key={p.id} style={{
                padding:"11px 12px",borderRadius:11,
                background:p.isRunning?`${p.color.bg}1a`:p.isDone?"rgba(255,255,255,.02)":"var(--bg2)",
                border:`1.5px solid ${p.isRunning?p.color.bg+"80":p.isDone?"var(--line)":"var(--line)"}`,
                transition:"all .35s ease",
                transform:p.isRunning?"translateX(4px)":"translateX(0)",
                opacity:p.isDone?.35:1,
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:11,height:11,borderRadius:"50%",background:p.color.bg,
                      flexShrink:0,
                      boxShadow:p.isRunning?`0 0 12px ${p.color.glow}`:"none",
                      transition:"box-shadow .3s"}}/>
                    <span style={{fontFamily:"var(--mono)",fontSize:15,fontWeight:700,
                      color:p.isRunning?p.color.bg:"var(--t1)"}}>{p.id}</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,
                    color:p.isRunning?"var(--green)":p.isDone?"var(--t3)":"var(--t2)",
                    fontFamily:"var(--mono)"}}>
                    {p.isRunning?"▶ EXEC":p.isDone?"✓ DONE":"READY"}
                  </span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {[{l:"arrival",v:p.arrival},{l:"burst",v:p.burst}].map(field=>(
                    <div key={field.l} style={{flex:1,textAlign:"center",padding:"5px 0",
                      background:"var(--bg3)",borderRadius:6,border:"1px solid var(--line)"}}>
                      <div style={{fontSize:10,color:"var(--t3)",marginBottom:2,fontWeight:600}}>{field.l.toUpperCase()}</div>
                      <div style={{fontSize:14,fontFamily:"var(--mono)",fontWeight:700,color:"var(--t1)"}}>{field.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* algo info */}
            <div style={{marginTop:4,padding:"12px",borderRadius:10,
              background:"var(--bg2)",border:`1px solid ${meta.color}40`}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,fontWeight:700,letterSpacing:".08em"}}>
                ACTIVE ALGORITHM
              </div>
              <div style={{fontSize:14,color:meta.color,fontWeight:700,fontFamily:"var(--mono)",marginBottom:5}}>
                {meta.label}
              </div>
              <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.55}}>{meta.tip}</div>
            </div>
          </div>

          {/* ── CENTRE ──────────────────────────────────── */}
          <div style={{flex:1,display:"flex",flexDirection:"column",
            overflow:"hidden",padding:"16px 22px",gap:14}}>

            {/* ── SIMULATION CONTROLS (top, above queue) ── */}
            <div style={{flexShrink:0,background:"var(--bg2)",
              borderRadius:14,border:"1px solid var(--line2)",
              padding:"14px 20px"}}>

              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                {/* PRIMARY SIMULATION BUTTON */}
                <button
                  onClick={()=>{ if(done){reset();}else{setPlay(v=>!v);} }}
                  style={{
                    flex:1,padding:"13px 0",borderRadius:11,
                    background:done?"var(--green2)":playing?"rgba(251,113,133,.2)":"var(--orange)",
                    border:done?"1.5px solid rgba(74,222,128,.5)":playing?"1.5px solid rgba(251,113,133,.5)":"none",
                    color:done?"var(--green)":playing?"var(--rose)":"#fff",
                    fontSize:16,fontWeight:800,
                    boxShadow:(!done&&!playing)?"0 4px 28px rgba(249,115,22,.55),0 0 0 0 rgba(249,115,22,.4)":"none",
                    animation:(!done&&!playing&&step<0)?"pulseRing 2s ease-in-out infinite, bounceBtn 2.5s ease-in-out infinite":"none",
                    transition:"all .2s ease",letterSpacing:".01em",
                  }}
                  onMouseEnter={e=>{if(!done) e.currentTarget.style.transform="scale(1.025)";}}
                  onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                  {done?"↺  Restart":playing?"⏸  Pause Simulation":"▶  Start Simulation"}
                </button>

                <button
                  onClick={()=>{ if(!done&&!playing) setStep(v=>Math.min(v+1,steps.length-1)); }}
                  disabled={done||playing}
                  style={{
                    padding:"13px 20px",borderRadius:11,
                    border:"1.5px solid var(--line2)",background:"var(--bg3)",
                    color:done||playing?"var(--t3)":"var(--t1)",
                    fontSize:14,fontWeight:600,transition:"all .18s",
                    opacity:done||playing?.4:1,
                  }}
                  onMouseEnter={e=>{if(!done&&!playing){e.currentTarget.style.background="var(--bg4)";e.currentTarget.style.borderColor="var(--line2)";}}}
                  onMouseLeave={e=>{e.currentTarget.style.background="var(--bg3)";}}>
                  Step →
                </button>

                <button onClick={reset}
                  style={{padding:"13px 14px",borderRadius:11,
                    border:"1.5px solid var(--line)",background:"transparent",
                    color:"var(--t2)",fontSize:15,fontWeight:600,transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="var(--bg3)";e.currentTarget.style.color="var(--t1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--t2)";}}>
                  ↺
                </button>
              </div>

              {/* Speed row */}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:"var(--t2)",fontWeight:600,marginRight:2}}>Speed:</span>
                {[{v:.5,l:"0.5×"},{v:1,l:"1×"},{v:2,l:"2×"},{v:3,l:"3×"}].map(s=>(
                  <button key={s.v} onClick={()=>setSpeed(s.v)}
                    style={{padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:600,
                      background:speed===s.v?"var(--orange2)":"transparent",
                      color:speed===s.v?"var(--orange)":"var(--t2)",
                      border:`1px solid ${speed===s.v?"var(--orange)":"var(--line2)"}`,
                      transition:"all .15s"}}>
                    {s.l}
                  </button>
                ))}
                {done&&(
                  <div style={{marginLeft:"auto",padding:"4px 14px",borderRadius:7,
                    background:"var(--green2)",border:"1px solid rgba(74,222,128,.35)",
                    fontSize:13,color:"var(--green)",fontWeight:700,
                    animation:"completePop .4s ease"}}>
                    ✓ Complete
                  </div>
                )}
              </div>
            </div>

            {/* ── QUEUE → CPU ── */}
            <div style={{display:"flex",alignItems:"stretch",gap:0,flexShrink:0}}>
              {/* queue */}
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--t1)",
                  letterSpacing:".1em",fontFamily:"var(--mono)",marginBottom:8}}>
                  <Tip label="READY QUEUE" tip="Processes loaded in memory, waiting for their turn on the CPU." color="var(--t1)"/>
                </div>
                <div style={{
                  display:"flex",gap:12,padding:"14px 18px",
                  borderRadius:"12px 0 0 12px",
                  border:"1.5px solid var(--line2)",borderRight:"none",
                  background:"var(--bg2)",minHeight:80,
                  alignItems:"center",flexWrap:"wrap",
                }}>
                  {procStatus.map(p=>(
                    <div key={p.id} style={{
                      display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                      transform:p.isRunning?"translateX(10px) scale(1.1)":"scale(1)",
                      opacity:p.isDone&&!p.isRunning?.18:1,
                      transition:"all .45s cubic-bezier(.34,1.56,.64,1)",
                    }}>
                      <div style={{
                        width:46,height:46,borderRadius:11,background:p.color.bg,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:14,fontWeight:800,color:p.color.t,
                        boxShadow:p.isRunning?`0 0 0 3px ${p.color.glow},0 0 24px ${p.color.glow}`:"none",
                        border:`2px solid ${p.isRunning?"rgba(255,255,255,.7)":"transparent"}`,
                        transition:"all .35s ease",
                      }}>{p.id}</div>
                      <span style={{fontSize:10,fontFamily:"var(--mono)",fontWeight:700,
                        color:p.isRunning?"var(--green)":p.isDone?"var(--t3)":"var(--t2)"}}>
                        {p.isRunning?"▶ exec":p.isDone?"done":`b=${p.burst}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* arrow */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:4,padding:"0 6px",flexShrink:0,
                background:"var(--bg2)",borderTop:"1.5px solid var(--line2)",
                borderBottom:"1.5px solid var(--line2)"}}>
                <div style={{height:3,width:36,borderRadius:2,
                  background:cur?`linear-gradient(90deg,var(--orange),transparent)`:"var(--bg4)",
                  animation:cur?"trackGlow 1s ease infinite":"none",transition:"background .4s"}}/>
                <span style={{fontSize:18,color:cur?"var(--orange)":"var(--t3)",
                  fontWeight:700,transition:"color .4s",
                  animation:cur?"trackGlow 1s ease .5s infinite":"none"}}>→</span>
                <div style={{height:3,width:36,borderRadius:2,
                  background:cur?`linear-gradient(90deg,transparent,var(--orange))`:"var(--bg4)",
                  animation:cur?"trackGlow 1s ease 1s infinite":"none",transition:"background .4s"}}/>
              </div>

              {/* CPU */}
              <div style={{width:140,flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--t1)",
                  letterSpacing:".1em",fontFamily:"var(--mono)",marginBottom:8}}>CPU</div>
                <div style={{
                  padding:"14px 12px",
                  borderRadius:"0 12px 12px 0",
                  border:`1.5px solid ${cur?cur.color.bg+"70":"var(--line2)"}`,
                  background:cur?`${cur.color.bg}10`:"var(--bg2)",
                  minHeight:80,display:"flex",flexDirection:"column",
                  alignItems:"center",justifyContent:"center",gap:6,
                  transition:"all .4s ease",
                  animation:cur?"cpuSpin 2s ease-in-out infinite":"none",
                }}>
                  {cur?(
                    <>
                      <div style={{
                        width:48,height:48,borderRadius:11,background:cur.color.bg,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:17,fontWeight:800,color:cur.color.t,
                        boxShadow:`0 0 32px ${cur.color.glow}`,
                        animation:"popIn .4s ease",
                      }}>{cur.pid}</div>
                      <span style={{fontSize:11,fontFamily:"var(--mono)",
                        color:cur.color.bg,fontWeight:700}}>
                        {cur.end-cur.start}u / {cur.end-cur.start}u
                      </span>
                    </>
                  ):(
                    <>
                      <div style={{width:42,height:42,borderRadius:9,
                        border:"1.5px dashed var(--t3)",
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:11,color:"var(--t3)",fontFamily:"var(--mono)"}}>
                          {done?"done":"idle"}
                        </span>
                      </div>
                      {!done&&step<0&&(
                        <span style={{fontSize:10,color:"var(--t3)",textAlign:"center",lineHeight:1.4}}>
                          Press ▶ above<br/>to start
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── EXPLANATION BOX ── */}
            <div style={{
              flexShrink:0,borderRadius:12,
              border:`1.5px solid ${cur?cur.color.bg+"40":"var(--line)"}`,
              background:cur?`${cur.color.bg}0c`:"var(--bg2)",
              padding:"14px 18px",transition:"all .4s ease",
              minHeight:96,
            }}>
              {cur?(
                <div key={step} style={{animation:"slideUp .25s ease both"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:cur.color.bg,
                      flexShrink:0,animation:"pulse 1.2s ease infinite"}}/>
                    <span style={{fontSize:11,fontWeight:700,color:"var(--t2)",
                      fontFamily:"var(--mono)",letterSpacing:".1em"}}>
                      EXPLANATION · STEP {step+1} OF {steps.length}
                    </span>
                  </div>
                  <p style={{fontSize:16,fontWeight:600,color:"var(--t1)",marginBottom:6,lineHeight:1.5}}>
                    {cur.why}
                  </p>
                  <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.65}}>{cur.detail}</p>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:12,height:"100%"}}>
                  <span style={{fontSize:30}}>💡</span>
                  <p style={{fontSize:15,color:"var(--t2)",lineHeight:1.65}}>
                    {done
                      ?"Simulation complete! All processes have been executed. Try a different algorithm or reset."
                      :"Step-by-step explanations appear here as each process executes. Hit ▶ Start above to begin."}
                  </p>
                </div>
              )}
            </div>

            {/* ── GANTT ── */}
            <div style={{flexShrink:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--t1)",
                letterSpacing:".1em",fontFamily:"var(--mono)",marginBottom:8}}>
                <Tip label="GANTT CHART" tip="Visual timeline showing which process ran at each unit of time." color="var(--t1)"/>
              </div>
              <GanttBar steps={steps} currentStep={step}/>
            </div>
          </div>

          {/* ── RIGHT: STATS + GLOSSARY ─────────────────── */}
          <div style={{width:210,borderLeft:"1px solid var(--line)",
            background:"var(--bg1)",display:"flex",flexDirection:"column",
            padding:"16px 14px",gap:14,flexShrink:0,overflowY:"auto"}}>

            {/* execution stats */}
            <div>
              <SH>EXECUTION STATS</SH>
              {statsData.map(p=>(
                <div key={p.id} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"8px 10px",borderRadius:9,marginBottom:6,
                  background:p.isDone2?"var(--green2)":"var(--bg2)",
                  border:`1px solid ${p.isDone2?"rgba(74,222,128,.3)":"var(--line)"}`,
                  transition:"all .4s",
                }}>
                  <span style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:700,color:p.color.bg}}>{p.id}</span>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:"var(--t3)",fontWeight:600}}>
                      wait: <span style={{color:p.isDone2?"var(--t1)":"var(--t3)",fontWeight:700}}>{p.isDone2?p.wait:"—"}</span>
                    </div>
                    <div style={{fontSize:11,color:"var(--t3)",fontWeight:600}}>
                      turn: <span style={{color:p.isDone2?"var(--t1)":"var(--t3)",fontWeight:700}}>{p.isDone2?p.ta:"—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* glossary */}
            <div>
              <SH>GLOSSARY</SH>
              {[
                {term:"Burst Time",   def:"Total CPU time a process needs to complete its task."},
                {term:"Arrival Time", def:"When the process enters the ready queue."},
                {term:"Wait Time",    def:"Time spent in queue before being executed."},
                {term:"Turnaround",   def:"Total time from arrival to full completion."},
                {term:"Preemption",   def:"Interrupting a running process to switch to another."},
                {term:"Context Switch",def:"CPU saving one process state and loading another."},
              ].map(g=>(
                <div key={g.term} style={{marginBottom:8,padding:"9px 10px",borderRadius:9,
                  background:"var(--bg2)",border:"1px solid var(--line)"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--t1)",marginBottom:3}}>{g.term}</div>
                  <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{g.def}</div>
                </div>
              ))}
            </div>

            {/* explore more */}
            <div style={{marginTop:"auto",padding:"12px",borderRadius:10,
              background:"var(--bg2)",border:"1px solid var(--line)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--t1)",marginBottom:8,
                letterSpacing:".06em"}}>EXPLORE MORE</div>
              {["Memory Management","Process Sync","Deadlocks","Virtual Memory"].map(t=>(
                <a key={t} href="#"
                  style={{display:"block",fontSize:12,fontWeight:500,
                    color:"var(--t2)",padding:"4px 0",transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="var(--orange)"}
                  onMouseLeave={e=>e.currentTarget.style.color="var(--t2)"}>
                  → {t}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}