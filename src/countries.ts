export type Continent =
  | "África"
  | "América"
  | "Asia"
  | "Europa"
  | "Oceanía"
  | "Antártida";

export const CONTINENTS: Continent[] = [
  "África",
  "América",
  "Asia",
  "Europa",
  "Oceanía",
  "Antártida",
];

export type Status =
  /** UN member, or the Vatican (observer). */
  | "sovereign"
  /** Declared states recognized by only part of the world: Kosovo, Palestine, Taiwan. */
  | "limited"
  /** Dependent or disputed territory. */
  | "territory"
  /** England, Scotland, Wales and Northern Ireland. */
  | "constituent";

export type Country = {
  /** flagcdn code: ISO 3166-1 alpha-2 in lowercase, plus gb-eng/gb-sct/gb-wls/gb-nir. */
  code: string;
  name: string;
  /** null when the place has no capital (uninhabited or no fixed seat). */
  capital: string | null;
  continent: Continent;
  status: Status;
  /** Territories and constituent nations: who they depend on, with the preposition
   * ready for a label ("de Francia", "del Reino Unido", "en disputa"). */
  parent?: string;
};

export function statusLabel(c: Country): string {
  switch (c.status) {
    case "sovereign":
      return "País soberano";
    case "limited":
      return "Reconocimiento limitado";
    case "constituent":
      return `Nación ${c.parent}`;
    case "territory":
      return `Territorio ${c.parent}`;
  }
}

type Row = [code: string, name: string, capital: string | null];
type TerritoryRow = [code: string, name: string, capital: string | null, parent: string];

const LIMITED = new Set(["xk", "ps", "tw"]);
const CONSTITUENT = new Set(["gb-eng", "gb-sct", "gb-wls", "gb-nir"]);

// Sovereign states first, then territories, grouped by continent.
const SOVEREIGN: Record<Continent, Row[]> = {
  África: [
    ["dz", "Argelia", "Argel"],
    ["ao", "Angola", "Luanda"],
    ["bj", "Benín", "Porto Novo"],
    ["bw", "Botsuana", "Gaborone"],
    ["bf", "Burkina Faso", "Uagadugú"],
    ["bi", "Burundi", "Gitega"],
    ["cv", "Cabo Verde", "Praia"],
    ["cm", "Camerún", "Yaundé"],
    ["td", "Chad", "Yamena"],
    ["km", "Comoras", "Moroni"],
    ["ci", "Costa de Marfil", "Yamusukro"],
    ["eg", "Egipto", "El Cairo"],
    ["er", "Eritrea", "Asmara"],
    ["sz", "Esuatini", "Mbabane"],
    ["et", "Etiopía", "Adís Abeba"],
    ["ga", "Gabón", "Libreville"],
    ["gm", "Gambia", "Banjul"],
    ["gh", "Ghana", "Acra"],
    ["gn", "Guinea", "Conakri"],
    ["gq", "Guinea Ecuatorial", "Malabo"],
    ["gw", "Guinea-Bisáu", "Bisáu"],
    ["ke", "Kenia", "Nairobi"],
    ["ls", "Lesoto", "Maseru"],
    ["lr", "Liberia", "Monrovia"],
    ["ly", "Libia", "Trípoli"],
    ["mg", "Madagascar", "Antananarivo"],
    ["mw", "Malaui", "Lilongüe"],
    ["ml", "Malí", "Bamako"],
    ["ma", "Marruecos", "Rabat"],
    ["mu", "Mauricio", "Port Louis"],
    ["mr", "Mauritania", "Nuakchot"],
    ["mz", "Mozambique", "Maputo"],
    ["na", "Namibia", "Windhoek"],
    ["ne", "Níger", "Niamey"],
    ["ng", "Nigeria", "Abuya"],
    ["cf", "República Centroafricana", "Bangui"],
    ["cg", "República del Congo", "Brazzaville"],
    ["cd", "República Democrática del Congo", "Kinsasa"],
    ["rw", "Ruanda", "Kigali"],
    ["st", "Santo Tomé y Príncipe", "Santo Tomé"],
    ["sn", "Senegal", "Dakar"],
    ["sc", "Seychelles", "Victoria"],
    ["sl", "Sierra Leona", "Freetown"],
    ["so", "Somalia", "Mogadiscio"],
    ["za", "Sudáfrica", "Pretoria, Ciudad del Cabo y Bloemfontein"],
    ["sd", "Sudán", "Jartum"],
    ["ss", "Sudán del Sur", "Yuba"],
    ["tz", "Tanzania", "Dodoma"],
    ["tg", "Togo", "Lomé"],
    ["tn", "Túnez", "Túnez"],
    ["ug", "Uganda", "Kampala"],
    ["dj", "Yibuti", "Yibuti"],
    ["zm", "Zambia", "Lusaka"],
    ["zw", "Zimbabue", "Harare"],
  ],
  América: [
    ["ag", "Antigua y Barbuda", "Saint John's"],
    ["ar", "Argentina", "Buenos Aires"],
    ["bs", "Bahamas", "Nasáu"],
    ["bb", "Barbados", "Bridgetown"],
    ["bz", "Belice", "Belmopán"],
    ["bo", "Bolivia", "Sucre (constitucional) y La Paz (sede de gobierno)"],
    ["br", "Brasil", "Brasilia"],
    ["ca", "Canadá", "Ottawa"],
    ["cl", "Chile", "Santiago"],
    ["co", "Colombia", "Bogotá"],
    ["cr", "Costa Rica", "San José"],
    ["cu", "Cuba", "La Habana"],
    ["dm", "Dominica", "Roseau"],
    ["ec", "Ecuador", "Quito"],
    ["sv", "El Salvador", "San Salvador"],
    ["us", "Estados Unidos", "Washington D. C."],
    ["gd", "Granada", "Saint George's"],
    ["gt", "Guatemala", "Ciudad de Guatemala"],
    ["gy", "Guyana", "Georgetown"],
    ["ht", "Haití", "Puerto Príncipe"],
    ["hn", "Honduras", "Tegucigalpa"],
    ["jm", "Jamaica", "Kingston"],
    ["mx", "México", "Ciudad de México"],
    ["ni", "Nicaragua", "Managua"],
    ["pa", "Panamá", "Ciudad de Panamá"],
    ["py", "Paraguay", "Asunción"],
    ["pe", "Perú", "Lima"],
    ["do", "República Dominicana", "Santo Domingo"],
    ["kn", "San Cristóbal y Nieves", "Basseterre"],
    ["vc", "San Vicente y las Granadinas", "Kingstown"],
    ["lc", "Santa Lucía", "Castries"],
    ["sr", "Surinam", "Paramaribo"],
    ["tt", "Trinidad y Tobago", "Puerto España"],
    ["uy", "Uruguay", "Montevideo"],
    ["ve", "Venezuela", "Caracas"],
  ],
  Asia: [
    ["af", "Afganistán", "Kabul"],
    ["sa", "Arabia Saudita", "Riad"],
    ["am", "Armenia", "Ereván"],
    ["az", "Azerbaiyán", "Bakú"],
    ["bh", "Baréin", "Manama"],
    ["bd", "Bangladés", "Daca"],
    ["mm", "Birmania (Myanmar)", "Naipyidó"],
    ["bn", "Brunéi", "Bandar Seri Begawan"],
    ["bt", "Bután", "Timbu"],
    ["kh", "Camboya", "Nom Pen"],
    ["qa", "Catar", "Doha"],
    ["cn", "China", "Pekín"],
    ["kp", "Corea del Norte", "Pionyang"],
    ["kr", "Corea del Sur", "Seúl"],
    ["ae", "Emiratos Árabes Unidos", "Abu Dabi"],
    ["ph", "Filipinas", "Manila"],
    ["ge", "Georgia", "Tiflis"],
    ["in", "India", "Nueva Delhi"],
    ["id", "Indonesia", "Yakarta"],
    ["iq", "Irak", "Bagdad"],
    ["ir", "Irán", "Teherán"],
    ["il", "Israel", "Jerusalén"],
    ["jp", "Japón", "Tokio"],
    ["jo", "Jordania", "Amán"],
    ["kz", "Kazajistán", "Astaná"],
    ["kg", "Kirguistán", "Biskek"],
    ["kw", "Kuwait", "Ciudad de Kuwait"],
    ["la", "Laos", "Vientián"],
    ["lb", "Líbano", "Beirut"],
    ["my", "Malasia", "Kuala Lumpur"],
    ["mv", "Maldivas", "Malé"],
    ["mn", "Mongolia", "Ulán Bator"],
    ["np", "Nepal", "Katmandú"],
    ["om", "Omán", "Mascate"],
    ["pk", "Pakistán", "Islamabad"],
    ["ps", "Palestina", "Jerusalén Este (proclamada); Ramala (sede de gobierno)"],
    ["sg", "Singapur", "Singapur"],
    ["sy", "Siria", "Damasco"],
    ["lk", "Sri Lanka", "Sri Jayawardenepura Kotte"],
    ["th", "Tailandia", "Bangkok"],
    ["tw", "Taiwán", "Taipéi"],
    ["tj", "Tayikistán", "Dusambé"],
    ["tl", "Timor Oriental", "Dili"],
    ["tm", "Turkmenistán", "Asjabad"],
    ["tr", "Turquía", "Ankara"],
    ["uz", "Uzbekistán", "Taskent"],
    ["vn", "Vietnam", "Hanói"],
    ["ye", "Yemen", "Saná"],
  ],
  Europa: [
    ["al", "Albania", "Tirana"],
    ["de", "Alemania", "Berlín"],
    ["ad", "Andorra", "Andorra la Vieja"],
    ["at", "Austria", "Viena"],
    ["be", "Bélgica", "Bruselas"],
    ["by", "Bielorrusia", "Minsk"],
    ["ba", "Bosnia y Herzegovina", "Sarajevo"],
    ["bg", "Bulgaria", "Sofía"],
    ["cy", "Chipre", "Nicosia"],
    ["va", "Ciudad del Vaticano", "Ciudad del Vaticano"],
    ["hr", "Croacia", "Zagreb"],
    ["dk", "Dinamarca", "Copenhague"],
    ["sk", "Eslovaquia", "Bratislava"],
    ["si", "Eslovenia", "Liubliana"],
    ["es", "España", "Madrid"],
    ["ee", "Estonia", "Tallin"],
    ["fi", "Finlandia", "Helsinki"],
    ["fr", "Francia", "París"],
    ["gr", "Grecia", "Atenas"],
    ["hu", "Hungría", "Budapest"],
    ["ie", "Irlanda", "Dublín"],
    ["is", "Islandia", "Reikiavik"],
    ["it", "Italia", "Roma"],
    ["xk", "Kosovo", "Pristina"],
    ["lv", "Letonia", "Riga"],
    ["li", "Liechtenstein", "Vaduz"],
    ["lt", "Lituania", "Vilna"],
    ["lu", "Luxemburgo", "Luxemburgo"],
    ["mk", "Macedonia del Norte", "Skopie"],
    ["mt", "Malta", "La Valeta"],
    ["md", "Moldavia", "Chisináu"],
    ["mc", "Mónaco", "Mónaco"],
    ["me", "Montenegro", "Podgorica"],
    ["no", "Noruega", "Oslo"],
    ["nl", "Países Bajos", "Ámsterdam"],
    ["pl", "Polonia", "Varsovia"],
    ["pt", "Portugal", "Lisboa"],
    ["gb", "Reino Unido", "Londres"],
    ["cz", "República Checa", "Praga"],
    ["ro", "Rumania", "Bucarest"],
    ["ru", "Rusia", "Moscú"],
    ["sm", "San Marino", "San Marino"],
    ["rs", "Serbia", "Belgrado"],
    ["se", "Suecia", "Estocolmo"],
    ["ch", "Suiza", "Berna"],
    ["ua", "Ucrania", "Kiev"],
  ],
  Oceanía: [
    ["au", "Australia", "Canberra"],
    ["fj", "Fiyi", "Suva"],
    ["mh", "Islas Marshall", "Majuro"],
    ["sb", "Islas Salomón", "Honiara"],
    ["ki", "Kiribati", "Tarawa Sur"],
    ["fm", "Micronesia", "Palikir"],
    ["nr", "Nauru", "Yaren"],
    ["nz", "Nueva Zelanda", "Wellington"],
    ["pw", "Palaos", "Ngerulmud"],
    ["pg", "Papúa Nueva Guinea", "Port Moresby"],
    ["ws", "Samoa", "Apia"],
    ["to", "Tonga", "Nukualofa"],
    ["tv", "Tuvalu", "Funafuti"],
    ["vu", "Vanuatu", "Port Vila"],
  ],
  Antártida: [],
};

const UK = "del Reino Unido";
const FR = "de Francia";
const NL = "de los Países Bajos";
const US = "de Estados Unidos";
const AU = "de Australia";
const NZ = "de Nueva Zelanda";
const DK = "de Dinamarca";

// Territories whose flag is identical to their parent's (Bouvet, Svalbard,
// Heard and McDonald, French Saint Martin, US Minor Outlying Islands) are left
// out: there is no way to tell them apart from the flag alone.
const TERRITORIES: Record<Continent, TerritoryRow[]> = {
  África: [
    ["re", "Reunión", "Saint-Denis", FR],
    ["yt", "Mayotte", "Mamoudzou", FR],
    ["eh", "Sáhara Occidental", "El Aaiún", "en disputa"],
    ["sh", "Santa Elena, Ascensión y Tristán de Acuña", "Jamestown", UK],
  ],
  América: [
    ["ai", "Anguila", "The Valley", UK],
    ["aw", "Aruba", "Oranjestad", NL],
    ["bm", "Bermudas", "Hamilton", UK],
    ["bq", "Caribe Neerlandés", "Kralendijk", NL],
    ["cw", "Curazao", "Willemstad", NL],
    ["gl", "Groenlandia", "Nuuk", DK],
    ["gp", "Guadalupe", "Basse-Terre", FR],
    ["gf", "Guayana Francesa", "Cayena", FR],
    ["ky", "Islas Caimán", "George Town", UK],
    ["fk", "Islas Malvinas", "Puerto Argentino / Stanley", "en disputa"],
    ["tc", "Islas Turcas y Caicos", "Cockburn Town", UK],
    ["vg", "Islas Vírgenes Británicas", "Road Town", UK],
    ["vi", "Islas Vírgenes de los Estados Unidos", "Charlotte Amalie", US],
    ["mq", "Martinica", "Fort-de-France", FR],
    ["ms", "Montserrat", "Brades (de facto)", UK],
    ["pr", "Puerto Rico", "San Juan", US],
    ["bl", "San Bartolomé", "Gustavia", FR],
    ["sx", "San Martín", "Philipsburg", NL],
    ["pm", "San Pedro y Miquelón", "San Pedro", FR],
  ],
  Asia: [
    ["hk", "Hong Kong", "Hong Kong", "de China"],
    ["mo", "Macao", "Macao", "de China"],
    ["io", "Territorio Británico del Océano Índico", "Diego García", UK],
  ],
  Europa: [
    ["gb-eng", "Inglaterra", "Londres", UK],
    ["gb-sct", "Escocia", "Edimburgo", UK],
    ["gb-wls", "Gales", "Cardiff", UK],
    ["gb-nir", "Irlanda del Norte", "Belfast", UK],
    ["ax", "Åland", "Mariehamn", "de Finlandia"],
    ["gi", "Gibraltar", "Gibraltar", UK],
    ["gg", "Guernsey", "Saint Peter Port", UK],
    ["im", "Isla de Man", "Douglas", UK],
    ["fo", "Islas Feroe", "Tórshavn", DK],
    ["je", "Jersey", "Saint Helier", UK],
  ],
  Oceanía: [
    ["cx", "Isla de Navidad", "Flying Fish Cove", AU],
    ["nf", "Isla Norfolk", "Kingston", AU],
    ["cc", "Islas Cocos", "West Island", AU],
    ["ck", "Islas Cook", "Avarua", NZ],
    ["mp", "Islas Marianas del Norte", "Saipán", US],
    ["pn", "Islas Pitcairn", "Adamstown", UK],
    ["gu", "Guam", "Hagåtña", US],
    ["nu", "Niue", "Alofi", NZ],
    ["nc", "Nueva Caledonia", "Numea", FR],
    ["pf", "Polinesia Francesa", "Papeete", FR],
    ["as", "Samoa Americana", "Pago Pago", US],
    ["tk", "Tokelau", null, NZ],
    ["wf", "Wallis y Futuna", "Mata-Utu", FR],
  ],
  Antártida: [
    ["aq", "Antártida", null, "bajo el Tratado Antártico"],
    ["gs", "Islas Georgias del Sur y Sandwich del Sur", "King Edward Point", UK],
    ["tf", "Tierras Australes y Antárticas Francesas", null, FR],
  ],
};

export const COUNTRIES: Country[] = CONTINENTS.flatMap((continent) => [
  ...SOVEREIGN[continent].map(([code, name, capital]): Country => ({
    code,
    name,
    capital,
    continent,
    status: LIMITED.has(code) ? "limited" : "sovereign",
  })),
  ...TERRITORIES[continent].map(([code, name, capital, parent]): Country => ({
    code,
    name,
    capital,
    continent,
    status: CONSTITUENT.has(code) ? "constituent" : "territory",
    parent,
  })),
]);

export const flagUrl = (code: string) => `https://flagcdn.com/${code}.svg`;
