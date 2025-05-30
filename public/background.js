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

        // send message to popup/sidepanel to rerun pipeline
        chrome.storage.local.set({
            selectedText: info.selectionText,
            factCheckResults: null,
            conclusionCache: null,
            confidenceCache: null,
            queryCache: null,
            }, () => {
            chrome.runtime.sendMessage({
                action: "newSelection",
                selectedText: info.selectionText
            });
        });

        // open side panel
        chrome.sidePanel.open({ tabId: tab.id });
    }
});