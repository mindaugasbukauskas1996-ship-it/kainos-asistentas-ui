const btn = document.getElementById("btn");
const out = document.getElementById("out");

const API = "https://kainos-asistentas-api.onrender.com/estimate";

function eur(x) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR"
  }).format(x);
}

btn.addEventListener("click", async () => {

  const text = document.getElementById("text").value;
  const address = document.getElementById("address").value;

  if (!text) {
    out.textContent = "Įrašykite darbų aprašymą.";
    return;
  }

  out.textContent = "Skaičiuoju...";

  try {

    const r = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        address: address
      })
    });

    const data = await r.json();

    if (data.status === "need_more_info") {

      out.textContent =
        "Reikia patikslinimo:\n\n" +
        data.questions.map((q, i) => (i + 1) + ". " + q).join("\n");

      return;
    }

    if (data.status === "no_price_model") {

      out.textContent =
        "Negaliu apskaičiuoti kainos.\n\n" +
        data.message;

      return;
    }

    out.textContent =
      "Atpažintas darbas: " + data.work_type + "\n" +
      "Kiekis: " + data.qty + " " + data.unit + "\n\n" +
      "Preliminari kaina: " + eur(data.estimate_eur_be_pvm) + "\n" +
      "Intervalas: " + eur(data.range_eur_be_pvm[0]) +
      " – " + eur(data.range_eur_be_pvm[1]);

  } catch (err) {

    out.textContent = "Nepavyko susisiekti su serveriu.";

  }

});
