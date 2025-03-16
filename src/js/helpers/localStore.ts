const setWithExpiry = (key: string, value: unknown, daysToLive = 1) => {
  const timeInMs = daysToLive * 24 * 60 * 60 * 1000;
  const now = Date.now(); // Текущее время в мс
  const item = {
    value, // Данные
    expiresAt: now + timeInMs, // Время истечения
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getWithExpiry = (key: string) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null; // Нет данных

  const item = JSON.parse(itemStr);
  if (Date.now() > item.expiresAt) {
    localStorage.removeItem(key); // Удаляем просроченные данные
    return null;
  }
  return item.value;
};
