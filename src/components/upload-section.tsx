import { MdOutlineFileUpload } from "react-icons/md";

export const UploadSection = ({ onFileSelect }: { onFileSelect: (f: File) => void }) => (
  <label className="cursor-pointer text-white text-[30px] px-6 py-3 flex flex-row-reverse items-center justify-center gap-2 border-2 border-gray-400 rounded-lg hover:bg-white/10 transition-colors">
    <div className="text-[15px]">Upload MP3 ( to visualize )</div>
    <MdOutlineFileUpload />
    <input
      type="file"
      accept="audio/mpeg, audio/mp3, .mp3"
      className="hidden"
      onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
    />
  </label>
);