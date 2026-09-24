import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { sendPasswordRecoveryEmail } from "@/services/api/auth/supabaseAuth.session";
import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Enter the email address you use for Lumo.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendPasswordRecoveryEmail(email.trim());
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.error?.message ?? "We couldn't send a recovery email. Please try again.");
      return;
    }
    setMessage("If that email has a Lumo account, a recovery link is on its way.");
  };

  return (
    <Screen keyboardAvoiding scrollable>
      <View className="flex-1 justify-center py-12">
        <Text variant="heading" className="mb-2">Reset your password</Text>
        <Text variant="body" color="textSecondary" className="mb-8">
          We’ll send a link that opens Lumo so you can choose a new password.
        </Text>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          className="mb-4"
        />
        {error && <Text variant="small" color="danger" className="mb-4">{error}</Text>}
        {message && <Text variant="small" color="textSecondary" className="mb-4">{message}</Text>}
        <Button onPress={submit} loading={isSubmitting} disabled={isSubmitting}>Send recovery link</Button>
        <Button variant="ghost" onPress={() => router.back()} disabled={isSubmitting} className="mt-4">Back to sign in</Button>
      </View>
    </Screen>
  );
}
