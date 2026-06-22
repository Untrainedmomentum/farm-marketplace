export default function TermsPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', maxWidth: 700, margin: '0 auto', color: '#2C1810' }}>
      <h1 style={{ color: 'var(--barn-red)' }}>Terms of Service</h1>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>Last updated: {new Date().toLocaleDateString()}</p>

      <p>
        My Farm Express ("we," "us," "the platform") operates a website connecting farmers, shoppers, delivery drivers,
        and farm service providers. By creating an account or using the platform, you agree to these Terms.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>1. What we are</h2>
      <p>
        We are a marketplace and listing platform. We are not a party to, and assume no responsibility for, the
        underlying sale of goods or services between farmers, shoppers, drivers, and service providers. We do not
        grow, inspect, store, deliver, or guarantee the quality, safety, legality, or accuracy of any product,
        delivery, or service listed on the platform.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>2. Accounts</h2>
      <p>
        You must provide accurate information when creating an account and are responsible for activity under your
        account. Farmer accounts are limited to one farm per account and a maximum number of active product listings,
        as described on the platform; we may adjust these limits at any time.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>3. Payments and fees</h2>
      <p>
        Payments are processed by Stripe. By using checkout, booking, or payout features, you also agree to the{' '}
        <a href="https://stripe.com/legal/connect-account" style={{ color: 'var(--barn-red)' }}>Stripe Connected Account Agreement</a>.
        Current platform fees are listed on our <a href="/fees" style={{ color: 'var(--barn-red)' }}>Fees page</a>, which is part of
        these Terms and may be updated from time to time. We are not a bank and do not custody funds outside of
        Stripe's processing of a transaction.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>4. Listings and content</h2>
      <p>
        Farmers, drivers, and service providers are solely responsible for the accuracy of their own listings,
        pricing, availability, certifications (e.g. "organic"), and the products, deliveries, or services they
        provide. Reviews reflect the opinions of individual users; we do not verify, edit, or remove reviews except
        where required by law or our content policies, and listings cannot suppress or delete reviews left about
        them.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>5. Prohibited conduct</h2>
      <p>
        You may not use the platform for unlawful purposes, to list products or services you are not legally
        permitted to sell, to misrepresent your identity or affiliation, to create duplicate accounts to evade limits
        or fees, or to circumvent payments outside the platform in a way that violates these Terms.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>6. Disclaimer of warranties</h2>
      <p>
        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
        PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>7. Limitation of liability</h2>
      <p>
        TO THE FULLEST EXTENT PERMITTED BY LAW, MY FARM EXPRESS AND ITS OPERATORS WILL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, ARISING FROM YOUR
        USE OF THE PLATFORM OR ANY TRANSACTION BETWEEN USERS. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE
        PLATFORM IS LIMITED TO THE GREATER OF $100 OR THE FEES YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM AROSE.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>8. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from claims arising from your listings, your products or
        services, your violation of these Terms, or your violation of any law or third-party right.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>9. Termination</h2>
      <p>
        We may suspend or terminate your account at any time for violation of these Terms or for any reason at our
        discretion, with or without notice.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>10. Changes</h2>
      <p>
        We may update these Terms at any time. Continued use of the platform after changes are posted constitutes
        acceptance of the updated Terms.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of [STATE], without regard to conflict-of-laws principles. Any dispute
        will be resolved in the state or federal courts located in [COUNTY/STATE], and you consent to that
        jurisdiction.
      </p>

      <h2 style={{ color: 'var(--barn-red)', fontSize: '1.1rem', marginTop: '1.5rem' }}>12. Contact</h2>
      <p>Questions about these Terms can be sent to [CONTACT EMAIL].</p>
    </main>
  )
}
