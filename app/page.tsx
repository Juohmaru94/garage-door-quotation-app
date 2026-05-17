import { QuotationForm } from "@/components/forms/quotation-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/database/prisma";
import { initialMaterials, initialPaintPrices } from "@/lib/pricing/initialPricing";
import type { PricingMaterial, PricingPaintPrice } from "@/lib/calculations/quotationCalculator";

async function getPricingData(): Promise<{
  materials: PricingMaterial[];
  paintPrices: PricingPaintPrice[];
  source: "database" | "fallback";
}> {
  try {
    const [materials, paintPrices] = await Promise.all([
      prisma.productMaterial.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
      prisma.paintPrice.findMany({ orderBy: { materialName: "asc" } }),
    ]);

    if (materials.length > 0 && paintPrices.length > 0) {
      return {
        materials: materials.map((material) => ({
          category: material.category as PricingMaterial["category"],
          name: material.name,
          unitType: material.unitType as PricingMaterial["unitType"],
          costPrice: material.costPrice,
          sellPrice: material.sellPrice,
        })),
        paintPrices,
        source: "database",
      };
    }
  } catch {
    return {
      materials: initialMaterials,
      paintPrices: initialPaintPrices,
      source: "fallback",
    };
  }

  return {
    materials: initialMaterials,
    paintPrices: initialPaintPrices,
    source: "fallback",
  };
}

export default async function Home() {
  const pricingData = await getPricingData();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Εφαρμογή κοστολόγησης</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">Νέα προσφορά γκαραζόπορτας</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Καταχώρηση διαστάσεων, υλικών και εξαρτημάτων με άμεσο υπολογισμό κόστους, τιμής πώλησης και κέρδους.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{pricingData.source === "database" ? "Τιμές από βάση" : "Αρχικές τιμές"}</Badge>
            <Badge className="bg-slate-100 text-slate-700">Desktop-first</Badge>
          </div>
        </header>

        {pricingData.source === "fallback" ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-900">
              Οι τιμές εμφανίζονται από τα αρχικά δεδομένα. Εκτελέστε `npm run db:push` και `npm run db:seed` για αποθήκευση στη SQLite βάση.
            </CardContent>
          </Card>
        ) : null}

        <QuotationForm materials={pricingData.materials} paintPrices={pricingData.paintPrices} />
      </div>
    </main>
  );
}
