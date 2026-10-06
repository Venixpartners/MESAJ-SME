import { describe, it, expect } from "vitest";
import { matchProtectedBrand } from "./protectedSenderIds";

describe("matchProtectedBrand", () => {
  it.each([
    ["GTBank", "GTBANK"],
    ["GTBANKALERT", "GTBANK"],
    ["Airtel", "AIRTEL"],
    ["MTN", "MTN"],
    ["MTNNG", "MTN"],
    ["CBN", "CBN"],
    ["UBA ALERT", "UBA"],
    ["OPay", "OPAY"],
    ["Moniepoint", "MONIEPOINT"],
    ["EFCC", "EFCC"],
  ])("flags %s as %s", (name, brand) => {
    expect(matchProtectedBrand(name)).toBe(brand);
  });

  it.each(["MESAJ", "YourBrand", "GLOBALTECH", "MTNMART2", "FINSIGHT", "SHOPRITE"])("does not flag %s", (name) => {
    expect(matchProtectedBrand(name)).toBeNull();
  });
});
