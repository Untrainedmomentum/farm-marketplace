export default function PrivacyPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 700, margin: '0 auto', color: '#2C1810' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Privacy Policy</h1>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>1. Information we collect</h2>
      <p>
        Account information (email, password, role), farm/driver/service profile details you provide (name, address,
        rates, photos, descriptions), order and booking history, and content you post (listings, reviews). We do not
        collect or store full payment card numbers — those are handled directly by Stripe.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>2. Location data</h2>
      <p>
        Addresses and zip codes you submit for farms, markets, events, or "near me" searches are converted to map
        coordinates using OpenStreetMap's Nominatim geocoding service. We store the resulting coordinates to display
        listings on the map and locator search.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>3. How we use information</h2>
      <p>
        To operate the marketplace: creating listings, processing orders and bookings, calculating fees and payouts,
        showing relevant search results, and communicating with you about your account or transactions.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>4. Third parties we share data with</h2>
      <p>
        <strong>Stripe</strong> (payment processing, identity verification for payouts), <strong>Supabase</strong>{' '}
        (database and authentication hosting), and <strong>OpenStreetMap/Nominatim</strong> (address geocoding). Each
        has its own privacy practices governing the data they process on our behalf. We do not sell your personal
        information.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>5. Public information</h2>
      <p>
        Farm, driver, and service listings — including names, locations, rates, and reviews — are visible to anyone
        visiting the site, including users who are not logged in. Don't include information in a listing you don't
        want public.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>6. Data retention</h2>
      <p>
        We retain account and transaction data for as long as your account is active and as needed to comply with
        legal, tax, and accounting obligations.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>7. Your choices</h2>
      <p>
        You can update or delete your listings at any time. To request deletion of your account or personal data,
        contact us at [CONTACT EMAIL]; some information may be retained where required by law (e.g. financial
        records).
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>8. Children's privacy</h2>
      <p>The platform is not directed to children under 13, and we do not knowingly collect their information.</p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>9. Changes</h2>
      <p>We may update this policy from time to time; continued use of the platform constitutes acceptance of the updated policy.</p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>10. Contact</h2>
      <p>Questions about this policy can be sent to [CONTACT EMAIL].</p>
    </main>
  )
}
