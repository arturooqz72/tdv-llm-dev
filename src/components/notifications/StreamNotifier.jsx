import { useEffect } from 'react';

/*
  StreamNotifier quedó desactivado porque el sistema anterior dependía de Base44
  (LiveStream, RadioProgram, NotificationPreference, Notification).

  Cuando exista un backend real en Supabase para transmisiones o eventos,
  aquí se puede volver a implementar la lógica de recordatorios.
*/

export default function StreamNotifier() {
  useEffect(() => {
    // Componente desactivado
  }, []);

  return null;
}
