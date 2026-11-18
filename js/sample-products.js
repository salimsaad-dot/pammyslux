// SAMPLE products for the preview only. Names, prices and photos are made up
// (stock photos from Pexels). Pammy replaces them with her own on the owner page.
const DAY = 864e5;
const now = Date.now();

const raw = [
  { id: "s-shea-lotion", name: "Shea Glow Body Lotion", category: "lotions", photo: "images/lotion-shea.jpg",
    description: "Rich shea and cocoa butter lotion that keeps skin soft all day without feeling greasy.",
    options: [{ label: "250ml", price: 80 }, { label: "500ml", price: 140 }],
    choiceTitle: "Scent", choices: ["Vanilla", "Cocoa", "Unscented"], age: 2 },
  { id: "s-cocoa-lotion", name: "Cocoa Silk Lotion", category: "lotions", photo: "images/lotion-cocoa.jpg",
    description: "A light, fast-absorbing lotion with a warm cocoa scent.",
    options: [{ label: "400ml", price: 120 }], age: 20 },
  { id: "s-honey-gel", name: "Honey Oud Shower Gel", category: "gels", photo: "images/gel-honey.jpg",
    description: "Gentle foaming wash with honey and a soft oud finish.",
    options: [{ label: "300ml", price: 70 }, { label: "500ml", price: 110 }], age: 5 },
  { id: "s-mint-gel", name: "Fresh Mint Shower Gel", category: "gels", photo: "images/gel-mint.jpg",
    description: "Cooling mint wash for hot Kasoa afternoons.",
    options: [{ label: "300ml", price: 65 }], soldOut: true, age: 30 },
  { id: "s-sugar-scrub", name: "Brown Sugar Body Scrub", category: "scrubs", photo: "images/scrub-sugar.jpg",
    description: "Buffs away dry skin and leaves a soft glow. Use 2–3 times a week.",
    options: [{ label: "250g", price: 90 }, { label: "500g", price: 160 }],
    choiceTitle: "Scent", choices: ["Coffee", "Vanilla"], age: 9 },
  { id: "s-honey-scrub", name: "Golden Honey Scrub", category: "scrubs", photo: "images/scrub-honey.jpg",
    description: "Honey and fine sugar scrub, gentle enough for every week.",
    options: [{ label: "250g", price: 95 }], age: 25 },
  { id: "s-glow-serum", name: "Even Tone Face Serum", category: "facials", photo: "images/face-serum.jpg",
    description: "A few drops morning and night for brighter, even-looking skin.",
    options: [{ label: "30ml", price: 120 }], age: 1 },
  { id: "s-clay-mask", name: "Clay Glow Face Mask", category: "facials", photo: "images/face-mask.jpg",
    description: "Weekly clay mask that clears pores and calms oily skin.",
    options: [{ label: "100g", price: 85 }], age: 40 },
  { id: "s-oud-oil", name: "Royal Oud Perfume Oil", category: "perfume-oils", photo: "images/perfume-oud.jpg",
    description: "Long-lasting roll-on perfume oil. A little goes a long way.",
    options: [{ label: "10ml", price: 60 }, { label: "30ml", price: 150 }],
    choiceTitle: "Scent", choices: ["Oud", "Vanilla Musk", "Rose"], age: 3 },
  { id: "s-mini-set", name: "Mini Perfume Oil Set", category: "perfume-oils", photo: "images/perfume-set.jpg",
    description: "Three 10ml roll-ons to try or to give as a gift.",
    options: [{ label: "Set of 3", price: 150 }], age: 35 },
  { id: "s-radiance-oil", name: "Radiance Body Oil", category: "body-oils", photo: "images/oil-radiance.jpg",
    description: "Lightweight oil for a healthy shine. Best on damp skin after a bath.",
    options: [{ label: "100ml", price: 90 }, { label: "200ml", price: 160 }], age: 12 },
  { id: "s-glow-oil", name: "Glow Body Oil", category: "body-oils", photo: "images/oil-glow.jpg",
    description: "Golden oil blend with vitamin E for soft, glowing skin.",
    options: [{ label: "100ml", price: 95 }], age: 50 },
];

export const SAMPLE_PRODUCTS = raw.map(({ age, ...p }) => ({
  description: "", choiceTitle: "", choices: [], soldOut: false, hidden: false,
  ...p,
  createdAt: now - age * DAY,
  sample: true,
}));
