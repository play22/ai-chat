# מרכז פיקוד AI · C4I AI Command Center

קומפוננטת UI להדגמה של ממשק ניהול יכולות AI במערכת שו"ב (Command, Control, Communications, Computers, Intelligence). מאפשרת למפקד לתקשר עם מערכת AI אחת שמתאמת בין סוכנים מומחים (אש, מודיעין, אגם, אוויר, לוגיסטיקה, סייבר), לראות סטטוס משימות, להגדיר חוקי אוטומציה, ולנהל אזורי אחריות גיאוגרפיים — הכל מתוך חלון פיקוד אחד.

> **סטטוס:** הדגמה (mock data). אין backend או אינטגרציות חיצוניות. כל הסימולציות (תשובות AI, אירועים, סטטוסים) נוצרות מקומית.

## תכולה
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [מבנה התיקיות](#מבנה-התיקיות)
- [תיעוד מורחב](#תיעוד-מורחב)

## Quick Start

```powershell
# התקנה
npm install

# הרצת dev server
npm run dev
# פתח http://localhost:5173

# build production
npm run build
```

זמן עד אפליקציה פעילה בדפדפן: **כדקה**. אין צורך ב-API keys, secrets או services חיצוניים.

## Tech Stack

| תחום | בחירה | למה |
|------|--------|------|
| Framework | React 18 + TypeScript | סטנדרט תעשייתי, type safety על מודלי הנתונים |
| Build | Vite | dev server מהיר, HMR, build קל |
| Styling | Tailwind CSS 3 + `tailwindcss-rtl` | utility-first, RTL native, themable דרך CSS vars |
| State | `useReducer` + Context | אין צורך ב-Redux/Zustand לסקופ הזה; shallow + שקוף |
| Icons | lucide-react | קל, tree-shakeable, סגנון מינימליסטי מתאים |
| Helpers | `clsx` | מיזוג className מותנים |

**אין** router, store חיצוני, או fetch library. הכל מקומי.

## מבנה התיקיות

```
src/
├── main.tsx                   # entry point
├── App.tsx                    # wrapper דק - מציג AICommandCenter
├── index.css                  # tailwind + CSS variables לשני themes
│
├── state/                     # מודל נתונים + state management
│   ├── types.ts               # כל ה-interfaces (Agent, Task, Rule, ...)
│   ├── reducer.ts             # actions וכל מעברי ה-state
│   └── AICommandContext.tsx   # Provider + hook useAICommand
│
├── mock/                      # נתוני התחלה + סימולטור AI
│   ├── agents.ts              # 6 סוכנים עם config דיפולטי
│   ├── tasks.ts               # ~22 משימות מצבים שונים
│   ├── rules.ts               # 3 חוקי אוטומציה
│   ├── entities.ts            # 6 ישויות מפה
│   ├── conversations.ts       # 5 שיחות היסטוריות
│   └── aiResponder.ts         # סימולטור תשובות AI לפי keywords
│
└── components/ai-command/     # כל ה-UI components
    ├── AICommandCenter.tsx    # composition root
    ├── shared.ts              # labels, tones, formatters משותפים
    │
    ├── layout/                # Header, Sidebar, StatusBar
    ├── chat/                  # ChatPanel + Message + 6 renderers
    ├── agents/                # AgentsPanel + Card + Drawer + SettingsModal
    ├── tasks/                 # TasksPanel
    ├── timeline/              # TimelinePanel (Gantt)
    ├── automation/            # Rules CRUD + RuleEditor
    ├── history/               # HistoryPanel
    ├── map/                   # MockMap (SVG) + Picker + Popover + Legend
    └── ui/                    # primitives - Button, Card, Badge, ...
```

## תיעוד מורחב

| מסמך | למי | תוכן |
|------|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | מפתחים | מפת קומפוננטות, data flow, עקרונות עיצוב |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | מפתחים | רפרנס לכל קומפוננטה: תפקיד, props, תלויות |
| [docs/STATE.md](docs/STATE.md) | מפתחים | מבנה ה-state, כל ה-actions, דוגמאות שימוש |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | משתמשי קצה / מציגים | walkthroughs מבצעיים: איך עושים X |

## ערכי עיצוב

- **RTL מלא, עברית** — `dir="rtl"` ב-HTML, `tailwindcss-rtl` מטפל ב-`me/ms/end/start`.
- **Two themes** — Dark (terminal צבאי כהה, ירוק זוהר) ו-Light (command desk בהיר). מוחלף בכפתור 🌞/🌙 ב-Header. מוגדר דרך CSS variables ב-[src/index.css](src/index.css).
- **אין framework UI חיצוני** (shadcn/MUI/...). רכיבי בסיס משלי ב-[components/ai-command/ui/](src/components/ai-command/ui/) — מאפשר שליטה מלאה בסגנון הצבאי-טקטי.

## תרומה ופיתוח

המבנה תוכנן להחלפה קלה של ה-mock layer ב-API אמיתי:
- `mock/aiResponder.ts` → אסינכרוני, החלפה אחת ב-fetch ל-LLM.
- `mock/agents.ts`, `tasks.ts`, וכו' → טעינה ראשונית מ-API במקום constants.
- `MockMap.tsx` → ניתן להחליף ב-Leaflet/Mapbox בלי לגעת בשאר הקוד; הממשק עם entities/zones נשאר זהה.

לפני שינויים גדולים: קרא [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) להבנת המבנה.
