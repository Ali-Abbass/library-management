export enum UserStatus {
  PendingApproval = 'pending_approval',
  Active = 'active',
  Suspended = 'suspended'
}

export const BorrowingAllowedStatuses = new Set<UserStatus>([UserStatus.Active]);
