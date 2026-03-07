import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Award, Crown, Star, User, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const USER_STORAGE_KEY = 'tdv_current_user';

function readStoredUser() {
  try {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch {
    return null;
  }
}

export default function RoleManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users] = useState([]);

  useEffect(() => {
    const user = readStoredUser();

    if (!user || user.role !== 'admin') {
      window.location.href = '/';
      return;
    }

    setCurrentUser(user);
    setIsLoading(false);
  }, []);

  const roleTemplates = {
    moderator: {
      name: 'Moderador',
      icon: Shield,
      color: 'bg-red-600',
    },
    content_creator: {
      name: 'Creador de Contenido',
      icon: Award,
      color: 'bg-purple-600',
    },
    premium_listener: {
      name: 'Oyente Premium',
      icon: Star,
      color: 'bg-yellow-600',
    },
    miembro_tdv: {
      name: 'Miembro TDV',
      icon: Crown,
      color: 'bg-cyan-600',
    },
    user: {
      name: 'Usuario Regular',
      icon: User,
      color: 'bg-gray-600',
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Roles y Permisos</h1>
            <p className="text-gray-400">Administra los roles y permisos de los usuarios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(roleTemplates).map(([key, template]) => {
            const Icon = template.icon;

            return (
              <Card key={key} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${template.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                  <p className="text-2xl font-bold text-yellow-500">0</p>
                  <p className="text-xs text-gray-400">usuarios</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-8">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                <Users className="w-4 h-4 mr-2" />
                Asignar Rol a Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-white border-yellow-600 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-yellow-500">Asignar Rol y Permisos</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Esta sección quedó temporalmente desconectada mientras se termina de retirar la dependencia anterior.
                </p>

                <p className="text-sm text-gray-400">
                  Después la conectaremos a Firebase o al nuevo sistema de usuarios.
                </p>

                <Button
                  onClick={() => setDialogOpen(false)}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"
                >
                  Entendido
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Usuarios y Roles Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <p className="text-white font-medium mb-2">No hay datos cargados todavía</p>
                <p className="text-sm text-gray-400">
                  La gestión de roles se reconectará cuando terminemos la migración completa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-black font-semibold">
                        {user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-gray-400">
                      Sin rol asignado
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
