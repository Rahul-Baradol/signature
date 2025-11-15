import { hideScene1 } from './controller';
import { scene1 } from './scenes/scene1';
import { setAudio, setFile } from './state';
import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = scene1;

document.querySelector<HTMLInputElement>("#audioFileInput")!.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    setFile(target.files[0])
    setAudio(new Audio(URL.createObjectURL(target.files[0])));
    hideScene1();
  }
});