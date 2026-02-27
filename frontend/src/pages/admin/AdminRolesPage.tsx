import { useEffect, useState } from 'react';
import { approveUser, listUsers, updateUserRoles } from '../../services/admin.api';

type UserRow = {
  id: string;
  email: string;
  roles: string[];
  status: string;
};

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState('');

  const loadUsers = () => {
    listUsers().then(setUsers).catch(() => setUsers([]));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onApprove = async (userId: string) => {
    if (busyUserId) return;
    setBusyUserId(userId);
    setActionStatus('');
    try {
      await approveUser(userId);
      setActionStatus('User approved.');
      loadUsers();
    } catch {
      setActionStatus('Failed to approve user.');
    } finally {
      setBusyUserId(null);
    }
  };

  const onRoleChange = async (userId: string, roles: string[]) => {
    if (busyUserId) return;
    setBusyUserId(userId);
    setActionStatus('');
    try {
      await updateUserRoles(userId, roles);
      setActionStatus('Role updated.');
      loadUsers();
    } catch {
      setActionStatus('Failed to update role.');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="panel fade-in">
      <div className="panel-header">
        <div>
          <h2>Users and Roles</h2>
          <p className="muted">Manage user approvals and role assignments.</p>
        </div>
        <span className="pill">{users.length} users</span>
      </div>
      <div className="grid grid-2">
        {actionStatus ? <div className="muted">{actionStatus}</div> : null}
        {users.length === 0 ? (
          <div className="card">
            <span className="tag">No users</span>
            <strong>No user accounts found</strong>
            <span className="muted">Invite patrons to sign up to manage approvals.</span>
          </div>
        ) : null}
        {users.map((user) => (
          <div key={user.id} className="card">
            <span className="tag">User</span>
            <strong className="card-email">{user.email}</strong>
            <span className="muted">Role: {user.roles.join(', ') || 'patron'}</span>
            <span className="status">{user.status}</span>
            <div className="split">
              <select
                className="input"
                value={user.roles[0] ?? 'patron'}
                disabled={busyUserId === user.id}
                onChange={(event) => onRoleChange(user.id, [event.target.value])}
              >
                <option value="patron">Patron</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              {user.status === 'pending_approval' ? (
                <button
                  type="button"
                  className="button"
                  disabled={busyUserId === user.id}
                  onClick={() => onApprove(user.id)}
                >
                  {busyUserId === user.id ? 'Approving...' : 'Approve'}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
