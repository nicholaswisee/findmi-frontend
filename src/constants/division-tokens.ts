// Hardcoded mapping of division tokens to department/division assignment.
// Rotate or extend tokens here when needed.
export const DIVISION_TOKENS = {
  "AMI-KETUA-2026": {
    department: "Ketua AMI",
    division: "none",
    requireNim: true,
  },

  // Kesekjenan
  "KES-SEKRETARIS-2026": {
    department: "Kesekjenan",
    division: "Sekretaris",
    requireNim: true,
  },
  "KES-BENDAHARA-2026": {
    department: "Kesekjenan",
    division: "Bendahara",
    requireNim: true,
  },
  "KES-PERIZINAN-2026": {
    department: "Kesekjenan",
    division: "Perizinan",
    requireNim: true,
  },

  // Manajemen Personalia
  "MP-MSDM-2026": {
    department: "Manajemen Personalia",
    division: "MSDM",
    requireNim: true,
  },
  "MP-PSDM-2026": {
    department: "Manajemen Personalia",
    division: "PSDM",
    requireNim: true,
  },

  // Materi dan Metode
  "MAT-PENGAWASAN-2026": {
    department: "Materi dan Metode",
    division: "Pengawasan",
    requireNim: true,
  },
  "MAT-EKSEKUSI-2026": {
    department: "Materi dan Metode",
    division: "Eksekusi",
    requireNim: true,
  },

  // ITB Day
  "ITBDAY-LAPANGAN-2026": {
    department: "ITB Day",
    division: "Lapangan",
    requireNim: true,
  },
  "ITBDAY-TOUR-2026": {
    department: "ITB Day",
    division: "Tour",
    requireNim: true,
  },
  "ITBDAY-EO-2026": {
    department: "ITB Day",
    division: "Event Organizer",
    requireNim: true,
  },
  "ITBDAY-EXHIBITION-2026": {
    department: "ITB Day",
    division: "Exhibition",
    requireNim: true,
  },
  "ITBDAY-PREEVENT-2026": {
    department: "ITB Day",
    division: "Pre-Event",
    requireNim: true,
  },

  // Relasi
  "REL-INTRAKAMPUS-2026": {
    department: "Relasi",
    division: "Intrakampus",
    requireNim: true,
  },
  "REL-EKSTRAKAMPUS-2026": {
    department: "Relasi",
    division: "Ekstrakampus",
    requireNim: true,
  },

  // Kreatif
  "KRE-GRAFIS-2026": {
    department: "Kreatif",
    division: "Grafis",
    requireNim: true,
  },
  "KRE-DOKUMENTASI-2026": {
    department: "Kreatif",
    division: "Dokumentasi",
    requireNim: true,
  },
  "KRE-PUBLIKASI-2026": {
    department: "Kreatif",
    division: "Publikasi",
    requireNim: true,
  },
  "KRE-MUSIK-2026": {
    department: "Kreatif",
    division: "Musik",
    requireNim: true,
  },
  "KRE-PROPERTI-2026": {
    department: "Kreatif",
    division: "Properti",
    requireNim: true,
  },

  // Diseminasi
  "DIS-UMUM-2026": {
    department: "Diseminasi",
    division: "Diseminasi Umum",
    requireNim: true,
  },
  "DIS-KHUSUS-2026": {
    department: "Diseminasi",
    division: "Diseminasi Khusus",
    requireNim: true,
  },

  // Paguyuban Membangun
  "PAG-ROADSHOW-2026": {
    department: "Paguyuban Membangun",
    division: "Roadshow Paguyuban",
    requireNim: true,
  },
  "PAG-FORUM-2026": {
    department: "Paguyuban Membangun",
    division: "Forum Paguyuban",
    requireNim: true,
  },

  // IT
  "IT-2026": { department: "IT", division: "IT", requireNim: true },

  // Fundraising
  "FUN-SPONSOR-2026": {
    department: "Fundraising",
    division: "Sponsorship",
    requireNim: true,
  },
  "FUN-ENTRE-2026": {
    department: "Fundraising",
    division: "Entrepreneurship",
    requireNim: true,
  },

  // Operasional
  "OPS-LOGISTIK-2026": {
    department: "Operasional",
    division: "Logistik",
    requireNim: true,
  },
  "OPS-PRODUKSI-2026": {
    department: "Operasional",
    division: "Produksi",
    requireNim: true,
  },
  "OPS-AKOMODASI-2026": {
    department: "Operasional",
    division: "Akomodasi dan Transportasi",
    requireNim: true,
  },

  // Default non-panitia token (no NIM required, hides NIM/department/division)
  "UMUM-2026": { department: "Umum", division: "none", requireNim: false },
} as const;

export type DivisionTokenKey = keyof typeof DIVISION_TOKENS;
export type DivisionTokenPayload = (typeof DIVISION_TOKENS)[DivisionTokenKey];
