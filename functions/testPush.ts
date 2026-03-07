Deno.serve(async (req) => {
  try {
    console.log('[TEST] Endpoint de prueba de notificaciones (Base44 eliminado)');

    const body = await req.json().catch(() => ({}));

    return Response.json({
      ok: true,
      disabled: true,
      message: 'Test de Web Push desactivado mientras se elimina Base44.',
      receivedPayload: body
    });

  } catch (error) {
    console.error('[TEST] Error:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
});
