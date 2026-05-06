import SubscriptionCard from '@/components/SubscriptionCard';
import { TabScreen } from '@/components/TabScreen';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { usePostHog } from 'posthog-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';

function subscriptionMatchesSearch(subscription: Subscription, rawQuery: string) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const haystacks: string[] = [
    subscription.name,
    subscription.plan,
    subscription.category,
    subscription.paymentMethod,
    subscription.status,
    subscription.billing,
  ].filter((s): s is string => Boolean(s?.trim()));

  return haystacks.some((s) => s.toLowerCase().includes(q));
}

const Subscriptions = () => {
  const posthog = usePostHog();
  const { subscriptions } = useSubscriptions();
  const [query, setQuery] = useState('');
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  const filteredSubscriptions = useMemo(
    () => subscriptions.filter((sub) => subscriptionMatchesSearch(sub, query)),
    [subscriptions, query],
  );

  return (
    <TabScreen>
      <FlatList
        ListHeaderComponent={
          <>
            <Text className="font-sans-bold text-primary mb-4 text-2xl">Subscriptions</Text>
            <TextInput
              className="auth-input mb-5"
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name, plan, category…"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </>
        }
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => {
              const isExpanding = expandedSubscriptionId !== item.id;
              setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id));
              if (isExpanding) {
                posthog.capture('subscription_expanded', { subscription_id: item.id });
              }
            }}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text className="home-empty-text">
            {query.trim() ? 'No subscriptions match your search.' : 'No subscriptions yet.'}
          </Text>
        }
        contentContainerClassName="pb-20"
      />
    </TabScreen>
  );
};

export default Subscriptions;
