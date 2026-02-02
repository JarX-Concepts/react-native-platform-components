package com.platformcomponents

import android.graphics.Color
import kotlin.math.roundToInt

/**
 * Parses color strings in React Native compatible formats:
 * - Hex: #RGB, #RRGGBB, #RRGGBBAA
 * - RGB: rgb(r, g, b) where r, g, b are 0-255
 * - RGBA: rgba(r, g, b, a) where r, g, b are 0-255 and a is 0-1
 * - HSL: hsl(h, s%, l%) where h is 0-360, s and l are 0-100
 * - HSLA: hsla(h, s%, l%, a) where h is 0-360, s and l are 0-100, a is 0-1
 * - Named colors: red, blue, transparent, etc. (CSS named colors)
 */
object ColorParser {
    fun parse(colorString: String): Int? {
        return try {
            val trimmed = colorString.trim().lowercase()

            // Try named colors first
            namedColors[trimmed]?.let { return it }

            // Try rgba format: rgba(r, g, b, a)
            if (trimmed.startsWith("rgba(") && trimmed.endsWith(")")) {
                val inner = trimmed.removePrefix("rgba(").removeSuffix(")")
                val parts = inner.split(",").map { it.trim() }
                if (parts.size == 4) {
                    val r = parts[0].toInt().coerceIn(0, 255)
                    val g = parts[1].toInt().coerceIn(0, 255)
                    val b = parts[2].toInt().coerceIn(0, 255)
                    val a = (parts[3].toFloat() * 255).roundToInt().coerceIn(0, 255)
                    return Color.argb(a, r, g, b)
                }
            }

            // Try rgb format: rgb(r, g, b)
            if (trimmed.startsWith("rgb(") && trimmed.endsWith(")")) {
                val inner = trimmed.removePrefix("rgb(").removeSuffix(")")
                val parts = inner.split(",").map { it.trim() }
                if (parts.size == 3) {
                    val r = parts[0].toInt().coerceIn(0, 255)
                    val g = parts[1].toInt().coerceIn(0, 255)
                    val b = parts[2].toInt().coerceIn(0, 255)
                    return Color.rgb(r, g, b)
                }
            }

            // Try hsla format: hsla(h, s%, l%, a)
            if (trimmed.startsWith("hsla(") && trimmed.endsWith(")")) {
                val inner = trimmed.removePrefix("hsla(").removeSuffix(")")
                val parts = inner.split(",").map { it.trim().removeSuffix("%") }
                if (parts.size == 4) {
                    val h = parts[0].toFloat() / 360f
                    val s = parts[1].toFloat() / 100f
                    val l = parts[2].toFloat() / 100f
                    val a = parts[3].toFloat()
                    val rgb = hslToRgb(h, s, l)
                    return Color.argb((a * 255).roundToInt(), rgb.first, rgb.second, rgb.third)
                }
            }

            // Try hsl format: hsl(h, s%, l%)
            if (trimmed.startsWith("hsl(") && trimmed.endsWith(")")) {
                val inner = trimmed.removePrefix("hsl(").removeSuffix(")")
                val parts = inner.split(",").map { it.trim().removeSuffix("%") }
                if (parts.size == 3) {
                    val h = parts[0].toFloat() / 360f
                    val s = parts[1].toFloat() / 100f
                    val l = parts[2].toFloat() / 100f
                    val rgb = hslToRgb(h, s, l)
                    return Color.rgb(rgb.first, rgb.second, rgb.third)
                }
            }

            // Fall back to hex parsing
            var sanitized = trimmed
            if (!sanitized.startsWith("#")) {
                sanitized = "#$sanitized"
            }

            // Handle #RRGGBBAA format (web/CSS style) by converting to #AARRGGBB (Android style)
            if (sanitized.length == 9) {
                val rrggbb = sanitized.substring(1, 7)
                val aa = sanitized.substring(7, 9)
                sanitized = "#$aa$rrggbb"
            }

            Color.parseColor(sanitized)
        } catch (e: Exception) {
            null
        }
    }

    private fun hslToRgb(h: Float, s: Float, l: Float): Triple<Int, Int, Int> {
        if (s == 0f) {
            val v = (l * 255).roundToInt()
            return Triple(v, v, v)
        }

        val q = if (l < 0.5f) l * (1 + s) else l + s - l * s
        val p = 2 * l - q

        fun hueToRgb(p: Float, q: Float, t: Float): Int {
            var tt = t
            if (tt < 0) tt += 1
            if (tt > 1) tt -= 1
            val result = when {
                tt < 1f/6f -> p + (q - p) * 6 * tt
                tt < 1f/2f -> q
                tt < 2f/3f -> p + (q - p) * (2f/3f - tt) * 6
                else -> p
            }
            return (result * 255).roundToInt().coerceIn(0, 255)
        }

        return Triple(
            hueToRgb(p, q, h + 1f/3f),
            hueToRgb(p, q, h),
            hueToRgb(p, q, h - 1f/3f)
        )
    }

    // CSS named colors (React Native compatible)
    private val namedColors = mapOf(
        "transparent" to Color.TRANSPARENT,
        "aliceblue" to Color.rgb(240, 248, 255),
        "antiquewhite" to Color.rgb(250, 235, 215),
        "aqua" to Color.rgb(0, 255, 255),
        "aquamarine" to Color.rgb(127, 255, 212),
        "azure" to Color.rgb(240, 255, 255),
        "beige" to Color.rgb(245, 245, 220),
        "bisque" to Color.rgb(255, 228, 196),
        "black" to Color.BLACK,
        "blanchedalmond" to Color.rgb(255, 235, 205),
        "blue" to Color.BLUE,
        "blueviolet" to Color.rgb(138, 43, 226),
        "brown" to Color.rgb(165, 42, 42),
        "burlywood" to Color.rgb(222, 184, 135),
        "cadetblue" to Color.rgb(95, 158, 160),
        "chartreuse" to Color.rgb(127, 255, 0),
        "chocolate" to Color.rgb(210, 105, 30),
        "coral" to Color.rgb(255, 127, 80),
        "cornflowerblue" to Color.rgb(100, 149, 237),
        "cornsilk" to Color.rgb(255, 248, 220),
        "crimson" to Color.rgb(220, 20, 60),
        "cyan" to Color.CYAN,
        "darkblue" to Color.rgb(0, 0, 139),
        "darkcyan" to Color.rgb(0, 139, 139),
        "darkgoldenrod" to Color.rgb(184, 134, 11),
        "darkgray" to Color.DKGRAY,
        "darkgreen" to Color.rgb(0, 100, 0),
        "darkgrey" to Color.DKGRAY,
        "darkkhaki" to Color.rgb(189, 183, 107),
        "darkmagenta" to Color.rgb(139, 0, 139),
        "darkolivegreen" to Color.rgb(85, 107, 47),
        "darkorange" to Color.rgb(255, 140, 0),
        "darkorchid" to Color.rgb(153, 50, 204),
        "darkred" to Color.rgb(139, 0, 0),
        "darksalmon" to Color.rgb(233, 150, 122),
        "darkseagreen" to Color.rgb(143, 188, 143),
        "darkslateblue" to Color.rgb(72, 61, 139),
        "darkslategray" to Color.rgb(47, 79, 79),
        "darkslategrey" to Color.rgb(47, 79, 79),
        "darkturquoise" to Color.rgb(0, 206, 209),
        "darkviolet" to Color.rgb(148, 0, 211),
        "deeppink" to Color.rgb(255, 20, 147),
        "deepskyblue" to Color.rgb(0, 191, 255),
        "dimgray" to Color.rgb(105, 105, 105),
        "dimgrey" to Color.rgb(105, 105, 105),
        "dodgerblue" to Color.rgb(30, 144, 255),
        "firebrick" to Color.rgb(178, 34, 34),
        "floralwhite" to Color.rgb(255, 250, 240),
        "forestgreen" to Color.rgb(34, 139, 34),
        "fuchsia" to Color.rgb(255, 0, 255),
        "gainsboro" to Color.rgb(220, 220, 220),
        "ghostwhite" to Color.rgb(248, 248, 255),
        "gold" to Color.rgb(255, 215, 0),
        "goldenrod" to Color.rgb(218, 165, 32),
        "gray" to Color.GRAY,
        "green" to Color.GREEN,
        "greenyellow" to Color.rgb(173, 255, 47),
        "grey" to Color.GRAY,
        "honeydew" to Color.rgb(240, 255, 240),
        "hotpink" to Color.rgb(255, 105, 180),
        "indianred" to Color.rgb(205, 92, 92),
        "indigo" to Color.rgb(75, 0, 130),
        "ivory" to Color.rgb(255, 255, 240),
        "khaki" to Color.rgb(240, 230, 140),
        "lavender" to Color.rgb(230, 230, 250),
        "lavenderblush" to Color.rgb(255, 240, 245),
        "lawngreen" to Color.rgb(124, 252, 0),
        "lemonchiffon" to Color.rgb(255, 250, 205),
        "lightblue" to Color.rgb(173, 216, 230),
        "lightcoral" to Color.rgb(240, 128, 128),
        "lightcyan" to Color.rgb(224, 255, 255),
        "lightgoldenrodyellow" to Color.rgb(250, 250, 210),
        "lightgray" to Color.LTGRAY,
        "lightgreen" to Color.rgb(144, 238, 144),
        "lightgrey" to Color.LTGRAY,
        "lightpink" to Color.rgb(255, 182, 193),
        "lightsalmon" to Color.rgb(255, 160, 122),
        "lightseagreen" to Color.rgb(32, 178, 170),
        "lightskyblue" to Color.rgb(135, 206, 250),
        "lightslategray" to Color.rgb(119, 136, 153),
        "lightslategrey" to Color.rgb(119, 136, 153),
        "lightsteelblue" to Color.rgb(176, 196, 222),
        "lightyellow" to Color.rgb(255, 255, 224),
        "lime" to Color.rgb(0, 255, 0),
        "limegreen" to Color.rgb(50, 205, 50),
        "linen" to Color.rgb(250, 240, 230),
        "magenta" to Color.MAGENTA,
        "maroon" to Color.rgb(128, 0, 0),
        "mediumaquamarine" to Color.rgb(102, 205, 170),
        "mediumblue" to Color.rgb(0, 0, 205),
        "mediumorchid" to Color.rgb(186, 85, 211),
        "mediumpurple" to Color.rgb(147, 112, 219),
        "mediumseagreen" to Color.rgb(60, 179, 113),
        "mediumslateblue" to Color.rgb(123, 104, 238),
        "mediumspringgreen" to Color.rgb(0, 250, 154),
        "mediumturquoise" to Color.rgb(72, 209, 204),
        "mediumvioletred" to Color.rgb(199, 21, 133),
        "midnightblue" to Color.rgb(25, 25, 112),
        "mintcream" to Color.rgb(245, 255, 250),
        "mistyrose" to Color.rgb(255, 228, 225),
        "moccasin" to Color.rgb(255, 228, 181),
        "navajowhite" to Color.rgb(255, 222, 173),
        "navy" to Color.rgb(0, 0, 128),
        "oldlace" to Color.rgb(253, 245, 230),
        "olive" to Color.rgb(128, 128, 0),
        "olivedrab" to Color.rgb(107, 142, 35),
        "orange" to Color.rgb(255, 165, 0),
        "orangered" to Color.rgb(255, 69, 0),
        "orchid" to Color.rgb(218, 112, 214),
        "palegoldenrod" to Color.rgb(238, 232, 170),
        "palegreen" to Color.rgb(152, 251, 152),
        "paleturquoise" to Color.rgb(175, 238, 238),
        "palevioletred" to Color.rgb(219, 112, 147),
        "papayawhip" to Color.rgb(255, 239, 213),
        "peachpuff" to Color.rgb(255, 218, 185),
        "peru" to Color.rgb(205, 133, 63),
        "pink" to Color.rgb(255, 192, 203),
        "plum" to Color.rgb(221, 160, 221),
        "powderblue" to Color.rgb(176, 224, 230),
        "purple" to Color.rgb(128, 0, 128),
        "rebeccapurple" to Color.rgb(102, 51, 153),
        "red" to Color.RED,
        "rosybrown" to Color.rgb(188, 143, 143),
        "royalblue" to Color.rgb(65, 105, 225),
        "saddlebrown" to Color.rgb(139, 69, 19),
        "salmon" to Color.rgb(250, 128, 114),
        "sandybrown" to Color.rgb(244, 164, 96),
        "seagreen" to Color.rgb(46, 139, 87),
        "seashell" to Color.rgb(255, 245, 238),
        "sienna" to Color.rgb(160, 82, 45),
        "silver" to Color.rgb(192, 192, 192),
        "skyblue" to Color.rgb(135, 206, 235),
        "slateblue" to Color.rgb(106, 90, 205),
        "slategray" to Color.rgb(112, 128, 144),
        "slategrey" to Color.rgb(112, 128, 144),
        "snow" to Color.rgb(255, 250, 250),
        "springgreen" to Color.rgb(0, 255, 127),
        "steelblue" to Color.rgb(70, 130, 180),
        "tan" to Color.rgb(210, 180, 140),
        "teal" to Color.rgb(0, 128, 128),
        "thistle" to Color.rgb(216, 191, 216),
        "tomato" to Color.rgb(255, 99, 71),
        "turquoise" to Color.rgb(64, 224, 208),
        "violet" to Color.rgb(238, 130, 238),
        "wheat" to Color.rgb(245, 222, 179),
        "white" to Color.WHITE,
        "whitesmoke" to Color.rgb(245, 245, 245),
        "yellow" to Color.YELLOW,
        "yellowgreen" to Color.rgb(154, 205, 50)
    )
}
