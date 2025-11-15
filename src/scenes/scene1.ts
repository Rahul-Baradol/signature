export let scene1 = `
    <style>
        #app {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
        }

        #scene1 {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        #scene1 label {
            cursor: pointer;
            color: white;
            font-size: 30px;
            padding: 0.75rem 1.5rem;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: row-reverse;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            border: 2px solid gray;
            border-radius: 0.5rem;
        }
    </style>

    <div id="app">
        <div id="scene1">
            <label>
                <div style="font-size: 15px;"> Upload MP3 ( to visualize ) </div>
                <input
                    id="audioFileInput"
                    type="file"
                    accept="audio/mpeg, audio/mp3, .mp3"
                    style="display: none;"
                />
            </label>
        </div>
    </div>
`;