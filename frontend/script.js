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

let usage = 0;

function updateLanguageOptions() {
  const isPro = document.getElementById("proToggle").checked;
  const langSelect = document.getElementById("langSelect");
  const options = [
    { value: "zh-tw", label: "中文（台灣）" },
    { value: "en", label: "English" },
    { value: "ja", label: "日本語" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "ko", label: "한국어" },
    { value: "es", label: "Español" },
    { value: "hi", label: "Hindi" },
    { value: "id", label: "Bahasa Indonesia" },
    { value: "vi", label: "Tiếng Việt" }
  ];
  langSelect.innerHTML = "";
  options.forEach(opt => {
    if (isPro || ["zh-tw", "en", "ja"].includes(opt.value)) {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      langSelect.appendChild(el);
    }
  });
  if (langSelect.options.length > 0) {
    langSelect.value = langSelect.options[0].value;
  }

  document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
}

document.getElementById("proToggle").addEventListener("change", updateLanguageOptions);

document.addEventListener("DOMContentLoaded", () => {
  usage = getUsage();
  if (isNaN(usage)) {
    usage = 0;
    setUsage(usage);
  }
  updateLanguageOptions();
});

async function generateSpeech() {
  const button = document.querySelector("button");
  button.disabled = true;

  const text = document.getElementById("textInput").value.trim();
  const lang = document.getElementById("langSelect").value;
  const isPro = document.getElementById("proToggle").checked;

  if (!text) {
    alert("請輸入文字後再產生語音");
    button.disabled = false;
    return;
  }

  usage = getUsage();
  if (isNaN(usage)) {
    usage = 0;
    setUsage(usage);
  }

  const freeLangs = ["en", "zh-tw", "ja"];
  if (!isPro) {
    if (usage >= MAX_USES) {
      alert("今日免費額度已用完，請升級帳號。");
      button.disabled = false;
      return;
    }
    if (!freeLangs.includes(lang)) {
      alert("免費版僅支援 English、中文（台灣）、Japanese");
      button.disabled = false;
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
  audio.onended = () => URL.revokeObjectURL(url);
  button.disabled = false;

  if (!isPro) {
    usage++;
    setUsage(usage);
    usage = getUsage();
    document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
  }
}
