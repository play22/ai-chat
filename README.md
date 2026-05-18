# מרכז פיקוד AI · C4I AI Command Center

ממשק ניהול יכולות AI במערכת שו"ב (Command, Control, Communications, Computers, Intelligence). מאפשר למפקד לתקשר עם מערכת AI אחת שמתאמת בין סוכנים מומחים (אש, מודיעין, אגם, אוויר, לוגיסטיקה, סייבר), לראות סטטוס משימות, להגדיר חוקי אוטומציה, ולנהל אזורי אחריות גיאוגרפיים — הכל מתוך חלון פיקוד אחד.

> **סטטוס:** עובד בשני מצבים — **Mock** (ברירת מחדל, ללא תלות חיצונית) או **Real LLM** (backend Node שמתווך לכל endpoint תואם OpenAI). UI יציב, backend בסיסי, אין persistence (state ב-React Context).

## תכולה
- [Quick Start](#quick-start)
- [Real LLM Mode](#real-llm-mode)
- [Tech Stack](#tech-stack)
- [מבנה התיקיות](#מבנה-התיקיות)
- [תיעוד מורחב](#תיעוד-מורחב)
- [תכונות עיקריות](#תכונות-עיקריות)

## Quick Start

```powershell
# התקנה (root + server)
npm install
npm --prefix server install

# הרצת dev server (frontend + backend במקביל)
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001

# build production
npm run build
```

זמן עד אפליקציה פעילה בדפדפן: **כדקה**. במצב ברירת מחדל אין צורך ב-API keys — האפליקציה רצה על mock responder. כדי להפעיל LLM אמיתי, ראה למטה.

## Real LLM Mode

האפליקציה תומכת בשני מצבי הפעלה (toggle דרך env):

### Mock (ברירת מחדל)
ה-frontend משתמש ב-`generateAIResponse` / `generateAgentResponse` הדטרמיניסטיים מ-`src/mock/`. אין צורך ב-backend, אין עלות, אין תלות חיצונית. מתאים להדגמות וצילומי מסך. ה-backend בכל זאת מתחיל יחד עם `npm run dev` אבל לא נקרא אלא אם ה-feature flag דולק.

### Real LLM (Backend Proxy)
תקשורת אמיתית עם LLM דרך שרת Node מקומי. תומך בכל endpoint תואם OpenAI:

```powershell
# 1. הגדר את ה-LLM provider
cp server/.env.example server/.env
# ערוך את server/.env עם:
#   LLM_BASE_URL=https://api.openai.com/v1   (או OpenRouter, Ollama, vLLM...)
#   LLM_API_KEY=sk-...
#   LLM_MODEL=gpt-4o-mini

# 2. הפעל את ה-frontend ב-real mode
cp .env.example .env
# ב-.env שנה: VITE_USE_REAL_LLM=true

# 3. הרץ
npm run dev
```

**ספקים נתמכים** (כל אחד עם base URL מתאים):
- **OpenAI**: `https://api.openai.com/v1`
- **OpenRouter** (גישה ל-Claude/Gemini/Llama): `https://openrouter.ai/api/v1`
- **Ollama** מקומי: `http://localhost:11434/v1`
- **vLLM / LM-Studio**: `http://localhost:8000/v1`
- כל endpoint תואם OpenAI Chat Completions API

**איך זה עובד**: ה-backend חושף `POST /api/chat` ו-`POST /api/agent-chat` שמחזירים SSE stream. ה-LLM מקבל system prompt עם snapshot של המצב הנוכחי + 7 tools (אחד לכל סוג MessageBlock). הוא מחויב (`tool_choice='required'`) לפלוט רק tool calls שמתורגמים לבלוקים בפרונט, שזורמים פנימה כשהם נוצרים.

**Fallback אוטומטי**: אם ה-backend לא נגיש או זורק שגיאה — ה-frontend חוזר אוטומטית ל-mock עם toast אזהרה. לא חוויה תקועה.

## Tech Stack

| תחום | בחירה | למה |
|------|--------|------|
| Framework (FE) | React 18 + TypeScript | type safety על מודלי הנתונים |
| Build (FE) | Vite | dev server מהיר, HMR |
| Styling | Tailwind CSS 3 + `tailwindcss-rtl` | utility-first, RTL native, theme דרך CSS vars |
| State | `useReducer` + Context | shallow + שקוף, ללא תלות חיצונית |
| Icons | lucide-react | קל, tree-shakeable |
| Helpers | `clsx` | מיזוג className מותנים |
| Backend | Express + TypeScript (ESM) | מינימלי, תואם OpenAI SDK |
| LLM SDK | `openai` (baseURL מותאם) | עובד עם כל endpoint תואם |
| Dev runner | `concurrently` | מריץ FE+BE במקביל |

**אין** router, store חיצוני, ORM, או DB. ה-backend stateless — ה-state נשאר ב-frontend ונשלח כ-snapshot עם כל בקשה.

## מבנה התיקיות

```
chat-ai-ui/
├── src/                        # ─── Frontend ───
│   ├── main.tsx                # entry point
│   ├── App.tsx                 # wrapper דק → AICommandCenter
│   ├── index.css               # tailwind + CSS variables (dark/light theme)
│   ├── vite-env.d.ts           # typing ל-VITE_USE_REAL_LLM וכו'
│   │
│   ├── state/                  # מודל נתונים + state management
│   │   ├── types.ts            # כל ה-interfaces (Agent, Task, Rule, MessageBlock, ...)
│   │   ├── reducer.ts          # ~40 actions וכל מעברי ה-state
│   │   └── AICommandContext.tsx # Provider + hook useAICommand + helpers (send*)
│   │
│   ├── mock/                   # נתוני התחלה + סימולטורי AI
│   │   ├── agents.ts           # 6 סוכנים עם config דיפולטי (style/perms/units/tools/boundary)
│   │   ├── tasks.ts            # ~22 משימות כולל רב-סוכניות
│   │   ├── rules.ts            # חוקי אוטומציה דוגמה
│   │   ├── entities.ts         # ישויות מפה
│   │   ├── conversations.ts    # שיחות היסטוריות
│   │   ├── aiResponder.ts      # סימולטור צ'אט ראשי לפי keywords
│   │   ├── agentResponder.ts   # סימולטור per-agent (קול הסוכן)
│   │   ├── ruleNLParser.ts     # parser שפה חופשית → AutomationRule
│   │   └── summaryGenerator.ts # generator של SummaryBlock מובנה
│   │
│   ├── services/
│   │   └── llmClient.ts        # SSE client ל-backend (streamMainChat / streamAgentChat)
│   │
│   └── components/ai-command/  # כל ה-UI components
│       ├── AICommandCenter.tsx # composition root
│       ├── shared.ts           # labels, tones, formatters, domain colors
│       ├── useContainerWidth.ts # ResizeObserver hook (responsive panels)
│       │
│       ├── layout/             # Header, Sidebar, StatusBar, ResizeHandle
│       ├── chat/               # ChatPanel + Message + 7 renderers
│       ├── agents/             # AgentsPanel + Card + TaskDrawer + AgentChatPanel + SettingsModal
│       ├── tasks/              # TasksPanel + TaskDetailsModal
│       ├── timeline/           # TimelinePanel (Gantt)
│       ├── automation/         # AutomationPanel + RuleCard + RuleEditor
│       ├── history/            # HistoryPanel
│       ├── map/                # MockMap (SVG) + AgentMapPopover + MapAgentLegend + MapPickerModal
│       └── ui/                 # primitives - Button, Card, Badge, Modal, Drawer, Toggle, ...
│
├── server/                     # ─── Backend (LLM proxy, optional) ───
│   ├── src/
│   │   ├── index.ts            # Express boot (CORS, health, routes)
│   │   ├── types.ts            # mirror של MessageBlock + context shapes
│   │   ├── routes/
│   │   │   ├── chat.ts         # POST /api/chat (main, SSE)
│   │   │   └── agentChat.ts    # POST /api/agent-chat (per-agent, SSE)
│   │   └── llm/
│   │       ├── client.ts       # OpenAI SDK עם baseURL מותאם
│   │       ├── tools.ts        # 7 JSON schemas + toolCallToBlock
│   │       ├── systemPrompts.ts # main + per-agent prompts
│   │       └── streamHandler.ts # tool_call streaming → SSE block events
│   ├── .env.example            # LLM_BASE_URL / LLM_API_KEY / LLM_MODEL / PORT
│   └── package.json
│
└── docs/                       # תיעוד מורחב
```

## תיעוד מורחב

| מסמך | למי | תוכן |
|------|------|------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | מפתחים | מפת קומפוננטות, data flow, backend, streaming |
| [docs/COMPONENTS.md](docs/COMPONENTS.md) | מפתחים | רפרנס לכל קומפוננטה |
| [docs/STATE.md](docs/STATE.md) | מפתחים | מבנה ה-state, כל ה-actions, דפוסי שימוש |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | מציגים / QA | walkthroughs מבצעיים לכל יכולת |

## תכונות עיקריות

- **צ'אט ראשי עם 7 סוגי תוכן** — text, table, action card, entity suggestion, quick actions, plan proposal, summary
- **Flow תכנון** — בקשה → AI בוחר סוכן + תתי-סוכנים → תוכנית מפורטת → אישור/עריכה → משימה
- **Plan Proposal משוכלל** — סוכן מתאם + multi-select תתי-סוכנים + צעדים עם זמני הערכה + תיחום אזור + תזמון
- **שיחה ישירה עם סוכן** — thread נפרד לכל סוכן, persona מבוססת config (signature/tone/units/tools)
- **משימות רב-סוכניות** — coordinator + sub-agents, מוצג ב-TimelinePanel + TasksPanel + AgentMapPopover
- **תקציר תקופה דינמי** — `SummaryBlock` עם KPIs, ציר אירועים, פעילות לפי סוכן, המלצות
- **TasksPanel** — KPI strip, סינון, קיבוץ לפי סטטוס, click-to-edit
- **TimelinePanel (Gantt)** — 4 רמות זום, "קו עכשיו", בלוקי משימות קליקביליים, תת-סוכנים כבר מקווקו
- **TaskDetailsModal** — view/edit/cancel מלא עם sidebar תמצית + form + מיני-מפה לעריכת geo
- **AgentSettingsModal** — 6 לשוניות (כללי / סגנון / הרשאות / יחידות / תיחום / כלים) עם תצוגה מקדימה חיה
- **חוקי אוטומציה** — מצב מובנה + מצב **שפה חופשית** (NL → structured), פאנל ניתוח לוגיקה כולל זיהוי התנגשויות
- **מפה אינטראקטיבית** — ישויות, אזורי פעילות סוכנים קליקביליים, popover תמצית, picker פוליגון/נקודה, scanline animation
- **תיחום אחריות לסוכן** עם הצגה במפה — picker אמיתי עם פוליגון נטען מראש
- **Layout** — 3 view modes, splitter גריר בין הפאנל למפה, theme dark/light עם CSS vars, RTL מלא
- **Responsiveness** — `useContainerWidth` hook לפאנלים שמגיבים לרוחב הפנימי, לא רק לעיוויפורט

## הרחבות עתידיות

- **Streaming token-level** בתוך text blocks (כעת כל block אטומי)
- **Persistence ל-SQLite/Postgres** — agents/tasks/rules על ה-backend
- **Tool calling אמיתי** שמשנה state (e.g. `create_task` כ-side effect ולא רק `emit_*`)
- **Auth** — כרגע יחיד-משתמש
- **החלפת MockMap ב-Leaflet/Mapbox** — החוזה עם entities/zones נשמר זהה, החלפה במקום אחד
