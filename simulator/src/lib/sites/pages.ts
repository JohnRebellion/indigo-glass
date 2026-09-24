/* id -> page component. A site missing here still has a registry row and a
 * prerendered route; the route says so instead of 404ing. */
import type { Component } from 'svelte';
import type { Site } from './registry';
import Github from './github/Page.svelte';
import Wikipedia from './wikipedia/Page.svelte';
import Youtube from './youtube/Page.svelte';
import Facebook from './facebook/Page.svelte';
import Google from './google/Page.svelte';
import Claude from './claude/Page.svelte';
import Chatgpt from './chatgpt/Page.svelte';
import Notion from './notion/Page.svelte';
import Linear from './linear/Page.svelte';
import Atlassian from './atlassian/Page.svelte';
import Microsoft365 from './microsoft365/Page.svelte';
import Copilot from './copilot/Page.svelte';
import Gemini from './gemini/Page.svelte';
import Aistudio from './aistudio/Page.svelte';
import Shopee from './shopee/Page.svelte';

export const PAGES: Record<string, Component<{ site: Site }>> = {
  github: Github,
  wikipedia: Wikipedia,
  youtube: Youtube,
  facebook: Facebook,
  google: Google,
  claude: Claude,
  chatgpt: Chatgpt,
  notion: Notion,
  linear: Linear,
  atlassian: Atlassian,
  microsoft365: Microsoft365,
  copilot: Copilot,
  gemini: Gemini,
  aistudio: Aistudio,
  shopee: Shopee
};
