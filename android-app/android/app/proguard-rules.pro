# Capacitor resolves plugins by their fully-qualified name, read as a string
# from assets/capacitor.plugins.json, so R8 sees no reference to them and would
# happily rename or delete the lot. Everything below exists to stop that.

-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Plugin classes named in capacitor.plugins.json, plus anything shaped like one.
-keep class com.capacitorjs.plugins.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# The methods and properties the JS bridge calls into.
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Cordova plugins bridged through Capacitor are loaded the same way.
-keep class org.apache.cordova.** { *; }

-keep class com.kaziconnect.app.** { *; }

# Keep annotations themselves, or the keep rules above match nothing.
-keepattributes *Annotation*, JavascriptInterface

# Readable stack traces from a minified release build.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
