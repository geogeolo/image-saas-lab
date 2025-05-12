const MAX_USES_PER_DAY = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;
let usage = parseInt(localStorage.getItem(todayKey) || "0");
let promptHistory = JSON.parse(localStorage.getItem("promptHistory") || "[]");

async function handleGenerate() {
  try {
    const isPro = document.getElementById("proToggle").checked;
    const prompt = document.getElementById("prompt").value;
    document.getElementById("message").innerText = "生成中...";

    if (!isPro && usage >= MAX_USES_PER_DAY) {
      document.getElementById("message").innerText = "今日已達免費生成上限，請升級或明天再試。";
      return;
    }

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`伺服器回應錯誤：${res.status} ${errorText}`);
    }

    const blob = await res.blob();
    displayImage(blob, !isPro);

    if (!isPro) {
      usage++;
      localStorage.setItem(todayKey, usage);
    }

    promptHistory.unshift(prompt);
    localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
    renderHistory();
  } catch (err) {
    document.getElementById("message").innerText = `發生錯誤：${err.message}`;
    console.error("handleGenerate() 錯誤：", err);
  }
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
    document.getElementById("result-image").src = canvas.toDataURL();
  };
  img.src = URL.createObjectURL(blob);
}
