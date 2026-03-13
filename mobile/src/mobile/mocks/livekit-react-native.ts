import React from "react";
import { View } from "react-native";

type DataPublishOptions = {
  reliable?: boolean;
};

type LocalParticipant = {
  setCameraEnabled: (enabled: boolean) => Promise<void>;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  setScreenShareEnabled: (enabled: boolean) => Promise<void>;
  publishData: (data: Uint8Array, options?: DataPublishOptions) => Promise<void>;
};

const noopAsync = async () => {};

const localParticipant: LocalParticipant = {
  setCameraEnabled: noopAsync,
  setMicrophoneEnabled: noopAsync,
  setScreenShareEnabled: noopAsync,
  publishData: noopAsync,
};

const roomContext = {
  localParticipant,
  on: () => roomContext,
  off: () => roomContext,
  disconnect: noopAsync,
  switchActiveDevice: noopAsync,
};

export function registerGlobals() {}

export function LiveKitRoom({
  children,
}: {
  children?: React.ReactNode;
}) {
  return React.createElement(React.Fragment, null, children);
}

export function VideoTrack() {
  return React.createElement(View, {
    style: { flex: 1, backgroundColor: "#111" },
  });
}

export function useLocalParticipant() {
  return { localParticipant };
}

export function useParticipants() {
  return [];
}

export function useSpeakingParticipants() {
  return [];
}

export function useRoomContext() {
  return roomContext;
}

export function useTracks() {
  return [];
}

export const AudioSession = {
  startAudioSession: noopAsync,
  stopAudioSession: noopAsync,
  configureAudio: noopAsync,
};
