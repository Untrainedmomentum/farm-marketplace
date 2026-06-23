import Link from 'next/link'

export default function FeesPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Fees</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        No subscriptions, no plans to pick between. A flat <strong>$2 platform fee per transaction</strong>, across the board.
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Buying farm products</h2>
        <p style={{ color: '#444' }}>
          A flat <strong>$2 service fee</strong> is added to your order at checkout, no matter how many farms or items are in your cart.
          Farms keep 100% of what you pay them for their products.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Selling farm products</h2>
        <p style={{ color: '#444' }}>
          Listing and selling is always free — no subscription. Connecting Stripe raises your per-order limit and speeds up your payout:
        </p>
        <ul style={{ color: '#444', paddingLeft: '1.25rem' }}>
          <li><strong>Before connecting Stripe:</strong> $50 per order limit, 7-day payout hold.</li>
          <li><strong>After connecting Stripe:</strong> $150 per order limit, 3-day payout hold.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Booking a delivery driver</h2>
        <p style={{ color: '#444' }}>
          Drivers set their own delivery rate. A flat <strong>$2 platform fee</strong> is taken from the driver's payout per delivery — no subscription.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Booking a farm service</h2>
        <p style={{ color: '#444' }}>
          Listing a service is always free. A flat <strong>$2 platform fee</strong> is taken from the provider's payout per booking — no subscription.
        </p>
      </section>

      <p style={{ color: '#888', fontSize: '0.85rem' }}>
        Payments are processed by Stripe. See our <Link href="/terms" style={{ color: 'var(--barn-red)' }}>Terms of Service</Link> and{' '}
        <Link href="/privacy" style={{ color: 'var(--barn-red)' }}>Privacy Policy</Link> for more.
      </p>
    </main>
  )
}
