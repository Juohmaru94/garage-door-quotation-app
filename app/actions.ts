"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { calculateQuotation, type PricingMaterial, type PricingPaintPrice } from "@/lib/calculations/quotationCalculator";
import { prisma } from "@/lib/database/prisma";
import { initialMaterials, initialPaintPrices, type MaterialCategory, type UnitType } from "@/lib/pricing/initialPricing";
import { orderStatuses, quotationStatuses, type OrderStatus, type QuotationStatus } from "@/lib/status";
import { defaultQuotationItemValues, quotationSchema, type QuotationFormValues, type QuotationItemValues } from "@/lib/validation/quotation";

export type ActionResult<TData = undefined> = {
  ok: boolean;
  message: string;
} & (TData extends undefined ? { data?: never } : { data?: TData });

export type SavedQuotation = QuotationFormValues & {
  id: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  status: QuotationStatus;
  totalCost: number;
  totalSellPrice: number;
};

export type SavedOrder = {
  id: number;
  customerName: string;
  acceptedAt: string;
  finishedAt: string | null;
  status: OrderStatus;
  notes: string;
};

export type SavedMaterial = PricingMaterial & {
  id: string;
};

export type QuotationMutationData = {
  quotation: SavedQuotation;
  orders: SavedOrder[];
};

const materialUpdateSchema = z.object({
  id: z.string(),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
});

const paintUpdateSchema = z.object({
  id: z.string(),
  paintCost: z.number().min(0),
  paintSellPrice: z.number().min(0),
});

const materialCategories: MaterialCategory[] = [
  "ROLLER_CURTAIN",
  "ROLLER_SHAFT",
  "GUIDE",
  "BOX",
  "TAMPLAS",
  "STRANTZA",
  "MOTOR",
  "ACCESSORY",
];

const unitTypes: UnitType[] = ["SQUARE_METER", "METER", "ITEM"];

const addMaterialSchema = z.object({
  name: z.string().trim().min(1, "Συμπληρώστε όνομα"),
  category: z.custom<MaterialCategory>((value) => typeof value === "string" && materialCategories.includes(value as MaterialCategory)),
  unitType: z.custom<UnitType>((value) => typeof value === "string" && unitTypes.includes(value as UnitType)),
  costPrice: z.number().min(0),
  sellPrice: z.number().min(0),
});

function isPrismaKnownError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string";
}

async function getPricingData(): Promise<{
  materials: PricingMaterial[];
  paintPrices: PricingPaintPrice[];
}> {
  const [materials, paintPrices] = await Promise.all([
    prisma.productMaterial.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.paintPrice.findMany({ orderBy: { materialName: "asc" } }),
  ]);

  return {
    materials:
      materials.length > 0
        ? materials.map((material) => ({
            category: material.category as MaterialCategory,
            name: material.name,
            unitType: material.unitType as UnitType,
            costPrice: material.costPrice,
            sellPrice: material.sellPrice,
          }))
        : initialMaterials,
    paintPrices: paintPrices.length > 0 ? paintPrices : initialPaintPrices,
  };
}

function toCalculationInput(values: QuotationItemValues) {
  return {
    widthCm: values.widthCm,
    heightCm: values.heightCm,
    rollerType: values.rollerType,
    painted: values.painted,
    guides: values.guides,
    boxType: values.boxType,
    tamplas: values.tamplas,
    boxCaps: values.boxCaps,
    strantza: values.strantza,
    motor: values.motor,
    remoteSet: values.remoteSet,
    photocells: values.photocells,
    blidoor: values.blidoor,
    switch: values.switch,
    locks: values.locks,
    installationCost: values.installationCost,
  };
}

function getQuotationItems(values: QuotationFormValues): QuotationItemValues[] {
  return values.items.length > 0
    ? values.items
    : [
        {
          widthCm: values.widthCm,
          heightCm: values.heightCm,
          rollerType: values.rollerType,
          painted: values.painted,
          guides: values.guides,
          boxType: values.boxType,
          tamplas: values.tamplas,
          boxCaps: values.boxCaps,
          strantza: values.strantza,
          motor: values.motor,
          remoteSet: values.remoteSet,
          photocells: values.photocells,
          blidoor: values.blidoor,
          switch: values.switch,
          locks: values.locks,
          installationCost: values.installationCost,
          notes: values.notes,
        },
      ];
}

function getPersistedPrimaryItem(items: QuotationItemValues[]): QuotationItemValues {
  return items[0] ?? defaultQuotationItemValues;
}

type QuotationWithItems = Prisma.QuotationGetPayload<{
  include: { items: { orderBy: { sortOrder: "asc" } } };
}>;

type OrderRecord = Prisma.OrderGetPayload<Record<string, never>>;

function serializeQuotation(quotation: QuotationWithItems): SavedQuotation {
  return {
    id: quotation.id,
    customerName: quotation.customerName,
    customerPhone: quotation.customerPhone ?? "",
    customerEmail: quotation.customerEmail ?? "",
    widthCm: quotation.widthCm,
    heightCm: quotation.heightCm,
    rollerType: quotation.rollerType,
    painted: quotation.painted,
    guides: quotation.guides,
    boxType: quotation.boxType,
    tamplas: quotation.tamplas,
    boxCaps: quotation.boxCaps,
    strantza: quotation.strantza,
    motor: quotation.motor,
    remoteSet: quotation.remoteSet,
    photocells: quotation.photocells,
    blidoor: quotation.blidoor,
    switch: quotation.switch,
    locks: quotation.locks,
    installationCost: quotation.installationCost,
    notes: quotation.notes ?? "",
    items: quotation.items.map((item) => ({
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      rollerType: item.rollerType,
      painted: item.painted,
      guides: item.guides,
      boxType: item.boxType,
      tamplas: item.tamplas,
      boxCaps: item.boxCaps,
      strantza: item.strantza,
      motor: item.motor,
      remoteSet: item.remoteSet,
      photocells: item.photocells,
      blidoor: item.blidoor,
      switch: item.switch,
      locks: item.locks,
      installationCost: item.installationCost,
      notes: item.notes ?? "",
    })),
    status: quotation.status as QuotationStatus,
    acceptedAt: quotation.acceptedAt?.toISOString() ?? null,
    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString(),
    totalCost: quotation.totalCost,
    totalSellPrice: quotation.totalSellPrice,
  };
}

function serializeOrder(order: OrderRecord): SavedOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    acceptedAt: order.acceptedAt.toISOString(),
    finishedAt: order.finishedAt?.toISOString() ?? null,
    status: order.status as OrderStatus,
    notes: order.notes ?? "",
  };
}

async function getAcceptedOrders(): Promise<SavedOrder[]> {
  const orders = await prisma.order.findMany({
    where: { quotation: { status: "ACCEPTED" } },
    orderBy: { acceptedAt: "desc" },
  });

  return orders.map(serializeOrder);
}

async function syncOrderForAcceptedQuotation(quotationId: number): Promise<void> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    select: { id: true, customerName: true, acceptedAt: true, status: true },
  });

  if (!quotation || quotation.status !== "ACCEPTED" || !quotation.acceptedAt) {
    return;
  }

  await prisma.order.upsert({
    where: { quotationId: quotation.id },
    update: {
      customerName: quotation.customerName,
      acceptedAt: quotation.acceptedAt,
    },
    create: {
      quotationId: quotation.id,
      customerName: quotation.customerName,
      acceptedAt: quotation.acceptedAt,
      notes: "",
    },
  });
}

export async function saveQuotation(input: QuotationFormValues & { id?: number }): Promise<ActionResult<QuotationMutationData>> {
  const parsed = quotationSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Ελέγξτε τα στοιχεία της προσφοράς." };
  }

  const { materials, paintPrices } = await getPricingData();
  const items = getQuotationItems(parsed.data);
  const primaryItem = getPersistedPrimaryItem(items);
  const itemCalculations = items.map((item) => calculateQuotation(toCalculationInput(item), materials, paintPrices));
  const totalCost = itemCalculations.reduce((sum, item) => sum + item.totalCost, 0);
  const totalSellPrice = itemCalculations.reduce((sum, item) => sum + item.totalSellPrice, 0);
  const quotationData = {
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone || null,
    customerEmail: parsed.data.customerEmail || null,
    widthCm: primaryItem.widthCm,
    heightCm: primaryItem.heightCm,
    rollerType: primaryItem.rollerType,
    painted: primaryItem.painted,
    guides: primaryItem.guides,
    boxType: primaryItem.boxType,
    tamplas: primaryItem.tamplas,
    boxCaps: primaryItem.boxCaps,
    strantza: primaryItem.strantza,
    motor: primaryItem.motor,
    remoteSet: primaryItem.remoteSet,
    photocells: primaryItem.photocells,
    blidoor: primaryItem.blidoor,
    switch: primaryItem.switch,
    locks: primaryItem.locks,
    installationCost: primaryItem.installationCost,
    totalCost,
    totalSellPrice,
    notes: primaryItem.notes || null,
  };
  const itemRows = items.map((item, index) => ({
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    rollerType: item.rollerType,
    painted: item.painted,
    guides: item.guides,
    boxType: item.boxType,
    tamplas: item.tamplas,
    boxCaps: item.boxCaps,
    strantza: item.strantza,
    motor: item.motor,
    remoteSet: item.remoteSet,
    photocells: item.photocells,
    blidoor: item.blidoor,
    switch: item.switch,
    locks: item.locks,
    installationCost: item.installationCost,
    notes: item.notes || null,
    sortOrder: index,
  }));

  const savedQuotation = input.id
    ? await prisma.quotation.update({
      where: { id: input.id },
      data: {
        ...quotationData,
        items: {
          deleteMany: {},
          create: itemRows,
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    })
    : await prisma.quotation.create({
      data: {
        ...quotationData,
        items: {
          create: itemRows,
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

  if (input.id) {
    await syncOrderForAcceptedQuotation(input.id);
  }

  const orders = await getAcceptedOrders();
  revalidatePath("/");
  return { ok: true, message: "Η προσφορά αποθηκεύτηκε.", data: { quotation: serializeQuotation(savedQuotation), orders } };
}

export async function updateQuotationStatus(id: number, status: QuotationStatus): Promise<ActionResult<QuotationMutationData>> {
  if (!quotationStatuses.includes(status)) {
    return { ok: false, message: "Μη έγκυρη κατάσταση προσφοράς." };
  }

  const existing = await prisma.quotation.findUnique({ where: { id }, select: { acceptedAt: true } });
  if (!existing) {
    return { ok: false, message: "Η προσφορά δεν βρέθηκε." };
  }

  const quotation = await prisma.quotation.update({
    where: { id },
    data: {
      status,
      acceptedAt: status === "ACCEPTED" && !existing.acceptedAt ? new Date() : existing.acceptedAt,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (status === "ACCEPTED") {
    await syncOrderForAcceptedQuotation(id);
  }

  const orders = await getAcceptedOrders();
  revalidatePath("/");
  return { ok: true, message: "Η κατάσταση ενημερώθηκε.", data: { quotation: serializeQuotation(quotation), orders } };
}

export async function deleteQuotation(id: number): Promise<ActionResult<{ id: number; orders: SavedOrder[] }>> {
  const existing = await prisma.quotation.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    return { ok: false, message: "Η προσφορά δεν βρέθηκε." };
  }

  await prisma.quotation.delete({ where: { id } });

  const orders = await getAcceptedOrders();
  revalidatePath("/");
  return { ok: true, message: "Η προσφορά διαγράφηκε.", data: { id, orders } };
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<ActionResult<SavedOrder>> {
  if (!orderStatuses.includes(status)) {
    return { ok: false, message: "Μη έγκυρη κατάσταση παραγγελίας." };
  }

  const existing = await prisma.order.findUnique({ where: { id }, select: { finishedAt: true } });
  if (!existing) {
    return { ok: false, message: "Η παραγγελία δεν βρέθηκε." };
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      finishedAt: status === "COMPLETED" ? existing.finishedAt ?? new Date() : null,
    },
  });

  revalidatePath("/");
  return { ok: true, message: "Η παραγγελία ενημερώθηκε.", data: serializeOrder(order) };
}

export async function updateOrderNotes(id: number, notes: string): Promise<ActionResult<SavedOrder>> {
  const order = await prisma.order.update({
    where: { id },
    data: { notes: notes.trim() || null },
  });

  revalidatePath("/");
  return { ok: true, message: "Οι σημειώσεις παραγγελίας αποθηκεύτηκαν.", data: serializeOrder(order) };
}

export async function updatePricing(input: {
  materials: Array<z.infer<typeof materialUpdateSchema>>;
  paintPrices: Array<z.infer<typeof paintUpdateSchema>>;
}): Promise<ActionResult> {
  const materials = z.array(materialUpdateSchema).safeParse(input.materials);
  const paintPrices = z.array(paintUpdateSchema).safeParse(input.paintPrices);

  if (!materials.success || !paintPrices.success) {
    return { ok: false, message: "Ελέγξτε τις τιμές πριν την αποθήκευση." };
  }

  await prisma.$transaction(async (transaction) => {
    for (const material of materials.data) {
      const initialMatch = material.id.startsWith("initial-material-")
        ? initialMaterials[Number(material.id.replace("initial-material-", ""))]
        : undefined;

      if (initialMatch) {
        await transaction.productMaterial.upsert({
          where: {
            category_name: {
              category: initialMatch.category,
              name: initialMatch.name,
            },
          },
          update: {
            unitType: initialMatch.unitType,
            costPrice: material.costPrice,
            sellPrice: material.sellPrice,
          },
          create: {
            ...initialMatch,
            costPrice: material.costPrice,
            sellPrice: material.sellPrice,
          },
        });
      } else {
        await transaction.productMaterial.update({
          where: { id: material.id },
          data: {
            costPrice: material.costPrice,
            sellPrice: material.sellPrice,
          },
        });
      }
    }

    for (const paintPrice of paintPrices.data) {
      const initialMatch = paintPrice.id.startsWith("initial-paint-")
        ? initialPaintPrices[Number(paintPrice.id.replace("initial-paint-", ""))]
        : undefined;

      if (initialMatch) {
        await transaction.paintPrice.upsert({
          where: { materialName: initialMatch.materialName },
          update: {
            paintCost: paintPrice.paintCost,
            paintSellPrice: paintPrice.paintSellPrice,
          },
          create: {
            ...initialMatch,
            paintCost: paintPrice.paintCost,
            paintSellPrice: paintPrice.paintSellPrice,
          },
        });
      } else {
        await transaction.paintPrice.update({
          where: { id: paintPrice.id },
          data: {
            paintCost: paintPrice.paintCost,
            paintSellPrice: paintPrice.paintSellPrice,
          },
        });
      }
    }
  });

  revalidatePath("/");
  return { ok: true, message: "Οι τιμές αποθηκεύτηκαν." };
}

export async function addMaterial(input: z.infer<typeof addMaterialSchema>): Promise<ActionResult<SavedMaterial>> {
  const parsed = addMaterialSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Ελέγξτε τα στοιχεία του υλικού." };
  }

  try {
    const material = await prisma.productMaterial.create({
      data: parsed.data,
    });

    revalidatePath("/");
    return {
      ok: true,
      message: "Το υλικό προστέθηκε.",
      data: {
        id: material.id,
        category: material.category as MaterialCategory,
        name: material.name,
        unitType: material.unitType as UnitType,
        costPrice: material.costPrice,
        sellPrice: material.sellPrice,
      },
    };
  } catch (error) {
    if (isPrismaKnownError(error) && error.code === "P2002") {
      return { ok: false, message: "Υπάρχει ήδη υλικό με αυτό το όνομα στην ίδια κατηγορία." };
    }

    return { ok: false, message: "Δεν ήταν δυνατή η προσθήκη του υλικού." };
  }
}

export async function deleteMaterial(id: string): Promise<ActionResult<{ id: string }>> {
  const initialMaterialPrefix = "initial-material-";

  if (id.startsWith(initialMaterialPrefix)) {
    const index = Number(id.replace(initialMaterialPrefix, ""));

    if (!Number.isInteger(index) || !initialMaterials[index]) {
      return { ok: false, message: "Το υλικό δεν βρέθηκε." };
    }

    await prisma.productMaterial.createMany({
      data: initialMaterials.filter((_, materialIndex) => materialIndex !== index),
    });
  } else {
    const existing = await prisma.productMaterial.findUnique({ where: { id }, select: { id: true } });

    if (!existing) {
      return { ok: false, message: "Το υλικό δεν βρέθηκε." };
    }

    await prisma.productMaterial.delete({ where: { id } });
  }

  revalidatePath("/");
  return { ok: true, message: "Το υλικό διαγράφηκε.", data: { id } };
}
