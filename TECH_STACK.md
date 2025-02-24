# Tech Stack Document: PDF Quality Control (QC) Analyzer Web App

## 1. Overview
The PDF QC Analyzer is a single-page web application designed to analyze marketing collateral PDFs (text and images) for text accuracy and visual formatting issues, such as typos, font consistency, and line alignment. Hosted publicly on our website via Vercel, it leverages a modern, scalable stack with Next.js, React, and specialized libraries to deliver 99% accuracy in text extraction and formatting detection for any organization.

## 2. Front-End
- **Framework:**
  - **Next.js:**  
    - Enables server-side rendering, built-in routing, and API routes for a seamless single-page experience; ideal for Vercel deployment.
  - **React:**  
    - Powers dynamic UI components (e.g., upload zone, report tabs) and client-side state management.
- **UI Component Library:**
  - **shadcn/ui:**  
    - Provides modern, customizable components (e.g., buttons, tabs) that pair with Tailwind CSS for a polished, accessible interface.
  - **Tailwind CSS:**  
    - Facilitates rapid, responsive styling (e.g., report layout, mobile-friendly design).
- **State Management:**
  - **Zustand:**  
    - Lightweight library for managing upload status, report data, and user settings (e.g., toggle text/visual QC).
- **Rendering:**
  - **pdfjs-dist:**  
    - Renders PDF pages as images for **OpenCV** analysis, ensuring accurate visual input (e.g., font detection).

## 3. Back-End & Processing
Back-end logic runs via Next.js API routes on Vercel, with client-side processing for lightweight tasks and optional serverless scaling for heavy workloads.

- **API Routes (Next.js):**
  - Handle file uploads, orchestrate text/visual analysis, and return QC reports (e.g., JSON with "Text Issues" and "Formatting Issues").
- **Document Processing:**
  - **Text Extraction:**
    - **pdf-parse:** Extracts embedded text from PDFs (e.g., "available" accurately).
    - **Tesseract.js:** Performs OCR on image-based sections (e.g., graph labels), ensuring 99% text accuracy for marketing collateral.
  - **Text Analysis:**
    - **LanguageTool (JavaScript SDK):** Validates spelling (e.g., "dat" → "data"), grammar, and style (e.g., "IC50" consistency) client-side for speed.
  - **Visual Analysis:**
    - **OpenCV (via opencv4nodejs or Python microservice):** Analyzes rendered PDF images for font consistency (typeface/size), line alignment (bullets/rules), spacing, and anomalies (e.g., "COMPAR" repetition).
    - **Note:** If client-side **OpenCV** proves heavy, offload to a Python-based Vercel Serverless Function.
- **Image Handling:**
  - **pdfjs-dist:** Converts PDF pages to images for **Tesseract.js** (text) and **OpenCV** (layout).

## 4. Data Storage & Management
- **Temporary Storage:**
  - **Vercel Blob:** Stores uploaded PDFs temporarily during processing (10MB limit, auto-deleted post-analysis).
- **Caching:**
  - **Vercel Edge Functions:** Cache frequent analysis results (e.g., common PDFs) to reduce processing time for repeat users.
- **Database (Optional):**
  - **Supabase (PostgreSQL):** Add later for user feedback/logs if demand grows; not required for initial launch.

## 5. DevOps & Deployment
- **Hosting:**
  - **Vercel:**  
    - Optimized for Next.js, supports API routes, serverless functions, and edge caching; scales seamlessly for 5 to 100+ users.
- **CI/CD:**
  - **GitHub Actions:**  
    - Automates testing, building, and deployment to Vercel on code commits.
- **Monitoring:**
  - **Vercel Analytics:** Tracks usage (e.g., PDFs processed, errors) to monitor scalability and performance.

## 6. Performance & Optimization
- **Processing Target:** Under 5 seconds for a 2-page PDF with text and images.
- **Optimizations:**
  - Client-side **Tesseract.js** and **LanguageTool** for lightweight tasks.
  - Serverless **OpenCV** for heavy visual analysis if needed.
  - Lazy-load UI components (e.g., report tabs) with React.
- **Scalability:** Vercel's serverless architecture handles 1,000+ PDFs/month initially, scaling with user growth.

## 7. Security
- **File Handling:**
  - Validate uploads (PDF only, <10MB) and sanitize inputs to prevent injection attacks.
- **Data Protection:**
  - HTTPS via Vercel; no persistent storage of user PDFs post-analysis.
- **Rate Limiting:**
  - Vercel API limits to prevent abuse (e.g., 100 requests/hour per IP initially).

## 8. Cost Considerations
- **Core Stack:** Open-source (Next.js, React, **pdf-parse**, **Tesseract.js**, **LanguageTool**, **OpenCV**, shadcn/ui, Tailwind CSS) = $0.
- **Vercel Hosting:**
  - Free tier: 1GB storage, 100GB bandwidth (covers ~1,000 PDFs/month).
  - Pro tier ($20/month): Scales to 10,000+ PDFs/month if usage spikes.
- **Optional Costs:** Supabase (~$10/month) if database added later.

## 9. Development Tools
- **IDE:** VS Code with ESLint, Prettier for consistency.
- **Testing:**
  - **Jest + React Testing Library:** Unit tests for UI and API logic.
  - **Cypress:** End-to-end tests (e.g., upload → report flow).
- **Version Control:** Git/GitHub.

## 10. Assumptions & Dependencies
- **PDF Complexity:** Assumes marketing PDFs with text and images (e.g., graphs), not handwritten content.
- **User Base:** Starts at 5 users (50 PDFs/month), scales to 100+ (1,000+ PDFs/month) in Year 1.
- **Accuracy:** 99% text and formatting detection requires optimized **Tesseract.js** and **OpenCV** configs.
- **Dependencies:** Stable Vercel support for Next.js 14+ and **OpenCV** integration.

## 11. How This Supports the PRD
- **Text QC:** **pdf-parse** + **Tesseract.js** ensures 99% accuracy (e.g., "available," not "wailable") for text and image-based content; **LanguageTool** handles "IC50" style and "dat" typos.
- **Visual QC:** **OpenCV** delivers 99% formatting accuracy, checking font consistency (e.g., same typeface across "INTEGRATE" and body), line alignment (e.g., bullets), and anomalies (e.g., "COMPAR").
- **Public Hosting:** Vercel scales from 5 to 100+ users, aligning with website deployment.
- **Performance:** Lightweight client-side processing with serverless fallback meets 5-second goal. 