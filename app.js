const API_URL = "https://kainos-asistentas-api.onrender.com/estimate";

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const addressEl = document.getElementById("address");
const suggestionsEl = document.getElementById("suggestions");

let history = []; // [{role, content}]

function addMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;
  wrap.innerHTML = `<div class="bubble">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setSuggestions(items) {
  suggestionsEl.innerHTML = "";
  if (!items || !items.length) return;

  items.slice(0, 6).forEach((it) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggestion";
    btn.textContent = it.title || it.example || "Pasiūlymas";
    btn.onclick = () => {
      inputEl.value = it.example || it.title || "";
      inputEl.focus();
    };
    suggestionsEl.appendChild(btn);
  });
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendToApi(text, address) {
  const payload = {
    text,
    address: address || "",
    history: history.slice(-20), // paskutinės žinutės
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`API klaida: ${res.status} ${t}`);
  }

  return await res.json();
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = inputEl.value.trim();
  const address = (addressEl?.value || "").trim();
  if (!text) return;

  // KA žinutė
  addMessage("user", text);
  history.push({ role: "user", content: text });

  inputEl.value = "";
  setSuggestions([]);

  try {
    const data = await sendToApi(text, address);

    const reply = data.reply_text || data.message || JSON.stringify(data, null, 2);
    addMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });

    setSuggestions(data.suggestions || []);
  } catch (err) {
    addMessage("assistant", `Nepavyko susisiekti su API: ${err.message}`);
  }
});

// Pirmas AI pasisveikinimas
addMessage(
  "assistant",
  "Parašyk užklausą (pvz. „Reikia sandarinti tarplokinę siūlę fasade“). Jei trūks info – paklausiu kiekio."
);
