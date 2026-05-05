import { Link } from "expo-router";
import { styled } from "nativewind";
import { Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);
 
export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
        <Text className="text-xl font-bold text-success">
          Welcome to Nativewind!
        </Text>
        <Link className="mt-4 rounded bg-primary text-white p-4" href="/onboarding">
          Go to Onboarding
        </Link>
        <Link className="mt-4 rounded bg-primary text-white p-4" href="/sign-in">
          Go to Sign In
        </Link>
        <Link className="mt-4 rounded bg-primary text-white p-4" href="/sign-up">
          Go to Sign Up
        </Link>

        <Link href="/subscriptions/spotify">Subscription Spotify</Link>
        <Link href={{
          pathname: "/subscriptions/[id]",
          params: { id: "claude" },
        }}>
          Subscription Claude
        </Link>
    </SafeAreaView>
  );
}