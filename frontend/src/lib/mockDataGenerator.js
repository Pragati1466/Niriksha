// Synthetic data generator for NIRIKSHA
// Generates realistic inspection data for testing without backend

const ESTABLISHMENT_TYPES = [
  'Restaurant', 'Factory', 'Hospital', 'School', 'Hotel', 
  'Office Building', 'Warehouse', 'Retail Store', 'Pharmacy', 'Construction Site'
]

const INSPECTION_TYPES = [
  'Food Safety', 'Fire Safety', 'Factory Safety', 'Hospital Safety', 
  'Construction Safety', 'Pollution Control'
]

const VIOLATION_SEVERITY = ['Critical', 'Major', 'Minor', 'Info']

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Rejected', 'Draft']

const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL'
]

const INSPECTOR_NAMES = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
  'David Wilson', 'Jennifer Martinez', 'Robert Taylor', 'Lisa Anderson'
]

const generateRandomId = () => `INS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const generateEstablishmentName = (type) => {
  const prefixes = ['Grand', 'Royal', 'Metro', 'City', 'National', 'Prime', 'Elite', 'Central']
  const suffixes = ['Center', 'Complex', 'Plaza', 'Tower', 'Hub', 'Square', 'Park', 'Garden']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  return `${prefix} ${type} ${suffix}`
}

const generateChecklistItems = (inspectionType) => {
  const templates = {
    'Food Safety': [
      { id: 1, item: 'Food storage temperature maintained', required: true },
      { id: 2, item: 'Proper food handling procedures', required: true },
      { id: 3, item: 'Clean and sanitized equipment', required: true },
      { id: 4, item: 'Pest control measures in place', required: true },
      { id: 5, item: 'Food handler hygiene compliance', required: true },
    ],
    'Fire Safety': [
      { id: 1, item: 'Fire extinguishers accessible and maintained', required: true },
      { id: 2, item: 'Emergency exits clear and marked', required: true },
      { id: 3, item: 'Smoke detectors functional', required: true },
      { id: 4, item: 'Fire alarm system operational', required: true },
      { id: 5, item: 'Emergency evacuation plan posted', required: true },
    ],
    'Factory Safety': [
      { id: 1, item: 'Machine guards installed', required: true },
      { id: 2, item: 'Personal protective equipment available', required: true },
      { id: 3, item: 'Hazardous materials properly stored', required: true },
      { id: 4, item: 'Emergency stop devices functional', required: true },
      { id: 5, item: 'Ventilation system adequate', required: true },
    ]
  }
  
  const items = templates[inspectionType] || templates['Food Safety']
  return items.map(item => ({
    ...item,
    response: Math.random() > 0.3 ? 'compliant' : 'non-compliant',
    notes: Math.random() > 0.7 ? 'Additional observations noted' : '',
    evidence_count: Math.floor(Math.random() * 5)
  }))
}

const generateEvidence = (inspectionId) => {
  const types = ['image', 'image', 'image', 'document', 'video']
  const count = Math.floor(Math.random() * 8) + 2
  
  return Array.from({ length: count }, (_, i) => ({
    id: `EVI-${Date.now()}-${i}`,
    inspection_id: inspectionId,
    filename: `evidence_${i}.${types[i % types.length] === 'image' ? 'jpg' : types[i % types.length] === 'document' ? 'pdf' : 'mp4'}`,
    file_size: Math.floor(Math.random() * 5000000) + 100000,
    mime_type: types[i % types.length] === 'image' ? 'image/jpeg' : 
                types[i % types.length] === 'document' ? 'application/pdf' : 'video/mp4',
    url: `https://via.placeholder.com/400x300?text=Evidence+${i+1}`,
    thumbnail_url: `https://via.placeholder.com/150x150?text=Thumb+${i+1}`,
    uploaded_at: generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    virus_scan_status: Math.random() > 0.05 ? 'clean' : 'threat_detected',
    metadata: {
      gps_location: {
        lat: (Math.random() * 180 - 90).toFixed(6),
        lng: (Math.random() * 360 - 180).toFixed(6)
      },
      device_info: 'iPhone 14 Pro',
      timestamp: new Date().toISOString()
    }
  }))
}

const generateInspection = (index) => {
  const establishmentType = ESTABLISHMENT_TYPES[Math.floor(Math.random() * ESTABLISHMENT_TYPES.length)]
  const inspectionType = INSPECTION_TYPES[Math.floor(Math.random() * INSPECTION_TYPES.length)]
  const status = STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)]
  const isDraft = status === 'Draft'
  
  const inspection = {
    id: generateRandomId(),
    establishment_name: generateEstablishmentName(establishmentType),
    establishment_type: establishmentType,
    inspection_type: inspectionType,
    address: `${Math.floor(Math.random() * 9999)} Main Street, ${LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]}`,
    inspector_name: INSPECTOR_NAMES[Math.floor(Math.random() * INSPECTOR_NAMES.length)],
    inspector_id: `INS-${Math.floor(Math.random() * 100)}`,
    status: status,
    is_draft: isDraft,
    risk_score: isDraft ? null : Math.floor(Math.random() * 100),
    compliance_score: isDraft ? null : Math.floor(Math.random() * 100),
    created_at: generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    updated_at: generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    submitted_at: isDraft ? null : generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    checklist: generateChecklistItems(inspectionType),
    evidence: generateEvidence(generateRandomId()),
    notes: {
      inspector: 'General observations noted during inspection',
      observations: 'Several areas require attention',
      recommendations: 'Immediate corrective actions recommended',
      voice_notes: []
    },
    metadata: {
      gps_location: {
        lat: (Math.random() * 180 - 90).toFixed(6),
        lng: (Math.random() * 360 - 180).toFixed(6)
      },
      device_info: 'iPhone 14 Pro',
      inspection_duration: Math.floor(Math.random() * 120) + 30,
      accuracy: 'high'
    },
    ai_analysis: isDraft ? null : {
      risk_level: Math.random() > 0.5 ? 'high' : 'low',
      confidence_score: Math.floor(Math.random() * 30) + 70,
      key_findings: [
        'Multiple compliance issues detected',
        'Evidence supports checklist responses',
        'Recommend immediate follow-up'
      ],
      recommendations: [
        'Schedule re-inspection within 30 days',
        'Issue violation notice for critical items',
        'Provide compliance guidance'
      ]
    }
  }
  
  return inspection
}

export const generateInspections = (count = 50) => {
  return Array.from({ length: count }, (_, i) => generateInspection(i))
}

export const generateComplianceStats = () => {
  return {
    total_inspections: Math.floor(Math.random() * 500) + 100,
    completed_inspections: Math.floor(Math.random() * 400) + 80,
    pending_inspections: Math.floor(Math.random() * 50) + 10,
    high_risk_establishments: Math.floor(Math.random() * 30) + 5,
    compliance_rate: Math.floor(Math.random() * 20) + 75,
    average_inspection_time: Math.floor(Math.random() * 60) + 30,
    violations_detected: Math.floor(Math.random() * 200) + 50,
    critical_violations: Math.floor(Math.random() * 20) + 5
  }
}

export const generateNotifications = (count = 20) => {
  const types = ['alert', 'info', 'success']
  const titles = [
    'High Priority Inspection Assigned',
    'Inspection Report Ready',
    'Inspection Submitted Successfully',
    'Draft Expiring Soon',
    'System Maintenance Scheduled',
    'Profile Updated',
    'New Compliance Guidelines',
    'Evidence Upload Complete',
    'Checklist Updated',
    'AI Analysis Complete'
  ]
  
  return Array.from({ length: count }, (_, i) => ({
    id: `NOTIF-${Date.now()}-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    title: titles[Math.floor(Math.random() * titles.length)],
    message: 'Detailed notification message with relevant information about the event.',
    timestamp: generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    read: Math.random() > 0.4,
    action_url: Math.random() > 0.5 ? `/app/inspections/INS-${Date.now()}` : null
  }))
}

export const generateEvidenceGallery = (count = 100) => {
  const types = ['image', 'video', 'audio', 'document']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `EVI-${Date.now()}-${i}`,
    filename: `file_${i}.${types[i % types.length] === 'image' ? 'jpg' : types[i % types.length] === 'document' ? 'pdf' : types[i % types.length] === 'video' ? 'mp4' : 'mp3'}`,
    file_size: Math.floor(Math.random() * 10000000) + 50000,
    mime_type: types[i % types.length] === 'image' ? 'image/jpeg' : 
                types[i % types.length] === 'document' ? 'application/pdf' : 
                types[i % types.length] === 'video' ? 'video/mp4' : 'audio/mpeg',
    url: `https://via.placeholder.com/400x300?text=File+${i+1}`,
    thumbnail_url: `https://via.placeholder.com/150x150?text=Thumb+${i+1}`,
    uploaded_at: generateRandomDate(new Date(2024, 0, 1), new Date()).toISOString(),
    virus_scan_status: Math.random() > 0.05 ? 'clean' : 'threat_detected',
    inspection_id: generateRandomId()
  }))
}
