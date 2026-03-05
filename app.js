const API = "https://kainos-asistentas-api.onrender.com/estimate";

const textEl = document.getElementById("text");
const addrEl = document.getElementById("address");
const btn = document.getElementById("btn");
const out = document.getElementById("out");
const quick = document.getElementById("quick");

btn.onclick = run;

async function run() {
  const text = textEl.value.trim();
  const address = addrEl.value.trim();

  if (!text) {
    out.textContent = "Įrašyk užklausą.";
    return;
  }

  out.textContent = "Skaičiuoju...";
  quick.innerHTML = "";

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        address
      })
    });

    const data = await res.json();

    render(data);

  } catch (e) {
    out.textContent = "Klaida: " + e.message;
  }
}

function render(data) {

  if (data.reply_text) {
    out.textContent = data.reply_text;
  } else {
    out.textContent = JSON.stringify(data, null, 2);
  }

  if (data.suggestions && data.suggestions.length) {
    quick.innerHTML = "";

    data.suggestions.forEach(s => {

      const b = document.createElement("button");
      b.textContent = s.title || s.example;

      b.onclick = () => {
        textEl.value = s.example || s.title;
        textEl.focus();
      };

      quick.appendChild(b);
    });
  }
}
