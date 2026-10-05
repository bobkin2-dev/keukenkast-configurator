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

  const dismissNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // options.action = { label, onClick } renders a button in the toast (e.g. "Ongedaan maken")
  // options.duration = ms before the toast disappears (default 3000)
  const addNotification = useCallback((text, color, options = {}) => {
    const { action, duration = 3000 } = options;
    const notificationId = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id: notificationId, text, color, action }]);

    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      notificationTimeoutsRef.current = notificationTimeoutsRef.current.filter(id => id !== timeoutId);
    }, duration);
    notificationTimeoutsRef.current.push(timeoutId);
  }, []);

  return { notifications, addNotification, dismissNotification };
};
