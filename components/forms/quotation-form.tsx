"use client";

import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, RotateCcw, Save, ScrollText } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  calculateQuotation,
  formatCurrency,
  type PricingMaterial,
  type PricingPaintPrice,
  type QuotationCalculationInput,
} from "@/lib/calculations/quotationCalculator";
import { boxOptions, guideOptions, motorOptions, rollerTypeOptions, strantzaOptions } from "@/lib/pricing/initialPricing";

const quotationSchema = z.object({
  customerName: z.string().trim().min(1, "Συμπληρώστε όνομα πελάτη"),
  customerPhone: z.string().trim().optional(),
  customerEmail: z.string().trim().email("Συμπληρώστε σωστό email").or(z.literal("")).optional(),
  widthCm: z.number({ error: "Το πλάτος πρέπει να είναι αριθμός" }).positive("Το πλάτος πρέπει να είναι μεγαλύτερο από 0"),
  heightCm: z.number({ error: "Το ύψος πρέπει να είναι αριθμός" }).positive("Το ύψος πρέπει να είναι μεγαλύτερο από 0"),
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
  installationCost: z.number({ error: "Η τοποθέτηση πρέπει να είναι αριθμός" }).min(0, "Η τοποθέτηση δεν μπορεί να είναι αρνητική"),
  notes: z.string().trim().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

const defaultValues: QuotationFormValues = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  widthCm: 300,
  heightCm: 250,
  rollerType: rollerTypeOptions[0],
  painted: false,
  guides: guideOptions[0],
  boxType: "ΟΧΙ",
  tamplas: false,
  boxCaps: false,
  strantza: "ΟΧΙ",
  motor: "ΟΧΙ",
  remoteSet: false,
  photocells: false,
  blidoor: false,
  switch: false,
  locks: false,
  installationCost: 0,
  notes: "",
};

type QuotationFormProps = {
  materials: PricingMaterial[];
  paintPrices: PricingPaintPrice[];
};

type ToggleFieldName = "painted" | "tamplas" | "boxCaps" | "remoteSet" | "photocells" | "blidoor" | "switch" | "locks";

function toCalculationInput(values: QuotationFormValues): QuotationCalculationInput {
  return {
    widthCm: Number(values.widthCm) || 0,
    heightCm: Number(values.heightCm) || 0,
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
    installationCost: Number(values.installationCost) || 0,
  };
}

export function QuotationForm({ materials, paintPrices }: QuotationFormProps) {
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues,
    mode: "onChange",
  });

  const values = useWatch({ control }) as QuotationFormValues;
  const calculation = useMemo(
    () => calculateQuotation(toCalculationInput({ ...defaultValues, ...values }), materials, paintPrices),
    [materials, paintPrices, values],
  );

  const onSubmit = (data: QuotationFormValues) => {
    const result = calculateQuotation(toCalculationInput(data), materials, paintPrices);
    window.alert(`Η προσφορά υπολογίστηκε: ${formatCurrency(result.totalSellPrice)}`);
  };

  const resetWithConfirmation = () => {
    if (window.confirm("Θέλετε σίγουρα να καθαρίσετε τη φόρμα;")) {
      reset(defaultValues);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Στοιχεία πελάτη</CardTitle>
                <CardDescription>Βασικές πληροφορίες για την προσφορά.</CardDescription>
              </div>
              <Badge>Νέα προσφορά</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Πελάτης" error={errors.customerName?.message}>
              <Input {...register("customerName")} placeholder="Ονοματεπώνυμο" />
            </Field>
            <Field label="Τηλέφωνο" error={errors.customerPhone?.message}>
              <Input {...register("customerPhone")} placeholder="210 0000000" />
            </Field>
            <Field label="Email" error={errors.customerEmail?.message}>
              <Input {...register("customerEmail")} placeholder="customer@example.com" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Διαστάσεις ρολού</CardTitle>
            <CardDescription>Οι τιμές υπολογίζονται σε μέτρα και τετραγωνικά μέτρα.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Πλάτος (cm)" error={errors.widthCm?.message}>
              <Input type="number" min="1" step="0.1" {...register("widthCm", { valueAsNumber: true })} />
            </Field>
            <Field label="Ύψος (cm)" error={errors.heightCm?.message}>
              <Input type="number" min="1" step="0.1" {...register("heightCm", { valueAsNumber: true })} />
            </Field>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase text-slate-500">Επιφάνεια</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{calculation.area.toFixed(2)} m²</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Υλικά και εξαρτήματα</CardTitle>
            <CardDescription>Επιλέξτε τύπο ρολού, οδηγούς, κουτί και πρόσθετα εξαρτήματα.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <SelectField control={control} name="rollerType" label="Είδος ρολού" options={rollerTypeOptions} />
              <SelectField control={control} name="guides" label="Οδηγοί" options={guideOptions} />
              <SelectField control={control} name="boxType" label="Κουτί" options={boxOptions} />
              <SelectField control={control} name="strantza" label="Στράντζες" options={strantzaOptions} />
              <SelectField control={control} name="motor" label="Μοτέρ" options={motorOptions} />
              <Field label="Τοποθέτηση (€)" error={errors.installationCost?.message}>
                <Input type="number" min="0" step="0.01" {...register("installationCost", { valueAsNumber: true })} />
              </Field>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ToggleField control={control} name="painted" label="Βαφή" />
              <ToggleField control={control} name="tamplas" label="Τάμπλας" />
              <ToggleField control={control} name="boxCaps" label="Καπάκια κουτιού" />
              <ToggleField control={control} name="remoteSet" label="Σετ τηλεχειρισμού" />
              <ToggleField control={control} name="photocells" label="Φωτοκύτταρα" />
              <ToggleField control={control} name="blidoor" label="BLIDOOR" />
              <ToggleField control={control} name="switch" label="Διακόπτης" />
              <ToggleField control={control} name="locks" label="Κλειδαριές" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Σημειώσεις</CardTitle>
            <CardDescription>Προαιρετικές παρατηρήσεις για εκτύπωση ή εσωτερική χρήση.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              {...register("notes")}
              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="Σημειώσεις προσφοράς"
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Σύνοψη υπολογισμού
            </CardTitle>
            <CardDescription>Τα σύνολα ενημερώνονται αυτόματα.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Κόστος" value={formatCurrency(calculation.totalCost)} />
            <SummaryRow label="Τιμή πώλησης" value={formatCurrency(calculation.totalSellPrice)} strong />
            <SummaryRow label="Κέρδος" value={formatCurrency(calculation.profit)} />
            <SummaryRow label="Περιθώριο" value={`${calculation.profitMargin.toFixed(2)}%`} />
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <Button type="submit">
                <Save className="h-4 w-4" />
                Αποθήκευση
              </Button>
              <Button type="button" variant="outline" onClick={resetWithConfirmation}>
                <RotateCcw className="h-4 w-4" />
                Καθαρισμός
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-slate-600" />
              Ανάλυση ειδών
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Είδος</TableHead>
                  <TableHead className="text-right">Πώληση</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculation.lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-slate-500">
                      Δεν υπάρχουν υπολογισμένα είδη.
                    </TableCell>
                  </TableRow>
                ) : (
                  calculation.lineItems.map((item) => (
                    <TableRow key={`${item.label}-${item.quantityLabel}`}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.quantityLabel}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.sellPrice)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useForm<QuotationFormValues>>["control"];
  name: "rollerType" | "guides" | "boxType" | "strantza" | "motor";
  label: string;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

function ToggleField({
  control,
  name,
  label,
}: {
  control: ReturnType<typeof useForm<QuotationFormValues>>["control"];
  name: ToggleFieldName;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div>
            <Label className="text-slate-800">{label}</Label>
            <p className="text-xs text-slate-500">{field.value ? "ΝΑΙ" : "ΟΧΙ"}</p>
          </div>
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        </div>
      )}
    />
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={strong ? "text-2xl font-semibold text-emerald-700" : "text-base font-semibold text-slate-950"}>{value}</span>
    </div>
  );
}
