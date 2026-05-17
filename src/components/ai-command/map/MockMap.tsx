import { useState, useRef, useMemo } from 'react';
import clsx from 'clsx';
import { Crosshair, Target, Plane, MapPin, AlertTriangle, Layers, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import type { MapEntity, EntityType, GeoContext } from '../../../state/types';
import { useAICommand } from '../../../state/AICommandContext';
import { entityTypeColor, entityTypeLabel } from '../shared';
import { IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AgentMapPopover } from './AgentMapPopover';

interface Props {
  entities?: MapEntity[];
  height?: number | string;
  miniature?: boolean;
  highlightEntityId?: string;
  onMapClick?: (pos: { x: number; y: number }) => void;
  pickerMode?: 'point' | 'polygon' | null;
  polygonPoints?: { x: number; y: number }[];
  selectedPoint?: { x: number; y: number } | null;
  className?: string;
  showControls?: boolean;
  showAgentZones?: boolean;
  highlightAgentId?: string | null;
  previewGeo?: { geo: GeoContext; agentDomain: string; label?: string } | null;
}

const entityIcon = (t: EntityType, size = 14) => {
  if (t === 'threat') return <AlertTriangle size={size} />;
  if (t === 'unit') return <Plane size={size} />;
  if (t === 'asset') return <Target size={size} />;
  return <MapPin size={size} />;
};

export function MockMap({
  entities,
  height = '100%',
  miniature,
  highlightEntityId,
  onMapClick,
  pickerMode,
  polygonPoints = [],
  selectedPoint = null,
  className,
  showControls = true,
  showAgentZones = false,
  highlightAgentId = null,
  previewGeo = null,
}: Props) {
  const { state } = useAICommand();
  const allEntities = entities ?? state.entities;
  const containerRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<{ agentId: string; zoneLabel: string; x: number; y: number } | null>(null);

  const interactiveZones = !miniature && showAgentZones && !pickerMode && !onMapClick;

  // Domain colors (kept inline to avoid extra imports)
  const domainHex: Record<string, string> = {
    fire: '#ef4444',
    intel: '#60a5fa',
    water: '#3b82f6',
    air: '#5ce1a4',
    logistics: '#f5a524',
    cyber: '#a78bfa',
  };
  const domainName: Record<string, string> = {
    fire: 'אש',
    intel: 'מודיעין',
    water: 'אגם',
    air: 'אוויר',
    logistics: 'לוגיסטיקה',
    cyber: 'סייבר',
  };

  const activeAgentTasks = showAgentZones
    ? state.tasks.filter(
        (t) =>
          (t.status === 'in_progress' || t.status === 'planned' || t.status === 'pending') &&
          t.geo,
      )
    : [];
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick({ x, y });
  };

  const terrainPath = useMemo(
    () =>
      'M0,55 C15,40 25,60 40,50 C55,40 65,65 80,55 C90,48 100,60 100,60 L100,100 L0,100 Z',
    [],
  );

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative overflow-hidden bg-bg-sunken border border-panel-border rounded-[6px]',
        className,
      )}
      style={{ height }}
      onClick={() => setPopover(null)}
    >
      {/* scanline */}
      {!miniature && (
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-scan-line pointer-events-none z-10" />
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={clsx('w-full h-full', (pickerMode || onMapClick) && 'cursor-crosshair')}
        onClick={handleClick}
      >
        {/* base */}
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M5,0 L0,0 L0,5" fill="none" style={{ stroke: 'var(--map-grid)' }} strokeWidth="0.15" />
          </pattern>
          <pattern id="gridMajor" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20,0 L0,0 L0,20" fill="none" style={{ stroke: 'var(--map-grid-major)' }} strokeWidth="0.25" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" style={{ stopColor: 'var(--map-vignette)' }} />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" style={{ fill: 'var(--map-bg)' }} />
        <rect x="0" y="0" width="100" height="100" fill="url(#grid)" />
        <rect x="0" y="0" width="100" height="100" fill="url(#gridMajor)" />

        {/* terrain: water + ridge */}
        <path d={terrainPath} style={{ fill: 'var(--map-water)', stroke: 'var(--map-water-stroke)' }} strokeWidth="0.2" />
        <path
          d="M10,30 Q25,20 35,28 T55,32 T80,28"
          fill="none"
          style={{ stroke: 'var(--map-ridge)' }}
          strokeWidth="0.3"
          strokeDasharray="1,0.5"
        />
        {/* compass */}
        {!miniature && (
          <g transform="translate(8 8)">
            <circle r="3.5" fill="none" style={{ stroke: 'var(--map-compass)' }} strokeWidth="0.2" />
            <text x="0" y="-4.2" fontSize="2.2" textAnchor="middle" style={{ fill: 'var(--map-compass-text)' }}>
              N
            </text>
            <line x1="0" y1="0" x2="0" y2="-3" style={{ stroke: 'rgb(var(--accent))' }} strokeWidth="0.3" />
          </g>
        )}

        {/* sectors labels */}
        {!miniature && (
          <>
            <text x="25" y="14" fontSize="2" style={{ fill: 'var(--map-sector-text)' }} textAnchor="middle">
              גזרה צפונית
            </text>
            <text x="75" y="14" fontSize="2" style={{ fill: 'var(--map-sector-text)' }} textAnchor="middle">
              גזרה צפון-מזרח
            </text>
            <text x="50" y="88" fontSize="2" style={{ fill: 'var(--map-sector-text)' }} textAnchor="middle">
              גזרה דרומית
            </text>
            <line x1="50" y1="5" x2="50" y2="95" style={{ stroke: 'var(--map-sector-line)' }} strokeWidth="0.15" strokeDasharray="0.5,0.5" />
            <line x1="5" y1="50" x2="95" y2="50" style={{ stroke: 'var(--map-sector-line)' }} strokeWidth="0.15" strokeDasharray="0.5,0.5" />
          </>
        )}

        {/* polygon picker preview */}
        {polygonPoints.length > 0 && (
          <>
            <polygon
              points={polygonPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              style={{ fill: 'rgb(var(--accent) / 0.12)', stroke: 'rgb(var(--accent))' }}
              strokeWidth="0.3"
              strokeDasharray="0.8,0.4"
            />
            {polygonPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="0.7" style={{ fill: 'rgb(var(--accent))', stroke: 'var(--map-bg)' }} strokeWidth="0.15" />
            ))}
          </>
        )}
        {selectedPoint && (
          <g transform={`translate(${selectedPoint.x} ${selectedPoint.y})`}>
            <circle r="1.4" style={{ fill: 'rgb(var(--accent))', stroke: 'var(--map-bg)' }} strokeWidth="0.3" />
            <circle r="3" fill="none" style={{ stroke: 'rgb(var(--accent))' }} strokeWidth="0.25" opacity="0.6">
              <animate attributeName="r" from="1.5" to="4" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* agent operating zones */}
        {showAgentZones &&
          activeAgentTasks.map((t) => {
            const agent = state.agents.find((a) => a.id === t.agentId);
            if (!agent || !t.geo) return null;
            const color = domainHex[agent.domain] ?? '#5ce1a4';
            const dim = highlightAgentId && highlightAgentId !== agent.id;
            const planned = t.status === 'planned';
            const handleZoneClick = (e: React.MouseEvent) => {
              if (!interactiveZones) return;
              e.stopPropagation();
              const rect = containerRef.current!.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setPopover({ agentId: agent.id, zoneLabel: t.geo!.label, x, y });
            };
            if (t.geo.kind === 'area' && t.geo.area) {
              const pts = t.geo.area.map((p) => `${p.x},${p.y}`).join(' ');
              const cx = t.geo.area.reduce((s, p) => s + p.x, 0) / t.geo.area.length;
              const cy = t.geo.area.reduce((s, p) => s + p.y, 0) / t.geo.area.length;
              return (
                <g
                  key={t.id}
                  opacity={dim ? 0.25 : 1}
                  onClick={handleZoneClick}
                  style={{ cursor: interactiveZones ? 'pointer' : undefined }}
                  className={interactiveZones ? 'hover:brightness-125' : ''}
                >
                  <polygon
                    points={pts}
                    fill={color}
                    fillOpacity={planned ? 0.05 : 0.1}
                    stroke={color}
                    strokeWidth={highlightAgentId === agent.id ? 0.5 : 0.3}
                    strokeDasharray={planned ? '1,0.6' : undefined}
                  />
                  <g transform={`translate(${cx} ${cy})`} style={{ pointerEvents: 'none' }}>
                    <rect x="-8" y="-2" width="16" height="2.6" rx="0.5" style={{ fill: 'var(--map-zone-text-bg)' }} stroke={color} strokeWidth="0.15" />
                    <text x="0" y="-0.2" fontSize="1.5" fill={color} textAnchor="middle" fontWeight="600">
                      {domainName[agent.domain]} · {t.geo.label}
                    </text>
                  </g>
                </g>
              );
            }
            if (t.geo.kind === 'point' && t.geo.point) {
              return (
                <g
                  key={t.id}
                  transform={`translate(${t.geo.point.x} ${t.geo.point.y})`}
                  opacity={dim ? 0.25 : 1}
                  onClick={handleZoneClick}
                  style={{ cursor: interactiveZones ? 'pointer' : undefined }}
                >
                  <circle r="3.5" fill="none" stroke={color} strokeWidth="0.25" opacity="0.4" style={{ pointerEvents: 'none' }}>
                    <animate attributeName="r" from="2" to="5" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle r="3.5" fill="transparent" />
                  <circle r="1.5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.3" strokeDasharray={planned ? '0.5,0.3' : undefined} style={{ pointerEvents: 'none' }} />
                  <text x="0" y="-2.5" fontSize="1.3" fill={color} textAnchor="middle" fontWeight="600" style={{ pointerEvents: 'none' }}>
                    {domainName[agent.domain]}
                  </text>
                </g>
              );
            }
            return null;
          })}

        {/* preview geo (for plan proposals - not yet a real task) */}
        {previewGeo && (() => {
          const color = domainHex[previewGeo.agentDomain] ?? '#5ce1a4';
          if (previewGeo.geo.kind === 'area' && previewGeo.geo.area) {
            const pts = previewGeo.geo.area.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <g>
                <polygon
                  points={pts}
                  fill={color}
                  fillOpacity="0.18"
                  stroke={color}
                  strokeWidth="0.6"
                  strokeDasharray="1.2,0.6"
                >
                  <animate attributeName="stroke-opacity" from="0.6" to="1" dur="1.8s" repeatCount="indefinite" />
                </polygon>
              </g>
            );
          }
          if (previewGeo.geo.kind === 'point' && previewGeo.geo.point) {
            return (
              <g transform={`translate(${previewGeo.geo.point.x} ${previewGeo.geo.point.y})`}>
                <circle r="5" fill="none" stroke={color} strokeWidth="0.3" opacity="0.5">
                  <animate attributeName="r" from="2" to="7" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle r="2" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="0.4" />
              </g>
            );
          }
          return null;
        })()}

        {/* entities */}
        {allEntities.map((e) => {
          const color = entityTypeColor[e.type];
          const isSuggested = e.status === 'suggested';
          const isHighlighted = highlightEntityId === e.id;
          const r = miniature ? 1.6 : isHighlighted ? 2.6 : 2;
          return (
            <g
              key={e.id}
              transform={`translate(${e.position.x} ${e.position.y})`}
              onMouseEnter={() => setHovered(e.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {(isHighlighted || hovered === e.id) && (
                <circle r={r + 2} fill="none" stroke={color} strokeWidth="0.25" opacity="0.5">
                  <animate attributeName="r" from={r + 1} to={r + 3} dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={r} fill={isSuggested ? 'transparent' : color} stroke={color} strokeWidth="0.4" strokeDasharray={isSuggested ? '0.6,0.4' : undefined} />
              {!miniature && (
                <text x="0" y={r + 2.2} fontSize="1.6" style={{ fill: 'var(--map-entity-text)' }} textAnchor="middle">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        <rect x="0" y="0" width="100" height="100" fill="url(#vignette)" pointerEvents="none" />
      </svg>

      {/* controls */}
      {showControls && !miniature && (
        <div className="absolute top-2 end-2 flex flex-col gap-1">
          <IconButton size="xs" variant="subtle" aria-label="הגדל">
            <ZoomIn size={12} />
          </IconButton>
          <IconButton size="xs" variant="subtle" aria-label="הקטן">
            <ZoomOut size={12} />
          </IconButton>
          <IconButton size="xs" variant="subtle" aria-label="שכבות">
            <Layers size={12} />
          </IconButton>
          <IconButton size="xs" variant="subtle" aria-label="צפון">
            <Compass size={12} />
          </IconButton>
        </div>
      )}

      {/* legend / coordinates */}
      {!miniature && (
        <div className="absolute bottom-2 start-2 flex items-center gap-2 text-2xs font-mono text-text-dim bg-bg-sunken/70 px-2 py-1 rounded border border-panel-border">
          <Crosshair size={10} /> 34.7°N · 32.1°E
        </div>
      )}
      {interactiveZones && activeAgentTasks.length > 0 && !popover && (
        <div className="absolute bottom-2 start-1/2 -translate-x-1/2 text-2xs text-text-faint bg-bg-sunken/70 px-2.5 py-1 rounded border border-panel-border pointer-events-none">
          💡 לחץ על אזור פעילות כדי לראות תמצית
        </div>
      )}

      {/* hovered label */}
      {!miniature && hovered && (
        <div className="absolute top-2 start-2 bg-bg-sunken/90 border border-panel-border rounded px-2 py-1 text-2xs flex items-center gap-2">
          {entityIcon(allEntities.find((e) => e.id === hovered)!.type, 10)}
          <span className="text-text">{allEntities.find((e) => e.id === hovered)!.label}</span>
          <Badge tone="neutral">{entityTypeLabel[allEntities.find((e) => e.id === hovered)!.type]}</Badge>
        </div>
      )}

      {/* Agent zone popover */}
      {popover && (
        <AgentMapPopover
          agentId={popover.agentId}
          zoneLabel={popover.zoneLabel}
          x={popover.x}
          y={popover.y}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
