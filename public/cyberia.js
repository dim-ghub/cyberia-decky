// Cyberia button injection (standalone plugin)
(function () {
  "use strict";

  // Forward logs to Millennium backend so they appear in the dev console
  function backendLog(message) {
    try {
      if (
        typeof Millennium !== "undefined" &&
        typeof Millennium.callServerMethod === "function"
      ) {
        Millennium.callServerMethod("cyberia", "Logger.log", {
          message: String(message),
        });
      }
    } catch (err) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[Cyberia] backendLog failed", err);
      }
    }
  }

  backendLog("Cyberia script loaded");
  // anti-spam state
  const logState = { missingOnce: false, existsOnce: false };
  // click/run debounce state
  const runState = { inProgress: false, appid: null };

  function ensureCyberiaStyles() {
    if (document.getElementById("cyberia-styles")) return;
    try {
      const style = document.createElement("style");
      style.id = "cyberia-styles";
      style.textContent = `
                @font-face {
                    font-family: "TrixieCyrG";
                    src: url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.eot");
                    src: url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.eot?#iefix")format("embedded-opentype"),
                    url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.woff2")format("woff2"),
                    url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.woff")format("woff"),
                    url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.ttf")format("truetype"),
                    url("https://db.onlinewebfonts.com/t/11bc98458796ec227ee7ebe4a613e80d.svg#Trixie-Text")format("svg");
                    font-weight: normal;
                    font-style: normal;
                }
                .cyberia-button {
                    margin-left:6px !important;
                    font-family: TrixieCyrG !important;
                    font-weight: bold !important;
                    background: #000000 !important;
                    color: #c06c84 !important;
                }
                .cyberia-btn {
                    padding: 12px 24px;
                    background: #000000;
                    border: 2px solid #c06c84;
                    color: #c06c84;
                    font-size: 15px;
                    font-family: TrixieCyrG;
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    letter-spacing: 0.3px;
                }
                .cyberia-btn:hover:not([data-disabled="1"]) {
                    background: #c06c84;
                    border-color: #c06c84;
                    color: #000000;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(192,108,132,0.3);
                }
                .cyberia-btn.primary {
                    background: #000000;
                    border: 2px solid #c06c84;
                    color: #c06c84;
                    font-weight: 700;
                    box-shadow: 0 4px 15px rgba(192,108,132,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
                }
                .cyberia-btn.primary:hover:not([data-disabled="1"]) {
                    background: #c06c84;
                    border-color: #c06c84;
                    color: #000000;
                    transform: translateY(-3px) scale(1.03);
                    box-shadow: 0 8px 25px rgba(192,108,132,0.6), inset 0 1px 0 rgba(255,255,255,0.3);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                /* Modal buttons styling */
                .cyberia-cancel-btn, .cyberia-hide-btn {
                    background: #000000 !important;
                    border: 2px solid #c06c84 !important;
                    color: #c06c84 !important;
                    font-family: TrixieCyrG !important;
                }
                .cyberia-cancel-btn:hover, .cyberia-hide-btn:hover {
                    background: #c06c84 !important;
                    border-color: #c06c84 !important;
                    color: #000000 !important;
                    font-family: TrixieCyrG !important;
                }
                /* Settings Modal */
                .cyberia-settings-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(8px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                .cyberia-settings-modal {
                    background: #000000;
                    border: 2px solid #c06c84;
                    border-radius: 4px;
                    padding: 24px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 8px 32px rgba(192,108,132,0.3);
                    animation: slideUp 0.3s ease;
                    font-family: TrixieCyrG;
                }
                .cyberia-settings-title {
                    color: #c06c84;
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .cyberia-settings-section {
                    margin-bottom: 20px;
                }
                .cyberia-settings-section-title {
                    color: #c06c84;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .cyberia-api-item {
                    background: rgba(192,108,132,0.1);
                    border: 1px solid #c06c84;
                    border-radius: 4px;
                    padding: 12px;
                    margin-bottom: 10px;
                }
                .cyberia-form-group {
                    margin-bottom: 12px;
                }
                .cyberia-form-label {
                    display: block;
                    color: #c06c84;
                    font-size: 14px;
                    margin-bottom: 6px;
                }
                .cyberia-form-input {
                    width: 100%;
                    padding: 8px 12px;
                    background: #000000;
                    border: 1px solid #c06c84;
                    color: #c06c84;
                    font-family: TrixieCyrG;
                    font-size: 14px;
                    border-radius: 3px;
                    box-sizing: border-box;
                }
                .cyberia-form-input:focus {
                    outline: none;
                    border-color: #c06c84;
                    box-shadow: 0 0 8px rgba(192,108,132,0.5);
                }
                .cyberia-form-checkbox {
                    margin-right: 8px;
                }
                .cyberia-api-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 8px;
                }
                .cyberia-delete-btn {
                    background: #000000 !important;
                    border: 2px solid #c06c84 !important;
                    color: #c06c84 !important;
                    font-family: TrixieCyrG !important;
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                    cursor: pointer;
                }
                .cyberia-delete-btn:hover {
                    background: #c06c84 !important;
                    color: #000000 !important;
                }
                .cyberia-add-btn {
                    background: #000000 !important;
                    border: 2px solid #c06c84 !important;
                    color: #c06c84 !important;
                    font-family: TrixieCyrG !important;
                    padding: 8px 16px !important;
                    font-size: 14px !important;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                }
                .cyberia-add-btn:hover {
                    background: #c06c84 !important;
                    color: #000000 !important;
                }
                .cyberia-save-btn {
                    background: #000000 !important;
                    border: 2px solid #c06c84 !important;
                    color: #c06c84 !important;
                    font-family: TrixieCyrG !important;
                    padding: 10px 20px !important;
                    font-size: 14px !important;
                    cursor: pointer;
                }
                .cyberia-save-btn:hover:not([data-disabled="1"]) {
                    background: #c06c84 !important;
                    color: #000000 !important;
                }
                .cyberia-save-btn[data-disabled="1"] {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `;
      document.head.appendChild(style);
    } catch (err) {
      backendLog("Cyberia:Styles injection failed: " + err);
    }
  }

  // Helper: show Cyberia loading popup with progress bar
  function showTestPopup() {
    // Avoid duplicates
    if (document.querySelector(".cyberia-overlay")) return;
    // Close settings popup if open so modals don't overlap
    try {
      const s = document.querySelector(".cyberia-settings-overlay");
      if (s) s.remove();
    } catch (_) {}

    ensureCyberiaStyles();
    const overlay = document.createElement("div");
    overlay.className = "cyberia-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;";

    const modal = document.createElement("div");
    modal.style.cssText =
      "background:#000000;color:#c06c84;border:2px solid #c06c84;min-width:400px;max-width:560px;padding:28px 32px;box-shadow:0 20px 60px rgba(0,0,0,.8), 0 0 0 1px rgba(192,108,132,0.3);animation:slideUp 0.1s ease-out;";

    const title = document.createElement("div");
    title.style.cssText =
      "font-size:22px;color:#c06c84;margin-bottom:16px;font-family: TrixieCyrG; font-weight: bold;";
    title.className = "cyberia-title";
    title.textContent = "I feel accelerated.";

    const body = document.createElement("div");
    body.style.cssText =
      "font-size:14px;line-height:1.4;margin-bottom:12px;font-family: TrixieCyrG; font-weight: bold;";
    body.className = "cyberia-status";
    body.textContent = "Working…";

    const progressWrap = document.createElement("div");
    progressWrap.style.cssText =
      "background:rgba(192,108,132,0.2);height:12px;overflow:hidden;position:relative;display:none;border:1px solid rgba(192,108,132,0.5);";
    progressWrap.className = "cyberia-progress-wrap";
    const progressBar = document.createElement("div");
    progressBar.style.cssText =
      "height:100%;width:0%;background:#c06c84;transition:width 0.1s linear;box-shadow:0 0 10px rgba(192,108,132,0.5);";
    progressBar.className = "cyberia-progress-bar";
    progressWrap.appendChild(progressBar);

    const percent = document.createElement("div");
    percent.style.cssText =
      "text-align:right;color:#c06c84;margin-top:8px;font-size:12px;display:none;font-family: TrixieCyrG; font-weight: bold;";
    percent.className = "cyberia-percent";
    percent.textContent = "0%";

    const btnRow = document.createElement("div");
    btnRow.style.cssText =
      "margin-top:16px;display:flex;gap:8px;justify-content:flex-end;";
    const cancelBtn = document.createElement("a");
    cancelBtn.className = "btnv6_blue_hoverfade btn_medium cyberia-cancel-btn";
    cancelBtn.innerHTML = `<span>Cancel</span>`;
    cancelBtn.href = "#";
    cancelBtn.style.display = "none";
    cancelBtn.onclick = function (e) {
      e.preventDefault();
      cancelOperation();
    };
    const hideBtn = document.createElement("a");
    hideBtn.className = "btnv6_blue_hoverfade btn_medium cyberia-hide-btn";
    hideBtn.innerHTML = `<span>Hide</span>`;
    hideBtn.href = "#";
    hideBtn.onclick = function (e) {
      e.preventDefault();
      cleanup();
    };
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(hideBtn);

    modal.appendChild(title);
    modal.appendChild(body);
    modal.appendChild(progressWrap);
    modal.appendChild(percent);
    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function cleanup() {
      overlay.remove();
    }

    function cancelOperation() {
      // Call backend to cancel the operation
      try {
        const match =
          window.location.href.match(
            /https:\/\/store\.steampowered\.com\/app\/(\d+)/,
          ) ||
          window.location.href.match(
            /https:\/\/steamcommunity\.com\/app\/(\d+)/,
          );
        const appid = match
          ? parseInt(match[1], 10)
          : window.__CyberiaCurrentAppId || NaN;
        if (
          !isNaN(appid) &&
          typeof Millennium !== "undefined" &&
          typeof Millennium.callServerMethod === "function"
        ) {
          Millennium.callServerMethod("cyberia", "CancelAddViaCyberia", {
            appid,
            contentScriptQuery: "",
          });
        }
      } catch (_) {}
      // Update UI to show cancelled
      const status = overlay.querySelector(".cyberia-status");
      if (status) status.textContent = "Cancelled";
      const cancelBtn = overlay.querySelector(".cyberia-cancel-btn");
      if (cancelBtn) cancelBtn.style.display = "none";
      const hideBtn = overlay.querySelector(".cyberia-hide-btn");
      if (hideBtn) hideBtn.innerHTML = `<span>Close</span>`;
      // Hide progress UI
      const wrap = overlay.querySelector(".cyberia-progress-wrap");
      const percent = overlay.querySelector(".cyberia-percent");
      if (wrap) wrap.style.display = "none";
      if (percent) percent.style.display = "none";
      // Reset run state
      runState.inProgress = false;
      runState.appid = null;
    }
  }

  // Function to show the settings modal
  function showSettingsPopup() {
    // Check if settings modal already exists
    if (document.querySelector(".cyberia-settings-overlay")) {
      backendLog("Settings modal already open");
      return;
    }

    // Close any open loading modal to prevent overlap
    const existingOverlay = document.querySelector(".cyberia-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Ensure styles are loaded
    ensureCyberiaStyles();

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "cyberia-settings-overlay";

    // Create modal
    const modal = document.createElement("div");
    modal.className = "cyberia-settings-modal";
    overlay.appendChild(modal);

    // Create title
    const title = document.createElement("div");
    title.className = "cyberia-settings-title";
    title.textContent = "Settings";
    modal.appendChild(title);

    // Create settings body
    const body = document.createElement("div");
    body.className = "cyberia-settings-body";

    // API Configuration Section
    const apiSection = document.createElement("div");
    apiSection.className = "cyberia-settings-section";

    const apiSectionTitle = document.createElement("div");
    apiSectionTitle.className = "cyberia-settings-section-title";
    apiSectionTitle.textContent = "API Configuration";
    apiSection.appendChild(apiSectionTitle);

    const apiListContainer = document.createElement("div");
    apiListContainer.className = "cyberia-api-list";
    apiSection.appendChild(apiListContainer);

    // Initialize accelaInput (will be set if on Windows)
    let accelaInput = null;

    const addApiBtn = document.createElement("a");
    addApiBtn.className = "cyberia-add-btn";
    addApiBtn.href = "#";
    addApiBtn.innerHTML = `<span>Add API</span>`;
    addApiBtn.onclick = function (e) {
      e.preventDefault();
      addApiFieldset(apiListContainer);
    };
    apiSection.appendChild(addApiBtn);

    body.appendChild(apiSection);

    // ACCELA Location Section (Windows only)
    if (isWindowsPlatform()) {
      const accelaSection = document.createElement("div");
      accelaSection.className = "cyberia-settings-section";

      const accelaSectionTitle = document.createElement("div");
      accelaSectionTitle.className = "cyberia-settings-section-title";
      accelaSectionTitle.textContent = "ACCELA Configuration";
      accelaSection.appendChild(accelaSectionTitle);

      // Add help text
      const helpText = document.createElement("div");
      helpText.style.cssText =
        "color:#999;font-size:12px;margin-bottom:10px;font-family:TrixieCyrG;";
      helpText.textContent = "Provide the path to your ACCELA executable.";
      accelaSection.appendChild(helpText);

      const accelaFormGroup = document.createElement("div");
      accelaFormGroup.className = "cyberia-form-group";

      const accelaLabel = document.createElement("label");
      accelaLabel.className = "cyberia-form-label";
      accelaLabel.textContent = "ACCELA Path (Windows Only)";
      accelaFormGroup.appendChild(accelaLabel);

      accelaInput = document.createElement("input");
      accelaInput.type = "text";
      accelaInput.className = "cyberia-form-input";
      accelaInput.placeholder = "Path to ACCELA.exe (Windows only)";
      accelaFormGroup.appendChild(accelaInput);

      accelaSection.appendChild(accelaFormGroup);
      body.appendChild(accelaSection);
    }

    modal.appendChild(body);

    // Button row
    const btnRow = document.createElement("div");
    btnRow.style.cssText =
      "margin-top:20px;display:flex;gap:8px;justify-content:flex-end;";

    const cancelBtn = document.createElement("a");
    cancelBtn.className = "btnv6_blue_hoverfade btn_medium cyberia-cancel-btn";
    cancelBtn.innerHTML = `<span>Cancel</span>`;
    cancelBtn.href = "#";
    cancelBtn.onclick = function (e) {
      e.preventDefault();
      overlay.remove();
    };

    const saveBtn = document.createElement("a");
    saveBtn.className = "cyberia-save-btn";
    saveBtn.innerHTML = `<span>Save</span>`;
    saveBtn.href = "#";
    saveBtn.onclick = function (e) {
      e.preventDefault();
      saveSettings(overlay, apiListContainer, accelaInput, saveBtn);
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    modal.appendChild(btnRow);

    // Add to document
    document.body.appendChild(overlay);

    // Load current settings
    loadCurrentSettings(apiListContainer, accelaInput);

    return overlay;
  }

  // Helper function to add API fieldset
  function addApiFieldset(container, apiData) {
    const apiItem = document.createElement("div");
    apiItem.className = "cyberia-api-item";

    // Name field
    const nameGroup = document.createElement("div");
    nameGroup.className = "cyberia-form-group";
    const nameLabel = document.createElement("label");
    nameLabel.className = "cyberia-form-label";
    nameLabel.textContent = "Name";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "cyberia-form-input";
    nameInput.placeholder = "API Name";
    if (apiData && apiData.name) nameInput.value = apiData.name;
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    apiItem.appendChild(nameGroup);

    // URL field
    const urlGroup = document.createElement("div");
    urlGroup.className = "cyberia-form-group";
    const urlLabel = document.createElement("label");
    urlLabel.className = "cyberia-form-label";
    urlLabel.textContent = "URL";
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.className = "cyberia-form-input";
    urlInput.placeholder = "https://api.example.com/manifest/<appid>";
    if (apiData && apiData.url) urlInput.value = apiData.url;
    urlGroup.appendChild(urlLabel);
    urlGroup.appendChild(urlInput);
    apiItem.appendChild(urlGroup);

    // API Key field
    const keyGroup = document.createElement("div");
    keyGroup.className = "cyberia-form-group";
    const keyLabel = document.createElement("label");
    keyLabel.className = "cyberia-form-label";
    keyLabel.textContent = "API Key";
    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.className = "cyberia-form-input";
    keyInput.placeholder = "API Key";
    if (apiData && apiData.api_key) keyInput.value = apiData.api_key;
    keyGroup.appendChild(keyLabel);
    keyGroup.appendChild(keyInput);
    apiItem.appendChild(keyGroup);

    // Enabled checkbox
    const enabledGroup = document.createElement("div");
    enabledGroup.className = "cyberia-form-group";
    const enabledLabel = document.createElement("label");
    enabledLabel.className = "cyberia-form-label";
    enabledLabel.style.display = "inline";
    const enabledInput = document.createElement("input");
    enabledInput.type = "checkbox";
    enabledInput.className = "cyberia-form-checkbox";
    enabledInput.checked =
      apiData && typeof apiData.enabled !== "undefined"
        ? apiData.enabled
        : true;
    enabledLabel.appendChild(enabledInput);
    enabledLabel.appendChild(document.createTextNode(" Enabled"));
    enabledGroup.appendChild(enabledLabel);
    apiItem.appendChild(enabledGroup);

    // Actions
    const actions = document.createElement("div");
    actions.className = "cyberia-api-actions";

    const spacer = document.createElement("div");
    actions.appendChild(spacer);

    const deleteBtn = document.createElement("a");
    deleteBtn.className = "cyberia-delete-btn";
    deleteBtn.href = "#";
    deleteBtn.innerHTML = `<span>Delete</span>`;
    deleteBtn.onclick = function (e) {
      e.preventDefault();
      apiItem.remove();
    };
    actions.appendChild(deleteBtn);

    apiItem.appendChild(actions);

    container.appendChild(apiItem);
  }

  // Helper function to detect Windows platform
  function isWindowsPlatform() {
    const platform = navigator.platform || navigator.userAgent;
    return platform.indexOf("Win") > -1;
  }

  // Helper function to load current settings
  function loadCurrentSettings(apiListContainer, accelaInput) {
    try {
      Millennium.callServerMethod("cyberia", "GetSettings", {})
        .then((response) => {
          try {
            const data = JSON.parse(response);
            if (data.success && data.settings) {
              const settings = data.settings;

              // Clear existing APIs first
              apiListContainer.innerHTML = "";

              // Load APIs
              if (settings.api_list && Array.isArray(settings.api_list)) {
                settings.api_list.forEach((apiData) => {
                  addApiFieldset(apiListContainer, apiData);
                });
              }

              // Load ACCELA path (only if on Windows)
              if (accelaInput && settings.accela_location) {
                accelaInput.value = settings.accela_location;
              }
            } else {
              backendLog(
                "Failed to load settings: " + (data.error || "Unknown error"),
              );
            }
          } catch (err) {
            backendLog("Error parsing settings response: " + err);
          }
        })
        .catch((err) => {
          backendLog("Error loading settings: " + err);
        });
    } catch (err) {
      backendLog("Error loading settings: " + err);
    }
  }

  // Helper function to save settings
  function saveSettings(overlay, apiListContainer, accelaInput, saveBtn) {
    try {
      // Disable save button and show saving state
      saveBtn.setAttribute("data-disabled", "1");
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = "<span>Saving...</span>";

      // Collect API data
      const apiList = [];
      const apiItems = apiListContainer.querySelectorAll(".cyberia-api-item");
      apiItems.forEach((item) => {
        const name = item.querySelector('input[type="text"]').value.trim();
        const url = item.querySelectorAll('input[type="text"]')[1].value.trim();
        const keyInput = item.querySelectorAll('input[type="text"]')[2];
        const api_key = keyInput ? keyInput.value.trim() : "";
        const enabledCheckbox = item.querySelector('input[type="checkbox"]');
        const enabled = enabledCheckbox ? enabledCheckbox.checked : true;

        if (name && url) {
          apiList.push({
            name: name,
            url: url,
            api_key: api_key,
            enabled: enabled,
          });
        }
      });

      // Collect ACCELA location (only if on Windows)
      const accela_location = accelaInput ? accelaInput.value.trim() : "";

      // Create settings object
      const settings = {
        api_list: apiList,
        accela_location: accela_location,
      };

      // Save to backend using Promise-style
      Millennium.callServerMethod("cyberia", "SaveSettings", {
        settings_json: JSON.stringify(settings),
      })
        .then((response) => {
          try {
            const data = JSON.parse(response);
            if (data.success) {
              backendLog("Settings saved successfully");

              // Show success feedback
              saveBtn.innerHTML = "<span>✓ Saved!</span>";
              saveBtn.style.background = "#28a745";

              // Close modal after delay
              setTimeout(() => {
                overlay.remove();
              }, 2000);
            } else {
              throw new Error(data.error || "Unknown error");
            }
          } catch (err) {
            backendLog("Error parsing save response: " + err);
            showSaveError(saveBtn, originalText, "Error parsing save response");
          }
        })
        .catch((err) => {
          backendLog("Error saving settings: " + err);
          showSaveError(saveBtn, originalText, "Error saving settings");
        });
    } catch (err) {
      backendLog("Error saving settings: " + err);
      showSaveError(saveBtn, "<span>Save</span>", "Error saving settings");
    }
  }

  // Helper function to show save error and re-enable button
  function showSaveError(saveBtn, originalText, errorMessage) {
    saveBtn.removeAttribute("data-disabled");
    saveBtn.innerHTML = originalText;
    saveBtn.style.background = "";
    alert(errorMessage);
  }

  // Function to add the Cyberia button to Steam pages
  function addCyberiaButton() {
    // Ensure styles are loaded before creating the button
    ensureCyberiaStyles();

    // Look for the SteamDB buttons container
    const steamdbContainer =
      document.querySelector(".steamdb-buttons") ||
      document.querySelector("[data-steamdb-buttons]") ||
      document.querySelector(".apphub_OtherSiteInfo");

    if (steamdbContainer) {
      // Update existing buttons (even if not a page change)
      const existingBtn = document.querySelector(".cyberia-button");
      if (existingBtn) {
        const addViaText = "Enter Cyberia";
        existingBtn.title = addViaText;
        existingBtn.setAttribute("data-tooltip-text", addViaText);
        const span = existingBtn.querySelector("span");
        if (span) {
          span.textContent = addViaText;
        }
      }

      // Check if button already exists to avoid duplicates
      if (existingBtn || window.__CyberiaButtonInserted) {
        if (!logState.existsOnce) {
          backendLog("Cyberia button already exists, skipping");
          logState.existsOnce = true;
        }
        return;
      }

      // Create the Cyberia button modeled after existing SteamDB/PCGW buttons
      let referenceBtn = steamdbContainer.querySelector("a");
      const cyberiaButton = document.createElement("a");
      cyberiaButton.href = "#";
      // Copy classes from an existing button to match look-and-feel, but set our own label
      if (referenceBtn && referenceBtn.className) {
        cyberiaButton.className = referenceBtn.className + " cyberia-button";
      } else {
        cyberiaButton.className =
          "btnv6_blue_hoverfade btn_medium cyberia-button";
      }
      const span = document.createElement("span");
      const addViaText = "Enter Cyberia";
      span.textContent = addViaText;
      cyberiaButton.appendChild(span);
      // Tooltip/title
      cyberiaButton.title = addViaText;
      cyberiaButton.setAttribute("data-tooltip-text", addViaText);
      // Normalize margins to match native buttons
      try {
        if (referenceBtn) {
          const cs = window.getComputedStyle(referenceBtn);
          // Only set right margin if needed, preserve CSS margin-left
          if (cs.marginRight && cs.marginRight !== "0px") {
            cyberiaButton.style.marginRight = cs.marginRight;
          }
        }
      } catch (_) {}

      // Local click handler suppressed; delegated handler manages actions
      cyberiaButton.addEventListener("click", (e) => {
        e.preventDefault();
        backendLog("Cyberia button clicked (delegated handler will process)");
      });

      // Store current appid for later use
      try {
        const match =
          window.location.href.match(
            /https:\/\/store\.steampowered\.com\/app\/(\d+)/,
          ) ||
          window.location.href.match(
            /https:\/\/steamcommunity\.com\/app\/(\d+)/,
          );
        const appid = match ? parseInt(match[1], 10) : NaN;
        if (!isNaN(appid)) {
          window.__CyberiaCurrentAppId = appid;
        }
      } catch (_) {}

      // Insert button
      if (referenceBtn && referenceBtn.after) {
        referenceBtn.after(cyberiaButton);
      } else {
        steamdbContainer.appendChild(cyberiaButton);
      }

      // Create Settings button next to Cyberia button
      const settingsButton = document.createElement("a");
      settingsButton.href = "#";
      settingsButton.className =
        "btnv6_blue_hoverfade btn_medium cyberia-button";
      const settingsSpan = document.createElement("span");
      const settingsText = "Settings";
      settingsSpan.textContent = settingsText;
      settingsButton.appendChild(settingsSpan);
      settingsButton.title = settingsText;
      settingsButton.setAttribute("data-tooltip-text", settingsText);
      settingsButton.style.marginLeft = "6px";

      // Local click handler suppressed; delegated handler manages actions
      settingsButton.addEventListener("click", (e) => {
        e.preventDefault();
        backendLog("Settings button clicked (delegated handler will process)");
      });

      // Insert settings button after cyberia button
      cyberiaButton.after(settingsButton);

      window.__CyberiaButtonInserted = true;
      backendLog("Cyberia button inserted");
    } else {
      if (!logState.missingOnce) {
        backendLog("Cyberia:steamdbContainer not found on this page");
        logState.missingOnce = true;
      }
    }
  }

  // Try to add the button immediately if DOM is ready
  function onFrontendReady() {
    addCyberiaButton();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onFrontendReady);
  } else {
    onFrontendReady();
  }

  // Delegate click handling to support dynamic DOM updates
  document.addEventListener(
    "click",
    (evt) => {
      const anchor =
        evt.target &&
        (evt.target.closest ? evt.target.closest(".cyberia-button") : null);
      if (anchor) {
        evt.preventDefault();

        // Check if this is the settings button (it should be the second button)
        const settingsBtn = anchor;
        const cyberiaBtn = document.querySelector(".cyberia-button");

        // Check if clicked button is the settings button by comparing with the second button
        // The settings button is added after cyberia button, so we check if there are multiple buttons
        const allCyberiaBtns = document.querySelectorAll(".cyberia-button");
        if (allCyberiaBtns.length > 1 && anchor === allCyberiaBtns[1]) {
          // This is the settings button
          backendLog("Settings button clicked");
          showSettingsPopup();
          return;
        }

        // This is the main Cyberia button (Enter Cyberia)
        backendLog("Cyberia delegated click");
        // Use the same loading modal on delegated clicks
        if (!document.querySelector(".cyberia-overlay")) {
          showTestPopup();
        }
        try {
          const match =
            window.location.href.match(
              /https:\/\/store\.steampowered\.com\/app\/(\d+)/,
            ) ||
            window.location.href.match(
              /https:\/\/steamcommunity\.com\/app\/(\d+)/,
            );
          const appid = match ? parseInt(match[1], 10) : NaN;
          if (
            !isNaN(appid) &&
            typeof Millennium !== "undefined" &&
            typeof Millennium.callServerMethod === "function"
          ) {
            if (runState.inProgress && runState.appid === appid) {
              backendLog(
                "Cyberia:operation already in progress for this appid",
              );
              return;
            }
            runState.inProgress = true;
            runState.appid = appid;
            Millennium.callServerMethod("cyberia", "StartAddViaCyberia", {
              appid,
              contentScriptQuery: "",
            });
            startPolling(appid);
          }
        } catch (_) {}
      }
    },
    true,
  );

  // Poll backend for operation progress and update UI
  function startPolling(appid) {
    let done = false;
    const timer = setInterval(() => {
      if (done) {
        clearInterval(timer);
        return;
      }
      try {
        Millennium.callServerMethod("cyberia", "GetAddViaCyberiaStatus", {
          appid,
          contentScriptQuery: "",
        }).then((res) => {
          try {
            const payload = typeof res === "string" ? JSON.parse(res) : res;
            const st = payload && payload.state ? payload.state : {};

            // Try to find overlay (may or may not be visible)
            const overlay = document.querySelector(".cyberia-overlay");
            const title = overlay
              ? overlay.querySelector(".cyberia-title")
              : null;
            const status = overlay
              ? overlay.querySelector(".cyberia-status")
              : null;
            const wrap = overlay
              ? overlay.querySelector(".cyberia-progress-wrap")
              : null;
            const percent = overlay
              ? overlay.querySelector(".cyberia-percent")
              : null;
            const bar = overlay
              ? overlay.querySelector(".cyberia-progress-bar")
              : null;

            // Update UI if overlay is present
            if (st.currentApi && title)
              title.textContent = "I feel accelerated.".replace(
                "{api}",
                st.currentApi,
              );
            if (status) {
              if (st.status === "checking")
                status.textContent = "Checking availability at {api}…".replace(
                  "{api}",
                  st.currentApi,
                );
              if (st.status === "downloading")
                status.textContent = "Downloading…";
              if (st.status === "processing")
                status.textContent = "Processing package…";
              if (st.status === "installing")
                status.textContent = "Installing…";
              if (st.status === "done") status.textContent = "Finishing…";
              if (st.status === "failed") status.textContent = "Failed";
            }
            if (st.status === "downloading") {
              // reveal progress UI on first download tick (if overlay visible)
              if (wrap && wrap.style.display === "none")
                wrap.style.display = "block";
              if (percent && percent.style.display === "none")
                percent.style.display = "block";
              const total = st.totalBytes || 0;
              const read = st.bytesRead || 0;
              let pct =
                total > 0 ? Math.floor((read / total) * 100) : read ? 1 : 0;
              if (pct > 100) pct = 100;
              if (pct < 0) pct = 0;
              if (bar) bar.style.width = pct + "%";
              if (percent) percent.textContent = pct + "%";
              // Show Cancel button during download
              const cancelBtn = overlay
                ? overlay.querySelector(".cyberia-cancel-btn")
                : null;
              if (cancelBtn) cancelBtn.style.display = "";
            }
            if (st.status === "done") {
              // Update popup if visible
              if (bar) bar.style.width = "100%";
              if (percent) percent.textContent = "100%";
              if (status)
                status.textContent =
                  "What are you scared of? Just try it for a little bit.";
              // Hide Cancel button and update Hide to Close
              const cancelBtn = overlay
                ? overlay.querySelector(".cyberia-cancel-btn")
                : null;
              if (cancelBtn) cancelBtn.style.display = "none";
              const hideBtn = overlay
                ? overlay.querySelector(".cyberia-hide-btn")
                : null;
              if (hideBtn) hideBtn.innerHTML = "<span>Close</span>";
              // hide progress visuals after a short beat
              if (wrap || percent) {
                setTimeout(() => {
                  if (wrap) wrap.style.display = "none";
                  if (percent) percent.style.display = "none";
                }, 300);
              }
              done = true;
              clearInterval(timer);
              runState.inProgress = false;
              runState.appid = null;
              // remove all Cyberia buttons since game is added (works even if popup is hidden)
              const cyberiaBtns = document.querySelectorAll(".cyberia-button");
              cyberiaBtns.forEach((btn) => {
                if (btn && btn.parentElement) {
                  btn.parentElement.removeChild(btn);
                }
              });
              // reset the insertion flag
              window.__CyberiaButtonInserted = false;
            }
            if (st.status === "failed") {
              // show error in the popup if visible
              if (status)
                status.textContent = "Failed: {error}".replace(
                  "{error}",
                  st.error || "Unknown error",
                );
              // Hide Cancel button and update Hide to Close
              const cancelBtn = overlay
                ? overlay.querySelector(".cyberia-cancel-btn")
                : null;
              if (cancelBtn) cancelBtn.style.display = "none";
              const hideBtn = overlay
                ? overlay.querySelector(".cyberia-hide-btn")
                : null;
              if (hideBtn) hideBtn.innerHTML = "<span>Close</span>";
              if (wrap) wrap.style.display = "none";
              if (percent) percent.style.display = "none";
              done = true;
              clearInterval(timer);
              runState.inProgress = false;
              runState.appid = null;
            }
          } catch (_) {}
        });
      } catch (_) {
        clearInterval(timer);
      }
    }, 300);
  }

  // Also try after delays to catch dynamically loaded content
  setTimeout(addCyberiaButton, 1000);
  setTimeout(addCyberiaButton, 3000);

  // Listen for URL changes (Steam uses pushState/replaceState for navigation)
  let lastUrl = window.location.href;
  const checkUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // URL changed - reset flags and update buttons
      window.__CyberiaButtonInserted = false;
      // Re-add buttons
      addCyberiaButton();
    }
  };
  // Check URL changes periodically and on popstate
  setInterval(checkUrlChange, 500);
  window.addEventListener("popstate", checkUrlChange);

  // Override pushState/replaceState to detect navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = () => {
    originalPushState.apply(history, arguments);
    setTimeout(checkUrlChange, 100);
  };
  history.replaceState = () => {
    originalReplaceState.apply(history, arguments);
    setTimeout(checkUrlChange, 100);
  };

  // Use MutationObserver to catch dynamically added content
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain relevant elements
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === 1) {
              // Element node
              // Only update if the added element or its descendants contain relevant containers
              if (
                node.querySelector &&
                (node.querySelector(".steamdb-buttons") ||
                  node.querySelector("[data-steamdb-buttons]") ||
                  node.querySelector(".apphub_OtherSiteInfo") ||
                  node.matches(
                    ".steamdb-buttons, [data-steamdb-buttons], .apphub_OtherSiteInfo",
                  ))
              ) {
                shouldUpdate = true;
                break;
              }
            }
          }
        }
      });

      if (shouldUpdate) {
        addCyberiaButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
})();
