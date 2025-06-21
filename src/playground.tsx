import { useState, useEffect } from "react";

type CompilerError = {
  error: string;
  start?: [number, number];
  end?: [number, number];
};

type CompilerOutput = {
  errors: CompilerError[];
  output?: string;
};

type Playground = {
  compile(input: string): CompilerOutput;
};

declare global {
  var playground: Playground | undefined;
}

async function configurePlayground(): Promise<Playground> {
  const go = new Go();

  const result = await WebAssembly.instantiateStreaming(fetch(import.meta.env.BASE_URL + "playground.wasm"), go.importObject);

  go.run(result.instance);

  return globalThis.playground as Playground;
}

export function usePlayground(): Playground | undefined {
  const [playground, setPlayground] = useState<Playground | undefined>(undefined);

  useEffect(() => {
    console.log("call configure");
    configurePlayground().then((result) => {
      setPlayground(result);
    });
  }, []);

  return playground;
}
