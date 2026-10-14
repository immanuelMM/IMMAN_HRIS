import { QRCodeCanvas } from 'qrcode.react'
import { Avatar } from './Avatar'
import { DepartmentLogo } from './DepartmentLogo'
import { Icon } from './Icon'
import type { IdCardTemplate } from '../api/types'

export interface IdCardPersonData {
  fullName: string
  roleOrPosition: string
  departmentName: string
  employeeNo: string
  contactNumber: string
  address: string
  email: string
  photoUrl: string
  hasPhoto: boolean
  logoUrl: string
  hasLogo: boolean
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="idf-field-row">
      <span className="idf-field-label">{label}</span>
      <span className="idf-field-colon">:</span>
      <span className="idf-field-value">{value}</span>
    </div>
  )
}

export function IdCardFrontInner({ template, data }: { template: IdCardTemplate; data: IdCardPersonData }) {
  switch (template) {
    case 'arch':
      return (
        <>
          <div className="arch-header">
            <DepartmentLogo logoUrl={data.logoUrl} hasLogo={data.hasLogo} size={14} />
            <span>{data.departmentName}</span>
          </div>
          <div className="arch-photo-wrap">
            <Avatar photoUrl={data.photoUrl} hasPhoto={data.hasPhoto} name={data.fullName} className="arch-photo" />
          </div>
          <div className="arch-identity">
            <div className="arch-name">{data.fullName}</div>
            <div className="arch-role">{data.roleOrPosition}</div>
          </div>
          <div className="arch-fields">
            <FieldRow label="ID NO" value={data.employeeNo} />
            <FieldRow label="Dept." value={data.departmentName} />
            <FieldRow label="Phone" value={data.contactNumber} />
            <FieldRow label="E-mail" value={data.email} />
          </div>
        </>
      )

    case 'chevron':
      return (
        <>
          <div className="chevron-shape chevron-shape-2" />
          <div className="chevron-shape chevron-shape-1" />
          <div className="chevron-header">
            <DepartmentLogo logoUrl={data.logoUrl} hasLogo={data.hasLogo} size={14} />
            <span>{data.departmentName}</span>
          </div>
          <div className="chevron-photo-wrap">
            <Avatar photoUrl={data.photoUrl} hasPhoto={data.hasPhoto} name={data.fullName} className="chevron-photo" />
          </div>
          <div className="chevron-identity">
            <div className="chevron-name">{data.fullName}</div>
            <div className="chevron-role">{data.roleOrPosition}</div>
          </div>
          <div className="chevron-contact">
            <span className="id-card-contact-line" title={data.contactNumber}>
              <Icon name="phone" size={11} /> {data.contactNumber}
            </span>
            <span className="id-card-contact-line" title={data.email}>
              <Icon name="mail" size={11} /> {data.email}
            </span>
          </div>
          <div className="chevron-barcode" />
          <div className="chevron-footer">
            <span>{data.employeeNo}</span>
            <span>Official Employee ID</span>
          </div>
        </>
      )

    case 'stripe':
      return (
        <>
          <div className="stripe-band stripe-band-top" />
          <div className="stripe-top-label">
            <DepartmentLogo logoUrl={data.logoUrl} hasLogo={data.hasLogo} size={14} />
            <span>{data.departmentName}</span>
          </div>
          <div className="stripe-photo-wrap">
            <Avatar photoUrl={data.photoUrl} hasPhoto={data.hasPhoto} name={data.fullName} className="stripe-photo" />
          </div>
          <div className="stripe-identity">
            <div className="stripe-name">{data.fullName}</div>
            <div className="stripe-role">{data.roleOrPosition}</div>
          </div>
          <div className="arch-fields">
            <FieldRow label="ID NO" value={data.employeeNo} />
            <FieldRow label="Phone" value={data.contactNumber} />
            <FieldRow label="E-mail" value={data.email} />
          </div>
          <div className="stripe-band stripe-band-bottom" />
        </>
      )

    case 'wave':
    default:
      return (
        <>
          <div className="id-card-band">
            <DepartmentLogo logoUrl={data.logoUrl} hasLogo={data.hasLogo} size={16} />
            <span>{data.departmentName}</span>
          </div>
          <div className="id-card-body">
            <Avatar photoUrl={data.photoUrl} hasPhoto={data.hasPhoto} name={data.fullName} className="id-card-avatar" />
            <div className="id-card-identity">
              <div className="id-card-name">{data.fullName}</div>
              <div className="id-card-role">{data.roleOrPosition}</div>
              <div className="id-card-contact">
                <span className="id-card-contact-line" title={data.contactNumber}>
                  <Icon name="phone" size={11} /> {data.contactNumber}
                </span>
                <span className="id-card-contact-line" title={data.address}>
                  <Icon name="map-pin" size={11} /> {data.address}
                </span>
              </div>
            </div>
          </div>
          <div className="id-card-footer">
            <span>{data.employeeNo}</span>
            <span>Official Employee ID</span>
          </div>
        </>
      )
  }
}

export function IdCardBackInner({
  template,
  data,
  token,
  error,
}: {
  template: IdCardTemplate
  data: IdCardPersonData
  token: string | null
  error: string | null
}) {
  const qrSize = template === 'wave' ? 116 : 100
  const qr = (
    <>
      {error && <p className="form-error">{error}</p>}
      {!error && token && (
        <div className="id-card-qr-wrap">
          <QRCodeCanvas value={token} size={qrSize} level="M" includeMargin={false} />
        </div>
      )}
      {!error && !token && <p className="id-card-loading">Loading QR...</p>}
    </>
  )

  switch (template) {
    case 'arch':
      return (
        <>
          <div className="arch-header arch-header-small">
            <span>Scan for Attendance</span>
          </div>
          <div className="arch-back-body">
            {qr}
            <p className="id-card-instructions">Present this code to the admin scanner to clock in or out.</p>
          </div>
          <div className="id-card-footer">
            <span>{data.employeeNo}</span>
            <span>Valid while employed</span>
          </div>
        </>
      )

    case 'chevron':
      return (
        <>
          <div className="chevron-shape chevron-shape-2" />
          <div className="chevron-shape chevron-shape-1" />
          <div className="chevron-header">
            <span>Scan for Attendance</span>
          </div>
          <div className="chevron-back-body">
            {qr}
            <p className="id-card-instructions">Present this code to the admin scanner to clock in or out.</p>
          </div>
          <div className="chevron-footer">
            <span>{data.employeeNo}</span>
            <span>Valid while employed</span>
          </div>
        </>
      )

    case 'stripe':
      return (
        <>
          <div className="stripe-band stripe-band-top" />
          <div className="stripe-back-body">
            {qr}
            <p className="id-card-instructions">Present this code to the admin scanner to clock in or out.</p>
          </div>
          <div className="stripe-band stripe-band-bottom" />
        </>
      )

    case 'wave':
    default:
      return (
        <>
          <div className="id-card-band id-card-band-alt">
            <span>Scan for Attendance</span>
          </div>
          <div className="id-card-back-body">
            {qr}
            <p className="id-card-instructions">Present this code to the admin scanner to clock in or out.</p>
          </div>
          <div className="id-card-footer">
            <span>{data.employeeNo}</span>
            <span>Valid while employed</span>
          </div>
        </>
      )
  }
}
