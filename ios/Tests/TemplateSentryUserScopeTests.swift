import XCTest
@testable import VoiceAgentTemplate

final class TemplateSentryUserScopeTests: XCTestCase {
    func testBindsAndClearsOwnerKey() {
        let scope = TemplateSentryUserScope()

        scope.bind(ownerKey: "test|user-1")
        XCTAssertEqual(scope.ownerKey, "test|user-1")

        scope.clear()
        XCTAssertNil(scope.ownerKey)
    }
}
