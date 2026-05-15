import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { roleHome, useSession } from '../utils/session';

interface AuthGateProps {
  roles: Array<'admin' | 'trainer' | 'client'>;
  children: ReactNode;
}

export default function AuthGate({ roles, children }: AuthGateProps) {
  const session = useSession();

  if (!session) {
    return <Navigate to={`/login/${roles[0]}`} replace />;
  }

  if (!roles.includes(session.user.role)) {
    return <Navigate to={roleHome(session.user.role)} replace />;
  }

  return <>{children}</>;
}
