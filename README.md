# GroupBy — Campus Team Formation & Relational Matching Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> **GroupBy** is an intelligent campus team formation and peer-recruitment web application built for students at **Thapar Institute of Engineering & Technology (TIET)**. It leverages **SQL Relational Algebra (Relational Division, Complementarity Set Matching, and GROUP BY Category Gap Analysis)** to connect students with open team positions based on verified skill profiles and academic parameters.

---

## Key Features

- **Strict `@thapar.edu` Authentication**: Registration and sign-in are strictly restricted to official `@thapar.edu` email addresses. Non-Thapar emails are rejected at both server and client levels.
- **Two-Way Privacy Protection**: Student contact details (email, phone, handles) remain hidden until a connection request or invite is explicitly **Accepted**.
- **Relational Division Search**: Uses SQL relational set division to match open team slots with candidate skill profiles.
- **Relational Complementarity Team Merge Engine**: Automatically suggests Team-to-Team merges by finding small open teams with mutually complementary skill sets.
- **GROUP BY Skill Gap Analysis**: Calculates missing vs covered skill categories across teams using relational set-difference queries (`WHERE category_id NOT IN (...)`).
- **Multi-Select Filter Bar**:
  - **Alphabetical Branches**: Multi-select across 20 TIET engineering branches sorted A to Z.
  - **Semesters**: Multi-select from **1st to 8th Semester**.
  - **Predefined Skills**: 80+ predefined skills sorted alphabetically with an inline quick-find search box.
- **Verified Skill Credentials**: Students can attach optional certificate/proof links (e.g. Coursera, HackerRank, GitHub proofs) to demonstrate credibility.
- **Developer Links**: Supports adding LinkedIn, GitHub, and LeetCode profile links to student cards and profile pages.
- **Dynamic Profile Completion Widget**: Live weighted completion meter (0%-100%) featuring an animated CSS `conic-gradient` gauge.

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL 8.0+ (`InnoDB` engine with stored procedures, triggers, foreign keys, cascading deletes, and schema auto-migrations)
- **Database Connector**: `mysql2/promise` (Connection pooling & prepared statements)
- **Frontend**: Native Vanilla JavaScript (ES6+ SPA architecture), HTML5, Vanilla CSS3 (Custom design system with organic dark mode accents and glassmorphism)
- **Icons & Fonts**: Tabler Icons (`@tabler/icons-webfont`), Google Fonts (*Manrope* & *Plus Jakarta Sans*)

---

## Project Structure

```
GroupBy/
├── server.js               # Express API backend & SQL query endpoints
├── groupby_schema.sql      # Database schema, stored procedures, triggers & seeds
├── package.json            # Node.js project dependencies
├── README.md               # Complete project documentation
└── public/
    ├── index.html          # Main HTML layout & multi-select modals
    ├── app.js              # SPA frontend logic & API handlers
    └── styles.css          # Design system tokens, layout & responsive CSS
```

---

## Prerequisites & Installation

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MySQL Server** (v8.0 or higher)
- **Git**

### 2. Clone Repository
```bash
git clone https://github.com/shresthvishwa/GroupBy.git
cd GroupBy
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Create a MySQL database named `groupby` and import the schema:

```sql
CREATE DATABASE groupby;
```

Import `groupby_schema.sql`:
```bash
mysql -u root -p groupby < groupby_schema.sql
```

### 5. Environment Variables Configuration
Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=groupby

GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 6. Run the Application
Start the Node.js server:

```bash
npm start
```
Or run with live reload using Nodemon:
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## Database Schema & Relational Models

- **`Student`**: User accounts, roll numbers, branches, semesters, and social links.
- **`SkillCategory`**: Categories powering `GROUP BY` skill gap calculations.
- **`Skill`**: Industry skills taxonomy.
- **`StudentSkill`**: Many-to-many junction storing proficiencies and certificate proof URLs.
- **`Course`**: Academic course/elective scoping (`UCS416`, `UCS301`, etc.).
- **`Team`**: Project group entities created by students.
- **`TeamMembership`**: Confirmed roster of team members.
- **`Slot`**: Open positions within teams.
- **`SlotRequiredSkill`**: Skills required for open team slots.
- **`ConnectionRequest`**: Application & recruitment messaging flow.
- **`PastCollaboration`**: Log of past teammate collaborations.

---

## Color Palette & Metric Tokens

- **Primary Accent**: Terracotta Rust (`#A35E47` / `#b55a3c`)
- **Overview Metric Dashboard Icons**:
  1. **Teams Joined**: `#A35E47` (Terracotta Rust)
  2. **Requests Sent**: `#9C9A9A` (Cool Silver / Grey)
  3. **Collaborations**: `#464646` (Deep Charcoal Grey)
  4. **Pending Requests**: `#000000` (Pure Black)

---

## Deployment Guide

### Deploy to Render / Railway:
1. Push your repository to GitHub.
2. Host MySQL database on **Railway**, **Aiven**, or **Render Managed MySQL**.
3. Create a **Web Service** on Render/Railway with start command `node server.js`.
4. Configure environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `GOOGLE_CLIENT_ID`).

---

## Author

- **Shresth Vishwakarma** (COE-2028, Thapar Institute of Engineering & Technology)
- **LinkedIn**: [linkedin.com/in/shresth-v](https://www.linkedin.com/in/shresth-v)

---

## License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
