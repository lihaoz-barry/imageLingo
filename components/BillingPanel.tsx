import { X, CreditCard, Crown, Zap, Check, Plus } from 'lucide-react';
import { useState } from 'react';

interface BillingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTokens: number;
  onPurchaseTokens: (amount: number, cost: number) => void;
  currentPlan: 'free' | 'pro' | 'enterprise';
  onUpgradePlan: (plan: 'free' | 'pro' | 'enterprise') => void;
}

const tokenPackages = [
  { tokens: 100, price: 9.99, bonus: 0, popular: false },
  { tokens: 500, price: 39.99, bonus: 50, popular: true },
  { tokens: 1000, price: 69.99, bonus: 150, popular: false },
  { tokens: 5000, price: 299.99, bonus: 1000, popular: false },
];

const subscriptionPlans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 0,
    interval: 'forever',
    tokens: 50,
    features: [
      '50 tokens/month',
      '1 variation per image',
      'Basic languages',
      'Standard processing',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 29,
    interval: 'month',
    tokens: 500,
    features: [
      '500 tokens/month',
      'Up to 5 variations',
      'All languages',
      'Priority processing',
      'Batch downloads',
      'API access',
    ],
    popular: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    tokens: 2500,
    features: [
      '2500 tokens/month',
      'Unlimited variations',
      'All languages',
      'Fastest processing',
      'Custom integrations',
      'Dedicated support',
      'Team collaboration',
    ],
  },
];

export function BillingPanel({
  isOpen,
  onClose,
  currentTokens,
  onPurchaseTokens,
  currentPlan,
  onUpgradePlan,
}: BillingPanelProps) {
  const [activeTab, setActiveTab] = useState<'subscription' | 'tokens' | 'billing'>('subscription');

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0d0d2b] to-[#2d1b69] border border-white/20 rounded-3xl z-50 shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-b from-[#0d0d2b] to-transparent backdrop-blur-md z-10 p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent">
              Billing & Subscription
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'subscription'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                  : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
              }`}
            >
              Subscription
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'tokens'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                  : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
              }`}
            >
              Add Tokens
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'billing'
                  ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                  : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
              }`}
            >
              Billing History
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl backdrop-blur-md border p-6 transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-b from-[#8b5cf6]/20 to-[#c026d3]/10 border-[#8b5cf6] shadow-[0_0_40px_rgba(139,92,246,0.3)]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    } ${currentPlan === plan.id ? 'ring-2 ring-[#00d4ff]' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-xs">
                        Most Popular
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      {plan.id === 'free' && <Zap className="w-5 h-5 text-[#9ca3af]" />}
                      {plan.id === 'pro' && <Crown className="w-5 h-5 text-[#8b5cf6]" />}
                      {plan.id === 'enterprise' && <Crown className="w-5 h-5 text-[#00d4ff]" />}
                      <h3 className="text-white">{plan.name}</h3>
                    </div>

                    <div className="mb-6">
                      <span className="text-4xl text-white">${plan.price}</span>
                      <span className="text-[#9ca3af]">/{plan.interval}</span>
                      <p className="text-sm text-[#00d4ff] mt-1">{plan.tokens} tokens included</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                          <span className="text-[#9ca3af]">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => onUpgradePlan(plan.id)}
                      disabled={currentPlan === plan.id}
                      className={`w-full py-3 rounded-xl transition-all ${
                        currentPlan === plan.id
                          ? 'bg-white/5 text-[#9ca3af] cursor-not-allowed'
                          : plan.popular
                          ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] text-white'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Tokens Tab */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#9ca3af] text-sm mb-1">Current Balance</p>
                    <p className="text-3xl text-white">{currentTokens.toLocaleString()} tokens</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tokenPackages.map((pkg, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-2xl backdrop-blur-md border p-6 transition-all ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-[#8b5cf6]/20 to-[#c026d3]/10 border-[#8b5cf6]'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-xs">
                        Best Value
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-2xl text-white mb-1">
                          {pkg.tokens.toLocaleString()}
                          {pkg.bonus > 0 && (
                            <span className="text-sm text-[#00d4ff] ml-2">
                              +{pkg.bonus} bonus
                            </span>
                          )}
                        </p>
                        <p className="text-[#9ca3af] text-sm">tokens</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl text-white">${pkg.price}</p>
                        <p className="text-xs text-[#9ca3af]">
                          ${(pkg.price / (pkg.tokens + pkg.bonus)).toFixed(3)}/token
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onPurchaseTokens(pkg.tokens + pkg.bonus, pkg.price)}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all text-white flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Purchase
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing History Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white">Recent Transactions</h3>
                </div>
                
                <div className="space-y-3">
                  {[
                    { date: 'Dec 5, 2025', description: 'Pro Plan - Monthly', amount: -29.00, tokens: 500 },
                    { date: 'Dec 1, 2025', description: 'Token Package (500 + 50 bonus)', amount: -39.99, tokens: 550 },
                    { date: 'Nov 15, 2025', description: 'Token Package (100)', amount: -9.99, tokens: 100 },
                  ].map((transaction, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <p className="text-white text-sm mb-1">{transaction.description}</p>
                        <p className="text-xs text-[#9ca3af]">{transaction.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">${Math.abs(transaction.amount).toFixed(2)}</p>
                        <p className="text-xs text-[#00d4ff]">+{transaction.tokens} tokens</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10">
                <h3 className="text-white mb-4">Payment Method</h3>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white">•••• •••• •••• 4242</p>
                    <p className="text-xs text-[#9ca3af]">Expires 12/25</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-all">
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
