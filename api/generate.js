import Replicate from "replicate";

export default async function handler(req, res) {
  const { prompt } = req.body;
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const output = await replicate.run("pixverse/pixverse-v4", {
    input: {
      prompt: prompt,
      quality: "1080p"
    }
  });

  const response = await fetch(output);
  const buffer = await response.arrayBuffer();
  res.setHeader("Content-Type", "video/mp4");
  res.send(Buffer.from(buffer));
}
