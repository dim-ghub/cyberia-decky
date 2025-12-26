import * as React from "react";
import { definePlugin } from "@decky/ui";

interface ServerAPI {
  callPluginMethod: (method: string, args: any) => Promise<{ result: string }>;
}
import { useEffect, useState } from "react";

// Content for the main cyberia functionality
function CyberiaContent({ serverAPI }: { serverAPI: ServerAPI }) {
  const [appStore, setAppStore] = useState<any>(null);
  const [currentAppId, setCurrentAppId] = useState<number | null>(null);
  const [isInProgress, setIsInProgress] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Backend logger
  const backendLog = async (message: string) => {
    try {
      await serverAPI.callPluginMethod("log", { message });
    } catch (err) {
      console.warn("[Cyberia] backendLog failed", err);
    }
  };

  useEffect(() => {
    backendLog("Cyberia Decky frontend loaded");
    
    // Get app store when component mounts
    const getAppStore = async () => {
      try {
        const store = await (window as any).DeckyPluginLoader?.routerManager?.getRouter()?.appStore;
        setAppStore(store);
      } catch (err) {
        backendLog("Failed to get app store: " + err);
      }
    };
    
    getAppStore();
  }, []);

  useEffect(() => {
    if (!appStore) return;

    const handleRouteChange = () => {
      const currentApp = appStore?.currentApp;
      if (currentApp) {
        setCurrentAppId(currentApp.appid);
        backendLog(`Current app ID: ${currentApp.appid}`);
      }
    };

    // Listen for route changes
    handleRouteChange();
    appStore.addChangeListener(handleRouteChange);

    return () => {
      appStore.removeChangeListener(handleRouteChange);
    };
  }, [appStore]);

  const startAddViaCyberia = async (appid: number) => {
    if (isInProgress) return;
    
    setIsInProgress(true);
    try {
      const response = await serverAPI.callPluginMethod("start_add_via_cyberia", { appid });
      const data = JSON.parse(response.result || "{}");
      
      if (data.success) {
        backendLog(`Started download for app ${appid}`);
      } else {
        backendLog(`Failed to start download: ${data.error}`);
      }
    } catch (err) {
      backendLog("Error starting download: " + err);
    }
  };

  const getAddStatus = async (appid: number) => {
    try {
      const response = await serverAPI.callPluginMethod("get_add_status", { appid });
      const data = JSON.parse(response.result || "{}");
      setDownloadStatus(data);
    } catch (err) {
      backendLog("Error getting status: " + err);
    }
  };

  const cancelAddViaCyberia = async (appid: number) => {
    try {
      const response = await serverAPI.callPluginMethod("cancel_add_via_cyberia", { appid });
      const data = JSON.parse(response.result || "{}");
      
      if (data.success) {
        setIsInProgress(false);
        setDownloadStatus(null);
      }
    } catch (err) {
      backendLog("Error canceling download: " + err);
    }
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const loadSettings = async () => {
    try {
      const response = await serverAPI.callPluginMethod("get_settings", {});
      const data = JSON.parse(response.result || "{}");
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (err) {
      backendLog("Error loading settings: " + err);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const response = await serverAPI.callPluginMethod("save_settings", { 
        settings_json: JSON.stringify(newSettings) 
      });
      const data = JSON.parse(response.result || "{}");
      
      if (data.success) {
        setSettings(newSettings);
        backendLog("Settings saved successfully");
      }
    } catch (err) {
      backendLog("Error saving settings: " + err);
    }
  };

  useEffect(() => {
    if (showSettings && !settings) {
      loadSettings();
    }
  }, [showSettings]);

  // Poll for download status when in progress
  useEffect(() => {
    if (!isInProgress || !currentAppId) return;

    const interval = setInterval(() => {
      getAddStatus(currentAppId);
    }, 1000);

    return () => clearInterval(interval);
  }, [isInProgress, currentAppId]);

  // Check if operation is complete
  useEffect(() => {
    if (downloadStatus && (downloadStatus.complete || downloadStatus.error)) {
      setIsInProgress(false);
    }
  }, [downloadStatus]);

  if (!currentAppId) {
    return null; // Don't render if not on an app page
  }

  return (
    <div className="cyberia-container">
      <style>{`
        .cyberia-container {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .cyberia-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .cyberia-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .cyberia-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cyberia-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .cyberia-modal-content {
          background: #2a2a2a;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          color: white;
        }
        .cyberia-progress-bar {
          width: 100%;
          height: 8px;
          background: #3a3a3a;
          border-radius: 4px;
          overflow: hidden;
          margin: 16px 0;
        }
        .cyberia-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }
        .cyberia-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .cyberia-form-group {
          margin-bottom: 16px;
        }
        .cyberia-form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        .cyberia-form-group input,
        .cyberia-form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          background: #1a1a1a;
          color: white;
        }
        .cyberia-api-list {
          max-height: 200px;
          overflow-y: auto;
        }
        .cyberia-api-item {
          background: #3a3a3a;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .cyberia-button-secondary {
          background: #555;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 8px;
        }
      `}</style>

      <button
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
        }}
        onClick={() => startAddViaCyberia(currentAppId)}
        disabled={isInProgress}
      >
        ↓ Enter Cyberia
      </button>

      <button
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
        }}
        onClick={openSettings}
      >
        ⚙ Settings
      </button>

      {/* Download Progress Modal */}
      {isInProgress && downloadStatus && (
        <div className="cyberia-modal">
          <div className="cyberia-modal-content">
            <div className="cyberia-header">
              <h3>Cyberia Download Progress</h3>
              <button
                style={{
                  background: '#555',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => cancelAddViaCyberia(currentAppId)}
              >
                ✕
              </button>
            </div>
            
            <p>Status: {downloadStatus.status || 'In progress...'}</p>
            
            {downloadStatus.progress !== undefined && (
              <div className="cyberia-progress-bar">
                <div 
                  className="cyberia-progress-fill"
                  style={{ width: `${downloadStatus.progress}%` }}
                />
              </div>
            )}
            
            {downloadStatus.message && (
              <p>{downloadStatus.message}</p>
            )}
            
            {downloadStatus.error && (
              <p style={{ color: '#ff6b6b' }}>Error: {downloadStatus.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="cyberia-modal">
          <div className="cyberia-modal-content">
            <div className="cyberia-header">
              <h3>Cyberia Settings</h3>
              <button
                style={{
                  background: '#555',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={closeSettings}
              >
                ✕
              </button>
            </div>

            {settings ? (
              <div>
                <div className="cyberia-form-group">
                  <label>ACCELA Location</label>
                  <input
                    type="text"
                    value={settings.accela_location || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      accela_location: e.target.value
                    })}
                    placeholder="Path to ACCELA executable"
                  />
                </div>

                <div className="cyberia-form-group">
                  <label>API Endpoints</label>
                  <div className="cyberia-api-list">
                    {settings.api_list?.map((api: any, index: number) => (
                      <div key={index} className="cyberia-api-item">
                        <input
                          type="text"
                          value={api.name || ''}
                          onChange={(e) => {
                            const newApiList = [...settings.api_list];
                            newApiList[index].name = e.target.value;
                            setSettings({ ...settings, api_list: newApiList });
                          }}
                          placeholder="API Name"
                        />
                        <input
                          type="text"
                          value={api.url || ''}
                          onChange={(e) => {
                            const newApiList = [...settings.api_list];
                            newApiList[index].url = e.target.value;
                            setSettings({ ...settings, api_list: newApiList });
                          }}
                          placeholder="API URL"
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={api.enabled || false}
                            onChange={(e) => {
                              const newApiList = [...settings.api_list];
                              newApiList[index].enabled = e.target.checked;
                              setSettings({ ...settings, api_list: newApiList });
                            }}
                          />
                          Enabled
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => saveSettings(settings)}
                >
                  Save Settings
                </button>
              </div>
            ) : (
              <p>Loading settings...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default definePlugin({
  name: "Cyberia",
  content: ({ serverAPI }) => <CyberiaContent serverAPI={serverAPI} />,
  onDismount() {
    // Cleanup if needed
  }
});