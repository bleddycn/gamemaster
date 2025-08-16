import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import * as dotenv from "dotenv";
import { CreateCompetitionSchema, CreateClubSchema, CreateGameTemplateSchema, ActivateTemplateSchema, JoinCompetitionSchema } from "@gm/shared";
import { prisma } from "./db";
dotenv.config();

const app = Fastify({ logger: true });

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

// Add request logging for competitions endpoints
app.addHook("onRequest", async (req) => {
  if (req.url.startsWith("/competitions")) {
    app.log.info({ method: req.method, url: req.url }, "incoming competitions request");
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

// placeholder auth extraction for later
app.get("/me", async (req, reply) => {
  return { userId: "dev-user", roles: ["PLAYER"], clubIds: [] };
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
      createdAt: true
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

// Create a game template (Platform Admin only - auth to be added later)
app.post("/templates", async (req, reply) => {
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

// Activate a template into a club competition (Club Admin flow)
app.post("/clubs/:clubId/activate-template/:templateId", async (req, reply) => {
  const { clubId, templateId } = req.params as { clubId: string; templateId: string };
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
    reply.code(400);
    return { error: "Activation window is closed for this template" };
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

// Open a competition (club admin action) → DRAFT -> OPEN
app.post("/competitions/:id/open", async (req, reply) => {
  const { id } = req.params as { id: string };
  // Make sure only DRAFT can become OPEN
  const comp = await prisma.competition.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!comp) {
    reply.code(404);
    return { error: "Competition not found" };
  }
  if (comp.status !== "DRAFT") {
    reply.code(400);
    return { error: "Only DRAFT competitions can be opened" };
  }
  const updated = await prisma.competition.update({
    where: { id },
    data: { status: "OPEN" },
    select: { id: true, status: true }
  });
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
    reply.code(400);
    return { error: "Join window is closed for this competition" };
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

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});