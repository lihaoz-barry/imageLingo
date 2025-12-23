import { Coins } from 'lucide-react';

interface TokenBalanceProps {
  balance: number;
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30">
      <Coins className="w-4 h-4 text-[#00d4ff]" />
      <span className="text-white">{balance.toLocaleString()}</span>
      <span className="text-xs text-[#9ca3af]">tokens</span>
    </div>
  );
}
