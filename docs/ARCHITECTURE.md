# Architecture

תיעוד הארכיטקטורה של מרכז פיקוד ה-AI. למיקוד ב-**מפתחים** שצריכים להבין מבנה לפני שינוי או הוספה.

## מטרת המוצר

הצגת תפיסת UX מובנית להפעלת מערכת AI במערכת שו"ב צבאית. האפליקציה רצה בשני מצבים: **mock** (ברירת מחדל, ללא תלות חיצונית) או **real LLM** (backend Node שמתווך לכל endpoint תואם OpenAI). שני המצבים מייצרים את אותו `MessageBlock` discriminated union — ה-UI לא יודע מאיפה הבלוקים באים.

שש משימות-על שהאפליקציה תומכת בהן:
1. **תקשורת עם AI** (chat) שמחזיר תוצרים עשירים (7 סוגי בלוקים).
2. **תצפית וניהול סוכנים** — סטטוס, אזורי פעילות, settings מלאים, שיחה ישירה.
3. **מעקב משימות** מפורט, ציר זמן Gantt, ועריכת משימה.
4. **הגדרת אוטומציה** — מובנה או שפה חופשית, עם ניתוח לוגיקה.
5. **תמונת מצב מבצעית** על מפה — ישויות, אזורי סוכנים קליקביליים, picker.
6. **תקצירי תקופה** מובנים כתשובת AI.

## מבט-על: רכיבי-על

```
┌─────────────────────────────────────────────────────────────────┐
│                       AICommandCenter                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       Header                             │    │
│  │   logo · status · view-modes · autonomy · theme · user  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌────────┬─────────────────────┬──┬──────────────────────┐    │
│  │        │                     │  │                       │    │
│  │ Side-  │    ActivePanel      │R │   Map Panel           │    │
│  │ bar    │                     │e │   (optional)          │    │
│  │ 6 tabs │ chat | agents |     │s │                       │    │
│  │        │ tasks | timeline |  │i │   MockMap             │    │
│  │        │ rules | history     │z │   + Legend            │    │
│  │        │                     │e │                       │    │
│  └────────┴─────────────────────┴──┴──────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      StatusBar                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Portals (z-index >= 30):                                       │
│   - TaskDrawer (side drawer, 520px)                              │
│   - AgentSettingsModal (xl modal, 6 tabs)                        │
│   - TaskDetailsModal (xl modal, sidebar + form)                  │
│   - MapPickerModal (lg modal, drawing canvas)                    │
│   - RuleEditor (lg modal, structured + NL modes)                 │
│   - Toasts (bottom-end)                                          │
└─────────────────────────────────────────────────────────────────┘
```

קובץ: [src/components/ai-command/AICommandCenter.tsx](../src/components/ai-command/AICommandCenter.tsx)

## עץ ה-Tabs (ActivePanel)

```
ActivePanel switches by state.activeTab:
├── 'chat'        → ChatPanel
│                    ├── header (with "תקציר" dropdown — 5 ranges)
│                    ├── MessageList
│                    │   └── Message (per role)
│                    │        └── one of 7 renderers per block
│                    │            ├── TextBlock
│                    │            ├── TableBlock          (overflow-x for narrow)
│                    │            ├── ActionCard          (severity coloring + actions)
│                    │            ├── EntitySuggestion    (inline mini-map + approve/edit)
│                    │            ├── QuickActions        (chips that re-prompt)
│                    │            ├── PlanProposal        (coord + sub-agents + steps + geo)
│                    │            └── Summary             (KPIs + events + activity)
│                    └── ChatInput (+ AttachmentBar)
│
├── 'agents'      → AgentsPanel  (container-aware grid 1/2/3 cols)
│                    └── AgentCard × N
│                         ├── stats grid
│                         ├── zones chips (clickable → highlight on map)
│                         └── actions: open-tasks · map · settings
│
├── 'tasks'       → TasksPanel
│                    ├── KPI strip (5 status buckets, filterable)
│                    ├── filter chips + agent dropdown + search
│                    └── grouped TaskRow list  (clickable → TaskDetailsModal)
│
├── 'timeline'    → TimelinePanel
│                    ├── header with zoom levels + time navigation
│                    ├── lane label column (1 lane per agent)
│                    └── lanes
│                        ├── tick header + lane grid
│                        ├── "now" vertical line
│                        ├── primary task bars       (clickable → TaskDetailsModal)
│                        └── sub-agent indicator bars (dashed, clickable to same task)
│
├── 'automation'  → AutomationPanel
│                    ├── "לוגיקת אוטומציה כוללת" panel (KPIs, agent load, per-rule reasoning, conflicts)
│                    └── RuleCard × N  (toggle + edit + delete; shows NL quote if present)
│                         RuleEditor modal (structured ⟷ natural-language toggle)
│
└── 'history'     → HistoryPanel
                     └── conversation row × N
```

## Data Flow

### Mock mode (default)
זרימה סינכרונית במחזור אחד:

```
┌──────────────┐    dispatch(action)    ┌──────────────┐
│   Component  │ ────────────────────→  │   reducer    │
└──────────────┘                        └──────┬───────┘
       ▲                                        │
       │   new state (immutable)                ▼
       │                                ┌──────────────┐
       └────────────────────────────────┤ new state    │
                                        └──────────────┘
                                                │
                                                ▼
                                        Provider re-renders
                                        useAICommand() callers
```

### Real LLM mode
זרימה עם streaming דרך backend:

```
ChatInput.send()
  → sendUserMessage(text)            [AICommandContext]
    1. dispatch ADD_MESSAGE (user)
    2. dispatch ADD_MESSAGE (assistant placeholder pending:true)
    3. isRealLLMEnabled() === true?
       └─ YES: streamMainChat({...snapshot}, callbacks)
                  └─ POST /api/chat (SSE)         [Backend]
                       └─ LLM.chat.completions.create({stream, tools, tool_choice:'required'})
                            └─ each tool_call complete →
                                 sseEvent('block', {block})  [streamHandler.ts]
                  └─ onBlock(block) →
                       dispatch UPDATE_MESSAGE (push block into pending msg)
                  └─ onDone → dispatch UPDATE_MESSAGE (pending:false)
       └─ NO / error: fallback to mock generateAIResponse()
```

נקודות מפתח:
- ה-backend stateless — ה-frontend שולח snapshot של state בכל בקשה
- ה-LLM מחויב לפלוט רק tool calls (`tool_choice='required'`) — אין סיכון לטקסט חופשי לא-strucured
- כל tool call נהיה block אטומי שמשודר ב-SSE
- ה-frontend מצרף blocks ל-message תוך כדי, ה-UI מתעדכן בהדרגה
- שגיאה → fallback אוטומטי ל-mock + toast

## Backend (`server/`)

```
server/src/
├── index.ts            # Express boot, CORS, health, route mounting
├── types.ts            # Mirror of MessageBlock + context shapes
├── routes/
│   ├── chat.ts         # POST /api/chat       (main)
│   └── agentChat.ts    # POST /api/agent-chat (per-agent)
└── llm/
    ├── client.ts       # OpenAI SDK instance + config (baseURL, model, temp)
    ├── tools.ts        # 7 JSON-schema tool definitions + toolCallToBlock mapper
    ├── systemPrompts.ts # mainSystemPrompt(ctx) + agentSystemPrompt(ctx)
    └── streamHandler.ts # SSE writer + tool_call accumulator
```

**הסיבה ל-OpenAI SDK**: זה ה-client הסטנדרטי לכל endpoint תואם, כולל OpenRouter, Ollama, vLLM, LM-Studio. רק `baseURL` משתנה.

**הסיבה ל-tool_choice='required'**: מודלים קטנים נוטים לפלוט טקסט חופשי כשמותר. הכפיה גורמת להם להשתמש רק ב-tools — ובכך מבטיחה שהפלט תמיד יהיה במבנה הצפוי. ה-system prompt מסביר במפורש שאסור לפלוט טקסט חוץ ל-tools.

**הסיבה לשכפול types**: backend עצמאי, בלי import cross-project. אם MessageBlock משתנה — לעדכן ב-2 מקומות (יש הערה ב-`server/src/types.ts`).

**Streaming format (SSE)**:
```
event: pending                    # response started, frontend can show loader
data: {}

event: block                      # one MessageBlock complete and ready
data: {"block":{"kind":"text","text":"..."}}

event: block                      # another block
data: {"block":{"kind":"quick_actions","actions":[...]}}

event: done                       # stream complete
data: {}
```

**Fallback chain** ב-frontend ([AICommandContext.tsx](../src/state/AICommandContext.tsx)):
1. אם `VITE_USE_REAL_LLM=false` → ישר ל-mock
2. אם true → נסה backend
3. אם backend החזיר שגיאה / לא נגיש → toast + mock

## State (תקציר)

מבנה מלא: [docs/STATE.md](STATE.md). כאן רק העיקרון:

```typescript
interface AppState {
  // ניווט + תצוגה
  activeTab, viewMode, theme, mapVisible, mapSplitPercent
  // נתוני עולם
  agents, tasks, rules, entities, conversations, messages
  // chat per-agent
  agentChats: Record<agentId, ChatMessage[]>
  // אינטראקציה זמנית
  pendingAttachments, selectedAgentId, ruleEditorOpen, editingRuleId,
  mapPickerMode, highlightAgentId, agentSettingsId, editingTaskId,
  pendingBoundary, pendingTaskGeo, toasts
  // global controls
  globalAutonomy
}
```

עיקרון: **state יחיד גלובלי** דרך Context. אין state פנימי בקומפוננטות חוץ מ-UI ephemeral (input typing, hover, popovers שלא משפיעים על אחרים) ו-drafts במודאלים גדולים (TaskDetailsModal, AgentSettingsModal, RuleEditor).

## Map (MockMap)

המפה היא קומפוננטה SVG מבוססת viewBox 0..100. כל הקואורדינטות (entities, geo, polygon picker) באחוזים. זה מאפשר:
- אין תלות בגודל container — נמתח אוטומטית
- ניתן להחליף את ה-SVG ב-Leaflet/Mapbox רק עם מתרגם קואורדינטות, בלי לגעת ב-types

שכבות SVG (מסדר תחתון לעליון):
```
1. base rect              (var(--map-bg))
2. grid + gridMajor       (patterns, theme-aware)
3. terrain (water, ridge)
4. compass + sector labels
5. polygon picker preview  (אם pickerMode)
6. selectedPoint           (אם pickerMode='point')
7. preview geo             (אם previewGeo - לפני שיש task)
8. agent zones             (אם showAgentZones) ← clickable → AgentMapPopover
9. entities                (תמיד מוצגות) ← hoverable
10. vignette overlay
```

מעל ה-SVG, ב-overlay ב-DOM:
- scanline (animation)
- compass/coordinates badges
- zoom controls
- hovered entity tooltip
- **AgentMapPopover** (נפתח בלחיצה על zone, smart-placement)
- רמז "💡 לחץ על אזור פעילות..."

## Cross-modal data flow (transient state pattern)

מספר fluxes דורשים העברת מידע ממודאל אחד לאחר — לדוגמה מ-AgentSettingsModal → MapPickerModal → בחזרה. הדפוס:

```
AgentSettings (draft state)        MapPickerModal (overlay)        AgentSettings (useEffect)
─────────────────────────         ──────────────────────         ──────────────────────────
1. dispatch OPEN_MAP_PICKER  ──→  receives picker mode
   {purpose:'agent_boundary',
    agentId, initialPolygon}      2. user draws polygon
                                  3. dispatch SET_PENDING_BOUNDARY
                                     + dispatch CLOSE_MAP_PICKER
                                                                   4. useEffect detects pending
                                                                      → merge into draft
                                                                      → dispatch CLEAR_PENDING_BOUNDARY
                                                                      → mark draft dirty
```

אותו דפוס בדיוק נמצא ב-TaskDetailsModal עם `pendingTaskGeo`. הסיבה — שני modals מקוננים לא יכולים להחליף props ישירות, אז ה-state הגלובלי משמש כ-mailbox קצר-מועד.

## Themes — דרך CSS Variables

כל הצבעים מוגדרים פעמיים ב-[index.css](../src/index.css):
- `:root` — dark (terminal טקטי כהה)
- `.theme-light` — light (command desk בהיר)

ב-[tailwind.config.js](../tailwind.config.js) הטוקנים מצביעים ל-vars:
```js
bg: { DEFAULT: 'rgb(var(--bg) / <alpha-value>)' }
```

החלפת theme = הוספת/הסרת `theme-light` ב-`document.documentElement` ב-Layout. SVG-ים משתמשים ב-`style={{ fill: 'var(--map-bg)' }}` כי SVG attributes לא תומכים ב-CSS vars.

## Responsive layout

3 שכבות:
1. **`viewMode`** — compact (640px max) / standard / expanded (forces map open)
2. **Map splitter** — `ResizeHandle` עם RTL-aware drag math; שומר אחוז ב-`state.mapSplitPercent`
3. **container queries** — [useContainerWidth.ts](../src/components/ai-command/useContainerWidth.ts) hook עם ResizeObserver, משמש ב-AgentsPanel לבחירה דינמית של 1/2/3 עמודות לפי רוחב הפאנל (לא viewport)

## עקרונות עיצוב טכניים

1. **קומפוננטות פונקציונליות + hooks בלבד**.
2. **TypeScript strict**. מודלים מוגדרים פעם אחת ב-`state/types.ts`, מיובאים בכל מקום.
3. **אין side effects בקומפוננטות** מלבד `useEffect` מצומצמים (theme class, scroll on new message, ambient activity, pending* listeners).
4. **Reducer pure** — actions תיאוריות (`ADD_TASK` ולא `addTask({id})`).
5. **Composition over props drilling** — קומפוננטות שצריכות state מקבלות אותו דרך `useAICommand()` במקום props מהרשו.
6. **MessageBlock contract הוא הגבול** — ה-UI לא יודע אם הבלוק הגיע מ-mock או מ-LLM אמיתי.
7. **No premature abstraction** — Button/Card/Badge פשוטים; אין theme system גנרי, יש 2 themes ספציפיים.

## הוספת תכונה חדשה (recipe)

נניח שרוצים להוסיף פאנל חדש "התרעות":

1. **Type**: הוסף `'alerts'` ל-`PanelTab` ב-[state/types.ts](../src/state/types.ts).
2. **State**: אם נדרש state נוסף — הוסף ל-`AppState`, ערך התחלתי ב-`AICommandContext.tsx`.
3. **Actions**: אם יש interactions שמשנות state — הוסף ב-[state/reducer.ts](../src/state/reducer.ts).
4. **Mock data**: צור `mock/alerts.ts` אם נדרש.
5. **Component**: צור `components/ai-command/alerts/AlertsPanel.tsx`.
6. **Sidebar**: הוסף פריט ב-[layout/Sidebar.tsx](../src/components/ai-command/layout/Sidebar.tsx) `items`.
7. **Router**: הוסף בלוק ב-`ActivePanel` ב-[AICommandCenter.tsx](../src/components/ai-command/AICommandCenter.tsx).

הסתמך תמיד על `useAICommand()` ל-state ו-`Card/Button/Badge/...` מ-`ui/` לעיצוב עקבי.

## הוספת MessageBlock variant חדש (recipe)

1. **Type**: הוסף interface ב-[state/types.ts](../src/state/types.ts) והוסף ל-union `MessageBlock`.
2. **Renderer**: צור `components/ai-command/chat/MessageRenderers/MyBlock.tsx`.
3. **Switch**: הוסף `if (block.kind === '...') return <MyBlockRenderer ... />` ב-[Message.tsx](../src/components/ai-command/chat/Message.tsx).
4. **Mock**: עדכן [mock/aiResponder.ts](../src/mock/aiResponder.ts) לפלוט את הסוג החדש בתנאים מסוימים.
5. **LLM Tool** (אם רוצים תמיכה ב-real mode):
   - הוסף tool schema ב-[server/src/llm/tools.ts](../server/src/llm/tools.ts)
   - הוסף שכפול ב-[server/src/types.ts](../server/src/types.ts)
   - עדכן את ה-system prompt ב-[server/src/llm/systemPrompts.ts](../server/src/llm/systemPrompts.ts) להסביר מתי להשתמש
