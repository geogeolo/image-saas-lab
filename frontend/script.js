const MAX_USES = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;
let usage = parseInt(localStorage.getItem(todayKey) || "0");

async function generateSpeech() {
  const text = document.getElementById("textInput").value;
  const lang = document.getElementById("langSelect").value;
  const isPro = document.getElementById("proToggle").checked;

  document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;

  const freeLangs = ["en", "zh-tw", "ja"];
  if (!isPro) {
    if (usage >= MAX_USES) {
      alert("今日免費額度已用完，請升級帳號。");
      return;
    }
    if (!freeLangs.includes(lang)) {
      alert("免費版僅支援 English、中文（台灣）、Japanese");
      return;
    }
  }

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang })
  });

  if (!res.ok) {
    alert("語音合成失敗");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();

  if (!isPro) {
    usage++;
    localStorage.setItem(todayKey, usage);
    document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
  }
}
