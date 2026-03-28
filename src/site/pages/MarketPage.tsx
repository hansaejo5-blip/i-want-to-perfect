import { DashboardShell } from '../components/DashboardShell'
import type { ProgressionState } from '../progression'
import {
  MARKET_CATALOG,
  getEquippedBackground,
  getEquippedSkin,
  type MarketItemDefinition,
} from '../progression'
import type { Route } from '../router'

type MarketPageProps = {
  navigate: (route: Route) => void
  progression: ProgressionState
  onBuySkin: (itemId: string) => void
  onEquipSkin: (itemId: string) => void
  onUnequipSkin: () => void
  onUnequipBackground: () => void
}

type MarketStatus = 'buy' | 'equipped' | 'owned' | 'not-enough'

function getStatus(item: MarketItemDefinition, progression: ProgressionState): MarketStatus {
  const isOwned = progression.ownedItemIds.includes(item.id)
  const isEquipped = item.kind === 'background'
    ? progression.equippedBackgroundId === item.id
    : progression.equippedSkinId === item.id

  if (isEquipped) return 'equipped'
  if (isOwned) return 'owned'
  if (progression.level < item.unlockLevel || progression.emeralds < item.price) return 'not-enough'
  return 'buy'
}

function getPrimaryLabel(item: MarketItemDefinition, progression: ProgressionState, status: MarketStatus) {
  if (progression.level < item.unlockLevel) return `Lv.${item.unlockLevel}`
  if (status === 'equipped') return 'Equipped'
  if (status === 'owned') return 'Owned'
  if (status === 'not-enough') return 'Need more ◆'
  return 'Buy'
}

export function MarketPage({ navigate, progression, onBuySkin, onEquipSkin, onUnequipSkin, onUnequipBackground }: MarketPageProps) {
  const equippedBackground = getEquippedBackground(progression)
  const equippedSkin = getEquippedSkin(progression)
  const affordableCount = MARKET_CATALOG.filter((item) => progression.level >= item.unlockLevel && progression.emeralds >= item.price && !progression.ownedItemIds.includes(item.id)).length

  return (
    <DashboardShell
      route="/market"
      navigate={navigate}
      progression={progression}
      title="Market"
      description="Emerald spend"
    >
      <section className="market-overview-grid market-overview-grid--visual">
        <article className="card market-overview-card market-overview-card--visual">
          <span className="market-overview-card__icon">◆</span>
          <h2>{progression.emeralds}</h2>
          <p>Balance</p>
        </article>
        <article className="card market-overview-card market-overview-card--visual">
          <span className="market-overview-card__icon">◔</span>
          <h2>{affordableCount}</h2>
          <p>Ready now</p>
        </article>
        <article className="card market-overview-card market-overview-card--visual">
          <span className="market-overview-card__icon">◎</span>
          <h2>{equippedSkin.name}</h2>
          <p>{equippedBackground.name}</p>
        </article>
      </section>

      <section className="market-affordability-grid">
        {MARKET_CATALOG.map((item) => {
          const shortfall = Math.max(item.price - progression.emeralds, 0)
          const canAfford = shortfall === 0 && progression.level >= item.unlockLevel
          return (
            <article className="card market-affordability-card" key={item.id + '-affordability'}>
              <span className="section-title__eyebrow">{item.kind}</span>
              <strong>{item.price}◆</strong>
              <p>{canAfford ? 'Ready' : progression.level < item.unlockLevel ? `Lv.${item.unlockLevel}` : `${shortfall}◆ left`}</p>
            </article>
          )
        })}
      </section>

      <section className="market-grid">
        {MARKET_CATALOG.map((item) => {
          const status = getStatus(item, progression)
          const isOwned = progression.ownedItemIds.includes(item.id)
          const isEquipped = status === 'equipped'
          const shortfall = Math.max(item.price - progression.emeralds, 0)
          const levelLocked = progression.level < item.unlockLevel

          return (
            <article className={isEquipped ? 'card market-card is-equipped' : 'card market-card'} key={item.id}>
              <div className={`market-card__preview ${item.previewClass}`}>
                {item.kind === 'background' ? (
                  <>
                    <div className="market-card__greenhouse-frame" />
                    <div className="market-card__greenhouse-foliage" />
                    <div className="market-card__greenhouse-stage" />
                  </>
                ) : (
                  <>
                    <div className="market-card__orb market-card__orb--dewdrop" style={{ background: item.accent, boxShadow: `0 18px 30px ${item.glow}` }}>
                      <span className="market-card__seed-core" />
                    </div>
                    <div className="market-card__mist" style={{ background: item.glow }} />
                  </>
                )}
              </div>
              <div className="market-card__body">
                <div className="market-card__header">
                  <div>
                    <span className="section-title__eyebrow">{item.kind} · {item.tier}</span>
                    <h3>{item.name}</h3>
                  </div>
                  <span className="market-card__price">{item.price}◆</span>
                </div>
                <div className="market-card__meta market-card__meta--visual">
                  <span>Lv.{item.unlockLevel}</span>
                  <span>{levelLocked ? 'Locked' : shortfall > 0 ? `${shortfall}◆ left` : 'Ready'}</span>
                  <span>{item.kind === 'skin' ? '◎ Skin' : '◔ Board'}</span>
                </div>
                <div className="market-card__status-row">
                  <span className={`market-status-pill market-status-pill--${status}`}>{status === 'buy' ? 'Buy' : status === 'owned' ? 'Owned' : status === 'equipped' ? 'Equipped' : 'Not enough'}</span>
                  <span>{isOwned ? 'Toggle here' : 'Save ◆'}</span>
                </div>
                <div className="market-card__actions">
                  <button
                    className={isEquipped ? 'market-card__action is-equipped' : 'market-card__action'}
                    type="button"
                    disabled={status !== 'buy'}
                    onClick={() => onBuySkin(item.id)}
                  >
                    {getPrimaryLabel(item, progression, status)}
                  </button>
                  <button
                    className={isOwned ? 'market-card__action market-card__action--secondary' : 'market-card__action market-card__action--secondary is-disabled'}
                    type="button"
                    disabled={!isOwned}
                    onClick={() => isEquipped ? item.kind === 'skin' ? onUnequipSkin() : onUnequipBackground() : onEquipSkin(item.id)}
                  >
                    {isEquipped ? item.kind === 'skin' ? 'Unequip skin' : 'Unequip board' : isOwned ? item.kind === 'skin' ? 'Equip skin' : 'Equip board' : 'Owned'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </DashboardShell>
  )
}
