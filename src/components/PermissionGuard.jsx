import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield } from 'lucide-react';

export default function PermissionGuard({ 
  children, 
  permission, 
  fallback = null,
  requireRole = null 
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission, requireRole]);

  const checkPermission = async () => {
    try {
      const user = await base44.auth.me();
      
      // Admins siempre tienen todos los permisos
      if (user.role === 'admin') {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      // Verificar rol específico si se requiere
      if (requireRole && user.role !== requireRole) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Verificar permisos granulares
      if (permission) {
        const userRoles = await base44.entities.UserRole.filter({ 
          user_email: user.email 
        });

        const hasRequiredPermission = userRoles.some(roleRecord => 
          roleRecord.permissions?.[permission] === true
        );

        setHasPermission(hasRequiredPermission);
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [permission]);

  const checkPermission = async () => {
    try {
      const user = await base44.auth.me();
      
      if (user.role === 'admin') {
        setHasPermission(true);
        setLoading(false);
        return;
      }

      if (permission) {
        const userRoles = await base44.entities.UserRole.filter({ 
          user_email: user.email 
        });

        const hasRequiredPermission = userRoles.some(roleRecord => 
          roleRecord.permissions?.[permission] === true
        );

        setHasPermission(hasRequiredPermission);
      } else {
        setHasPermission(true);
      }
    } catch (error) {
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasPermission, loading };
}