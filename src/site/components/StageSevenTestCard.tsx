import { FinalStagePreviewArt } from './FinalStagePreviewArt'
import type { BallDefinition } from '../../game/entities/fruits'
import { SectionTitle } from './SectionTitle'

type StageSevenTestCardProps = {
  definition: BallDefinition
}

export function StageSevenTestCard({ definition }: StageSevenTestCardProps) {
  return (
    <section className="card stage-seven-test-card">
      <SectionTitle eyebrow="Test View" title="Stage 7 preview" />
      <p className="stage-seven-test-card__copy">Actual render on the left, silhouette reference on the right.</p>
      <div className="stage-seven-test-grid">
        <div className="stage-seven-render-panel">
          <span className="hud-label">Rendered ball</span>
          <FinalStagePreviewArt
            level={definition.level}
            size={220}
            className="stage-seven-render-canvas"
            label="Stage 7 rendered preview"
          />
        </div>
        <div className="stage-seven-silhouette-panel">
          <span className="hud-label">Silhouette</span>
          <div className="final-stage-preview final-stage-preview--test">
            <div className="final-stage-preview__copy">
              <strong>{definition.name}</strong>
            </div>
            <div className="final-stage-preview__art">
              <FinalStagePreviewArt
                level={definition.level}
                size={220}
                silhouette
                className="final-stage-preview__canvas final-stage-preview__canvas--test"
                label="Stage 7 silhouette preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
