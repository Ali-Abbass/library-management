import { Role } from '../../auth/roles';
import { UserStatus } from '../user-status';

export class UserEntity {
  id!: string;
  fullName!: string;
  email!: string;
  roles!: Role[];
  status!: UserStatus;
  createdAt!: string;
}
