import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * TODO(auth): Placeholder actor-identity extraction. There is no auth module
 * yet. Once one exists, replace this with extraction from the authenticated
 * request (e.g. req.user.id populated by a JWT/session guard) and delete the
 * x-user-id header mechanism entirely.
 */
export const ActorId = createParamDecorator(
  (_data: void, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const actorId = request.headers['x-user-id'];
    if (typeof actorId !== 'string' || actorId.length === 0) {
      throw new BadRequestException('Missing x-user-id header');
    }
    return actorId;
  },
);
