import { describe, expect, it } from "vitest";
import {
  renderPolicyJobSummary,
  statusForPolicyEvaluation,
} from "../src/action-policy.js";
import type { PolicyEvaluation } from "../src/policy/index.js";

function makeEvaluation(
  overrides: Partial<PolicyEvaluation> = {}
): PolicyEvaluation {
  return {
    policyName: "Enterprise Policy",
    policyPack: "enterprise",
    owners: ["security@example.com"],
    passed: true,
    violations: [],
    exceptionsApplied: [],
    score: 88,
    minScore: 75,
    ...overrides,
  };
}

describe("action policy helpers", () => {
  it("maps a passing policy evaluation to compliant", () => {
    expect(statusForPolicyEvaluation(makeEvaluation())).toBe("compliant");
  });

  it("maps a failing policy evaluation to non-compliant", () => {
    expect(
      statusForPolicyEvaluation(makeEvaluation({
        passed: false,
        violations: [
          {
            rule: "min_score",
            severity: "high",
            description: "Score is too low.",
            expected: "Score >= 90",
            actual: "Score = 70",
          },
        ],
      }))
    ).toBe("non-compliant");
  });

  it("renders policy results for the GitHub job summary", () => {
    const summary = renderPolicyJobSummary(makeEvaluation({
      passed: false,
      exceptionsApplied: [
        {
          id: "AS-EX-001",
          rule: "required_hooks",
          owner: "security@example.com",
          reason: "Migration window",
          expiresAt: "2026-06-30T23:59:59.000Z",
          violation: "Missing hook",
        },
      ],
      violations: [
        {
          rule: "min_score",
          severity: "high",
          description: "Score is too low.",
          expected: "Score >= 90",
          actual: "Score = 70",
        },
      ],
    }));

    expect(summary).toContain("## AgentShield Organization Policy");
    expect(summary).toContain("- Status: non-compliant");
    expect(summary).toContain("- Policy pack: enterprise");
    expect(summary).toContain("- Owners: security@example.com");
    expect(summary).toContain("### Policy Violations");
    expect(summary).toContain("min_score (high): Score is too low.");
    expect(summary).toContain("### Exceptions Applied");
    expect(summary).toContain("AS-EX-001");
  });
});
