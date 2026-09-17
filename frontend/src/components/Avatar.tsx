import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { getInitials } from '../utils/initials'

export function Avatar({
  photoUrl,
  hasPhoto,
  name,
  small,
  className,
}: {
  /** API path to fetch the image bytes from, e.g. '/me/photo' or `/employees/${id}/photo`. */
  photoUrl: string
  hasPhoto: boolean
  name: string | null | undefined
  small?: boolean
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!hasPhoto) {
      setImgSrc(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    apiClient
      .get(photoUrl, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setImgSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setImgSrc(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoUrl, hasPhoto])

  const sizeClass = small ? 'avatar-small' : ''
  const combinedClassName = ['avatar-circle', sizeClass, className].filter(Boolean).join(' ')

  if (imgSrc) {
    return <img src={imgSrc} alt={name ?? 'Avatar'} className={`${combinedClassName} avatar-photo`} />
  }

  return <div className={combinedClassName}>{getInitials(name)}</div>
}
