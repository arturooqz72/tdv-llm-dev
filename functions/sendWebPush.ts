import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));

    const { title, message, link } = body;

    if (!title || !message) {
      return Response.json({ error: 'title and message required' }, { status: 400 });
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKeyRaw = Deno.env.get('VAPID_PRIVATE_KEY_JWK');

    let vapidPrivateKey;
    try {
      const parsed = JSON.parse(vapidPrivateKeyRaw || '');
      vapidPrivateKey = parsed.d;
    } catch {
      vapidPrivateKey = vapidPrivateKeyRaw;
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({
        ok: false,
        disabled: true,
        error: 'VAPID keys not configured'
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:admin@teamdesvelados.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    const icon = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6965d0214fc84ccf68275f1d/ecac80ce7_teamdesveladosLLDM.png';

    const payload = JSON.stringify({
      title,
      body: message,
      icon,
      data: { url: link || '/' }
    });

    console.log('[WebPush] Función temporal sin Base44');
    console.log('[WebPush] Payload preview:', payload);

    return Response.json({
      ok: true,
      disabled: true,
      sent: 0,
      failed: 0,
      cleaned: 0,
      message: 'Web push temporalmente desactivado mientras se elimina Base44 y se migra el sistema de suscripciones.'
    });

  } catch (error) {
    console.error('[WebPush] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
