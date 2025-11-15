import { beginShow, hideScene1, initializeAudioControls, initializeCanvas } from './controller';
import { scene1 } from './scenes/scene1';
import { scene2 } from './scenes/scene2';
import { socialLinks } from './scenes/social-links';
import { state } from './state';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = scene1 + socialLinks;

document.querySelector<HTMLInputElement>("#audioFileInput")!.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    state.setFile(target.files[0]);
    state.setAudio(new Audio(URL.createObjectURL(target.files[0])));
    
    hideScene1();
    
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = scene2 + socialLinks;

    initializeCanvas();
    initializeAudioControls();
    beginShow();
  }
});