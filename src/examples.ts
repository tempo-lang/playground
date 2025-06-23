export type Examples = {
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
}
`,
  "Shift Roles": `func@(A,B,C,D) shiftRoles(count: Int@[A,B,C,D]) {
  if count > 0 {
    await A->B count;
    shiftRoles@(B,C,D,A)(count - 1);
  }
}

func@(A,B,C,D) main() {
  shiftRoles@(A,B,C,D)(4);
}
`,
  "Transitive Send": `func@(A,B,C) main() Int@[A,B,C] {
  let x: Int@A = 10;
  let y: Int@[A,B] = await A->B x;
  let z: Int@[A,B,C] = await B->C y;
  return z;
}
`,
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
}
`,
  "Distributed Pair": `struct@(A,B) Pair {
  x: Int@A,
  y: String@B
}

func@(A,B) main() Pair@(A,B) {
  let number: async Int@A = B->A 10;
  let text: async String@B = A->B "hello";

  return Pair@(A,B) {
    x: await number,
    y: await text
  };
}
`,
};

export default examples;
