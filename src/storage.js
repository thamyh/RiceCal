// 把 Claude artifact 的 window.storage 換成 localStorage
// API 介面保持一樣，原始程式碼幾乎不用改

export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    return { key, value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { keys };
  },
};
