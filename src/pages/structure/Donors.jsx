export default function StructureDonors() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '40px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ color: 'var(--red)', marginBottom: '12px' }}>Accès non autorisé</h2>
        <p style={{ color: 'var(--text2)', lineHeight: '1.6', marginBottom: '16px' }}>
          Les structures de santé n'ont pas accès à la liste des donneurs.
        </p>
        <p style={{ color: 'var(--text3)', fontSize: '13px', lineHeight: '1.6' }}>
          Conformément à l'architecture CNTS, toute communication avec les donneurs passe exclusivement par le <strong>Centre National de Transfusion Sanguine</strong>. Soumettez vos demandes de sang et le CNTS se charge de la coordination.
        </p>
        <div style={{
          marginTop: '20px', padding: '12px 16px',
          background: '#FFF8E1', border: '1px solid var(--orange)',
          borderRadius: '8px', fontSize: '13px', color: '#856404'
        }}>
          💡 Pour vos besoins en sang, utilisez <strong>Mes demandes</strong> — le CNTS traitera votre demande.
        </div>
      </div>
    </div>
  )
}
