import XCTest
@testable import VoiceAgentTemplate

final class TemplateProductAnalyticsTests: XCTestCase {
    func testPostHogConfigParsesValues() throws {
        let config = try XCTUnwrap(TemplatePostHogConfiguration.parse([
            "POSTHOG_API_KEY": "ph_test",
            "POSTHOG_HOST": "https://app.posthog.com",
        ]))

        XCTAssertEqual(config.apiKey, "ph_test")
        XCTAssertEqual(config.host.absoluteString, "https://app.posthog.com")
    }

    func testAnalyticsNoopsWhenConfigIsAbsent() {
        var events: [String] = []
        let analytics = TemplateProductAnalytics(configuration: nil) { event, _ in
            events.append(event)
        }

        analytics.capture("command_submitted", properties: ["source": "typed"])

        XCTAssertTrue(events.isEmpty)
    }
}
