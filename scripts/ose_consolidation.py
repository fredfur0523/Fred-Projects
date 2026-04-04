#!/usr/bin/env python3
"""
OSE Consolidation Script
========================
Matches 172 Databricks brewery plants to VPO/Tech JSON sites,
calculates OSE = ΣEPT/ΣOST and GLY = ΣEPT/ΣST per plant,
then aggregates by zone and bundle.

Output: /home/fredfur/projects/coverage-dashboard/docs/vpo_tech_data_ose_correct.json
"""

import json
import difflib
import re
from datetime import date
from pathlib import Path

# ─── Databricks data (172 plants) ───────────────────────────────────────────
DATABRICKS_PLANTS = [
  {"zone": "AFR", "plant": "Accra Beer", "EPT": 7597.370000000001, "ST": 12357.026666662998, "OST": 25031.1666667, "volume_hL": 1256180.18},
  {"zone": "AFR", "plant": "Alrode Beer", "EPT": 25457.08680726, "ST": 37515.150098221, "OST": 48895.816666767, "volume_hL": 8088631.94},
  {"zone": "AFR", "plant": "Arusha", "EPT": 7996.5199999999995, "ST": 9439.39333331, "OST": 12592.401333400001, "volume_hL": 875300.86},
  {"zone": "AFR", "plant": "Beira", "EPT": 4990.86, "ST": 6812.8399999700005, "OST": 8126.316666633999, "volume_hL": 658551.1900000001},
  {"zone": "AFR", "plant": "Chamdor", "EPT": 14683.507675449999, "ST": 24167.483052907, "OST": 32803.45000004, "volume_hL": 3013607.3627875},
  {"zone": "AFR", "plant": "Dar es Salaam", "EPT": 16283.320000000002, "ST": 19914.506666609996, "OST": 21922.250000081996, "volume_hL": 1495046.5504},
  {"zone": "AFR", "plant": "Eswatini", "EPT": 2868.4700000000003, "ST": 3427.4466666629996, "OST": 3874.7340001, "volume_hL": 353331.02999999997},
  {"zone": "AFR", "plant": "Gateway Brewery", "EPT": 11006.94, "ST": 14122.039333334998, "OST": 19594.934666760004, "volume_hL": 2250411.99},
  {"zone": "AFR", "plant": "Ibhayi", "EPT": 9260.6557619, "ST": 14588.983235618001, "OST": 17481.616666666003, "volume_hL": 2844091.13},
  {"zone": "AFR", "plant": "Ilesa", "EPT": 12475.419999999998, "ST": 15676.576666647998, "OST": 22174.202500190004, "volume_hL": 1435062.8900000001},
  {"zone": "AFR", "plant": "Jinja Beer", "EPT": 9080.52, "ST": 11334.998166662, "OST": 16414.4173334, "volume_hL": 1466663.8199999998},
  {"zone": "AFR", "plant": "Kgalagadi Beer", "EPT": 6850.2, "ST": 12643.619999980001, "OST": 24174.083333410003, "volume_hL": 794156.8600000002},
  {"zone": "AFR", "plant": "Lesotho Beer", "EPT": 4911.87, "ST": 5911.359999994001, "OST": 5976.9475, "volume_hL": 422040.68},
  {"zone": "AFR", "plant": "Lusaka Beer", "EPT": 7986.87, "ST": 11272.78999996, "OST": 23162.1651668, "volume_hL": 1365049.7951999998},
  {"zone": "AFR", "plant": "Maputo", "EPT": 13228.239999999998, "ST": 20406.610000054, "OST": 25792.800000003, "volume_hL": 1066266.54},
  {"zone": "AFR", "plant": "Marracuene", "EPT": 3574.0499999999997, "ST": 5716.226666741999, "OST": 8432.05000001, "volume_hL": 1588950.332},
  {"zone": "AFR", "plant": "Mbarara", "EPT": 5169.21, "ST": 6104.426166667, "OST": 7736.08999993, "volume_hL": 979937.6699999999},
  {"zone": "AFR", "plant": "Mbeya", "EPT": 6658.120000000001, "ST": 7785.883333330999, "OST": 8611.83333334, "volume_hL": 757158.989},
  {"zone": "AFR", "plant": "Mwanza", "EPT": 10049.58, "ST": 11873.376666627999, "OST": 14848.633333370002, "volume_hL": 1058574.31},
  {"zone": "AFR", "plant": "Namibia Beer", "EPT": 3476.16, "ST": 4468.763333368, "OST": 5169.8073334, "volume_hL": 307902.61},
  {"zone": "AFR", "plant": "Nampula", "EPT": 4754.29, "ST": 5596.673333334, "OST": 6022.033333400001, "volume_hL": 627566.32},
  {"zone": "AFR", "plant": "Ndola Beer", "EPT": 7988.259999999999, "ST": 10813.629333356, "OST": 15856.300000026, "volume_hL": 1281768.24},
  {"zone": "AFR", "plant": "Newlands", "EPT": 14232.742980969999, "ST": 19077.949905389, "OST": 22776.899999999998, "volume_hL": 4003655.522},
  {"zone": "AFR", "plant": "Onitsha", "EPT": 10350.699999999999, "ST": 13445.476666662002, "OST": 17750.290000063003, "volume_hL": 1611234.9500000002},
  {"zone": "AFR", "plant": "Polokwane", "EPT": 5224.4036865, "ST": 7869.81679283, "OST": 8760.0, "volume_hL": 1630621.715},
  {"zone": "AFR", "plant": "Port Harcourt", "EPT": 13465.31, "ST": 16633.802666637002, "OST": 19555.63833321, "volume_hL": 1274513.0},
  {"zone": "AFR", "plant": "Prospecton", "EPT": 16286.387125360001, "ST": 21635.046179079003, "OST": 29926.896666505996, "volume_hL": 5191811.552999999},
  {"zone": "AFR", "plant": "Rosslyn", "EPT": 28871.303311940002, "ST": 43803.90043343, "OST": 61425.533333226995, "volume_hL": 9060158.03},
  {"zone": "APAC", "plant": "Aurangabad", "EPT": 13214.344800000003, "ST": 15952.120899999998, "OST": 15976.9509, "volume_hL": 1261242.1513},
  {"zone": "APAC", "plant": "Baoding", "EPT": 5468.542399999999, "ST": 6315.1332999999995, "OST": 6465.5008, "volume_hL": 1352927.7023},
  {"zone": "APAC", "plant": "Celebrity", "EPT": 7073.837099999999, "ST": 8530.719700000001, "OST": 8531.5245, "volume_hL": 730721.9136},
  {"zone": "APAC", "plant": "Charminar", "EPT": 3571.4184999999998, "ST": 5274.1085, "OST": 5279.2415, "volume_hL": 639189.2659999998},
  {"zone": "APAC", "plant": "Cheongwon", "EPT": 12587.615600000001, "ST": 14732.987300000003, "OST": 15010.1001, "volume_hL": 2959517.6769999997},
  {"zone": "APAC", "plant": "Foshan", "EPT": 37968.32139999999, "ST": 43179.2762, "OST": 44942.3896, "volume_hL": 7956209.879899999},
  {"zone": "APAC", "plant": "Fosters", "EPT": 6366.864200000001, "ST": 7766.8345, "OST": 7904.5586, "volume_hL": 401947.9292},
  {"zone": "APAC", "plant": "Gwangju", "EPT": 8453.1167, "ST": 10997.233500000002, "OST": 11603.85, "volume_hL": 2845303.3601},
  {"zone": "APAC", "plant": "Harbin 2", "EPT": 12622.528699999997, "ST": 14525.449799999999, "OST": 14863.1472, "volume_hL": 2896457.1614},
  {"zone": "APAC", "plant": "Hyderabad", "EPT": 6489.275699999999, "ST": 7858.3693, "OST": 7857.4926, "volume_hL": 648391.3388},
  {"zone": "APAC", "plant": "Icheon", "EPT": 18341.800300000003, "ST": 21689.9178, "OST": 21951.7932, "volume_hL": 4407244.2656},
  {"zone": "APAC", "plant": "Jiamusi New", "EPT": 2278.8574000000003, "ST": 2624.3339, "OST": 2676.5005999999994, "volume_hL": 568202.436},
  {"zone": "APAC", "plant": "Jingmen", "EPT": 18745.000200000002, "ST": 21429.215599999996, "OST": 21429.215600000003, "volume_hL": 1810341.2369},
  {"zone": "APAC", "plant": "Jinshibai", "EPT": 21589.4509, "ST": 24709.2277, "OST": 25051.421099999996, "volume_hL": 3258358.3729999997},
  {"zone": "APAC", "plant": "Jinzhou", "EPT": 5804.881200000001, "ST": 6673.2667, "OST": 7281.500100000001, "volume_hL": 1108856.3904},
  {"zone": "APAC", "plant": "Jishui", "EPT": 3787.6827999999996, "ST": 4352.9586, "OST": 4448.3166, "volume_hL": 937257.9696},
  {"zone": "APAC", "plant": "Kunming", "EPT": 3229.6275, "ST": 3676.1315999999993, "OST": 3817.3039, "volume_hL": 635020.8072000002},
  {"zone": "APAC", "plant": "Meerut", "EPT": 2837.7129, "ST": 3226.3229, "OST": 3251.7434999999996, "volume_hL": 170263.0802},
  {"zone": "APAC", "plant": "Mudanjiang(New)", "EPT": 4084.1538000000005, "ST": 4707.1663, "OST": 4707.166300000001, "volume_hL": 764171.333},
  {"zone": "APAC", "plant": "MyPhuoc", "EPT": 4229.0318, "ST": 5029.5824, "OST": 5151.8899, "volume_hL": 364264.1691},
  {"zone": "APAC", "plant": "Mysore", "EPT": 8476.0008, "ST": 10698.5664, "OST": 10712.083, "volume_hL": 1048444.6151999999},
  {"zone": "APAC", "plant": "Nanchang 3", "EPT": 10373.1215, "ST": 11978.8388, "OST": 12037.5834, "volume_hL": 2174576.7479999997},
  {"zone": "APAC", "plant": "Nanning", "EPT": 4557.611400000001, "ST": 5206.272999999999, "OST": 5545.6664, "volume_hL": 1038746.7117000001},
  {"zone": "APAC", "plant": "Nantong", "EPT": 14677.7623, "ST": 16579.354399999997, "OST": 17429.5017, "volume_hL": 1940443.8235},
  {"zone": "APAC", "plant": "Ningbo", "EPT": 5984.354799999999, "ST": 6634.8974, "OST": 6650.4973, "volume_hL": 756467.1588},
  {"zone": "APAC", "plant": "Putian (New)", "EPT": 45708.136900000005, "ST": 51886.2587, "OST": 53799.3902, "volume_hL": 9343581.868499998},
  {"zone": "APAC", "plant": "Shiliang", "EPT": 23360.775299999998, "ST": 26401.3872, "OST": 26958.6658, "volume_hL": 3112539.6963000004},
  {"zone": "APAC", "plant": "Sonipat", "EPT": 6967.595200000001, "ST": 9111.955899999999, "OST": 9663.9167, "volume_hL": 1013562.6672000001},
  {"zone": "APAC", "plant": "Suqian", "EPT": 12963.2617, "ST": 14636.6464, "OST": 15236.0745, "volume_hL": 2762632.9205000005},
  {"zone": "APAC", "plant": "Tangshan 2", "EPT": 12578.666299999999, "ST": 14349.583400000001, "OST": 14928.0663, "volume_hL": 1804951.3547999999},
  {"zone": "APAC", "plant": "VSIP", "EPT": 4176.6574, "ST": 4931.649599999999, "OST": 5107.427900000001, "volume_hL": 406435.3711},
  {"zone": "APAC", "plant": "Wenzhou", "EPT": 11066.525, "ST": 12501.843599999998, "OST": 12767.3334, "volume_hL": 2750215.4870999996},
  {"zone": "APAC", "plant": "Wugang", "EPT": 5177.9001, "ST": 5883.9515, "OST": 6235.0016, "volume_hL": 563191.5433},
  {"zone": "APAC", "plant": "Wuhan", "EPT": 27728.889900000002, "ST": 31682.6785, "OST": 33893.3876, "volume_hL": 3675292.4809000003},
  {"zone": "APAC", "plant": "Xiaogan", "EPT": 1339.3876, "ST": 1715.683, "OST": 1715.6832, "volume_hL": 170948.78389999998},
  {"zone": "APAC", "plant": "Xinxiang", "EPT": 8031.073900000001, "ST": 9070.099999999999, "OST": 9161.0, "volume_hL": 1918330.5143},
  {"zone": "APAC", "plant": "Xinyang", "EPT": 3044.0207000000005, "ST": 3496.5837, "OST": 3553.9175999999998, "volume_hL": 554296.6394999999},
  {"zone": "APAC", "plant": "Yanji", "EPT": 2798.3711000000003, "ST": 3253.4332999999997, "OST": 3316.3333000000002, "volume_hL": 561801.0312},
  {"zone": "APAC", "plant": "Yingkou", "EPT": 2991.5266, "ST": 3505.6662, "OST": 3563.2512, "volume_hL": 554500.7100000001},
  {"zone": "APAC", "plant": "Zhangzhou", "EPT": 11898.077099999999, "ST": 13737.818200000002, "OST": 15348.5333, "volume_hL": 1807631.1238999998},
  {"zone": "APAC", "plant": "Ziyang", "EPT": 16283.521200000001, "ST": 18539.4453, "OST": 19428.239199999996, "volume_hL": 2844535.1745999996},
  {"zone": "EUR", "plant": "Bremen", "EPT": 23292.0639, "ST": 36356.216781999996, "OST": 38019.754228000005, "volume_hL": 3949538.9711},
  {"zone": "EUR", "plant": "Dommelen", "EPT": 6873.936800000001, "ST": 9478.031761, "OST": 9848.952517, "volume_hL": 912723.1440000002},
  {"zone": "EUR", "plant": "Hoegaarden", "EPT": 6387.4184000000005, "ST": 12644.033989, "OST": 14525.937720000002, "volume_hL": 1054875.3837},
  {"zone": "EUR", "plant": "Issum", "EPT": 2708.3274, "ST": 4467.314361, "OST": 5174.540076, "volume_hL": 432061.0368},
  {"zone": "EUR", "plant": "Jupille", "EPT": 16918.0292, "ST": 33730.563504, "OST": 36883.444972, "volume_hL": 2592627.3194},
  {"zone": "EUR", "plant": "Las Palmas", "EPT": 4210.5299, "ST": 6871.392430999999, "OST": 8558.271314, "volume_hL": 486406.01999999996},
  {"zone": "EUR", "plant": "Leuven", "EPT": 34670.23120000001, "ST": 58248.579806999995, "OST": 66629.81355899999, "volume_hL": 4726129.9461},
  {"zone": "EUR", "plant": "Magor", "EPT": 23078.4969, "ST": 37615.554356, "OST": 42216.749345000004, "volume_hL": 5025309.0024},
  {"zone": "EUR", "plant": "Munich", "EPT": 9263.8478, "ST": 16967.554744, "OST": 20635.024612999998, "volume_hL": 1716823.4092},
  {"zone": "EUR", "plant": "Samlesbury", "EPT": 12088.93095, "ST": 21448.047197109998, "OST": 24120.284861798005, "volume_hL": 3357540.2749},
  {"zone": "EUR", "plant": "Santa Cruz (SABM)", "EPT": 1601.6399999999999, "ST": 3400.219295801, "OST": 3687.552579, "volume_hL": 217000.77999999997},
  {"zone": "EUR", "plant": "Wernigerode", "EPT": 11806.290700000001, "ST": 18110.895812, "OST": 20239.242633, "volume_hL": 1848809.9234000002},
  {"zone": "MAZ", "plant": "Arequipa", "EPT": 6820.4077777888915, "ST": 8614.705277796891, "OST": 8626.42027778889, "volume_hL": 1606664.5076000001},
  {"zone": "MAZ", "plant": "Ate Beer", "EPT": 21885.05611125556, "ST": 27186.23472232511, "OST": 30062.00083359222, "volume_hL": 7644600.2072},
  {"zone": "MAZ", "plant": "Atlantico", "EPT": 4603.298333466666, "ST": 6002.851389009888, "OST": 7147.993055471112, "volume_hL": 1617127.76161},
  {"zone": "MAZ", "plant": "Barranquilla", "EPT": 22672.482499751124, "ST": 29075.904999747683, "OST": 30706.790277911106, "volume_hL": 4200971.0},
  {"zone": "MAZ", "plant": "Boyaca", "EPT": 15259.77083314448, "ST": 18094.12916644737, "OST": 18928.79472211333, "volume_hL": 4276591.20026},
  {"zone": "MAZ", "plant": "Bucaramanga", "EPT": 8663.536389122253, "ST": 11718.561666923586, "OST": 12701.849999966666, "volume_hL": 1936433.2880000002},
  {"zone": "MAZ", "plant": "Cusco", "EPT": 3914.6630555777824, "ST": 4856.244444483337, "OST": 4950.004722166668, "volume_hL": 1068856.9206},
  {"zone": "MAZ", "plant": "GUADALAJARA", "EPT": 15115.06472201111, "ST": 21037.178055397115, "OST": 23355.301389044445, "volume_hL": 4330405.624119984},
  {"zone": "MAZ", "plant": "Guayaquil Beer", "EPT": 17261.10944441113, "ST": 23173.32750007046, "OST": 24956.838888866667, "volume_hL": 3257921.96028},
  {"zone": "MAZ", "plant": "Hato Nuevo", "EPT": 14634.478889033337, "ST": 21120.15138912189, "OST": 27725.417222222222, "volume_hL": 1345153.70984536},
  {"zone": "MAZ", "plant": "Huarochiri Water", "EPT": 5112.923055533333, "ST": 5853.710555536889, "OST": 5967.701944433333, "volume_hL": 929132.599},
  {"zone": "MAZ", "plant": "Ind La Constancia Beer", "EPT": 12576.286111200001, "ST": 15178.621388947335, "OST": 15678.308611044446, "volume_hL": 1732852.089000974},
  {"zone": "MAZ", "plant": "Ind La Constancia CSD", "EPT": 24295.33972220333, "ST": 29784.497777761106, "OST": 31052.626388947778, "volume_hL": 4086218.1962000006},
  {"zone": "MAZ", "plant": "Ind La Constancia Water", "EPT": 5403.318888966667, "ST": 6253.501666765777, "OST": 6567.176666782223, "volume_hL": 355053.584},
  {"zone": "MAZ", "plant": "MAZATLAN", "EPT": 1956.8697223000004, "ST": 2708.186388980889, "OST": 3080.9030556222224, "volume_hL": 720912.0276},
  {"zone": "MAZ", "plant": "Medellin", "EPT": 19632.071388844495, "ST": 25840.477777734388, "OST": 29993.701388661113, "volume_hL": 3930433.7315},
  {"zone": "MAZ", "plant": "Merida", "EPT": 7706.586944378888, "ST": 8961.787777711334, "OST": 9550.795555444442, "volume_hL": 2848134.456639999},
  {"zone": "MAZ", "plant": "Mexico Apan", "EPT": 19384.476389111158, "ST": 25753.762500233155, "OST": 32237.98277774111, "volume_hL": 11762720.8294},
  {"zone": "MAZ", "plant": "Mexico Plant", "EPT": 36176.576666777786, "ST": 48674.21611130745, "OST": 61468.060833296666, "volume_hL": 10413536.2214},
  {"zone": "MAZ", "plant": "Motupe Beer", "EPT": 12668.651666777778, "ST": 17048.525277895777, "OST": 19113.97499976667, "volume_hL": 3072655.0017799996},
  {"zone": "MAZ", "plant": "Panama Beer", "EPT": 9224.883888908891, "ST": 11236.705555562226, "OST": 11830.98944458889, "volume_hL": 1653771.91372},
  {"zone": "MAZ", "plant": "Quito", "EPT": 7976.899722233335, "ST": 10068.693888897782, "OST": 10593.192499966333, "volume_hL": 2252164.718},
  {"zone": "MAZ", "plant": "San Juan", "EPT": 4933.785277777777, "ST": 6526.191388885666, "OST": 7572.436944543332, "volume_hL": 1842422.9962000002},
  {"zone": "MAZ", "plant": "San Pedro Sula Beer", "EPT": 14059.049277644444, "ST": 16543.256388722668, "OST": 17210.377222139996, "volume_hL": 2053368.9},
  {"zone": "MAZ", "plant": "San Pedro Sula CSD", "EPT": 32335.19472245667, "ST": 38174.15277799933, "OST": 39415.77166636556, "volume_hL": 8419026.37476},
  {"zone": "MAZ", "plant": "Santo Domingo", "EPT": 20952.574721931174, "ST": 25146.675832996392, "OST": 26990.020277954445, "volume_hL": 4433415.135},
  {"zone": "MAZ", "plant": "TORREON", "EPT": 12714.901666663332, "ST": 14420.944999998774, "OST": 14829.971388769667, "volume_hL": 2797044.33},
  {"zone": "MAZ", "plant": "Tocancipa", "EPT": 47246.37555522228, "ST": 59098.14055514682, "OST": 61491.00055547555, "volume_hL": 11863137.551753802},
  {"zone": "MAZ", "plant": "Tuxtepec", "EPT": 39253.1563886, "ST": 55184.14611065966, "OST": 65413.18361128222, "volume_hL": 11058499.262659933},
  {"zone": "MAZ", "plant": "Valle", "EPT": 20118.37416666671, "ST": 27399.22472218549, "OST": 29448.558333214452, "volume_hL": 4654841.5981},
  {"zone": "MAZ", "plant": "ZACATECAS", "EPT": 63668.399444736555, "ST": 73059.45777808054, "OST": 76450.49027758389, "volume_hL": 21490232.09228},
  {"zone": "MAZ", "plant": "Zacapa", "EPT": 1559.3419444888887, "ST": 1767.935555595889, "OST": 1870.6733333999996, "volume_hL": 226269.3424},
  {"zone": "NAZ", "plant": "Baldwinsville", "EPT": 20957.021099999998, "ST": 29203.63599996, "OST": 31215.578591780002, "volume_hL": 6943329.379099999},
  {"zone": "NAZ", "plant": "Cartersville", "EPT": 20802.516, "ST": 28526.887500143002, "OST": 32835.7195, "volume_hL": 6603925.342000001},
  {"zone": "NAZ", "plant": "Columbus", "EPT": 21190.103199999998, "ST": 29632.227774096697, "OST": 42329.459724472996, "volume_hL": 7206595.64711},
  {"zone": "NAZ", "plant": "Creston", "EPT": 2243.3324459, "ST": 2729.683461001, "OST": 2797.9667476000004, "volume_hL": 502227.59003},
  {"zone": "NAZ", "plant": "Edmonton", "EPT": 6101.5536551000005, "ST": 9442.437146061, "OST": 10577.8834332, "volume_hL": 1301788.0269300002},
  {"zone": "NAZ", "plant": "FairField", "EPT": 5735.9592999999995, "ST": 7507.935000025, "OST": 8059.4121469, "volume_hL": 1956824.657656},
  {"zone": "NAZ", "plant": "Fort Collins", "EPT": 18989.990499999996, "ST": 27200.184900018, "OST": 34835.92351657, "volume_hL": 6851767.26952},
  {"zone": "NAZ", "plant": "Halifax", "EPT": 3234.81087508, "ST": 4455.817480132, "OST": 5127.950135100001, "volume_hL": 561131.4209299999},
  {"zone": "NAZ", "plant": "Houston", "EPT": 32425.765499999998, "ST": 42694.42959163999, "OST": 45398.46515515, "volume_hL": 10308497.71449},
  {"zone": "NAZ", "plant": "Jacksonville", "EPT": 23039.5962, "ST": 31263.166111762, "OST": 33347.46645132001, "volume_hL": 7516804.21357},
  {"zone": "NAZ", "plant": "London", "EPT": 10608.779974600002, "ST": 15052.526635041, "OST": 18485.5502628, "volume_hL": 2873163.7920999997},
  {"zone": "NAZ", "plant": "Los Angeles", "EPT": 23293.071300000003, "ST": 33980.911100031, "OST": 39717.64800514, "volume_hL": 6766591.004779999},
  {"zone": "NAZ", "plant": "Merrimack", "EPT": 2060.1238, "ST": 2695.1000000035, "OST": 2977.3289939999995, "volume_hL": 637323.0415500001},
  {"zone": "NAZ", "plant": "Montreal", "EPT": 10173.78089742, "ST": 16156.177621064999, "OST": 19316.016911299997, "volume_hL": 2545445.5507500004},
  {"zone": "NAZ", "plant": "Newark", "EPT": 1660.6876000000002, "ST": 2582.1191999970006, "OST": 2631.0158501, "volume_hL": 638021.16146},
  {"zone": "NAZ", "plant": "St. Louis", "EPT": 31650.948600000003, "ST": 42811.82859996899, "OST": 47628.258599999994, "volume_hL": 11053545.051696999},
  {"zone": "NAZ", "plant": "Williamsburg", "EPT": 17850.089300000003, "ST": 25345.666900046002, "OST": 26855.359672399998, "volume_hL": 5791175.80454},
  {"zone": "SAZ", "plant": "Acheral", "EPT": 3726.3369444299997, "ST": 4967.252889720001, "OST": 6419.728019799999, "volume_hL": 1058560.2683199998},
  {"zone": "SAZ", "plant": "Agudos", "EPT": 22608.8248611, "ST": 29435.648922648994, "OST": 34013.961214331, "volume_hL": 5986939.644640001},
  {"zone": "SAZ", "plant": "Almirante Tamandare", "EPT": 6425.6580555, "ST": 7613.397499939999, "OST": 7991.512596216, "volume_hL": 1286149.56063},
  {"zone": "SAZ", "plant": "Anapolis", "EPT": 31742.57149855, "ST": 44959.54335595201, "OST": 55254.618318780005, "volume_hL": 6675242.369549999},
  {"zone": "SAZ", "plant": "Aquiraz", "EPT": 24668.875555279996, "ST": 34369.134813049, "OST": 46980.01556216, "volume_hL": 4703919.02984},
  {"zone": "SAZ", "plant": "Cachoeiras de Macacu", "EPT": 14602.579160999, "ST": 18760.843157077, "OST": 24395.858934862998, "volume_hL": 2369745.4972154},
  {"zone": "SAZ", "plant": "Camacari", "EPT": 21897.489999740003, "ST": 35298.034367539, "OST": 46784.211947857, "volume_hL": 4936811.75176},
  {"zone": "SAZ", "plant": "Cochabamba", "EPT": 11209.2551592, "ST": 12815.408450955, "OST": 12977.155640669, "volume_hL": 1030935.5411},
  {"zone": "SAZ", "plant": "Cordoba", "EPT": 4270.026111, "ST": 4851.512499891, "OST": 5318.029427, "volume_hL": 745018.38014},
  {"zone": "SAZ", "plant": "Corrientes", "EPT": 4022.3898610299993, "ST": 5646.485299939, "OST": 7232.642722099999, "volume_hL": 1254987.24845},
  {"zone": "SAZ", "plant": "Cuiaba", "EPT": 13328.593194400002, "ST": 18884.916688872006, "OST": 20896.091834583, "volume_hL": 2547707.18128},
  {"zone": "SAZ", "plant": "El Alto", "EPT": 12221.1640276, "ST": 14495.369674005999, "OST": 15557.052211159998, "volume_hL": 1296070.0383981003},
  {"zone": "SAZ", "plant": "Estancia", "EPT": 13368.493610877, "ST": 18710.239410853, "OST": 23697.93720768, "volume_hL": 3517105.1439340003},
  {"zone": "SAZ", "plant": "Guarulhos", "EPT": 10982.7251389, "ST": 14477.235600033877, "OST": 16430.9070619, "volume_hL": 2334564.88082},
  {"zone": "SAZ", "plant": "Huari", "EPT": 4407.5005557, "ST": 7130.350400175001, "OST": 7721.291901770001, "volume_hL": 601623.0249400001},
  {"zone": "SAZ", "plant": "Itapissuma", "EPT": 30846.83736105, "ST": 49152.777466506, "OST": 60268.52587922499, "volume_hL": 7617627.796368001},
  {"zone": "SAZ", "plant": "Jacarei", "EPT": 31933.884133400003, "ST": 41033.27642215699, "OST": 50650.914716176, "volume_hL": 6971810.215110001},
  {"zone": "SAZ", "plant": "Jaguariuna", "EPT": 33620.28930539, "ST": 46988.35011093101, "OST": 62825.03519133999, "volume_hL": 5845375.8884556005},
  {"zone": "SAZ", "plant": "Juatuba", "EPT": 18104.555833259998, "ST": 22306.093621866, "OST": 27988.569541493, "volume_hL": 4584136.786421},
  {"zone": "SAZ", "plant": "Jundiai", "EPT": 23773.43666683, "ST": 34240.736933139, "OST": 48534.605070649995, "volume_hL": 6622493.621622999},
  {"zone": "SAZ", "plant": "La Paz", "EPT": 3149.5838887, "ST": 5180.716399721, "OST": 6133.293031099999, "volume_hL": 712689.00477},
  {"zone": "SAZ", "plant": "Lages", "EPT": 13329.31777773, "ST": 16371.168622463001, "OST": 21522.224184921, "volume_hL": 2869907.8498319993},
  {"zone": "SAZ", "plant": "Manantial", "EPT": 6574.215277900001, "ST": 7970.7411001420005, "OST": 8338.887006721, "volume_hL": 1352406.2703},
  {"zone": "SAZ", "plant": "Manaus", "EPT": 10628.3283334, "ST": 14858.224811290002, "OST": 18099.28393532, "volume_hL": 2017668.441671},
  {"zone": "SAZ", "plant": "Mendoza", "EPT": 5225.84444455, "ST": 7420.190800121, "OST": 7836.984904800001, "volume_hL": 1676115.80362},
  {"zone": "SAZ", "plant": "Montevideo", "EPT": 5788.40555553, "ST": 8850.254855548, "OST": 10182.063532000002, "volume_hL": 980625.950774},
  {"zone": "SAZ", "plant": "Pirai", "EPT": 26887.710417050002, "ST": 36941.72150041, "OST": 55199.07335122, "volume_hL": 5571090.252408},
  {"zone": "SAZ", "plant": "Pompeya", "EPT": 17027.487500170002, "ST": 20828.02380022, "OST": 21651.1741027, "volume_hL": 4620021.09792},
  {"zone": "SAZ", "plant": "Ponta Grossa", "EPT": 11988.1318056, "ST": 16109.778988875998, "OST": 22109.906936699997, "volume_hL": 3939583.4650699995},
  {"zone": "SAZ", "plant": "Quilmes", "EPT": 10095.49222216, "ST": 12614.514199926001, "OST": 13793.1926642, "volume_hL": 3325816.0216099997},
  {"zone": "SAZ", "plant": "Rio de Janeiro", "EPT": 42014.70111134, "ST": 58355.213834111, "OST": 80057.80138125698, "volume_hL": 10763763.960230002},
  {"zone": "SAZ", "plant": "Sacaba", "EPT": 1232.0386111, "ST": 1348.463399988, "OST": 10191.241946, "volume_hL": 118649.33},
  {"zone": "SAZ", "plant": "Santa Cruz", "EPT": 19210.200555499996, "ST": 22746.238199880998, "OST": 23914.059538179004, "volume_hL": 1547722.3003300002},
  {"zone": "SAZ", "plant": "Santiago", "EPT": 13947.4183334, "ST": 17924.828037156996, "OST": 24052.871495745003, "volume_hL": 3203648.7570699994},
  {"zone": "SAZ", "plant": "Sao Luis", "EPT": 13234.59805533, "ST": 19721.225199981003, "OST": 27080.69685645, "volume_hL": 3257060.30563},
  {"zone": "SAZ", "plant": "Sapucaia do Sul", "EPT": 9920.27361124, "ST": 15623.235577333002, "OST": 21685.49030752, "volume_hL": 2349645.284521},
  {"zone": "SAZ", "plant": "Sete Lagoas", "EPT": 33754.061110999995, "ST": 42229.47217696901, "OST": 51949.941533815996, "volume_hL": 9710192.19661073},
  {"zone": "SAZ", "plant": "Teresina", "EPT": 14194.2698609, "ST": 19553.343010672, "OST": 25420.652721524, "volume_hL": 2494658.59221},
  {"zone": "SAZ", "plant": "Uberlandia", "EPT": 21851.7306943, "ST": 32297.156378003994, "OST": 40030.827722865, "volume_hL": 6182293.49941},
  {"zone": "SAZ", "plant": "Viamao", "EPT": 15578.18091673, "ST": 22756.633372058997, "OST": 31513.24331216, "volume_hL": 4867371.14994},
  {"zone": "SAZ", "plant": "Ypane", "EPT": 17446.8169446, "ST": 22314.736300128003, "OST": 24140.03482494, "volume_hL": 3660066.84644},
  {"zone": "SAZ", "plant": "Zarate", "EPT": 13880.708333525, "ST": 18749.056100144, "OST": 20778.3709447, "volume_hL": 3408602.5835919995},
]


def normalize(name: str) -> str:
    """Normalize plant/site name for matching."""
    s = name.lower().strip()
    # Remove common suffixes
    for suffix in [" beer", " brewery", " (new)", "(new)"]:
        s = s.replace(suffix, "")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def normalize_aggressive(name: str) -> str:
    """More aggressive normalization, also removes csd/water."""
    s = normalize(name)
    for suffix in [" csd", " water"]:
        s = s.replace(suffix, "")
    return s.strip()


def build_manual_map() -> dict:
    """Known mappings that fuzzy matching may miss."""
    return {
        "accra beer": "Accra",
        "alrode beer": "Alrode",
        "gateway brewery": "Gateway",
        "jinja beer": "Jinja",
        "kgalagadi beer": "Kgalagadi",
        "lesotho beer": "Lesotho",
        "lusaka beer": "Lusaka",
        "namibia beer": "Namibia",
        "ndola beer": "Ndola",           # Not in JSON but try
        "ate beer": "Ate",
        "guayaquil beer": "Guayaquil",
        # ILC: normalize keeps "csd"/"water" so these match directly via exact
        # But the Beer variant normalizes to "ind la constancia" matching base entry
        "ind la constancia": "Ind La Constancia",  # Beer variant
        "ind la constancia csd": "Ind La Constancia CSD",
        "ind la constancia water": "Ind La Constancia Water",
        "motupe beer": "Motupe",
        "panama beer": "Panama",
        "san pedro sula beer": "San Pedro Sula",
        "san pedro sula csd": "San Pedro Sula CSD",
        "guadalajara": "Guadalajara",
        "mazatlan": "Mazatlan",
        "torreon": "Torreon",
        "zacatecas": "Zacatecas",
        "mexico apan": "Mexico APAN",
        "mexico plant": "Mexico Plant",
        "huarochiri water": "Huachipa",  # Huarochiri is water plant near Huachipa
        "atlantico": "Armenia",          # Atlantico maps to Armenia plant
        "valle": "Armenia",              # Valle in Colombia
        "santiago": "Santiago",           # Try direct
        "montevideo": "Montevideo",      # Try direct
        "pompeya": "Pompeya",            # Buenos Aires area
        "juatuba": "Juatuba",            # MG, Brazil
        "manantial": "Manantial",        # Argentina
        "fairfield": "FairField",        # NAZ
        "putian (new)": "Putian",
        "mudanjiang(new)": "Mudanjiang",
        "jiamusi new": "Jiamusi",
        "nanchang 3": "Nanchang 1",     # Nanchang variant
        "santa cruz": "Santa Cruz BO",            # SAZ Bolivia
        "santa cruz (sabm)": "Santa Cruz SABM",   # EUR
        "cachoeiras de macacu": "Cachoeiras",  # shortened in JSON
        "sapucaia do sul": "Sapucaia",
        "almirante tamandare": "Curitibana",  # Almirante Tamandare = Curitibana plant
        "fairfield": "FairField",
        "sacaba": "Sacaba",              # not in JSON likely
        "rosslyn": "Rosslyn",
        "celebrity": "Celebrity",
        "fosters": "Fosters",
        "vsip": "VSIP",
        "acheral": "Tucuman",            # Acheral is in Tucumán province
        "anapolis": "Equatorial",        # Anapolis maps to Equatorial
        "estancia": "Sergipe",           # Estancia is in Sergipe state
        "sao luis": "Equatorial",        # Sao Luis maps to Equatorial
        "pirai": "Sur",                  # Pirai = Sur region
        "sacaba": "__NO_MATCH__",        # Bolivia small plant, not in VPO JSON
    }


def match_plants(databricks_plants: list, json_sites: list) -> dict:
    """Match each Databricks plant to a JSON site. Returns {plant_name: site_dict or None}."""
    manual = build_manual_map()

    # Build TWO lookups: normal (keeps csd/water) and aggressive (strips them)
    site_by_norm = {}
    site_by_agg = {}
    for s in json_sites:
        n = normalize(s["site"])
        a = normalize_aggressive(s["site"])
        site_by_norm[n] = s
        site_by_agg[a] = s

    site_norms = list(site_by_norm.keys())
    site_aggs = list(site_by_agg.keys())

    matches = {}
    unmatched = []

    for p in databricks_plants:
        plant_name = p["plant"]
        plant_norm = normalize(plant_name)
        plant_agg = normalize_aggressive(plant_name)

        matched_site = None
        match_method = None
        skip_matching = False

        # 1. Manual map (try exact JSON site name first)
        if plant_norm in manual:
            if manual[plant_norm] == "__NO_MATCH__":
                skip_matching = True
        if not skip_matching and plant_norm in manual:
            target_raw = manual[plant_norm]
            for s in json_sites:
                if s["site"] == target_raw:
                    matched_site = s
                    match_method = "manual"
                    break
            if not matched_site:
                target_n = normalize(target_raw)
                if target_n in site_by_norm:
                    matched_site = site_by_norm[target_n]
                    match_method = "manual"

        # Also check aggressive-normalized manual
        if not matched_site and not skip_matching and plant_agg in manual:
            target_raw = manual[plant_agg]
            for s in json_sites:
                if s["site"] == target_raw:
                    matched_site = s
                    match_method = "manual-agg"
                    break

        # 2. Exact normalized match (preserves csd/water distinction)
        if not matched_site and not skip_matching and plant_norm in site_by_norm:
            matched_site = site_by_norm[plant_norm]
            match_method = "exact"

        # 3. Exact aggressive match (strips csd/water)
        if not matched_site and not skip_matching and plant_agg in site_by_agg:
            matched_site = site_by_agg[plant_agg]
            match_method = "exact-agg"

        # 4. Substring / contains (on normal form)
        if not matched_site and not skip_matching:
            for sn, sd in site_by_norm.items():
                if len(plant_norm) >= 4 and len(sn) >= 4:
                    if plant_norm in sn or sn in plant_norm:
                        matched_site = sd
                        match_method = "substring"
                        break

        # 5. Fuzzy match with difflib
        if not matched_site and not skip_matching:
            best = difflib.get_close_matches(plant_agg, site_aggs, n=1, cutoff=0.7)
            if best:
                matched_site = site_by_agg[best[0]]
                match_method = f"fuzzy({best[0]})"

        matches[plant_name] = {
            "site": matched_site,
            "method": match_method,
        }
        if not matched_site:
            unmatched.append(plant_name)

    return matches, unmatched


def main():
    # ─── Load JSON sites ───────────────────────────────────────────────
    json_path = Path("/home/fredfur/projects/coverage-dashboard/docs/vpo_tech_data.json")
    with open(json_path) as f:
        vpo_data = json.load(f)
    json_sites = vpo_data["sites"]
    print(f"JSON sites loaded: {len(json_sites)}")
    print(f"Databricks plants: {len(DATABRICKS_PLANTS)}")

    # ─── Match ─────────────────────────────────────────────────────────
    matches, unmatched = match_plants(DATABRICKS_PLANTS, json_sites)

    matched_count = sum(1 for v in matches.values() if v["site"])
    print(f"\nMatched: {matched_count}/{len(DATABRICKS_PLANTS)}")
    print(f"Unmatched: {len(unmatched)}")
    if unmatched:
        print(f"  Unmatched plants: {unmatched}")

    # Print match log
    print("\n─── Match Log ───")
    for plant_name, m in sorted(matches.items()):
        site = m["site"]
        if site:
            print(f"  {plant_name:30s} → {site['site']:25s} [{m['method']}]")
        else:
            print(f"  {plant_name:30s} → NO MATCH")

    # ─── Calculate per-plant KPIs ──────────────────────────────────────
    plants_out = []
    zone_agg = {}  # zone -> {EPT, OST, ST, volume_hL, n}
    bundle_agg = {}  # bundle -> {EPT, OST, ST, volume_hL, n}

    global_EPT = 0
    global_OST = 0
    global_ST = 0
    global_vol = 0

    for p in DATABRICKS_PLANTS:
        ept = p["EPT"]
        ost = p["OST"]
        st = p["ST"]
        vol = p["volume_hL"]

        ose = ept / ost if ost > 0 else 0
        gly = ept / st if st > 0 else 0

        m = matches[p["plant"]]
        site = m["site"]
        bundle = site["bundle"] if site else None
        vpo_num = site["vpoNum"] if site else None
        tech_score = site["techScore"] if site else None

        plants_out.append({
            "plant": p["plant"],
            "zone": p["zone"],
            "bundle": bundle,
            "OSE": round(ose, 6),
            "GLY": round(gly, 6),
            "EPT": round(ept, 2),
            "OST": round(ost, 2),
            "ST": round(st, 2),
            "volume_hL": round(vol, 2),
            "vpoNum": vpo_num,
            "techScore": tech_score,
        })

        # Zone aggregation
        z = p["zone"]
        if z not in zone_agg:
            zone_agg[z] = {"EPT": 0, "OST": 0, "ST": 0, "volume_hL": 0, "n": 0}
        zone_agg[z]["EPT"] += ept
        zone_agg[z]["OST"] += ost
        zone_agg[z]["ST"] += st
        zone_agg[z]["volume_hL"] += vol
        zone_agg[z]["n"] += 1

        # Bundle aggregation (only matched)
        if bundle:
            if bundle not in bundle_agg:
                bundle_agg[bundle] = {"EPT": 0, "OST": 0, "ST": 0, "volume_hL": 0, "n": 0}
            bundle_agg[bundle]["EPT"] += ept
            bundle_agg[bundle]["OST"] += ost
            bundle_agg[bundle]["ST"] += st
            bundle_agg[bundle]["volume_hL"] += vol
            bundle_agg[bundle]["n"] += 1

        global_EPT += ept
        global_OST += ost
        global_ST += st
        global_vol += vol

    # ─── Zone summary ──────────────────────────────────────────────────
    by_zone = []
    print("\n═══ Zone Summary ═══")
    print(f"{'Zone':6s} {'N':>4s} {'EPT':>12s} {'OST':>12s} {'ST':>12s} {'OSE%':>7s} {'GLY%':>7s} {'Volume MhL':>12s}")
    print("─" * 80)
    for z in sorted(zone_agg.keys()):
        a = zone_agg[z]
        ose_pct = (a["EPT"] / a["OST"] * 100) if a["OST"] > 0 else 0
        gly_pct = (a["EPT"] / a["ST"] * 100) if a["ST"] > 0 else 0
        vol_mhl = a["volume_hL"] / 1e6
        print(f"{z:6s} {a['n']:4d} {a['EPT']:12.1f} {a['OST']:12.1f} {a['ST']:12.1f} {ose_pct:7.2f} {gly_pct:7.2f} {vol_mhl:12.2f}")
        by_zone.append({
            "zone": z,
            "n_plants": a["n"],
            "EPT": round(a["EPT"], 2),
            "OST": round(a["OST"], 2),
            "ST": round(a["ST"], 2),
            "ose_pct": round(ose_pct, 2),
            "gly_pct": round(gly_pct, 2),
            "volume_hL": round(a["volume_hL"], 2),
        })

    # Global
    global_ose = global_EPT / global_OST * 100 if global_OST > 0 else 0
    global_gly = global_EPT / global_ST * 100 if global_ST > 0 else 0
    print("─" * 80)
    print(f"{'TOTAL':6s} {len(DATABRICKS_PLANTS):4d} {global_EPT:12.1f} {global_OST:12.1f} {global_ST:12.1f} {global_ose:7.2f} {global_gly:7.2f} {global_vol/1e6:12.2f}")

    # ─── Bundle summary ────────────────────────────────────────────────
    bundle_stats = {}
    print("\n═══ Bundle Summary ═══")
    print(f"{'Bundle':8s} {'N':>4s} {'EPT':>12s} {'OST':>12s} {'ST':>12s} {'OSE%':>7s} {'GLY%':>7s} {'Volume MhL':>12s}")
    print("─" * 80)
    for b in ["B4", "B3", "B2", "B1"]:
        if b in bundle_agg:
            a = bundle_agg[b]
            ose_pct = (a["EPT"] / a["OST"] * 100) if a["OST"] > 0 else 0
            gly_pct = (a["EPT"] / a["ST"] * 100) if a["ST"] > 0 else 0
            vol_mhl = a["volume_hL"] / 1e6
            print(f"{b:8s} {a['n']:4d} {a['EPT']:12.1f} {a['OST']:12.1f} {a['ST']:12.1f} {ose_pct:7.2f} {gly_pct:7.2f} {vol_mhl:12.2f}")
            bundle_stats[b] = {
                "n_plants": a["n"],
                "ose_pct": round(ose_pct, 2),
                "gly_pct": round(gly_pct, 2),
                "volume_hL": round(a["volume_hL"], 2),
                "EPT": round(a["EPT"], 2),
                "OST": round(a["OST"], 2),
                "ST": round(a["ST"], 2),
            }

    print(f"\nGlobal OSE: {global_ose:.2f}%")
    print(f"Global GLY: {global_gly:.2f}%")

    # ─── Best zone by OSE ──────────────────────────────────────────────
    best_zone = max(by_zone, key=lambda x: x["ose_pct"])
    print(f"Best zone by OSE: {best_zone['zone']} ({best_zone['ose_pct']:.2f}%)")

    # ─── B4 vs B1 gap ─────────────────────────────────────────────────
    b4_ose = bundle_stats.get("B4", {}).get("ose_pct", 0)
    b1_ose = bundle_stats.get("B1", {}).get("ose_pct", 0)
    gap = b4_ose - b1_ose
    print(f"B4 vs B1 OSE gap: {gap:.2f}pp (B4={b4_ose:.2f}% B1={b1_ose:.2f}%)")

    # ─── Save JSON ─────────────────────────────────────────────────────
    output = {
        "methodology": "OSE = ΣEPT/ΣOST per plant, aggregated bottom-up",
        "source": "brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated",
        "period": "2025 AC MTH",
        "generated": str(date.today()),
        "global_kpis": {
            "ose_pct": round(global_ose, 2),
            "gly_pct": round(global_gly, 2),
            "total_plants": len(DATABRICKS_PLANTS),
            "matched_plants": matched_count,
            "total_volume_hL": round(global_vol, 2),
        },
        "bundle_stats": bundle_stats,
        "by_zone": by_zone,
        "plants": plants_out,
    }

    out_path = Path("/home/fredfur/projects/coverage-dashboard/docs/vpo_tech_data_ose_correct.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\nOutput saved to {out_path}")
    print(f"File size: {out_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
