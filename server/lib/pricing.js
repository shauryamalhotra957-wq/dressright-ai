"use strict";

const SERVICE_LEVELS = {
  ai: {
    label: "AI capsule",
    fee: 29,
    description: "Machine-generated capsule plan with automated fit checks."
  },
  hybrid: {
    label: "AI + stylist review",
    fee: 79,
    description: "Machine recommendation reviewed by a human stylist before purchase."
  },
  concierge: {
    label: "Concierge buyout",
    fee: 149,
    description: "Human stylist verifies sizes, swaps, and delivery timing."
  }
};

function calculateCapsulePrice(items, serviceMode = "hybrid", options = {}) {
  const level = SERVICE_LEVELS[serviceMode] || SERVICE_LEVELS.hybrid;
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const alterationsReserve = options.includeAlterations === false ? 0 : Math.round(subtotal * 0.07);
  const stylingFee = level.fee;
  const shipping = subtotal >= 500 ? 0 : 18;
  const taxEstimate = Math.round((subtotal + stylingFee) * 0.0825);
  const total = subtotal + stylingFee + alterationsReserve + shipping + taxEstimate;

  return {
    service: level,
    currency: "USD",
    subtotal,
    stylingFee,
    alterationsReserve,
    shipping,
    taxEstimate,
    total,
    lines: [
      { label: "Clothes", amount: subtotal },
      { label: level.label, amount: stylingFee },
      { label: "Alterations reserve", amount: alterationsReserve },
      { label: "Shipping", amount: shipping },
      { label: "Estimated tax", amount: taxEstimate }
    ]
  };
}

module.exports = {
  SERVICE_LEVELS,
  calculateCapsulePrice
};
