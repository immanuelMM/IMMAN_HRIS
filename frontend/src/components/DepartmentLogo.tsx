import { useEffect, useState } from 'react'
import { apiClient } from '../api/client'
import { Icon } from './Icon'

/** Shows a department's uploaded logo image, or a generic building icon when none is set. */
export function DepartmentLogo({
  logoUrl,
  hasLogo,
  size = 20,
  className,
}: {
  /** API path to fetch the image bytes from, e.g. `/departments/${id}/logo`. */
  logoUrl: string
  hasLogo: boolean
  size?: number
  className?: string
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!hasLogo) {
      setImgSrc(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    apiClient
      .get(logoUrl, { responseType: 'blob' })
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
  }, [logoUrl, hasLogo])

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt="Department logo"
        className={className}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }}
      />
    )
  }

  return <Icon name="building" size={size} className={className} />
}
