# 🎨 HRFlow AI Frontend - Setup Guide

**Beautiful, demo-ready Next.js frontend for your hackathon presentation!**

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Navigate to http://localhost:3000
```

---

## 📦 What You Got

### **3 Pages:**

1. **Dashboard** (`/`) - Overview with stats and navigation
2. **Invisible Onboarding** (`/onboarding`) - Interactive onboarding form
3. **HR Chatbot** (`/chat`) - Real-time AI chat interface

### **Design:**
- ✅ Dark theme with gradient backgrounds
- ✅ Glassmorphism effects
- ✅ Smooth animations and transitions
- ✅ Responsive (works on mobile, tablet, desktop)
- ✅ Professional HR tech aesthetic

---

## 🎯 Features by Page

### **1. Dashboard (`/`)**

**What it shows:**
- Hero section with feature CTAs
- 4 key metrics (employees, contracts, chats, time saved)
- Compliance alerts (urgent items)
- Recent activity feed
- Bottom CTA section

**Interactions:**
- Staggered fade-in animations
- Hover effects on cards
- Links to onboarding and chat pages

**Demo talking points:**
> "This is the command center. 1,200 employees, 847 contracts generated, 2,340 chat conversations. All automated."

---

### **2. Invisible Onboarding (`/onboarding`)**

**What it does:**
- Form to input new employee details
- Real-time progress tracking (7 steps)
- Contract download after completion
- Success metrics display

**Workflow:**
1. Fill in employee details (name, email, role, country, salary, etc.)
2. Click "Start Invisible Onboarding"
3. Watch 7-step automation progress
4. See success screen with metrics
5. Download generated contracts

**Demo talking points:**
> "Watch this. I enter Sarah's details, click start, and watch the magic. 
> 
> [Wait 25 seconds while showing progress]
> 
> Done. Employment contract, NDA, equity docs - all generated. 25 seconds vs 4 hours manual work. That's 99.8% time savings."

---

### **3. HR Chatbot (`/chat`)**

**What it does:**
- Interactive chat with AI assistant
- Real-time responses with policy citations
- Shows which policies were used
- Response time and model info
- Feedback buttons (thumbs up/down)

**Workflow:**
1. Enter employee ID (use: `4c732329-2cb5-481d-9ddd-f08b3de2328e`)
2. Ask questions (or use quick question buttons)
3. See AI response with policy references
4. View metadata (response time, policies used)
5. Provide feedback

**Demo talking points:**
> "Now the chatbot. I ask 'How much annual leave do I have?'
> 
> [Wait 2 seconds]
> 
> Look at this answer. It found the Leave Policy (63% match), knows I'm in the UK (28 days), calculated my accrued leave based on start date, and even mentioned carry-over rules.
> 
> That's not a chatbot. That's an intelligent assistant."

---

## 🎬 Demo Flow (5 Minutes)

### **Minute 1: Introduction**
- Open Dashboard
- Show the stats
- Explain the problem (manual HR work)

### **Minute 2: Invisible Onboarding**
- Navigate to `/onboarding`
- Fill form (have data ready)
- Click start and show progress
- Download contracts

### **Minute 3-4: HR Chatbot**
- Navigate to `/chat`
- Enter employee ID
- Ask 2-3 questions:
  - "How much annual leave do I have?"
  - "What are my benefits?"
  - "How do I request a promotion?"
- Show policy citations

### **Minute 5: Impact**
- Back to dashboard
- Emphasize metrics
- Show ROI (time saved, cost saved)

---

## 🔧 Configuration

### **Environment Variables**

Make sure these are set in `.env`:

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-key

# OpenAI
OPENAI_API_KEY=sk-your-key
```

### **Port Configuration**

Default: `http://localhost:3000`

To change port:
```bash
npm run dev -- -p 3001
```

---

## 🎨 Customization

### **Colors**

Edit `tailwind.config.js` to change the color scheme:

```javascript
// Current: Purple/Pink gradient theme
// Change to blue/green:
from-blue-500 to-green-500
```

### **Stats on Dashboard**

Edit `app/page.js` to update the numbers:

```javascript
const stats = [
  { label: 'Employees', value: '1,200', ... },
  // Update these values
];
```

### **Quick Questions (Chatbot)**

Edit `app/chat/page.js`:

```javascript
const quickQuestions = [
  "How much annual leave do I have?",
  "What are my benefits?",
  // Add your own questions
];
```

---

## 🐛 Troubleshooting

### **Issue: "Module not found" errors**

```bash
# Solution: Install dependencies
npm install
```

### **Issue: API calls failing**

```bash
# Check:
1. Backend is running (npm run dev in project root)
2. Environment variables are set
3. Supabase and OpenAI credentials are correct
```

### **Issue: Styles not loading**

```bash
# Solution: Restart dev server
npm run dev
```

### **Issue: Page not found**

```bash
# Make sure you're accessing:
http://localhost:3000          # Dashboard
http://localhost:3000/onboarding  # Onboarding
http://localhost:3000/chat     # Chatbot
```

---

## 📱 Responsive Design

The app works on all screen sizes:

- **Desktop:** Full experience with sidebar and multi-column layouts
- **Tablet:** Optimized for iPad Pro, iPad
- **Mobile:** Single column, stacked layout

**Test responsive:**
1. Open browser dev tools
2. Toggle device toolbar
3. Test on different sizes

---

## ⚡ Performance Tips

### **For Demo:**

1. **Pre-load data:**
   - Have employee details ready to copy-paste
   - Keep employee ID handy

2. **Internet connection:**
   - Make sure you have stable WiFi
   - OpenAI API needs good connection

3. **Browser:**
   - Use Chrome or Edge for best performance
   - Close unused tabs

4. **Backup plan:**
   - Record a video demo as backup
   - Have screenshots ready

---

## 🎯 Key Selling Points

### **Visual Impact:**
- Modern, professional design
- Smooth animations
- Real-time progress indicators
- Dark theme with vibrant accents

### **User Experience:**
- Intuitive navigation
- Clear CTAs
- Helpful tooltips
- Progress feedback

### **Technical Excellence:**
- Next.js 14 (latest)
- React Server Components
- Tailwind CSS
- Real API integration

---

## 📊 What to Highlight in Demo

### **Dashboard:**
- ✨ Clean, professional interface
- 📈 Real metrics from database
- 🎯 Clear navigation

### **Onboarding:**
- ⚡ 7-step automation progress
- 📄 Real contract generation
- 💾 Download actual DOCX files
- ⏱️ 25-second completion time

### **Chatbot:**
- 🧠 Semantic search in action
- 📚 Policy citations
- 🎯 Context-aware answers
- ⚡ Sub-2-second responses

---

## ✅ Pre-Demo Checklist

**Before your presentation:**

- [ ] Backend is running (`npm run dev`)
- [ ] Frontend is running (`http://localhost:3000`)
- [ ] Environment variables are set
- [ ] Database has data (run `npm run import` if needed)
- [ ] Embeddings are generated (`npm run embeddings`)
- [ ] Test employee ID works in chatbot
- [ ] Test onboarding form submits successfully
- [ ] Browser is in fullscreen mode
- [ ] Internet connection is stable
- [ ] Demo script is ready

---

## 🚀 You're Ready!

Run these commands:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Check backend is running
# (APIs should be accessible at /api/*)
```

Navigate to `http://localhost:3000` and start your demo!

**Good luck at the hackathon!** 🎉
