import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { ElementView, elementBoxStyle, type CustomCardContext } from '../../components/CustomIdCard'
import {
  CARD_SIZE,
  FONT_OPTIONS,
  SAMPLE_FIELD_VALUES,
  TEXT_FIELDS,
  createImage,
  createQr,
  createShape,
  createStarterDesign,
  createText,
  fillToCss,
  newId,
  parseDesign,
  type CardSide,
  type DesignElement,
  type DesignFieldValues,
  type Fill,
  type IdCardDesign,
  type ImageElement,
  type QrElement,
  type ShapeElement,
  type ShapeKind,
  type TextElement,
} from '../../components/idCardDesign'
import { getIdCardDesign, listDepartments, saveIdCardDesign } from '../../api/departments'
import type { CardOrientation, Department } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

const SHAPES: { kind: ShapeKind; label: string; icon: string }[] = [
  { kind: 'rect', label: 'Rectangle', icon: 'M3 5h18v14H3z' },
  { kind: 'ellipse', label: 'Circle', icon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z' },
  { kind: 'triangle', label: 'Triangle', icon: 'M12 3l9 18H3z' },
  { kind: 'diamond', label: 'Diamond', icon: 'M12 2l10 10-10 10L2 12z' },
  { kind: 'hexagon', label: 'Hexagon', icon: 'M7 3h10l5 9-5 9H7l-5-9z' },
  { kind: 'star', label: 'Star', icon: 'M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z' },
  { kind: 'line', label: 'Line', icon: 'M2 11h20v2H2z' },
  { kind: 'wave', label: 'Wave', icon: 'M2 4h20v10c-5-6-12 8-20 2z' },
  { kind: 'arch', label: 'Arch', icon: 'M2 4h20v7c-5 9-15 9-20 0z' },
]

const BASE_SWATCHES = ['#ffffff', '#1f2733', '#64748b', '#d64545', '#f59e0b', '#16a34a', '#0d9488', '#2563eb', '#7c3aed', '#db2777']

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const HANDLES: { h: Handle; dx: -1 | 0 | 1; dy: -1 | 0 | 1 }[] = [
  { h: 'nw', dx: -1, dy: -1 },
  { h: 'n', dx: 0, dy: -1 },
  { h: 'ne', dx: 1, dy: -1 },
  { h: 'e', dx: 1, dy: 0 },
  { h: 'se', dx: 1, dy: 1 },
  { h: 's', dx: 0, dy: 1 },
  { h: 'sw', dx: -1, dy: 1 },
  { h: 'w', dx: -1, dy: 0 },
]

type DragState =
  | { mode: 'move'; id: string; startX: number; startY: number; orig: DesignElement; before: IdCardDesign; moved: boolean }
  | { mode: 'resize'; id: string; startX: number; startY: number; orig: DesignElement; before: IdCardDesign; dx: number; dy: number; moved: boolean }
  | { mode: 'rotate'; id: string; cx: number; cy: number; before: IdCardDesign; moved: boolean }

interface Guides {
  v: number[]
  h: number[]
}

type MobileTab = 'add' | 'edit' | 'layers'

const MOBILE_QUERY = '(max-width: 760px)'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}

const SNAP = 5
const MIN_SIZE = 4

function round(n: number) {
  return Math.round(n * 10) / 10
}

function isHex(v: string) {
  return /^#[0-9a-f]{6}$/i.test(v)
}

/** Downscale an uploaded picture so the design JSON stays small. */
function readImageFile(file: File, maxSide = 800): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Not a valid image.'))
      img.onload = () => {
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
        const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
        resolve({ src: canvas.toDataURL(type, 0.85), w: img.width, h: img.height })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function IdCardDesignerPage() {
  const { id } = useParams()
  const departmentId = Number(id)

  const [department, setDepartment] = useState<Department | null>(null)
  const [design, setDesignState] = useState<IdCardDesign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [dirty, setDirty] = useState(false)

  const [side, setSide] = useState<CardSide>('front')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(2)
  const [showFieldNames, setShowFieldNames] = useState(false)
  const [guides, setGuides] = useState<Guides>({ v: [], h: [] })
  const [mobileTab, setMobileTab] = useState<MobileTab>('add')
  const isMobile = useIsMobile()

  const designRef = useRef<IdCardDesign | null>(null)
  const past = useRef<IdCardDesign[]>([])
  const future = useRef<IdCardDesign[]>([])
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null)
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 })
  const dragRef = useRef<DragState | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const clipboard = useRef<DesignElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const replaceImageRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!departmentId) return
    Promise.all([listDepartments(), getIdCardDesign(departmentId)])
      .then(([depts, res]) => {
        const dept = depts.find((d) => d.id === departmentId) ?? null
        setDepartment(dept)
        const initial =
          parseDesign(res.design) ??
          createStarterDesign(res.cardOrientation, dept?.teamColor ?? '#0d9488', dept?.teamColorSecondary ?? null)
        designRef.current = initial
        setDesignState(initial)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load ID design.')))
      .finally(() => setLoading(false))
  }, [departmentId])

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  /** Replace the design without touching history (used during live drags). */
  const setLive = useCallback((next: IdCardDesign) => {
    designRef.current = next
    setDesignState(next)
    setDirty(true)
  }, [])

  /** Commit a change as an undoable step. Rapid edits sharing a coalesce key merge into one step. */
  const commit = useCallback(
    (next: IdCardDesign, coalesceKey?: string, before?: IdCardDesign) => {
      const prev = before ?? designRef.current
      const now = Date.now()
      const merge = coalesceKey && lastCoalesce.current?.key === coalesceKey && now - lastCoalesce.current.at < 800
      if (prev && !merge) {
        past.current.push(prev)
        if (past.current.length > 100) past.current.shift()
      }
      future.current = []
      lastCoalesce.current = coalesceKey ? { key: coalesceKey, at: now } : null
      setLive(next)
      setHistoryCounts({ undo: past.current.length, redo: future.current.length })
    },
    [setLive],
  )

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev || !designRef.current) return
    future.current.push(designRef.current)
    lastCoalesce.current = null
    setLive(prev)
    setHistoryCounts({ undo: past.current.length, redo: future.current.length })
  }, [setLive])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next || !designRef.current) return
    past.current.push(designRef.current)
    lastCoalesce.current = null
    setLive(next)
    setHistoryCounts({ undo: past.current.length, redo: future.current.length })
  }, [setLive])

  const orientation = design?.orientation
  const fitZoom = useCallback(() => {
    const box = scrollRef.current
    if (!box || !orientation) return
    const { w, h } = CARD_SIZE[orientation]
    const mobile = window.matchMedia(MOBILE_QUERY).matches
    // On phones the card stays pinned above the tools, so it gets a smaller share of the height.
    const pad = mobile ? 30 : 80
    const fit = Math.min((box.clientWidth - pad) / w, (window.innerHeight * (mobile ? 0.38 : 0.7)) / h, 3)
    setZoom(Math.max(0.5, Math.floor(fit * 20) / 20))
  }, [orientation])

  // Fit the card to the canvas when the designer opens or the orientation changes.
  useLayoutEffect(fitZoom, [fitZoom])

  const elements = design?.[side].elements ?? []
  const selected = elements.find((el) => el.id === selectedId) ?? null
  const cardSize = design ? CARD_SIZE[design.orientation] : CARD_SIZE.horizontal

  const withElements = useCallback(
    (fn: (els: DesignElement[]) => DesignElement[], base?: IdCardDesign): IdCardDesign | null => {
      const d = base ?? designRef.current
      if (!d) return null
      return { ...d, [side]: { ...d[side], elements: fn(d[side].elements) } }
    },
    [side],
  )

  const updateElement = useCallback(
    (elId: string, patch: Partial<DesignElement>, coalesceKey?: string) => {
      const next = withElements((els) => els.map((el) => (el.id === elId ? ({ ...el, ...patch } as DesignElement) : el)))
      if (next) commit(next, coalesceKey)
    },
    [withElements, commit],
  )

  function addElement(el: DesignElement) {
    const next = withElements((els) => [...els, el])
    if (next) commit(next)
    setSelectedId(el.id)
    setMobileTab('edit')
  }

  const deleteElement = useCallback(
    (elId: string) => {
      const next = withElements((els) => els.filter((el) => el.id !== elId))
      if (next) commit(next)
      setSelectedId(null)
    },
    [withElements, commit],
  )

  const duplicateElement = useCallback(
    (el: DesignElement) => {
      const copy = { ...el, id: newId(), x: el.x + 10, y: el.y + 10, locked: false } as DesignElement
      const next = withElements((els) => {
        const idx = els.findIndex((e) => e.id === el.id)
        const out = [...els]
        out.splice(idx === -1 ? out.length : idx + 1, 0, copy)
        return out
      })
      if (next) commit(next)
      setSelectedId(copy.id)
    },
    [withElements, commit],
  )

  function reorder(elId: string, direction: 'front' | 'back' | 'forward' | 'backward') {
    const next = withElements((els) => {
      const idx = els.findIndex((e) => e.id === elId)
      if (idx === -1) return els
      const out = [...els]
      const [item] = out.splice(idx, 1)
      const target =
        direction === 'front' ? out.length : direction === 'back' ? 0 : direction === 'forward' ? Math.min(out.length, idx + 1) : Math.max(0, idx - 1)
      out.splice(target, 0, item)
      return out
    })
    if (next) commit(next)
  }

  function alignToCard(el: DesignElement, where: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') {
    const { w, h } = cardSize
    const patch: Partial<DesignElement> =
      where === 'left' ? { x: 0 } : where === 'hcenter' ? { x: round((w - el.w) / 2) } : where === 'right' ? { x: round(w - el.w) }
      : where === 'top' ? { y: 0 } : where === 'vcenter' ? { y: round((h - el.h) / 2) } : { y: round(h - el.h) }
    updateElement(el.id, patch)
  }

  function updateDesign(patch: Partial<IdCardDesign>, coalesceKey?: string) {
    if (!designRef.current) return
    commit({ ...designRef.current, ...patch }, coalesceKey)
  }

  function updateBackground(fill: Fill, coalesceKey?: string) {
    if (!designRef.current) return
    commit({ ...designRef.current, [side]: { ...designRef.current[side], background: fill } }, coalesceKey)
  }

  function changeOrientation(orientation: CardOrientation) {
    const d = designRef.current
    if (!d || d.orientation === orientation) return
    const from = CARD_SIZE[d.orientation]
    const to = CARD_SIZE[orientation]
    // Keep each element's center at the same relative spot; full-width bands stay full-width.
    const remap = (els: DesignElement[]) =>
      els.map((el) => {
        const fullWidth = el.x <= 0 && el.w >= from.w - 1
        const w = fullWidth ? to.w : Math.min(el.w, to.w)
        const cx = ((el.x + el.w / 2) / from.w) * to.w
        const cy = ((el.y + el.h / 2) / from.h) * to.h
        return { ...el, w, x: fullWidth ? 0 : round(cx - w / 2), y: round(cy - el.h / 2) } as DesignElement
      })
    commit({ ...d, orientation, front: { ...d.front, elements: remap(d.front.elements) }, back: { ...d.back, elements: remap(d.back.elements) } })
  }

  function resetToStarter() {
    if (!design || !window.confirm('Replace the whole design (front and back) with the starter layout? You can undo this.')) return
    commit(createStarterDesign(design.orientation, department?.teamColor ?? '#0d9488', department?.teamColorSecondary ?? null))
    setSelectedId(null)
  }

  function copyFrontToBack() {
    const d = designRef.current
    if (!d || !window.confirm('Replace the back side with a copy of the front? You can undo this.')) return
    commit({ ...d, back: { background: d.front.background, elements: d.front.elements.map((el) => ({ ...el, id: newId() })) } })
  }

  async function handleSave() {
    if (!designRef.current) return
    setSaving(true)
    setError(null)
    try {
      await saveIdCardDesign(departmentId, JSON.stringify(designRef.current), designRef.current.orientation)
      setDirty(false)
      setSavedAt(new Date())
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save design.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>, replaceId?: string) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { src, w, h } = await readImageFile(file)
      if (replaceId) {
        updateElement(replaceId, { src } as Partial<ImageElement>)
        return
      }
      const maxW = cardSize.w * 0.5
      const scale = Math.min(1, maxW / w, (cardSize.h * 0.5) / h)
      const el = createImage('image', cardSize.w / 2, cardSize.h / 2, src)
      el.w = Math.round(w * scale)
      el.h = Math.round(h * scale)
      el.x = Math.round((cardSize.w - el.w) / 2)
      el.y = Math.round((cardSize.h - el.h) / 2)
      el.fit = 'contain'
      el.mask = 'none'
      el.borderWidth = 0
      addElement(el)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image.')
    }
  }

  // ---------- Pointer interactions ----------

  function toDesignDelta(clientX: number, clientY: number, startX: number, startY: number) {
    return { dx: (clientX - startX) / zoom, dy: (clientY - startY) / zoom }
  }

  function computeSnap(el: DesignElement, x: number, y: number, disable: boolean): { x: number; y: number; guides: Guides } {
    if (disable) return { x, y, guides: { v: [], h: [] } }
    const threshold = SNAP / Math.max(zoom, 0.5)
    const vTargets = [0, cardSize.w / 2, cardSize.w]
    const hTargets = [0, cardSize.h / 2, cardSize.h]
    for (const other of elements) {
      if (other.id === el.id || other.hidden) continue
      vTargets.push(other.x, other.x + other.w / 2, other.x + other.w)
      hTargets.push(other.y, other.y + other.h / 2, other.y + other.h)
    }

    const pick = (pos: number, size: number, targets: number[]) => {
      let best: { offset: number; line: number } | null = null
      for (const anchor of [0, size / 2, size]) {
        for (const t of targets) {
          const diff = t - (pos + anchor)
          if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.offset))) best = { offset: diff, line: t }
        }
      }
      return best
    }

    const sx = pick(x, el.w, vTargets)
    const sy = pick(y, el.h, hTargets)
    return {
      x: sx ? x + sx.offset : x,
      y: sy ? y + sy.offset : y,
      guides: { v: sx ? [sx.line] : [], h: sy ? [sy.line] : [] },
    }
  }

  function onElementPointerDown(e: ReactPointerEvent, el: DesignElement) {
    if (e.button !== 0 || editingId === el.id) return
    e.stopPropagation()
    setSelectedId(el.id)
    if (mobileTab === 'add') setMobileTab('edit')
    if (editingId) setEditingId(null)
    if (el.locked || !designRef.current) return
    dragRef.current = { mode: 'move', id: el.id, startX: e.clientX, startY: e.clientY, orig: el, before: designRef.current, moved: false }
  }

  function onHandlePointerDown(e: ReactPointerEvent, el: DesignElement, dx: number, dy: number) {
    e.stopPropagation()
    e.preventDefault()
    if (!designRef.current) return
    dragRef.current = { mode: 'resize', id: el.id, startX: e.clientX, startY: e.clientY, orig: el, before: designRef.current, dx, dy, moved: false }
  }

  function onRotatePointerDown(e: ReactPointerEvent, el: DesignElement) {
    e.stopPropagation()
    e.preventDefault()
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect || !designRef.current) return
    dragRef.current = {
      mode: 'rotate',
      id: el.id,
      cx: rect.left + (el.x + el.w / 2) * zoom,
      cy: rect.top + (el.y + el.h / 2) * zoom,
      before: designRef.current,
      moved: false,
    }
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current
      if (!drag) return
      const base = drag.before

      if (drag.mode === 'move') {
        const { dx, dy } = toDesignDelta(e.clientX, e.clientY, drag.startX, drag.startY)
        if (!drag.moved && Math.hypot(dx, dy) < 1) return
        drag.moved = true
        const snapped = computeSnap(drag.orig, drag.orig.x + dx, drag.orig.y + dy, e.altKey)
        setGuides(snapped.guides)
        const next = withElements(
          (els) => els.map((el) => (el.id === drag.id ? ({ ...el, x: round(snapped.x), y: round(snapped.y) } as DesignElement) : el)),
          base,
        )
        if (next) setLive(next)
        return
      }

      if (drag.mode === 'resize') {
        const o = drag.orig
        const { dx, dy } = toDesignDelta(e.clientX, e.clientY, drag.startX, drag.startY)
        drag.moved = true
        // Work in the element's own (unrotated) frame so rotated shapes resize along their edges.
        const rad = (o.rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const lx = dx * cos + dy * sin
        const ly = -dx * sin + dy * cos

        let w = Math.max(MIN_SIZE, o.w + drag.dx * lx)
        let h = Math.max(MIN_SIZE, o.h + drag.dy * ly)
        const corner = drag.dx !== 0 && drag.dy !== 0
        const keepRatio = o.type === 'qr' || (corner && (e.shiftKey || o.type === 'text' || o.type === 'photo' || o.type === 'logo'))
        if (keepRatio) {
          const ratio = o.w / o.h
          if (corner) {
            const scale = Math.max(w / o.w, h / o.h)
            w = Math.max(MIN_SIZE, o.w * scale)
            h = Math.max(MIN_SIZE, o.h * scale)
          } else if (drag.dx !== 0) {
            h = w / ratio
          } else {
            w = h * ratio
          }
        }

        const dW = w - o.w
        const dH = h - o.h
        const shiftLocalX = (drag.dx * dW) / 2
        const shiftLocalY = (drag.dy * dH) / 2
        const cx = o.x + o.w / 2 + shiftLocalX * cos - shiftLocalY * sin
        const cy = o.y + o.h / 2 + shiftLocalX * sin + shiftLocalY * cos

        const patch: Partial<DesignElement> = { x: round(cx - w / 2), y: round(cy - h / 2), w: round(w), h: round(h) }
        // Dragging a text corner scales the lettering too, like most design tools.
        if (o.type === 'text' && corner) {
          ;(patch as Partial<TextElement>).fontSize = round(Math.max(4, o.fontSize * (w / o.w)))
        }
        const next = withElements((els) => els.map((el) => (el.id === drag.id ? ({ ...el, ...patch } as DesignElement) : el)), base)
        if (next) setLive(next)
        return
      }

      if (drag.mode === 'rotate') {
        drag.moved = true
        let angle = (Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx) * 180) / Math.PI + 90
        if (e.shiftKey) angle = Math.round(angle / 15) * 15
        else {
          const nearest = Math.round(angle / 90) * 90
          if (Math.abs(angle - nearest) < 3) angle = nearest
        }
        angle = ((Math.round(angle) % 360) + 360) % 360
        const next = withElements((els) => els.map((el) => (el.id === drag.id ? ({ ...el, rotation: angle } as DesignElement) : el)), base)
        if (next) setLive(next)
      }
    }

    function onUp() {
      const drag = dragRef.current
      dragRef.current = null
      setGuides({ v: [], h: [] })
      if (drag?.moved && designRef.current) commit(designRef.current, undefined, drag.before)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  })

  // ---------- Keyboard shortcuts ----------

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave()
        return
      }
      if (mod && e.key.toLowerCase() === 'v' && clipboard.current) {
        e.preventDefault()
        duplicateElement({ ...clipboard.current, id: '__clip__' })
        return
      }
      if (!selected) return

      if (mod && e.key.toLowerCase() === 'c') {
        clipboard.current = selected
        return
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateElement(selected)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteElement(selected.id)
        return
      }
      if (e.key === 'Escape') {
        setSelectedId(null)
        return
      }
      if (e.key === 'Enter' && selected.type === 'text') {
        e.preventDefault()
        setEditingId(selected.id)
        return
      }
      const step = e.shiftKey ? 10 : 1
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
      const mv = moves[e.key]
      if (mv && !selected.locked) {
        e.preventDefault()
        updateElement(selected.id, { x: round(selected.x + mv[0]), y: round(selected.y + mv[1]) }, `nudge-${selected.id}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const fieldValues = useMemo<DesignFieldValues>(() => {
    if (showFieldNames) {
      return Object.fromEntries(TEXT_FIELDS.map((f) => [f.key, `{{${f.key}}}`])) as unknown as DesignFieldValues
    }
    return { ...SAMPLE_FIELD_VALUES, department: department?.name ?? SAMPLE_FIELD_VALUES.department }
  }, [showFieldNames, department])

  const ctx: CustomCardContext = {
    values: fieldValues,
    photoUrl: '',
    hasPhoto: false,
    logoUrl: `/departments/${departmentId}/logo`,
    hasLogo: department?.hasLogo ?? false,
    token: 'HRIS-SAMPLE-QR-CODE',
  }

  const swatches = useMemo(() => {
    const brand = [department?.teamColor, department?.teamColorSecondary].filter((c): c is string => !!c)
    return [...new Set([...brand, ...BASE_SWATCHES])]
  }, [department])

  if (loading) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <p>Loading designer...</p>
      </AdminLayout>
    )
  }

  if (!design) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <p className="form-error">{error ?? 'Department not found.'}</p>
        <Link to="/admin/departments" className="btn btn-ghost">
          Back to Departments
        </Link>
      </AdminLayout>
    )
  }

  const center = { x: cardSize.w / 2, y: cardSize.h / 2 }
  const primary = department?.teamColor ?? '#0d9488'

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>ID Designer · {department?.name ?? 'Department'}</h1>
        <div className="row-actions">
          <Link to="/admin/departments" className="btn btn-ghost">
            Back
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : dirty ? 'Save Design' : 'Saved'}
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {savedAt && !dirty && (
        <p className="designer-hint">Saved {savedAt.toLocaleTimeString()} · this department now uses the custom ID design.</p>
      )}

      <div className="designer-layout" data-tab={mobileTab}>
        {/* ---------- Left: add elements ---------- */}
        <aside className="designer-panel designer-tools">
          <h3 className="designer-panel-title">Text</h3>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => addElement(createText(center.x, center.y, 'Heading', { fontSize: 20, fontWeight: 800 }))}>
            + Heading
          </button>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => addElement(createText(center.x, center.y, 'Your text here', { fontSize: 12, fontWeight: 400 }))}>
            + Text
          </button>

          <h3 className="designer-panel-title">Employee Fields</h3>
          <div className="designer-chip-grid">
            {TEXT_FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                className="designer-chip"
                onClick={() => addElement(createText(center.x, center.y, `{{${f.key}}}`, { autoFit: f.key !== 'address' }))}
              >
                {f.label}
              </button>
            ))}
          </div>

          <h3 className="designer-panel-title">Shapes</h3>
          <div className="designer-shape-grid">
            {SHAPES.map((s) => (
              <button key={s.kind} type="button" className="designer-shape-btn" title={s.label} onClick={() => addElement(createShape(s.kind, center.x, center.y, primary))}>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d={s.icon} fill="currentColor" />
                </svg>
              </button>
            ))}
          </div>

          <h3 className="designer-panel-title">Media</h3>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => addElement(createImage('photo', center.x, center.y))}>
            + Employee Photo
          </button>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => addElement(createImage('logo', center.x, center.y))}>
            + Department Logo
          </button>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => addElement(createQr(center.x, center.y))}>
            + Attendance QR
          </button>
          <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={() => imageInputRef.current?.click()}>
            + Upload Image
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={(e) => handleImageUpload(e)} />
        </aside>

        {/* ---------- Center: canvas ---------- */}
        <section className="designer-stage">
          <div className="designer-stage-toolbar">
            <div className="designer-segmented">
              <button type="button" className={side === 'front' ? 'active' : ''} onClick={() => { setSide('front'); setSelectedId(null) }}>
                Front
              </button>
              <button type="button" className={side === 'back' ? 'active' : ''} onClick={() => { setSide('back'); setSelectedId(null) }}>
                Back
              </button>
            </div>
            <div className="designer-toolbar-group">
              <button type="button" className="btn btn-ghost btn-small" onClick={undo} disabled={historyCounts.undo === 0} title="Undo (Ctrl/Cmd+Z)" aria-label="Undo">
                ↶<span className="designer-btn-text"> Undo</span>
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={redo} disabled={historyCounts.redo === 0} title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo">
                ↷<span className="designer-btn-text"> Redo</span>
              </button>
            </div>
            <div className="designer-toolbar-group">
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setZoom((z) => Math.max(0.5, round(z - 0.25)))}>
                −
              </button>
              <span className="designer-zoom-label">{Math.round(zoom * 100)}%</span>
              <button type="button" className="btn btn-ghost btn-small" onClick={() => setZoom((z) => Math.min(4, round(z + 0.25)))}>
                +
              </button>
              <button type="button" className="btn btn-ghost btn-small" onClick={fitZoom}>
                Fit
              </button>
            </div>
            <label className="designer-check">
              <input type="checkbox" checked={showFieldNames} onChange={(e) => setShowFieldNames(e.target.checked)} /> Field names
            </label>
          </div>

          <div ref={scrollRef} className="designer-canvas-scroll" onPointerDown={() => { setSelectedId(null); setEditingId(null) }}>
            <div className="designer-canvas-frame" style={{ width: cardSize.w * zoom, height: cardSize.h * zoom }}>
              <div
                ref={surfaceRef}
                className="designer-surface"
                style={{
                  width: cardSize.w,
                  height: cardSize.h,
                  transform: `scale(${zoom})`,
                  borderRadius: design.cornerRadius,
                  background: fillToCss(design[side].background),
                }}
              >
                <div className="designer-clip" style={{ borderRadius: design.cornerRadius }}>
                  {elements.map((el) =>
                    el.hidden ? null : (
                      <div
                        key={el.id}
                        className={`designer-el ${el.locked ? 'locked' : ''}`}
                        style={elementBoxStyle(el)}
                        onPointerDown={(e) => onElementPointerDown(e, el)}
                        onDoubleClick={() => el.type === 'text' && !el.locked && setEditingId(el.id)}
                      >
                        {editingId === el.id && el.type === 'text' ? (
                          <InlineTextEditor
                            el={el}
                            onDone={(text) => {
                              setEditingId(null)
                              if (text !== el.text) updateElement(el.id, { text })
                            }}
                          />
                        ) : (
                          <ElementView el={el} ctx={ctx} />
                        )}
                      </div>
                    ),
                  )}
                </div>

                {/* Selection overlay is drawn outside the clip so handles stay visible at the card edges. */}
                {selected && !selected.hidden && editingId !== selected.id && (
                  <div className="designer-selection" style={{ ...elementBoxStyle(selected), opacity: 1, ['--z' as string]: zoom }}>
                    {!selected.locked && (
                      <>
                        {HANDLES.map(({ h, dx, dy }) => (
                          <span key={h} className={`designer-handle designer-handle-${h}`} onPointerDown={(e) => onHandlePointerDown(e, selected, dx, dy)} />
                        ))}
                        <span className="designer-rotate-stem" />
                        <span className="designer-rotate-handle" title="Rotate (Shift = 15° steps)" onPointerDown={(e) => onRotatePointerDown(e, selected)} />
                      </>
                    )}
                  </div>
                )}

                {guides.v.map((x) => (
                  <div key={`v${x}`} className="designer-guide designer-guide-v" style={{ left: x }} />
                ))}
                {guides.h.map((y) => (
                  <div key={`h${y}`} className="designer-guide designer-guide-h" style={{ top: y }} />
                ))}
              </div>
            </div>
          </div>
          {selected ? (
            <div className="designer-quickbar">
              <span className="designer-quickbar-label">{layerLabel(selected)}</span>
              {selected.type === 'text' && !selected.locked && (
                <button type="button" onClick={() => setEditingId(selected.id)}>
                  ✎ Edit text
                </button>
              )}
              <button type="button" onClick={() => { setMobileTab('edit') }} className="designer-quickbar-mobile">
                ⚙ Style
              </button>
              <button type="button" onClick={() => duplicateElement(selected)}>
                ⧉ Copy
              </button>
              <button type="button" onClick={() => reorder(selected.id, 'forward')} title="Bring forward">
                ▲
              </button>
              <button type="button" onClick={() => reorder(selected.id, 'backward')} title="Send backward">
                ▼
              </button>
              <button type="button" onClick={() => updateElement(selected.id, { locked: !selected.locked })} title={selected.locked ? 'Unlock' : 'Lock'}>
                {selected.locked ? '🔒' : '🔓'}
              </button>
              <button type="button" className="danger" onClick={() => deleteElement(selected.id)} title="Delete">
                🗑
              </button>
              <button type="button" onClick={() => setSelectedId(null)} title="Done">
                ✓ Done
              </button>
            </div>
          ) : (
            <p className="designer-hint">
              {isMobile
                ? 'Tap an item to select it · drag to move · pull the round handles to resize · top handle rotates'
                : 'Drag to move · drag handles to resize (Shift keeps ratio) · double-click text to edit · arrows nudge · Alt disables snapping · Delete removes'}
            </p>
          )}

          {/* ---------- Mobile tab bar ---------- */}
          <nav className="designer-tabs" aria-label="Designer panels">
            {(
              [
                ['add', '＋', 'Add'],
                ['edit', '✎', selected ? 'Edit' : 'Card'],
                ['layers', '☰', 'Layers'],
              ] as const
            ).map(([tab, icon, label]) => (
              <button key={tab} type="button" className={mobileTab === tab ? 'active' : ''} onClick={() => setMobileTab(tab)}>
                <span aria-hidden="true">{icon}</span> {label}
              </button>
            ))}
          </nav>
        </section>


        {/* ---------- Right: properties + layers ---------- */}
        <div className="designer-right">
          <aside className="designer-panel designer-props">
            {selected ? (
              <ElementProperties
                key={selected.id}
                el={selected}
                swatches={swatches}
                onChange={(patch, key) => updateElement(selected.id, patch, key ? `${selected.id}-${key}` : undefined)}
                onDelete={() => deleteElement(selected.id)}
                onDuplicate={() => duplicateElement(selected)}
                onReorder={(dir) => reorder(selected.id, dir)}
                onAlign={(where) => alignToCard(selected, where)}
                onReplaceImage={() => replaceImageRef.current?.click()}
              />
            ) : (
              <CardProperties
                design={design}
                side={side}
                swatches={swatches}
                onOrientation={changeOrientation}
                onBackground={updateBackground}
                onCornerRadius={(r) => updateDesign({ cornerRadius: r }, 'corner')}
                onReset={resetToStarter}
                onCopyFrontToBack={copyFrontToBack}
              />
            )}
            <input
              ref={replaceImageRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={(e) => selected && handleImageUpload(e, selected.id)}
            />

          </aside>

          <aside className="designer-panel designer-layers-panel">
            <h3 className="designer-panel-title">Layers ({side})</h3>
            <div className="designer-layers">
              {elements.length === 0 && <span className="resume-empty">Nothing on this side yet.</span>}
              {[...elements].reverse().map((el) => (
                <div
                  key={el.id}
                  className={`designer-layer ${el.id === selectedId ? 'active' : ''} ${el.hidden ? 'is-hidden' : ''}`}
                  onClick={() => {
                    setSelectedId(el.id)
                    if (isMobile) setMobileTab('edit')
                  }}
                >
                  <span className="designer-layer-name">{layerLabel(el)}</span>
                  <button type="button" title={el.hidden ? 'Show' : 'Hide'} onClick={(e) => { e.stopPropagation(); updateElement(el.id, { hidden: !el.hidden }) }}>
                    {el.hidden ? '○' : '●'}
                  </button>
                  <button type="button" title={el.locked ? 'Unlock' : 'Lock'} onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }) }}>
                    {el.locked ? '🔒' : '🔓'}
                  </button>
                </div>
              ))}
            </div>
          </aside>
          </div>
        </div>
      </AdminLayout>
    )
  }

  function layerLabel(el: DesignElement): string {
    if (el.name) return el.name
    switch (el.type) {
      case 'text':
        return `T  ${el.text.slice(0, 28) || '(empty)'}`
      case 'shape':
        return `▢  ${SHAPES.find((s) => s.kind === el.shape)?.label ?? 'Shape'}`
      case 'photo':
        return '👤  Employee Photo'
      case 'logo':
        return '🏢  Department Logo'
      case 'qr':
        return '▦  Attendance QR'
      default:
        return '🖼  Image'
    }
  }

  function InlineTextEditor({ el, onDone }: { el: TextElement; onDone: (text: string) => void }) {
    const [value, setValue] = useState(el.text)
    return (
      <textarea
        className="designer-inline-text"
        autoFocus
        value={value}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onDone(value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
            e.preventDefault()
            onDone(value)
          }
        }}
        style={{
          fontFamily: el.fontFamily,
          fontSize: el.fontSize,
          fontWeight: el.fontWeight,
          fontStyle: el.italic ? 'italic' : 'normal',
          textAlign: el.align,
          color: el.color,
          letterSpacing: el.letterSpacing,
          lineHeight: el.lineHeight,
        }}
      />
    )
  }

  // ---------- Property controls ----------

  function NumField({
    label,
    value,
    onChange,
    step = 1,
    min,
    max,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    step?: number
    min?: number
    max?: number
  }) {
    return (
      <label className="designer-field">
        <span>{label}</span>
        <input
          type="number"
          value={Number.isFinite(value) ? round(value) : 0}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!Number.isNaN(v)) onChange(min !== undefined ? Math.max(min, max !== undefined ? Math.min(max, v) : v) : v)
          }}
        />
      </label>
    )
  }

  function RangeField({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix = '',
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step?: number
    suffix?: string
  }) {
    return (
      <label className="designer-field designer-field-range">
        <span>
          {label} <em>{round(value)}{suffix}</em>
        </span>
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} />
      </label>
    )
  }

  function ColorField({
    label,
    value,
    onChange,
    swatches,
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    swatches: string[]
  }) {
    const [text, setText] = useState(value)
    useEffect(() => setText(value), [value])
    return (
      <div className="designer-field designer-color">
        <span>{label}</span>
        <div className="designer-color-row">
          <input type="color" value={isHex(value) ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} />
          <input
            className="designer-hex"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (isHex(e.target.value)) onChange(e.target.value)
            }}
          />
        </div>
        <div className="designer-swatches">
          {swatches.map((c) => (
            <button key={c} type="button" style={{ background: c }} title={c} onClick={() => onChange(c)} />
          ))}
        </div>
      </div>
    )
  }

  function FillField({
    label,
    fill,
    onChange,
    swatches,
    allowNone,
  }: {
    label: string
    fill: Fill
    onChange: (f: Fill, key?: string) => void
    swatches: string[]
    allowNone?: boolean
  }) {
    const none = fill.color === 'transparent'
    return (
      <>
        {allowNone && (
          <label className="designer-check">
            <input type="checkbox" checked={none} onChange={(e) => onChange({ ...fill, color: e.target.checked ? 'transparent' : swatches[0] ?? '#0d9488', color2: null })} /> No fill
          </label>
        )}
        {!none && (
          <>
            <ColorField label={fill.color2 ? `${label} (start)` : label} value={fill.color} swatches={swatches} onChange={(c) => onChange({ ...fill, color: c }, 'fill')} />
            <label className="designer-check">
              <input
                type="checkbox"
                checked={!!fill.color2}
                onChange={(e) => onChange({ ...fill, color2: e.target.checked ? swatches[1] ?? '#7c3aed' : null, angle: fill.angle ?? 135 })}
              />{' '}
              Gradient
            </label>
            {fill.color2 && (
              <>
                <ColorField label={`${label} (end)`} value={fill.color2} swatches={swatches} onChange={(c) => onChange({ ...fill, color2: c }, 'fill2')} />
                <RangeField label="Gradient angle" value={fill.angle ?? 135} min={0} max={360} suffix="°" onChange={(v) => onChange({ ...fill, angle: v }, 'angle')} />
              </>
            )}
          </>
        )}
      </>
    )
  }

  function ToggleButton({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
    return (
      <button type="button" className={`designer-toggle ${active ? 'active' : ''}`} onClick={onClick} title={title}>
        {children}
      </button>
    )
  }

  function ElementProperties({
    el,
    swatches,
    onChange,
    onDelete,
    onDuplicate,
    onReorder,
    onAlign,
    onReplaceImage,
  }: {
    el: DesignElement
    swatches: string[]
    onChange: (patch: Partial<DesignElement>, coalesceKey?: string) => void
    onDelete: () => void
    onDuplicate: () => void
    onReorder: (dir: 'front' | 'back' | 'forward' | 'backward') => void
    onAlign: (where: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void
    onReplaceImage: () => void
  }) {
    return (
      <div className="designer-props-body">
        <div className="designer-props-head">
          <h3 className="designer-panel-title">{layerLabel({ ...el, name: undefined } as DesignElement).replace(/^\S+\s+/, '') || 'Element'}</h3>
          <div className="designer-toolbar-group">
            <button type="button" className="btn btn-ghost btn-small" onClick={onDuplicate} title="Duplicate (Ctrl/Cmd+D)">
              Duplicate
            </button>
            <button type="button" className="btn btn-danger btn-small" onClick={onDelete} title="Delete">
              Delete
            </button>
        </div>
      </div>

      <label className="designer-field">
        <span>Layer name</span>
        <input value={el.name ?? ''} placeholder={layerLabel({ ...el, name: undefined } as DesignElement)} onChange={(e) => onChange({ name: e.target.value || undefined }, 'name')} />
      </label>

      {el.type === 'text' && <TextProperties el={el} swatches={swatches} onChange={onChange} />}
      {el.type === 'shape' && <ShapeProperties el={el} swatches={swatches} onChange={onChange} />}
      {(el.type === 'photo' || el.type === 'logo' || el.type === 'image') && (
        <ImageProperties el={el} swatches={swatches} onChange={onChange} onReplace={onReplaceImage} />
      )}
      {el.type === 'qr' && <QrProperties el={el} swatches={swatches} onChange={onChange} />}

      <h4 className="designer-subtitle">Position & Size</h4>
      <div className="designer-grid-2">
        <NumField label="X" value={el.x} onChange={(v) => onChange({ x: v }, 'x')} />
        <NumField label="Y" value={el.y} onChange={(v) => onChange({ y: v }, 'y')} />
        <NumField label="Width" value={el.w} min={MIN_SIZE} onChange={(v) => onChange({ w: v }, 'w')} />
        <NumField label="Height" value={el.h} min={MIN_SIZE} onChange={(v) => onChange({ h: v }, 'h')} />
      </div>
      <RangeField label="Rotation" value={el.rotation} min={0} max={359} suffix="°" onChange={(v) => onChange({ rotation: v }, 'rotation')} />
      <RangeField label="Opacity" value={Math.round(el.opacity * 100)} min={0} max={100} suffix="%" onChange={(v) => onChange({ opacity: v / 100 }, 'opacity')} />

      <h4 className="designer-subtitle">Align on card</h4>
      <div className="designer-btn-row">
        <button type="button" onClick={() => onAlign('left')} title="Align left">⇤</button>
        <button type="button" onClick={() => onAlign('hcenter')} title="Center horizontally">↔</button>
        <button type="button" onClick={() => onAlign('right')} title="Align right">⇥</button>
        <button type="button" onClick={() => onAlign('top')} title="Align top">⤒</button>
        <button type="button" onClick={() => onAlign('vcenter')} title="Center vertically">↕</button>
        <button type="button" onClick={() => onAlign('bottom')} title="Align bottom">⤓</button>
      </div>

      <h4 className="designer-subtitle">Arrange</h4>
      <div className="designer-btn-row designer-btn-row-text">
        <button type="button" onClick={() => onReorder('front')}>To front</button>
        <button type="button" onClick={() => onReorder('forward')}>Forward</button>
        <button type="button" onClick={() => onReorder('backward')}>Backward</button>
        <button type="button" onClick={() => onReorder('back')}>To back</button>
      </div>
      <label className="designer-check">
        <input type="checkbox" checked={!!el.locked} onChange={(e) => onChange({ locked: e.target.checked })} /> Lock position
      </label>
    </div>
  )
}

function TextProperties({
  el,
  swatches,
  onChange,
}: {
  el: TextElement
  swatches: string[]
  onChange: (patch: Partial<TextElement>, coalesceKey?: string) => void
}) {
  const textRef = useRef<HTMLTextAreaElement>(null)

  function insertField(key: string) {
    const ta = textRef.current
    const token = `{{${key}}}`
    if (!ta) {
      onChange({ text: el.text + token })
      return
    }
    const start = ta.selectionStart ?? el.text.length
    const end = ta.selectionEnd ?? el.text.length
    onChange({ text: el.text.slice(0, start) + token + el.text.slice(end) })
  }

  return (
    <>
      <h4 className="designer-subtitle">Text</h4>
      <textarea ref={textRef} className="designer-textarea" rows={3} value={el.text} onChange={(e) => onChange({ text: e.target.value }, 'text')} />
      <label className="designer-field">
        <span>Insert employee field</span>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) insertField(e.target.value)
          }}
        >
          <option value="">Choose a field…</option>
          {TEXT_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <h4 className="designer-subtitle">Font</h4>
      <label className="designer-field">
        <span>Family</span>
        <select value={el.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })} style={{ fontFamily: el.fontFamily }}>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <div className="designer-grid-2">
        <NumField label="Size" value={el.fontSize} min={4} max={200} step={0.5} onChange={(v) => onChange({ fontSize: v }, 'fontSize')} />
        <label className="designer-field">
          <span>Weight</span>
          <select value={el.fontWeight} onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}>
            {[300, 400, 500, 600, 700, 800, 900].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="designer-btn-row">
        <ToggleButton title="Bold" active={el.fontWeight >= 700} onClick={() => onChange({ fontWeight: el.fontWeight >= 700 ? 400 : 700 })}>
          <strong>B</strong>
        </ToggleButton>
        <ToggleButton title="Italic" active={el.italic} onClick={() => onChange({ italic: !el.italic })}>
          <em>I</em>
        </ToggleButton>
        <ToggleButton title="Underline" active={el.underline} onClick={() => onChange({ underline: !el.underline })}>
          <u>U</u>
        </ToggleButton>
        <ToggleButton title="Uppercase" active={el.uppercase} onClick={() => onChange({ uppercase: !el.uppercase })}>
          AA
        </ToggleButton>
      </div>
      <ColorField label="Color" value={el.color} swatches={swatches} onChange={(c) => onChange({ color: c }, 'color')} />

      <h4 className="designer-subtitle">Alignment</h4>
      <div className="designer-btn-row">
        {(['left', 'center', 'right'] as const).map((a) => (
          <ToggleButton key={a} title={`Align ${a}`} active={el.align === a} onClick={() => onChange({ align: a })}>
            {a === 'left' ? '≡⇤' : a === 'center' ? '≡' : '⇥≡'}
          </ToggleButton>
        ))}
        {(['top', 'middle', 'bottom'] as const).map((a) => (
          <ToggleButton key={a} title={`Vertical ${a}`} active={el.verticalAlign === a} onClick={() => onChange({ verticalAlign: a })}>
            {a === 'top' ? '⤒' : a === 'middle' ? '↕' : '⤓'}
          </ToggleButton>
        ))}
      </div>
      <RangeField label="Letter spacing" value={el.letterSpacing} min={-2} max={12} step={0.1} suffix="px" onChange={(v) => onChange({ letterSpacing: v }, 'ls')} />
      <RangeField label="Line height" value={el.lineHeight} min={0.7} max={2.5} step={0.05} onChange={(v) => onChange({ lineHeight: v }, 'lh')} />
      <label className="designer-check">
        <input type="checkbox" checked={el.autoFit} onChange={(e) => onChange({ autoFit: e.target.checked })} /> Shrink to fit one line (long names)
      </label>

      <h4 className="designer-subtitle">Text Shape & Effects</h4>
      <RangeField label="Curve" value={el.curve} min={-100} max={100} onChange={(v) => onChange({ curve: v }, 'curve')} />
      <div className="designer-btn-row designer-btn-row-text">
        <button type="button" onClick={() => onChange({ curve: 0 })}>Straight</button>
        <button type="button" onClick={() => onChange({ curve: 60 })}>Arch up</button>
        <button type="button" onClick={() => onChange({ curve: -60 })}>Arch down</button>
      </div>
      <RangeField label="Outline" value={el.strokeWidth} min={0} max={6} step={0.25} suffix="px" onChange={(v) => onChange({ strokeWidth: v }, 'stroke')} />
      {el.strokeWidth > 0 && <ColorField label="Outline color" value={el.strokeColor} swatches={swatches} onChange={(c) => onChange({ strokeColor: c }, 'strokeColor')} />}
      <label className="designer-check">
        <input type="checkbox" checked={el.shadow} onChange={(e) => onChange({ shadow: e.target.checked })} /> Drop shadow
      </label>
      {el.shadow && <ColorField label="Shadow color" value={el.shadowColor} swatches={swatches} onChange={(c) => onChange({ shadowColor: c }, 'shadowColor')} />}
      <label className="designer-check">
        <input type="checkbox" checked={el.background !== null} onChange={(e) => onChange({ background: e.target.checked ? '#fde68a' : null })} /> Highlight box
      </label>
      {el.background !== null && (
        <>
          <ColorField label="Highlight color" value={el.background} swatches={swatches} onChange={(c) => onChange({ background: c }, 'bg')} />
          <RangeField label="Highlight radius" value={el.backgroundRadius} min={0} max={30} onChange={(v) => onChange({ backgroundRadius: v }, 'bgr')} />
        </>
      )}
    </>
  )
}

function ShapeProperties({
  el,
  swatches,
  onChange,
}: {
  el: ShapeElement
  swatches: string[]
  onChange: (patch: Partial<ShapeElement>, coalesceKey?: string) => void
}) {
  return (
    <>
      <h4 className="designer-subtitle">Shape</h4>
      <div className="designer-shape-grid">
        {SHAPES.map((s) => (
          <button
            key={s.kind}
            type="button"
            className={`designer-shape-btn ${el.shape === s.kind ? 'active' : ''}`}
            title={s.label}
            onClick={() => onChange({ shape: s.kind })}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d={s.icon} fill="currentColor" />
            </svg>
          </button>
        ))}
      </div>
      <FillField label="Fill" fill={el.fill} swatches={swatches} allowNone onChange={(fill, key) => onChange({ fill }, key)} />
      {(el.shape === 'rect' || el.shape === 'line') && (
        <RangeField label="Corner radius" value={el.radius} min={0} max={Math.round(Math.min(el.w, el.h) / 2)} onChange={(v) => onChange({ radius: v }, 'radius')} />
      )}
      <RangeField label="Border width" value={el.strokeWidth} min={0} max={12} step={0.5} suffix="px" onChange={(v) => onChange({ strokeWidth: v }, 'sw')} />
      {el.strokeWidth > 0 && <ColorField label="Border color" value={el.stroke} swatches={swatches} onChange={(c) => onChange({ stroke: c }, 'stroke')} />}
      <div className="designer-btn-row designer-btn-row-text">
        <ToggleButton title="Flip horizontally" active={!!el.flipX} onClick={() => onChange({ flipX: !el.flipX })}>
          Flip ↔
        </ToggleButton>
        <ToggleButton title="Flip vertically" active={!!el.flipY} onClick={() => onChange({ flipY: !el.flipY })}>
          Flip ↕
        </ToggleButton>
      </div>
    </>
  )
}

function ImageProperties({
  el,
  swatches,
  onChange,
  onReplace,
}: {
  el: ImageElement
  swatches: string[]
  onChange: (patch: Partial<ImageElement>, coalesceKey?: string) => void
  onReplace: () => void
}) {
  return (
    <>
      <h4 className="designer-subtitle">{el.type === 'photo' ? 'Employee Photo' : el.type === 'logo' ? 'Department Logo' : 'Image'}</h4>
      {el.type === 'photo' && <p className="designer-hint">Each employee's own photo appears here.</p>}
      {el.type === 'image' && (
        <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={onReplace}>
          Replace image
        </button>
      )}
      <label className="designer-field">
        <span>Fit</span>
        <select value={el.fit} onChange={(e) => onChange({ fit: e.target.value as ImageElement['fit'] })}>
          <option value="cover">Fill (crop)</option>
          <option value="contain">Fit (no crop)</option>
        </select>
      </label>
      <label className="designer-field">
        <span>Frame</span>
        <select value={el.mask} onChange={(e) => onChange({ mask: e.target.value as ImageElement['mask'] })}>
          <option value="none">Square</option>
          <option value="rounded">Rounded</option>
          <option value="circle">Circle / Oval</option>
        </select>
      </label>
      {el.mask === 'rounded' && <RangeField label="Corner radius" value={el.radius} min={0} max={60} onChange={(v) => onChange({ radius: v }, 'radius')} />}
      <RangeField label="Border width" value={el.borderWidth} min={0} max={12} step={0.5} suffix="px" onChange={(v) => onChange({ borderWidth: v }, 'bw')} />
      {el.borderWidth > 0 && <ColorField label="Border color" value={el.borderColor} swatches={swatches} onChange={(c) => onChange({ borderColor: c }, 'bc')} />}
    </>
  )
}

function QrProperties({
  el,
  swatches,
  onChange,
}: {
  el: QrElement
  swatches: string[]
  onChange: (patch: Partial<QrElement>, coalesceKey?: string) => void
}) {
  return (
    <>
      <h4 className="designer-subtitle">Attendance QR</h4>
      <p className="designer-hint">Each employee's scan code appears here. Keep strong contrast so scanners can read it.</p>
      <ColorField label="Code color" value={el.fgColor} swatches={swatches} onChange={(c) => onChange({ fgColor: c }, 'fg')} />
      <ColorField label="Background" value={el.bgColor} swatches={swatches} onChange={(c) => onChange({ bgColor: c }, 'bg')} />
      <RangeField label="Padding" value={el.padding} min={0} max={30} onChange={(v) => onChange({ padding: v }, 'pad')} />
      <RangeField label="Corner radius" value={el.radius} min={0} max={30} onChange={(v) => onChange({ radius: v }, 'radius')} />
    </>
  )
}

function CardProperties({
  design,
  side,
  swatches,
  onOrientation,
  onBackground,
  onCornerRadius,
  onReset,
  onCopyFrontToBack,
}: {
  design: IdCardDesign
  side: CardSide
  swatches: string[]
  onOrientation: (o: CardOrientation) => void
  onBackground: (fill: Fill, key?: string) => void
  onCornerRadius: (r: number) => void
  onReset: () => void
  onCopyFrontToBack: () => void
}) {
  return (
    <div className="designer-props-body">
      <h3 className="designer-panel-title">Card</h3>
      <p className="designer-hint">Select an element on the card to edit it.</p>
      <label className="designer-field">
        <span>Orientation</span>
        <select value={design.orientation} onChange={(e) => onOrientation(e.target.value as CardOrientation)}>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </label>
      <RangeField label="Card corner radius" value={design.cornerRadius} min={0} max={30} onChange={onCornerRadius} />
      <h4 className="designer-subtitle">{side === 'front' ? 'Front' : 'Back'} background</h4>
      <FillField label="Background" fill={design[side].background} swatches={swatches} onChange={onBackground} />
      <h4 className="designer-subtitle">Tools</h4>
      <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={onCopyFrontToBack}>
        Copy front design to back
      </button>
      <button type="button" className="btn btn-ghost btn-small designer-wide-btn" onClick={onReset}>
        Reset to starter layout
      </button>
    </div>
  )
}
