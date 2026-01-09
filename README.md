<div align="center">
  <img src="./public/logo.svg" alt="Shadcn Sheets Logo" width="200" height="200">
  
  # Shadcn Sheets
  
  **A modern, high-performance spreadsheet application built with Next.js and shadcn/ui**
  
  [![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)
  
  [![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFDD00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/soufianeelc)
  
  [Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)
  
</div>

---

## Features

### Core Functionality

- **Import & Export** - Support for CSV and XLSX file formats
- **Formula Engine** - Built-in spreadsheet formulas (SUM, AVERAGE, COUNT, MIN, MAX, IF, CONCAT)
- **Local Storage** - All data stored in IndexedDB for offline access
- **High Performance** - Virtualized rendering for millions of cells
- **Excel-like Experience** - Familiar keyboard shortcuts and cell navigation

### Advanced Features

- **Undo/Redo** - Complete operation history with patch-based system
- **Modern UI** - Built with shadcn/ui and Tailwind CSS
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Multiple Sheets** - Tab-based interface for working with multiple spreadsheets
- **Web Workers** - Background processing for file imports and data operations
- **Column Resizing** - Drag to resize columns
- **Row/Column Management** - Insert and delete rows/columns with ease
- **Cell Formatting** - Support for different data types (numbers, text, booleans, formulas)

### Developer Experience

- **TypeScript** - Fully typed codebase
- **Component Library** - Built with Radix UI primitives
- **State Management** - Zustand for predictable state updates
- **Clean Architecture** - Modular and maintainable code structure
- **React 19** - Latest React features including the React Compiler

---

## Demo

![Shadcn Sheets Screenshot](/public/preview.jpeg)

---

## Installation

### Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/shadcn-sheets.git
cd shadcn-sheets

# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

---

## Usage

### Importing Files

1. Click the **Import** button or drag and drop a CSV/XLSX file
2. The file will be processed in a background worker
3. Navigate through your data using the spreadsheet interface

### Working with Formulas

Formulas start with `=` and support various functions:

```
=SUM(A1:A10)           # Sum a range
=AVERAGE(B1:B5)        # Calculate average
=IF(C1>100, "High", "Low")  # Conditional logic
=CONCAT(D1, " ", D2)   # Concatenate text
```

### Keyboard Shortcuts

| Shortcut               | Action                |
| ---------------------- | --------------------- |
| `Arrow Keys`           | Navigate cells        |
| `Enter`                | Edit cell / Move down |
| `Tab`                  | Move to next cell     |
| `Ctrl/Cmd + Z`         | Undo                  |
| `Ctrl/Cmd + Shift + Z` | Redo                  |
| `Ctrl/Cmd + C`         | Copy (coming soon)    |
| `Ctrl/Cmd + V`         | Paste (coming soon)   |

### Exporting Data

Click the **Export** button to download your spreadsheet as a CSV file.

---

## Architecture

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **Virtualization**: [TanStack Virtual](https://tanstack.com/virtual)
- **File Parsing**: [PapaParse](https://www.papaparse.com/) (CSV) + [SheetJS](https://sheetjs.com/) (XLSX)
- **Code Quality**: [Biome](https://biomejs.dev/)

### Project Structure

```
shadcn-sheets/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── _ui/               # shadcn/ui components
│   │   └── sheet/             # Spreadsheet-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── db/                # IndexedDB schema and operations
│   │   ├── formulas/          # Formula parser and evaluator
│   │   ├── store/             # Zustand store
│   │   └── utils/             # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── workers/                # Web Workers for background tasks
├── public/                     # Static assets
└── package.json
```

### Key Design Decisions

#### Chunk-Based Storage

Data is stored in 1000-row chunks in IndexedDB, enabling efficient loading and updates of large datasets without memory overflow.

#### Patch-Based History

All operations are stored as patches (operation + inverse), enabling unlimited undo/redo without duplicating data.

#### Web Workers

File imports and data compaction run in background workers to keep the UI responsive during heavy operations.

#### Virtual Scrolling

Only visible cells are rendered using TanStack Virtual, allowing smooth scrolling through millions of rows.

---

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
pnpm typecheck    # Type-check without emitting
```

### Code Quality

This project uses:

- **Biome** for linting and formatting
- **TypeScript** for type safety
- **React Compiler** for automatic optimizations

### Adding New Formula Functions

1. Define the function in `src/lib/formulas/evaluator.ts`
2. Add parsing logic in `src/lib/formulas/parser.ts`
3. Update type definitions if needed

Example:

```typescript
function evaluateMYFUNC(
	args: FormulaToken[][],
	getCellValue: CellGetter
): number {
	// Implementation
	return result;
}
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/yourusername/shadcn-sheets/issues) with:

- Clear description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

---

## Roadmap

- [ ] Copy/Paste functionality
- [ ] Cell styling (colors, fonts, alignment)
- [ ] Sorting and filtering
- [ ] Charts and visualizations
- [ ] Collaborative editing (real-time sync)
- [ ] More formula functions (VLOOKUP, PIVOT, etc.)
- [ ] Import/Export to Google Sheets format
- [ ] Cell comments
- [ ] Freeze rows/columns
- [ ] Mobile-optimized touch controls

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [shadcn](https://twitter.com/shadcn) for the amazing UI component library
- [Vercel](https://vercel.com/) for Next.js
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- The open-source community for inspiration and tools

---

## Support

If you find this project useful, please consider:

- Giving it a star on GitHub
- [Buying me a coffee](https://buymeacoffee.com/soufianeelc)

---

## Contact

Questions or feedback? Feel free to:

- Open an issue
- Start a discussion
- Reach out on social media

---

<div align="left">
  
  **If you find this project useful, please consider giving it a star**
  
  Made with love by the open-source community
  
</div>
