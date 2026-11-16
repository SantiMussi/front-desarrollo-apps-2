#!/bin/sh
set -eu

# Only the Linux CI/build tool is replaced. Never mix esbuild JS and binary APIs.
binary=${1:?Patched esbuild binary is required}
expected=0.25.12
test "$(node -p 'require("esbuild/package.json").version')" = "$expected"
chmod +x "$binary"
test "$("$binary" --version)" = "$expected"
for target in node_modules/@esbuild/linux-x64/bin/esbuild node_modules/esbuild/bin/esbuild; do
  test -f "$target"
  # npm may hard-link these two paths; truncate in place so both copies are patched.
  cat "$binary" > "$target"
  chmod +x "$target"
  test "$("$target" --version)" = "$expected"
done
node -e 'require("esbuild").transformSync("const x = 1", {loader: "js"})'
