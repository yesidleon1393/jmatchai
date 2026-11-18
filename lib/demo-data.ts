export interface DemoCase {
  id: string
  jobDescription: string
  resume: string
}

export const DEMO_CASES: readonly DemoCase[] = [
  {
    id: 'frontend-strong',
    jobDescription: `Senior Frontend Engineer - Remote (EU)

We are looking for a Senior Frontend Engineer to join our product team and help build the next generation of our recruitment platform.

Responsibilities:
- Design and build accessible, performant interfaces with React, TypeScript and Next.js.
- Own and evolve our design system used across several product squads.
- Collaborate closely with designers and product managers.
- Mentor junior engineers and contribute to code reviews.

Requirements:
- 5+ years of professional experience in frontend development.
- Strong knowledge of React, TypeScript and modern CSS (Tailwind is a plus).
- Experience with testing (Jest, Testing Library, Playwright).
- Good understanding of web accessibility (WCAG) and Core Web Vitals.
- Fluent English; German is a plus.`,
    resume: `Marta Álvarez - Frontend Engineer
Madrid, Spain · marta.alvarez@example.com

Summary
Frontend engineer with 7 years of experience building B2B SaaS products with React and TypeScript. Passionate about accessibility, design systems and developer experience.

Experience
Lead Frontend Engineer - Talentia Labs (2021 - Present)
- Led the migration of a legacy SPA to Next.js, improving Largest Contentful Paint by 42%.
- Built and maintained a component library used by 4 product teams, written in TypeScript with Tailwind CSS.
- Raised the Lighthouse accessibility score from 78 to 98 and introduced automated axe checks in CI.
- Mentored 3 junior developers and ran weekly code review sessions.

Frontend Developer - Nubex (2017 - 2021)
- Developed dashboards in React and Redux for logistics clients.
- Wrote unit and end-to-end tests with Jest and Cypress.

Skills
React, TypeScript, Next.js, Tailwind CSS, Playwright, Jest, Storybook, WCAG, Git
Languages: Spanish (native), English (C1), German (A2)`,
  },
  {
    id: 'backend-partial',
    jobDescription: `Backend Engineer (Node.js) - Barcelona / Hybrid

Join our platform team to build the APIs that power our hiring workflows used by thousands of recruiters.

What you will do:
- Design, implement and maintain REST and GraphQL APIs in Node.js and TypeScript.
- Model data in PostgreSQL and optimise slow queries.
- Deploy and monitor services on AWS using Docker and Terraform.
- Improve reliability through observability, alerting and incident response.

What we are looking for:
- 4+ years of backend experience with Node.js.
- Solid knowledge of PostgreSQL and database design.
- Experience with AWS, containers and CI/CD pipelines.
- Familiarity with event-driven architectures (SQS, Kafka) is a plus.`,
    resume: `Daniel Okafor - Software Developer
Lisbon, Portugal · daniel.okafor@example.com

Profile
Full-stack developer with 3 years of experience, mostly focused on frontend work, with growing interest in backend development.

Experience
Full-stack Developer - BrightPath Studio (2022 - Present)
- Built internal tools with React and Express for a small team of 6 engineers.
- Created REST endpoints and basic CRUD services connected to a MySQL database.
- Deployed applications to a managed hosting platform using GitHub Actions.

Junior Web Developer - Pixelforge (2021 - 2022)
- Maintained WordPress sites and developed custom PHP plugins.

Skills
JavaScript, TypeScript, React, Express, MySQL, Git, basic Docker
Languages: English (C1), Portuguese (native)`,
  },
  {
    id: 'marketing-low',
    jobDescription: `Machine Learning Engineer - Berlin

We are building ranking and matching models for our talent marketplace and need an ML Engineer to take them from research to production.

Responsibilities:
- Train, evaluate and deploy ranking and recommendation models.
- Build data pipelines and feature stores with Python, Spark and Airflow.
- Run A/B tests and measure the impact of model changes.
- Work with MLOps tooling to monitor model drift and performance.

Requirements:
- MSc or PhD in Computer Science, Statistics or a related field.
- 3+ years of experience shipping ML models to production.
- Strong Python skills with PyTorch or TensorFlow.
- Experience with cloud platforms (AWS or GCP).`,
    resume: `Sofia Rossi - Digital Marketing Manager
Milan, Italy · sofia.rossi@example.com

Summary
Marketing professional with 8 years of experience in brand strategy, content marketing and paid acquisition for consumer brands.

Experience
Digital Marketing Manager - Lumina Home (2019 - Present)
- Managed an annual advertising budget of EUR 1.2M across Google Ads and Meta.
- Grew organic traffic by 85% through a new SEO and content strategy.
- Led a team of 4 marketers and 2 freelance designers.
- Analysed campaign performance with Google Analytics and Looker Studio.

Marketing Specialist - Casa Verde (2016 - 2019)
- Planned email campaigns and managed social media channels.

Education
BA in Communication Sciences - Università di Milano

Skills
SEO, SEM, Google Analytics, HubSpot, content strategy, team leadership
Languages: Italian (native), English (B2)`,
  },
  {
    id: 'product-good',
    jobDescription: `Product Manager - HR Technology (Paris, Hybrid)

We are hiring a Product Manager to define and deliver features for our applicant tracking and candidate evaluation products.

Responsibilities:
- Discover customer problems through interviews and data analysis.
- Define the roadmap, write clear specifications and prioritise with engineering and design.
- Launch and iterate on features, measuring success with product metrics.
- Partner with sales and customer success to gather feedback.

Requirements:
- 4+ years of product management experience in a B2B SaaS environment.
- Experience with agile delivery and tools such as Jira and Productboard.
- Strong analytical skills (SQL or product analytics tools).
- Excellent communication in English and French.`,
    resume: `Julien Moreau - Senior Product Manager
Lyon, France · julien.moreau@example.com

Summary
Product manager with 6 years of experience in B2B SaaS, specialising in workflow automation and data-driven product discovery.

Experience
Senior Product Manager - Flowdesk (2020 - Present)
- Owned the roadmap for a scheduling and notifications module used by 1,200 business customers.
- Conducted more than 60 customer interviews and shipped 3 features that increased activation by 18%.
- Defined KPIs and built dashboards with Amplitude and SQL.
- Worked daily with a team of 8 engineers and 2 designers in two-week sprints.

Product Manager - Kleo (2017 - 2020)
- Launched a self-service onboarding flow that reduced time-to-value from 14 to 5 days.

Skills
Product discovery, roadmapping, Jira, Productboard, Amplitude, SQL (intermediate)
Languages: French (native), English (C1)`,
  },
]

export function pickRandomDemoCase(excludeId?: string): DemoCase {
  const pool = DEMO_CASES.filter((demoCase) => demoCase.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}
