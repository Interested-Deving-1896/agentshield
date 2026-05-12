import type { PolicyEvaluation } from "./policy/index.js";

export type ActionPolicyStatus =
  | "not-run"
  | "compliant"
  | "non-compliant"
  | "error";

export function statusForPolicyEvaluation(
  evaluation: PolicyEvaluation
): ActionPolicyStatus {
  return evaluation.passed ? "compliant" : "non-compliant";
}

export function renderPolicyJobSummary(evaluation: PolicyEvaluation): string {
  const status = statusForPolicyEvaluation(evaluation);
  const lines = [
    "",
    "",
    "## AgentShield Organization Policy",
    "",
    `- Status: ${status}`,
    `- Policy: ${evaluation.policyName}`,
    `- Score: ${evaluation.score} (minimum: ${evaluation.minScore})`,
    `- Violations: ${evaluation.violations.length}`,
  ];

  if (evaluation.policyPack) {
    lines.push(`- Policy pack: ${evaluation.policyPack}`);
  }

  if (evaluation.owners && evaluation.owners.length > 0) {
    lines.push(`- Owners: ${evaluation.owners.join(", ")}`);
  }

  if (evaluation.exceptionsApplied && evaluation.exceptionsApplied.length > 0) {
    lines.push(`- Exceptions applied: ${evaluation.exceptionsApplied.length}`);
  }

  if (evaluation.violations.length > 0) {
    lines.push("", "### Policy Violations", "");
    for (const violation of evaluation.violations) {
      lines.push(
        `- ${violation.rule} (${violation.severity}): ${violation.description}`
      );
    }
  }

  if (evaluation.exceptionsApplied && evaluation.exceptionsApplied.length > 0) {
    lines.push("", "### Exceptions Applied", "");
    for (const exception of evaluation.exceptionsApplied) {
      lines.push(
        `- ${exception.id} (${exception.rule}) owner=${exception.owner} expires=${exception.expiresAt}`
      );
    }
  }

  lines.push("");
  return lines.join("\n");
}
