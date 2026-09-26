import UIKit

/// Loads images referenced by React Native asset URIs for native controls that
/// take a `UIImage` (segmented control icons).
///
/// Release builds bundle local assets next to the JS bundle, so those arrive as
/// `file://` URLs and load synchronously. Debug builds and remote sources arrive
/// as `http(s)://` (Metro) or `data:` URLs and load asynchronously.
///
/// Must be used from the main thread.
final class PCImageLoader: NSObject, URLSessionTaskDelegate {
    static let shared = PCImageLoader()

    /// A symbol by name: an SF Symbol, else a custom symbol or image from the
    /// app's asset catalog, so an app's own icons (custom symbols exported
    /// from SVG with the SF Symbols app) work wherever SF Symbol names do.
    static func symbol(named name: String) -> UIImage? {
        guard !name.isEmpty else { return nil }
        return UIImage(systemName: name) ?? UIImage(named: name)
    }

    private let cache = NSCache<NSString, UIImage>()
    private var pending: [String: [(UIImage?) -> Void]] = [:]
    private var generations: [String: Int] = [:]
    private var nextGeneration = 0
    // Custom credentials/body must not enter the shared URL cache or be
    // forwarded to a redirect target. Decoded images use the full request key.
    private lazy var requestSession: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.urlCache = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCredentialStorage = nil
        return URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
    }()

    private override init() {
        super.init()
        cache.countLimit = 32
    }

    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }

    /// Returns the image immediately when it is cached or readable from disk.
    /// Otherwise starts a load and calls `completion` on the main thread with
    /// the result; the return value is `nil` in that case.
    @discardableResult
    func image(
        uri: String,
        scale: CGFloat,
        request: String = "",
        completion: @escaping (UIImage?) -> Void
    ) -> UIImage? {
        var options: [String: Any] = [:]
        if !request.isEmpty {
            guard let data = request.data(using: .utf8),
                  let decoded = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else { return nil }
            options = decoded
        }
        let policy = options.removeValue(forKey: "cache") as? String ?? "default"
        guard let keyData = try? JSONSerialization.data(
            withJSONObject: [uri, scale, options], options: [.sortedKeys]),
              let key = String(data: keyData, encoding: .utf8) else { return nil }
        if policy != "reload", let cached = cache.object(forKey: key as NSString) {
            return cached
        }
        if policy == "only-if-cached" { return nil }

        guard let url = URL(string: uri) else { return nil }

        if url.isFileURL {
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data, scale: scale) else { return nil }
            cache.setObject(image, forKey: key as NSString)
            return image
        }

        let pendingKey = key + (policy == "reload" ? ":reload" : ":cached")
        if pending[pendingKey] != nil {
            pending[pendingKey]?.append(completion)
            return nil
        }
        pending[pendingKey] = [completion]
        nextGeneration += 1
        let generation = nextGeneration
        generations[key] = generation

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = options["method"] as? String ?? "GET"
        urlRequest.httpBody = (options["body"] as? String)?.data(using: .utf8)
        urlRequest.allHTTPHeaderFields = options["headers"] as? [String: String]
        let custom = !options.isEmpty
        if custom || policy == "reload" {
            urlRequest.cachePolicy = .reloadIgnoringLocalCacheData
        }

        (custom ? requestSession : URLSession.shared).dataTask(with: urlRequest) { [weak self] data, response, error in
            let http = response as? HTTPURLResponse
            let success = error == nil && (http == nil || (200..<300).contains(http!.statusCode))
            let image = success ? data.flatMap { UIImage(data: $0, scale: scale) } : nil
            let canCache = !(http?.value(forHTTPHeaderField: "Cache-Control")?
                .lowercased().contains("no-store") ?? false)
            DispatchQueue.main.async {
                guard let self else { return }
                if self.generations[key] == generation {
                    if let image, canCache { self.cache.setObject(image, forKey: key as NSString) }
                    else { self.cache.removeObject(forKey: key as NSString) }
                    self.generations.removeValue(forKey: key)
                }
                let callbacks = self.pending.removeValue(forKey: pendingKey) ?? []
                callbacks.forEach { $0(image) }
            }
        }.resume()

        return nil
    }
}
