# Session 01: SVM foundations and local setup

Session 1 covered the SVM execution model and the local development toolchain. Programs contain logic, accounts contain state, and instructions declare account access. Those declarations let the runtime schedule non-conflicting transactions in parallel.

## Concepts

- accounts, owners, signers, and writable privileges;
- programs, loaders, and application state;
- instructions, transactions, fees, and atomicity;
- Program Derived Addresses and canonical bumps;
- RPC nodes, validators, leaders, and clusters;
- compute units and transaction limits;
- Rust, Solana CLI, Anchor, Node.js, and the local development loop.

## Lab

[hello-solana](../../labs/session-01/hello-solana/README.md) is a minimal Anchor program with one instruction, a TypeScript integration test, and a small PDA derivation script.

## Visual material

- [Solana SVM Blueprint](../../assets/session-01/solana-svm-blueprint.pdf) is a 12-page visual reference for the Session 1 execution model and development workflow.
- [Unlocking the SVM](../../media/session-01/README.md#unlocking-the-svm) is a narrated explainer distributed as a GitHub Release asset, with captions stored in the repository.

## Session documents

- [Technical notes](notes.md)
- [Commands](commands.md)
- [Setup and deployment exercise](homework.md)
- [Five architecture lessons](architecture-lessons.md)
- [Verified resources](resources.md)
- [Media metadata](../../media/session-01/README.md)

Official course files are intentionally not mirrored. Public first-party resources are linked from [resources.md](resources.md).
