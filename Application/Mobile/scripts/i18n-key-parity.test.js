/**
 * @file      i18n-key-parity.test.js
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable */

const { FindKeyMismatches } = require("./check-i18n-keys");

describe("i18n key parity", () =>
{
    it("has no missing/extra keys in es-419, ko, ja, or de relative to en-US", () =>
    {
        expect(FindKeyMismatches()).toEqual([ ]);
    });
});
