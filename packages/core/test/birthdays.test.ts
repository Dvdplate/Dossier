import { describe, it, expect } from "vitest";
import { birthdaysUpcoming, groupBirthdaysByMonth } from "../src/birthdays.js";
import { localToInstant } from "../src/time.js";
import type { Birthday } from "../src/types.js";

function makeBirthday(overrides: Partial<Birthday> & { name: string }): Birthday {
  return {
    id: 1,
    birthMonth: 6,
    birthDay: 15,
    birthYear: null,
    note: null,
    createdAt: 0,
    ...overrides,
  };
}

describe("birthdaysUpcoming", () => {
  it("finds a birthday today", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 10 });
    const list = [makeBirthday({ name: "Alice", birthMonth: 6, birthDay: 15 })];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("today");
    expect(result[0].daysUntil).toBe(0);
  });

  it("finds a birthday in N days", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 12, hour: 10 });
    const list = [makeBirthday({ name: "Bob", birthMonth: 6, birthDay: 15 })];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(1);
    expect(result[0].daysUntil).toBe(3);
    expect(result[0].label).toBe("in 3 days");
  });

  it("excludes birthdays beyond the window", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 1, hour: 10 });
    const list = [makeBirthday({ name: "Far", birthMonth: 6, birthDay: 15 })];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(0);
  });

  it("handles Dec→Jan wrap", () => {
    const now = localToInstant({ year: 2025, month: 12, day: 29, hour: 10 });
    const list = [makeBirthday({ name: "NewYear", birthMonth: 1, birthDay: 2 })];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(1);
    expect(result[0].daysUntil).toBe(4);
  });

  it("handles Feb 29 birthday in common year (clamps to 28)", () => {
    const now = localToInstant({ year: 2025, month: 2, day: 25, hour: 10 });
    const list = [makeBirthday({ name: "Leaper", birthMonth: 2, birthDay: 29 })];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(1);
    expect(result[0].daysUntil).toBe(3); // Feb 28
  });

  it("returns multiple birthdays on the same day", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 10 });
    const list = [
      makeBirthday({ id: 1, name: "Alice", birthMonth: 6, birthDay: 15 }),
      makeBirthday({ id: 2, name: "Bob", birthMonth: 6, birthDay: 15 }),
    ];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result).toHaveLength(2);
  });

  it("calculates turning age when birthYear is set", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 10 });
    const list = [
      makeBirthday({ name: "Charlie", birthMonth: 6, birthDay: 15, birthYear: 1990 }),
    ];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result[0].turning).toBe(35);
  });

  it("sorts by daysUntil then name", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 10, hour: 10 });
    const list = [
      makeBirthday({ id: 1, name: "Zara", birthMonth: 6, birthDay: 12 }),
      makeBirthday({ id: 2, name: "Alice", birthMonth: 6, birthDay: 12 }),
      makeBirthday({ id: 3, name: "Bob", birthMonth: 6, birthDay: 11 }),
    ];

    const result = birthdaysUpcoming(list, now, 7);
    expect(result.map((r) => r.name)).toEqual(["Bob", "Alice", "Zara"]);
  });
});

describe("groupBirthdaysByMonth", () => {
  it("groups by calendar month (not custom 25→24)", () => {
    const list = [
      makeBirthday({ id: 1, name: "Jan", birthMonth: 1, birthDay: 5 }),
      makeBirthday({ id: 2, name: "JanLate", birthMonth: 1, birthDay: 28 }),
      makeBirthday({ id: 3, name: "Mar", birthMonth: 3, birthDay: 10 }),
    ];

    const groups = groupBirthdaysByMonth(list);
    expect(groups).toHaveLength(2); // Jan and Mar only
    expect(groups[0].month).toBe(1);
    expect(groups[0].monthName).toBe("January");
    expect(groups[0].contacts).toHaveLength(2);
    expect(groups[1].month).toBe(3);
  });

  it("sorts contacts within month by day", () => {
    const list = [
      makeBirthday({ id: 1, name: "Late", birthMonth: 6, birthDay: 20 }),
      makeBirthday({ id: 2, name: "Early", birthMonth: 6, birthDay: 5 }),
    ];

    const groups = groupBirthdaysByMonth(list);
    expect(groups[0].contacts[0].name).toBe("Early");
    expect(groups[0].contacts[1].name).toBe("Late");
  });

  it("returns months in Jan→Dec order", () => {
    const list = [
      makeBirthday({ id: 1, name: "Dec", birthMonth: 12, birthDay: 1 }),
      makeBirthday({ id: 2, name: "Feb", birthMonth: 2, birthDay: 1 }),
    ];

    const groups = groupBirthdaysByMonth(list);
    expect(groups[0].month).toBe(2);
    expect(groups[1].month).toBe(12);
  });

  it("calculates current age when birthYear set", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 10 });
    const list = [
      makeBirthday({ name: "Young", birthMonth: 3, birthDay: 10, birthYear: 2000 }),
    ];

    const groups = groupBirthdaysByMonth(list, now);
    expect(groups[0].contacts[0].currentAge).toBe(25);
  });

  it("adjusts age if birthday hasn't happened yet this year", () => {
    const now = localToInstant({ year: 2025, month: 6, day: 15, hour: 10 });
    const list = [
      makeBirthday({ name: "Later", birthMonth: 9, birthDay: 10, birthYear: 2000 }),
    ];

    const groups = groupBirthdaysByMonth(list, now);
    expect(groups[0].contacts[0].currentAge).toBe(24);
  });

  it("omits empty months", () => {
    const groups = groupBirthdaysByMonth([]);
    expect(groups).toHaveLength(0);
  });
});
