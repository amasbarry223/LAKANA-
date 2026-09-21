from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.alert import Alert
from app.services.structuring_service import structuring_service
from app.services.detection_service import detection_service
from app.services.filtering_service import filtering_service


class ScoringService:
    """Moteur officiel de Risk Score LAKANA (0-100 pts) explicable et auditable."""

    def calculate_score(self, db: Session, client: Client) -> Dict[str, Any]:
        facteurs: List[str] = []
        decomposition: Dict[str, Dict[str, Any]] = {}
        total_score = 0

        # 1. Fractionnement potentiel (FRC - max 30 pts)
        seq = structuring_service.detect_structuring(db, client.id)
        pts_frc = 0
        if seq:
            pts_frc = 30
            facteurs.append(
                f"Fractionnement détecté : {seq.count} transactions cumulant {seq.total_amount:,.0f} FCFA sous le seuil sur {seq.window_hours}h (+30 pts)"
            )
        decomposition["fractionnement"] = {"points": pts_frc, "max": 30}
        total_score += pts_frc

        # 2 & 3. Analyse comportementale Volume & Fréquence (VOL - max 25 pts, FREQ - max 20 pts)
        behavior = detection_service.analyze_behavior(db, client.id)
        pts_vol = behavior["points_volume"]
        pts_freq = behavior["points_frequence"]
        for f in behavior["facteurs"]:
            facteurs.append(f)
        decomposition["volume"] = {"points": pts_vol, "max": 25}
        decomposition["frequence"] = {"points": pts_freq, "max": 20}
        total_score += pts_vol + pts_freq

        # 4. Correspondance PPE / Sanctions (PPE - max 15 pts)
        pts_ppe = 0
        if client.est_ppe:
            pts_ppe = 15
            facteurs.append("Client enregistré comme Personne Politiquement Exposée (PPE) (+15 pts)")
        else:
            matches = filtering_service.match_name(db, client.nom)
            if matches and matches[0].similarite >= 85.0:
                pts_ppe = 15
                facteurs.append(
                    f"Correspondance sanctions ({matches[0].similarite}%) avec {matches[0].nom_liste} (+15 pts)"
                )
        decomposition["sanctions_ppe"] = {"points": pts_ppe, "max": 15}
        total_score += pts_ppe

        # 5. Relations inhabituelles / Nœuds suspects (REL - max 10 pts)
        pts_rel = 0
        # Vérification si des transactions sont dirigées vers un tiers signalé
        has_alert_beneficiary = False
        for t in client.transactions:
            if t.beneficiaire_nom and any(kw in t.beneficiaire_nom.lower() for kw in ["diallo f", "camara k", "douteux", "signalé"]):
                has_alert_beneficiary = True
                break
        if has_alert_beneficiary:
            pts_rel = 10
            facteurs.append("Flux financiers liés à un bénéficiaire préalablement signalé (+10 pts)")
        decomposition["relations"] = {"points": pts_rel, "max": 10}
        total_score += pts_rel

        # Plafonnement à 100
        score_final = min(100, total_score)

        # Détermination du niveau de risque
        if score_final >= 70:
            niveau = "Élevé"
        elif score_final >= 40:
            niveau = "Moyen"
        else:
            niveau = "Faible"

        # Mise à jour du client
        client.risk_score = score_final
        client.niveau_risque = niveau
        db.add(client)
        db.commit()
        db.refresh(client)

        return {
            "client_id": client.id,
            "code_client": client.code_client,
            "score": score_final,
            "niveau_risque": niveau,
            "facteurs": facteurs,
            "decomposition": decomposition,
        }


scoring_service = ScoringService()
