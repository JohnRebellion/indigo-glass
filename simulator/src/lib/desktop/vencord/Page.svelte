<script lang="ts">
  /* Vencord/Discord: server rail, channel list, chat (mentions/code/embeds/
   * reactions/replies), composer, member list, user popout, modal, buttons
   * (brand/secondary/danger), context menu, tooltip, settings sidebar.
   * Same hybrid pattern as ../obsidian/Page.svelte (reused read-only, see
   * cssTheme.ts/structure.ts headers): stock.css scoped into both lanes,
   * the real shipped theme.css scoped into "ours" only, injected last so its
   * `!important` declarations win the cascade the way Vencord's own
   * theme-loader applies it after Discord's compiled stylesheet. Discord's
   * real classes are hash-obfuscated and rotate every release, so every
   * specimen element below carries a `*_stock`-suffixed class whose name
   * still contains the substring the shipped file's own `[class*="x"]`
   * selectors target - the same substring-match convention the shipped
   * theme uses because there is no stable literal class to write instead. */
  import DesktopPage from '../DesktopPage.svelte';
  import DPair from '../DPair.svelte';
  import Section from '$lib/nb/Section.svelte';
  import StructureCheck from '../obsidian/StructureCheck.svelte';
  import { scopePlainCss } from '../obsidian/cssTheme';
  import { meta, roles, contrast } from './index';
  import { ours, stock, stockCss, shippedCss, laneVars, coverage } from './model';

  const lanes = {
    stock: { which: 'stock' as const, label: "Reconstructed Discord default (.theme-dark)", style: laneVars(stock), model: stock },
    ours: { which: 'ours' as const, label: 'vencord/indigo-glass.theme.css', style: laneVars(ours), model: ours }
  };

  const stockScopedStock = scopePlainCss(stockCss, '[data-lane="stock"]');
  const oursScopedStock = scopePlainCss(stockCss, '[data-lane="ours"]');
  const oursScopedShipped = scopePlainCss(shippedCss, '[data-lane="ours"]');
</script>

<DesktopPage {meta} {lanes} {roles} {contrast} {coverage}>
  <Section id="rail-channels" title="Server rail + channel list" lead="Guild rail with an unread/selected pill, channel list with a selected channel" min="420px">
    <DPair name="server rail + channels" span="full">
      {#snippet children()}
        <div class="theme-dark vc-shell">
          <div class="guilds_stock">
            <div class="listItem_stock selected_stock">SI</div>
            <div class="listItem_stock">A</div>
            <div class="listItem_stock">B</div>
          </div>
          <div class="sidebar_stock">
            <div class="containerDefault_stock"><div class="link_stock"><span class="icon_stock">#</span> general</div></div>
            <div class="containerDefault_stock containerSelected_stock"><div class="link_stock"><span class="icon_stock">#</span> sage-ink</div></div>
            <div class="containerDefault_stock"><div class="link_stock"><span class="icon_stock">#</span> off-topic</div></div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="chat" title="Chat" lead="Mentions, inline code + code block, embed, reactions, reply bar" min="480px">
    <DPair name="chat" span="full">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="chat_stock">
            <div class="messageListItem_stock">
              <div class="replyBar_stock">Replying to Welcome Bot</div>
              <span class="username_stock">sage</span> <span class="timestamp_stock">Today at 10:04</span>
              <div class="markup_stock">
                Thanks <span class="mentioned_stock">@indigo</span> - see <a href="https://example.com">the repo</a>,
                <code>ink()</code> and:
                <pre><code>function ink() {'{'} return true; {'}'}</code></pre>
                <kbd>Ctrl</kbd>+<kbd>K</kbd> opens the palette, <samp>ink@sage:~$</samp>, <tt>fixed-width</tt>.
              </div>
              <div class="embedFull_stock">indigo-glass - Sage Ink design system</div>
              <div class="reactionsContainer_stock">
                <div class="reaction_stock reactionMe_stock">🌿 3</div>
                <div class="reaction_stock">👍 1</div>
              </div>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="composer-members" title="Composer + member list + user popout" min="380px">
    <DPair name="composer">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="channelTextArea_stock">Message #sage-ink</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="member list + user popout" note="Hover-preview popout for a member.">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad" style="display:flex; gap:12px;">
          <div class="members_stock">
            <div class="header_stock">Online - 2</div>
            <div class="member_stock"><span class="avatar_stock"></span> indigo <span class="status_positive_stock">●</span></div>
            <div class="member_stock"><span class="avatar_stock"></span> sage <span class="status_warning_stock">●</span></div>
          </div>
          <div class="user_popout_stock">
            <div class="avatar_stock" style="width:48px;height:48px;"></div>
            <strong>indigo</strong>
            <div class="markup_stock">Design system maintainer</div>
            <div class="activityCard_stock">Playing Sage Ink</div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="modal-buttons" title="Modal, buttons, search" lead="Brand / secondary / danger buttons, a confirm modal, the search input" min="360px">
    <DPair name="modal">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="modal_stock">
            <h2 class="title_stock">Leave "sage-ink"?</h2>
            <div class="footer_stock" style="display:flex; gap:8px; justify-content:flex-end;">
              <button type="button" class="button_stock colorPrimary_stock">Cancel</button>
              <button type="button" class="button_stock colorDanger_stock">Leave Server</button>
            </div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="buttons + search">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad" style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;">
          <button type="button" class="button_stock colorBrand_stock">Save Changes</button>
          <button type="button" class="button_stock colorPrimary_stock">Secondary</button>
          <button type="button" class="button_stock colorDanger_stock">Delete</button>
          <input class="input_stock" placeholder="Search" />
        </div>
      {/snippet}
    </DPair>
  </Section>

  <Section id="chrome" title="Context menu, tooltip, settings sidebar" min="280px">
    <DPair name="context menu">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="menu_stock">
            <div class="item_stock">Mark as Read</div>
            <div class="item_stock">Mute Channel</div>
            <div class="item_stock colorDanger_stock">Delete Channel</div>
          </div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="tooltip">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="tooltip_stock">Mute</div>
        </div>
      {/snippet}
    </DPair>
    <DPair name="settings sidebar">
      {#snippet children()}
        <div class="theme-dark vc-shell vc-pad">
          <div class="settingsSidebar_stock">
            <div class="item_stock selected_stock">My Account</div>
            <div class="item_stock">Vencord</div>
            <div class="item_stock">Themes</div>
          </div>
        </div>
      {/snippet}
    </DPair>
  </Section>

  <StructureCheck />
</DesktopPage>

{@html `<style data-stock="vencord">${stockScopedStock}</style>`}
{@html `<style data-ours-stock="vencord">${oursScopedStock}</style>`}
{@html `<style data-ours-shipped="vencord">${oursScopedShipped}</style>`}

<style>
  .vc-shell { width: 100%; display: flex; font-size: 13px; }
  .vc-pad { padding: 10px; }
  .guilds_stock { flex-shrink: 0; }
  .listItem_stock { margin-bottom: 8px; cursor: default; }
  .sidebar_stock { flex: 1; }
  .containerDefault_stock { cursor: default; }
  .chat_stock { flex: 1; }
  .messageListItem_stock > * + * { margin-top: 2px; }
  .embedFull_stock { margin: 4px 0; }
  .members_stock { flex-shrink: 0; }
  .member_stock { cursor: default; }
  .avatar_stock { display: inline-block; }
  .user_popout_stock { width: 220px; }
  .modal_stock { width: 320px; }
  .menu_stock { width: 200px; }
  .settingsSidebar_stock .item_stock { cursor: default; margin-bottom: 2px; }
  button.button_stock { cursor: default; font: inherit; }
</style>
