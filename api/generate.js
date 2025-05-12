export default async function handler(req, res) {
  try {
    const { prompt } = req.body;
    const response = await fetch("https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      throw new Error(`HuggingFace 回應錯誤：${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("後端錯誤：", err);
    res.status(500).send("伺服器錯誤：" + err.message);
  }
}
