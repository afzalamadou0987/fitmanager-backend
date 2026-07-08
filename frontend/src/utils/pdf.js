import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ORANGE = [245, 158, 11]
const DARK = [15, 23, 42]
const GRAY = [148, 163, 184]

export function generateReceipt({ member, subscription, gym }) {
  const doc = new jsPDF()

  // Header orange
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(...DARK)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FitManager', 15, 16)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestion de salle de sport Â· Togo', 15, 23)

  // Titre
  doc.setTextColor(...DARK)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('REÃ‡U DE PAIEMENT', 105, 45, { align: 'center' })

  // Infos salle
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(gym?.name || 'Ma Salle', 15, 58)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  if (gym?.address) doc.text(gym.address, 15, 64)
  if (gym?.phone) doc.text(gym.phone, 15, 70)

  // Date & Ref
  doc.setTextColor(...GRAY)
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 150, 58)
  doc.text(`RÃ©f : #${(subscription.id || '').substring(0, 8).toUpperCase()}`, 150, 64)

  // Ligne sÃ©paratrice
  doc.setDrawColor(...ORANGE)
  doc.setLineWidth(0.8)
  doc.line(15, 78, 195, 78)

  // Membre
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('MEMBRE', 15, 87)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(member.fullName || member.full_name || 'â€”', 15, 95)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(member.phone || 'â€”', 15, 101)

  // Table dÃ©tails
  autoTable(doc, {
    startY: 112,
    head: [['Description', 'DÃ©tails']],
    body: [
      ['Plan d\'abonnement', subscription.plan?.name || subscription.planName || 'â€”'],
      ['DurÃ©e', `${subscription.plan?.duration_days || 'â€”'} jours`],
      ['Date de dÃ©but', subscription.start_date ? new Date(subscription.start_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')],
      ['Date de fin', subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('fr-FR') : 'â€”'],
      ['Mode de paiement', subscription.payment_method === 'cash' ? 'ðŸ’µ Cash' : subscription.payment_method === 'flooz' ? 'ðŸ“± Flooz' : 'ðŸ“± T-Money'],
    ],
    headStyles: { fillColor: ORANGE, textColor: DARK, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
    margin: { left: 15, right: 15 }
  })

  // Total
  const finalY = doc.lastAutoTable.finalY + 8
  doc.setFillColor(...ORANGE)
  doc.roundedRect(15, finalY, 180, 16, 3, 3, 'F')
  doc.setTextColor(...DARK)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('MONTANT TOTAL PAYÃ‰', 20, finalY + 10)
  doc.text(`${new Intl.NumberFormat('fr-FR').format(subscription.amount_paid || 0)} FCFA`, 192, finalY + 10, { align: 'right' })

  // Footer
  doc.setTextColor(...GRAY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Merci pour votre confiance. Ce reÃ§u fait foi de paiement.', 105, 268, { align: 'center' })
  doc.text('FitManager â€” La solution de gestion de salle au Togo ðŸ‡¹ðŸ‡¬', 105, 274, { align: 'center' })

  const name = (member.fullName || member.full_name || 'membre').replace(/ /g, '-')
  doc.save(`recu-${name}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
}

export function exportMembersPDF({ members, gym }) {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(...ORANGE)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(...DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FitManager â€” Liste des membres', 15, 14)

  doc.setTextColor(50, 50, 50)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${gym?.name || 'Ma Salle'} Â· ExportÃ© le ${new Date().toLocaleDateString('fr-FR')} Â· ${members.length} membres`, 15, 32)

  autoTable(doc, {
    startY: 38,
    head: [['Nom', 'TÃ©lÃ©phone', 'Statut', 'Plan', 'Expiration']],
    body: members.map(m => [
      m.full_name || 'â€”',
      m.phone || 'â€”',
      m.subscriptionStatus === 'active' ? 'Actif' :
        m.subscriptionStatus === 'expiring_soon' ? `Expire dans ${m.daysLeft}j` :
        m.subscriptionStatus === 'expired' ? 'ExpirÃ©' : 'Sans abonnement',
      m.currentSubscription?.plan?.name || 'â€”',
      m.currentSubscription?.end_date ? new Date(m.currentSubscription.end_date).toLocaleDateString('fr-FR') : 'â€”'
    ]),
    headStyles: { fillColor: ORANGE, textColor: DARK, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw
        if (val === 'Actif') data.cell.styles.textColor = [16, 185, 129]
        else if (val.includes('Expire')) data.cell.styles.textColor = [245, 158, 11]
        else if (val === 'ExpirÃ©') data.cell.styles.textColor = [239, 68, 68]
      }
    },
    margin: { left: 10, right: 10 }
  })

  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  doc.text('GÃ©nÃ©rÃ© par FitManager Â· fitmanager-backend.vercel.app', 105, doc.internal.pageSize.height - 8, { align: 'center' })

  doc.save(`membres-${(gym?.name || 'salle').replace(/ /g, '-')}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
}

export function whatsappLink(phone, memberName, gymName, endDate) {
  const msg = `Bonjour ${memberName} ðŸ‘‹\n\nVotre abonnement Ã  *${gymName}* expire le *${new Date(endDate).toLocaleDateString('fr-FR')}*.\n\nRendez-vous Ã  la salle pour renouveler et continuer Ã  profiter de nos services ðŸ’ª\n\nMerci !`
  const cleaned = phone?.replace(/[\s\-\+]/g, '') || ''
  const intlPhone = cleaned.startsWith('00') ? cleaned.slice(2) : cleaned.startsWith('0') ? `228${cleaned.slice(1)}` : cleaned.startsWith('228') ? cleaned : `228${cleaned}`
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`
}
