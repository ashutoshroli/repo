export const IARC_RATING_ID = 'f043e610-f55b-8cfc-8ef0-3f9268e38684';

export const IARC_VERSION = '10.3';

export type RatingSource = 'iarc' | 'microsoft';

export interface RatingEntry {
  id: string;
  system: string;
  mark: string;
  bodyKey: string;
  regionKey: string;
  descKey: string;
  source: RatingSource;
}

export const AGE_RATINGS: RatingEntry[] = [
  {
    id: 'ccc',
    system: 'CCC',
    mark: 'TE',
    bodyKey: 'rating_ccc_body',
    regionKey: 'rating_ccc_region',
    descKey: 'rating_desc_all_ages',
    source: 'microsoft'
  },
  {
    id: 'djctq',
    system: 'DJCTQ',
    mark: 'L',
    bodyKey: 'rating_djctq_body',
    regionKey: 'rating_djctq_region',
    descKey: 'rating_desc_all_ages',
    source: 'iarc'
  },
  {
    id: 'esrb',
    system: 'ESRB',
    mark: 'E',
    bodyKey: 'rating_esrb_body',
    regionKey: 'rating_esrb_region',
    descKey: 'rating_desc_everyone',
    source: 'iarc'
  },
  {
    id: 'iarc',
    system: 'IARC',
    mark: '3+',
    bodyKey: 'rating_iarc_body',
    regionKey: 'rating_iarc_region',
    descKey: 'rating_desc_3plus',
    source: 'iarc'
  },
  {
    id: 'microsoft',
    system: 'Microsoft',
    mark: '3',
    bodyKey: 'rating_ms_body',
    regionKey: 'rating_ms_region',
    descKey: 'rating_desc_3plus',
    source: 'microsoft'
  },
  {
    id: 'pcbp',
    system: 'PCBP',
    mark: '0+',
    bodyKey: 'rating_pcbp_body',
    regionKey: 'rating_pcbp_region',
    descKey: 'rating_desc_all_ages',
    source: 'iarc'
  },
  {
    id: 'pegi',
    system: 'PEGI',
    mark: '3',
    bodyKey: 'rating_pegi_body',
    regionKey: 'rating_pegi_region',
    descKey: 'rating_desc_3plus',
    source: 'iarc'
  },
  {
    id: 'usk',
    system: 'USK',
    mark: '0',
    bodyKey: 'rating_usk_body',
    regionKey: 'rating_usk_region',
    descKey: 'rating_desc_everyone',
    source: 'iarc'
  }
];

export function sourceKey(source: RatingSource): string {
  return source === 'microsoft' ? 'rating_src_ms' : 'rating_src_iarc';
}
