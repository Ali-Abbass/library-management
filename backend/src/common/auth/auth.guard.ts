import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../modules/users/repositories/user.repo';
import { Role } from '../../modules/auth/roles';
import { UserStatus } from '../../modules/users/user-status';
import { verifyJwt } from './jwt.strategy';

type AuthenticatedUser = {
  id: string;
  email?: string;
  roles: Role[];
  status: UserStatus;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly usersRepo: UserRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (process.env.AUTH_BYPASS === 'true') {
      request.user = {
        id: 'test-user',
        roles: [Role.Admin],
        status: UserStatus.Active
      } satisfies AuthenticatedUser;
      return true;
    }

    const authHeader = request.headers?.authorization as string | undefined;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    let claims;
    try {
      claims = await verifyJwt(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
    const userId = claims.sub;
    let user = await this.usersRepo.findById(userId);

    if (!user) {
      user = await this.usersRepo.createFromAuth({
        id: userId,
        email: claims.email,
        fullName: claims.user_metadata?.full_name as string | undefined
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = {
      id: user.id,
      email: user.email,
      roles: user.roles,
      status: user.status
    } satisfies AuthenticatedUser;

    return true;
  }
}
