import unicodedata
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


def normalize_text(text: str) -> str:
    """Normalise les accents et minuscules pour les patronymes ouest-africains."""
    if not text:
        return ""
    nfkd_form = unicodedata.normalize("NFKD", text)
    only_ascii = "".join([c for c in nfkd_form if not unicodedata.combining(c)])
    return only_ascii.lower().strip()


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
    """Calcule le score de similarité composite (direct, token sort, variantes ouest-africaines)."""
    s1 = normalize_text(str1)
    s2 = normalize_text(str2)
    if not s1 or not s2:
        return 0.0
    if s1 == s2:
        return 100.0

    if HAS_RAPIDFUZZ:
        sim_ratio = float(fuzz.ratio(s1, s2))
        sim_token = float(fuzz.token_sort_ratio(s1, s2))
        return round(max(sim_ratio, sim_token), 1)

    # 1. Ratio standard
    ratio_direct = levenshtein_ratio(s1, s2)

    # 2. Token Sort Ratio (gère l'inversion nom/prénom ex: 'Diarra Fatoumata' vs 'Fatoumata Diarra')
    tokens1 = " ".join(sorted(s1.split()))
    tokens2 = " ".join(sorted(s2.split()))
    ratio_tokens = levenshtein_ratio(tokens1, tokens2)

    # 3. Détection des initiales (ex: 'b. coulibaly' vs 'boubacar coulibaly')
    words1 = [w.strip(".") for w in s1.split() if w.strip(".")]
    words2 = [w.strip(".") for w in s2.split() if w.strip(".")]
    ratio_abbrev = 0.0
    if len(words1) >= 2 and len(words2) >= 2:
        # Si le nom de famille concorde
        if words1[-1] == words2[-1] or levenshtein_ratio(words1[-1], words2[-1]) >= 80:
            if words1[0][0] == words2[0][0]:
                ratio_abbrev = 75.0

    return max(ratio_direct, ratio_tokens, ratio_abbrev)



class FilteringService:
    """Service de filtrage sanctions et PPE avec tolérance aux variantes orthographiques ouest-africaines."""

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
                        motif=f"Similarité {score_max:.1f}% avec {entry.liste_nom} ({entry.liste_type})",
                    )
                )

        results.sort(key=lambda x: x.similarite, reverse=True)
        return results


filtering_service = FilteringService()
