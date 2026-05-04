export const resolveAssetImageUrl = (
  market: string,
  ticker: string,
  websiteDomain: string | null,
  imageUrl: string | null
): string | string[] => {
  if (market === 'US') return imageUrl ?? `https://assets.parqet.com/logos/symbol/${ticker}`;
  if (websiteDomain)
    return [
      `https://logo.clearbit.com/${websiteDomain}`,
      `https://unavatar.io/${websiteDomain}`,
      `https://www.google.com/s2/favicons?domain=${websiteDomain}&sz=128`,
    ];
  return imageUrl ?? '';
};
