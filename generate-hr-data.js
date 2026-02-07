/**
 * HRFlow AI - Comprehensive Data Generation Script
 * Generates 1000+ realistic employee records with full HR operational data
 * 
 * Run: node generate-hr-data.js
 * Output: Multiple JSON files ready for Supabase import
 */

const { faker } = require('@faker-js/faker');
const fs = require('fs');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  TOTAL_EMPLOYEES: 1200, // Generate 1200 employees for robust dataset
  COUNTRY_DISTRIBUTION: {
    SG: 0.40,  // 480 employees (HQ in Singapore)
    UK: 0.25,  // 300 employees
    US: 0.20,  // 240 employees
    IN: 0.10,  // 120 employees
    UAE: 0.05  // 60 employees
  },
  ROLE_DISTRIBUTION: {
    'Executive': 0.02,
    'Director': 0.05,
    'Senior Engineer': 0.15,
    'Software Engineer': 0.25,
    'Junior Engineer': 0.18,
    'Product Manager': 0.08,
    'Designer': 0.10,
    'Data Analyst': 0.07,
    'DevOps Engineer': 0.05,
    'QA Engineer': 0.05
  },
  DEPARTMENTS: ['Engineering', 'Product', 'Design', 'Data', 'Operations', 'Sales', 'Marketing'],
  CONTRACT_TYPES: ['employment', 'nda', 'equity', 'contractor_agreement']
};

// ============================================================================
// COUNTRY-SPECIFIC DATA
// ============================================================================

const COUNTRY_DATA = {
  SG: {
    name: 'Singapore',
    currency: 'SGD',
    exchangeRate: 1.35,
    annualLeave: 14,
    publicHolidays: 11,
    noticePeriod: { junior: 1, mid: 2, senior: 3 }, // months
    workPermitRequired: false, // For SG citizens
    probationMonths: 3,
    standardWorkWeek: 44,
    overtimeMultiplier: 1.5,
    cpfEmployer: 0.17,
    cpfEmployee: 0.20
  },
  UK: {
    name: 'United Kingdom',
    currency: 'GBP',
    exchangeRate: 0.79,
    annualLeave: 28, // Including bank holidays
    publicHolidays: 8,
    noticePeriod: { junior: 1, mid: 1, senior: 3 },
    workPermitRequired: false, // Post-Brexit settled status
    probationMonths: 6,
    standardWorkWeek: 37.5,
    overtimeMultiplier: 1.0,
    pensionEmployer: 0.03,
    pensionEmployee: 0.05
  },
  US: {
    name: 'United States',
    currency: 'USD',
    exchangeRate: 1.0,
    annualLeave: 15,
    publicHolidays: 10,
    noticePeriod: { junior: 0, mid: 0, senior: 0.5 }, // At-will employment
    workPermitRequired: true, // For non-citizens
    probationMonths: 3,
    standardWorkWeek: 40,
    overtimeMultiplier: 1.5,
    benefits401k: 0.04 // Employer match
  },
  IN: {
    name: 'India',
    currency: 'INR',
    exchangeRate: 83.0,
    annualLeave: 18,
    publicHolidays: 12,
    noticePeriod: { junior: 1, mid: 2, senior: 3 },
    workPermitRequired: false,
    probationMonths: 3,
    standardWorkWeek: 48,
    overtimeMultiplier: 2.0,
    pfEmployer: 0.12,
    pfEmployee: 0.12
  },
  UAE: {
    name: 'United Arab Emirates',
    currency: 'AED',
    exchangeRate: 3.67,
    annualLeave: 30,
    publicHolidays: 11,
    noticePeriod: { junior: 1, mid: 1, senior: 3 },
    workPermitRequired: true,
    probationMonths: 6,
    standardWorkWeek: 48,
    overtimeMultiplier: 1.25,
    endOfServiceBenefit: true
  }
};

// ============================================================================
// SALARY RANGES (in USD)
// ============================================================================

const SALARY_RANGES = {
  'Executive': { min: 180000, max: 350000, equity: { min: 50000, max: 200000 } },
  'Director': { min: 140000, max: 220000, equity: { min: 20000, max: 80000 } },
  'Senior Engineer': { min: 100000, max: 160000, equity: { min: 5000, max: 25000 } },
  'Software Engineer': { min: 70000, max: 120000, equity: { min: 2000, max: 10000 } },
  'Junior Engineer': { min: 50000, max: 80000, equity: { min: 500, max: 3000 } },
  'Product Manager': { min: 90000, max: 150000, equity: { min: 4000, max: 20000 } },
  'Designer': { min: 65000, max: 110000, equity: { min: 2000, max: 10000 } },
  'Data Analyst': { min: 60000, max: 100000, equity: { min: 1000, max: 8000 } },
  'DevOps Engineer': { min: 85000, max: 140000, equity: { min: 3000, max: 15000 } },
  'QA Engineer': { min: 55000, max: 95000, equity: { min: 1000, max: 6000 } }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function selectByDistribution(distribution) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability;
    if (rand <= cumulative) return key;
  }
  
  return Object.keys(distribution)[0];
}

// Track used emails to ensure uniqueness
const usedEmails = new Set();
let emailCounter = 1;

function generateEmail(firstName, lastName) {
  let baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hrflow.ai`;
  
  // If email already exists, add a number to make it unique
  if (usedEmails.has(baseEmail)) {
    baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailCounter}@hrflow.ai`;
    emailCounter++;
  }
  
  usedEmails.add(baseEmail);
  return baseEmail;
}

function calculateLocalSalary(usdSalary, country) {
  const rate = COUNTRY_DATA[country].exchangeRate;
  return Math.round(usdSalary * rate);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getNoticePeriod(role, country) {
  const level = role.includes('Executive') || role.includes('Director') ? 'senior' :
                role.includes('Senior') ? 'senior' :
                role.includes('Junior') ? 'junior' : 'mid';
  return COUNTRY_DATA[country].noticePeriod[level];
}

function shouldHaveWorkPermit(country) {
  if (!COUNTRY_DATA[country].workPermitRequired) return false;
  return Math.random() > 0.3; // 70% have work permits in countries that require them
}

function generateComplianceScenarios() {
  const rand = Math.random();
  
  // Create specific scenarios for demo impact
  if (rand < 0.05) return 'expiring_soon'; // 5% permits expiring in 30-60 days
  if (rand < 0.10) return 'training_overdue'; // 5% with overdue training
  if (rand < 0.18) return 'no_leave_6months'; // 8% haven't taken leave in 6+ months
  if (rand < 0.25) return 'equipment_unreturned'; // 7% with unreturned equipment
  return 'compliant'; // 75% are compliant
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

function generateEmployees(count) {
  const employees = [];
  const today = new Date();
  const companyFoundedDate = new Date('2020-01-01');
  
  // Reset email tracking for fresh generation
  usedEmails.clear();
  emailCounter = 1;
  
  for (let i = 0; i < count; i++) {
    const country = selectByDistribution(CONFIG.COUNTRY_DISTRIBUTION);
    const role = selectByDistribution(CONFIG.ROLE_DISTRIBUTION);
    const department = faker.helpers.arrayElement(CONFIG.DEPARTMENTS);
    
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = generateEmail(firstName, lastName);
    
    const salaryRange = SALARY_RANGES[role];
    const salaryUSD = faker.number.int({ min: salaryRange.min, max: salaryRange.max });
    const equityShares = faker.number.int({ min: salaryRange.equity.min, max: salaryRange.equity.max });
    
    // Generate realistic start dates (spread across company history)
    const startDate = randomDate(companyFoundedDate, today);
    
    // Calculate leave balance based on tenure
    const monthsEmployed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30));
    const annualLeave = COUNTRY_DATA[country].annualLeave;
    const leaveAccrued = Math.min(annualLeave, (monthsEmployed / 12) * annualLeave);
    const leaveUsed = faker.number.int({ min: 0, max: Math.floor(leaveAccrued * 0.8) });
    const leaveBalance = Math.max(0, Math.round(leaveAccrued - leaveUsed));
    
    // Compliance scenario
    const complianceScenario = generateComplianceScenarios();
    
    // Last leave date logic
    let lastLeaveDate = null;
    if (complianceScenario === 'no_leave_6months') {
      // Haven't taken leave in 6-9 months
      lastLeaveDate = new Date(today.getTime() - (faker.number.int({ min: 180, max: 270 }) * 24 * 60 * 60 * 1000));
    } else {
      // Took leave in last 1-120 days
      lastLeaveDate = new Date(today.getTime() - (faker.number.int({ min: 1, max: 120 }) * 24 * 60 * 60 * 1000));
    }
    
    // Work permit expiry
    let workPermitExpiry = null;
    if (shouldHaveWorkPermit(country)) {
      if (complianceScenario === 'expiring_soon') {
        // Expiring in 30-60 days
        workPermitExpiry = new Date(today.getTime() + (faker.number.int({ min: 30, max: 60 }) * 24 * 60 * 60 * 1000));
      } else {
        // Valid for 1-3 years
        workPermitExpiry = new Date(today.getTime() + (faker.number.int({ min: 365, max: 1095 }) * 24 * 60 * 60 * 1000));
      }
    }
    
    const employee = {
      id: faker.string.uuid(),
      email,
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      role,
      country,
      department,
      salary_usd: salaryUSD,
      salary_local: calculateLocalSalary(salaryUSD, country),
      currency: COUNTRY_DATA[country].currency,
      equity_shares: equityShares,
      start_date: startDate.toISOString().split('T')[0],
      employment_type: faker.helpers.arrayElement(['full_time', 'full_time', 'full_time', 'contractor']), // 75% full-time
      work_permit_expiry: workPermitExpiry ? workPermitExpiry.toISOString().split('T')[0] : null,
      last_leave_date: lastLeaveDate.toISOString().split('T')[0],
      leave_balance_days: leaveBalance,
      leave_accrued_days: Math.round(leaveAccrued),
      probation_end_date: new Date(startDate.getTime() + (COUNTRY_DATA[country].probationMonths * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      notice_period_months: getNoticePeriod(role, country),
      phone: faker.phone.number(),
      date_of_birth: faker.date.birthdate({ min: 22, max: 58, mode: 'age' }).toISOString().split('T')[0],
      address: faker.location.streetAddress(true),
      city: faker.location.city(),
      emergency_contact_name: faker.person.fullName(),
      emergency_contact_phone: faker.phone.number(),
      bank_account: faker.finance.iban(),
      tax_id: faker.finance.accountNumber(),
      compliance_scenario: complianceScenario,
      created_at: startDate.toISOString(),
      updated_at: today.toISOString()
    };
    
    employees.push(employee);
  }
  
  // Assign managers (top 10% have no manager, rest report to someone senior)
  const executives = employees.filter(e => e.role === 'Executive' || e.role === 'Director');
  const nonExecutives = employees.filter(e => e.role !== 'Executive' && e.role !== 'Director');
  
  nonExecutives.forEach(employee => {
    const manager = faker.helpers.arrayElement(executives);
    employee.manager_id = manager.id;
  });
  
  return employees;
}

function generateContractTemplates() {
  const templates = [];
  
  // Employment Contract Templates for each country
  Object.keys(COUNTRY_DATA).forEach(countryCode => {
    const country = COUNTRY_DATA[countryCode];
    
    templates.push({
      id: faker.string.uuid(),
      country: countryCode,
      contract_type: 'employment',
      template_name: `${country.name} Employment Agreement`,
      template_content: `
# EMPLOYMENT AGREEMENT

This Employment Agreement is entered into on {{start_date}} between:

**Employer:** HRFlow AI Pte Ltd ({{country}})
**Employee:** {{full_name}}

## 1. POSITION AND DUTIES
The Employee is hired as {{role}} in the {{department}} department.

## 2. COMPENSATION
- Base Salary: {{salary_local}} {{currency}} per annum
- Payment Frequency: Monthly
${country.currency === 'SGD' ? '- CPF Contributions: Employer 17%, Employee 20%' : ''}
${country.currency === 'GBP' ? '- Pension: Employer 3%, Employee 5%' : ''}
${country.currency === 'USD' ? '- 401(k) Match: Up to 4% of base salary' : ''}

## 3. EQUITY COMPENSATION
The Employee shall receive {{equity_shares}} stock options subject to:
- 4-year vesting schedule
- 1-year cliff
- Exercise price: Fair market value at grant date

## 4. BENEFITS
- Annual Leave: ${country.annualLeave} days per year
- Public Holidays: ${country.publicHolidays} days
- Medical Insurance: Comprehensive coverage
- Work from Home: 2 days per week allowed

## 5. PROBATIONARY PERIOD
${country.probationMonths} months from start date

## 6. NOTICE PERIOD
- Employee: {{notice_period_months}} month(s) written notice
- Employer: {{notice_period_months}} month(s) written notice or payment in lieu

## 7. WORKING HOURS
Standard work week: ${country.standardWorkWeek} hours
Overtime: ${country.overtimeMultiplier}x base rate

## 8. CONFIDENTIALITY
Employee agrees to maintain strict confidentiality of all proprietary information.

## 9. GOVERNING LAW
This agreement is governed by the laws of {{country_name}}.

**Employee Signature:** _______________________
**Date:** {{signature_date}}

**Employer Signature:** _______________________
**Date:** {{signature_date}}
      `,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });
    
    // NDA Template
    templates.push({
      id: faker.string.uuid(),
      country: countryCode,
      contract_type: 'nda',
      template_name: `${country.name} Non-Disclosure Agreement`,
      template_content: `
# NON-DISCLOSURE AGREEMENT

Between HRFlow AI and {{full_name}}

The Employee acknowledges that during employment, they will have access to:
- Trade secrets and proprietary technology
- Customer and supplier information
- Financial and business strategies
- Product development plans

The Employee agrees to:
1. Keep all confidential information strictly private
2. Not disclose to any third party without written consent
3. Return all confidential materials upon termination
4. Maintain confidentiality for 5 years post-employment

Violation may result in immediate termination and legal action.

**Signed:** {{full_name}}
**Date:** {{signature_date}}
      `,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });
    
    // Equity Agreement Template
    templates.push({
      id: faker.string.uuid(),
      country: countryCode,
      contract_type: 'equity',
      template_name: `${country.name} Stock Option Agreement`,
      template_content: `
# STOCK OPTION GRANT AGREEMENT

**Grant Date:** {{start_date}}
**Recipient:** {{full_name}}
**Position:** {{role}}

## GRANT DETAILS
- Total Options Granted: {{equity_shares}} shares
- Exercise Price: USD {{exercise_price}} per share
- Vesting Schedule: 4 years with 1-year cliff
- Vesting Commencement: {{start_date}}

## VESTING SCHEDULE
- Year 1: 25% ({{equity_shares_25}}% shares) after 1-year cliff
- Years 2-4: 6.25% quarterly ({{equity_shares_monthly}} shares/quarter)

## EXERCISE PERIOD
- While Employed: Vested options may be exercised anytime
- Post-Termination: 90 days to exercise vested options
- Expiration: 10 years from grant date

## TAX IMPLICATIONS
${countryCode === 'US' ? 'These are Incentive Stock Options (ISOs) under IRC Section 422' : ''}
${countryCode === 'UK' ? 'May qualify for EMI tax advantages' : ''}
${countryCode === 'SG' ? 'Subject to employee stock option scheme tax rules' : ''}

Employee should consult with a tax advisor.

**Accepted by:** {{full_name}}
**Date:** {{signature_date}}
      `,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    });
  });
  
  return templates;
}

function generatePolicies() {
  const policies = [
    {
      id: faker.string.uuid(),
      title: 'Annual Leave Policy',
      category: 'leave',
      country: null, // Global policy with country-specific sections
      content: `
# Annual Leave Policy

## Overview
HRFlow AI provides generous annual leave to ensure work-life balance.

## Leave Entitlement by Country
- **Singapore:** 14 days per year
- **United Kingdom:** 28 days per year (including bank holidays)
- **United States:** 15 days per year
- **India:** 18 days per year
- **UAE:** 30 days per year

## Accrual
Leave accrues monthly from start date. During probation, leave accrues but cannot be taken without manager approval.

## Requesting Leave
1. Submit request at least 2 weeks in advance
2. Manager approval required
3. Maximum 10 consecutive days without VP approval
4. Blackout periods: End of quarter (last week)

## Carryover
Up to 5 days may be carried to next year. Remaining balance forfeits.

## Leave During Notice Period
Leave cannot be taken during notice period unless approved.
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Expense Policy',
      category: 'expense',
      country: null,
      content: `
# Expense Reimbursement Policy

## Eligible Expenses
### Travel
- Economy flights for domestic travel
- Business class for international flights >6 hours
- Taxis/Uber when public transport unavailable
- Hotel: Up to USD 200/night in major cities

### Meals
- Client meetings: Up to USD 75 per person
- Team dinners: Up to USD 50 per person (manager approval)
- Per diem while traveling: USD 60/day

### Equipment
- Laptop/desktop: Up to USD 2,500 every 3 years
- Monitor: Up to USD 400
- Keyboard/mouse: Up to USD 150
- Headphones: Up to USD 200

### Coworking Spaces
- Approved for remote employees
- Up to USD 300/month
- Must be regular workspace, not cafes

### Professional Development
- Conferences: Up to USD 2,000/year (manager approval)
- Online courses: Up to USD 500/year
- Books: Up to USD 200/year

## Submission Process
1. Submit within 30 days via expense system
2. Attach itemized receipts
3. Manager approval required for >USD 500
4. Reimbursement within 10 business days

## Non-Reimbursable
- Alcohol (unless client entertainment)
- Personal items
- Fines and penalties
- First-class flights (without exec approval)
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Remote Work Policy',
      category: 'remote_work',
      country: null,
      content: `
# Remote Work Policy

## Hybrid Work Model
All employees may work remotely up to 2 days per week.

## Fully Remote Positions
Some roles are designated fully remote:
- Must be in approved countries (SG, UK, US, IN, UAE)
- Required office visits: Quarterly all-hands
- Home office stipend: USD 500 annually

## Requirements
1. **Connectivity:** Minimum 50 Mbps internet
2. **Workspace:** Dedicated work area
3. **Availability:** Core hours 10 AM - 4 PM local time
4. **Security:** Company VPN required for all work
5. **Equipment:** Company laptop required, no personal devices

## Communication Expectations
- Respond to Slack within 2 hours during work hours
- Camera on for team meetings
- Update calendar with working hours

## International Remote Work
Working from other countries requires:
- HR approval 2 weeks advance
- Maximum 30 days per year
- Tax and legal compliance verification
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Promotion Guidelines',
      category: 'career',
      country: null,
      content: `
# Promotion Guidelines

## Eligibility
- Minimum 12 months in current role
- Consistently "Meets Expectations" or higher performance ratings
- Demonstrated competencies for next level

## Promotion Criteria by Role

### Junior → Mid-Level Engineer
- Completes tasks independently
- Reviews peers' code effectively
- Mentors 1-2 junior team members
- Drives small features end-to-end

### Mid-Level → Senior Engineer
- Designs systems independently
- Leads projects with 3+ engineers
- Sets technical direction for team
- Mentors mid-level engineers
- On-call rotation leadership

### Senior → Staff Engineer
- Designs multi-team systems
- Recognized technical leader
- Drives architectural decisions
- Mentors senior engineers
- Published technical content

## Process
1. Manager identifies candidate during calibration
2. Peer feedback collection (360 review)
3. Leadership panel review
4. HR compensation analysis
5. Offer letter with new title and salary

## Timing
Promotions announced during:
- Mid-year review cycle (July)
- End-year review cycle (January)

## Compensation Increases
- Junior → Mid: 15-20%
- Mid → Senior: 20-25%
- Senior → Staff: 25-30%
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Benefits Handbook - Singapore',
      category: 'benefits',
      country: 'SG',
      content: `
# Employee Benefits - Singapore

## Medical Insurance
- **Coverage:** Employee + spouse + children
- **Provider:** AIA HealthShield
- **Annual Limit:** SGD 100,000
- **Outpatient:** SGD 1,500/year
- **Dental:** SGD 800/year
- **Vision:** SGD 300 every 2 years

## Central Provident Fund (CPF)
- Employer contribution: 17%
- Employee contribution: 20%
- Total: 37% of gross salary

## Annual Leave
- Standard: 14 days
- Increases by 1 day every 2 years (max 21 days)

## Parental Leave
- Maternity: 16 weeks paid (government + company top-up)
- Paternity: 2 weeks paid
- Adoption: 12 weeks paid

## Other Benefits
- Annual health screening: Fully paid
- Gym membership: SGD 100/month subsidy
- Mobile phone: SGD 80/month allowance
- Professional development: SGD 2,000/year
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Benefits Handbook - United Kingdom',
      category: 'benefits',
      country: 'UK',
      content: `
# Employee Benefits - United Kingdom

## Medical Insurance
- **Provider:** BUPA
- **Coverage:** Employee + dependents
- **Annual Limit:** £50,000
- **Dental:** £500/year
- **Vision:** £200 every 2 years

## Pension
- Employer contribution: 5%
- Employee contribution: 5%
- Auto-enrollment after 3 months

## Annual Leave
- Standard: 28 days (including bank holidays)
- Increases by 1 day every 3 years (max 33 days)

## Parental Leave
- Maternity: 26 weeks paid
- Paternity: 2 weeks paid
- Shared parental: Up to 52 weeks

## Other Benefits
- Season ticket loan: Interest-free
- Cycle to work scheme: Up to £2,000
- Electric vehicle scheme: Available
- Private medical: Optional upgrade
      `,
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      title: 'Code of Conduct',
      category: 'compliance',
      country: null,
      content: `
# Code of Conduct

## Core Values
1. **Integrity:** Honest in all dealings
2. **Respect:** Treat everyone with dignity
3. **Excellence:** Deliver high-quality work
4. **Collaboration:** Work together effectively
5. **Innovation:** Embrace new ideas

## Expected Behaviors
- Professional communication
- Punctuality for meetings
- Respect for diversity
- Confidentiality of information
- Compliance with laws and regulations

## Prohibited Behaviors
- Harassment or discrimination
- Conflicts of interest
- Misuse of company resources
- Disclosure of confidential information
- Accepting bribes or kickbacks

## Reporting Violations
Report concerns to:
1. Direct manager
2. HR department (hr@hrflow.ai)
3. Anonymous hotline: 1-800-ETHICS

All reports investigated confidentially.
      `,
      created_at: new Date().toISOString()
    }
  ];
  
  return policies;
}

function generateComplianceItems(employees) {
  const complianceItems = [];
  const today = new Date();
  
  employees.forEach(employee => {
    // Work permit compliance
    if (employee.work_permit_expiry) {
      const expiryDate = new Date(employee.work_permit_expiry);
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let status = 'active';
      if (daysUntilExpiry < 30) status = 'urgent';
      else if (daysUntilExpiry < 60) status = 'expiring_soon';
      
      complianceItems.push({
        id: faker.string.uuid(),
        employee_id: employee.id,
        item_type: 'work_permit',
        item_name: `${COUNTRY_DATA[employee.country].name} Work Permit`,
        description: 'Employment pass renewal required',
        expiry_date: employee.work_permit_expiry,
        status,
        notified_at: status !== 'active' ? new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString() : null,
        created_at: employee.created_at
      });
    }
    
    // Training certifications
    const requiredTrainings = ['Information Security', 'GDPR Compliance', 'Code of Conduct', 'Safety Training'];
    
    requiredTrainings.forEach((training, index) => {
      const monthsSinceHire = Math.floor((today - new Date(employee.start_date)) / (1000 * 60 * 60 * 24 * 30));
      
      // Training expires every 12 months
      const lastCompletedDate = new Date(employee.start_date);
      lastCompletedDate.setMonth(lastCompletedDate.getMonth() + (Math.floor(monthsSinceHire / 12) * 12));
      
      const expiryDate = new Date(lastCompletedDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      let status = 'active';
      if (employee.compliance_scenario === 'training_overdue' && index === 0) {
        status = 'overdue';
        expiryDate.setDate(expiryDate.getDate() - faker.number.int({ min: 5, max: 30 })); // Overdue by 5-30 days
      } else if (daysUntilExpiry < 30) {
        status = 'expiring_soon';
      }
      
      complianceItems.push({
        id: faker.string.uuid(),
        employee_id: employee.id,
        item_type: 'training_certification',
        item_name: training,
        description: `Annual ${training} certification`,
        expiry_date: expiryDate.toISOString().split('T')[0],
        status,
        notified_at: status !== 'active' ? new Date(today.getTime() - (3 * 24 * 60 * 60 * 1000)).toISOString() : null,
        created_at: employee.created_at
      });
    });
    
    // Equipment tracking
    if (employee.employment_type === 'full_time') {
      const equipment = [
        { name: 'MacBook Pro 16"', value: 2500 },
        { name: 'External Monitor', value: 400 },
        { name: 'Mechanical Keyboard', value: 150 },
        { name: 'Wireless Mouse', value: 80 }
      ];
      
      equipment.forEach((item, index) => {
        let status = 'active';
        let returnDue = null;
        
        // If employee's compliance scenario is unreturned equipment
        if (employee.compliance_scenario === 'equipment_unreturned' && index === 0) {
          status = 'overdue_return';
          returnDue = new Date(today.getTime() - (faker.number.int({ min: 10, max: 45 }) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
        }
        
        complianceItems.push({
          id: faker.string.uuid(),
          employee_id: employee.id,
          item_type: 'equipment_loan',
          item_name: item.name,
          description: `Company equipment - Value: USD ${item.value}`,
          expiry_date: returnDue,
          status,
          notified_at: status === 'overdue_return' ? new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString() : null,
          created_at: employee.created_at
        });
      });
    }
  });
  
  return complianceItems;
}

function generateSampleConversations() {
  return [
    {
      id: faker.string.uuid(),
      question: "How many days of annual leave do I have?",
      answer_template: "Based on your employment in {{country}}, you have {{leave_balance}} days of annual leave remaining out of your total {{annual_leave}} days entitlement for the year.",
      category: "leave",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "Can I expense coworking space?",
      answer_template: "Yes! Remote employees can expense up to USD 300 per month for coworking spaces. Make sure it's a dedicated workspace (not a cafe) and submit receipts via the expense system.",
      category: "expense",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "When am I eligible for promotion?",
      answer_template: "You're eligible for promotion after minimum 12 months in your current role with 'Meets Expectations' or higher ratings. Promotions are announced during mid-year (July) and end-year (January) review cycles.",
      category: "career",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "What's my notice period?",
      answer_template: "Based on your role as {{role}} in {{country}}, your notice period is {{notice_period}} month(s).",
      category: "employment",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "How do I submit expenses?",
      answer_template: "Submit expenses within 30 days via our expense system with itemized receipts. Manager approval needed for amounts over USD 500. Reimbursement processed within 10 business days.",
      category: "expense",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "Can I work remotely from another country?",
      answer_template: "Yes, with HR approval 2 weeks in advance. Maximum 30 days per year. We need to verify tax and legal compliance first.",
      category: "remote_work",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "What medical benefits do I have?",
      answer_template: "You have comprehensive medical insurance covering you and dependents. Check the Benefits Handbook for {{country}} for specific coverage limits and providers.",
      category: "benefits",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "How much can I expense for a laptop?",
      answer_template: "You can expense up to USD 2,500 for a laptop/desktop every 3 years. This covers most MacBook Pro or high-end Windows configurations.",
      category: "expense",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "Do I get paid parental leave?",
      answer_template: "Yes! Parental leave varies by country. For example: Singapore offers 16 weeks maternity + 2 weeks paternity, UK offers 26 weeks maternity + 2 weeks paternity. Check your country-specific benefits.",
      category: "benefits",
      created_at: new Date().toISOString()
    },
    {
      id: faker.string.uuid(),
      question: "What happens to my stock options if I leave?",
      answer_template: "You have 90 days post-termination to exercise vested options. Unvested options are forfeited. Options expire 10 years from grant date.",
      category: "equity",
      created_at: new Date().toISOString()
    }
  ];
}

function generateAutomationLogs(employees, count = 200) {
  const logs = [];
  const today = new Date();
  
  const eventTypes = [
    { type: 'new_hire_onboarding', weight: 0.15 },
    { type: 'work_permit_expiry_alert', weight: 0.10 },
    { type: 'training_reminder_sent', weight: 0.25 },
    { type: 'leave_reminder_sent', weight: 0.20 },
    { type: 'policy_question_answered', weight: 0.20 },
    { type: 'contract_generated', weight: 0.10 }
  ];
  
  for (let i = 0; i < count; i++) {
    const employee = faker.helpers.arrayElement(employees);
    const eventType = selectByDistribution(Object.fromEntries(eventTypes.map(e => [e.type, e.weight])));
    
    const logDate = randomDate(new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000)), today);
    
    let actionsTaken = [];
    
    switch (eventType) {
      case 'new_hire_onboarding':
        actionsTaken = [
          { action: 'employment_contract_generated', timestamp: logDate.toISOString(), duration_ms: 2300 },
          { action: 'nda_generated', timestamp: new Date(logDate.getTime() + 3000).toISOString(), duration_ms: 1800 },
          { action: 'equity_agreement_generated', timestamp: new Date(logDate.getTime() + 6000).toISOString(), duration_ms: 2100 },
          { action: 'employee_record_created', timestamp: new Date(logDate.getTime() + 9000).toISOString(), duration_ms: 500 },
          { action: 'welcome_email_sent', timestamp: new Date(logDate.getTime() + 10000).toISOString(), duration_ms: 300 },
          { action: 'calendar_events_created', timestamp: new Date(logDate.getTime() + 11000).toISOString(), duration_ms: 800 },
          { action: 'compliance_tracking_initialized', timestamp: new Date(logDate.getTime() + 12000).toISOString(), duration_ms: 600 }
        ];
        break;
        
      case 'work_permit_expiry_alert':
        actionsTaken = [
          { action: 'expiry_detected', timestamp: logDate.toISOString(), days_until_expiry: 45 },
          { action: 'renewal_checklist_generated', timestamp: new Date(logDate.getTime() + 1000).toISOString() },
          { action: 'employee_notified', timestamp: new Date(logDate.getTime() + 2000).toISOString() },
          { action: 'hr_notified', timestamp: new Date(logDate.getTime() + 2500).toISOString() },
          { action: 'task_created_in_hris', timestamp: new Date(logDate.getTime() + 3000).toISOString() }
        ];
        break;
        
      case 'training_reminder_sent':
        actionsTaken = [
          { action: 'training_expiry_checked', timestamp: logDate.toISOString() },
          { action: 'reminder_email_sent', timestamp: new Date(logDate.getTime() + 500).toISOString() },
          { action: 'slack_message_sent', timestamp: new Date(logDate.getTime() + 800).toISOString() },
          { action: 'calendar_reminder_created', timestamp: new Date(logDate.getTime() + 1200).toISOString() }
        ];
        break;
        
      case 'leave_reminder_sent':
        actionsTaken = [
          { action: 'leave_balance_analyzed', timestamp: logDate.toISOString(), days_unused: employee.leave_balance_days },
          { action: 'proactive_reminder_sent', timestamp: new Date(logDate.getTime() + 500).toISOString(), message: 'You have unused leave days' }
        ];
        break;
        
      case 'policy_question_answered':
        actionsTaken = [
          { action: 'question_received', timestamp: logDate.toISOString() },
          { action: 'rag_search_performed', timestamp: new Date(logDate.getTime() + 200).toISOString(), policies_matched: 2 },
          { action: 'ai_response_generated', timestamp: new Date(logDate.getTime() + 1500).toISOString(), duration_ms: 1300 },
          { action: 'response_sent_to_employee', timestamp: new Date(logDate.getTime() + 1800).toISOString() }
        ];
        break;
        
      case 'contract_generated':
        actionsTaken = [
          { action: 'template_selected', timestamp: logDate.toISOString(), template: 'employment_SG' },
          { action: 'ai_customization', timestamp: new Date(logDate.getTime() + 500).toISOString(), duration_ms: 2100 },
          { action: 'docx_created', timestamp: new Date(logDate.getTime() + 3000).toISOString() },
          { action: 'sent_for_review', timestamp: new Date(logDate.getTime() + 3500).toISOString() }
        ];
        break;
    }
    
    logs.push({
      id: faker.string.uuid(),
      trigger_event: eventType,
      employee_id: employee.id,
      actions_taken: actionsTaken,
      total_duration_ms: actionsTaken.reduce((sum, a) => sum + (a.duration_ms || 0), 0),
      created_at: logDate.toISOString()
    });
  }
  
  return logs;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('🚀 HRFlow AI - Data Generation Starting...\n');

console.log('📊 Generating employees...');
const employees = generateEmployees(CONFIG.TOTAL_EMPLOYEES);
console.log(`✅ Generated ${employees.length} employees`);
console.log(`   📧 Unique emails: ${usedEmails.size} (${emailCounter - 1} had duplicates resolved)`);

console.log('\n📄 Generating contract templates...');
const templates = generateContractTemplates();
console.log(`✅ Generated ${templates.length} contract templates`);

console.log('\n📋 Generating company policies...');
const policies = generatePolicies();
console.log(`✅ Generated ${policies.length} policies`);

console.log('\n⚠️  Generating compliance items...');
const complianceItems = generateComplianceItems(employees);
console.log(`✅ Generated ${complianceItems.length} compliance tracking items`);

console.log('\n💬 Generating sample conversations...');
const sampleConversations = generateSampleConversations();
console.log(`✅ Generated ${sampleConversations.length} sample Q&A pairs`);

console.log('\n🤖 Generating automation logs...');
const automationLogs = generateAutomationLogs(employees, 200);
console.log(`✅ Generated ${automationLogs.length} automation event logs`);

// ============================================================================
// STATISTICS
// ============================================================================

console.log('\n📈 DATASET STATISTICS:');
console.log('═══════════════════════════════════════════════════════\n');

console.log('Employees by Country:');
Object.keys(CONFIG.COUNTRY_DISTRIBUTION).forEach(country => {
  const count = employees.filter(e => e.country === country).length;
  const percentage = ((count / employees.length) * 100).toFixed(1);
  console.log(`  ${country}: ${count} (${percentage}%)`);
});

console.log('\nEmployees by Role:');
const roleCounts = {};
employees.forEach(e => {
  roleCounts[e.role] = (roleCounts[e.role] || 0) + 1;
});
Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).forEach(([role, count]) => {
  const percentage = ((count / employees.length) * 100).toFixed(1);
  console.log(`  ${role}: ${count} (${percentage}%)`);
});

console.log('\nCompliance Scenarios:');
const scenarioCounts = {};
employees.forEach(e => {
  scenarioCounts[e.compliance_scenario] = (scenarioCounts[e.compliance_scenario] || 0) + 1;
});
Object.entries(scenarioCounts).forEach(([scenario, count]) => {
  const percentage = ((count / employees.length) * 100).toFixed(1);
  console.log(`  ${scenario}: ${count} (${percentage}%)`);
});

const urgentCompliance = complianceItems.filter(c => c.status === 'urgent' || c.status === 'overdue').length;
const expiringSoon = complianceItems.filter(c => c.status === 'expiring_soon').length;
console.log(`\nCompliance Alerts:`);
console.log(`  Urgent/Overdue: ${urgentCompliance}`);
console.log(`  Expiring Soon (30-60 days): ${expiringSoon}`);

// ============================================================================
// SAVE TO FILES
// ============================================================================

console.log('\n💾 Saving data to JSON files...\n');

const outputDir = './hr-data-export';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(`${outputDir}/employees.json`, JSON.stringify(employees, null, 2));
console.log(`✅ Saved: employees.json (${employees.length} records)`);

fs.writeFileSync(`${outputDir}/contract_templates.json`, JSON.stringify(templates, null, 2));
console.log(`✅ Saved: contract_templates.json (${templates.length} records)`);

fs.writeFileSync(`${outputDir}/policies.json`, JSON.stringify(policies, null, 2));
console.log(`✅ Saved: policies.json (${policies.length} records)`);

fs.writeFileSync(`${outputDir}/compliance_items.json`, JSON.stringify(complianceItems, null, 2));
console.log(`✅ Saved: compliance_items.json (${complianceItems.length} records)`);

fs.writeFileSync(`${outputDir}/sample_conversations.json`, JSON.stringify(sampleConversations, null, 2));
console.log(`✅ Saved: sample_conversations.json (${sampleConversations.length} records)`);

fs.writeFileSync(`${outputDir}/automation_logs.json`, JSON.stringify(automationLogs, null, 2));
console.log(`✅ Saved: automation_logs.json (${automationLogs.length} records)`);

// Create a summary file
const summary = {
  generated_at: new Date().toISOString(),
  total_records: {
    employees: employees.length,
    contract_templates: templates.length,
    policies: policies.length,
    compliance_items: complianceItems.length,
    sample_conversations: sampleConversations.length,
    automation_logs: automationLogs.length
  },
  employee_distribution: {
    by_country: Object.keys(CONFIG.COUNTRY_DISTRIBUTION).reduce((acc, country) => {
      acc[country] = employees.filter(e => e.country === country).length;
      return acc;
    }, {}),
    by_role: roleCounts,
    by_compliance_scenario: scenarioCounts
  },
  compliance_alerts: {
    urgent_overdue: urgentCompliance,
    expiring_soon: expiringSoon,
    total_tracked_items: complianceItems.length
  }
};

fs.writeFileSync(`${outputDir}/dataset_summary.json`, JSON.stringify(summary, null, 2));
console.log(`✅ Saved: dataset_summary.json`);

console.log('\n✨ DATA GENERATION COMPLETE! ✨');
console.log('═══════════════════════════════════════════════════════\n');
console.log(`📁 All files saved to: ${outputDir}/`);
console.log('\n🎯 Next Steps:');
console.log('1. Review the generated data files');
console.log('2. Import into Supabase using the SQL import script');
console.log('3. Verify data integrity');
console.log('4. Start building your application!\n');
