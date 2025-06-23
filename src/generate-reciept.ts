import { ReceiptConfig } from "./types";

export function generateReceipt(config: ReceiptConfig): Buffer {
  const ESC = 0x1b;
  const GS = 0x1d;
  const cmds: number[] = [];

  const write = (text: string) =>
    cmds.push(...Buffer.from(text + "\n", "utf8"));
  const feed = (lines: number = 1) => cmds.push(ESC, 0x64, lines);
  const cut = () => cmds.push(GS, 0x56, 0x00);
  const bold = (on: boolean) => cmds.push(ESC, 0x45, on ? 1 : 0);
  const align = (mode: "left" | "center" | "right") => {
    const map = { left: 0, center: 1, right: 2 };
    cmds.push(ESC, 0x61, map[mode]);
  };

  if (config.title) {
    align("center");
    bold(true);
    write(config.title);
    bold(false);
    feed(1);
  }

  for (const line of config.lines) {
    switch (line.type) {
      case "text":
        align("left");
        write(line.value);
        break;

      case "bold":
        bold(true);
        write(line.value);
        bold(false);
        break;

      case "center":
        align("center");
        write(line.value);
        break;

      case "right":
        align("right");
        write(line.value);
        break;

      case "hr":
        align("left");
        write("------------------------------");
        break;

      case "feed":
        feed(line.lines || 1);
        break;

      case "cut":
        cut();
        break;

      case "columns":
        align("left");
        const totalWidth = 32;
        const left = line.left.padEnd(totalWidth - line.right.length);
        write(left + line.right);
        break;

      case "qr":
        const qrData = Buffer.from(line.value, "utf8");
        const length = qrData.length + 3;
        const pL = length & 0xff;
        const pH = (length >> 8) & 0xff;

        // QR init
        cmds.push(
          ...Buffer.from([
            GS,
            0x28,
            0x6b,
            0x04,
            0x00,
            0x31,
            0x41,
            0x32,
            0x00,
            GS,
            0x28,
            0x6b,
            0x03,
            0x00,
            0x31,
            0x43,
            0x06,
            GS,
            0x28,
            0x6b,
            0x03,
            0x00,
            0x31,
            0x45,
            0x30,
            GS,
            0x28,
            0x6b,
            pL,
            pH,
            0x31,
            0x50,
            0x30,
          ])
        );
        cmds.push(...qrData);

        cmds.push(
          ...Buffer.from([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30])
        );
        break;
    }
  }

  return Buffer.from(cmds);
}
