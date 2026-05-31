import Foundation

struct TemplatePostHogConfiguration: Equatable {
    let apiKey: String
    let host: URL

    static func parse(_ dictionary: [String: String]) -> TemplatePostHogConfiguration? {
        guard
            let apiKey = dictionary["POSTHOG_API_KEY"], !apiKey.isEmpty,
            let hostValue = dictionary["POSTHOG_HOST"],
            let host = URL(string: hostValue)
        else {
            return nil
        }
        return TemplatePostHogConfiguration(apiKey: apiKey, host: host)
    }

    static func fromBundle(_ bundle: Bundle = .main) -> TemplatePostHogConfiguration? {
        let values = [
            "POSTHOG_API_KEY": bundle.object(forInfoDictionaryKey: "POSTHOG_API_KEY") as? String ?? "",
            "POSTHOG_HOST": bundle.object(forInfoDictionaryKey: "POSTHOG_HOST") as? String ?? "",
        ]
        return parse(values)
    }
}

struct TemplateProductAnalytics {
    private let configuration: TemplatePostHogConfiguration?
    private let sink: (String, [String: String]) -> Void

    init(
        configuration: TemplatePostHogConfiguration?,
        sink: @escaping (String, [String: String]) -> Void = { _, _ in }
    ) {
        self.configuration = configuration
        self.sink = sink
    }

    func capture(_ event: String, properties: [String: String]) {
        guard configuration != nil else { return }
        sink(event, properties)
    }
}
