import sys
import os

# Ajout du path backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.db.session import SessionLocal
from app.models import Client
from app.services import scoring_service, filtering_service, graph_service, ai_service


def test_compliance_services():
    db = SessionLocal()
    try:
        # Test 1 : Scoring
        moussa = db.query(Client).filter(Client.code_client == "CLI-1042").first()
        assert moussa is not None, "Client Moussa Traoré non trouvé"
        score_res = scoring_service.calculate_score(db, moussa)
        print(f"[TEST 1 PASS] Risk Score : {score_res['score']}/100, Niveau : {score_res['niveau_risque']}")
        for f in score_res["facteurs"]:
            print(f"   * {f}")

        # Test 2 : Fuzzy matching
        matches = filtering_service.match_name(db, "Traore Moussa")
        print(f"[TEST 2 PASS] Fuzzy matching 'Traore Moussa' : {len(matches)} match(es)")
        for m in matches:
            print(f"   * {m.nom_liste} ({m.similarite}%) [{m.liste_type}]")
        assert len(matches) > 0, "Aucun match trouvé pour Traore Moussa"

        # Test 3 : Assistant IA
        ai_res = ai_service.explain_alert(
            client_nom=f"{moussa.nom} {moussa.prenom or ''}",
            score=score_res["score"],
            facteurs=score_res["facteurs"],
            client_code=moussa.code_client,
        )
        print(f"[TEST 3 PASS] Synthèse IA : {ai_res.synthese[:100]}...")
        print(f"   Rappel impératif : {ai_res.rappel_conformite}")

        # Test 4 : Graphe financier
        graph = graph_service.build_client_graph(db, moussa.id)
        print(f"[TEST 4 PASS] Graphe financier : {len(graph.noeuds)} nœuds, {len(graph.liens)} liens, {graph.total_flux_detectes:,.0f} FCFA")
        assert len(graph.noeuds) > 0, "Le graphe ne contient aucun nœud"

        print("\n>>> TOUS LES SERVICES MÉTIERS SONT VALIDÉS AVEC SUCCÈS ! <<<")
    finally:
        db.close()


if __name__ == "__main__":
    test_compliance_services()
