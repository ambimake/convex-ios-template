import XCTest
@testable import VoiceAgentTemplate

final class TemplateVoiceCaptureStateTests: XCTestCase {
    func testGrantedPermissionStartsRecording() {
        XCTAssertEqual(TemplateVoiceCaptureState.start(permission: .granted), .recording)
    }

    func testMicrophoneDeniedMapsToTypedFallback() {
        XCTAssertEqual(
            TemplateVoiceCaptureState.start(permission: .denied),
            .typedFallback(reason: "permission_denied")
        )
    }
}
