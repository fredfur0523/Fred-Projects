#!/usr/bin/env python3
"""
Calculate normalized OSE by zone to validate B4>B2>B1>B3 pattern
independent of regional composition bias.

Steps:
1. OSE avg by zone = ΣEPT/ΣOST (bottom-up)
2. OSE_rel per plant = OSE_plant - OSE_zone_avg
3. Aggregate OSE_rel by bundle weighted by volume
4. Breakdown by zone for B4 and B2
5. Update JSON with enriched data
"""

import json
import os

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, "vpo_tech_ose_correct.json")) as f:
    ose_data = json.load(f)

with open(os.path.join(BASE, "vpo_tech_data.json")) as f:
    tech_data = json.load(f)

# ── Step 1: Zone avg OSE (already computed bottom-up in ose_data) ──
zone_avg = {z["zone"]: z["OSE_pct"] for z in ose_data["by_zone"]}
print("=== Step 1: Zone Average OSE (ΣEPT/ΣOST) ===")
for z, v in sorted(zone_avg.items()):
    print(f"  {z}: {v:.2f}%")

# ── Build plant-level lookup from ose_correct (has EPT/OST) ──
plants_correct = {}
for p in ose_data["plants_matched"]:
    key = p["site_json"]
    plants_correct[key] = p

# ── Step 2 & 3: OSE_rel per plant, aggregate by bundle ──
# Use sites from tech_data (all 162), cross-ref with ose_correct for validated OSE
bundle_accum = {}  # bundle -> {sum_ose_rel_x_vol, sum_vol, sum_ose_abs_x_vol, plants: [...]}
zone_bundle_accum = {}  # (zone, bundle) -> same

for site in tech_data["sites"]:
    name = site["site"]
    zone = site["zone"]
    bundle = site["bundle"]
    vol = site["volume"]

    # Get correct OSE from ose_correct if available
    ose_val = None
    if name in plants_correct:
        ose_val = plants_correct[name]["OSE"]
    elif site.get("ose") is not None:
        ose_val = site["ose"]

    if ose_val is None or ose_val == 0 or zone not in zone_avg:
        continue

    z_avg = zone_avg[zone]
    ose_rel = ose_val - z_avg

    # Bundle accumulator
    if bundle not in bundle_accum:
        bundle_accum[bundle] = {"sum_rel_vol": 0, "sum_vol": 0, "sum_abs_vol": 0, "plants": []}
    bundle_accum[bundle]["sum_rel_vol"] += ose_rel * vol
    bundle_accum[bundle]["sum_vol"] += vol
    bundle_accum[bundle]["sum_abs_vol"] += ose_val * vol
    bundle_accum[bundle]["plants"].append({
        "site": name, "zone": zone, "ose": ose_val, "ose_rel": round(ose_rel, 2),
        "volume": vol, "bundle": bundle
    })

    # Zone-bundle accumulator
    zb_key = (zone, bundle)
    if zb_key not in zone_bundle_accum:
        zone_bundle_accum[zb_key] = {"sum_rel_vol": 0, "sum_vol": 0, "sum_abs_vol": 0, "n": 0, "plants": []}
    zone_bundle_accum[zb_key]["sum_rel_vol"] += ose_rel * vol
    zone_bundle_accum[zb_key]["sum_vol"] += vol
    zone_bundle_accum[zb_key]["sum_abs_vol"] += ose_val * vol
    zone_bundle_accum[zb_key]["n"] += 1
    zone_bundle_accum[zb_key]["plants"].append(name)

print("\n=== Step 3: Normalized OSE by Bundle (volume-weighted) ===")
bundle_results = {}
for b in ["B4", "B2", "B1", "B3"]:
    if b not in bundle_accum:
        continue
    acc = bundle_accum[b]
    ose_abs_wt = acc["sum_abs_vol"] / acc["sum_vol"]
    ose_rel_wt = acc["sum_rel_vol"] / acc["sum_vol"]
    n_plants = len(acc["plants"])
    bundle_results[b] = {
        "n_plants_with_ose": n_plants,
        "ose_abs_vol_weighted": round(ose_abs_wt, 2),
        "ose_rel_vol_weighted": round(ose_rel_wt, 2),
        "total_volume": acc["sum_vol"]
    }
    print(f"  {b}: OSE_abs={ose_abs_wt:.2f}%, OSE_rel={ose_rel_wt:+.2f}pp (N={n_plants}, Vol={acc['sum_vol']/1e6:.0f}M)")

# ── Step 4: Breakdown by zone for B4 and B2 (excl APAC) ──
print("\n=== Step 4: Zone Breakdown for B4 ===")
b4_zones = {}
for (zone, bundle), acc in sorted(zone_bundle_accum.items()):
    if bundle == "B4":
        ose_wt = acc["sum_abs_vol"] / acc["sum_vol"]
        ose_rel_wt = acc["sum_rel_vol"] / acc["sum_vol"]
        b4_zones[zone] = {
            "n": acc["n"], "ose_abs_wt": round(ose_wt, 2), "ose_rel_wt": round(ose_rel_wt, 2),
            "volume": acc["sum_vol"], "zone_avg": zone_avg.get(zone)
        }
        print(f"  {zone}: N={acc['n']}, OSE_abs={ose_wt:.2f}%, OSE_rel={ose_rel_wt:+.2f}pp, ZoneAvg={zone_avg.get(zone):.2f}%")

print("\n=== Step 4b: Zone Breakdown for B2 ===")
b2_zones = {}
for (zone, bundle), acc in sorted(zone_bundle_accum.items()):
    if bundle == "B2":
        ose_wt = acc["sum_abs_vol"] / acc["sum_vol"]
        ose_rel_wt = acc["sum_rel_vol"] / acc["sum_vol"]
        b2_zones[zone] = {
            "n": acc["n"], "ose_abs_wt": round(ose_wt, 2), "ose_rel_wt": round(ose_rel_wt, 2),
            "volume": acc["sum_vol"], "zone_avg": zone_avg.get(zone)
        }
        print(f"  {zone}: N={acc['n']}, OSE_abs={ose_wt:.2f}%, OSE_rel={ose_rel_wt:+.2f}pp, ZoneAvg={zone_avg.get(zone):.2f}%")

# B4 excl APAC
print("\n=== B4 excluding APAC ===")
b4_excl = {"sum_rel_vol": 0, "sum_vol": 0, "sum_abs_vol": 0, "n": 0}
for (zone, bundle), acc in zone_bundle_accum.items():
    if bundle == "B4" and zone != "APAC":
        b4_excl["sum_rel_vol"] += acc["sum_rel_vol"]
        b4_excl["sum_vol"] += acc["sum_vol"]
        b4_excl["sum_abs_vol"] += acc["sum_abs_vol"]
        b4_excl["n"] += acc["n"]
if b4_excl["sum_vol"] > 0:
    print(f"  B4 excl APAC: N={b4_excl['n']}, OSE_abs={b4_excl['sum_abs_vol']/b4_excl['sum_vol']:.2f}%, OSE_rel={b4_excl['sum_rel_vol']/b4_excl['sum_vol']:+.2f}pp")

# B1 and B3 breakdown
print("\n=== Zone Breakdown for B1 ===")
b1_zones = {}
for (zone, bundle), acc in sorted(zone_bundle_accum.items()):
    if bundle == "B1":
        ose_wt = acc["sum_abs_vol"] / acc["sum_vol"]
        ose_rel_wt = acc["sum_rel_vol"] / acc["sum_vol"]
        b1_zones[zone] = {
            "n": acc["n"], "ose_abs_wt": round(ose_wt, 2), "ose_rel_wt": round(ose_rel_wt, 2),
            "volume": acc["sum_vol"], "zone_avg": zone_avg.get(zone)
        }
        print(f"  {zone}: N={acc['n']}, OSE_abs={ose_wt:.2f}%, OSE_rel={ose_rel_wt:+.2f}pp")

print("\n=== Zone Breakdown for B3 ===")
b3_zones = {}
for (zone, bundle), acc in sorted(zone_bundle_accum.items()):
    if bundle == "B3":
        ose_wt = acc["sum_abs_vol"] / acc["sum_vol"]
        ose_rel_wt = acc["sum_rel_vol"] / acc["sum_vol"]
        b3_zones[zone] = {
            "n": acc["n"], "ose_abs_wt": round(ose_wt, 2), "ose_rel_wt": round(ose_rel_wt, 2),
            "volume": acc["sum_vol"], "zone_avg": zone_avg.get(zone)
        }
        print(f"  {zone}: N={acc['n']}, OSE_abs={ose_wt:.2f}%, OSE_rel={ose_rel_wt:+.2f}pp")

# ── Ranking validation ──
print("\n=== RANKING VALIDATION ===")
print("Absolute OSE (vol-weighted):")
ranking_abs = sorted(bundle_results.items(), key=lambda x: x[1]["ose_abs_vol_weighted"], reverse=True)
for i, (b, r) in enumerate(ranking_abs, 1):
    print(f"  #{i} {b}: {r['ose_abs_vol_weighted']:.2f}%")

print("\nNormalized OSE_rel (vol-weighted):")
ranking_rel = sorted(bundle_results.items(), key=lambda x: x[1]["ose_rel_vol_weighted"], reverse=True)
for i, (b, r) in enumerate(ranking_rel, 1):
    print(f"  #{i} {b}: {r['ose_rel_vol_weighted']:+.2f}pp")

expected = ["B4", "B2", "B1", "B3"]
actual_abs = [b for b, _ in ranking_abs]
actual_rel = [b for b, _ in ranking_rel]
print(f"\nExpected: {' > '.join(expected)}")
print(f"Absolute: {' > '.join(actual_abs)} {'MATCH' if actual_abs == expected else 'MISMATCH'}")
print(f"Normalized: {' > '.join(actual_rel)} {'MATCH' if actual_rel == expected else 'MISMATCH'}")

# ── Step 5: Update JSON ──
# Enrich vpo_tech_data.json
tech_data["zone_avg_ose"] = {z: {"ose_pct": v} for z, v in zone_avg.items()}

# Enrich bundle_stats
for b in ["B1", "B2", "B3", "B4"]:
    if b in tech_data["bundle_stats"] and b in bundle_results:
        tech_data["bundle_stats"][b]["ose_rel_vol_weighted"] = bundle_results[b]["ose_rel_vol_weighted"]
        tech_data["bundle_stats"][b]["ose_abs_vol_weighted"] = bundle_results[b]["ose_abs_vol_weighted"]
        tech_data["bundle_stats"][b]["n_plants_with_ose"] = bundle_results[b]["n_plants_with_ose"]

# Add zone breakdown per bundle
tech_data["bundle_zone_breakdown"] = {
    "B4": b4_zones,
    "B2": b2_zones,
    "B1": b1_zones,
    "B3": b3_zones
}

# Add ose_rel to each site
for site in tech_data["sites"]:
    name = site["site"]
    zone = site["zone"]
    ose_val = None
    if name in plants_correct:
        ose_val = plants_correct[name]["OSE"]
    elif site.get("ose") is not None:
        ose_val = site["ose"]
    if ose_val is not None and zone in zone_avg:
        site["ose_rel"] = round(ose_val - zone_avg[zone], 2)
    else:
        site["ose_rel"] = None

# Also enrich ose_correct JSON
ose_data["zone_avg_ose"] = zone_avg
ose_data["normalized_bundle_stats"] = bundle_results
ose_data["bundle_zone_breakdown"] = {
    "B4": b4_zones,
    "B2": b2_zones,
    "B1": b1_zones,
    "B3": b3_zones
}

with open(os.path.join(BASE, "vpo_tech_data.json"), "w") as f:
    json.dump(tech_data, f, indent=2, ensure_ascii=False)

with open(os.path.join(BASE, "vpo_tech_ose_correct.json"), "w") as f:
    json.dump(ose_data, f, indent=2, ensure_ascii=False)

print("\n JSON files updated successfully.")

# ── Output data for HTML generation ──
print("\n=== DATA FOR HTML ===")
print(json.dumps({
    "zone_avg": zone_avg,
    "bundle_results": bundle_results,
    "b4_zones": b4_zones,
    "b2_zones": b2_zones,
    "b1_zones": b1_zones,
    "b3_zones": b3_zones,
    "b4_excl_apac": {
        "n": b4_excl["n"],
        "ose_abs": round(b4_excl["sum_abs_vol"]/b4_excl["sum_vol"], 2) if b4_excl["sum_vol"] > 0 else None,
        "ose_rel": round(b4_excl["sum_rel_vol"]/b4_excl["sum_vol"], 2) if b4_excl["sum_vol"] > 0 else None
    }
}, indent=2))
