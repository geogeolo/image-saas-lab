const MAX_USES_PER_DAY = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;
let usage = parseInt(localStorage.getItem(todayKey) || "0");
let promptHistory = JSON.parse(localStorage.getItem("promptHistory") || "[]");

function handleGenerate() {
  const isPro = document.getElementById("proToggle").checked;
  const prompt = document.getElementById("prompt").value;
  document.getElementById("message").innerText = "生成中...";

  if (!isPro && usage >= MAX_USES_PER_DAY) {
    document.getElementById("message").innerText = "今日已達免費生成上限，請升級或明天再試。";
    return;
  }

  fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
    method: "POST",
    headers: {
      "Authorization": "Bearer hf_xxx",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ inputs: prompt })
  })
  .then(res => res.blob())
  .then(blob => displayImage(blob, !isPro));

  if (!isPro) {
    usage++;
    localStorage.setItem(todayKey, usage);
  }

  // Save prompt history
  promptHistory.unshift(prompt);
  localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
  renderHistory();
}

function displayImage(blob, addWatermark) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    if (addWatermark) {
      ctx.font = "48px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("Free Version", 20, img.height - 50);
    }
    document.getElementById("result").src = canvas.toDataURL();
  };
  img.src = URL.createObjectURL(blob);
}

function renderHistory() {
  const list = document.getElementById("history");
  list.innerHTML = "";
  promptHistory.forEach(p => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.innerText = "重用";
    btn.onclick = () => {
      document.getElementById("prompt").value = p;
    };
    li.innerText = p;
    li.appendChild(btn);
    list.appendChild(li);
  });
}

renderHistory();
