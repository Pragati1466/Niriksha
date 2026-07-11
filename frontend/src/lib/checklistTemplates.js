// Dynamic checklist templates based on inspection type

export const checklistTemplates = {
  food_safety: {
    name: 'Food Safety Inspection',
    sections: [
      {
        title: 'Kitchen Hygiene',
        items: [
          { id: 'fs-1', type: 'checkbox', label: 'Food storage areas clean and organized', required: true },
          { id: 'fs-2', type: 'checkbox', label: 'Proper food separation (raw vs cooked)', required: true },
          { id: 'fs-3', type: 'checkbox', label: 'Adequate refrigeration temperatures', required: true },
          { id: 'fs-4', type: 'checkbox', label: 'Food covered and protected from contamination', required: true },
          { id: 'fs-5', type: 'text', label: 'Observations on food handling practices', required: false }
        ]
      },
      {
        title: 'Storage',
        items: [
          { id: 'fs-6', type: 'checkbox', label: 'Dry storage clean and dry', required: true },
          { id: 'fs-7', type: 'checkbox', label: 'Proper labeling and dating of food items', required: true },
          { id: 'fs-8', type: 'checkbox', label: 'No expired food items found', required: true },
          { id: 'fs-9', type: 'checkbox', label: 'Pest control measures in place', required: true },
          { id: 'fs-10', type: 'dropdown', label: 'Pest control rating', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Staff Hygiene',
        items: [
          { id: 'fs-11', type: 'checkbox', label: 'Staff wearing clean uniforms', required: true },
          { id: 'fs-12', type: 'checkbox', label: 'Proper handwashing facilities available', required: true },
          { id: 'fs-13', type: 'checkbox', label: 'Staff health certificates current', required: true },
          { id: 'fs-14', type: 'checkbox', label: 'No ill staff working with food', required: true },
          { id: 'fs-15', type: 'number', label: 'Number of staff on duty', required: true }
        ]
      },
      {
        title: 'Waste Disposal',
        items: [
          { id: 'fs-16', type: 'checkbox', label: 'Proper waste segregation', required: true },
          { id: 'fs-17', type: 'checkbox', label: 'Waste bins covered and clean', required: true },
          { id: 'fs-18', type: 'checkbox', label: 'Regular waste removal schedule', required: true },
          { id: 'fs-19', type: 'text', label: 'Waste management observations', required: false }
        ]
      },
      {
        title: 'Temperature Control',
        items: [
          { id: 'fs-20', type: 'number', label: 'Refrigerator temperature (°C)', required: true },
          { id: 'fs-21', type: 'number', label: 'Freezer temperature (°C)', required: true },
          { id: 'fs-22', type: 'number', label: 'Hot holding temperature (°C)', required: true },
          { id: 'fs-23', type: 'checkbox', label: 'Temperature logs maintained', required: true }
        ]
      }
    ]
  },
  
  fire_safety: {
    name: 'Fire Safety Inspection',
    sections: [
      {
        title: 'Fire Extinguishers',
        items: [
          { id: 'fsf-1', type: 'checkbox', label: 'Fire extinguishers accessible and unobstructed', required: true },
          { id: 'fsf-2', type: 'checkbox', label: 'Fire extinguishers properly tagged and inspected', required: true },
          { id: 'fsf-3', type: 'number', label: 'Number of fire extinguishers', required: true },
          { id: 'fsf-4', type: 'dropdown', label: 'Extinguisher condition', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Emergency Exit',
        items: [
          { id: 'fsf-5', type: 'checkbox', label: 'Emergency exits clearly marked', required: true },
          { id: 'fsf-6', type: 'checkbox', label: 'Emergency exits unobstructed', required: true },
          { id: 'fsf-7', type: 'checkbox', label: 'Exit doors open easily from inside', required: true },
          { id: 'fsf-8', type: 'checkbox', label: 'Emergency lighting functional', required: true },
          { id: 'fsf-9', type: 'number', label: 'Number of emergency exits', required: true }
        ]
      },
      {
        title: 'Alarm System',
        items: [
          { id: 'fsf-10', type: 'checkbox', label: 'Fire alarm system functional', required: true },
          { id: 'fsf-11', type: 'checkbox', label: 'Alarm tested within last 6 months', required: true },
          { id: 'fsf-12', type: 'checkbox', label: 'Manual pull stations accessible', required: true },
          { id: 'fsf-13', type: 'dropdown', label: 'Alarm system type', options: ['Conventional', 'Addressable', 'Wireless'], required: true }
        ]
      },
      {
        title: 'Sprinklers',
        items: [
          { id: 'fsf-14', type: 'checkbox', label: 'Sprinkler system installed', required: true },
          { id: 'fsf-15', type: 'checkbox', label: 'Sprinkler heads unobstructed', required: true },
          { id: 'fsf-16', type: 'checkbox', label: 'Control valve accessible', required: true },
          { id: 'fsf-17', type: 'text', label: 'Sprinkler system observations', required: false }
        ]
      },
      {
        title: 'Emergency Plan',
        items: [
          { id: 'fsf-18', type: 'checkbox', label: 'Emergency evacuation plan posted', required: true },
          { id: 'fsf-19', type: 'checkbox', label: 'Staff trained on emergency procedures', required: true },
          { id: 'fsf-20', type: 'checkbox', label: 'Fire drills conducted regularly', required: true },
          { id: 'fsf-21', type: 'dropdown', label: 'Last drill date', options: ['Within 1 month', '1-3 months', '3-6 months', '6+ months'], required: true }
        ]
      }
    ]
  },
  
  factory: {
    name: 'Factory Inspection',
    sections: [
      {
        title: 'Machine Safety',
        items: [
          { id: 'fac-1', type: 'checkbox', label: 'Machine guards in place and functional', required: true },
          { id: 'fac-2', type: 'checkbox', label: 'Emergency stop buttons accessible', required: true },
          { id: 'fac-3', type: 'checkbox', label: 'Lockout/tagout procedures followed', required: true },
          { id: 'fac-4', type: 'checkbox', label: 'Regular maintenance schedule maintained', required: true },
          { id: 'fac-5', type: 'text', label: 'Machine safety observations', required: false }
        ]
      },
      {
        title: 'PPE Requirements',
        items: [
          { id: 'fac-6', type: 'checkbox', label: 'PPE provided to all workers', required: true },
          { id: 'fac-7', type: 'checkbox', label: 'PPE properly used by workers', required: true },
          { id: 'fac-8', type: 'checkbox', label: 'PPE in good condition', required: true },
          { id: 'fac-9', type: 'dropdown', label: 'PPE compliance level', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Emergency Exit',
        items: [
          { id: 'fac-10', type: 'checkbox', label: 'Emergency exits clearly marked', required: true },
          { id: 'fac-11', type: 'checkbox', label: 'Exit routes unobstructed', required: true },
          { id: 'fac-12', type: 'checkbox', label: 'Assembly point designated', required: true },
          { id: 'fac-13', type: 'number', label: 'Number of emergency exits', required: true }
        ]
      },
      {
        title: 'Electrical Safety',
        items: [
          { id: 'fac-14', type: 'checkbox', label: 'Electrical panels accessible and labeled', required: true },
          { id: 'fac-15', type: 'checkbox', label: 'No exposed wiring', required: true },
          { id: 'fac-16', type: 'checkbox', label: 'Ground fault protection installed', required: true },
          { id: 'fac-17', type: 'checkbox', label: 'Electrical inspection current', required: true }
        ]
      },
      {
        title: 'Hazards',
        items: [
          { id: 'fac-18', type: 'checkbox', label: 'Hazardous materials properly labeled', required: true },
          { id: 'fac-19', type: 'checkbox', label: 'MSDS available for all chemicals', required: true },
          { id: 'fac-20', type: 'checkbox', label: 'Spill containment measures in place', required: true },
          { id: 'fac-21', type: 'text', label: 'Hazard observations', required: false }
        ]
      }
    ]
  },
  
  hospital: {
    name: 'Hospital Inspection',
    sections: [
      {
        title: 'Sanitation',
        items: [
          { id: 'hosp-1', type: 'checkbox', label: 'Patient areas clean and sanitized', required: true },
          { id: 'hosp-2', type: 'checkbox', label: 'Waste disposal protocols followed', required: true },
          { id: 'hosp-3', type: 'checkbox', label: 'Biohazard waste properly handled', required: true },
          { id: 'hosp-4', type: 'dropdown', label: 'Sanitation rating', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Equipment',
        items: [
          { id: 'hosp-5', type: 'checkbox', label: 'Medical equipment properly maintained', required: true },
          { id: 'hosp-6', type: 'checkbox', label: 'Calibration records current', required: true },
          { id: 'hosp-7', type: 'checkbox', label: 'Backup power systems functional', required: true },
          { id: 'hosp-8', type: 'text', label: 'Equipment observations', required: false }
        ]
      },
      {
        title: 'Staff Compliance',
        items: [
          { id: 'hosp-9', type: 'checkbox', label: 'Staff wearing appropriate PPE', required: true },
          { id: 'hosp-10', type: 'checkbox', label: 'Hand hygiene protocols followed', required: true },
          { id: 'hosp-11', type: 'checkbox', label: 'Staff training current', required: true },
          { id: 'hosp-12', type: 'number', label: 'Number of staff on duty', required: true }
        ]
      },
      {
        title: 'Patient Safety',
        items: [
          { id: 'hosp-13', type: 'checkbox', label: 'Patient identification protocols in place', required: true },
          { id: 'hosp-14', type: 'checkbox', label: 'Fall prevention measures implemented', required: true },
          { id: 'hosp-15', type: 'checkbox', label: 'Medication safety procedures followed', required: true },
          { id: 'hosp-16', type: 'text', label: 'Patient safety observations', required: false }
        ]
      }
    ]
  },
  
  construction: {
    name: 'Construction Site Inspection',
    sections: [
      {
        title: 'Safety Equipment',
        items: [
          { id: 'const-1', type: 'checkbox', label: 'Hard hats provided and worn', required: true },
          { id: 'const-2', type: 'checkbox', label: 'Safety harnesses for heights', required: true },
          { id: 'const-3', type: 'checkbox', label: 'First aid kit accessible stocked', required: true },
          { id: 'const-4', type: 'checkbox', label: 'Fire extinguishers available', required: true }
        ]
      },
      {
        title: 'Site Security',
        items: [
          { id: 'const-5', type: 'checkbox', label: 'Site perimeter secured', required: true },
          { id: 'const-6', type: 'checkbox', label: 'Warning signs posted', required: true },
          { id: 'const-7', type: 'checkbox', label: 'Access control measures in place', required: true },
          { id: 'const-8', type: 'text', label: 'Security observations', required: false }
        ]
      },
      {
        title: 'Structural Safety',
        items: [
          { id: 'const-9', type: 'checkbox', label: 'Scaffolding properly erected', required: true },
          { id: 'const-10', type: 'checkbox', label: 'Fall protection systems in place', required: true },
          { id: 'const-11', type: 'checkbox', label: 'Excavation properly shored', required: true },
          { id: 'const-12', type: 'dropdown', label: 'Structural safety rating', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Environmental',
        items: [
          { id: 'const-13', type: 'checkbox', label: 'Dust control measures in place', required: true },
          { id: 'const-14', type: 'checkbox', label: 'Noise control measures implemented', required: true },
          { id: 'const-15', type: 'checkbox', label: 'Waste management plan followed', required: true },
          { id: 'const-16', type: 'text', label: 'Environmental observations', required: false }
        ]
      }
    ]
  },
  
  pollution: {
    name: 'Pollution Control Inspection',
    sections: [
      {
        title: 'Air Quality',
        items: [
          { id: 'poll-1', type: 'checkbox', label: 'Air filtration systems operational', required: true },
          { id: 'poll-2', type: 'checkbox', label: 'Emission monitoring equipment functional', required: true },
          { id: 'poll-3', type: 'number', label: 'PM2.5 reading (µg/m³)', required: true },
          { id: 'poll-4', type: 'number', label: 'PM10 reading (µg/m³)', required: true }
        ]
      },
      {
        title: 'Water Quality',
        items: [
          { id: 'poll-5', type: 'checkbox', label: 'Wastewater treatment operational', required: true },
          { id: 'poll-6', type: 'checkbox', label: 'Effluent within permissible limits', required: true },
          { id: 'poll-7', type: 'checkbox', label: 'Water quality testing current', required: true },
          { id: 'poll-8', type: 'dropdown', label: 'Water quality rating', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true }
        ]
      },
      {
        title: 'Waste Management',
        items: [
          { id: 'poll-9', type: 'checkbox', label: 'Hazardous waste properly stored', required: true },
          { id: 'poll-10', type: 'checkbox', label: 'Waste disposal permits current', required: true },
          { id: 'poll-11', type: 'checkbox', label: 'Recycling program in place', required: true },
          { id: 'poll-12', type: 'text', label: 'Waste management observations', required: false }
        ]
      },
      {
        title: 'Noise Control',
        items: [
          { id: 'poll-13', type: 'checkbox', label: 'Noise levels within limits', required: true },
          { id: 'poll-14', type: 'checkbox', label: 'Noise barriers installed', required: true },
          { id: 'poll-15', type: 'number', label: 'Noise level (dB)', required: true },
          { id: 'poll-16', type: 'text', label: 'Noise control observations', required: false }
        ]
      }
    ]
  }
}

export const getChecklistTemplate = (inspectionType) => {
  return checklistTemplates[inspectionType] || null
}

export const getChecklistProgress = (responses, template) => {
  if (!template || !responses) return 0
  
  let totalItems = 0
  let completedItems = 0
  
  template.sections.forEach(section => {
    section.items.forEach(item => {
      totalItems++
      if (responses[item.id] !== undefined && responses[item.id] !== '') {
        completedItems++
      }
    })
  })
  
  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0
}
