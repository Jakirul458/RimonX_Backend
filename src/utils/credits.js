export const CREDIT_COSTS = {
  downloadPdf: 1,
  downloadImage: 1,
  printDocument: 1,
  export: 1,
};

export const FREE_ACTIONS = [
  "open tool",
  "generate document",
  "edit document",
  "preview document",
  "crop image",
  "adjust layout",
];

export function getDefaultPricing() {
  return {
    currency: "points",
    exportRules: [
      {
        action: "Download PDF",
        cost: 1,
      },
      {
        action: "Download Image",
        cost: 1,
      },
      {
        action: "Print Document",
        cost: 1,
      },
    ],
    freeActions: FREE_ACTIONS,
    registrationBonus: 10,
    dailyReward: null,
    expiry: "never",
  };
}
