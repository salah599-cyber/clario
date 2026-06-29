export const OMAN_GOVERNORATES = [
  "Muscat",
  "Dhofar",
  "Musandam",
  "Al Buraimi",
  "Ad Dakhiliyah",
  "Al Batinah North",
  "Al Batinah South",
  "Ash Sharqiyah North",
  "Ash Sharqiyah South",
  "Ad Dhahirah",
  "Al Wusta",
] as const;

export type OmanGovernorate = (typeof OMAN_GOVERNORATES)[number];

export const OMAN_WILAYATS: Record<OmanGovernorate, string[]> = {
  Muscat: ["Muscat", "Muttrah", "Bawshar", "As Seeb", "Al Amerat", "Qurayyat"],
  Dhofar: ["Salalah", "Taqah", "Mirbat", "Rakhyut", "Thumrait", "Sadah", "Shaleem and the Hallaniyat Islands", "Muqshin", "Dalkut", "Al Mazyunah"],
  Musandam: ["Khasab", "Bukha", "Dibba Al-Baya", "Madha"],
  "Al Buraimi": ["Al Buraimi", "Mahdah", "As Sunaynah"],
  "Ad Dakhiliyah": ["Nizwa", "Bahla", "Manah", "Al Hamra", "Adam", "Izki", "Samail", "Bidbid"],
  "Al Batinah North": ["Sohar", "Shinas", "Liwa", "Saham", "Al Khaburah", "As Suwaiq"],
  "Al Batinah South": ["Rustaq", "Al Awabi", "Nakhal", "Wadi Al Maawil", "Barka", "Al Musannah"],
  "Ash Sharqiyah North": ["Ibra", "Al Mudhaibi", "Bidiya", "Al Qabil", "Wadi Bani Khalid", "Dima Wataeen"],
  "Ash Sharqiyah South": ["Sur", "Al Kamil Wal Wafi", "Jaalan Bani Bu Hassan", "Jaalan Bani Bu Ali", "Masirah"],
  "Ad Dhahirah": ["Ibri", "Yanqul", "Dhank"],
  "Al Wusta": ["Haima", "Duqm", "Mahout", "Al Jazer"],
};

export function getWilayatsForGovernorate(governorate: string): string[] {
  return OMAN_WILAYATS[governorate as OmanGovernorate] ?? [];
}
