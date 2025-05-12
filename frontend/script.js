const MAX_USES = 5;
const USAGE_KEY = 'usage';
const DATE_KEY = 'usageDate';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getUsage() {
  const storedDate = localStorage.getItem(DATE_KEY);
  const today = getTodayDate();

  if (storedDate !== today) {
    localStorage.setItem(DATE_KEY, today);
    localStorage.setItem(USAGE_KEY, '0');
    return 0;
  }

  const raw = localStorage.getItem(USAGE_KEY);
  const usage = parseInt(raw, 10);
  return isNaN(usage) ? 0 : usage;
}

function setUsage(val) {
  localStorage.setItem(USAGE_KEY, val.toString());
}

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

  const usage = getUsage();
  document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
}

document.getElementById("proToggle").addEventListener("change", updateLanguageOptions);

document.addEventListener("DOMContentLoaded", () => {
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

  let usage = getUsage();

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
    document.getElementById("usageDisplay").innerText = `目前使用次數：${usage}/${MAX_USES}`;
  }
}
