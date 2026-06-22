import Link from 'next/link'

export default function FeesPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Fees</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>Every fee charged anywhere on My Farm Express, in one place.</p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Buying farm products</h2>
        <p style={{ color: '#444' }}>
          A flat <strong>$3 service fee</strong> is added to your order at checkout, no matter how many farms or items are in your cart.
          Farms keep 100% of what you pay them for their products.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Selling farm products</h2>
        <p style={{ color: '#444', marginBottom: '0.5rem' }}>Listing and selling is always free. Your plan affects how much you can sell per order and how fast you get paid:</p>
        <ul style={{ color: '#444', paddingLeft: '1.25rem' }}>
          <li><strong>Free:</strong> $50 per order limit, 7-day payout hold, until you connect Stripe — then up to the limits below.</li>
          <li><strong>Paid ($15/mo):</strong> $150 per order limit, 3-day payout hold.</li>
          <li><strong>Premium ($50/mo):</strong> no per-order limit, fastest standard payout (2-day hold).</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Booking a delivery driver</h2>
        <p style={{ color: '#444' }}>
          Drivers set their own delivery rate. A platform fee is taken from the driver's payout: <strong>$5 per delivery</strong> on
          the free plan, or <strong>$1 per delivery</strong> if the driver is subscribed ($20/mo).
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--barn-red)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Booking a farm service</h2>
        <p style={{ color: '#444' }}>
          Listing a service is always free. Service providers can connect Stripe and get paid for bookings at any time.
          A platform fee is taken from the provider's payout: <strong>$5 per booking</strong> on the free plan, or
          <strong> $1 per booking</strong> if the provider is subscribed ($15/mo).
        </p>
      </section>

      <p style={{ color: '#888', fontSize: '0.85rem' }}>
        Payments are processed by Stripe. See our <Link href="/terms" style={{ color: 'var(--barn-red)' }}>Terms of Service</Link> and{' '}
        <Link href="/privacy" style={{ color: 'var(--barn-red)' }}>Privacy Policy</Link> for more.
      </p>
    </main>
  )
}
