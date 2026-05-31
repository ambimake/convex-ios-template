import Foundation

enum TemplateCommandSource: String, Codable, Equatable {
    case typed
    case voice
}

enum TemplateCommandStatus: String, Decodable, Equatable {
    case applied
}

enum TemplateAssistantOperation: Decodable, Equatable {
    case createEntry(body: String)

    private enum CodingKeys: String, CodingKey {
        case type
        case body
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "create_entry":
            self = .createEntry(body: try container.decode(String.self, forKey: .body))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type,
                in: container,
                debugDescription: "Unsupported assistant operation type: \(type)"
            )
        }
    }
}

struct TemplateAppliedEntry: Decodable, Equatable {
    let body: String
    let source: TemplateCommandSource
}

struct TemplateListedEntry: Decodable, Equatable {
    let body: String
    let source: TemplateCommandSource
}

struct TemplateCommandResult: Decodable, Equatable {
    let status: TemplateCommandStatus
    let summary: String
    let operations: [TemplateAssistantOperation]
    let entries: [TemplateAppliedEntry]

    init(
        status: TemplateCommandStatus = .applied,
        summary: String,
        operations: [TemplateAssistantOperation] = [],
        entries: [TemplateAppliedEntry]
    ) {
        self.status = status
        self.summary = summary
        self.operations = operations
        self.entries = entries
    }
}

struct TemplateDeleteAccountResult: Decodable, Equatable {
    enum Status: String, Decodable, Equatable {
        case deleted
    }

    struct DeletedCounts: Decodable, Equatable {
        let profiles: Int
        let entries: Int
        let commandHistory: Int
        let appleSignInCredentials: Int
        let usageEvents: Int
    }

    struct CleanupStatus: Decodable, Equatable {
        let status: String
    }

    struct Cleanup: Decodable, Equatable {
        let posthog: CleanupStatus
        let sentry: CleanupStatus
    }

    let status: Status
    let deleted: DeletedCounts
    let batches: Int
    let cleanup: Cleanup
}

enum TemplateVoiceTranscriptionResult: Decodable, Equatable {
    case transcribed(transcript: String)
    case configurationMissing(missing: String)

    init(transcript: String) {
        self = .transcribed(transcript: transcript)
    }

    private enum CodingKeys: String, CodingKey {
        case status
        case transcript
        case missing
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let status = try container.decode(String.self, forKey: .status)
        switch status {
        case "transcribed":
            self = .transcribed(transcript: try container.decode(String.self, forKey: .transcript))
        case "configuration_missing":
            self = .configurationMissing(missing: try container.decode(String.self, forKey: .missing))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .status,
                in: container,
                debugDescription: "Unsupported voice transcription status: \(status)"
            )
        }
    }
}

struct TemplateConvexClientConfiguration: Equatable {
    let deploymentURL: URL

    static func fromInfoDictionary(_ dictionary: [String: Any]) -> TemplateConvexClientConfiguration? {
        guard
            let rawURL = dictionary["CONVEX_DEPLOYMENT_URL"] as? String,
            let url = URL(string: rawURL),
            url.scheme == "http" || url.scheme == "https"
        else {
            return nil
        }
        return TemplateConvexClientConfiguration(deploymentURL: url)
    }

    var isPlaceholder: Bool {
        deploymentURL.host == "example.convex.cloud"
            || deploymentURL.absoluteString.contains("your-convex-deployment")
    }
}
