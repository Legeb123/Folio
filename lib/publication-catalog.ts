import { countries } from "./geography";
// MARC publication-country codes, not language or author nationality.
// Source: https://www.loc.gov/marc/countries/countries_code.html
const marc: Record<string, string> = {
  xxu: "USA",
  xxk: "GBR",
  enk: "GBR",
  stk: "GBR",
  wlk: "GBR",
  nik: "GBR",
  xxc: "CAN",
  onc: "CAN",
  quc: "CAN",
  bcc: "CAN",
  abc: "CAN",
  at: "AUS",
  au: "AUT",
  sz: "CHE",
  gw: "DEU",
  ge: "DEU",
  fr: "FRA",
  it: "ITA",
  sp: "ESP",
  po: "PRT",
  ja: "JPN",
  cc: "CHN",
  ch: "TWN",
  ko: "KOR",
  ii: "IND",
  is: "ISR",
  br: "BRA",
  mx: "MEX",
  ag: "ARG",
  cl: "CHL",
  pe: "PER",
  ck: "COL",
  nz: "NZL",
  ie: "IRL",
  ne: "NLD",
  be: "BEL",
  sw: "SWE",
  no: "NOR",
  dk: "DNK",
  fi: "FIN",
  pl: "POL",
  xr: "CZE",
  xo: "SVK",
  hu: "HUN",
  rm: "ROU",
  ru: "RUS",
  un: "UKR",
  gr: "GRC",
  tu: "TUR",
  sa: "ZAF",
  ua: "EGY",
  nr: "NGA",
  ke: "KEN",
  th: "THA",
  vm: "VNM",
  io: "IDN",
  ph: "PHL",
};
const usaStates = new Set(
  "alu aku azu aru cau cou ctu deu dcu flu gau hiu idu ilu inu iau ksu kyu lau meu mdu mau miu mnu msu mou mtu nbu nvu nhu nju nmu nyu ncu ndu ohu oku oru pau riu scu sdu tnu txu utu vtu vau wau wvu wiu wyu".split(
    " ",
  ),
);
const cities: Record<string, string> = {
  "new york": "USA",
  boston: "USA",
  chicago: "USA",
  philadelphia: "USA",
  "san francisco": "USA",
  london: "GBR",
  edinburgh: "GBR",
  petersfield: "GBR",
  oxford: "GBR",
  berlin: "DEU",
  leipzig: "DEU",
  munich: "DEU",
  hamburg: "DEU",
  paris: "FRA",
  zurich: "CHE",
  zürich: "CHE",
  basel: "CHE",
  vienna: "AUT",
  wien: "AUT",
  tokyo: "JPN",
  osaka: "JPN",
  madrid: "ESP",
  barcelona: "ESP",
  lisbon: "PRT",
  amsterdam: "NLD",
  toronto: "CAN",
  montreal: "CAN",
  sydney: "AUS",
  melbourne: "AUS",
  dublin: "IRL",
  "tel aviv": "ISR",
  jerusalem: "ISR",
  "rio de janeiro": "BRA",
  "são paulo": "BRA",
  stockholm: "SWE",
  oslo: "NOR",
  copenhagen: "DNK",
  helsinki: "FIN",
  prague: "CZE",
  warsaw: "POL",
  "buenos aires": "ARG",
};
export function countryFromPublication(entry: {
  publish_country?: string;
  publish_places?: string[];
}) {
  const code =
    typeof entry.publish_country === "string"
      ? entry.publish_country.trim().toLowerCase()
      : "";
  if (usaStates.has(code)) return "USA";
  if (marc[code]) return marc[code];
  // Exact place tokens only: ambiguous cities and subject/setting fields are ignored.
  for (const place of Array.isArray(entry.publish_places)
    ? entry.publish_places
    : []) {
    if (typeof place !== "string") continue;
    const parts = place
      .toLowerCase()
      .replace(/[\[\]()]/g, "")
      .split(/[,;:]/)
      .map((s) => s.trim().replace(/\.$/, ""));
    for (const part of [...parts].reverse()) {
      const country = countries.find((c) =>
        [c.name.toLowerCase(), c.de.toLowerCase()].includes(part),
      );
      if (country) return country.id;
      if (
        [
          "uk",
          "u.k.",
          "great britain",
          "england",
          "scotland",
          "wales",
        ].includes(part)
      )
        return "GBR";
      if (["us", "u.s.", "usa", "united states of america"].includes(part))
        return "USA";
      if (cities[part]) return cities[part];
    }
  }
  return undefined;
}
