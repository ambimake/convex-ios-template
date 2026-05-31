enum TemplateMicrophonePermission: Equatable {
    case granted
    case denied
    case restricted
    case unavailable
}

enum TemplateVoiceCaptureState: Equatable {
    case idle
    case recording
    case submitted
    case typedFallback(reason: String)

    static func start(permission: TemplateMicrophonePermission) -> TemplateVoiceCaptureState {
        switch permission {
        case .granted:
            return .recording
        case .denied:
            return .typedFallback(reason: "permission_denied")
        case .restricted:
            return .typedFallback(reason: "permission_restricted")
        case .unavailable:
            return .typedFallback(reason: "audio_unavailable")
        }
    }

    var fallbackReason: String? {
        if case .typedFallback(let reason) = self {
            return reason
        }
        return nil
    }
}
