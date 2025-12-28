import { ReceiptConfig, RecieplineType } from "./types";

export function generateReceipt(config: ReceiptConfig): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;
  const LF = 0x0a;

  const cmds: number[] = [];

  /* =======================
   * LOW LEVEL HELPERS
   * ======================= */

  const write = (text: string, newline = true) => {
    cmds.push(...Buffer.from(text, "utf8"));
    if (newline) cmds.push(LF);
  };

  const feed = (lines = 1) => cmds.push(ESC, 0x64, lines);

  const cut = () => cmds.push(GS, 0x56, 0x00);

  const bold = (on: boolean) => cmds.push(ESC, 0x45, on ? 1 : 0);

  const align = (mode: RecieplineType) => {
    const map: Partial<Record<RecieplineType, number>> = {
      [RecieplineType.LEFT]: 0,
      [RecieplineType.CENTER]: 1,
      [RecieplineType.RIGHT]: 2,
    };
    cmds.push(ESC, 0x61, map[mode] ?? 0);
  };

  const size = (w = 1, h = 1) => cmds.push(GS, 0x21, ((w - 1) << 4) | (h - 1));

  const byteLen = (s: string) => Buffer.byteLength(s, "utf8");

  /* =======================
   * PRINTER INIT
   * ======================= */

  cmds.push(ESC, 0x40); // Initialize printer

  /* =======================
   * TITLE
   * ======================= */

  if (config.title) {
    align(RecieplineType.CENTER);
    bold(true);
    size(2, 2);
    write(config.title);
    size(1, 1);
    bold(false);
    feed(1);
  }

  /* =======================
   * CONTENT
   * ======================= */

  for (const line of config.lines) {
    switch (line.type) {
      case "text":
        align(RecieplineType.LEFT);
        write(line.value);
        break;

      case "bold":
        bold(true);
        write(line.value);
        bold(false);
        break;

      case "center":
        align(RecieplineType.CENTER);
        write(line.value);
        break;

      case "right":
        align(RecieplineType.RIGHT);
        write(line.value);
        break;

      case "hr":
        align(RecieplineType.LEFT);
        write("-".repeat(32));
        break;

      case "feed":
        feed(line.lines ?? 1);
        break;

      case "columns": {
        align(RecieplineType.LEFT);
        const totalWidth = 32;

        const spaceCount =
          totalWidth - byteLen(line.left) - byteLen(line.right);

        write(line.left + " ".repeat(Math.max(spaceCount, 1)) + line.right);
        break;
      }

      case "qr": {
        align(RecieplineType.CENTER);

        const qrData = Buffer.from(line.value, "utf8");
        const storeLen = qrData.length + 3;
        const pL = storeLen & 0xff;
        const pH = (storeLen >> 8) & 0xff;

        // QR model
        cmds.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

        // QR size
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);

        // Error correction
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30);

        // Store data
        cmds.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
        cmds.push(...qrData);

        // Print QR
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

        feed(1);
        break;
      }

      case "cut":
        feed(2);
        cut();
        break;
    }
  }

  /* =======================
   * SAFETY CUT (AUTO)
   * ======================= */

  if (!config.lines.some((l) => l.type === "cut")) {
    feed(3);
    cut();
  }

  return Buffer.from(cmds);
}
