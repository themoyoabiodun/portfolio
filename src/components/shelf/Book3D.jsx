// A book as a CSS box: six faces around a w × h × d volume, centred on its
// parent. The front cover faces +Z, the spine faces −X, so rotateY(90deg)
// turns the spine toward the viewer, the way a book stands on a shelf.
const face = {
  position: "absolute",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

const PAGES =
  "repeating-linear-gradient(90deg, #f6f1e7 0 1px, #e9e2d3 1px 2px)";
const PAGES_TOP =
  "repeating-linear-gradient(0deg, #f6f1e7 0 1px, #e6dfcf 1px 2px)";

function Ornament({ book }) {
  const common = { position: "absolute", left: "50%", translate: "-50% 0" };
  if (book.ornament === 0) {
    return (
      <span
        style={{
          ...common,
          bottom: 30,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: book.accent,
          opacity: 0.9,
        }}
      />
    );
  }
  if (book.ornament === 1) {
    return (
      <span
        style={{
          ...common,
          bottom: 28,
          width: 72,
          height: 44,
          background: `repeating-linear-gradient(0deg, ${book.accent} 0 4px, transparent 4px 9px)`,
          opacity: 0.85,
        }}
      />
    );
  }
  return (
    <span
      style={{
        ...common,
        bottom: 26,
        width: 54,
        height: 70,
        borderRadius: "27px 27px 2px 2px",
        border: `3px solid ${book.accent}`,
      }}
    />
  );
}

export default function Book3D({ book }) {
  const { w, h, d, bg, ink, accent, title, author } = book;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Front cover */}
      <div
        style={{
          ...face,
          inset: 0,
          transform: `translateZ(${d / 2}px)`,
          background: `linear-gradient(90deg, rgba(0,0,0,0.28) 0, rgba(0,0,0,0.05) 7px, rgba(255,255,255,0.08) 9px, rgba(0,0,0,0) 40%), ${bg}`,
          color: ink,
          borderRadius: "1px 4px 4px 1px",
          padding: "22px 16px 0 20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 19,
            lineHeight: "22px",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            opacity: 0.8,
          }}
        >
          {author}
        </div>
        <Ornament book={book} />
      </div>

      {/* Back cover */}
      <div
        style={{
          ...face,
          inset: 0,
          transform: `rotateY(180deg) translateZ(${d / 2}px)`,
          background: `linear-gradient(90deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.25)), ${bg}`,
          borderRadius: "4px 1px 1px 4px",
        }}
      />

      {/* Spine */}
      <div
        style={{
          ...face,
          left: (w - d) / 2,
          top: 0,
          width: d,
          height: h,
          transform: `rotateY(-90deg) translateZ(${w / 2}px)`,
          background: `linear-gradient(90deg, rgba(0,0,0,0.22), rgba(255,255,255,0.14) 35%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.25)), ${bg}`,
          color: ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 0",
        }}
      >
        <span style={{ width: "70%", height: 3, background: accent }} />
        <span
          style={{
            writingMode: "vertical-rl",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            maxHeight: h - 48,
          }}
        >
          {title}
        </span>
        <span style={{ width: "70%", height: 3, background: accent }} />
      </div>

      {/* Fore-edge (pages) */}
      <div
        style={{
          ...face,
          left: (w - d) / 2,
          top: 0,
          width: d,
          height: h,
          transform: `rotateY(90deg) translateZ(${w / 2 - 1}px)`,
          background: PAGES,
          boxShadow: "inset 0 0 0 2px " + bg,
        }}
      />

      {/* Top edge */}
      <div
        style={{
          ...face,
          left: 0,
          top: (h - d) / 2,
          width: w,
          height: d,
          transform: `rotateX(90deg) translateZ(${h / 2}px)`,
          background: PAGES_TOP,
          boxShadow: `inset 3px 0 0 ${bg}, inset 0 0 0 1px ${bg}`,
        }}
      />

      {/* Bottom edge */}
      <div
        style={{
          ...face,
          left: 0,
          top: (h - d) / 2,
          width: w,
          height: d,
          transform: `rotateX(-90deg) translateZ(${h / 2}px)`,
          background: "#d8d0bf",
          boxShadow: `inset 3px 0 0 ${bg}`,
        }}
      />
    </div>
  );
}
