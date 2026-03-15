import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";

import { ConferenceView } from "@/components/conference/ConferenceView";
import { useProfileStore } from "@/mobile/state/use-profile-store";
import { useMainNavigationStore } from "@/mobile/navigation/use-main-navigation-store";

const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "https://hashdrop.metesahankurt.cloud";
const PROD_WEB_APP_URL = "https://hashdrop.metesahankurt.cloud";
const FLOATING_DOCK_HEIGHT = 74;

function escapeJsString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

type BridgeRoute = {
  code: string;
  mode: "create" | "join";
  autoEnter: boolean;
};

export function ConferenceScreen() {
  const insets = useSafeAreaInsets();
  const { username } = useProfileStore();
  const routeRefreshNonce = useMainNavigationStore(
    (state) => state.routeRefreshNonce,
  );
  const webViewRef = useRef<WebView>(null);
  const previousRefreshNonceRef = useRef(routeRefreshNonce);

  const [bridgeRoute, setBridgeRoute] = useState<BridgeRoute | null>(null);
  const [bridgeBaseUrl, setBridgeBaseUrl] = useState(
    WEB_APP_URL.replace(/\/$/, ""),
  );
  const [webError, setWebError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [conferenceReady, setConferenceReady] = useState(false);

  const dockClearance = Math.max(insets.bottom, 10) + FLOATING_DOCK_HEIGHT;
  const canFallbackToProd =
    bridgeBaseUrl !== PROD_WEB_APP_URL && WEB_APP_URL !== PROD_WEB_APP_URL;

  const injectedJavaScriptBeforeContentLoaded = useMemo(() => {
    const persistedUsername = JSON.stringify({
      state: { username },
      version: 0,
    });
    const escapedPersistedUsername = escapeJsString(persistedUsername);

    return `
      try {
        window.localStorage.setItem('hashdrop-username', '${escapedPersistedUsername}');
      } catch (error) {}
      true;
    `;
  }, [username]);

  const injectedJavaScript = useMemo(
    () => `
      try {
        var settleView = function () {
          var y = 300;
          var root = document.scrollingElement || document.documentElement || document.body;
          if (root) root.scrollTop = y;
          document.documentElement.scrollTop = y;
          document.body.scrollTop = y;
          window.scrollTo(0, y);
        };

        settleView();
        setTimeout(settleView, 120);
        setTimeout(settleView, 320);
        setTimeout(settleView, 700);
      } catch (error) {}
      true;
    `,
    [],
  );

  const bridgeUrl = useMemo(() => {
    if (!bridgeRoute) return null;
    const params = new URLSearchParams({
      mobile: "1",
      mode: bridgeRoute.mode,
      code: bridgeRoute.code,
    });
    if (bridgeRoute.autoEnter) {
      params.set("autoEnter", "1");
    }
    return `${bridgeBaseUrl}/conference?${params.toString()}`;
  }, [bridgeBaseUrl, bridgeRoute]);

  const launchBridge = (
    mode: "create" | "join",
    code: string,
    options?: { autoEnter?: boolean },
  ) => {
    setWebError(false);
    setConferenceReady(false);
    setBridgeBaseUrl(WEB_APP_URL.replace(/\/$/, ""));
    setBridgeRoute({ mode, code, autoEnter: options?.autoEnter ?? false });
    setReloadKey((value) => value + 1);
  };

  const closeBridgeToAppHome = () => {
    setWebError(false);
    setConferenceReady(false);
    setBridgeRoute(null);
    setReloadKey((value) => value + 1);
  };

  const handleWebMessage = (
    event: NativeSyntheticEvent<WebViewMessageEvent["nativeEvent"]>,
  ) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload?.type === "conference-exit") {
        closeBridgeToAppHome();
        return;
      }
      if (payload?.type === "conference-status") {
        const nextStatus = String(payload.status || "");
        setConferenceReady(
          nextStatus === "in-room" || nextStatus === "waiting",
        );
      }
    } catch {
      // Ignore non-JSON messages from the page.
    }
  };

  useEffect(() => {
    if (previousRefreshNonceRef.current === routeRefreshNonce) {
      return;
    }
    previousRefreshNonceRef.current = routeRefreshNonce;
    if (!bridgeRoute) {
      return;
    }
    closeBridgeToAppHome();
  }, [bridgeRoute, routeRefreshNonce]);

  if (!bridgeRoute) {
    return (
      <ConferenceView
        expoGoBridgeHandlers={{
          onCreate: (code, options) => launchBridge("create", code, options),
          onJoin: (code, options) => launchBridge("join", code, options),
        }}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.webviewFrame,
          {
            paddingTop: insets.top,
            paddingBottom: dockClearance,
          },
        ]}
      >
        {webError ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Could not load conference</Text>
            <Text style={styles.errorText}>
              The embedded conference page could not be reached.
            </Text>

            {canFallbackToProd ? (
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  setBridgeBaseUrl(PROD_WEB_APP_URL);
                  setWebError(false);
                  setReloadKey((value) => value + 1);
                }}
              >
                <Text style={styles.primaryButtonText}>
                  Try production conference
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                setWebError(false);
                setReloadKey((value) => value + 1);
              }}
            >
              <RefreshCw size={16} color="#ededed" />
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            key={`${reloadKey}:${bridgeBaseUrl}:${bridgeUrl}:${username}`}
            source={{ uri: bridgeUrl ?? `${bridgeBaseUrl}/conference?mobile=1` }}
            style={styles.webview}
            containerStyle={styles.webviewContainer}
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            injectedJavaScriptBeforeContentLoaded={
              injectedJavaScriptBeforeContentLoaded
            }
            injectedJavaScript={injectedJavaScript}
            bounces={false}
            scrollEnabled
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            onMessage={handleWebMessage}
            onNavigationStateChange={(navState) => {
              // If web navigates away from /conference (e.g. router.push('/') after leave)
              // treat it as a leave event so we return to the native conference screen.
              if (navState.url && !navState.url.includes("/conference")) {
                closeBridgeToAppHome();
              }
            }}
            onLoadEnd={() => {
              webViewRef.current?.injectJavaScript(injectedJavaScript);
            }}
            onError={() => {
              if (canFallbackToProd) {
                setBridgeBaseUrl(PROD_WEB_APP_URL);
                setReloadKey((value) => value + 1);
                return;
              }
              setWebError(true);
            }}
          />
        )}
        {!webError && !conferenceReady ? (
          <View style={styles.loaderOverlay} pointerEvents="auto">
            <View style={styles.loaderCard}>
              <View style={styles.loaderOrb} />
              <View style={styles.loaderIconWrap}>
                <ActivityIndicator color="#a5b4fc" size="small" />
              </View>
              <View style={styles.loaderTextBlock}>
                <Text style={styles.loaderTitle}>Setting up conference</Text>
                <Text style={styles.loaderSub}>Connecting to room…</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  webviewFrame: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 26,
    overflow: "hidden",
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 26,
  },
  webview: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d0d0d",
  },
  loaderCard: {
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 36,
    paddingVertical: 32,
    borderRadius: 28,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    minWidth: 220,
  },
  loaderOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(165,180,252,0.07)",
    top: -60,
    right: -50,
  },
  loaderIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(165,180,252,0.08)",
    borderWidth: 1,
    borderColor: "rgba(165,180,252,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderTextBlock: {
    alignItems: "center",
    gap: 4,
  },
  loaderTitle: {
    color: "#ededed",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  loaderSub: {
    color: "#444",
    fontSize: 12,
    fontWeight: "500",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: "#111111",
  },
  errorTitle: {
    color: "#ededed",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  errorText: {
    color: "#8b8b8b",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#3ecf8e",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: "#0d0d0d",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  secondaryButtonText: {
    color: "#ededed",
    fontSize: 14,
    fontWeight: "700",
  },
});
