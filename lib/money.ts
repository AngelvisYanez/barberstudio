export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function categoryTypeLabel(
  type: "INCOME" | "BUSINESS_EXPENSE" | "OWNER_DRAW",
) {
  switch (type) {
    case "INCOME":
      return "Ingreso";
    case "BUSINESS_EXPENSE":
      return "Gasto operativo";
    case "OWNER_DRAW":
      return "Retiro personal";
    default:
      return type;
  }
}
