// Pammy's Lux · owner page: add, edit, sell out, hide and delete products.
import { LIVE, CATEGORIES, getProducts, saveProduct, setFlags, deleteProduct, uploadPhoto, resetPreview,
  onOwner, signIn, signOut, money, fromPrice, categoryLabel } from "./store.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let products = [];
let show = "all";

/* ---------- Toast ---------- */
let tt;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- List ---------- */
const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "sold", label: "Sold out", test: (p) => p.soldOut },
  { id: "hidden", label: "Hidden", test: (p) => p.hidden },
  ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, test: (p) => p.category === c.id })),
];

function render() {
  const sold = products.filter((p) => p.soldOut).length, hidden = products.filter((p) => p.hidden).length;
  $("stats").textContent = `${products.length} product${products.length === 1 ? "" : "s"} · ${sold} sold out · ${hidden} hidden`;
  $("chips").innerHTML = FILTERS.map((f) =>
    `<button type="button" class="chip" role="tab" data-show="${f.id}" aria-selected="${f.id === show}">${esc(f.label)}</button>`).join("");
  const f = FILTERS.find((x) => x.id === show);
  const list = products.filter(f.test);
  $("plist").innerHTML = list.length ? list.map((p) => `
    <li class="prow${p.hidden ? " is-hidden" : ""}">
      <button type="button" class="prow-main" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">
        ${p.photo ? `<img src="${esc(p.photo)}" alt="">` : `<span class="nophoto">No photo</span>`}
        <span class="prow-info">
          <b>${esc(p.name)}</b>
          <span>${esc(categoryLabel(p.category))} · ${p.options.length > 1 ? "from " : ""}${money(fromPrice(p))}</span>
          <span class="badges">${p.soldOut ? '<i class="b-sold">Sold out</i>' : ""}${p.hidden ? '<i class="b-hidden">Hidden</i>' : ""}</span>
        </span>
        <span class="edit-hint" aria-hidden="true">Edit</span>
      </button>
      <div class="prow-tools">
        <label class="switch small"><input type="checkbox" data-flag="soldOut" data-id="${esc(p.id)}"${p.soldOut ? " checked" : ""}><span></span> Sold out</label>
        <label class="switch small"><input type="checkbox" data-flag="show" data-id="${esc(p.id)}"${p.hidden ? "" : " checked"}><span></span> On shop</label>
      </div>
    </li>`).join("") : `<li class="muted empty">Nothing here.</li>`;
}

async function reload() {
  try {
    products = await getProducts({ all: true });
    render();
  } catch {
    $("plist").innerHTML = `<li class="err">Couldn't load your products. Check your internet and refresh.</li>`;
  }
}

$("chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-show]");
  if (c) { show = c.dataset.show; render(); }
});

// Quick switches
$("plist").addEventListener("change", async (e) => {
  const box = e.target.closest("[data-flag]");
  if (!box) return;
  const p = products.find((x) => x.id === box.dataset.id);
  const flags = box.dataset.flag === "soldOut" ? { soldOut: box.checked } : { hidden: !box.checked };
  box.disabled = true;
  try {
    Object.assign(p, await setFlags(p, flags));
    toast(box.dataset.flag === "soldOut" ? (box.checked ? `${p.name} is sold out` : `${p.name} is back in stock`)
      : (box.checked ? `${p.name} is on the shop` : `${p.name} is hidden`));
    render();
  } catch (err) {
    box.checked = !box.checked;
    box.disabled = false;
    toast(err.message || "Couldn't save. Try again.");
  }
});

/* ---------- Editor ---------- */
const ed = $("editor");
let editing = null; // product being edited (null = new)
let photo = "";
let choices = [];

$("edCat").innerHTML = `<option value="">Choose…</option>` + CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join("");

function optionRow(o = { label: "", price: "" }) {
  const row = document.createElement("div");
  row.className = "opt-row";
  row.innerHTML = `
    <label class="field">Size<input class="o-label" maxlength="30" placeholder="250ml" value="${esc(o.label)}"></label>
    <label class="field">Price (GH₵)<input class="o-price" type="number" inputmode="decimal" min="0" step="0.5" placeholder="80" value="${esc(o.price)}"></label>
    <button type="button" class="o-del" aria-label="Remove this size">×</button>`;
  $("edOptions").append(row);
  return row;
}
$("addOption").addEventListener("click", () => optionRow().querySelector("input").focus());
$("edOptions").addEventListener("click", (e) => {
  if (!e.target.closest(".o-del")) return;
  if ($("edOptions").children.length > 1) e.target.closest(".opt-row").remove();
  else e.target.closest(".opt-row").querySelectorAll("input").forEach((i) => (i.value = ""));
});

function renderChoices() {
  $("edChoices").innerHTML = choices.map((c, i) =>
    `<span class="tag-chip">${esc(c)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(c)}">×</button></span>`).join("");
}
function addChoice() {
  const v = $("edChoiceInput").value.trim();
  if (v && !choices.includes(v)) { choices.push(v); renderChoices(); }
  $("edChoiceInput").value = "";
  $("edChoiceInput").focus();
}
$("addChoice").addEventListener("click", addChoice);
$("edChoiceInput").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addChoice(); } });
$("edChoices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (b) { choices.splice(Number(b.dataset.rm), 1); renderChoices(); }
});

function setPhoto(src) {
  photo = src;
  $("edImg").hidden = !src;
  if (src) $("edImg").src = src;
  $("photoLabel").textContent = src ? "📷 Change photo" : "📷 Add a photo";
}
$("edFile").addEventListener("change", async () => {
  const file = $("edFile").files[0];
  if (!file) return;
  $("photoMsg").textContent = "Getting your photo ready…";
  $("edSave").disabled = true;
  try {
    setPhoto(await uploadPhoto(file));
    $("photoMsg").textContent = "Looks good.";
  } catch (err) {
    $("photoMsg").textContent = err.message;
  } finally {
    $("edSave").disabled = false;
    $("edFile").value = "";
  }
});

function openEditor(p = null) {
  editing = p;
  $("edTitle").textContent = p ? "Edit product" : "Add product";
  $("edName").value = p?.name || "";
  $("edCat").value = p?.category || (CATEGORIES.some((c) => c.id === show) ? show : "");
  $("edDesc").value = p?.description || "";
  $("edOptions").innerHTML = "";
  (p?.options?.length ? p.options : [{ label: "", price: "" }]).forEach(optionRow);
  $("edChoiceTitle").value = p?.choiceTitle || "";
  choices = [...(p?.choices || [])]; renderChoices();
  $("edSold").checked = !!p?.soldOut;
  $("edHidden").checked = !!p?.hidden;
  $("edErr").textContent = "";
  $("photoMsg").textContent = "Take a clear photo on a plain background.";
  setPhoto(p?.photo || "");
  $("edDelete").hidden = !p;
  ed.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  ed.showModal();
  ed.querySelector(".ed-body").scrollTop = 0;
}

$("addBtn").addEventListener("click", () => openEditor());
$("edForm").addEventListener("input", (e) => { e.target.classList.remove("invalid"); $("edErr").textContent = ""; });
$("plist").addEventListener("click", (e) => {
  const b = e.target.closest("[data-edit]");
  if (b) openEditor(products.find((p) => p.id === b.dataset.edit));
});
$("edClose").addEventListener("click", () => ed.close());

$("edForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  ed.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  if ($("edChoiceInput").value.trim()) addChoice(); // typed but forgot to tap Add
  const options = [...$("edOptions").children].map((r) => ({
    label: r.querySelector(".o-label").value, price: r.querySelector(".o-price").value,
  }));
  const draft = {
    ...(editing || {}),
    name: $("edName").value, category: $("edCat").value, description: $("edDesc").value,
    options, choiceTitle: $("edChoiceTitle").value, choices, photo,
    soldOut: $("edSold").checked, hidden: $("edHidden").checked,
  };
  if (!photo) { $("edErr").textContent = "Please add a photo."; $("photoBtn").classList.add("invalid"); return; }
  $("photoBtn").classList.remove("invalid");
  $("edSave").disabled = true; $("edSave").textContent = "Saving…";
  try {
    const saved = await saveProduct(draft);
    ed.close();
    toast(editing ? "Saved" : `${saved.name} is on the shop`);
    await reload();
  } catch (err) {
    $("edErr").textContent = err.message || "Couldn't save. Check your internet and try again.";
    const msg = $("edErr").textContent;
    const target = /name/i.test(msg) ? $("edName") : /category/i.test(msg) ? $("edCat") : /size|price/i.test(msg) ? $("edOptions").querySelector("input") : null;
    target?.classList.add("invalid");
  } finally {
    $("edSave").disabled = false; $("edSave").textContent = "Save";
  }
});

$("edDelete").addEventListener("click", async () => {
  if (!editing || !confirm(`Delete "${editing.name}"? This can't be undone. (To take it off the shop for a while, use "Hide" instead.)`)) return;
  try {
    await deleteProduct(editing.id);
    ed.close();
    toast("Deleted");
    await reload();
  } catch {
    $("edErr").textContent = "Couldn't delete. Check your internet and try again.";
  }
});

/* ---------- Start: preview, or sign-in ---------- */
$("previewStrip").hidden = LIVE;
$("reset").addEventListener("click", async () => {
  if (!confirm("Remove your changes and go back to the starting products?")) return;
  resetPreview(); await reload(); toast("Back to the starting products");
});

$("signinForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("signinErr").textContent = "";
  try { await signIn($("email").value, $("password").value); }
  catch (err) { $("signinErr").textContent = err.message; }
});
$("signOut").addEventListener("click", () => signOut());

onOwner((who) => {
  const ok = who && (who.preview || who.admin);
  $("signin").hidden = !!who;
  $("notAdmin").hidden = !who || ok;
  $("owner").hidden = !ok;
  $("signOut").hidden = !who || who.preview;
  if (ok) reload();
}).catch(() => {
  $("signin").hidden = false;
  $("signinErr").textContent = "Couldn't connect. Check your internet and refresh.";
});
