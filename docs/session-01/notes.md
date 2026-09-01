# Session 1 technical notes

## Execution model in one view

A Solana client constructs a transaction, signs its message, and submits it through RPC. The transaction contains one or more instructions. Each instruction identifies a program, supplies serialized instruction data, and declares every account the program may access along with signer and writable privileges.

The runtime uses those declarations for both authorization and scheduling. Work that does not contend for the same writable accounts can run concurrently. Conflicting writes are ordered.

```text
client -> RPC -> scheduled leader -> SVM execution -> block propagation -> verification
```

Proof of History supplies a verifiable ordering mechanism. A scheduled leader orders and executes transactions for its slot. Turbine propagates block data as shreds to other validators. RPC is the client-facing interface to the cluster, not a separate source of ledger truth.

Solana's public architecture material often describes a roughly 400 ms target slot duration. It is a target used to explain the system, not a guarantee that every transaction reaches a particular commitment level in exactly 400 ms.

## Accounts

An account is the persistent storage unit. Its important durable fields include:

- `lamports`: native SOL balance in the smallest unit;
- `data`: bytes interpreted by the account's owner program;
- `owner`: the program allowed to modify the data or debit lamports; any program can credit a writable account;
- `executable`: whether the account represents executable program state;
- `rent_epoch`, a deprecated field still exposed in account representations.

One SOL is 1,000,000,000 lamports.

`is_signer` and `is_writable` are invocation privileges, not durable application fields. They describe how an account is presented to a specific instruction.

### Ownership is not possession

An account's owner is a program ID. Ownership gives that program authority over account data under runtime rules; it does not imply that the program has a private key for the address.

The System Program is the normal mechanism for creating accounts, allocating space, assigning an owner, and transferring native SOL. A custom program commonly invokes it while initializing application state.

### Storage deposit

New data accounts must hold enough lamports for the rent-exempt minimum associated with their allocated size. In current development this functions as a refundable storage deposit: correctly closing an account can return those lamports to a chosen recipient.

Account size is therefore part of the data model. Increasing allocated space requires reallocation and, when necessary, additional lamports.

## Programs

A program is executable code invoked by instructions. Calling programs "stateless" means mutable application state lives in separate accounts rather than mutable globals inside the executable.

For an upgradeable loader-v3 deployment, the executable Program account points to a ProgramData account containing deployed bytes and upgrade metadata. Application data accounts are separate and owned by the application program.

Programs can invoke other programs through cross-program invocation (CPI):

- `invoke` performs a CPI with the privileges already supplied;
- `invoke_signed` additionally lets the runtime validate a calling program's PDA seeds and grant that PDA signer privilege for the nested invocation.

No PDA private key or conventional PDA signature is created.

The runtime rejects indirect re-entrancy such as A -> B -> A, while direct self-recursion is allowed. This is more precise than the broad claim that re-entrancy is impossible.

## Instructions and transactions

An instruction contains:

- a target program ID;
- ordered account metadata;
- serialized instruction data.

A transaction contains a signed message with one or more ordered instructions, a recent blockhash, account keys, and related metadata.

Within a transaction:

- all account access is declared before execution;
- instructions run in order;
- state changes are atomic across the transaction;
- if an instruction fails, earlier changes are rolled back and later instructions do not run;
- the transaction fee is still charged after execution failure;
- the first transaction signature is conventionally used as the transaction ID;
- a recent blockhash bounds how long a transaction remains usable.

The fee payer is the first signer. It pays the base fee whether execution succeeds or fails.

## Parallel execution

The SVM can determine account conflicts before execution:

- disjoint writable account sets can run in parallel;
- multiple instructions may read the same read-only account concurrently;
- writes require exclusive access;
- transactions contending for a writable account must be serialized.

Parallelism does not follow from code/state separation alone. It depends on explicit, accurate account access declarations that make conflicts visible to the scheduler.

A single hot writable account can serialize otherwise independent activity. State partitioning and PDA seed design therefore affect performance as well as storage layout.

## Keypairs and signers

A normal Solana keypair has an Ed25519 private key and corresponding public key. The public key is used as an address; the private key authorizes signatures and must remain secret.

The same address format is valid on localnet, devnet, and mainnet, but each cluster has independent ledger state and balances. Devnet SOL has no mainnet value and cannot be moved between clusters.

Development keypairs such as `~/.config/solana/id.json` and `target/deploy/*-keypair.json` are unencrypted secret material. They must not be committed or printed in documentation.

## Program Derived Addresses

A Program Derived Address (PDA) is deterministic. Its derivation uses:

1. one or more byte-string seeds;
2. a bump byte;
3. a program ID;
4. the PDA domain separator implemented by the SDK.

The SDK searches from bump 255 downward for an address that is off the Ed25519 curve. The first valid result is the canonical PDA and canonical bump.

Because the result is off-curve, no corresponding private key exists. The deriving program can nevertheless act for the PDA during a CPI when `invoke_signed` supplies the exact seeds and bump and the runtime verifies the derivation.

PDAs provide stable addresses for logical application state:

```text
["profile", authority]
["poll", poll_id]
["vault", owner]
```

Changing any seed or the program ID changes the address. Identical seeds used by different programs do not collide because the program ID participates in the derivation.

Derivation is local computation. It does not create, allocate, fund, or assign an on-chain account. An initialization instruction must perform those actions.

An Associated Token Account is a PDA derived by the Associated Token Program from the wallet owner, Token Program ID, and mint.

## Compute units and fees

Compute units meter instruction work. The Session 1 environment used these operational limits:

- 5,000 lamports base fee per signature;
- 200,000 compute units by default per non-builtin instruction;
- 1.4 million compute units maximum per transaction.

For legacy and versioned transactions, the prioritization fee is `ceil(compute_unit_limit * compute_unit_price / 1,000,000)` lamports, where the price is expressed in micro-lamports per compute unit. A zero price produces no prioritization fee. Requesting an unnecessarily high limit can still increase the fee when the price is nonzero and can affect scheduling priority.

## Clusters

### Localnet

A local validator has isolated, disposable state and a faucet for local SOL. With the pinned Anchor toolchain, `anchor test` starts a temporary validator, deploys the program, runs tests, and shuts the validator down.

### Devnet

A public development cluster with shareable Explorer records and valueless test SOL. Public RPC and faucet access are rate limited, and the cluster may be reset. Devnet is appropriate for integration checks and demonstrations, not durable production state.

### Mainnet

The production cluster where SOL has real value. It is outside the Session 1 lab workflow.

## Development stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Language | Rust and Cargo | Program implementation and dependency management |
| Network tooling | Solana CLI / Agave | Cluster configuration, keys, accounts, local validator, and deployment |
| Framework | Anchor and AVM | Scaffolding, account validation, IDL/client generation, build, test, and deploy |
| Client/test runtime | Node.js and Yarn | Generated TypeScript clients and integration tests |
| Later local tooling | Surfpool | Alternative local Solana development environment |

An Anchor command can fail in a lower layer. For example, `anchor build` may report a Rust, Cargo, SBF platform-tools, linker, or dependency-resolution failure. Debug the named layer rather than assuming Anchor itself is the cause.

## Anchor project anatomy

| Path | Role |
| --- | --- |
| `programs/hello_solana/src/lib.rs` | On-chain Rust program |
| `tests/hello_solana.ts` | TypeScript integration test |
| `Anchor.toml` | Provider, scripts, and program IDs |
| `target/deploy/*.so` | Compiled SBF program |
| `target/deploy/*-keypair.json` | Local program deployment keypair; never commit |
| `target/idl/*.json` | Generated interface description |
| `target/types/*.ts` | Generated TypeScript program type |

On a fresh clone, `anchor build` creates a local deployment keypair. `anchor keys sync` then aligns `declare_id!` and the selected `Anchor.toml` program entry with that keypair.

## Practical debugging sequence

1. Print versions and executable paths.
2. Run `solana config get`; verify both cluster and wallet.
3. Reproduce on localnet before using devnet.
4. Read transaction simulation and validator logs.
5. Confirm account signer/writable metadata and ownership.
6. Verify program IDs with `anchor keys list` and `anchor keys sync`.
7. Inspect failed deployment buffers before retrying.

Keep WSL projects in the Linux filesystem, such as `~/solana`, rather than `/mnt/c`. Cross-filesystem Rust builds are substantially slower.

See [resources.md](resources.md) for the official references used to verify these notes.
