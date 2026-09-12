import { prisma } from '../lib/prisma';
import { comparePassword, generateTokens, verifyRefreshToken } from '../lib/auth';
import { unauthorizedError } from '../lib/errors';
import { REFRESH_TOKEN_EXPIRY } from '../config/env';

const REFRESH_MAX_AGE_MS = (() => {
  const match = /^(\d+)d$/.exec(REFRESH_TOKEN_EXPIRY);
  return (match ? Number(match[1]) : 7) * 24 * 60 * 60 * 1000;
})();

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_MAX_AGE_MS);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !comparePassword(password, user.passwordHash)) {
    throw unauthorizedError('Invalid email or password');
  }
  const tokens = generateTokens(user);
  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id, expiresAt: refreshExpiry() },
  });
  return { user, tokens };
}

export async function refreshSession(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!stored || stored.userId !== decoded.userId) {
    throw unauthorizedError('Invalid refresh token');
  }

  // Rotate: the presented token is single-use, the browser only ever holds the
  // latest one. A reused token means the session has been compromised.
  const newTokens = generateTokens(stored.user);
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: refreshToken } }),
    prisma.refreshToken.create({
      data: { token: newTokens.refreshToken, userId: stored.user.id, expiresAt: refreshExpiry() },
    }),
  ]);
  return { accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken };
}

export async function logout(userId: string, refreshToken: string) {
  await prisma.refreshToken.deleteMany({
    where: { userId, token: refreshToken },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
}