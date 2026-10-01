"""THE SILENT GREENHOUSE: seeded flagship case content.

This is intentionally authored (seeded) content, not AI output. The scenario,
evidence graph, witness knowledge and lab models are deterministic so the case is
fully playable offline from AI, testable, and scientifically consistent. AI (when
configured) only adds optional natural-language polish on top; it never decides
whether the player is right.

Science summary (the answer the player must infer from evidence):
  Benches B and C were switched from calcium nitrate to ammonium sulfate (cheaper).
  Ammonium sulfate is physiologically acid-forming: nitrification of NH4+ releases
  H+, and sulfate adds no buffering. In a small-volume, low-buffer peat mix the
  substrate pH fell from ~6.3 to ~4.7. At that pH, Ca, Mg, P and Mo become poorly
  available while Mn and Al become highly soluble (toxic), producing the symptoms.
  The irrigation water (pH 7.1, shared by all benches) is fine, and light, climate
  and pests are identical on the healthy Bench A, so they cannot be the cause.
"""
from typing import Dict, List, Optional

SLUG = "silent-greenhouse"
TITLE = "The Silent Greenhouse"
SUBTITLE = "Plant Sciences Division"
CONCEPTS = ["Soil pH", "Nutrient availability", "Fertilizer acidity", "Experimental controls"]

BRIEFING = (
    "The Halden Research Greenhouse has gone quiet. Two weeks ago three benches of tomato "
    "seedlings were thriving. Now Benches B and C are stunted, pale and dying, while Bench A "
    "looks perfect. Everyone swears the care routine has not changed. The lab director wants "
    "the cause identified before the whole research programme is lost.\n\n"
    "Your job: inspect the scene, question the staff, test the substrate in the lab, and build a "
    "hypothesis you can defend with evidence. Do not guess. Every claim must be backed."
)

OBJECTIVES = [
    "Collect evidence from the greenhouse",
    "Question the staff",
    "Run at least one laboratory test",
    "Connect evidence into inferences",
    "Submit a hypothesis backed by evidence",
]

# ── Evidence catalogue ────────────────────────────────────────────────────────
# significance: key | context | ruled_out
EVIDENCE: Dict[str, dict] = {
    "ev_bench_a_healthy": dict(
        title="Bench A: healthy seedlings", kind="photo", significance="context",
        description="Bench A seedlings are deep green, upright and growing normally. Same cultivar, same potting mix and same lamps as Benches B and C.",
        tags=["control", "comparison"]),
    "ev_leaf_symptoms": dict(
        title="Bench B: leaf symptoms", kind="photo", significance="key",
        description="Stunted plants. New leaves are pale between the veins. Older leaves carry small dark-brown specks. No webbing, holes or sticky residue.",
        tags=["symptoms"]),
    "ev_roots": dict(
        title="Bench B: root inspection", kind="photo", significance="key",
        description="Roots are short, thick-tipped and brown with few fine root hairs. Healthy roots on Bench A are long, pale and finely branched.",
        tags=["symptoms", "roots"]),
    "ev_climate_ok": dict(
        title="Climate logger: normal", kind="data", significance="ruled_out",
        description="Logger shows 22-26 C and a 16 h photoperiod, identical for all three benches for the past 30 days. No heat spikes, no lamp failures.",
        tags=["ruled-out", "environment"]),
    "ev_no_pests": dict(
        title="Microscope: no pathogen or pests", kind="photo", significance="ruled_out",
        description="Leaf scrapings under 400x show no mites, no fungal hyphae and no spores. Cell structure is intact apart from pigment loss.",
        tags=["ruled-out", "pests"]),
    "ev_shared_water": dict(
        title="Irrigation: one shared reservoir", kind="document", significance="key",
        description="A single reservoir and drip line feeds Benches A, B and C. Any fault in the water would reach the healthy bench too.",
        tags=["water", "control"]),
    "ev_fertilizer_bag": dict(
        title="Supply shed: fertilizer labels", kind="photo", significance="key",
        description="Open bag near empty: 'Grow-Cheap 21-0-0, ammonium sulfate', delivered 15 days ago. On the shelf, one bag of the old stock: calcium nitrate 15.5-0-0.",
        tags=["fertilizer", "change"]),
    "ev_logbook": dict(
        title="Maintenance logbook", kind="document", significance="key",
        description="Day 0: Benches B and C moved to the new fertilizer stock. Bench A stays on the old stock (reserved for Dr. Okonkwo's trial). Day 6: first yellowing noted on Bench B.",
        tags=["timeline", "change"]),
    "ev_ph_a": dict(
        title="Substrate pH, Bench A: 6.2", kind="lab", significance="context",
        description="pH probe reading 6.2 (instrument tolerance +/-0.05). Target range for tomato seedlings is about 6.0-6.5.",
        tags=["ph", "control"]),
    "ev_ph_b": dict(
        title="Substrate pH, Bench B: 4.7", kind="lab", significance="key",
        description="pH probe reading 4.7. That is roughly 1.5 units below Bench A, which is about 30 times more acidic on a logarithmic scale.",
        tags=["ph", "symptoms"]),
    "ev_ph_water": dict(
        title="Irrigation water pH: 7.1", kind="lab", significance="ruled_out",
        description="Reservoir water reads pH 7.1, close to neutral. The water is not acidic.",
        tags=["ph", "water", "ruled-out"]),
    "ev_ph_fresh": dict(
        title="Fresh potting mix pH: 6.4", kind="lab", significance="context",
        description="Unused potting mix from the shed reads pH 6.4. The mix started out in range.",
        tags=["ph", "control"]),
    "ev_availability": dict(
        title="Nutrient availability at pH 4.7", kind="lab", significance="key",
        description="Modelled at substrate pH about 4.7: Ca, Mg, P and Mo are poorly available while Mn and Al are highly soluble and reach toxic levels.",
        tags=["nutrients", "mechanism"]),
    "ev_fert_acidity": dict(
        title="Fertilizer acidity comparison", kind="lab", significance="key",
        description="Ammonium sulfate is strongly acid-forming (approx. +110 lb CaCO3 per 100 lb of product). Calcium nitrate is slightly basic (approx. -20).",
        tags=["fertilizer", "mechanism"]),
    "ev_lime_trial": dict(
        title="Lime trial: acidity reversed", kind="lab", significance="key",
        description="A controlled trial raised Bench B substrate pH into range and restored the predicted nutrient balance. The untreated control stayed acidic.",
        tags=["experiment", "causation"]),
    "ev_timeline": dict(
        title="Advanced analysis: pH drop precedes symptoms", kind="lab", significance="key",
        description="Logger data shows Bench B pH falling steadily from Day 0 and crossing the toxicity threshold one day before symptoms appear. Bench A stays flat.",
        tags=["timeline", "causation"]),
    "ev_w_okonkwo_protocol": dict(
        title="Dr. Okonkwo: protocol unchanged", kind="witness", significance="context",
        description="Protocol, cultivar, mix and irrigation are unchanged. She was at a conference for two weeks and left Teo in charge. Bench A is her calcium nitrate trial.",
        tags=["witness"]),
    "ev_w_teo_switch": dict(
        title="Teo: told to use the new stock", kind="witness", significance="key",
        description="On Day 0 Mr. Pruitt told Teo to feed Benches B and C from the new bags. Same dose and schedule. Bench A kept the old fertilizer.",
        tags=["witness", "fertilizer", "change"]),
    "ev_w_pruitt_supplier": dict(
        title="Mr. Pruitt: swapped supplier to save money", kind="witness", significance="key",
        description="Pruitt admits he replaced calcium nitrate with a cheaper ammonium sulfate because 'nitrogen is nitrogen'. He did not consult the researchers.",
        tags=["witness", "fertilizer", "change"]),
}

# ── Scene hotspots ────────────────────────────────────────────────────────────
HOTSPOTS: List[dict] = [
    dict(id="h_bench_a", label="Bench A", area="Growing floor",
         prompt="Inspect the healthy bench", evidence=["ev_bench_a_healthy"], samples=["sample_bench_a"]),
    dict(id="h_bench_b", label="Bench B", area="Growing floor",
         prompt="Inspect the failing seedlings", evidence=["ev_leaf_symptoms"], samples=["sample_bench_b"]),
    dict(id="h_roots", label="Uproot a seedling", area="Growing floor",
         prompt="Examine the roots", evidence=["ev_roots"], samples=[]),
    dict(id="h_logger", label="Climate logger", area="Control room",
         prompt="Read the environment logs", evidence=["ev_climate_ok"], samples=[]),
    dict(id="h_microscope", label="Microscope", area="Control room",
         prompt="Look at a leaf scraping", evidence=["ev_no_pests"], samples=[]),
    dict(id="h_reservoir", label="Irrigation reservoir", area="Plant room",
         prompt="Inspect the water system", evidence=["ev_shared_water"], samples=["sample_water"]),
    dict(id="h_shed", label="Supply shed", area="Plant room",
         prompt="Check what is being fed to the plants", evidence=["ev_fertilizer_bag"], samples=["sample_fresh"]),
    dict(id="h_logbook", label="Maintenance logbook", area="Plant room",
         prompt="Read the logbook", evidence=["ev_logbook"], samples=[]),
]

SAMPLES: Dict[str, dict] = {
    "sample_bench_a": dict(label="Bench A substrate", ph=6.2, evidence="ev_ph_a"),
    "sample_bench_b": dict(label="Bench B substrate", ph=4.7, evidence="ev_ph_b"),
    "sample_water": dict(label="Irrigation water", ph=7.1, evidence="ev_ph_water"),
    "sample_fresh": dict(label="Fresh potting mix", ph=6.4, evidence="ev_ph_fresh"),
}

# ── Witnesses ─────────────────────────────────────────────────────────────────
# Each knowledge entry: triggers (substrings of the lower-cased question), optional
# present (evidence shown), requires_any (evidence the player must already hold),
# text, reveals (evidence key granted the first time).
WITNESSES: Dict[str, dict] = {
    "okonkwo": dict(
        name="Dr. Mara Okonkwo", role="Lead plant physiologist",
        demeanor="precise, worried, speaks like a scientist",
        opening="Thank you for coming. I have run this greenhouse for six years and I have never seen a failure like this. Ask me anything, but I was away when it started.",
        fallback="I am not sure that is something I can speak to. I can tell you about our protocol, about Bench A, or about how we measure conditions.",
        knowledge=[
            dict(id="k_protocol", triggers=["protocol", "change", "routine", "method", "care", "different", "what happened", "tell me"],
                 text="Nothing in the protocol changed. Same tomato cultivar, same peat mix, same irrigation. I was at a conference for two weeks and left Teo in charge.",
                 reveals="ev_w_okonkwo_protocol"),
            dict(id="k_bench_a", triggers=["bench a", "healthy", "control", "trial", "only", "calcium"],
                 text="Bench A is my calcium nitrate trial, so I reserved the last of the old fertilizer for it. It is also the only bench that is thriving. I had not put those two facts together until you asked."),
            dict(id="k_ph", triggers=["ph", "acid", "soil", "substrate", "test", "measure"],
                 text="We do not routinely probe substrate pH. The mix is limed when it is blended, so I assumed it stayed in range. There is a pH probe in the lab if you want to check."),
            dict(id="k_present_ph_b", present="ev_ph_b",
                 text="pH 4.7? Our target is 6.0 to 6.5. A limed mix does not drift that far by itself. Something has been pushing the pH down. What do we add to these benches besides water?"),
            dict(id="k_present_fert", present="ev_fertilizer_bag",
                 text="Ammonium sulfate. I never authorised that. Nitrogen source matters: ammonium behaves very differently from nitrate once bacteria in the mix get hold of it."),
        ]),
    "teo": dict(
        name="Teo Vasquez", role="Greenhouse technician",
        demeanor="friendly, a bit anxious, talks in short practical sentences",
        opening="Hey. Look, I have done everything by the book. Water every morning, feed every other day.",
        fallback="Not sure about that one. I just do the watering and feeding. You could ask me about my routine or the new stock.",
        knowledge=[
            dict(id="k_routine", triggers=["water", "routine", "daily", "morning", "schedule", "dose"],
                 text="Shared reservoir, every morning. Feeding every other day, same dose as always. Dr. Okonkwo was away, so I followed the notes Mr. Pruitt left."),
            dict(id="k_switch", triggers=["new", "stock", "bag", "switch", "change", "fertil", "feed", "different", "pruitt"],
                 text="Day zero, Mr. Pruitt told me to use the new stock on Benches B and C. Bench A kept the old bags. Same dose, same schedule. I noted it in the logbook in the shed.",
                 reveals="ev_w_teo_switch"),
            dict(id="k_pests", triggers=["bug", "pest", "insect", "mold", "mould", "fung", "disease"],
                 text="No bugs. I would know, I check the undersides of leaves every week."),
        ]),
    "pruitt": dict(
        name="Mr. Alan Pruitt", role="Facilities manager",
        demeanor="defensive, brusque, protects his budget",
        opening="I run the building, not a chemistry lab. Make it quick.",
        fallback="That is not my department. If you have a point, make it.",
        knowledge=[
            dict(id="k_deflect", triggers=["budget", "cost", "cheap", "supplier", "order", "purchase", "why", "fertil", "switch"],
                 text="Purchasing decisions are made above your pay grade. The plants need feeding, and they were fed."),
            dict(id="k_admit_bag", present="ev_fertilizer_bag",
                 text="Fine. Calcium nitrate was nearly double the price for the same amount of nitrogen. Ammonium sulfate is 21 percent nitrogen. I figured nitrogen is nitrogen. I did not think it would matter.",
                 reveals="ev_w_pruitt_supplier"),
            dict(id="k_admit_teo", present="ev_w_teo_switch",
                 text="So Teo talked. Fine. I swapped the supplier to save money on Benches B and C. Nobody told me the kind of nitrogen mattered.",
                 reveals="ev_w_pruitt_supplier"),
            dict(id="k_admit_log", present="ev_logbook",
                 text="You read the logbook. Yes, I changed the order that week to cut costs. I thought nitrogen is nitrogen.",
                 reveals="ev_w_pruitt_supplier"),
        ]),
}

# ── Lab models ────────────────────────────────────────────────────────────────
# Relative nutrient availability (0-100) vs substrate pH. Teaching model adapted
# from widely published soil-pH availability charts. Illustrative, not lab-grade.
PH_GRID = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]
AVAILABILITY = {
    "N":  [35, 55, 70, 85, 100, 100, 100, 90, 80, 70],
    "P":  [20, 28, 40, 60, 85, 100, 95, 70, 55, 45],
    "K":  [30, 45, 60, 80, 95, 100, 100, 100, 100, 95],
    "Ca": [20, 30, 45, 65, 85, 100, 100, 100, 95, 90],
    "Mg": [20, 30, 45, 65, 85, 100, 100, 100, 95, 90],
    "Fe": [100, 100, 100, 95, 85, 70, 50, 35, 20, 10],
    "Mn": [100, 100, 95, 85, 65, 45, 30, 15, 10, 5],
    "Mo": [5, 10, 20, 35, 55, 75, 90, 100, 100, 100],
    "Al": [100, 85, 55, 15, 0, 0, 0, 0, 0, 0],  # soluble aluminium: a toxin, higher is worse
}
NUTRIENT_NAMES = {
    "N": "Nitrogen", "P": "Phosphorus", "K": "Potassium", "Ca": "Calcium", "Mg": "Magnesium",
    "Fe": "Iron", "Mn": "Manganese", "Mo": "Molybdenum", "Al": "Soluble aluminium",
}
TOXIC = {"Mn": 80, "Al": 40}          # above this availability these are toxic
DEFICIENT_BELOW = 50                  # below this an essential nutrient is scarce

FERTILIZERS = {
    "ammonium_sulfate": dict(name="Ammonium sulfate", npk="21-0-0", acidity=110,
                             note="Ammonium is converted to nitrate by soil bacteria, releasing hydrogen ions."),
    "calcium_nitrate": dict(name="Calcium nitrate", npk="15.5-0-0", acidity=-20,
                            note="Nitrate is taken up directly and the calcium is slightly basic."),
    "urea": dict(name="Urea", npk="46-0-0", acidity=84,
                 note="Converted to ammonium then nitrate, so it is moderately acid-forming."),
    "potassium_nitrate": dict(name="Potassium nitrate", npk="13-0-44", acidity=-23,
                              note="Nitrate nitrogen, slightly basic."),
}

BENCH_B_PH = 4.7
LIME_MAX_PH = 7.2
LIME_RATE = 0.35

# Substrate pH logger (daily, Day -5 .. Day 14). Day 0 = fertilizer switch.
LOGGER_DAYS = list(range(-5, 15))
LOGGER_BENCH_A = [6.3, 6.3, 6.2, 6.3, 6.2, 6.3, 6.2, 6.3, 6.2, 6.3, 6.2, 6.2, 6.3, 6.2, 6.2, 6.3, 6.2, 6.2, 6.3, 6.2]
LOGGER_BENCH_B = [6.3, 6.3, 6.3, 6.3, 6.3, 6.3, 6.2, 6.0, 5.8, 5.6, 5.4, 5.3, 5.2, 5.1, 5.0, 4.9, 4.85, 4.8, 4.75, 4.7]
SYMPTOM_ONSET_DAY = 6
TOXICITY_PH = 5.5

# ── Inferences (evidence links) ───────────────────────────────────────────────
INFERENCES: List[dict] = [
    dict(id="benches_differ", title="Bench B's substrate is far more acidic than Bench A's",
         pairs=[("ev_ph_a", "ev_ph_b")],
         insight="Two benches, same mix, very different pH. Something has acidified Bench B since it was blended."),
    dict(id="water_not_cause", title="The water cannot be the source of the acidity",
         pairs=[("ev_ph_water", "ev_shared_water"), ("ev_ph_water", "ev_ph_b")],
         insight="The water is near neutral and feeds every bench, including the healthy one. The acid is arising inside Bench B's substrate."),
    dict(id="symptoms_match_acid", title="The symptoms match nutrient problems at low pH",
         pairs=[("ev_ph_b", "ev_availability"), ("ev_leaf_symptoms", "ev_availability"), ("ev_roots", "ev_availability")],
         insight="At pH 4.7 calcium, magnesium and phosphorus are scarce while manganese and aluminium turn toxic. Pale leaves, brown specks and stubby roots fit that pattern."),
    dict(id="fertilizer_acidifying", title="The new fertilizer is strongly acid-forming",
         pairs=[("ev_fertilizer_bag", "ev_fert_acidity")],
         insight="Ammonium sulfate pushes substrate pH down, while the old calcium nitrate does not. The label and the chemistry agree."),
    dict(id="switch_timeline", title="Only the benches on the new fertilizer failed",
         pairs=[("ev_logbook", "ev_fertilizer_bag"), ("ev_w_teo_switch", "ev_bench_a_healthy"), ("ev_logbook", "ev_w_teo_switch")],
         insight="B and C changed fertilizer on Day 0 and failed. A did not change and is healthy. That is a natural experiment."),
    dict(id="environment_ruled_out", title="Climate, light and pests are ruled out",
         pairs=[("ev_climate_ok", "ev_bench_a_healthy"), ("ev_no_pests", "ev_bench_a_healthy"), ("ev_climate_ok", "ev_no_pests")],
         insight="Conditions were identical for the healthy bench, and no pathogen was found. These explanations cannot distinguish sick from healthy."),
    dict(id="supplier_confirmed", title="The switch was a cost decision made without the researchers",
         pairs=[("ev_w_pruitt_supplier", "ev_fertilizer_bag"), ("ev_w_pruitt_supplier", "ev_w_teo_switch")],
         insight="The fertilizer change has a documented human cause. The chemistry explains why it mattered."),
    dict(id="causation_shown", title="Reversing the acidity reverses the problem",
         pairs=[("ev_lime_trial", "ev_ph_b"), ("ev_lime_trial", "ev_availability")],
         insight="When the pH is corrected in a controlled trial the predicted nutrient balance recovers, and the untreated control does not. Acidity is causal, not just correlated."),
    dict(id="timing_supports_cause", title="The pH fell before the symptoms appeared",
         pairs=[("ev_timeline", "ev_logbook"), ("ev_timeline", "ev_leaf_symptoms")],
         insight="Cause must precede effect. The pH crossed the toxicity threshold a day before the first yellowing."),
]

# Rubric evidence groups
SUPPORT_CAUSE = {"ev_fertilizer_bag", "ev_w_teo_switch", "ev_w_pruitt_supplier", "ev_logbook", "ev_fert_acidity"}
SUPPORT_ACID = {"ev_ph_b", "ev_ph_a", "ev_lime_trial", "ev_timeline"}
SUPPORT_MECH = {"ev_availability", "ev_leaf_symptoms", "ev_roots", "ev_lime_trial"}
RULED_OUT = {"ev_climate_ok", "ev_no_pests", "ev_ph_water", "ev_shared_water"}

XP = dict(evidence_key=20, evidence_other=10, lab=30, inference=20, solve=300,
          bonus_no_hints=50, bonus_inferences=50, bonus_lab=25)


def evidence_public(key: str) -> dict:
    e = EVIDENCE[key]
    return dict(key=key, title=e["title"], description=e["description"], kind=e["kind"],
                significance=e["significance"], tags=e["tags"])
