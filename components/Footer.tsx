import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ textAlign: 'center', padding: '2rem 1rem', fontFamily: 'Georgia, serif', fontSize: '0.8rem', color: '#999' }}>
      <Link href="/fees" style={{ color: '#999', marginRight: '1rem', textDecoration: 'none' }}>Fees</Link>
      <Link href="/terms" style={{ color: '#999', marginRight: '1rem', textDecoration: 'none' }}>Terms of Service</Link>
      <Link href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</Link>
    </footer>
  )
}
