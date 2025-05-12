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
    displayVideo(blob, !isPro);

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

function displayVideo(blob, addWatermark) {
  const video = document.getElementById("result-video");
  const url = URL.createObjectURL(blob);
  video.src = url;
  video.style.display = "block";
  video.autoplay = true;
  video.controls = true;

  if (addWatermark) {
    const overlay = document.createElement("div");
    overlay.innerText = "Free Version";
    overlay.style.position = "absolute";
    overlay.style.bottom = "10px";
    overlay.style.left = "10px";
    overlay.style.background = "rgba(255, 255, 255, 0.7)";
    overlay.style.padding = "4px 8px";
    overlay.style.fontSize = "20px";
    overlay.style.color = "#000";
    overlay.style.borderRadius = "5px";
    overlay.style.zIndex = "1000";
    document.body.appendChild(overlay);
  }

  } catch (err) {
    document.getElementById("message").innerText = `發生錯誤：${err.message}`;
    console.error("handleGenerate() 錯誤：", err);
  }
}
