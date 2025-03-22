# CLAUDE.md - Project Guidelines

## Build/Lint/Test Commands
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run check` - Run typechecking
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Run Prettier check and ESLint
- `pnpm run type-check` - Run Wrangler type checking
- `pnpm run db:generate` - Generate Drizzle migrations
- `pnpm run db:push` - Push schema changes to DB

## Code Style Guidelines
- **Tabs**: Use tabs for indentation (not spaces)
- **Quotes**: Single quotes for strings
- **Import Order**: Group by $lib, external packages, then relative paths
- **TypeScript**: Use strict type checking, avoid `any` types
- **Svelte Components**: Use .svelte extension with script lang="ts"
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Error Handling**: Use try/catch with appropriate error messages
- **Database**: Use Drizzle ORM with strongly typed schemas
- **i18n**: All user-facing strings must use paraglide messages
- **UI**: Use Tailwind CSS for styling