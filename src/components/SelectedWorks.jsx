"use client";

import { useCallback, useId, useState } from "react";
import { SELECTED_WORKS } from "@/content/selectedWorks";
import ReadCaseStudy from "./ReadCaseStudy";
import FlowDemo from "./FlowDemo";

// Lazy images fade in once decoded instead of popping in mid-scroll. A
// cached image may already be complete before React attaches onLoad.
function ProjectImage({ src, alt, height = 482, current }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useCallback((img) => {
    if (img?.complete && img.naturalWidth) setLoaded(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export
    <img
      ref={ref}
      src={src}
      alt={current ? alt : ""}
      aria-hidden={current ? undefined : true}
      width={666}
      height={height}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      data-loaded={loaded ? "" : undefined}
      data-current={current ? "" : undefined}
      className="project-image absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Project({ project }) {
  const [active, setActive] = useState(0);
  // Keyboard switches are instant: no fade on actions repeated by keys.
  const [instant, setInstant] = useState(false);
  // Demos mount the first time their feature is shown, then stay mounted
  // so switching back fades rather than reloading.
  const [seen, setSeen] = useState(() => new Set([0]));
  const baseId = useId();
  const feature = project.features[active];
  const currentImage = feature.image ?? project.image;
  const images = [
    ...new Map(
      [project.image, ...project.features.map((f) => f.image)]
        .filter(Boolean)
        .map((image) => [image.src, image]),
    ).values(),
  ];
  const hasTabs = project.features.length > 1;
  const panelId = `${baseId}-panel`;

  // Arrow keys move between pills, as in a native tab list.
  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const count = project.features.length;
    const next = (active + step + count) % count;
    setInstant(true);
    setActive(next);
    setSeen((prev) => new Set(prev).add(next));
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <article className="flex flex-col gap-10">
      {/* Figma 2241:1511: title, summary and pills 24px apart. */}
      <div className="flex flex-col gap-6">
        <h3 className="text-xl font-semibold leading-[26px] text-[var(--color-text-primary)]">
          {project.title}
        </h3>
        {project.summary.length > 0 && (
          <div className="flex flex-col gap-2">
            {project.summary.map((text) => (
              <p
                key={text}
                className="text-sm leading-6 text-[var(--color-text-primary)]"
              >
                {text}
              </p>
            ))}
          </div>
        )}
        {hasTabs && (
          <div
            role="tablist"
            aria-label={`${project.title} features`}
            onKeyDown={onKeyDown}
            className="flex flex-wrap gap-2"
          >
            {project.features.map((item, i) => (
              <button
                key={item.title}
                id={`${baseId}-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls={panelId}
                tabIndex={i === active ? 0 : -1}
                onClick={() => {
                  setInstant(false);
                  setActive(i);
                  setSeen((prev) => new Set(prev).add(i));
                }}
                className="feature-pill inline-flex h-7 items-center rounded-full border px-3 text-sm font-semibold leading-[21px] whitespace-nowrap"
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Each feature can have its own screenshot; switching tabs crossfades
          between them. All are stacked so the next one is already decoded. */}
      <figure
        id={panelId}
        role={hasTabs ? "tabpanel" : undefined}
        aria-labelledby={hasTabs ? `${baseId}-tab-${active}` : undefined}
        data-instant={instant ? "" : undefined}
        style={{ aspectRatio: `666 / ${currentImage.height ?? 482}` }}
        className="project-figure relative w-full overflow-hidden rounded-[4px] bg-[var(--color-nav-active)]"
      >
        {images.map((image) => (
          <ProjectImage
            key={image.src}
            src={image.src}
            alt={image.alt}
            height={image.height}
            current={image.src === currentImage.src}
          />
        ))}
        {project.features.map(
          (item, i) =>
            item.demo &&
            seen.has(i) && (
              <FlowDemo
                key={item.title}
                demo={item.demo}
                active={i === active}
              />
            ),
        )}
      </figure>

      <div>
        <ReadCaseStudy caseStudy={feature.caseStudy} />
      </div>
    </article>
  );
}

export default function SelectedWorks() {
  return (
    <section
      id="selected-works"
      aria-labelledby="selected-works-heading"
      className="mx-auto mt-20 max-w-[666px] scroll-mt-16"
    >
      <div className="flex items-center">
        <h2
          id="selected-works-heading"
          className="text-2xl leading-8 font-semibold text-[var(--color-text-muted)]"
        >
          Selected Work
        </h2>
      </div>
      <div className="mt-10 flex flex-col gap-20">
        {SELECTED_WORKS.map((project) => (
          <Project key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
