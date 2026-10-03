// Minimal Swift highlighter for the short snippets in case studies. Splits
// code into [text, kind] tokens; kind is null for plain text. Not a full
// lexer: it covers comments, strings, keywords, types, members and numbers.
const KEYWORDS =
  "import|let|var|func|struct|class|enum|protocol|extension|return|if|else|guard|for|in|while|switch|case|default|some|any|true|false|nil|self|private|public|static|await|async|throws|try";

const TOKEN = new RegExp(
  [
    "(\\/\\/.*$)", // 1 comment
    '("(?:[^"\\\\]|\\\\.)*")', // 2 string
    `\\b(${KEYWORDS})\\b`, // 3 keyword
    "(?<=\\.)([a-z_]\\w*)", // 4 member after a dot
    "\\b([A-Z]\\w*)\\b", // 5 type
    "\\b(\\d+(?:\\.\\d+)?)\\b", // 6 number
  ].join("|"),
  "gm",
);

const KINDS = [null, "comment", "string", "keyword", "member", "type", "number"];

export function highlightSwift(code) {
  const tokens = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    if (match.index > last) tokens.push([code.slice(last, match.index), null]);
    const group = match.findIndex((g, i) => i > 0 && g !== undefined);
    tokens.push([match[0], KINDS[group]]);
    last = match.index + match[0].length;
  }
  if (last < code.length) tokens.push([code.slice(last), null]);
  return tokens;
}
