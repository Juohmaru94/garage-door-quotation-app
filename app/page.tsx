import { AppDashboard, type MaterialRow, type OrderRow, type PaintPriceRow, type QuotationRow } from "@/components/dashboard/app-dashboard";
import { prisma } from "@/lib/database/prisma";
import { initialMaterials, initialPaintPrices, type MaterialCategory, type UnitType } from "@/lib/pricing/initialPricing";
import type { OrderStatus, QuotationStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

async function getDashboardData(): Promise<{
  materials: MaterialRow[];
  paintPrices: PaintPriceRow[];
  quotations: QuotationRow[];
  orders: OrderRow[];
}> {
  try {
    const [materials, paintPrices, quotations, orders] = await Promise.all([
      prisma.productMaterial.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
      prisma.paintPrice.findMany({ orderBy: { materialName: "asc" } }),
      prisma.quotation.findMany({
        include: { items: { orderBy: { sortOrder: "asc" } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.order.findMany({
        where: { quotation: { status: "ACCEPTED" } },
        orderBy: { acceptedAt: "desc" },
      }),
    ]);

    return {
      materials:
        materials.length > 0
          ? materials.map((material) => ({
              id: material.id,
              category: material.category as MaterialCategory,
              name: material.name,
              unitType: material.unitType as UnitType,
              costPrice: material.costPrice,
              sellPrice: material.sellPrice,
            }))
          : initialMaterials.map((material, index) => ({ ...material, id: `initial-material-${index}` })),
      paintPrices:
        paintPrices.length > 0
          ? paintPrices.map((paintPrice) => ({
              id: paintPrice.id,
              materialName: paintPrice.materialName,
              paintCost: paintPrice.paintCost,
              paintSellPrice: paintPrice.paintSellPrice,
            }))
          : initialPaintPrices.map((paintPrice, index) => ({ ...paintPrice, id: `initial-paint-${index}` })),
      quotations: quotations.map((quotation) => ({
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
        items:
          quotation.items.length > 0
            ? quotation.items.map((item) => ({
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
              }))
            : [],
        status: quotation.status as QuotationStatus,
        acceptedAt: quotation.acceptedAt?.toISOString() ?? null,
        createdAt: quotation.createdAt.toISOString(),
        updatedAt: quotation.updatedAt.toISOString(),
        totalCost: quotation.totalCost,
        totalSellPrice: quotation.totalSellPrice,
      })),
      orders: orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        acceptedAt: order.acceptedAt.toISOString(),
        finishedAt: order.finishedAt?.toISOString() ?? null,
        status: order.status as OrderStatus,
        notes: order.notes ?? "",
      })),
    };
  } catch {
    return {
      materials: initialMaterials.map((material, index) => ({ ...material, id: `initial-material-${index}` })),
      paintPrices: initialPaintPrices.map((paintPrice, index) => ({ ...paintPrice, id: `initial-paint-${index}` })),
      quotations: [],
      orders: [],
    };
  }
}

export default async function Home() {
  const data = await getDashboardData();

  return <AppDashboard {...data} />;
}
