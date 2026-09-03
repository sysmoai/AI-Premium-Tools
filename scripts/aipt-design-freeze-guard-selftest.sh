#!/usr/bin/env bash
set -euo pipefail

root=$(pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cp "$root/scripts/aipt-design-freeze-guard.mjs" "$tmp/guard.mjs"
cd "$tmp"

git init -q
git config user.name 'AIPT CI'
git config user.email 'aipt-ci@example.invalid'
mkdir -p artifacts/aipt-store/src
printf 'body { color: black; }\n' > artifacts/aipt-store/src/index.css
git add .
git commit -qm 'baseline'
base=$(git rev-parse HEAD)

for i in $(seq 1 100); do printf '.major-%s { padding: %spx; }\n' "$i" "$i"; done >> artifacts/aipt-store/src/index.css
git add .
git commit -qm 'synthetic major redesign without evidence'
major_head=$(git rev-parse HEAD)

set +e
AIPT_DIFF_BASE="$base" AIPT_DIFF_HEAD="$major_head" node guard.mjs > /tmp/aipt-design-freeze-negative.log 2>&1
negative_rc=$?
set -e
if [ "$negative_rc" -eq 0 ]; then
  cat /tmp/aipt-design-freeze-negative.log
  echo 'AIPT-0010 self-test failed: major redesign unexpectedly passed without evidence.' >&2
  exit 1
fi

mkdir -p docs/decisions/design
cat > docs/decisions/design/AIPT-DESIGN-self-test.md <<'EOF'
# Synthetic CI design decision

AIPT-0010

Owner: @sysmoai
Decision: PROCEED
Evidence class: CRO

## Evidence
Synthetic CI evidence used only to verify enforcement behavior.

## Hypothesis
A valid decision record should permit the synthetic threshold-crossing diff.

## Scope
CI temporary repository only.

## Acceptance
The guard passes this test only when all required evidence fields exist.

## Rollback
Delete the temporary repository at test completion.
EOF

git add .
git commit -qm 'add valid synthetic decision record'
approved_head=$(git rev-parse HEAD)
AIPT_DIFF_BASE="$base" AIPT_DIFF_HEAD="$approved_head" node guard.mjs > /tmp/aipt-design-freeze-positive.log 2>&1

rm -f /tmp/aipt-design-freeze-negative.log /tmp/aipt-design-freeze-positive.log
echo 'AIPT-0010 design-freeze self-test PASS: blocked without evidence and allowed with valid evidence.'
