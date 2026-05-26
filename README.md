# @usemeridian/agent-skills

Cross-vendor agent skills for [Meridian](https://usemeridian.app). Drop the Meridian visa-readiness loop into any agent that consumes the [SKILL.md](https://www.anthropic.com/news/agent-skills) format — Claude Code, Claude.ai web, Cursor, Codex CLI, Goose.

## Install

```bash
npx @usemeridian/agent-skills install
```

Installs all bundled skills into `~/.claude/skills/`. Restart your agent and the skill activates the next time a relevant message lands (the skill's frontmatter `description` is what the agent matches on).

### Other agents

```bash
npx @usemeridian/agent-skills install --agent=cursor
npx @usemeridian/agent-skills install --agent=codex
npx @usemeridian/agent-skills install --agent=goose
```

### Custom path

```bash
npx @usemeridian/agent-skills install --target=./.skills
```

### Pick a skill

```bash
npx @usemeridian/agent-skills install meridian-visa
```

## What's in the box

```bash
npx @usemeridian/agent-skills list
```

Today, one skill:

- **meridian-visa** — the visa-readiness loop. Look up requirements, prep the vault, file the case, dispatch Meridian Computer to fill the consulate's portal. Anonymous tools work without login; user-scoped tools prompt for OAuth via Meridian on first call.

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
