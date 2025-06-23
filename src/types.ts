export type ReceiptLine =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "center"; value: string }
  | { type: "right"; value: string }
  | { type: "hr" }
  | { type: "feed"; lines?: number }
  | { type: "cut" }
  | { type: "qr"; value: string }
  | { type: "columns"; left: string; right: string };

export interface ReceiptConfig {
  title?: string;
  lines: ReceiptLine[];
}
