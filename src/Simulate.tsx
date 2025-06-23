import { useState } from "react";
import * as sim from "@tempo-lang/tempo/simulator";
import { Env, type Transport } from "@tempo-lang/tempo/runtime";
import { LocalQueue } from "@tempo-lang/tempo/transports";
import { inputClasses } from "./App";

export type SimulateProps = {
  source: string;
};

function Simulate({ source }: SimulateProps) {
  const [simResult, setSimResult] = useState<TraceMessage[]>([]);
  const [simError, setSimError] = useState<Error | undefined>(undefined);

  const result = simResult.map((msg, i) => {
    switch (msg.type) {
      case "com":
        return <li key={i}>{`${msg.sender} -> [${msg.receivers.join(",")}]: ${msg.value}`}</li>;
      case "return":
        return (
          <li key={i}>
            {`Return ${msg.role}`}
            {msg.value ? `: ${msg.value}` : null}
          </li>
        );
    }
  });

  const errorEl = simError ? (
    <div>
      {simError.name}: {simError.message}
    </div>
  ) : null;

  return (
    <>
      <div className="flex gap-2 items-center px-2 py-1 border-t border-b border-gray-200 bg-gray-50">
        <span className="font-medium">Simulate</span>
        <button className={inputClasses} onClick={() => simulate(source, setSimResult, setSimError)}>
          Run
        </button>
      </div>
      <div className="grow-0 basis-1/2 overflow-scroll pb-10 pt-2 px-10">
        {errorEl}
        <ul>{result}</ul>
      </div>
    </>
  );
}

async function simulate(source: string, setSimResult: (result: TraceMessage[]) => void, setSimError: (err: Error) => void) {
  if (!playground) return;

  const { output, errors } = playground.compile({ source, lang: "ts", disableTypes: true, runtime: import.meta.env.BASE_URL + "runtime.js" });

  if (!output || errors.length > 0) return;

  console.log("sim output", output);

  try {
    const code = await import("data:text/javascript;base64," + btoa(output));
    console.log("sim code", code);

    const funcs = Object.keys(code).filter((func) => func.startsWith("main_"));
    const processes: sim.Processes = {};
    for (const f of funcs) {
      const role = f.slice("main_".length);
      processes[role] = code[f];
    }

    console.log(processes);

    const result = await runSimulation(processes);
    console.log("sim result", result);
    setSimResult(result);
  } catch (error) {
    setSimError(error as Error);
  }
}

type TraceMessage =
  | {
      type: "com";
      value: unknown;
      sender: string;
      receivers: string[];
    }
  | {
      type: "return";
      role: string;
      value: unknown;
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
      this.sends.push({ type: "com", value, sender: this.#role, receivers: roles });
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
        const result: unknown = await processes[role](new Env(trans));
        sends.push({ type: "return", role, value: result });
      })(),
    );
  }

  await Promise.all(results);

  return sends;
}

export default Simulate;
