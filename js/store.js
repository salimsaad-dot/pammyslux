// Pammy's Lux · product data (shared by the shop and the owner page)
//
// PREVIEW mode (no Firebase config): sample products; the owner page saves
// changes in this browser's localStorage only, so a visitor never sees them.
// LIVE mode: products live in Firestore `products/{id}`. Anyone can read a
// product that isn't hidden; only logins listed in `admins/{uid}` can write.
// The rules that enforce this are in ../backend/firestore.rules.

import { FIREBASE_CONFIG, CLOUDINARY, LIVE, USE_EMULATOR, CATEGORIES, SHOP } from "./config.js";
import { SAMPLE_PRODUCTS } from "./sample-products.js";

export { LIVE, CATEGORIES, SHOP };

/* ---------- Helpers ---------- */
export const money = (n) => `${SHOP.currency} ${Number(n).toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
export const fromPrice = (p) => Math.min(...p.options.map((o) => Number(o.price)));
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
export const isNew = (p) => Date.now() - (p.createdAt || 0) < 14 * 864e5;
const byNewest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);

/** Tidy a product before saving (also used by tests). Throws Error with a friendly message. */
export function cleanProduct(p) {
  const name = String(p.name || "").trim();
  if (!name) throw new Error("Please give the product a name.");
  if (name.length > 80) throw new Error("Keep the name under 80 letters.");
  if (!CATEGORIES.some((c) => c.id === p.category)) throw new Error("Please pick a category.");
  const options = (p.options || [])
    .map((o) => ({ label: String(o.label || "").trim().slice(0, 30), price: Math.round(Number(o.price) * 100) / 100 }))
    .filter((o) => o.label || o.price);
  if (!options.length) throw new Error("Add at least one size with a price.");
  if (options.some((o) => !o.label)) throw new Error("Each price needs a size or name, e.g. 250ml.");
  if (options.some((o) => !(o.price > 0) || o.price > 100000)) throw new Error("Each size needs a price above 0.");
  if (options.length > 8) throw new Error("Up to 8 sizes per product.");
  const choices = [...new Set((p.choices || []).map((c) => String(c).trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
  return {
    name,
    category: p.category,
    description: String(p.description || "").trim().slice(0, 600),
    options,
    choiceTitle: choices.length ? String(p.choiceTitle || "Scent").trim().slice(0, 20) || "Scent" : "",
    choices,
    photo: String(p.photo || ""),
    soldOut: Boolean(p.soldOut),
    hidden: Boolean(p.hidden),
    createdAt: Number(p.createdAt) || Date.now(),
  };
}

/* ---------- Preview store (localStorage) ---------- */
const KEY = "pammy-preview-v1";
function readPreview() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return structuredClone(SAMPLE_PRODUCTS);
}
function writePreview(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error("This phone's storage is full. Try a smaller photo or reset the preview.");
  }
}
export function resetPreview() {
  try { localStorage.removeItem(KEY); } catch {}
}

/* ---------- Firebase (loaded only when configured) ---------- */
const V = "10.12.2";
let fbPromise, authPromise;
function firebase() {
  fbPromise ??= (async () => {
    const [{ initializeApp }, fs] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    const db = fs.getFirestore(app);
    if (USE_EMULATOR) fs.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    return { app, fs, db };
  })();
  fbPromise.catch(() => (fbPromise = null));
  return fbPromise;
}
function firebaseAuth() {
  authPromise ??= (async () => {
    const [{ app, fs, db }, au] = await Promise.all([
      firebase(),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    ]);
    const auth = au.getAuth(app);
    if (USE_EMULATOR) au.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    return { fs, db, au, auth };
  })();
  authPromise.catch(() => (authPromise = null));
  return authPromise;
}

/* ---------- Products ---------- */
/** Shop: visible products. Owner page: pass { all: true } to include hidden ones. */
export async function getProducts({ all = false } = {}) {
  if (!LIVE) return readPreview().filter((p) => all || !p.hidden).sort(byNewest);
  const { fs, db } = all ? await firebaseAuth() : await firebase();
  const col = fs.collection(db, "products");
  const snap = await fs.getDocs(all ? col : fs.query(col, fs.where("hidden", "==", false)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest);
}

/** Create (no id) or update (with id). Returns the saved product. */
export async function saveProduct(p) {
  const data = cleanProduct(p);
  if (!LIVE) {
    const list = readPreview();
    const id = p.id || `p-${Date.now().toString(36)}`;
    const i = list.findIndex((x) => x.id === id);
    const saved = { ...data, id };
    if (i >= 0) list[i] = saved; else list.push(saved);
    writePreview(list);
    return saved;
  }
  const { fs, db } = await firebaseAuth();
  const ref = p.id ? fs.doc(db, "products", p.id) : fs.doc(fs.collection(db, "products"));
  await fs.setDoc(ref, { ...data, updatedAt: fs.serverTimestamp() });
  return { ...data, id: ref.id };
}

/** Quick switches from the product list (sold out / hidden). */
export async function setFlags(product, flags) {
  return saveProduct({ ...product, ...flags });
}

export async function deleteProduct(id) {
  if (!LIVE) return writePreview(readPreview().filter((p) => p.id !== id));
  const { fs, db } = await firebaseAuth();
  await fs.deleteDoc(fs.doc(db, "products", id));
}

/* ---------- Photos ---------- */
/** Shrink a photo from the phone camera to a JPEG data URL. */
export function shrinkPhoto(file, maxSide = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file isn't a photo we can read. Try a JPG or PNG.")); };
    img.src = url;
  });
}

/** Returns the URL to store on the product. */
export async function uploadPhoto(file) {
  const useCloud = LIVE && CLOUDINARY.cloudName && CLOUDINARY.uploadPreset;
  if (!useCloud) {
    // Stored inside the product: keep it small (preview uses localStorage; Firestore docs max 1MB).
    return shrinkPhoto(file, LIVE ? 800 : 700, LIVE ? 0.75 : 0.72);
  }
  const body = new FormData();
  body.append("file", await shrinkPhoto(file, 1400, 0.85));
  body.append("upload_preset", CLOUDINARY.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) throw new Error("The photo didn't upload. Check your internet and try again.");
  const { secure_url } = await res.json();
  // Ask Cloudinary for a phone-sized, auto-format copy.
  return secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_900/");
}

/* ---------- Owner sign-in (live mode) ---------- */
export async function onOwner(cb) {
  if (!LIVE) return cb({ preview: true });
  const { fs, db, au, auth } = await firebaseAuth();
  au.onAuthStateChanged(auth, async (user) => {
    if (!user) return cb(null);
    let admin = false;
    try { admin = (await fs.getDoc(fs.doc(db, "admins", user.uid))).exists(); } catch {}
    cb({ user, admin });
  });
}
export async function signIn(email, password) {
  const { au, auth } = await firebaseAuth();
  try {
    await au.signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    const bad = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"];
    throw new Error(bad.includes(e.code) ? "Wrong email or password." :
      e.code === "auth/too-many-requests" ? "Too many tries. Wait a few minutes and try again." :
      "Couldn't sign in. Check your internet and try again.");
  }
}
export async function signOut() {
  const { au, auth } = await firebaseAuth();
  await au.signOut(auth);
}

/** Start downloading the database code early. */
export function warmUp() { if (LIVE) firebase().catch(() => {}); }
