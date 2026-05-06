import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import { TabScreen } from '@/components/TabScreen';
import UpcomingSubscriptionCard from '@/components/UpcomingSubscriptionCard';
import { HOME_BALANCE, UPCOMING_SUBSCRIPTIONS } from '@/constants/data';
import { icons } from '@/constants/icons';
import images from '@/constants/images';
import { useSubscriptions } from '@/context/SubscriptionsContext';
import { formatCurrency, formatSubscriptionDateTime } from '@/lib/utils';
import { useUser } from '@clerk/expo';
import { usePostHog } from 'posthog-react-native';
import { useState } from 'react';

import { FlatList, Image, Pressable, Text, View } from 'react-native';

export default function App() {
  const { user } = useUser();
  const posthog = usePostHog();
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const { subscriptions, addSubscription } = useSubscriptions();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const displayName =
    user?.firstName || user?.fullName || user?.emailAddresses[0]?.emailAddress || 'User';

  return (
    <TabScreen>
      <FlatList
        ListHeaderComponent={() => (
          <>
            <View className="home-header">
              <View className="home-user">
                <Image
                  source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                  className="home-avatar"
                />
                <Text className="home-user-name">{displayName}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add subscription"
                hitSlop={8}
                onPress={() => setCreateModalVisible(true)}
              >
                <Image source={icons.add} className="home-add-icon" />
              </Pressable>
            </View>

            <View className="home-balance-card">
              <Text className="home-balance-label">Balance</Text>
              <View className="home-balance-row">
                <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
                <Text className="home-balance-date">
                  {formatSubscriptionDateTime(HOME_BALANCE.nextRenewalDate)}
                </Text>
              </View>
            </View>

            <View className="mb-5">
              <ListHeading title="Upcoming" />
              <FlatList
                data={UPCOMING_SUBSCRIPTIONS}
                renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={
                  <Text className="home-empty-text">No upcoming renewals yet</Text>
                }
              />
            </View>

            <ListHeading title="All Subscriptions" />
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
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
        ListEmptyComponent={<Text className="home-empty-text">No subscriptions yet</Text>}
        contentContainerClassName="pb-20"
      />
      <CreateSubscriptionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreate={addSubscription}
      />
    </TabScreen>
  );
}
