import UIKit

/// The native theme set from JS with `useNativeTheme` / `setNativeTheme`.
///
/// The brand color becomes the tint color of every window, which UIKit views inherit:
/// these components, alerts, text input cursors. Windows that appear later (an alert's
/// window, for example) are tinted when they become visible. Clearing the color resets
/// the tinted windows to UIKit's default tint (the app's accent color, if it has one).
///
/// Light and dark mode need nothing here: UIKit views follow the window's appearance,
/// including `Appearance.setColorScheme`.
@objc(PCNativeTheme)
public final class PCNativeTheme: NSObject {
    @objc public static let shared = PCNativeTheme()

    private var primaryColor: UIColor?
    private var windowObserver: NSObjectProtocol?
    private let tintedWindows = NSHashTable<UIWindow>.weakObjects()

    /// Main thread only.
    @objc public func setPrimaryColor(_ color: UIColor?) {
        primaryColor = color

        guard let color else {
            for window in tintedWindows.allObjects {
                window.tintColor = nil
            }
            tintedWindows.removeAllObjects()
            return
        }

        if windowObserver == nil {
            windowObserver = NotificationCenter.default.addObserver(
                forName: UIWindow.didBecomeVisibleNotification,
                object: nil,
                queue: .main
            ) { [weak self] notification in
                guard let self, let window = notification.object as? UIWindow,
                      let color = self.primaryColor else { return }
                self.tint(window, with: color)
            }
        }

        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
        for window in windows {
            tint(window, with: color)
        }
    }

    private func tint(_ window: UIWindow, with color: UIColor) {
        window.tintColor = color
        tintedWindows.add(window)
    }
}
