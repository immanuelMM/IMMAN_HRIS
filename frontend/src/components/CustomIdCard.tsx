import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { apiClient } from '../api/client'
import { getIdCardDesign } from '../api/departments'
import { getInitials } from '../utils/initials'
import type { IdCardPersonData } from './IdCardFace'
import {
  CARD_SIZE,
  fillTemplate,
  fillToCss,
  parseDesign,
  type CardSide,
  type DesignElement,
  type DesignFieldValues,
  type Fill,
  type IdCardDesign,
  type ImageElement,
  type QrElement,
  type ShapeElement,
  type TextElement,
} from './idCardDesign'

export interface CustomCardContext {
  values: DesignFieldValues
  photoUrl: string
  hasPhoto: boolean
  logoUrl: string
  hasLogo: boolean
  /** QR payload. In the designer a sample value is used. */
  token: string | null
  qrError?: string | null
}

/**
 * SVG gradient/path ids must be unique per document. Elements copied between departments
 * keep the same element ids, so every rendered card gets its own prefix.
 */
const SvgIdScope = createContext('')

export function SvgIdScopeProvider({ children }: { children: ReactNode }) {
  const scope = useId().replace(/:/g, '')
  return <SvgIdScope.Provider value={scope}>{children}</SvgIdScope.Provider>
}

/** Maps the data the classic templates use onto the custom designer's placeholders. */
export function idCardContext(
  data: IdCardPersonData,
  token: string | null,
  qrError: string | null = null,
): CustomCardContext {
  return {
    values: {
      fullName: data.fullName,
      position: data.roleOrPosition,
      department: data.departmentName,
      employeeNo: data.employeeNo,
      phone: data.contactNumber,
      email: data.email,
      address: data.address,
    },
    photoUrl: data.photoUrl,
    hasPhoto: data.hasPhoto,
    logoUrl: data.logoUrl,
    hasLogo: data.hasLogo,
    token,
    qrError,
  }
}

/** Fetches an authenticated API image (photo/logo) and returns an object URL for it. */
function useAuthImage(url: string, enabled: boolean): string | null {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !url) {
      setSrc(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    apiClient
      .get(url, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, enabled])

  return src
}

function SvgFillDef({ id, fill }: { id: string; fill: Fill }) {
  if (!fill.color2) return null
  // CSS angles start at "to top" (0deg); an unrotated SVG gradient runs left-to-right (CSS 90deg).
  return (
    <defs>
      <linearGradient id={id} gradientTransform={`rotate(${(fill.angle ?? 135) - 90}, 0.5, 0.5)`}>
        <stop offset="0%" stopColor={fill.color} />
        <stop offset="100%" stopColor={fill.color2} />
      </linearGradient>
    </defs>
  )
}

function starPoints(w: number, h: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.5 : 0.2
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${w / 2 + Math.cos(a) * r * w},${h / 2 + Math.sin(a) * r * h * 1.05 + h * 0.03}`)
  }
  return pts.join(' ')
}

function ShapeView({ el }: { el: ShapeElement }) {
  const { w, h } = el
  const gradId = `g-${useContext(SvgIdScope)}-${el.id}`
  const fill = el.fill.color2 ? `url(#${gradId})` : el.fill.color
  const common = {
    fill,
    stroke: el.strokeWidth > 0 ? el.stroke : 'none',
    strokeWidth: el.strokeWidth,
    vectorEffect: 'non-scaling-stroke' as const,
  }
  const sw = el.strokeWidth / 2

  let body
  switch (el.shape) {
    case 'ellipse':
      body = <ellipse cx={w / 2} cy={h / 2} rx={Math.max(0, w / 2 - sw)} ry={Math.max(0, h / 2 - sw)} {...common} />
      break
    case 'triangle':
      body = <polygon points={`${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}`} {...common} />
      break
    case 'diamond':
      body = <polygon points={`${w / 2},${sw} ${w - sw},${h / 2} ${w / 2},${h - sw} ${sw},${h / 2}`} {...common} />
      break
    case 'hexagon':
      body = (
        <polygon
          points={`${w * 0.25},${sw} ${w * 0.75},${sw} ${w - sw},${h / 2} ${w * 0.75},${h - sw} ${w * 0.25},${h - sw} ${sw},${h / 2}`}
          {...common}
        />
      )
      break
    case 'star':
      body = <polygon points={starPoints(w, h)} {...common} />
      break
    case 'wave':
      body = (
        <path d={`M0,0 H${w} V${h * 0.7} C${w * 0.72},${h * 0.3} ${w * 0.3},${h * 1.15} 0,${h * 0.62} Z`} {...common} />
      )
      break
    case 'arch':
      body = <path d={`M0,0 H${w} V${h * 0.55} Q${w / 2},${h * 1.45} 0,${h * 0.55} Z`} {...common} />
      break
    case 'line':
    case 'rect':
    default:
      body = (
        <rect
          x={sw}
          y={sw}
          width={Math.max(0, w - el.strokeWidth)}
          height={Math.max(0, h - el.strokeWidth)}
          rx={Math.min(el.radius, w / 2, h / 2)}
          {...common}
        />
      )
  }

  const flip =
    el.flipX || el.flipY
      ? `translate(${el.flipX ? w : 0} ${el.flipY ? h : 0}) scale(${el.flipX ? -1 : 1} ${el.flipY ? -1 : 1})`
      : undefined

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
      <SvgFillDef id={gradId} fill={el.fill} />
      <g transform={flip}>{body}</g>
    </svg>
  )
}

function fontString(el: TextElement, size: number) {
  return `${el.italic ? 'italic ' : ''}${el.fontWeight} ${size}px ${el.fontFamily}`
}

let measureCanvas: HTMLCanvasElement | null = null
function measureWidth(text: string, el: TextElement, size: number): number {
  measureCanvas ??= document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  if (!ctx) return 0
  ctx.font = fontString(el, size)
  return ctx.measureText(text).width + el.letterSpacing * text.length
}

/** Largest font size (up to el.fontSize) at which `text` fits on one line in the box. */
function useAutoFitSize(el: TextElement, text: string): number {
  const [fontsReady, setFontsReady] = useState(0)
  useEffect(() => {
    let alive = true
    document.fonts?.ready.then(() => alive && setFontsReady((n) => n + 1))
    return () => {
      alive = false
    }
  }, [])

  if (!el.autoFit || el.curve !== 0) return el.fontSize
  void fontsReady
  const available = el.w - 4
  const natural = measureWidth(text, el, el.fontSize)
  if (natural <= available || natural === 0) return el.fontSize
  return Math.max(4, Math.floor(el.fontSize * (available / natural) * 10) / 10)
}

function TextView({ el, values }: { el: TextElement; values: DesignFieldValues }) {
  let text = fillTemplate(el.text, values)
  if (el.uppercase) text = text.toUpperCase()
  const fontSize = useAutoFitSize(el, text)
  const scope = useContext(SvgIdScope)

  const shadowColor = /^#[0-9a-f]{6}$/i.test(el.shadowColor) ? `${el.shadowColor}66` : el.shadowColor
  const shadow = el.shadow ? `0 1px 3px ${shadowColor}` : undefined
  const decoration = el.underline ? 'underline' : undefined

  if (el.curve !== 0) {
    // Bend depth scales with the text's width so presets look similar at any size.
    const s = (el.curve / 100) * el.w * 0.25
    const baseY = el.h / 2 + fontSize * 0.35 + s / 2
    const anchor = el.align === 'left' ? 'start' : el.align === 'right' ? 'end' : 'middle'
    const offset = el.align === 'left' ? '0%' : el.align === 'right' ? '100%' : '50%'
    const pathId = `p-${scope}-${el.id}`
    return (
      <svg width={el.w} height={el.h} viewBox={`0 0 ${el.w} ${el.h}`} style={{ display: 'block', overflow: 'visible' }}>
        <path id={pathId} d={`M0,${baseY} Q${el.w / 2},${baseY - 2 * s} ${el.w},${baseY}`} fill="none" />
        <text
          fill={el.color}
          stroke={el.strokeWidth > 0 ? el.strokeColor : undefined}
          strokeWidth={el.strokeWidth > 0 ? el.strokeWidth : undefined}
          paintOrder="stroke"
          textAnchor={anchor}
          style={{
            fontFamily: el.fontFamily,
            fontSize,
            fontWeight: el.fontWeight,
            fontStyle: el.italic ? 'italic' : 'normal',
            letterSpacing: el.letterSpacing,
            textDecoration: decoration,
            filter: el.shadow ? `drop-shadow(0 1px 2px ${shadowColor})` : undefined,
          }}
        >
          <textPath href={`#${pathId}`} startOffset={offset}>
            {text}
          </textPath>
        </text>
      </svg>
    )
  }

  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: el.verticalAlign === 'top' ? 'flex-start' : el.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    textAlign: el.align,
    fontFamily: el.fontFamily,
    fontSize,
    fontWeight: el.fontWeight,
    fontStyle: el.italic ? 'italic' : 'normal',
    textDecoration: decoration,
    color: el.color,
    letterSpacing: el.letterSpacing,
    lineHeight: el.lineHeight,
    whiteSpace: el.autoFit ? 'nowrap' : 'pre-wrap',
    overflowWrap: 'anywhere',
    textShadow: shadow,
    WebkitTextStroke: el.strokeWidth > 0 ? `${el.strokeWidth}px ${el.strokeColor}` : undefined,
    paintOrder: 'stroke fill',
    background: el.background ?? undefined,
    borderRadius: el.background ? el.backgroundRadius : undefined,
    padding: el.background ? '0 4px' : undefined,
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
  return <div style={style}>{text}</div>
}

function imageRadius(el: ImageElement): string | number {
  if (el.mask === 'circle') return '50%'
  if (el.mask === 'rounded') return el.radius
  return 0
}

function ImageView({ el, ctx }: { el: ImageElement; ctx: CustomCardContext }) {
  const apiUrl = el.type === 'photo' ? ctx.photoUrl : el.type === 'logo' ? ctx.logoUrl : ''
  const enabled = el.type === 'photo' ? ctx.hasPhoto : el.type === 'logo' ? ctx.hasLogo : false
  const fetched = useAuthImage(apiUrl, enabled)
  const src = el.type === 'image' ? (el.src ?? null) : fetched

  const frame: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: imageRadius(el),
    border: el.borderWidth > 0 ? `${el.borderWidth}px solid ${el.borderColor}` : undefined,
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (src) {
    return (
      <div style={frame}>
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: el.fit,
            display: 'block',
          }}
        />
      </div>
    )
  }

  if (el.type === 'photo') {
    return (
      <div
        style={{
          ...frame,
          background: '#cbd5e1',
          color: '#475569',
          fontWeight: 700,
          fontSize: Math.min(el.w, el.h) * 0.32,
        }}
      >
        {getInitials(ctx.values.fullName)}
      </div>
    )
  }

  return (
    <div
      style={{
        ...frame,
        background: 'rgba(148,163,184,0.25)',
        color: '#64748b',
        fontSize: Math.max(8, Math.min(el.w, el.h) * 0.22),
      }}
    >
      {el.type === 'logo' ? 'LOGO' : 'IMAGE'}
    </div>
  )
}

function QrView({ el, ctx }: { el: QrElement; ctx: CustomCardContext }) {
  const size = Math.max(10, Math.min(el.w, el.h) - el.padding * 2)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: el.bgColor,
        borderRadius: el.radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {ctx.qrError ? (
        <span style={{ color: '#d64545', fontSize: 9, textAlign: 'center' }}>{ctx.qrError}</span>
      ) : ctx.token ? (
        <QRCodeSVG value={ctx.token} size={size} level="M" fgColor={el.fgColor} bgColor={el.bgColor} />
      ) : (
        <span style={{ color: '#64748b', fontSize: 9 }}>Loading QR...</span>
      )}
    </div>
  )
}

/** Renders an element's content filling its own box; positioning is up to the caller. */
export function ElementView({ el, ctx }: { el: DesignElement; ctx: CustomCardContext }) {
  switch (el.type) {
    case 'shape':
      return <ShapeView el={el} />
    case 'text':
      return <TextView el={el} values={ctx.values} />
    case 'qr':
      return <QrView el={el} ctx={ctx} />
    default:
      return <ImageView el={el} ctx={ctx} />
  }
}

export function elementBoxStyle(el: DesignElement): CSSProperties {
  return {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity,
  }
}

/** Static (non-interactive) rendering of one side of a custom card, scaled to fit its parent's width. */
export function CustomCardSide({
  design,
  side,
  ctx,
}: {
  design: IdCardDesign
  side: CardSide
  ctx: CustomCardContext
}) {
  const { w, h } = CARD_SIZE[design.orientation]
  const sideDesign = design[side]
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // The card is laid out in design units; scale it if the container is narrower (e.g. on phones).
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const update = () => setScale(host.clientWidth > 0 ? host.clientWidth / w : 1)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(host)
    return () => ro.disconnect()
  }, [w])

  return (
    <SvgIdScopeProvider>
      <div ref={hostRef} className="custom-card-host">
        <div
          className="custom-card-surface"
          style={{
            width: w,
            height: h,
            background: fillToCss(sideDesign.background),
            transform: `scale(${scale})`,
          }}
        >
          {sideDesign.elements
            .filter((el) => !el.hidden)
            .map((el) => (
              <div key={el.id} style={elementBoxStyle(el)}>
                <ElementView el={el} ctx={ctx} />
              </div>
            ))}
        </div>
      </div>
    </SvgIdScopeProvider>
  )
}

/** Loads saved custom designs for the given departments (null = none saved / failed to load). */
export function useDepartmentDesigns(departmentIds: number[]): Record<number, IdCardDesign | null> {
  const [designs, setDesigns] = useState<Record<number, IdCardDesign | null>>({})
  const key = [...new Set(departmentIds)].sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (!key) return
    let cancelled = false
    const ids = key.split(',').map(Number)
    Promise.all(
      ids.map((id) =>
        getIdCardDesign(id)
          .then((r) => parseDesign(r.design))
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return
      const map: Record<number, IdCardDesign | null> = {}
      ids.forEach((id, i) => {
        map[id] = results[i]
      })
      setDesigns(map)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  return designs
}
