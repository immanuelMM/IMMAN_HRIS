import { useEffect, useState, type FormEvent } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from '../../api/departments'
import type { Department } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

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
      await createDepartment(name.trim(), description.trim() || null)
      setName('')
      setDescription('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to create department.'))
    } finally {
      setCreating(false)
    }
  }

  function startEdit(dept: Department) {
    setEditingId(dept.id)
    setEditName(dept.name)
    setEditDescription(dept.description ?? '')
  }

  async function saveEdit() {
    if (editingId === null) return
    try {
      await updateDepartment(editingId, editName.trim(), editDescription.trim() || null)
      setEditingId(null)
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update department.'))
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
        <button type="submit" className="btn btn-primary" disabled={creating}>
          Add Department
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading departments...</p>}

      {!loading && (
        <div className="table-scroll card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Employees</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  {editingId === dept.id ? (
                    <>
                      <td>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </td>
                      <td>
                        <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                      </td>
                      <td>{dept.employeeCount}</td>
                      <td className="row-actions">
                        <button type="button" className="btn btn-primary" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{dept.name}</td>
                      <td>{dept.description ?? '—'}</td>
                      <td>{dept.employeeCount}</td>
                      <td className="row-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => startEdit(dept)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(dept.id)}>
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
