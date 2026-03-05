// ===== Config =====
const API = "https://kainos-asistentas-api.onrender.com/estimate";

// ===== DOM =====
const elText = document.getElementById("text");
const elAddress = document.getElementById("address");
const elBtn = document.getElementById("btn");
const elOut = document.getElementById("out");
const elQuick = document.getElementById("quick");

// ===== Chat state =====
const history = []; // {role:"user"|"assistant", content:"..."}

function eur(x) {
  if (x === null || x === undefined || x === "") return "";
  const n = Number(x);
  if (Number.isNaN(n)) return String(x);
  return `${n.toFixed(2)} €`;
}

function renderChat() {
  let s = "";
  for (const m of history) {
    const who = m.role === "user" ? "KA" : "AI";
    s += `${who}: ${m.content}\n\n`;
  }
  elOut.textContent = s.trim();
}

function setQuickButtons(buttons) {
  elQuick.innerHTML = "";
  if (!buttons || !buttons.length) return;

  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = b.title || b;
    btn.onclick = () => {
      // įdedam į tekstą pasiūlymą (KA gali pridėti kiekį)
      elText.value = b.title || String(b);
      elText.focus();
    };
    elQuick.appendChild(btn);
  }
}

function formatAnalogs(analogs) {
  if (!analogs || !analogs.length) return "";
  let s = "Analogai (iš istorijos):\n";
  for (let i = 0; i < analogs.length; i++) {
    const a = analogs[i];
    const reg = a.registration_nr ? a.registration_nr : "";
    const title = a.title || "";
    const qty = (a.qty !== null && a.qty !== undefined && a.qty !== "") ? a.qty : "";
    const unit = a.unit ? a.unit : "";
    const cost = eur(a.cost_be_pvm);
    const contractor = a.contractor || "";
    s += `${i + 1}) ${reg} | ${title} | ${qty} ${unit} | ${cost} | ${contractor}\n`;
  }
  return s.trim();
}

async function sendMessage(text, address) {
  // push user message
  history.push({ role: "user", content: text });
  renderChat();
  setQuickButtons([]);

  const body = {
    text,
    address: address || "",
    history: history.map(m => ({ role: m.role, content: m.content })),
  };

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const t = await res.text();
      history.push({ role: "assistant", content: `Klaida iš API: ${res.status}\n${t}` });
      renderChat();
      return;
    }

    const data = await res.json();

    // build assistant message
    let msg = "";

    if (data.status === "need_more_info") {
      msg += `Reikia patikslinimo (darbas: ${data.work_type_guess || "UNKNOWN"}):\n`;
      if (data.questions && data.questions.length) {
        for (let i = 0; i < data.questions.length; i++) {
          msg += `${i + 1}. ${data.questions[i]}\n`;
        }
      } else {
        msg += "Prašau patikslinti kiekį/vienetą.\n";
      }

      // suggestions -> quick buttons
      if (data.suggestions && data.suggestions.length) {
        setQuickButtons(data.suggestions);
      } else {
        setQuickButtons([]);
      }

      if (data.analogs && data.analogs.length) {
        msg += "\n" + formatAnalogs(data.analogs) + "\n";
      }
    } else if (data.status === "ok") {
      msg += `Atpažintas darbas: ${data.work_type || "UNKNOWN"}\n`;
      msg += `Kiekis: ${data.qty} ${data.unit}\n\n`;
      msg += `Preliminari kaina (be PVM): ${eur(data.estimate_eur_be_pvm)}\n`;
      if (data.range_eur_be_pvm && data.range_eur_be_pvm.length === 2) {
        msg += `Intervalas (be PVM): ${eur(data.range_eur_be_pvm[0])} – ${eur(data.range_eur_be_pvm[1])}\n`;
      }
      if (data.meta) {
        msg += `\nVieneto kaina (mediana): ${eur(data.meta.unit_price_median)} / ${data.unit}\n`;
        msg += `Analogų panaudota: ${data.meta.used_analogs}\n`;
      }
      if (data.analogs && data.analogs.length) {
        msg += "\n" + formatAnalogs(data.analogs) + "\n";
      }
      setQuickButtons([]);
    } else {
      msg += data.message || "Negaliu apskaičiuoti kainos. Reikia rangovo pasiūlymo arba tikslesnio darbo tipo.\n";
      if (data.analogs && data.analogs.length) {
        msg += "\n" + formatAnalogs(data.analogs) + "\n";
      }
      setQuickButtons([]);
    }

    history.push({ role: "assistant", content: msg.trim() });
    renderChat();
  } catch (e) {
    history.push({ role: "assistant", content: `Nepavyko susisiekti su API: ${e}` });
    renderChat();
  }
}

elBtn.addEventListener("click", () => {
  const text = (elText.value || "").trim();
  const address = (elAddress.value || "").trim();
  if (!text) return;
  sendMessage(text, address);
});

// Ctrl+Enter -> siųsti
elText.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    elBtn.click();
  }
});

// start message
history.push({
  role: "assistant",
  content:
    "Parašyk užklausą (pvz. „Reikia sandarinti tarplokinę siūlę fasade“). Jei trūks info – paklausiu kiekio/vieneto.",
});
renderChat();
