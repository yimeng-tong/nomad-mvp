# Nomad shared UI

Story9.3 implementation record. Approval and behavior authority remain
`docs/architecture/ui-foundation.md` and UX-DR37 in `docs/front-end-spec.md`.

## Source and upgrades

`upstream/story-9-3/provenance.json` records shadcn CLI4.21.0, the explicit Base UI
source family, exact package metadata/integrity, and eight reviewed registry responses.
The CLI was inspected in an isolated temporary project. Components use controlled
source copying, so no generator init/apply modifies the application or theme.
Each original response is retained with its byte hash and MIT notice. Nomad owns
the adapted files and API; future upgrades must compare those sources one at a time.
The source family's “Base Nova” name does not select a new visual theme.

Runtime uses Base UI1.8.0. Tailwind and its Vite plugin are both4.3.3. React19.2.7,
Vite8.0.16, Node22.22.1, pnpm11.7.0 and existing native/test packages stay pinned.
No class/icon/animation package is needed for the selected implementation; upstream
`cn`, CVA, icon placeholders and unused label/separator wrappers are removed.

## Styles and contrast

Both product and Storybook load the same Tailwind Vite plugin. The CSS entry imports
theme and utilities, with explicit layers and source directories. It omits Preflight.
Legacy rules remain unlayered and unchanged. New component selectors are scoped to
Nomad classes; their visual properties have sufficient specificity against affected
legacy rules. Utilities supply non-conflicting structure. No global important mode.

Tokens follow the approved existing colors. `border` remains decorative; a field's
required boundary uses `textMuted` through `controlBorder`. Green small text on
`accentSurface` measures4.479:1 and is not used: selected controls keep dark text.
White text on solid accent and all intended opaque pairs are recorded in the
Story9.3 `token-contrast.json`. This does not prove rendered alpha/disabled states.

Shared text is in rem. Spacing follows the4px scale, ordinary corners stay6/8px,
standard motion160ms and Sheet260ms. The following historical contours are scoped
exceptions, not generic card radii:

| Existing surface | Radius | Owner / later exit condition |
| --- | --- | --- |
| Home Dock outer surface | 22px top corners | Story1.6/1.7; retain approved dock contour |
| Dock controls | 12px | Story1.6; migrate only when that consumer is validated |
| Composer / import surfaces | 14px where present | Story1.6; retain approved input grouping |
| Legacy Home/Settings bottom Sheet | existing contour | Story9.3 AppSheet/AppDialog migration, with browser and native evidence |
| Planner, DayPlan, SlotEditSheet | existing scoped styles | Stories2.3–2.15/3.1–3.5; use shared components at their authorized migration,3.1 remains paused |
| OperatorAccess native confirm / existing controls | existing scoped behavior | Stories1.0/1.11/8.x; current9.3 only migrates the Settings logout confirmation |
| Legacy Settings BYOK/account/feedback areas | existing scoped styles | Stories7.3–7.6; no whole-screen redesign in9.3 |

Adapters can be reverted through Git independently of the original controllers.
Rollback never clears user data, input journals, cursors or receipts.

## Current modal and host ownership

`PrivateUiBoundary` preserves the page tree across same-owner checking, and places
its portal host in a sibling of `.nomad-page`, within the same auth-hidden DOM.
The page sibling is inert/aria-hidden while any modal remains present. Base UI1.8
intentionally exempts outside aria-live nodes when masking; without this sibling
boundary Home Dock announcements would remain exposed under a modal.

Base UI alone owns focus trapping, body scroll lock and native DOM listeners.
Nomad owns the existing host-back registration (100 plus one allowed nested level,
below auth1000 and above legacy20), authority capture and business close decision.
The exact Base UI1.8 scroll lock releases on open=false, so visible exit presence
keeps its controlled Root open until both popup/backdrop animations finish. The
closing popup is inert; the page and Dock remain covered until unmount. Unknown
identity removes the Root immediately and cancels decisions. Deferred focus checks
current authority, visibility and connection again before using a trigger or title.

Web visualViewport owns only Web keyboard/visible-viewport adjustment. Native
KeyboardResize.Native owns WebView resizing; it does not add another keyboard
height. The popup consumes its safe-area edges through existing CSS variables;
html/root add no safe-area padding. Config/build/jsdom/host-driver tests do not
prove a real soft keyboard, screen reader or minimum OS device.

`useUiToast` is only for noncritical messages. Capture its returned function before
an async operation; captures expire when the consuming component, owner/session,
activity or boundary expires. Messages deduplicate per activity, remain in the
private portal, and never start or acknowledge business work. Inline errors,
unknown writes and recovery actions stay in their original interface.

## Consumer API

Business screens import from `src/ui`. App already owns `PrivateUiBoundary`; a
private dialog outside that boundary renders nothing. Do not add another body
portal, focus trap, scroll lock or native back listener around these components.
Capture the actual trigger in its click handler, before a busy state disables it.

```tsx
<Button onClick={(event) => {
  trigger.current = event.currentTarget;
  setOpen(true);
}}>查看</Button>
<AppSheet open={open} title="当前内容" restoreFocusTo={trigger.current}
  onOpenChange={() => setOpen(false)}
  onCloseComplete={clearTemporarySelection}>
  <FormField label="备注" description="保留输入，确认后再提交">
    {(field) => <Input {...field} value={draft} onValueChange={setDraft} />}
  </FormField>
  <ModalClose>关闭</ModalClose>
</AppSheet>
```

Keep the controlled AppSheet mounted during exit; keep business drafts above it.
`onOpenChange(false)` means the close decision was accepted. `onCloseComplete` is
for temporary UI cleanup, not saving, retrying or creating an operation. If an
accepted close was safely interrupted by identity checking, cleanup resumes only
after that same identity is verified. Pending decisions receive an AbortSignal;
the gate also releases a canceled wait when caller code fails to honor it.

`Button` defaults to type=button; use submit explicitly. `Input`/`Textarea` retain
DOM props/ref and contain composing Enter. `FormField` supplies stable label,
description/error links without deciding server validity. Tabs selection stays a
read/navigation presentation choice. `AsyncState` requires an observed state and
honest copy; unknown writes and recovery actions stay inline. Do not use a Toast
promise helper to invent success or move critical errors away from their action.
