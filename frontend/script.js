const MAX_USES = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;

let usage = getUsage();
let lastSpeechURL = null;  // 儲存語音 blob 的下載連結

function getUsage() {
  const raw = localStorage.getItem(todayKey);
  const parsed = parseInt(raw);
  if (isNaN(parsed)) {
    localStorage.setItem(todayKey, "0");
    return 0;
  }
  return parsed;
}

function setUsage(val) {
  localStorage.setItem(todayKey, val);
}

function resetUsage() {
  setUsage(0);
  usage = getUsage();
  updateUsageDisplay();
  alert("已重設今日使用次數！");
}

function updateUsageDisplay() {
  const usageDisplay = document.getElementById("usageDisplay");
  if (document.getElementById("proToggle").checked) {
    usageDisplay.style.display = "none";
  } else {
    usageDisplay.style.display = "block";
    usageDisplay.innerText = `目前使用次數：${usage}/${MAX_USES}`;
  }
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

  langSelect.value = "zh-tw";
  updateUsageDisplay();
}

async function generateSpeech() {
  const button = document.querySelector("button");
  button.disabled = true;

  const text = document.getElementById("textInput").value.trim();
  const lang = document.getElementById("langSelect").value;
  const isPro = document.getElementById("proToggle").checked;
  const slow = document.getElementById("slowRead").checked;

  console.log("[DEBUG] text:", text);
  console.log("[DEBUG] lang:", lang);
  console.log("[DEBUG] slow:", slow);
  console.log("[DEBUG] isPro:", isPro);

  if (!text) {
    alert("請輸入文字");
    button.disabled = false;
    return;
  }

  if (!isPro) {
    usage = getUsage();
    if (usage >= MAX_USES) {
      alert("今日免費額度已用完，請升級帳號。");
      button.disabled = false;
      return;
    }
    if (!["zh-tw", "en", "ja"].includes(lang)) {
      alert("免費版僅支援 English、中文（台灣）、日本語");
      button.disabled = false;
      return;
    }
  }

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang, slow })
    });

    if (!res.ok) {
      alert("語音合成失敗");
      button.disabled = false;
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    lastSpeechURL = url;

    const audio = new Audio(url);
    audio.play();

    if (!isPro) {
      usage++;
      setUsage(usage);
      updateUsageDisplay();
    }
  } catch (err) {
    console.error("[ERROR] 語音請求失敗:", err);
    alert("發生錯誤，請稍後再試");
  }

  button.disabled = false;
}

function downloadSpeech() {
  if (!lastSpeechURL) {
    alert("請先產生語音");
    return;
  }

  const lang = document.getElementById("langSelect").value;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `tts_${lang}_${timestamp}.mp3`;

  const link = document.createElement("a");
  link.href = lastSpeechURL;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener("DOMContentLoaded", () => {
  updateLanguageOptions();
  updateUsageDisplay();
  document.getElementById("proToggle").addEventListener("change", updateLanguageOptions);
});
