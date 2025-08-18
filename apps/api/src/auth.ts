import type { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export interface JWTPayload {
  userId: string;
  role: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user?: JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function verifyJWT(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ error: 'Missing authorization token' });
    }
    
    const decoded = await request.server.jwt.verify(token) as JWTPayload;
    request.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export async function requireSiteAdmin(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
  await verifyJWT(request, reply);
  if (request.user?.role !== 'SITE_ADMIN') {
    return reply.status(403).send({ error: 'Site admin access required' });
  }
}

export async function requireClubAdminOrSiteAdmin(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
  await verifyJWT(request, reply);
  const role = request.user?.role;
  if (role !== 'CLUB_ADMIN' && role !== 'SITE_ADMIN') {
    return reply.status(403).send({ error: 'Club admin or site admin access required' });
  }
}

export async function requireClubAdminForClubId(
  request: AuthenticatedRequest, 
  reply: FastifyReply, 
  clubId: string
): Promise<void> {
  await verifyJWT(request, reply);
  
  if (!request.user) {
    return reply.status(401).send({ error: 'Not authenticated' });
  }
  
  // Site admins can access any club
  if (request.user.role === 'SITE_ADMIN') {
    request.log.info({ userId: request.user.userId, clubId, role: 'SITE_ADMIN' }, 'Site admin accessing club');
    return;
  }
  
  // Check if user is a club admin for this specific club
  const membership = await prisma.clubMember.findUnique({
    where: {
      clubId_userId: {
        clubId,
        userId: request.user.userId
      }
    }
  });
  
  if (!membership || membership.role !== 'CLUB_ADMIN') {
    request.log.warn({ userId: request.user.userId, clubId }, 'Access denied: not a club admin for this club');
    return reply.status(403).send({ error: 'Forbidden: not a club admin for this club' });
  }
  
  request.log.info({ userId: request.user.userId, clubId, role: 'CLUB_ADMIN' }, 'Club admin accessing their club');
}