import { useSignIn } from '@clerk/expo';
import cx from 'clsx';
import { Link, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import React from 'react';
import { usePostHog } from 'posthog-react-native';
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

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const posthog = usePostHog();

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

  const localPasswordError = touched.password && !password ? 'Password is required.' : undefined;
  const localCodeError = touched.code && !code.trim() ? 'Code is required.' : undefined;

  const serverIdentifierError = errors?.fields?.identifier?.message;
  const serverPasswordError = errors?.fields?.password?.message;
  const serverCodeError = errors?.fields?.code?.message;
  const serverFormError = (errors as any)?.form?.message as string | undefined;

  const needsEmailCode =
    signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor';

  const finalizeAndGo = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }

        const userId = session?.user?.id;
        const email = session?.user?.primaryEmailAddress?.emailAddress;
        if (userId) {
          posthog.identify(userId, { $set: { email } });
        }
        posthog.capture('user_signed_in', { email });

        const url = decorateUrl('/(tabs)');
        if (Platform.OS === 'web' && url.startsWith('http')) {
          window.location.href = url;
          return;
        }

        // On native, prefer expo-router navigation over window.location.
        router.replace('/(tabs)' as any);
      },
    });
  };

  const handleSubmit = async () => {
    setTouched({ email: true, password: true, code: touched.code });
    if (!emailAddress.trim() || !emailLooksValid(emailAddress) || !password) return;

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      return;
    }

    if (signIn.status === 'complete') {
      await finalizeAndGo();
      return;
    }

    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        // Clerk may require an email code as second factor on new devices.
        // Prefer the built-in MFA helper if available; fall back to legacy attemptSecondFactor.
        if ((signIn as any).mfa?.sendEmailCode) {
          await (signIn as any).mfa.sendEmailCode();
        } else if ((signIn as any).prepareSecondFactor) {
          await (signIn as any).prepareSecondFactor({ strategy: 'email_code' });
        }
      }
      return;
    }
  };

  const handleVerify = async () => {
    setTouched((t) => ({ ...t, code: true }));
    if (!code.trim()) return;

    let result;
    if ((signIn as any).mfa?.verifyEmailCode) {
      result = await (signIn as any).mfa.verifyEmailCode({ code: code.trim() });
    } else if ((signIn as any).attemptSecondFactor) {
      result = await (signIn as any).attemptSecondFactor({
        strategy: 'email_code',
        code: code.trim(),
      });
    }

    if (result?.status === 'complete' || signIn.status === 'complete') {
      await finalizeAndGo();
    }
  };

  const canResendEmailCode =
    !!(signIn as any).mfa?.sendEmailCode || !!(signIn as any).prepareSecondFactor;

  const handleResendEmailCode = async () => {
    if ((signIn as any).mfa?.sendEmailCode) {
      await (signIn as any).mfa.sendEmailCode();
    } else if ((signIn as any).prepareSecondFactor) {
      await (signIn as any).prepareSecondFactor({ strategy: 'email_code' });
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
              {needsEmailCode ? 'Confirm it’s you' : 'Welcome back'}
            </Text>
            <Text className="auth-subtitle">
              {needsEmailCode
                ? 'Enter the code we sent to finish signing in.'
                : 'Sign in to keep tracking renewals and stay on top of spending.'}
            </Text>
          </View>

          <View className="auth-card">
            {needsEmailCode ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={cx(
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

                <View nativeID="clerk-captcha" />

                <Pressable
                  className={cx('auth-button', busy && 'auth-button-disabled')}
                  onPress={handleVerify}
                  disabled={busy}
                >
                  <Text className="auth-button-text">
                    {busy ? 'Verifying…' : 'Verify & continue'}
                  </Text>
                </Pressable>

                <Pressable
                  className={cx(
                    'auth-secondary-button',
                    (busy || !canResendEmailCode) && 'opacity-50',
                  )}
                  onPress={handleResendEmailCode}
                  disabled={busy || !canResendEmailCode}
                >
                  <Text className="auth-secondary-button-text">Send a new code</Text>
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Need to change details?</Text>
                  <Pressable onPress={() => signIn.reset()} disabled={busy}>
                    <Text className="auth-link">Start over</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={cx(
                      'auth-input',
                      (localEmailError || serverIdentifierError) && 'auth-input-error',
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
                  {(localEmailError || serverIdentifierError) && (
                    <Text className="auth-error">{serverIdentifierError ?? localEmailError}</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={cx(
                      'auth-input',
                      (localPasswordError || serverPasswordError) && 'auth-input-error',
                    )}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    placeholder="Your password"
                    placeholderTextColor="#666666"
                    secureTextEntry
                    editable={!busy}
                  />
                  {(localPasswordError || serverPasswordError) && (
                    <Text className="auth-error">{serverPasswordError ?? localPasswordError}</Text>
                  )}
                </View>

                <View nativeID="clerk-captcha" />

                {!!serverFormError && <Text className="auth-error">{serverFormError}</Text>}

                <Pressable
                  className={cx(
                    'auth-button',
                    (busy || !emailAddress.trim() || !password || !emailLooksValid(emailAddress)) &&
                      'auth-button-disabled',
                  )}
                  onPress={handleSubmit}
                  disabled={
                    busy || !emailAddress.trim() || !password || !emailLooksValid(emailAddress)
                  }
                >
                  <Text className="auth-button-text">{busy ? 'Signing in…' : 'Continue'}</Text>
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">New here?</Text>
                  <Link href="/(auth)/sign-up" asChild>
                    <Text className="auth-link">Create an account</Text>
                  </Link>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
