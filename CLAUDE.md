# CLAUDE.md - Coding Assistant Guidelines

## Build & Test Commands
- use bun instead of node and npm
- Install dependencies: `bun install`
- Start development server: `bun dev`
- Build project: `bun run build`
- Run single test: `npm test -- -t "test name"` or `jest -t "test name"`

## Code Style Guidelines
- Use javascript instead of typescript
- Prefer const over let, avoid var
- Use camelCase for variables/functions, PascalCase for classes/components
- Organize imports: built-in → external → internal → relative
- Handle all Promise rejections with try/catch or .catch()
- Prefer async/await over Promise chains
- Document complex functions with JSDoc comments
- Keep an eye on coupling. Coupled things should be in the same module.