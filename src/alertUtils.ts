// alertUtils.ts
import { useState } from 'react';

export function useCustomAlert() {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  function showCustomAlert(message: string) {
    setAlertMessage(message);
    setShowAlert(true);
  }

  function closeCustomAlert() {
    setShowAlert(false);
  }

  return { showAlert, alertMessage, showCustomAlert, closeCustomAlert };
}
