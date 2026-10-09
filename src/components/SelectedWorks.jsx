"use client";

import { useCallback, useId, useState } from "react";
import { SELECTED_WORKS } from "@/content/selectedWorks";
import { useCaseStudy } from "./CaseStudyDrawer";

function ReadCaseStudy({ caseStudy }) {
  const ctx = useCaseStudy();
  const available = caseStudy && ctx?.has(caseStudy);
  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => available && ctx.open(caseStudy)}
      title={available ? undefined : "Case study coming soon"}
      className="read-case-study inline-flex h-8 items-center rounded-[6px] bg-[var(--color-text-primary)] px-3 text-sm font-medium leading-[21px] text-white"
    >
      Read Case Study
      {!available && <span className="sr-only"> (coming soon)</span>}
    </button>
  );
}

// Lazy images fade in once decoded instead of popping in mid-scroll. A
// cached image may already be complete before React attaches onLoad.
function ProjectImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useCallback((img) => {
    if (img?.complete && img.naturalWidth) setLoaded(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={666}
      height={482}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      data-loaded={loaded ? "" : undefined}
      className="project-image absolute inset-0 h-full w-full object-cover"
    />
  );
}

function Project({ project }) {
  const [active, setActive] = useState(0);
  // Keyboard switches are instant: no fade on actions repeated by keys.
  const [instant, setInstant] = useState(false);
  const baseId = useId();
  const feature = project.features[active];
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
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  return (
    <article className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold leading-[26px] text-[var(--color-text-primary)]">
          {project.title}
        </h3>
        {project.summary.map((text) => (
          <p key={text} className="text-sm font-medium leading-6 text-[var(--color-text-primary)]">
            {text}
          </p>
        ))}
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
                }}
                className="feature-pill inline-flex h-7 items-center rounded-full border px-3 text-sm font-medium leading-[21px] whitespace-nowrap"
              >
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <figure className="relative aspect-[666/482] w-full overflow-hidden rounded-[4px] bg-[var(--color-nav-active)]">
        <ProjectImage src={project.image.src} alt={project.image.alt} />
      </figure>

      <div
        id={panelId}
        role={hasTabs ? "tabpanel" : undefined}
        aria-labelledby={hasTabs ? `${baseId}-tab-${active}` : undefined}
        className="flex flex-col items-start gap-6"
      >
        {/* Keyed so a new feature's copy fades in rather than snapping. */}
        <div
          key={active}
          data-instant={instant ? "" : undefined}
          className="feature-caption flex flex-col gap-2"
        >
          {feature.title && (
            <h4 className="text-base font-semibold leading-[26px] text-[var(--color-text-primary)]">
              {feature.title}
            </h4>
          )}
          <p className="text-sm font-medium leading-6 text-[var(--color-text-primary)]">
            {feature.description ?? "Case study coming soon."}
          </p>
        </div>
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
          className="text-[13px] font-medium leading-[19px] text-[var(--color-text-muted)]"
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
