#!/usr/bin/env bash
set -euo pipefail

: "${SOROBAN_NETWORK:=testnet}"

stellar contract build --manifest-path contracts/circulo/Cargo.toml
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/circulo_contract.wasm \
  --source "${STELLAR_DEPLOYER_SECRET_KEY:?Set STELLAR_DEPLOYER_SECRET_KEY}" \
  --network "$SOROBAN_NETWORK"
