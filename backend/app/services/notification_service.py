"""
Service de Notification Multi-Canal LAKANA (WhatsApp WasenderAPI & Email SMTP).
Permet l'expédition immédiate et réelle des alertes de conformité LBC/FT/FP aux personnes habilitées
(Responsable Conformité, Direction d'Agence, Auditeur) dès détection au guichet.
"""
import os
import re
import json
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Dict, Any, List, Optional
import httpx
from pydantic import BaseModel
from app.core.config import settings

logger = logging.getLogger("lakana.notifications")


class DispatchedNotification(BaseModel):
    id: str
    channel: str  # "WhatsApp" ou "Email"
    destinataire: str
    alerte_ref: str
    type_alerte: str
    niveau: str
    client_nom: str
    montant_fcfa: Optional[float] = None
    contenu: str
    statut_envoi: str  # "delivre", "simule", "cle_manquante", "erreur_api"
    created_at: str


class NotificationService:
    def __init__(self):
        # Configuration des destinataires par défaut selon les directives de conformité
        self.default_whatsapp_phone = settings.WASENDER_ALERT_PHONE or "+22364663918"
        self.default_compliance_email = settings.ALERT_EMAIL or "fombadaouda72@gmail.com"
        self.director_email = os.getenv("LAKANA_DIRECTOR_EMAIL", "direction.agence@sfd-mali.ml")

        # Mémoire tampon des dernières notifications expédiées (accessible pour l'UI)
        self._dispatched_history: List[DispatchedNotification] = []

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retourne l'historique des notifications expédiées."""
        return [n.model_dump() for n in reversed(self._dispatched_history[-limit:])]

    def _clean_phone(self, phone: str) -> str:
        """Nettoie le numéro de téléphone pour WasenderAPI (format E.164 sans espaces ni tirets)."""
        clean = re.sub(r"[^\d+]", "", phone.strip())
        # S'assurer du préfixe international si manquant
        if clean.startswith("64") and len(clean) == 8:
            clean = "223" + clean
        return clean

    def _dispatch_wasender_http(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Appel direct à l'API Wasender (https://wasenderapi.com/api/send-message).
        Documentation: https://wasenderapi.com
        """
        api_key = settings.WASENDER_API_KEY or os.getenv("WASENDER_API_KEY", "")
        clean_phone = self._clean_phone(phone)

        if not api_key:
            logger.warning("⚠️ [WasenderAPI] Clé WASENDER_API_KEY absente dans .env. Alerte WhatsApp simulée localement.")
            return {
                "success": False,
                "status": "cle_wasender_manquante",
                "detail": "Veuillez renseigner WASENDER_API_KEY dans backend/.env (compte https://wasenderapi.com/dashboard)"
            }

        url = f"{settings.WASENDER_BASE_URL.rstrip('/')}/send-message"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "to": clean_phone,
            "text": message
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload, headers=headers)
                if resp.status_code in (200, 201):
                    logger.info(f"✅ [WasenderAPI] Alerte WhatsApp expédiée en réel à {clean_phone} : {resp.text}")
                    return {"success": True, "status": "delivre (WasenderAPI)", "detail": resp.text}
                else:
                    logger.error(f"❌ [WasenderAPI] Erreur HTTP {resp.status_code} : {resp.text}")
                    return {"success": False, "status": f"erreur_wasender_{resp.status_code}", "detail": resp.text}
        except Exception as e:
            logger.error(f"❌ [WasenderAPI] Échec réseau vers WasenderAPI : {e}")
            return {"success": False, "status": "erreur_reseau_wasender", "detail": str(e)}

    def _dispatch_smtp_email(self, recipient: str, subject: str, html_body: str, plain_text: str) -> Dict[str, Any]:
        """
        Expédition réelle du courriel via SMTP TLS (ex: Gmail smtp.gmail.com:587).
        """
        smtp_server = settings.SMTP_SERVER or "smtp.gmail.com"
        smtp_port = settings.SMTP_PORT or 587
        smtp_user = settings.SMTP_USER or "fombadaouda72@gmail.com"
        smtp_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")
        smtp_from = settings.SMTP_FROM or smtp_user

        if not smtp_password:
            logger.warning("⚠️ [SMTP] Aucun mot de passe d'application SMTP configuré dans backend/.env.")
            return {
                "success": False,
                "status": "mdp_smtp_manquant",
                "detail": "Pour l'envoi réel Gmail, générez un 'Mot de passe d'application' Google et renseignez SMTP_PASSWORD dans backend/.env."
            }

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"LAKANA Conformité <{smtp_from}>"
        msg["To"] = recipient

        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
                logger.info(f"✅ [Email SMTP] Fiche CENTIF envoyée en réel à {recipient}")
                return {"success": True, "status": "delivre (SMTP)", "detail": f"Expédié via {smtp_server}:{smtp_port}"}
        except Exception as e:
            logger.error(f"❌ [Email SMTP] Échec envoi email à {recipient} : {e}")
            return {"success": False, "status": "erreur_smtp", "detail": str(e)}

    def send_whatsapp_alert(
        self,
        alerte_ref: str,
        type_alerte: str,
        niveau: str,
        client_nom: str,
        montant_fcfa: float,
        motif: str,
        agence: str = "Agence Centrale Bamako",
        destinataire: Optional[str] = None
    ) -> DispatchedNotification:
        """
        Formate et transmet un message d'alerte instantané via WasenderAPI WhatsApp.
        """
        phone = destinataire or self.default_whatsapp_phone
        now_str = datetime.utcnow().strftime("%d/%m/%Y à %H:%M UTC")

        # Formatage du message WhatsApp professionnel sans icône ni émoji
        message = (
            f"*ALERTE CONFORMITE LAKANA — {niveau.upper()}*\n"
            f"------------------------------------\n"
            f"Ref Dossier : {alerte_ref}\n"
            f"Typologie : {type_alerte}\n"
            f"Societaire : {client_nom}\n"
            f"Montant Operation : {montant_fcfa:,.0f} FCFA\n"
            f"Agence : {agence}\n"
            f"Horodatage : {now_str}\n"
            f"Motif de detection : {motif}\n"
            f"------------------------------------\n"
            f"Action requise : Rendez-vous sur le Dashboard LAKANA pour valider ou suspendre l'operation."
        )

        # Appel direct à l'API Wasender
        api_res = self._dispatch_wasender_http(phone, message)
        statut = api_res["status"]

        notif = DispatchedNotification(
            id=f"NOTIF-WA-{int(datetime.utcnow().timestamp() * 1000)}",
            channel="WhatsApp",
            destinataire=phone,
            alerte_ref=alerte_ref,
            type_alerte=type_alerte,
            niveau=niveau,
            client_nom=client_nom,
            montant_fcfa=montant_fcfa,
            contenu=message,
            statut_envoi=statut,
            created_at=datetime.utcnow().isoformat()
        )
        self._dispatched_history.append(notif)
        return notif

    def send_email_alert(
        self,
        alerte_ref: str,
        type_alerte: str,
        niveau: str,
        client_nom: str,
        montant_fcfa: float,
        facteurs: List[str],
        agence: str = "Agence Centrale Bamako",
        destinataire: Optional[str] = None
    ) -> DispatchedNotification:
        """
        Génère et transmet une fiche d'alerte officielle par courriel au Responsable de Conformité.
        """
        recipient = destinataire or self.default_compliance_email
        now_str = datetime.utcnow().strftime("%d/%m/%Y à %H:%M")
        subject = f"[LAKANA CONFORMITE] Alerte {niveau.upper()} : {type_alerte} — {client_nom}"

        facteurs_html = "".join([f"<li>{f}</li>" for f in facteurs]) if facteurs else "<li>Signalement automatisé du pare-feu</li>"
        plain_text = f"ALERTE LAKANA ({niveau.upper()}) - Ref: {alerte_ref}\nClient: {client_nom}\nMontant: {montant_fcfa:,.0f} FCFA\nAgence: {agence}\nMotif: {type_alerte}"

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #4338ca; color: white; padding: 16px 24px;">
                    <h2 style="margin: 0; font-size: 18px;">LAKANA — Signalement de Conformité LBC/FT/FP</h2>
                    <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">Instruction réglementaire CENTIF / UEMOA</p>
                </div>
                <div style="padding: 24px;">
                    <div style="display: inline-block; background-color: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px; margin-bottom: 16px;">
                        Niveau : {niveau.upper()}
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                        <tr><td style="padding: 6px 0; color: #64748b;">Référence Alerte :</td><td style="font-weight: bold;">{alerte_ref}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Typologie :</td><td style="font-weight: bold; color: #dc2626;">{type_alerte}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Sociétaire concerné :</td><td><strong>{client_nom}</strong></td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Montant de l'opération :</td><td style="font-size: 16px; font-weight: bold; color: #0f172a;">{montant_fcfa:,.0f} FCFA</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Agence d'exécution :</td><td>{agence}</td></tr>
                        <tr><td style="padding: 6px 0; color: #64748b;">Date & Heure :</td><td>{now_str}</td></tr>
                    </table>

                    <div style="background-color: #f8fafc; border-left: 4px solid #4338ca; padding: 12px 16px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #334155;">Éléments factuels déclencheurs :</h4>
                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                            {facteurs_html}
                        </ul>
                    </div>

                    <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                        Conformément à la réglementation UEMOA et au principe d'explicabilité LAKANA, la décision finale d'autorisation ou de transmission au CENTIF revient à l'analyste habilité.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Envoi SMTP réel si configuré
        smtp_res = self._dispatch_smtp_email(recipient, subject, html_body, plain_text)
        statut = smtp_res["status"]

        notif = DispatchedNotification(
            id=f"NOTIF-EM-{int(datetime.utcnow().timestamp() * 1000)}",
            channel="Email",
            destinataire=recipient,
            alerte_ref=alerte_ref,
            type_alerte=type_alerte,
            niveau=niveau,
            client_nom=client_nom,
            montant_fcfa=montant_fcfa,
            contenu=f"Courriel officiel expédié avec corps HTML à {recipient} (Statut: {statut})",
            statut_envoi=statut,
            created_at=datetime.utcnow().isoformat()
        )
        self._dispatched_history.append(notif)
        return notif

    def dispatch_aml_alert(
        self,
        alerte_ref: str,
        type_alerte: str,
        niveau: str,
        client_nom: str,
        montant_fcfa: float,
        facteurs: List[str],
        agence: str = "Agence Centrale Bamako",
        whatsapp_phone: Optional[str] = None,
        email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Déclenche simultanément l'envoi WhatsApp et Email à la détection d'une anomalie.
        """
        motif = facteurs[0] if facteurs else type_alerte

        # 1. Envoi WhatsApp
        wa_notif = self.send_whatsapp_alert(
            alerte_ref=alerte_ref,
            type_alerte=type_alerte,
            niveau=niveau,
            client_nom=client_nom,
            montant_fcfa=montant_fcfa,
            motif=motif,
            agence=agence,
            destinataire=whatsapp_phone or self.default_whatsapp_phone
        )

        # 2. Envoi Email
        em_notif = self.send_email_alert(
            alerte_ref=alerte_ref,
            type_alerte=type_alerte,
            niveau=niveau,
            client_nom=client_nom,
            montant_fcfa=montant_fcfa,
            facteurs=facteurs,
            agence=agence,
            destinataire=email or self.default_compliance_email
        )

        return {
            "whatsapp_envoye": True,
            "whatsapp_destinataire": wa_notif.destinataire,
            "whatsapp_statut": wa_notif.statut_envoi,
            "email_envoye": True,
            "email_destinataire": em_notif.destinataire,
            "email_statut": em_notif.statut_envoi,
            "timestamp": datetime.utcnow().isoformat()
        }


notification_service = NotificationService()
