#!/usr/bin/env node
/**
 * Copies committed hooks from scripts/git-hooks into .git/hooks.
 * Safe to run repeatedly (npm prepare).
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gitDir = join(root, ".git");
const srcDir = join(root, "scripts", "git-hooks");
const destDir = join(gitDir, "hooks");

if (!existsSync(gitDir)) {
	process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const name of ["pre-push"]) {
	const from = join(srcDir, name);
	const to = join(destDir, name);
	if (!existsSync(from)) continue;
	copyFileSync(from, to);
	chmodSync(to, 0o755);
	console.log(`installed git hook: ${name}`);
}
