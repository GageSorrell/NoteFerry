import { GetRelativeTimeParts } from "./RelativeTime";
import { describe, expect, it } from "@jest/globals";

const At = (MinutesAgo: number): Date =>
    new Date(Date.UTC(2026, 0, 1, 12, 0, 0) - (MinutesAgo * 60_000));

describe("GetRelativeTimeParts", () =>
{
    const Now = At(0);

    it("uses minutes below one hour", () =>
    {
        expect(GetRelativeTimeParts(At(5), Now)).toEqual({ Count: 5, Unit: "Minute" });
    });

    it("floors to the coarsest elapsed unit", () =>
    {
        expect(GetRelativeTimeParts(At(125), Now)).toEqual({ Count: 2, Unit: "Hour" });
        expect(GetRelativeTimeParts(At(2_885), Now)).toEqual({ Count: 2, Unit: "Day" });
    });

    it("reports a future or sub-minute page as now", () =>
    {
        expect(GetRelativeTimeParts(At(-1), Now)).toEqual({ Unit: "Now" });
        expect(GetRelativeTimeParts(new Date(Now.getTime() - 59_999), Now))
            .toEqual({ Unit: "Now" });
    });
});
