import { useState } from "react";
import * as sim from "@tempo-lang/tempo/simulator";
import { Env, type Transport } from "@tempo-lang/tempo/runtime";
import { LocalQueue } from "@tempo-lang/tempo/transports";

export type SimulateProps = {
  source: string;
};

function Simulate({ source }: SimulateProps) {
  const [simResult, setSimResult] = useState<TraceMessage[]>([]);

  const result = simResult.map((msg, i) => <li key={i}>{`${msg.sender} -> [${msg.receivers.join(",")}]: ${msg.value}`}</li>);

  return (
    <>
      <span className="font-medium inline-block px-2 pt-1">Simulate</span>
      <button className="bg-blue-300 rounded px-1 cursor-pointer" onClick={() => simulate(source, setSimResult)}>
        Run
      </button>
      <div>
        <ul className="p-2">{result}</ul>
      </div>
    </>
  );
}

async function simulate(source: string, setSimResult: (result: TraceMessage[]) => void) {
  if (!playground) return;

  const { output, errors } = playground.compile({ source, lang: "ts", disableTypes: true, runtime: import.meta.env.BASE_URL + "runtime.js" });

  if (!output || errors.length > 0) return;

  console.log("sim output", output);

  const code = await import("data:text/javascript;base64," + btoa(output));
  console.log("sim code", code);

  const funcs = Object.keys(code).filter((func) => func.startsWith("main_"));
  const processes: sim.Processes = {};
  for (const f of funcs) {
    const role = f.slice("main_".length);
    processes[role] = code[f];
  }

  console.log(processes);

  // const result = await sim.simulate(processes);
  const result = await runSimulation(processes);
  console.log("sim result", result);
  setSimResult(result);
}

type TraceMessage = {
  value: unknown;
  sender: string;
  receivers: string[];
};

async function runSimulation(processes: sim.Processes): Promise<TraceMessage[]> {
  class Tracer implements Transport {
    #inner: Transport;
    #role: string;
    sends: TraceMessage[];

    constructor(inner: Transport, role: string, sends: TraceMessage[]) {
      this.#inner = inner;
      this.#role = role;
      this.sends = sends;
    }

    send<T>(value: T, ...roles: string[]): void {
      this.sends.push({ value, sender: this.#role, receivers: roles });
      this.#inner.send(value, ...roles);
    }

    recv<T>(role: string): Promise<T> {
      return this.#inner.recv(role);
    }
  }

  const queue = new LocalQueue();

  const results: Promise<void>[] = [];
  const sends: TraceMessage[] = [];

  for (const role in processes) {
    results.push(
      (async () => {
        const trans = new Tracer(queue.role(role), role, sends);
        await processes[role](new Env(trans));
      })(),
    );
  }

  await Promise.all(results);

  return sends;
}

export default Simulate;
