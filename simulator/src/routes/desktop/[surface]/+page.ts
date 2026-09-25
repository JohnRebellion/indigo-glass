import { SURFACE_IDS } from '$lib/desktop/registry';
export const prerender = true;
export const entries = () => SURFACE_IDS.map((surface) => ({ surface }));
