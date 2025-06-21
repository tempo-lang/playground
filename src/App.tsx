import { useCallback, useState } from "react";
import { usePlayground } from "./playground";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";
import { linter, type Diagnostic } from "@codemirror/lint";

const initCode = `func@(A,B) pingPong(count: Int@[A,B]) {
  if count > 0 {
    await A->B count;
    pingPong@(B,A)(count - 1);
  }
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
  const onChange = useCallback((val: string) => {
    setSource(val);
  }, []);

  let output = "loading...";
  const diagnostics: Diagnostic[] = [];
  if (playground) {
    const compile = playground.compile(source);
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

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl p-2 text-center">Tempo Playground</h1>
      <div className="flex h-full">
        <div className="flex-1/2 border-t border-r border-gray-200">
          <span className="font-medium block px-2 pt-1">Tempo source code</span>
          <CodeMirror autoFocus value={source} onChange={onChange} extensions={[linter(() => diagnostics)]} />
        </div>
        <div className="flex-1/2 border-t border-r border-gray-200">
          <span className="font-medium block px-2 pt-1">Generated Go code</span>
          <CodeMirror editable={false} value={output} extensions={[go()]} />
        </div>
      </div>
    </div>
  );
}

export default App;
