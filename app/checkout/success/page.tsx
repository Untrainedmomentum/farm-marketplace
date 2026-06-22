import Link from 'next/link'

export default function CheckoutSuccess() {
  return (
    <main style={{ padding: 40, fontFamily: 'Georgia, serif', textAlign: 'center' }}>
      <h1>Thank you for your order! 🌾</h1>
      <p>Your payment was successful. Your order is being processed.</p>
      <p><Link href="/marketplace">Continue shopping</Link></p>
    </main>
  )
}
