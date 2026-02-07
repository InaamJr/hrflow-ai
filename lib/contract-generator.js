/**
 * HRFlow AI - Contract Generation Module
 * 
 * Generates employment contracts using GPT-4 and creates DOCX files
 * Supports multiple jurisdictions with country-specific legal requirements
 * 
 * Usage in Next.js API route:
 *   import { generateContract } from '@/lib/contract-generator';
 *   const contract = await generateContract(employeeData, 'employment');
 */

const OpenAI = require('openai');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } = require('docx');
const fs = require('fs');

// ============================================================================
// COUNTRY-SPECIFIC DATA
// ============================================================================

const COUNTRY_LEGAL_DATA = {
  SG: {
    name: 'Singapore',
    currency: 'SGD',
    exchangeRate: 1.35,
    annualLeave: 14,
    noticePeriod: { junior: 1, mid: 2, senior: 3 },
    probationMonths: 3,
    workWeek: 44,
    overtimeRate: 1.5,
    requirements: [
      'CPF contributions (Employer: 17%, Employee: 20%)',
      'Compliance with Singapore Employment Act',
      'Statutory leave entitlements per Ministry of Manpower'
    ]
  },
  UK: {
    name: 'United Kingdom',
    currency: 'GBP',
    exchangeRate: 0.79,
    annualLeave: 28,
    noticePeriod: { junior: 1, mid: 1, senior: 3 },
    probationMonths: 6,
    workWeek: 37.5,
    overtimeRate: 1.0,
    requirements: [
      'Workplace pension (Employer: 3%, Employee: 5%)',
      'Compliance with UK Employment Rights Act 1996',
      'National Insurance contributions',
      'Statutory sick pay and maternity/paternity leave'
    ]
  },
  US: {
    name: 'United States',
    currency: 'USD',
    exchangeRate: 1.0,
    annualLeave: 15,
    noticePeriod: { junior: 0, mid: 0, senior: 0.5 },
    probationMonths: 3,
    workWeek: 40,
    overtimeRate: 1.5,
    requirements: [
      'At-will employment (unless stated otherwise)',
      '401(k) matching up to 4% of base salary',
      'FMLA compliance for eligible employees',
      'Fair Labor Standards Act (FLSA) compliance'
    ]
  },
  IN: {
    name: 'India',
    currency: 'INR',
    exchangeRate: 83.0,
    annualLeave: 18,
    noticePeriod: { junior: 1, mid: 2, senior: 3 },
    probationMonths: 3,
    workWeek: 48,
    overtimeRate: 2.0,
    requirements: [
      'Provident Fund (PF) contributions (Employer: 12%, Employee: 12%)',
      'Compliance with Indian Shops and Establishments Act',
      'Gratuity applicable after 5 years of service',
      'Professional Tax as per state regulations'
    ]
  },
  UAE: {
    name: 'United Arab Emirates',
    currency: 'AED',
    exchangeRate: 3.67,
    annualLeave: 30,
    noticePeriod: { junior: 1, mid: 1, senior: 3 },
    probationMonths: 6,
    workWeek: 48,
    overtimeRate: 1.25,
    requirements: [
      'End of Service Benefit calculation per UAE Labor Law',
      'Compliance with UAE Federal Law No. 8 of 1980',
      'Work permit and visa sponsorship',
      'Medical insurance coverage mandatory'
    ]
  }
};

// ============================================================================
// GPT-4 PROMPTS FOR CONTRACT GENERATION
// ============================================================================

const SYSTEM_PROMPTS = {
  employment: `You are an expert employment contract lawyer with deep knowledge of international labor law.

Your task is to generate a complete, legally sound employment contract based on the provided employee data and country requirements.

CRITICAL REQUIREMENTS:
1. Legal accuracy for the specific jurisdiction
2. Include ALL mandatory clauses for the country
3. Use proper legal terminology
4. Be comprehensive yet clear
5. Follow standard employment contract structure
6. Include specific numbers (salary, leave days, notice period)
7. Use formal but readable language

STRUCTURE:
- Header with parties
- Position and duties
- Compensation and benefits
- Working hours and leave
- Probation period
- Notice period and termination
- Confidentiality
- Intellectual property
- Governing law
- Signatures

OUTPUT FORMAT:
Generate markdown-formatted contract text that can be converted to DOCX.
Use ## for main headings, ### for subheadings.
Be precise with numbers and dates.`,

  nda: `You are an expert in confidentiality agreements and trade secret protection.

Generate a comprehensive Non-Disclosure Agreement (NDA) suitable for an employment context.

The NDA should cover:
- Definition of confidential information
- Obligations of the employee
- Permitted disclosures
- Duration of confidentiality
- Return of materials
- Remedies for breach
- Jurisdiction

Use clear, unambiguous language while maintaining legal enforceability.`,

  equity: `You are an expert in equity compensation and stock option agreements.

Generate a detailed Stock Option Grant Agreement.

Include:
- Grant details (number of shares, exercise price)
- Vesting schedule (4-year with 1-year cliff is standard)
- Exercise periods and windows
- Tax implications (country-specific)
- Termination provisions
- Acceleration clauses if applicable
- Governing law

Be precise with vesting calculations and dates.`
};

// ============================================================================
// CONTRACT GENERATION FUNCTIONS
// ============================================================================

function calculateLocalSalary(salaryUSD, country) {
  const rate = COUNTRY_LEGAL_DATA[country].exchangeRate;
  return Math.round(salaryUSD * rate);
}

function getNoticePeriod(role, country) {
  const level = role.includes('Executive') || role.includes('Director') ? 'senior' :
                role.includes('Senior') ? 'senior' :
                role.includes('Junior') ? 'junior' : 'mid';
  return COUNTRY_LEGAL_DATA[country].noticePeriod[level];
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

async function generateContractContent(employeeData, contractType, openaiApiKey) {
  const openai = new OpenAI({ apiKey: openaiApiKey });
  
  const countryData = COUNTRY_LEGAL_DATA[employeeData.country];
  const localSalary = calculateLocalSalary(employeeData.salaryUSD, employeeData.country);
  const noticePeriod = getNoticePeriod(employeeData.role, employeeData.country);
  
  // Build context for GPT-4
  const userPrompt = `Generate a ${contractType} contract with the following details:

EMPLOYEE INFORMATION:
- Full Name: ${employeeData.fullName}
- Role: ${employeeData.role}
- Department: ${employeeData.department}
- Start Date: ${employeeData.startDate}

LOCATION & JURISDICTION:
- Country: ${countryData.name}
- Governing Law: ${countryData.name}

COMPENSATION:
- Base Salary: ${formatCurrency(localSalary, countryData.currency)} per annum
- Equity: ${employeeData.equityShares?.toLocaleString() || 0} stock options
- Currency: ${countryData.currency}

EMPLOYMENT TERMS:
- Annual Leave: ${countryData.annualLeave} days
- Probation Period: ${countryData.probationMonths} months
- Notice Period: ${noticePeriod} month(s)
- Working Hours: ${countryData.workWeek} hours per week
- Overtime Rate: ${countryData.overtimeRate}x

LEGAL REQUIREMENTS FOR ${countryData.name}:
${countryData.requirements.map(r => `- ${r}`).join('\n')}

Generate a complete, legally sound ${contractType} contract following all applicable laws and regulations for ${countryData.name}.`;

  const startTime = Date.now();
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS[contractType] },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3, // Low temperature for consistency
    max_tokens: 3000
  });
  
  const generationTime = Date.now() - startTime;
  
  return {
    content: response.choices[0].message.content,
    generationTimeMs: generationTime,
    model: 'gpt-4-turbo-preview'
  };
}

// ============================================================================
// DOCX CREATION
// ============================================================================

function markdownToDOCX(markdownContent, employeeData, contractType) {
  const lines = markdownContent.split('\n');
  const children = [];
  
  // Add letterhead
  children.push(
    new Paragraph({
      text: 'HRFlow AI',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `${COUNTRY_LEGAL_DATA[employeeData.country].name} Office`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      text: contractType === 'employment' ? 'EMPLOYMENT AGREEMENT' :
            contractType === 'nda' ? 'NON-DISCLOSURE AGREEMENT' :
            'STOCK OPTION GRANT AGREEMENT',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 600 }
    })
  );
  
  // Parse markdown and convert to paragraphs
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('## ')) {
      // Main heading
      children.push(new Paragraph({
        text: trimmed.replace('## ', ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    } else if (trimmed.startsWith('### ')) {
      // Subheading
      children.push(new Paragraph({
        text: trimmed.replace('### ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      }));
    } else if (trimmed.startsWith('- ')) {
      // Bullet point
      children.push(new Paragraph({
        text: trimmed.replace('- ', '• '),
        spacing: { before: 100, after: 100 },
        indent: { left: 720 }
      }));
    } else if (trimmed.length > 0) {
      // Regular paragraph
      children.push(new Paragraph({
        text: trimmed,
        spacing: { before: 100, after: 100 }
      }));
    } else {
      // Empty line
      children.push(new Paragraph({ text: '' }));
    }
  });
  
  // Add signature section
  children.push(
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({ text: '________________________________', spacing: { before: 400 } }),
    new Paragraph({ text: `Employee Signature: ${employeeData.fullName}` }),
    new Paragraph({ text: `Date: _____________`, spacing: { after: 400 } }),
    new Paragraph({ text: '________________________________' }),
    new Paragraph({ text: 'Employer Signature: HRFlow AI' }),
    new Paragraph({ text: 'Date: _____________' })
  );
  
  // Create document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 12240,  // US Letter
            height: 15840
          },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children
    }]
  });
  
  return doc;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

async function generateContract(employeeData, contractType = 'employment', options = {}) {
  const {
    openaiApiKey = process.env.OPENAI_API_KEY,
    outputPath = null,
    returnBuffer = true
  } = options;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  console.log(`🔄 Generating ${contractType} contract for ${employeeData.fullName}...`);
  
  // Step 1: Generate contract content with GPT-4
  const { content, generationTimeMs, model } = await generateContractContent(
    employeeData,
    contractType,
    openaiApiKey
  );
  
  console.log(`✅ Content generated in ${generationTimeMs}ms`);
  
  // Step 2: Convert to DOCX
  const doc = markdownToDOCX(content, employeeData, contractType);
  const buffer = await Packer.toBuffer(doc);
  
  console.log(`✅ DOCX created (${(buffer.length / 1024).toFixed(1)} KB)`);
  
  // Step 3: Save to file if path provided
  if (outputPath) {
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Saved to ${outputPath}`);
  }
  
  // Return results
  return {
    success: true,
    contractType,
    employee: {
      id: employeeData.id,
      name: employeeData.fullName,
      role: employeeData.role,
      country: employeeData.country
    },
    content: content,
    buffer: returnBuffer ? buffer : null,
    metadata: {
      generationTimeMs,
      model,
      fileSize: buffer.length,
      timestamp: new Date().toISOString()
    }
  };
}

// ============================================================================
// BATCH GENERATION (for onboarding automation)
// ============================================================================

async function generateContractsForEmployee(employeeData, options = {}) {
  const contracts = [];
  const contractTypes = ['employment', 'nda'];
  
  // Add equity contract if employee has equity
  if (employeeData.equityShares && employeeData.equityShares > 0) {
    contractTypes.push('equity');
  }
  
  console.log(`\n📄 Generating ${contractTypes.length} contracts for ${employeeData.fullName}...\n`);
  
  for (const type of contractTypes) {
    const contract = await generateContract(employeeData, type, options);
    contracts.push(contract);
  }
  
  return {
    employee: employeeData,
    contracts,
    totalGenerationTime: contracts.reduce((sum, c) => sum + c.metadata.generationTimeMs, 0)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  generateContract,
  generateContractsForEmployee,
  COUNTRY_LEGAL_DATA,
  calculateLocalSalary,
  formatCurrency
};
