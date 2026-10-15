import { useMemo, useState, type FormEvent } from 'react'
import { CustomCardSide, type CustomCardContext } from './CustomIdCard'
import { Modal } from './Modal'
import { CARD_SIZE, SAMPLE_FIELD_VALUES, fillToCss, parseDesign, type IdCardDesign } from './idCardDesign'
import type { SavedIdCardTemplate } from '../api/idCardTemplates'

const PREVIEW_CTX: CustomCardContext = {
  values: { ...SAMPLE_FIELD_VALUES, department: 'Department' },
  photoUrl: '',
  hasPhoto: false,
  logoUrl: '',
  hasLogo: false,
  token: 'HRIS-SAMPLE-QR-CODE',
}

/** Small, non-interactive front-side preview of a custom design. */
export function IdTemplatePreview({ design, className }: { design: IdCardDesign; className?: string }) {
  const { w, h } = CARD_SIZE[design.orientation]
  return (
    <div
      className={['id-template-preview', className].filter(Boolean).join(' ')}
      style={{ aspectRatio: `${w} / ${h}`, borderRadius: design.cornerRadius / 2, background: fillToCss(design.front.background) }}
    >
      <CustomCardSide design={design} side="front" ctx={PREVIEW_CTX} />
    </div>
  )
}

export function SaveTemplateDialog({
  defaultName,
  onSave,
  onClose,
}: {
  defaultName: string
  onSave: (name: string) => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onSave(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.')
      setSaving(false)
    }
  }

  return (
    <Modal title="Save as ID Template" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <p className="designer-hint">
          The template is added to the ID Card Style list so any department can use it. Each department gets its own copy to edit.
        </p>
        <label>
          Template name
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={80} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="row-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Gallery of saved templates with apply / rename / delete actions. */
export function TemplateLibraryPanel({
  templates,
  recolor,
  onRecolorChange,
  onApply,
  onRename,
  onDelete,
}: {
  templates: SavedIdCardTemplate[]
  recolor: boolean
  onRecolorChange: (v: boolean) => void
  onApply: (t: SavedIdCardTemplate) => void
  onRename: (t: SavedIdCardTemplate) => void
  onDelete: (t: SavedIdCardTemplate) => void
}) {
  const parsed = useMemo(
    () => templates.map((t) => ({ t, design: parseDesign(t.design) })).filter((x): x is { t: SavedIdCardTemplate; design: IdCardDesign } => !!x.design),
    [templates],
  )

  if (parsed.length === 0) {
    return <p className="designer-hint">No saved templates yet. Use “Save as Template” to share this design with other departments.</p>
  }

  return (
    <div className="template-library">
      <label className="designer-check">
        <input type="checkbox" checked={recolor} onChange={(e) => onRecolorChange(e.target.checked)} /> Use this department’s team colors
      </label>
      {parsed.map(({ t, design }) => (
        <div key={t.id} className="template-library-item">
          <IdTemplatePreview design={design} />
          <div className="template-library-meta">
            <strong>{t.name}</strong>
            {t.sourceDepartmentName && <span>from {t.sourceDepartmentName}</span>}
          </div>
          <div className="template-library-actions">
            <button type="button" className="btn btn-primary btn-small" onClick={() => onApply(t)}>
              Use
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onRename(t)}>
              Rename
            </button>
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onDelete(t)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
