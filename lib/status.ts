export const quotationStatuses = ["PENDING", "ACCEPTED", "DECLINED"] as const;
export type QuotationStatus = (typeof quotationStatuses)[number];

export const orderStatuses = ["IN_PROGRESS", "READY", "COMPLETED"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const urgencyLevels = [
  "Ασήμαντο",
  "Χαμηλής προτεραιότητας",
  "Σημαντικό",
  "Υψηλής προτεραιότητας",
  "Επείγον",
] as const;

export type UrgencyLevel = (typeof urgencyLevels)[number];

export function getQuotationStatusLabel(status: QuotationStatus): string {
  const labels: Record<QuotationStatus, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
  };

  return labels[status];
}

export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    IN_PROGRESS: "In Progress",
    READY: "Ready",
    COMPLETED: "Completed",
  };

  return labels[status];
}

export function getUrgency(acceptedAt: string | Date, status: OrderStatus, now: Date = new Date()): UrgencyLevel | "" {
  if (status === "COMPLETED") {
    return "";
  }

  const acceptedDate = typeof acceptedAt === "string" ? new Date(acceptedAt) : acceptedAt;
  const elapsedMs = Math.max(0, now.getTime() - acceptedDate.getTime());
  const elapsedDays = Math.floor(elapsedMs / 86_400_000);
  const levelIndex = Math.min(urgencyLevels.length - 1, Math.floor(elapsedDays / 7));

  return urgencyLevels[levelIndex];
}
