//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const chai = require("chai");
const assert = chai.assert;

const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

describe("Mastermind Variation", function () {
  this.timeout(100000);

  before(async () => {
    poseidon = await buildPoseidon();
    F = poseidon.F;

    circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
  });

  /* Generate an input parameter for the witness.
   * a ... d: are the color guesses from 0 to 7, no repetition
   * sa ... sd: are the solutions
   * hit: number of color hits with right positions
   * blow: number of same colors with wrong positions
   * salt: (optional) secret salt used as trapdoor against brute-force attacks */
  const generateInput = (a, b, c, d, sa, sb, sc, sd, hit, blow, salt = 123) => {
    const pubSolnHash = poseidon.F.toObject(poseidon([salt, sa, sb, sc, sd]));

    return {
      pubGuessA: a,
      pubGuessB: b,
      pubGuessC: c,
      pubGuessD: d,
      pubNumHit: hit,
      pubNumBlow: blow,
      pubSolnHash: pubSolnHash,
      privSolnA: sa,
      privSolnB: sb,
      privSolnC: sc,
      privSolnD: sd,
      privSalt: salt,
    };
  };


  it("Test correct inputs, 4 hits no blows", async () => {
    const input = generateInput(0, 1, 2, 3, 0, 1, 2, 3, 4, 0);

    const witness = await circuit.calculateWitness(input, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(input.pubSolnHash)));
  });

  it("Test 1 hit, 2 blows inputs", async () => {
    const input = generateInput(0, 3, 4, 2, 0, 1, 2, 3, 1, 2);

    const witness = await circuit.calculateWitness(input, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(input.pubSolnHash)));
  });
});
