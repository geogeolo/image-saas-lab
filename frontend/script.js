const MAX_USES = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;
function getUsage() {
  let raw = localStorage.getItem(todayKey);
  if (raw === null || isNaN(parseInt(raw))) {
    localStorage.setItem(todayKey, "0");
    return 0;
  }
  return parseInt(raw);
}
function setUsage(val) {
  localStorage.setItem(todayKey, val);
}
let usage = getUsage();
if (isNaN(usage)) {
  usage = 0;
  setUsage(usage);
}
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
    button.disabled = false;
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  button.disabled = false;

  if (!isPro) {
    usage++;
    setUsage(usage);
    usage = getUsage();
document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
  }
}
