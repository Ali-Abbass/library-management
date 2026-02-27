import { Injectable } from '@nestjs/common';
import { supabaseInsert, supabaseSelect, supabaseSelectOne, supabaseUpdate } from '../../../common/supabase/supabase.client';
import { UserEntity } from '../entities/user.entity';
import { Role } from '../../auth/roles';
import { UserStatus } from '../user-status';

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  roles: Role[] | null;
  status: UserStatus;
  created_at: string;
};

function mapUserRow(row: UserRow): UserEntity {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    roles: (row.roles ?? []) as Role[],
    status: row.status,
    createdAt: row.created_at
  };
}

@Injectable()
export class UserRepository {
  async findById(_id: string): Promise<UserEntity | null> {
    const row = await supabaseSelectOne<UserRow>('users', {
      filters: [{ column: 'id', operator: 'eq', value: _id }],
      limit: 1
    });
    return row ? mapUserRow(row) : null;
  }

  async approveUser(_id: string): Promise<UserEntity | null> {
    const row = await supabaseUpdate<UserRow>('users', { status: 'active' }, {
      filters: [{ column: 'id', operator: 'eq', value: _id }],
      limit: 1
    }, { single: true });
    return row ? mapUserRow(row as UserRow) : null;
  }

  async updateRoles(_id: string, roles: string[]): Promise<UserEntity | null> {
    const row = await supabaseUpdate<UserRow>('users', { roles }, {
      filters: [{ column: 'id', operator: 'eq', value: _id }],
      limit: 1
    }, { single: true });
    return row ? mapUserRow(row as UserRow) : null;
  }

  async createFromAuth(input: { id: string; email?: string; fullName?: string }): Promise<UserEntity | null> {
    const email = input.email ?? `user-${input.id}@example.com`;
    const row = await supabaseInsert<UserRow>('users', {
      id: input.id,
      email,
      full_name: input.fullName ?? email ?? 'New Patron',
      roles: ['patron'],
      status: 'pending_approval'
    }, { single: true });
    return row ? mapUserRow(row as UserRow) : null;
  }

  async list(status?: UserStatus, query?: string): Promise<UserEntity[]> {
    const filters = [];
    if (status) {
      filters.push({ column: 'status', operator: 'eq', value: status });
    }
    const trimmed = query?.trim();
    const or = trimmed
      ? `(email.ilike.*${trimmed}*,full_name.ilike.*${trimmed}*)`
      : undefined;
    const rows = await supabaseSelect<UserRow>('users', {
      filters,
      or,
      order: 'created_at.desc'
    });
    return rows.map(mapUserRow);
  }
}
