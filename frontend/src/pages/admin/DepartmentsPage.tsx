import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { DepartmentLogo } from '../../components/DepartmentLogo'
import { Icon } from '../../components/Icon'
import {
  addDepartmentPosition,
  createDepartment,
  deleteDepartment,
  deleteDepartmentLogo,
  deleteDepartmentPosition,
  listDepartments,
  updateDepartment,
  uploadDepartmentLogo,
} from '../../api/departments'
import type { CardOrientation, Department, IdCardTemplate } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

const DEFAULT_COLOR = '#0d9488'
const DEFAULT_SECONDARY_COLOR = '#7c3aed'

const TEMPLATE_OPTIONS: { value: IdCardTemplate; label: string }[] = [
  { value: 'wave', label: 'Wave Gradient' },
  { value: 'arch', label: 'Arch Classic' },
  { value: 'chevron', label: 'Diagonal Chevron' },
  { value: 'stripe', label: 'Diagonal Stripe' },
  { value: 'custom', label: 'Custom (ID Designer)' },
]

const ORIENTATION_OPTIONS: { value: CardOrientation; label: string }[] = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

function TemplateSelect({ value, onChange }: { value: IdCardTemplate; onChange: (v: IdCardTemplate) => void }) {
  return (
    <label className="color-field">
      ID Card Style
      <select value={value} onChange={(e) => onChange(e.target.value as IdCardTemplate)}>
        {TEMPLATE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function OrientationSelect({ value, onChange }: { value: CardOrientation; onChange: (v: CardOrientation) => void }) {
  return (
    <label className="color-field">
      Orientation
      <select value={value} onChange={(e) => onChange(e.target.value as CardOrientation)}>
        {ORIENTATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teamColor, setTeamColor] = useState(DEFAULT_COLOR)
  const [teamColorSecondary, setTeamColorSecondary] = useState<string | null>(null)
  const [idCardTemplate, setIdCardTemplate] = useState<IdCardTemplate>('wave')
  const [cardOrientation, setCardOrientation] = useState<CardOrientation>('horizontal')
  const [creating, setCreating] = useState(false)

  function load() {
    setLoading(true)
    listDepartments()
      .then(setDepartments)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load departments.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      await createDepartment({
        name: name.trim(),
        description: description.trim() || null,
        teamColor,
        teamColorSecondary,
        idCardTemplate,
        cardOrientation,
      })
      setName('')
      setDescription('')
      setTeamColor(DEFAULT_COLOR)
      setTeamColorSecondary(null)
      setIdCardTemplate('wave')
      setCardOrientation('horizontal')
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create department.'))
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this department? This only works if no employees are assigned to it.')) return
    try {
      await deleteDepartment(id)
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete department.'))
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Departments</h1>
      </div>

      <form onSubmit={handleCreate} className="inline-form card">
        <input placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TeamColorPicker primary={teamColor} secondary={teamColorSecondary} onPrimaryChange={setTeamColor} onSecondaryChange={setTeamColorSecondary} />
        <TemplateSelect value={idCardTemplate} onChange={setIdCardTemplate} />
        <OrientationSelect value={cardOrientation} onChange={setCardOrientation} />
        <button type="submit" className="btn btn-primary" disabled={creating}>
          Add Department
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading departments...</p>}

      {!loading && (
        <div className="department-grid">
          {departments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} onChanged={load} onDelete={() => handleDelete(dept.id)} />
          ))}
          {departments.length === 0 && <p className="resume-empty">No departments yet.</p>}
        </div>
      )}
    </AdminLayout>
  )
}

function TeamColorPicker({
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
}: {
  primary: string
  secondary: string | null
  onPrimaryChange: (color: string) => void
  onSecondaryChange: (color: string | null) => void
}) {
  return (
    <div className="team-color-picker">
      <label className="color-field">
        Team Color
        <input type="color" value={primary} onChange={(e) => onPrimaryChange(e.target.value)} />
      </label>
      {secondary ? (
        <label className="color-field">
          2nd Color (gradient)
          <span className="color-field-row">
            <input type="color" value={secondary} onChange={(e) => onSecondaryChange(e.target.value)} />
            <button type="button" className="btn btn-ghost btn-small" onClick={() => onSecondaryChange(null)}>
              Remove
            </button>
          </span>
        </label>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => onSecondaryChange(DEFAULT_SECONDARY_COLOR)}
        >
          + Add 2nd Color (Gradient)
        </button>
      )}
    </div>
  )
}

function DepartmentCard({
  department,
  onChanged,
  onDelete,
}: {
  department: Department
  onChanged: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(department.name)
  const [editDescription, setEditDescription] = useState(department.description ?? '')
  const [editColor, setEditColor] = useState(department.teamColor ?? DEFAULT_COLOR)
  const [editColorSecondary, setEditColorSecondary] = useState<string | null>(department.teamColorSecondary)
  const [editTemplate, setEditTemplate] = useState<IdCardTemplate>(department.idCardTemplate)
  const [editOrientation, setEditOrientation] = useState<CardOrientation>(department.cardOrientation)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [logoBusy, setLogoBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newPosition, setNewPosition] = useState('')
  const [positionBusy, setPositionBusy] = useState(false)

  function startEdit() {
    setEditName(department.name)
    setEditDescription(department.description ?? '')
    setEditColor(department.teamColor ?? DEFAULT_COLOR)
    setEditColorSecondary(department.teamColorSecondary)
    setEditTemplate(department.idCardTemplate)
    setEditOrientation(department.cardOrientation)
    setEditing(true)
  }

  async function saveEdit() {
    setSaving(true)
    setError(null)
    try {
      await updateDepartment(department.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        teamColor: editColor,
        teamColorSecondary: editColorSecondary,
        idCardTemplate: editTemplate,
        cardOrientation: editOrientation,
      })
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update department.'))
    } finally {
      setSaving(false)
    }
  }

  function handleChooseLogo() {
    fileInputRef.current?.click()
  }

  async function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setLogoBusy(true)
    setError(null)
    try {
      await uploadDepartmentLogo(department.id, file)
      onChanged()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to upload logo.'))
    } finally {
      setLogoBusy(false)
    }
  }

  async function handleRemoveLogo() {
    setLogoBusy(true)
    setError(null)
    try {
      await deleteDepartmentLogo(department.id)
      onChanged()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to remove logo.'))
    } finally {
      setLogoBusy(false)
    }
  }

  async function handleAddPosition(e: FormEvent) {
    e.preventDefault()
    if (!newPosition.trim()) return
    setPositionBusy(true)
    setError(null)
    try {
      await addDepartmentPosition(department.id, newPosition.trim())
      setNewPosition('')
      onChanged()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to add position.'))
    } finally {
      setPositionBusy(false)
    }
  }

  async function handleRemovePosition(positionId: number) {
    setPositionBusy(true)
    setError(null)
    try {
      await deleteDepartmentPosition(department.id, positionId)
      onChanged()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to remove position.'))
    } finally {
      setPositionBusy(false)
    }
  }

  return (
    <div className="card department-card">
      <div className="department-card-header">
        <div className="department-logo-wrap">
          <DepartmentLogo logoUrl={`/departments/${department.id}/logo`} hasLogo={department.hasLogo} size={40} />
        </div>
        <div className="department-card-title">
          {editing ? (
            <input value={editName} onChange={(e) => setEditName(e.target.value)} />
          ) : (
            <h2>{department.name}</h2>
          )}
          <span
            className="department-color-swatch"
            style={{
              background: department.teamColorSecondary
                ? `linear-gradient(135deg, ${department.teamColor ?? DEFAULT_COLOR}, ${department.teamColorSecondary})`
                : department.teamColor ?? DEFAULT_COLOR,
            }}
            title={[department.teamColor ?? DEFAULT_COLOR, department.teamColorSecondary].filter(Boolean).join(' → ')}
          />
        </div>
        <span className="department-employee-count">{department.employeeCount} employees</span>
      </div>

      {editing ? (
        <input
          className="department-description-input"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description (optional)"
        />
      ) : (
        <p className="department-description">{department.description ?? 'No description.'}</p>
      )}

      {error && <p className="form-error">{error}</p>}

      <div className="department-card-section">
        <div className="section-header">
          <h3 className="settings-section-title">Logo</h3>
        </div>
        <div className="department-logo-actions">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={handleLogoSelected} />
          <button type="button" className="btn btn-ghost btn-small" onClick={handleChooseLogo} disabled={logoBusy}>
            <Icon name="upload" size={14} /> {department.hasLogo ? 'Replace' : 'Upload'} Logo
          </button>
          {department.hasLogo && (
            <button type="button" className="btn btn-ghost btn-small" onClick={handleRemoveLogo} disabled={logoBusy}>
              Remove Logo
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="department-card-section">
          <TeamColorPicker
            primary={editColor}
            secondary={editColorSecondary}
            onPrimaryChange={setEditColor}
            onSecondaryChange={setEditColorSecondary}
          />
          <div className="department-template-field">
            <TemplateSelect value={editTemplate} onChange={setEditTemplate} />
            <OrientationSelect value={editOrientation} onChange={setEditOrientation} />
          </div>
        </div>
      ) : (
        <p className="department-template-label">
          ID Card Style: <strong>{TEMPLATE_OPTIONS.find((o) => o.value === department.idCardTemplate)?.label}</strong>
          {' · '}
          {ORIENTATION_OPTIONS.find((o) => o.value === department.cardOrientation)?.label}
        </p>
      )}

      {!editing && (
        <Link to={`/admin/departments/${department.id}/id-designer`} className="btn btn-ghost btn-small department-design-btn">
          <Icon name="id-card" size={14} /> {department.idCardTemplate === 'custom' ? 'Edit Custom ID Design' : 'Design Custom ID'}
        </Link>
      )}

      <div className="department-card-section">
        <h3 className="settings-section-title">Available Positions</h3>
        <div className="department-position-list">
          {department.positions.length === 0 && <span className="resume-empty">No positions defined yet.</span>}
          {department.positions.map((pos) => (
            <span key={pos.id} className="department-position-chip">
              {pos.title}
              <button
                type="button"
                onClick={() => handleRemovePosition(pos.id)}
                disabled={positionBusy}
                aria-label={`Remove ${pos.title}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <form className="department-position-form" onSubmit={handleAddPosition}>
          <input
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value)}
            placeholder="e.g. Line Leader"
          />
          <button type="submit" className="btn btn-ghost btn-small" disabled={positionBusy || !newPosition.trim()}>
            + Add
          </button>
        </form>
      </div>

      <div className="row-actions department-card-actions">
        {editing ? (
          <>
            <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={startEdit}>
              Edit
            </button>
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}
