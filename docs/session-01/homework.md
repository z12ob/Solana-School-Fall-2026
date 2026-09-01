# Session 1 homework: local program to devnet

This exercise builds and tests the repository's minimal Anchor program, derives a PDA locally, sends a devnet transfer, and optionally deploys the program to devnet.

## Safety boundary

- Use only localnet and devnet.
- Use a disposable development wallet.
- Never commit `id.json`, `*-keypair.json`, a seed phrase, or a private RPC URL.
- Confirm the selected cluster before every transfer or deployment.

## Prerequisites

The repository-tested environment is:

```text
Rust toolchain: 1.89.0 for this project
Solana CLI: 2.3.0
Anchor CLI: 0.32.1
Node.js: 24.10.0
Yarn: 1.22.22
```

On Windows, use WSL and keep the checkout in the Linux filesystem rather than `/mnt/c`.

Verify the required tools:

```bash
rustc --version
cargo --version
solana --version
anchor --version
avm --version
node --version
yarn --version
```

## 1. Install dependencies

From the lab directory:

```bash
cd labs/session-01/hello-solana
yarn install --frozen-lockfile
```

Expected result: Yarn installs the exact dependency graph from `yarn.lock`.

## 2. Build and synchronize the local program ID

A deployment keypair is intentionally not committed. A fresh first build creates one under the ignored `target/deploy` directory.

```bash
anchor build
anchor keys sync
anchor build
anchor keys list
```

Expected result:

- `target/deploy/hello_solana.so` exists;
- `anchor keys list` prints one `hello_solana` program ID;
- `declare_id!` and the localnet entry in `Anchor.toml` match that local keypair.

The sync command modifies the working copy's local program ID. That is expected for a fresh clone. Never add the generated keypair JSON to Git.

## 3. Run the local integration test

The repository defaults to localnet:

```bash
anchor test
```

Expected result:

```text
1 passing
```

Anchor starts a disposable validator, deploys the program, invokes `initialize`, and tears the validator down.

## 4. Derive a PDA

Use the local program ID from `anchor keys list`:

```bash
node pda.js <LOCAL_PROGRAM_ID> counter
node pda.js <LOCAL_PROGRAM_ID> counter
node pda.js <LOCAL_PROGRAM_ID> vault
```

Expected result:

- both `counter` runs produce the same address and bump;
- `vault` produces a different address;
- no network request is needed.

To confirm that derivation did not create a devnet account:

```bash
solana account <COUNTER_PDA> --url devnet
```

`AccountNotFound` is expected unless another transaction has created an account at that exact devnet address.

## 5. Configure a disposable devnet wallet

Inspect existing configuration before changing it:

```bash
solana config get
solana config set --url devnet
solana config get
solana address
solana balance
```

If a development keypair does not exist, create one with `solana-keygen new` and protect the resulting seed phrase. Obtain valueless devnet SOL from the [official web faucet](https://faucet.solana.com/).

Expected result: the RPC URL says devnet and the configured address has sufficient devnet SOL.

## 6. Send a devnet transaction

Create a disposable receiver without printing another recovery phrase:

```bash
solana-keygen new --no-bip39-passphrase --silent \
  -o ~/solana-school-receiver.json
solana transfer "$(solana address -k ~/solana-school-receiver.json)" 0.1 \
  --allow-unfunded-recipient --url devnet
solana confirm -v <TRANSACTION_SIGNATURE> --url devnet
```

Expected result: a successful System Program transfer with a 5,000-lamport fee for its single signature under the tested fee schedule.

Explorer URL:

```text
https://explorer.solana.com/tx/<TRANSACTION_SIGNATURE>?cluster=devnet
```

## 7. Optional devnet deployment

First confirm the current local program ID and devnet balance:

```bash
anchor keys list
solana config get
solana balance
```

In `Anchor.toml`, set the provider to devnet and ensure `[programs.devnet]` contains the same program ID currently declared by the program:

```toml
[programs.devnet]
hello_solana = "<YOUR_PROGRAM_ID>"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

Then build, preview storage cost, and deploy:

```bash
anchor build
solana rent "$(wc -c < target/deploy/hello_solana.so)"
anchor deploy
solana program show <YOUR_PROGRAM_ID> --url devnet
```

Expected result: Anchor prints a deployment signature and program ID; `solana program show` reports the upgradeable-loader metadata.

Explorer URL:

```text
https://explorer.solana.com/address/<YOUR_PROGRAM_ID>?cluster=devnet
```

### Session 1 devnet deployment

The original verified Session 1 deployment remains public on devnet:

```text
DCSKdvKJoYpD7pKoKsQvMy6HcDkb2Z8eBPdvUqtuEJ4G
```

[View it in Solana Explorer](https://explorer.solana.com/address/DCSKdvKJoYpD7pKoKsQvMy6HcDkb2Z8eBPdvUqtuEJ4G?cluster=devnet).

This is a historical devnet deployment, not a production service. Use a new program ID for another deployment.

## Common problems

### Cargo or rustc rejects a transitive dependency

Solana's SBF tools can embed an older Cargo/rustc than the global toolchain. This repository commits a tested `Cargo.lock` with compatible transitive versions. Use the lockfile and avoid an unreviewed dependency update.

To find the dependency path for a named crate:

```bash
cargo tree -i <CRATE>
```

### `DeclaredProgramIdMismatch`

```bash
anchor keys sync
anchor build
```

Confirm that the selected `Anchor.toml` cluster entry and `declare_id!` match `anchor keys list`.

### Port 8899 is already in use

Check whether a previous local validator remains active. Stop only the confirmed `solana-test-validator` process, then rerun `anchor test`.

### Devnet returns 429 or times out

Public RPC and faucet endpoints are shared. Wait and retry rather than repeatedly submitting the same deployment. If an upload failed, inspect buffers first:

```bash
solana program show --buffers --url devnet
```

Close only confirmed leftover buffers before another deployment attempt.

### Explorer says the account does not exist

Include `?cluster=devnet` in the URL. Explorer otherwise may query a different cluster.
