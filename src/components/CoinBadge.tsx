import { useWallet } from '@/contexts/WalletContext';
import { Coins } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export default function CoinBadge({ size = 'sm', onClick, className = '' }: Props) {
  const { state } = useWallet();
  const isSm = size === 'sm';
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      aria-label={`Saldo actual: ${state.balance} monedas`}
    >
      <Coins size={isSm ? 14 : 16} />
      <span className="tabular-nums">{state.balance}</span>
    </Comp>
  );
}
