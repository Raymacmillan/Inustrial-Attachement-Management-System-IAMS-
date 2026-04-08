/**
 *
 * Unit tests for the core validation logic used during registration.
 * These functions live in AuthContext.jsx and are called in signUpNewUser.
 */

import { describe, test, expect } from "vitest";


const isValidStudentId = (id) => /^\d{9}$/.test(id);

const isPasswordStrong = (password) => {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{8,}$/;
  return regex.test(password);
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Student ID Validation
//
// Rule: must be EXACTLY 9 digits, nothing else.
// This is required by T-05 in the sprint backlog.
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidStudentId", () => {

  // ── Valid cases ──

  test("accepts a standard 9-digit UB student ID", () => {
    expect(isValidStudentId("202303013")).toBe(true);
  });

  test("accepts another valid 9-digit ID", () => {
    expect(isValidStudentId("202300366")).toBe(true);
  });

  // ── Invalid cases ──

  test("rejects an ID that is too short (8 digits)", () => {
    expect(isValidStudentId("20230301")).toBe(false);
  });

  test("rejects an ID that is too long (10 digits)", () => {
    expect(isValidStudentId("2023030130")).toBe(false);
  });

  test("rejects an ID that contains letters", () => {
    expect(isValidStudentId("20230301A")).toBe(false);
  });

  test("rejects an ID with spaces", () => {
    expect(isValidStudentId("202 03013")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isValidStudentId("")).toBe(false);
  });

  test("rejects undefined gracefully", () => {
    // undefined converted to string "undefined" — 9 chars but has letters
    expect(isValidStudentId(String(undefined))).toBe(false);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Password Strength Validation
//
// Rule: at least 8 characters, 1 uppercase, 1 digit, 1 special character.
// This protects all IAMS user accounts.
// ─────────────────────────────────────────────────────────────────────────────

describe("isPasswordStrong", () => {

  // ── Valid cases ──

  test("accepts a password meeting all requirements", () => {
    expect(isPasswordStrong("Secure@123")).toBe(true);
  });

  test("accepts a longer complex password", () => {
    expect(isPasswordStrong("MyP@ssw0rd!")).toBe(true);
  });

  test("accepts a password with exactly 8 characters meeting all rules", () => {
    expect(isPasswordStrong("Ab1!abcd")).toBe(true);
  });

  // ── Invalid cases — each one missing exactly one requirement ──

  test("rejects a password with no uppercase letter", () => {
    // has digit, has special char, has 8+ chars — but no uppercase
    expect(isPasswordStrong("secure@123")).toBe(false);
  });

  test("rejects a password with no digit", () => {
    // has uppercase, has special char, has 8+ chars — but no digit
    expect(isPasswordStrong("Secure@abc")).toBe(false);
  });

  test("rejects a password with no special character", () => {
    // has uppercase, has digit, has 8+ chars — but no special char
    expect(isPasswordStrong("Secure123")).toBe(false);
  });

  test("rejects a password that is too short (7 chars)", () => {
    // has uppercase, digit, special char — but only 7 characters
    expect(isPasswordStrong("Se@1abc")).toBe(false);
  });

  test("rejects an empty password", () => {
    expect(isPasswordStrong("")).toBe(false);
  });

  test("rejects a common weak password", () => {
    expect(isPasswordStrong("password")).toBe(false);
  });

  test("rejects a password that is all numbers", () => {
    expect(isPasswordStrong("123456789")).toBe(false);
  });

});