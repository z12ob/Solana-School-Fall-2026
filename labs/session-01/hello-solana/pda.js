const { PublicKey } = require("@coral-xyz/anchor").web3;

const programIdInput = process.argv[2];
const seed = process.argv[3] ?? "counter";

if (!programIdInput) {
  console.error("Usage: node pda.js <PROGRAM_ID> [SEED]");
  process.exit(1);
}

const seedBytes = Buffer.from(seed);
if (seedBytes.length > 32) {
  console.error("Seed must be at most 32 bytes when encoded as UTF-8.");
  process.exit(1);
}

let programId;
try {
  programId = new PublicKey(programIdInput);
} catch {
  console.error("PROGRAM_ID must be a valid Solana public key.");
  process.exit(1);
}

const [pda, bump] = PublicKey.findProgramAddressSync([seedBytes], programId);

console.log("program", programId.toBase58());
console.log("seed   ", seed);
console.log("pda    ", pda.toBase58());
console.log("bump   ", bump);
