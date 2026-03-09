import crypto from "crypto";

function getPublicBaseUrl(bucketName, endpoint) {
  if (endpoint) {
    const match = endpoint.match(/s3\.[^.]+-(\d+)\.backblazeb2\.com$/);
    if (match?.[1]) {
      return `https://f${match[1]}.backblazeb2.com/file/${bucketName}`;
    }
  }

  return `https://f004.backblazeb2.com/file/${bucketName}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;
    const bucketName = process.env.B2_BUCKET_NAME;
    const endpoint = process.env.B2_ENDPOINT;

    if (!keyId || !applicationKey || !bucketName) {
      return res.status(500).json({
        error: "Faltan variables de entorno de Backblaze B2 en Vercel.",
      });
    }

    const { fileName, contentType, base64, folder } = req.body || {};

    if (!fileName || !base64) {
      return res.status(400).json({
        error: "Faltan datos del archivo.",
      });
    }

    const authString = Buffer.from(`${keyId}:${applicationKey}`).toString("base64");

    const authResponse = await fetch(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${authString}`,
        },
      }
    );

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      return res.status(500).json({
        error: authData?.message || "No se pudo autorizar con Backblaze.",
      });
    }

    const listBucketsResponse = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_list_buckets`,
      {
        method: "POST",
        headers: {
          Authorization: authData.authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: authData.accountId,
          bucketName,
        }),
      }
    );

    const listBucketsData = await listBucketsResponse.json();

    if (!listBucketsResponse.ok) {
      return res.status(500).json({
        error: listBucketsData?.message || "No se pudo obtener el bucket.",
      });
    }

    const bucket = listBucketsData?.buckets?.find(
      (item) => item.bucketName === bucketName
    );

    if (!bucket?.bucketId) {
      return res.status(500).json({
        error: `No se encontró el bucket ${bucketName}.`,
      });
    }

    const uploadUrlResponse = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      {
        method: "POST",
        headers: {
          Authorization: authData.authorizationToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bucketId: bucket.bucketId,
        }),
      }
    );

    const uploadUrlData = await uploadUrlResponse.json();

    if (!uploadUrlResponse.ok) {
      return res.status(500).json({
        error: uploadUrlData?.message || "No se pudo obtener upload URL.",
      });
    }

    const fileBuffer = Buffer.from(base64, "base64");
    const sha1 = crypto.createHash("sha1").update(fileBuffer).digest("hex");

    const safeFolder = folder ? `${folder.replace(/^\/+|\/+$/g, "")}/` : "";
    const finalFileName = `${safeFolder}${Date.now()}-${fileName}`;

    const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadUrlData.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(finalFileName),
        "Content-Type": contentType || "b2/x-auto",
        "Content-Length": String(fileBuffer.length),
        "X-Bz-Content-Sha1": sha1,
      },
      body: fileBuffer,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return res.status(500).json({
        error: uploadData?.message || "Error al subir archivo a Backblaze.",
      });
    }

    const publicBaseUrl = getPublicBaseUrl(bucketName, endpoint);
    const publicUrl = `${publicBaseUrl}/${finalFileName}`;

    return res.status(200).json({
      url: publicUrl,
      fileName: finalFileName,
      fileId: uploadData.fileId,
    });
  } catch (error) {
    console.error("B2 upload error:", error);
    return res.status(500).json({
      error: error?.message || "Error interno subiendo a Backblaze.",
    });
  }
}
