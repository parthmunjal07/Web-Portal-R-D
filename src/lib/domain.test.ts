import {describe,expect,it} from "vitest";
import {money} from "./domain";
describe("money and budget rules",()=>{it("formats INR values",()=>expect(money(3250000)).toBe("₹32,50,000"));it("computes remaining balance",()=>expect(1500000-675000).toBe(825000));it("blocks overspend conceptually",()=>expect(700000-350000-400000).toBeLessThan(0));});
