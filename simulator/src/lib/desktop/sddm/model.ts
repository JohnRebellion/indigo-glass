/* SDDM greeter: the shipped Sage Ink theme against the Breeze greeter.
 *
 * Ours: sddm/indigo-glass/{Main.qml,theme.conf,metadata.desktop,background.svg},
 * imported raw — the files a user copies to /usr/share/sddm/themes/. Main.qml
 * is parsed (./qml.ts) and every painted binding becomes a lane variable, so a
 * colour, size or scoping mistake in the QML shows on the page.
 *
 * Stock: Breeze from plasma-desktop v6.7.4 (Main.qml, Login.qml, the
 * session/keyboard buttons, theme.conf, metadata.desktop, verbatim) plus the
 * org.kde.breeze.components files and BreezeLight.colors copied from this
 * host's plasma-workspace / plasma-breeze-common 6.7.4. Structure (actions,
 * footer buttons, the failed-login handler) is read from those files with the
 * same parser; sizes come from their Kirigami unit maths. */
import oursQmlText from '../../../../../sddm/indigo-glass/Main.qml?raw';
import oursConfText from '../../../../../sddm/indigo-glass/theme.conf?raw';
import oursMetaText from '../../../../../sddm/indigo-glass/metadata.desktop?raw';
import oursWall from '../../../../../sddm/indigo-glass/background.svg?url';
import stockMainText from '../../../../fixtures/stock/sddm/Main.qml?raw';
import stockLoginText from '../../../../fixtures/stock/sddm/Login.qml?raw';
import stockSessionText from '../../../../fixtures/stock/sddm/SessionButton.qml?raw';
import stockKeyboardText from '../../../../fixtures/stock/sddm/KeyboardButton.qml?raw';
import stockConfText from '../../../../fixtures/stock/sddm/theme.conf?raw';
import stockMetaText from '../../../../fixtures/stock/sddm/metadata.desktop?raw';
import breezeLightText from '../../../../fixtures/stock/sddm/BreezeLight.colors?raw';
import defaultsText from '../../../../fixtures/stock/sddm/plasma-defaults.conf?raw';
import clockText from '../../../../fixtures/stock/sddm/components/Clock.qml?raw';
import userText from '../../../../fixtures/stock/sddm/components/UserDelegate.qml?raw';
import actionText from '../../../../fixtures/stock/sddm/components/ActionButton.qml?raw';
import smsText from '../../../../fixtures/stock/sddm/components/SessionManagementScreen.qml?raw';
import stockWallFile from '../../../../fixtures/stock/sddm/next-640x360-faded.jpg?url';
import { parseIni, kdeColor, type IniDoc } from '../ini';
import { cssVars } from '../surface';
import type { KeyVars } from '../coverage';
import { parseQml, resolveColor, unquote, num, type QmlDoc, type QmlNode } from './qml';

/* Runtime data SDDM supplies (userModel, sessionModel, keyboard, clock),
   the same in both lanes so only the theme differs. */
export const SAMPLE_USERS = 2;
export const SAMPLE = { name: 'John Rebellion', login: 'johnn', session: 'Plasma (Wayland)', layout: 'English (US)', hh: 9, mm: 41, dots: 8 };

export type ErrorState = { message: string | null; password: 'cleared' | 'selected' | 'kept'; refocus: boolean; shake: boolean };

export type SddmModel = {
  which: 'stock' | 'ours';
  qml: QmlDoc;
  conf: IniDoc;
  meta: IniDoc;
  /* theme.conf keys the lane's QML actually reads through `config.<key>`. */
  confRead: Set<string>;
  vars: Record<string, string | number>;
  panel: boolean;
  avatars: boolean;
  brand: (() => string) | null;
  placeholder: () => string;
  /* null: the button is an icon-only arrow (Breeze with a password field). */
  signIn: () => string | null;
  echo: () => string;
  session: () => string;
  keyboard: string | null;
  actions: string[];
  clock: { corner: boolean; time: () => string; date: string | null };
  error: ErrorState;
  errorSource: () => string;
  /* Unqualified names that QML resolves on the binding's own object. */
  shadowed: string[];
};

/* The translatable text of an i18n call: i18n(text), i18nc(ctx, text),
   i18nd(domain, text), i18ndc(domain, ctx, text). */
const I18N_ARG: Record<string, number> = { i18n: 0, i18nc: 1, i18nd: 1, i18ndc: 2 };
function i18n(e: string | undefined): string | undefined {
  const m = e?.match(/\b(i18ndc|i18nd|i18nc|i18n)\(/);
  if (!e || !m) return undefined;
  const strs = [...e.slice(m.index!).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
  return strs[I18N_ARG[m[1]]];
}
const pt2px = (pt: number) => Math.round((pt * 96) / 72 * 100) / 100;
const WEIGHT: Record<string, number> = { 'Font.Normal': 400, 'Font.Medium': 500, 'Font.DemiBold': 600, 'Font.Bold': 700 };
const fmtTime = (f: string) => f.replace('hh', String(SAMPLE.hh).padStart(2, '0')).replace('mm', String(SAMPLE.mm).padStart(2, '0'));

/* One failed-login handler body (or several) -> what the user sees. */
export function errorOf(bodies: string[]): ErrorState {
  const b = bodies.join('\n');
  const msg = b.match(/(?:notificationMessage|errorMessage|message|text)\s*=\s*(i18n\w*\([^\n]*\)|"[^"]+")/);
  return {
    message: msg ? (i18n(msg[1]) ?? unquote(msg[1]) ?? null) : null,
    password: /selectAll\(\)/.test(b) ? 'selected' : /\w+\.(text\s*=\s*""|clear\(\))/.test(b) ? 'cleared' : 'kept',
    refocus: /focus\s*=\s*true|forceActiveFocus\(\)/.test(b),
    shake: /Animation\.start\(\)/.test(b)
  };
}

const fnBodies = (d: QmlDoc, name: string) =>
  d.nodes.map((n) => n.props.get(`function ${name}`)).filter((x): x is string => !!x);

/* Power/session actions: ActionButtons (Breeze) or anything calling sddm.<power>(). */
function actionsOf(d: QmlDoc): string[] {
  const inPrompt = (n: QmlNode | undefined): boolean => !!n && (n.id === 'userPromptComponent' || inPrompt(n.parent));
  return d.nodes
    .filter((n) => !inPrompt(n) && (n.type === 'ActionButton' || /sddm\.(powerOff|reboot|suspend|hibernate)\(/.test(n.props.get('onClicked') ?? '')))
    .map((n) => i18n(n.props.get('text')) ?? unquote(n.props.get('text')) ?? n.type);
}

/* ---- ours ---------------------------------------------------------------- */

type Kind = 'color' | 'num' | 'font' | 'weight';
/* [QML node, property, lane variable, kind] — the page's coverage map for
   Main.qml. A binding here is covered when some rule uses its variable. */
export const BIND: [string, string, string, Kind][] = [
  ['root', 'color', 'sd-desk', 'color'],
  ['root>Item', 'width', 'sd-panel-w', 'num'],
  ['root>Item>Rectangle', 'x', 'sd-shadow-x', 'num'],
  ['root>Item>Rectangle', 'y', 'sd-shadow-y', 'num'],
  ['root>Item>Rectangle', 'color', 'sd-shadow', 'color'],
  ['panel', 'color', 'sd-panel-bg', 'color'],
  ['panel', 'border.width', 'sd-panel-edge-w', 'num'],
  ['panel', 'border.color', 'sd-panel-edge', 'color'],
  ['panel', 'radius', 'sd-panel-radius', 'num'],
  ['layout', 'anchors.margins', 'sd-panel-pad', 'num'],
  ['layout', 'spacing', 'sd-panel-gap', 'num'],
  ['layout>RowLayout', 'spacing', 'sd-brand-gap', 'num'],
  ['layout>RowLayout>Rectangle', 'width', 'sd-dot-w', 'num'],
  ['layout>RowLayout>Rectangle', 'height', 'sd-dot-h', 'num'],
  ['layout>RowLayout>Rectangle', 'radius', 'sd-dot-r', 'num'],
  ['layout>RowLayout>Rectangle', 'color', 'sd-dot', 'color'],
  ['layout>RowLayout>Text', 'font.family', 'sd-brand-font', 'font'],
  ['layout>RowLayout>Text', 'font.pixelSize', 'sd-brand-px', 'num'],
  ['layout>RowLayout>Text', 'font.weight', 'sd-brand-weight', 'weight'],
  ['layout>RowLayout>Text', 'color', 'sd-brand-fg', 'color'],
  ['userInput', 'Layout.preferredHeight', 'sd-user-h', 'num'],
  ['userInput.background', 'color', 'sd-user-bg', 'color'],
  ['userInput.background', 'border.width', 'sd-user-edge-w', 'num'],
  ['userInput.background', 'border.color', 'sd-user-edge', 'color'],
  ['userInput.background', 'radius', 'sd-user-radius', 'num'],
  ['userInput.contentItem', 'color', 'sd-user-fg', 'color'],
  ['userInput.contentItem', 'font.family', 'sd-user-font', 'font'],
  ['userInput.contentItem', 'font.pixelSize', 'sd-user-px', 'num'],
  ['userInput.contentItem', 'leftPadding', 'sd-user-pad', 'num'],
  ['passwordInput', 'Layout.preferredHeight', 'sd-pw-h', 'num'],
  ['passwordInput', 'color', 'sd-pw-fg', 'color'],
  ['passwordInput', 'placeholderTextColor', 'sd-pw-ph', 'color'],
  ['passwordInput', 'font.family', 'sd-pw-font', 'font'],
  ['passwordInput', 'font.pixelSize', 'sd-pw-px', 'num'],
  ['passwordInput', 'leftPadding', 'sd-pw-pad', 'num'],
  ['passwordInput.background', 'color', 'sd-pw-bg', 'color'],
  ['passwordInput.background', 'border.width', 'sd-pw-edge-w', 'num'],
  ['passwordInput.background', 'border.color', 'sd-pw-edge', 'color'],
  ['passwordInput.background', 'radius', 'sd-pw-radius', 'num'],
  ['loginButton', 'Layout.preferredHeight', 'sd-btn-h', 'num'],
  ['loginButton.background', 'color', 'sd-btn-bg', 'color'],
  ['loginButton.background', 'radius', 'sd-btn-radius', 'num'],
  ['loginButton.contentItem', 'color', 'sd-btn-fg', 'color'],
  ['loginButton.contentItem', 'font.family', 'sd-btn-font', 'font'],
  ['loginButton.contentItem', 'font.pixelSize', 'sd-btn-px', 'num'],
  ['loginButton.contentItem', 'font.weight', 'sd-btn-weight', 'weight'],
  ['sessionInput', 'Layout.preferredHeight', 'sd-sess-h', 'num'],
  ['sessionInput.background', 'color', 'sd-sess-bg', 'color'],
  ['sessionInput.background', 'border.width', 'sd-sess-edge-w', 'num'],
  ['sessionInput.background', 'border.color', 'sd-sess-edge', 'color'],
  ['sessionInput.background', 'radius', 'sd-sess-radius', 'num'],
  ['sessionInput.contentItem', 'color', 'sd-sess-fg', 'color'],
  ['sessionInput.contentItem', 'font.family', 'sd-sess-font', 'font'],
  ['sessionInput.contentItem', 'font.pixelSize', 'sd-sess-px', 'num'],
  ['sessionInput.contentItem', 'leftPadding', 'sd-sess-pad', 'num'],
  ['root>Text', 'anchors.margins', 'sd-clock-margin', 'num'],
  ['root>Text', 'font.family', 'sd-clock-font', 'font'],
  ['root>Text', 'font.pixelSize', 'sd-clock-px', 'num'],
  ['root>Text', 'color', 'sd-clock-fg', 'color']
];

export const KEY_VARS: KeyVars = {
  'root>Image/source': ['sd-wall'],
  'root>Image/fillMode': ['sd-wall-fit'],
  'General/color': ['sd-conf-color']
};
for (const [g, k, v] of BIND) (KEY_VARS[`${g}/${k}`] ??= []).push(v);

/* Main.qml bindings that are behaviour or layout plumbing, not paint. */
export const QML_IGNORE: { token: string; why: string }[] = [
  { token: 'root/width', why: 'Screen.width; the specimen is a 1920x1080 screen' },
  { token: 'root/height', why: 'Screen.height; the specimen is a 1920x1080 screen' },
  { token: 'root>Image/anchors.fill', why: 'fills the screen, as the specimen wallpaper does' },
  { token: 'root>Image/smooth', why: 'image sampling flag, no visible difference at this scale' },
  { token: 'root>Image/cache', why: 'loader flag' },
  { token: 'root>Image/asynchronous', why: 'loader flag' },
  { token: 'root>Item/anchors.centerIn', why: 'the specimen centres the panel' },
  { token: 'root>Item/height', why: 'panel.implicitHeight: derived from the rendered margins, spacing and control heights' },
  { token: 'root>Item>Rectangle/width', why: 'panel.width: the shadow copies the panel box' },
  { token: 'root>Item>Rectangle/height', why: 'panel.height: the shadow copies the panel box' },
  { token: 'panel/anchors.fill', why: 'fills its 360px Item' },
  { token: 'panel/implicitHeight', why: 'layout.implicitHeight + 2 x anchors.margins (rendered)' },
  { token: 'layout/anchors.fill', why: 'fills the panel inside its margins' },
  { token: 'layout>RowLayout/Layout.alignment', why: 'centred brand row' },
  { token: 'userInput/Layout.fillWidth', why: 'fields span the panel width' },
  { token: 'passwordInput/Layout.fillWidth', why: 'fields span the panel width' },
  { token: 'loginButton/Layout.fillWidth', why: 'fields span the panel width' },
  { token: 'sessionInput/Layout.fillWidth', why: 'fields span the panel width' },
  { token: 'userInput/model', why: 'SDDM userModel: runtime data, sampled' },
  { token: 'userInput/textRole', why: 'SDDM userModel: runtime data, sampled' },
  { token: 'userInput/currentIndex', why: 'SDDM userModel.lastIndex: runtime data' },
  { token: 'userInput.contentItem/text', why: 'currentText: runtime data, sampled' },
  { token: 'userInput.contentItem/verticalAlignment', why: 'centred label' },
  { token: 'sessionInput/model', why: 'SDDM sessionModel: runtime data, sampled' },
  { token: 'sessionInput/textRole', why: 'SDDM sessionModel: runtime data, sampled' },
  { token: 'sessionInput/currentIndex', why: 'SDDM sessionModel.lastIndex: runtime data' },
  { token: 'sessionInput.contentItem/text', why: 'currentText: runtime data, sampled' },
  { token: 'sessionInput.contentItem/verticalAlignment', why: 'centred label' },
  { token: 'passwordInput/Keys.onReturnPressed', why: 'key handler' },
  { token: 'loginButton/onClicked', why: 'calls sddm.login()' },
  { token: 'loginButton.contentItem/text', why: 'binds loginButton.text (rendered)' },
  { token: 'loginButton.contentItem/horizontalAlignment', why: 'centred label' },
  { token: 'loginButton.contentItem/verticalAlignment', why: 'centred label' },
  { token: 'root>Text/anchors.bottom', why: 'the specimen pins the clock bottom-right' },
  { token: 'root>Text/anchors.right', why: 'the specimen pins the clock bottom-right' },
  { token: 'root>Text>Timer/*', why: 'ticks the clock once a second; the specimen shows a sampled time' },
  { token: 'root>Connections/target', why: 'wires the handler to the sddm object' }
];

function oursModel(): SddmModel {
  const qml = parseQml(oursQmlText);
  const conf = parseIni(oursConfText);
  const meta = parseIni(oursMetaText);
  const vars: SddmModel['vars'] = {};
  const shadowed: string[] = [];
  for (const [g, k, v, kind] of BIND) {
    const n = qml.node(g);
    const e = qml.get(g, k);
    if (!n || e === undefined) { vars[v] = kind === 'num' ? 0 : 'transparent'; continue; }
    if (kind === 'color') {
      const r = resolveColor(qml, n, e);
      vars[v] = r.value;
      if (r.state) vars[`${v}-on`] = r.state;
      if (r.shadowed) shadowed.push(r.shadowed);
      /* A root palette property is shown wherever a painted binding reads it. */
      for (const p of r.via ?? []) (KEY_VARS[`root/${p}`] ??= []).push(r.state ? `${v}-on` : v, v);
    } else if (kind === 'num') vars[v] = num(e) ?? 0;
    else if (kind === 'font') vars[v] = `"${unquote(e) ?? e}"`;
    else vars[v] = WEIGHT[e] ?? 400;
  }
  vars['sd-panel-on'] = 1;
  vars['sd-wall'] = unquote(qml.get('root>Image', 'source')) ? `url("${oursWall}")` : 'none';
  vars['sd-wall-fit'] = qml.get('root>Image', 'fillMode') === 'Image.PreserveAspectCrop' ? 'cover' : 'contain';
  vars['sd-wall-opacity'] = num(qml.peek('root>Image', 'opacity')) ?? 1;
  vars['sd-wall-filter'] = 'none';
  vars['sd-conf-color'] = kdeColor(conf.get('General', 'color'));
  vars['sd-focus'] = vars['sd-pw-edge-on'] ?? vars['sd-pw-edge'];
  vars['desk-bg'] = vars['sd-desk'];
  vars['desk-font'] = vars['sd-user-font'];
  const clockFmt = () => qml.get('root>Text', 'text')?.match(/"([^"]+)"/)?.[1] ?? 'hh:mm';
  return {
    which: 'ours', qml, conf, meta, vars, shadowed,
    confRead: new Set([...oursQmlText.matchAll(/\bconfig\.(\w+)/g)].map((m) => m[1])),
    panel: true,
    avatars: false,
    brand: () => unquote(qml.get('layout>RowLayout>Text', 'text')) ?? '',
    placeholder: () => unquote(qml.get('passwordInput', 'placeholderText')) ?? '',
    signIn: () => unquote(qml.get('loginButton', 'text')) ?? '',
    echo: () => qml.get('passwordInput', 'echoMode') ?? '',
    session: () => SAMPLE.session,
    keyboard: qml.nodes.some((n) => /Keyboard/.test(n.type) || /keyboard\.layouts/.test([...n.props.values()].join())) ? SAMPLE.layout : null,
    actions: actionsOf(qml),
    clock: { corner: true, time: () => fmtTime(clockFmt()), date: null },
    error: errorOf(fnBodies(qml, 'onLoginFailed')),
    errorSource: () => qml.get('root>Connections', 'function onLoginFailed') ?? ''
  };
}

/* ---- stock --------------------------------------------------------------- */

function stockModel(): SddmModel {
  const qml = parseQml(stockMainText);
  const login = parseQml(stockLoginText);
  const conf = parseIni(stockConfText);
  const meta = parseIni(stockMetaText);
  const scheme = parseIni(breezeLightText);
  const def = parseIni(defaultsText);
  const c = (set: string, key: string) => kdeColor(scheme.get(`Colors:${set}`, key));
  const d = (g: string, k: string) => Number(def.get(g, k));
  const fontPt = d('Font', 'pointSize');
  const grid = d('Units', 'gridUnit');
  /* Kirigami unit maths straight out of the component files. */
  const factor = (text: string, re: RegExp, fallback: number) => Number(text.match(re)?.[1] ?? fallback);
  const clockPt = Math.round(fontPt * factor(clockText, /pointSize \* ([\d.]+)\)\s*\n\s*font\.weight/, 7.2));
  const datePt = Math.round(fontPt * factor(clockText, /LongFormat\)[\s\S]*?pointSize \* ([\d.]+)/, 2.4));
  const face = grid * factor(userText, /faceSize: Kirigami\.Units\.gridUnit \* (\d+)/, 7);
  const namePt = fontPt + factor(userText, /fontSize: Kirigami\.Theme\.defaultFont\.pointSize \+ (\d+)/, 2) + factor(userText, /pointSize: wrapper\.fontSize \+ (\d+)/, 4);
  const formW = grid * factor(smsText, /maximumWidth: Kirigami\.Units\.gridUnit \* (\d+)/, 16);
  const fieldPt = fontPt + factor(stockLoginText, /font\.pointSize: fontSize \+ (\d+)/, 1);
  const actionPt = fontPt + factor(actionText, /pointSize \+ (\d+)/, 1);
  const frameW = d('Approximated', 'frameWidth'), frameR = d('Approximated', 'frameRadius'), fieldH = d('Approximated', 'fieldHeight');
  const font = `"${def.get('Font', 'family')}"`;
  const fg = c('Complementary', 'ForegroundNormal');
  const vars: SddmModel['vars'] = {
    'sd-desk': kdeColor(conf.get('General', 'color')),
    'sd-wall': conf.get('General', 'type') === 'image' ? `url("${stockWallFile}")` : 'none',
    'sd-wall-fit': 'cover',
    'sd-wall-opacity': 1,
    'sd-wall-filter': `contrast(${def.get('Wallpaper', 'contrast')}) saturate(${def.get('Wallpaper', 'saturation')}) brightness(${def.get('Wallpaper', 'intensity')})`,
    'sd-conf-color': kdeColor(conf.get('General', 'color')),
    'sd-panel-on': 0,
    'sd-panel-w': formW, 'sd-shadow-x': 0, 'sd-shadow-y': 0, 'sd-shadow': 'transparent',
    'sd-panel-bg': 'transparent', 'sd-panel-edge-w': 0, 'sd-panel-edge': 'transparent', 'sd-panel-radius': 0,
    'sd-panel-pad': 0, 'sd-panel-gap': 5, 'sd-brand-gap': 0,
    'sd-dot-w': 0, 'sd-dot-h': 0, 'sd-dot-r': 0, 'sd-dot': 'transparent',
    'sd-brand-font': font, 'sd-brand-px': 0, 'sd-brand-weight': 400, 'sd-brand-fg': fg,
    /* The user "field" is the avatar delegate: name label under the face. */
    'sd-user-h': face, 'sd-user-bg': c('Complementary', 'BackgroundNormal'), 'sd-user-edge-w': 0, 'sd-user-edge': fg, 'sd-user-radius': face / 2,
    'sd-user-fg': fg, 'sd-user-font': font, 'sd-user-px': pt2px(namePt), 'sd-user-pad': 0,
    'sd-pw-h': fieldH, 'sd-pw-fg': c('View', 'ForegroundNormal'), 'sd-pw-ph': c('View', 'ForegroundInactive'),
    'sd-pw-font': font, 'sd-pw-px': pt2px(fieldPt), 'sd-pw-pad': 8,
    'sd-pw-bg': c('View', 'BackgroundNormal'), 'sd-pw-edge-w': frameW, 'sd-pw-edge': c('View', 'ForegroundInactive'),
    'sd-pw-edge-on': c('View', 'DecorationFocus'), 'sd-pw-radius': frameR,
    'sd-btn-h': fieldH, 'sd-btn-bg': c('Button', 'BackgroundNormal'), 'sd-btn-bg-on': c('Button', 'BackgroundAlternate'), 'sd-btn-radius': frameR,
    'sd-btn-fg': c('Button', 'ForegroundNormal'), 'sd-btn-font': font, 'sd-btn-px': pt2px(fieldPt), 'sd-btn-weight': 400,
    'sd-sess-h': fieldH, 'sd-sess-bg': 'transparent', 'sd-sess-edge-w': 0, 'sd-sess-edge': 'transparent', 'sd-sess-radius': frameR,
    'sd-sess-fg': fg, 'sd-sess-font': font, 'sd-sess-px': pt2px(fontPt), 'sd-sess-pad': d('Units', 'smallSpacing'),
    'sd-clock-margin': 0, 'sd-clock-font': font, 'sd-clock-px': pt2px(clockPt), 'sd-clock-fg': fg,
    'sd-clock-weight': 600, 'sd-date-px': pt2px(datePt),
    'sd-action-px': pt2px(actionPt), 'sd-action-icon': d('Units', 'iconLarge'), 'sd-action-fg': fg,
    'sd-note-px': pt2px(fontPt + 2),
    'sd-focus': c('View', 'DecorationFocus'),
    'sd-sel-bg': c('Selection', 'BackgroundNormal'),
    'sd-sel-fg': c('Selection', 'ForegroundNormal'),
    'sd-user-edge-on': fg,
    'desk-bg': c('Complementary', 'BackgroundNormal'),
    'desk-font': font
  };
  const footer = qml.node('footer')?.children.map((n) => n.type) ?? [];
  const sessionLabel = i18n(parseQml(stockSessionText).root.props.get('text'))?.replace('%1', SAMPLE.session) ?? SAMPLE.session;
  const keyboardLabel = i18n(parseQml(stockKeyboardText).root.props.get('text'))?.replace('%1', SAMPLE.layout) ?? SAMPLE.layout;
  const threshold = d('Users', 'DisableAvatarsThreshold');
  const signInText = login.peek('loginButton', 'text') ?? '';
  return {
    which: 'stock', qml, conf, meta, vars, shadowed: [],
    confRead: new Set([...stockMainText.matchAll(/\bconfig\.(\w+)/g)].map((m) => m[1])),
    panel: false,
    /* showUserList: count <= disableAvatarsThreshold; two sample users. */
    avatars: SAMPLE_USERS <= threshold,
    brand: null,
    placeholder: () => i18n(login.peek('passwordBox', 'placeholderText')) ?? '',
    /* text is "" while a password is needed: the button is a go-next arrow. */
    signIn: () => (/needsPassword \? "" :/.test(signInText) ? null : i18n(signInText) ?? ''),
    echo: () => 'TextInput.Password',
    session: () => (footer.includes('SessionButton') ? sessionLabel : SAMPLE.session),
    keyboard: footer.includes('KeyboardButton') ? keyboardLabel : null,
    actions: actionsOf(qml),
    clock: {
      corner: false,
      time: () => def.get('Locale', 'time') ?? '',
      date: conf.get('General', 'showClock') === 'true' ? def.get('Locale', 'date') ?? null : null
    },
    error: errorOf([...fnBodies(qml, 'onLoginFailed'), ...fnBodies(login, 'onLoginFailed')]),
    errorSource: () => [...fnBodies(qml, 'onLoginFailed'), ...fnBodies(login, 'onLoginFailed')].join('\n')
  };
}

export const ours = oursModel();
export const stock = stockModel();

export const laneVars = (m: SddmModel) => cssVars(m.vars);
