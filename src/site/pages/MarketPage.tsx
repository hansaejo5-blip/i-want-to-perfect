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
}

type MarketStatus = 'buy' | 'equipped' | 'owned' | 'not-enough'

function getStatus(item: MarketItemDefinition, progression: ProgressionState): MarketStatus {
  const isOwned = progression.ownedItemIds.includes(item.id)
  const isEquipped = item.kind === 'background'
    ? progression.equippedBackgroundId === item.id
    : progression.equippedSkinId === item.id

  if (isEquipped) {
    return 'equipped'
  }
  if (isOwned) {
    return 'owned'
  }
  if (progression.level < item.unlockLevel || progression.emeralds < item.price) {
    return 'not-enough'
  }
  return 'buy'
}

function getPrimaryLabel(item: MarketItemDefinition, progression: ProgressionState, status: MarketStatus) {
  if (progression.level < item.unlockLevel) {
    return `Lv.${item.unlockLevel} required`
  }

  switch (status) {
    case 'equipped':
      return 'Equipped'
    case 'owned':
      return 'Owned'
    case 'not-enough':
      return 'Not enough emeralds'
    default:
      return 'Buy'
  }
}

export function MarketPage({ navigate, progression, onBuySkin, onEquipSkin }: MarketPageProps) {
  const equippedBackground = getEquippedBackground(progression)
  const equippedSkin = getEquippedSkin(progression)
  const affordableCount = MARKET_CATALOG.filter((item) => progression.level >= item.unlockLevel && progression.emeralds >= item.price && !progression.ownedItemIds.includes(item.id)).length

  return (
    <DashboardShell
      route="/market"
      navigate={navigate}
      progression={progression}
      title="Market"
      description="Spend emeralds on a slower cosmetic economy where the first purchase feels meaningful and the second still needs a target."
    >
      <section className="market-overview-grid">
        <article className="card market-overview-card">
          <span className="section-title__eyebrow">Emerald Balance</span>
          <h2>{progression.emeralds} emeralds ready</h2>
          <p>{affordableCount > 0 ? `${affordableCount} featured item${affordableCount > 1 ? 's are' : ' is'} affordable right now.` : 'Nothing is fully affordable yet. A few more strong runs or daily clears will change that.'}</p>
        </article>
        <article className="card market-overview-card">
          <span className="section-title__eyebrow">Equipped</span>
          <h2>{equippedBackground.name}</h2>
          <p>{equippedSkin.name} is your active drop skin.</p>
        </article>
        <article className="card market-overview-card">
          <span className="section-title__eyebrow">Decision Pressure</span>
          <h2>Starter before Rare</h2>
          <p>Moonlit Greenhouse lands first at 136. Dewdrop Seed Set asks for a rarer spend at 198, so a single daily sweep will not trivialize both purchases.</p>
        </article>
      </section>

      <section className="market-affordability-grid">
        {MARKET_CATALOG.map((item) => {
          const shortfall = Math.max(item.price - progression.emeralds, 0)
          const canAfford = shortfall === 0 && progression.level >= item.unlockLevel
          return (
            <article className="card market-affordability-card" key={item.id + '-affordability'}>
              <span className="section-title__eyebrow">{item.name}</span>
              <strong>{item.price}◆</strong>
              <p>{canAfford ? 'Ready to buy now.' : progression.level < item.unlockLevel ? `Unlocks at level ${item.unlockLevel}.` : `${shortfall}◆ more needed.`}</p>
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
                <p>{item.description}</p>
                <p className="market-card__preview-copy">{item.supportingLine}</p>
                <p className="market-card__preview-copy">{item.preview}</p>
                <div className="market-card__meta">
                  <span>Current emeralds: {progression.emeralds}◆</span>
                  <span>{levelLocked ? `Level ${item.unlockLevel} required` : shortfall > 0 ? `${shortfall}◆ short` : 'Enough saved'}</span>
                </div>
                <div className="market-card__status-row">
                  <span className={`market-status-pill market-status-pill--${status}`}>{status === 'buy' ? 'Buy' : status === 'owned' ? 'Owned' : status === 'equipped' ? 'Equipped' : 'Not enough emeralds'}</span>
                  <span>{isOwned ? 'Purchase saved in local progression.' : 'Daily targets are the fastest emerald source.'}</span>
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
                    className={isOwned && !isEquipped ? 'market-card__action market-card__action--secondary' : 'market-card__action market-card__action--secondary is-disabled'}
                    type="button"
                    disabled={!isOwned || isEquipped}
                    onClick={() => onEquipSkin(item.id)}
                  >
                    {isEquipped ? 'Equipped' : isOwned ? 'Equip' : 'Owned'}
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
