// Pammy's real products and prices (from her, 20 Nov 2026), shown while the shop
// runs in preview mode. Photos are hers. Going live: she adds these on the owner page.
const DAY = 864e5;
const now = Date.now();

const raw = [
  { id: "s-prolab-lotion", name: "ProLab Brightening Lotion", category: "lotions", photo: "images/prolab-lotion.jpg",
    description: "Skin tone corrector with alpha arbutin and niacinamide. Daily moisture for brighter, more even-looking skin.",
    options: [{ label: "500ml", price: 120 }], age: 1 },
  { id: "s-kuu-spa-scrub", name: "Kuu Spa Salt Scrub Bath", category: "scrubs", photo: "images/kuu-spa-scrub.jpg",
    description: "Aroma therapy salt scrub and cleanser. Buffs away dry skin in the shower.",
    options: [{ label: "450ml", price: 80 }],
    choiceTitle: "Scent", choices: ["Milk", "Rose"], age: 2 },
  { id: "s-collagen-pads", name: "TWG Collagen Toner Pads", category: "facials", photo: "images/collagen-pads.jpg",
    description: "Toner pads with collagen and hyaluronic acid, for firmer-feeling skin and smaller-looking pores.",
    options: [{ label: "50 pads", price: 80 }], age: 3 },
  { id: "s-turmeric-set", name: "TWG Turmeric Set", category: "lotions", photo: "images/turmeric-set.jpg",
    description: "The TWG turmeric range as pictured: Turmeric Carrot Scrub Body Wash, Turmeric Oil, Kojic Acid Turmeric Face Serum, Turmeric+ Vitamin C Face Cream, 3-in-1 Turmeric + Vitamin C lotion and more.",
    options: [{ label: "Full set", price: 300 }], age: 4 },
  { id: "s-tea-tree-set", name: "TWG Tea Tree Set", category: "facials", photo: "images/tea-tree-set.jpg",
    description: "Amino Acid Cleansing Face Foam (200ml), Acne Control Cream (50g) and Anti Acne Serum (30ml). For oily, acne-prone skin.",
    options: [{ label: "Set of 3", price: 160 }], age: 5 },
];

export const SAMPLE_PRODUCTS = raw.map(({ age, ...p }) => ({
  description: "", choiceTitle: "", choices: [], soldOut: false, hidden: false,
  ...p,
  createdAt: now - age * DAY,
  sample: true,
}));
