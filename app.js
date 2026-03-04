const btn = document.getElementById("btn");
const out = document.getElementById("out");

// ĮRAŠYK SAVO RENDER URL (be / gale)
const API_BASE = "https://kainos-asistentas-api.onrender.com";

function fmtEur(x) {
  if (typeof x !== "number") return x;
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(x);
}

btn.addEventListener("click", async () => {
  const text = document.getElementById("text").value.trim();
  const address = document.getElementById("address").value.trim();

  if (!text) {
    out.textContent = "Įveskite užklausą (aprašymą).";
    return;
  }

  out.textContent = "Skaičiuoju...";

  try {
    const res = await fetch(`${API_BASE}/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, address: address || null })
    });

    if (!res.ok) {
      const t = await res.text();
      out.textContent = `API klaida (${res.status}):\n` + t;
      return;
    }

    const data = await res.json();

    if (data.status === "need_more_info") {
      out.textContent =
        `Reikia patikslinimų (darbas: ${data.work_type_guess}):\n\n` +
        data.questions.map((q, i) => `${i + 1}) ${q}`).join("\n");
      return;
    }

    if (data.status === "no_price_model") {
      out.textContent =
        `Negaliu patikimai įvertinti.\n` +
        `Atpažintas darbas: ${data.work_type_guess}\n\n` +
        (data.message || "");
      return;
    }

    // ok
    const est = data.estimate_eur_be_pvm;
    const [low, high] = data.range_eur_be_pvm || [];

    out.textContent =
      `Atpažintas darbas: ${data.work_type}\n` +
      `Kiekis: ${data.qty} ${data.unit}\n` +
      (data.trisakis_add ? `Trišakis: +${fmtEur(data.trisakis_add)}\n` : "") +
      `Koeficientas: ${data.coef}\n\n` +
      `Preliminari kaina (be PVM): ${fmtEur(est)}\n` +
      `Intervalas (be PVM): ${fmtEur(low)} – ${fmtEur(high)}\n\n` +
      `Pastabos:\n` +
      `- vandens tipas: ${data.assumptions?.water_type || "n/a"}\n`;
  } catch (err) {
    out.textContent = "Nepavyko susisiekti su API: " + err.message;
  }
});

