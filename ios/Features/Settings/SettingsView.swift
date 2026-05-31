import SwiftUI

struct SettingsView: View {
    @ObservedObject var model: VoiceAgentTemplateModel
    @Environment(\.dismiss) private var dismiss
    @State private var isConfirmingAccountDeletion = false

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    Button(role: .destructive) {
                        isConfirmingAccountDeletion = true
                    } label: {
                        Label("Delete account", systemImage: "trash")
                    }
                    .accessibilityIdentifier(TemplateAccessibility.deleteAccount)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                Button("Done") { dismiss() }
            }
            .confirmationDialog(
                "Delete account?",
                isPresented: $isConfirmingAccountDeletion,
                titleVisibility: .visible
            ) {
                Button("Delete account", role: .destructive) {
                    Task {
                        await model.deleteAccount()
                        if !model.isSignedIn {
                            dismiss()
                        }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This deletes the template account data stored by Convex.")
            }
        }
    }
}
