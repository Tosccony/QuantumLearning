import * as engine from "quantum.engine";
import { createRoot } from "react-dom/client";
import { setTransport } from "@/lib/quantum";
import { qollabTransport } from "./bridge";
import Player from "./Player";

// Some Qiskit backends expose `name` as a method rather than a property.
const name = String(typeof backend.name === "function" ? backend.name.call(backend) : (backend.name ?? "unknown backend"));

setTransport(qollabTransport(engine, backend));
createRoot(document.getElementById("root")!).render(<Player backendName={name} />);
console.log(`Quantum Quest is ready on ${name}. Pick a lesson and press ▶ Run in the page above. Press Stop to switch simulators.`);

// Qollab ends a Run as soon as main.js finishes, which would disconnect `backend` before the learner clicks Run.
// Keep the Run alive until Stop. Must stay the last line.
await new Promise(() => {});
