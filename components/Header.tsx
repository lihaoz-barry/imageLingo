import { LogIn, User, History, Wallet } from 'lucide-react';

interface HeaderProps {
  isLoggedIn?: boolean;
  userAvatar?: string;
  userEmail?: string;
  onLogin?: () => void;
  onHistoryClick?: () => void;
  onBillingClick?: () => void;
  tokenBalance?: number;
}

export function Header({ isLoggedIn = false, userAvatar, userEmail, onLogin, onHistoryClick, onBillingClick, tokenBalance }: HeaderProps) {
  return (
    <header className="w-full flex items-start justify-between p-8 pb-4">
      <div>
        <h1 
          className="text-6xl italic bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#c026d3] bg-clip-text text-transparent"
          style={{ fontWeight: 700 }}
        >
          ImageLingo
        </h1>
        <p className="text-[#9ca3af] mt-2">
          AI-Powered Image Localization
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {tokenBalance !== undefined && (
          <button
            onClick={onBillingClick}
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30 hover:from-[#8b5cf6]/30 hover:to-[#c026d3]/30 transition-all"
          >
            <Wallet className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-white">{tokenBalance.toLocaleString()}</span>
            <span className="text-xs text-[#9ca3af]">tokens</span>
          </button>
        )}
        
        <button
          onClick={onHistoryClick}
          className="flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </button>
        
        <button
          onClick={onLogin}
          className="flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          {isLoggedIn ? (
            <>
              {userAvatar ? (
                <img src={userAvatar} alt="User" className="w-5 h-5 rounded-full" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="max-w-[120px] truncate">{userEmail || 'Account'}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}