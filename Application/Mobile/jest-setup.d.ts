/**
 * `@types/jest` ships `jest` only as a type-only namespace, not as a global
 * value declaration, so plain `jest.mock(...)`/`jest.fn(...)` calls don't
 * typecheck as-is. Importing the value from `@jest/globals` instead would
 * fix the type, but `jest.mock()` calls are hoisted by Babel above other
 * imports in the same file, which breaks at runtime if `jest` itself is one
 * of those imports. This restores the ambient value (typed from
 * `@jest/globals`, which Jest injects into every test file's global scope
 * regardless) so test files can keep calling the bare, hoisting-safe
 * `jest.mock()`/`jest.fn()` while still importing `describe`/`it`/`expect`/
 * `beforeAll` explicitly from `@jest/globals`.
 *
 * @file      jest-setup.d.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

declare const jest: typeof import("@jest/globals")[ "jest" ];
