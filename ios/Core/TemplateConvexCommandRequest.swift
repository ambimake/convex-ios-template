import Foundation

struct TemplateConvexCommandRequest: Encodable, Equatable {
    let text: String
    let source: TemplateCommandSource

    func encodedBody() throws -> Data {
        try JSONEncoder().encode(self)
    }
}

struct TemplateVoiceTranscriptionRequest: Encodable, Equatable {
    let audioBase64: String
    let mimeType: String
}
