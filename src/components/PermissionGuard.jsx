import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function PermissionGuard({
  children,
  permission,
  fallback = null,
  requireRole = null
}) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isLoadingAuth) return;

    // Si no hay sesión, negar acceso
    if (!isAuthenticated || !user) {
      setHasPermission(false);
      return;
    }

    // Admin siempre tiene acceso total
    if (user.role === 'admin') {
      setHasPermission(true);
      return;
    }

    // Si requiere un rol específico y no coincide, negar
    if (requireRole && user.role !== requireRole) {
      setHasPermission(false);
      return;
    }

    // Si pide permiso granular, revisarlo dentro del usuario actual
    if (permission) {
      const allowed = user.permissions?.[permission] === true;
      setHasPermission(allowed);
      return;
    }

    // Si no pide nada extra, permitir
    setHasPermission(true);
  }, [user, isAuthenticated, isLoadingAuth, permission, requireRole]);

  if (isLoadingAuth) {
    return null;
  }

  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    );
  }

  return children;
}

// Hook para usar en componentes
export function usePermission(permission) {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!isAuthenticated || !user) {
      setHasPermission(false);
      return;
    }

    if (user.role === 'admin') {
      setHasPermission(true);
      return;
    }

    if (permission) {
      setHasPermission(user.permissions?.[permission] === true);
      return;
    }

    setHasPermission(true);
  }, [user, isAuthenticated, isLoadingAuth, permission]);

  return {
    hasPermission,
    loading: isLoadingAuth
  };
}
