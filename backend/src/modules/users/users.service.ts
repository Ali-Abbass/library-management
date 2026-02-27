import { Injectable } from '@nestjs/common';
import { UserRepository } from './repositories/user.repo';
import { UserStatus } from './user-status';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UserRepository) {}

  async approvePatron(userId: string) {
    const user = await this.usersRepo.approveUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async updateRoles(userId: string, roles: string[]) {
    const user = await this.usersRepo.updateRoles(userId, roles);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async list(status?: string, query?: string) {
    if (!status) {
      return this.usersRepo.list(undefined, query);
    }
    const normalized = status as UserStatus;
    return this.usersRepo.list(normalized, query);
  }
}
