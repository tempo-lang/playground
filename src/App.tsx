import { useCallback, useState } from "react";
import { usePlayground, type CompilerLang } from "./usePlayground";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";
import { javascript } from "@codemirror/lang-javascript";
import { linter, type Diagnostic } from "@codemirror/lint";
import Simulate from "./Simulate";

type Examples = {
  [key: string]: string;
};

const examples: Examples = {
  "Ping Pong": `func@(A,B) pingPong(count: Int@[A,B]) {
  if count > 0 {
    await A->B count;
    pingPong@(B,A)(count - 1);
  }
}

func@(A,B) main() {
  pingPong@(A,B)(4);
}`,
  "Shift Roles": `func@(A,B,C,D) shiftRoles(count: Int@[A,B,C,D]) {
  if count > 0 {
    await A->B count;
    shiftRoles@(B,C,D,A)(count - 1);
  }
}

func@(A,B,C,D) main() {
  shiftRoles@(A,B,C,D)(4);
}`,
  "Transitive Send": `func@(A,B,C) main() Int@[A,B,C] {
  let x: Int@A = 10;
  let y: Int@[A,B] = await A->B x;
  let z: Int@[A,B,C] = await B->C y;
  return z;
}`,
  Compose: `func@(A,B,C) compose(f: func@(A,B)(Int@A)Int@B, g: func@(B,C)(Int@B)Int@C) func@(A,B,C)(Int@A)Int@C {
  return func@(A,B,C) (input: Int@A) Int@C {
    return g(f(input));
  };
}

func@(X,Y) incAndSend(value: Int@X) Int@Y {
  return await X->Y (value+1);
}

func@(A,B,C) main() Int@C {
  let input = 10@A;
  let f = incAndSend@(A,B);
  let g = incAndSend@(B,C);
  let c = compose@(A,B,C)(f, g);

  return c(input);
}`,
};

function lineColToPos(source: string, line: number, col: number): number {
  line -= 1;

  const lineSum = source
    .split("\n")
    .slice(0, line)
    .map((l) => l.length)
    .reduce((a, b) => a + b, 0);

  return lineSum + line + col;
}

export const inputClasses =
  "focus:outline-solid focus:outline-1 focus:outline-blue-200 bg-white hover:bg-blue-50 border border-gray-300 hover:border-blue-400 focus:border-blue-400 font-medium text-sm text-black rounded shadow-xs px-2 h-7 cursor-pointer";

function App() {
  const playground = usePlayground();

  const [source, setSource] = useState(examples[Object.keys(examples)[0]]);
  const [lang, setLang] = useState<CompilerLang>("go");

  const onChange = useCallback((val: string) => {
    setSource(val);
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

  const exampleOptions = Object.keys(examples).map((ex) => (
    <option key={ex} value={ex}>
      {ex}
    </option>
  ));

  const languageExt = useCallback((lang: CompilerLang) => {
    switch (lang) {
      case "ts":
        return javascript({ typescript: true });
      case "go":
        return go();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl p-2 text-center basis-12 grow-0 shrink-0">Tempo Playground</h1>
      <div className="flex" style={{ height: "calc(100% - 3rem)" }}>
        <div className="flex flex-col basis-1/2 w-1/2 border-t border-r border-gray-200">
          <div className="flex gap-2 items-center px-2 py-1 border-b border-gray-200 bg-gray-50">
            <span className="font-medium">Tempo source code</span>
            <select
              className={inputClasses}
              onChange={(e) => {
                if (e.target.value != "choose") setSource(examples[e.target.value]);
              }}
            >
              <option value="choose" disabled>
                Choose Example
              </option>
              {exampleOptions}
            </select>
          </div>
          <CodeMirror className="flex-1" height="100%" autoFocus value={source} onChange={onChange} extensions={[linter(() => diagnostics, { delay: 0 })]} />
        </div>
        <div className="flex flex-col basis-1/2 w-1/2 border-t border-r border-gray-200">
          <div className="flex gap-2 items-center px-2 py-1 border-b border-gray-200 bg-gray-50">
            <span className="font-medium">Generated code</span>
            <select className={inputClasses} value={lang} onChange={(e) => setLang(e.target.value as CompilerLang)}>
              <option value="go">Go</option>
              <option value="ts">TypeScript</option>
            </select>
          </div>
          <div className="grow-0 basis-1/2 overflow-scroll w-full block">
            <CodeMirror height="100%" width="100%" editable={false} value={output} extensions={[languageExt(lang)]} />
          </div>
          <Simulate source={source} />
        </div>
      </div>
    </div>
  );
}

export default App;
