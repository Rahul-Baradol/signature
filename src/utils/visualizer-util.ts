export const getMusicTransform = (intensity: number) => {
  const multiplier = 10;
  const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);

  const scale = 1 + (alpha * 2.5);
  const skewY = (alpha * -10);
  const skewX = (alpha * 5);

  return `scale(${scale}) skewY(${skewY}deg) skewX(${skewX}deg)`;
};

export const getBackgroundGradient = (amps: number[]) => {
  if (!amps || amps.length === 0) return "";

  let backgroundColorString = "radial-gradient(circle at center,";
  
  amps.forEach((amp, index) => {
    const intensity = amp / 255;
    
    const r = Math.round(140 * intensity);
    const g = Math.round(100 * intensity);
    const b = 255;

    const multiplier = 10;
    const alpha = Math.log(1 + (multiplier * intensity)) / Math.log(1 + multiplier);
    
    const position = Math.round((index / amps.length) * 140);
    
    backgroundColorString += ` rgba(${r}, ${g}, ${b}, ${alpha}) ${position}%,`;
  });

  backgroundColorString += " rgba(0, 0, 0, 0) 140%)";
  
  return backgroundColorString;
};