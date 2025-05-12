const MAX_USES_PER_DAY = 5;
const todayKey = `usage-${new Date().toISOString().split('T')[0]}`;
let usage = parseInt(localStorage.getItem(todayKey) || "0");
let promptHistory = JSON.parse(localStorage.getItem("promptHistory") || "[]");

async function handleGenerate() {
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
  const blob = await res.blob();
  displayImage(blob, !isPro);

  if (!isPro) {
    usage++;
    localStorage.setItem(todayKey, usage);
  }

  promptHistory.unshift(prompt);
  localStorage.setItem("promptHistory", JSON.stringify(promptHistory));
  renderHistory();
