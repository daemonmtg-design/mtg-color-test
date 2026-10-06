import countries from 'world-countries';
import normsData from '../data/big_five_country_norms.json';

// Mapping UN subregions to norms regions
const regionMapping: Record<string, string> = {
  "Northern America": "North America",
  "Central America": "South America",
  "Caribbean": "South America",
  "South America": "South America",
  "Northern Europe": "Western Europe",
  "Western Europe": "Western Europe",
  "Southern Europe": "Southern Europe",
  "Eastern Europe": "Eastern Europe",
  "Western Asia": "Middle East",
  "Northern Africa": "Middle East", // Except Morocco which is in countries
  "Sub-Saharan Africa": "Africa",
  "Middle Africa": "Africa",
  "Eastern Africa": "Africa",
  "Southern Africa": "Africa",
  "Western Africa": "Africa",
  "Southern Asia": "South and Southeast Asia",
  "South-eastern Asia": "South and Southeast Asia",
  "Eastern Asia": "East Asia",
  "Australia and New Zealand": "Oceania",
  "Melanesia": "Oceania",
  "Micronesia": "Oceania",
  "Polynesia": "Oceania",
  "Central Asia": "Global (all 56 nations)"
};

export const countryOptions = [
  { value: 'Prefer not to say', label: 'Prefer not to say', region: 'Global (all 56 nations)' },
  ...countries.map(c => {
    let name = c.name.common;
    if (name === "United States") name = "USA";
    if (name === "United Kingdom") name = "United Kingdom";

    let mappedRegion = "Global (all 56 nations)";
    if (name in normsData.countries) {
      mappedRegion = name; // Exact match
    } else {
      const unSub = c.subregion;
      if (name === "Morocco") {
        mappedRegion = "Africa";
      } else if (unSub && regionMapping[unSub]) {
        mappedRegion = regionMapping[unSub];
      }
    }
    return { value: mappedRegion, label: c.name.common, originalName: c.name.common };
  }).sort((a, b) => a.label.localeCompare(b.label))
];
