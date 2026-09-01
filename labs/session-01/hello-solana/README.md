# hello-solana

A minimal Anchor program that compiles to SBF, runs against a disposable local validator, and exposes one instruction to a TypeScript client. A separate script derives deterministic PDAs locally.

## What the program does

`initialize` accepts no application accounts and emits the executing program ID through `msg!`. The program intentionally stores no state. The lab exercises this execution path:

```text
Anchor-generated client/IDL
  -> signed transaction
  -> local validator
  -> initialize instruction
  -> program log
```

`pda.js` separately derives a canonical PDA from the selected program ID and one UTF-8 seed. It does not create an account or submit a transaction.

## Architecture

| File | Role |
| --- | --- |
| `programs/hello_solana/src/lib.rs` | On-chain Anchor program |
| `tests/hello_solana.ts` | TypeScript integration test |
| `pda.js` | Local PDA derivation utility |
| `Anchor.toml` | Provider, program IDs, and test command |
| `Cargo.lock` | Reproducible Rust/SBF dependency graph |
| `yarn.lock` | Reproducible TypeScript dependency graph |

Generated output under `target/`, local validator state, `node_modules/`, and every keypair JSON file are intentionally excluded.

## Prerequisites

- Rust through rustup;
- Solana CLI / Agave;
- AVM and Anchor CLI;
- Node.js and Yarn;
- Linux, macOS, or WSL for Windows.

Keep WSL checkouts in the Linux filesystem for acceptable Cargo performance.
If Node is managed by NVM, activate it in the same WSL shell before running Anchor; a Windows Node installation does not provide a Linux `node` executable.

## Toolchain compatibility

This copy was tested with:

```text
Rust project toolchain 1.89.0
Solana CLI 2.3.0
Anchor CLI 0.32.1
Node.js 24.10.0
Yarn 1.22.22
```

Anchor 0.32.1's release notes recommend Solana 2.3.0. The committed lockfiles preserve the dependency graph tested with that toolchain. Validate any dependency update with `anchor build` and `anchor test`.

The Yarn `resolutions` entry pins the transitive `uuid` package to patched release 11.1.1. Yarn 1 warns because `jayson` requests an older major; the resolved graph passes `yarn audit` and the integration test.

## Install

```bash
yarn install --frozen-lockfile
```

## Build a fresh clone

Program deployment keypairs must not be committed. The first build creates a local one, after which Anchor must synchronize the source/configuration with its public key:

```bash
anchor build
anchor keys sync
anchor build
anchor keys list
```

`anchor keys sync` changing the working copy's local program ID is expected. The generated `target/deploy/hello_solana-keypair.json` remains ignored and secret.

## Test locally

The committed provider defaults to localnet:

```bash
anchor test
```

Expected result:

```text
1 passing
```

Anchor starts a disposable validator, deploys the program, runs the TypeScript test, and shuts the validator down.

## Derive a PDA

Copy the local public program ID from `anchor keys list`:

```bash
node pda.js <LOCAL_PROGRAM_ID> counter
node pda.js <LOCAL_PROGRAM_ID> counter
node pda.js <LOCAL_PROGRAM_ID> vault
```

The two `counter` calls must match. `vault` must produce a different address. All three operations are local calculations.

## Optional devnet deployment

Use a disposable wallet containing only valueless devnet SOL. Confirm the network first:

```bash
solana config set --url devnet
solana config get
solana balance
```

Update `[provider]` and `[programs.devnet]` in `Anchor.toml` to use devnet and the public program ID currently reported by `anchor keys list`, then:

```bash
anchor build
solana rent "$(wc -c < target/deploy/hello_solana.so)"
anchor deploy
solana program show <YOUR_PROGRAM_ID> --url devnet
```

Explorer URL:

```text
https://explorer.solana.com/address/<YOUR_PROGRAM_ID>?cluster=devnet
```

The Session 1 devnet deployment is `DCSKdvKJoYpD7pKoKsQvMy6HcDkb2Z8eBPdvUqtuEJ4G`. It is not a production service. Use a new program ID for another deployment.

## Expected generated files

After a successful build/test, Anchor creates:

- `target/deploy/hello_solana.so`;
- `target/deploy/hello_solana-keypair.json`;
- `target/idl/hello_solana.json`;
- `target/types/hello_solana.ts`.

Only the `.so`, IDL, and generated type are non-secret, but all generated output stays ignored here. The keypair JSON must never be published.

For the full exercise and troubleshooting notes, see [Session 1 homework](../../../docs/session-01/homework.md).
