// Helper: get FCM access token from service account
async function getFCMAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging'
  };

  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const signingInput = `${encode(header)}.${encode(payload)}`;

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signingInput}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.data || body || {};

    console.log('[Send Push] Función temporal sin Base44');
    console.log('  user_name:', message?.user_name);
    console.log('  user_email:', message?.user_email);
    console.log('  content:', message?.content);
    console.log('  room_id:', message?.room_id);

    const serviceAccountRaw = Deno.env.get('FCM_SERVICE_ACCOUNT');
    if (!serviceAccountRaw) {
      return Response.json(
        {
          ok: false,
          disabled: true,
          error: 'FCM_SERVICE_ACCOUNT not configured'
        },
        { status: 500 }
      );
    }

    const serviceAccount = JSON.parse(serviceAccountRaw);
    await getFCMAccessToken(serviceAccount);

    return Response.json({
      ok: true,
      disabled: true,
      message: 'Push temporalmente desactivado mientras se elimina Base44 y se migra el sistema de tokens.',
      preview: {
        title: `💬 Chat - ${message?.user_name || 'Alguien'}`,
        body: message?.content || '📎 Archivo adjunto',
        link: '/Chat'
      }
    });
  } catch (error) {
    console.error('Function error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
