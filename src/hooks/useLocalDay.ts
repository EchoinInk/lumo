import { subscribeToLocalDayRefresh } from "@/src/utils/localDayLifecycle";
import { toLocalDateKey } from "@/src/utils/dateTime";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

export function useLocalDay() {
  const [state, setState] = useState(() => ({ dateKey: toLocalDateKey() }));

  useEffect(
    () =>
      subscribeToLocalDayRefresh(
        (nextDateKey) => setState({ dateKey: nextDateKey }),
        { appState: AppState },
      ),
    [],
  );

  return state.dateKey;
}
