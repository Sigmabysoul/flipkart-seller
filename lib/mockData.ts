export const products = [
  { name: 'R1S Selfie Stick', code: 'R1S', category: 'Selfie Stick', worker: 'Sohel', aliases: 6, pack: '—', status: 'Active' },
  { name: 'R16S Tripod', code: 'R16S', category: 'Tripod', worker: 'Sohel', aliases: 4, pack: '—', status: 'Active' },
  { name: 'Star Garbage Bag 12', code: 'STAR-12B', category: 'Garbage Bag', worker: 'Kartik Da', aliases: 8, pack: '4 × 3-Bag', status: 'Active' },
  { name: 'Averx Garbage Bag 6', code: 'AVERX-6', category: 'Garbage Bag', worker: 'Kartik Da', aliases: 5, pack: '2 × 3-Bag', status: 'Active' },
  { name: 'Butter Paper', code: 'BP-ROLL', category: 'Packaging', worker: 'Kartik Da', aliases: 3, pack: '—', status: 'Active' },
  { name: '3.5mm Microphone', code: 'MIC-35', category: 'Electronics', worker: 'Sohel', aliases: 2, pack: '—', status: 'Active' },
  { name: 'Aluminium Container 25 Piece', code: 'ALU-25', category: 'Container', worker: 'Sohel', aliases: 7, pack: '—', status: 'Active' },
]

export const labels = [
  { page: 1, awb: 'FMPC6419809470', order: 'OD338407993012613100', product: 'R1S', qty: 1, worker: 'Sohel', status: 'Mapped' },
  { page: 2, awb: 'FMPC6419809521', order: 'OD338407993012613101', product: 'Star Garbage Bag 12', qty: 2, worker: 'Kartik Da', status: 'Mapped' },
  { page: 17, awb: 'FMPC6419809470', order: 'OD338407993012613100', product: 'R1S', qty: 1, worker: 'Sohel', status: 'Duplicate' },
  { page: 31, awb: 'FMPC6419809678', order: 'OD338407993012613118', product: '7_SEST-NAF2-R1S-NEW-B-7', qty: 1, worker: 'Sohel', status: 'Unknown' },
  { page: 44, awb: 'FMPC6419809802', order: 'OD338407993012613132', product: 'R16S', qty: 1, worker: 'Sohel', status: 'Mapped' },
  { page: 68, awb: 'FMPC6419809934', order: 'OD338407993012613156', product: 'R1S + Star Garbage Bag 12', qty: 2, worker: 'Mixed', status: 'Mixed' },
]

export const batches = [
  { id: 'BATCH-0822-04', time: '11:42 AM', file: 'flipkart_labels_04.pdf', pages: 206, unique: 194, dupes: 12, unknown: 2, status: 'Review' },
  { id: 'BATCH-0822-03', time: '09:18 AM', file: 'morning_dispatch.pdf', pages: 84, unique: 81, dupes: 3, unknown: 0, status: 'Confirmed' },
  { id: 'BATCH-0821-02', time: '04:26 PM', file: 'returns_labels.pdf', pages: 42, unique: 40, dupes: 2, unknown: 1, status: 'Confirmed' },
]

export const unknownSkus = [
  { raw: '7_SEST-NAF2-R1S-NEW-B-7', description: 'NAFA 70cm Selfie Stick Tripod', seen: 18, suggested: 'R1S', worker: 'Sohel' },
  { raw: 'GB-STAR-12-NEW-X', description: 'Star Garbage Bag 12 Piece', seen: 11, suggested: 'Star Garbage Bag 12', worker: 'Kartik Da' },
  { raw: 'BP-ROLL-2026-A', description: 'Butter paper packaging roll', seen: 7, suggested: 'Butter Paper', worker: 'Kartik Da' },
]

export const stockOut = [
  ['Star Garbage Bag 3', 'Garbage Bag', 'Kartik Da', '15'],
  ['Star Garbage Bag 12', 'Garbage Bag', 'Kartik Da', '2'],
  ['Averx Garbage Bag 6', 'Garbage Bag', 'Kartik Da', '8'],
  ['R16S Tripod', 'Tripod', 'Sohel', '11'],
  ['R1S Selfie Stick', 'Selfie Stick', 'Sohel', '7'],
  ['3.5mm Microphone', 'Electronics', 'Sohel', '4'],
]

export const materials = [
  { name: 'Averx', three: 42, two: 11, tone: 'amber' },
  { name: 'Star', three: 28, two: 6, tone: 'blue' },
  { name: 'Plain Garbage Bag', three: 19, two: 4, tone: 'slate' },
]
