import type { InitialMaterial, InitialPaintPrice, MaterialCategory } from "@/lib/pricing/initialPricing";

export type PricingMaterial = InitialMaterial;
export type PricingPaintPrice = InitialPaintPrice;

export type QuotationCalculationInput = {
  widthCm: number;
  heightCm: number;
  rollerType: string;
  painted: boolean;
  guides: string;
  boxType: string;
  tamplas: boolean;
  boxCaps: boolean;
  strantza: string;
  motor: string;
  remoteSet: boolean;
  photocells: boolean;
  blidoor: boolean;
  switch: boolean;
  locks: boolean;
  installationCost: number;
};

export type QuotationLineItem = {
  label: string;
  quantityLabel: string;
  cost: number;
  sellPrice: number;
};

export type QuotationCalculationResult = {
  widthMeters: number;
  heightMeters: number;
  area: number;
  lineItems: QuotationLineItem[];
  totalCost: number;
  totalSellPrice: number;
  profit: number;
  profitMargin: number;
};

export function cmToMeters(value: number): number {
  return value / 100;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function findMaterial(
  materials: PricingMaterial[],
  category: MaterialCategory,
  name: string,
): PricingMaterial | undefined {
  return materials.find((material) => material.category === category && material.name === name);
}

function findPaintPrice(paintPrices: PricingPaintPrice[], materialName: string): PricingPaintPrice | undefined {
  return paintPrices.find((paintPrice) => paintPrice.materialName === materialName);
}

function pricedLine(label: string, quantityLabel: string, quantity: number, costPrice: number, sellPrice: number) {
  return {
    label,
    quantityLabel,
    cost: quantity * costPrice,
    sellPrice: quantity * sellPrice,
  };
}

export function calculateQuotation(
  input: QuotationCalculationInput,
  materials: PricingMaterial[],
  paintPrices: PricingPaintPrice[],
): QuotationCalculationResult {
  const widthMeters = cmToMeters(input.widthCm);
  const heightMeters = cmToMeters(input.heightCm);
  const area = widthMeters * heightMeters;
  const lineItems: QuotationLineItem[] = [];

  const curtain = findMaterial(materials, "ROLLER_CURTAIN", input.rollerType);
  const shaft = findMaterial(materials, "ROLLER_SHAFT", input.rollerType);

  if (curtain && shaft && area > 0) {
    lineItems.push({
      label: `Ρολό ${input.rollerType}`,
      quantityLabel: `${area.toFixed(2)} m²`,
      cost: area * (curtain.costPrice + shaft.costPrice),
      sellPrice: area * (curtain.sellPrice + shaft.sellPrice),
    });
  }

  const guide = findMaterial(materials, "GUIDE", input.guides);
  if (guide && heightMeters > 0) {
    lineItems.push(pricedLine(input.guides, `${heightMeters.toFixed(2)} m x 2`, heightMeters * 2, guide.costPrice, guide.sellPrice));
  }

  const box = input.boxType !== "ΟΧΙ" ? findMaterial(materials, "BOX", input.boxType) : undefined;
  if (box && widthMeters > 0) {
    lineItems.push(pricedLine(input.boxType, `${widthMeters.toFixed(2)} m`, widthMeters, box.costPrice, box.sellPrice));
  }

  const tamplas = findMaterial(materials, "TAMPLAS", "ΤΑΜΠΛΑΣ");
  if (input.tamplas && tamplas && widthMeters > 0) {
    lineItems.push(pricedLine("ΤΑΜΠΛΑΣ", `${widthMeters.toFixed(2)} m`, widthMeters, tamplas.costPrice, tamplas.sellPrice));
  }

  const selectedStrantza = input.strantza !== "ΟΧΙ" ? findMaterial(materials, "STRANTZA", input.strantza) : undefined;
  if (selectedStrantza && heightMeters > 0) {
    lineItems.push(
      pricedLine(input.strantza, `${heightMeters.toFixed(2)} m x 2`, heightMeters * 2, selectedStrantza.costPrice, selectedStrantza.sellPrice),
    );
  }

  const selectedMotor = input.motor !== "ΟΧΙ" ? findMaterial(materials, "MOTOR", input.motor) : undefined;
  if (selectedMotor) {
    lineItems.push(pricedLine(input.motor, "1 τεμ.", 1, selectedMotor.costPrice, selectedMotor.sellPrice));
  }

  const accessorySelections = [
    { enabled: input.remoteSet, name: "ΣΕΤ ΤΗΛΕΧΕΙΡΙΣΜΟΥ" },
    { enabled: input.photocells, name: "ΦΩΤΟΚΥΤΤΑΡΑ" },
    { enabled: input.blidoor, name: "BLIDOOR" },
    { enabled: input.switch, name: "ΔΙΑΚΟΠΤΗΣ" },
    { enabled: input.locks, name: "ΚΛΕΙΔΑΡΙΕΣ" },
    { enabled: input.boxCaps, name: "ΚΑΠΑΚΙΑ ΚΟΥΤΙΟΥ" },
  ];

  accessorySelections.forEach((selection) => {
    const accessory = selection.enabled ? findMaterial(materials, "ACCESSORY", selection.name) : undefined;
    if (accessory) {
      lineItems.push(pricedLine(selection.name, "1 τεμ.", 1, accessory.costPrice, accessory.sellPrice));
    }
  });

  if (input.painted) {
    const curtainPaint = findPaintPrice(paintPrices, "ΚΟΥΡΤΙΝΑ");
    if (curtainPaint && area > 0) {
      lineItems.push(pricedLine("Βαφή κουρτίνας", `${area.toFixed(2)} m²`, area, curtainPaint.paintCost, curtainPaint.paintSellPrice));
    }

    const guidePaint = findPaintPrice(paintPrices, "ΟΔΗΓΟΙ");
    if (guidePaint && heightMeters > 0) {
      lineItems.push(pricedLine("Βαφή οδηγών", `${heightMeters.toFixed(2)} m x 2`, heightMeters * 2, guidePaint.paintCost, guidePaint.paintSellPrice));
    }

    const boxPaint = box ? findPaintPrice(paintPrices, input.boxType) : undefined;
    if (boxPaint && widthMeters > 0) {
      lineItems.push(pricedLine(`Βαφή ${input.boxType}`, `${widthMeters.toFixed(2)} m`, widthMeters, boxPaint.paintCost, boxPaint.paintSellPrice));
    }

    const tamplasPaint = input.tamplas ? findPaintPrice(paintPrices, "ΤΑΜΠΛΑΣ") : undefined;
    if (tamplasPaint && widthMeters > 0) {
      lineItems.push(pricedLine("Βαφή τάμπλα", `${widthMeters.toFixed(2)} m`, widthMeters, tamplasPaint.paintCost, tamplasPaint.paintSellPrice));
    }
  }

  if (input.installationCost > 0) {
    lineItems.push({
      label: "Τοποθέτηση",
      quantityLabel: "κατ' αποκοπή",
      cost: input.installationCost,
      sellPrice: input.installationCost,
    });
  }

  const totalCost = roundMoney(lineItems.reduce((sum, item) => sum + item.cost, 0));
  const totalSellPrice = roundMoney(lineItems.reduce((sum, item) => sum + item.sellPrice, 0));
  const profit = roundMoney(totalSellPrice - totalCost);
  const profitMargin = totalSellPrice > 0 ? roundMoney((profit / totalSellPrice) * 100) : 0;

  return {
    widthMeters,
    heightMeters,
    area,
    lineItems: lineItems.map((item) => ({
      ...item,
      cost: roundMoney(item.cost),
      sellPrice: roundMoney(item.sellPrice),
    })),
    totalCost,
    totalSellPrice,
    profit,
    profitMargin,
  };
}
