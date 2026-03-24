import { useEffect, useRef } from 'react'
import { drawBallPreviewToCanvas } from '../../game/createGame'
import type { BallLevel } from '../../game/types'

type FinalStagePreviewArtProps = {
  level: BallLevel
  size: number
  silhouette?: boolean
  className?: string
  label: string
}

export function FinalStagePreviewArt({ level, size, silhouette = false, className, label }: FinalStagePreviewArtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    drawBallPreviewToCanvas(canvas, level, size, { silhouette })
  }, [level, size, silhouette])

  return <canvas ref={canvasRef} className={className} aria-label={label} />
}
