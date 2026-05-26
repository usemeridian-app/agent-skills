# @usemeridian/agent-skills

Cross-vendor [agent skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) for [Meridian](https://usemeridian.app). Drops the Meridian visa-readiness loop into any agent that consumes the SKILL.md format — Claude Code, Claude.ai web, Cursor, Codex CLI, Goose.

## Install

```bash
npx -y @usemeridian/agent-skills install
```

Installs all bundled skills into `~/.claude/skills/`. The `-y` flag skips the npm install-confirmation prompt on first run; drop it if you want to confirm before npx fetches the package. Restart your agent — the skill activates the next time a relevant message lands (the skill's frontmatter `description` is what the agent matches on).

### Other agents

```bash
npx -y @usemeridian/agent-skills install --agent=cursor   # ~/.cursor/skills
npx -y @usemeridian/agent-skills install --agent=codex    # ~/.codex/skills
npx -y @usemeridian/agent-skills install --agent=goose    # ~/.goose/skills
```

### Custom path

```bash
npx -y @usemeridian/agent-skills install --target=./.skills
```

### Pick a skill

```bash
npx -y @usemeridian/agent-skills install meridian-visa
```

### Global install (optional)

```bash
npm install -g @usemeridian/agent-skills
agent-skills install
agent-skills list
```

## What's in the box

```bash
npx -y @usemeridian/agent-skills list
```

Today, one skill:

- **visa-readiness** — the Meridian visa loop. Look up corridor rules, file the application, fill trip details + documents, run a readiness check, dispatch Meridian Computer to fill the consulate's portal, book the appointment, record the outcome. Anonymous tools (requirements_lookup, requirements_evaluate, requirements_submit_feedback) work without login; user-scoped tools prompt for OAuth via Meridian on first call.

More skills land here as the surface grows.

## Pair with

- **MCP server** — `https://usemeridian.app/mcp` (Streamable HTTP, OAuth 2.0). Drop into Claude, ChatGPT, Cursor, or any MCP-aware client.
- **CLI** — `npm install -g @usemeridian/cli` for the same tools from your terminal.
- **API reference** — `https://usemeridian.app/docs` ([OpenAPI 3.1](https://usemeridian.app/openapi.yaml)).

## Why a skill?

The MCP server gives an assistant the tools. The skill tells it _when_ to use them and _in what order_. Same tools, much better answers, no every-time prompt engineering.

## Layout

```
skills/
└── meridian-visa/
    ├── SKILL.md            # frontmatter (name + description) + the loop
    └── reference/
        ├── checklist.md    # universal document checklist
        └── corridors.md    # corridor-specific notes
```

Each skill is a folder. The installer copies the folder into your agent's skills directory; no symlinks, no telemetry, no daemon. Source: <https://github.com/usemeridian-app/agent-skills>.

## License

MIT. See [LICENSE](./LICENSE).
