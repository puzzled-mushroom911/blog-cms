import { useRef, useState } from 'react';
import { PlayCircle } from 'lucide-react';

export default function VideoClip({ src, title, caption, duration, poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.play();
    setPlaying(true);
  }

  return (
    <figure className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
      <div className="relative bg-slate-950 aspect-video">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          className="w-full h-full object-contain"
        />
        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/20 hover:bg-slate-950/30 transition-colors group"
            aria-label={`Play ${title}`}
          >
            <div className="flex flex-col items-center gap-2">
              <PlayCircle className="w-14 h-14 text-white/90 group-hover:text-white drop-shadow-lg transition-colors" strokeWidth={1.5} />
              {duration && (
                <span className="text-xs font-medium text-white/90 bg-slate-950/50 px-2 py-0.5 rounded-full">
                  {duration}
                </span>
              )}
            </div>
          </button>
        )}
      </div>
      {(title || caption) && (
        <figcaption className="px-5 py-3 border-t border-slate-100">
          {title && <p className="text-sm font-semibold text-slate-800">{title}</p>}
          {caption && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{caption}</p>}
        </figcaption>
      )}
    </figure>
  );
}
