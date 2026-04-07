const CSV_DATA = `
Zone,Site,Country,Volume,BP,DA,UT,MT,MG,MDM,PP,QL,SF,Score
MAZ,Zacatecas,Mexico,21490232,4,2,0,2,2,2,2,2,2,2.00
MAZ,Tocancipa,Colombia,11877306,4,2,0,2,2,2,2,2,2,2.00
MAZ,Mexico APAN,Mexico,11762721,4,2,0,2,2,2,2,2,2,2.00
NAZ,St. Louis,USA,11625432,2,2,0,0,2,2,1,4,0,1.00
SAZ,Rio de Janeiro,Brazil,11195323,2,2,0,2,2,2,2,2,2,2.00
MAZ,Tuxtepec,Mexico,11116745,4,2,0,2,2,2,2,2,2,2.00
NAZ,Houston,USA,10631547,2,2,0,0,2,2,1,4,0,1.00
MAZ,Mexico Plant,Mexico,10452776,4,2,0,2,2,2,2,2,2,2.00
SAZ,Sete Lagoas,Brazil,9710192,2,2,0,2,2,2,2,2,2,2.00
APAC,Putian,China,9361612,0,2,0,2,2,4,0,4,2,2.00
AFR,Accra,Ghana,8268546,4,2,0,0,2,4,0,4,4,2.00
MAZ,San Pedro Sula CSD,Honduras,8129123,4,2,0,2,2,2,2,2,2,2.00
NAZ,Jacksonville,USA,8093143,2,2,0,0,2,2,1,4,0,1.00
AFR,Alrode,South Africa,8069020,4,2,0,0,2,4,0,4,4,2.00
APAC,Foshan,China,7956210,0,2,0,2,2,4,0,4,2,2.00
SAZ,Pernambuco,Brazil,7763920,2,2,0,2,2,2,2,2,2,2.00
NAZ,Columbus,USA,7675003,2,2,0,0,2,2,1,4,2,1.00
MAZ,Ate,Peru,7547062,4,2,0,2,2,2,2,2,2,2.00
NAZ,Fort Collins,USA,7422385,2,2,0,0,2,2,1,4,0,1.00
NAZ,Baldwinsville,USA,7170161,2,2,0,0,2,2,1,4,0,1.00
NAZ,Los Angeles,USA,7146842,2,2,0,0,2,2,1,4,0,1.00
SAZ,Jundiai,Brazil,7004740,2,2,0,2,2,2,2,2,2,2.00
SAZ,Jacarei,Brazil,6971809,2,2,0,2,2,2,2,2,2,2.00
NAZ,Cartersville,USA,6927016,2,2,0,0,2,2,1,4,0,1.00
SAZ,Itapissuma,Brazil,6600077,2,2,0,2,2,2,2,2,2,2.00
SAZ,Uberlandia,Brazil,6182294,2,2,0,2,2,2,2,2,2,2.00
SAZ,Agudos,Brazil,6147209,2,2,0,2,2,2,2,2,2,2.00
EUR,Magor,United Kingdom,6011596,4,2,0,1,0,2,2,4,2,1.00
NAZ,Williamsburg,USA,5926289,2,2,0,0,2,2,1,4,0,1.00
SAZ,Jaguariuna,Brazil,5877702,2,2,0,2,2,2,2,2,2,2.00
SAZ,Pirai,Brazil,5571090,2,2,0,2,2,2,2,2,2,2.00
APAC,Icheon,South Korea,5400783,4,2,0,0,2,4,0,4,0,2.00
EUR,Leuven,Belgium,5223871,4,2,0,1,0,2,2,4,0,1.00
AFR,Prospecton,South Africa,5233078,4,2,0,0,2,4,0,4,4,2.00
SAZ,Viamao,Brazil,4937776,2,2,0,2,2,2,2,2,2,2.00
SAZ,Camacari,Brazil,4936812,2,2,0,2,2,2,2,2,2,2.00
AFR,Inanda,South Africa,4704538,1,2,2,2,2,2,2,2,2,2.00
SAZ,Aquiraz,Brazil,4703919,2,2,0,2,2,2,2,2,2,2.00
SAZ,Sur,Argentina,4688943,2,2,0,2,2,2,2,2,2,2.00
SAZ,Quilmes,Argentina,4654841,2,2,0,2,2,2,2,2,2,2.00
MAZ,Santo Domingo,Dominican Republic,4541107,4,2,0,2,2,2,2,2,2,2.00
MAZ,Ind La Constancia Water,El Salvador,4427409,4,0,0,2,2,0,2,2,2,2.00
MAZ,Guadalajara,Mexico,4349004,4,2,0,2,2,2,2,2,2,2.00
MAZ,Boyaca,Colombia,4276591,4,2,0,2,2,2,2,2,2,2.00
EUR,Bremen,Germany,4255902,4,2,0,1,0,2,2,4,0,1.00
MAZ,Barranquilla,Colombia,4200971,4,2,0,2,2,2,2,2,2,2.00
MAZ,Ind La Constancia CSD,El Salvador,4153127,0,0,0,2,2,0,0,1,2,1.00
SAZ,Ponta Grossa,Brazil,4083690,2,2,0,2,2,2,2,2,2,2.00
AFR,Newlands,South Africa,4073762,4,2,0,0,2,4,0,4,4,2.00
EUR,Samlesbury,United Kingdom,3932263,4,2,0,1,0,2,2,4,2,1.00
MAZ,Medellin,Colombia,3930434,4,2,0,2,2,2,2,2,2,2.00
APAC,Wuhan,China,3737412,0,2,0,2,2,4,0,4,2,2.00
SAZ,Ypane,Paraguay,3596873,2,2,0,2,2,2,2,2,2,2.00
EUR,Jupille,Belgium,3593528,4,2,0,1,0,2,2,4,0,1.00
SAZ,Sergipe,Brazil,3552437,2,2,0,2,2,2,2,2,2,2.00
SAZ,Zarate,Argentina,3447034,2,2,0,2,2,2,2,2,2,2.00
SAZ,Quilmes 2,Argentina,3309284,2,2,2,2,2,2,2,2,2,2.00
SAZ,Equatorial,Brazil,3279525,2,2,0,2,2,2,2,2,2,2.00
APAC,Jinshibai,China,3266999,0,2,0,0,2,4,0,4,2,2.00
MAZ,Guayaquil,Ecuador,3257552,4,2,0,2,2,2,2,2,2,2.00
SAZ,Cachoeiras,Brazil,3237498,2,2,2,2,2,2,2,2,2,2.00
APAC,Shiliang,China,3112540,0,2,0,0,2,4,0,4,2,2.00
AFR,Chamdor,South Africa,3073102,4,2,0,0,2,4,0,4,4,2.00
MAZ,Motupe,Peru,3072045,4,2,0,2,2,2,2,2,2,2.00
NAZ,London,Canada,3041422,2,2,0,0,2,2,0,4,2,2.00
APAC,Gwangju,South Korea,2968668,4,2,0,0,2,4,0,4,0,2.00
APAC,Cheongwon,South Korea,2959517,0,2,0,0,2,4,0,2,0,2.00
APAC,Harbin 2,China,2897663,0,2,0,2,2,4,0,4,2,2.00
SAZ,Lages,Brazil,2869908,2,2,0,2,2,2,2,2,2,2.00
MAZ,Merida,Mexico,2848134,4,2,0,2,2,2,2,2,2,2.00
APAC,Ziyang,China,2844535,0,2,0,0,2,4,0,4,2,2.00
AFR,Dar es Salaam,Tanzania,2805741,2,2,0,0,2,4,0,0,4,0.00
MAZ,Torreon,Mexico,2797436,4,2,0,2,2,2,2,2,2,2.00
APAC,Suqian,China,2762633,2,2,0,2,2,4,0,4,2,2.00
APAC,Wenzhou,China,2750215,2,2,0,2,2,4,0,4,2,2.00
SAZ,Guarulhos,Brazil,2698383,2,2,0,2,2,2,2,2,2,2.00
SAZ,Cuiaba,Brazil,2613994,2,2,0,2,2,2,2,2,2,2.00
NAZ,Montreal,Canada,2612694,2,2,0,0,2,2,0,4,0,2.00
SAZ,Teresina,Brazil,2494659,2,2,0,2,2,2,2,2,2,2.00
SAZ,Sapucaia,Brazil,2392284,2,2,0,2,2,2,2,2,2,2.00
SAZ,Macacu,Brazil,2369745,2,2,0,2,2,2,2,2,2,2.00
MAZ,Quito,Ecuador,2252976,4,2,0,2,2,2,2,2,2,2.00
AFR,Gateway,Nigeria,2251714,4,2,0,0,2,4,3,4,4,2.00
APAC,Nanchang 1,China,2114522,2,3,3,2,2,3,2,2,2,2.00
MAZ,San Pedro Sula,Honduras,2053369,4,2,0,2,2,2,2,2,2,2.00
EUR,Munich,Germany,2041558,4,2,0,1,0,2,2,4,0,1.00
SAZ,Manaus,Brazil,2041326,2,2,0,2,2,2,2,2,2,2.00
APAC,Nanning,China,1940444,0,2,0,0,2,0,0,4,2,2.00
MAZ,Bucaramanga,Colombia,1936433,4,2,0,2,2,2,2,2,2,2.00
APAC,Xinxiang,China,1920884,2,2,0,2,2,4,0,4,2,2.00
EUR,Wernigerode,Germany,1897050,4,2,0,0,0,2,2,4,0,2.00
MAZ,San Juan,Peru,1883825,4,2,0,2,2,2,2,2,2,2.00
APAC,Zhangzhou,China,1835676,0,2,0,0,2,4,0,4,2,2.00
APAC,Tangshan 2,China,1804951,0,2,0,0,2,4,0,4,2,2.00
MAZ,Ind La Constancia,El Salvador,1731889,4,2,0,2,2,2,2,2,2,2.00
MAZ,Panama,Panama,1707242,4,2,0,2,2,2,2,2,2,2.00
SAZ,Mendoza,Argentina,1676116,2,2,0,2,2,2,2,2,2,2.00
AFR,Ibhayi,South Africa,1666051,4,2,0,0,2,4,0,4,4,2.00
AFR,Onitsha,Nigeria,1611235,4,2,0,0,2,4,3,4,4,2.00
MAZ,Arequipa,Peru,1606665,4,2,0,2,2,2,2,2,2,2.00
AFR,Marracuene,Mozambique,1588950,4,2,0,0,2,4,0,4,4,2.00
SAZ,Santa Cruz BO,Bolivia,1555839,0,0,0,2,0,0,1,0,0,0.00
MAZ,Armenia,Colombia,1512540,2,2,2,2,2,2,2,2,2,2.00
AFR,Jinja,Uganda,1469800,0,2,0,0,2,4,0,0,4,0.00
AFR,Ilesa,Nigeria,1435063,4,2,0,0,2,4,3,4,4,2.00
NAZ,Edmonton,Canada,1365943,2,2,0,0,2,2,0,4,0,2.00
AFR,Lusaka,Zambia,1365641,0,2,0,0,2,4,0,0,4,0.00
APAC,Baoding,China,1352928,0,2,0,0,2,4,0,4,2,2.00
SAZ,Corrientes,Argentina,1352486,2,2,0,2,2,2,2,2,2,2.00
MAZ,Hato Nuevo,Dominican Republic,1345154,4,2,0,2,2,2,2,2,2,2.00
SAZ,El Alto,Bolivia,1296070,2,2,0,2,2,2,2,2,2,2.00
SAZ,Curitibana,Brazil,1286150,2,2,0,2,2,2,2,2,2,2.00
AFR,Maputo,Mozambique,1285760,0,2,0,0,2,4,0,0,4,0.00
AFR,Port Harcourt,Nigeria,1274513,4,2,0,0,2,4,3,4,4,2.00
APAC,Aurangabad,India,1271625,0,0,0,0,2,0,0,2,0,2.00
AFR,Ilorin,Nigeria,1331782,1,2,2,2,2,2,2,2,2,1.00
EUR,Dommelen,Netherlands,1382165,4,2,0,1,0,2,2,4,0,1.00
SAZ,Tucuman,Argentina,1254087,2,2,2,2,2,2,2,2,2,2.00
EUR,Hoegaarden,Belgium,1154717,4,2,0,1,0,2,2,4,0,1.00
APAC,Jinzhou,China,1110825,0,2,0,0,2,4,0,4,2,2.00
APAC,Mysore,India,1075882,0,2,0,0,2,4,0,2,0,2.00
MAZ,Cusco,Peru,1068857,4,2,0,2,2,2,2,2,2,2.00
APAC,Nantong,China,1038747,0,2,0,0,2,4,0,4,2,2.00
SAZ,Cochabamba,Bolivia,1030936,2,2,0,2,2,2,2,2,2,2.00
APAC,Sonipat,India,1016449,0,0,0,0,2,0,0,2,0,2.00
SAZ,Huachipa,Peru,987693,0,0,0,0,2,0,0,2,2,2.00
AFR,Mbarara,Uganda,979938,0,2,0,0,2,4,0,0,4,0.00
APAC,Jishui,China,937258,0,2,0,0,2,4,0,4,2,2.00
AFR,Nampula,Mozambique,628699,4,2,0,0,2,4,0,4,4,2.00
APAC,Mudanjiang,China,764171,0,2,0,0,2,0,0,4,2,2.00
SAZ,Cordoba,Argentina,745018,2,2,0,2,2,2,2,2,2,2.00
MAZ,Mazatlan,Mexico,727620,4,2,0,2,2,2,2,2,2,2.00
SAZ,La Paz,Bolivia,712689,2,2,0,2,2,2,2,2,2,2.00
AFR,Mwanza,Tanzania,1058574,2,2,0,0,2,4,0,0,4,0.00
AFR,Mbeya,Tanzania,757159,2,2,0,0,2,4,0,0,4,0.00
APAC,Hyderabad,India,649833,0,0,0,0,0,0,0,2,0,2.00
APAC,Charminar,India,636120,0,0,0,0,0,0,0,2,0,2.00
APAC,Kunming,China,635021,2,2,0,0,2,4,0,4,2,2.00
AFR,Polokwane,South Africa,1630622,4,2,0,0,2,4,0,4,4,2.00
EUR,Las Palmas,Spain,609797,4,2,0,0,0,2,2,4,0,2.00
SAZ,Huari,Bolivia,603883,2,2,0,2,2,2,2,2,2,2.00
NAZ,Halifax,Canada,581503,2,2,0,0,2,2,0,4,0,2.00
AFR,Rosslyn2,South Africa,571761,2,2,2,2,2,2,2,2,2,2.00
APAC,Jiamusi,China,568202,0,2,0,0,2,4,0,4,2,2.00
APAC,Wugang,China,563192,0,2,0,0,2,4,0,4,2,2.00
APAC,Daqing,China,561401,2,3,3,2,3,3,2,2,3,2.00
APAC,Yingkou,China,557877,0,2,0,0,2,4,0,4,2,2.00
APAC,Xinyang,China,554297,0,2,0,0,2,0,0,4,2,2.00
NAZ,Creston,Canada,546005,2,2,0,0,2,2,0,4,0,2.00
APAC,HBP,Vietnam,466492,1,2,2,2,2,2,1,2,2,1.00
EUR,Issum,Germany,448881,4,2,0,0,0,2,2,4,0,2.00
APAC,Rohtak,India,402172,0,0,0,0,0,0,0,0,0,0.00
SAZ,Santa Cruz SABM,Bolivia,396645,0,0,0,0,0,0,1,0,0,0.00
APAC,MyPhuoc,Vietnam,379245,0,2,0,0,2,4,0,2,0,2.00
AFR,Eswatini,Swaziland,354230,0,2,0,0,2,4,0,0,4,0.00
MAZ,Zacapa,Guatemala,326265,4,2,0,2,2,2,2,2,2,2.00
AFR,Namibia,Namibia,310889,4,2,0,0,2,4,0,4,4,2.00
APAC,Meerut,India,170263,0,0,0,0,2,0,0,2,0,2.00
AFR,Kgalagadi,Botswana,797731,0,2,0,0,2,4,0,0,4,0.00
AFR,Lesotho,Lesotho,422520,0,2,0,0,2,4,0,0,4,0.00
AFR,Rosslyn,South Africa,9152428,4,2,0,0,2,4,0,4,4,2.00
AFR,Beira,Mozambique,6286999,0,2,0,0,2,4,0,0,4,0.00
`;