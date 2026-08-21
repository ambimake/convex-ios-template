import AdServices
import Foundation

// Reports the Apple AdServices attribution token to the backend intake endpoint
// (convex/attribution.ts) exactly once per install. It no-ops until a clone
// wires the endpoint URL and shared secret via build settings, matching the
// template's other seams. See docs/guides/attribution.md.

protocol TemplateAdAttributionTokenProviding {
    func attributionToken() throws -> String
}

struct AdServicesAttributionTokenProvider: TemplateAdAttributionTokenProviding {
    func attributionToken() throws -> String {
        try AAAttribution.attributionToken()
    }
}

struct TemplateAdAttributionPayload: Codable, Equatable {
    let analyticsUserID: String
    let attributionToken: String
    let bundleID: String
    let appVersion: String
    let appBuild: String
}

protocol TemplateAdAttributionUploading {
    func upload(
        _ payload: TemplateAdAttributionPayload,
        to endpoint: URL,
        authorizationSecret: String
    ) async throws
}

struct URLSessionAdAttributionUploader: TemplateAdAttributionUploading {
    enum UploadError: Error {
        case invalidResponse
        case unsuccessfulStatusCode(Int)
    }

    func upload(
        _ payload: TemplateAdAttributionPayload,
        to endpoint: URL,
        authorizationSecret: String
    ) async throws {
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(authorizationSecret, forHTTPHeaderField: "X-Apple-Ads-Attribution-Secret")
        request.httpBody = try JSONEncoder().encode(payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw UploadError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            throw UploadError.unsuccessfulStatusCode(httpResponse.statusCode)
        }
    }
}

struct TemplateAdAttributionAppMetadata: Equatable {
    let bundleID: String
    let appVersion: String
    let appBuild: String

    static func live(bundle: Bundle = .main) -> TemplateAdAttributionAppMetadata {
        TemplateAdAttributionAppMetadata(
            bundleID: bundle.bundleIdentifier ?? "unknown",
            appVersion: bundle.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            appBuild: bundle.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown"
        )
    }
}

struct TemplateAdAttributionReporter {
    static let uploadCompletedDefaultsKey = "adAttributionUploadCompleted"
    static let uploadAttemptCountDefaultsKey = "adAttributionUploadAttemptCount"
    static let lastUploadAttemptDefaultsKey = "adAttributionLastUploadAttempt"
    static let defaultRetryDelay: TimeInterval = 24 * 60 * 60
    static let defaultMaximumRetryAttempts = 5

    static let live = TemplateAdAttributionReporter(
        tokenProvider: AdServicesAttributionTokenProvider(),
        uploader: URLSessionAdAttributionUploader(),
        defaults: .standard,
        appMetadata: .live(),
        now: Date.init
    )

    private let tokenProvider: TemplateAdAttributionTokenProviding
    private let uploader: TemplateAdAttributionUploading
    private let defaults: UserDefaults
    private let appMetadata: TemplateAdAttributionAppMetadata
    private let now: () -> Date
    private let retryDelay: TimeInterval
    private let maximumRetryAttempts: Int
    private let onFailure: (Error) -> Void
    private let gate = NSLock()

    init(
        tokenProvider: TemplateAdAttributionTokenProviding,
        uploader: TemplateAdAttributionUploading,
        defaults: UserDefaults,
        appMetadata: TemplateAdAttributionAppMetadata,
        now: @escaping () -> Date = Date.init,
        retryDelay: TimeInterval = Self.defaultRetryDelay,
        maximumRetryAttempts: Int = Self.defaultMaximumRetryAttempts,
        onFailure: @escaping (Error) -> Void = { error in
            print("TemplateAdAttributionReporter: upload failed: \(error)")
        }
    ) {
        self.tokenProvider = tokenProvider
        self.uploader = uploader
        self.defaults = defaults
        self.appMetadata = appMetadata
        self.now = now
        self.retryDelay = retryDelay
        self.maximumRetryAttempts = maximumRetryAttempts
        self.onFailure = onFailure
    }

    // `analyticsUserID` is the stable anonymous join key (e.g. the PostHog
    // distinct id). `endpointURLString`/`authorizationSecret` come from build
    // settings and are ignored until a clone fills them in.
    func reportIfNeeded(
        analyticsUserID: String?,
        endpointURLString: String?,
        authorizationSecret: String?
    ) async {
        let attemptDate = now()

        guard let analyticsUserID = trimmed(analyticsUserID) else { return }
        guard
            let endpointURLString = trimmed(endpointURLString),
            let endpoint = URL(string: endpointURLString),
            endpoint.scheme == "https"
        else { return }
        guard let authorizationSecret = validBuildSettingValue(authorizationSecret) else { return }
        guard reserveUploadAttempt(at: attemptDate) else { return }

        do {
            let token = try tokenProvider.attributionToken()
            let payload = TemplateAdAttributionPayload(
                analyticsUserID: analyticsUserID,
                attributionToken: token,
                bundleID: appMetadata.bundleID,
                appVersion: appMetadata.appVersion,
                appBuild: appMetadata.appBuild
            )
            try await uploader.upload(payload, to: endpoint, authorizationSecret: authorizationSecret)
            markUploadCompleted()
        } catch {
            onFailure(error)
        }
    }

    private func reserveUploadAttempt(at date: Date) -> Bool {
        gate.lock()
        defer { gate.unlock() }
        guard !defaults.bool(forKey: Self.uploadCompletedDefaultsKey) else { return false }
        guard canAttemptUpload(at: date) else { return false }
        recordUploadAttempt(at: date)
        return true
    }

    private func markUploadCompleted() {
        gate.lock()
        defer { gate.unlock() }
        defaults.set(true, forKey: Self.uploadCompletedDefaultsKey)
        defaults.removeObject(forKey: Self.uploadAttemptCountDefaultsKey)
        defaults.removeObject(forKey: Self.lastUploadAttemptDefaultsKey)
    }

    private func canAttemptUpload(at date: Date) -> Bool {
        let attemptCount = defaults.integer(forKey: Self.uploadAttemptCountDefaultsKey)
        guard attemptCount < maximumRetryAttempts else { return false }
        let lastAttempt = defaults.double(forKey: Self.lastUploadAttemptDefaultsKey)
        guard lastAttempt > 0 else { return true }
        return date.timeIntervalSince1970 - lastAttempt >= retryDelay
    }

    private func recordUploadAttempt(at date: Date) {
        let attemptCount = defaults.integer(forKey: Self.uploadAttemptCountDefaultsKey)
        defaults.set(attemptCount + 1, forKey: Self.uploadAttemptCountDefaultsKey)
        defaults.set(date.timeIntervalSince1970, forKey: Self.lastUploadAttemptDefaultsKey)
    }

    private func trimmed(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
            return nil
        }
        return value
    }

    // Unfilled xcconfig placeholders arrive literally as "$(NAME)"; treat those
    // as unconfigured.
    private func validBuildSettingValue(_ value: String?) -> String? {
        guard let value = trimmed(value), !value.contains("$(") else { return nil }
        return value
    }
}
