<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Проектные правила

## Дизайн-система — единственный источник стилей

- Весь UI приложений (apps/web, apps/admin) строится ТОЛЬКО на компонентах и токенах `@sto/ui` (packages/ui).
- Запрещены локальные магические значения в разметке приложений: цвета (`bg-[#...]`, `text-[#...]`), размеры шрифтов (`text-[13px]`), тени, радиусы. Всё — утилитами из токенов ДС (`bg-panel`, `text-content-muted`, `rounded-lg`) или пропсами компонентов ДС.
- Исключения — композиция layout-классов (grid/flex/gap/padding внутри виджета) и `@source`-подключение ДС в globals.css.
- **Если чего-то не хватает в ДС — расширяй ДС** (новый токен, вариант, компонент в packages/ui + сторя), а не пиши костыль в приложении.
- Нестандартное значение в приложении = сигнал, что в ДС пропущена сущность. Проверяю при каждом ревью своего кода.
- Контентная область сайта: 1200px (`Container size="site"` = 1200 контента + 2×32 гаттера). Дизайн-макеты — 1440. Не задавать локальные max-w для секций.
- После изменений в ДС — гонять typecheck ui + web и смотреть сторю затронутого компонента в Storybook.
