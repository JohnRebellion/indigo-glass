/* The 15 Stylus site styles, one comparison page each.
 *
 * `css` is the shipped .user.css imported raw — the implementation under
 * review, never a copy. `rootAttrs` are what the site's own <html> carries,
 * so the file's root selectors (`html[dark]`, `html.skin-theme-clientpref-
 * night`, `[data-color-mode]`) match the lane root exactly as they match the
 * document root on the live site. Hue rows are the README's per-site table.
 */
import aistudio from '../../../../browser/stylus/sites/aistudio.user.css?raw';
import atlassian from '../../../../browser/stylus/sites/atlassian.user.css?raw';
import chatgpt from '../../../../browser/stylus/sites/chatgpt.user.css?raw';
import claude from '../../../../browser/stylus/sites/claude-ai.user.css?raw';
import copilot from '../../../../browser/stylus/sites/copilot.user.css?raw';
import facebook from '../../../../browser/stylus/sites/facebook.user.css?raw';
import gemini from '../../../../browser/stylus/sites/gemini.user.css?raw';
import github from '../../../../browser/stylus/sites/github.user.css?raw';
import google from '../../../../browser/stylus/sites/google.user.css?raw';
import linear from '../../../../browser/stylus/sites/linear.user.css?raw';
import microsoft365 from '../../../../browser/stylus/sites/microsoft365.user.css?raw';
import notion from '../../../../browser/stylus/sites/notion.user.css?raw';
import shopee from '../../../../browser/stylus/sites/shopee.user.css?raw';
import wikipedia from '../../../../browser/stylus/sites/wikipedia.user.css?raw';
import youtube from '../../../../browser/stylus/sites/youtube.user.css?raw';

export type Site = {
  id: string;
  name: string;
  domain: string;
  file: string;
  css: string;
  /* Where the stock values were read from, for the page's provenance line. */
  stockSource: string;
  hue: { deg: string; source: string; hi: string; mid: string; alt: string };
  rootClass?: string;
  rootAttrs?: Record<string, string>;
  /* Selector tokens the page cannot show an element for, each with the
     reason — they are listed on the page, not silently dropped. */
  ignore?: { token: string; why: string }[];
  /* The app root every specimen sits inside on the live site (`#app`,
     `bard-sidenav-container`, `ms-app`...). Files scope broad rules to it, so
     Pair wraps each snippet in the same element — except overlays, which the
     live sites portal to <body>, and the shell specimen that IS the root. */
  wrap?: { tag: string; attrs?: Record<string, string> };
};

const site = (s: Site): Site => s;

export const SITES: Site[] = [
  site({ id: 'github', name: 'GitHub', domain: 'github.com', file: 'github.user.css', css: github,
    stockSource: 'Primer dark-default tokens read off github.com with scripts/style-check/vars.mjs',
    hue: { deg: '255.9 / 146.3', source: 'link blue + action green', hi: '#94C7FF', mid: '#7CADEF', alt: '#6494D5' },
    rootAttrs: { 'data-color-mode': 'dark', 'data-dark-theme': 'dark' } }),
  site({ id: 'wikipedia', name: 'Wikipedia', domain: 'wikipedia.org', file: 'wikipedia.user.css', css: wikipedia,
    stockSource: 'Codex night-mode tokens read off en.wikipedia.org; Vector hardcodes measured in the file',
    hue: { deg: '262.3', source: 'its link blue', hi: '#9DC4FF', mid: '#85ABF1', alt: '#6D92D6' },
    rootClass: 'skin-theme-clientpref-night',
    ignore: [
      { token: '.skin-theme-clientpref-os', why: 'an <html> mode class; this page renders the night mode' },
      { token: '.skin-theme-clientpref-day', why: 'an <html> mode class; this page renders the night mode' }
    ] }),
  site({ id: 'youtube', name: 'YouTube', domain: 'youtube.com', file: 'youtube.user.css', css: youtube,
    stockSource: '--yt-spec-* dark values read off youtube.com',
    wrap: { tag: 'ytd-app' },
    hue: { deg: '29.2', source: 'its red', hi: '#FFA99B', mid: '#E89082', alt: '#CD776A' },
    rootAttrs: { dark: '', 'system-icons': '' } }),
  site({ id: 'facebook', name: 'Facebook', domain: 'facebook.com', file: 'facebook.user.css', css: facebook,
    stockSource: 'FB dark :root variables read off facebook.com',
    hue: { deg: '259.8', source: 'its blue', hi: '#9AC5FF', mid: '#81ACF0', alt: '#6A93D5' } }),
  site({ id: 'google', name: 'Google Search', domain: 'google.com', file: 'google.user.css', css: google,
    stockSource: 'Google ships no theme variables; stock values are computed colours off a dark SERP',
    wrap: { tag: 'div', attrs: { id: 'rcnt' } }, hue: { deg: '262 @ C 0.05', source: 'four brand colours, no single hue', hi: '#B3C5E5', mid: '#9AACCB', alt: '#8293B2' } }),
  site({ id: 'claude', name: 'Claude', domain: 'claude.ai', file: 'claude-ai.user.css', css: claude,
    stockSource: 'Anthropic --accent-*/--danger-*/--success-* dark values',
    rootClass: 'dark', rootAttrs: { 'data-mode': 'dark' },
    hue: { deg: '38.8', source: 'Anthropic clay #D97757', hi: '#FFAB8F', mid: '#E69277', alt: '#CB795F' } }),
  site({ id: 'chatgpt', name: 'ChatGPT', domain: 'chatgpt.com', file: 'chatgpt.user.css', css: chatgpt,
    stockSource: 'OpenAI --link/--interactive-bg-accent-*/--text-* dark values',
    rootClass: 'dark',
    hue: { deg: '169.5', source: 'OpenAI teal #10A37F', hi: '#74DBB9', mid: '#58C1A0', alt: '#3CA887' } }),
  site({ id: 'notion', name: 'Notion', domain: 'notion.so', file: 'notion.user.css', css: notion,
    stockSource: 'Notion --notion-* dark values',
    wrap: { tag: 'div', attrs: { class: 'notion-app-inner' } },
    hue: { deg: '252.7', source: 'Notion UI blue #2383E2', hi: '#90C8FF', mid: '#77AFEF', alt: '#5F96D4' } }),
  site({ id: 'linear', name: 'Linear', domain: 'linear.app', file: 'linear.user.css', css: linear,
    stockSource: 'Linear --color-* dark values',
    hue: { deg: '275.2', source: 'Linear indigo #5E6AD2', hi: '#AFBEFF', mid: '#97A5F0', alt: '#7F8CD5' } }),
  site({ id: 'atlassian', name: 'Atlassian', domain: 'atlassian.net', file: 'atlassian.user.css', css: atlassian,
    stockSource: 'Atlassian Design System --ds-* dark values',
    hue: { deg: '258.6', source: 'its blue', hi: '#98C6FF', mid: '#80ACF0', alt: '#6893D5' },
    rootAttrs: { 'data-color-mode': 'dark', 'data-theme': 'dark:dark light:light' } }),
  site({ id: 'microsoft365', name: 'Microsoft 365', domain: 'outlook.office.com', file: 'microsoft365.user.css', css: microsoft365,
    stockSource: 'Fluent v9 webDarkTheme tokens + legacy Fabric slots',
    wrap: { tag: 'div', attrs: { id: 'appContainer', class: 'ms-Fabric' } }, hue: { deg: '251.6', source: 'its blue', hi: '#8EC9FF', mid: '#76AFEE', alt: '#5D96D3' },
    rootClass: 'fui-FluentProvider', rootAttrs: { 'data-theme': 'dark' } }),
  site({ id: 'copilot', name: 'Microsoft Copilot', domain: 'copilot.microsoft.com', file: 'copilot.user.css', css: copilot,
    stockSource: 'Copilot Tailwind-style 100–900 ramps (space-separated RGB channels) dark values',
    wrap: { tag: 'div', attrs: { id: 'app' } }, hue: { deg: '251.3', source: 'Microsoft blue #0078D4', hi: '#8EC9FF', mid: '#75AFEE', alt: '#5D96D3' } }),
  site({ id: 'gemini', name: 'Gemini', domain: 'gemini.google.com', file: 'gemini.user.css', css: gemini,
    stockSource: 'Material 3 --gm3-sys-color-* dark scheme + --bard-color-* values',
    wrap: { tag: 'bard-sidenav-container' }, hue: { deg: '304.0', source: 'violet mid-stop of its wordmark gradient #9B72CB', hi: '#D3B2FE', mid: '#BA99E3', alt: '#A181C9' } }),
  site({ id: 'aistudio', name: 'Google AI Studio', domain: 'aistudio.google.com', file: 'aistudio.user.css', css: aistudio,
    stockSource: 'Material 3 --gm3-sys-color-* dark scheme + ms-* shell greys named in the file',
    wrap: { tag: 'ms-app' }, hue: { deg: '260.0', source: 'Google blue #4285F4', hi: '#9AC5FF', mid: '#82ACF0', alt: '#6A93D5' } }),
  site({ id: 'shopee', name: 'Shopee', domain: 'shopee.ph', file: 'shopee.user.css', css: shopee,
    stockSource: 'Shopee Ncore --nc-* light values (Shopee ships no dark mode)',
    hue: { deg: '33.1', source: 'its orange-red #EE4D2D', hi: '#FFAA96', mid: '#E7907D', alt: '#CC7866' } })
];

export const SITE_IDS = SITES.map((s) => s.id);
export const siteById = (id: string): Site | undefined => SITES.find((s) => s.id === id);
export const laneRootClass = (s: Site) => `site-${s.id}`;
