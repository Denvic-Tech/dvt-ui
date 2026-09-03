import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/primitives';

type HomeLoadErrorAlertProps = {
  visible: boolean;
};

export const HomeLoadErrorAlert = ({ visible }: HomeLoadErrorAlertProps) => {
  if (!visible) {
    return null;
  }

  return (
    <Alert variant='destructive'>
      <AlertTitle>Не все данные домашней страницы удалось загрузить</AlertTitle>
      <AlertDescription>
        Попробуйте обновить страницу или перейти в раздел проектов для ручной
        проверки состояния.
      </AlertDescription>
    </Alert>
  );
};
