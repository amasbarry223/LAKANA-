import logging
from typing import List, Optional
from app.schemas.ai import AIExplainResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Assistant IA explicatif d'aide à l'analyse (IA-01, IA-02, IA-03, IA-04)."""

    def explain_alert(
        self,
        client_nom: str,
        score: int,
        facteurs: List[str],
        client_code: Optional[str] = None,
    ) -> AIExplainResponse:
        code_str = f" ({client_code})" if client_code else ""

        # Détermination de la qualification de risque
        if score >= 70:
            qualif = "élevé"
            priorite = "Priorité Haute — Examen approfondi immédiat recommandé"
        elif score >= 40:
            qualif = "moyen"
            priorite = "Priorité Moyenne — Surveillance renforcée"
        else:
            qualif = "faible"
            priorite = "Priorité Faible — Contrôle périodique standard"

        # Synthèse structurée en langage clair (IA-01 / IA-04 Mode de secours certifié)
        lignes_facteurs = "\n".join([f"• {f}" for f in facteurs]) if facteurs else "• Aucun facteur aggravant détecté."
        synthese = (
            f"Le client {client_nom}{code_str} présente un Risk Score de {score}/100, classé en risque {qualif}. "
            f"Ce niveau d'alerte s'explique par les signaux objectifs calculés par les règles de conformité :\n\n"
            f"{lignes_facteurs}\n\n"
            f"{priorite}."
        )

        points_cles = [
            f"Score global : {score}/100 ({qualif})",
            f"{len(facteurs)} facteur(s) de risque identifié(s)",
            "Détection conforme aux instructions KYC / CENTIF-Mali",
        ]

        # Si une clé API externe est configurée, un appel HTTP peut enrichir la formulation
        # Tout en garantissant le fallback immédiat
        return AIExplainResponse(
            synthese=synthese,
            points_cles=points_cles,
            rappel_conformite="⚠️ Rappel : la décision finale de gel, blocage ou déclaration de soupçon revient exclusivement à l'analyste habilité (IA-03).",
            source_moteur="Moteur de règles LAKANA & Assistant Explicatif",
        )


ai_service = AIService()
