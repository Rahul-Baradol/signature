export function hideScene1() {
  const inputElement = document.getElementById("scene1");
  if (inputElement) {
    inputElement.style.display = "none";
  }
}

// function beginShow() {
//   if (file) {
//     let animationId: number;
//     const audioCtx = new (window.AudioContext || window.AudioContext)();

//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       const arrayBuffer = e.target?.result as ArrayBuffer;

//       // Decode full track
//       const decodedData = await audioCtx.decodeAudioData(arrayBuffer);

//       // Pre-scan using OfflineAudioContext
//       const offlineCtx = new OfflineAudioContext(
//         decodedData.numberOfChannels,
//         decodedData.length,
//         decodedData.sampleRate
//       );
//       const source = offlineCtx.createBufferSource();
//       source.buffer = decodedData;

//       const analyser = offlineCtx.createAnalyser();
//       analyser.fftSize = 512;

//       source.connect(analyser);
//       analyser.connect(offlineCtx.destination);

//       source.start();

//       // --- Now start actual playback ---
//       audio = new Audio(URL.createObjectURL(file!));
//       const liveSource = audioCtx.createMediaElementSource(audio);
//       const liveAnalyser = audioCtx.createAnalyser();
//       liveAnalyser.fftSize = 512;
//       const liveData = new Uint8Array(liveAnalyser.frequencyBinCount);

//       liveSource.connect(liveAnalyser);
//       liveAnalyser.connect(audioCtx.destination);

//       audio.play();
//       setIsPlaying(true);

//       function rmsRange(arr: any, start: number, end: number) {
//         let sumSq = 0;
//         for (let i = Math.floor(start); i < Math.floor(end); i++) {
//           sumSq += arr[i];
//         }
//         return sumSq / (end - start)
//       }

//       function detectBeat() {
//         liveAnalyser.getByteFrequencyData(liveData);

//         const lowCount = Math.floor(liveData.length * 0.5);
//         const midCount = Math.floor(liveData.length * 0.30);

//         const avgLow = rmsRange(liveData, 0, lowCount);
//         const avgMid = rmsRange(liveData, lowCount, lowCount + midCount);
//         const avgHigh = rmsRange(liveData, lowCount + midCount, liveData.length);

//         let eff = Math.max(avgLow, avgMid, avgHigh) / 255;

//         let avg = eff;
//         if (historyOfIntensities.length == 60) {
//           let minIntensity = Math.min(...historyOfIntensities);
//           let maxIntensity = Math.max(...historyOfIntensities);

//           avg = (eff - minIntensity) / (maxIntensity - minIntensity);
//           avg = Math.min(Math.max(avg, 0), 1);
//         }

//         if (avg <= 0.5) {
//           setAmps(
//             Array.from({ length: liveData.length / 4 }, (_, i) =>
//               (liveData[i * 4] + liveData[i * 4 + 1] + liveData[i * 4 + 2] + liveData[i * 4 + 3]) / 4
//             )
//           );
//         } else {
//           setAmps(
//             Array.from({ length: Math.ceil(liveData.length / 3) }, (_, i) => {
//               const start = i * 3;
//               const end = Math.min(start + 3, liveData.length);
//               const sum = liveData.slice(start, end).reduce((acc, val) => acc + val, 0);
//               return sum / (end - start);
//             })
//           );
//         }

//         setBeatIntensity((prev) => {
//           const pushDirection = (avg > prev.current) ? 1 : -1;

//           return {
//             prev: prev.current,
//             current: Math.min((pushDirection * 0.075 * avg) + avg, 1)
//           }
//         });

//         setHistoryOfIntensities((prev) => {
//           const updated = [...prev, eff];
//           if (updated.length > 60) {
//             updated.shift();
//           }
//           return updated;
//         });

//         requestAnimationFrame(detectBeat);
//       };

//       animationId = requestAnimationFrame(detectBeat);
//     };

//     reader.readAsArrayBuffer(file);
//   }
// }