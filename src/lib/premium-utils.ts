export const PREMIUM_ITEM_TYPE = 'premium_pass';
export const PREMIUM_DURATION_DAYS = 30;

export interface PremiumStatus {
  isActive: boolean;
  expiresAt: Date | null;
}

export const checkPremiumStatus = (premiumData: any[] | null): PremiumStatus => {
  if (!premiumData || premiumData.length === 0) {
    return { isActive: false, expiresAt: null };
  }

  const activePremium = premiumData.find((item: any) => {
    if (item.item_type !== PREMIUM_ITEM_TYPE) return false;
    const expiresAt = new Date(item.expires_at);
    return expiresAt > new Date();
  });

  if (activePremium) {
    return {
      isActive: true,
      expiresAt: new Date(activePremium.expires_at),
    };
  }

  return { isActive: false, expiresAt: null };
};