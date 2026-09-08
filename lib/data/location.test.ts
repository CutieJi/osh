import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { locationLabel } from "./location";

/*
 * Every part is nullable because the join that produces them is a left join: a
 * row with no location answers with nulls, not blanks.
 */
describe("locationLabel", () => {
  it("joins the parts in the order they narrow", () => {
    assert.equal(
      locationLabel({ city: "Caloocan City", region: "Metro Manila", country: "Philippines", flag: null }),
      "Caloocan City, Metro Manila, Philippines",
    );
  });

  it("puts the flag after the country, separated by a space", () => {
    assert.equal(
      locationLabel({ city: "Caloocan City", region: null, country: "Philippines", flag: "🇵🇭" }),
      "Caloocan City, Philippines 🇵🇭",
    );
  });

  it("skips a missing part rather than leaving a dangling comma", () => {
    assert.equal(locationLabel({ city: null, region: null, country: "Philippines", flag: null }), "Philippines");
    assert.equal(locationLabel({ city: "Caloocan City", region: null, country: null, flag: null }), "Caloocan City");
  });

  it("falls back to the flag alone when nothing is named", () => {
    assert.equal(locationLabel({ city: null, region: null, country: null, flag: "🇵🇭" }), "🇵🇭");
  });

  it("returns an empty string when there is no location at all", () => {
    assert.equal(locationLabel(null), "");
    assert.equal(locationLabel(undefined), "");
    assert.equal(locationLabel({ city: null, region: null, country: null, flag: null }), "");
  });

  it("treats a blank string as absent, not as a part", () => {
    assert.equal(locationLabel({ city: "", region: "", country: "Philippines", flag: null }), "Philippines");
  });
});
