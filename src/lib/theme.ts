/** Dark mode follows the device setting. There is no manual switch. */
export const DARK_QUERY = "(prefers-color-scheme: dark)";
export const THEME_COLORS = { light: "#f7f7f4", dark: "#111713" } as const;

/** Runs in <head> before first paint so a dark phone never shows a light flash. Kept as plain ES5-style text. */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=window.matchMedia("${DARK_QUERY}");var c=${JSON.stringify(THEME_COLORS)};function a(){var d=m.matches;var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";var t=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<t.length;i++)t[i].setAttribute("content",d?c.dark:c.light);}a();if(m.addEventListener)m.addEventListener("change",a);else if(m.addListener)m.addListener(a);}catch(e){}})();`;
