const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// react-native-webrtc runs native module code at evaluation time,
// which crashes in Expo Go. We intercept the resolution and redirect
// to a harmless stub so the app doesn't crash on startup.
//
// To use real WebRTC in a dev build, set WEBRTC_STUB=false:
//   WEBRTC_STUB=false npx expo run:ios
//   WEBRTC_STUB=false npx expo run:android
if (process.env.WEBRTC_STUB !== "false") {
  const webrtcStubPath = path.resolve(
    __dirname,
    "src/mobile/mocks/react-native-webrtc.ts",
  );
  const livekitStubPath = path.resolve(
    __dirname,
    "src/mobile/mocks/livekit-react-native.ts",
  );
  const LIVEKIT_PACKAGES = [
    "@livekit/react-native",
    "@livekit/react-native-webrtc",
  ];

  const originalResolveRequest = config.resolver?.resolveRequest;

  config.resolver = config.resolver ?? {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "react-native-webrtc") {
      return { filePath: webrtcStubPath, type: "sourceFile" };
    }
    if (LIVEKIT_PACKAGES.includes(moduleName)) {
      return { filePath: livekitStubPath, type: "sourceFile" };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
