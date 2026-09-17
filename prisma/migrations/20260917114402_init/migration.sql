-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entreprise" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "dateAudit" DATETIME,
    "notesAudit" TEXT,
    "calendlyEventUri" TEXT,
    "calendlyInviteeUri" TEXT,
    "fichierAuditNom" TEXT,
    "fichierAuditChemin" TEXT,
    "dateSignature" DATETIME,
    "dateLivraison" DATETIME,
    "relanceExtensionEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "statut" TEXT NOT NULL DEFAULT 'RDV_PLANIFIE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RestitutionAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "syntheseDiagnostic" TEXT NOT NULL,
    "opportunites" JSONB NOT NULL,
    "roiEstime" TEXT,
    "recommandation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RestitutionAudit_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "livrables" JSONB NOT NULL,
    "montant" REAL NOT NULL,
    "modaliteFacturement" TEXT NOT NULL,
    "abonnementMaintenanceInclus" BOOLEAN NOT NULL DEFAULT false,
    "packDedie" BOOLEAN NOT NULL DEFAULT false,
    "lienPaiement" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'ENVOYEE',
    "dateEnvoi" DATETIME,
    "dateReponse" DATETIME,
    "signatureNom" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offre_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "montantMensuel" REAL NOT NULL DEFAULT 90,
    "statut" TEXT NOT NULL DEFAULT 'ACTIF',
    "dateDebut" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateResiliation" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Abonnement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "objectifPrincipal" TEXT,
    "kpi" TEXT,
    "deadlineIdeale" TEXT,
    "outilsActuels" TEXT,
    "processActuel" TEXT,
    "problemesPrincipaux" TEXT,
    "accesTechniques" JSONB,
    "contraintesLegales" TEXT,
    "contraintesInternes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Questionnaire_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyseInterne" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "problemePrincipal" TEXT,
    "solutionProposee" TEXT,
    "quickWinsVisibles" TEXT,
    "pointsDeVigilance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyseInterne_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadmapPhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "description" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'A_VENIR',
    CONSTRAINT "RoadmapPhase_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommunicationUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunicationUpdate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreneauCommunication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    CONSTRAINT "CreneauCommunication_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_token_key" ON "Client"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Client_calendlyEventUri_key" ON "Client"("calendlyEventUri");

-- CreateIndex
CREATE UNIQUE INDEX "RestitutionAudit_clientId_key" ON "RestitutionAudit"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Questionnaire_clientId_key" ON "Questionnaire"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyseInterne_clientId_key" ON "AnalyseInterne"("clientId");
