# Lumantic product glossary

Canonical terms for product UI, help copy, and agent-authored text. Prefer these names over synonyms. Expand this file when a new concept needs a stable label.

## Voice

| Prefer | Avoid in product UI |
| --- | --- |
| **Lumantic** | the AI, the bot, the assistant, Lumantic AI, our AI |
| **you / your team** | users (when addressing the reader) |

In the app, speak of Lumantic as the product that learns, proposes, answers, and queries data. Marketing may still use phrases like "AI-native" for category positioning; that is not a license to call the in-product agent "the AI."

## Core concepts

### Lumantic
The product. When copy describes who learned a fact, answered a question, proposed a memory, or queried a source, say **Lumantic**, not "the AI."

### Memory
A confirmed fact, definition, or gotcha about the business that Lumantic (and the team) can treat as ground truth. Stored after a human adds it or **approves** a proposed memory.

### Proposed memory
A candidate memory Lumantic surfaced from chats or connected data. The team can **approve** (optionally after editing), or **deny** (discard). Until approved, it is not ground truth.

### Chat
A conversation with Lumantic. Messages may come from the app or from Slack.

### Personal chat
A chat visible only to the signed-in person.

### Global chat
A chat (often resolved) shared with the whole workspace so the team can see what was asked and answered.

### Scope
Whether a chat is **personal** or **global**.

### Source
A connected data system (for example Mixpanel, Datadog, GitLab) that Lumantic can use when answering questions, if enabled in settings.

### Integration
The connection between Lumantic and an external product (Slack, analytics, observability, and so on).

## Actions

| Term | Meaning |
| --- | --- |
| **Approve** | Save a proposed memory as a confirmed memory (after optional edit). |
| **Deny** | Discard a proposed memory without saving it. |
| **Edit** | Change the text of a memory or proposed memory before or while saving. |
| **Learn / learned** | Attribution for memories Lumantic inferred (UI: "Learned by Lumantic"). |

## Surfaces (nav labels)

| Label | What it is |
| --- | --- |
| **Chat** | Ask and review conversations with Lumantic. |
| **Memories** | Confirmed memories, plus a tab for proposed ones. |
| **Proposed** (tab) | Review queue for proposed memories. |
| **Team** | Workspace members and roles. |
| **Settings** | Workspace preferences and integrations (admins). |
| **Preferences** (Settings tab) | Profile, display currency, time format, timezone. |
| **Notifications** (Settings tab) | Emails for proposed memories, digests, invites, billing. |
| **Integrations** (Settings tab) | Slack, GitHub, Datadog, warehouses, and catalog connectors. |
| **Workspace** (Settings tab) | Rename company, invite email domains, delete workspace (admins). |
| **Billing** | Plan and payment. |
| **Support** | Help and FAQs. |

## Keyboard navigation

Outside text fields, press **G** then a letter (within about a second):

| Keys | Destination |
| --- | --- |
| G then P | Personal chats |
| G then G | Global chats |
| G then M | Memories |
| G then R | Proposed memories |
| G then T | Team |
| G then B | Billing |
| G then U | Support |
| G then S | Settings (admins) |

## Attribution patterns

- Memories inferred by the product: **Learned by Lumantic** (not "Learned by the AI").
- Empty / intro copy: "New things **Lumantic** picked up…" / "Ask **Lumantic** anything."
- Settings: "Let **Lumantic** query this source…"

## Adding terms

When you introduce a user-facing concept:

1. Add a short definition here.
2. Use the same casing and wording in UI strings.
3. Do not invent parallel names (for example "insight" vs "memory") without updating this glossary.
