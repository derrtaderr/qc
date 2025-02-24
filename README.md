# PDF QC Analyzer

A web-based tool for analyzing PDF documents for quality control, including text extraction accuracy and visual formatting issues.

## Local Development Setup

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-qc-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
touch .env.local
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Project Structure

```
pdf-qc-analyzer/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout component
│   │   ├── page.tsx        # Main page component
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   └── ui/            # UI components
│   └── lib/
│       └── utils.ts       # Utility functions
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run cypress` - Open Cypress for E2E testing

### Tech Stack

- **Framework:** Next.js 14
- **UI:** React, Tailwind CSS, shadcn/ui
- **PDF Processing:** pdf-parse, Tesseract.js
- **State Management:** Zustand
- **Testing:** Jest, React Testing Library, Cypress

### Development Guidelines

1. Follow TypeScript best practices
2. Use ESLint and Prettier for code formatting
3. Write tests for new features
4. Follow the component structure in `src/components`
5. Use Tailwind CSS for styling

### Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT 