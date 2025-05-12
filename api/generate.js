export default async function handler(req, res) {
  try {
    const { prompt } = req.body;
    const replicateToken = process.env.REPLICATE_API_TOKEN;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "bb16dff7d0fa5746ddf94b7a10401d2c9a8b4a963b71de00b7092e9ee2eb9b66",  // pixverse-v4 的固定 version hash
        input: {
          prompt: prompt,
          quality: "1080p"
        }
      })
    });

    const prediction = await response.json();
    const videoUrl = prediction.output?.[0];

    if (!videoUrl) {
      return res.status(500).send("Replicate API 沒有正確回傳影片 URL");
    }

    const videoRes = await fetch(videoUrl);
    const buffer = await videoRes.arrayBuffer();
    res.setHeader("Content-Type", "video/mp4");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("API 調用錯誤：", err);
    res.status(500).send("伺服器錯誤：" + err.message);
  }
}
