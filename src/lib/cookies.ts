export function getCookie(key: string, cookiesSource = "") {
    const cookiesList =
      typeof window === "undefined" ? cookiesSource : document.cookie;
  
    if (!cookiesList) {
      return null;
    }
  
    const nameEQ = `${key}=`;
    const cookies = cookiesList.split(";");
  
    for (let i = 0; i < cookies.length; i += 1) {
      let cookie = cookies[i];
  
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
  
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
  
    return null;
  }

export function setCookie(key: string, value: string, days: number = 7) {
  console.log("=======> setCookie", key, value, days);
  if (typeof window === "undefined") {
    return;
  }
  console.log("=======> setCookie 2");
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${key}=${value};expires=${expires.toUTCString()};path=/`;
  console.log("=======> setCookie 3");
}