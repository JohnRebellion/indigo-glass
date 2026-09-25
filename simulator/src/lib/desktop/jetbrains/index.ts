import type { ContrastPair, Role, SurfaceMeta } from '../surface';
import { ours, stock, attr, hex } from './model';

export const meta: SurfaceMeta = {
  id: 'jetbrains',
  name: 'JetBrains editor colour scheme',
  group: 'app',
  order: 4,
  shipped: [{ path: 'jetbrains/Indigo Glass.icls' }],
  stockSource:
    "IntelliJ's own built-in Darcula: JetBrains/intellij-community's " +
    'platform/platform-resources/src/DefaultColorSchemesManager.xml, the ' +
    '<scheme name="Darcula" parent_scheme="Default" ...> block (HEAD 2026-09-25), ' +
    'saved as simulator/fixtures/stock/jetbrains/Darcula.xml -- the exact scheme ' +
    'Indigo Glass.icls declares as its own parent_scheme.',
  fidelity: 'medium',
  fidelityWhy:
    'Every colour and font-style flag is read straight from both .icls/.xml files, ' +
    'so role values and contrast are exact. The editor specimen is a static code sample ' +
    'in a fixed layout, not a real syntax highlighter, so token classification (which ' +
    'span gets which TextAttributesKey) is asserted by this page rather than computed ' +
    'by a language lexer.',
  live: "Settings > Editor > Color Scheme shows the active scheme; importing Indigo Glass.icls " +
    'and comparing an open file against this page is a manual check this agent session cannot ' +
    'perform (no JetBrains IDE running here).'
};

const kw = attr(ours, 'DEFAULT_KEYWORD');
const str = attr(ours, 'DEFAULT_STRING');
const num = attr(ours, 'DEFAULT_NUMBER');
const cls = attr(ours, 'DEFAULT_CLASS_NAME');
const fn = attr(ours, 'DEFAULT_FUNCTION_DECLARATION');
const cmt = attr(ours, 'DEFAULT_LINE_COMMENT');
const doc = attr(ours, 'DEFAULT_DOC_COMMENT');
const ident = attr(ours, 'DEFAULT_IDENTIFIER');
const err = attr(ours, 'ERRORS_ATTRIBUTES');
const warn = attr(ours, 'WARNING_ATTRIBUTES');
const escOk = attr(ours, 'DEFAULT_VALID_STRING_ESCAPE');
const escBad = attr(ours, 'DEFAULT_INVALID_STRING_ESCAPE');
const vcsNew = attr(ours, 'GUTTER_VCS_NEW');
const vcsDel = attr(ours, 'GUTTER_VCS_REMOVED');
const vcsMod = attr(ours, 'GUTTER_VCS_MODIFIED');

const skw = attr(stock, 'DEFAULT_KEYWORD');
const sstr = attr(stock, 'DEFAULT_STRING');
const snum = attr(stock, 'DEFAULT_NUMBER');
const scls = attr(stock, 'DEFAULT_CLASS_NAME');
const sfn = attr(stock, 'DEFAULT_FUNCTION_DECLARATION');
const scmt = attr(stock, 'DEFAULT_LINE_COMMENT');
const sident = attr(stock, 'DEFAULT_IDENTIFIER');
const serr = attr(stock, 'ERRORS_ATTRIBUTES');

export const roles: Role[] = [
  { role: 'Background (console/gutter)', ours: hex(ours.colors.CONSOLE_BACKGROUND_KEY), stock: hex(stock.colors.CONSOLE_BACKGROUND_KEY), token: 'base' },
  { role: 'Indent guide / notification bg', ours: hex(ours.colors.INDENT_GUIDE), stock: hex(stock.colors.INDENT_GUIDE), token: 'surface_alt' },
  { role: 'Caret', ours: hex(ours.colors.CARET_COLOR), stock: hex(stock.colors.CARET_COLOR), token: 'accent_hi' },
  { role: 'Caret row', ours: hex(ours.colors.CARET_ROW_COLOR), stock: hex(stock.colors.CARET_ROW_COLOR), token: null, note: 'not a plain token: a subtle tint between base and surface, not the flat surface_alt caret-row fill other layers use' },
  { role: 'Line numbers', ours: hex(ours.colors.LINE_NUMBERS_COLOR), stock: hex(stock.colors.LINE_NUMBERS_COLOR), token: 'text_muted', note: '2026-09-25 fix: was 6B7280, no current token' },
  { role: 'Selection fill', ours: hex(ours.colors.SELECTION_BACKGROUND), stock: hex(stock.colors.SELECTION_BACKGROUND), token: 'accent' },
  {
    role: 'Selection text',
    ours: hex(ours.colors.SELECTION_FOREGROUND),
    stock: hex(stock.colors.SELECTION_FOREGROUND || sident.fg),
    token: 'base',
    note: '2026-09-25 fix: was FFFFFF on accent (1.72:1, under the 4.5:1 floor) -- accent is a light fill, so the readable foreground is the dark base token, not a lighter one'
  },
  { role: 'Keyword', ours: hex(kw.fg), stock: hex(skw.fg), token: 'accent_hi' },
  { role: 'String literal', ours: hex(str.fg), stock: hex(sstr.fg), token: 'positive', note: '2026-09-25 fix: was 71F79F (lime\'s positive), not sage\'s' },
  { role: 'Number / class / type', ours: hex(num.fg), stock: hex(snum.fg), token: 'accent_alt' },
  { role: 'Class name', ours: hex(cls.fg), stock: hex(scls.fg), token: 'accent_alt', note: 'stock Darcula ships no override here (attr() already falls back to DEFAULT_IDENTIFIER)' },
  { role: 'Function name (decl + call)', ours: hex(fn.fg), stock: hex(sfn.fg), token: 'amber' },
  { role: 'Identifier / variable / parameter', ours: hex(ident.fg), stock: hex(sident.fg), token: 'text' },
  { role: 'Comment (line + block)', ours: hex(cmt.fg), stock: hex(scmt.fg), token: 'text_muted', note: '2026-09-25 fix: was 6B7280, no current token' },
  { role: 'Doc comment', ours: hex(doc.fg), stock: hex(attr(stock, 'DEFAULT_DOC_COMMENT').fg), token: 'text_muted', note: '2026-09-25 fix: was 9CA3AF, no current token; now the same as a regular comment (italic still tells them apart)' },
  { role: 'Valid string escape', ours: hex(escOk.fg), stock: hex(attr(stock, 'DEFAULT_VALID_STRING_ESCAPE').fg), token: 'amber' },
  { role: 'Invalid string escape', ours: hex(escBad.fg), stock: hex(attr(stock, 'DEFAULT_INVALID_STRING_ESCAPE').fg), token: 'negative' },
  { role: 'Error text', ours: hex(err.fg), stock: hex(serr.effectColor), token: 'negative', note: 'ERRORS_ATTRIBUTES sets a FOREGROUND here; Darcula only underlines (EFFECT_COLOR), stock value shown is that underline colour' },
  { role: 'Warning underline', ours: hex(warn.effectColor), stock: hex(attr(stock, 'WARNING_ATTRIBUTES').effectColor), token: 'amber', note: 'EFFECT_COLOR only -- an underline, not a fill or text colour' },
  { role: 'VCS added (gutter)', ours: hex(vcsNew.fg), stock: hex(attr(stock, 'GUTTER_VCS_NEW').fg), token: 'positive', note: '2026-09-25 fix: was 71F79F' },
  { role: 'VCS removed (gutter)', ours: hex(vcsDel.fg), stock: hex(attr(stock, 'GUTTER_VCS_REMOVED').fg), token: 'negative', note: '2026-09-25 fix: was ED254E' },
  { role: 'VCS modified (gutter)', ours: hex(vcsMod.fg), stock: hex(attr(stock, 'GUTTER_VCS_MODIFIED').fg), token: 'accent_hi' }
];

export const contrast: ContrastPair[] = [
  { name: 'Identifier text on background', fg: hex(ident.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'Keyword on background', fg: hex(kw.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'String on background', fg: hex(str.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'Comment on background', fg: hex(cmt.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'Class/number on background', fg: hex(num.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'Function name on background', fg: hex(fn.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  { name: 'Error text on background', fg: hex(err.fg), bg: hex(ours.colors.CONSOLE_BACKGROUND_KEY), min: 4.5 },
  /* The pair the 2026-09-25 fix exists for. */
  { name: 'Selection text on selection fill', fg: hex(ours.colors.SELECTION_FOREGROUND), bg: hex(ours.colors.SELECTION_BACKGROUND), min: 4.5 }
];
