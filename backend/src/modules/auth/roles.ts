export enum Role {
  Patron = 'patron',
  Staff = 'staff',
  Admin = 'admin'
}

export const RolePermissions: Record<Role, string[]> = {
  [Role.Patron]: ['catalog:read', 'loans:read', 'loan_requests:create', 'alerts:read'],
  [Role.Staff]: ['catalog:read', 'catalog:write', 'loans:read', 'loans:write', 'alerts:write'],
  [Role.Admin]: ['catalog:read', 'catalog:write', 'loans:read', 'loans:write', 'alerts:write', 'analytics:read', 'roles:write']
};
