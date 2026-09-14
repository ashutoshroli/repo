import type { Skin } from './types';
import { premiumSkin } from './premium';
import { classicSkin } from './classic';
import { slateSkin } from './slate';
import { auroraSkin } from './aurora';
import { festivalSkin } from './festival';
import { skinIdForTheme, DEFAULT_SKIN_ID, type SkinId } from './skinMap';

const SKINS: Record<SkinId, Skin> = {
  premium: premiumSkin,
  classic: classicSkin,
  slate: slateSkin,
  aurora: auroraSkin,
  festival: festivalSkin
};

export const DEFAULT_SKIN = SKINS[DEFAULT_SKIN_ID];

export function skinForTheme(themeId: string | null | undefined): Skin {
  return SKINS[skinIdForTheme(themeId)];
}
