import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { lastDebugToken } from './auth.service';

/**
 * Debug-only controller for inspecting the last generated one-time token.
 * This controller is NEVER registered in production — it is conditionally
 * imported only when NODE_ENV !== 'production' AND DEBUG_TOKEN_INSPECT=true.
 */
@Controller('auth/debug')
export class DebugAuthController {
  @Get('last-token')
  getLastToken() {
    if (process.env.DEBUG_TOKEN_INSPECT !== 'true') {
      throw new ForbiddenException('Debug token inspection is disabled');
    }

    if (!lastDebugToken) {
      return { message: 'No token has been generated yet', token: null };
    }

    return {
      type: lastDebugToken.type,
      token: lastDebugToken.token,
      expiresAt: lastDebugToken.expiresAt.toISOString(),
    };
  }
}
