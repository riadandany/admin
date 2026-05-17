// Tiny message formatter: **bold**, __underline__, ~~strike~~, `code`
// Returns array of React-friendly tokens
export function formatTokens(text) {
  if (!text) return [];
  const tokens = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    const s = m[0];
    if (s.startsWith('**')) tokens.push({ type: 'bold', value: s.slice(2, -2) });
    else if (s.startsWith('__')) tokens.push({ type: 'underline', value: s.slice(2, -2) });
    else if (s.startsWith('~~')) tokens.push({ type: 'strike', value: s.slice(2, -2) });
    else if (s.startsWith('`')) tokens.push({ type: 'code', value: s.slice(1, -1) });
    last = m.index + s.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}
