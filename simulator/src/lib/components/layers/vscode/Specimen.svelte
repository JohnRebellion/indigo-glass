<script lang="ts">
  /* VS Code workbench widgets, with VS Code's own class names, painted from
     the --vscode-<key> custom properties the lane root carries (theme.ts
     resolves them exactly as the workbench does, registry defaults
     included). The rules below restate what the widgets' CSS and inline
     styles apply (button.css, menu.ts, platform/hover/browser/hover.css,
     inputBox.ts, listWidget.ts, toggle.ts, multiEditorTabsControl) — each
     one reads a named key, so a slot is that key. No colour lives here. */
  import type { ComponentId } from '../../catalogue';
  let { component }: { component: ComponentId; lane: 'stock' | 'ours' } = $props();
</script>

<div class="monaco-workbench">
  {#if component === 'button'}
    <!-- A view pane in the side bar (Source Control): secondary buttons
         there show the sideBar fill through button.secondaryBackground. -->
    <div class="pane-body">
      <div class="monaco-button monaco-text-button secondary" data-probe="fill label edge">Discard</div>
      <!-- :focus stands in as .focused: the workbench rule is the outline. -->
      <div class="monaco-button monaco-text-button secondary focused" data-probe="focus:outline">Focused</div>
      <div class="monaco-button monaco-text-button" data-probe="primary-fill primary-label">Commit</div>
    </div>
  {:else if component === 'menu'}
    <div class="context-view monaco-menu-container">
      <div class="monaco-scrollable-element" data-probe="fill edge">
        <div class="monaco-menu">
          <ul class="actions-container">
            <li class="action-item"><span class="action-menu-item" role="menuitem" tabindex="-1" data-probe="label"><span class="action-label">Cut</span></span></li>
            <!-- keyboard-selected item (:focus-visible), where menu.selectionBorder applies -->
            <li class="action-item focused"><span class="action-menu-item" role="menuitem" tabindex="-1" data-probe="selected-fill selected-edge:outline selected-label"><span class="action-label">Copy</span></span></li>
            <li class="action-item"><span class="action-menu-item" role="menuitem" tabindex="-1"><span class="action-label">Paste</span></span></li>
          </ul>
        </div>
      </div>
    </div>
  {:else if component === 'tooltip'}
    <div class="monaco-hover workbench-hover" data-probe="fill label edge">
      <div class="hover-contents">Go to Definition (F12)</div>
    </div>
  {:else if component === 'text-field'}
    <div class="col">
      <div class="monaco-inputbox" data-probe="fill edge">
        <div class="ibwrapper"><span class="input placeholder" data-probe="placeholder">Search</span></div>
      </div>
      <div class="monaco-inputbox">
        <div class="ibwrapper"><input class="input" readonly value="theme.ts" data-probe="text" /></div>
      </div>
      <div class="monaco-inputbox synthetic-focus" data-probe="focus:outline">
        <div class="ibwrapper"><input class="input" readonly value="sage" /></div>
        <div class="controls"><div class="monaco-custom-toggle checked" title="Match Case">Aa</div></div>
      </div>
    </div>
  {:else if component === 'list-selection'}
    <div class="monaco-list" data-probe="fill">
      <div class="monaco-list-row" data-probe="label">src</div>
      <div class="monaco-list-row selected focused" data-probe="selected-fill selected-edge:outline selected-label">tokens</div>
      <div class="monaco-list-row">vscode</div>
    </div>
  {:else if component === 'scrollbar'}
    <div class="monaco-scrollable-element editor-scrollable">
      <div class="scrollbar vertical" data-probe="track"><div class="slider" data-probe="thumb"></div></div>
    </div>
  {:else if component === 'checkbox'}
    <div class="col editor-pane" data-probe="surface">
      <div class="cb">
        <div class="monaco-custom-toggle monaco-checkbox" data-probe="box-fill box-edge"></div>
        <span data-probe="label">Format On Save</span>
      </div>
      <div class="cb">
        <!-- Checked: toggle.ts only sets the codicon; the fill stays checkbox.background. -->
        <div class="monaco-custom-toggle monaco-checkbox checked" data-probe="checked-fill">
          <span class="codicon codicon-check" data-probe="mark:color">
            <svg viewBox="0 0 16 16" width="16" height="16"><path d="M3.5 8.5l3 3 6-7" /></svg>
          </span>
        </div>
        <span>Word Wrap</span>
      </div>
    </div>
  {:else if component === 'tab'}
    <div class="tabs-container" data-probe="fill">
      <div class="tab active" data-probe="active-fill active-label">
        <div class="tab-border-top-container" data-probe="active-marker:bg"></div>
        <span class="label-name">theme.ts</span>
        <div class="tab-border-bottom-container"></div>
      </div>
      <div class="tab" data-probe="inactive-label"><span class="label-name">index.ts</span></div>
    </div>
  {/if}
</div>

<style>
  .monaco-workbench { color: var(--vscode-foreground); font-size: 13px; display: flex; gap: 10px; }
  .col { display: flex; flex-direction: column; gap: 8px; }

  /* button.css + Button's inline styles (defaultStyles.ts) */
  .pane-body { background: var(--vscode-sideBar-background); padding: 10px; display: flex; flex-direction: column; gap: 8px; width: 200px; }
  .monaco-text-button {
    box-sizing: border-box; display: flex; justify-content: center; padding: 4px 8px; border-radius: 4px; line-height: 16px;
    border: var(--vscode-strokeThickness) solid var(--vscode-button-border, transparent);
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
  }
  .monaco-text-button.secondary {
    border-color: var(--vscode-button-secondaryBorder, var(--vscode-button-border, transparent));
    background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);
  }
  /* workbench style.css keyboard focus + button.css `outline-offset: 2px` */
  .monaco-text-button.focused { outline: var(--vscode-strokeThickness) solid var(--vscode-focusBorder); outline-offset: 2px; }

  /* menu.ts: scrollElement fill + getMenuWidgetCSS border; item inline styles */
  .monaco-scrollable-element[data-probe] {
    background: var(--vscode-menu-background); color: var(--vscode-menu-foreground);
    border: var(--vscode-strokeThickness) solid var(--vscode-menu-border); border-radius: 5px; padding: 4px 0; min-width: 180px;
  }
  .actions-container { list-style: none; margin: 0; padding: 0; }
  .action-menu-item { display: block; margin: 0 4px; padding: 0 20px; line-height: 2em; border-radius: 3px; color: var(--vscode-menu-foreground); }
  .action-item.focused > .action-menu-item {
    background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground);
    outline: var(--vscode-strokeThickness) solid var(--vscode-menu-selectionBorder, transparent); outline-offset: -1px;
  }

  /* platform/hover/browser/hover.css */
  .workbench-hover {
    background: var(--vscode-editorHoverWidget-background); color: var(--vscode-editorHoverWidget-foreground);
    border: var(--vscode-strokeThickness) solid var(--vscode-editorHoverWidget-border); border-radius: 5px; padding: 4px 8px;
  }

  /* inputBox.css + InputBox.applyStyles; focus = workbench .synthetic-focus */
  .monaco-inputbox {
    width: 220px; border-radius: 4px; position: relative; display: flex;
    background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: var(--vscode-strokeThickness) solid var(--vscode-input-border, transparent);
  }
  .ibwrapper { flex: 1; }
  .input { display: block; box-sizing: border-box; width: 100%; padding: 4px 6px; border: none; background: inherit; color: inherit; font: inherit; }
  .input.placeholder { color: var(--vscode-input-placeholderForeground); }
  input.input:focus { outline: none; }
  .monaco-inputbox.synthetic-focus { outline: var(--vscode-strokeThickness) solid var(--vscode-focusBorder); outline-offset: -1px; }
  .controls { display: flex; align-items: center; padding-right: 2px; }
  .controls .monaco-custom-toggle {
    width: 20px; height: 20px; box-sizing: border-box; border-radius: 3px; font-size: 11px; line-height: 18px; text-align: center;
    border: var(--vscode-strokeThickness) solid var(--vscode-inputOption-activeBorder);
    background: var(--vscode-inputOption-activeBackground); color: var(--vscode-inputOption-activeForeground, inherit);
  }

  /* listWidget.ts style(): the active list's focused+selected row */
  .monaco-list { background: var(--vscode-sideBar-background); color: var(--vscode-sideBar-foreground, var(--vscode-foreground)); width: 220px; padding: 2px 0; }
  .monaco-list-row { padding: 0 8px 0 20px; line-height: 22px; }
  .monaco-list-row.selected.focused {
    background: var(--vscode-list-activeSelectionBackground); color: var(--vscode-list-activeSelectionForeground);
    outline: var(--vscode-strokeThickness) solid var(--vscode-list-focusAndSelectionOutline, var(--vscode-contrastActiveBorder, var(--vscode-list-focusOutline)));
    outline-offset: -1px;
  }

  /* scrollableElement: the slider over the editor; the track paints nothing */
  .editor-scrollable { position: relative; width: 60px; height: 130px; background: var(--vscode-editor-background); }
  .scrollbar.vertical { position: absolute; right: 0; top: 0; width: 14px; height: 100%; }
  .slider { position: absolute; left: 0; width: 14px; top: 20%; height: 35%; background: var(--vscode-scrollbarSlider-background); }

  /* toggle.css + BaseCheckbox.applyStyles */
  .editor-pane { background: var(--vscode-editor-background); color: var(--vscode-foreground); padding: 6px; }
  .cb { display: flex; align-items: center; }
  .monaco-checkbox {
    width: 18px; height: 18px; box-sizing: border-box; border-radius: 3px; margin-right: 9px; display: inline-flex; align-items: center; justify-content: center;
    background: var(--vscode-checkbox-background); color: var(--vscode-checkbox-foreground);
    border: var(--vscode-strokeThickness) solid var(--vscode-checkbox-border);
  }
  .codicon { display: inline-flex; }
  .codicon path { fill: none; stroke: currentColor; stroke-width: 1.6; }

  /* multiEditorTabsControl: tabs over editorGroupHeader.tabsBackground */
  .tabs-container { display: flex; background: var(--vscode-editorGroupHeader-tabsBackground); min-width: 260px; height: 35px; }
  .tab {
    position: relative; display: flex; align-items: center; padding: 0 16px;
    background: var(--vscode-tab-inactiveBackground); color: var(--vscode-tab-inactiveForeground);
    border-right: var(--vscode-strokeThickness) solid var(--vscode-tab-border);
  }
  .tab.active { background: var(--vscode-tab-activeBackground); color: var(--vscode-tab-activeForeground); }
  .tab-border-top-container { position: absolute; left: 0; right: 0; top: 0; height: 1px; background: var(--vscode-tab-activeBorderTop); }
  .tab-border-bottom-container { position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--vscode-tab-activeBorder); }
</style>
