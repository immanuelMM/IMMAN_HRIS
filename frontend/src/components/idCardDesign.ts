import type { CardOrientation } from '../api/types'

/** Card dimensions in design units (px at 1x). Matches .id-card-scene / .id-print-card in index.css. */
export const CARD_SIZE: Record<CardOrientation, { w: number; h: number }> = {
  horizontal: { w: 320, h: 232 },
  vertical: { w: 240, h: 340 },
}

export type ShapeKind = 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'hexagon' | 'star' | 'line' | 'wave' | 'arch'

export interface BaseElement {
  id: string
  name?: string
  x: number
  y: number
  w: number
  h: number
  /** Degrees, clockwise. */
  rotation: number
  opacity: number
  locked?: boolean
  hidden?: boolean
}

export interface Fill {
  color: string
  /** When set, the fill is a linear gradient from `color` to `color2`. */
  color2?: string | null
  /** Gradient angle in degrees. */
  angle?: number
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shape: ShapeKind
  fill: Fill
  stroke: string
  strokeWidth: number
  /** Corner radius for rectangles. */
  radius: number
  flipX?: boolean
  flipY?: boolean
}

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export interface TextElement extends BaseElement {
  type: 'text'
  /** May contain placeholders like {{fullName}} — see TEXT_FIELDS. */
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  underline: boolean
  uppercase: boolean
  color: string
  align: TextAlign
  verticalAlign: VerticalAlign
  letterSpacing: number
  lineHeight: number
  /** -100..100. Non-zero bends the text along an arc (single line only). */
  curve: number
  strokeColor: string
  strokeWidth: number
  shadow: boolean
  shadowColor: string
  /** Optional highlight box behind the text. */
  background: string | null
  backgroundRadius: number
  /** Shrink text to stay on one line inside the box (good for long names). */
  autoFit: boolean
}

export type ImageMask = 'none' | 'rounded' | 'circle'

export interface ImageElement extends BaseElement {
  type: 'photo' | 'logo' | 'image'
  /** data: URL, only for type 'image'. */
  src?: string
  fit: 'cover' | 'contain'
  mask: ImageMask
  radius: number
  borderColor: string
  borderWidth: number
}

export interface QrElement extends BaseElement {
  type: 'qr'
  fgColor: string
  bgColor: string
  padding: number
  radius: number
}

export type DesignElement = ShapeElement | TextElement | ImageElement | QrElement

export interface CardSideDesign {
  background: Fill
  elements: DesignElement[]
}

export interface IdCardDesign {
  version: 1
  orientation: CardOrientation
  cornerRadius: number
  front: CardSideDesign
  back: CardSideDesign
}

export type CardSide = 'front' | 'back'

/** Values that can be merged into text elements via {{key}} placeholders. */
export interface DesignFieldValues {
  fullName: string
  position: string
  department: string
  employeeNo: string
  phone: string
  email: string
  address: string
}

export const TEXT_FIELDS: { key: keyof DesignFieldValues; label: string }[] = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'position', label: 'Position' },
  { key: 'department', label: 'Department' },
  { key: 'employeeNo', label: 'Employee No.' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'E-mail' },
  { key: 'address', label: 'Address' },
]

export const SAMPLE_FIELD_VALUES: DesignFieldValues = {
  fullName: 'Juan Dela Cruz',
  position: 'Line Leader',
  department: 'Production',
  employeeNo: 'EMP-00042',
  phone: '0917 123 4567',
  email: 'juan.delacruz@company.com',
  address: '123 Rizal St., Makati City',
}

export function fillTemplate(text: string, values: DesignFieldValues): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key as keyof DesignFieldValues] ?? '' : match,
  )
}

export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: "'Poppins', sans-serif", label: 'Poppins' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Roboto', sans-serif", label: 'Roboto' },
  { value: "'Oswald', sans-serif", label: 'Oswald' },
  { value: "'Bebas Neue', sans-serif", label: 'Bebas Neue' },
  { value: "'Playfair Display', serif", label: 'Playfair Display' },
  { value: "'Lora', serif", label: 'Lora' },
  { value: "'Dancing Script', cursive", label: 'Dancing Script' },
  { value: "'Pacifico', cursive", label: 'Pacifico' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier New' },
]

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

const BASE = { rotation: 0, opacity: 1 }

export function createShape(shape: ShapeKind, cx: number, cy: number, color: string): ShapeElement {
  const w = shape === 'line' ? 120 : shape === 'wave' || shape === 'arch' ? 200 : 80
  const h = shape === 'line' ? 4 : shape === 'wave' || shape === 'arch' ? 60 : 80
  return {
    ...BASE,
    id: newId(),
    type: 'shape',
    shape,
    x: Math.round(cx - w / 2),
    y: Math.round(cy - h / 2),
    w,
    h,
    fill: { color, color2: null, angle: 135 },
    stroke: '#1f2733',
    strokeWidth: 0,
    radius: 0,
  }
}

export function createText(cx: number, cy: number, text = 'Double-click to edit', overrides: Partial<TextElement> = {}): TextElement {
  const w = 180
  const h = 28
  return {
    ...BASE,
    id: newId(),
    type: 'text',
    x: Math.round(cx - w / 2),
    y: Math.round(cy - h / 2),
    w,
    h,
    text,
    fontFamily: FONT_OPTIONS[0].value,
    fontSize: 14,
    fontWeight: 600,
    italic: false,
    underline: false,
    uppercase: false,
    color: '#1f2733',
    align: 'center',
    verticalAlign: 'middle',
    letterSpacing: 0,
    lineHeight: 1.2,
    curve: 0,
    strokeColor: '#ffffff',
    strokeWidth: 0,
    shadow: false,
    shadowColor: '#000000',
    background: null,
    backgroundRadius: 4,
    autoFit: false,
    ...overrides,
  }
}

export function createImage(type: ImageElement['type'], cx: number, cy: number, src?: string): ImageElement {
  const size = type === 'logo' ? 40 : 90
  return {
    ...BASE,
    id: newId(),
    type,
    src,
    x: Math.round(cx - size / 2),
    y: Math.round(cy - size / 2),
    w: size,
    h: type === 'photo' ? Math.round(size * 1.15) : size,
    fit: type === 'logo' ? 'contain' : 'cover',
    mask: type === 'photo' ? 'rounded' : 'none',
    radius: 10,
    borderColor: '#ffffff',
    borderWidth: type === 'photo' ? 3 : 0,
  }
}

export function createQr(cx: number, cy: number): QrElement {
  const size = 110
  return {
    ...BASE,
    id: newId(),
    type: 'qr',
    x: Math.round(cx - size / 2),
    y: Math.round(cy - size / 2),
    w: size,
    h: size,
    fgColor: '#1f2733',
    bgColor: '#ffffff',
    padding: 6,
    radius: 6,
  }
}

/** A sensible starting layout so the designer never opens on a blank card. */
export function createStarterDesign(orientation: CardOrientation, primary: string, secondary: string | null): IdCardDesign {
  const { w, h } = CARD_SIZE[orientation]
  const accent: Fill = { color: primary, color2: secondary, angle: 135 }
  const vertical = orientation === 'vertical'

  const header: ShapeElement = { ...createShape('wave', w / 2, 0, primary), x: 0, y: 0, w, h: vertical ? 110 : 70, fill: accent, name: 'Header wave' }
  const logo: ImageElement = { ...createImage('logo', 0, 0), x: 12, y: 10, w: 26, h: 26 }
  const deptText = createText(0, 0, '{{department}}', {
    x: 44, y: 10, w: w - 56, h: 26, align: 'left', color: '#ffffff', fontSize: 13, fontWeight: 700, uppercase: true, letterSpacing: 1,
  })

  const front: DesignElement[] = vertical
    ? [
        header,
        logo,
        deptText,
        { ...createImage('photo', w / 2, 0), x: w / 2 - 50, y: 62, w: 100, h: 112, mask: 'circle' },
        createText(w / 2, 196, '{{fullName}}', { w: w - 24, x: 12, fontSize: 17, fontWeight: 800, autoFit: true }),
        createText(w / 2, 220, '{{position}}', { w: w - 24, x: 12, fontSize: 12, fontWeight: 500, color: primary }),
        createText(w / 2, 262, 'ID NO: {{employeeNo}}', { w: w - 24, x: 12, fontSize: 11, fontWeight: 600 }),
        createText(w / 2, 282, '{{phone}}', { w: w - 24, x: 12, fontSize: 10, fontWeight: 400 }),
        createText(w / 2, 300, '{{email}}', { w: w - 24, x: 12, fontSize: 10, fontWeight: 400, autoFit: true }),
        { ...createShape('rect', w / 2, h - 6, primary), x: 0, y: h - 12, w, h: 12, fill: accent, name: 'Footer bar' },
      ]
    : [
        header,
        logo,
        deptText,
        { ...createImage('photo', 0, 0), x: 18, y: 54, w: 92, h: 106 },
        createText(0, 0, '{{fullName}}', { x: 122, y: 82, w: 186, h: 26, align: 'left', fontSize: 17, fontWeight: 800, autoFit: true }),
        createText(0, 0, '{{position}}', { x: 122, y: 106, w: 186, h: 20, align: 'left', fontSize: 12, fontWeight: 500, color: primary }),
        createText(0, 0, 'ID NO: {{employeeNo}}', { x: 122, y: 134, w: 186, h: 18, align: 'left', fontSize: 10, fontWeight: 600 }),
        createText(0, 0, '{{phone}}', { x: 122, y: 150, w: 186, h: 18, align: 'left', fontSize: 10, fontWeight: 400 }),
        createText(0, 0, '{{email}}', { x: 122, y: 166, w: 186, h: 18, align: 'left', fontSize: 10, fontWeight: 400, autoFit: true }),
        { ...createShape('rect', w / 2, h - 12, primary), x: 0, y: h - 24, w, h: 24, fill: accent, name: 'Footer bar' },
        createText(0, 0, 'OFFICIAL EMPLOYEE ID', { x: 12, y: h - 22, w: w - 24, h: 20, color: '#ffffff', fontSize: 9, fontWeight: 700, letterSpacing: 2 }),
      ]

  const back: DesignElement[] = [
    { ...createShape('rect', w / 2, 0, primary), x: 0, y: 0, w, h: 30, fill: accent, name: 'Header bar' },
    createText(0, 0, 'SCAN FOR ATTENDANCE', { x: 12, y: 4, w: w - 24, h: 22, color: '#ffffff', fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }),
    { ...createQr(w / 2, vertical ? 150 : 104), w: vertical ? 140 : 110, h: vertical ? 140 : 110, x: w / 2 - (vertical ? 70 : 55), y: vertical ? 70 : 42 },
    createText(w / 2, vertical ? 248 : 176, 'Present this code to the admin scanner to clock in or out.', {
      w: w - 40, x: 20, h: 32, fontSize: 9, fontWeight: 400, color: '#4b5563',
    }),
    createText(w / 2, h - 16, '{{employeeNo}}', { w: w - 24, x: 12, fontSize: 10, fontWeight: 700 }),
  ]

  return {
    version: 1,
    orientation,
    cornerRadius: 14,
    front: { background: { color: '#fdfcf9', color2: null, angle: 180 }, elements: front },
    back: { background: { color: '#fdfcf9', color2: null, angle: 180 }, elements: back },
  }
}

export function parseDesign(raw: string | null | undefined): IdCardDesign | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as IdCardDesign
    if (!parsed || !parsed.front || !parsed.back) return null
    return parsed
  } catch {
    return null
  }
}

export function fillToCss(fill: Fill): string {
  return fill.color2 ? `linear-gradient(${fill.angle ?? 135}deg, ${fill.color}, ${fill.color2})` : fill.color
}

/**
 * Swap one department's team colors for another's throughout a design, so a shared
 * template picks up the brand of the department adopting it. Other colors are kept.
 */
export function recolorDesign(
  design: IdCardDesign,
  from: { primary: string | null; secondary: string | null },
  to: { primary: string | null; secondary: string | null },
): IdCardDesign {
  const map = new Map<string, string>()
  if (from.primary && to.primary) map.set(from.primary.toLowerCase(), to.primary)
  if (from.secondary && (to.secondary ?? to.primary)) map.set(from.secondary.toLowerCase(), (to.secondary ?? to.primary) as string)
  if (map.size === 0) return design

  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return map.get(value.toLowerCase()) ?? value
    if (Array.isArray(value)) return value.map(walk)
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'src' || k === 'text' ? v : walk(v)]))
    }
    return value
  }
  return walk(design) as IdCardDesign
}
