export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keyId = process.env.B2_KEY_ID;
    const applicationKey = process.env.B2_APPLICATION_KEY;
    const bucketName = process.env.B2_BUCKET_NAME;
    const endpoint = process.env.B2_ENDPOINT;
    const publicBaseUrl = process.env.B2_PUBLIC_BASE_URL;

    if (!keyId || !applicationKey || !bucketName) {
      return res.status(500).json({
        error: "Faltan variables de entorno de Backblaze en Vercel.",
      });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { fileName, folder } = body;

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({
        error: "Falta fileName válido.",
      });
    }

    const cleanFileName = fileName
      .trim()
      .replace(/[^\w.\- ]+/g, "")
      .replace(/\s+/g, "-");

    if (!cleanFileName) {
      return res.status(400).json({
        error: "fileName no es válido.",
      });
    }

    const cleanFolder =
      typeof folder === "string" && folder.trim()
        ? folder
            .trim()
            .replace(/^\/+|\/+$/g, "")
            .replace(/[^\w\-\/]+/g, "")
        : "";

    const safeFolder = cleanFolder ? `${cleanFolder}/` : "";
    const finalFileName = `${safeFolder}${Date.now()}-${cleanFileName}`;

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
        error: authData?.message || authData?.code || "No se pudo autorizar con Backblaze.",
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
        error: listBucketsData?.message || listBucketsData?.code || "No se pudo obtener el bucket.",
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
        error: uploadUrlData?.message || uploadUrlData?.code || "No se pudo obtener upload URL.",
      });
    }

    let publicUrl = null;

    if (publicBaseUrl) {
      publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${finalFileName}`;
    } else if (endpoint) {
      publicUrl = `${endpoint.replace(/\/+$/, "")}/file/${bucketName}/${finalFileName}`;
    }

    return res.status(200).json({
      uploadUrl: uploadUrlData.uploadUrl,
      authorizationToken: uploadUrlData.authorizationToken,
      fileName: finalFileName,
      publicUrl,
    });
  } catch (error) {
    console.error("B2 upload init error:", error);
    return res.status(500).json({
      error: error?.message || "Error interno preparando subida a Backblaze.",
    });
  }
}
