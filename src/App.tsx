import { usePlayground } from "./playground";

function App() {
  const playground = usePlayground();

  return (
    <>
      <p>Hello world</p>
      {playground ? playground.compile("playground") : "no playground"}
    </>
  );
}

export default App;
