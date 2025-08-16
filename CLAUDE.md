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
- Models: Club, User, ClubMember, GameTemplate, Competition, Round, Team, Fixture, CompetitionEntry, Pick
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
- `GET /__routes` - Route introspection for debugging
- `GET /me` - Placeholder auth endpoint (returns mock user)
- `GET /clubs` - List all clubs (id, name, slug)
- `POST /clubs` - Create new club with validation
- `GET /clubs/by-slug/:slug` - Get a club by slug (for frontend detail page)
- `GET /clubs/:clubId/competitions` - List competitions for a club (optional ?status filter)
- `POST /clubs/:clubId/competitions` - Create competition with Zod validation (status: DRAFT)
- `POST /clubs/:clubId/activate-template/:templateId` - Activate template into competition
- `GET /templates` - List templates with filters (status, upcoming)
- `POST /templates` - Create game templates (Platform Admin)
- `GET /competitions/:id` - Get competition details with rounds/fixtures
- `POST /competitions/:id/open` - Open competition for entries (DRAFT → OPEN)
- `POST /competitions/:id/entries` - Join competition (creates CompetitionEntry)
- `POST /picks` - Submit fixture picks (temporary email-based auth)

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
- `/clubs/[slug]` - Dynamic club detail page with template activation
- `/admin/templates` - Platform admin interface for template management
- `/competitions/[id]` - Competition detail page with fixture picking
- `/debug/competitions` - Development utility for viewing all competitions

**Components (`apps/web/src/components/`):**
- `CreateCompetitionForm.tsx` - Client-side form for creating competitions with validation
- `ActivateTemplateForClub.tsx` - Template activation interface for clubs
- `FixturePicker.tsx` - Interactive fixture picking with radio buttons
- `JoinCompetitionInline.tsx` - Player join form for competitions
- `ui/Card.tsx` - Reusable card components (`Card`, `CardHeader`)

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
  - `CreateGameTemplateSchema`: Game template creation with activation windows
  - `ActivateTemplateSchema`: Template activation validation (entry fee, currency)
  - `JoinCompetitionSchema`: Player join validation (email, name)
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
4. **Run migrations:** `pnpm --filter @gm/api run prisma:migrate dev --name <migration-name>`
   - Note: If Prisma migrate commands timeout, migrations can be applied manually
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
- http://localhost:3000/clubs/cavan-gaa - Cavan GAA club page with template activation
- http://localhost:3000/clubs/monaghan-gaa - Monaghan GAA club page with template activation
- http://localhost:3000/admin/templates - Platform admin template management
- http://localhost:3000/competitions/[id] - Competition detail with fixture picking
- http://localhost:3000/debug/competitions - Development view of all competitions

## Database Schema

**Core Models:**
- **Club**: Organizations with name, slug, optional branding JSON
- **User**: Users with email, name, role (SITE_ADMIN/CLUB_ADMIN/PLAYER)
- **ClubMember**: Many-to-many relationship between users and clubs
- **GameTemplate**: Reusable game templates with activation windows and rules
  - gameType: Type of game (e.g., "LMS" for Last Man Standing)
  - status: DRAFT | PUBLISHED | ARCHIVED
  - Activation and join windows for time-based availability
  - Links to competitions created from template
- **Competition**: Club competitions with entry fees, status tracking
  - Optional templateId linking to GameTemplate
  - Inherits rules and configuration from template
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

## Recent Updates & Features

### Template Management System
- **Admin Templates Page** (`/admin/templates`): Platform admin interface for creating and managing game templates
  - Template creation form with validation
  - Template listing with status and activation windows
  - Real-time template availability checking

### Template Activation & Competition Lifecycle
- **Template Activation**: Clubs can activate published templates into competitions
  - API endpoint: `POST /clubs/:clubId/activate-template/:templateId`
  - Validation of activation windows and template status
  - Automatic competition creation with template inheritance
- **Competition Opening**: Club admins can open competitions (DRAFT → OPEN)
  - API endpoint: `POST /competitions/:id/open`
  - Status validation and transition controls

### User Join & Competition Entry System
- **Join Competition**: Players can join open competitions
  - API endpoint: `POST /competitions/:id/entries`
  - Validation of join windows and competition status
  - Automatic user creation and club membership management
  - Temporary email-based authentication system

### Competition Detail Pages & Fixture Picking
- **Competition Detail Page** (`/competitions/[id]`): Comprehensive competition view
  - Competition information display with status badges
  - Rounds and fixtures visualization
  - Integration with fixture picking system
- **Fixture Picking System**: Interactive fixture selection interface
  - `FixturePicker` component with radio button selections
  - Bulk pick submission with validation
  - Pick deadline enforcement
  - API endpoint: `POST /picks` for pick submissions

### Enhanced API Endpoints
Additional endpoints added to support full competition lifecycle:

**Template Management:**
- `POST /templates` - Create game templates (Platform Admin)
- `GET /templates` - List templates with filters (status, upcoming)
- `POST /clubs/:clubId/activate-template/:templateId` - Activate template into competition

**Competition Management:**
- `POST /competitions/:id/open` - Open competition for entries
- `GET /competitions/:id` - Get competition details with rounds/fixtures
- `POST /competitions/:id/entries` - Join competition

**Picks & Fixtures:**
- `POST /picks` - Submit fixture picks

### Testing Infrastructure
- **Playwright E2E Testing**: Comprehensive end-to-end test suite
  - Template activation flow testing
  - Competition detail page testing
  - Database setup and teardown
  - API error response validation
  - UI component testing

### Schema & Data Model Updates
- **JoinCompetitionSchema**: Validation for player join requests
- **Enhanced Competition Model**: Support for template inheritance
- **Pick System**: User predictions linked to fixtures and rounds
- **Database Field Corrections**: Fixed field mapping issues between API and schema

### UI Components & Styling
- **Card Components**: Reusable UI components (`Card`, `CardHeader`)
- **Site Header**: Navigation with links to clubs and admin templates
- **Status Badges**: Color-coded competition status display
- **Responsive Design**: Mobile-friendly layouts with Tailwind CSS

### Bug Fixes & Improvements
- **API 500 Error Resolution**: Fixed Prisma query field mapping issues
  - Corrected `deadlineAt` → `pickDeadlineAt` field references
  - Fixed `homeTeam`/`awayTeam` → `homeTeamId`/`awayTeamId` mapping
  - Added robust error handling and result parsing
- **Frontend Error Handling**: Comprehensive error pages and loading states
- **Validation Layer**: End-to-end validation using Zod schemas

### Development Tools & Debugging
- **Debug Pages**: Development utilities for viewing competition data
- **API Route Introspection**: Route debugging capabilities
- **Console Logging**: Enhanced logging for troubleshooting
- **Development Workflow**: Optimized pnpm workspace commands

## Important Notes

- All Fastify plugins use official scoped packages (`@fastify/*`)
- Database uses SQL Server (Azure SQL compatible)
- Prisma configured with shadow database for safe migrations
- String literals used for enum-like fields (SQL Server limitation)
- Environment files excluded from git for security
- TypeScript strict mode enabled across all packages
- Using ES modules throughout the project
- Single pnpm-lock.yaml at root (no nested lockfiles)
- **Current Authentication**: Temporary email-based system (to be replaced with proper auth)
- **Team Data**: Currently using placeholder team names (Team {ID}) - requires Team table population