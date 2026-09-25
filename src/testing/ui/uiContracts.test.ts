import {
  composeStyles,
  contrastRatio,
  getProgressAccessibilityValue,
  interactiveTargetStyle,
  mergeAccessibilityState,
  MINIMUM_INTERACTIVE_TARGET,
} from "@/components/ui/uiContracts";
import { Colors } from "@/theme/tokens";
import { assert, assertDeepEqual, assertEqual } from "../testUtils";

export function testCallerStylesExtendPrimitiveStyles(): void {
  const base = { backgroundColor: Colors.card, borderRadius: 24 };
  const caller = { marginTop: 12 };
  const required = { padding: 16 };

  assertDeepEqual(
    composeStyles(base, caller, required),
    [base, caller, required],
    "primitive styles should retain base and required layers around caller extensions",
  );
}

export function testInteractiveTargetCannotShrinkBelowMinimum(): void {
  assertEqual(MINIMUM_INTERACTIVE_TARGET, 44, "minimum target should be 44 points");
  assertEqual(interactiveTargetStyle.minWidth, 44, "target width should be preserved");
  assertEqual(interactiveTargetStyle.minHeight, 44, "target height should be preserved");
}

export function testRequiredAccessibilityStatePreservesCallerSelection(): void {
  assertDeepEqual(
    mergeAccessibilityState(
      { selected: true, expanded: false, disabled: false },
      { disabled: true, busy: true },
    ),
    { selected: true, expanded: false, disabled: true, busy: true },
    "selected state should survive while required disabled and busy state wins",
  );
}

export function testProgressAccessibilityValueIsClampedAndComplete(): void {
  assertDeepEqual(
    getProgressAccessibilityValue(123, { text: "Complete" }),
    { text: "Complete", min: 0, max: 100, now: 100 },
    "progress semantics should be clamped and preserve caller text",
  );
}

export function testEssentialTextPairsMeetNormalTextContrast(): void {
  assert(
    contrastRatio(Colors.textInverse, Colors.primary) >= 4.5,
    "inverse text on the primary action color should meet 4.5:1",
  );
  assert(
    contrastRatio(Colors.textInverse, Colors.danger) >= 4.5,
    "inverse text on the danger action color should meet 4.5:1",
  );
  assert(
    contrastRatio(Colors.textTertiary, Colors.card) >= 4.5,
    "tertiary text on cards should meet 4.5:1",
  );
  assert(
    contrastRatio(Colors.textPrimary, Colors.secondary) >= 4.5,
    "primary text on the secondary action color should meet 4.5:1",
  );
  assert(
    contrastRatio(Colors.textInverse, Colors.gradientStart) >= 4.5 &&
      contrastRatio(Colors.textInverse, Colors.gradientEnd) >= 4.5,
    "inverse text should meet 4.5:1 at both ends of the shared gradient",
  );
}
