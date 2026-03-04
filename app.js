
const btn = document.getElementById("btn");
const out = document.getElementById("out");
const quick = document.getElementById("quick");

const API = "https://kainos-asistentas-api.onrender.com/estimate";

function eur(x) {
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(x);
}

function setQuickButtons(buttons, onClick) {
  quick.innerHTML = "";
  buttons.forEach(b => {
    const el = document.createElement("button");
    el.type = "button";
    el.textContent = b.label;
    el.addEventListener("click", () => onClick(b.appendText));
    quick.appendChild(el);
  });
}

function clearQuickButtons() {
  quick.innerHTML = "";
}

async function callApi(text, address) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, address })
  });
  return await r.json();
}

btn.addEventListener("click", async () => {
  const textEl = document.getElementById("text");
  const addressEl = document.getElementById("address");

  const text = textEl.value.trim();
  const address = addressEl.value.trim();

  if (!text) {
    out.textContent = "Įrašykite darbų aprašymą.";
    return;
  }

  out.textContent = "Skaičiuoju...";
  clearQuickButtons();

  try {
    const data = await callApi(text, address || null);

    if (data.status === "need_more_info") {
      out.textContent =
        `Reikia patikslinimo (darbas: ${data.work_type_guess}):\n\n` +
        (data.questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");

      const qs = (data.questions || []).join(" ").toLowerCase();
      const buttons = [];

      if (qs.includes("trišaki")) {
        buttons.push(
          { label: "Trišakis: taip", appendText: " su trišakiu" },
          { label: "Trišakis: ne", appendText: " be trišakio" }
        );
      }
      if (qs.includes("metr") || qs.includes("m)")) {
        buttons.push(
          { label: "+ 1 m", appendText: " 1 m" },
          { label: "+ 5 m", appendText: " 5 m" },
          { label: "+ 10 m", appendText: " 10 m" }
        );
      }
      if (qs.includes("m²") || qs.includes("m2")) {
        buttons.push(
          { label: "+ 5 m²", appendText: " 5 m2" },
          { label: "+ 10 m²", appendText: " 10 m2" },
          { label: "+ 20 m²", appendText: " 20 m2" }
        );
      }
      if (qs.includes("aukšt")) {
        buttons.push(
          { label: "+ 1 aukštas", appendText: " 1 aukštas" },
          { label: "+ 2 aukštai", appendText: " 2 aukštai" },
          { label: "+ 3 aukštai", appendText: " 3 aukštai" }
        );
      }
      if (qs.includes("vnt")) {
        buttons.push(
          { label: "+ 1 vnt", appendText: " 1 vnt" },
          { label: "+ 2 vnt", appendText: " 2 vnt" },
          { label: "+ 5 vnt", appendText: " 5 vnt" }
        );
      }

      if (buttons.length) {
        setQuickButtons(buttons, (append) => {
          textEl.value = (textEl.value.trim() + " " + append).trim();
          btn.click();
        });
      }

      return;
    }

    if (data.status === "no_price_model") {
      out.textContent = `Negaliu apskaičiuoti kainos.\n\n${data.message || ""}`;
      return;
    }

    clearQuickButtons();

    let s =
      `Atpažintas darbas: ${data.work_type}\n` +
      `Kiekis: ${data.qty} ${data.unit}\n` +
      (data.trisakis_add ? `Trišakis: +${eur(data.trisakis_add)}\n` : "") +
      `\nPreliminari kaina (be PVM): ${eur(data.estimate_eur_be_pvm)}\n` +
      `Intervalas (be PVM): ${eur(data.range_eur_be_pvm[0])} – ${eur(data.range_eur_be_pvm[1])}\n`;

    if (data.analogs && data.analogs.length) {
      s += `\nAnalogai (iš istorijos):\n`;
      data.analogs.forEach((a, i) => {
        s += `${i + 1}) ${a.title || ""} | ${a.qty} ${a.unit} | ${eur(a.cost_be_pvm)} | ${a.contractor || ""}\n`;
      });
    }

    out.textContent = s;

  } catch (err) {
    out.textContent = "Nepavyko susisiekti su serveriu: " + err.message;
  }
});
