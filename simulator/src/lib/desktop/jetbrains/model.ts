/* JetBrains editor colour scheme: jetbrains/Indigo Glass.icls (hand-kept XML,
 * `.icls` = IntelliJ Color Scheme). Stock is IntelliJ's own built-in Darcula,
 * fetched from JetBrains/intellij-community's
 * platform/platform-resources/src/DefaultColorSchemesManager.xml (the
 * <scheme name="Darcula" ...> block, HEAD 2026-09-25) into
 * simulator/fixtures/stock/jetbrains/Darcula.xml -- the exact scheme
 * "Indigo Glass.icls" declares as its own parent_scheme.
 *
 * Both files use the SAME small XML dialect: a flat <colors> block of
 * self-closing <option name=".." value=".."/> pairs, and an <attributes>
 * block of <option name="KEY"><value><option name="FOREGROUND" value=".."/>
 * ...</value></option> (or an empty <value/> when a key falls back to
 * DEFAULT_IDENTIFIER, IntelliJ's own attribute-inheritance rule). */

import oursRaw from '../../../../../jetbrains/Indigo Glass.icls?raw';
import stockRaw from '../../../../fixtures/stock/jetbrains/Darcula.xml?raw';

export type IclsAttr = { fg?: string; bg?: string; effectColor?: string; bold?: boolean; italic?: boolean };
export type IclsScheme = { name: string; parent: string; colors: Record<string, string>; attrs: Record<string, IclsAttr> };

function stripComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, '');
}

function parseColorsBlock(xml: string): Record<string, string> {
  const block = xml.match(/<colors>([\s\S]*?)<\/colors>/)?.[1] ?? '';
  const out: Record<string, string> = {};
  const re = /<option\s+name="([^"]+)"\s+value="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

/* Full 54-key <attributes> list Indigo Glass.icls actually declares (verified
 * via `grep -o '<option name="[A-Z_]*">' "jetbrains/Indigo Glass.icls"` --
 * 2026-09-25: an earlier draft of this list only carried 44 keys, silently
 * dropping DEFAULT_REASSIGNED_LOCAL_VARIABLE/DEFAULT_REASSIGNED_PARAMETER/
 * DEFAULT_TEMPLATE_LANGUAGE_COLOR/IDENTIFIER_UNDER_CARET_ATTRIBUTES/
 * INFO_ATTRIBUTES/WEAK_WARNING_ATTRIBUTES/
 * WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES/WRITE_SEARCH_RESULT_ATTRIBUTES from
 * parseAttrsBlock entirely -- fixed so coverage can be asserted honestly). */
export const ATTR_KEYS = [
  'BAD_CHARACTER', 'DEFAULT_BLOCK_COMMENT', 'DEFAULT_LINE_COMMENT', 'DEFAULT_DOC_COMMENT',
  'DEFAULT_KEYWORD', 'DEFAULT_NUMBER', 'DEFAULT_STRING', 'DEFAULT_VALID_STRING_ESCAPE',
  'DEFAULT_INVALID_STRING_ESCAPE', 'DEFAULT_IDENTIFIER', 'DEFAULT_BRACES', 'DEFAULT_BRACKETS',
  'DEFAULT_PARENTHS', 'DEFAULT_DOT', 'DEFAULT_COMMA', 'DEFAULT_SEMICOLON', 'DEFAULT_OPERATION_SIGN',
  'DEFAULT_CONSTANT', 'DEFAULT_LABEL', 'DEFAULT_PREDEFINED_SYMBOL', 'DEFAULT_GLOBAL_VARIABLE',
  'DEFAULT_LOCAL_VARIABLE', 'DEFAULT_PARAMETER', 'DEFAULT_REASSIGNED_LOCAL_VARIABLE',
  'DEFAULT_REASSIGNED_PARAMETER', 'DEFAULT_INSTANCE_FIELD', 'DEFAULT_STATIC_FIELD',
  'DEFAULT_STATIC_METHOD', 'DEFAULT_INSTANCE_METHOD', 'DEFAULT_FUNCTION_DECLARATION',
  'DEFAULT_FUNCTION_CALL', 'DEFAULT_CLASS_NAME', 'DEFAULT_INTERFACE_NAME', 'DEFAULT_CLASS_REFERENCE',
  'DEFAULT_TYPE_PARAMETER_NAME', 'DEFAULT_METADATA', 'DEFAULT_TAG', 'DEFAULT_ATTRIBUTE',
  'DEFAULT_TEMPLATE_LANGUAGE_COLOR', 'ERRORS_ATTRIBUTES', 'WARNING_ATTRIBUTES', 'INFO_ATTRIBUTES',
  'WEAK_WARNING_ATTRIBUTES', 'GUTTER_VCS_NEW', 'GUTTER_VCS_REMOVED', 'GUTTER_VCS_MODIFIED',
  'DIFF_INSERTED', 'DIFF_DELETED', 'DIFF_MODIFIED', 'DIFF_CONFLICT', 'TEXT_SEARCH_RESULT_ATTRIBUTES',
  'WRITE_SEARCH_RESULT_ATTRIBUTES', 'IDENTIFIER_UNDER_CARET_ATTRIBUTES',
  'WRITE_IDENTIFIER_UNDER_CARET_ATTRIBUTES'
] as const;

function parseAttrsBlock(xml: string): Record<string, IclsAttr> {
  const block = xml.match(/<attributes>([\s\S]*?)<\/attributes>/)?.[1] ?? '';
  const out: Record<string, IclsAttr> = {};
  for (const key of ATTR_KEYS) {
    const m = block.match(new RegExp(`<option name="${key}">([\\s\\S]*?)</option>`));
    if (!m) continue;
    const inner = m[1];
    const fg = inner.match(/<option name="FOREGROUND" value="([0-9A-Fa-f]*)"/)?.[1];
    const bg = inner.match(/<option name="BACKGROUND" value="([0-9A-Fa-f]*)"/)?.[1];
    const effectColor = inner.match(/<option name="EFFECT_COLOR" value="([0-9A-Fa-f]*)"/)?.[1];
    const fontType = inner.match(/<option name="FONT_TYPE" value="(\d)"/)?.[1];
    out[key] = {
      fg: fg || undefined,
      bg: bg || undefined,
      effectColor: effectColor || undefined,
      bold: fontType === '1',
      italic: fontType === '2'
    };
  }
  return out;
}

export function parseIcls(xml: string): IclsScheme {
  const clean = stripComments(xml);
  return {
    name: clean.match(/<scheme\s+name="([^"]*)"/)?.[1] ?? '',
    parent: clean.match(/parent_scheme="([^"]*)"/)?.[1] ?? '',
    colors: parseColorsBlock(clean),
    attrs: parseAttrsBlock(clean)
  };
}

/** IntelliJ falls back to DEFAULT_IDENTIFIER for any attribute key whose
 * <value/> is empty (CLASS_NAME, PARAMETER, LOCAL_VARIABLE, BRACES,
 * BRACKETS, PARENTHS, DOT, FUNCTION_CALL in the bundled Darcula -- verified
 * empty <value/> for each in fixtures/stock/jetbrains/Darcula.xml). */
export function attr(scheme: IclsScheme, key: (typeof ATTR_KEYS)[number]): IclsAttr {
  const a = scheme.attrs[key];
  /* 2026-09-25 fix: WARNING_ATTRIBUTES (and any other underline-only key)
   * sets EFFECT_COLOR but no FOREGROUND/BACKGROUND -- the pre-fix check only
   * looked at fg/bg, so attr() treated it as "unset" and silently fell back
   * to DEFAULT_IDENTIFIER (which has no effectColor of its own), losing the
   * underline colour entirely. Caught live by e2e, not by model.test.ts's own
   * DEFAULT_IDENTIFIER-fallback test, which reads .effectColor directly off
   * scheme.attrs and never exercises this function. */
  if (a && (a.fg || a.bg || a.effectColor)) return a;
  return scheme.attrs.DEFAULT_IDENTIFIER ?? {};
}

export function hex(v: string | undefined, fallback = '#000000'): string {
  if (!v) return fallback;
  return `#${v.slice(0, 6).toUpperCase()}`;
}

export const ours: IclsScheme = parseIcls(oursRaw);
export const stock: IclsScheme = parseIcls(stockRaw);

export function laneVars(s: IclsScheme): string {
  return [
    `--jb-bg:${hex(s.colors.CONSOLE_BACKGROUND_KEY ?? s.colors.GUTTER_BACKGROUND, '#1E1E1E')}`,
    `--jb-gutter:${hex(s.colors.GUTTER_BACKGROUND, '#1E1E1E')}`,
    `--jb-caret-row:${hex(s.colors.CARET_ROW_COLOR, '#2B2B2B')}`,
    `--jb-line-numbers:${hex(s.colors.LINE_NUMBERS_COLOR, '#606366')}`,
    `--jb-caret:${hex(s.colors.CARET_COLOR, '#BBBBBB')}`,
    `--jb-selection:${hex(s.colors.SELECTION_BACKGROUND, '#214283')}`,
    `--jb-fg:${hex(attr(s, 'DEFAULT_IDENTIFIER').fg, '#A9B7C6')}`
  ].join(';');
}
