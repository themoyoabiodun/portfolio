import { describe, expect, it } from "vitest";

import {
  appAcceptance,
  validateProductAcceptanceCoverage,
} from "./app-acceptance";
import { appSchema } from "./app-schema";
import { SHELF_DEFAULT_LOOP_SECONDS, SHELF_VIEW_TARGET } from "./shelf/motion-values";

describe("appSchema", () => {
  it("declares production reload coverage for the shelf schema", () => {
    expect(appSchema.persistence.storage).toBe("localStorage");
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("The shelf lab must persist its workspace in localStorage.");
    }
    expect(appSchema.persistence.include).toEqual(
      expect.arrayContaining(["canvas", "panels", "timeline", "values"]),
    );
    expect(appAcceptance.find((entry) => entry.id === "persistence.reload")).toMatchObject({
      evidence: "persistence-state",
      persistenceCoverage: "reload",
      persistenceSlices: appSchema.persistence.include,
    });
    expect(validateProductAcceptanceCoverage()).toEqual([]);
  });

  it("declares the playback timeline, orbit gizmo and editable output canvas", () => {
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    const titles = appSchema.panels.controls?.sections.map((section) => section.title);
    expect(titles).toEqual(
      expect.arrayContaining(["Shelf", "Pick Up", "Flight", "Landing", "Confirmation"]),
    );
    const gizmos = appSchema.panels.controls?.sections.flatMap((section) =>
      Object.values(section.controls).filter((control) => control.type === "orientationGizmo"),
    );
    expect(gizmos?.map((control) => control.target)).toEqual([SHELF_VIEW_TARGET]);
    expect(SHELF_DEFAULT_LOOP_SECONDS).toBeGreaterThan(0);
  });
});
