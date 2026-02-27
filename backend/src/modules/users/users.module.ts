import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repo';

@Module({
  controllers: [ApprovalsController, UsersController, MeController],
  providers: [UsersService, UserRepository],
  exports: [UserRepository]
})
export class UsersModule {}
