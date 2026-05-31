import SwiftUI

struct CaptureBar: View {
    @ObservedObject var model: VoiceAgentTemplateModel

    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                TextField("Ask the agent", text: $model.commandText)
                    .textFieldStyle(.roundedBorder)
                    .submitLabel(.send)
                    .onSubmit {
                        Task { await model.submitTypedCommand() }
                    }
                    .accessibilityIdentifier(TemplateAccessibility.commandField)

                Button {
                    Task { await model.submitTypedCommand() }
                } label: {
                    Image(systemName: "paperplane.fill")
                }
                .buttonStyle(.borderedProminent)
                .accessibilityLabel("Submit command")
                .accessibilityIdentifier(TemplateAccessibility.submitCommand)

                Button {
                    Task { await model.startVoiceCommand() }
                } label: {
                    Image(systemName: "mic.fill")
                }
                .buttonStyle(.bordered)
                .accessibilityLabel("Start voice command")
                .accessibilityIdentifier(TemplateAccessibility.startVoice)
            }

            if case .typedFallback = model.voiceState {
                Button("Type instead") {
                    model.commandText = ""
                }
                .accessibilityIdentifier(TemplateAccessibility.typedFallback)
            }
        }
        .padding()
        .background(.bar)
    }
}
