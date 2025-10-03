export const getCookie = (key) => {
    var b = document.cookie.match("(^|;)\\s*" + key + "\\s*=\\s*([^;]+)");
    return b ? b.pop() : "";
};

export const getCookieExp = (token) => {
  if (!token) return null;
  const payload =  token.split('.')[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(atob(payload));
    if (decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (e) {
    return null;
  }
}
  
export const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}