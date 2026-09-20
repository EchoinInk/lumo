import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function SignupScreen() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    isSubmitting,
    error,
    confirmationMessage,
    success,
    signUp,
  } = useAuthForm();

  useEffect(() => {
    if (success) {
      // Navigate to account screen after successful signup
      router.replace("/(tabs)/more/account" as any);
    }
  }, [success]);

  const handleSignIn = () => {
    router.push("/auth/login" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Screen keyboardAvoiding scrollable>
      <View className="flex-1 justify-center py-12">
        <Text variant="heading" className="mb-2">
          Create an account
        </Text>
        <Text variant="body" color="textSecondary" className="mb-8">
          Get started with Lumo
        </Text>

        <Input
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          className="mb-4"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
          helperText="At least 6 characters with uppercase, lowercase, number, and symbol"
          className="mb-4"
        />

        {error && (
          <Text variant="small" color="danger" className="mb-4">
            {error}
          </Text>
        )}

        {confirmationMessage && (
          <Text variant="small" color="textSecondary" className="mb-4">
            {confirmationMessage}
          </Text>
        )}

        <Button
          onPress={() => void signUp()}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="mb-4"
        >
          Create account
        </Button>

        <Button
          variant="ghost"
          onPress={handleSignIn}
          disabled={isSubmitting}
          className="mb-4"
        >
          Already have an account? Sign in
        </Button>

        <Button variant="ghost" onPress={handleBack} disabled={isSubmitting}>
          Back
        </Button>
      </View>
    </Screen>
  );
}
