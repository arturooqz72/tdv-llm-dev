import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keyId = process.env.B2_KEY_ID;
    const appKey = process.env.B2_APPLICATION_KEY;
    const bucket = process.env.B2_BUCKET_NAME;
    const endpoint = process.env.B2_ENDPOINT;

    const auth = Buffer.from(`${keyId}:${appKey}`).toString("base64");

    const authResponse = await fetch(
      "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const authData = await authResponse.json();

    const uploadUrlRes = await fetch(
      `${authData.apiUrl}/b2api/v2/b2_get_upload_url`,
      {
        method: "POST",
        headers: {
          Authorization: authData.authorizationToken,
        },
        body: JSON.stringify({
          bucketId: authData.allowed.bucketId,
        }),
      }
    );

    const uploadUrlData = await uploadUrlRes.json();

    const file = req.body;

    const fileName = `upload-${Date.now()}`;

    const sha1 = crypto.createHash("sha1").update(file).digest("hex");

    const uploadRes = await fetch(uploadUrlData.uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadUrlData.authorizationToken,
        "X-Bz-File-Name": encodeURIComponent(fileName),
        "Content-Type": "b2/x-auto",
        "X-Bz-Content-Sha1": sha1,
      },
      body: file,
    });

    const uploadData = await uploadRes.json();

    const fileUrl = `https://f004.backblazeb2.com/file/${bucket}/${fileName}`;

    res.status(200).json({
      url: fileUrl,
      data: uploadData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}
