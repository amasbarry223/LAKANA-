import unicodedata
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.sanction_list import SanctionEntry
from app.schemas.sanction import MatchResult
from app.core.config import settings

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False


# ─── Table d'équivalences phonétiques ouest-africaines ───────────────────────
WEST_AFRICAN_EQUIVALENCES = [
    (r"\b(traore|traoré|trawale|trawally|traware|traure)\b", "traore"),
    (r"\b(coulibaly|coulibali|kulibali|kulibaly|koly|coly)\b", "coulibaly"),
    (r"\b(diallo|dyallo|jallo|jallow|dallo)\b", "diallo"),
    (r"\b(cisse|cissé|sisse|sissé|ciss|seck)\b", "cisse"),
    (r"\b(diarra|djara|jara|diara)\b", "diarra"),
    (r"\b(toure|touré|ture|touri)\b", "toure"),
    (r"\b(keita|keïta|keyta|keta)\b", "keita"),
    (r"\b(kone|koné|koni|cone|coné)\b", "kone"),
    (r"\b(sangare|sangaré|sankare|sankaré|sangari)\b", "sangare"),
    (r"\b(bagayoko|bagayogo|bakayoko|bakayogo)\b", "bagayoko"),
    (r"\b(camara|kamara|kamarra)\b", "camara"),
    (r"\b(soumare|soumaré|sumare|sumari)\b", "soumare"),
    (r"\b(bah|ba|baa)\b", "bah"),
    (r"\b(barry|barri|bari)\b", "barry"),
    (r"\b(sow|so|sou)\b", "sow"),
    (r"\b(dembele|dembélé|demba)\b", "dembele"),
    (r"\b(sidibe|sidibé|sidibe)\b", "sidibe"),
    (r"\b(fofana|fophana|foufana)\b", "fofana"),
    (r"\b(diakite|diakité|jakite|djakite)\b", "diakite"),
    (r"\b(samake|samaké|samake)\b", "samake"),
    (r"\b(ouattara|wattara|watara)\b", "ouattara"),
    (r"\b(sanogo|sanogho)\b", "sanogo"),
    (r"\b(haidara|haïdara|haydara)\b", "haidara"),
    # Prénoms courants sahéliens
    (r"\b(mohamed|mahamadou|mouhamed|amadou|mamadou|mahamad)\b", "mamadou"),
    (r"\b(ibrahim|ibrahima|ibrim|hebi|ibraheem)\b", "ibrahima"),
    (r"\b(ousmane|usman|ousman|usmane)\b", "ousmane"),
    (r"\b(fatoumata|fatim|fatou|fatimatou)\b", "fatoumata"),
    (r"\b(abdoulaye|ablaye|abdallah|aboulaye)\b", "abdoulaye"),
    (r"\b(bakary|bacary|bakari)\b", "bakary"),
    (r"\b(seydou|saidou|saydou)\b", "seydou"),
    (r"\b(adama|adam)\b", "adama"),
]


def normalize_text(text: str) -> str:
    """Normalise les accents et minuscules pour les patronymes ouest-africains."""
    if not text:
        return ""
    nfkd_form = unicodedata.normalize("NFKD", text)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    clean = only_ascii.lower().strip()
    clean = re.sub(r"[^\w\s]", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def sahelian_phonetic_fingerprint(text: str) -> str:
    """
    Encodeur phonétique adapté aux langues sahéliennes et mandingues (Bambara, Dioula, Peul).
    Gère les allographes consonantiques, les voyelles longues et les nasales.
    """
    t = normalize_text(text)
    if not t:
        return ""
    
    # 1. Remplacer les groupes consonantiques équivalents
    t = re.sub(r"dj|dy|di(?=[aeou])", "j", t)
    t = re.sub(r"tch|ch|sh", "s", t)
    t = re.sub(r"c(?=[eiy])", "s", t)
    t = re.sub(r"c(?=[aou])|qu|ck", "k", t)
    t = re.sub(r"ph", "f", t)
    t = re.sub(r"th", "t", t)
    t = re.sub(r"ou|oo|w(?=[aeiou])", "u", t)
    t = re.sub(r"y(?=[aeiou])", "j", t)
    t = re.sub(r"g(?=[eiy])", "j", t)
    
    # 2. Remplacer voyelles nasales et diphtongues
    t = re.sub(r"an|am", "a", t)
    t = re.sub(r"en|em|in|im", "e", t)
    t = re.sub(r"on|om", "o", t)
    t = re.sub(r"un|um", "u", t)
    
    # 3. Réduction des voyelles étirées et consonnes géminées
    t = re.sub(r"([aeiou])\1+", r"\1", t)
    t = re.sub(r"([bcdfghjklmnpqrstvwxyz])\1+", r"\1", t)
    
    # 4. Suppression des h muets
    t = t.replace("h", "")
    
    return t.strip()


def phonetize_west_african(text: str) -> str:
    """
    Applique la standardisation phonétique ouest-africaine pour réduire les faux négatifs
    dus aux variations orthographiques courantes (Traoré/Traore/Trawally, Coulibaly/Kulibali, Camara/Kamara).
    """
    norm = normalize_text(text)
    for pattern, replacement in WEST_AFRICAN_EQUIVALENCES:
        norm = re.sub(pattern, replacement, norm)
    
    # Remplacements phonétiques régionaux généraux
    norm = norm.replace("ph", "f")
    norm = norm.replace("qu", "k")
    norm = norm.replace("tch", "c")
    norm = norm.replace("dj", "j")
    norm = norm.replace("dy", "j")
    norm = norm.replace("ou", "u")
    norm = re.sub(r"c(?=[eiy])", "s", norm)
    norm = re.sub(r"c(?=[aou])", "k", norm)
    # Réduction des géminées
    norm = re.sub(r"(.)\1+", r"\1", norm)
    return norm


def levenshtein_ratio(s1: str, s2: str) -> float:
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 100.0
    len1, len2 = len(s1), len(s2)
    dp = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        dp[i][0] = i
    for j in range(len2 + 1):
        dp[0][j] = j
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i - 1] == s2[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    distance = dp[len1][len2]
    max_len = max(len1, len2)
    return round((1.0 - (distance / max_len)) * 100.0, 2)


def compute_similarity(str1: str, str2: str) -> float:
    """
    Calcule le score de similarité composite (direct, token sort, variantes ouest-africaines phonétiques
    et empreinte sahélienne Metaphone/Soundex).
    """
    s1 = normalize_text(str1)
    s2 = normalize_text(str2)
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 100.0

    # Version phonétisée ouest-africaine
    p1 = phonetize_west_african(s1)
    p2 = phonetize_west_african(s2)

    # Empreintes phonétiques sahéliennes
    fp1 = sahelian_phonetic_fingerprint(s1)
    fp2 = sahelian_phonetic_fingerprint(s2)

    sim_fp = 0.0
    if fp1 and fp2:
        if fp1 == fp2:
            sim_fp = 98.0
        else:
            tokens_fp1 = " ".join(sorted(fp1.split()))
            tokens_fp2 = " ".join(sorted(fp2.split()))
            if tokens_fp1 == tokens_fp2:
                sim_fp = 96.0

    # Détection des initiales (ex: 'B. Coulibaly' vs 'Boubacar Coulibary')
    words1 = [w.strip(".") for w in s1.split() if w.strip(".")]
    words2 = [w.strip(".") for w in s2.split() if w.strip(".")]
    ratio_abbrev = 0.0
    if len(words1) >= 2 and len(words2) >= 2:
        last_sim = levenshtein_ratio(words1[-1], words2[-1])
        if words1[-1] == words2[-1] or last_sim >= 75.0:
            if words1[0][0] == words2[0][0]:
                ratio_abbrev = max(80.0, last_sim)

    if HAS_RAPIDFUZZ:
        sim_ratio = float(fuzz.ratio(s1, s2))
        sim_token = float(fuzz.token_sort_ratio(s1, s2))
        sim_token_set = float(fuzz.token_set_ratio(s1, s2))
        sim_partial = float(fuzz.partial_ratio(s1, s2))
        
        # Similarité sur les formes phonétisées
        sim_phonetic_ratio = float(fuzz.ratio(p1, p2))
        sim_phonetic_token = float(fuzz.token_sort_ratio(p1, p2))
        sim_phonetic_set = float(fuzz.token_set_ratio(p1, p2))

        # Similarité sur empreintes sahéliennes
        sim_fingerprint_token = float(fuzz.token_sort_ratio(fp1, fp2)) if fp1 and fp2 else 0.0

        score_max = max(
            sim_ratio,
            sim_token,
            sim_token_set * 0.95,
            sim_partial * 0.88,
            sim_phonetic_ratio,
            sim_phonetic_token,
            sim_phonetic_set,
            sim_fingerprint_token,
            sim_fp,
            ratio_abbrev,
        )
        return round(min(100.0, score_max), 1)

    # Fallback Levenshtein pur sans rapidfuzz
    ratio_direct = levenshtein_ratio(s1, s2)
    tokens1 = " ".join(sorted(s1.split()))
    tokens2 = " ".join(sorted(s2.split()))
    ratio_tokens = levenshtein_ratio(tokens1, tokens2)

    p_tokens1 = " ".join(sorted(p1.split()))
    p_tokens2 = " ".join(sorted(p2.split()))
    ratio_phonetic = levenshtein_ratio(p_tokens1, p_tokens2)

    return min(100.0, max(ratio_direct, ratio_tokens, ratio_phonetic, sim_fp, ratio_abbrev))


class FilteringService:
    """Service de filtrage sanctions et PPE avec calibrage phonétique ouest-africain."""

    def match_name(
        self,
        db: Session,
        nom_cherche: str,
        threshold: Optional[float] = None,
    ) -> List[MatchResult]:
        threshold = threshold or settings.SEUIL_SIMILARITE_SANCTIONS
        entries = db.query(SanctionEntry).all()
        results: List[MatchResult] = []

        for entry in entries:
            sim_nom = compute_similarity(nom_cherche, entry.nom_complet)
            sim_alias = 0.0
            if entry.aliases:
                for alias in entry.aliases.split(";"):
                    sim_alias = max(sim_alias, compute_similarity(nom_cherche, alias.strip()))

            score_max = max(sim_nom, sim_alias)
            if score_max >= threshold:
                matched_with = entry.nom_complet if sim_nom >= sim_alias else f"{entry.nom_complet} (alias: {entry.aliases})"
                results.append(
                    MatchResult(
                        nom_recherche=nom_cherche,
                        nom_liste=matched_with,
                        liste_nom=entry.liste_nom,
                        liste_type=entry.liste_type,
                        similarite=round(score_max, 1),
                        correspondance_detectee=True,
                        motif=f"Similarité {score_max:.1f}% avec {entry.liste_nom} ({entry.liste_type}) [Fuzzy Ouest-Africain]",
                    )
                )

        results.sort(key=lambda x: x.similarite, reverse=True)
        return results


filtering_service = FilteringService()
