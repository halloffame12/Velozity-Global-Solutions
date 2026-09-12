import { Response } from 'express';
import { asyncHandler } from '../lib/errors';
import { login, refreshSession, logout, getUserById } from '../services/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { NODE_ENV, REFRESH_TOKEN_EXPIRY } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

function cookieBaseOptions() {
  const isProd = NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: (isProd ? 'none' : 'strict') as 'none' | 'strict',
    secure: isProd,
    path: '/',
  };
}

function daysFromExpiry(expiry: string): number {
  const match = /^(\d+)d$/.exec(expiry);
  return match ? Number(match[1]) : 7;
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...cookieBaseOptions(),
    maxAge: daysFromExpiry(REFRESH_TOKEN_EXPIRY) * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, cookieBaseOptions());
}

export const loginHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { email, password } = req.body;
  const { user, tokens } = await login(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(200).json({
    success: true,
    data: {
      user,
      accessToken: tokens.accessToken,
    },
  });
});

export const refreshHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Refresh token required',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  const { accessToken, refreshToken: newToken } = await refreshSession(refreshToken);
  setRefreshCookie(res, newToken);
  res.status(200).json({
    success: true,
    data: { accessToken },
  });
});

export const logoutHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (req.user && refreshToken) {
    await logout(req.user.userId, refreshToken);
  }
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const meHandler = asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
      code: 'NOT_FOUND',
    });
    return;
  }
  res.status(200).json({ success: true, data: { user } });
});