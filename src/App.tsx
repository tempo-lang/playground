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
    <>
      <h1>Tempo Playground</h1>
      <CodeMirror autoFocus value={source} onChange={onChange} />
      <CodeMirror editable={false} value={output} extensions={[go()]} />
    </>
  );
}

export default App;
