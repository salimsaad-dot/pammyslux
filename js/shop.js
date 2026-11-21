// Pammy's Lux · the shop page: products, bag, and the WhatsApp order.
import { getProducts, CATEGORIES, SHOP, LIVE, money, fromPrice, categoryLabel, isNew } from "./store.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const wa = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

let products = [];
let filter = "all";

/* ---------- Photos fade in once loaded ---------- */
function fadeIn(root = document) {
  root.querySelectorAll("img.fade-img:not(.loaded)").forEach((img) => {
    const show = () => img.classList.add("loaded");
    if (img.complete) show();
    else { img.addEventListener("load", show, { once: true }); img.addEventListener("error", show, { once: true }); }
  });
}

/* ---------- Bag (saved in this browser) ---------- */
const BAG_KEY = "pammy-bag-v1";
let bag = [];
try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch {} };

/** Bag lines joined to current products; drops lines whose product or size no longer exists. */
function bagLines() {
  return bag.map((l, i) => {
    const p = products.find((x) => x.id === l.pid);
    const o = p?.options.find((x) => x.label === l.option);
    return p && o && !p.soldOut ? { ...l, i, p, price: Number(o.price) } : null;
  }).filter(Boolean);
}
const bagTotal = () => bagLines().reduce((s, l) => s + l.price * l.qty, 0);

function addToBag(pid, option, choice, qty) {
  const same = bag.find((l) => l.pid === pid && l.option === option && l.choice === choice);
  if (same) same.qty = Math.min(20, same.qty + qty);
  else bag.push({ pid, option, choice, qty });
  saveBag(); renderBag();
}

/* ---------- Product grid ---------- */
function renderChips() {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));
  const cats = [{ id: "all", label: "All" }, ...CATEGORIES.filter((c) => counts[c.id])];
  $("chips").innerHTML = cats.map((c) =>
    `<button type="button" role="tab" class="chip" data-cat="${c.id}" aria-selected="${c.id === filter}">${esc(c.label)}</button>`).join("");
}

function card(p) {
  const multi = p.options.length > 1;
  return `<article class="card${p.soldOut ? " is-sold" : ""}">
    <button type="button" class="card-btn" data-open="${esc(p.id)}" aria-label="${esc(p.name)}, ${multi ? "from " : ""}${money(fromPrice(p))}${p.soldOut ? ", sold out" : ""}">
      <span class="card-img"><img class="fade-img" src="${esc(p.photo)}" alt="" loading="lazy">
        ${p.soldOut ? '<span class="tag tag-sold">Sold out</span>' : isNew(p) ? '<span class="tag">New</span>' : ""}</span>
      <span class="card-cat">${esc(categoryLabel(p.category))}</span>
      <span class="card-name">${esc(p.name)}</span>
      <span class="card-price">${multi ? "<small>from</small> " : ""}${money(fromPrice(p))}</span>
    </button>
  </article>`;
}

function renderGrid() {
  const list = filter === "all" ? products : products.filter((p) => p.category === filter);
  $("grid").innerHTML = list.length ? list.map(card).join("") : `<p class="loading">No products here yet.</p>`;
  $("shopCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  fadeIn($("grid"));
}

/* ---------- Product sheet ---------- */
const sheet = $("productSheet");
let current = null, qty = 1;

function pills(name, values, labels) {
  return values.map((v, i) => `<label class="pill"><input type="radio" name="${name}" value="${esc(v)}"${i === 0 ? " checked" : ""}><span>${labels ? labels[i] : esc(v)}</span></label>`).join("");
}
function chosenOption() {
  const v = sheet.querySelector("input[name=size]:checked")?.value;
  return current.options.find((o) => o.label === v) || current.options[0];
}
function updateTotal() {
  $("pQty").textContent = qty;
  $("pTotal").textContent = money(chosenOption().price * qty);
}

function openProduct(id) {
  current = products.find((p) => p.id === id);
  if (!current) return;
  qty = 1;
  $("pImg").src = current.photo; $("pImg").alt = current.name;
  $("pCat").textContent = categoryLabel(current.category);
  $("pName").textContent = current.name;
  $("pDesc").textContent = current.description;
  $("pDesc").hidden = !current.description;
  $("pSizeList").innerHTML = pills("size", current.options.map((o) => o.label),
    current.options.map((o) => `${esc(o.label)} <small>${money(o.price)}</small>`));
  $("pSizes").hidden = current.options.length === 1 && !current.options[0].label;
  $("pChoices").hidden = !current.choices.length;
  $("pChoiceTitle").textContent = current.choiceTitle || "Scent";
  $("pChoiceList").innerHTML = pills("choice", current.choices);
  $("pBuy").hidden = current.soldOut;
  $("pSold").hidden = !current.soldOut;
  $("pAskWa").href = wa(`Hello ${SHOP.name}! Is the ${current.name} back in stock?`);
  updateTotal();
  sheet.showModal();
  sheet.querySelector(".sheet-in").scrollTop = 0;
}

sheet.addEventListener("change", (e) => { if (e.target.name === "size") updateTotal(); });
sheet.addEventListener("click", (e) => {
  const q = e.target.closest("[data-q]");
  if (q) { qty = Math.max(1, Math.min(20, qty + Number(q.dataset.q))); updateTotal(); }
  if (e.target === sheet) sheet.close(); // tap outside
});
$("pAdd").addEventListener("click", () => {
  const choice = sheet.querySelector("input[name=choice]:checked")?.value || "";
  addToBag(current.id, chosenOption().label, current.choices.length ? choice : "", qty);
  sheet.close();
  toast(`Added to your bag: ${current.name}`);
});

/* ---------- Bag drawer ---------- */
const drawer = $("bag");
function renderBag() {
  const lines = bagLines();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  $("bagCount").textContent = count;
  $("bagCount").hidden = !count;
  $("bagBtn").setAttribute("aria-label", `Open your bag, ${count} item${count === 1 ? "" : "s"}`);
  $("floatBag").hidden = !count;
  $("floatTotal").textContent = money(bagTotal());
  $("bagEmpty").hidden = !!lines.length;
  $("checkout").hidden = !lines.length || !$("sent").hidden;
  $("bagList").innerHTML = lines.map((l) => `
    <li class="line">
      <img src="${esc(l.p.photo)}" alt="">
      <div class="line-info">
        <b>${esc(l.p.name)}</b>
        <span>${esc([l.option, l.choice].filter(Boolean).join(" · "))}</span>
        <span class="line-price">${money(l.price * l.qty)}</span>
      </div>
      <div class="qty small-qty">
        <button type="button" data-line="${l.i}" data-d="-1" aria-label="One less ${esc(l.p.name)}">${l.qty === 1 ? "🗑" : "−"}</button>
        <output>${l.qty}</output>
        <button type="button" data-line="${l.i}" data-d="1" aria-label="One more ${esc(l.p.name)}">+</button>
      </div>
    </li>`).join("");
  $("bagTotal").textContent = money(bagTotal());
}
$("bagList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-line]");
  if (!b) return;
  const line = bag[Number(b.dataset.line)];
  line.qty += Number(b.dataset.d);
  if (line.qty <= 0) bag.splice(bag.indexOf(line), 1);
  line.qty = Math.min(20, line.qty);
  saveBag(); renderBag();
});

const openBag = () => { $("sent").hidden = true; renderBag(); drawer.showModal(); };
$("bagBtn").addEventListener("click", openBag);
$("floatBag").addEventListener("click", openBag);
$("bagClose").addEventListener("click", () => drawer.close());
$("bagShop").addEventListener("click", () => { drawer.close(); $("shop").scrollIntoView(); });
drawer.addEventListener("click", (e) => { if (e.target === drawer) drawer.close(); });

const checkout = $("checkout");
checkout.addEventListener("change", (e) => {
  if (e.target.name === "how") $("areaField").hidden = e.target.value !== "Delivery";
});
checkout.querySelectorAll("input").forEach((el) => el.addEventListener("input", () => {
  el.classList.remove("invalid");
  if (!checkout.querySelector(".invalid")) $("cErr").textContent = "";
}));

/** The WhatsApp message Pammy receives. */
export function orderText(lines, { name, how, area, note }) {
  const out = [`Hello ${SHOP.name}! I'd like to order:`, ""];
  lines.forEach((l, i) => {
    const what = [l.option, l.choice].filter(Boolean).join(", ");
    out.push(`${i + 1}. ${l.p.name}${what ? ` (${what})` : ""} × ${l.qty} = ${money(l.price * l.qty)}`);
  });
  out.push("", `*Items total:* ${money(lines.reduce((s, l) => s + l.price * l.qty, 0))}`);
  out.push(how === "Delivery" ? `*Delivery to:* ${area}` : "*Pick up*");
  out.push(`*Name:* ${name}`);
  if (note) out.push(`*Note:* ${note}`);
  out.push("", how === "Delivery" ? "Please confirm my order, the delivery fee and your MoMo details. Thank you!" : "Please confirm my order, your MoMo details and where to pick up. Thank you!");
  return out.join("\n");
}

checkout.addEventListener("submit", (e) => {
  e.preventDefault();
  const how = checkout.how.value;
  const name = $("cName").value.trim(), area = $("cArea").value.trim(), note = $("cNote").value.trim();
  const missing = [];
  if (!name) missing.push($("cName"));
  if (how === "Delivery" && !area) missing.push($("cArea"));
  if (missing.length) {
    missing.forEach((el) => el.classList.add("invalid"));
    $("cErr").textContent = missing.length === 2 ? "Please add your name and delivery area." :
      missing[0].id === "cName" ? "Please add your name." : "Please add your delivery area.";
    missing[0].focus();
    return;
  }
  $("cErr").textContent = "";
  window.open(wa(orderText(bagLines(), { name, how, area, note })), "_blank", "noopener");
  checkout.hidden = true;
  $("sent").hidden = false;
});
$("clearBag").addEventListener("click", () => { bag = []; saveBag(); checkout.reset(); $("areaField").hidden = false; renderBag(); drawer.close(); toast("Thank you for your order!"); });
$("keepBag").addEventListener("click", () => { $("sent").hidden = true; renderBag(); });

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- Start ---------- */
$("chips").addEventListener("click", (e) => {
  const c = e.target.closest("[data-cat]");
  if (!c) return;
  filter = c.dataset.cat;
  renderChips(); renderGrid();
});
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if (o) openProduct(o.dataset.open);
});

async function load() {
  $("loadErr").hidden = true;
  $("loading")?.removeAttribute("hidden");
  try {
    products = await getProducts();
  } catch {
    $("grid").innerHTML = "";
    $("loadErr").hidden = false;
    return;
  }
  renderChips(); renderGrid(); renderBag();
  const pick = products.find((p) => !p.soldOut);
  if (pick) {
    $("pickImg").src = pick.photo;
    $("pickName").textContent = pick.name;
    $("pickPrice").textContent = `${pick.options.length > 1 ? "from " : ""}${money(fromPrice(pick))}`;
    $("pick").dataset.open = pick.id;
    $("pick").hidden = false;
  }
}
$("retry").addEventListener("click", load);

$("previewStrip").hidden = LIVE;
$("askWa").href = wa(`Hello ${SHOP.name}! I'd like some advice on what to buy.`);
if (SHOP.tiktok) { $("tiktok").href = SHOP.tiktok; $("tiktok").hidden = false; }
$("year").textContent = new Date().getFullYear();
const header = $("header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
fadeIn();
load();
