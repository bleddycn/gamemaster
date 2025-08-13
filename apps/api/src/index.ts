import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import * as dotenv from "dotenv";
import { CreateCompetitionSchema, CreateClubSchema } from "@gm/shared";
import { prisma } from "./db";
dotenv.config();

const app = Fastify({ logger: true });

const COMPETITION_STATUSES = new Set(["DRAFT","OPEN","RUNNING","FINISHED"] as const);

app.register(cors, { origin: true });
app.register(helmet);

app.get("/healthz", async () => ({ ok: true }));

app.get("/dbz", async () => {
  // lightweight query to ensure connection works; count clubs
  const count = await prisma.club.count();
  return { ok: true, clubs: count };
});

app.get("/version", async () => ({ name: "GameMaster API", version: "0.1.0" }));

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

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});