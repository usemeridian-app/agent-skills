#!/usr/bin/env node
// @usemeridian/agent-skills — installer for the Meridian agent skills.
//
// Usage:
//   npx @usemeridian/agent-skills install            # install all skills to ~/.claude/skills/
//   npx @usemeridian/agent-skills install --target=PATH
//   npx @usemeridian/agent-skills install meridian-visa
//   npx @usemeridian/agent-skills list
//
// Targets every cross-vendor surface that consumes the SKILL.md format
// (Claude Code, Claude.ai, Cursor, Codex CLI, Goose). Default install
// path is ~/.claude/skills/; --target overrides it. The installer is a
// plain file copy — no daemon, no telemetry, no network calls.

import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(PACKAGE_ROOT, "skills");
const DEFAULT_TARGET = join(homedir(), ".claude", "skills");

const KNOWN_TARGETS = {
  claude: join(homedir(), ".claude", "skills"),
  cursor: join(homedir(), ".cursor", "skills"),
  codex: join(homedir(), ".codex", "skills"),
  goose: join(homedir(), ".goose", "skills")
};

async function listSkills() {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(SKILLS_DIR, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    skills.push({ name: entry.name, path: join(SKILLS_DIR, entry.name) });
  }
  return skills;
}

function parseArgs(argv) {
  const positional = [];
  const flags = { target: null, agent: null, help: false };
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg.startsWith("--target=")) flags.target = arg.slice("--target=".length);
    else if (arg.startsWith("--agent=")) flags.agent = arg.slice("--agent=".length);
    else positional.push(arg);
  }
  return { positional, flags };
}

function resolveTarget(flags) {
  if (flags.target) return resolve(flags.target);
  if (flags.agent) {
    const known = KNOWN_TARGETS[flags.agent.toLowerCase()];
    if (!known) {
      throw new Error(`unknown --agent '${flags.agent}'. supported: ${Object.keys(KNOWN_TARGETS).join(", ")}`);
    }
    return known;
  }
  return DEFAULT_TARGET;
}

function printHelp() {
  console.log(`@usemeridian/agent-skills

usage:
  npx @usemeridian/agent-skills install [skill]
  npx @usemeridian/agent-skills list

options:
  --target=PATH     install into PATH instead of ~/.claude/skills
  --agent=NAME      install into a known agent's skills dir (claude, cursor, codex, goose)
  --help, -h        show this message

examples:
  npx @usemeridian/agent-skills install
  npx @usemeridian/agent-skills install meridian-visa --agent=cursor
  npx @usemeridian/agent-skills install --target=./.skills
  npx @usemeridian/agent-skills list

after installing, point your agent's MCP client at https://usemeridian.app/mcp
or run \`npm install -g @usemeridian/cli\` to drive the same tools from the
terminal.
`);
}

async function cmdList() {
  const skills = await listSkills();
  console.log(`${skills.length} skill${skills.length === 1 ? "" : "s"} available:\n`);
  for (const skill of skills) {
    console.log(`  ${skill.name}`);
  }
  console.log();
}

async function cmdInstall({ positional, flags }) {
  const target = resolveTarget(flags);
  await mkdir(target, { recursive: true });

  const all = await listSkills();
  const requested = positional.length === 0 ? all : all.filter(s => positional.includes(s.name));

  if (requested.length === 0) {
    const known = all.map(s => s.name).join(", ");
    throw new Error(`no matching skills (requested: ${positional.join(", ")}). available: ${known}`);
  }

  for (const skill of requested) {
    const dest = join(target, skill.name);
    // Wipe the destination first so reinstalls drop files that were
    // removed in newer versions (e.g. a retired reference file). `cp`
    // alone MERGES into an existing directory, leaving stale content
    // that can contradict the new SKILL.md.
    await rm(dest, { recursive: true, force: true });
    await cp(skill.path, dest, { recursive: true });
    console.log(`installed ${skill.name} → ${dest}`);
  }

  console.log(`\ndone. restart your agent to pick up the new skill${requested.length === 1 ? "" : "s"}.`);
  console.log(`mcp endpoint: https://usemeridian.app/mcp`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional.shift() || (flags.help ? "help" : "install");

  if (flags.help || command === "help") return printHelp();
  if (command === "list") return cmdList();
  if (command === "install") return cmdInstall({ positional, flags });

  console.error(`unknown command: ${command}`);
  console.error(`run \`npx @usemeridian/agent-skills --help\` for usage`);
  process.exit(1);
}

main().catch(err => {
  console.error(`error: ${err.message}`);
  process.exit(1);
});
