"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Edit, Plus, RotateCcw, Save, ScrollText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  calculateQuotation,
  formatCurrency,
  roundMoney,
  type PricingMaterial,
  type PricingPaintPrice,
  type QuotationCalculationInput,
  type QuotationCalculationResult,
} from "@/lib/calculations/quotationCalculator";
import { boxOptions, guideOptions, motorOptions, rollerTypeOptions, strantzaOptions } from "@/lib/pricing/initialPricing";
import {
  defaultQuotationItemValues,
  defaultQuotationValues,
  quotationCustomerSchema,
  quotationItemSchema,
  type QuotationFormValues,
  type QuotationItemValues,
} from "@/lib/validation/quotation";

type QuotationFormProps = {
  materials: PricingMaterial[];
  paintPrices: PricingPaintPrice[];
  initialValues?: QuotationFormValues;
  mode: "create" | "edit";
  onSave: (values: QuotationFormValues) => Promise<{ ok: boolean; message: string }>;
  onCancel?: () => void;
};

type CustomerValues = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
};

type ToggleFieldName = "painted" | "tamplas" | "boxCaps" | "remoteSet" | "photocells" | "blidoor" | "switch" | "locks";

function toCalculationInput(values: QuotationItemValues): QuotationCalculationInput {
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

function calculateItems(
  items: QuotationItemValues[],
  materials: PricingMaterial[],
  paintPrices: PricingPaintPrice[],
): QuotationCalculationResult[] {
  return items.map((item) => calculateQuotation(toCalculationInput(item), materials, paintPrices));
}

function summarizeCalculations(calculations: QuotationCalculationResult[]) {
  const totalCost = roundMoney(calculations.reduce((sum, calculation) => sum + calculation.totalCost, 0));
  const totalSellPrice = roundMoney(calculations.reduce((sum, calculation) => sum + calculation.totalSellPrice, 0));
  const profit = roundMoney(totalSellPrice - totalCost);
  const profitMargin = totalSellPrice > 0 ? roundMoney((profit / totalSellPrice) * 100) : 0;

  return { totalCost, totalSellPrice, profit, profitMargin };
}

function getInitialItems(values: QuotationFormValues): QuotationItemValues[] {
  if (values.items.length > 0) {
    return values.items;
  }

  if (values.customerName) {
    return [
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

  return [];
}

export function QuotationForm({ materials, paintPrices, initialValues, mode, onSave, onCancel }: QuotationFormProps) {
  const resolvedInitialValues = useMemo(() => initialValues ?? defaultQuotationValues, [initialValues]);
  const [customer, setCustomer] = useState<CustomerValues>({
    customerName: resolvedInitialValues.customerName,
    customerPhone: resolvedInitialValues.customerPhone,
    customerEmail: resolvedInitialValues.customerEmail,
  });
  const [items, setItems] = useState<QuotationItemValues[]>(() => getInitialItems(resolvedInitialValues));
  const [isCustomerReady, setIsCustomerReady] = useState(mode === "edit");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCustomer({
      customerName: resolvedInitialValues.customerName,
      customerPhone: resolvedInitialValues.customerPhone,
      customerEmail: resolvedInitialValues.customerEmail,
    });
    setItems(getInitialItems(resolvedInitialValues));
    setIsCustomerReady(mode === "edit");
    setSelectedItemIndex(null);
    setMessage("");
  }, [mode, resolvedInitialValues]);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemIndex(null);
      return;
    }

    setSelectedItemIndex((current) => {
      if (current === null || current >= items.length) {
        return 0;
      }

      return current;
    });
  }, [items]);

  const calculations = useMemo(() => calculateItems(items, materials, paintPrices), [items, materials, paintPrices]);
  const totals = useMemo(() => summarizeCalculations(calculations), [calculations]);
  const selectedCalculation = selectedItemIndex !== null ? calculations[selectedItemIndex] : null;
  const selectedItem = selectedItemIndex !== null ? items[selectedItemIndex] : null;

  const openNewItem = () => {
    setEditingItemIndex(null);
    setItemDialogOpen(true);
  };

  const openExistingItem = (index: number) => {
    setSelectedItemIndex(index);
    setEditingItemIndex(index);
    setItemDialogOpen(true);
  };

  const saveItem = (item: QuotationItemValues) => {
    const nextSelectedIndex = editingItemIndex ?? items.length;
    setItems((current) => {
      if (editingItemIndex === null) {
        return [...current, item];
      }

      return current.map((existingItem, index) => (index === editingItemIndex ? item : existingItem));
    });
    setSelectedItemIndex(nextSelectedIndex);
    setItemDialogOpen(false);
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSelectedItemIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current === index) {
        return index === 0 ? 0 : index - 1;
      }

      return current > index ? current - 1 : current;
    });
  };

  const saveQuotation = async () => {
    setIsSaving(true);
    setMessage("");
    const primaryItem = items[0] ?? defaultQuotationItemValues;
    const result = await onSave({
      ...defaultQuotationValues,
      ...customer,
      ...primaryItem,
      items,
    });
    setIsSaving(false);
    setMessage(result.message);

    if (result.ok && mode === "create") {
      setCustomer({ customerName: "", customerPhone: "", customerEmail: "" });
      setItems([]);
      setIsCustomerReady(false);
    }
  };

  if (!isCustomerReady) {
    return (
      <CustomerPrompt
        initialValues={customer}
        onCancel={onCancel}
        onContinue={(values) => {
          setCustomer(values);
          setIsCustomerReady(true);
        }}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Στοιχεία πελάτη</CardTitle>
                <CardDescription>Βασικές πληροφορίες για την προσφορά.</CardDescription>
              </div>
              <Badge>{mode === "create" ? "Νέα προσφορά" : "Επεξεργασία"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <EditableCustomerField label="Πελάτης" value={customer.customerName} onChange={(value) => setCustomer((current) => ({ ...current, customerName: value }))} />
            <EditableCustomerField label="Τηλέφωνο" value={customer.customerPhone} onChange={(value) => setCustomer((current) => ({ ...current, customerPhone: value }))} />
            <EditableCustomerField label="Email" value={customer.customerEmail ?? ""} onChange={(value) => setCustomer((current) => ({ ...current, customerEmail: value }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Είδη προσφοράς</CardTitle>
              <CardDescription>Προσθέστε όσα ρολά ή εξαρτήματα χρειάζεται ο πελάτης.</CardDescription>
            </div>
            <Button type="button" size="icon" className="h-12 w-12 rounded-full bg-emerald-600 text-white shadow-md hover:bg-emerald-700" onClick={openNewItem}>
              <Plus className="h-6 w-6" />
              <span className="sr-only">Προσθήκη είδους</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <button
                type="button"
                onClick={openNewItem}
                className="flex min-h-56 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/60 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                  <Plus className="h-9 w-9" />
                </span>
                <span className="mt-4 text-base font-semibold text-slate-900">Προσθήκη πρώτου είδους</span>
                <span className="mt-1 text-sm text-slate-500">Η λίστα είναι κενή.</span>
              </button>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Είδος</TableHead>
                    <TableHead>Διαστάσεις</TableHead>
                    <TableHead className="text-right">Τιμή</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const calculation = calculations[index];

                    return (
                      <TableRow
                        key={`${item.rollerType}-${index}`}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-emerald-50/70",
                          selectedItemIndex === index && "bg-emerald-50 ring-1 ring-inset ring-emerald-200",
                        )}
                        onClick={() => setSelectedItemIndex(index)}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-900">{item.rollerType}</div>
                          <div className="text-xs text-slate-500">{calculation.lineItems.length} γραμμές ανάλυσης</div>
                        </TableCell>
                        <TableCell>{`${item.widthCm} x ${item.heightCm} cm`}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(calculation.totalSellPrice)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openExistingItem(index);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Επεξεργασία
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeItem(index);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Διαγραφή είδους</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Σύνοψη προσφοράς
            </CardTitle>
            <CardDescription>Το σύνολο ενημερώνεται από τα είδη της λίστας.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Είδη" value={String(items.length)} />
            <SummaryRow label="Κόστος" value={formatCurrency(totals.totalCost)} />
            <SummaryRow label="Τιμή πώλησης" value={formatCurrency(totals.totalSellPrice)} strong />
            <SummaryRow label="Κέρδος" value={formatCurrency(totals.profit)} />
            <SummaryRow label="Περιθώριο" value={`${totals.profitMargin.toFixed(2)}%`} />
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={saveQuotation} disabled={isSaving || customer.customerName.trim() === "" || customer.customerPhone.trim() === ""}>
                <Save className="h-4 w-4" />
                {isSaving ? "Αποθήκευση..." : "Αποθήκευση"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setItems(getInitialItems(resolvedInitialValues));
                  setMessage("");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Επαναφορά
              </Button>
            </div>
            {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-slate-600" />
              Ανάλυση ειδών
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedItem ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{selectedItem.rollerType}</p>
                <p className="text-xs text-slate-500">{`${selectedItem.widthCm} x ${selectedItem.heightCm} cm`}</p>
              </div>
            ) : null}
            <div className="max-h-[420px] overflow-y-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Είδος</TableHead>
                  <TableHead className="text-right">Πώληση</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCalculation?.lineItems.map((item, itemIndex) => (
                    <TableRow key={`${selectedItemIndex}-${item.label}-${item.quantityLabel}-${itemIndex}`}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.quantityLabel}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.sellPrice)}</TableCell>
                    </TableRow>
                  ))}
                {!selectedCalculation ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-slate-500">
                      Δεν υπάρχουν είδη στην προσφορά.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </aside>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItemIndex === null ? "Προσθήκη είδους" : "Επεξεργασία είδους"}</DialogTitle>
            <DialogDescription>Συμπληρώστε τα στοιχεία του είδους και προσθέστε το στη λίστα.</DialogDescription>
          </DialogHeader>
          <QuotationItemEditor
            materials={materials}
            paintPrices={paintPrices}
            initialValues={editingItemIndex === null ? defaultQuotationItemValues : items[editingItemIndex]}
            onCancel={() => setItemDialogOpen(false)}
            onSave={saveItem}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerPrompt({
  initialValues,
  onContinue,
  onCancel,
}: {
  initialValues: CustomerValues;
  onContinue: (values: CustomerValues) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(quotationCustomerSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onContinue)} className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Νέα προσφορά</CardTitle>
          <CardDescription>Συμπληρώστε πρώτα τα στοιχεία του πελάτη για να δημιουργηθεί η κενή λίστα ειδών.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Πελάτης" error={errors.customerName?.message}>
            <Input {...register("customerName")} placeholder="Ονοματεπώνυμο" />
          </Field>
          <Field label="Τηλέφωνο" error={errors.customerPhone?.message}>
            <Input {...register("customerPhone")} placeholder="210 0000000" />
          </Field>
          <Field label="Email προαιρετικό" error={errors.customerEmail?.message}>
            <Input {...register("customerEmail")} placeholder="customer@example.com" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            {onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                Άκυρο
              </Button>
            ) : null}
            <Button type="submit">
              Δημιουργία λίστας
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function QuotationItemEditor({
  materials,
  paintPrices,
  initialValues,
  onSave,
  onCancel,
}: {
  materials: PricingMaterial[];
  paintPrices: PricingPaintPrice[];
  initialValues: QuotationItemValues;
  onSave: (values: QuotationItemValues) => void;
  onCancel: () => void;
}) {
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationItemValues>({
    resolver: zodResolver(quotationItemSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });
  const values = useWatch({ control }) as QuotationItemValues;
  const calculation = useMemo(() => calculateQuotation(toCalculationInput({ ...initialValues, ...values }), materials, paintPrices), [initialValues, materials, paintPrices, values]);

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
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
            <CardTitle>Σημειώσεις είδους</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              {...register("notes")}
              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              placeholder="Σημειώσεις για το συγκεκριμένο είδος"
            />
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Σύνοψη είδους
            </CardTitle>
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
                Προσθήκη
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Άκυρο
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function EditableCustomerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
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
  control: ReturnType<typeof useForm<QuotationItemValues>>["control"];
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
  control: ReturnType<typeof useForm<QuotationItemValues>>["control"];
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
