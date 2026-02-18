import { useState, useRef, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const notificationTimeoutsRef = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notificationTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  const addNotification = useCallback((text, color) => {
    const notificationId = Date.now();
    setNotifications(prev => [...prev, { id: notificationId, text, color }]);

    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationTimeoutsRef.current = notificationTimeoutsRef.current.filter(id => id !== timeoutId);
    }, 3000);
    notificationTimeoutsRef.current.push(timeoutId);
  }, []);

  return { notifications, addNotification };
};
