export type RelativeTimeUnit = "Day" | "Hour" | "Minute" | "Month" | "Now" | "Year";

export interface RelativeTimeParts
{
    readonly Count?: number;
    readonly Unit: RelativeTimeUnit;
}

/** Returns a localized-label key and floored count for a creation timestamp. */
export const GetRelativeTimeParts = (
    CreatedAt: Date,
    Now: Date = new Date()
): RelativeTimeParts =>
{
    const Difference = Math.max(0, Now.getTime() - CreatedAt.getTime());
    const Minutes = Math.floor(Difference / 60_000);

    if (Minutes < 1)
    {
        return { Unit: "Now" };
    }

    if (Minutes < 60)
    {
        return { Count: Minutes, Unit: "Minute" };
    }

    const Hours = Math.floor(Minutes / 60);
    if (Hours < 24)
    {
        return { Count: Hours, Unit: "Hour" };
    }

    const Days = Math.floor(Hours / 24);
    if (Days < 30)
    {
        return { Count: Days, Unit: "Day" };
    }

    if (Days < 365)
    {
        return { Count: Math.floor(Days / 30), Unit: "Month" };
    }

    return { Count: Math.floor(Days / 365), Unit: "Year" };
};
