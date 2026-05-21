import { z } from "zod";
import { boxOptions, guideOptions, motorOptions, rollerTypeOptions, strantzaOptions } from "@/lib/pricing/initialPricing";

export const quotationCustomerSchema = z.object({
  customerName: z.string().trim().min(1, "Συμπληρώστε όνομα πελάτη"),
  customerPhone: z.string().trim().min(1, "Συμπληρώστε τηλέφωνο"),
  customerEmail: z.string().trim().email("Συμπληρώστε σωστό email").or(z.literal("")).optional(),
});

export const quotationItemSchema = z.object({
  widthCm: z
    .number({ error: "Το πλάτος πρέπει να είναι αριθμός" })
    .positive("Το πλάτος πρέπει να είναι μεγαλύτερο από 0"),
  heightCm: z
    .number({ error: "Το ύψος πρέπει να είναι αριθμός" })
    .positive("Το ύψος πρέπει να είναι μεγαλύτερο από 0"),
  rollerType: z.string().min(1),
  painted: z.boolean(),
  guides: z.string().min(1),
  boxType: z.string().min(1),
  tamplas: z.boolean(),
  boxCaps: z.boolean(),
  strantza: z.string().min(1),
  motor: z.string().min(1),
  remoteSet: z.boolean(),
  photocells: z.boolean(),
  blidoor: z.boolean(),
  switch: z.boolean(),
  locks: z.boolean(),
  installationCost: z
    .number({ error: "Η τοποθέτηση πρέπει να είναι αριθμός" })
    .min(0, "Η τοποθέτηση δεν μπορεί να είναι αρνητική"),
  notes: z.string().trim().optional(),
});

export const quotationSchema = quotationCustomerSchema.merge(quotationItemSchema).extend({
  items: z.array(quotationItemSchema).default([]),
});

export type QuotationItemValues = z.infer<typeof quotationItemSchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;

export const defaultQuotationItemValues: QuotationItemValues = {
  widthCm: 300,
  heightCm: 250,
  rollerType: rollerTypeOptions[0],
  painted: false,
  guides: guideOptions[0],
  boxType: boxOptions[0],
  tamplas: false,
  boxCaps: false,
  strantza: strantzaOptions[0],
  motor: motorOptions[0],
  remoteSet: false,
  photocells: false,
  blidoor: false,
  switch: false,
  locks: false,
  installationCost: 0,
  notes: "",
};

export const defaultQuotationValues: QuotationFormValues = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  ...defaultQuotationItemValues,
  items: [],
};
