import Foundation

// Pure, stateless access-gating rule engine (generic version of a paywall rule
// engine). The subscription state owner holds the state; this encodes every
// gating rule as pure functions — no StoreKit, no Keychain, no @MainActor, no UI.
// Mirrors the backend logic in convex/lib/subscriptionPlan.ts so gating is
// consistent on both sides. See docs/guides/payments.md.
enum TemplateAccessPolicy {

    // Value-type snapshot. `hasProAccess` comes from the backend-owned entitlement
    // (the source of truth). `metered` is an optional free-tier allowance: N free
    // premium uses before the paywall. Set maxMeteredUses = 0 for a plain hard gate.
    struct AccessState: Equatable {
        let hasProAccess: Bool
        let meteredUsed: Int
        let maxMeteredUses: Int

        var hasRemainingMetered: Bool { meteredUsed < maxMeteredUses }

        var tier: Tier {
            if hasProAccess { return .pro }
            if maxMeteredUses > 0 && hasRemainingMetered { return .metered }
            return .free
        }

        enum Tier { case pro, metered, free }
    }

    enum GateDecision { case allow, showPaywall }
    enum BadgeDecision {
        case hidden
        case badgeOnly          // free tier: badge replaces the control
        case badgeWithControl   // metered tier: badge alongside a usable control
    }
    enum BannerVisibility {
        case visible(remaining: Int, total: Int)
        case hidden
    }
    enum AccountDisplay {
        case pro
        case metered(remaining: Int, total: Int)
        case free
    }

    /// Whether a premium feature is usable or should raise the paywall.
    static func gate(state: AccessState, isFeaturePremium: Bool) -> GateDecision {
        guard isFeaturePremium else { return .allow }
        return state.tier == .free ? .showPaywall : .allow
    }

    /// Which "Pro" badge treatment a premium control should show.
    static func badge(state: AccessState, isFeaturePremium: Bool) -> BadgeDecision {
        guard isFeaturePremium else { return .hidden }
        switch state.tier {
        case .pro: return .hidden
        case .metered: return .badgeWithControl
        case .free: return .badgeOnly
        }
    }

    /// A "N of M free uses left" banner is shown only in the metered tier.
    static func banner(state: AccessState) -> BannerVisibility {
        guard state.tier == .metered else { return .hidden }
        return .visible(remaining: state.maxMeteredUses - state.meteredUsed, total: state.maxMeteredUses)
    }

    /// Account-status display, e.g. in Settings.
    static func accountDisplay(state: AccessState) -> AccountDisplay {
        switch state.tier {
        case .pro: return .pro
        case .metered:
            return .metered(remaining: state.maxMeteredUses - state.meteredUsed, total: state.maxMeteredUses)
        case .free: return .free
        }
    }
}
