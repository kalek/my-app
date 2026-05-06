import { Link, useLocalSearchParams } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

const SubscriptionDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('subscription_detail_viewed', { subscription_id: id });
  }, [id]);

  return (
    <View>
      <Text>SubscriptionDetails: {id}</Text>
      <Link href="/">Go back</Link>
    </View>
  );
};

export default SubscriptionDetails;
