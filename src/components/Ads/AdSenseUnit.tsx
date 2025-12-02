import { useEffect, useRef } from 'react'
import { Box } from '@mantine/core'
import { useAds } from '../../contexts/AdsContext'

interface AdSenseUnitProps {
  slot: string
  layout?: 'in-article' | 'fluid' | 'display'
  style?: React.CSSProperties
}

// Google AdSense の手動広告ユニット
export default function AdSenseUnit({ slot, layout = 'display', style }: AdSenseUnitProps) {
  const { adsEnabled } = useAds()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!adsEnabled) return
    try {
      // @ts-ignore
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [adsEnabled])

  if (!adsEnabled) return null

  const client = 'ca-pub-9780206641404014'

  return (
    <Box ref={ref} style={{ display: 'block', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={layout === 'display' ? 'auto' : layout}
        data-full-width-responsive="true"
      />
    </Box>
  )
}


