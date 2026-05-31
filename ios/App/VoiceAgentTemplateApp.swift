import SwiftUI

@main
struct VoiceAgentTemplateApp: App {
    @StateObject private var model = VoiceAgentTemplateModel()

    var body: some Scene {
        WindowGroup {
            VoiceAgentRootView(model: model)
        }
    }
}
