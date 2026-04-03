import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SystemRole } from '@ve_xe_nhanh_ts/shared-types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true; // No @Roles() decorator found, so allow access
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { role: SystemRole } }>();
    if (!user) {
      return false;
    }
    // user is populated by JwtAuthGuard
    return requiredRoles.includes(user.role);
  }
}
