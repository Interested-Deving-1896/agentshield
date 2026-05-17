# AgentShield Next Release Draft

This release train moves AgentShield from local scan output toward an
enterprise routing surface: package-manager hardening evidence, policy-pack
promotion review, and fleet-level operator readback that downstream GitHub App,
Linear, and ECC Tools flows can consume directly.

## Highlights

- Added evidence-pack fleet `operatorReadback` output with ready/blocked status,
  deterministic review digest, owner counts, approval routes, blocking counts,
  and next-action guidance for promotion gates.
- Added `agentshield policy promote` to verify exported policy-pack manifests,
  reject tampered policy JSON by SHA-256 digest, and promote a selected pack
  into the active policy path with dry-run and JSON review modes.
- Added GitHub Action package-manager hardening outputs and job-summary
  evidence for registry credentials, lifecycle-script drift, and release-age
  gate drift.
- Added GitHub Action policy-promotion review outputs and job-summary evidence
  so CI can route owner approval, protected rollout, and runtime-smoke
  `reviewItems` from checksum-verified policy exports.

## Validation

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run lint`

## Upgrade Notes

- The GitHub Action bundle under `dist/` must be committed before tagging a release.
- The release workflow verifies that the pushed tag matches `package.json`, reruns the full gate, rebuilds `dist/`, and refuses to publish if generated action artifacts are out of sync.
- Recommended version bump for this train is still open until the final release
  audit confirms whether this is `1.4.1` or the next minor.
