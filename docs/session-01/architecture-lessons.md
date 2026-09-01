# Five Architecture Lessons from Solana's Execution Model

These notes focus on design consequences that are easy to miss in a command-level introduction.

## 1. State layout is part of the concurrency design

Solana separates executable programs from application state, but separation alone does not create parallelism. Parallel scheduling becomes possible because every instruction declares the accounts it will read or write before execution.

That makes state layout observable to the scheduler. Two transactions with disjoint writable account sets can run concurrently; two transactions that both write one shared account cannot.

Account boundaries are also concurrency boundaries. A globally writable counter, registry, or treasury can become a hot account even when the rest of the program is well partitioned.

## 2. An account list is an execution contract

The account metadata supplied to an instruction does three jobs:

1. identifies the state and programs available to the instruction;
2. declares signer and writable privileges for authorization;
3. exposes conflicts for runtime scheduling.

Anchor account structs encode this contract. Constraints such as `mut`, `signer`, `owner`, `seeds`, and `bump` describe the boundary within which the instruction may operate.

Missing account metadata prevents required work. Marking unnecessary accounts writable adds lock contention and gives the instruction privileges it does not need.

## 3. Ownership, signing, and addressing are separate capabilities

Addressing, ownership, signer status, and fee payment are independent:

- an account address identifies state;
- an owner program controls data mutation under runtime rules;
- a signer authorizes an invocation;
- a fee payer funds transaction processing.

A PDA makes the separation explicit. It is a deterministic address with no private key. Its owner can be an application program, while the runtime grants it signer privilege for a CPI only after validating the deriving program's seeds and bump.

## 4. PDA seeds form part of the persistent schema

PDA seeds define the namespace through which clients and programs discover state.

For example, `["poll", poll_id]` encodes both a domain and an application identifier. Changing the seed format later changes every derived address, which can require migration or compatibility logic.

Seed design should account for:

- uniqueness and collision boundaries;
- stable binary encoding for numeric values;
- account cardinality and contention;
- whether clients can reconstruct the address;
- canonical bump validation.

The address can be derived before the account exists. Creation is a separate state transition that allocates space, funds the storage deposit, and assigns ownership.

## 5. Atomicity and compute limits bound failure

A transaction is an atomic package of instructions. If one instruction fails, earlier state changes roll back and later instructions do not run. The fee remains charged because the cluster still performed verification and execution work.

Compute units add a resource boundary to that atomic model. Programs must complete within the transaction's compute budget, and prioritization depends on both requested limit and compute-unit price.

Keep each transaction's state transition coherent, avoid unnecessary accounts and work, and simulate before setting the compute limit. Atomicity does not extend across transactions, so multi-transaction workflows must model intermediate state, retries, and idempotency explicitly.
