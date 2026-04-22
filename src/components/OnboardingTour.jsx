import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ONBOARDING_SLIDES } from './onboarding-slides';

const STORAGE_KEY = 'cms_onboarding_completed_v1';

export function hasCompletedOnboarding() {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // localStorage disabled — silently ignore; user will just see the tour again.
  }
}

export default function OnboardingTour({ open, onOpenChange }) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef(null);

  const slide = ONBOARDING_SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {
      // Autoplay can be blocked until user interacts — that's fine, controls are visible.
    });
  }, [index]);

  function handleSkip() {
    markOnboardingComplete();
    onOpenChange(false);
  }

  function handleFinish() {
    markOnboardingComplete();
    onOpenChange(false);
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
      return;
    }
    setIndex((i) => Math.min(i + 1, ONBOARDING_SLIDES.length - 1));
  }

  function handlePrev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden gap-0 bg-white sm:max-w-none grid grid-rows-[minmax(0,1fr)_auto]"
        style={{ width: 'min(92vw, 1200px)', maxHeight: '92vh' }}
      >
        <div className="relative bg-white flex items-center justify-center overflow-hidden min-h-0">
          <video
            ref={videoRef}
            key={slide.id}
            src={slide.video}
            playsInline
            preload="auto"
            controls
            className="max-w-full max-h-full w-auto h-auto block"
          />
          <button
            type="button"
            onClick={handleSkip}
            aria-label="Skip onboarding"
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 flex items-center justify-center transition z-10 backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Step {index + 1} of {ONBOARDING_SLIDES.length}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{slide.title}</h2>
          <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-3xl">
            {slide.description}
          </p>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {ONBOARDING_SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={
                    'h-2 rounded-full transition-all ' +
                    (i === index
                      ? 'w-8 bg-slate-900'
                      : 'w-2 bg-slate-200 hover:bg-slate-300')
                  }
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-slate-500"
              >
                Skip tour
              </Button>
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={isFirst}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {isLast ? "Let's go" : 'Next'}
                {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
