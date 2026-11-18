const { Client } = require('pg');
require('dotenv').config();

const url = (process.env.DATABASE_URL || '').trim().split('?')[0];
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function seed() {
  await client.connect();

  const specialists = [
    {
      userId: 536, // Peter Wagogo
      publicSlug: 'peter-wagogo-financial-analyst',
      headline: 'Financial Analyst & Business Intelligence Specialist',
      bio: 'Over 6 years of experience building financial models, feasibility studies, and Power BI executive dashboards for Kenyan SMEs, SACCOs, and investment syndicates. Specializes in 5-year projections, credit-risk scoring, and automated management accounting.',
      skills: ['Financial Modeling', 'Power BI', 'Advanced Excel', 'Budgeting & Forecasting', 'SME Business Plans'],
      education: [
        { institution: 'Strathmore University', course: 'BSc Financial Economics', qualification: 'Degree', status: 'Completed', completionYear: '2021' },
        { institution: 'KASNEB', course: 'Certified Public Accountants (CPA-K)', qualification: 'Professional Certification', status: 'Completed', completionYear: '2023' }
      ],
      experience: [
        { title: 'Senior Financial Analyst', organization: 'Nairobi Advisory Partners', period: '2021 - Present', description: 'Developed financial viability models for over 40 SME loan applications and commercial bank debt restructuring.' }
      ],
      portfolio: [
        { title: 'SME 5-Year Cash Flow & Balance Sheet Model', description: 'Fully automated Excel forecasting model with dynamic scenario toggles (Base, Bull, Bear).', role: 'Lead Modeler', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
        { title: 'Executive Power BI Retail KPI Dashboard', description: 'Interactive dashboard tracking daily gross margin, inventory turnover, and regional sales performance.', role: 'BI Developer', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' }
      ],
      profileStatus: 'published',
      seoTitle: 'Peter Wagogo – Financial Analyst & BI Specialist | TaskLynk',
      seoDescription: 'Explore the professional profile of Peter Wagogo, CPA-K certified financial analyst specializing in financial modeling, Power BI dashboards, and SME business planning at TaskLynk.',
      publishedAt: new Date().toISOString()
    },
    {
      userId: 49, // Catherine Wanjiku
      publicSlug: 'catherine-wanjiku-web-developer',
      headline: 'Full-Stack Web Developer & Systems Architect',
      bio: 'Full-stack software engineer specializing in responsive modern web applications, Next.js frontend architectures, Node.js REST/GraphQL APIs, and M-Pesa payment integration. Committed to high performance, clean code, and intuitive user experiences.',
      skills: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'M-Pesa API Integration', 'E-Commerce'],
      education: [
        { institution: 'Jomo Kenyatta University of Agriculture and Technology (JKUAT)', course: 'BSc Computer Technology', qualification: 'Degree', status: 'Completed', completionYear: '2022' }
      ],
      experience: [
        { title: 'Full Stack Web Developer', organization: 'TaskLynk Technical Team', period: '2023 - Present', description: 'Engineered high-converting corporate web portals, client portals, and secure payment workflows.' }
      ],
      portfolio: [
        { title: 'Modern E-Commerce Portal with M-Pesa STK Push', description: 'High-speed headless ecommerce storefront with real-time stock sync and automated M-Pesa checkout.', role: 'Full Stack Architect', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80' },
        { title: 'Corporate Services Website & Booking Engine', description: 'Custom responsive web platform with interactive service discovery, dynamic quote calculators, and mobile optimization.', role: 'Frontend Engineer', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80' }
      ],
      profileStatus: 'published',
      seoTitle: 'Catherine Wanjiku – Full-Stack Web Developer | TaskLynk',
      seoDescription: 'Explore Catherine Wanjiku’s profile, full-stack web developer and systems architect at TaskLynk specializing in Next.js, APIs, and business systems.',
      publishedAt: new Date().toISOString()
    },
    {
      userId: 539, // Shelma Chepchumba
      publicSlug: 'shelma-chepchumba-data-scientist',
      headline: 'Statistical Data Analyst & Quantitative Researcher',
      bio: 'Quantitative researcher specializing in SPSS, STATA, R, and JASP statistical programming. Experienced in hypothesis testing, multivariate regression, factor analysis, structural equation modeling (SEM), and Chapter 4 postgraduate results reporting.',
      skills: ['SPSS', 'STATA', 'R Programming', 'Survey Design', 'Factor Analysis', 'Regression Diagnostics', 'APA 7th Reporting'],
      education: [
        { institution: 'University of Nairobi (UoN)', course: 'MSc Applied Statistics', qualification: 'Masters Degree', status: 'Completed', completionYear: '2023' },
        { institution: 'Kenyatta University (KU)', course: 'BSc Mathematics & Statistics', qualification: 'Degree', status: 'Completed', completionYear: '2020' }
      ],
      experience: [
        { title: 'Lead Quantitative Analyst', organization: 'East Africa Research Consulting', period: '2022 - Present', description: 'Supervised over 80 quantitative survey analyses for university theses, corporate surveys, and donor evaluation reports.' }
      ],
      portfolio: [
        { title: 'Dissertation Chapter 4 Hypothesis Testing & Regression Model', description: 'Complete SPSS analysis with assumption tests (normality, collinearity), regression models, and APA 7th tables.', role: 'Senior Statistician', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80' },
        { title: 'Multivariate Survey Reliability & Factor Analysis', description: 'Exploratory and confirmatory factor analysis with Cronbach alpha reliability evaluation for an NGO health study.', role: 'Data Analyst', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=800&q=80' }
      ],
      profileStatus: 'published',
      seoTitle: 'Shelma Chepchumba – Statistical Data Analyst | TaskLynk',
      seoDescription: 'View the verified profile of Shelma Chepchumba, MSc Applied Statistics expert specializing in SPSS, STATA, and research data analysis at TaskLynk.',
      publishedAt: new Date().toISOString()
    },
    {
      userId: 53, // Lucy Nduta
      publicSlug: 'lucy-nduta-brand-designer',
      headline: 'Brand Identity & Visual Communications Designer',
      bio: 'Creative brand designer with 5+ years of experience helping African startups and established businesses communicate visually. Expert in brand identity kits, corporate stationery, investor pitch deck design, and high-impact marketing collateral.',
      skills: ['Brand Identity', 'Logo Design', 'Pitch Deck Design', 'Brochures & Annual Reports', 'Adobe Illustrator', 'Figma', 'Photoshop'],
      education: [
        { institution: 'Technical University of Kenya (TUK)', course: 'BA Graphic Design & Visual Communication', qualification: 'Degree', status: 'Completed', completionYear: '2021' }
      ],
      experience: [
        { title: 'Brand Identity Lead', organization: 'Creative Studio Nairobi', period: '2021 - Present', description: 'Delivered complete visual identity overhauls and collateral for retail brands, professional services, and tech startups.' }
      ],
      portfolio: [
        { title: 'Fintech Brand Identity & Visual Guidelines', description: 'Full brand manual including logo variations, color harmonies, corporate typography, and digital asset templates.', role: 'Lead Designer', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80' },
        { title: 'Investor Pitch Deck & Corporate Profile', description: '20-slide bespoke investor presentation with custom iconography, infographics, and market sizing visuals.', role: 'Presentation Specialist', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31727560fa?auto=format&fit=crop&w=800&q=80' }
      ],
      profileStatus: 'published',
      seoTitle: 'Lucy Nduta – Brand Identity & Visual Designer | TaskLynk',
      seoDescription: 'Explore the profile of Lucy Nduta, brand identity designer and visual communications specialist at TaskLynk creating logos, pitch decks, and corporate collateral.',
      publishedAt: new Date().toISOString()
    },
    {
      userId: 51, // Esther Muthoni
      publicSlug: 'esther-muthoni-research-consultant',
      headline: 'Business Research & Technical Documentation Consultant',
      bio: 'Senior research consultant specializing in market feasibility studies, corporate reports, technical documentation, and executive presentations. Skilled in synthesizing complex qualitative and quantitative data into actionable business intelligence.',
      skills: ['Market Research', 'Feasibility Studies', 'Technical Writing', 'Corporate Reports', 'Competitive Intelligence', 'Executive Summaries'],
      education: [
        { institution: 'United States International University Africa (USIU-Africa)', course: 'MBA Global Business Strategy', qualification: 'Masters Degree', status: 'Completed', completionYear: '2022' }
      ],
      experience: [
        { title: 'Market Research Consultant', organization: 'Strategic Insights Kenya', period: '2022 - Present', description: 'Authored market feasibility assessments and strategic briefs for regional expansion projects.' }
      ],
      portfolio: [
        { title: 'Kenya Agribusiness Market Feasibility Study', description: 'Comprehensive 45-page market landscape report evaluating cold-chain logistics, pricing dynamics, and distribution channels.', role: 'Principal Researcher', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80' },
        { title: 'Corporate Sustainability & ESG Annual Report', description: 'Structured executive ESG disclosure report aligned with Global Reporting Initiative (GRI) standards.', role: 'Technical Editor', date: '2025', imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80' }
      ],
      profileStatus: 'published',
      seoTitle: 'Esther Muthoni – Business Research & Technical Consultant | TaskLynk',
      seoDescription: 'View the verified profile of Esther Muthoni, MBA business research and technical writing consultant at TaskLynk.',
      publishedAt: new Date().toISOString()
    }
  ];

  for (const s of specialists) {
    // Check if profile exists
    const check = await client.query('SELECT id FROM freelancer_profiles WHERE user_id = $1', [s.userId]);
    if (check.rows.length > 0) {
      await client.query(`
        UPDATE freelancer_profiles SET
          public_slug = $1,
          profile_headline = $2,
          bio = $3,
          skills = $4,
          education = $5,
          experience = $6,
          portfolio_screenshots = $7,
          profile_status = $8,
          seo_title = $9,
          seo_description = $10,
          published_at = $11,
          updated_at = NOW()
        WHERE user_id = $12
      `, [
        s.publicSlug,
        s.headline,
        s.bio,
        JSON.stringify(s.skills),
        JSON.stringify(s.education),
        JSON.stringify(s.experience),
        JSON.stringify(s.portfolio),
        s.profileStatus,
        s.seoTitle,
        s.seoDescription,
        s.publishedAt,
        s.userId
      ]);
      console.log(`Updated profile for userId ${s.userId} (${s.publicSlug})`);
    } else {
      await client.query(`
        INSERT INTO freelancer_profiles (
          user_id, public_slug, profile_headline, bio, skills, education, experience, portfolio_screenshots, profile_status, seo_title, seo_description, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
      `, [
        s.userId,
        s.publicSlug,
        s.headline,
        s.bio,
        JSON.stringify(s.skills),
        JSON.stringify(s.education),
        JSON.stringify(s.experience),
        JSON.stringify(s.portfolio),
        s.profileStatus,
        s.seoTitle,
        s.seoDescription,
        s.publishedAt
      ]);
      console.log(`Inserted profile for userId ${s.userId} (${s.publicSlug})`);
    }
  }

  console.log('Specialists seeding complete!');
  await client.end();
}

seed().catch(console.error);
