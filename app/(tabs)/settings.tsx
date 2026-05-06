import { useAuth, useUser } from '@clerk/expo';
import { styled } from 'nativewind';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useAuth();
  const { isLoaded, user } = useUser();

  const handleLogout = async () => {
    await signOut();
  };

  const formatDateTime = (value?: Date | null) => {
    if (!value) return '—';
    return value.toLocaleString();
  };

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? '—';

  return (
    <SafeAreaView className="bg-background flex-1 p-5">
      <View className="flex-1">
        <Text className="font-sans-bold text-primary text-2xl">Settings</Text>

        <View className="border-border bg-card mt-5 rounded-3xl border p-5">
          <Text className="font-sans-bold text-primary text-lg">Your account</Text>

          {!isLoaded ? (
            <Text className="font-sans-medium text-muted-foreground mt-2">Loading…</Text>
          ) : (
            <View className="mt-4 gap-3">
              <View className="flex-row items-start justify-between gap-4">
                <Text className="font-sans-medium text-muted-foreground text-sm">User ID</Text>
                <Text className="font-sans-semibold text-primary text-sm" selectable>
                  {user?.id ?? '—'}
                </Text>
              </View>

              <View className="flex-row items-start justify-between gap-4">
                <Text className="font-sans-medium text-muted-foreground text-sm">Email</Text>
                <Text className="font-sans-semibold text-primary text-sm" selectable>
                  {userEmail}
                </Text>
              </View>

              <View className="flex-row items-start justify-between gap-4">
                <Text className="font-sans-medium text-muted-foreground text-sm">Joined</Text>
                <Text className="font-sans-semibold text-primary text-sm">
                  {formatDateTime(user?.createdAt ?? null)}
                </Text>
              </View>

              <View className="flex-row items-start justify-between gap-4">
                <Text className="font-sans-medium text-muted-foreground text-sm">Last sign-in</Text>
                <Text className="font-sans-semibold text-primary text-sm">
                  {formatDateTime(user?.lastSignInAt ?? null)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="mt-6 gap-3">
          <Pressable
            className="border-destructive/30 bg-destructive/10 items-center rounded-2xl border py-3"
            onPress={handleLogout}
          >
            <Text className="font-sans-semibold text-destructive text-sm">Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
