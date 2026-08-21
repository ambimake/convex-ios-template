import SwiftUI

// A neutral paywall scaffold — deliberately unstyled. This is a starting point
// to RESTYLE for your app's look and feel, not a finished design. It wires the
// generic pieces: a plan headline, purchase/restore actions, and the metered
// "free uses remaining" banner driven by TemplateAccessPolicy. Gating decisions
// come from the backend-owned entitlement (convex/subscription.ts); this view
// only presents them and forwards user intent.

struct TemplatePaywallOption: Identifiable, Equatable {
    let id: String        // StoreKit product id
    let title: String     // e.g. "Pro Monthly"
    let priceText: String // localized price from StoreKit Product.displayPrice
    let subtitle: String?
}

struct TemplatePaywallView: View {
    let options: [TemplatePaywallOption]
    let accessState: TemplateAccessPolicy.AccessState
    let onPurchase: (TemplatePaywallOption) -> Void
    let onRestore: () -> Void
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Text("Upgrade to Pro")
                .font(.title.bold())
                .accessibilityIdentifier("paywall.title")

            if case let .visible(remaining, total) = TemplateAccessPolicy.banner(state: accessState) {
                Text("\(remaining) of \(total) free uses left")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .accessibilityIdentifier("paywall.meteredBanner")
            }

            ForEach(options) { option in
                Button {
                    onPurchase(option)
                } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(option.title).font(.headline)
                        if let subtitle = option.subtitle {
                            Text(subtitle).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(option.priceText).font(.subheadline)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .buttonStyle(.borderedProminent)
                .accessibilityIdentifier("paywall.option.\(option.id)")
            }

            Button("Restore Purchases", action: onRestore)
                .accessibilityIdentifier("paywall.restore")
            Button("Not now", action: onDismiss)
                .accessibilityIdentifier("paywall.dismiss")
        }
        .padding()
    }
}
