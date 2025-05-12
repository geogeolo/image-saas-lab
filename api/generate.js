import Replicate from "replicate";

export default async function handler(req, res) {
  try {
    const { prompt } = req.body;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run("pixverse/pixverse-v4", {
      input: {
        prompt: prompt,
        quality: "1080p"
      }
    });

    const videoUrl = Array.isArray(output) ? output[0] : output;
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Fetch video failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "video/mp4");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("generate.js error:", err);
    res.status(500).send("伺服器錯誤：" + err.message);
  }
}
