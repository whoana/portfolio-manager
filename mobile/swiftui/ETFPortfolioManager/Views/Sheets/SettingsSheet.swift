import SwiftUI

struct SettingsSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(ThemeManager.self) private var theme
    @State private var biometricEnabled = false

    var body: some View {
        @Bindable var tm = theme

        NavigationStack {
            List {
                Section("테마") {
                    ForEach(AppTheme.allCases) { t in
                        HStack {
                            Text(t.rawValue)
                                .foregroundColor(theme.textPrimary)
                            Spacer()
                            if theme.currentTheme == t {
                                Image(systemName: "checkmark")
                                    .foregroundColor(theme.accentColor)
                            }
                        }
                        .contentShape(Rectangle())
                        .onTapGesture {
                            tm.currentTheme = t
                            Haptics.selection()
                        }
                        .listRowBackground(theme.bgCard)
                    }

                    Toggle("시스템 설정 따르기", isOn: $tm.followSystem)
                        .listRowBackground(theme.bgCard)
                }

                Section("보안") {
                    Toggle("Face ID / Touch ID", isOn: $biometricEnabled)
                        .listRowBackground(theme.bgCard)
                        .onChange(of: biometricEnabled) { _, enabled in
                            if enabled {
                                Task {
                                    let success = await BiometricAuth.authenticate()
                                    if !success { biometricEnabled = false }
                                }
                            }
                        }
                }

                Section("데이터") {
                    Button("JSON 가져오기") {
                        // TODO: DocumentPicker
                    }
                    .listRowBackground(theme.bgCard)

                    Button("JSON 내보내기") {
                        // TODO: Export
                    }
                    .listRowBackground(theme.bgCard)
                }

                Section("정보") {
                    HStack {
                        Text("버전")
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(theme.textSecondary)
                    }
                    .listRowBackground(theme.bgCard)
                }
            }
            .scrollContentBackground(.hidden)
            .background(theme.bgPrimary)
            .navigationTitle("설정")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("완료") { dismiss() }
                }
            }
        }
    }
}
