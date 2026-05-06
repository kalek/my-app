import { CATEGORY_COLORS, SUBSCRIPTION_CATEGORIES, type SubscriptionCategory } from '@/constants/data';
import { icons } from '@/constants/icons';
import cx from 'clsx';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Frequency = 'Monthly' | 'Yearly';

export type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

const parsePositivePrice = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
};

const FREQUENCIES: Frequency[] = ['Monthly', 'Yearly'];

function createSubscriptionPayload(input: {
  name: string;
  price: number;
  frequency: Frequency;
  category: SubscriptionCategory;
}): Subscription {
  const now = dayjs();
  const startDate = now.toISOString();
  const renewalDate =
    input.frequency === 'Monthly'
      ? now.add(1, 'month').toISOString()
      : now.add(1, 'year').toISOString();

  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    id,
    name: input.name.trim(),
    price: input.price,
    category: input.category,
    status: 'active',
    startDate,
    renewalDate,
    icon: icons.wallet,
    billing: input.frequency,
    frequency: input.frequency,
    color: CATEGORY_COLORS[input.category],
    currency: 'USD',
  };
}

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [category, setCategory] = useState<SubscriptionCategory>('Other');
  const [nameTouched, setNameTouched] = useState(false);
  const [priceTouched, setPriceTouched] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setPrice('');
    setFrequency('Monthly');
    setCategory('Other');
    setNameTouched(false);
    setPriceTouched(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const parsedPrice = useMemo(() => parsePositivePrice(price), [price]);

  const nameError =
    nameTouched && !name.trim() ? 'Name is required.' : undefined;

  const priceError =
    priceTouched && !price.trim()
      ? 'Price is required.'
      : priceTouched && price.trim() && parsedPrice === undefined
        ? 'Enter a valid positive number.'
        : undefined;

  const canSubmit = Boolean(name.trim() && parsedPrice !== undefined);

  const handleSubmit = () => {
    if (!canSubmit || parsedPrice === undefined) return;
    const subscription = createSubscriptionPayload({
      name,
      price: parsedPrice,
      frequency,
      category,
    });
    onCreate(subscription);
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="modal-container w-full"
            style={{ paddingBottom: insets.bottom }}
          >
            <View className="modal-header">
              <Text className="modal-title">New Subscription</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="modal-close"
                onPress={onClose}
              >
                <Text className="modal-close-text">×</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="modal-body"
            >
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <TextInput
                  className={cx('auth-input', nameError && 'auth-input-error')}
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Subscription name"
                  placeholderTextColor="#666666"
                />
                {!!nameError && <Text className="auth-error">{nameError}</Text>}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <TextInput
                  className={cx('auth-input', priceError && 'auth-input-error')}
                  value={price}
                  onChangeText={setPrice}
                  onBlur={() => setPriceTouched(true)}
                  placeholder="0.00"
                  placeholderTextColor="#666666"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                />
                {!!priceError && <Text className="auth-error">{priceError}</Text>}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {FREQUENCIES.map((f) => {
                    const active = frequency === f;
                    return (
                      <Pressable
                        key={f}
                        className={cx('picker-option', active && 'picker-option-active')}
                        onPress={() => setFrequency(f)}
                      >
                        <Text
                          className={cx(
                            'picker-option-text',
                            active && 'picker-option-text-active',
                          )}
                        >
                          {f}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {SUBSCRIPTION_CATEGORIES.map((c) => {
                    const active = category === c;
                    return (
                      <Pressable
                        key={c}
                        className={cx('category-chip', active && 'category-chip-active')}
                        onPress={() => setCategory(c)}
                      >
                        <Text
                          className={cx(
                            'category-chip-text',
                            active && 'category-chip-text-active',
                          )}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                className={cx('auth-button', !canSubmit && 'auth-button-disabled')}
                disabled={!canSubmit}
                onPress={handleSubmit}
              >
                <Text className="auth-button-text">Add subscription</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
