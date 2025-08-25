---

### **Jobline Recruitment Platform \- Technical Specification Document**

* **Document Version:** 1.0  
* **Creation Date:** August 24, 2025  
* **Project Name:** Jobline  
* **Status:** Final Specification for Development

---

### **1\. Executive Summary**

This document outlines the technical and functional requirements for **Jobline**, a comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers. Jobline aims to replace manual tracking methods with a centralized, efficient, and secure platform. It will manage the entire recruitment lifecycle—from candidate selection and complex legal paperwork to financial tracking and post-placement management. The system is designed with strict, role-based access to separate operational duties from sensitive financial management, ensuring data integrity and security.

### **2\. Business Goals**

* **Increase Operational Efficiency:** Automate and streamline the tracking of multiple applications, reducing manual errors and administrative overhead.  
* **Enhance Client Transparency:** Provide clients with a clear, real-time view of their application status and requirements through a dedicated, shareable link.  
* **Improve Financial Control:** Implement robust tracking of both revenue and costs, enabling accurate profitability analysis per application and for the business overall.  
* **Ensure Legal Compliance:** Systematize the complex, multi-step government paperwork process to ensure deadlines are met and requirements are fulfilled, especially for renewals.  
* **Centralize Data Management:** Create a single source of truth for all client, candidate, and application data, accessible securely from anywhere.

---

### **3\. User Personas & Roles**

The system will support two internal user roles with distinct permissions, plus a read-only view for clients.

**3.1. Super Admin (e.g., The Agency Owner)**

* **Objective:** To have a high-level overview of the business's health, manage staff, control finances, and ensure profitability.  
* **Permissions:**  
  * Full CRUD (Create, Read, Update, Delete) access to all data in the system.  
  * Can view and manage all Admin user accounts.  
  * **Exclusive access** to the financial section covering costs (agent commissions, broker fees, etc.), profitability reports, and advanced accounting details.  
  * Manages the settings for modifiable fees, costs, and document lists.  
  * Manages the database of third-party **Agents** and **Brokers**.

**3.2. Admin (e.g., The Office Secretary)**

* **Objective:** To manage the day-to-day operations of the agency efficiently, keeping all applications moving forward and ensuring clients are kept up-to-date.  
* **Permissions:**  
  * CRUD access to Clients, Candidates, and Applications.  
  * Can update application statuses, manage document checklists, and send reminders.  
  * Can record Client Payments (revenue) and view a client's outstanding balance.  
  * **Cannot** view or access any cost-related data or profitability reports.

**3.3. Client (e.g., The Employer)**

* **Objective:** To understand their current status in the recruitment process, know what documents are required from them, and see their payment history without needing to call the office.  
* **Access:** Interacts via a secure, unique, and read-only web link provided by an Admin. They do not have a login.

---

### **4\. Functional Requirements by Module**

#### **4.1. Core System & Dashboard**

* **User Authentication:** Secure login for Super Admin and Admin roles.  
* **Role-Based Access Control (RBAC):** The system must strictly enforce the permissions defined in Section 3\.  
* **Smart Dashboard:**  
  * An "At a Glance" view of tasks needing immediate attention (e.g., "5 applications awaiting documents," "3 payments pending").  
  * A pipeline view of all active applications (e.g., Kanban board style: MoL Pre-Auth, Visa App, etc.).  
  * A calendar or list view of upcoming renewal deadlines.  
  * **Super Admin View Only:** A financial summary widget showing Revenue, Costs, and Profit for the current month.

#### **4.2. Candidate Management**

* **Candidate Profile:** Must contain fields for photos, personal details, experience, education, nationality, skills, and age.  
* **Candidate Status:** A mandatory status field with the following options:  
  * Available (Abroad)  
  * Available (In Lebanon) \- *For returned workers*  
  * Reserved  
  * In Process  
  * Placed  
* **Search & Filter:** Ability to search by name and filter by status, nationality, and skills.  
* **Agent Linking (Super Admin):** Ability to associate a candidate with a sourcing Agent from the database.  
* **Data Migration:** Bulk import/export of candidate data from/to a CSV or Excel file.

#### **4.3. Client Management**

* **Client Profile:** Must contain contact details, address, and a notes section.  
* **Hiring History ("Lifeline"):** A view within the client profile that lists all past and present workers hired through the agency.  
* **Referral Tracking:** A field to link a client to the client who referred them.  
* **Data Migration:** Bulk import/export of client data.

#### **4.4. Application Tracker**

* This is the central entity linking a Client, a Candidate, and a Process.  
* **Application Creation:** An Admin can create a new application, which must be linked to one client and one candidate.  
* **Application Type:** Field to designate the application as New Candidate or Guarantor Change.  
* **Status Workflow:** The application must move through the defined stages (see Section 5).  
* **Document Checklists:** Each stage has a dynamic checklist of required documents. An Admin can mark each document as Pending, Received, or Submitted.  
* **Broker Assignment (Super Admin):** On relevant applications, the Super Admin can assign a Broker and input the specific cost for their service.  
* **Client Status Link:** The system must generate a unique, secure URL for each application that leads to the client-facing status page.

#### **4.5. Financial Module**

* **Revenue Ledger (Admin & Super Admin):**  
  * Ability to add payments received from a client and link them to a specific application.  
  * Automatically calculates the outstanding balance for a client.  
* **Cost Ledger (Super Admin Only):**  
  * Ability to add costs and associate them with an application (e.g., ticket price, agent commission, broker fee, government fees).  
* **Invoicing:** Generate simple printable invoices/receipts for clients.  
* **Profitability View (Super Admin Only):** A view per-application showing Total Revenue \- Total Costs \= Profit.  
* **Reporting (Super Admin Only):** Generate monthly/quarterly reports summarizing total revenue, costs, and net profit.

#### **4.6. Third-Party Management (Agents & Brokers)**

* **Agent Database (Super Admin):** A simple CRUD interface to manage sourcing agents' names and contact details.  
* **Broker Database (Super Admin):** A simple CRUD interface to manage arrival brokers' names and contact details.

#### **4.7. Settings Module (Super Admin Only)**

* A section to manage system-wide variables without code changes:  
  * CRUD for the list of required documents for each stage of the application process.  
  * Set and modify default fees (e.g., office commission, expedited visa fee).  
  * Manage notification settings (e.g., "Remind me X days before a permit expires").

---

### **5\. Core System Workflows**

#### **5.1. Workflow 1: New Candidate Onboarding**

1. **Selection:** Admin creates a new Application of type New Candidate, linking a Client and an Available (Abroad) Candidate. Candidate status becomes In Process.  
2. **MoL Pre-Authorization:** System displays the document checklist. Admin tracks collection and submission. Status moves from Pending MoL to MoL Auth Received.  
3. **Visa Application:** System displays the next checklist. Admin logs the processing choice (Standard, Attorney, Expedited). Super Admin adds any associated fees/costs. Status becomes Visa Received upon completion.  
4. **Worker Arrival:** Super Admin assigns a Broker and logs costs. Admin adds final travel costs to the client's invoice. Upon arrival, Admin changes status to Worker Arrived. A 3-month timer for final paperwork begins.  
5. **Post-Arrival Paperwork:** System displays checklists for Labour Permit and Residency Permit. Admin tracks completion.  
6. **Active Employment:** Status changes to Active Employment. The Residency Permit expiry date is logged.  
7. **Renewal:** The system automatically flags the application for renewal 60 days before the permit expiry date, creating a task on the dashboard.

#### **5.2. Workflow 2: Candidate Return & Reassignment**

1. **Return:** Admin finds the active application, ends the contract, and changes the Candidate status to Available (In Lebanon).  
2. **Reassignment:** A new Client selects this candidate. Admin creates a new Application with type Guarantor Change.  
3. **Process Path:**  
   * **If permits exist:** The system loads the Change of Guarantor process checklist. It also creates a future-dated reminder that the new client needs a Certificate of Deposit upon renewal.  
   * **If no permits exist:** The system loads the standard Post-Arrival Paperwork checklists, but now includes the Certificate of Deposit as an immediate requirement.  
4. The application proceeds, and legal responsibility is transferred.

---

### **6\. Data Models (Database Schema Outline)**

* **User:** id, name, email, password\_hash, role (enum: super\_admin, admin)  
* **Candidate:** id, firstName, lastName, photoUrl, dob, nationality, education, skills (JSON/array), experience\_summary, status (enum), agent\_id (FK)  
* **Client:** id, name, phone, address, notes, referred\_by\_client\_id (FK)  
* **Application:** id, client\_id (FK), candidate\_id (FK), status (enum), type (enum), creation\_date, permit\_expiry\_date, broker\_id (FK)  
* **Payment:** id, application\_id (FK), amount, currency, payment\_date, notes  
* **Cost:** id, application\_id (FK), amount, currency, cost\_date, cost\_type (enum: agent\_fee, broker\_fee, gov\_fee, ticket, etc.), description  
* **DocumentChecklistItem:** id, application\_id (FK), document\_name, status (enum: pending, received, submitted)  
* **Agent:** id, name, contact\_details  
* **Broker:** id, name, contact\_details

---

### **7\. Non-Functional Requirements**

* **Usability:** The interface must be clean, intuitive, and mobile-friendly (responsive design).  
* **Security:**  
  * All data transmission must be over HTTPS.  
  * Passwords must be securely hashed.  
  * Implement strict server-side validation to enforce RBAC.  
  * Protect against common web vulnerabilities (SQL Injection, XSS).  
* **Performance:** The application should load quickly, and database queries (especially filtering candidates/clients) must be optimized.  
* **Scalability:** The application should be built with architecture that can handle growth in the number of users, clients, and applications over time.  
* **Maintainability:** The code should be well-documented, structured, and follow modern development best practices to facilitate future updates.

---

### **8\. Recommended Technology Stack (To be confirmed with dev team)**

* **Frontend:** React.js or Vue.js (Modern JavaScript framework for responsive UI)  
* **Backend:** Node.js (Express.js)  
* **Database:** PostgreSQL (for relational integrity)  
* **Deployment:** vercel for frontend and render for backend.

---

### **9\. Enhancements**

* **Full Client Portal with Login:** Clients will only have the shareable link in V1.  
* **Direct File Uploads:** V1 will use checklists. A future version could allow for uploading and storing scans of documents.  
* **Direct Payment Gateway Integration:** Payments will be logged manually by the Admin in V1.  
* **Advanced Analytics & Visual Dashboards:** V1 will have basic reporting; graphical dashboards are a future goal.  
* **Direct Email/SMS Notifications:** Initial notifications will be within the app dashboard. Automated client notifications are a future feature.

