from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.client import Client
from app.models.alert import Alert
from app.services.structuring_service import structuring_service
from app.services.detection_service import detection_service
from app.services.filtering_service import filtering_service
from app.ml.feature_engineering import extract_features, features_to_vector, explain_anomalous_features
from app.ml.predictor import predict_anomaly


class ScoringService:
    """Moteur officiel de Risk Score LAKANA (0-100 pts) explicable, auditable et enrichi par IA."""

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
        pts_freq = min(20, behavior["points_frequence"])
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
            if matches and matches[0].similarite >= 80.0:
                pts_ppe = 15
                facteurs.append(
                    f"Correspondance sanctions ({matches[0].similarite}%) avec {matches[0].nom_liste} (+15 pts)"
                )
        decomposition["sanctions_ppe"] = {"points": pts_ppe, "max": 15}
        total_score += pts_ppe

        # 5. Relations inhabituelles / Nœuds suspects (REL - max 10 pts)
        pts_rel = 0
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

        # 6. Détection d'Anomalie par Intelligence Artificielle (IA - max 10 pts)
        pts_ia = 0
        try:
            feats = extract_features(db, client)
            has_activity = (len(client.transactions) > 0) if client.transactions else (feats.get("tx_count_30d", 0) > 0)
            
            if has_activity:
                vec = features_to_vector(feats)
                pred = predict_anomaly(vec)
                anomaly_score = pred.get("anomaly_score", 0.0)
                pred_risk = pred.get("predicted_risk", "Faible")

                if anomaly_score >= 0.70 or pred_risk == "Élevé":
                    pts_ia = 10
                    facteurs.append(
                        f"Détection d'anomalie IA : profil hautement atypique (score d'anomalie {anomaly_score:.2f}, risque prédit: {pred_risk}) (+10 pts)"
                    )
                elif anomaly_score >= 0.50 and total_score > 0:
                    pts_ia = 5
                    facteurs.append(
                        f"Signal IA modéré : comportement statistique atypique ({anomaly_score:.2f}) (+5 pts)"
                    )

                # Facteurs IA additionnels explicatifs
                ia_factors = explain_anomalous_features(feats, anomaly_score)
                for f_ia in ia_factors:
                    if not any(f_ia.split(":")[0] in existing for existing in facteurs):
                        facteurs.append(f"[IA-Insights] {f_ia}")
            else:
                anomaly_score = 0.0
                pred_risk = "Faible"
                pred = {"model_used": "rules-baseline", "confidence": 1.0}

            decomposition["modele_ia"] = {
                "points": pts_ia,
                "max": 10,
                "anomaly_score": anomaly_score,
                "predicted_risk": pred_risk,
                "model_used": pred.get("model_used", "rules-only"),
            }
        except Exception as e:
            decomposition["modele_ia"] = {"points": 0, "max": 10, "error": str(e)}

        total_score += pts_ia

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
