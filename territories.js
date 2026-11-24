const RAW_TERRITORIES = [
  // France
  ["gf", "GUF", "Französisch-Guayana", "French Guiana", "Cayenne", "Südamerika", "fr", 83534, 295000, ".gf"],
  ["gp", "GLP", "Guadeloupe", "Guadeloupe", "Basse-Terre", "Nordamerika", "fr", 1628, 384000, ".gp"],
  ["mq", "MTQ", "Martinique", "Martinique", "Fort-de-France", "Nordamerika", "fr", 1128, 349000, ".mq"],
  ["re", "REU", "Réunion", "Réunion|Reunion", "Saint-Denis", "Afrika", "fr", 2511, 886000, ".re"],
  ["yt", "MYT", "Mayotte", "Mayotte", "Mamoudzou", "Afrika", "fr", 374, 321000, ".yt"],
  ["mf", "MAF", "Saint-Martin", "Saint Martin|Saint-Martin (French part)", "Marigot", "Nordamerika", "fr", 53, 32000, ".mf"],
  ["bl", "BLM", "Saint-Barthélemy", "Saint-Barthélemy|Saint Barthelemy", "Gustavia", "Nordamerika", "fr", 25, 11000, ".bl"],
  ["pm", "SPM", "Saint-Pierre und Miquelon", "Saint Pierre and Miquelon", "Saint-Pierre", "Nordamerika", "fr", 242, 5800, ".pm"],
  ["wf", "WLF", "Wallis und Futuna", "Wallis and Futuna", "Mata-Utu", "Ozeanien", "fr", 142, 11500, ".wf"],
  ["pf", "PYF", "Französisch-Polynesien", "French Polynesia", "Papeete", "Ozeanien", "fr", 4167, 280000, ".pf"],
  ["nc", "NCL", "Neukaledonien", "New Caledonia", "Nouméa", "Ozeanien", "fr", 18575, 271000, ".nc"],

  // Denmark
  ["gl", "GRL", "Grönland", "Greenland", "Nuuk", "Nordamerika", "dk", 2166086, 56600, ".gl"],
  ["fo", "FRO", "Färöer", "Faroe Islands|Faeroe Islands", "Tórshavn", "Europa", "dk", 1393, 54000, ".fo"],

  // Netherlands
  ["aw", "ABW", "Aruba", "Aruba", "Oranjestad", "Nordamerika", "nl", 180, 107000, ".aw"],
  ["cw", "CUW", "Curaçao", "Curaçao|Curacao", "Willemstad", "Nordamerika", "nl", 444, 156000, ".cw"],
  ["sx", "SXM", "Sint Maarten", "Sint Maarten|Sint Maarten (Dutch part)", "Philipsburg", "Nordamerika", "nl", 34, 42000, ".sx"],

  // United States
  ["pr", "PRI", "Puerto Rico", "Puerto Rico", "San Juan", "Nordamerika", "us", 9104, 3200000, ".pr"],
  ["vi", "VIR", "Amerikanische Jungferninseln", "United States Virgin Islands|U.S. Virgin Islands|US Virgin Islands", "Charlotte Amalie", "Nordamerika", "us", 347, 87000, ".vi"],
  ["gu", "GUM", "Guam", "Guam", "Hagåtña", "Ozeanien", "us", 544, 170000, ".gu"],
  ["as", "ASM", "Amerikanisch-Samoa", "American Samoa", "Pago Pago", "Ozeanien", "us", 199, 44000, ".as"],
  ["mp", "MNP", "Nördliche Marianen", "Northern Mariana Islands|N. Mariana Is.", "Saipan", "Ozeanien", "us", 464, 47000, ".mp"],

  // United Kingdom
  ["fk", "FLK", "Falklandinseln", "Falkland Islands|Falkland Is.", "Stanley", "Südamerika", "gb", 12173, 3500, ".fk"],
  ["bm", "BMU", "Bermuda", "Bermuda", "Hamilton", "Nordamerika", "gb", 54, 64000, ".bm"],
  ["ky", "CYM", "Kaimaninseln", "Cayman Islands|Cayman Is.", "George Town", "Nordamerika", "gb", 264, 69000, ".ky"],
  ["ai", "AIA", "Anguilla", "Anguilla", "The Valley", "Nordamerika", "gb", 91, 15000, ".ai"],
  ["ms", "MSR", "Montserrat", "Montserrat", "Brades", "Nordamerika", "gb", 102, 4400, ".ms"],
  ["tc", "TCA", "Turks- und Caicosinseln", "Turks and Caicos Islands|Turks and Caicos Is.", "Cockburn Town", "Nordamerika", "gb", 948, 46000, ".tc"],
  ["vg", "VGB", "Britische Jungferninseln", "British Virgin Islands|British Virgin Is.", "Road Town", "Nordamerika", "gb", 151, 31000, ".vg"],
  ["sh", "SHN", "St. Helena, Ascension und Tristan da Cunha", "Saint Helena|Saint Helena, Ascension and Tristan da Cunha|St. Helena", "Jamestown", "Afrika", "gb", 394, 5400, ".sh"],
  ["pn", "PCN", "Pitcairninseln", "Pitcairn Islands|Pitcairn Is.|Pitcairn", "Adamstown", "Ozeanien", "gb", 47, 50, ".pn"],
  ["io", "IOT", "Britisches Territorium im Indischen Ozean", "British Indian Ocean Territory|Br. Indian Ocean Ter.", "Diego Garcia", "Asien", "gb", 60, 0, ".io"],
  ["gs", "SGS", "Südgeorgien und die Südlichen Sandwichinseln", "South Georgia and the Islands|South Georgia and the South Sandwich Islands|S. Geo. and the Is.", "King Edward Point", "Südamerika", "gb", 3903, 0, ".gs"],
  ["im", "IMN", "Isle of Man", "Isle of Man", "Douglas", "Europa", "gb", 572, 84000, ".im"],
  ["je", "JEY", "Jersey", "Jersey", "Saint Helier", "Europa", "gb", 118, 103000, ".je"],
  ["gg", "GGY", "Guernsey", "Guernsey", "Saint Peter Port", "Europa", "gb", 78, 63000, ".gg"],
  ["gi", "GIB", "Gibraltar", "Gibraltar", "Gibraltar", "Europa", "gb", 7, 33700, ".gi"],

  // China
  ["hk", "HKG", "Hongkong", "Hong Kong S.A.R.|Hong Kong", "–", "Asien", "cn", 1114, 7500000, ".hk"],
  ["mo", "MAC", "Macau", "Macao S.A.R|Macao|Macau", "–", "Asien", "cn", 33, 680000, ".mo"],

  // New Zealand
  ["ck", "COK", "Cookinseln", "Cook Islands|Cook Is.", "Avarua", "Ozeanien", "nz", 236, 15000, ".ck"],
  ["nu", "NIU", "Niue", "Niue", "Alofi", "Ozeanien", "nz", 261, 1700, ".nu"],
  ["tk", "TKL", "Tokelau", "Tokelau", "–", "Ozeanien", "nz", 12, 1500, ".tk"],

  // Australia
  ["nf", "NFK", "Norfolkinsel", "Norfolk Island", "Kingston", "Ozeanien", "au", 36, 2200, ".nf"],
  ["cx", "CXR", "Weihnachtsinsel", "Christmas Island|Indian Ocean Territories", "Flying Fish Cove", "Asien", "au", 135, 1800, ".cx"],
  ["cc", "CCK", "Kokosinseln", "Cocos (Keeling) Islands|Cocos Islands", "West Island", "Asien", "au", 14, 600, ".cc"],
];

const TERRITORIES = RAW_TERRITORIES.map(
  ([code, iso3, name, names, capital, continent, sovereign, area, population, tld]) => ({
    code, iso3, name, names: names.split("|"), capital, capitalEn: capital,
    continent, sovereign, area, population, tld, isTerritory: true,
  })
);

if (typeof module !== "undefined") module.exports = { TERRITORIES };
