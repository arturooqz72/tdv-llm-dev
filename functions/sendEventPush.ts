Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    const event = body?.event || null;
    const data = body?.data || body || {};
    const entityName = event?.entity_name || body?.entity_name || null;
    const eventType = event?.type || body?.event_type || 'create';

    console.log('[EventPush] Función temporal sin Base44');
    console.log('[EventPush] Entity:', entityName);
    console.log('[EventPush] Type:', eventType);
    console.log('[EventPush] Data preview:', JSON.stringify(data).slice(0, 500));

    return Response.json({
      ok: true,
      disabled: true,
      message: 'Event push temporalmente desactivado mientras se elimina Base44 y se migra el sistema de notificaciones.',
      entityName,
      eventType
    });
  } catch (error) {
    console.error('Function error:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
});
