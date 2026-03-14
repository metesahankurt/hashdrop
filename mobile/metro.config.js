const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = config.resolver ?? {};

if (process.env.WEBRTC_STUB === "true") {
  // Expo Go mode: redirect all WebRTC/LiveKit packages to no-op stubs so the
  // app doesn't crash on startup (native modules aren't available in Expo Go).
  const webrtcStubPath = path.resolve(
    __dirname,
    "src/mobile/mocks/react-native-webrtc.ts",
  );
  const livekitStubPath = path.resolve(
    __dirname,
    "src/mobile/mocks/livekit-react-native.ts",
  );

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "react-native-webrtc") {
      return { filePath: webrtcStubPath, type: "sourceFile" };
    }
    if (
      moduleName === "@livekit/react-native" ||
      moduleName === "@livekit/react-native-webrtc"
    ) {
      return { filePath: livekitStubPath, type: "sourceFile" };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
} else {
  // Dev build mode: redirect bare `react-native-webrtc` imports to
  // @livekit/react-native-webrtc (they share the same API; only one
  // webrtc.xcframework can be linked at a time).
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "react-native-webrtc") {
      return context.resolveRequest(
        context,
        "@livekit/react-native-webrtc",
        platform,
      );
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
