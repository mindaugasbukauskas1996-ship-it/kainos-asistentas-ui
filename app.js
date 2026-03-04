const btn = document.getElementById("btn");
const out = document.getElementById("out");

btn.addEventListener("click", async () => {
  const text = document.getElementById("text").value.trim();
  const address = document.getElementById("address").value.trim();

  out.textContent = "Dar neprijungta prie API. Įvedei:\n\n" + JSON.stringify({ text, address }, null, 2);
});