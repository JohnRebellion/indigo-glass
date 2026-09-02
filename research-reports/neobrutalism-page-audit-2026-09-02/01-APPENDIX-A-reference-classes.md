# Appendix A — the reference implementation's own class strings

Pulled verbatim from `ekmas/neobrutalism-components`,
`src/components/ui/*.tsx` and `src/styling/globals.css`, at the commit where
the repository carries its "no longer maintained" notice. These are the
ground truth for the fidelity question — they state what the reference
*intends*; `measure/computed.tsv` states what the Sage Ink page actually
painted. The gap between the two is what Q1 asks about.

Tailwind v4, shadcn/ui-derived. `rounded-base` = `--border-radius` (5px),
`shadow-shadow` = `--shadow` (`4px 4px 0 0 var(--border)`),
`translate-x-boxShadowX` = 4px, `translate-x-reverseBoxShadowX` = -4px.

## globals.css — the variable schema (`.dark` block)

```css
:root {
  --border-radius: 5px;
  --box-shadow-x: 4px;  --box-shadow-y: 4px;
  --reverse-box-shadow-x: -4px;  --reverse-box-shadow-y: -4px;
  --heading-font-weight: 700;  --base-font-weight: 500;
  --background: oklch(93.46% 0.0304 254.32);
  --secondary-background: oklch(100% 0 0);
  --foreground: oklch(0% 0 0);
  --main-foreground: oklch(0% 0 0);
  --main: oklch(67.47% 0.1725 259.61);
  --border: oklch(0% 0 0);
  --ring: oklch(0% 0 0);
  --overlay: oklch(0% 0 0 / 0.8);
  --shadow: var(--box-shadow-x) var(--box-shadow-y) 0px 0px var(--border);
  --chart-1: oklch(67.47% 0.1726 259.49);
  --chart-2: oklch(67.28% 0.2147 24.22);
  --chart-3: oklch(86.03% 0.176 92.36);
  --chart-4: oklch(79.76% 0.2044 153.08);
  --chart-5: oklch(66.34% 0.1806 277.2);
  --chart-active-dot: #000;
}
.dark {
  --background: oklch(29.12% 0.0633 270.86);
  --secondary-background: oklch(23.93% 0 0);
  --foreground: oklch(92.49% 0 0);
  --main-foreground: oklch(0% 0 0);
  --border: oklch(0% 0 0);      /* NOTE: unchanged from light mode */
  --ring: oklch(100% 0 0);
  --shadow: var(--box-shadow-x) var(--box-shadow-y) 0px 0px var(--border);
  --chart-active-dot: #fff;
}
```

## button.tsx

```
base:     inline-flex items-center justify-center whitespace-nowrap rounded-base
          text-sm font-base ring-offset-white transition-all gap-2
          [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0
          focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black
          focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
default:  text-main-foreground bg-main border-2 border-border shadow-shadow
          hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none
noShadow: text-main-foreground bg-main border-2 border-border
neutral:  bg-secondary-background text-foreground border-2 border-border shadow-shadow
          hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none
reverse:  text-main-foreground bg-main border-2 border-border
          hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY
          hover:shadow-shadow
sizes:    default h-10 px-4 py-2 | sm h-9 px-3 | lg h-11 px-8 | icon size-10
```

## card.tsx

```
Card:            rounded-base flex flex-col shadow-shadow border-2 gap-6 py-6
                 border-border bg-background text-foreground font-base
CardHeader:      grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6
CardTitle:       font-heading leading-none
CardDescription: text-sm font-base
CardContent:     px-6
CardFooter:      flex items-center px-6
```

## badge.tsx

```
base:    inline-flex items-center justify-center rounded-base border-2 border-border
         px-2.5 py-0.5 text-xs font-base w-fit whitespace-nowrap shrink-0
         [&>svg]:size-3 gap-1 overflow-hidden
default: bg-main text-main-foreground
neutral: bg-secondary-background text-foreground
```

## input.tsx / textarea.tsx / label.tsx

```
Input:    flex h-10 w-full rounded-base border-2 border-border bg-secondary-background
          selection:bg-main selection:text-main-foreground px-3 py-2 text-sm font-base
          text-foreground placeholder:text-foreground/50 focus-visible:outline-hidden
          focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
Textarea: flex min-h-[80px] w-full rounded-base border-2 border-border
          bg-secondary-background ... (otherwise identical to Input)
Label:    text-sm font-heading leading-none peer-disabled:cursor-not-allowed
          peer-disabled:opacity-70
```

## checkbox.tsx / radio-group.tsx / switch.tsx / slider.tsx / progress.tsx

```
Checkbox:      peer size-4 shrink-0 outline-2 outline-border ring-offset-white
               data-[state=checked]:bg-main data-[state=checked]:text-white
               (indicator icon: text-main-foreground)
RadioGroup:    grid gap-2
RadioItem:     aspect-square size-4 rounded-full border-2 border-border
               text-black dark:text-white   (indicator: Circle size-2 fill-current)
Switch:        peer inline-flex h-6 w-12 shrink-0 items-center rounded-full border-2
               border-border bg-secondary-background transition-colors
               data-[state=checked]:bg-main
SwitchThumb:   block h-4 w-4 rounded-full bg-white border-2 border-border ring-0
               transition-transform data-[state=checked]:translate-x-6
               data-[state=unchecked]:translate-x-1
SliderTrack:   relative w-full grow overflow-hidden rounded-base bg-secondary-background
               border-2 border-border data-[orientation=horizontal]:h-3
SliderRange:   absolute bg-main
SliderThumb:   block h-5 w-5 rounded-full border-2 border-border bg-white
Progress:      relative h-4 w-full overflow-hidden rounded-base border-2 border-border
               bg-secondary-background
ProgressBar:   h-full w-full flex-1 border-r-2 border-border bg-main transition-all
```

## select.tsx

```
Trigger:   flex h-10 w-full items-center justify-between rounded-base border-2
           border-border bg-main gap-2 px-3 py-2 text-sm font-base text-main-foreground
Content:   relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-base border-2
           border-border bg-main text-main-foreground
Label:     border-2 border-transparent py-1.5 pr-8 pl-2 text-sm font-base
           text-main-foreground/80
Item:      relative flex w-full cursor-default select-none items-center gap-2
           rounded-base py-1.5 pr-8 pl-2 text-sm border-2 border-transparent font-base
           outline-none focus:border-border data-[disabled]:opacity-50
Separator: -mx-1 my-1 h-px bg-border
```

## table.tsx

```
Table:  w-full caption-bottom border-2 border-border text-sm
Header: [&_tr]:border-b-2 [&_tr]:border-border
Body:   [&_tr:last-child]:border-0
Footer: border-t-2 border-border bg-main font-base text-main-foreground
Row:    border-b-2 border-border transition-colors text-main-foreground bg-main
        font-base data-[state=selected]:bg-secondary-background
        data-[state=selected]:text-main-foreground
Head:   h-12 px-4 text-left align-middle font-heading text-main-foreground
Cell:   p-4 align-middle
Caption:mt-4 text-sm text-foreground font-base
```

## tabs.tsx

```
List:    inline-flex h-12 items-center justify-center rounded-base border-2
         border-border bg-background p-1 text-foreground
Trigger: inline-flex items-center justify-center whitespace-nowrap rounded-base
         border-2 border-transparent px-2 py-1 gap-1.5 text-sm font-heading
         transition-all data-[state=active]:bg-main
         data-[state=active]:text-main-foreground data-[state=active]:border-border
Content: mt-2
```

## alert.tsx / accordion.tsx / skeleton.tsx

```
Alert base:  relative w-full rounded-base border-2 border-border px-4 py-3 text-sm grid
             has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr]
             has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 shadow-shadow
Alert default:     bg-main text-main-foreground
Alert destructive: bg-black text-white
AlertTitle:        col-start-2 line-clamp-1 min-h-4 font-heading tracking-tight
AccordionItem:     rounded-base overflow-hidden border-2 border-b border-border shadow-shadow
AccordionTrigger:  flex flex-1 items-center justify-between text-left text-base
                   text-main-foreground border-border bg-main p-4 font-heading
                   transition-all [&[data-state=open]>svg]:rotate-180
                   data-[state=open]:rounded-b-none data-[state=open]:border-b-2
AccordionContent:  overflow-hidden rounded-b-base bg-secondary-background text-sm font-base
Skeleton:          animate-pulse rounded-base bg-secondary-background border-2 border-border
```

## Overlay + menu surfaces

```
DialogOverlay:  fixed inset-0 z-50 bg-overlay
DialogContent:  bg-background fixed top-[50%] left-[50%] z-50 grid w-full
                max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4
                rounded-base border-2 border-border p-6 shadow-shadow sm:max-w-lg
DialogTitle:    text-lg font-heading leading-none tracking-tight
SheetContent:   bg-background fixed z-50 flex flex-col gap-4 border-2 border-border
Popover:        z-50 w-72 rounded-base border-2 border-border bg-main p-4 text-foreground
Tooltip:        z-50 overflow-hidden rounded-base border-2 border-border bg-main
                px-3 py-1.5 text-sm font-base text-main-foreground
HoverCard:      z-50 w-64 rounded-base border-2 border-border bg-main p-4 font-base
                text-main-foreground
DropdownContent:z-50 min-w-[8rem] overflow-hidden rounded-base border-2 border-border
                bg-main p-1 font-base text-main-foreground
DropdownItem:   flex cursor-default select-none items-center rounded-base border-2
                border-transparent bg-main px-2 py-1.5 text-sm font-base
                outline-hidden focus:border-border gap-2
DropdownLabel:  px-2 py-1.5 text-sm font-heading
Toast (sonner): bg-background text-foreground border-border border-2 font-heading
                shadow-shadow rounded-base text-[13px] flex items-center gap-2.5 p-4
                w-[356px]
  toast action: font-base border-2 text-[12px] h-6 px-2 bg-main text-main-foreground
                border-border rounded-base shrink-0
  toast cancel: font-base border-2 text-[12px] h-6 px-2 bg-secondary-background
                text-foreground border-border rounded-base shrink-0
ImageCard:      w-[250px] overflow-hidden rounded-base border-2 border-border bg-main
                font-base shadow-shadow
InputOTP slot:  relative flex size-10 items-center justify-center border-y-2 border-r-2
                border-border bg-secondary-background text-sm font-base text-foreground
                first:rounded-l-base first:border-l-2 last:rounded-r-base
Marquee:        relative flex w-full overflow-x-hidden border-b-2 border-t-2 border-border
                bg-secondary-background text-foreground font-base
Avatar:         relative flex size-10 shrink-0 overflow-hidden rounded-full
                outline-2 outline-border
AvatarFallback: flex size-full items-center justify-center rounded-full
                bg-secondary-background text-foreground font-base
```

## Components with NO styling of their own

`collapsible`, `combobox`, `data-table`, `form`, `resizable`, `scroll-area`,
`calendar`, `carousel`, `command`, `context-menu`, `menubar`,
`navigation-menu`, `pagination`, `breadcrumb`, `sidebar`, `chart` are either
behaviour-only wrappers, compositions of the primitives above, or thin
wrappers over a third-party library (Recharts, Vaul, cmdk, Embla,
react-day-picker). Where the Sage Ink page had to invent a surface for one of
these, that is noted on the specimen.
