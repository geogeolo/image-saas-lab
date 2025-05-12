export default async function handler(req, res) {
  const { prompt } = req.body;
  const hf_token = process.env.HUGGINGFACE_TOKEN;

  const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hf_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  });

  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  res.setHeader("Content-Type", "image/png");
  res.send(Buffer.from(buffer));
}
