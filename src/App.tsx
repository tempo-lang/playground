import { useCallback, useState } from "react";
import { usePlayground, type CompilerLang } from "./usePlayground";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";
import { javascript } from "@codemirror/lang-javascript";
import { linter, type Diagnostic } from "@codemirror/lint";
import Simulate from "./Simulate";
import examples from "./examples";

function lineColToPos(source: string, line: number, col: number): number {
  line -= 1;

  const lineSum = source
    .split("\n")
    .slice(0, line)
    .map((l) => l.length)
    .reduce((a, b) => a + b, 0);

  return lineSum + line + col;
}

export const inputClasses = `
  focus:outline-solid focus:outline-1 focus:outline-blue-200
  bg-white hover:bg-blue-50 disabled:bg-gray-50
  border border-gray-300 hover:not-disabled:border-blue-400 focus:border-blue-400 disabled:bg-gray-100 rounded not-disabled:shadow-xs
  font-medium text-sm text-black disabled:text-gray-400
  px-2 h-7 not-disabled:cursor-pointer`;

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
      output = errors
        .map(({ start, end, error }) => {
          if (start && end) {
            return `${start[0]}:${start[1]}: ${error}`;
          } else {
            return error;
          }
        })
        .join("\n");
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
      <div>
        <h1 className="text-2xl p-2 text-center basis-12 grow-0 shrink-0 bg-[#3f82c8] text-white">Tempo Playground</h1>
        <a href="/docs" className="absolute top-3 right-4 text-blue-50 cursor-pointer hover:text-white">
          Documentation
        </a>
      </div>
      <div className="flex" style={{ height: "calc(100% - 3rem)" }}>
        <div className="flex flex-col basis-1/2 w-1/2 border-r border-gray-200">
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
          <CodeMirror extensions={[linter(() => diagnostics, { delay: 0 })]} className="flex-1" height="100%" autoFocus value={source} onChange={onChange} />
        </div>
        <div className="flex flex-col basis-1/2 w-1/2 border-r border-gray-200">
          <div className="flex gap-2 items-center px-2 py-1 border-b border-gray-200 bg-gray-50">
            <span className="font-medium">Generated code</span>
            <select className={inputClasses} value={lang} onChange={(e) => setLang(e.target.value as CompilerLang)}>
              <option value="choose" disabled>
                Choose Language
              </option>
              <option value="go">Go</option>
              <option value="ts">TypeScript</option>
            </select>
          </div>
          <div className="grow-0 basis-1/2 overflow-scroll w-full block">
            <CodeMirror height="100%" width="100%" editable={false} value={output} extensions={[languageExt(lang)]} />
          </div>
          <Simulate disabled={diagnostics.length > 0} source={source} />
        </div>
      </div>
    </div>
  );
}

export default App;
