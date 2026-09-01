import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HelloSolana } from "../target/types/hello_solana";

describe("hello_solana", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.helloSolana as Program<HelloSolana>;

  it("invokes initialize successfully", async () => {
    const signature = await program.methods.initialize().rpc();
    console.log("Transaction signature", signature);
  });
});
