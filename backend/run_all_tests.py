import os
import sys
import unittest

# Configuration de l'encodage pour Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ajout du path racine backend
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))


def run_test_suite():
    print("==================================================================")
    print("   LAKANA — SUITE COMPLÈTE DE TESTS AUTOMATISÉS (AML/CFT ENGINE)  ")
    print("==================================================================")

    test_loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    base_dir = os.path.abspath(os.path.dirname(__file__))

    # 1. Tests Unitaires
    print("\n[1/3] Chargement des Tests Unitaires (Logique Métier)...")
    suite.addTests(test_loader.discover(os.path.join(base_dir, "tests", "unit"), pattern="test_*.py", top_level_dir=base_dir))

    # 2. Tests d'Intégration
    print("[2/3] Chargement des Tests d'Intégration (Persistance & Workflow)...")
    suite.addTests(test_loader.discover(os.path.join(base_dir, "tests", "integration"), pattern="test_*.py", top_level_dir=base_dir))

    # 3. Tests d'API
    print("[3/3] Chargement des Tests d'API REST...")
    suite.addTests(test_loader.discover(os.path.join(base_dir, "tests", "api"), pattern="test_*.py", top_level_dir=base_dir))


    print(f"\nExécution de {suite.countTestCases()} cas de tests...\n")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n==================================================================")
    if result.wasSuccessful():
        print(f"   RÉSULTAT : SUCCÈS TOTAL ({result.testsRun} tests validés)")
        print("==================================================================")
        return 0
    else:
        print(f"   RÉSULTAT : ÉCHEC ({len(result.failures)} échecs, {len(result.errors)} erreurs)")
        print("==================================================================")
        return 1


if __name__ == "__main__":
    exit_code = run_test_suite()
    sys.exit(exit_code)
