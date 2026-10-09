import { useId } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const authGradient = 'linear-gradient(90deg, #6F518E 0%, #8A66B4 100%)';

export function AuthActionButton({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  const isPrimary = variant === 'primary';
  return (
    <Button
      {...props}
      className={`h-14 w-full rounded-full text-lg font-extrabold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#6F518E] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:h-16 ${
        isPrimary
          ? 'border-0 text-white shadow-[0_10px_18px_rgba(111,81,142,0.28)] hover:brightness-110 hover:shadow-[0_14px_22px_rgba(111,81,142,0.32)]'
          : 'border-2 border-[#C9A7EB] bg-white text-[#6F518E] hover:bg-[#F0EBFF]'
      } ${className}`}
      style={isPrimary ? { background: authGradient } : undefined}
    >
      {children}
    </Button>
  );
}

const floatingLabelClass =
  'pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6F518E]/60 transition-all duration-200 ease-out peer-focus:top-[10px] peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-[#6F518E] peer-[:not(:placeholder-shown)]:top-[10px] peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]';

export function AuthField({ label, className, id, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="relative">
      <Input
        id={inputId}
        placeholder=" "
        {...props}
        className={`peer h-16 rounded-2xl border-[#C9A7EB]/60 bg-white px-5 pt-6 pb-2 text-base leading-snug text-[#6F518E] transition placeholder:text-transparent hover:border-[#C9A7EB] focus-visible:border-[#6F518E] focus-visible:ring-4 focus-visible:ring-[#C9A7EB]/25 md:text-lg ${className ?? ''}`}
      />
      <label htmlFor={inputId} className={floatingLabelClass}>
        {label}
      </label>
    </div>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onTogglePassword,
  autoComplete,
  id,
}: {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  showPassword: boolean;
  onTogglePassword: () => void;
  autoComplete?: string;
  id?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <div className="relative">
      <Input
        id={inputId}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        className="peer h-16 rounded-2xl border-[#C9A7EB]/60 bg-white px-5 pr-12 pt-6 pb-2 text-base leading-snug text-[#6F518E] transition placeholder:text-transparent hover:border-[#C9A7EB] focus-visible:border-[#6F518E] focus-visible:ring-4 focus-visible:ring-[#C9A7EB]/25 md:text-lg"
      />
      <label htmlFor={inputId} className={floatingLabelClass}>
        {label}
      </label>
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6F518E]/70 transition hover:text-[#6F518E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F518E]"
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

export function Feedback({ message }: { message: string }) {
  if (!message) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="alert"
      className="rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-center text-sm font-semibold text-[#6F518E]"
    >
      {message}
    </motion.p>
  );
}

export function TermsText() {
  return (
    <p className="mx-auto max-w-[290px] text-center text-sm font-medium leading-[1.2] text-[#6F518E]/70">
      Al continuar, aceptas nuestros términos de servicio y política de privacidad.
    </p>
  );
}

export function AuthLinkButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-md px-1 text-sm font-semibold text-[#6F518E] underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F518E] ${className}`}
    />
  );
}
