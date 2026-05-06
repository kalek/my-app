import { useSignUp } from '@clerk/expo';
import clsx from 'clsx';
import { Link, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

const SafeAreaView = styled(RNSafeAreaView);

const emailLooksValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [touched, setTouched] = React.useState<{
    email: boolean;
    password: boolean;
    code: boolean;
  }>({
    email: false,
    password: false,
    code: false,
  });

  const busy = fetchStatus === 'fetching';

  const localEmailError =
    touched.email && !emailAddress.trim()
      ? 'Email is required.'
      : touched.email && !emailLooksValid(emailAddress)
        ? 'Enter a valid email.'
        : undefined;

  const localPasswordError =
    touched.password && !password
      ? 'Password is required.'
      : touched.password && password.length < 8
        ? 'Use 8+ characters.'
        : undefined;

  const localCodeError = touched.code && !code.trim() ? 'Code is required.' : undefined;

  const serverEmailError = errors?.fields?.emailAddress?.message;
  const serverPasswordError = errors?.fields?.password?.message;
  const serverCodeError = errors?.fields?.code?.message;

  const showVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const handleSubmit = async () => {
    setTouched({ email: true, password: true, code: touched.code });
    if (!emailAddress.trim() || !emailLooksValid(emailAddress) || !password || password.length < 8)
      return;

    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      return;
    }

    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    setTouched((t) => ({ ...t, code: true }));
    if (!code.trim()) return;

    await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          const url = decorateUrl('/(tabs)');
          if (Platform.OS === 'web' && url.startsWith('http')) {
            window.location.href = url;
            return;
          }

          // On native, prefer expo-router navigation over window.location.
          router.replace('/(tabs)' as any);
        },
      });
    }
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="auth-scroll"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="auth-content"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">S</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Subspace</Text>
                <Text className="auth-wordmark-sub">Subscriptions, simplified</Text>
              </View>
            </View>

            <Text className="auth-title">
              {showVerification ? 'Check your inbox' : 'Create your account'}
            </Text>
            <Text className="auth-subtitle">
              {showVerification
                ? 'Enter the 6‑digit code we sent to confirm your email.'
                : 'Keep your subscriptions organized with a clean, private workspace.'}
            </Text>
          </View>

          <View className="auth-card">
            {showVerification ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={clsx(
                      'auth-input',
                      (localCodeError || serverCodeError) && 'auth-input-error',
                    )}
                    value={code}
                    onChangeText={setCode}
                    onBlur={() => setTouched((t) => ({ ...t, code: true }))}
                    placeholder="6-digit code"
                    placeholderTextColor="#666666"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={6}
                    editable={!busy}
                  />
                  {(localCodeError || serverCodeError) && (
                    <Text className="auth-error">{serverCodeError ?? localCodeError}</Text>
                  )}
                  <Text className="auth-helper">
                    Didn’t get it? Check spam, or request a new code.
                  </Text>
                </View>

                <Pressable
                  className={clsx('auth-button', busy && 'auth-button-disabled')}
                  onPress={handleVerify}
                  disabled={busy}
                >
                  <Text className="auth-button-text">
                    {busy ? 'Verifying…' : 'Verify & continue'}
                  </Text>
                </Pressable>

                <Pressable
                  className={clsx('auth-secondary-button', busy && 'opacity-50')}
                  onPress={() => signUp.verifications.sendEmailCode()}
                  disabled={busy}
                >
                  <Text className="auth-secondary-button-text">Send a new code</Text>
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Wrong email?</Text>
                  <Pressable onPress={() => signUp.reset()} disabled={busy}>
                    <Text className="auth-link">Start over</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={clsx(
                      'auth-input',
                      (localEmailError || serverEmailError) && 'auth-input-error',
                    )}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    inputMode="email"
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@domain.com"
                    placeholderTextColor="#666666"
                    editable={!busy}
                  />
                  {(localEmailError || serverEmailError) && (
                    <Text className="auth-error">{serverEmailError ?? localEmailError}</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={clsx(
                      'auth-input',
                      (localPasswordError || serverPasswordError) && 'auth-input-error',
                    )}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="Create a password"
                    placeholderTextColor="#666666"
                    secureTextEntry
                    editable={!busy}
                  />
                  {(localPasswordError || serverPasswordError) && (
                    <Text className="auth-error">{serverPasswordError ?? localPasswordError}</Text>
                  )}
                  <Text className="auth-helper">
                    8+ characters. We’ll never share your details.
                  </Text>
                </View>

                <Pressable
                  className={clsx(
                    'auth-button',
                    (busy ||
                      !emailAddress.trim() ||
                      !password ||
                      !emailLooksValid(emailAddress) ||
                      password.length < 8) &&
                      'auth-button-disabled',
                  )}
                  onPress={handleSubmit}
                  disabled={
                    busy ||
                    !emailAddress.trim() ||
                    !password ||
                    !emailLooksValid(emailAddress) ||
                    password.length < 8
                  }
                >
                  <Text className="auth-button-text">{busy ? 'Creating…' : 'Create account'}</Text>
                </Pressable>

                <View className="auth-divider-row">
                  <View className="auth-divider-line" />
                  <Text className="auth-divider-text">secure by design</Text>
                  <View className="auth-divider-line" />
                </View>

                <Text className="auth-helper">
                  Your session is encrypted on device. You can sign out anytime in settings.
                </Text>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Already have an account?</Text>
                  <Link href="/(auth)/sign-in" asChild>
                    <Text className="auth-link">Sign in</Text>
                  </Link>
                </View>

                <View nativeID="clerk-captcha" />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
