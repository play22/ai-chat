import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * One tool per MessageBlock variant. The LLM is forced (tool_choice="required")
 * to emit ONLY tool calls — never free text. Each tool call becomes one block
 * appended to the assistant message.
 *
 * Schemas are intentionally permissive (additionalProperties: false but loose
 * typing) — overly strict schemas trip up smaller models. We validate again
 * in streamHandler before forwarding to the frontend.
 */
export const blockTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'emit_text',
      description:
        'הצג פסקת טקסט פשוטה. השתמש לחיווי, הסבר, או תשובה כללית. אל תשים בתוך טבלאות או כרטיסים.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: { text: { type: 'string', description: 'טקסט בעברית, ניתן לכלול שורות חדשות.' } },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_table',
      description:
        'הצג טבלת תוצאות מובנית. השתמש כשמציגים סטטוס סוכנים, רשימת משימות, או נתונים מספריים שכדאי להציג בעמודות.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                align: { type: 'string', enum: ['start', 'end', 'center'] },
              },
              required: ['key', 'label'],
            },
          },
          rows: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
            description: 'כל row הוא אובייקט עם המפתחות של columns.',
          },
        },
        required: ['columns', 'rows'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_action_card',
      description:
        'הצג כרטיס פעולה דורש החלטה. השתמש כשמופיע איום, התרעה, או אירוע שהמפקד צריך לאשר/לדחות/להסלים.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          actions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                variant: { type: 'string', enum: ['primary', 'ghost', 'danger'] },
              },
              required: ['id', 'label', 'variant'],
            },
          },
        },
        required: ['title', 'description', 'severity', 'actions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_entity_suggestion',
      description:
        'הצע למפקד להוסיף ישות חדשה למפה (איום פוטנציאלי, יחידה זוהתה, נקודת עניין). הוא יוכל לאשר/לערוך מיקום/לדחות.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          rationale: { type: 'string', description: 'למה הוצעה הישות?' },
          entity: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string', enum: ['threat', 'asset', 'unit', 'poi'] },
              label: { type: 'string' },
              position: {
                type: 'object',
                additionalProperties: false,
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                required: ['x', 'y'],
                description: 'קואורדינטות באחוזים 0..100 (לא lat/lon — המפה היא ויז\'ואל יחסית).',
              },
            },
            required: ['type', 'label', 'position'],
          },
        },
        required: ['rationale', 'entity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_quick_actions',
      description: 'הצע 2-4 פעולות מהירות שהמפקד יכול ללחוץ עליהן כדי להמשיך את השיחה.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          actions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string', description: 'הטקסט על הכפתור (קצר).' },
                prompt: { type: 'string', description: 'ה-prompt המלא שיישלח אם המפקד ילחץ.' },
              },
              required: ['label', 'prompt'],
            },
            minItems: 2,
            maxItems: 4,
          },
        },
        required: ['actions'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_plan_proposal',
      description:
        'הצג תוכנית פעולה מפורטת לאישור. השתמש כשהמפקד מבקש "תכנן/שגר/הפעל/בצע" משהו. אל תיצור משימה ישירות — המפקד יאשר.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          agentId: { type: 'string', description: 'ID של סוכן המתאם/האחראי. חייב להיות מתוך הסוכנים הקיימים.' },
          subAgentIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs של תתי-סוכנים — רק אם הפעולה רב-זרועית.',
          },
          reasoning: { type: 'string', description: 'למה הסוכן הזה נבחר, ולמה התוכנית הזו?' },
          title: { type: 'string' },
          description: { type: 'string' },
          scheduledFor: {
            type: 'string',
            description: 'ISO datetime אם המפקד ביקש שעה ספציפית. השאר ריק אם מיידי.',
          },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                estMinutes: { type: 'number' },
                detail: { type: 'string' },
              },
              required: ['id', 'title', 'estMinutes'],
            },
            minItems: 2,
          },
          geo: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string' },
              kind: { type: 'string', enum: ['area', 'point'] },
              area: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: { x: { type: 'number' }, y: { type: 'number' } },
                  required: ['x', 'y'],
                },
              },
              point: {
                type: 'object',
                additionalProperties: false,
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                required: ['x', 'y'],
              },
            },
            required: ['label', 'kind'],
          },
        },
        required: ['agentId', 'reasoning', 'title', 'priority', 'steps'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'emit_summary',
      description:
        'הצג תקציר תקופה מובנה (KPIs, ציר אירועים, פעילות לפי סוכן, תובנות, המלצות). השתמש לבקשות "סכם/תקציר/דו"ח".',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          periodLabel: { type: 'string' },
          rangeStart: { type: 'string', description: 'ISO datetime' },
          rangeEnd: { type: 'string', description: 'ISO datetime' },
          metrics: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                value: { type: ['number', 'string'] },
                tone: { type: 'string', enum: ['neutral', 'success', 'warn', 'danger', 'info'] },
                delta: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    direction: { type: 'string', enum: ['up', 'down', 'flat'] },
                    pct: { type: 'number' },
                    vsLabel: { type: 'string' },
                  },
                  required: ['direction', 'vsLabel'],
                },
              },
              required: ['key', 'label', 'value'],
            },
          },
          events: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                timestamp: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                agentId: { type: 'string' },
                severity: { type: 'string', enum: ['info', 'success', 'warn', 'critical'] },
              },
              required: ['id', 'timestamp', 'title', 'severity'],
            },
          },
          agentActivity: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                agentId: { type: 'string' },
                tasksCompleted: { type: 'number' },
                tasksFailed: { type: 'number' },
                tasksInProgress: { type: 'number' },
                alertsHandled: { type: 'number' },
              },
              required: ['agentId', 'tasksCompleted', 'tasksFailed', 'tasksInProgress', 'alertsHandled'],
            },
          },
          highlights: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'periodLabel', 'rangeStart', 'rangeEnd', 'metrics', 'events', 'agentActivity', 'highlights'],
      },
    },
  },
];

/** Map a tool call name + parsed args into a MessageBlock with the `kind` field. */
export function toolCallToBlock(name: string, args: any): any | null {
  const kindMap: Record<string, string> = {
    emit_text: 'text',
    emit_table: 'table',
    emit_action_card: 'action_card',
    emit_entity_suggestion: 'entity_suggestion',
    emit_quick_actions: 'quick_actions',
    emit_plan_proposal: 'plan_proposal',
    emit_summary: 'summary',
  };
  const kind = kindMap[name];
  if (!kind) return null;

  // Special handling for entity_suggestion — fill in defaults the schema doesn't include
  if (kind === 'entity_suggestion') {
    return {
      kind,
      rationale: args.rationale,
      entity: {
        ...args.entity,
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'suggested',
        source: 'ai_suggestion',
      },
    };
  }
  return { kind, ...args };
}
