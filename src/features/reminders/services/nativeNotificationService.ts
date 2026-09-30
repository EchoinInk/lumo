import * as Notifications from "expo-notifications";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import { Platform } from "react-native";

export type NotificationPermissionState = "granted" | "denied" | "undetermined";
export interface NativeReminderScheduleInput { reminderId: string; fingerprint: string; title: string; scheduledAt: string }
export interface PendingReminderNotification { identifier: string; reminderId?: string; fingerprint?: string }
export interface NativeNotificationService {
  getPermissionState(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  getPendingRequests(): Promise<PendingReminderNotification[]>;
  schedule(input: NativeReminderScheduleInput): Promise<string>;
  cancel(identifier: string): Promise<void>;
}

const CHANNEL_ID = "lumo-reminders";
const OWNER = "lumo-reminder";
let presentationConfigured = false;

export function configureNativeNotificationPresentation(): void {
  if (presentationConfigured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  presentationConfigured = true;
}

function permissionState(status: Notifications.NotificationPermissionsStatus): NotificationPermissionState {
  if (status.granted || status.ios?.status === IosAuthorizationStatus.AUTHORIZED || status.ios?.status === IosAuthorizationStatus.PROVISIONAL || status.ios?.status === IosAuthorizationStatus.EPHEMERAL) return "granted";
  if (status.status === "denied" || status.ios?.status === IosAuthorizationStatus.DENIED) return "denied";
  return "undetermined";
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: "Reminders", importance: AndroidImportance.DEFAULT, sound: "default" });
}

export const nativeNotificationService: NativeNotificationService = {
  async getPermissionState() { return permissionState(await Notifications.getPermissionsAsync()); },
  async requestPermission() {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (permissionState(current) !== "undetermined") return permissionState(current);
    return permissionState(await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } }));
  },
  async getPendingRequests() {
    return (await Notifications.getAllScheduledNotificationsAsync()).map((request) => {
      const data = request.content.data;
      return {
        identifier: request.identifier,
        reminderId: data?.lumoOwner === OWNER && typeof data.lumoReminderId === "string" ? data.lumoReminderId : undefined,
        fingerprint: data?.lumoOwner === OWNER && typeof data.lumoFingerprint === "string" ? data.lumoFingerprint : undefined,
      };
    });
  },
  async schedule(input) {
    await ensureAndroidChannel();
    return Notifications.scheduleNotificationAsync({
      content: { title: input.title, body: "A gentle reminder from Lumo.", sound: "default", data: { lumoOwner: OWNER, lumoReminderId: input.reminderId, lumoFingerprint: input.fingerprint } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(input.scheduledAt), ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}) },
    });
  },
  cancel(identifier) { return Notifications.cancelScheduledNotificationAsync(identifier); },
};
