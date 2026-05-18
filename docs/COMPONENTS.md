# Components Reference

רפרנס מלא לכל הקומפוננטות באפליקציה, מסודר לפי דומיין.

> כל הקומפוננטות הן functional. רובן צורכות state דרך `useAICommand()` במקום props (Context-driven).

## Composition Root

### [AICommandCenter](../src/components/ai-command/AICommandCenter.tsx)
שורש האפליקציה. עוטף ב-`AICommandProvider`, ומציג את `Layout`. Layout:
- מחיל theme class על `document.documentElement` (`useEffect` על `state.theme`)
- בונה את ה-grid: Header / (Sidebar + ActivePanel + Splitter + optional MapPanel) / StatusBar
- מארח את כל ה-portals: TaskDrawer, AgentSettingsModal, TaskDetailsModal, MapPickerModal, Toasts
- מחשב גודל פאנל מפה דרך `state.mapSplitPercent` עם RTL-aware drag handling

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
- אבטר משתמש

### [Sidebar](../src/components/ai-command/layout/Sidebar.tsx)
ניווט אנכי עם 6 פריטים (chat / agents / tasks / timeline / automation / history). כל פריט:
- אייקון + label קטן
- badge מספרי (פעילים/מופעלים)
- מצב active עם מסגרת ירוקה + פס אנכי

### [StatusBar](../src/components/ai-command/layout/StatusBar.tsx)
שורה תחתונה עם מטריקות שו"ב חיות:
- סטטוס קישור / אבטחה / CPU
- ספירת משימות בביצוע + ספירת קריטיות
- ספירת ישויות + חוקים פעילים
- שעון real-time (מתעדכן כל שניה)
- `overflow-x-auto` כדי לטפל בצמצום

### [ResizeHandle](../src/components/ai-command/layout/ResizeHandle.tsx)
Splitter דק (4px רחב) בין הפאנל הפעיל למפה. תכונות:
- Grip indicator במרכז, מתחזק ב-hover ובזמן drag
- Wide hit area (`-inset-x-1.5`) לתפיסה קלה
- בזמן drag: `cursor-col-resize` על ה-body + מניעת text selection
- Double-click מאפס ל-45%
- RTL-aware: ההמרה מ-clientX לאחוזים מטפלת בכיוון

## Chat

### [ChatPanel](../src/components/ai-command/chat/ChatPanel.tsx)
מיכל הצ'אט. גלילה אוטומטית לתחתית בכל הודעה חדשה. כפתור "תקציר" בכותרת — dropdown של 5 טווחי זמן (1h/6h/12h/24h/3d) ששולחים prompt תואם. כפתור "איפוס" → `CLEAR_MESSAGES`.

### [Message](../src/components/ai-command/chat/Message.tsx)
הודעה בודדת. מבדיל user/assistant ומציג אבטר + timestamp + autonomy badge (לתשובות AI). למצב `pending` — מציג 3 נקודות מהבהבות + "מנתח...". לאחר מכן עובר על `message.blocks[]` ומפעיל renderer מתאים. **בזרמה streaming** ההודעה אותה ההודעה — רק `blocks[]` גדל בהדרגה.

### Message Renderers (`chat/MessageRenderers/`)

| Renderer | מתי | תוכן |
|----------|------|------|
| [TextBlock](../src/components/ai-command/chat/MessageRenderers/TextBlock.tsx) | טקסט פשוט | פסקה leading-relaxed |
| [TableBlock](../src/components/ai-command/chat/MessageRenderers/TableBlock.tsx) | טבלת תוצאות | Card עם table, hover rows, severity backgrounds, overflow-x |
| [ActionCard](../src/components/ai-command/chat/MessageRenderers/ActionCard.tsx) | אירוע שדורש החלטה | אייקון severity, כותרת+תיאור, כפתורי פעולה. severity → border צבעוני |
| [EntitySuggestion](../src/components/ai-command/chat/MessageRenderers/EntitySuggestion.tsx) | AI מציע להוסיף ישות למפה | grid 2 עמודות: meta + מיני-מפה. כפתורים: אשר ושמור / ערוך מיקום / דחה |
| [QuickActions](../src/components/ai-command/chat/MessageRenderers/QuickActions.tsx) | פעולות מהירות מוצעות | chips קליקביליות שמכניסות prompt חדש לצ'אט |
| [PlanProposal](../src/components/ai-command/chat/MessageRenderers/PlanProposal.tsx) | AI מציע תוכנית פעולה לאישור | הקומפוננטה הכי מורכבת — ראה למטה |
| [Summary](../src/components/ai-command/chat/MessageRenderers/Summary.tsx) | תקציר תקופה מובנה | KPIs, ציר אירועים, פעילות לפי סוכן, המלצות — ראה למטה |

#### PlanProposal — פירוט
local state כולל draft של steps, scheduledFor, priority, agentId, subAgentIds, וסטטוס approved/rejected/pending. במצב editing מאפשרת:
- שינוי סוכן יעד (Select)
- **multi-select של תתי-סוכנים** (chips בצבע דומיין)
- שינוי datetime (`datetime-local` input)
- שינוי עדיפות
- עריכת כל צעד (כותרת + estMinutes)
- מחיקת/הוספת צעדים

באישור:
- בונה `Task` חדש (status=`planned` אם יש scheduledFor, אחרת `pending`)
- מחשב ETA לפי סיכום estMinutes של כל הצעדים
- כולל `subAgentIds` ו-`geo`
- שולח `ADD_TASK` — Reducer גם מעדכן `agent.activeTasks++`
- מציג toast + מצב "approved" עם הכוונה לטאב משימות

מציג מיני-מפה עם `previewGeo` של ה-geo הנבחר (לפני שהמשימה קיימת).

#### Summary — פירוט
כרטיס עשיר עם:
- Header ירוק זוהר + Badge "LIVE" + טווח זמן + כפתור "ייצא"
- 6 KPI cells עם ערך גדול monospace, אייקון trend (📈/📉/➖) ו-delta %
- תובנות עיקריות עם bullet ירוק + תמיכה ב-bold (`**טקסט**`)
- ציר אירועים — כל אירוע עם severity color + timestamp + agent chip
- פעילות לפי סוכן — גריד 2 עמודות עם mini bar צבעוני (השלמות/בביצוע/נכשלו)
- המלצות פעולה ברקע warn + border-r כתום
- Footer עם tabs פנימיים: הכל / אירועים / סוכנים (פילטר תצוגה)

הנתונים נוצרים ב-[summaryGenerator.ts](../src/mock/summaryGenerator.ts) (mock mode) או ע"י ה-LLM דרך `emit_summary` tool (real mode).

### [ChatInput](../src/components/ai-command/chat/ChatInput.tsx)
- Textarea שמתרחב עד `max-h-32`
- 3 כפתורי attachment בעמודה: 📍 תיחום מפה / 🖼️ תמונה / 🎯 ישות
- כשפותחים entity picker — dropdown עם רשימת `state.entities`
- מציג chips של pending attachments מעל ה-textarea
- Enter שולח, Shift+Enter שורה חדשה

## Agents

### [AgentsPanel](../src/components/ai-command/agents/AgentsPanel.tsx)
גריד **container-aware** של AgentCard. משתמש ב-`useContainerWidth` hook (ResizeObserver) לבחירה דינמית של 1/2/3 עמודות לפי רוחב הפאנל בפועל — לא viewport. מגיב מיידית לגרירת ה-splitter.

### [AgentCard](../src/components/ai-command/agents/AgentCard.tsx)
כרטיס סוכן. 4 שכבות:
1. **Header**: אייקון דומיין במרובע + שם + status badge + meta (last activity, success rate)
2. **Stats grid 2x1**: מס' משימות פעילות (גדול, accent) + Select לאוטונומיה
3. **Zones strip** (אם יש משימות עם geo): "פעיל באזורים" + chips של labels בצבע הדומיין
4. **Actions**: "פתח משימות" → SELECT_AGENT (פותח Drawer); 📍 → הצגה במפה + highlight; ⚙️ → OPEN_AGENT_SETTINGS

### [TaskDrawer](../src/components/ai-command/agents/TaskDrawer.tsx)
Drawer צד (520px) שנפתח כש-`state.selectedAgentId` מוגדר. **מאוחסן ב-root** של AICommandCenter (לא ב-AgentsPanel) כדי שיפעל מכל מקום.

**2 לשוניות**: "משימות" + "שיחה" (עם count badges).

לשונית **משימות**:
- מציגה משימות שבהן הסוכן הוא primary **או** sub-agent (משימות sub מקבלות בורדר כחול + Badge "תת-משימה")
- כל משימה: כותרת, priority badge, status badge, זמנים, geo chip, "משתתפים"/"מתואם ע"י" + chips
- progress bar + כפתור ביטול

לשונית **שיחה**: רנדור של `AgentChatPanel`.

### [AgentChatPanel](../src/components/ai-command/agents/AgentChatPanel.tsx)
שיחה ישירה עם סוכן בודד. ה-thread נשמר ב-`state.agentChats[agentId]`.

- Banner צבעוני עליון: "שיחה ישירה עם <חתימת הסוכן>"
- **Empty state** מזמין: אווטר גדול + 4 quick action suggestions ("מה המצב?", "אילו משימות פתוחות?", "מי כפוף אליי?", "יש לך המלצה לפעולה?")
- שימוש ב-`Message.tsx` הקיים — תומך בכל ה-block renderers
- כפתור איפוס שיחה
- Enter לשליחה

ה-responder ([agentResponder.ts](../src/mock/agentResponder.ts) במצב mock, או LLM עם `agentSystemPrompt` במצב real) משתמש ב-`agent.config.style.signature` כשם הדובר, ויודע על המשימות שלו (כולל אלו שבהן הוא תת-סוכן).

### [AgentSettingsModal](../src/components/ai-command/agents/AgentSettingsModal.tsx)
מודאל xl עם sidebar ניווט + 6 לשוניות. עובד על **draft** מקומי (`useState` מ-deep clone של ה-config) — שינויים לא משפיעים על state עד "שמור שינויים". מעקב dirty + confirm לפני סגירה.

לשוניות:

| Tab | תוכן |
|-----|------|
| כללי | סקירה: 3 KPIs (דומיין/סטטוס/הצלחה) + 6 stat boxes |
| סגנון תקשורת | tone, verbosity, language, signature, emoji, citeSources + **תצוגה מקדימה חיה** של דוגמת הודעה |
| הרשאות | 6 capability toggles + סף עדיפות לאישור אוטומטי + max parallel tasks. אזהרה אוטומטית כשמופעל "ביצוע ללא אישור" |
| יחידות | רשימת LinkedUnit + טופס "קשר יחידה חדשה" |
| תיחום | שם + סוג + מס' נקודות + כפתור **"ערוך תיחום במפה"** (פותח MapPickerModal) + מיני-מפה ימין עם previewGeo + שטח משוער |
| כלים | רשימת AgentTool + toggle הפעל/השבת + טופס "צור כלי חדש" (שם/תיאור/סוג/endpoint) |

**Cross-modal pattern**: כפתור "ערוך תיחום במפה" שולח `OPEN_MAP_PICKER` עם `purpose: 'agent_boundary'`. ה-MapPickerModal מצייר מעל המודאל הזה (z-order). בסיום, ה-picker שולח `SET_PENDING_BOUNDARY` ו-`CLOSE_MAP_PICKER`. ה-AgentSettingsModal מאזין ב-useEffect ל-`state.pendingBoundary`, מוזג ל-draft, ומשלח `CLEAR_PENDING_BOUNDARY`.

## Tasks

### [TasksPanel](../src/components/ai-command/tasks/TasksPanel.tsx)
תצוגה מפורטת של כל המשימות במערכת.

**שכבות**:
1. **KPI strip** — 5 כפתורי סטטוס (in_progress/planned/pending/completed/failed) עם ספירה גדולה. לחיצה מסננת.
2. **Filter chips** — chip לכל סטטוס + dropdown סוכן + חיפוש טקסט
3. **Body** — כשהסינון = "הכל", המשימות מקובצות לפי סטטוס עם כותרות.

**TaskRow** (local component):
- כל הכרטיס **clickable** → פותח TaskDetailsModal
- בר צבעוני אנכי בצד (סטטוס)
- אייקון דומיין + כותרת + badges (priority, status)
- meta line: Badge "מתאם" אם רב-סוכנית + שם סוכן, **chip של geo קליקבילי** (`stopPropagation`, פותח מפה + highlight), chips של תתי-סוכנים, זמנים
- progress bar
- כפתור ביטול (רק אם pending/in_progress/planned; `stopPropagation`)

### [TaskDetailsModal](../src/components/ai-command/tasks/TaskDetailsModal.tsx)
מודאל xl רחב עם פריסה דו-טורית, נפתח כש-`state.editingTaskId` מוגדר. עובד על draft מקומי.

**Sidebar שמאלי (240px)** — תמצית במבט אחד:
- task id
- 2 badges (סטטוס + עדיפות) עם pulse לבביצוע
- כרטיס סוכן אחראי בצבע הדומיין (כותרת מתחלפת ל"מתאם" אם יש sub-agents)
- preview של תתי-סוכנים
- progress bar
- 5 timestamps (נוצרה / מתוזמן / החלה / ETA / הושלמה) — מודגשים בצבע סמנטי

**טור ימני (form)** — toggle צפייה/עריכה:
- כותרת + תיאור
- 3 selects: סטטוס / עדיפות / סוכן אחראי
- 2 שדות datetime: scheduledFor + ETA
- **multi-select של תתי-סוכנים** (chips בצבע דומיין)
- **אזור גיאוגרפי** עם מיני-מפה ימין + כפתורי "ערוך במפה" / "הסר"
- שורת hint למטה

**פעולות**:
- שמור שינויים (disabled עד dirty, dispatch UPDATE_TASK)
- בטל משימה (confirm → CANCEL_TASK → סוגר; אדום)
- סמן כהושלמה (רק ל-in_progress; קובע completedAt+progress=100)
- סגור (confirm על שינויים לא שמורים)
- משימות completed/failed הופכות לקריאה בלבד עם Badge

**Cross-modal pattern**: עריכת geo דרך אותו דפוס כמו AgentSettings — `purpose: 'task_geo'` + `pendingTaskGeo` mailbox.

## Timeline

### [TimelinePanel](../src/components/ai-command/timeline/TimelinePanel.tsx)
תצוגת Gantt-style של משימות.

**מאפיינים**:
- 4 רמות זום: 4h / 12h / 24h / 3d
- חלון זמן מתכוונן בכפתורי "הקדם/עכשיו/אחר"
- Grid 2 עמודות: עמודת labels (140px sticky) + lanes (1 lane per agent, גובה 64px)
- קו "עכשיו" אנכי ירוק זוהר, עם תווית "● עכשיו"
- **בלוקי משימות clickable** (פותחים TaskDetailsModal):
  - **Primary bars** — לכל משימה ב-lane של ה-coordinator, עם Badge `+N` אם רב-סוכנית
  - **Sub-agent indicator bars** — דק (h-3) מקווקו, אופסיטי 50%, מופיע ב-lane של כל sub-agent של משימה, עם תווית "↳ <coordinator> · <title>"
- כל בלוק צבוע לפי סטטוס, עם progress bar אם in_progress
- hover מציג פירוט בלגנדה התחתונה
- ספירת lane: "5 בחלון · +2 תת" (משתתפויות כתת-סוכן)

מסונן אוטומטית לחלון הזמן הנוכחי — משימות מחוץ לחלון לא מוצגות.

## Automation

### [AutomationPanel](../src/components/ai-command/automation/AutomationPanel.tsx)
רשימת RuleCard + כפתור "חוק חדש" שפותח את RuleEditor.

**פאנל "לוגיקת אוטומציה כוללת"** (collapsible, פתוח ב-default) בראש הרשימה:
- **3 KPI**: פעולות אוטומטיות (כתום) / ידרשו אישור (כחול) / התנגשויות (אדום/אפור)
- **עומס לפי סוכן** — chips של כל סוכן שיעד לחוקים + ספירה. סוכן עם ≥3 חוקים מסומן בכתום
- **"מה יקרה — חוק אחר חוק"** — רשימה ממוספרת עם משפט דינמי שנבנה מ-`describeRuleLogic()`
- **התנגשויות**: duplicate_trigger / overload
- שורת תזכורת על autonomy גלובלית

### [RuleCard](../src/components/ai-command/automation/RuleCard.tsx)
כרטיס חוק. שכבות:
1. **Header**: Toggle הפעל + שם + Badge "שפה חופשית" אם `nlDescription` + Badge פעיל/מושבת
2. **NL quote** (אם קיים): הציטוט המקורי באיטליקה ברקע info
3. **Body** grid 3-col: WHEN-טריגר ← THEN-פעולה (עם אייקון סוכן יעד וכפתור priority)
4. **Footer**: ספירת הפעלות + הפעלה אחרונה + כפתורי ערוך/מחק

הצגת trigger רגישה לסוג: detection מציג entityType+area, threshold מציג metric+op+value, schedule מציג רקורנס בעברית מפורטת (חד-פעמי/יומי/שבועי + שעה/יום).

### [RuleEditor](../src/components/ai-command/automation/RuleEditor.tsx)
מודאל עריכה. עובד על draft (`useState`).

**Mode toggle** בראש: "הגדרה מובנית" ⟷ "שפה חופשית"

**במצב שפה חופשית**:
- Textarea + 3 chips של דוגמאות מהירות
- כפתור **"פענח ועדכן"** — מפעיל [parseRuleNL](../src/mock/ruleNLParser.ts)
- Feedback: ✓ ירוקים (מה ה-AI הבין) + ⚠ כתומים (מה חסר/לא ברור)
- השדות המובנים מתמלאים אוטומטית

**במצב מובנה**: split 2-col WHEN | THEN:
- **WHEN משתנה לפי סוג**:
  - detection → entityType + areaLabel + כפתור "בחר תיחום במפה" (placeholder)
  - threshold → metric + op + value
  - schedule → recurrence selector + שדה דינמי (datetime-local / interval / time / weekday+time) + **תצוגת "הפעלה הבאה משוערת"**
- **THEN**: action type + targetAgent + priority + message

**בלוק "מה ה-AI יעשה?"** למטה — בורדר ירוק זוהר, משפט מסכם מ-`describeRuleLogic()` שלוקח בחשבון autonomy גלובלית + סוכנית.

שמירה כוללת `nlDescription` אם נכתב במצב חופשי.

## History

### [HistoryPanel](../src/components/ai-command/history/HistoryPanel.tsx)
רשימת שיחות עם חיפוש. כל שיחה: אייקון, כותרת, preview, ספירת הודעות, זמן יחסי. לחיצה מציגה toast + מנווטת לטאב שיחה (אין שחזור אמיתי של תוכן — placeholder).

## Map

### [MockMap](../src/components/ai-command/map/MockMap.tsx)
SVG viewBox 0..100 (אחוזים). מציג:
- רקע + grid כפול (theme-aware via CSS vars)
- terrain mock (water + ridge)
- compass + sector labels (לא ב-miniature)
- ישויות (קליקביליות עם hover label)
- **agent zones** (אם `showAgentZones=true`) — קליקביליות → פותחות `AgentMapPopover`
- **preview geo** (לתוכנית מוצעת — אם `previewGeo` prop)
- picker modes (point/polygon) — כשהמפה נפתחת ל-MapPickerModal

**props חשובים**:
- `entities` — ברירת מחדל `state.entities`, אפשר לעקוף
- `miniature` — מסתיר scanline, compass, sector labels, ישות labels, controls
- `showAgentZones` + `highlightAgentId` — לתצוגה אופרטיבית
- `previewGeo` — להצגת geo "מוצע" לפני שיש task
- `pickerMode` + `polygonPoints` + `selectedPoint` — controlled state ל-MapPickerModal

**State פנימי**: hovered entity, popover object {agentId, zoneLabel, x, y}.

### [AgentMapPopover](../src/components/ai-command/map/AgentMapPopover.tsx)
Popover צף שנפתח בלחיצה על agent zone במפה. **smart placement** — מתמקם לפי רבע המפה בו נלחץ.

תוכן:
- Header עם רקע צבוע בצבע הדומיין + שם + סטטוס + autonomy + last activity
- שורת אזור + Badges "מתאם N משימות"/"תת-סוכן ב-N משימות" (אם רלוונטי)
- 4 KPI cards (in_progress/planned/pending/completed) — ספירה מקומית לאזור
- רשימת משימות באזור (עד 6)
- כפתורי פעולה: **"פתח משימות"** → SELECT_AGENT, ⚙️ → OPEN_AGENT_SETTINGS, 🎯 → SET_TAB('agents')

### [MapPickerModal](../src/components/ai-command/map/MapPickerModal.tsx)
מודאל גדול עם MockMap בתוכו, נפתח כש-`state.mapPickerMode` מוגדר. 5 מטרות:
- `attach_area` — בחירת פוליגון לצירוף להודעה
- `place_entity` — מיקום ישות מוצעת על המפה
- `rule_area` — בחירת אזור לחוק אוטומציה (placeholder)
- `agent_boundary` — תיחום אחריות לסוכן (מאזין: AgentSettingsModal)
- `task_geo` — אזור פעולה למשימה (מאזין: TaskDetailsModal)

תכונות:
- טוען polygon/point קיים (`initialPolygon` / `initialPoint`) — עריכה לא הרסנית
- כפתורי "בטל נקודה אחרונה" / "איפוס" / "סיים תיחום (N)"
- Status badge דינמי במפה ("3 נקודות (עוד 0 לפחות) — ניתן לסיים")
- באנר הסבר ספציפי לכל purpose
- לפי purpose שולח את ה-action הנכון: UPDATE_ENTITY / SET_PENDING_BOUNDARY / SET_PENDING_TASK_GEO / ADD_PENDING_ATTACHMENT

### [MapAgentLegend](../src/components/ai-command/map/MapAgentLegend.tsx)
לגנדה תחת המפה — chip לכל סוכן שיש לו משימות עם geo. לחיצה מחליפה `state.highlightAgentId` — במפה זה מעמעם את שאר האזורים. כפתור "נקה סינון" מופיע כש-highlight פעיל.

## UI Primitives (`ui/`)

| Component | תפקיד |
|-----------|--------|
| [Button](../src/components/ai-command/ui/Button.tsx) | 5 variants × 3 sizes + icons + active state. Also IconButton |
| [Card](../src/components/ai-command/ui/Card.tsx) | Card + CardHeader + CardBody + CardFooter |
| [Badge](../src/components/ai-command/ui/Badge.tsx) | 7 tones × dot ± pulse |
| [Select](../src/components/ai-command/ui/Select.tsx) | מותאם אישית עם ChevronDown |
| [Input](../src/components/ai-command/ui/Input.tsx) | Input + Textarea — label אופציונלי |
| [Toggle](../src/components/ai-command/ui/Toggle.tsx) | Switch מותאם עם accent glow |
| [Modal](../src/components/ai-command/ui/Modal.tsx) | Modal + Drawer — שניהם תומכים ב-Escape, click-outside, footer |
| [Toasts](../src/components/ai-command/ui/Toasts.tsx) | קונסומר של `state.toasts` — אוטו-dismiss אחרי 4s |

## Backend (`server/src/`)

לפירוט מעמיק ראה [ARCHITECTURE.md § Backend](ARCHITECTURE.md#backend-server).

| קובץ | תפקיד |
|------|--------|
| [server/src/index.ts](../server/src/index.ts) | Express boot, CORS, JSON parsing, route mounting, /api/health |
| [server/src/types.ts](../server/src/types.ts) | Mirror של MessageBlock + context shapes (משוכפל מ-frontend types) |
| [server/src/routes/chat.ts](../server/src/routes/chat.ts) | POST /api/chat — validates body, calls runStreamingChat with main prompt |
| [server/src/routes/agentChat.ts](../server/src/routes/agentChat.ts) | POST /api/agent-chat — same but with agent prompt |
| [server/src/llm/client.ts](../server/src/llm/client.ts) | OpenAI SDK עם baseURL מותאם, יצוא `llm` ו-`llmConfig` |
| [server/src/llm/tools.ts](../server/src/llm/tools.ts) | 7 tool schemas + `toolCallToBlock(name, args)` mapper |
| [server/src/llm/systemPrompts.ts](../server/src/llm/systemPrompts.ts) | `mainSystemPrompt(ctx)` + `agentSystemPrompt(ctx)` |
| [server/src/llm/streamHandler.ts](../server/src/llm/streamHandler.ts) | SSE writer + tool_call accumulator (mendrane chunks → complete block events) |

## תלויות בין רכיבים — דיאגרמה

```
AICommandCenter ─┐
                 ├─ AICommandProvider (state, sendUserMessage, sendAgentMessage)
                 │     │
                 │     └─ services/llmClient.ts ─────────────→ POST /api/* (real mode)
                 │     └─ mock/aiResponder.ts (fallback / default)
                 │     └─ mock/agentResponder.ts (fallback / default)
                 │
                 ├─ Header ──────────────── useAICommand
                 ├─ Sidebar ─────────────── useAICommand
                 ├─ ActivePanel ─────────── useAICommand (switch)
                 │   ├─ ChatPanel ──────── useAICommand
                 │   │   ├─ Message ────── (props)
                 │   │   │   └─ Renderers ─ useAICommand (toast, dispatch, sendUserMessage)
                 │   │   └─ ChatInput ─── useAICommand
                 │   ├─ AgentsPanel ───── useAICommand + useContainerWidth
                 │   │   └─ AgentCard ── useAICommand
                 │   ├─ TasksPanel ────── useAICommand
                 │   ├─ TimelinePanel ─── useAICommand
                 │   ├─ AutomationPanel ─ useAICommand
                 │   │   ├─ RuleCard ─── useAICommand
                 │   │   └─ RuleEditor ─ useAICommand + ruleNLParser
                 │   └─ HistoryPanel ──── useAICommand
                 ├─ ResizeHandle ──────── (callbacks)
                 ├─ MapPanel ──────────── useAICommand
                 │   ├─ MockMap ──────── useAICommand
                 │   │   └─ AgentMapPopover ─ useAICommand
                 │   └─ MapAgentLegend ─ useAICommand
                 ├─ TaskDrawer ────────── useAICommand
                 │   └─ AgentChatPanel ─ useAICommand + sendAgentMessage
                 ├─ MapPickerModal ────── useAICommand
                 ├─ AgentSettingsModal ── useAICommand + listens to pendingBoundary
                 ├─ TaskDetailsModal ──── useAICommand + listens to pendingTaskGeo
                 └─ StatusBar + Toasts ── useAICommand
```

**עיקרון**: כמעט כל קומפוננטה צורכת `useAICommand()`. ה-props המועברים בין הורה לילד הם רק נתון בודד (`<Message message={...} />`). זה שומר על קישוריות שטוחה ועל קלות הוספת interactions חדשים.
