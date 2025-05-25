chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    // Add context menu item
    chrome.contextMenus.create({
        id: "openSidePanel",
        title: "Fact Check",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "openSidePanel" && info.selectionText) {
        // save the selection text locally
        chrome.storage.local.set({ selectedText: info.selectionText });

        chrome.tabs.sendMessage(tab.id, { action: "getTitle" }, (response) => {
            if (response?.title) {
                chrome.storage.local.set({ articleTitle: response.title });
            }
        });

        // open side panel
        chrome.sidePanel.open({ tabId: tab.id });
    }
});