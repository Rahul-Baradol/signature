export const terms = `
    <style>
        .container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-container {
            background: black;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-align: center;
        }
        .modal-content {
            margin-bottom: 1.5rem;
            overflow-y: scroll;
            height: 65vh;
        }
        .section-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
        }
        .section-paragraph {
            font-size: 1rem;
            line-height: 1.5;
            margin-bottom: 1rem;
        }
        .modal-footer {
            display: flex;
            justify-content: center;
        }
        .accept-button {
            margin-left: auto;
            background-color: rgb(26, 26, 26);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: border 0.5s;
            border: 1.5px solid transparent;
        }
        .accept-button:hover {
            border: 1.5px solid gray;
        }
    </style>
    <div class="container">
        <div class="modal-overlay">
            <div class="modal-container">
                <h2 class="modal-title">Terms and Conditions</h2>
                <div class="modal-content">
                    <h3 class="section-title">1. Acceptance of Terms</h3>
                    <p class="section-paragraph">
                        By accessing or using the <b>timesignature.in</b> website ("Service"),
                        you agree to comply with and be bound by these Terms and
                        Conditions. If you do not agree to these terms, please refrain
                        from using the Service.
                    </p>
                    <h3 class="section-title">2. User-Uploaded Content</h3>
                    <p class="section-paragraph">
                        <strong>Ownership and Rights:</strong> You retain ownership of
                        any audio files you upload ("User Content"). By uploading, you
                        affirm that you possess all necessary rights and permissions to
                        use and display the User Content on the Service.
                    </p>
                    <p class="section-paragraph">
                        <strong>License Grant:</strong> You grant <b>timesignature.in</b> a
                        non-exclusive, royalty-free license to process and visualize
                        your User Content solely for the purpose of providing the
                        visualization features of the Service.
                    </p>
                    <p class="section-paragraph">
                        <strong>Prohibited Content:</strong> You agree not to upload
                        any User Content that infringes upon the intellectual property
                        rights of others, is unlawful, or violates any applicable laws
                        or regulations.
                    </p>
                    <h3 class="section-title">3. Usage Restrictions</h3>
                    <p class="section-paragraph">
                        <strong>Non-Commercial Use:</strong> The Service is intended for
                        personal, non-commercial use only. You agree not to use the
                        Service for any commercial purposes without explicit permission
                        from <b>timesignature.in</b>.
                    </p>
                    <p class="section-paragraph">
                        <strong>No Storage or Distribution:</strong> <b>timesignature.in</b> does
                        not store or distribute any User Content. All audio processing
                        is temporary and occurs solely within the confines of the
                        visualization process.
                    </p>
                    <h3 class="section-title">4. Privacy and Data Usage</h3>
                    <p class="section-paragraph">
                        <strong>Data Collection:</strong> <b>timesignature.in</b> does not collect any
                        personally identifiable information related to your use of
                        the Service to improve functionality and user experience.
                    </p>
                    <p class="section-paragraph">
                        <strong>No AI Training:</strong> <b>timesignature.in</b> does not use User
                        Content to train artificial intelligence models or for any other
                        machine learning purposes.
                    </p>
                    <h3 class="section-title">5. Limitation of Liability</h3>
                    <p class="section-paragraph">
                        <b>timesignature.in</b> provides the Service "as is" and makes no
                        representations or warranties of any kind, express or implied,
                        regarding the operation or availability of the Service. &nbsp;
                        <b>timesignature.in</b> shall not be liable for any damages arising from
                        the use or inability to use the Service.
                    </p>
                    <h3 class="section-title">6. Indemnification</h3>
                    <p class="section-paragraph">
                        You agree to indemnify and hold harmless <b>timesignature.in</b>, its
                        affiliates, and its owners from any claims, damages,
                        liabilities, and expenses arising from your use of the Service
                        or violation of these Terms and Conditions.
                    </p>
                    <h3 class="section-title">7. Modifications to Terms</h3>
                    <p class="section-paragraph">
                        <b>timesignature.in</b> reserves the right to modify these Terms and
                        Conditions at any time. Any changes will be posted on this page
                        with an updated effective date. Continued use of the Service
                        after such modifications constitutes your acceptance of the new
                        terms.
                    </p>
                </div>
                <div class="modal-footer">
                    <button id="acceptButton" class="accept-button">
                        Accept
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
