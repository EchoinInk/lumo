import { AppState, Platform } from "react-native";
import { reconcileReminderNotifications } from "./reminderReconciliation";
import { getReminders } from "./reminderRepository";

let queued = Promise.resolve();
export function synchronizeReminderNotifications(requestPermission = false): Promise<void> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return Promise.resolve();
  const run = async () => {
    const [{ useReminderStore }, { useSettingsStore }] = await Promise.all([
      import("../store/useReminderStore"),
      import("@/src/store/useSettingsStore"),
    ]);
    const reminderState = useReminderStore.getState();
    const { configureNativeNotificationPresentation, nativeNotificationService } = await import("./nativeNotificationService");
    configureNativeNotificationPresentation();
    await reconcileReminderNotifications(nativeNotificationService, { appSettings: useSettingsStore.getState().settings, reminderSettings: reminderState.settings, requestPermission });
    useReminderStore.setState({ reminders: await getReminders() });
  };
  queued = queued.then(run, run);
  return queued;
}
export function subscribeToReminderReconciliation(): () => void {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return () => undefined;
  void synchronizeReminderNotifications(false).catch(() => undefined);
  const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void synchronizeReminderNotifications(false).catch(() => undefined); });
  return () => subscription.remove();
}
