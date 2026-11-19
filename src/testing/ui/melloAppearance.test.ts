import { contrastRatio } from "@/components/ui/uiContracts";
import { palettes } from "@/theme/colors";
import tokens from "@/theme/mello-tokens.json";
import { assert, assertDeepEqual, assertEqual } from "../testUtils";

export function testMelloTextActionsAndControlsKeepContrastInEveryAppearance(): void {
  for (const modes of Object.values(palettes)) {
    for (const p of Object.values(modes)) {
      for (const surface of [p.background, p.taskPanel, p.resetPanel]) {
        for (const text of [p.textPrimary, p.textSecondary, p.primary]) {
          assert(contrastRatio(text, surface) >= 4.5, `Readable text on ${surface} in ${p.mode}`);
        }
        for (const edge of [p.controlOutline, p.focus]) {
          assert(contrastRatio(edge, surface) >= 3, `Visible control on ${surface} in ${p.mode}`);
        }
      }
      assert(contrastRatio(p.selectedText, p.selectedFill) >= 4.5, "Readable selected level");
      assert(contrastRatio(p.selectedEdge, p.selectedFill) >= 3, "Visible selection outline");
      assert(contrastRatio(p.textInverse, p.primary) >= 4.5, "Readable action label");
    }
  }
}

export function testQuietAppearancePreservesFunctionalCues(): void {
  for (const { quiet, standard } of Object.values(palettes)) {
    assertEqual(quiet.selectedFill, quiet.background, "Quiet selection uses the main surface");
    assertEqual(quiet.taskPanel, quiet.background, "Quiet task panel uses the main surface");
    assertEqual(quiet.resetPanel, quiet.background, "Quiet reset panel uses the main surface");
    assertEqual(quiet.primary, standard.primary, "Actions retain their colour");
    assertEqual(quiet.selectedEdge, standard.selectedEdge, "Selection retains its outline");
    assertEqual(quiet.focus, standard.focus, "Focus retains its colour");
  }
  assertDeepEqual(tokens.gradient.onPlum, ["#F8CDE1", "#B29DCB", "#A7C8E5"], "Approved Soft turn blend");
}
