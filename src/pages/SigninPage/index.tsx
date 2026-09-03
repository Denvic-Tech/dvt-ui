import React, { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { useBuildVersion } from '@/features/profile/build-version-info';

import { useAuth } from '@/contexts/AuthContext';

import {
  getFieldState,
  isValidEmail,
  isValidPassword,
  SigninField,
} from './helpers';
import {
  brandRowSx,
  brandTitleAccentSx,
  brandTitleBrandSx,
  brandTitleMetaRowSx,
  brandTitleSx,
  brandVersionSx,
  contentWrapperSx,
  emailSectionSx,
  errorMessageTextSx,
  fieldInputSx,
  fieldLabelSx,
  footerTextSx,
  formContainerSx,
  getFieldIconColor,
  getFieldShellSx,
  getSubmitButtonSx,
  getValidationMessageRowSx,
  headingSx,
  iconShrinkSx,
  loadingIndicatorSx,
  pageContainerSx,
  passwordSectionSx,
  passwordToggleButtonSx,
  primaryOrbSx,
  rootCssVars,
  secondaryOrbSx,
  serverErrorSx,
  subtitleSx,
  warningMessageTextSx,
} from './styles';

const LogoMark = () => (
  <Box
    component='img'
    src='/DVT-logo.png'
    alt=''
    aria-hidden='true'
    sx={{
      width: 38,
      height: 38,
      flexShrink: 0,
      objectFit: 'contain',
    }}
  />
);

const MailIcon = ({ color }: { color: string }) => (
  <Box
    component='svg'
    width={18}
    height={18}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    sx={iconShrinkSx}
  >
    <rect
      x='2'
      y='4'
      width='20'
      height='16'
      rx='3'
      stroke={color}
      strokeWidth='1.8'
    />
    <polyline
      points='22,7 12,14 2,7'
      stroke={color}
      strokeWidth='1.8'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Box>
);

const LockIcon = ({ color }: { color: string }) => (
  <Box
    component='svg'
    width={18}
    height={18}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    sx={iconShrinkSx}
  >
    <rect
      x='3'
      y='11'
      width='18'
      height='11'
      rx='2'
      stroke={color}
      strokeWidth='1.8'
    />
    <path
      d='M7 11V7a5 5 0 0 1 10 0v4'
      stroke={color}
      strokeWidth='1.8'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Box>
);

const CheckIcon = () => (
  <Box
    component='svg'
    width={18}
    height={18}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    sx={iconShrinkSx}
  >
    <polyline
      points='20 6 9 17 4 12'
      stroke='#059669'
      strokeWidth='2'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Box>
);

const ErrorIcon = () => (
  <Box
    component='svg'
    width={14}
    height={14}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    sx={iconShrinkSx}
  >
    <circle cx='12' cy='12' r='10' stroke='#dc2626' strokeWidth='1.8' />
    <line
      x1='12'
      y1='8'
      x2='12'
      y2='12'
      stroke='#dc2626'
      strokeWidth='1.8'
      strokeLinecap='round'
    />
    <line
      x1='12'
      y1='16'
      x2='12.01'
      y2='16'
      stroke='#dc2626'
      strokeWidth='1.8'
      strokeLinecap='round'
    />
  </Box>
);

const WarningIcon = () => (
  <Box
    component='svg'
    width={13}
    height={13}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
    sx={iconShrinkSx}
  >
    <path
      d='M12 3L22 21H2L12 3Z'
      stroke='#f59e0b'
      strokeWidth='1.8'
      strokeLinejoin='round'
    />
    <line
      x1='12'
      y1='9'
      x2='12'
      y2='14'
      stroke='#f59e0b'
      strokeWidth='1.8'
      strokeLinecap='round'
    />
    <line
      x1='12'
      y1='17'
      x2='12.01'
      y2='17'
      stroke='#f59e0b'
      strokeWidth='1.8'
      strokeLinecap='round'
    />
  </Box>
);

const EyeIcon = ({ color }: { color: string }) => (
  <Box
    component='svg'
    width={18}
    height={18}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='12' cy='12' r='3' stroke={color} strokeWidth='1.8' />
  </Box>
);

const EyeOffIcon = ({ color }: { color: string }) => (
  <Box
    component='svg'
    width={18}
    height={18}
    viewBox='0 0 24 24'
    fill='none'
    aria-hidden='true'
  >
    <path
      d='M17.94 17.94C16.17 19.24 14.13 20 12 20 5 20 1 12 1 12c1.24-2.32 2.95-4.35 5-5.94'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M22.54 11.12C22.82 11.56 23 12 23 12s-4 8-11 8c-.45 0-.9-.03-1.34-.09'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M14.12 14.12A3 3 0 0 1 9.88 9.88'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M1 1L23 23'
      stroke={color}
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Box>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('P@ssw0rd');
  const [error] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState({ email: false, password: false });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [capsLock, setCapsLock] = useState({ email: false, password: false });

  const { login } = useAuth();
  const {
    versionInfo,
    isLoading: isVersionLoading,
    error: versionError,
    loadBuildVersion,
  } = useBuildVersion();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || undefined;
  const buildVersion = versionInfo?.version?.trim() ?? '';

  React.useEffect(() => {
    if (!buildVersion && !isVersionLoading && !versionError) {
      void loadBuildVersion();
    }
  }, [buildVersion, isVersionLoading, loadBuildVersion, versionError]);

  const isEmailValid = isValidEmail(email);
  const isPasswordValid = isValidPassword(password);

  const showEmailError =
    touched.email && !focused.email && !isEmailValid && email.length > 0;
  const showPasswordError =
    touched.password &&
    !focused.password &&
    !isPasswordValid &&
    password.length > 0;

  const emailState = getFieldState({
    isFocused: focused.email,
    hasError: showEmailError,
    isValid: isEmailValid,
    value: email,
    isTouched: touched.email,
  });
  const passwordState = getFieldState({
    isFocused: focused.password,
    hasError: showPasswordError,
    isValid: isPasswordValid,
    value: password,
    isTouched: touched.password,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password, returnUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCapsLockChange = (
    field: SigninField,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const isOn = event.getModifierState('CapsLock');
    setCapsLock(prev => ({ ...prev, [field]: isOn }));
  };

  return (
    <div style={rootCssVars}>
      <Box sx={pageContainerSx}>
        <Box sx={primaryOrbSx} />
        <Box sx={secondaryOrbSx} />

        <Box sx={contentWrapperSx}>
          <Box sx={brandRowSx}>
            <LogoMark />
            <Typography component='div' sx={brandTitleSx}>
              <Box component='span' sx={brandTitleBrandSx}>
                Denvic
              </Box>
              <Box component='span' sx={brandTitleMetaRowSx}>
                <Box component='span' sx={brandTitleAccentSx}>
                  Visual Transformer
                </Box>
                {buildVersion ? (
                  <Box component='span' sx={brandVersionSx}>
                    {buildVersion}
                  </Box>
                ) : null}
              </Box>
            </Typography>
          </Box>

          <Box
            component='form'
            onSubmit={handleSubmit}
            noValidate
            sx={formContainerSx}
          >
            <Typography component='h1' sx={headingSx}>
              Вход в аккаунт
            </Typography>
            <Typography sx={subtitleSx}>
              Введите данные для доступа к проектам
            </Typography>

            <Box sx={emailSectionSx}>
              <Typography component='label' htmlFor='email' sx={fieldLabelSx}>
                Email
              </Typography>
              <Box sx={getFieldShellSx(emailState)}>
                <MailIcon color={getFieldIconColor(emailState)} />
                <Box
                  component='input'
                  id='email'
                  name='email'
                  data-testid='pages/SigninPage/login-email-input'
                  type='email'
                  autoComplete='email'
                  autoFocus
                  placeholder='example@email.com'
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value);
                    setTouched(prev => ({ ...prev, email: true }));
                  }}
                  onFocus={() =>
                    setFocused(prev => ({
                      ...prev,
                      email: true,
                    }))
                  }
                  onBlur={() => {
                    setFocused(prev => ({
                      ...prev,
                      email: false,
                    }));
                    setCapsLock(prev => ({ ...prev, email: false }));
                  }}
                  onKeyDown={event => handleCapsLockChange('email', event)}
                  onKeyUp={event => handleCapsLockChange('email', event)}
                  sx={fieldInputSx}
                />
                {touched.email && isEmailValid && email.length > 0 && (
                  <CheckIcon />
                )}
              </Box>

              <Box
                sx={getValidationMessageRowSx(capsLock.email || showEmailError)}
              >
                {capsLock.email ? (
                  <>
                    <WarningIcon />
                    <Typography sx={warningMessageTextSx}>
                      Caps Lock включён
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorIcon />
                    <Typography sx={errorMessageTextSx}>
                      Введите корректный email
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={passwordSectionSx}>
              <Typography
                component='label'
                htmlFor='password'
                sx={fieldLabelSx}
              >
                Пароль
              </Typography>
              <Box sx={getFieldShellSx(passwordState)}>
                <LockIcon color={getFieldIconColor(passwordState)} />
                <Box
                  component='input'
                  id='password'
                  name='password'
                  data-testid='pages/SigninPage/login-password-input'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value);
                    setTouched(prev => ({ ...prev, password: true }));
                  }}
                  onFocus={() =>
                    setFocused(prev => ({
                      ...prev,
                      password: true,
                    }))
                  }
                  onBlur={() => {
                    setFocused(prev => ({
                      ...prev,
                      password: false,
                    }));
                    setCapsLock(prev => ({ ...prev, password: false }));
                  }}
                  onKeyDown={event => handleCapsLockChange('password', event)}
                  onKeyUp={event => handleCapsLockChange('password', event)}
                  sx={fieldInputSx}
                />
                <Box
                  component='button'
                  type='button'
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  sx={passwordToggleButtonSx}
                >
                  {showPassword ? (
                    <EyeOffIcon color='currentColor' />
                  ) : (
                    <EyeIcon color='currentColor' />
                  )}
                </Box>
                {touched.password && isPasswordValid && password.length > 0 && (
                  <CheckIcon />
                )}
              </Box>

              <Box
                sx={getValidationMessageRowSx(
                  capsLock.password || showPasswordError
                )}
              >
                {capsLock.password ? (
                  <>
                    <WarningIcon />
                    <Typography sx={warningMessageTextSx}>
                      Caps Lock включён
                    </Typography>
                  </>
                ) : (
                  <>
                    <ErrorIcon />
                    <Typography sx={errorMessageTextSx}>
                      Минимум 8 символов
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Button
              type='submit'
              data-testid='pages/SigninPage/login-submit-button'
              fullWidth
              disabled={isSubmitting || !isEmailValid || !isPasswordValid}
              sx={getSubmitButtonSx(isSubmitting)}
            >
              {isSubmitting ? (
                <CircularProgress size={18} sx={loadingIndicatorSx} />
              ) : (
                'Войти'
              )}
            </Button>

            <Typography sx={footerTextSx}>
              Нет аккаунта или забыли пароль?
              <br />
              Обратитесь к администратору
            </Typography>

            {error && <Typography sx={serverErrorSx}>{error}</Typography>}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default LoginPage;
