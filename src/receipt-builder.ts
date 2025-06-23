import { exec } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";

import { generateReceipt } from "./generate-reciept";
import { ReceiptLine } from "./types";

export class EscPosPrinter {
  private lines: ReceiptLine[] = [];
  private printerName?: string;

  constructor(printerName?: string) {
    this.printerName = printerName;
  }

  title(value: string) {
    this.lines.push({ type: "center", value });
    return this;
  }

  line(value: string) {
    this.lines.push({ type: "text", value });
    return this;
  }

  bold(value: string) {
    this.lines.push({ type: "bold", value });
    return this;
  }

  center(value: string) {
    this.lines.push({ type: "center", value });
    return this;
  }

  right(value: string) {
    this.lines.push({ type: "right", value });
    return this;
  }

  hr() {
    this.lines.push({ type: "hr" });
    return this;
  }

  feed(lines = 1) {
    this.lines.push({ type: "feed", lines });
    return this;
  }

  cut() {
    this.lines.push({ type: "cut" });
    return this;
  }

  qr(value: string) {
    this.lines.push({ type: "qr", value });
    return this;
  }

  columns(left: string, right: string) {
    this.lines.push({ type: "columns", left, right });
    return this;
  }

  build(): Buffer {
    return generateReceipt({ lines: this.lines });
  }

  print(): Promise<void> {
    const buffer = this.build();
    const tmpPath = path.join(process.cwd(), `receipt_${Date.now()}.raw`);
    writeFileSync(tmpPath, buffer);

    const cmd = `lp ${
      this.printerName ? `-d ${this.printerName}` : ""
    } -o raw "${tmpPath}"`;

    return new Promise((resolve, reject) => {
      exec(cmd, (err, stdout, stderr) => {
        try {
          unlinkSync(tmpPath);
        } catch (e) {
          throw e;
        }

        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}
