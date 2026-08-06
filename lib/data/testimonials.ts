export interface Testimonial {
  quote: string
  authorName: string
  authorRole: string
  authorCompany: string
  initials: string
}

export const testimonials: Testimonial[] = [
  {
    quote: 'Asteria connected us with a full-stack developer who delivered in half the time we expected. The escrow system gave us complete peace of mind throughout.',
    authorName: 'Reem Al-Rashidi',
    authorRole: 'CTO',
    authorCompany: 'Taqa Digital',
    initials: 'RA',
  },
  {
    quote: 'As a freelancer, the platform handles everything — contracts, payments, client communication. I can focus entirely on the craft.',
    authorName: 'Youssef Benali',
    authorRole: 'Senior Designer',
    authorCompany: 'Independent',
    initials: 'YB',
  },
  {
    quote: 'We hired a data scientist for a 10-day project and the results were exceptional. The talent quality here is unmatched in the MENA region.',
    authorName: 'Amira Tabet',
    authorRole: 'Head of Product',
    authorCompany: 'Mashreq Labs',
    initials: 'AT',
  },
  {
    quote: 'The vetting process is rigorous — every freelancer I\'ve worked with has been professional, communicative, and delivered stellar work.',
    authorName: 'Khalid Al-Mansoori',
    authorRole: 'Founder',
    authorCompany: 'Saha Ventures',
    initials: 'KA',
  },
  {
    quote: 'I scaled my agency by 3x using Asteria to handle overflow projects. The platform\'s reliability is something I can stake my reputation on.',
    authorName: 'Dalia Sherif',
    authorRole: 'Agency Director',
    authorCompany: 'CreativeHub Cairo',
    initials: 'DS',
  },
]
