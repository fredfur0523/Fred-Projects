#!/usr/bin/env python3
"""
Generate OSE Packaging outputs: JSON + HTML dashboard.
Uses Databricks query results (172 plants) + VPO tech data (162 sites).
OSE = ΣEPT / ΣOST (bottom-up, never simple average).
"""

import json
import hashlib
import math
from difflib import SequenceMatcher
from datetime import date
from pathlib import Path

BASE_DIR = Path("/home/fredfur/projects/coverage-dashboard/docs")

# ── Databricks query results: 172 plants ──────────────────────────────────
DB_PLANTS = [
  {"zone": "AFR", "plant": "Accra Beer", "EPT": 7597.37, "ST": 12357.03, "OST": 25031.17, "volume_hL": 1256180.18},
  {"zone": "AFR", "plant": "Alrode Beer", "EPT": 25457.09, "ST": 37515.15, "OST": 48895.82, "volume_hL": 8088631.94},
  {"zone": "AFR", "plant": "Arusha", "EPT": 7996.52, "ST": 9439.39, "OST": 12592.40, "volume_hL": 875300.86},
  {"zone": "AFR", "plant": "Beira", "EPT": 4990.86, "ST": 6812.84, "OST": 8126.32, "volume_hL": 658551.19},
  {"zone": "AFR", "plant": "Chamdor", "EPT": 14683.51, "ST": 24167.48, "OST": 32803.45, "volume_hL": 3013607.36},
  {"zone": "AFR", "plant": "Dar es Salaam", "EPT": 16283.32, "ST": 19914.51, "OST": 21922.25, "volume_hL": 1495046.55},
  {"zone": "AFR", "plant": "Eswatini", "EPT": 2868.47, "ST": 3427.45, "OST": 3874.73, "volume_hL": 353331.03},
  {"zone": "AFR", "plant": "Gateway Brewery", "EPT": 11006.94, "ST": 14122.04, "OST": 19594.93, "volume_hL": 2250411.99},
  {"zone": "AFR", "plant": "Ibhayi", "EPT": 9260.66, "ST": 14588.98, "OST": 17481.62, "volume_hL": 2844091.13},
  {"zone": "AFR", "plant": "Ilesa", "EPT": 12475.42, "ST": 15676.58, "OST": 22174.20, "volume_hL": 1435062.89},
  {"zone": "AFR", "plant": "Jinja Beer", "EPT": 9080.52, "ST": 11334.998, "OST": 16414.42, "volume_hL": 1466663.82},
  {"zone": "AFR", "plant": "Kgalagadi Beer", "EPT": 6850.20, "ST": 12643.62, "OST": 24174.08, "volume_hL": 794156.86},
  {"zone": "AFR", "plant": "Lesotho Beer", "EPT": 4911.87, "ST": 5911.36, "OST": 5976.95, "volume_hL": 422040.68},
  {"zone": "AFR", "plant": "Lusaka Beer", "EPT": 7986.87, "ST": 11272.79, "OST": 23162.17, "volume_hL": 1365049.80},
  {"zone": "AFR", "plant": "Maputo", "EPT": 13228.24, "ST": 20406.61, "OST": 25792.80, "volume_hL": 1066266.54},
  {"zone": "AFR", "plant": "Marracuene", "EPT": 3574.05, "ST": 5716.23, "OST": 8432.05, "volume_hL": 1588950.33},
  {"zone": "AFR", "plant": "Mbarara", "EPT": 5169.21, "ST": 6104.43, "OST": 7736.09, "volume_hL": 979937.67},
  {"zone": "AFR", "plant": "Mbeya", "EPT": 6658.12, "ST": 7785.88, "OST": 8611.83, "volume_hL": 757158.99},
  {"zone": "AFR", "plant": "Mwanza", "EPT": 10049.58, "ST": 11873.38, "OST": 14848.63, "volume_hL": 1058574.31},
  {"zone": "AFR", "plant": "Namibia Beer", "EPT": 3476.16, "ST": 4468.76, "OST": 5169.81, "volume_hL": 307902.61},
  {"zone": "AFR", "plant": "Nampula", "EPT": 4754.29, "ST": 5596.67, "OST": 6022.03, "volume_hL": 627566.32},
  {"zone": "AFR", "plant": "Ndola Beer", "EPT": 7988.26, "ST": 10813.63, "OST": 15856.30, "volume_hL": 1281768.24},
  {"zone": "AFR", "plant": "Newlands", "EPT": 14232.74, "ST": 19077.95, "OST": 22776.90, "volume_hL": 4003655.52},
  {"zone": "AFR", "plant": "Onitsha", "EPT": 10350.70, "ST": 13445.48, "OST": 17750.29, "volume_hL": 1611234.95},
  {"zone": "AFR", "plant": "Polokwane", "EPT": 5224.40, "ST": 7869.82, "OST": 8760.00, "volume_hL": 1630621.72},
  {"zone": "AFR", "plant": "Port Harcourt", "EPT": 13465.31, "ST": 16633.80, "OST": 19555.64, "volume_hL": 1274513.00},
  {"zone": "AFR", "plant": "Prospecton", "EPT": 16286.39, "ST": 21635.05, "OST": 29926.90, "volume_hL": 5191811.55},
  {"zone": "AFR", "plant": "Rosslyn", "EPT": 28871.30, "ST": 43803.90, "OST": 61425.53, "volume_hL": 9060158.03},
  {"zone": "APAC", "plant": "Aurangabad", "EPT": 13214.34, "ST": 15952.12, "OST": 15976.95, "volume_hL": 1261242.15},
  {"zone": "APAC", "plant": "Baoding", "EPT": 5468.54, "ST": 6315.13, "OST": 6465.50, "volume_hL": 1352927.70},
  {"zone": "APAC", "plant": "Celebrity", "EPT": 7073.84, "ST": 8530.72, "OST": 8531.52, "volume_hL": 730721.91},
  {"zone": "APAC", "plant": "Charminar", "EPT": 3571.42, "ST": 5274.11, "OST": 5279.24, "volume_hL": 639189.27},
  {"zone": "APAC", "plant": "Cheongwon", "EPT": 12587.62, "ST": 14732.99, "OST": 15010.10, "volume_hL": 2959517.68},
  {"zone": "APAC", "plant": "Foshan", "EPT": 37968.32, "ST": 43179.28, "OST": 44942.39, "volume_hL": 7956209.88},
  {"zone": "APAC", "plant": "Fosters", "EPT": 6366.86, "ST": 7766.83, "OST": 7904.56, "volume_hL": 401947.93},
  {"zone": "APAC", "plant": "Gwangju", "EPT": 8453.12, "ST": 10997.23, "OST": 11603.85, "volume_hL": 2845303.36},
  {"zone": "APAC", "plant": "Harbin 2", "EPT": 12622.53, "ST": 14525.45, "OST": 14863.15, "volume_hL": 2896457.16},
  {"zone": "APAC", "plant": "Hyderabad", "EPT": 6489.28, "ST": 7858.37, "OST": 7857.49, "volume_hL": 648391.34},
  {"zone": "APAC", "plant": "Icheon", "EPT": 18341.80, "ST": 21689.92, "OST": 21951.79, "volume_hL": 4407244.27},
  {"zone": "APAC", "plant": "Jiamusi New", "EPT": 2278.86, "ST": 2624.33, "OST": 2676.50, "volume_hL": 568202.44},
  {"zone": "APAC", "plant": "Jingmen", "EPT": 18745.00, "ST": 21429.22, "OST": 21429.22, "volume_hL": 1810341.24},
  {"zone": "APAC", "plant": "Jinshibai", "EPT": 21589.45, "ST": 24709.23, "OST": 25051.42, "volume_hL": 3258358.37},
  {"zone": "APAC", "plant": "Jinzhou", "EPT": 5804.88, "ST": 6673.27, "OST": 7281.50, "volume_hL": 1108856.39},
  {"zone": "APAC", "plant": "Jishui", "EPT": 3787.68, "ST": 4352.96, "OST": 4448.32, "volume_hL": 937257.97},
  {"zone": "APAC", "plant": "Kunming", "EPT": 3229.63, "ST": 3676.13, "OST": 3817.30, "volume_hL": 635020.81},
  {"zone": "APAC", "plant": "Meerut", "EPT": 2837.71, "ST": 3226.32, "OST": 3251.74, "volume_hL": 170263.08},
  {"zone": "APAC", "plant": "Mudanjiang(New)", "EPT": 4084.15, "ST": 4707.17, "OST": 4707.17, "volume_hL": 764171.33},
  {"zone": "APAC", "plant": "MyPhuoc", "EPT": 4229.03, "ST": 5029.58, "OST": 5151.89, "volume_hL": 364264.17},
  {"zone": "APAC", "plant": "Mysore", "EPT": 8476.00, "ST": 10698.57, "OST": 10712.08, "volume_hL": 1048444.62},
  {"zone": "APAC", "plant": "Nanchang 3", "EPT": 10373.12, "ST": 11978.84, "OST": 12037.58, "volume_hL": 2174576.75},
  {"zone": "APAC", "plant": "Nanning", "EPT": 4557.61, "ST": 5206.27, "OST": 5545.67, "volume_hL": 1038746.71},
  {"zone": "APAC", "plant": "Nantong", "EPT": 14677.76, "ST": 16579.35, "OST": 17429.50, "volume_hL": 1940443.82},
  {"zone": "APAC", "plant": "Ningbo", "EPT": 5984.35, "ST": 6634.90, "OST": 6650.50, "volume_hL": 756467.16},
  {"zone": "APAC", "plant": "Putian (New)", "EPT": 45708.14, "ST": 51886.26, "OST": 53799.39, "volume_hL": 9343581.87},
  {"zone": "APAC", "plant": "Shiliang", "EPT": 23360.78, "ST": 26401.39, "OST": 26958.67, "volume_hL": 3112539.70},
  {"zone": "APAC", "plant": "Sonipat", "EPT": 6967.60, "ST": 9111.96, "OST": 9663.92, "volume_hL": 1013562.67},
  {"zone": "APAC", "plant": "Suqian", "EPT": 12963.26, "ST": 14636.65, "OST": 15236.07, "volume_hL": 2762632.92},
  {"zone": "APAC", "plant": "Tangshan 2", "EPT": 12578.67, "ST": 14349.58, "OST": 14928.07, "volume_hL": 1804951.35},
  {"zone": "APAC", "plant": "VSIP", "EPT": 4176.66, "ST": 4931.65, "OST": 5107.43, "volume_hL": 406435.37},
  {"zone": "APAC", "plant": "Wenzhou", "EPT": 11066.53, "ST": 12501.84, "OST": 12767.33, "volume_hL": 2750215.49},
  {"zone": "APAC", "plant": "Wugang", "EPT": 5177.90, "ST": 5883.95, "OST": 6235.00, "volume_hL": 563191.54},
  {"zone": "APAC", "plant": "Wuhan", "EPT": 27728.89, "ST": 31682.68, "OST": 33893.39, "volume_hL": 3675292.48},
  {"zone": "APAC", "plant": "Xiaogan", "EPT": 1339.39, "ST": 1715.68, "OST": 1715.68, "volume_hL": 170948.78},
  {"zone": "APAC", "plant": "Xinxiang", "EPT": 8031.07, "ST": 9070.10, "OST": 9161.00, "volume_hL": 1918330.51},
  {"zone": "APAC", "plant": "Xinyang", "EPT": 3044.02, "ST": 3496.58, "OST": 3553.92, "volume_hL": 554296.64},
  {"zone": "APAC", "plant": "Yanji", "EPT": 2798.37, "ST": 3253.43, "OST": 3316.33, "volume_hL": 561801.03},
  {"zone": "APAC", "plant": "Yingkou", "EPT": 2991.53, "ST": 3505.67, "OST": 3563.25, "volume_hL": 554500.71},
  {"zone": "APAC", "plant": "Zhangzhou", "EPT": 11898.08, "ST": 13737.82, "OST": 15348.53, "volume_hL": 1807631.12},
  {"zone": "APAC", "plant": "Ziyang", "EPT": 16283.52, "ST": 18539.45, "OST": 19428.24, "volume_hL": 2844535.17},
  {"zone": "EUR", "plant": "Bremen", "EPT": 23292.06, "ST": 36356.22, "OST": 38019.75, "volume_hL": 3949538.97},
  {"zone": "EUR", "plant": "Dommelen", "EPT": 6873.94, "ST": 9478.03, "OST": 9848.95, "volume_hL": 912723.14},
  {"zone": "EUR", "plant": "Hoegaarden", "EPT": 6387.42, "ST": 12644.03, "OST": 14525.94, "volume_hL": 1054875.38},
  {"zone": "EUR", "plant": "Issum", "EPT": 2708.33, "ST": 4467.31, "OST": 5174.54, "volume_hL": 432061.04},
  {"zone": "EUR", "plant": "Jupille", "EPT": 16918.03, "ST": 33730.56, "OST": 36883.44, "volume_hL": 2592627.32},
  {"zone": "EUR", "plant": "Las Palmas", "EPT": 4210.53, "ST": 6871.39, "OST": 8558.27, "volume_hL": 486406.02},
  {"zone": "EUR", "plant": "Leuven", "EPT": 34670.23, "ST": 58248.58, "OST": 66629.81, "volume_hL": 4726129.95},
  {"zone": "EUR", "plant": "Magor", "EPT": 23078.50, "ST": 37615.55, "OST": 42216.75, "volume_hL": 5025309.00},
  {"zone": "EUR", "plant": "Munich", "EPT": 9263.85, "ST": 16967.55, "OST": 20635.02, "volume_hL": 1716823.41},
  {"zone": "EUR", "plant": "Samlesbury", "EPT": 12088.93, "ST": 21448.05, "OST": 24120.28, "volume_hL": 3357540.27},
  {"zone": "EUR", "plant": "Santa Cruz (SABM)", "EPT": 1601.64, "ST": 3400.22, "OST": 3687.55, "volume_hL": 217000.78},
  {"zone": "EUR", "plant": "Wernigerode", "EPT": 11806.29, "ST": 18110.90, "OST": 20239.24, "volume_hL": 1848809.92},
  {"zone": "MAZ", "plant": "Arequipa", "EPT": 6820.41, "ST": 8614.71, "OST": 8626.42, "volume_hL": 1606664.51},
  {"zone": "MAZ", "plant": "Ate Beer", "EPT": 21885.06, "ST": 27186.23, "OST": 30062.00, "volume_hL": 7644600.21},
  {"zone": "MAZ", "plant": "Atlantico", "EPT": 4603.30, "ST": 6002.85, "OST": 7147.99, "volume_hL": 1617127.76},
  {"zone": "MAZ", "plant": "Barranquilla", "EPT": 22672.48, "ST": 29075.90, "OST": 30706.79, "volume_hL": 4200971.00},
  {"zone": "MAZ", "plant": "Boyaca", "EPT": 15259.77, "ST": 18094.13, "OST": 18928.79, "volume_hL": 4276591.20},
  {"zone": "MAZ", "plant": "Bucaramanga", "EPT": 8663.54, "ST": 11718.56, "OST": 12701.85, "volume_hL": 1936433.29},
  {"zone": "MAZ", "plant": "Cusco", "EPT": 3914.66, "ST": 4856.24, "OST": 4950.00, "volume_hL": 1068856.92},
  {"zone": "MAZ", "plant": "GUADALAJARA", "EPT": 15115.06, "ST": 21037.18, "OST": 23355.30, "volume_hL": 4330405.62},
  {"zone": "MAZ", "plant": "Guayaquil Beer", "EPT": 17261.11, "ST": 23173.33, "OST": 24956.84, "volume_hL": 3257921.96},
  {"zone": "MAZ", "plant": "Hato Nuevo", "EPT": 14634.48, "ST": 21120.15, "OST": 27725.42, "volume_hL": 1345153.71},
  {"zone": "MAZ", "plant": "Huarochiri Water", "EPT": 5112.92, "ST": 5853.71, "OST": 5967.70, "volume_hL": 929132.60},
  {"zone": "MAZ", "plant": "Ind La Constancia Beer", "EPT": 12576.29, "ST": 15178.62, "OST": 15678.31, "volume_hL": 1732852.09},
  {"zone": "MAZ", "plant": "Ind La Constancia CSD", "EPT": 24295.34, "ST": 29784.50, "OST": 31052.63, "volume_hL": 4086218.20},
  {"zone": "MAZ", "plant": "Ind La Constancia Water", "EPT": 5403.32, "ST": 6253.50, "OST": 6567.18, "volume_hL": 355053.58},
  {"zone": "MAZ", "plant": "MAZATLAN", "EPT": 1956.87, "ST": 2708.19, "OST": 3080.90, "volume_hL": 720912.03},
  {"zone": "MAZ", "plant": "Medellin", "EPT": 19632.07, "ST": 25840.48, "OST": 29993.70, "volume_hL": 3930433.73},
  {"zone": "MAZ", "plant": "Merida", "EPT": 7706.59, "ST": 8961.79, "OST": 9550.80, "volume_hL": 2848134.46},
  {"zone": "MAZ", "plant": "Mexico Apan", "EPT": 19384.48, "ST": 25753.76, "OST": 32237.98, "volume_hL": 11762720.83},
  {"zone": "MAZ", "plant": "Mexico Plant", "EPT": 36176.58, "ST": 48674.22, "OST": 61468.06, "volume_hL": 10413536.22},
  {"zone": "MAZ", "plant": "Motupe Beer", "EPT": 12668.65, "ST": 17048.53, "OST": 19113.97, "volume_hL": 3072655.00},
  {"zone": "MAZ", "plant": "Panama Beer", "EPT": 9224.88, "ST": 11236.71, "OST": 11830.99, "volume_hL": 1653771.91},
  {"zone": "MAZ", "plant": "Quito", "EPT": 7976.90, "ST": 10068.69, "OST": 10593.19, "volume_hL": 2252164.72},
  {"zone": "MAZ", "plant": "San Juan", "EPT": 4933.79, "ST": 6526.19, "OST": 7572.44, "volume_hL": 1842422.99},
  {"zone": "MAZ", "plant": "San Pedro Sula Beer", "EPT": 14059.05, "ST": 16543.26, "OST": 17210.38, "volume_hL": 2053368.90},
  {"zone": "MAZ", "plant": "San Pedro Sula CSD", "EPT": 32335.19, "ST": 38174.15, "OST": 39415.77, "volume_hL": 8419026.37},
  {"zone": "MAZ", "plant": "Santo Domingo", "EPT": 20952.57, "ST": 25146.68, "OST": 26990.02, "volume_hL": 4433415.14},
  {"zone": "MAZ", "plant": "TORREON", "EPT": 12714.90, "ST": 14420.94, "OST": 14829.97, "volume_hL": 2797044.33},
  {"zone": "MAZ", "plant": "Tocancipa", "EPT": 47246.38, "ST": 59098.14, "OST": 61491.00, "volume_hL": 11863137.55},
  {"zone": "MAZ", "plant": "Tuxtepec", "EPT": 39253.16, "ST": 55184.15, "OST": 65413.18, "volume_hL": 11058499.26},
  {"zone": "MAZ", "plant": "Valle", "EPT": 20118.37, "ST": 27399.22, "OST": 29448.56, "volume_hL": 4654841.60},
  {"zone": "MAZ", "plant": "ZACATECAS", "EPT": 63668.40, "ST": 73059.46, "OST": 76450.49, "volume_hL": 21490232.09},
  {"zone": "MAZ", "plant": "Zacapa", "EPT": 1559.34, "ST": 1767.94, "OST": 1870.67, "volume_hL": 226269.34},
  {"zone": "NAZ", "plant": "Baldwinsville", "EPT": 20957.02, "ST": 29203.64, "OST": 31215.58, "volume_hL": 6943329.38},
  {"zone": "NAZ", "plant": "Cartersville", "EPT": 20802.52, "ST": 28526.89, "OST": 32835.72, "volume_hL": 6603925.34},
  {"zone": "NAZ", "plant": "Columbus", "EPT": 21190.10, "ST": 29632.23, "OST": 42329.46, "volume_hL": 7206595.65},
  {"zone": "NAZ", "plant": "Creston", "EPT": 2243.33, "ST": 2729.68, "OST": 2797.97, "volume_hL": 502227.59},
  {"zone": "NAZ", "plant": "Edmonton", "EPT": 6101.55, "ST": 9442.44, "OST": 10577.88, "volume_hL": 1301788.03},
  {"zone": "NAZ", "plant": "FairField", "EPT": 5735.96, "ST": 7507.94, "OST": 8059.41, "volume_hL": 1956824.66},
  {"zone": "NAZ", "plant": "Fort Collins", "EPT": 18989.99, "ST": 27200.18, "OST": 34835.92, "volume_hL": 6851767.27},
  {"zone": "NAZ", "plant": "Halifax", "EPT": 3234.81, "ST": 4455.82, "OST": 5127.95, "volume_hL": 561131.42},
  {"zone": "NAZ", "plant": "Houston", "EPT": 32425.77, "ST": 42694.43, "OST": 45398.47, "volume_hL": 10308497.71},
  {"zone": "NAZ", "plant": "Jacksonville", "EPT": 23039.60, "ST": 31263.17, "OST": 33347.47, "volume_hL": 7516804.21},
  {"zone": "NAZ", "plant": "London", "EPT": 10608.78, "ST": 15052.53, "OST": 18485.55, "volume_hL": 2873163.79},
  {"zone": "NAZ", "plant": "Los Angeles", "EPT": 23293.07, "ST": 33980.91, "OST": 39717.65, "volume_hL": 6766591.00},
  {"zone": "NAZ", "plant": "Merrimack", "EPT": 2060.12, "ST": 2695.10, "OST": 2977.33, "volume_hL": 637323.04},
  {"zone": "NAZ", "plant": "Montreal", "EPT": 10173.78, "ST": 16156.18, "OST": 19316.02, "volume_hL": 2545445.55},
  {"zone": "NAZ", "plant": "Newark", "EPT": 1660.69, "ST": 2582.12, "OST": 2631.02, "volume_hL": 638021.16},
  {"zone": "NAZ", "plant": "St. Louis", "EPT": 31650.95, "ST": 42811.83, "OST": 47628.26, "volume_hL": 11053545.05},
  {"zone": "NAZ", "plant": "Williamsburg", "EPT": 17850.09, "ST": 25345.67, "OST": 26855.36, "volume_hL": 5791175.80},
  {"zone": "SAZ", "plant": "Acheral", "EPT": 3726.34, "ST": 4967.25, "OST": 6419.73, "volume_hL": 1058560.27},
  {"zone": "SAZ", "plant": "Agudos", "EPT": 22608.82, "ST": 29435.65, "OST": 34013.96, "volume_hL": 5986939.64},
  {"zone": "SAZ", "plant": "Almirante Tamandare", "EPT": 6425.66, "ST": 7613.40, "OST": 7991.51, "volume_hL": 1286149.56},
  {"zone": "SAZ", "plant": "Anapolis", "EPT": 31742.57, "ST": 44959.54, "OST": 55254.62, "volume_hL": 6675242.37},
  {"zone": "SAZ", "plant": "Aquiraz", "EPT": 24668.88, "ST": 34369.13, "OST": 46980.02, "volume_hL": 4703919.03},
  {"zone": "SAZ", "plant": "Cachoeiras de Macacu", "EPT": 14602.58, "ST": 18760.84, "OST": 24395.86, "volume_hL": 2369745.50},
  {"zone": "SAZ", "plant": "Camacari", "EPT": 21897.49, "ST": 35298.03, "OST": 46784.21, "volume_hL": 4936811.75},
  {"zone": "SAZ", "plant": "Cochabamba", "EPT": 11209.26, "ST": 12815.41, "OST": 12977.16, "volume_hL": 1030935.54},
  {"zone": "SAZ", "plant": "Cordoba", "EPT": 4270.03, "ST": 4851.51, "OST": 5318.03, "volume_hL": 745018.38},
  {"zone": "SAZ", "plant": "Corrientes", "EPT": 4022.39, "ST": 5646.49, "OST": 7232.64, "volume_hL": 1254987.25},
  {"zone": "SAZ", "plant": "Cuiaba", "EPT": 13328.59, "ST": 18884.92, "OST": 20896.09, "volume_hL": 2547707.18},
  {"zone": "SAZ", "plant": "El Alto", "EPT": 12221.16, "ST": 14495.37, "OST": 15557.05, "volume_hL": 1296070.04},
  {"zone": "SAZ", "plant": "Estancia", "EPT": 13368.49, "ST": 18710.24, "OST": 23697.94, "volume_hL": 3517105.14},
  {"zone": "SAZ", "plant": "Guarulhos", "EPT": 10982.73, "ST": 14477.24, "OST": 16430.91, "volume_hL": 2334564.88},
  {"zone": "SAZ", "plant": "Huari", "EPT": 4407.50, "ST": 7130.35, "OST": 7721.29, "volume_hL": 601623.02},
  {"zone": "SAZ", "plant": "Itapissuma", "EPT": 30846.84, "ST": 49152.78, "OST": 60268.53, "volume_hL": 7617627.80},
  {"zone": "SAZ", "plant": "Jacarei", "EPT": 31933.88, "ST": 41033.28, "OST": 50650.91, "volume_hL": 6971810.22},
  {"zone": "SAZ", "plant": "Jaguariuna", "EPT": 33620.29, "ST": 46988.35, "OST": 62825.04, "volume_hL": 5845375.89},
  {"zone": "SAZ", "plant": "Juatuba", "EPT": 18104.56, "ST": 22306.09, "OST": 27988.57, "volume_hL": 4584136.79},
  {"zone": "SAZ", "plant": "Jundiai", "EPT": 23773.44, "ST": 34240.74, "OST": 48534.61, "volume_hL": 6622493.62},
  {"zone": "SAZ", "plant": "La Paz", "EPT": 3149.58, "ST": 5180.72, "OST": 6133.29, "volume_hL": 712689.00},
  {"zone": "SAZ", "plant": "Lages", "EPT": 13329.32, "ST": 16371.17, "OST": 21522.22, "volume_hL": 2869907.85},
  {"zone": "SAZ", "plant": "Manantial", "EPT": 6574.22, "ST": 7970.74, "OST": 8338.89, "volume_hL": 1352406.27},
  {"zone": "SAZ", "plant": "Manaus", "EPT": 10628.33, "ST": 14858.22, "OST": 18099.28, "volume_hL": 2017668.44},
  {"zone": "SAZ", "plant": "Mendoza", "EPT": 5225.84, "ST": 7420.19, "OST": 7836.98, "volume_hL": 1676115.80},
  {"zone": "SAZ", "plant": "Montevideo", "EPT": 5788.41, "ST": 8850.25, "OST": 10182.06, "volume_hL": 980625.95},
  {"zone": "SAZ", "plant": "Pirai", "EPT": 26887.71, "ST": 36941.72, "OST": 55199.07, "volume_hL": 5571090.25},
  {"zone": "SAZ", "plant": "Pompeya", "EPT": 17027.49, "ST": 20828.02, "OST": 21651.17, "volume_hL": 4620021.10},
  {"zone": "SAZ", "plant": "Ponta Grossa", "EPT": 11988.13, "ST": 16109.78, "OST": 22109.91, "volume_hL": 3939583.47},
  {"zone": "SAZ", "plant": "Quilmes", "EPT": 10095.49, "ST": 12614.51, "OST": 13793.19, "volume_hL": 3325816.02},
  {"zone": "SAZ", "plant": "Rio de Janeiro", "EPT": 42014.70, "ST": 58355.21, "OST": 80057.80, "volume_hL": 10763763.96},
  {"zone": "SAZ", "plant": "Sacaba", "EPT": 1232.04, "ST": 1348.46, "OST": 10191.24, "volume_hL": 118649.33},
  {"zone": "SAZ", "plant": "Santa Cruz", "EPT": 19210.20, "ST": 22746.24, "OST": 23914.06, "volume_hL": 1547722.30},
  {"zone": "SAZ", "plant": "Santiago", "EPT": 13947.42, "ST": 17924.83, "OST": 24052.87, "volume_hL": 3203648.76},
  {"zone": "SAZ", "plant": "Sao Luis", "EPT": 13234.60, "ST": 19721.23, "OST": 27080.70, "volume_hL": 3257060.31},
  {"zone": "SAZ", "plant": "Sapucaia do Sul", "EPT": 9920.27, "ST": 15623.24, "OST": 21685.49, "volume_hL": 2349645.28},
  {"zone": "SAZ", "plant": "Sete Lagoas", "EPT": 33754.06, "ST": 42229.47, "OST": 51949.94, "volume_hL": 9710192.20},
  {"zone": "SAZ", "plant": "Teresina", "EPT": 14194.27, "ST": 19553.34, "OST": 25420.65, "volume_hL": 2494658.59},
  {"zone": "SAZ", "plant": "Uberlandia", "EPT": 21851.73, "ST": 32297.16, "OST": 40030.83, "volume_hL": 6182293.50},
  {"zone": "SAZ", "plant": "Viamao", "EPT": 15578.18, "ST": 22756.63, "OST": 31513.24, "volume_hL": 4867371.15},
  {"zone": "SAZ", "plant": "Ypane", "EPT": 17446.82, "ST": 22314.74, "OST": 24140.03, "volume_hL": 3660066.85},
  {"zone": "SAZ", "plant": "Zarate", "EPT": 13880.71, "ST": 18749.06, "OST": 20778.37, "volume_hL": 3408602.58},
]

# ── Known mappings (DB plant -> VPO site) ──────────────────────────────────
KNOWN_MAPPINGS = {
    ("Putian (New)", "APAC"): "Putian",
    ("Accra Beer", "AFR"): "Accra",
    ("Alrode Beer", "AFR"): "Alrode",
    ("Gateway Brewery", "AFR"): "Gateway",
    ("Jinja Beer", "AFR"): "Jinja",
    ("Kgalagadi Beer", "AFR"): "Kgalagadi",
    ("Lesotho Beer", "AFR"): "Lesotho",
    ("Lusaka Beer", "AFR"): "Lusaka",
    ("Namibia Beer", "AFR"): "Namibia",
    ("Ndola Beer", "AFR"): "Ndola",
    ("Nanchang 3", "APAC"): "Nanchang 1",
    ("Mexico Apan", "MAZ"): "Mexico APAN",
    ("ZACATECAS", "MAZ"): "Zacatecas",
    ("GUADALAJARA", "MAZ"): "Guadalajara",
    ("MAZATLAN", "MAZ"): "Mazatlan",
    ("TORREON", "MAZ"): "Torreon",
    ("Guayaquil Beer", "MAZ"): "Guayaquil",
    ("Motupe Beer", "MAZ"): "Motupe",
    ("Panama Beer", "MAZ"): "Panama",
    ("Ate Beer", "MAZ"): "Ate",
    ("Ind La Constancia Beer", "MAZ"): "Ind La Constancia",
    ("San Pedro Sula Beer", "MAZ"): "San Pedro Sula",
    ("Cachoeiras de Macacu", "SAZ"): "Cachoeiras",
    ("Sapucaia do Sul", "SAZ"): "Sapucaia",
    ("Santa Cruz (SABM)", "EUR"): "Santa Cruz SABM",
    ("Santa Cruz", "SAZ"): "Santa Cruz BO",
    ("Jiamusi New", "APAC"): "Jiamusi",
    ("Mudanjiang(New)", "APAC"): "Mudanjiang",
    ("Estancia", "SAZ"): "Sergipe",
    ("Sao Luis", "SAZ"): "Equatorial",
    ("Almirante Tamandare", "SAZ"): "Curitibana",
}

# Plants to skip if no match found
SKIP_IF_NO_MATCH = {
    "Sacaba", "Huarochiri Water", "Acheral", "Manantial", "Pompeya",
    "Arusha", "Celebrity", "Fosters", "VSIP", "Xiaogan", "Yanji",
    "Ningbo", "Jingmen", "FairField", "Merrimack", "Newark", "Ndola Beer",
}


def normalize_name(name):
    """Normalize plant/site name for fuzzy matching."""
    n = name.lower().strip()
    for suffix in [" beer", " csd", " water", " (new)", " (sabm)", " plant", " 2"]:
        n = n.replace(suffix, "")
    return n.strip()


def fuzzy_match_plants(db_plants, vpo_sites):
    """Match DB plants to VPO sites using zone anchor + string similarity."""
    # Index VPO sites by zone
    vpo_by_zone = {}
    vpo_name_map = {}  # lowercase name -> site obj
    for s in vpo_sites:
        z = s["zone"]
        vpo_by_zone.setdefault(z, []).append(s)
        vpo_name_map[(s["site"].lower(), z)] = s

    matched = []
    unmatched = []

    for p in db_plants:
        plant_name = p["plant"]
        zone = p["zone"]
        key = (plant_name, zone)

        # 1. Check known mappings
        if key in KNOWN_MAPPINGS:
            target_name = KNOWN_MAPPINGS[key]
            # Find the VPO site
            found = None
            for s in vpo_sites:
                if s["site"].lower() == target_name.lower() and s["zone"] == zone:
                    found = s
                    break
                # Some known mappings may cross-zone (shouldn't, but check)
                if s["site"].lower() == target_name.lower():
                    found = s
                    break
            if found:
                matched.append({**p, "vpo_site": found["site"], "bundle": found["bundle"],
                                "vpoNum": found["vpoNum"], "techScore": found["techScore"]})
                continue
            elif plant_name in SKIP_IF_NO_MATCH:
                unmatched.append(plant_name)
                continue
            else:
                # Known mapping target not found in VPO - treat as unmatched
                unmatched.append(plant_name)
                continue

        # 2. Try exact match (case-insensitive) within zone
        exact_key = (plant_name.lower(), zone)
        if exact_key in vpo_name_map:
            s = vpo_name_map[exact_key]
            matched.append({**p, "vpo_site": s["site"], "bundle": s["bundle"],
                            "vpoNum": s["vpoNum"], "techScore": s["techScore"]})
            continue

        # 3. Fuzzy match within zone
        norm_plant = normalize_name(plant_name)
        best_score = 0
        best_site = None
        for s in vpo_by_zone.get(zone, []):
            norm_site = normalize_name(s["site"])
            score = SequenceMatcher(None, norm_plant, norm_site).ratio()
            if score > best_score:
                best_score = score
                best_site = s

        if best_score >= 0.7 and best_site:
            matched.append({**p, "vpo_site": best_site["site"], "bundle": best_site["bundle"],
                            "vpoNum": best_site["vpoNum"], "techScore": best_site["techScore"]})
        else:
            if plant_name in SKIP_IF_NO_MATCH:
                unmatched.append(plant_name)
            else:
                unmatched.append(plant_name)

    return matched, unmatched


def compute_aggregations(matched):
    """Compute OSE/GLY per plant, per zone, per bundle."""
    plants_out = []
    for m in matched:
        ose = m["EPT"] / m["OST"] if m["OST"] > 0 else 0
        gly = m["EPT"] / m["ST"] if m["ST"] > 0 else 0
        plants_out.append({
            "plant": m["plant"],
            "vpo_site": m["vpo_site"],
            "zone": m["zone"],
            "bundle": m["bundle"],
            "OSE": round(ose, 4),
            "GLY": round(gly, 4),
            "EPT": round(m["EPT"], 2),
            "OST": round(m["OST"], 2),
            "ST": round(m["ST"], 2),
            "volume_hL": round(m["volume_hL"], 2),
            "vpoNum": m["vpoNum"],
            "techScore": m["techScore"],
        })

    # By zone
    zone_agg = {}
    for p in plants_out:
        z = p["zone"]
        if z not in zone_agg:
            zone_agg[z] = {"EPT": 0, "OST": 0, "ST": 0, "volume_hL": 0, "n_plants": 0}
        zone_agg[z]["EPT"] += p["EPT"]
        zone_agg[z]["OST"] += p["OST"]
        zone_agg[z]["ST"] += p["ST"]
        zone_agg[z]["volume_hL"] += p["volume_hL"]
        zone_agg[z]["n_plants"] += 1

    by_zone = []
    for z in sorted(zone_agg.keys()):
        a = zone_agg[z]
        ose_pct = (a["EPT"] / a["OST"] * 100) if a["OST"] > 0 else 0
        gly_pct = (a["EPT"] / a["ST"] * 100) if a["ST"] > 0 else 0
        by_zone.append({
            "zone": z,
            "n_plants": a["n_plants"],
            "EPT": round(a["EPT"], 2),
            "OST": round(a["OST"], 2),
            "ST": round(a["ST"], 2),
            "ose_pct": round(ose_pct, 2),
            "gly_pct": round(gly_pct, 2),
            "volume_hL": round(a["volume_hL"], 2),
        })

    # By bundle
    bundle_agg = {}
    for p in plants_out:
        b = p["bundle"]
        if b not in bundle_agg:
            bundle_agg[b] = {"EPT": 0, "OST": 0, "ST": 0, "volume_hL": 0, "n_plants": 0}
        bundle_agg[b]["EPT"] += p["EPT"]
        bundle_agg[b]["OST"] += p["OST"]
        bundle_agg[b]["ST"] += p["ST"]
        bundle_agg[b]["volume_hL"] += p["volume_hL"]
        bundle_agg[b]["n_plants"] += 1

    bundle_stats = {}
    for b in sorted(bundle_agg.keys()):
        a = bundle_agg[b]
        ose_pct = (a["EPT"] / a["OST"] * 100) if a["OST"] > 0 else 0
        gly_pct = (a["EPT"] / a["ST"] * 100) if a["ST"] > 0 else 0
        bundle_stats[b] = {
            "n_plants": a["n_plants"],
            "ose_pct": round(ose_pct, 2),
            "gly_pct": round(gly_pct, 2),
            "volume_hL": round(a["volume_hL"], 2),
            "EPT": round(a["EPT"], 2),
            "OST": round(a["OST"], 2),
            "ST": round(a["ST"], 2),
        }

    return plants_out, by_zone, bundle_stats


def generate_json_output(plants_out, by_zone, bundle_stats, unmatched):
    """Generate the JSON output file."""
    # Format plants for JSON (OSE as decimal, include vpo fields)
    plants_json = []
    for p in sorted(plants_out, key=lambda x: (-x["OSE"])):
        plants_json.append({
            "plant": p["plant"],
            "zone": p["zone"],
            "bundle": p["bundle"],
            "OSE": p["OSE"],
            "GLY": p["GLY"],
            "EPT": p["EPT"],
            "OST": p["OST"],
            "ST": p["ST"],
            "volume_hL": p["volume_hL"],
            "vpoNum": p["vpoNum"],
            "techScore": p["techScore"],
        })

    output = {
        "methodology": "OSE=ΣEPT/ΣOST per plant bottom-up",
        "source": "gb_supplychainkpi_consolidated",
        "period": "2025 AC MTH",
        "generated": str(date.today()),
        "bundle_stats": bundle_stats,
        "by_zone": by_zone,
        "plants": plants_json,
        "unmatched_plants": sorted(unmatched),
        "match_stats": {
            "total_db_plants": len(DB_PLANTS),
            "matched": len(plants_out),
            "unmatched": len(unmatched),
        }
    }

    out_path = BASE_DIR / "vpo_tech_data_ose_correct.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print(f"JSON output written to {out_path}")
    return output


def generate_html_output(plants_out, by_zone, bundle_stats, unmatched):
    """Generate the HTML dashboard."""

    # Prepare bubble chart data by zone
    zone_colors = {
        "AFR": "rgba(251,146,60,0.70)",
        "SAZ": "rgba(52,211,153,0.70)",
        "MAZ": "rgba(96,165,250,0.70)",
        "NAZ": "rgba(167,139,250,0.70)",
        "EUR": "rgba(244,114,182,0.70)",
        "APAC": "rgba(251,113,133,0.70)",
    }

    # Compute volume range for bubble sizing
    volumes = [p["volume_hL"] for p in plants_out]
    max_vol = max(volumes) if volumes else 1
    min_vol = min(volumes) if volumes else 0

    def bubble_radius(vol):
        """Normalize volume to 5-40px radius using sqrt scale."""
        if max_vol == min_vol:
            return 15
        normalized = (math.sqrt(vol) - math.sqrt(min_vol)) / (math.sqrt(max_vol) - math.sqrt(min_vol))
        return round(5 + normalized * 35, 1)

    def plant_hash_jitter(name):
        """Deterministic jitter from plant name hash."""
        h = int(hashlib.md5(name.encode()).hexdigest(), 16)
        jx = ((h % 1000) / 1000.0 - 0.5) * 0.10  # +/- 0.05
        jy = (((h >> 10) % 1000) / 1000.0 - 0.5) * 0.30  # +/- 0.15
        return round(jx, 4), round(jy, 4)

    # Build datasets
    datasets_js = []
    for zone in ["AFR", "SAZ", "MAZ", "NAZ", "EUR", "APAC"]:
        color = zone_colors[zone]
        data_points = []
        for p in plants_out:
            if p["zone"] != zone:
                continue
            jx, jy = plant_hash_jitter(p["plant"])
            data_points.append({
                "x": round(p["techScore"] + jx, 4),
                "y": round(p["vpoNum"] + jy, 4),
                "r": bubble_radius(p["volume_hL"]),
                "plant": p["plant"],
                "zone": p["zone"],
                "bundle": p["bundle"],
                "ose": round(p["OSE"] * 100, 2),
                "gly": round(p["GLY"] * 100, 2),
                "volume": round(p["volume_hL"]),
            })
        datasets_js.append({
            "label": zone,
            "backgroundColor": color,
            "borderColor": color.replace("0.70", "1.0"),
            "data": data_points,
        })

    datasets_json = json.dumps(datasets_js)

    # KPI table rows (B4 > B2 > B3 > B1)
    bundle_order = ["B4", "B2", "B3", "B1"]
    bundle_row_colors = {
        "B4": ("background:#1E3A5F", "color:#93C5FD"),
        "B2": ("background:#064E3B", "color:#6EE7B7"),
        "B3": ("background:#451A03", "color:#FCD34D"),
        "B1": ("background:#450A0A", "color:#FCA5A5"),
    }

    kpi_rows = ""
    for b in bundle_order:
        if b not in bundle_stats:
            continue
        s = bundle_stats[b]
        bg, fg = bundle_row_colors[b]
        kpi_rows += f"""<tr style="{bg};{fg}">
            <td style="font-weight:700">{b}</td>
            <td>{s['n_plants']}</td>
            <td>{s['ose_pct']:.2f}%</td>
            <td>{s['gly_pct']:.2f}%</td>
            <td>{s['volume_hL']:,.0f}</td>
            <td>{s['EPT']:,.0f}</td>
            <td>{s['OST']:,.0f}</td>
        </tr>\n"""

    zone_rows = ""
    for z in by_zone:
        zone_rows += f"""<tr>
            <td>{z['zone']}</td>
            <td>{z['n_plants']}</td>
            <td>{z['ose_pct']:.2f}%</td>
            <td>{z['gly_pct']:.2f}%</td>
            <td>{z['volume_hL']:,.0f}</td>
        </tr>\n"""

    # Insight cards
    best_ose_bundle = max(bundle_stats.items(), key=lambda x: x[1]["ose_pct"])
    largest_vol_bundle = max(bundle_stats.items(), key=lambda x: x[1]["volume_hL"])
    best_ose_zone = max(by_zone, key=lambda x: x["ose_pct"])
    total_matched = len(plants_out)
    total_db = len(DB_PLANTS)

    warning_banner = ""
    if total_matched < 40:
        warning_banner = """<div style="background:#92400E;color:#FDE68A;padding:16px 24px;
            border-radius:8px;margin-bottom:24px;font-weight:600;text-align:center;
            border:1px solid #F59E0B">
            WARNING: Only {0} plants matched (< 40). Results may use fallback data.
        </div>""".format(total_matched)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VPO Tech Strategy &mdash; OSE Packaging Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#0F172A;color:#E2E8F0;font-family:'Inter',system-ui,sans-serif;padding:0}}
.header{{background:#1E293B;border-bottom:4px solid #F5A800;padding:28px 40px}}
.header h1{{font-size:1.7rem;font-weight:700;color:#F8FAFC}}
.header p{{color:#94A3B8;font-size:0.9rem;margin-top:4px}}
.container{{max-width:1400px;margin:0 auto;padding:32px 24px}}
.card{{background:#1E293B;border-radius:12px;padding:24px;margin-bottom:24px}}
.card h2{{font-size:1.15rem;font-weight:600;color:#F5A800;margin-bottom:16px}}
table{{width:100%;border-collapse:collapse;font-size:0.88rem}}
th{{background:#334155;color:#CBD5E1;padding:10px 14px;text-align:left;font-weight:600}}
td{{padding:9px 14px;border-bottom:1px solid #334155}}
.chart-container{{position:relative;height:520px;width:100%}}
.insights{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:24px}}
.insight-card{{background:#1E293B;border-radius:12px;padding:20px;border-left:4px solid #F5A800}}
.insight-card .label{{font-size:0.78rem;color:#94A3B8;text-transform:uppercase;letter-spacing:0.5px}}
.insight-card .value{{font-size:1.5rem;font-weight:700;color:#F8FAFC;margin-top:4px}}
.insight-card .detail{{font-size:0.82rem;color:#64748B;margin-top:4px}}
.methodology{{background:#1E293B;border-radius:12px;padding:20px;margin-top:24px;
    font-size:0.8rem;color:#64748B;line-height:1.6;border-left:4px solid #475569}}
</style>
</head>
<body>
<div class="header">
  <h1>VPO Tech Strategy &mdash; OSE Packaging</h1>
  <p>2025 Actual Monthly | Source: gb_supplychainkpi_consolidated | Generated {date.today()}</p>
</div>
<div class="container">

{warning_banner}

<!-- Bubble Chart -->
<div class="card">
  <h2>Tech Maturity vs VPO Level (bubble = volume)</h2>
  <div class="chart-container">
    <canvas id="bubbleChart"></canvas>
  </div>
</div>

<!-- KPI Table by Bundle -->
<div class="card">
  <h2>KPI by Bundle (OSE = &Sigma;EPT / &Sigma;OST)</h2>
  <table>
    <thead><tr><th>Bundle</th><th>N Plants</th><th>OSE%</th><th>GLY%</th><th>Volume hL</th><th>&Sigma;EPT</th><th>&Sigma;OST</th></tr></thead>
    <tbody>{kpi_rows}</tbody>
  </table>
</div>

<!-- Zone Table -->
<div class="card">
  <h2>KPI by Zone</h2>
  <table>
    <thead><tr><th>Zone</th><th>N Plants</th><th>OSE%</th><th>GLY%</th><th>Volume hL</th></tr></thead>
    <tbody>{zone_rows}</tbody>
  </table>
</div>

<!-- Insight Cards -->
<div class="insights">
  <div class="insight-card">
    <div class="label">Best OSE Bundle</div>
    <div class="value">{best_ose_bundle[0]}</div>
    <div class="detail">OSE {best_ose_bundle[1]['ose_pct']:.2f}% | {best_ose_bundle[1]['n_plants']} plants</div>
  </div>
  <div class="insight-card">
    <div class="label">Largest Volume Bundle</div>
    <div class="value">{largest_vol_bundle[0]}</div>
    <div class="detail">{largest_vol_bundle[1]['volume_hL']:,.0f} hL | {largest_vol_bundle[1]['n_plants']} plants</div>
  </div>
  <div class="insight-card">
    <div class="label">Zone with Highest OSE</div>
    <div class="value">{best_ose_zone['zone']}</div>
    <div class="detail">OSE {best_ose_zone['ose_pct']:.2f}% | {best_ose_zone['n_plants']} plants</div>
  </div>
  <div class="insight-card">
    <div class="label">Plant Matching</div>
    <div class="value">{total_matched} / {total_db}</div>
    <div class="detail">{total_matched} matched, {len(unmatched)} unmatched</div>
  </div>
</div>

<!-- Methodology -->
<div class="methodology">
  <strong>Methodology:</strong> OSE = &Sigma;EPT / &Sigma;OST (bottom-up aggregation from line level).
  Source: gb_supplychainkpi_consolidated, 2025 Actual Monthly, excluding keg/kegging lines.
  Methodology: never simple average &mdash; always ratio of sums.
</div>

</div>

<script>
const datasets = {datasets_json};

const ctx = document.getElementById('bubbleChart').getContext('2d');
new Chart(ctx, {{
  type: 'bubble',
  data: {{ datasets }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    scales: {{
      x: {{
        title: {{ display: true, text: 'Tech Maturity Score', color: '#CBD5E1', font: {{ size: 13, weight: '600' }} }},
        grid: {{ color: 'rgba(71,85,105,0.3)' }},
        ticks: {{ color: '#94A3B8' }},
        min: 0.5,
        max: 3.5,
      }},
      y: {{
        title: {{ display: true, text: 'VPO Level', color: '#CBD5E1', font: {{ size: 13, weight: '600' }} }},
        grid: {{ color: 'rgba(71,85,105,0.3)' }},
        ticks: {{ color: '#94A3B8' }},
        min: 0,
        max: 7,
      }}
    }},
    plugins: {{
      tooltip: {{
        callbacks: {{
          label: function(ctx) {{
            const d = ctx.raw;
            return [
              d.plant + ' (' + d.zone + ')',
              'Bundle: ' + d.bundle,
              'OSE: ' + d.ose.toFixed(1) + '%',
              'GLY: ' + d.gly.toFixed(1) + '%',
              'Volume: ' + d.volume.toLocaleString() + ' hL'
            ];
          }}
        }}
      }},
      legend: {{
        position: 'top',
        labels: {{ color: '#CBD5E1', padding: 16, usePointStyle: true, pointStyle: 'circle' }}
      }},
      annotation: {{
        annotations: {{
          quadB4: {{
            type: 'box', xMin: 1.9, xMax: 3.5, yMin: 4, yMax: 7,
            backgroundColor: 'rgba(30,58,138,0.20)', borderWidth: 0,
            label: {{ display: true, content: 'B4', position: {{ x: 'end', y: 'start' }},
                      color: '#93C5FD', font: {{ size: 13, weight: '700' }} }}
          }},
          quadB1: {{
            type: 'box', xMin: 0.5, xMax: 1.9, yMin: 0, yMax: 4,
            backgroundColor: 'rgba(127,29,29,0.15)', borderWidth: 0,
            label: {{ display: true, content: 'B1', position: {{ x: 'start', y: 'end' }},
                      color: '#FCA5A5', font: {{ size: 13, weight: '700' }} }}
          }},
          quadB2: {{
            type: 'box', xMin: 0.5, xMax: 1.9, yMin: 4, yMax: 7,
            backgroundColor: 'rgba(6,78,59,0.15)', borderWidth: 0,
            label: {{ display: true, content: 'B2', position: {{ x: 'start', y: 'start' }},
                      color: '#6EE7B7', font: {{ size: 13, weight: '700' }} }}
          }},
          quadB3: {{
            type: 'box', xMin: 1.9, xMax: 3.5, yMin: 0, yMax: 4,
            backgroundColor: 'rgba(120,53,15,0.15)', borderWidth: 0,
            label: {{ display: true, content: 'B3', position: {{ x: 'end', y: 'end' }},
                      color: '#FCD34D', font: {{ size: 13, weight: '700' }} }}
          }},
          lineX: {{
            type: 'line', xMin: 1.9, xMax: 1.9, yMin: 0, yMax: 7,
            borderColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderDash: [6, 4]
          }},
          lineY: {{
            type: 'line', yMin: 4, yMax: 4, xMin: 0.5, xMax: 3.5,
            borderColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderDash: [6, 4]
          }}
        }}
      }}
    }}
  }}
}});
</script>
</body>
</html>"""

    out_path = BASE_DIR / "vpo_tech_strategy.html"
    with open(out_path, "w") as f:
        f.write(html)
    print(f"HTML output written to {out_path}")


def main():
    # Load VPO tech data
    vpo_path = BASE_DIR / "vpo_tech_data.json"
    with open(vpo_path) as f:
        vpo_data = json.load(f)
    vpo_sites = vpo_data["sites"]
    print(f"Loaded {len(vpo_sites)} VPO sites from {vpo_path}")
    print(f"Loaded {len(DB_PLANTS)} DB plants (embedded)")

    # Match
    matched, unmatched = fuzzy_match_plants(DB_PLANTS, vpo_sites)
    print(f"\nMatching results: {len(matched)} matched, {len(unmatched)} unmatched")
    if unmatched:
        print(f"Unmatched plants: {', '.join(sorted(unmatched))}")

    # Compute aggregations
    plants_out, by_zone, bundle_stats = compute_aggregations(matched)

    # Print summary tables
    print("\n" + "=" * 80)
    print("BUNDLE SUMMARY (OSE = ΣEPT / ΣOST)")
    print("=" * 80)
    print(f"{'Bundle':<8} {'N':>5} {'OSE%':>8} {'GLY%':>8} {'Volume hL':>15} {'ΣEPT':>12} {'ΣOST':>12}")
    print("-" * 80)
    for b in ["B4", "B2", "B3", "B1"]:
        if b in bundle_stats:
            s = bundle_stats[b]
            print(f"{b:<8} {s['n_plants']:>5} {s['ose_pct']:>7.2f}% {s['gly_pct']:>7.2f}% "
                  f"{s['volume_hL']:>15,.0f} {s['EPT']:>12,.0f} {s['OST']:>12,.0f}")

    print("\n" + "=" * 80)
    print("ZONE SUMMARY")
    print("=" * 80)
    print(f"{'Zone':<8} {'N':>5} {'OSE%':>8} {'GLY%':>8} {'Volume hL':>15}")
    print("-" * 80)
    for z in by_zone:
        print(f"{z['zone']:<8} {z['n_plants']:>5} {z['ose_pct']:>7.2f}% {z['gly_pct']:>7.2f}% "
              f"{z['volume_hL']:>15,.0f}")

    # Generate outputs
    print()
    generate_json_output(plants_out, by_zone, bundle_stats, unmatched)
    generate_html_output(plants_out, by_zone, bundle_stats, unmatched)

    print(f"\nDone. {len(matched)} plants matched out of {len(DB_PLANTS)}.")


if __name__ == "__main__":
    main()
