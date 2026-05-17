# Architecture

תיעוד הארכיטקטורה של מרכז פיקוד ה-AI. למיקוד ב-**מפתחים** שצריכים להבין מבנה לפני שינוי או הוספה.

## מטרת המוצר

הצגת תפיסת UX מובנית להפעלת מערכת AI במערכת שו"ב צבאית. ה-AI אינו חלק מהקוד — האפליקציה מציגה את **הממשק** וכל ההתנהגות שלו, על נתוני דמה.

חמש משימות-על שהאפליקציה תומכת בהן:
1. **תקשורת עם AI** (chat) שמחזיר תוצרים עשירים (טבלאות, כרטיסי פעולה, הצעות ישויות, הצעות תוכנית).
2. **תצפית וניהול סוכנים** — סטטוס, אזורי פעילות, הגדרות.
3. **מעקב משימות** ברמת פירוט עמוקה + ציר זמן Gantt.
4. **הגדרת אוטומציה** (טריגרים → פעולות).
5. **תמונת מצב מבצעית** על מפה — ישויות, אזורי סוכנים, popovers, picker.

## מבט-על: רכיבי-על

```
┌─────────────────────────────────────────────────────────────────┐
│                       AICommandCenter                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                       Header                             │    │
│  │   logo · status · view-modes · autonomy · theme · user  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌────────┬──────────────────────────────┬──────────────────┐  │
│  │        │                              │                  │  │
│  │ Side-  │       ActivePanel            │   Map Panel      │  │
│  │ bar    │                              │   (optional)     │  │
│  │ 6 tabs │   chat | agents | tasks |    │                  │  │
│  │        │   timeline | rules | hist    │   MockMap        │  │
│  │        │                              │   + Legend       │  │
│  └────────┴──────────────────────────────┴──────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      StatusBar                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Portals (z-index >= 30):                                       │
│   - TaskDrawer (drawer side)                                     │
│   - AgentSettingsModal (xl modal)                                │
│   - MapPickerModal (lg modal)                                    │
│   - RuleEditor (lg modal, child of AutomationPanel)              │
│   - Toasts (bottom-end)                                          │
└─────────────────────────────────────────────────────────────────┘
```

קובץ: [src/components/ai-command/AICommandCenter.tsx](../src/components/ai-command/AICommandCenter.tsx)

## עץ ה-Tabs (ActivePanel)

```
ActivePanel switches by state.activeTab:
├── 'chat'        → ChatPanel
│                    ├── MessageList
│                    │   └── Message (per role)
│                    │        └── one of 6 renderers per block
│                    │            ├── TextBlock
│                    │            ├── TableBlock
│                    │            ├── ActionCard
│                    │            ├── EntitySuggestion (mini-map)
│                    │            ├── QuickActions
│                    │            └── PlanProposal (mini-map + steps + approve)
│                    └── ChatInput (+ AttachmentBar)
│
├── 'agents'      → AgentsPanel
│                    └── AgentCard × N
│                         ├── stats grid
│                         ├── zones chips (geo summary)
│                         └── actions: open-tasks · map · settings
│
├── 'tasks'       → TasksPanel
│                    ├── KPI strip (5 status buckets)
│                    ├── filter chips + agent dropdown + search
│                    └── grouped TaskRow list
│
├── 'timeline'    → TimelinePanel
│                    ├── header with zoom levels + time navigation
│                    ├── lane label column (1 lane per agent)
│                    ├── tick header + lane bars (Gantt)
│                    │   └── "now" vertical line
│                    └── legend + hover detail
│
├── 'automation'  → AutomationPanel
│                    └── RuleCard × N
│                         (RuleEditor modal as child)
│
└── 'history'     → HistoryPanel
                     └── conversation row × N (clickable)
```

## Data Flow

הזרימה מתחילה תמיד מהמשתמש או מ-timer פנימי, עוברת דרך actions ל-reducer, ומתעדכנת ברנדור הבא.

```
┌──────────────┐    dispatch(action)    ┌──────────────┐
│   Component  │ ────────────────────→  │   reducer    │
│  (any tab)   │                        │              │
└──────────────┘                        └──────┬───────┘
       ▲                                        │
       │                                        ▼
       │                                ┌──────────────┐
       │      new state (immutable)     │  new state   │
       └────────────────────────────────┤              │
                                        └──────────────┘
                                                │
                                                ▼
                                        Provider re-renders
                                        useAICommand() callers
```

### Async path: שליחת הודעה לצ'אט

ב-[AICommandContext.tsx](../src/state/AICommandContext.tsx), `sendUserMessage`:
```
user types → ChatInput.send()
  → sendUserMessage(text)
    1. dispatch ADD_MESSAGE (user)
    2. dispatch CLEAR_PENDING_ATTACHMENTS
    3. dispatch ADD_MESSAGE (assistant, pending=true)
    4. await generateAIResponse(...)            // mock/aiResponder.ts
    5. dispatch REMOVE_MESSAGE (pending)
    6. dispatch ADD_MESSAGE (assistant, blocks)
```

`generateAIResponse` בודק keywords ב-prompt ומחזיר אחד מ-6 סוגי הודעות (table/action_card/entity_suggestion/quick_actions/plan_proposal/text).

### Async path: אישור תוכנית

```
PlanProposal "אשר והפעל"
  → approve()
    1. build Task object from current draft (steps, agentId, scheduledFor, geo)
    2. dispatch ADD_TASK
        → reducer גם מעדכן agent.activeTasks++
    3. setStatus('approved')
    4. toast success
```

המשימה החדשה מופיעה אוטומטית ב-TasksPanel, TimelinePanel, AgentCard (zones chips), ו-MockMap (אם יש לה geo).

## State (תקציר)

מבנה מלא: [docs/STATE.md](STATE.md). כאן רק העיקרון:

```typescript
interface AppState {
  // ניווט + תצוגה
  activeTab, viewMode, theme, mapVisible
  // נתוני עולם
  agents, tasks, rules, entities, conversations, messages
  // אינטראקציה זמנית
  pendingAttachments, selectedAgentId, ruleEditorOpen, editingRuleId,
  mapPickerMode, highlightAgentId, agentSettingsId, toasts
  // global controls
  globalAutonomy
}
```

עיקרון: **state יחיד גלובלי** דרך Context. אין state פנימי בקומפוננטות חוץ מ-UI ephemeral (input typing, hover, popovers שלא משפיעים על אחרים).

## Map (MockMap)

המפה היא קומפוננטה SVG מבוססת viewBox 0..100. כל הקואורדינטות (entities, geo, polygon picker) באחוזים. זה מאפשר:
- אין תלות בגודל container — נמתח אוטומטית.
- ניתן להחליף את ה-SVG ב-Leaflet/Mapbox רק עם מתרגם קואורדינטות, בלי לגעת ב-types.

שכבות SVG (מסדר תחתון לעליון):
```
1. base rect            (var(--map-bg))
2. grid + gridMajor     (patterns)
3. terrain (water, ridge)
4. compass + sector labels
5. polygon picker preview (אם pickerMode)
6. selectedPoint        (אם פותחים point picker)
7. agent zones          (אם showAgentZones=true) ← קליקבילי
8. preview geo          (אם previewGeo - לתוכנית מוצעת)
9. entities             (תמיד מוצגות) ← hoverable
10. vignette overlay
```

מעל ה-SVG, ב-overlay ב-DOM:
- scanline (animation)
- compass/coordinates badges
- zoom controls
- hovered entity tooltip
- **AgentMapPopover** (פותח בלחיצה על zone)
- מקסר "💡 לחץ על אזור..." רמז

## Themes — דרך CSS Variables

כל הצבעים מוגדרים פעמיים ב-[index.css](../src/index.css):
- `:root` — dark
- `.theme-light` — light

ב-[tailwind.config.js](../tailwind.config.js) הטוקנים מצביעים ל-vars:
```js
bg: { DEFAULT: 'rgb(var(--bg) / <alpha-value>)' }
```

החלפת theme = הוספת/הסרת `theme-light` ב-`document.documentElement`. SVG-ים משתמשים ב-`style={{ fill: 'var(--map-bg)' }}` כי SVG attributes לא תומכים ב-CSS vars.

## עקרונות עיצוב טכניים

1. **קומפוננטות פונקציונליות + hooks בלבד**. אין class components.
2. **TypeScript strict**. מודלים מוגדרים פעם אחת ב-`state/types.ts`, מיובאים בכל מקום.
3. **אין side effects בקומפוננטות** מלבד `useEffect` מצומצמים (theme class, scroll on new message, ambient activity).
4. **Reducer pure** — actions תיאוריות (`ADD_TASK` ולא `addTask({id})`).
5. **Composition over props drilling** — קומפוננטות שצריכות state מקבלות אותו דרך `useAICommand()` במקום props מהרשו.
6. **No premature abstraction** — Button/Card/Badge הם פשוטים; אין theme system גנרי, יש 2 themes ספציפיים.

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
