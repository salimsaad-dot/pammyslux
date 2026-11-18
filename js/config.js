// Pammy's Lux · shop settings
// ------------------------------------------------------------------
// 1) FIREBASE: paste the web-app config from the Firebase console
//    (Project settings → Your apps → Web app → "firebaseConfig").
//    While apiKey is empty the shop runs in PREVIEW MODE: sample products,
//    and changes made on the owner page are saved in that browser only.
//    Backend files (database rules, setup steps) live in ../backend/.
// 2) CLOUDINARY (optional): free photo hosting. Empty = photos are shrunk
//    and stored inside the product itself (fine for a small shop).
// 3) SHOP: WhatsApp number for orders, delivery note, socials.
// ------------------------------------------------------------------

export const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export const CLOUDINARY = {
  cloudName: "",    // e.g. "pammyslux"
  uploadPreset: "", // an UNSIGNED upload preset, limited to the "pammyslux" folder
};

export const SHOP = {
  name: "Pammy's Lux",
  // DEMO: Salim's number, so test orders don't reach Pammy. Going live: Pammy's WhatsApp number.
  whatsapp: "233577428684",
  currency: "GH₵",
  area: "Kasoa",
  tiktok: "", // TODO: Pammy's TikTok link, e.g. https://www.tiktok.com/@handle (empty = hidden)
};

export const CATEGORIES = [
  { id: "lotions", label: "Body lotions" },
  { id: "gels", label: "Shower gels" },
  { id: "scrubs", label: "Body scrubs" },
  { id: "facials", label: "Facials" },
  { id: "perfume-oils", label: "Perfume oils" },
  { id: "body-oils", label: "Body oils" },
];

// ---- Testing only: http://localhost…/?emulator=1 talks to the local Firebase emulator ----
const params = new URLSearchParams(location.search);
export const USE_EMULATOR =
  params.has("emulator") && ["localhost", "127.0.0.1"].includes(location.hostname);
if (USE_EMULATOR) {
  Object.assign(FIREBASE_CONFIG, { apiKey: "demo-key", authDomain: "demo-pammy.firebaseapp.com", projectId: "demo-pammy", appId: "demo" });
}

export const LIVE = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);
