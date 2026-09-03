import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Paper, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class GlobalErrorBoundary_ extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);

    // Вызываем callback для обработки ошибки
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Отправка ошибки в внешний сервис мониторинга
    this.reportErrorToService(error, errorInfo);
  }

  reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Здесь можно интегрировать с сервисами мониторинга
    // например, Sentry, LogRocket, Bugsnag и т.д.
    console.log('Reporting error to monitoring service:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 3,
            backgroundColor: 'background.default',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              maxWidth: 600,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Alert severity='error' sx={{ mb: 3 }}>
              <Typography variant='h5' gutterBottom>
                Произошла ошибка в приложении
              </Typography>
            </Alert>

            <Typography variant='body1' color='text.secondary' paragraph>
              Извините, что-то пошло не так. Попробуйте перезагрузить страницу
              или обратитесь к администратору.
            </Typography>

            {this.state.error && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography
                  variant='body2'
                  color='error'
                  sx={{ fontFamily: 'monospace' }}
                >
                  {this.state.error.message}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant='contained' onClick={this.handleReload}>
                Перезагрузить страницу
              </Button>
              <Button variant='outlined' onClick={this.handleReset}>
                Попробовать снова
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const GlobalErrorBoundary = GlobalErrorBoundary_;
