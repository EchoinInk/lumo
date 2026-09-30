import { useEffect } from "react";
import { subscribeToReminderReconciliation } from "../services/reminderNotificationCoordinator";
export function ReminderNotificationLifecycle(): null { useEffect(() => subscribeToReminderReconciliation(), []); return null; }
