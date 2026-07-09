import type { SelectOption } from "@/components/ui";

/** Static v1 dataset — country + state/province selects; city stays free-text.
 *  Replace with a Places-backed autocomplete when international coverage matters. */

export const COUNTRIES: SelectOption[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "District of Columbia",
];

const CA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon",
];

const GB_REGIONS = ["England", "Scotland", "Wales", "Northern Ireland"];

const AU_STATES = [
  "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia",
  "Tasmania", "Australian Capital Territory", "Northern Territory",
];

const STATES_BY_COUNTRY: Record<string, string[]> = {
  US: US_STATES,
  CA: CA_PROVINCES,
  GB: GB_REGIONS,
  AU: AU_STATES,
};

export function statesFor(country: string | null): SelectOption[] {
  const list = country ? (STATES_BY_COUNTRY[country] ?? []) : [];
  return list.map((s) => ({ value: s, label: s }));
}
