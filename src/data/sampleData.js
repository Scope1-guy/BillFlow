import { addDays, calcTotals, round2 } from '../utils/calc'

// Demo records. Dates are relative to today so the dashboard always looks "alive".
// This function is also used by the "Restore demo data" button in Settings.
export function createSampleData() {
  const clients = [
    { id: 'c1', name: 'Bright Harbor Studio', email: 'billing@brightharbor.example', phone: '+1 604 555 0142', address: '220 Granville St, Vancouver, BC, Canada' },
    { id: 'c2', name: 'Lagos Creative Hub', email: 'hello@lagoscreative.example', phone: '+234 802 555 0187', address: '14 Admiralty Way, Lekki, Lagos, Nigeria' },
    { id: 'c3', name: 'Maple & Co. Bakery', email: 'orders@maplebakery.example', phone: '+1 416 555 0119', address: '88 Queen St W, Toronto, ON, Canada' },
    { id: 'c4', name: 'Tolu Adeyemi Consulting', email: 'tolu@adeyemi.example', phone: '+234 805 555 0163', address: '5 Presidential Rd, Abeokuta, Ogun State, Nigeria' },
    { id: 'c5', name: 'Greenleaf Wellness', email: 'team@greenleaf.example', phone: '+44 20 7946 0958', address: '12 Camden High St, London, UK' },
  ]

  let itemCount = 0
  const line = (description, quantity, unitPrice) => ({
    id: `item-${++itemCount}`,
    description,
    quantity,
    unitPrice,
  })

  const terms = 'Payment due within 30 days of the issue date. Bank transfer preferred.'

  const invoices = [
    { id: 'i1', number: 'INV-001', clientId: 'c1', issueDate: addDays(-150), dueDate: addDays(-120), items: [line('Website design', 1, 2400), line('Logo refresh', 1, 600)], discount: 0, tax: 0, notes: 'Thank you for your business.', terms, saved: 'sent' },
    { id: 'i2', number: 'INV-002', clientId: 'c2', issueDate: addDays(-120), dueDate: addDays(-90), items: [line('React dashboard development', 40, 55), line('Hosting setup', 1, 150)], discount: 5, tax: 7.5, notes: '', terms, saved: 'sent' },
    { id: 'i3', number: 'INV-003', clientId: 'c3', issueDate: addDays(-95), dueDate: addDays(-65), items: [line('Online ordering page', 1, 1800)], discount: 0, tax: 0, notes: '', terms, saved: 'sent' },
    { id: 'i4', number: 'INV-004', clientId: 'c1', issueDate: addDays(-70), dueDate: addDays(-40), items: [line('Monthly maintenance', 3, 400)], discount: 0, tax: 0, notes: '', terms, saved: 'sent' },
    { id: 'i5', number: 'INV-005', clientId: 'c4', issueDate: addDays(-50), dueDate: addDays(-20), items: [line('Consulting workshop', 2, 750), line('Written report', 1, 500)], discount: 0, tax: 0, notes: 'Second reminder sent by phone.', terms, saved: 'sent' },
    { id: 'i6', number: 'INV-006', clientId: 'c2', issueDate: addDays(-35), dueDate: addDays(-5), items: [line('Landing page build', 1, 1200), line('Copywriting', 4, 60)], discount: 0, tax: 7.5, notes: '', terms, saved: 'sent' },
    { id: 'i7', number: 'INV-007', clientId: 'c5', issueDate: addDays(-25), dueDate: addDays(5), items: [line('Booking form integration', 1, 2200)], discount: 10, tax: 0, notes: '', terms, saved: 'sent' },
    { id: 'i8', number: 'INV-008', clientId: 'c3', issueDate: addDays(-12), dueDate: addDays(18), items: [line('Menu page updates', 5, 80)], discount: 0, tax: 0, notes: '', terms, saved: 'sent' },
    { id: 'i9', number: 'INV-009', clientId: 'c4', issueDate: addDays(-5), dueDate: addDays(25), items: [line('Brand strategy session', 1, 950)], discount: 0, tax: 0, notes: '', terms, saved: 'sent' },
    { id: 'i10', number: 'INV-010', clientId: 'c5', issueDate: addDays(-1), dueDate: addDays(29), items: [line('Newsletter template design', 1, 700)], discount: 0, tax: 0, notes: 'Draft - waiting for scope confirmation.', terms, saved: 'draft' },
  ]

  // Small helpers so the payments below stay readable
  const totalOf = (id) => calcTotals(invoices.find((invoice) => invoice.id === id)).total
  let paymentCount = 0
  const pay = (invoiceId, daysAgo, amount, method, note = '') => ({
    id: `p${++paymentCount}`,
    invoiceId,
    amount,
    date: addDays(-daysAgo),
    method,
    note,
  })

  const payments = [
    pay('i1', 125, totalOf('i1'), 'Bank transfer'),
    pay('i2', 100, 2000, 'Bank transfer', 'Deposit'),
    pay('i2', 88, round2(totalOf('i2') - 2000), 'Bank transfer', 'Final balance'),
    pay('i3', 70, totalOf('i3'), 'Card'),
    pay('i4', 45, totalOf('i4'), 'Bank transfer'),
    pay('i5', 30, 800, 'Cash', 'Part payment'),
    pay('i7', 8, 1000, 'Bank transfer', 'First instalment'),
    pay('i9', 2, totalOf('i9'), 'Card'),
  ]

  return { clients, invoices, payments }
}
