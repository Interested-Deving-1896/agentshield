import { describe, expect, it } from "vitest";
import { packageManagerRules } from "../../src/rules/package-manager.js";
import type { ConfigFile } from "../../src/types.js";

function makePackageManagerConfig(path: string, content: string): ConfigFile {
  return { path, type: "package-manager-config", content };
}

function runPackageManagerRules(file: ConfigFile) {
  return packageManagerRules.flatMap((rule) => rule.check(file, [file]));
}

describe("packageManagerRules", () => {
  it("flags plaintext npm registry tokens in .npmrc", () => {
    const file = makePackageManagerConfig(
      ".npmrc",
      "//registry.npmjs.org/:_authToken=npm_123456789012345678901234567890123456",
    );

    const findings = runPackageManagerRules(file);

    expect(findings.some((finding) => finding.id.includes("registry-credential"))).toBe(true);
    expect(findings.find((finding) => finding.id.includes("registry-credential"))?.severity).toBe("critical");
    expect(findings.find((finding) => finding.id.includes("registry-credential"))?.evidence).toContain("npm_12");
    expect(findings.find((finding) => finding.id.includes("registry-credential"))?.evidence).not.toContain(
      "789012345678901234567890",
    );
  });

  it("allows npm registry tokens supplied by environment variables", () => {
    const file = makePackageManagerConfig(
      ".npmrc",
      [
        "//registry.npmjs.org/:_authToken=${NPM_TOKEN}",
        "ignore-scripts=true",
        "min-release-age=1d",
      ].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(findings.some((finding) => finding.id.includes("registry-credential"))).toBe(false);
  });

  it("flags npm configs that leave lifecycle scripts enabled and age gates weak", () => {
    const file = makePackageManagerConfig(
      ".npmrc",
      ["ignore-scripts=false", "min-release-age=12h"].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(
      findings.some((finding) => finding.id === "package-manager-lifecycle-scripts-enabled")
    ).toBe(true);
    expect(
      findings.some((finding) => finding.id === "package-manager-release-age-gate-too-low")
    ).toBe(true);
  });

  it("flags npm configs that omit ignore-scripts and release-age gates", () => {
    const file = makePackageManagerConfig(".npmrc", "registry=https://registry.npmjs.org/");

    const findings = runPackageManagerRules(file);

    expect(
      findings.some((finding) => finding.id === "package-manager-lifecycle-scripts-not-disabled")
    ).toBe(true);
    expect(
      findings.some((finding) => finding.id === "package-manager-release-age-gate-missing")
    ).toBe(true);
  });

  it("flags unsafe Yarn lifecycle and age-gate settings", () => {
    const file = makePackageManagerConfig(
      ".yarnrc.yml",
      ["enableScripts: true", "npmMinimalAgeGate: \"12h\""].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(
      findings.some((finding) => finding.id === "package-manager-yarn-lifecycle-scripts-enabled")
    ).toBe(true);
    expect(
      findings.some((finding) => finding.id === "package-manager-yarn-release-age-gate-too-low")
    ).toBe(true);
  });

  it("accepts hardened Yarn config with env-sourced auth", () => {
    const file = makePackageManagerConfig(
      ".yarnrc.yml",
      ["enableScripts: false", "npmMinimalAgeGate: \"3d\"", "npmAuthToken: ${NPM_TOKEN}"].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(findings).toHaveLength(0);
  });

  it("flags pnpm configs that bypass dependency build review", () => {
    const file = makePackageManagerConfig(
      "pnpm-workspace.yaml",
      [
        "dangerouslyAllowAllBuilds: true",
        "strictDepBuilds: false",
        "minimumReleaseAge: 60",
      ].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(
      findings.some((finding) => finding.id === "package-manager-pnpm-dangerously-allow-all-builds")
    ).toBe(true);
    expect(
      findings.some((finding) => finding.id === "package-manager-pnpm-strict-dep-builds-disabled")
    ).toBe(true);
    expect(
      findings.some((finding) => finding.id === "package-manager-pnpm-release-age-gate-too-low")
    ).toBe(true);
  });

  it("accepts hardened pnpm workspace config", () => {
    const file = makePackageManagerConfig(
      "pnpm-workspace.yaml",
      ["strictDepBuilds: true", "minimumReleaseAge: 1440"].join("\n"),
    );

    const findings = runPackageManagerRules(file);

    expect(findings).toHaveLength(0);
  });
});
