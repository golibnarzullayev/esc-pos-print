export enum RecieplineType {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
  Text = "text",
  Bold = "bold",
  HR = "hr",
  Feed = "feed",
  Cut = "cut",
  QR = "qr",
  Columns = "columns",
}

export type ReceiptLine =
  | { type: RecieplineType.CENTER; value: string }
  | { type: RecieplineType.RIGHT; value: string }
  | { type: RecieplineType.Text; value: string }
  | { type: RecieplineType.Bold; value: string }
  | { type: RecieplineType.HR }
  | { type: RecieplineType.Feed; lines?: number }
  | { type: RecieplineType.Cut }
  | { type: RecieplineType.QR; value: string }
  | {
      type: RecieplineType.Columns;
      [RecieplineType.LEFT]: string;
      [RecieplineType.RIGHT]: string;
    };

export interface ReceiptConfig {
  title?: string;
  lines: ReceiptLine[];
}
