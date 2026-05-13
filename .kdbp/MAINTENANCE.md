# Maintenance Checklist

Run quarterly or before a major release.

- [ ] Review `.kdbp/VALUES.md` against actual product behavior.
- [ ] Review `.kdbp/DECISIONS.md` entries with `Status=revisit`.
- [ ] Audit `.kdbp/PENDING.md` for deferred items older than 60 days.
- [ ] Verify consumer-credit rules and benchmark sources are current.
- [ ] Review schema versions for every document-specific agent.
- [ ] Review AI cost, latency, token usage, and failed-run rates.
- [ ] Verify document retention and deletion behavior.
- [ ] Update dependency and security posture.
- [ ] Review `.kdbp/STRUCTURE.md` when new folders become common.
- [ ] Run `/gabe-teach init-wells` or refresh wells after major architecture changes.
