import { RecieplineType } from "./types";
import { EscPosPrinter } from "./receipt-builder";

const print = async () => {
  const build = new EscPosPrinter("XP-80C")
    .title("🍔 My Burger Shop")
    .hr()
    .columns("Burger x1", "18 000 so'm")
    .columns("Cola x1", "5 000 so'm")
    .hr()
    .align(RecieplineType.RIGHT, "Jami: 23 000 so'm")
    .feed(2)
    .cut();

  await build.print();
};

print()
  .then((response) => {
    console.log("response", response);
  })
  .catch((err) => {
    console.log("error", err);
  });
