import { DashboardShell } from '../components/DashboardShell'
import type { ProgressionState } from '../progression'
import { SKIN_CATALOG, getEquippedSkin } from '../progression'
import type { Route } from '../router'

type MarketPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
  onBuySkin: (skinId: string) => void
  onEquipSkin: (skinId: string) => void
}

export function MarketPage({ navigate, progression, onBuySkin, onEquipSkin }: MarketPageProps) {
  const equipped = getEquippedSkin(progression)

  return (
    <DashboardShell
      route="/market"
      navigate={navigate}
      progression={progression}
      title="Market"
      description="Spend emeralds on calmer cosmetic upgrades without breaking the existing garden world. Each unlock is a soft extension of the same Perfect Drop language."
    >
      <section className="market-grid">
        {SKIN_CATALOG.map((skin) => {
          const isOwned = progression.ownedSkinIds.includes(skin.id)
          const isEquipped = progression.equippedSkinId === skin.id
          const isLockedByLevel = progression.level < skin.unlockLevel
          const canAfford = progression.emeralds >= skin.price
          const actionLabel = isEquipped
            ? 'Equipped'
            : isOwned
              ? 'Equip'
              : isLockedByLevel
                ? `Unlock at Lv.${skin.unlockLevel}`
                : canAfford
                  ? `Buy for ${skin.price}`
                  : `Need ${skin.price}`

          return (
            <article className={isEquipped ? 'card market-card is-equipped' : 'card market-card'} key={skin.id}>
              <div className="market-card__preview" style={{ background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.72), transparent 42%), ${skin.glow}` }}>
                <div className="market-card__orb" style={{ background: skin.accent }} />
                <div className="market-card__mist" style={{ background: skin.glow }} />
              </div>
              <div className="market-card__body">
                <div className="market-card__header">
                  <div>
                    <span className="section-title__eyebrow">{skin.category}</span>
                    <h3>{skin.name}</h3>
                  </div>
                  <span className="market-card__price">{skin.price === 0 ? 'Base' : `${skin.price}◆`}</span>
                </div>
                <p>{skin.description}</p>
                <p className="market-card__preview-copy">{skin.preview}</p>
                <div className="market-card__meta">
                  <span>{isOwned ? 'Owned' : isLockedByLevel ? `Level ${skin.unlockLevel}` : 'Ready to unlock'}</span>
                  <span>{isEquipped ? 'Attached' : skin.id === equipped.id ? 'Current look' : 'Inactive'}</span>
                </div>
                <button
                  className={isEquipped ? 'market-card__action is-equipped' : 'market-card__action'}
                  type="button"
                  disabled={isEquipped || (!isOwned && (isLockedByLevel || !canAfford))}
                  onClick={() => {
                    if (isOwned) {
                      onEquipSkin(skin.id)
                      return
                    }
                    onBuySkin(skin.id)
                  }}
                >
                  {actionLabel}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </DashboardShell>
  )
}
