import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { updatePasswordFromRecoverySession } from "@/services/api/auth/supabaseAuth.session";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (password !== confirmation) {
      setError("Those passwords don't match yet.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await updatePasswordFromRecoverySession(password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error?.message ?? "We couldn't update your password. Please request a new recovery link.");
      return;
    }
    router.replace("/(tabs)/more/account" as never);
  };

  return <Screen keyboardAvoiding scrollable><View className="flex-1 justify-center py-12">
    <Text variant="heading" className="mb-2">Choose a new password</Text>
    <Text variant="body" color="textSecondary" className="mb-8">Make it something secure and easy enough for future you.</Text>
    <Input label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" className="mb-4" />
    <Input label="Confirm new password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" className="mb-4" />
    {error && <Text variant="small" color="danger" className="mb-4">{error}</Text>}
    <Button onPress={submit} loading={isSubmitting} disabled={isSubmitting}>Update password</Button>
  </View></Screen>;
}
