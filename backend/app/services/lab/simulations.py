"""
STEM Crime Lab simulations for Chemistry, Biology, Physics, and Environmental labs.
Each module returns realistic simulation results based on input parameters.
"""
import math
import random
from typing import Any


def run_chemistry_simulation(experiment_type: str, parameters: dict[str, Any]) -> dict:
    """Simulate chemistry experiments: pH testing, compound analysis, reactions."""

    if experiment_type == "ph_test":
        substance = parameters.get("substance", "water")
        ph_map = {
            "river_water_contaminated": 2.1,
            "river_water_clean": 7.2,
            "acid_rain": 4.2,
            "industrial_runoff": 3.4,
            "bleach": 12.5,
            "vinegar": 2.9,
            "baking_soda": 8.3,
            "water": 7.0,
            "blood": 7.4,
            "lemon_juice": 2.0,
        }
        ph_value = ph_map.get(substance.lower().replace(" ", "_"), 7.0)
        noise = random.uniform(-0.1, 0.1)
        measured_ph = round(ph_value + noise, 1)

        indicator_color = (
            "bright red" if measured_ph < 3
            else "orange-red" if measured_ph < 5
            else "yellow" if measured_ph < 6
            else "yellow-green" if measured_ph < 7
            else "green" if measured_ph < 8
            else "blue-green" if measured_ph < 9
            else "blue" if measured_ph < 11
            else "purple"
        )

        return {
            "experiment": "pH Test",
            "substance_tested": substance,
            "ph_value": measured_ph,
            "indicator_color": indicator_color,
            "is_acidic": measured_ph < 7,
            "is_neutral": 6.8 <= measured_ph <= 7.2,
            "is_basic": measured_ph > 7,
            "interpretation": (
                f"pH {measured_ph} indicates {'strong acid' if measured_ph < 3 else 'acid' if measured_ph < 7 else 'neutral' if measured_ph < 7.5 else 'base'}"
            ),
            "safety_warning": "HAZARDOUS - handle with protective equipment" if measured_ph < 4 or measured_ph > 10 else "Safe to handle",
            "chart_data": {
                "type": "gauge",
                "value": measured_ph,
                "min": 0,
                "max": 14,
                "zones": [
                    {"range": [0, 7], "color": "#ef4444", "label": "Acidic"},
                    {"range": [7, 7], "color": "#22c55e", "label": "Neutral"},
                    {"range": [7, 14], "color": "#3b82f6", "label": "Basic"},
                ],
            },
        }

    if experiment_type == "compound_analysis":
        compound = parameters.get("compound", "unknown")
        presence = parameters.get("check_for", [])
        results = {}
        known_compounds = {
            "sulfur": {"color": "yellow precipitate", "smell": "rotten eggs", "hazardous": True},
            "lead": {"color": "white precipitate", "hazardous": True, "health_risk": "neurotoxin"},
            "iron": {"color": "rust-orange precipitate", "magnetic": True},
            "nitrogen": {"color": "colorless gas", "fertilizer_component": True},
            "phosphorus": {"color": "white smoke", "hazardous": True},
        }
        for element in presence:
            data = known_compounds.get(element.lower(), {})
            results[element] = {"detected": random.random() > 0.3, **data}
        return {"experiment": "Compound Analysis", "sample": compound, "results": results}

    return {"experiment": experiment_type, "status": "completed", "results": {}}


def run_biology_simulation(experiment_type: str, parameters: dict[str, Any]) -> dict:
    """Simulate biology experiments: microscopy, DNA analysis, ecosystem."""

    if experiment_type == "microscope":
        sample = parameters.get("sample", "water")
        magnification = parameters.get("magnification", 400)

        observations_map = {
            "river_water": {
                "organisms": ["dead fish larvae", "reduced algae", "harmful bacteria (E. coli)"],
                "cell_health": "poor",
                "contamination_visible": True,
                "description": "Cells show signs of chemical stress. Membrane integrity compromised.",
            },
            "healthy_water": {
                "organisms": ["healthy algae", "diatoms", "water fleas"],
                "cell_health": "excellent",
                "contamination_visible": False,
                "description": "Thriving microecosystem with diverse species.",
            },
            "leaf": {
                "structures": ["chloroplasts", "cell walls", "stomata", "guard cells"],
                "chlorophyll_distribution": "uniform",
                "description": "Healthy photosynthetic cells with active chloroplasts visible.",
            },
            "diseased_leaf": {
                "structures": ["damaged chloroplasts", "cell walls", "fungal hyphae"],
                "chlorophyll_distribution": "patchy - degraded",
                "description": "Chloroplasts show necrosis. Fungal pathogen visible between cells.",
            },
        }

        obs = observations_map.get(sample.lower().replace(" ", "_"), {
            "organisms": ["unknown organisms"],
            "description": "Sample requires further analysis.",
        })

        return {
            "experiment": "Microscope Analysis",
            "sample": sample,
            "magnification": f"{magnification}x",
            "observations": obs,
            "image_description": f"Under {magnification}x magnification: {obs.get('description', '')}",
            "cell_count_estimate": random.randint(50, 500) if magnification >= 400 else "Too few visible",
        }

    if experiment_type == "dna_analysis":
        sample = parameters.get("sample", "unknown")
        gel_bands = [random.randint(100, 10000) for _ in range(random.randint(3, 8))]
        gel_bands.sort(reverse=True)
        return {
            "experiment": "DNA Gel Electrophoresis",
            "sample": sample,
            "bands_bp": gel_bands,
            "dna_quality": "good" if len(gel_bands) > 4 else "degraded",
            "interpretation": "DNA profile successfully extracted. Pattern indicates genetic modification present." if len(gel_bands) > 5 else "Limited DNA recovered.",
        }

    return {"experiment": experiment_type, "status": "completed"}


def run_physics_simulation(experiment_type: str, parameters: dict[str, Any]) -> dict:
    """Simulate physics experiments: forces, motion, energy."""

    if experiment_type == "orbital_mechanics":
        altitude_km = parameters.get("altitude_km", 400)
        drag_coefficient = parameters.get("drag_increase", 1.0)

        earth_radius = 6371  # km
        gm = 398600  # km^3/s^2
        r = earth_radius + altitude_km
        orbital_velocity = math.sqrt(gm / r)  # km/s
        orbital_period = 2 * math.pi * r / orbital_velocity / 60  # minutes

        decay_rate = drag_coefficient * (0.001 * math.exp(-altitude_km / 100))  # km/orbit

        return {
            "experiment": "Orbital Mechanics Simulation",
            "altitude_km": altitude_km,
            "orbital_velocity_km_s": round(orbital_velocity, 2),
            "orbital_period_minutes": round(orbital_period, 1),
            "atmospheric_drag_factor": drag_coefficient,
            "altitude_decay_per_orbit_km": round(decay_rate, 4),
            "time_to_reentry_orbits": round(altitude_km / (decay_rate + 0.001)),
            "conclusion": (
                f"At {altitude_km}km with {drag_coefficient}x normal drag, "
                f"satellite decays at {decay_rate:.4f} km/orbit. "
                f"Estimated {round(altitude_km / (decay_rate + 0.001))} orbits until reentry."
            ),
            "chart_data": {
                "type": "line",
                "x_label": "Orbits",
                "y_label": "Altitude (km)",
                "data_points": [
                    {"x": i, "y": max(0, altitude_km - decay_rate * i)}
                    for i in range(0, min(1000, round(altitude_km / (decay_rate + 0.001)) + 10), 50)
                ],
            },
        }

    if experiment_type == "force_analysis":
        mass_kg = parameters.get("mass_kg", 10)
        force_n = parameters.get("force_n", 50)
        friction_coeff = parameters.get("friction_coefficient", 0.3)
        gravity = 9.81

        friction_force = friction_coeff * mass_kg * gravity
        net_force = force_n - friction_force
        acceleration = net_force / mass_kg if mass_kg > 0 else 0

        return {
            "experiment": "Force Analysis",
            "applied_force_n": force_n,
            "friction_force_n": round(friction_force, 2),
            "net_force_n": round(net_force, 2),
            "acceleration_m_s2": round(acceleration, 2),
            "result": "Object accelerates" if net_force > 0 else "Object remains stationary",
        }

    return {"experiment": experiment_type, "status": "completed"}


def run_environmental_simulation(experiment_type: str, parameters: dict[str, Any]) -> dict:
    """Simulate environmental experiments: pollution, weather, ecosystem."""

    if experiment_type == "pollution_spread":
        source_location = parameters.get("source", "upstream")
        pollutant_type = parameters.get("pollutant", "heavy_metals")
        hours_elapsed = parameters.get("hours", 24)

        spread_rate_km_per_hour = 2.5
        distance_spread = spread_rate_km_per_hour * hours_elapsed
        concentration_decay = math.exp(-0.1 * hours_elapsed)
        affected_area_km2 = math.pi * (distance_spread ** 2) * 0.3

        return {
            "experiment": "Pollution Spread Model",
            "pollutant": pollutant_type,
            "source": source_location,
            "hours_simulated": hours_elapsed,
            "spread_distance_km": round(distance_spread, 1),
            "affected_area_km2": round(affected_area_km2, 1),
            "relative_concentration": round(concentration_decay, 3),
            "downstream_impact": "HIGH" if hours_elapsed > 12 else "MODERATE",
            "ecosystem_damage": {
                "fish_mortality": f"{min(95, round(70 * (1 - concentration_decay)))}%",
                "plant_die_off": f"{min(80, round(50 * (1 - concentration_decay)))}%",
                "water_quality_index": round(max(0, 100 * concentration_decay)),
            },
            "remediation_required": True if concentration_decay < 0.5 else False,
            "chart_data": {
                "type": "area",
                "x_label": "Hours",
                "y_label": "Concentration",
                "data_points": [
                    {"x": h, "y": round(math.exp(-0.1 * h), 3)}
                    for h in range(0, hours_elapsed + 1, max(1, hours_elapsed // 20))
                ],
            },
        }

    if experiment_type == "water_quality":
        samples = parameters.get("samples", [])
        results = []
        for sample in samples:
            ph = sample.get("ph", 7.0)
            dissolved_oxygen = sample.get("dissolved_oxygen_mg_l", 8.0)
            turbidity = sample.get("turbidity_ntu", 5)
            quality_score = (
                (1 - abs(ph - 7) / 7) * 30
                + min(dissolved_oxygen / 10, 1) * 40
                + max(0, 1 - turbidity / 100) * 30
            )
            results.append({
                "location": sample.get("location", "Unknown"),
                "ph": ph,
                "dissolved_oxygen_mg_l": dissolved_oxygen,
                "turbidity_ntu": turbidity,
                "quality_score": round(quality_score, 1),
                "rating": (
                    "Excellent" if quality_score > 80
                    else "Good" if quality_score > 60
                    else "Fair" if quality_score > 40
                    else "Poor"
                ),
            })
        return {"experiment": "Water Quality Analysis", "sample_results": results}

    return {"experiment": experiment_type, "status": "completed"}


def run_simulation(lab_type: str, experiment_type: str, parameters: dict[str, Any]) -> dict:
    """Route to correct simulation module."""
    runners = {
        "chemistry": run_chemistry_simulation,
        "biology": run_biology_simulation,
        "physics": run_physics_simulation,
        "environmental": run_environmental_simulation,
    }
    runner = runners.get(lab_type.lower())
    if not runner:
        return {"error": f"Unknown lab type: {lab_type}"}
    return runner(experiment_type, parameters)
