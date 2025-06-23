# ESC/POS Printer Project

This project is a **receipt printing system** built in **TypeScript** that works with ESC/POS-compatible thermal printers.  
It does not rely on any external libraries and sends raw commands directly to the printer using the `lp -o raw` command.

---

## 🎯 Purpose

- Build receipts in ESC/POS format
- Print to thermal printers via native OS printing command
- Support for:
  - Bold text
  - Text alignment (left, center, right)
  - Columns layout
  - QR codes
  - Feed lines and cut command
- Automatically generates and deletes `.raw` print files

---

## 🚀 Example Usage

```ts
import { EscPosPrinter } from "./receipt-builder";

new EscPosPrinter("XP-80C")
  .title("🍔 My Burger Shop")
  .hr()
  .columns("Burger x1", "18,000")
  .columns("Cola x1", "5,000")
  .hr()
  .right("Total: 23,000 UZS")
  .feed(2)
  .center("Thank you!")
  .qr("https://myshop.uz/order/123")
  .cut()
  .print();
```
