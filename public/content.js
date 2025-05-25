chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTitle") {
        const h1 = document.querySelector("h1")?.innerText;
        const title = h1 || document.title || "";
        sendResponse({ title });
    }
});