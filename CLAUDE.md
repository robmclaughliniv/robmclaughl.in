# CLAUDE.md - Guidelines for the robmclaughl.in Codebase

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint to check code quality

## Code Style
- **TypeScript**: Use strict typing (`strict: true`). Import types with `import type {}` syntax.
- **Formatting**: Follow existing patterns with consistent spacing and indentation.
- **Components**: Use functional components with named exports.
- **Imports**: Group by: 1) External libs 2) Internal components 3) Types & utils
- **Naming**: Use PascalCase for components, camelCase for variables/functions.
- **CSS**: Use Tailwind utility classes with the `cn()` utility for conditional classes.
- **Hooks**: Custom hooks in `/hooks` directory with `use` prefix.
- **Props**: Use TypeScript interfaces for component props with optional properties marked with `?`.
- **Error Handling**: Use try/catch blocks where appropriate; handle async errors properly.

## Architecture
- Project uses Next.js App Router with React Server Components
- UI components use shadcn/ui based on Radix UI primitives
- Main styling through Tailwind CSS

## Best Practices
- Maintain responsive design for all components
- Keep the lo-fi aesthetic consistent with the design inspiration
- Follow accessibility best practices