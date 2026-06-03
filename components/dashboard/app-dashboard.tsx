"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { addMaterial, deleteMaterial, deleteQuotation, saveQuotation, updateOrderNotes, updateOrderStatus, updatePricing, updateQuotationStatus } from "@/app/actions";
import { QuotationForm } from "@/components/forms/quotation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PricingMaterial, PricingPaintPrice } from "@/lib/calculations/quotationCalculator";
import type { MaterialCategory, UnitType } from "@/lib/pricing/initialPricing";
import {
  getOrderStatusLabel,
  getQuotationStatusLabel,
  getUrgency,
  orderStatuses,
  quotationStatuses,
  type OrderStatus,
  type QuotationStatus,
} from "@/lib/status";
import { defaultQuotationValues, type QuotationFormValues } from "@/lib/validation/quotation";

export type MaterialRow = PricingMaterial & {
  id: string;
};

export type PaintPriceRow = PricingPaintPrice & {
  id: string;
};

export type QuotationRow = QuotationFormValues & {
  id: number;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  status: QuotationStatus;
  totalCost: number;
  totalSellPrice: number;
};

export type OrderRow = {
  id: number;
  customerName: string;
  acceptedAt: string;
  finishedAt: string | null;
  status: OrderStatus;
  notes: string;
};

type AppDashboardProps = {
  materials: MaterialRow[];
  paintPrices: PaintPriceRow[];
  quotations: QuotationRow[];
  orders: OrderRow[];
};

const dateFormatter = new Intl.DateTimeFormat("el-GR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
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

const materialCategoryLabels: Record<MaterialCategory, string> = {
  ROLLER_CURTAIN: "Κουρτίνες ρολών",
  ROLLER_SHAFT: "Άξονες ρολών",
  GUIDE: "Οδηγοί",
  BOX: "Κουτιά",
  TAMPLAS: "Ταμπλάς",
  STRANTZA: "Στράντζες",
  MOTOR: "Μοτέρ",
  ACCESSORY: "Αξεσουάρ",
};

const unitTypes: UnitType[] = ["SQUARE_METER", "METER", "ITEM"];

const unitTypeLabels: Record<UnitType, string> = {
  SQUARE_METER: "Τετραγωνικό μέτρο",
  METER: "Μέτρο",
  ITEM: "Τεμάχιο",
};

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "-";
}

function quotationStatusClass(status: QuotationStatus): string {
  const classes: Record<QuotationStatus, string> = {
    DECLINED: "border-red-200 bg-red-50 text-red-700",
    ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return classes[status];
}

function orderStatusClass(status: OrderStatus): string {
  const classes: Record<OrderStatus, string> = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    IN_PROGRESS: "border-slate-200 bg-slate-100 text-slate-600",
    READY: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return classes[status];
}

function urgencyClass(urgency: string): string {
  const classes: Record<string, string> = {
    Ασήμαντο: "bg-slate-100 text-slate-600",
    "Χαμηλής προτεραιότητας": "bg-sky-50 text-sky-700",
    Σημαντικό: "bg-amber-50 text-amber-700",
    "Υψηλής προτεραιότητας": "bg-orange-50 text-orange-700",
    Επείγον: "bg-red-50 text-red-700",
  };

  return classes[urgency] ?? "bg-slate-100 text-slate-600";
}

export function AppDashboard({ materials, paintPrices, quotations, orders }: AppDashboardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [quotationRows, setQuotationRows] = useState(quotations);
  const [orderRows, setOrderRows] = useState(orders);
  const [deletingQuotationIds, setDeletingQuotationIds] = useState<Set<number>>(() => new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<QuotationRow | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const quotationRequestSequence = useRef<Record<number, number>>({});
  const orderRequestSequence = useRef<Record<number, number>>({});

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  useEffect(() => {
    setQuotationRows(quotations);
  }, [quotations]);

  useEffect(() => {
    setOrderRows(orders);
  }, [orders]);

  const handleQuotationStatus = (id: number, status: QuotationStatus) => {
    const previousQuotation = quotationRows.find((quotation) => quotation.id === id);
    if (!previousQuotation || previousQuotation.status === status) {
      return;
    }

    const acceptedAt = status === "ACCEPTED" && !previousQuotation.acceptedAt ? new Date().toISOString() : previousQuotation.acceptedAt;
    const requestId = (quotationRequestSequence.current[id] ?? 0) + 1;
    quotationRequestSequence.current[id] = requestId;

    setQuotationRows((current) =>
      current.map((quotation) => (quotation.id === id ? { ...quotation, status, acceptedAt, updatedAt: new Date().toISOString() } : quotation)),
    );

    void (async () => {
      try {
        const result = await updateQuotationStatus(id, status);
        if (quotationRequestSequence.current[id] !== requestId) {
          return;
        }

        if (result.ok && result.data) {
          const { quotation, orders: updatedOrders } = result.data;
          setQuotationRows((current) => current.map((currentQuotation) => (currentQuotation.id === id ? quotation : currentQuotation)));
          setOrderRows(updatedOrders);
        } else {
          setQuotationRows((current) => current.map((quotation) => (quotation.id === id ? previousQuotation : quotation)));
        }
      } catch {
        if (quotationRequestSequence.current[id] === requestId) {
          setQuotationRows((current) => current.map((quotation) => (quotation.id === id ? previousQuotation : quotation)));
        }
      }
    })();
  };

  const handleOrderStatus = (id: number, status: OrderStatus) => {
    const previousOrder = orderRows.find((order) => order.id === id);
    if (!previousOrder || previousOrder.status === status) {
      return;
    }

    const finishedAt = status === "COMPLETED" ? previousOrder.finishedAt ?? new Date().toISOString() : null;
    const requestId = (orderRequestSequence.current[id] ?? 0) + 1;
    orderRequestSequence.current[id] = requestId;

    setOrderRows((current) => current.map((order) => (order.id === id ? { ...order, status, finishedAt } : order)));

    void (async () => {
      try {
        const result = await updateOrderStatus(id, status);
        if (orderRequestSequence.current[id] !== requestId) {
          return;
        }

        if (result.ok && result.data) {
          const updatedOrder = result.data;
          setOrderRows((current) => current.map((order) => (order.id === id ? updatedOrder : order)));
        } else {
          setOrderRows((current) => current.map((order) => (order.id === id ? previousOrder : order)));
        }
      } catch {
        if (orderRequestSequence.current[id] === requestId) {
          setOrderRows((current) => current.map((order) => (order.id === id ? previousOrder : order)));
        }
      }
    })();
  };

  const handleDeleteQuotation = (quotation: QuotationRow) => {
    const shouldDelete = window.confirm(`Να διαγραφεί η προσφορά #${quotation.id} για ${quotation.customerName};`);
    if (!shouldDelete) {
      return;
    }

    setDeletingQuotationIds((current) => new Set(current).add(quotation.id));

    void (async () => {
      try {
        const result = await deleteQuotation(quotation.id);
        if (result.ok && result.data) {
          const { id, orders: updatedOrders } = result.data;
          setQuotationRows((current) => current.filter((item) => item.id !== id));
          setOrderRows(updatedOrders);
        }
      } finally {
        setDeletingQuotationIds((current) => {
          const next = new Set(current);
          next.delete(quotation.id);
          return next;
        });
        refresh();
      }
    })();
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <Tabs defaultValue="quotations" className="mx-auto flex w-full max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            <TabsTrigger value="quotations" className="min-w-28 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Προσφορές
            </TabsTrigger>
            <TabsTrigger value="orders" className="min-w-28 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Παραγγελίες
            </TabsTrigger>
            <TabsTrigger value="materials" className="min-w-32 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              Edit Materials
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="quotations" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-end">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Νέα προσφορά
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Date Accepted</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Σύνολο</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-slate-500">
                        Δεν υπάρχουν αποθηκευμένες προσφορές.
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotationRows.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.id}</TableCell>
                        <TableCell>{quotation.customerName}</TableCell>
                        <TableCell>{formatDate(quotation.createdAt)}</TableCell>
                        <TableCell>{formatDate(quotation.acceptedAt)}</TableCell>
                        <TableCell>{formatDate(quotation.updatedAt)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(quotation.totalSellPrice)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={quotation.status}
                            onValueChange={(value) => handleQuotationStatus(quotation.id, value as QuotationStatus)}
                          >
                            <SelectTrigger className={quotationStatusClass(quotation.status)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {quotationStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {getQuotationStatusLabel(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleDeleteQuotation(quotation)} disabled={deletingQuotationIds.has(quotation.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Διαγραφή προσφοράς</span>
                            </Button>
                            <Button variant="outline" size="sm" type="button">
                              PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingQuotation(quotation)}>
                              <Edit className="h-4 w-4" />
                              Επεξεργασία
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Date Accepted</TableHead>
                    <TableHead>Date Finished</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-slate-500">
                        Δεν υπάρχουν παραγγελίες από αποδεκτές προσφορές.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderRows.map((order) => {
                      const urgency = getUrgency(order.acceptedAt, order.status);

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{formatDate(order.acceptedAt)}</TableCell>
                          <TableCell>{formatDate(order.finishedAt)}</TableCell>
                          <TableCell>
                            {urgency ? <Badge className={urgencyClass(urgency)}>{urgency}</Badge> : <span className="text-slate-400">-</span>}
                          </TableCell>
                          <TableCell>
                            <Select value={order.status} onValueChange={(value) => handleOrderStatus(order.id, value as OrderStatus)}>
                              <SelectTrigger className={orderStatusClass(order.status)}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {orderStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {getOrderStatusLabel(status)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setEditingOrder(order)}>
                              Notes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          <MaterialEditor materials={materials} paintPrices={paintPrices} onRefresh={refresh} />
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Νέα προσφορά</DialogTitle>
            <DialogDescription>Συμπληρώστε τα στοιχεία και πατήστε Αποθήκευση.</DialogDescription>
          </DialogHeader>
          <QuotationForm
            materials={materials}
            paintPrices={paintPrices}
            mode="create"
            onCancel={() => setCreateOpen(false)}
            onSave={async (values) => {
              const result = await saveQuotation(values);
              if (result.ok) {
                if (result.data) {
                  const { quotation, orders: updatedOrders } = result.data;
                  setQuotationRows((current) => [quotation, ...current]);
                  setOrderRows(updatedOrders);
                }
                setCreateOpen(false);
                refresh();
              }
              return result;
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editingQuotation !== null} onOpenChange={(open) => !open && setEditingQuotation(null)}>
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Επεξεργασία προσφοράς</DialogTitle>
            <DialogDescription>Οι αλλαγές αποθηκεύονται μόνο με το κουμπί Αποθήκευση.</DialogDescription>
          </DialogHeader>
          {editingQuotation ? (
            <QuotationForm
              materials={materials}
              paintPrices={paintPrices}
              mode="edit"
              initialValues={toQuotationFormValues(editingQuotation)}
              onCancel={() => setEditingQuotation(null)}
              onSave={async (values) => {
                const result = await saveQuotation({ ...values, id: editingQuotation.id });
                if (result.ok) {
                  if (result.data) {
                    const { quotation, orders: updatedOrders } = result.data;
                    setQuotationRows((current) => current.map((currentQuotation) => (currentQuotation.id === editingQuotation.id ? quotation : currentQuotation)));
                    setOrderRows(updatedOrders);
                  }
                  setEditingQuotation(null);
                  refresh();
                }
                return result;
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <OrderNotesDialog
        order={editingOrder}
        onClose={() => setEditingOrder(null)}
        onSaved={(updatedOrder) => {
          setOrderRows((current) => current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)));
          setEditingOrder(null);
          refresh();
        }}
      />
    </main>
  );
}

function toQuotationFormValues(quotation: QuotationRow): QuotationFormValues {
  return {
    ...defaultQuotationValues,
    customerName: quotation.customerName,
    customerPhone: quotation.customerPhone,
    customerEmail: quotation.customerEmail,
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
    notes: quotation.notes,
    items: quotation.items,
  };
}

function OrderNotesDialog({ order, onClose, onSaved }: { order: OrderRow | null; onClose: () => void; onSaved: (order: OrderRow) => void }) {
  const [notes, setNotes] = useState(order?.notes ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setNotes(order?.notes ?? "");
    setMessage("");
  }, [order]);

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Σημειώσεις παραγγελίας</DialogTitle>
          <DialogDescription>Οι σημειώσεις παραγγελίας είναι ανεξάρτητες από τις σημειώσεις προσφοράς.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-36 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Άκυρο
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!order) {
                  return;
                }
                const result = await updateOrderNotes(order.id, notes);
                setMessage(result.message);
                if (result.ok && result.data) {
                  onSaved(result.data);
                }
              }}
            >
              <Save className="h-4 w-4" />
              Αποθήκευση
            </Button>
          </div>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MaterialEditor({ materials, paintPrices, onRefresh }: { materials: MaterialRow[]; paintPrices: PaintPriceRow[]; onRefresh: () => void }) {
  const [materialDrafts, setMaterialDrafts] = useState(materials);
  const [paintDrafts, setPaintDrafts] = useState(paintPrices);
  const [addOpen, setAddOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | "PAINT">("ROLLER_CURTAIN");
  const [deletingMaterialIds, setDeletingMaterialIds] = useState<Set<string>>(() => new Set());

  const visibleMaterials = useMemo(
    () => (activeCategory === "PAINT" ? [] : materialDrafts.filter((material) => material.category === activeCategory)),
    [activeCategory, materialDrafts],
  );

  useEffect(() => {
    setMaterialDrafts(materials);
    setPaintDrafts(paintPrices);
  }, [materials, paintPrices]);

  const updateMaterialDraft = (id: string, field: "costPrice" | "sellPrice", value: number) => {
    setMaterialDrafts((current) => current.map((material) => (material.id === id ? { ...material, [field]: value } : material)));
  };

  const updatePaintDraft = (id: string, field: "paintCost" | "paintSellPrice", value: number) => {
    setPaintDrafts((current) => current.map((paintPrice) => (paintPrice.id === id ? { ...paintPrice, [field]: value } : paintPrice)));
  };

  const handleDeleteMaterial = async (material: MaterialRow) => {
    const shouldDelete = window.confirm(`Να διαγραφεί το υλικό ${material.name};`);
    if (!shouldDelete) {
      return;
    }

    setDeletingMaterialIds((current) => new Set(current).add(material.id));

    try {
      const result = await deleteMaterial(material.id);
      setMessage(result.message);

      if (result.ok && result.data) {
        const deletedMaterialId = result.data.id;
        setMaterialDrafts((current) => current.filter((item) => item.id !== deletedMaterialId));
        onRefresh();
      }
    } finally {
      setDeletingMaterialIds((current) => {
        const next = new Set(current);
        next.delete(material.id);
        return next;
      });
    }
  };

  const saveAll = async () => {
    const result = await updatePricing({
      materials: materialDrafts.map((material) => ({
        id: material.id,
        costPrice: material.costPrice,
        sellPrice: material.sellPrice,
      })),
      paintPrices: paintDrafts.map((paintPrice) => ({
        id: paintPrice.id,
        paintCost: paintPrice.paintCost,
        paintSellPrice: paintPrice.paintSellPrice,
      })),
    });

    setMessage(result.message);
    if (result.ok) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Υλικά</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Προσθήκη υλικού
            </Button>
            <Button onClick={saveAll}>
              <Save className="h-4 w-4" />
              Αποθήκευση
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {materialCategories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={activeCategory === category ? "default" : "outline"}
                className="justify-between"
                onClick={() => setActiveCategory(category)}
              >
                <span>{materialCategoryLabels[category]}</span>
                <Badge className="bg-white/70 text-slate-700">{materialDrafts.filter((material) => material.category === category).length}</Badge>
              </Button>
            ))}
            <Button
              type="button"
              variant={activeCategory === "PAINT" ? "default" : "outline"}
              className="justify-between"
              onClick={() => setActiveCategory("PAINT")}
            >
              <span>Βαφές</span>
              <Badge className="bg-white/70 text-slate-700">{paintDrafts.length}</Badge>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{activeCategory === "PAINT" ? "Υλικό" : "Όνομα"}</TableHead>
                {activeCategory !== "PAINT" ? <TableHead>Μονάδα</TableHead> : null}
                <TableHead>Κόστος</TableHead>
                <TableHead>Τιμή Πώλησης</TableHead>
                {activeCategory !== "PAINT" ? <TableHead className="text-right">Ενέργειες</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCategory === "PAINT"
                ? paintDrafts.map((paintPrice) => (
                    <TableRow key={paintPrice.id}>
                      <TableCell className="font-medium">{paintPrice.materialName}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paintPrice.paintCost}
                          onChange={(event) => updatePaintDraft(paintPrice.id, "paintCost", Number(event.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paintPrice.paintSellPrice}
                          onChange={(event) => updatePaintDraft(paintPrice.id, "paintSellPrice", Number(event.target.value))}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : visibleMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{unitTypeLabels[material.unitType]}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={material.costPrice}
                          onChange={(event) => updateMaterialDraft(material.id, "costPrice", Number(event.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={material.sellPrice}
                          onChange={(event) => updateMaterialDraft(material.id, "sellPrice", Number(event.target.value))}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            void handleDeleteMaterial(material);
                          }}
                          disabled={deletingMaterialIds.has(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Διαγραφή υλικού</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          {message ? <p className="text-sm font-medium text-slate-600">{message}</p> : null}
        </CardContent>
      </Card>

      <AddMaterialDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(material) => {
          setMaterialDrafts((current) => [...current.filter((item) => item.id !== material.id), material]);
          setActiveCategory(material.category);
          setMessage("Το υλικό προστέθηκε.");
          onRefresh();
        }}
      />
    </div>
  );
}

function AddMaterialDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (material: MaterialRow) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("ACCESSORY");
  const [unitType, setUnitType] = useState<UnitType>("ITEM");
  const [costPrice, setCostPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);

    try {
      const result = await addMaterial({ name, category, unitType, costPrice, sellPrice });
      setMessage(result.message);

      if (result.ok && result.data) {
        setName("");
        setCostPrice(0);
        setSellPrice(0);
        onOpenChange(false);
        onAdded(result.data);
      }
    } catch {
      setMessage("Δεν ήταν δυνατή η προσθήκη του υλικού.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Προσθήκη υλικού</DialogTitle>
          <DialogDescription>Προσθέστε νέο υλικό στη βάση δεδομένων.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Όνομα">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Κατηγορία">
            <Select value={category} onValueChange={(value) => setCategory(value as MaterialCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialCategories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {materialCategoryLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Μονάδα">
            <Select value={unitType} onValueChange={(value) => setUnitType(value as UnitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {unitTypeLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Κόστος">
            <Input type="number" min="0" step="0.01" value={costPrice} onChange={(event) => setCostPrice(Number(event.target.value))} />
          </Field>
          <Field label="Τιμή Πώλησης">
            <Input type="number" min="0" step="0.01" value={sellPrice} onChange={(event) => setSellPrice(Number(event.target.value))} />
          </Field>
          <Button type="button" onClick={submit} disabled={isSaving}>
            {isSaving ? "Αποθήκευση..." : "Αποθήκευση"}
          </Button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
