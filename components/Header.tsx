import { LogIn, User, History } from 'lucide-react';
import { TokenButton } from './TokenButton';

interface HeaderProps {
  isLoggedIn?: boolean;
  userAvatar?: string;
  userEmail?: string;
  onLogin?: () => void;
  onHistoryClick?: () => void;
  onBillingClick?: () => void;
  tokenBalance?: number;
}

export function Header({
  isLoggedIn = false,
  userAvatar,
  userEmail,
  onLogin,
  onHistoryClick,
  onBillingClick,
  tokenBalance,
}: HeaderProps) {
  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-4 sm:py-8 gap-4">
      <div>
        <h1
          className="text-3xl sm:text-5xl md:text-6xl italic bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#c026d3] bg-clip-text text-transparent"
          style={{ fontWeight: 700 }}
        >
          ImageLingo
        </h1>
        <p className="text-sm sm:text-base text-[#9ca3af] mt-1 sm:mt-2">
          AI-Powered Image Localization
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {tokenBalance !== undefined && (
          <TokenButton
            tokenBalance={tokenBalance}
            onClick={onBillingClick}
          />
        )}

        <button
          onClick={onHistoryClick}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
        </button>

        <button
          onClick={onLogin}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          {isLoggedIn ? (
            <>
              {userAvatar ? (
                <div className="relative">
                  <img src={userAvatar} alt="User" className="w-5 h-5 rounded-full ring-2 ring-green-400/50" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse border border-white/50 sm:hidden"></span>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] flex items-center justify-center text-[10px] font-semibold text-white sm:hidden">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse border border-white/50 sm:hidden"></span>
                  <User className="w-4 h-4 hidden sm:block" />
                </div>
              )}
              <span className="max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">{userEmail || 'Account'}</span>
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