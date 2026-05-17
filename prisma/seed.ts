import { PrismaClient } from "@prisma/client";
import { initialMaterials, initialPaintPrices } from "../lib/pricing/initialPricing";

const prisma = new PrismaClient();

async function main() {
  await Promise.all(
    initialMaterials.map((material) =>
      prisma.productMaterial.upsert({
        where: {
          category_name: {
            category: material.category,
            name: material.name,
          },
        },
        update: {
          unitType: material.unitType,
          costPrice: material.costPrice,
          sellPrice: material.sellPrice,
        },
        create: material,
      }),
    ),
  );

  await Promise.all(
    initialPaintPrices.map((paintPrice) =>
      prisma.paintPrice.upsert({
        where: { materialName: paintPrice.materialName },
        update: {
          paintCost: paintPrice.paintCost,
          paintSellPrice: paintPrice.paintSellPrice,
        },
        create: paintPrice,
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
