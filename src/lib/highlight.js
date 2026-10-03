// Minimal highlighters for the short snippets in case studies. Each splits
// code into [text, kind] tokens; kind is null for plain text. Not full
// lexers: they cover what the snippets use.
const SWIFT_KEYWORDS =
  "import|let|var|func|struct|class|enum|protocol|extension|return|if|else|guard|for|in|while|switch|case|default|some|any|true|false|nil|self|private|public|static|await|async|throws|try";

const RULES = {
  swift: [
    ["comment", "\\/\\/.*$"],
    ["string", '"(?:[^"\\\\]|\\\\.)*"'],
    ["keyword", `\\b(?:${SWIFT_KEYWORDS})\\b`],
    ["member", "(?<=\\.)[a-z_]\\w*"],
    ["type", "\\b[A-Z]\\w*\\b"],
    ["number", "\\b\\d+(?:\\.\\d+)?\\b"],
  ],
  css: [
    ["comment", "\\/\\*[\\s\\S]*?\\*\\/"],
    ["keyword", "@[\\w-]+"],
    ["type", "[.#][a-zA-Z][\\w-]*(?=[^{};]*\\{)"],
    ["member", "[a-z-]+(?=\\s*:)"],
    ["function", "[a-zA-Z-]+(?=\\()"],
    ["number", "\\b\\d+(?:\\.\\d+)?(?:px|%|ms|s|em|rem|deg)?\\b"],
  ],
};

const PATTERNS = Object.fromEntries(
  Object.entries(RULES).map(([lang, rules]) => [
    lang,
    {
      regex: new RegExp(rules.map(([, source]) => `(${source})`).join("|"), "gm"),
      kinds: rules.map(([kind]) => kind),
    },
  ]),
);

export function highlight(code, lang = "swift") {
  const pattern = PATTERNS[lang];
  if (!pattern) return [[code, null]];
  const tokens = [];
  let last = 0;
  for (const match of code.matchAll(pattern.regex)) {
    if (match.index > last) tokens.push([code.slice(last, match.index), null]);
    const group = match.findIndex((g, i) => i > 0 && g !== undefined);
    tokens.push([match[0], pattern.kinds[group - 1]]);
    last = match.index + match[0].length;
  }
  if (last < code.length) tokens.push([code.slice(last), null]);
  return tokens;
}
