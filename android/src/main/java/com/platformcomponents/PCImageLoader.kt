package com.platformcomponents

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.util.LruCache
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.roundToInt

/**
 * Loads images referenced by React Native asset URIs for native controls that
 * take a Drawable (segmented control icons).
 *
 * Release builds ship local assets as drawable resources, which callers resolve
 * directly. Debug builds (Metro), `file://`, `content://`, `data:` and remote
 * sources go through here on a background thread and are cached in memory.
 */
object PCImageLoader {
  private const val TAG = "PCImageLoader"
  private const val TIMEOUT_MS = 10_000

  private val executor = Executors.newFixedThreadPool(2)
  private val mainHandler = Handler(Looper.getMainLooper())
  private val cache = LruCache<String, Bitmap>(32)
  private val cacheLock = Any()
  private var nextGeneration = 0L
  private val generations = mutableMapOf<String, Long>()

  /**
   * Loads [uri] and delivers the bitmap on the main thread. [scale] is the
   * asset scale React Native resolved (2 for an `@2x` file), used to set the
   * bitmap density so the drawable measures in dp like an `Image` would.
   *
   * Cached images are delivered synchronously.
   */
  fun load(context: Context, uri: String, scale: Float, request: String = "", callback: (Bitmap?) -> Unit) {
    val options = try { if (request.isEmpty()) JSONObject() else JSONObject(request) }
      catch (_: Exception) { callback(null); return }
    val policy = options.optString("cache", "default")
    options.remove("cache")
    val key = JSONArray().put(uri).put(scale.toDouble()).put(options).toString()
    val cached = if (policy == "reload") null else cache.get(key)
    cached?.let {
      callback(it)
      return
    }
    if (policy == "only-if-cached") { callback(null); return }
    val generation = synchronized(cacheLock) {
      nextGeneration += 1
      generations[key] = nextGeneration
      nextGeneration
    }

    val appContext = context.applicationContext
    executor.execute {
      var canCache = true
      val bitmap = try {
        decode(appContext, uri, options) { canCache = it }
      } catch (e: Exception) {
        // Image URIs may carry credentials or signed query parameters.
        Log.w(TAG, "Failed to load image (${e.javaClass.simpleName})")
        null
      }
      if (bitmap != null) {
        bitmap.density = (scale.coerceAtLeast(0.01f) * DisplayMetrics.DENSITY_DEFAULT).roundToInt()
      }
      synchronized(cacheLock) {
        if (generations[key] == generation) {
          if (bitmap != null && canCache) cache.put(key, bitmap) else cache.remove(key)
          generations.remove(key)
        }
      }
      mainHandler.post { callback(bitmap) }
    }
  }

  private fun decode(context: Context, uri: String, options: JSONObject, cacheable: (Boolean) -> Unit): Bitmap? {
    val parsed = Uri.parse(uri)
    return when (parsed.scheme?.lowercase()) {
      "http", "https" -> {
        val connection = URL(uri).openConnection() as HttpURLConnection
        connection.connectTimeout = TIMEOUT_MS
        connection.readTimeout = TIMEOUT_MS
        connection.useCaches = false
        connection.instanceFollowRedirects = options.length() == 0
        connection.requestMethod = options.optString("method", "GET")
        options.optJSONObject("headers")?.let { headers ->
          for (name in headers.keys()) connection.setRequestProperty(name, headers.getString(name))
        }
        try {
          if (options.has("body")) {
            connection.doOutput = true
            connection.outputStream.use { it.write(options.getString("body").toByteArray(Charsets.UTF_8)) }
          }
          if (connection.responseCode !in 200..299) return null
          cacheable(!connection.getHeaderField("Cache-Control").orEmpty().contains("no-store", ignoreCase = true))
          connection.inputStream.use { BitmapFactory.decodeStream(it) }
        } finally {
          connection.disconnect()
        }
      }
      "file" -> parsed.path?.let { BitmapFactory.decodeFile(it) }
      "content" -> context.contentResolver.openInputStream(parsed)?.use { BitmapFactory.decodeStream(it) }
      "data" -> {
        val comma = uri.indexOf(',')
        if (comma < 0) return null
        val bytes = Base64.decode(uri.substring(comma + 1), Base64.DEFAULT)
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
      }
      else -> null
    }
  }
}
