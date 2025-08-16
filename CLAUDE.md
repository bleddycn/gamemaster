# GameMaster Project

## Project Structure

This is a pnpm monorepo with the following structure:

```
gamemaster/
├── apps/
│   ├── api/          # Fastify TypeScript API with Prisma
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types and schemas
├── package.json      # Root workspace configuration
├── pnpm-workspace.yaml
└── CLAUDE.md         # This file
```

## Workspace Configuration

### Root package.json
- Workspaces configured for `apps/*` and `packages/*`
- Scripts:
  - `pnpm dev` - Run all dev servers in parallel
  - `pnpm build` - Build all packages

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - prisma
```

## Apps

### apps/api - Fastify TypeScript API

**Package Configuration (`apps/api/package.json`):**
- Name: `@gm/api`
- Type: ES Module (`"type": "module"`)
- Scripts:
  - `dev`: Uses tsx watch for hot reloading
  - `build`: TypeScript compilation
  - `start`: Production server
  - `prisma:generate`: Generate Prisma client
  - `prisma:migrate`: Run database migrations
  - `prisma:studio`: Launch Prisma Studio
- Prisma seed configuration: `"prisma": { "seed": "tsx prisma/seed.ts" }`

**Dependencies:**
- `@gm/shared`: Workspace dependency for shared types
- `fastify`: Core web framework
- `@fastify/cors`: CORS middleware
- `@fastify/helmet`: Security headers
- `@prisma/client`: Database ORM client
- `zod`: Runtime validation
- `dotenv`: Environment variables
- `prisma`: Database toolkit (dev dependency)

**Database Configuration (`apps/api/prisma/schema.prisma`):**
- Provider: SQL Server (Azure compatible)
- Shadow database support for migrations
- Models: Club, User, ClubMember, Competition, Round, Team, Fixture, CompetitionEntry, Pick
- String-based enums (SQL Server compatible)
- JSON fields stored as NVarChar(Max)

**Environment Setup:**
- `.env.example`: Template with DATABASE_URL and SHADOW_DATABASE_URL
- `.env`: Contains actual connection strings (gitignored)
- `.gitignore`: Excludes `.env` file

**API Endpoints (`apps/api/src/index.ts`):**
- `GET /healthz` - Health check endpoint
- `GET /dbz` - Database connection check (counts clubs)
- `GET /version` - API version info
- `GET /me` - Placeholder auth endpoint (returns mock user)
- `GET /clubs` - List all clubs (id, name, slug)
- `GET /clubs/by-slug/:slug` - Get a club by slug (for frontend detail page)
- `GET /clubs/:clubId/competitions` - List competitions for a club (optional ?status filter)
- `POST /clubs` - Create new club with validation
- `POST /clubs/:clubId/competitions` - Create competition with Zod validation (status: DRAFT)

**Seed Data (`apps/api/prisma/seed.ts`):**
- Upserts two GAA clubs: Cavan GAA and Monaghan GAA

### apps/web - Next.js Frontend

**Package Configuration (`apps/web/package.json`):**
- Name: `web`
- Dependencies: Next.js ^15.4.6, React ^18.3.1
- Scripts: `dev`, `build`, `start`, `lint`

**Configuration:**
- Next.js with TypeScript
- Tailwind CSS v4 (using `@tailwindcss/postcss`)
- PostCSS configuration updated for Tailwind v4
- Environment: `.env.local` with `NEXT_PUBLIC_API_URL`

**Pages:**
- `/` - Default Next.js homepage
- `/clubs` - Server-side rendered clubs list from API
- `/clubs/[slug]` - Dynamic club detail page with competitions list and creation form

**Components (`apps/web/src/components/`):**
- `CreateCompetitionForm.tsx` - Client-side form for creating competitions with validation

## Packages

### packages/shared - Shared Types and Schemas

**Package Configuration (`packages/shared/package.json`):**
- Name: `@gm/shared`
- Type: ES Module
- Exports both CommonJS and ES modules
- Build script for TypeScript compilation

**Files:**
- `src/schemas.ts`: Zod schemas and enums (single source of truth)
  - `UserRoleEnum`: SITE_ADMIN, CLUB_ADMIN, PLAYER
  - `CompetitionStatusEnum`: DRAFT, OPEN, RUNNING, FINISHED
  - `CreateCompetitionSchema`: Competition creation validation
  - `CreateClubSchema`: Club creation validation with slug regex
- `src/types.ts`: TypeScript interfaces
  - `Club`: Basic club structure
  - `Competition`: Competition with status from schema
  - `UserRole`: Re-exported from schemas
- `src/index.ts`: Barrel exports

**Design Decisions:**
- Zod enums serve as single source of truth for types
- Types are inferred from Zod schemas to avoid duplication
- All shared types/schemas exported from single package
- String-based validation for SQL Server compatibility

## Development Workflow

1. **Install dependencies:** Run `pnpm install` at root
2. **Database setup:** Configure `.env` with DATABASE_URL and SHADOW_DATABASE_URL
3. **Generate Prisma client:** `pnpm --filter @gm/api run prisma:generate`
4. **Run migrations:** `pnpm --filter @gm/api run prisma:migrate --name init`
5. **Seed database:** Prisma will automatically run seed after migration
6. **Start dev servers:** Run `pnpm dev` to start all services in parallel
   - Alternative: Run individually with `pnpm --filter @gm/api dev` and `pnpm --filter web dev`
7. **API runs on:** http://localhost:4000
8. **Web runs on:** http://localhost:3000

## Running the Application

**Start everything together:**
```bash
pnpm dev  # Runs both API and web in parallel
```

**Start services individually:**
```bash
# API only
pnpm --filter @gm/api dev

# Web only  
pnpm --filter web dev
```

**Available routes:**
- http://localhost:3000 - Homepage
- http://localhost:3000/clubs - List of all clubs
- http://localhost:3000/clubs/cavan-gaa - Cavan GAA club page with competitions
- http://localhost:3000/clubs/monaghan-gaa - Monaghan GAA club page with competitions

## Database Schema

**Core Models:**
- **Club**: Organizations with name, slug, optional branding JSON
- **User**: Users with email, name, role (SITE_ADMIN/CLUB_ADMIN/PLAYER)
- **ClubMember**: Many-to-many relationship between users and clubs
- **Competition**: Club competitions with entry fees, status tracking
- **Round**: Competition rounds with deadlines and status
- **Team**: Sports teams with external references
- **Fixture**: Matches between teams with results
- **CompetitionEntry**: User entries into competitions
- **Pick**: User predictions for fixtures

**Key Features:**
- CUID-based IDs for all records
- Audit trails with createdAt timestamps
- Flexible JSON storage for rules and branding
- String-based enums for SQL Server compatibility
- Proper foreign key relationships with NoAction delete behavior

## Important Notes

- All Fastify plugins use official scoped packages (`@fastify/*`)
- Database uses SQL Server (Azure SQL compatible)
- Prisma configured with shadow database for safe migrations
- String literals used for enum-like fields (SQL Server limitation)
- Environment files excluded from git for security
- TypeScript strict mode enabled across all packages
- Using ES modules throughout the project
- Single pnpm-lock.yaml at root (no nested lockfiles)