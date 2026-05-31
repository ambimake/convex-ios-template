import Foundation

final class TemplateSentryUserScope {
    private(set) var ownerKey: String?

    func bind(ownerKey: String) {
        self.ownerKey = ownerKey
    }

    func clear() {
        ownerKey = nil
    }
}
