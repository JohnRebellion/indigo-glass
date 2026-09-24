import { SITE_IDS } from '$lib/sites/registry';
export const prerender = true;
export const entries = () => SITE_IDS.map((site) => ({ site }));
