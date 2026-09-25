import { COMPONENT_IDS } from '$lib/components/catalogue';
export const prerender = true;
export const entries = () => COMPONENT_IDS.map((component) => ({ component }));
