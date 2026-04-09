// Domain, zone, and color constants

export const DOMAINS = [
  "Total Global","Data Acquisition","MasterData Management","Brewing Performance",
  "Packaging Performance","Quality","Maintenance","Safety","Management","Utilities"
];

export const ZONES = ["AFR","SAZ","MAZ","NAZ","EUR","APAC"];

export const ZONE_COLORS: Record<string,{bg:string;text:string;border:string;dot:string;darkBg:string;darkText:string}> = {
  AFR:  {bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',  dot:'#D97706',darkBg:'bg-amber-900/30',  darkText:'text-amber-300'},
  SAZ:  {bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200',dot:'#059669',darkBg:'bg-emerald-900/30',darkText:'text-emerald-300'},
  MAZ:  {bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',   dot:'#2563EB',darkBg:'bg-blue-900/30',   darkText:'text-blue-300'},
  NAZ:  {bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200', dot:'#7C3AED',darkBg:'bg-purple-900/30', darkText:'text-purple-300'},
  EUR:  {bg:'bg-pink-50',    text:'text-pink-700',    border:'border-pink-200',   dot:'#DB2777',darkBg:'bg-pink-900/30',   darkText:'text-pink-300'},
  APAC: {bg:'bg-orange-50',  text:'text-orange-700',  border:'border-orange-200', dot:'#EA580C',darkBg:'bg-orange-900/30', darkText:'text-orange-300'},
};

export const GHQ_TOTALS: Record<string,Record<string,number>> = {
  "Management":            {AFR:100,APAC:0, EUR:0,  MAZ:65, NAZ:100,SAZ:100,Global:63},
  "Quality":               {AFR:4,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:0,  Global:1 },
  "Packaging Performance": {AFR:0,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:2,  Global:1 },
  "Brewing Performance":   {AFR:14, APAC:11,EUR:0,  MAZ:0,  NAZ:100,SAZ:100,Global:39},
  "Safety":                {AFR:75, APAC:0, EUR:17, MAZ:23, NAZ:14, SAZ:100,Global:45},
  "Maintenance":           {AFR:0,  APAC:22,EUR:50, MAZ:0,  NAZ:0,  SAZ:98, Global:33},
  "Data Acquisition":      {AFR:100,APAC:16,EUR:100,MAZ:90, NAZ:100,SAZ:100,Global:79},
  "MasterData Management": {AFR:100,APAC:76,EUR:100,MAZ:90, NAZ:100,SAZ:100,Global:93},
  "Utilities":             {AFR:0,  APAC:3, EUR:42, MAZ:0,  NAZ:7,  SAZ:0,  Global:4 },
  "Total Global":          {AFR:0,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:0,  Global:0 },
};

export const GLOBAL_STATS: Record<string,Record<string,{dist:number[];avg:string;total:number}>> = {
  "Total Global":{"AFR":{dist:[50,0,50,0,0],avg:"1.93",total:28},"SAZ":{dist:[7,3,90,0,0],avg:"1.98",total:41},"MAZ":{dist:[6,4,90,0,0],avg:"1.96",total:31},"NAZ":{dist:[0,50,50,0,0],avg:"1.83",total:14},"EUR":{dist:[0,100,0,0,0],avg:"1.72",total:12},"APAC":{dist:[27,19,54,0,0],avg:"2.00",total:37},"Global":{dist:[18,17,65,0,0],avg:"1.94",total:163}},
  "Data Acquisition":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[6,0,94,0,0],avg:"1.87",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[16,0,16,68,0],avg:"2.35",total:37},"Global":{dist:[5,0,80,15,0],avg:"2.06",total:163}},
  "MasterData Management":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[6,0,94,0,0],avg:"1.87",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[16,0,16,68,0],avg:"2.35",total:37},"Global":{dist:[5,0,80,15,0],avg:"2.06",total:163}},
  "Utilities":{"AFR":{dist:[0,32,68,0,0],avg:"1.68",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,50,50,0,0],avg:"1.50",total:14},"EUR":{dist:[0,50,50,0,0],avg:"1.50",total:12},"APAC":{dist:[0,24,8,68,0],avg:"2.43",total:37},"Global":{dist:[0,19,66,15,0],avg:"1.96",total:163}},
  "Brewing Performance":{"AFR":{dist:[0,32,14,54,0],avg:"2.21",total:28},"SAZ":{dist:[7,0,93,0,0],avg:"1.85",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,92,8,0,0],avg:"1.08",total:12},"APAC":{dist:[27,5,68,0,0],avg:"1.41",total:37},"Global":{dist:[8,17,66,9,0],avg:"1.77",total:163}},
  "Packaging Performance":{"AFR":{dist:[50,0,50,0,0],avg:"1.00",total:28},"SAZ":{dist:[0,2,98,0,0],avg:"1.98",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[27,19,54,0,0],avg:"1.27",total:37},"Global":{dist:[15,8,77,0,0],avg:"1.63",total:163}},
  "Quality":{"AFR":{dist:[0,4,43,54,0],avg:"2.50",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,3,97,0,0],avg:"1.97",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,8,92,0,0],avg:"1.92",total:12},"APAC":{dist:[8,19,73,0,0],avg:"1.65",total:37},"Global":{dist:[2,9,80,9,0],avg:"1.96",total:163}},
  "Maintenance":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[0,19,81,0,0],avg:"1.81",total:37},"Global":{dist:[0,4,96,0,0],avg:"1.96",total:163}},
  "Safety":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[0,19,14,67,0],avg:"2.49",total:37},"Global":{dist:[0,4,80,16,0],avg:"2.11",total:163}},
  "Management":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,6,94,0,0],avg:"1.94",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,100,0,0,0],avg:"1.00",total:12},"APAC":{dist:[19,5,8,68,0],avg:"2.24",total:37},"Global":{dist:[4,10,71,15,0],avg:"1.97",total:163}},
};

// GLOBAL_KEYS: identifies which coveredBy keys map to Global products (per domain)
// Appears in 3 places in App.tsx — must stay in sync
export const GLOBAL_KEYS: Record<string, string[]> = {
  BP:  ['brewing performance','production order'],
  DA:  ['soda etl','soda vision','soda 1.0'],
  MT:  ['apac - sap pm','eur - sap pm','maz - sap pm','naz - sap pm','saz - sap pm','max wo'],
  MG:  ['acadia','eureka','ial','splan'],
  MDM: ['soda mdm'],
  PP:  ['lms','traksys lms'],
  QL:  ['sensory one','pts portal','tracegains'],
  SF:  ['guardian'],
  UT:  [],
};
