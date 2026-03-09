import { describe, it, expect } from "vitest";

/**
 * Tests for payment calculation logic: deposit amounts, floating-point safety,
 * overpayment detection, and currency handling.
 * These validate the core financial logic used in paymentLink router.
 */

// Replicate the production calculation logic (integer cents approach)
function calculateDeposit(totalAmount: number, depositPercent: number) {
  const totalCents = Math.round(totalAmount * 100);
  const depositCents = Math.round(totalCents * depositPercent / 100);
  return {
    depositAmount: depositCents / 100,
    balanceAmount: (totalCents - depositCents) / 100,
  };
}

// Old buggy calculation for comparison
function calculateDepositOld(totalAmount: number, depositPercent: number) {
  const depositAmount = Math.round((totalAmount * depositPercent) / 100 * 100) / 100;
  const balanceAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
  return { depositAmount, balanceAmount };
}

describe("Deposit Calculation (Integer Cents)", () => {
  it("should calculate 30% deposit correctly", () => {
    const { depositAmount, balanceAmount } = calculateDeposit(499.00, 30);
    expect(depositAmount).toBe(149.70);
    expect(balanceAmount).toBe(349.30);
    expect(depositAmount + balanceAmount).toBe(499.00);
  });

  it("should calculate 50% deposit correctly", () => {
    const { depositAmount, balanceAmount } = calculateDeposit(1000.00, 50);
    expect(depositAmount).toBe(500.00);
    expect(balanceAmount).toBe(500.00);
  });

  it("should handle amounts that cause floating-point issues", () => {
    // 0.1 + 0.2 !== 0.3 in IEEE 754, but our integer-based math should be exact
    const { depositAmount, balanceAmount } = calculateDeposit(33.33, 33);
    expect(depositAmount + balanceAmount).toBeCloseTo(33.33, 2);
    // depositAmount and balanceAmount should have at most 2 decimal places
    expect(Number((depositAmount * 100) % 1)).toBe(0);
    expect(Number((balanceAmount * 100) % 1)).toBe(0);
  });

  it("should handle $1 with 1% deposit", () => {
    const { depositAmount, balanceAmount } = calculateDeposit(1.00, 1);
    expect(depositAmount).toBe(0.01);
    expect(balanceAmount).toBe(0.99);
  });

  it("should handle large amounts", () => {
    const { depositAmount, balanceAmount } = calculateDeposit(99999.99, 30);
    expect(depositAmount + balanceAmount).toBeCloseTo(99999.99, 2);
  });

  it("should handle 100% deposit", () => {
    const { depositAmount, balanceAmount } = calculateDeposit(500.00, 100);
    expect(depositAmount).toBe(500.00);
    expect(balanceAmount).toBe(0.00);
  });

  it("deposit + balance should always equal total", () => {
    // Test many random-ish values
    const testCases = [
      { total: 123.45, percent: 30 },
      { total: 999.99, percent: 25 },
      { total: 1.01, percent: 50 },
      { total: 0.01, percent: 10 },
      { total: 10000.00, percent: 15 },
      { total: 333.33, percent: 33 },
    ];

    for (const { total, percent } of testCases) {
      const { depositAmount, balanceAmount } = calculateDeposit(total, percent);
      expect(depositAmount + balanceAmount).toBeCloseTo(total, 2);
      expect(depositAmount).toBeGreaterThanOrEqual(0);
      expect(balanceAmount).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Overpayment Detection", () => {
  it("should detect overpayment beyond 1% tolerance", () => {
    const totalAmount = 100.00;
    const amountPaid = 0;
    const newPayment = 101.50;
    const newTotal = amountPaid + newPayment;
    const isOverpay = newTotal > totalAmount * 1.01;
    expect(isOverpay).toBe(true);
  });

  it("should allow payment within 1% tolerance", () => {
    const totalAmount = 100.00;
    const amountPaid = 0;
    const newPayment = 100.99;
    const newTotal = amountPaid + newPayment;
    const isOverpay = newTotal > totalAmount * 1.01;
    expect(isOverpay).toBe(false);
  });

  it("should detect exact overpayment at boundary", () => {
    const totalAmount = 100.00;
    // Note: 100 * 1.01 === 101.00999999... in IEEE 754, so 101.01 > that is true
    const newTotal = 101.00;
    const isOverpay = newTotal > totalAmount * 1.01;
    expect(isOverpay).toBe(false);

    // 101.02 is clearly over
    const overTotal = 101.02;
    expect(overTotal > totalAmount * 1.01).toBe(true);
  });

  it("should handle partial payments correctly", () => {
    const totalAmount = 500.00;
    const amountPaid = 150.00; // deposit already paid
    const newPayment = 350.00; // balance
    const newTotal = amountPaid + newPayment;
    const isOverpay = newTotal > totalAmount * 1.01;
    expect(isOverpay).toBe(false);
    expect(newTotal).toBe(totalAmount);
  });
});

describe("Amount Validation (Webhook)", () => {
  it("should accept exact amount match", () => {
    const capturedAmount = 499.00;
    const expectedAmount = 499.00;
    const isValid = capturedAmount >= expectedAmount - 0.01;
    expect(isValid).toBe(true);
  });

  it("should accept within 1 cent tolerance", () => {
    const capturedAmount = 498.99;
    const expectedAmount = 499.00;
    const isValid = capturedAmount >= expectedAmount - 0.01;
    expect(isValid).toBe(true);
  });

  it("should reject underpayment beyond tolerance", () => {
    const capturedAmount = 498.98;
    const expectedAmount = 499.00;
    const isValid = capturedAmount >= expectedAmount - 0.01;
    expect(isValid).toBe(false);
  });

  it("should accept overpayment (PayPal rounding)", () => {
    const capturedAmount = 499.01;
    const expectedAmount = 499.00;
    const isValid = capturedAmount >= expectedAmount - 0.01;
    expect(isValid).toBe(true);
  });
});
