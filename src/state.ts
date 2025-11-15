export let file: File | null = null;
export let audio = null;

export function setFile(file: File) {
  file = file;
}

export function setAudio(audio: HTMLAudioElement) {
  audio = audio;
}

export function getFile() {
  return file;
}

export function getAudio() {
  return audio;
}