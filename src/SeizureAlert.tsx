import React, { useState } from 'react';

const SeizureAlert: React.FC = () => {
    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        open ? (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-25" >
                <div className="bg-white p-3 rounded-lg shadow-lg max-w-md text-center">
                    <h2 id="seizure-alert-title" className="text-2xl text-black font-bold mb-2">
                        Seizure Alert
                    </h2>
                    <p id="seizure-alert-description" className="text-gray-700 mb-2">
                        This visualizer may contain high brightness levels or flashing lights that could trigger seizures in individuals with photosensitive epilepsy. If you are sensitive to such stimuli, please proceed with caution.
                    </p>
                    <button
                        onClick={handleClose}
                        className="mt-4 px-4 py-2 text-white rounded focus:outline-none"
                    >
                        Dismiss
                    </button>
                </div>
            </div >
        ) : <></>
    );
};

export default SeizureAlert;
