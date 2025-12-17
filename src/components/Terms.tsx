import React from "react";

interface TermsProps {
    isModalVisible: boolean;
    setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setAcceptedTerms: React.Dispatch<React.SetStateAction<boolean>>;
}

const Terms: React.FC<TermsProps> = ({ isModalVisible, setIsModalVisible, setAcceptedTerms }) => {

    const showModal = () => {
        setIsModalVisible(true);
    };

    
    const handleAccept = () => {
        setAcceptedTerms(true);
        localStorage.setItem('acceptedTerms', 'true');
        setIsModalVisible(false);
    };

    return (
        <div>
            <button
                className="text-white px-4 py-2 rounded-lg transition border-2 border-gray-500 hover:border-gray-400"
                onClick={showModal}
            >
                View Terms and Conditions
            </button>
            {isModalVisible  && (
                <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-black p-5 rounded-lg w-4/5 max-w-2xl shadow-lg">
                        <h2 className="text-white text-2xl font-bold">Terms and Conditions</h2>
                        <div className="max-h-96 overflow-y-auto text-white mt-4">
                            <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
                            <p className="mt-2">
                                By accessing or using the <b>timesignature.in</b> website ("Service"),
                                you agree to comply with and be bound by these Terms and
                                Conditions. If you do not agree to these terms, please refrain
                                from using the Service.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">2. User-Uploaded Content</h3>
                            <p className="mt-2">
                                <strong>Ownership and Rights:</strong> You retain ownership of
                                any audio files you upload ("User Content"). By uploading, you
                                affirm that you possess all necessary rights and permissions to
                                use and display the User Content on the Service.
                            </p>
                            <p className="mt-2">
                                <strong>License Grant:</strong> You grant <b>timesignature.in</b> a
                                non-exclusive, royalty-free license to process and visualize
                                your User Content solely for the purpose of providing the
                                visualization features of the Service.
                            </p>
                            <p className="mt-2">
                                <strong>Prohibited Content:</strong> You agree not to upload
                                any User Content that infringes upon the intellectual property
                                rights of others, is unlawful, or violates any applicable laws
                                or regulations.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">3. Usage Restrictions</h3>
                            <p className="mt-2">
                                <strong>Non-Commercial Use:</strong> The Service is intended for
                                personal, non-commercial use only. You agree not to use the
                                Service for any commercial purposes without explicit permission
                                from <b>timesignature.in</b>.
                            </p>
                            <p className="mt-2">
                                <strong>No Storage or Distribution:</strong> <b>timesignature.in</b> does
                                not store or distribute any User Content. All audio processing
                                is temporary and occurs solely within the confines of the
                                visualization process.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">4. Privacy and Data Usage</h3>
                            <p className="mt-2">
                                <strong>Data Collection:</strong> <b>timesignature.in</b> does not collect any
                                personally identifiable information related to your use of
                                the Service to improve functionality and user experience.
                            </p>
                            <p className="mt-2">
                                <strong>No AI Training:</strong> <b>timesignature.in</b> does not use User
                                Content to train artificial intelligence models or for any other
                                machine learning purposes.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">5. Limitation of Liability</h3>
                            <p className="mt-2">
                                <b>timesignature.in</b> provides the Service "as is" and makes no
                                representations or warranties of any kind, express or implied,
                                regarding the operation or availability of the Service. &nbsp;
                                <b>timesignature.in</b> shall not be liable for any damages arising from
                                the use or inability to use the Service.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">6. Indemnification</h3>
                            <p className="mt-2">
                                You agree to indemnify and hold harmless <b>timesignature.in</b>, its
                                affiliates, and its owners from any claims, damages,
                                liabilities, and expenses arising from your use of the Service
                                or violation of these Terms and Conditions.
                            </p>
                            <h3 className="text-lg font-semibold mt-4">7. Modifications to Terms</h3>
                            <p className="mt-2">
                                <b>timesignature.in</b> reserves the right to modify these Terms and
                                Conditions at any time. Any changes will be posted on this page
                                with an updated effective date. Continued use of the Service
                                after such modifications constitutes your acceptance of the new
                                terms.
                            </p>
                        </div>
                        <div className="flex justify-end mt-5">
                            <button
                                className="text-white px-4 py-2 rounded transition"
                                onClick={handleAccept}
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Terms;