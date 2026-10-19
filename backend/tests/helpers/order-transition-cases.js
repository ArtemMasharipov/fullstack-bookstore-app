// Independently specified expected actions: these fixtures never import the
// production transition table. Each row covers one combination of both axes.
export const ORDER_CASES = [
  ["pending", "unpaid", [["status", "cancelled"], ["payment", "paid"]], [["status", "cancelled"]]],
  ["pending", "paid", [["status", "processing"], ["status", "cancelled"]], []],
  ["pending", "failed", [["status", "cancelled"]], [["status", "cancelled"]]],
  ["pending", "refunded", [], []],
  ["processing", "unpaid", [["status", "shipped"], ["status", "cancelled"]], []],
  ["processing", "paid", [["status", "shipped"], ["status", "cancelled"]], []],
  ["processing", "failed", [["status", "shipped"], ["status", "cancelled"]], []],
  ["processing", "refunded", [], []],
  ["shipped", "unpaid", [["status", "delivered"]], []],
  ["shipped", "paid", [["status", "delivered"]], []],
  ["shipped", "failed", [["status", "delivered"]], []],
  ["shipped", "refunded", [], []],
  ["delivered", "unpaid", [], []],
  ["delivered", "paid", [["payment", "refunded"]], []],
  ["delivered", "failed", [], []],
  ["delivered", "refunded", [], []],
  ["cancelled", "unpaid", [], []],
  ["cancelled", "paid", [], []],
  ["cancelled", "failed", [], []],
  ["cancelled", "refunded", [], []],
];
export const ORDER_TARGETS = [
  ["status", "pending"], ["status", "processing"], ["status", "shipped"],
  ["status", "delivered"], ["status", "cancelled"],
  ["payment", "paid"], ["payment", "refunded"],
];
