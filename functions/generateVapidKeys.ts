import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate VAPID keys using web-push library (guaranteed compatible)
    const vapidKeys = webpush.generateVAPIDKeys();
    
    // Also read the current secret to see what's stored
    const currentPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'NOT SET';
    const currentPrivateKeyRaw = Deno.env.get('VAPID_PRIVATE_KEY_JWK') || 'NOT SET';
    
    let currentPrivateKeyD = 'N/A';
    try {
      const jwk = JSON.parse(currentPrivateKeyRaw);
      currentPrivateKeyD = jwk.d || 'no d field';
    } catch(e) {
      currentPrivateKeyD = 'parse error: ' + e.message;
    }

    return Response.json({
      message: 'VAPID keys generated. Save these as secrets if needed.',
      newKeys: {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        note: 'Set VAPID_PUBLIC_KEY = publicKey, VAPID_PRIVATE_KEY_JWK = privateKey (just the base64url string)'
      },
      currentSecrets: {
        VAPID_PUBLIC_KEY: currentPublicKey,
        VAPID_PRIVATE_KEY_D: currentPrivateKeyD,
        match: currentPublicKey === vapidKeys.publicKey ? 'MATCH' : 'DIFFERENT (this is expected for newly generated keys)'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});