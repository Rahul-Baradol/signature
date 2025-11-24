import { beginShow, hideScene1, initializeAudioControls, initializeCanvas } from './controller';
import { initWebGLGradient } from './glGradient';
import { pauseIcon } from './html/icons';
import { scene1 } from './html/scene1';
import { scene2 } from './html/scene2';
import { seizureAlert } from './html/seizure-alert';
import { socialLinks } from './html/social-links';
import { terms } from './html/terms';
import { state } from './state';
import './style.css'

function render() {
  const isTermsAccepted = localStorage.getItem('acceptedTerms');
  const isSeizureAlertDismissed = localStorage.getItem('dismissedSeizureAlert');

  if (isTermsAccepted !== "true") {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = terms;

    document.getElementById('acceptButton')!.addEventListener('click', () => {
      localStorage.setItem('acceptedTerms', 'true');
      location.reload();
    });

    return;
  }

  if (isSeizureAlertDismissed !== "true") {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = seizureAlert;

    document.getElementById('handle-dismiss-button')!.addEventListener('click', () => {
      localStorage.setItem('dismissedSeizureAlert', 'true');
      location.reload();
    });

    return;
  }

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = scene1 + socialLinks;

  document.querySelector<HTMLInputElement>("#audioFileInput")!.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      state.setFile(target.files[0]);
      state.setAudio(new Audio(URL.createObjectURL(target.files[0])));

      hideScene1();

      document.querySelector<HTMLDivElement>('#app')!.innerHTML = scene2 + socialLinks;
      
      document.getElementById("playPauseButton")!.innerHTML = pauseIcon;
      initializeCanvas();
      initWebGLGradient();
      initializeAudioControls();
      beginShow();
    }
  });
}

render();