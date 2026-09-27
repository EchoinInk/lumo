export type MiriState =
  | "celebration"
  | "connected"
  | "focus"
  | "gentleReminder"
  | "overwhelmed"
  | "resting"
  | "smiling"
  | "thinking"
  | "thumbsUp"
  | "youTried";

export interface MiriStateConfig {
  asset: number;
  accessibilityLabel: string;
  defaultMessage?: string;
}

export const miriStates: Record<MiriState, MiriStateConfig> = {
  celebration: {
    asset: require("../../assets/branding/lumo/miri/celebration-cloud.png"),
    accessibilityLabel: "Miri celebrating",
    defaultMessage: "A little win is still a win.",
  },

  connected: {
    asset: require("../../assets/branding/lumo/miri/connected-cloud.png"),
    accessibilityLabel: "Miri feeling connected",
    defaultMessage: "Things are starting to connect.",
  },

  focus: {
    asset: require("../../assets/branding/lumo/miri/focus-cloud.png"),
    accessibilityLabel: "Miri focusing",
    defaultMessage: "Just this one thing for now.",
  },

  gentleReminder: {
    asset: require(
      "../../assets/branding/lumo/miri/gentle-reminder-cloud.png",
    ),
    accessibilityLabel: "Miri with a gentle reminder",
    defaultMessage: "A gentle reminder, whenever you're ready.",
  },

  overwhelmed: {
    asset: require("../../assets/branding/lumo/miri/overwhelmed-cloud.png"),
    accessibilityLabel: "Miri feeling overwhelmed",
    defaultMessage: "We can make this smaller.",
  },

  resting: {
    asset: require("../../assets/branding/lumo/miri/resting-cloud.png"),
    accessibilityLabel: "Miri resting",
    defaultMessage: "That can be enough for today.",
  },

  smiling: {
    asset: require("../../assets/branding/lumo/miri/smiling-cloud.png"),
    accessibilityLabel: "Miri smiling",
    defaultMessage: "You're doing okay.",
  },

  thinking: {
    asset: require("../../assets/branding/lumo/miri/thinking-cloud.png"),
    accessibilityLabel: "Miri thinking",
    defaultMessage: "Take your time.",
  },

  thumbsUp: {
    asset: require("../../assets/branding/lumo/miri/thumbs-up-cloud.png"),
    accessibilityLabel: "Miri giving a thumbs up",
    defaultMessage: "Nice. That's done.",
  },

  youTried: {
    asset: require("../../assets/branding/lumo/miri/you-tried-cloud.png"),
    accessibilityLabel: "Miri offering encouragement",
    defaultMessage: "You tried. That still matters.",
  },
};

export function getMiriState(state: MiriState): MiriStateConfig {
  return miriStates[state];
}