export function initDarkMode() {
    const toggle = document.getElementById("toggleDark");
    if (!toggle) return;
  
    const applyDark = () => {
      const isDark = localStorage.getItem("dark") === "true";
      document.body.classList.toggle("force-dark", isDark);
      toggle.textContent = isDark ? "☀️" : "🌙";
    };
  
    applyDark();
  
    toggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("force-dark");
      localStorage.setItem("dark", !isDark);
      applyDark();
    });
  }
  