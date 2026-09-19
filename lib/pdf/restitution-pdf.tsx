import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatDateLongue, listeDeTextes } from "@/lib/format";

/*
  Logo Lumio en data URI, lu une seule fois par process.
  Le data URI evite tout acces reseau au moment du rendu : le PDF est aussi fabrique
  hors requete HTTP, quand il part en piece jointe d'email.
  Si le fichier est absent, on retourne null et l'en-tete retombe sur le logotype texte,
  pour qu'un logo manquant ne casse jamais la generation.
*/
let logoEnCache: string | null = null;

function logoDataUri(): string | null {
  if (logoEnCache) {
    return logoEnCache;
  }

  try {
    const octets = readFileSync(
      path.join(process.cwd(), "public", "logo-lumio.png"),
    );
    logoEnCache = `data:image/png;base64,${octets.toString("base64")}`;

    return logoEnCache;
  } catch {
    return null;
  }
}

/*
  Restitution d'audit en PDF, generee depuis les memes donnees que la page publique
  /offres/[token]. Le prospect recoit un document qu'il peut garder, imprimer ou montrer
  en interne, sans que le contenu soit ecrit une seconde fois a la main.

  Charte imprimable : fond blanc, texte noir, titres et accents en bleu. Le bleu clair
  de la charte est reserve au fond sombre, il n'a pas sa place ici. Police Helvetica,
  fournie avec le moteur PDF, en attendant l'integration de RNS Sanz.

  Un seul point d'entree : genererPdfRestitution. La route HTTP et l'email l'appellent
  tous les deux, pour qu'il n'existe pas deux facons de fabriquer ce document.

  Le logo est typographique : aucun fichier de logo n'existe dans le projet a ce jour.
  Le remplacer par une Image plus tard ne touche que le bloc d'en-tete.
*/

export const COULEURS_PDF = {
  noir: "#050505",
  blanc: "#FFFFFF",
  bleu: "#0054A6",
  gris: "#5A5A5A",
  grisClair: "#D5D5D5",
  fondBleu: "#EFF4FA",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COULEURS_PDF.blanc,
    color: COULEURS_PDF.noir,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 48,
    paddingBottom: 78,
    paddingHorizontal: 54,
  },

  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: COULEURS_PDF.bleu,
    paddingBottom: 10,
  },
  logo: {
    width: 150,
    height: 50,
  },
  // Repli si le fichier de logo est absent : le document reste lisible et signe.
  marque: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    letterSpacing: 2.4,
    color: COULEURS_PDF.bleu,
  },
  enteteDroite: {
    fontSize: 8.5,
    letterSpacing: 1.6,
    color: COULEURS_PDF.gris,
    textTransform: "uppercase",
  },

  titre: {
    fontFamily: "Helvetica",
    fontSize: 24,
    marginTop: 34,
    color: COULEURS_PDF.noir,
  },
  sousTitre: {
    fontSize: 11,
    marginTop: 8,
    color: COULEURS_PDF.gris,
  },
  entreprise: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COULEURS_PDF.noir,
  },

  sectionTitre: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COULEURS_PDF.bleu,
    marginTop: 34,
  },
  filetBleu: {
    width: 34,
    height: 2,
    backgroundColor: COULEURS_PDF.bleu,
    marginTop: 6,
    marginBottom: 14,
  },

  paragraphe: {
    fontSize: 11,
    lineHeight: 1.6,
    color: COULEURS_PDF.noir,
  },

  liste: {
    marginTop: 2,
  },
  elementListe: {
    flexDirection: "row",
    marginBottom: 9,
  },
  puce: {
    width: 4,
    height: 4,
    backgroundColor: COULEURS_PDF.bleu,
    marginTop: 6,
    marginRight: 9,
  },
  texteListe: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.55,
    color: COULEURS_PDF.noir,
  },

  encart: {
    marginTop: 34,
    backgroundColor: COULEURS_PDF.fondBleu,
    borderLeftWidth: 4,
    borderLeftColor: COULEURS_PDF.bleu,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  encartTitre: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COULEURS_PDF.bleu,
  },
  encartTexte: {
    fontSize: 15,
    lineHeight: 1.4,
    marginTop: 7,
    color: COULEURS_PDF.noir,
  },

  pied: {
    position: "absolute",
    left: 54,
    right: 54,
    bottom: 34,
    borderTopWidth: 1,
    borderTopColor: COULEURS_PDF.grisClair,
    paddingTop: 10,
  },
  piedLigne: {
    fontSize: 8.5,
    color: COULEURS_PDF.gris,
    lineHeight: 1.5,
  },
  piedNom: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COULEURS_PDF.noir,
  },
});

export type ClientPourPdf = {
  nom: string;
  entreprise: string | null;
  dateAudit: Date | null;
};

export type RestitutionPourPdf = {
  syntheseDiagnostic: string;
  opportunites: unknown;
  roiEstime: string | null;
};

/*
  Pied de page repris de company.md du vault Lumio Digital : raison sociale, adresse,
  contact. Ne rien inventer ici, ces mentions engagent la societe.
*/
function PiedDePage() {
  return (
    <View style={styles.pied} fixed>
      <Text style={styles.piedNom}>Moussa Diallo, Lumio Digital</Text>
      <Text style={styles.piedLigne}>moussa@lumiodigital.fr</Text>
      <Text style={styles.piedLigne}>
        Lumio Digital SASU, 6 rue d&apos;Armaillé, 75017 Paris
      </Text>
    </View>
  );
}

function DocumentRestitution({
  client,
  restitution,
}: {
  client: ClientPourPdf;
  restitution: RestitutionPourPdf;
}) {
  const opportunites = listeDeTextes(restitution.opportunites);
  const nomClient = client.entreprise || client.nom;

  return (
    <Document
      title={`Restitution d'audit, ${nomClient}`}
      author="Lumio Digital"
      subject="Restitution de l'audit IA"
      creator="Lumio Digital"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.entete}>
          {logoDataUri() ? (
            <Image style={styles.logo} src={logoDataUri() as string} />
          ) : (
            <Text style={styles.marque}>LUMIO DIGITAL</Text>
          )}
          <Text style={styles.enteteDroite}>Audit IA</Text>
        </View>

        <Text style={styles.titre}>Restitution de votre audit</Text>
        <View style={styles.sousTitre}>
          <Text style={styles.entreprise}>{nomClient}</Text>
          <Text>
            Audit réalisé le {formatDateLongue(client.dateAudit)}
          </Text>
        </View>

        <Text style={styles.sectionTitre}>Ce que l&apos;audit a révélé</Text>
        <View style={styles.filetBleu} />
        <Text style={styles.paragraphe}>{restitution.syntheseDiagnostic}</Text>

        {opportunites.length > 0 ? (
          <View>
            <Text style={styles.sectionTitre}>
              Ce que nous avons identifié
            </Text>
            <View style={styles.filetBleu} />
            <View style={styles.liste}>
              {opportunites.map((opportunite, index) => (
                <View key={index} style={styles.elementListe}>
                  <View style={styles.puce} />
                  <Text style={styles.texteListe}>{opportunite}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {restitution.roiEstime ? (
          <View style={styles.encart}>
            <Text style={styles.encartTitre}>Impact estimé</Text>
            <Text style={styles.encartTexte}>{restitution.roiEstime}</Text>
          </View>
        ) : null}

        <PiedDePage />
      </Page>
    </Document>
  );
}

/*
  Genere le PDF et le retourne en buffer.
  Appelee par la route HTTP de telechargement et par l'email d'envoi de l'offre :
  deux appels, une seule fabrication du document.
*/
export async function genererPdfRestitution(
  client: ClientPourPdf,
  restitution: RestitutionPourPdf,
): Promise<Buffer> {
  return renderToBuffer(
    <DocumentRestitution client={client} restitution={restitution} />,
  );
}
