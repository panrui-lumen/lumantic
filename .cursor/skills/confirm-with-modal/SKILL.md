---
name: confirm-with-modal
description: >-
  Never use window.confirm, alert, or prompt. Use ConfirmModal (or Modal) for
  confirmation steps. Use when adding delete/remove/revoke/destructive actions,
  confirm dialogs, or any yes/no step in the Lumantic UI.
---

# Never use confirm(); always use a modal

## Rule

**Never use the confirm() always use a modal to confirm steps.**

Also never use `alert()` or `prompt()`. Native browser dialogs break the dark
product chrome and feel out of place.

## Use this

Import `ConfirmModal` from `src/react-app/components/ConfirmModal.tsx`:

```tsx
const [pendingRemove, setPendingRemove] = useState<Member | null>(null);

// trigger
onClick={() => setPendingRemove(member)}

{pendingRemove && (
  <ConfirmModal
    title="Remove member?"
    description={`Remove ${pendingRemove.name} from ${workspaceName}?`}
    confirmLabel="Remove"
    tone="danger"
    busy={removing}
    onClose={() => setPendingRemove(null)}
    onConfirm={async () => {
      await remove(pendingRemove);
      setPendingRemove(null);
    }}
  />
)}
```

For richer flows (type-to-confirm delete), use `Modal` from `pages/app/ui.tsx`
with custom body content.

## Do not

- `window.confirm(...)`
- `confirm(...)`
- `window.alert(...)` / `alert(...)`
- `window.prompt(...)` / `prompt(...)`

## When editing existing UI

If you find a native dialog, replace it with `ConfirmModal` in the same change.
