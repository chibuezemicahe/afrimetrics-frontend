Product Requirements Document (PRD)

Product Name: Afrimetrics

Prepared By: Micah Erumaka

Date: June 10, 2025

1. Product Summary

Afrimetrics is a web and mobile-first application designed to help Africans track the performance of different African stock markets with a modern, visual, and research-oriented experience. Inspired by platforms like AFX (afx.kwayisi.org) and Stockbubbles.ng, Afrimetrics aims to deliver real-time stock market performance data in a way that is insightful, accessible, and interactive.

2. Problem Statement

African retail investors and finance content creators face the following issues:

Disconnected and outdated stock data from exchanges.

Lack of visual performance tools for identifying market trends.

Difficulty in discovering top-performing stocks on a weekly or monthly basis.

Limited research tools tailored to African stock markets.

Afrimetrics solves these by providing a centralized, user-friendly dashboard with performance analytics, visuals, and simple tools for investors and creators.

3. Goals & Objectives

Consolidate and visualize stock performance data from major African stock exchanges.

Provide research-friendly tools like weekly/monthly performance tracking and sector heatmaps.

Deliver a clean, mobile-first experience that appeals to both retail investors and content creators.

Lay the groundwork for future expansion into APIs, screeners, alerts, and premium insights.

4. Key Features (MVP)

4.1 Stock Market Dashboard

Overview of daily, weekly, and monthly performance.

Tabs or filters for: Top Gainers, Top Losers, Most Active, and Sector View.

Exchanges supported:

Nigeria (NGX), Ghana (GSE), South Africa (JSE), Kenya (NSE)

4.2 Stock Visualizations

Bubble charts for weekly/monthly gainers and losers (inspired by Stockbubbles.ng).

Line/bar charts for individual stock performance.

Heatmap view by sector performance.

4.3 Stock Profiles

Individual stock detail page with:

Historical price chart (daily, weekly, monthly)

Company profile summary

Key metrics (Market Cap, PE ratio, EPS, Dividend Yield)

4.4 Watchlist (Basic)

Allow users to add stocks to a simple watchlist.

Show quick view of performance for each item.

4.5 Responsive Design

Fully optimized for mobile.

Clean and modern dashboard UI with intuitive navigation.

5. Future Features (Post-MVP)

User login and personalization.

Push/email alerts for stock price movement.

API for developers and creators.

Advanced stock screener with filters.

News and events integration.

Educational tooltips and explainer modals.

6. Non-Functional Requirements

Uptime target: 99.5%

Response time: < 1s for dashboard load.

Mobile-first design using modern front-end frameworks.

Secure backend with scalable architecture (Node.js + PostgreSQL recommended).

7. Tech Stack (Recommended)

Frontend: React / Next.js, TailwindCSS, Charting with Recharts or D3.js

Backend: Node.js with Express, PostgreSQL (or Supabase), Web scraping tools (Playwright or Puppeteer)

Deployment: Vercel (frontend), Render/Fly.io/Heroku (backend)

Data Storage: Daily cache of exchange prices (scraped or integrated via APIs)

8. Stakeholders

Product Owner: Micah Erumaka

Developers: TBD

End Users: African retail investors, finance content creators, fintech developers

9. Success Metrics

MVP launch within 6–8 weeks.

1,000+ users within first 3 months.

Daily returning users >= 100 after 1st month.

80% mobile usage satisfaction based on in-app feedback.

10. Appendix

Inspiration: afx.kwayisi.org, stockbubbles.ng

Target devices: Mobile (primary), Desktop (secondary)

Content integration: Tie into YouTube/LinkedIn content

End of PRD

