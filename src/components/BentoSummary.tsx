import React from 'react';

export interface BentoData {
  securityText?: string;
  emergencyContact?: string;
  prestationsText?: string;
  budgetText?: string;
  weatherText?: string;
}

interface BentoSummaryProps {
  data?: BentoData;
}

export const BentoSummary: React.FC<BentoSummaryProps> = ({ data }) => {
  const security = data?.securityText || 'Parcours sécurisé et balisé. Accompagnement recommandé sur les zones escarpées.';
  const emergency = data?.emergencyContact || 'Urgence : 112 | Référent BTS GIT';
  const prestations = data?.prestationsText || 'Visite guidée du Théâtre Antique, accès réservé aux sites historiques et hébergement 4★.';
  const budget = data?.budgetText || 'Budget estimé : 145 € / pers. (inclus accès sites, transports locaux et déjeuner).';
  const weather = data?.weatherText || 'Période idéale : Avril à Octobre. Climat méditerranéen ensoleillé (22°C - 28°C).';

  return (
    <div className="bento-summary-section" style={styles.section}>
      <h3 style={styles.sectionTitle}>
        <span style={{ fontSize: '1.4rem' }}>📋</span> Fiche de Synthèse du Parcours Touristique
      </h3>
      
      <div style={styles.grid}>
        {/* Carte 1 : Sécurité */}
        <div style={{ ...styles.card, ...styles.cardSecurity }}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>🛡️</span>
            <h4 style={styles.cardTitle}>Sécurité & Protocole</h4>
          </div>
          <p style={styles.cardText}>{security}</p>
          <div style={styles.emergencyBadge}>
            <span>📞 {emergency}</span>
          </div>
        </div>

        {/* Carte 2 : Prestations */}
        <div style={{ ...styles.card, ...styles.cardPrestations }}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>✨</span>
            <h4 style={styles.cardTitle}>Prestations & Inclusions</h4>
          </div>
          <p style={styles.cardText}>{prestations}</p>
          <div style={styles.tagList}>
            <span style={styles.tag}>Visite VIP</span>
            <span style={styles.tag}>Coupe-file</span>
            <span style={styles.tag}>Hôtel 4★</span>
          </div>
        </div>

        {/* Carte 3 : Budget */}
        <div style={{ ...styles.card, ...styles.cardBudget }}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>💶</span>
            <h4 style={styles.cardTitle}>Estimation Budgétaire</h4>
          </div>
          <p style={styles.cardText}>{budget}</p>
          <div style={styles.budgetFooter}>
            <span style={styles.budgetTranslucid}>Transparence tarifaire certifiée</span>
          </div>
        </div>

        {/* Carte 4 : Météo */}
        <div style={{ ...styles.card, ...styles.cardWeather }}>
          <div style={styles.cardHeader}>
            <span style={styles.icon}>☀️</span>
            <h4 style={styles.cardTitle}>Météo & Saisonnalité</h4>
          </div>
          <p style={styles.cardText}>{weather}</p>
          <div style={styles.weatherStat}>
            <span>🌡️ Saison conseillée : Printemps / Automne</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: '2rem',
    padding: '1.75rem',
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    color: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sectionTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#1e3a8a',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    letterSpacing: '-0.01em',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    padding: '1.25rem',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  cardSecurity: {
    background: '#fff1f2',
    borderLeft: '4px solid #ef4444',
  },
  cardPrestations: {
    background: '#f0fdf4',
    borderLeft: '4px solid #10b981',
  },
  cardBudget: {
    background: '#eff6ff',
    borderLeft: '4px solid #2563eb',
  },
  cardWeather: {
    background: '#fffbeb',
    borderLeft: '4px solid #f59e0b',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.75rem',
  },
  icon: {
    fontSize: '1.4rem',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  cardText: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    color: '#475569',
    lineHeight: 1.5,
    flexGrow: 1,
  },
  emergencyBadge: {
    padding: '0.4rem 0.75rem',
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 700,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  tag: {
    padding: '0.25rem 0.55rem',
    background: '#d1fae5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  budgetFooter: {
    fontSize: '0.8rem',
    color: '#1d4ed8',
    fontWeight: 500,
  },
  budgetTranslucid: {
    fontStyle: 'italic',
  },
  weatherStat: {
    fontSize: '0.82rem',
    color: '#b45309',
    fontWeight: 700,
  },
};
