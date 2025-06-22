import { useCallback, useState } from "react";
import { usePlayground, type CompilerLang } from "./playground";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";
import { linter, type Diagnostic } from "@codemirror/lint";

import * as sim from "@tempo-lang/tempo/simulator";

const initCode = `func@(A,B) pingPong(count: Int@[A,B]) {
  if count > 0 {
    await A->B count;
    pingPong@(B,A)(count - 1);
  }
}

func@(A,B) main() {
  pingPong@(A,B)(4);
}`;

function lineColToPos(source: string, line: number, col: number): number {
  line -= 1;

  const lineSum = source
    .split("\n")
    .slice(0, line)
    .map((l) => l.length)
    .reduce((a, b) => a + b, 0);

  return lineSum + line + col;
}

function App() {
  const playground = usePlayground();

  const [source, setSource] = useState(initCode);
  const [lang, setLang] = useState<CompilerLang>("go");
  const [simResult, setSimResult] = useState("");

  const onChange = useCallback((val: string) => {
    setSource(val);
    setSimResult("");
  }, []);

  let output = "loading...";
  const diagnostics: Diagnostic[] = [];
  if (playground) {
    const compile = playground.compile({ source, lang, disableTypes: false, runtime: "@tempo-lang/tempo/runtime" });
    const { output: sourceOutput, errors } = compile;
    if (sourceOutput) {
      output = sourceOutput;
    } else {
      output = errors.map((e) => e.error).join("\n");
    }

    for (const error of errors) {
      const start = error.start ?? [0, 0];
      const end = error.end ?? [0, 0];

      diagnostics.push({
        message: error.error,
        from: lineColToPos(source, start[0], start[1]),
        to: lineColToPos(source, end[0], end[1]),
        severity: "error",
      });
    }
  }

  const simulate = async () => {
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

    const result = await sim.simulate(processes);
    console.log("sim result", result);
    setSimResult(JSON.stringify(result, null, 2));
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl p-2 text-center">Tempo Playground</h1>
      <div className="flex h-full">
        <div className="flex-1/2 border-t border-r border-gray-200">
          <span className="font-medium block px-2 pt-1">Tempo source code</span>
          <CodeMirror autoFocus value={source} onChange={onChange} extensions={[linter(() => diagnostics, { delay: 0 })]} />
        </div>
        <div className="flex-1/2 border-t border-r border-gray-200">
          <div>
            <span className="font-medium inline-block px-2 pt-1">Generated code</span>
            <select className="inline-block" value={lang} onChange={(e) => setLang(e.target.value as CompilerLang)}>
              <option value="go">Go</option>
              <option value="ts">Typescript</option>
            </select>
            <CodeMirror editable={false} value={output} extensions={[go()]} />
          </div>
          <div className="border-t border-gray-200">
            <span className="font-medium inline-block px-2 pt-1">Simulate</span>
            <button className="bg-blue-300 rounded px-1 cursor-pointer" onClick={() => simulate()}>
              Run
            </button>
            <div>{simResult}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
