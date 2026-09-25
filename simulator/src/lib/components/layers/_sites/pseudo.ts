/* Svelte action: read a paint the element probe cannot reach — a
 * pseudo-element (::placeholder, ::before) or a UA-drawn control's
 * accent-color — off the rendered element with getComputedStyle, and append
 * it to data-probe as a `slot:=#HEX` literal (probe.ts grammar). It is still
 * a computed value of the lane's real stylesheet, not a model value; the
 * layer's fidelity note says which cells these are. */
import { toHex } from '../../probe';

export type PseudoRead = { slot: string; prop: string; pseudo?: string };

export function probeComputed(node: Element, reads: PseudoRead | PseudoRead[]) {
  const list = Array.isArray(reads) ? reads : [reads];
  const extra = list.flatMap(({ slot, prop, pseudo }) => {
    const v = toHex(getComputedStyle(node, pseudo ?? null).getPropertyValue(prop));
    return v ? [`${slot}:=${v}`] : [];
  });
  node.setAttribute('data-probe', [node.getAttribute('data-probe') ?? '', ...extra].join(' ').trim());
}
