import { describe, expect, it, vi } from "vitest";

const searchEventListItems = vi.fn();

vi.mock("@/lib/data/queries", () => ({
  searchEventListItems,
}));

describe("GET /api/events", () => {
  it("returns the expanded event catalog with child markets", async () => {
    const events = Array.from({ length: 120 }, (_, index) => ({
      id: `event_${index}`,
      title: `Event ${index}`,
      childMarkets: [
        { id: `market_${index}_1` },
        { id: `market_${index}_2` },
      ],
    }));
    searchEventListItems.mockResolvedValue(events);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(searchEventListItems).toHaveBeenCalledWith("");
    await expect(response.json()).resolves.toMatchObject({
      events,
    });
  });
});
