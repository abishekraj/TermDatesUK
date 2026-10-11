export interface Period { name: string; start: string; end: string; note?: string }
export interface InsetDay { date: string; note?: string }
export interface AcademicYear {
  year: string;
  terms: Period[];
  half_terms: Period[];
  inset_days: InsetDay[];
  bank_holidays_excluded: boolean;
}
export interface Council {
  slug: string;
  name: string;
  source_url: string;
  source_type: 'ical' | 'html' | 'pdf' | 'manual';
  licence: { name: string; url: string; notes?: string };
  robots_checked?: string;
  review_status: 'reviewed' | 'needs_review';
  last_verified: string;
  academic_years: AcademicYear[];
  notes?: string;
}
