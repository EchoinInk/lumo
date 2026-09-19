import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function LoginScreen() {
  const {
    email,
    password,
    setEmail,
    setPassword,
    isSubmitting,
    error,
    success,
    signIn,
    reset,
  } = useAuthForm();

  useEffect(() => {
    if (success) {
      // Navigate to account screen after successful login
      router.replace("/(tabs)/more/account" as any);
    }
  }, [success]);

  const handleSignUp = () => {
    router.push("/auth/signup" as any);
  };

  const handlePasswordRecovery = () => {
    router.push("/auth/forgot-password" as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Screen keyboardAvoiding scrollable>
      <View className="flex-1 justify-center py-12">
        <Text variant="heading" className="mb-2">
          Welcome back
        </Text>
        <Text variant="body" color="textSecondary" className="mb-8">
          Sign in to access your account
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
          autoComplete="password"
          className="mb-4"
        />

        {error && (
          <Text variant="small" color="danger" className="mb-4">
            {error}
          </Text>
        )}

        <Button
          onPress={signIn}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="mb-4"
        >
          Sign in
        </Button>

        <Button
          variant="ghost"
          onPress={handlePasswordRecovery}
          disabled={isSubmitting}
          className="mb-4"
        >
          Forgot password?
        </Button>

        <Button
          variant="ghost"
          onPress={handleSignUp}
          disabled={isSubmitting}
          className="mb-4"
        >
          Create an account
        </Button>

        <Button variant="ghost" onPress={handleBack} disabled={isSubmitting}>
          Back
        </Button>
      </View>
    </Screen>
  );
}
