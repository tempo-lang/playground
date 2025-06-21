import { useCallback, useState } from "react";
import { usePlayground } from "./playground";
import CodeMirror from "@uiw/react-codemirror";
import { go } from "@codemirror/lang-go";

const initCode = `func@(A,B) pingPong(count: Int@[A,B]) {
  if count > 0 {
    await A->B count;
    pingPong@(B,A)(count - 1);
  }
}`;

function App() {
  const playground = usePlayground();

  const [source, setSource] = useState(initCode);
  const onChange = useCallback((val: string) => {
    console.log("val:", val);
    setSource(val);
  }, []);

  const output = playground ? playground.compile(source) : "loading...";

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl p-2 text-center">Tempo Playground</h1>
      <div className="flex h-full">
        <div className="flex-1/2 border-t border-r border-gray-200">
          <span className="font-medium block px-2 pt-1">Tempo source code</span>
          <CodeMirror autoFocus value={source} onChange={onChange} />
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
