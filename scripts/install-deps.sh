#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y \
  build-essential \
  cmake \
  ninja-build \
  clang \
  clang-tidy \
  lldb \
  pkg-config

echo "Installed required toolchain and build tools."