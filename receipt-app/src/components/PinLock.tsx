import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinLockProps {
  onUnlock: () => void;
}

const PIN = import.meta.env.VITE_APP_PIN || '1234';
const PIN_LENGTH = PIN.length;

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const triggerError = useCallback(() => {
    setError(true);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setDigits(Array(PIN_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }, 600);
    setTimeout(() => setError(false), 2000);
  }, []);

  const checkPin = useCallback(
    (newDigits: string[]) => {
      const entered = newDigits.join('');
      if (entered.length === PIN_LENGTH) {
        if (entered === PIN) {
          setIsSuccess(true);
          setTimeout(() => onUnlock(), 500);
        } else {
          triggerError();
        }
      }
    },
    [onUnlock, triggerError]
  );

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const digit = value.slice(-1);
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);
      setError(false);

      if (digit && index < PIN_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      checkPin(newDigits);
    },
    [digits, checkPin]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handleNumpadClick = useCallback(
    (num: string) => {
      const nextEmpty = digits.findIndex((d) => d === '');
      if (nextEmpty === -1) return;
      handleDigitChange(nextEmpty, num);
    },
    [digits, handleDigitChange]
  );

  const handleBackspace = useCallback(() => {
    const lastFilled = digits.reduce((acc, d, i) => (d ? i : acc), -1);
    if (lastFilled >= 0) {
      const newDigits = [...digits];
      newDigits[lastFilled] = '';
      setDigits(newDigits);
    }
  }, [digits]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Lock icon */}
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500',
            isSuccess
              ? 'bg-success/15 text-success scale-110'
              : error
                ? 'bg-destructive/15 text-destructive'
                : 'bg-primary/10 text-primary'
          )}
        >
          {isSuccess ? (
            <ShieldCheck className="h-10 w-10" />
          ) : (
            <Lock className="h-10 w-10" />
          )}
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Receipt Scanner</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your PIN to continue
          </p>
        </div>

        {/* PIN dots / inputs (hidden inputs for accessibility) */}
        <div
          className={cn(
            'flex gap-3 transition-transform',
            isShaking && 'animate-shake'
          )}
        >
          {digits.map((digit, i) => (
            <div key={i} className="relative">
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                aria-label={`PIN digit ${i + 1}`}
                autoFocus={i === 0}
              />
              <div
                className={cn(
                  'flex h-14 w-12 items-center justify-center rounded-xl border-2 text-xl font-semibold transition-all duration-200',
                  digit
                    ? isSuccess
                      ? 'border-success bg-success/10 text-success'
                      : error
                        ? 'border-destructive bg-destructive/10'
                        : 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-muted/50'
                )}
              >
                {digit ? (
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full transition-all',
                      isSuccess
                        ? 'bg-success'
                        : error
                          ? 'bg-destructive'
                          : 'bg-foreground'
                    )}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm font-medium text-destructive animate-in fade-in slide-in-from-bottom-1">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map(
            (num) =>
              num === '' ? (
                <div key="empty" />
              ) : num === '←' ? (
                <button
                  key="backspace"
                  onClick={handleBackspace}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-medium text-muted-foreground transition-all active:scale-95 active:bg-muted"
                  aria-label="Backspace"
                >
                  ←
                </button>
              ) : (
                <button
                  key={num}
                  onClick={() => handleNumpadClick(num)}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-medium transition-all hover:bg-muted active:scale-95 active:bg-muted/80"
                  aria-label={`Digit ${num}`}
                >
                  {num}
                </button>
              )
          )}
        </div>
      </div>

      {/* Shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
