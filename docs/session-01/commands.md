# Session 1 command reference

All network examples use localnet or devnet. Check `solana config get` before every network-sensitive operation.

## Environment

| Command | Use |
| --- | --- |
| `rustc --version` | Show the selected Rust compiler. |
| `cargo --version` | Show the Cargo version. |
| `solana --version` | Show the Agave/Solana CLI version. |
| `anchor --version` | Show the selected Anchor CLI version. |
| `avm --version` | Show the Anchor Version Manager version. |
| `node --version && yarn --version` | Show the TypeScript test runtime versions. |
| `which rustc cargo solana anchor node yarn cargo-build-sbf` | Resolve the executables currently on `PATH`. |

## Solana configuration and wallet

| Command | Purpose | Caveat |
| --- | --- | --- |
| `solana config get` | Show RPC URL, keypair path, and commitment. | Read this before diagnosing balances or deployments. |
| `solana config set --url devnet` | Select the public devnet cluster. | Public RPC is shared and rate limited. |
| `solana config set --url localhost` | Select a local validator. | Restore devnet when finished. |
| `solana address` | Print the configured wallet's public address. | Public address only; never print keypair contents. |
| `solana balance` | Read the wallet balance on the selected cluster. | A zero balance often indicates the wrong cluster. |
| `solana-keygen new` | Create a development keypair. | Recovery phrase and JSON are secrets; never commit them. |

## Devnet transfer

```bash
solana-keygen new --no-bip39-passphrase --silent \
  -o ~/solana-school-receiver.json
solana address -k ~/solana-school-receiver.json
solana transfer "$(solana address -k ~/solana-school-receiver.json)" 0.1 \
  --allow-unfunded-recipient --url devnet
solana confirm -v <TRANSACTION_SIGNATURE> --url devnet
```

Expected result: a confirmed or finalized System Program transfer. Keep `?cluster=devnet` on the Explorer URL.

## Local validator

| Command | Purpose | Caveat |
| --- | --- | --- |
| `solana-test-validator` | Start a persistent local validator. | Run in a separate terminal. |
| `solana airdrop 100` | Credit free local SOL. | Works only against a local validator in this workflow. |
| `solana logs` | Stream program and transaction logs. | The CLI must target the intended cluster. |
| `pgrep -af solana-test-validator` | Inspect running validator processes. | Stop the confirmed process from the terminal that started it. |

`anchor test` normally manages its own disposable local validator, so manual validator management is optional.

## Anchor scaffold, build, and test

```bash
anchor init hello_solana
cd hello_solana
yarn install --frozen-lockfile
anchor build
anchor keys sync
anchor build
anchor keys list
anchor test
```

On a fresh clone, the first build generates a local program keypair. The sync step aligns source/configuration with that local public key. Never commit `target/deploy/*-keypair.json`.

## PDA derivation

```bash
node pda.js <PROGRAM_ID> counter
node pda.js <PROGRAM_ID> vault
solana account <DERIVED_PDA>
```

The same program ID and seed produce the same PDA. A different seed produces a different PDA. `AccountNotFound` is expected until an instruction creates the account.

## Devnet deployment

Before deploying, confirm that `declare_id!`, `[programs.devnet]`, and `anchor keys list` report the same program ID. The cluster override deploys to devnet without changing the committed localnet provider.

```bash
solana config set --url devnet
solana config get
solana balance
anchor build
solana rent "$(wc -c < target/deploy/hello_solana.so)"
anchor deploy --provider.cluster devnet
solana program show <PROGRAM_ID> --url devnet
solana program show --buffers --url devnet
```

If a deployment fails after creating upload buffers, inspect them and reclaim only confirmed leftovers before retrying:

```bash
solana program close --buffers <BUFFER_ADDRESS> --url devnet
```

Do not close a successfully deployed program while it is still needed. Closing a program is destructive.

## Debugging

| Symptom | Command or check |
| --- | --- |
| Missing executable | `which rustc cargo solana anchor node yarn cargo-build-sbf` |
| Wrong balance/account | `solana config get` and `solana address` |
| Port 8899 in use | inspect for a leftover `solana-test-validator` |
| Program ID mismatch | `anchor keys sync && anchor build` |
| Dependency version conflict | `cargo tree -i <CRATE>` |
| Failed transaction | `solana confirm -v <SIGNATURE>` and validator/program logs |
| Failed deploy consumed SOL | `solana program show --buffers --url devnet` before retrying |
