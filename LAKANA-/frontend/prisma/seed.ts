import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Démarrage du seed Prisma PostgreSQL LAKANA...")

  // Nettoyage préalable optionnel
  await prisma.auditLog.deleteMany().catch(() => {})
  await prisma.investigation.deleteMany().catch(() => {})
  await prisma.alert.deleteMany().catch(() => {})
  await prisma.transaction.deleteMany().catch(() => {})
  await prisma.account.deleteMany().catch(() => {})
  await prisma.client.deleteMany().catch(() => {})
  await prisma.sanctionEntry.deleteMany().catch(() => {})
  await prisma.user.deleteMany().catch(() => {})

  // 1. Utilisateurs
  const userAdmin = await prisma.user.create({
    data: {
      email: "aminata.toure@sfd-bamako.ml",
      nomComplet: "Aminata Touré",
      role: "Analyste conformité",
      hashedPassword: "password123",
      institution: "SFD Bamako",
      mfaEnabled: false,
    },
  })

  await prisma.user.create({
    data: {
      email: "fatoumata.kone@sfd-bamako.ml",
      nomComplet: "Fatoumata Koné",
      role: "Responsable conformité",
      hashedPassword: "password123",
      institution: "SFD Bamako",
      mfaEnabled: true,
    },
  })

  await prisma.user.create({
    data: {
      email: "seydou.traore@sfd-bamako.ml",
      nomComplet: "Seydou Traoré",
      role: "Administrateur système",
      hashedPassword: "password123",
      institution: "Direction Générale",
      mfaEnabled: true,
    },
  })

  // 2. Sanctions et PPE
  await prisma.sanctionEntry.createMany({
    data: [
      {
        codeEntree: "FLT-241",
        nomComplet: "Diarra Fatoumata",
        aliases: "Diarra F.;Fatoumata Diarra",
        listeType: "PPE",
        listeNom: "Liste PPE Mali",
        titreFonction: "Conseillère ministérielle",
      },
      {
        codeEntree: "FLT-240",
        nomComplet: "Moussa Traoré",
        aliases: "Traore Moussa;M. Traore",
        listeType: "ONU",
        listeNom: "Sanctions ONU",
        titreFonction: "Opérateur sous surveillance",
      },
      {
        codeEntree: "FLT-239",
        nomComplet: "Oumar Sangaré",
        aliases: "Oumar Sangare;Sangare O.",
        listeType: "GAFI",
        listeNom: "Sanctions GAFI",
        titreFonction: "Personne désignée blanchiment",
      },
      {
        codeEntree: "FLT-235",
        nomComplet: "Boubacar Coulibaly",
        aliases: "B. Coulibary;Boubacar Coulibali",
        listeType: "CENTIF",
        listeNom: "CENTIF-Mali",
        titreFonction: "Signalement blanchiment capitaux",
      },
    ],
  })

  // 3. Clients
  const cliMoussa = await prisma.client.create({
    data: {
      codeClient: "CLI-1042",
      nom: "Traoré",
      prenom: "Moussa",
      dateNaissance: "14/05/1984",
      profession: "Commerçant import-export",
      ville: "Bamako",
      estPpe: false,
      niveauRisque: "Élevé",
      riskScore: 87,
    },
  })

  const cliFatoumata = await prisma.client.create({
    data: {
      codeClient: "CLI-1087",
      nom: "Diarra",
      prenom: "Fatoumata",
      dateNaissance: "22/11/1979",
      profession: "Cadre d'administration",
      ville: "Bamako",
      estPpe: true,
      niveauRisque: "Élevé",
      riskScore: 72,
    },
  })

  const cliIbrahim = await prisma.client.create({
    data: {
      codeClient: "CLI-1103",
      nom: "Keïta",
      prenom: "Ibrahim",
      dateNaissance: "03/02/1990",
      profession: "Agriculteur - Maraîchage",
      ville: "Sikasso",
      estPpe: false,
      niveauRisque: "Moyen",
      riskScore: 64,
    },
  })

  // 4. Comptes
  const cpt1Moussa = await prisma.account.create({
    data: {
      numeroCompte: "4821-001",
      clientId: cliMoussa.id,
      typeCompte: "Courant",
      solde: 3450000.0,
    },
  })

  await prisma.account.create({
    data: {
      numeroCompte: "7390-002",
      clientId: cliMoussa.id,
      typeCompte: "Épargne",
      solde: 8200000.0,
    },
  })

  // 5. Transactions de Fractionnement (Cas Moussa Traoré)
  const txAmounts = [920000, 880000, 950000, 760000, 690000, 600000]
  for (let i = 0; i < txAmounts.length; i++) {
    await prisma.transaction.create({
      data: {
        reference: `TX-90${i + 1}`,
        clientId: cliMoussa.id,
        compteSourceId: cpt1Moussa.id,
        beneficiaireNom: i % 2 === 0 ? "Diallo F." : "Camara K.",
        montant: txAmounts[i],
        typeOperation: "Dépôt espèces",
        canal: "Guichet",
        description: `Opération d'espèces comptoir #${i + 1}`,
      },
    })
  }

  // 6. Alerte
  const alrMoussa = await prisma.alert.create({
    data: {
      reference: "ALR-241",
      clientId: cliMoussa.id,
      typeAlerte: "Fractionnement",
      niveau: "bloquante",
      score: 87,
      module: "Fractionnement",
      facteurs: JSON.stringify([
        "Fractionnement détecté : 6 transactions cumulant 4 800 000 FCFA sous le seuil sur 48h (+30 pts)",
        "Volume moyen récent 3.4x supérieur à l'historique (+25 pts)",
        "Fréquence anormale de transactions (+20 pts)",
        "Flux financiers liés à un bénéficiaire préalablement signalé (+10 pts)",
      ]),
      statut: "en_cours",
      analyste: "A. Touré",
    },
  })

  // 7. Investigation
  await prisma.investigation.create({
    data: {
      reference: "INV-241",
      alerteId: alrMoussa.id,
      clientId: cliMoussa.id,
      analyste: "A. Touré",
      status: "en_cours",
      typeMotif: "Fractionnement",
      notesCount: 4,
      piecesCount: 2,
    },
  })

  // 8. Audit Log
  await prisma.auditLog.create({
    data: {
      utilisateur: "Aminata Touré",
      role: "Analyste conformité",
      action: "Prise en charge alerte",
      module: "Centre d'alertes",
      cible: "ALR-241",
      details: "Ouverture du dossier INV-241 pour suspicion de fractionnement",
    },
  })

  console.log("✅ Seed Prisma PostgreSQL complété avec succès !")
}

main()
  .catch((e) => {
    console.error("Erreur seed Prisma:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
