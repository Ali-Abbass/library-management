import { useState } from 'react';
import { BookIcon, SparkleIcon, UserIcon } from '../components/ui/Icons';
import { useAuth } from '../services/auth/auth-context';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [status, setStatus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus('');
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
        setStatus('Check your email to confirm your account before signing in.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout fade-in">
      <section className="auth-showcase">
        <span className="ai-badge">
          <SparkleIcon size={14} />
          Smart Library
        </span>
        <h2>Borrow better with an intelligent library experience</h2>
        <p className="muted">Discover books, request checkouts, and track your reading activity in one place.</p>
        <div className="auth-feature-list">
          <div className="auth-feature">
            <BookIcon size={16} />
            <span>Rich catalog with copy-level availability</span>
          </div>
          <div className="auth-feature">
            <SparkleIcon size={16} />
            <span>AI suggestions for search and recommendations</span>
          </div>
          <div className="auth-feature">
            <UserIcon size={16} />
            <span>Patron requests managed by staff/admin workflows</span>
          </div>
        </div>
      </section>

      <section className="auth-form-card">
        <h2>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">
          {mode === 'sign-in'
            ? 'Sign in to manage loans, alerts, and requests.'
            : 'Sign up for a patron account. Admin approval is required for borrowing.'}
        </p>
        <form className="form-row" onSubmit={onSubmit}>
          {mode === 'sign-up' ? (
            <input
              className="input"
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={submitting}
              required
            />
          ) : null}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
          <button type="submit" className="button" disabled={submitting}>
            {submitting
              ? mode === 'sign-in'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'sign-in'
                ? 'Sign in'
                : 'Create account'}
          </button>
          {status ? <div className="muted">{status}</div> : null}
        </form>
        <div className="split">
          <button
            type="button"
            className="button ghost"
            disabled={submitting}
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          >
            {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </section>
    </div>
  );
}
