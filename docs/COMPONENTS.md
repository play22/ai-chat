# Components Reference

רפרנס מלא לכל הקומפוננטות באפליקציה, מסודר לפי דומיין. לכל קומפוננטה: תפקיד, props (אם חיצוניות), מצבים פנימיים מעניינים, וקישורים לקבצים.

> כל הקומפוננטות הן functional. רובן צורכות state דרך `useAICommand()` במקום props (Context-driven).

## Composition Root

### [AICommandCenter](../src/components/ai-command/AICommandCenter.tsx)
שורש האפליקציה. בולע `AICommandProvider`, ומציג את `Layout`. Layout:
- מחיל theme class על `document.documentElement` (`useEffect` על `state.theme`)
- בונה את ה-grid: Header / (Sidebar + ActivePanel + optional MapPanel) / StatusBar
- מארח כל ה-portals: TaskDrawer, AgentSettingsModal, MapPickerModal, Toasts

`ActivePanel` הוא switch פשוט לפי `state.activeTab`.

## Layout

### [Header](../src/components/ai-command/layout/Header.tsx)
שורת עליון עם:
- לוגו + שם המערכת + classification tag
- Badge "ONLINE"
- Toggle 3-state ל-view modes (compact/standard/expanded)
- כפתור הצגת/הסתרת מפה (רק כשלא ב-expanded)
- Selector autonomy גלובלי
- Theme toggle (☀️/🌙)
- כפתור התרעות (placeholder)
- אבטר משתמש "מפקד שטח"

### [Sidebar](../src/components/ai-command/layout/Sidebar.tsx)
ניווט אנכי עם 6 פריטים. כל פריט:
- אייקון
- label קטן
- badge מספרי (פעילים/מופעלים) — אופציונלי
- מצב active עם מסגרת ירוקה + פס אנכי

### [StatusBar](../src/components/ai-command/layout/StatusBar.tsx)
שורה תחתונה עם מטריקות שו"ב חיות:
- סטטוס קישור / אבטחה / CPU
- ספירת משימות בביצוע + ספירת קריטיות
- ספירת ישויות + חוקים פעילים
- שעון real-time (מתעדכן כל שניה דרך `setInterval`)

## Chat

### [ChatPanel](../src/components/ai-command/chat/ChatPanel.tsx)
מיכל הצ'אט. גלילה אוטומטית לתחתית בכל הודעה חדשה (`useEffect` על `messages.length`). כפתור "איפוס" → `CLEAR_MESSAGES`.

### [Message](../src/components/ai-command/chat/Message.tsx)
הודעה בודדת. מבדיל user/assistant ומציג אבטר + timestamp + autonomy badge (לתשובות AI). למצב `pending` — מציג 3 נקודות מהבהבות + "מנתח...". לאחר מכן עובר על `message.blocks[]` ומפעיל renderer מתאים.

### Message Renderers (`chat/MessageRenderers/`)

| Renderer | מתי | תוכן |
|----------|------|------|
| [TextBlock](../src/components/ai-command/chat/MessageRenderers/TextBlock.tsx) | טקסט פשוט | פסקה leading-relaxed |
| [TableBlock](../src/components/ai-command/chat/MessageRenderers/TableBlock.tsx) | טבלת תוצאות | Card עם table, hover rows, severity backgrounds, overflow-x |
| [ActionCard](../src/components/ai-command/chat/MessageRenderers/ActionCard.tsx) | אירוע שדורש החלטה | אייקון severity, כותרת+תיאור, כפתורי פעולה. severity → border צבעוני |
| [EntitySuggestion](../src/components/ai-command/chat/MessageRenderers/EntitySuggestion.tsx) | AI מציע להוסיף ישות למפה | grid 2 עמודות: meta + מיני-מפה. כפתורים: אשר ושמור / ערוך מיקום במפה / דחה |
| [QuickActions](../src/components/ai-command/chat/MessageRenderers/QuickActions.tsx) | פעולות מהירות מוצעות | chips קליקביליות שמכניסות prompt חדש לצ'אט |
| [PlanProposal](../src/components/ai-command/chat/MessageRenderers/PlanProposal.tsx) | AI מציע תוכנית פעולה לאישור | החשוב ביותר — ראה למטה |

#### PlanProposal — פירוט
הקומפוננטה הכי מורכבת. local state כולל draft של steps, scheduledFor, priority, agentId, וסטטוס approved/rejected/pending. במצב editing מאפשרת:
- שינוי סוכן יעד (Select)
- שינוי datetime (`datetime-local` input)
- שינוי עדיפות
- עריכת כל צעד (כותרת + estMinutes)
- מחיקת/הוספת צעדים

באישור:
- בונה `Task` חדש (status=`planned` אם יש scheduledFor, אחרת `pending`)
- מחשב ETA לפי סיכום estMinutes של כל הצעדים
- שולח `ADD_TASK`
- מציג toast + מצב "approved" עם הכוונה לטאב משימות

מציג גם מיני-מפה עם `previewGeo` של ה-geo הנבחר (לפני שהמשימה קיימת).

### [ChatInput](../src/components/ai-command/chat/ChatInput.tsx)
- Textarea שמתרחב עד `max-h-32`
- 3 כפתורי attachment בעמודה: 📍 תיחום מפה / 🖼️ תמונה / 🎯 ישות
- כשפותחים entity picker — dropdown עם רשימת `state.entities`
- מציג chips של pending attachments מעל ה-textarea
- Enter שולח, Shift+Enter שורה חדשה

## Agents

### [AgentsPanel](../src/components/ai-command/agents/AgentsPanel.tsx)
גריד responsive של AgentCard (1/2/3 עמודות לפי breakpoint).

### [AgentCard](../src/components/ai-command/agents/AgentCard.tsx)
כרטיס סוכן. 4 שכבות:
1. **Header**: אייקון דומיין במרובע + שם + status badge + meta (last activity, success rate)
2. **Stats grid 2x1**: מס' משימות פעילות (גדול, accent) + Select לאוטונומיה
3. **Zones strip** (רק אם יש משימות עם geo): "פעיל באזורים" + chips של labels בצבע הדומיין
4. **Actions**: "פתח משימות" → SELECT_AGENT (פותח Drawer); 📍 → הצגה במפה + highlight; ⚙️ → OPEN_AGENT_SETTINGS

### [TaskDrawer](../src/components/ai-command/agents/TaskDrawer.tsx)
Drawer צד שנפתח כש-`state.selectedAgentId` מוגדר. **מאוחסן ב-root** של AICommandCenter (לא ב-AgentsPanel) כדי שיפעל מכל מקום (גם מ-popover במפה, גם מטאב משימות בעתיד).

מציג:
- כותרת הסוכן עם אייקון
- רשימת המשימות שלו
- לכל משימה: כותרת, priority badge, status badge, זמנים, progress bar, כפתור ביטול

### [AgentSettingsModal](../src/components/ai-command/agents/AgentSettingsModal.tsx)
מודאל xl עם sidebar ניווט + 6 לשוניות. עובד על **draft** מקומי (`useState` מ-deep clone של ה-config) — שינויים לא משפיעים על state עד שלוחצים "שמור שינויים". מעקב dirty + confirm לפני סגירה.

לשוניות:

| Tab | תוכן |
|-----|------|
| כללי | סקירה: 3 KPIs (דומיין/סטטוס/הצלחה) + 6 stat boxes |
| סגנון תקשורת | tone, verbosity, language, signature, emoji, citeSources + **תצוגה מקדימה חיה** של דוגמת הודעה |
| הרשאות | 6 capability toggles + סף עדיפות לאישור אוטומטי + max parallel tasks. אזהרה אוטומטית כשמופעל "ביצוע אוטומטי" |
| יחידות | רשימת LinkedUnit + טופס "קשר יחידה חדשה" (שם/סוג/קריאה) |
| תיחום | שם + סוג + מס' נקודות + כפתורי עריכה/הסרה + **מיני-מפה ימין** עם previewGeo |
| כלים | רשימת AgentTool + toggle הפעל/השבת + טופס "צור כלי חדש" (שם/תיאור/סוג/endpoint) |

## Tasks

### [TasksPanel](../src/components/ai-command/tasks/TasksPanel.tsx)
תצוגה מפורטת של כל המשימות במערכת.

**שכבות**:
1. **KPI strip** — 5 כפתורי סטטוס (in_progress/planned/pending/completed/failed) עם ספירה גדולה. לחיצה מסננת.
2. **Filter chips** — chip לכל סטטוס + dropdown סוכן + חיפוש טקסט
3. **Body** — כשהסינון = "הכל", המשימות מקובצות לפי סטטוס עם כותרות. אחרת — רשימה רציפה.

**TaskRow** (local component):
- בר צבעוני אנכי בצד (סטטוס)
- אייקון דומיין + כותרת + badges (priority, status)
- meta line: שם סוכן, **chip של geo קליקבילי** (פותח מפה + highlight), זמנים
- progress bar
- כפתור ביטול (רק אם pending/in_progress/planned)

## Timeline

### [TimelinePanel](../src/components/ai-command/timeline/TimelinePanel.tsx)
תצוגת Gantt-style של משימות.

**מאפיינים**:
- **4 רמות זום**: 4h / 12h / 24h / 3d
- **חלון זמן** מתכוונן בכפתורי "הקדם/עכשיו/אחר"
- **Grid 2 עמודות**: עמודת labels (140px sticky) + lanes (1 lane per agent, גובה 64px)
- **קו "עכשיו"** אנכי ירוק זוהר, עם תווית "● עכשיו"
- **בלוקי משימות** ממוקמים בלוגיקת `taskRange()`:
  - planned: scheduledFor → +30min
  - in_progress: startedAt → eta
  - pending: createdAt → eta
  - completed: startedAt → completedAt
  - failed: startedAt → +20min
- כל בלוק צבוע לפי סטטוס, עם progress bar אם in_progress
- hover מציג פירוט בלגנדה התחתונה

מסונן אוטומטית לחלון הזמן הנוכחי — משימות מחוץ לחלון לא מוצגות.

## Automation

### [AutomationPanel](../src/components/ai-command/automation/AutomationPanel.tsx)
רשימת RuleCard + כפתור "חוק חדש" שפותח את RuleEditor.

### [RuleCard](../src/components/ai-command/automation/RuleCard.tsx)
כרטיס חוק. 3 שכבות:
1. **Header**: Toggle הפעל + שם + Badge פעיל/מושבת
2. **Body** grid 3-col: WHEN-טריגר ← THEN-פעולה (עם אייקון סוכן יעד וכפתור priority)
3. **Footer**: ספירת הפעלות + הפעלה אחרונה + כפתורי ערוך/מחק

הצגת trigger רגישה לסוג: detection מציג entityType+area, threshold מציג metric+op+value, schedule מציג רקורנס בעברית מפורטת (חד-פעמי/יומי/שבועי + שעה/יום).

### [RuleEditor](../src/components/ai-command/automation/RuleEditor.tsx)
מודאל עריכה. עובד על draft (`useState`). split 2-col: WHEN | THEN.

**WHEN משתנה לפי סוג**:
- detection → entityType + areaLabel + כפתור "בחר תיחום במפה" (placeholder)
- threshold → metric + op + value
- schedule → recurrence selector + שדה דינמי לפי בחירה (datetime-local / interval / time / weekday+time) + **תצוגת "הפעלה הבאה משוערת"**

**THEN**: action type + targetAgent + priority + message.

## History

### [HistoryPanel](../src/components/ai-command/history/HistoryPanel.tsx)
רשימת שיחות עם חיפוש. כל שיחה: אייקון, כותרת, preview, ספירת הודעות, זמן יחסי. לחיצה מציגה toast + מנווטת לטאב שיחה (אין שחזור אמיתי של תוכן — placeholder להדגמה).

## Map

### [MockMap](../src/components/ai-command/map/MockMap.tsx)
SVG viewBox 0..100 (אחוזים). מציג:
- רקע + grid כפול
- terrain mock (water + ridge)
- compass + sector labels (לא ב-miniature)
- ישויות (קליקביליות עם hover label)
- agent zones (אם `showAgentZones=true`) — קליקביליות → פותחות AgentMapPopover
- preview geo (לתוכנית מוצעת — אם `previewGeo` prop)
- picker modes (point/polygon) — כשהמפה נפתחת ל-MapPickerModal

**props חשובים**:
- `entities` — ברירת מחדל `state.entities`, אפשר לעקוף
- `miniature` — מסתיר scanline, compass, sector labels, ישות labels, controls
- `showAgentZones` + `highlightAgentId` — לתצוגה אופרטיבית
- `previewGeo` — להצגת geo "מוצע" לפני שיש task
- `pickerMode` + `polygonPoints` + `selectedPoint` — controlled state ל-MapPickerModal

**State פנימי**: hovered entity, popover object {agentId, zoneLabel, x, y}.

### [AgentMapPopover](../src/components/ai-command/map/AgentMapPopover.tsx)
Popover צף שנפתח בלחיצה על agent zone במפה. **smart placement** — מתמקם לפי רבע המפה בו נלחץ (translates `0% / -100%` כדי לא להיחתך).

תוכן:
- Header עם רקע צבוע בצבע הדומיין + שם + סטטוס + autonomy + last activity
- שורת אזור הספציפי שנלחץ
- 4 KPI cards (in_progress/planned/pending/completed) — ספירה מקומית לאזור
- רשימת משימות באזור (עד 6)
- כפתורי פעולה: "פתח משימות" → SELECT_AGENT, ⚙️ → OPEN_AGENT_SETTINGS, 🎯 → SET_TAB('agents')

### [MapPickerModal](../src/components/ai-command/map/MapPickerModal.tsx)
מודאל גדול עם MockMap בתוכו, נפתח כש-`state.mapPickerMode` מוגדר. 3 מטרות:
- `attach_area` — בחירת פוליגון לצירוף להודעה
- `place_entity` — מיקום ישות מוצעת על המפה
- `rule_area` — בחירת אזור לחוק אוטומציה

מנהל state פנימי של polygon/point ומעביר ל-MockMap כ-controlled props.

### [MapAgentLegend](../src/components/ai-command/map/MapAgentLegend.tsx)
לגנדה תחת המפה — chip לכל סוכן שיש לו משימות עם geo. לחיצה מחליפה `state.highlightAgentId` — במפה זה מעמעם את שאר האזורים. כפתור "נקה סינון" מופיע כש-highlight פעיל.

## UI Primitives (`ui/`)

| Component | תפקיד |
|-----------|--------|
| [Button](../src/components/ai-command/ui/Button.tsx) | 5 variants × 3 sizes + icons + active state. Also IconButton |
| [Card](../src/components/ai-command/ui/Card.tsx) | Card + CardHeader + CardBody + CardFooter |
| [Badge](../src/components/ai-command/ui/Badge.tsx) | 7 tones × dot ± pulse |
| [Select](../src/components/ai-command/ui/Select.tsx) | מותאם אישית עם ChevronDown |
| [Input](../src/components/ai-command/ui/Input.tsx) | Input + Textarea — label אופציונלי באותו מבנה |
| [Toggle](../src/components/ai-command/ui/Toggle.tsx) | Switch מותאם עם accent glow |
| [Modal](../src/components/ai-command/ui/Modal.tsx) | Modal + Drawer — שניהם תומכים ב-Escape, click-outside, footer |
| [Toasts](../src/components/ai-command/ui/Toasts.tsx) | קונסומר של `state.toasts` — אוטו-dismiss אחרי 4s ב-AICommandContext |

## תלויות בין רכיבים — דיאגרמה

```
AICommandCenter ─┐
                 ├─ AICommandProvider (state)
                 ├─ Header ──────────────── useAICommand
                 ├─ Sidebar ─────────────── useAICommand
                 ├─ ActivePanel ─────────── useAICommand (switch)
                 │   ├─ ChatPanel ──────── useAICommand
                 │   │   ├─ Message ────── (props)
                 │   │   │   └─ Renderers ─ useAICommand (toast, dispatch, sendUserMessage)
                 │   │   └─ ChatInput ─── useAICommand
                 │   ├─ AgentsPanel ───── useAICommand
                 │   │   └─ AgentCard ── useAICommand
                 │   ├─ TasksPanel ────── useAICommand
                 │   ├─ TimelinePanel ─── useAICommand
                 │   ├─ AutomationPanel ─ useAICommand
                 │   │   ├─ RuleCard ─── useAICommand
                 │   │   └─ RuleEditor ─ useAICommand
                 │   └─ HistoryPanel ──── useAICommand
                 ├─ MapPanel ──────────── useAICommand
                 │   ├─ MockMap ──────── useAICommand
                 │   │   └─ AgentMapPopover ─ useAICommand
                 │   └─ MapAgentLegend ─ useAICommand
                 ├─ MapPickerModal ────── useAICommand
                 ├─ TaskDrawer ────────── useAICommand
                 ├─ AgentSettingsModal ── useAICommand
                 └─ StatusBar + Toasts ── useAICommand
```

**עיקרון**: כמעט כל קומפוננטה צורכת `useAICommand()`. ה-props המועברים בדרך כלל בין הורה לילד הם רק נתון בודד שצריך (e.g. `<Message message={...} />`). זה שומר על קישוריות שטוחה ועל קלות הוספת interactions חדשים.
