document.querySelector("#open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
initializeLanguage();
