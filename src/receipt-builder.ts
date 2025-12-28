import { exec, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { generateReceipt } from "./generate-reciept";
import { RecieplineType, ReceiptLine } from "./types";

export class EscPosPrinter {
  private lines: ReceiptLine[] = [];
  private printerName?: string;

  constructor(printerName?: string) {
    this.printerName = printerName;
  }

  title(value: string) {
    this.lines.push({ type: RecieplineType.CENTER, value });
    return this;
  }

  line(value: string) {
    this.lines.push({ type: RecieplineType.Text, value });
    return this;
  }

  bold(value: string) {
    this.lines.push({ type: RecieplineType.Bold, value });
    return this;
  }

  align(
    alignment: RecieplineType.CENTER | RecieplineType.RIGHT,
    value: string
  ) {
    this.lines.push({ type: alignment, value });
    return this;
  }

  hr() {
    this.lines.push({ type: RecieplineType.HR });
    return this;
  }

  feed(lines = 1) {
    this.lines.push({ type: RecieplineType.Feed, lines });
    return this;
  }

  cut() {
    this.lines.push({ type: RecieplineType.Cut });
    return this;
  }

  qr(value: string) {
    this.lines.push({ type: RecieplineType.QR, value });
    return this;
  }

  columns(left: string, right: string) {
    this.lines.push({ type: RecieplineType.Columns, left, right });
    return this;
  }

  build(): Buffer | string {
    return generateReceipt({ lines: this.lines });
  }

  print(): Promise<void> {
    const buffer = this.build();

    const tmpPath = path.join(
      `${process.cwd()}/public/receipts`,
      `receipt_${Date.now()}.raw`
    );

    if (!fs.existsSync(`${process.cwd()}/public/receipts`)) {
      fs.mkdirSync(`${process.cwd()}/public/receipts`, { recursive: true });
    }

    fs.writeFileSync(tmpPath, buffer);

    const cmd = `lp ${
      this.printerName ? `-d ${this.printerName}` : ""
    } -o raw "${tmpPath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (err) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}
