# Manual Test Cases

This folder is the intake shelf for real or realistic documents we want to run
through nmkgn.

Think of each test case as an evidence envelope:

- `uploads/` is the envelope with the raw documents. It is ignored by git.
- `catalog.local.yml` is the local clipboard that says what is inside each
  envelope. It is ignored by git.
- `expected/` is the answer key we can commit when it is sanitized.
- `runs/` is the notebook of actual API/UI outputs from a test session. It is
  ignored by git.
- `baselines.local/` is the local-only replay shelf for manual baseline agent
  outputs. It is ignored by git.

## Folder Map

```text
manual-test-cases/
  README.md
  catalog.example.yml
  catalog.local.yml              # local, ignored
  uploads/                       # raw documents, ignored
    cc-text-001-clean-contract/
      contrato.pdf
      simulacion.txt
  expected/                      # sanitized expectations, tracked when useful
    cc-text-001-clean-contract.example.yml
  baselines.local/               # local replay baselines, ignored
    cc-text-001-clean-contract/
      baseline.json
  runs/                          # API transcripts/screenshots, ignored
    cc-text-001-clean-contract/
      2026-05-18T15-40-00/
```

## How To Add A Case

1. Create a folder under `uploads/`:

   ```bash
   mkdir -p manual-test-cases/uploads/cc-text-001-clean-contract
   ```

2. Put the original documents there. Keep real client data out of git.

3. Copy the catalog template:

   ```bash
   cp manual-test-cases/catalog.example.yml manual-test-cases/catalog.local.yml
   ```

4. Add a catalog entry pointing to the files you placed under `uploads/`.

5. Run the case through the app and save any API transcripts or screenshots
   under `runs/<case-id>/<timestamp>/`.

6. Once we know the correct behavior, add a sanitized expectation file under
   `expected/`.

## Local Runner

Use the catalog runner to exercise the current backend pipeline against local
private fixtures:

```bash
uv run python manual-test-cases/run_catalog.py --mode in-process
```

Useful focused runs:

```bash
uv run python manual-test-cases/run_catalog.py \
  --case-id base-degradation-scotiabank-2022

uv run python manual-test-cases/run_catalog.py \
  --case-id base-degradation-edwards-2022
```

The default `in-process` mode creates an isolated SQLite database and upload
store inside the ignored run folder. It does not require Docker or a running
API server.

To run against a live local API instead:

```bash
uv run python manual-test-cases/run_catalog.py \
  --mode http \
  --api-base-url http://127.0.0.1:18080
```

Each run writes:

- `summary.json`: stage counts, blocker summary, readiness, and run directory.
- `api-transcript.json`: sanitized request/response transcript.
- `documents.json`, `facts.json`, `fact-readiness.json`,
  `receptionist-gaps.json`, and `analysis-readiness.json`: sanitized API
  snapshots for later comparison.

By default, extracted text, snippets, raw payloads, values, filenames, checksums,
passwords, and tokens are redacted from run artifacts. If a one-off local debug
session needs raw values, pass `--include-sensitive-output`; the output remains
ignored by git, but password-like keys are still redacted.

## Manual Baseline Agent

The optional baseline harness runs after the app snapshots are written:

```bash
uv run python manual-test-cases/run_catalog.py \
  --case-id base-degradation-scotiabank-2022 \
  --baseline-agent
```

The default provider is `local-replay`. It reads:

```text
manual-test-cases/baselines.local/<case-id>/baseline.json
```

and writes ignored artifacts under the run folder:

- `baseline/output.json`: structured baseline report plus media metadata.
- `baseline/gaps.json`: generated comparison gaps.
- `baseline/model-call-plan.json`: suggested future model calls.
- `baseline/report.md`: short human-readable baseline summary.
- `baseline/error.json`: structured provider/setup/validation failure, when any.

External Anthropic calls are opt-in twice: configure the provider/model and pass
`--allow-external-llm`.

```bash
ANTHROPIC_API_KEY=... \
uv run python manual-test-cases/run_catalog.py \
  --case-id base-degradation-scotiabank-2022 \
  --baseline-agent \
  --baseline-provider anthropic \
  --baseline-model claude-sonnet-4-5 \
  --allow-external-llm
```

The baseline harness is not a production analysis run. It may inspect local raw
fixtures and local `info.json` passwords only to create a reference packet for
comparison against deterministic facts, receptionist gaps, and readiness.

## Suggested First Batch

- `cc-text-001-clean-contract`: text-bearing primary document with all required
  high-impact fields present.
- `cc-text-002-missing-required`: missing CAE or total cost so deterministic
  extraction emits warning facts.
- `cc-text-003-ambiguous-values`: two different CAE, payment count, or total
  cost values so ambiguity is visible.
- `cc-receptionist-001-deterministic-miss`: a document where the receptionist
  should identify a supported field the deterministic extractor misses.
- `cc-receptionist-002-value-conflict`: deterministic extraction and
  receptionist observation disagree on a high-impact value.
- `cc-pdf-001-text-bearing`: a PDF with extractable text.
- `cc-pdf-002-scanned`: scanned or image-only PDF; should become `needs_ocr`.
- `cc-pdf-003-too-many-pages`: PDF longer than
  `NMKGN_RECEPTIONIST_MAX_PAGES`; should create a partial-document gap.
- `cc-image-001-photo`: image upload; currently should be stored and marked as
  OCR-needed unless text extraction later expands.
- `cc-failure-001-malformed-pdf`: malformed PDF; upload should persist but
  extraction should fail safely.

## Stage Checklist

For each case, we want to observe the same pipeline stages:

1. Case creation: case stage, institution, amount, and term are correct.
2. Upload: file type, role, checksum, byte size, and storage state are correct.
3. Text extraction: `extraction_status` and text segments match the document.
4. Deterministic facts: expected fact keys, values, warnings, and source anchors
   are produced.
5. Receptionist run: run status, media kind, page counts, observations, and
   gaps are correct.
6. Gap resolution: accepted/rejected/deferred gaps mutate facts only when the
   rules allow it.
7. Readiness: fact readiness and composite analysis readiness match the
   expected blockers.
8. Later analysis: once calculations/references/analysis exist, findings should
   be compared to the same expectation file.

## Privacy Rule

Raw documents belong under `uploads/` and stay ignored. If a fixture is safe to
commit, make it synthetic and put it in a future `tests/fixtures/` automation
folder instead of this manual intake area.
