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
  Loops: `/*
 * This example demonstrates two approaches to distributed loops.
 *
 * In the "sharedLoop" example, A starts by sending the total iteration count to B.
 * Now both A and B know how many times to enter the loop.
 *
 * In the "controlledLoop" example, A controls how many times B will enter the loop.
 * A will locally evaluate "i > 0" and send only the boolean result.
 * B will enter the loop repeatedly until "false" is received from A.
 * Locally, only A knows how many steps to take in the loop.
 */

func@(A,B) sharedLoop(count: Int@A) {
  let i: Int@[A,B] = await A->B count;
  while i > 0 {
    await B->A "shared loop";
    i = i - 1;
  }
}

func@(A,B) controlledLoop(count: Int@A) {
  let i: Int@A = count;
  while await A->B (i > 0) {
    await B->A "controlled loop";
    i = i - 1;
  }
}

func@(A,B) main() {
  let count: Int@A = 3;
  
  sharedLoop@(A,B)(count);
  controlledLoop@(A,B)(count);
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
  "Remote Procedure Calls": `/*
 * In this example we define the 'RPC' interface for a remote procedure call.
 * The method 'call' will send the value from 'A' to 'B',
 * then 'B' will make a computation on the value and send the result back to 'A'.
 */

interface@(A, B) RPC {
  func@(A, B) call(input: Int@A) async Int@A;
}

struct@(A,B) RemoteCall implements RPC@(A,B) {
  fn: func@(B)(Int@B)Int@B;

  func@(A, B) call(input: Int@A) async Int@A {
    let output = fn(await A->B input);
    return B->A output;
  }
}

func@(A,B) main() {
  let double = func@B (input: Int@B) Int@B {
    return input * 2;
  };

  let rpc: RPC@(A,B) = RemoteCall@(A,B) { fn: double };

  let result: Int@A = await rpc.call(10@A);
}`,
  "Diffie Hellman": `/*
 * This example demonstrates a simple DiffieHellman exchange.
 * When running the simulation A and B obtains the shared secret, only sharing their public keys.
 */

// Generic interface for exponentiation
interface Math {
  func Exp(base: Int, exp: Int) Int;
}

// The shared secret obtained by Diffie Hellman
struct@(A,B) Secret {
  A: Int@A;
  B: Int@B;
}

// The Diffie Hellman computation
func@(A,B) DiffieHellman(mathA: Math@A, mathB: Math@B) Secret@(A,B) {
  let p = 23;
  let g = 5;

  let a = 4@A;
  let b = 3@B;

  let A: async Int@B = A->B mathA.Exp(g, a) % p;
  let B: async Int@A = B->A mathB.Exp(g, b) % p;

  let sA = mathA.Exp(await B, a) % p;
  let sB = mathB.Exp(await A, b) % p;

  return Secret@(A,B) {
    A: sA, B: sB
  };
}

// Naive implementation of exponentiation
struct@X MathImpl implements Math@X {
  func@X Exp(base: Int@X, exp: Int@X) Int@X {
    let result = 1;
    let i = 0;
    while i < exp {
      result = result * base;
      i = i + 1;
    }
    return result;
  }
}

// Main function to test it
func@(A,B) main() Secret@(A,B) {
  let result = DiffieHellman@(A,B)(MathImpl@A {}, MathImpl@B {});
  return result;
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
