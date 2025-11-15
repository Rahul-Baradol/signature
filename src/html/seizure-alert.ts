export const seizureAlert = `
    <div style="position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background-color: rgba(0, 0, 0, 0.4); z-index: 25;">
        <div style="background-color: white; padding: 12px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 400px; text-align: center;">
            <h2 id="seizure-alert-title" style="font-size: 1.5rem; color: black; font-weight: bold; margin-bottom: 8px;">
                Seizure Alert
            </h2>
            <p id="seizure-alert-description" style="color: #4a5568; margin-bottom: 8px;">
                This visualizer may contain high brightness levels or flashing lights that could trigger seizures in individuals with photosensitive epilepsy. If you are sensitive to such stimuli, please proceed with caution.
            </p>
            <button
                id="handle-dismiss-button"
                style="font-size: 15px; margin-top: 16px; padding: 14px 30px; color: white; border-radius: 10px; background-color: black; border: none; cursor: pointer; outline: none;"
            >
                Dismiss
            </button>
        </div>
    </div>
`;