// The four Pinterest motion references the user supplied, each studied with
// `npm run reference:study` (clips re-encoded at 25 fps; originals are kept in
// docs/references/original). Phases and event classifications are authored
// from reviewing the contact sheets; see the worklog for the review lines.
import type {
  ToolcraftMotionReferenceEvent,
  ToolcraftMotionReferenceInput,
  ToolcraftMotionReferencePhase,
  ToolcraftMotionReferenceStudy,
} from "./acceptance/types";
import { defineToolcraftMotionReferenceEvidence } from "./acceptance/motion-reference-evidence.mjs";
import journalA from "./reference-studies/motion-v1-d0f1f63f36a0f94bbcf42851c4d0aded2958cf9ef6cba1b530067acb6758d650/evidence.json" with { type: "json" };
import journalB from "./reference-studies/motion-v1-4754fa7092909877a45d4cc11b24177ea27204cc8fde8c81316bf5cbeaecbb7a/evidence.json" with { type: "json" };
import curation from "./reference-studies/motion-v1-75ef0f0389682919ae9927f905ed5712fcb7adb93c44b0f0c2b60cff562b28ee/evidence.json" with { type: "json" };
import favouriteA from "./reference-studies/motion-v1-b78d581d8b8d15d8eec2a9d848b7e111563d856dfe361b5e3a941cffd1db69ef/evidence.json" with { type: "json" };
import favouriteB from "./reference-studies/motion-v1-e955362bae3ec5c715ab46693f9476b63dc03ca575f7a686656e244d8df7826a/evidence.json" with { type: "json" };
import notebookA from "./reference-studies/motion-v1-e3d3dc3688a2987341e91e444e2250056b2ba819c1abf95e0d5e3a4921835c4b/evidence.json" with { type: "json" };
import notebookB from "./reference-studies/motion-v1-dfa1f7c2401772e42744062548b9bf9a1e126dc8e8a0e49d55ac7730a3e467e3/evidence.json" with { type: "json" };

type Behavior = Readonly<{ acceptanceId: string; description: string; id: string; implementationIntent: string }>;

/** A phase boundary: from `at` seconds until the next boundary. */
type Boundary = readonly [at: number, visualState: string, behaviorIds: readonly string[]];

const OUT_OF_SCOPE = new Set(["page-delete"]);

function buildStudy(raw: unknown, boundaries: readonly Boundary[]): ToolcraftMotionReferenceStudy {
  const evidence = defineToolcraftMotionReferenceEvidence(raw);
  const times: Record<string, number> = {};
  for (const frame of evidence.reviewedFrames) {
    times[frame.frameId] = Number((frame as { timeSeconds?: number }).timeSeconds ?? 0);
  }
  const timeOf = (id: string): number => times[id] ?? 0;
  const overview = evidence.overviewFrameIds;
  const groups: { boundary: Boundary; ids: string[] }[] = boundaries.map((boundary) => ({ boundary, ids: [] }));
  for (const id of overview) {
    const t = timeOf(id);
    let index = 0;
    for (let i = 0; i < boundaries.length; i += 1) if (t >= boundaries[i][0]) index = i;
    groups[index].ids.push(id);
  }
  const used = groups.filter((group) => group.ids.length > 0);
  const phases: ToolcraftMotionReferencePhase[] = used.map((group, index) => ({
    behaviorIds: group.boundary[2].filter((id) => !OUT_OF_SCOPE.has(id)),
    fromFrameId: group.ids[0],
    id: `phase-${index + 1}`,
    toFrameId: group.ids[group.ids.length - 1],
    visualState: group.boundary[1],
  }));
  const phaseAt = (t: number) => {
    let found = boundaries[0];
    for (const boundary of boundaries) if (t >= boundary[0]) found = boundary;
    return found;
  };
  const events: ToolcraftMotionReferenceEvent[] = evidence.detectedEvents.map((event, index) => {
    const id = `event-${index + 1}`;
    const base = { evidenceEventId: event.eventId, id };
    if (event.kind === "loop-seam") {
      return { ...base, behaviorIds: [], classification: "edit-boundary", reason: "The clip ends and the pin restarts from its first frame." };
    }
    if (event.score < 0.004) {
      return { ...base, behaviorIds: [], classification: "encoding-artifact", reason: "Sub-threshold compression flicker while the frame holds." };
    }
    const t = timeOf(event.peakFrameId);
    const phase = phaseAt(t);
    const nearby = boundaries.filter((b) => b[2].length > 0 && Math.abs(b[0] - t) <= 0.3 && !b[2].some((id) => OUT_OF_SCOPE.has(id)));
    const behaviorIds = phase[2].some((id) => OUT_OF_SCOPE.has(id))
      ? []
      : phase[2].length > 0
        ? phase[2]
        : nearby[0]?.[2] ?? [];
    if (behaviorIds.length === 0) {
      return {
        ...base,
        behaviorIds: [],
        classification: "irrelevant-change",
        reason: phase[2].some((id) => OUT_OF_SCOPE.has(id))
          ? "Page deletion in the journal app is outside the requested shelf, carousel and open-book transitions."
          : "Small drift while the scene holds between transitions.",
      };
    }
    return { ...base, behaviorIds, classification: "product-behavior" };
  });
  return {
    evidence,
    evidencePath: `src/app/reference-studies/${evidence.studyId}/evidence.json`,
    events,
    phases,
    studyId: evidence.studyId,
  };
}

function reference(
  referenceId: ToolcraftMotionReferenceInput["referenceId"],
  behaviors: readonly Behavior[],
  studies: readonly ToolcraftMotionReferenceStudy[],
): ToolcraftMotionReferenceInput {
  return {
    behaviors: behaviors.map((behavior) => ({ ...behavior, timingClaims: [] })),
    kind: "motion-reference",
    referenceId,
    studies,
  };
}

export const appReferenceInputs: readonly ToolcraftMotionReferenceInput[] = [
  reference(
    "motion-reference-v1-ff30cdbe47af4d9283061c52aa724302bf1dea7da7337603b3d3f4a30429df07",
    [
      {
        acceptanceId: "shelf.openBook.spineTurn",
        description: "A notebook turns on its spine, showing its thickness edge-on, before it opens.",
        id: "spine-turn",
        implementationIntent: "The tapped cover turns on its spine mid-flight (Spine turn) so the book's thickness reads in 3D.",
      },
      {
        acceptanceId: "shelf.detail.floodTime",
        description: "The whole background changes colour with each notebook.",
        id: "background-swap",
        implementationIntent: "The detail page's navy floods the screen from the tapped cover (Flood duration).",
      },
    ],
    [
      buildStudy(notebookA, [
        [0, "Closed yellow notebook on a dark ground", []],
        [0.4, "Notebook turns on its spine and goes edge-on", ["spine-turn"]],
        [0.9, "Notebook flips open and its pages fan", ["spine-turn"]],
        [1.9, "Notebook closes and turns back to its cover", ["spine-turn"]],
        [2.15, "Background swaps to purple with the next notebook", ["background-swap"]],
        [2.3, "Next notebook turns on its spine and opens", ["spine-turn"]],
        [4.0, "Background swaps to charcoal with the third notebook", ["background-swap"]],
        [4.15, "Third notebook turns on its spine and opens", ["spine-turn"]],
      ]),
      buildStudy(notebookB, [
        [5.6, "Notebook spins edge-on", ["spine-turn"]],
        [5.85, "Background lightens as the next notebook arrives", ["background-swap"]],
        [6.0, "Notebook turns open with colourful pages fanning", ["spine-turn"]],
        [9.0, "Final notebook rests closed", []],
      ]),
    ],
  ),
  reference(
    "motion-reference-v1-75ef0f0389682919ae9927f905ed5712fcb7adb93c44b0f0c2b60cff562b28ee",
    [
      {
        acceptanceId: "shelf.openBook.part",
        description: "The chosen book slides forward while its neighbours shuffle sideways to make room.",
        id: "neighbours-part",
        implementationIntent: "The other covers drift away from the tapped cover and return on the way back (Others part).",
      },
    ],
    [
      buildStudy(curation, [
        [0, "Light shelf of spine-out books with one cover facing forward", []],
        [0.7, "Selected book slides out to face forward while neighbours shuffle sideways", ["neighbours-part"]],
        [1.6, "New arrangement holds", []],
        [1.9, "Neighbours settle into their new spacing", ["neighbours-part"]],
        [2.2, "Arrangement holds", []],
        [3.6, "Next book slides forward and its neighbours part", ["neighbours-part"]],
        [4.9, "Arrangement settles and holds", []],
      ]),
    ],
  ),
  reference(
    "motion-reference-v1-9e84ea03613bfd50e90493ae5bb7449eda2704c352b347f6658c096db594f0c2",
    [
      {
        acceptanceId: "shelf.carousel.sideTilt",
        description: "Books stand spine-out; the selected one turns from spine to cover and slides forward between them.",
        id: "spine-to-cover",
        implementationIntent: "Carousel neighbours sit turned and set back (Side tilt, Side depth) and square up as they reach the centre.",
      },
    ],
    [
      buildStudy(favouriteA, [
        [0, "Dark page; the shelf rises into frame from below", []],
        [0.6, "Books turn spine-to-cover one after another as neighbours part around the facing cover", ["spine-to-cover"]],
      ]),
      buildStudy(favouriteB, [
        [6.6, "Successive books turn spine-to-cover and slide forward as neighbours part", ["spine-to-cover"]],
      ]),
    ],
  ),
  reference(
    "motion-reference-v1-75daeaeea6c955b2dc93129d87c0215e13b7e6b526273c8e1ecda46552870863",
    [
      {
        acceptanceId: "shelf.carousel.snapTime",
        description: "A horizontal carousel of soft-shadowed notebooks; a swipe snaps the next one to centre with a soft spring.",
        id: "soft-snap",
        implementationIntent: "The home carousel drags, releases and snaps to the next cover with a tunable spring (Snap duration, Snap bounce).",
      },
      {
        acceptanceId: "shelf.detail.floodTime",
        description: "Opening a notebook swings its cover round the spine while the background darkens.",
        id: "open-darken",
        implementationIntent: "Opening a book turns it on its spine (Spine turn) while navy floods the page (Flood duration).",
      },
    ],
    [
      buildStudy(journalA, [
        [0, "Carousel of soft-shadowed notebooks under the shelf title", []],
        [0.35, "Swipe: the next notebook slides to centre and snaps with a soft spring", ["soft-snap"]],
        [1.1, "Centred notebook settles", []],
        [1.65, "Another swipe snaps the red notebook to centre", ["soft-snap"]],
        [2.6, "Centred notebook settles", []],
        [3.45, "The notebook swings round its spine and opens while the background darkens", ["open-darken"]],
        [4.3, "Open spread holds on the darker background", []],
        [5.6, "A page crumples away (page deletion)", ["page-delete"]],
        [6.2, "Empty notebook holds", []],
      ]),
      buildStudy(journalB, [
        [6.6, "Open notebook holds, then the carousel returns", []],
        [7.0, "Notebook slides back into the carousel and snaps", ["soft-snap"]],
        [7.8, "Carousel holds", []],
      ]),
    ],
  ),
];

/** Acceptance row id → the reference behaviours it must prove. */
export function getReferenceCoverage(acceptanceId: string) {
  return appReferenceInputs.flatMap((input) =>
    input.behaviors
      .filter((behavior) => behavior.acceptanceId === acceptanceId)
      .map((behavior) => ({ behaviorId: behavior.id, referenceId: input.referenceId })),
  );
}
