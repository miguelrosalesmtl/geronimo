#!/usr/bin/env bash
# Run the suite, then ALWAYS submit the report — a failing test run must
# still be persisted, so this deliberately does not use `set -e` or `&&`
# between the two steps.
set -uo pipefail

mkdir -p /reports
export PLAYWRIGHT_JSON_OUTPUT_NAME=/reports/report.json

GREP_ARGS=()
if [ -n "${TEST_GREP:-}" ]; then
  GREP_ARGS=(--grep "$TEST_GREP")
fi

npx playwright test "${GREP_ARGS[@]}"
TEST_EXIT_CODE=$?

echo "Playwright exited with code $TEST_EXIT_CODE — submitting report..."

node dist/report/submit.js /reports/report.json \
  --trigger-type "${TRIGGER_TYPE:-manual}" \
  --environment "${TARGET_ENV:?TARGET_ENV required}" \
  --base-url "${BASE_URL:?BASE_URL required}"
SUBMIT_EXIT_CODE=$?

if [ "$SUBMIT_EXIT_CODE" -ne 0 ]; then
  echo "WARNING: report submission failed (exit $SUBMIT_EXIT_CODE) — NOT persisted to reports-backend" >&2
  exit $(( TEST_EXIT_CODE != 0 ? TEST_EXIT_CODE : SUBMIT_EXIT_CODE ))
fi

exit "$TEST_EXIT_CODE"
