# State Reference

תיעוד מבנה ה-state ומלוא ה-actions של ה-reducer.

> **קובץ ראשי**: [src/state/AICommandContext.tsx](../src/state/AICommandContext.tsx) · **reducer**: [src/state/reducer.ts](../src/state/reducer.ts) · **types**: [src/state/types.ts](../src/state/types.ts)

## גישה ל-state

כל קומפוננטה שצריכה state או dispatch:
```tsx
import { useAICommand } from '../../state/AICommandContext';

function MyComp() {
  const { state, dispatch, sendUserMessage, sendAgentMessage, toast } = useAICommand();
  // ...
}
```

ה-`useAICommand()` זורק אם הקומפוננטה לא בתוך `AICommandProvider`.

## מבנה AppState

```typescript
interface AppState {
  // ── Navigation ──────────────────────────────────────
  activeTab: 'chat' | 'agents' | 'tasks' | 'timeline' | 'automation' | 'history';
  viewMode: 'compact' | 'standard' | 'expanded';
  theme: 'dark' | 'light';
  mapVisible: boolean;
  mapSplitPercent: number;      // 20..70 (clamped)

  // ── Global controls ─────────────────────────────────
  globalAutonomy: 'observe' | 'recommend' | 'autonomous';

  // ── Domain data ─────────────────────────────────────
  agents: Agent[];               // 6 mock agents
  tasks: Task[];                 // ~22 mock tasks (includes multi-agent)
  rules: AutomationRule[];       // 3 mock rules
  entities: MapEntity[];         // 6 mock entities, evolves with ADD_ENTITY
  conversations: Conversation[]; // 5 mock historical conversations
  messages: ChatMessage[];       // main chat - starts with welcome
  agentChats: Record<string, ChatMessage[]>; // per-agent threads (keyed by agentId)

  // ── Transient UI state ──────────────────────────────
  pendingAttachments: Attachment[];     // queued for next user message
  selectedAgentId: string | null;        // opens TaskDrawer
  ruleEditorOpen: boolean;
  editingRuleId: string | null;          // null = new rule
  agentSettingsId: string | null;        // opens AgentSettingsModal
  editingTaskId: string | null;          // opens TaskDetailsModal
  highlightAgentId: string | null;       // for map filtering
  mapPickerMode: null | {                // opens MapPickerModal
    purpose: 'attach_area' | 'place_entity' | 'rule_area' | 'agent_boundary' | 'task_geo';
    entityId?: string;
    agentId?: string;
    taskId?: string;
    initialPolygon?: { x: number; y: number }[];
    initialPoint?: { x: number; y: number };
  };
  pendingBoundary: { agentId: string; points: {x,y}[] } | null;   // picker → AgentSettings
  pendingTaskGeo: { taskId: string; kind: 'area'|'point'; ... } | null; // picker → TaskDetails
  toasts: ToastMessage[];
}
```

מבנים מורכבים — ראה [src/state/types.ts](../src/state/types.ts) למקור האמת.

## רשימת Actions

מסודר לפי דומיין. כל action הוא תיאורי (`ADD_TASK` ולא `addTask(...)`)—מוגדרים כ-discriminated union ב-[reducer.ts](../src/state/reducer.ts).

### Navigation & view

| Action | Payload | אפקט |
|--------|---------|------|
| `SET_TAB` | `tab` | מעבר בין 6 הטאבים |
| `SET_VIEW_MODE` | `mode` | compact/standard/expanded. expanded גם מדליק את המפה |
| `SET_THEME` | `theme` | dark/light. גם מוסיף class על `<html>` דרך useEffect ב-Layout |
| `TOGGLE_MAP_VISIBLE` | — | מחליף את הצגת המפה |
| `SET_MAP_VISIBLE` | `visible` | מאלץ ערך — שימושי לפתיחה אוטומטית מ-popover |
| `SET_MAP_SPLIT` | `percent` | קובע אחוז רוחב מפה (clamped 20-70) |
| `HIGHLIGHT_AGENT` | `agentId \| null` | מצמצם את המפה לסוכן אחד; null = כולם |

### Autonomy

| Action | Payload | אפקט |
|--------|---------|------|
| `SET_GLOBAL_AUTONOMY` | `level` | משנה את ה-autonomy הגלובלי |
| `SET_AGENT_AUTONOMY` | `agentId, level` | משנה autonomy לסוכן ספציפי |

### Agents

| Action | Payload | אפקט |
|--------|---------|------|
| `UPDATE_AGENT` | `agentId, patch` | merge חלקי. משמש בעיקר ל-`lastActivity` חי |
| `SELECT_AGENT` | `agentId \| null` | פותח/סוגר TaskDrawer |
| `OPEN_AGENT_SETTINGS` | `agentId` | פותח AgentSettingsModal |
| `CLOSE_AGENT_SETTINGS` | — | סוגר |
| `UPDATE_AGENT_CONFIG` | `agentId, config` | החלפת config שלם (deep) — נשלח רק בלחיצה על "שמור" במודאל |

### Tasks

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_TASK` | `task` | מוסיף לתחילת רשימה. גם מעדכן `agent.activeTasks++` בסוכן |
| `UPDATE_TASK` | `taskId, patch` | merge חלקי — משמש ע"י TaskDetailsModal |
| `CANCEL_TASK` | `taskId` | משנה status ל-`failed` |
| `OPEN_TASK_EDITOR` | `taskId` | פותח TaskDetailsModal |
| `CLOSE_TASK_EDITOR` | — | סוגר |

### Automation Rules

| Action | Payload | אפקט |
|--------|---------|------|
| `TOGGLE_RULE` | `ruleId` | הפעל/השבת חוק |
| `OPEN_RULE_EDITOR` | `ruleId?` | פותח RuleEditor. null = חדש, id = עריכת קיים |
| `CLOSE_RULE_EDITOR` | — | סוגר |
| `SAVE_RULE` | `rule` | upsert. אם id קיים — עדכון, אחרת הוספה |
| `DELETE_RULE` | `ruleId` | מסיר |

### Main chat messages

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_MESSAGE` | `message` | הוספה לסוף הרשימה |
| `UPDATE_MESSAGE` | `messageId, patch` | merge — משמש לעדכון pending message עם blocks חדשים (streaming) |
| `REMOVE_MESSAGE` | `messageId` | הסרה (משמש להחלפת pending placeholder ב-mock mode) |
| `CLEAR_MESSAGES` | — | איפוס שיחה (כפתור בכותרת ChatPanel) |

> **אל תקרא ישירות `ADD_MESSAGE` של תשובת AI** — השתמש ב-`sendUserMessage(text)` שמטפל בכל ה-flow (pending, await/stream, replace).

### Per-agent chat messages

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_AGENT_MESSAGE` | `agentId, message` | הוספה ל-thread של הסוכן |
| `UPDATE_AGENT_MESSAGE` | `agentId, messageId, patch` | merge — לעדכון pending עם blocks streaming |
| `REMOVE_AGENT_MESSAGE` | `agentId, messageId` | הסרה |
| `CLEAR_AGENT_MESSAGES` | `agentId` | איפוס thread של הסוכן (כפתור ב-AgentChatPanel) |

### Attachments

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_PENDING_ATTACHMENT` | `attachment` | מוסיף לשורת ההודעה הבאה |
| `REMOVE_PENDING_ATTACHMENT` | `id` | מסיר |
| `CLEAR_PENDING_ATTACHMENTS` | — | נקרא אוטומטית אחרי שליחת הודעה |

### Entities

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_ENTITY` | `entity` | הוספה למפה |
| `UPDATE_ENTITY` | `entityId, patch` | שימושי לעדכון position אחרי map picker |
| `REMOVE_ENTITY` | `entityId` | הסרה |

### Map picker (transient mailbox pattern)

| Action | Payload | אפקט |
|--------|---------|------|
| `OPEN_MAP_PICKER` | `purpose, entityId?, agentId?, taskId?, initialPolygon?, initialPoint?` | פותח MapPickerModal |
| `CLOSE_MAP_PICKER` | — | סוגר |
| `SET_PENDING_BOUNDARY` | `agentId, points` | picker→AgentSettings transient |
| `CLEAR_PENDING_BOUNDARY` | — | נקרא ב-AgentSettings useEffect אחרי merge |
| `SET_PENDING_TASK_GEO` | `taskId, kind, points?, point?` | picker→TaskDetails transient |
| `CLEAR_PENDING_TASK_GEO` | — | נקרא ב-TaskDetails useEffect אחרי merge |

### Toasts

| Action | Payload | אפקט |
|--------|---------|------|
| `ADD_TOAST` | `toast` | הוספה |
| `REMOVE_TOAST` | `id` | אוטו-dismiss אחרי 4s דרך setTimeout ב-`toast()` helper |

> **השתמש ב-`toast(text, variant)` helper** במקום dispatch ישיר. הוא יוצר id ייחודי ומגדיר auto-removal.

## Side-effect helpers ב-Context

הקובץ [AICommandContext.tsx](../src/state/AICommandContext.tsx) חושף מעבר ל-`state/dispatch` גם helpers שמכילים לוגיקה אסינכרונית:

### `sendUserMessage(text: string): Promise<void>`
Flow מלא של שליחת הודעה לצ'אט הראשי:
1. בונה user message עם pending attachments (אם יש)
2. dispatch ADD_MESSAGE (user)
3. dispatch CLEAR_PENDING_ATTACHMENTS
4. dispatch ADD_MESSAGE (assistant placeholder עם `pending: true`)
5. **אם `VITE_USE_REAL_LLM=true`**: קורא ל-`streamMainChat()` — כל block שמגיע → dispatch UPDATE_MESSAGE (push to blocks[])
6. **אחרת או אם streaming נכשל**: קורא ל-`generateAIResponse()` → dispatch REMOVE_MESSAGE (pending) + ADD_MESSAGE (real)

### `sendAgentMessage(agentId, text): Promise<void>`
זהה אבל לthread של סוכן ספציפי. משתמש ב-`streamAgentChat()` או `generateAgentResponse()`.

### `toast(text, variant?)`
יצירת toast עם id + auto-dismiss אחרי 4 שניות. ה-variant ברירת מחדל היא `'success'`.

## Ambient activity

ב-`AICommandProvider` יש `useEffect` שמרענן את `lastActivity` של סוכן active אחד (אקראי) כל 10 שניות — כדי ליצור תחושת חיים בכרטיסי הסוכנים. זה היחיד ה-side-effect הרקעי.

## דפוסי שימוש בקומפוננטות

### קריאה ל-state בלבד
```tsx
const { state } = useAICommand();
const activeAgents = state.agents.filter((a) => a.status === 'active');
```

### dispatch action פשוט
```tsx
const { dispatch } = useAICommand();
<Button onClick={() => dispatch({ type: 'SET_TAB', tab: 'agents' })}>
  עבור לסוכנים
</Button>
```

### עבודה עם draft state מקומי (מודאלי עריכה)
המודאלים הגדולים (RuleEditor, AgentSettingsModal, TaskDetailsModal) מחזיקים draft `useState` מ-deep clone של ה-state, מאפשרים עריכה מקומית, ושולחים `SAVE_RULE` / `UPDATE_AGENT_CONFIG` / `UPDATE_TASK` רק בלחיצה על "שמור". זה מאפשר ביטול בלי side effects.

```tsx
const [draft, setDraft] = useState<AgentConfig | null>(null);

useEffect(() => {
  if (agent?.config) setDraft(JSON.parse(JSON.stringify(agent.config)));
}, [agent?.id]);

// בלחיצה על שמור:
dispatch({ type: 'UPDATE_AGENT_CONFIG', agentId, config: draft });
```

### Cross-modal transient mailbox
שני modals מקוננים לא יכולים להחליף props ישירות. הדפוס:
```tsx
// Modal A (settings) — opens picker
const openPicker = () => dispatch({
  type: 'OPEN_MAP_PICKER',
  purpose: 'agent_boundary',
  agentId: agent.id,
  initialPolygon: draft.boundary?.area,
});

// Modal B (picker) — on finish
dispatch({ type: 'SET_PENDING_BOUNDARY', agentId, points });
dispatch({ type: 'CLOSE_MAP_PICKER' });

// Modal A — useEffect listens
useEffect(() => {
  if (state.pendingBoundary?.agentId !== agent.id) return;
  setDraft((d) => ({ ...d, boundary: { ...d.boundary, area: state.pendingBoundary.points } }));
  setDirty(true);
  dispatch({ type: 'CLEAR_PENDING_BOUNDARY' });
}, [state.pendingBoundary]);
```

## הוספת action חדש (recipe)

נניח שצריך `MARK_TASK_COMPLETE`:

1. הוסף ל-`Action` union ב-[reducer.ts](../src/state/reducer.ts):
   ```ts
   | { type: 'MARK_TASK_COMPLETE'; taskId: string }
   ```
2. הוסף case ב-`reducer`:
   ```ts
   case 'MARK_TASK_COMPLETE':
     return {
       ...state,
       tasks: state.tasks.map((t) =>
         t.id === action.taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString(), progress: 100 } : t,
       ),
     };
   ```
3. השתמש בקומפוננטה:
   ```ts
   dispatch({ type: 'MARK_TASK_COMPLETE', taskId: t.id });
   ```

TypeScript ייאלץ עליך לטפל בכל case אם תוסיף switch חדש על Action.

## רלוונטי ל-Real LLM mode

ב-real mode, ה-`sendUserMessage` שולח snapshot של ה-state (agents, tasks, rules, entities, autonomy) ל-backend בכל קריאה. ה-backend stateless — הוא לא שומר היסטוריה. המשמעות:

- כל ה-state חי ב-frontend
- בריענון דף — הכל נמחק (אין persistence)
- ה-LLM "רואה" רק את ה-snapshot הנוכחי + ה-prompt — אין lookback ל-history של השיחה (כן יכול להיות בעתיד)
- snapshot מצומצם ב-`compactAgent` / `compactTask` ב-[llmClient.ts](../src/services/llmClient.ts) כדי לחסוך tokens
