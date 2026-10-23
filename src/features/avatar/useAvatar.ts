import { useWallet } from '@/contexts/WalletContext';
export function useAvatar() {
  const wallet=useWallet();
  return {...wallet,config:wallet.state.config,save:wallet.saveAvatar,dirty:JSON.stringify(wallet.state.config)!==JSON.stringify(wallet.savedConfig)};
}
