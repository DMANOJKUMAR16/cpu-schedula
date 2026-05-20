# cpu-schedula

> An immersive, interactive CPU Scheduling learning workspace — built for [Coding Pro](https://codingpro.com) as part of the Coding Jr / Coding Pro hiring evaluation.

**Live Demo → [cpu-schedula.vercel.app](https://cpu-schedula.vercel.app)**

---

## What is this?

Most students struggle with CPU Scheduling because textbooks describe it with static diagrams and abstract theory. **cpu-schedula** replaces that with a fully interactive visual workspace where processes move, wait, and execute in real time — making the concept click intuitively.

This is a single-module educational application covering one of the most fundamental topics in Operating Systems.

---

## Features

- **7-chapter learning path** with sidebar navigation and per-chapter progress tracking
- **Animated Introduction** — live process flow visualization with a pulsing CPU
- **Core Concepts** — 6 interactive concept pills (Process, Burst Time, Arrival Time, Ready Queue, Waiting Time, Turnaround), each with a unique animated visual
- **Algorithm Chapters** — dedicated pages for FCFS, SJF, and Round Robin with step-through Gantt charts and live explanations
- **Live Simulator** — the centrepiece lab; switch between all three algorithms, adjust Round Robin quantum, autoplay or step manually, and read per-step plain-English explanations
- **Knowledge Check Quiz** — 4 questions with instant visual feedback and explanations
- Smooth animations, calm dark UI, zero external dependencies beyond React

---

## Tech Stack

| Layer       | Choice                        |
|-------------|-------------------------------|
| Framework   | React 18 (Vite)               |
| Styling     | Inline CSS-in-JS + CSS vars   |
| Fonts       | Outfit · JetBrains Mono (Google Fonts) |
| Deployment  | Vercel                        |
| State       | useState / useEffect / useRef |

No UI libraries. No CSS frameworks. No component libraries. Everything is hand-built.

---

## Algorithms Implemented

### FCFS — First Come, First Served
Processes execute in arrival order. Simple, no starvation, but suffers from the convoy effect.

### SJF — Shortest Job First
Picks the process with the smallest burst time from the ready queue. Provably optimal for average waiting time, but can starve long processes.

### Round Robin
Each process gets a fixed time quantum. When the quantum expires the process is preempted and cycles to the back of the queue. Fair distribution, higher context-switch overhead. Quantum is adjustable (1–4 units) in the simulator.

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/DMANOJKUMAR16/cpu-schedula.git
cd cpu-schedula

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
# output is in /dist — drag to Netlify Drop or deploy via Vercel CLI
```

---

## Project Structure

```
cpu-schedula/
├── public/
├── src/
│   ├── App.jsx        ← entire application (all components + logic)
│   └── main.jsx       ← React root mount
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

All components, scheduling algorithms, animations, and styles live inside `src/App.jsx` as a self-contained module — intentional for this evaluation format.

---

## Setup Notes

- `src/App.css` and `src/index.css` should be **empty** (all styles are embedded in the component)
- Google Fonts are loaded via `@import` inside the style block — internet connection required at runtime for correct typography
- No environment variables needed

---

## Scheduling Algorithm Logic

The three schedulers are pure functions — no side effects, easy to test or extend:

```js
runFCFS(processes)           // sorted by arrival time
runSJF(processes)            // greedy: pick shortest burst from available
runRR(processes, quantum)    // circular queue with preemption at quantum
```

Each returns an array of execution steps: `{ pid, start, end, color, note }` — consumed by the Gantt chart and live explanation engine.

---

## Author

**Manoj Kumar Deekonda**
[deekondamanojkumar123@gmail.com](mailto:deekondamanojkumar123@gmail.com)
[github.com/DMANOJKUMAR16](https://github.com/DMANOJKUMAR16)

---

## Acknowledgement

Built as part of the **Coding Pro / Coding Jr hiring evaluation**.
The goal: make CPU scheduling feel intuitive through interaction and visuals — not memorisation.

> "I finally understand how this works."