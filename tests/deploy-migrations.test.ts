import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const bash =
  process.platform === "win32"
    ? "C:/Program Files/Git/bin/bash.exe"
    : "/bin/bash";
const source = readFileSync("scripts/deploy-aapanel.sh", "utf8").replaceAll(
  "\r\n",
  "\n",
);

describe.skipIf(!existsSync(bash))("deploy migration gate", () => {
  it.each([0, 1])(
    "runs actual build/deploy shell flow with migration exit %i",
    (code) => {
      // Execute the real script with only host-specific operations replaced by shell doubles.
      const build = source.split("<<'BUILD'\n")[1].split("\nBUILD")[0];
      const finish = source.split("\nBUILD\n")[1];
      const program = `set -euo pipefail
      node() { case "$*" in *cli.mjs*migrate*) echo MIGRATE; return ${code};; *) echo BUILD;; esac; }
      npm() { echo BUILD; }
      git() { case "$*" in 'remote get-url origin') echo https://github.com/marcusrox/ecovit;; 'status --porcelain') :;; 'rev-parse FETCH_HEAD'|'rev-parse HEAD') echo revision;; 'branch --show-current') echo main;; esac; }
      pm2_command() { echo RESTART; }
      curl() { printf '{"ok":true}'; }
      runuser() { cat >/dev/null; echo RECEIPT; }
      cd() { :; }
      test() { return 0; }
      app_dir=isolated; revision=revision; run_key=1-1; npm_cache=isolated
      bash() { command bash -se -- "$@"; }
      export -f node npm git cd test
      ( ${build} )
      ${finish}`;
      const result = spawnSync(
        bash,
        ["-c", program, "--", "isolated", "revision", "/tmp"],
        { encoding: "utf8" },
      );
      const output = result.stdout + result.stderr;
      expect(output).toContain("MIGRATE");
      expect(output.indexOf("BUILD")).toBeLessThan(output.indexOf("MIGRATE"));
      if (code === 0) {
        expect(result.status, output).toBe(0);
        expect(output.indexOf("MIGRATE")).toBeLessThan(
          output.indexOf("RESTART"),
        );
        expect(output).toContain("RECEIPT");
        expect(output).toContain("ECOVIT_DEPLOY_OK=");
      } else {
        expect(result.status, output).not.toBe(0);
        expect(output).not.toContain("RESTART");
        expect(output).not.toContain("RECEIPT");
        expect(output).not.toContain("ECOVIT_DEPLOY_OK=");
      }
    },
  );

  it("keeps migration inside the deployment lock and requires this workflow attempt", () => {
    expect(source.indexOf("flock -n 9")).toBeLessThan(
      source.indexOf("cli.mjs migrate"),
    );
    const workflow = readFileSync(".github/workflows/aapanel.yml", "utf8");
    expect(workflow).toContain(
      '"$receipt" == "$GITHUB_SHA $run_key $index_hash"',
    );
    expect(workflow).toContain('"$health" == \'{"ok":true}\'');
    expect(workflow).toContain("exit 1");
    expect(source).not.toMatch(/(?:source|\.)\s+\.env/);
  });
});
