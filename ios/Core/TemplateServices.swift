import Foundation

struct TemplateSession: Equatable {
    let ownerKey: String
}

enum TemplateServiceError: Error, Equatable, LocalizedError {
    case missingConfiguration(String)
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .missingConfiguration(let message), .failed(let message):
            return message
        }
    }
}

protocol TemplateSessionServicing {
    func signIn() async throws -> TemplateSession
}

protocol TemplateVoiceCapturing {
    func captureAudio(permission: TemplateMicrophonePermission) async throws -> TemplateVoiceAudio
}

struct TemplateVoiceAudio: Equatable {
    let audioBase64: String
    let mimeType: String
}

struct TemplateConfiguredSessionService: TemplateSessionServicing {
    let configuration: TemplateConvexClientConfiguration?

    init(configuration: TemplateConvexClientConfiguration? = .fromInfoDictionary(Bundle.main.infoDictionary ?? [:])) {
        self.configuration = configuration
    }

    func signIn() async throws -> TemplateSession {
        guard let configuration, !configuration.isPlaceholder else {
            throw TemplateServiceError.missingConfiguration(
                "Configure Convex and Sign in with Apple before live sign-in."
            )
        }
        throw TemplateServiceError.missingConfiguration(
            "Connect your Apple auth provider to \(configuration.deploymentURL.absoluteString)."
        )
    }
}

struct TemplateVoiceCaptureService: TemplateVoiceCapturing {
    func captureAudio(permission: TemplateMicrophonePermission) async throws -> TemplateVoiceAudio {
        switch TemplateVoiceCaptureState.start(permission: permission) {
        case .recording:
            throw TemplateServiceError.missingConfiguration(
                "Connect AVAudioRecorder output before calling commands:transcribeVoiceCommand."
            )
        case .typedFallback(let reason):
            throw TemplateServiceError.missingConfiguration(reason)
        case .idle, .submitted:
            throw TemplateServiceError.failed("Voice capture is not ready.")
        }
    }
}
