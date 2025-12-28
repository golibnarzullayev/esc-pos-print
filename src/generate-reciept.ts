import { ReceiptConfig, RecieplineType } from "./types";

export function generateReceipt(config: ReceiptConfig): Buffer {
  const ESC = 0x1b; // Escape character - used to send control commands
  const GS = 0x1d; // Group Separator - used for GS commands
  const LF = 0x0a; // Line Feed - moves cursor to next line

  const cmds: number[] = [];

  /* =======================
   * LOW LEVEL HELPERS
   * ======================= */

  // Writes text to the command buffer
  const write = (text: string, newline = true) => {
    cmds.push(...Buffer.from(text, "utf8"));
    if (newline) cmds.push(LF);
  };

  // Feeds paper by specified number of lines
  const feed = (lines = 1) => cmds.push(ESC, 0x64, lines);

  // Cuts the paper
  const cut = () => cmds.push(GS, 0x56, 0x00);

  // Sets bold text mode
  const bold = (on: boolean) => cmds.push(ESC, 0x45, on ? 1 : 0);

  // Sets text alignment
  const align = (mode: RecieplineType) => {
    const map: Partial<Record<RecieplineType, number>> = {
      [RecieplineType.LEFT]: 0,
      [RecieplineType.CENTER]: 1,
      [RecieplineType.RIGHT]: 2,
    };
    cmds.push(ESC, 0x61, map[mode] ?? 0);
  };

  // Sets text size (width and height multipliers)
  // w: width multiplier (1-8), h: height multiplier (1-8)
  // Each multiplier can be 1 (normal) to 8 (8x size)
  // Example: size(2, 1) makes text twice as wide, normal height
  const size = (w = 1, h = 1) => cmds.push(GS, 0x21, ((w - 1) << 4) | (h - 1));

  // Gets the byte length of a string in UTF-8 encoding
  const byteLen = (s: string) => Buffer.byteLength(s, "utf8");

  /* =======================
   * PRINTER INIT
   * ======================= */

  // Reset printer to default state
  cmds.push(ESC, 0x40);

  /* =======================
   * TITLE
   * ======================= */

  // Print title centered and bold
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

  // Process each line according to its type
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

        // QR model (Model 2)
        cmds.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

        // QR size (module size)
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);

        // Error correction (Level M - Medium)
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30);

        // Store data (format: PL PH 31 50 30 DATA) - stores QR data
        cmds.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
        cmds.push(...qrData);

        // Print QR (format: PL PH 31 51 30) - prints the stored QR code
        cmds.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

        // The QR code is now stored in memory and printed with the same settings as configured
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

  // Ensure a cut is always performed at the end if not already specified
  if (!config.lines.some((l) => l.type === "cut")) {
    feed(3);
    cut();
  }

  return Buffer.from(cmds);
}
