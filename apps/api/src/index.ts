import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import * as dotenv from "dotenv";
import { CreateCompetitionSchema, CreateClubSchema, CreateGameTemplateSchema, ActivateTemplateSchema, JoinCompetitionSchema } from "@gm/shared";
import { prisma } from "./db";
import { hashPassword, verifyPassword, AuthenticatedRequest, requireSiteAdmin, requireClubAdminOrSiteAdmin, requireClubAdminForClubId } from "./auth";
import { z } from "zod";
dotenv.config();

const app = Fastify({ logger: true });

// Register JWT plugin
app.register(jwt, {
  secret: process.env.JWT_SECRET || "fallback-secret-change-in-production"
});

// Auth schemas
const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const COMPETITION_STATUSES = new Set(["DRAFT","OPEN","RUNNING","FINISHED"] as const);

function inWindow(now: Date, open?: Date | null, close?: Date | null) {
  if (open && now < open) return false;
  if (close && now > close) return false;
  return true;
}

function isWithin(now: Date, open?: Date | null, close?: Date | null) {
  if (open && now < open) return false;
  if (close && now > close) return false;
  return true;
}

app.register(cors, { origin: true });
app.register(helmet);

// Add request logging with userId when available
app.addHook("onRequest", async (req: AuthenticatedRequest) => {
  // Try to extract user from JWT if present
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = await app.jwt.verify(token) as { userId: string; role: string };
      req.user = decoded;
    } catch {
      // Invalid token, continue without user
    }
  }
  
  if (req.url.startsWith("/competitions")) {
    app.log.info({ method: req.method, url: req.url, userId: req.user?.userId }, "incoming competitions request");
  } else {
    app.log.info({ method: req.method, url: req.url, userId: req.user?.userId }, "incoming request");
  }
});

app.get("/healthz", async () => ({ ok: true }));

app.get("/dbz", async () => {
  // lightweight query to ensure connection works; count clubs
  const count = await prisma.club.count();
  return { ok: true, clubs: count };
});

app.get("/version", async () => ({ name: "GameMaster API", version: "0.1.0" }));

app.get("/__routes", async () => {
  // @ts-ignore - printRoutes is available on fastify instance
  const tree = (app as any).printRoutes?.({ commonPrefix: false }) ?? "printRoutes not available";
  return { routes: tree };
});

// Auth endpoints
app.post("/auth/register", async (req, reply) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  
  const { email, password, name } = parsed.data;
  
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    reply.code(409);
    return { error: "User with this email already exists" };
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
      role: "PLAYER"
    },
    select: { id: true, email: true, name: true, role: true }
  });
  
  // Generate JWT
  const token = app.jwt.sign({ userId: user.id, role: user.role });
  
  return { user, token };
});

app.post("/auth/login", async (req, reply) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  
  const { email, password } = parsed.data;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true }
  });
  
  if (!user || !user.passwordHash) {
    reply.code(401);
    return { error: "Invalid email or password" };
  }
  
  // Verify password
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    reply.code(401);
    return { error: "Invalid email or password" };
  }
  
  // Generate JWT
  const token = app.jwt.sign({ userId: user.id, role: user.role });
  
  // Don't return passwordHash
  const { passwordHash, ...userWithoutHash } = user;
  
  return { user: userWithoutHash, token };
});

// Get current user from JWT
app.get("/me", async (req: AuthenticatedRequest, reply) => {
  if (!req.user) {
    reply.code(401);
    return { error: "Not authenticated" };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true,
      members: {
        select: {
          clubId: true,
          role: true,
          club: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      }
    }
  });
  
  if (!user) {
    reply.code(404);
    return { error: "User not found" };
  }
  
  // Transform memberships to the desired format
  const memberships = user.members.map(member => ({
    clubId: member.clubId,
    clubName: member.club.name,
    clubSlug: member.club.slug,
    role: member.role
  }));
  
  req.log.info({ userId: user.id, membershipCount: memberships.length }, "User profile retrieved");
  
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    memberships
  };
});

app.post("/clubs/:clubId/competitions", async (req, reply) => {
  const clubId = (req.params as any).clubId as string;
  const parsed = CreateCompetitionSchema.safeParse({ ...(req.body as any), clubId });

  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }

  const created = await prisma.competition.create({
    data: {
      clubId: parsed.data.clubId,
      name: parsed.data.name,
      sport: parsed.data.sport,
      entryFeeCents: parsed.data.entryFeeCents,
      currency: parsed.data.currency,
      status: "DRAFT"
    }
  });
  
  // Defensive check - ensure status is valid (should always be DRAFT from insert above)
  if (!COMPETITION_STATUSES.has(created.status as any)) {
    created.status = "DRAFT";
  }
  
  return created;
});

// Get a club by slug (for the frontend detail page)
app.get("/clubs/by-slug/:slug", async (req, reply) => {
  const { slug } = req.params as { slug: string };
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true }
  });
  if (!club) {
    reply.code(404);
    return { error: "Club not found" };
  }
  return club;
});

// List competitions for a club (optional ?status=OPEN|RUNNING|DRAFT|FINISHED)
app.get("/clubs/:clubId/competitions", async (req) => {
  const { clubId } = req.params as { clubId: string };
  const { status } = req.query as { status?: string };

  const where: any = { clubId };
  if (status) {
    where.status = status.toUpperCase();
  }

  const items = await prisma.competition.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      sport: true,
      status: true,
      entryFeeCents: true,
      currency: true,
      createdAt: true,
      template: {
        select: {
          joinOpenAt: true,
          joinCloseAt: true,
          startAt: true
        }
      }
    }
  });
  return { items };
});

app.get("/clubs", async () => {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true }
  });
  return { items: clubs };
});

app.post("/clubs", async (req, reply) => {
  const parsed = CreateClubSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const { name, slug, brandingJson } = parsed.data;

  const created = await prisma.club.create({
    data: { name, slug, brandingJson }
  });
  return created;
});

// Create a game template (SITE_ADMIN only)
app.post("/templates", { preHandler: requireSiteAdmin }, async (req: AuthenticatedRequest, reply) => {
  const parsed = CreateGameTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const p = parsed.data;

  const created = await prisma.gameTemplate.create({
    data: {
      name: p.name,
      gameType: p.gameType,
      sport: p.sport,
      status: p.status,
      activationOpenAt: p.activationOpenAt ? new Date(p.activationOpenAt) : null,
      activationCloseAt: p.activationCloseAt ? new Date(p.activationCloseAt) : null,
      joinOpenAt: p.joinOpenAt ? new Date(p.joinOpenAt) : null,
      joinCloseAt: p.joinCloseAt ? new Date(p.joinCloseAt) : null,
      startAt: new Date(p.startAt),
      rulesJson: p.rulesJson
    },
    select: {
      id: true, name: true, gameType: true, sport: true, status: true,
      activationOpenAt: true, activationCloseAt: true,
      joinOpenAt: true, joinCloseAt: true, startAt: true
    }
  });

  return created;
});

// List templates (optional filters: status=PUBLISHED, upcoming=true)
app.get("/templates", async (req) => {
  const { status, upcoming } = (req.query || {}) as { status?: string; upcoming?: string };
  const where: any = {};

  if (status) where.status = status.toUpperCase();
  if (upcoming === "true") {
    where.startAt = { gte: new Date() };
  }

  const items = await prisma.gameTemplate.findMany({
    where,
    orderBy: [{ startAt: "asc" }],
    select: {
      id: true, name: true, gameType: true, sport: true, status: true,
      activationOpenAt: true, activationCloseAt: true,
      joinOpenAt: true, joinCloseAt: true, startAt: true
    }
  });
  return { items };
});

// Activate a template into a club competition (CLUB_ADMIN for specific club or SITE_ADMIN)
app.post("/clubs/:clubId/activate-template/:templateId", async (req: AuthenticatedRequest, reply) => {
  const { clubId, templateId } = req.params as { clubId: string; templateId: string };
  
  // Check authorization for this specific club
  await requireClubAdminForClubId(req, reply, clubId);
  if (reply.sent) return;
  
  const parsed = ActivateTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const p = parsed.data;

  const tmpl = await prisma.gameTemplate.findUnique({
    where: { id: templateId },
    select: {
      id: true, name: true, gameType: true, sport: true, status: true,
      activationOpenAt: true, activationCloseAt: true,
      joinOpenAt: true, joinCloseAt: true, startAt: true, rulesJson: true
    }
  });

  if (!tmpl) {
    reply.code(404);
    return { error: "Template not found" };
  }

  // Guardrails: must be PUBLISHED and within activation window
  const now = new Date();
  if (tmpl.status !== "PUBLISHED") {
    reply.code(400);
    return { error: "Template not published" };
  }
  const ok = inWindow(
    now,
    tmpl.activationOpenAt ? new Date(tmpl.activationOpenAt) : undefined,
    tmpl.activationCloseAt ? new Date(tmpl.activationCloseAt) : undefined
  );
  if (!ok) {
    req.log.warn({ 
      userId: req.user?.userId, 
      clubId, 
      templateId, 
      activationOpenAt: tmpl.activationOpenAt?.toISOString(),
      activationCloseAt: tmpl.activationCloseAt?.toISOString(),
      now: now.toISOString()
    }, "Template activation blocked: activation window is closed");
    reply.code(400);
    return { error: "Activation window is closed" };
  }

  // Create a competition linked to the template
  const created = await prisma.competition.create({
    data: {
      clubId,
      templateId: tmpl.id,
      name: p.name ?? tmpl.name,
      sport: tmpl.sport,
      status: "DRAFT",               // club opens it later
      entryFeeCents: p.entryFeeCents,
      currency: p.currency,
      rulesJson: tmpl.rulesJson ?? null,
      startRoundAt: tmpl.startAt
    },
    select: {
      id: true, clubId: true, templateId: true, name: true, sport: true, status: true,
      entryFeeCents: true, currency: true, startRoundAt: true
    }
  });

  return created;
});

// Open a competition (CLUB_ADMIN for specific club or SITE_ADMIN) → DRAFT -> OPEN
app.post("/competitions/:id/open", async (req: AuthenticatedRequest, reply) => {
  const { id } = req.params as { id: string };
  
  // Get the competition with its template to check join windows
  const comp = await prisma.competition.findUnique({ 
    where: { id }, 
    select: { 
      id: true, status: true, clubId: true, templateId: true,
      template: {
        select: {
          id: true,
          joinOpenAt: true,
          joinCloseAt: true,
          startAt: true
        }
      }
    } 
  });
  
  if (!comp) {
    reply.code(404);
    return { error: "Competition not found" };
  }
  
  // Check authorization for this competition's club
  await requireClubAdminForClubId(req, reply, comp.clubId);
  if (reply.sent) return;
  
  if (comp.status !== "DRAFT") {
    reply.code(400);
    return { error: "Only DRAFT competitions can be opened" };
  }
  
  // Enforce join window timing for opening competitions
  const now = new Date();
  if (comp.template) {
    const joinOpenAt = comp.template.joinOpenAt;
    const joinCloseAt = comp.template.joinCloseAt;
    const startAt = comp.template.startAt;
    
    // Can't open if join window hasn't started yet
    if (joinOpenAt && now < new Date(joinOpenAt)) {
      req.log.warn({ 
        userId: req.user?.userId, 
        competitionId: id, 
        templateId: comp.template.id,
        joinOpenAt: joinOpenAt.toISOString(),
        now: now.toISOString()
      }, "Competition opening blocked: join window not yet open");
      reply.code(400);
      return { error: "You can't open entries yet" };
    }
    
    // Can't open if join window has already closed or if past start time
    const effectiveCloseAt = joinCloseAt || startAt;
    if (effectiveCloseAt && now > new Date(effectiveCloseAt)) {
      req.log.warn({ 
        userId: req.user?.userId, 
        competitionId: id, 
        templateId: comp.template.id,
        joinCloseAt: joinCloseAt?.toISOString(),
        startAt: startAt?.toISOString(),
        now: now.toISOString()
      }, "Competition opening blocked: join window has closed");
      reply.code(400);
      return { error: "Join window has closed" };
    }
  }
  
  const updated = await prisma.competition.update({
    where: { id },
    data: { status: "OPEN" },
    select: { id: true, status: true }
  });
  
  req.log.info({ userId: req.user?.userId, competitionId: id, clubId: comp.clubId, templateId: comp.templateId }, "Competition opened");
  return updated;
});

// Get competition details with current round and fixtures
app.get("/competitions/:id", async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    console.log(`Fetching competition with ID: ${id}`);
    const comp = await prisma.competition.findUnique({
      where: { id },
      select: {
        id: true, name: true, sport: true, status: true, entryFeeCents: true, currency: true,
        startRoundAt: true, clubId: true,
        club: { select: { name: true, slug: true } },
        template: { select: { gameType: true, rulesJson: true } },
        rounds: {
          orderBy: { roundNumber: "asc" },
          select: {
            id: true, roundNumber: true, status: true, pickDeadlineAt: true
          }
        }
      }
    });

    console.log(`Query result:`, comp);

    if (!comp) {
      reply.code(404);
      return { error: "Competition not found" };
    }

    // Transform to match frontend expectations
    const transformedComp = {
      ...comp,
      rounds: comp.rounds.map(round => ({
        id: round.id,
        name: `Round ${round.roundNumber}`,
        status: round.status,
        deadlineAt: round.pickDeadlineAt?.toISOString() || null,
        fixtures: [] // No fixtures for now
      }))
    };

    return transformedComp;
  } catch (error) {
    console.error('Error fetching competition:', error);
    reply.code(500);
    return { error: "Internal server error" };
  }
});

// Join a competition (creates CompetitionEntry). Temporary: identify by email.
// Later we will use authenticated user id.
app.post("/competitions/:id/entries", async (req, reply) => {
  const { id } = req.params as { id: string };

  // Validate body
  const parsed = JoinCompetitionSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const { email, name } = parsed.data;

  // Load competition + template/windows
  const comp = await prisma.competition.findUnique({
    where: { id },
    select: {
      id: true, clubId: true, status: true, startRoundAt: true, templateId: true,
      template: {
        select: {
          id: true, status: true,
          joinOpenAt: true, joinCloseAt: true,
          startAt: true
        }
      }
    }
  });

  if (!comp) {
    reply.code(404);
    return { error: "Competition not found" };
  }
  if (comp.status !== "OPEN") {
    reply.code(400);
    return { error: "Competition is not open for entries" };
  }

  // Enforce join window.
  // Preferred: template joinOpenAt/joinCloseAt if present.
  const now = new Date();
  const openAt = comp.template?.joinOpenAt ?? null;
  const closeAt = comp.template?.joinCloseAt ?? comp.startRoundAt ?? comp.template?.startAt ?? null;

  if (!isWithin(now, openAt ?? undefined, closeAt ?? undefined)) {
    req.log.warn({ 
      competitionId: id, 
      templateId: comp.templateId,
      joinOpenAt: openAt?.toISOString(),
      joinCloseAt: closeAt?.toISOString(),
      now: now.toISOString(),
      email 
    }, "Join attempt blocked: join window is closed");
    reply.code(400);
    return { error: "Join window has closed" };
  }

  // Upsert user by email (temporary auth substitute)
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name ?? undefined },
    create: { email, name: name ?? null, role: "PLAYER" }
  });

  // Ensure the user is at least a member of the club (soft add as PLAYER)
  await prisma.clubMember.upsert({
    where: { clubId_userId: { clubId: comp.clubId, userId: user.id } },
    update: {},
    create: { clubId: comp.clubId, userId: user.id, role: "PLAYER" }
  });

  // Create entry (unique on competitionId+userId)
  try {
    const entry = await prisma.competitionEntry.create({
      data: {
        competitionId: comp.id,
        userId: user.id,
        status: "ACTIVE" // For now, mark ACTIVE upon join; later gate by Stripe payment webhook
      },
      select: { id: true, competitionId: true, userId: true, status: true }
    });
    return entry;
  } catch (e: any) {
    // Likely unique constraint (already joined)
    reply.code(409);
    return { error: "You have already joined this competition" };
  }
});

// Submit a pick for a fixture (temporary: identify by email)
app.post("/picks", async (req, reply) => {
  const { email, fixtureId, teamPicked } = req.body as { 
    email: string; 
    fixtureId: string; 
    teamPicked: string; 
  };

  if (!email || !fixtureId || !teamPicked) {
    reply.code(400);
    return { error: "email, fixtureId, and teamPicked are required" };
  }

  // Get user by email (for temporary auth)
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    reply.code(404);
    return { error: "User not found. Please join a competition first." };
  }

  // Get fixture and related competition
  const fixture = await prisma.fixture.findUnique({
    where: { id: fixtureId },
    select: {
      id: true, homeTeamId: true, awayTeamId: true, status: true,
      round: {
        select: { 
          id: true, status: true, pickDeadlineAt: true,
          competition: { select: { id: true, status: true } }
        }
      }
    }
  });

  if (!fixture) {
    reply.code(404);
    return { error: "Fixture not found" };
  }

  // Validate team selection (for now, accept team IDs)
  if (teamPicked !== fixture.homeTeamId && teamPicked !== fixture.awayTeamId) {
    reply.code(400);
    return { error: "Invalid team selection" };
  }

  // Check if round is still open for picks
  if (fixture.round.status !== "UPCOMING") {
    reply.code(400);
    return { error: "Round is no longer accepting picks" };
  }

  // Check deadline
  if (fixture.round.pickDeadlineAt && new Date() > new Date(fixture.round.pickDeadlineAt)) {
    reply.code(400);
    return { error: "Pick deadline has passed" };
  }

  // Upsert the pick
  const pick = await prisma.pick.upsert({
    where: { 
      userId_fixtureId: { 
        userId: user.id, 
        fixtureId: fixture.id 
      } 
    },
    update: { teamPicked },
    create: {
      userId: user.id,
      fixtureId: fixture.id,
      teamPicked,
      competitionId: fixture.round.competition.id
    },
    select: { id: true, teamPicked: true, createdAt: true, updatedAt: true }
  });

  return pick;
});

// Admin endpoint to assign club admin (SITE_ADMIN only)
const AssignClubAdminSchema = z.object({
  email: z.string().email()
});

app.post("/admin/clubs/:clubId/assign-club-admin", { preHandler: requireSiteAdmin }, async (req: AuthenticatedRequest, reply) => {
  const { clubId } = req.params as { clubId: string };
  
  // Validate input
  const parsed = AssignClubAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: "Validation failed", issues: parsed.error.issues };
  }
  const { email } = parsed.data;
  
  // Check if club exists
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true }
  });
  
  if (!club) {
    reply.code(404);
    return { error: "Club not found" };
  }
  
  // Upsert the user if they don't exist (keep existing role if they have one)
  const user = await prisma.user.upsert({
    where: { email },
    update: {}, // Don't update anything if user exists
    create: {
      email,
      name: null,
      role: "CLUB_ADMIN" // Default role for new users created this way
    }
  });
  
  // Upsert ClubMember with CLUB_ADMIN role
  await prisma.clubMember.upsert({
    where: {
      clubId_userId: {
        clubId,
        userId: user.id
      }
    },
    update: { role: "CLUB_ADMIN" },
    create: {
      clubId,
      userId: user.id,
      role: "CLUB_ADMIN"
    }
  });
  
  req.log.info({ 
    adminUserId: req.user?.userId, 
    assignedUserId: user.id, 
    email, 
    clubId,
    clubName: club.name 
  }, "Club admin assigned");
  
  return { 
    ok: true, 
    clubId, 
    userId: user.id, 
    email 
  };
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});