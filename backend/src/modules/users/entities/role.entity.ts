import { Role } from '../../auth/roles';

export class RoleEntity {
  id!: string;
  name!: Role;
  permissions!: string[];
}
