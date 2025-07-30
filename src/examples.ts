export type Examples = {
  [key: string]: string;
};

const examples: Examples = {
  "Ping Pong": `/*
 * Ping Pong example where the function pingPong is called recursively 4 times.
 * Each time it is called the roles are swapped, that way A and B will take turn in sending and receiving.
 */

func@(A,B) pingPong(count: Int@[A,B]) {
  if count > 0 {
    await A->B count;
    pingPong@(B,A)(count - 1);
  }
}

func@(A,B) main() {
  pingPong@(A,B)(4);
}
`,
  "Shift Roles": `/*
 * In the shiftRoles function, A will send the count to B.
 * Next, the function is called recursively but with all roles shifted one spot.
 * This means that B will now send the count to C.
 * It continues like this until count reaches 0.
 */

func@(A,B,C,D) shiftRoles(count: Int@[A,B,C,D]) {
  if count > 0 {
    await A->B count;
    shiftRoles@(B,C,D,A)(count - 1);
  }
}

func@(A,B,C,D) main() {
  shiftRoles@(A,B,C,D)(4);
}
`,
  "Transitive Send": `/*
 * This example demonstrates how a shared value can be propagated transitively.
 * First A shares the value with B, whereafter B shares it with C.
 */

func@(A,B,C) main() Int@[A,B,C] {
  let x: Int@A = 10;
  let y: Int@[A,B] = await A->B x;
  let z: Int@[A,B,C] = await B->C y;
  return z;
}
`,
  "Distributed Pair": `/*
 * This example show how a data structure can be distributed over multiple roles.
 * In the Pair structure, the 'x' attribute exists at 'A' and 'y' exists at 'B'.
 *
 * In the 'exchange' method, A sends its value to B and vice versa.
 * A pair with the roles flipped is returned.
 */

struct@(A,B) Pair {
  x: Int@A;
  y: String@B;

  func@(A,B) exchange() Pair@(B,A) {
    return Pair@(B,A) {
      x: await A->B x,
      y: await B->A y
    };
  }
}

func@(A,B) main() Pair@(B,A) {
  let number: Int@A = 10;
  let text: String@B = "hello";

  let pair = Pair@(A,B) {
    x: number,
    y: text
  };

  return pair.exchange();
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
};

export default examples;
