import UIKit

/// Loads images referenced by React Native asset URIs for native controls that
/// take a `UIImage` (segmented control icons).
///
/// Release builds bundle local assets next to the JS bundle, so those arrive as
/// `file://` URLs and load synchronously. Debug builds and remote sources arrive
/// as `http(s)://` (Metro) or `data:` URLs and load asynchronously.
///
/// Must be used from the main thread.
final class PCImageLoader {
    static let shared = PCImageLoader()

    /// A symbol by name: an SF Symbol, else a custom symbol or image from the
    /// app's asset catalog, so an app's own icons (custom symbols exported
    /// from SVG with the SF Symbols app) work wherever SF Symbol names do.
    static func symbol(named name: String) -> UIImage? {
        guard !name.isEmpty else { return nil }
        return UIImage(systemName: name) ?? UIImage(named: name)
    }

    private var cache: [String: UIImage] = [:]
    private var pending: [String: [(UIImage?) -> Void]] = [:]

    /// Returns the image immediately when it is cached or readable from disk.
    /// Otherwise starts a load and calls `completion` on the main thread with
    /// the result; the return value is `nil` in that case.
    @discardableResult
    func image(
        uri: String,
        scale: CGFloat,
        completion: @escaping (UIImage?) -> Void
    ) -> UIImage? {
        let key = "\(uri)@\(scale)x"
        if let cached = cache[key] {
            return cached
        }

        guard let url = URL(string: uri) else { return nil }

        if url.isFileURL {
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data, scale: scale) else { return nil }
            cache[key] = image
            return image
        }

        if pending[key] != nil {
            pending[key]?.append(completion)
            return nil
        }
        pending[key] = [completion]

        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            let image = data.flatMap { UIImage(data: $0, scale: scale) }
            DispatchQueue.main.async {
                guard let self else { return }
                if let image { self.cache[key] = image }
                let callbacks = self.pending.removeValue(forKey: key) ?? []
                callbacks.forEach { $0(image) }
            }
        }.resume()

        return nil
    }
}
