import * as engine from "quantum.engine";
import { createRoot } from "react-dom/client";
import { setTransport } from "@/lib/quantum";
import { qollabTransport } from "./bridge";
import Player from "./Player";

setTransport(qollabTransport(engine, backend));
createRoot(document.getElementById("root")!).render(<Player backendName={String(backend.name ?? "unknown backend")} />);
