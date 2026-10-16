"""Product codes and depot info (port of lib/config.js)."""

import os

PRODUCTS = {
    "KFL": {"gbs1": "1661B5016GBS", "gbs2": "1678B5016GBS", "gup1": "1678B5016GUP", "gup2": "1661B5016GUP"},
    "KFU": {"gbs": "1661B5029GBS", "gup": "1661B5029GUP", "cap": "3143B5029CAP"},
    "UWT": {"gbs": "3143B5124GBS", "gup": "3143B5124GUP", "cap": "3143B5124CAP"},
    "HNKN": {"gbs": "1678B6561GBS", "gup": "1678B6561GUP"},
    "RC": {"gbs": "1760B5025GBS"},
    "GD": {"gbs": "1760B5120GBS"},
    "BUD": {"gbs": "1607B5019GBS", "gup": "1607B5019GUP", "cap": "1607B5019CAP"},
    "CBS": {"gbs": "1668B6033GBS", "gup": "1668B6033GUP", "cap": "2852B6033CAP"},
    "TUBL": {"gbs": "1668B6538GBS", "gup": "1668B6538GUP"},
    "KJL": {"gbs": "1686B5123GBS"},
    "CORONA": {"gup": "2551B5116GUP", "cap": "2551B5116CAP"},
    "HOGDEN": {"gup": "3258B5117GUP", "cap": "3258B5117CAP"},
    "KFS": {"gbs1": "1661B5017GBS", "gbs2": "1678B5017GBS", "gup1": "1661B5017GUP", "gup2": "1678B5017GUP"},
    "KFUM": {"gbs": "1661B6536GBS", "gup": "1661B6536GUP", "cap": "3143B6536CAP"},
    "H5000": {"gbs": "1760B5028GBS"},
    "KOUT": {"gbs": "1760B5030GBS"},
    "BUDM": {"gbs": "1607B5031GBS", "gup": "1607B5031GUP", "cap": "1607B5031CAP"},
    "CBE": {"gbs": "1668B6046GBS", "gup": "1668B5111GUP", "cap": "2852B6037CAP"},
    "TUBS": {"gbs": "1668B5102GBS"},
    "TUBSC": {"gbs": "1668B5155GBS"},
    "KJS": {"gbs": "1686B5122GBS"},
}

CHEERS_PRODUCTS = {
    "KDM": {"codes": ["2880W1654GQQ"]},
    "3MNKY": {"codes": ["2880W1072GQQ"]},
    "FWW": {"codes": ["2880W1062QM"]},
    "GGINS": {"codes": ["1921G1070GQQ", "1921G1070GPP", "1921G1070PNN"]},
    "MALT": {"codes": ["1921W1071GQQ", "1921W1071GPP", "1921W1071GNN"]},
    "SVAT": {"codes": ["1921W2094GQQ", "1921W2094GPP", "1921W2094GNN"]},
    "DMAN": {"codes": ["1921W1120GQQ", "1921W1120GPP", "1921W1120PNN"]},
    "STGG": {"codes": ["1921W2095GQQ", "1921W2095GPP", "1921W2095GNN", "1921W2095PDD"]},
    "SGXO": {"codes": ["1921Y2097GQQ", "1921Y2097GPP", "1921Y2097GNN"]},
    "RCW": {"codes": ["1921W2098GQQ", "1921W2098GPP", "1921W2098GNN"]},
    "PLYG": {"codes": ["1921G2096GQQ", "1921G2096GPP", "1921G2096GNN"]},
}

DEPOT = {
    "name": os.environ.get("DEPOT_NAME") or "MDCL-2",
    "prefix": os.environ.get("DEPOT_PREFIX") or "Depot",
}
