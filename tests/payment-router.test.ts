import { describe, it, expect, beforeEach } from "vitest"

// ----------------------
// Types
// ----------------------

type Principal = string
type Token = string // (buff 32) hex encoded

interface PaymentRecord {
  sender: Principal
  recipient: Principal
  amount: number
  token: Token
  status: string
  timestamp: number
}

// ----------------------
// Mock Contract State
// ----------------------

const mockContract = {
  admin: "ST1ADMIN11111111111111111111111111111111",
  supportedTokens: new Map<Token, boolean>(),
  userBalances: new Map<string, number>(), // key = `${principal}_${token}`
  paymentRecords: new Map<number, PaymentRecord>(),
  paymentIdCounter: 0,

  // ----------------------
  // Helpers
  // ----------------------

  getBalanceKey(user: Principal, token: Token): string {
    return `${user}_${token}`
  },

  isAdmin(caller: Principal): boolean {
    return caller === this.admin
  },

  isTokenSupported(token: Token): boolean {
    return this.supportedTokens.get(token) === true
  },

  generatePaymentId(): number {
    return this.paymentIdCounter++
  },

  // ----------------------
  // Contract Functions
  // ----------------------

  addSupportedToken(caller: Principal, token: Token) {
    if (!this.isAdmin(caller)) return { error: 100 }
    this.supportedTokens.set(token, true)
    return { value: true }
  },

  removeSupportedToken(caller: Principal, token: Token) {
    if (!this.isAdmin(caller)) return { error: 100 }
    this.supportedTokens.delete(token)
    return { value: true }
  },

  transferAdmin(caller: Principal, newAdmin: Principal) {
    if (!this.isAdmin(caller)) return { error: 100 }
    this.admin = newAdmin
    return { value: true }
  },

  deposit(caller: Principal, amount: number, token: Token) {
    if (!this.isTokenSupported(token)) return { error: 101 }
    const key = this.getBalanceKey(caller, token)
    const current = this.userBalances.get(key) || 0
    this.userBalances.set(key, current + amount)
    return { value: true }
  },

  initiatePayment(caller: Principal, recipient: Principal, amount: number, token: Token) {
    if (!this.isTokenSupported(token)) return { error: 101 }

    const senderKey = this.getBalanceKey(caller, token)
    const senderBalance = this.userBalances.get(senderKey) || 0

    if (senderBalance < amount) return { error: 102 }

    // Debit sender
    this.userBalances.set(senderKey, senderBalance - amount)

    // Credit recipient
    const recipientKey = this.getBalanceKey(recipient, token)
    const recipientBalance = this.userBalances.get(recipientKey) || 0
    this.userBalances.set(recipientKey, recipientBalance + amount)

    // Record payment
    const id = this.generatePaymentId()
    this.paymentRecords.set(id, {
      sender: caller,
      recipient,
      amount,
      token,
      status: "completed",
      timestamp: Date.now(),
    })

    return { value: id }
  },

  getBalance(user: Principal, token: Token): number {
    return this.userBalances.get(this.getBalanceKey(user, token)) || 0
  },

  getPayment(id: number): { value?: PaymentRecord; error?: number } {
    const record = this.paymentRecords.get(id)
    if (!record) return { error: 103 }
    return { value: record }
  },
}

// ----------------------
// Test Suite
// ----------------------

describe("Borderless Payment Router Contract", () => {
  const admin = "ST1ADMIN11111111111111111111111111111111"
  const user1 = "ST2USER11111111111111111111111111111111"
  const user2 = "ST3USER22222222222222222222222222222222"
  const token = "0x55534443" // USDC (hex mock)

  beforeEach(() => {
    mockContract.admin = admin
    mockContract.supportedTokens.clear()
    mockContract.userBalances.clear()
    mockContract.paymentRecords.clear()
    mockContract.paymentIdCounter = 0
  })

  it("allows admin to add a supported token", () => {
    const result = mockContract.addSupportedToken(admin, token)
    expect(result).toEqual({ value: true })
    expect(mockContract.isTokenSupported(token)).toBe(true)
  })

  it("prevents non-admin from adding a supported token", () => {
    const result = mockContract.addSupportedToken(user1, token)
    expect(result).toEqual({ error: 100 })
  })

  it("allows deposit of supported token", () => {
    mockContract.addSupportedToken(admin, token)
    const result = mockContract.deposit(user1, 1000, token)
    expect(result).toEqual({ value: true })
    expect(mockContract.getBalance(user1, token)).toBe(1000)
  })

  it("prevents deposit of unsupported token", () => {
    const result = mockContract.deposit(user1, 1000, token)
    expect(result).toEqual({ error: 101 })
  })

  it("initiates a payment successfully", () => {
    mockContract.addSupportedToken(admin, token)
    mockContract.deposit(user1, 1000, token)

    const result = mockContract.initiatePayment(user1, user2, 500, token)
    expect(result.value).toBeTypeOf("number")
    expect(mockContract.getBalance(user1, token)).toBe(500)
    expect(mockContract.getBalance(user2, token)).toBe(500)

    const payment = mockContract.getPayment(result.value!)
    expect(payment.value).toMatchObject({
      sender: user1,
      recipient: user2,
      amount: 500,
      token,
      status: "completed",
    })
  })

  it("prevents payment if balance is insufficient", () => {
    mockContract.addSupportedToken(admin, token)
    mockContract.deposit(user1, 300, token)

    const result = mockContract.initiatePayment(user1, user2, 500, token)
    expect(result).toEqual({ error: 102 })
  })

  it("transfers admin rights", () => {
    const result = mockContract.transferAdmin(admin, user1)
    expect(result).toEqual({ value: true })
    expect(mockContract.admin).toBe(user1)
  })

  it("returns error for nonexistent payment ID", () => {
    const result = mockContract.getPayment(999)
    expect(result).toEqual({ error: 103 })
  })
})
