<script lang="ts">
  /* SDDM login screen: a 1920x1080 greeter scaled into each lane, then its
   * parts at 1.5x — password field states, user selector and sign-in, the
   * session / keyboard / power controls, the clock, and what a wrong password
   * does. Ours renders from a parse of sddm/indigo-glass/Main.qml; a control
   * the QML does not create is shown as absent, never invented. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import { iniCoverage } from '../coverage';
  import type { Lane } from '../surface';
  import { meta, roles, contrast } from './index';
  import { ours, stock, laneVars, KEY_VARS, QML_IGNORE, BIND, SAMPLE, type SddmModel } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: 'Breeze (plasma-desktop 6.7.4)', style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'sddm/indigo-glass/Main.qml', style: laneVars(ours), model: ours }
  };
  const coverage = () =>
    iniCoverage(
      [{ label: 'Main.qml', doc: ours.qml }, { label: 'theme.conf', doc: ours.conf }, { label: 'metadata.desktop', doc: ours.meta }],
      KEY_VARS,
      QML_IGNORE
    );
  const confKeys = [...new Set([...ours.conf.keys(), ...stock.conf.keys()].filter((k) => k.startsWith('General/')).map((k) => k.slice(8)))];
  const metaKeys = ours.meta.keys().filter((k) => k.startsWith('SddmGreeterTheme/')).map((k) => k.slice(17));
  const dots = '•'.repeat(SAMPLE.dots);
  type Field = 'rest' | 'focus' | 'typed' | 'selected';
</script>

{#snippet user(m: SddmModel, focus = false)}
  {#if m.avatars}
    <div class="avatars">
      <div class="face cur"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7z" /></svg></div>
      <div class="face"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7z" /></svg></div>
    </div>
    <div class="uname">{SAMPLE.name}</div>
  {:else}
    <div class="combo usr" class:focus><span>{SAMPLE.login}</span></div>
  {/if}
{/snippet}

{#snippet field(m: SddmModel, s: Field)}
  <div class="pwrow">
    <div class="pw" class:focus={s !== 'rest'}>
      {#if s === 'typed'}<span class="dots">{dots}</span><span class="caret"></span>
      {:else if s === 'selected'}<span class="dots sel">{dots}</span>
      {:else}{#if s === 'focus'}<span class="caret"></span>{/if}<span class="ph">{m.placeholder()}</span>{/if}
    </div>
    {#if m.signIn() === null}
      <div class="btn arrow" title="go-next"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" /></svg></div>
    {/if}
  </div>
{/snippet}

{#snippet signin(m: SddmModel, pressed = false)}
  {#if m.signIn() !== null}<div class="btn wide" class:pressed>{m.signIn()}</div>{/if}
{/snippet}

{#snippet session(m: SddmModel)}
  {#if m.panel}<div class="combo sess"><span>{m.session()}</span></div>
  {:else}<div class="tool"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="9" /></svg>{m.session()}</div>{/if}
{/snippet}

{#snippet actions(m: SddmModel)}
  <div class="actions">
    {#each m.actions as a}
      <div class="act"><span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">
        {#if /Shut/.test(a)}<path d="M12 3v8M7 6a7 7 0 1 0 10 0" />
        {:else if /Restart/.test(a)}<path d="M19 12a7 7 0 1 1-2-5M19 4v4h-4" />
        {:else if /Sleep/.test(a)}<path d="M15 4a8 8 0 1 0 5 12 7 7 0 0 1-5-12z" />
        {:else if /Hibernate/.test(a)}<path d="M12 3v18M4 8l16 8M4 16l16-8" />
        {:else}<circle cx="12" cy="9" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" />{/if}
      </svg></span><span class="al">{a}</span></div>
    {/each}
  </div>
{/snippet}

{#snippet screen(m: SddmModel, failed = false)}
  <div class="screen">
    <div class="s">
      <div class="wall"></div>
      {#if !m.clock.corner}
        <div class="clock-c"><div class="time">{m.clock.time()}</div>{#if m.clock.date}<div class="date">{m.clock.date}</div>{/if}</div>
      {/if}
      <div class="stage">
        <div class="box">
          {#if m.panel}<div class="shadow"></div>{/if}
          <div class="form" class:panel={m.panel}>
            {#if m.brand}<div class="brand"><span class="dot"></span><span>{m.brand()}</span></div>{/if}
            {@render user(m)}
            {#if failed && m.error.message}<div class="notice">{m.error.message}</div>{/if}
            {@render field(m, failed ? (m.error.password === 'selected' ? 'selected' : m.error.refocus ? 'focus' : 'rest') : 'rest')}
            {@render signin(m)}
            {#if m.panel}{@render session(m)}{/if}
          </div>
        </div>
        {#if m.actions.length}{@render actions(m)}{/if}
      </div>
      {#if m.clock.corner}<div class="clock-k">{m.clock.time()}</div>{/if}
      {#if !m.panel}
        <div class="footer">
          {#if m.keyboard}<div class="tool"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="4" width="14" height="8" /><path d="M4 10h8" /></svg>{m.keyboard}</div>{/if}
          {@render session(m)}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="screen" title="Login screen" lead="1920x1080, scaled to the lane: wallpaper, form, clock, footer" min="560px">
    <DPair name="greeter" span="full" note="Breeze: avatar list, Password field with an arrow button, power actions, clock above, session and keyboard buttons in the footer; wallpaper blurred by WallpaperFader. Ours: one opaque panel over background.svg, clock bottom-right. Neither sample user data nor the Qt ComboBox indicator arrow comes from the theme; the indicator is left at the Controls default (a dark arrow on surface_alt in an offscreen Qt 6 render) and is not drawn here.">
      {#snippet children(lane: Lane<SddmModel>)}
        {@render screen(lane.model)}
      {/snippet}
    </DPair>
  </Section>

  <Section id="fields" title="Password field" lead="Unfocused, focused, typed — 1.5x" min="560px">
    <DPair name="password field" span="full" note="Focus: Breeze takes the View set's DecorationFocus; ours swaps the 2px edge to accent. Breeze's lineedit SVG frame is approximated (1px, 3px corner).">
      {#snippet children(lane: Lane<SddmModel>)}
        <div class="zoom col">
          <span class="cap">unfocused</span>{@render field(lane.model, 'rest')}
          <span class="cap">focused</span>{@render field(lane.model, 'focus')}
          <span class="cap">typed ({lane.model.echo()})</span>{@render field(lane.model, 'typed')}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="user" title="User and sign in" lead="How the user is picked, and the button that logs in — 1.5x" min="560px">
    <DPair name="user and sign-in" span="full" note="Breeze lists users as avatars (count <= DisableAvatarsThreshold) and logs in from an icon-only arrow beside the field. Ours: a user ComboBox and a full-width Sign in button (rest, then pressed).">
      {#snippet children(lane: Lane<SddmModel>)}
        <div class="zoom col">
          {@render user(lane.model)}
          {#if !lane.model.avatars}<span class="cap">focused</span>{@render user(lane.model, true)}{/if}
          {#if lane.model.signIn() !== null}
            <span class="cap">rest</span>{@render signin(lane.model)}
            <span class="cap">pressed</span>{@render signin(lane.model, true)}
          {:else}
            <span class="cap">no separate button: the arrow sits in the field row</span>{@render field(lane.model, 'rest')}
          {/if}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="controls" title="Session, keyboard, power" lead="Every non-login control the greeter creates — 1.5x" min="560px">
    <DPair name="session, keyboard, power" span="full" note="Main.qml creates no keyboard-layout button and no power actions: from this theme there is no way to shut down, restart or sleep, or change layout, at the login screen.">
      {#snippet children(lane: Lane<SddmModel>)}
        <div class="zoom col">
          <span class="cap">session</span>{@render session(lane.model)}
          <span class="cap">keyboard layout</span>
          {#if lane.model.keyboard}<div class="tool">{lane.model.keyboard}</div>{:else}<p class="absent">— none: Main.qml creates no such control</p>{/if}
          <span class="cap">power actions</span>
          {#if lane.model.actions.length}{@render actions(lane.model)}{:else}<p class="absent">— none: Main.qml creates no such control</p>{/if}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="clock" title="Clock" lead="Where it sits and how it is set" min="360px">
    <DPair name="clock" span="full">
      {#snippet children(lane: Lane<SddmModel>)}
        <div class="clockbox" class:corner={lane.model.clock.corner}>
          <div class="wall"></div>
          {#if lane.model.clock.corner}<div class="clock-k">{lane.model.clock.time()}</div>
          {:else}<div class="clock-c"><div class="time">{lane.model.clock.time()}</div>{#if lane.model.clock.date}<div class="date">{lane.model.clock.date}</div>{/if}</div>{/if}
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="error" title="Wrong password" lead="The screen right after sddm reports loginFailed, from each theme's own handler" min="560px">
    <DPair name="login failed" span="full" note="Breeze says 'Login Failed' for 3 s, shakes the form (RejectPasswordAnimation) and selects the password. Ours only clears the field and refocuses it: no message, no motion — a mistyped password looks like nothing happened.">
      {#snippet children(lane: Lane<SddmModel>)}
        {@render screen(lane.model, true)}
        <dl class="err">
          <dt>message</dt><dd>{lane.model.error.message ?? 'none'}</dd>
          <dt>password</dt><dd>{lane.model.error.password}</dd>
          <dt>refocus</dt><dd>{lane.model.error.refocus ? 'yes' : 'no'}</dd>
          <dt>shake</dt><dd>{lane.model.error.shake ? 'yes' : 'no'}</dd>
        </dl>
        <pre class="src">{lane.model.errorSource()}</pre>
      {/snippet}
    </DPair>
  </Section>

  <Section id="files" title="Theme files" lead="theme.conf, metadata.desktop and every painted Main.qml binding" min="560px">
    <DPair name="theme.conf" span="full" note="SDDM hands theme.conf to the QML as `config`. Main.qml reads none of it, so these six keys only matter to the System Settings SDDM page.">
      {#snippet children(lane: Lane<SddmModel>)}
        <table class="tbl">
          <thead><tr><th>[General]</th><th>value</th><th>read by Main.qml</th></tr></thead>
          <tbody>
            {#each confKeys as k}
              {@const v = lane.model.conf.get('General', k)}
              <tr><th>{k}</th><td>{#if k === 'color' && v}<span class="chip conf"></span>{/if}{v ?? '—'}</td><td>{v === undefined ? '' : lane.model.confRead.has(k) ? 'yes' : 'no'}</td></tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="metadata.desktop" span="full" note="Name is what System Settings lists. Translations of the stock Name/Description are not shown.">
      {#snippet children(lane: Lane<SddmModel>)}
        <table class="tbl">
          <tbody>
            {#each metaKeys as k}<tr><th>{k}</th><td>{lane.model.meta.get('SddmGreeterTheme', k) ?? '—'}</td></tr>{/each}
          </tbody>
        </table>
      {/snippet}
    </DPair>
    <DPair name="painted bindings" span="full" note="Each row is a Main.qml binding and the value this lane paints for it. Ours shows the QML source; a scoping hit (an unqualified name resolving on the binding's own object) is flagged. Stock shows the Breeze value used for the same slot.">
      {#snippet children(lane: Lane<SddmModel>)}
        <table class="tbl">
          <tbody>
            {#each BIND as [g, k, v]}
              <tr><th>{g}.{k}</th>
                {#if lane.which === 'ours'}<td class="src1">{lane.model.qml.peek(g, k)}</td>{/if}
                <td>{lane.model.vars[v]}{lane.model.vars[`${v}-on`] !== undefined ? ` / ${lane.model.vars[`${v}-on`]}` : ''}</td></tr>
            {/each}
          </tbody>
        </table>
        {#if lane.model.shadowed.length}<ul class="bad">{#each lane.model.shadowed as s}<li>{s}</li>{/each}</ul>{/if}
      {/snippet}
    </DPair>
  </Section>
</DesktopPage>

<style>
  /* --u is one QML pixel. The screen maps 1920 of them onto the lane width;
     the zoomed specimens use 1.5 CSS px. Text also follows the host scale. */
  .screen { flex: 1 1 100%; min-width: 0; container-type: inline-size; }
  .s {
    --u: calc(100cqw / 1920);
    position: relative; aspect-ratio: 16 / 9; overflow: hidden;
    background: var(--sd-desk); color: var(--sd-user-fg);
    font-family: var(--sd-user-font);
  }
  .wall { position: absolute; inset: 0; background-image: var(--sd-wall); background-size: var(--sd-wall-fit); background-position: center; opacity: var(--sd-wall-opacity); filter: var(--sd-wall-filter); }
  .stage { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: calc(24 * var(--u)); }
  .box { position: relative; width: calc(var(--sd-panel-w) * var(--u)); }
  .shadow { position: absolute; inset: 0; transform: translate(calc(var(--sd-shadow-x) * var(--u)), calc(var(--sd-shadow-y) * var(--u))); background: var(--sd-shadow); }
  .form {
    position: relative; display: flex; flex-direction: column; gap: calc(var(--sd-panel-gap) * var(--u));
    padding: calc(var(--sd-panel-pad) * var(--u)); background: var(--sd-panel-bg);
    border: calc(var(--sd-panel-edge-w) * var(--u)) solid var(--sd-panel-edge); border-radius: calc(var(--sd-panel-radius) * var(--u));
  }
  .form:not(.panel) { align-items: stretch; }
  .brand { display: flex; align-items: center; justify-content: center; gap: calc(var(--sd-brand-gap) * var(--u));
    font-family: var(--sd-brand-font); font-size: calc(var(--sd-brand-px) * var(--u) * var(--host-scale, 1)); font-weight: var(--sd-brand-weight); color: var(--sd-brand-fg); }
  .dot { width: calc(var(--sd-dot-w) * var(--u)); height: calc(var(--sd-dot-h) * var(--u)); border-radius: calc(var(--sd-dot-r) * var(--u)); background: var(--sd-dot); }

  .combo { display: flex; align-items: center; box-sizing: border-box; }
  .combo.usr {
    height: calc(var(--sd-user-h) * var(--u)); background: var(--sd-user-bg); color: var(--sd-user-fg);
    border: calc(var(--sd-user-edge-w) * var(--u)) solid var(--sd-user-edge); border-radius: calc(var(--sd-user-radius) * var(--u));
    font-family: var(--sd-user-font); font-size: calc(var(--sd-user-px) * var(--u) * var(--host-scale, 1)); padding-left: calc(var(--sd-user-pad) * var(--u));
  }
  .combo.usr.focus { border-color: var(--sd-user-edge-on, var(--sd-user-edge)); }
  .combo.sess {
    height: calc(var(--sd-sess-h) * var(--u)); background: var(--sd-sess-bg); color: var(--sd-sess-fg);
    border: calc(var(--sd-sess-edge-w) * var(--u)) solid var(--sd-sess-edge); border-radius: calc(var(--sd-sess-radius) * var(--u));
    font-family: var(--sd-sess-font); font-size: calc(var(--sd-sess-px) * var(--u) * var(--host-scale, 1)); padding-left: calc(var(--sd-sess-pad) * var(--u));
  }

  .avatars { display: flex; justify-content: center; align-items: flex-start; gap: calc(12 * var(--u)); }
  .face { width: calc((var(--sd-user-h) - 18) * var(--u)); aspect-ratio: 1; border-radius: 50%; background: var(--sd-user-bg); color: var(--sd-user-fg); display: grid; place-items: center; opacity: 0.75; }
  .face.cur { width: calc(var(--sd-user-h) * var(--u)); opacity: 1; }
  .face svg { width: 60%; height: 60%; fill: currentColor; }
  .uname { text-align: center; color: var(--sd-user-fg); font-size: calc(var(--sd-user-px) * var(--u) * var(--host-scale, 1)); }
  .notice { text-align: center; font-style: italic; color: var(--sd-user-fg); font-size: calc(var(--sd-note-px, 12) * var(--u) * var(--host-scale, 1)); }

  .pwrow { display: flex; gap: calc(4 * var(--u)); }
  .pw {
    flex: 1; min-width: 0; box-sizing: border-box; display: flex; align-items: center; overflow: hidden; white-space: nowrap;
    height: calc(var(--sd-pw-h) * var(--u)); background: var(--sd-pw-bg); color: var(--sd-pw-fg);
    border: calc(var(--sd-pw-edge-w) * var(--u)) solid var(--sd-pw-edge); border-radius: calc(var(--sd-pw-radius) * var(--u));
    font-family: var(--sd-pw-font); font-size: calc(var(--sd-pw-px) * var(--u) * var(--host-scale, 1)); padding-left: calc(var(--sd-pw-pad) * var(--u));
  }
  .pw.focus { border-color: var(--sd-pw-edge-on, var(--sd-pw-edge)); }
  .ph { color: var(--sd-pw-ph); }
  .caret { display: inline-block; width: max(1px, calc(1 * var(--u))); height: 1.1em; background: var(--sd-pw-fg); }
  .dots.sel { background: var(--sd-sel-bg); color: var(--sd-sel-fg); }

  .btn {
    box-sizing: border-box; display: grid; place-items: center;
    height: calc(var(--sd-btn-h) * var(--u)); background: var(--sd-btn-bg); color: var(--sd-btn-fg);
    border-radius: calc(var(--sd-btn-radius) * var(--u));
    font-family: var(--sd-btn-font); font-size: calc(var(--sd-btn-px) * var(--u) * var(--host-scale, 1)); font-weight: var(--sd-btn-weight);
  }
  .btn.pressed { background: var(--sd-btn-bg-on, var(--sd-btn-bg)); }
  .btn.arrow { width: calc(var(--sd-btn-h) * var(--u)); border: calc(var(--sd-pw-edge-w) * var(--u)) solid var(--sd-pw-edge); }
  .btn.arrow svg { width: 50%; height: 50%; fill: none; stroke: currentColor; stroke-width: 1.6; }

  .actions { display: flex; gap: calc(8 * var(--u)); justify-content: center; }
  .act { display: flex; flex-direction: column; align-items: center; gap: calc(8 * var(--u)); color: var(--sd-action-fg); opacity: 0.85;
    font-size: calc(var(--sd-action-px, 14) * var(--u) * var(--host-scale, 1)); width: calc(88 * var(--u)); text-align: center; }
  .ico { width: calc(var(--sd-action-icon, 48) * var(--u)); height: calc(var(--sd-action-icon, 48) * var(--u)); display: grid; place-items: center; }
  .ico svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.5; }

  .tool { display: inline-flex; align-items: center; gap: calc(6 * var(--u)); color: var(--sd-sess-fg);
    font-family: var(--sd-sess-font); font-size: calc(var(--sd-sess-px) * var(--u) * var(--host-scale, 1)); padding: calc(var(--sd-sess-pad) * var(--u)); }
  .tool svg { width: 1.2em; height: 1.2em; fill: none; stroke: currentColor; stroke-width: 1.3; }
  .footer { position: absolute; left: calc(4 * var(--u)); bottom: calc(4 * var(--u)); display: flex; gap: calc(4 * var(--u)); }

  .clock-k { position: absolute; right: calc(var(--sd-clock-margin) * var(--u)); bottom: calc(var(--sd-clock-margin) * var(--u));
    font-family: var(--sd-clock-font); font-size: calc(var(--sd-clock-px) * var(--u) * var(--host-scale, 1)); color: var(--sd-clock-fg); line-height: 1; }
  .clock-c { position: absolute; left: 0; right: 0; top: 13%; text-align: center; color: var(--sd-clock-fg); font-family: var(--sd-clock-font); line-height: 1.1; }
  .time { font-size: calc(var(--sd-clock-px) * var(--u) * var(--host-scale, 1)); font-weight: var(--sd-clock-weight, 400); letter-spacing: calc(-3 * var(--u)); }
  .date { font-size: calc(var(--sd-date-px, 32) * var(--u) * var(--host-scale, 1)); }

  .zoom { --u: 1.5px; font-family: var(--sd-user-font); color: var(--sd-user-fg); }
  .col { display: flex; flex-direction: column; gap: 8px; width: min(100%, calc(var(--sd-panel-w) * var(--u))); padding: 12px; background: var(--sd-panel-bg); }
  .cap { font-family: "Iosevka Custom Condensed", monospace; font-size: var(--ig-type-xs-pt); color: var(--ig-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .absent { margin: 0; color: var(--ig-text-muted); font-style: italic; font-size: var(--host-small-pt); }
  /* Clock at 1 QML px = 1 CSS px, over the lane's own wallpaper. */
  .clockbox { --u: 1px; position: relative; flex: 1 1 100%; height: 200px; overflow: hidden; background: var(--sd-desk); }
  .clockbox .clock-c { top: 16px; }

  .err { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; margin: 0; font-size: var(--host-small-pt); color: var(--ig-text); }
  .err dt { color: var(--ig-text-muted); }
  .err dd { margin: 0; font-family: "Iosevka Custom Condensed", monospace; }
  .src { margin: 0; flex: 1 1 100%; white-space: pre-wrap; font-family: "Iosevka Custom Condensed", monospace; font-size: var(--host-small-pt); color: var(--ig-text-muted); background: var(--ig-base); padding: 6px 8px; border: var(--ig-border-default) solid var(--ig-border-strong); }
  .tbl { width: 100%; border-collapse: collapse; font-size: var(--host-small-pt); color: var(--ig-text); background: var(--ig-base); }
  .tbl th, .tbl td { text-align: left; padding: 2px 8px; border-bottom: var(--ig-border-hairline) solid var(--ig-border); font-family: "Iosevka Custom Condensed", monospace; font-weight: 400; overflow-wrap: anywhere; }
  .tbl th { color: var(--ig-text-muted); width: 34%; }
  .src1 { color: var(--ig-text-muted); }
  .chip { display: inline-block; width: 10px; height: 10px; margin-right: 4px; border: var(--ig-border-hairline) solid var(--ig-border-strong); vertical-align: -1px; }
  .chip.conf { background: var(--sd-conf-color); }
  .bad { margin: 6px 0 0; color: var(--ig-negative); font-size: var(--host-small-pt); }
</style>
