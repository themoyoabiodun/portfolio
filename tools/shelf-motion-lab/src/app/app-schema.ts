import {
  defineToolcraft,
  imageExportModule,
  spatialViewModule,
  timelineModule,
} from "@/toolcraft/runtime";

import appDefaults from "./app-defaults.json" with { type: "json" };
import { appIdentity } from "./app-identity";
import { shelfControlSections } from "./shelf/motion-schema-sections";
import { SHELF_DEFAULT_LOOP_SECONDS } from "./shelf/motion-values";

export const appSchema = defineToolcraft({
  defaults: appDefaults,
  base: {
    canvas: {
      enabled: true,
      renderScale: true,
      size: { height: 720, unit: "px", width: 1280 },
      sizing: { mode: "editable-output" },
    },
    identity: appIdentity,
    panels: {
      controls: {
        sections: shelfControlSections,
        title: "Shelf Motion",
      },
    },
    toolbar: {
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    },
  },
  modules: [
    imageExportModule(),
    spatialViewModule(),
    timelineModule({
      defaultDurationSeconds: SHELF_DEFAULT_LOOP_SECONDS,
      mode: "playback",
    }),
  ],
});
