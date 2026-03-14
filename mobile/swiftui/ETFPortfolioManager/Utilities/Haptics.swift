#if canImport(UIKit)
import UIKit

enum Haptics {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}
#else
// macOS 빌드용 스텁
enum Haptics {
    static func light() {}
    static func medium() {}
    static func success() {}
    static func error() {}
    static func selection() {}
}
#endif
