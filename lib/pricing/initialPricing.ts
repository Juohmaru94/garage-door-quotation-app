export type MaterialCategory =
  | "ROLLER_CURTAIN"
  | "ROLLER_SHAFT"
  | "GUIDE"
  | "BOX"
  | "TAMPLAS"
  | "STRANTZA"
  | "MOTOR"
  | "ACCESSORY";

export type UnitType = "SQUARE_METER" | "METER" | "ITEM";

export type InitialMaterial = {
  category: MaterialCategory;
  name: string;
  unitType: UnitType;
  costPrice: number;
  sellPrice: number;
};

export type InitialPaintPrice = {
  materialName: string;
  paintCost: number;
  paintSellPrice: number;
};

const rollerRows = [
  ["L110 0.8", 23, 13, 32.2, 18.2],
  ["L110 1.0", 26, 16, 36.4, 22.4],
  ["L110D 0.8", 28, 10, 39.2, 14],
  ["L110D 1.0", 31.3, 13, 43.82, 18.2],
  ["L80 0.8", 26, 16, 36.4, 22.4],
  ["L80 1.0", 30.2, 19, 42.28, 26.6],
  ["L80D 0.8", 32, 12.8, 44.8, 17.92],
  ["L80 D 1.0", 35.2, 16, 49.28, 22.4],
  ["L2IN", 29.6, 16, 41.44, 22.4],
  ["A2IN", 32.4, 10, 45.36, 14],
  ["A80", 58, 10, 81.2, 14],
  ["A100", 108, 16, 151.2, 22.4],
  ["EYEQ", 130, 16, 208, 22.4],
  ["ΜΕΓΑΛΟ ΜΑΤΙ", 22.4, 10, 31.36, 14],
  ["ΜΕΣΑΙΟ ΜΑΤΙ", 28.8, 13, 40.32, 18.2],
  ["ΜΙΚΡΟ ΜΑΤΙ", 44.8, 19, 62.72, 26.6],
] as const;

export const initialMaterials: InitialMaterial[] = [
  ...rollerRows.flatMap(
    ([name, curtainCost, shaftCost, curtainSell, shaftSell]): InitialMaterial[] => [
      {
        category: "ROLLER_CURTAIN",
        name,
        unitType: "SQUARE_METER",
        costPrice: curtainCost,
        sellPrice: curtainSell,
      },
      {
        category: "ROLLER_SHAFT",
        name,
        unitType: "SQUARE_METER",
        costPrice: shaftCost,
        sellPrice: shaftSell,
      },
    ],
  ),
  { category: "GUIDE", name: "ΟΔΗΓΟΙ 7ΕΚ", unitType: "METER", costPrice: 14.4, sellPrice: 20.16 },
  { category: "GUIDE", name: "ΟΔΗΓΟΙ 12ΕΚ", unitType: "METER", costPrice: 21.6, sellPrice: 30.24 },
  { category: "BOX", name: "ΚΟΥΤΙ Π", unitType: "METER", costPrice: 29, sellPrice: 40.6 },
  { category: "BOX", name: "ΚΟΥΤΙ Γ", unitType: "METER", costPrice: 19.2, sellPrice: 26.88 },
  { category: "TAMPLAS", name: "ΤΑΜΠΛΑΣ", unitType: "METER", costPrice: 10, sellPrice: 14 },
  { category: "STRANTZA", name: "ΣΤΡΑΝΤΖΑ 70Χ30", unitType: "METER", costPrice: 8, sellPrice: 11.2 },
  { category: "STRANTZA", name: "ΣΤΡΑΤΖΑ 80Χ40", unitType: "METER", costPrice: 9.6, sellPrice: 13.44 },
  { category: "STRANTZA", name: "ΣΤΡΑΤΖΑ 100Χ40", unitType: "METER", costPrice: 11.2, sellPrice: 15.68 },
  { category: "MOTOR", name: "ΜΟΤΕΡ Φ60", unitType: "ITEM", costPrice: 75, sellPrice: 150 },
  { category: "MOTOR", name: "ΜΟΤΕΡ Φ76", unitType: "ITEM", costPrice: 120, sellPrice: 210 },
  { category: "MOTOR", name: "ΜΟΤΕΡ Φ76 ΔΙΠΛΟ", unitType: "ITEM", costPrice: 140, sellPrice: 240 },
  { category: "MOTOR", name: "ΜΟΤΕΡ Φ60 ΔΙΠΛΟ", unitType: "ITEM", costPrice: 140, sellPrice: 240 },
  { category: "ACCESSORY", name: "ΣΕΤ ΤΗΛΕΧΕΙΡΙΣΜΟΥ", unitType: "ITEM", costPrice: 45, sellPrice: 90 },
  { category: "ACCESSORY", name: "ΦΩΤΟΚΥΤΤΑΡΑ", unitType: "ITEM", costPrice: 30, sellPrice: 50 },
  { category: "ACCESSORY", name: "BLIDOOR", unitType: "ITEM", costPrice: 15, sellPrice: 30 },
  { category: "ACCESSORY", name: "ΔΙΑΚΟΠΤΗΣ", unitType: "ITEM", costPrice: 12, sellPrice: 20 },
  { category: "ACCESSORY", name: "ΚΛΕΙΔΑΡΙΕΣ", unitType: "ITEM", costPrice: 11, sellPrice: 40 },
  { category: "ACCESSORY", name: "ΚΑΠΑΚΙΑ ΚΟΥΤΙΟΥ", unitType: "ITEM", costPrice: 8, sellPrice: 12 },
];

export const initialPaintPrices: InitialPaintPrice[] = [
  { materialName: "ΚΟΥΡΤΙΝΑ", paintCost: 10, paintSellPrice: 14 },
  { materialName: "ΟΔΗΓΟΙ", paintCost: 2, paintSellPrice: 3.5 },
  { materialName: "ΚΟΥΤΙ Π", paintCost: 9, paintSellPrice: 13.5 },
  { materialName: "ΚΟΥΤΙ Γ", paintCost: 6, paintSellPrice: 9 },
  { materialName: "ΤΑΜΠΛΑΣ", paintCost: 3, paintSellPrice: 4.5 },
];

export const rollerTypeOptions = rollerRows.map(([name]) => name);
export const guideOptions = initialMaterials.filter((item) => item.category === "GUIDE").map((item) => item.name);
export const boxOptions = ["ΟΧΙ", ...initialMaterials.filter((item) => item.category === "BOX").map((item) => item.name)];
export const strantzaOptions = ["ΟΧΙ", ...initialMaterials.filter((item) => item.category === "STRANTZA").map((item) => item.name)];
export const motorOptions = ["ΟΧΙ", ...initialMaterials.filter((item) => item.category === "MOTOR").map((item) => item.name)];
