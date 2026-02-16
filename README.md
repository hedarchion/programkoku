# 📄 MM Maker

> Minit Mesyuarat & OPR Generator

A single-page, client-side document generator for Malaysian school panitia teams. Create meeting minutes (Minit Mesyuarat) and One Page Reports (OPR) directly in the browser - no server required.

[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js%2016-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-orange?logo=bun)](https://bun.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

- **📋 Two-Tab Workflow**: Seamlessly switch between Minit Mesyuarat and OPR creation
- **🏫 Profile Management**: Save multiple school/organization profiles with member lists
- **🖼️ Logo & Signature Upload**: Add school logos and digital signatures to documents
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **💾 Local Storage**: All data stored locally - no server or database needed
- **📄 Multiple Export Formats**: Generate DOCX, PDF, and PNG outputs
- **🎨 Customizable Templates**: Frequent phrases and customizable section titles

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/hedarchion/programkoku.git
cd programkoku

# Install dependencies
bun install

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`

## 📖 Usage

### Creating Minit Mesyuarat

1. Click on the **Minit** tab
2. Fill in meeting details (bilangan, tarikh, masa, tempat)
3. Check attendance from your member list
4. Add agenda items and discussion points
5. Set signatories (Setiausaha, Ketua Panitia, Guru Besar)
6. Click **DOCX** or **PDF** to download

### Creating OPR

1. Switch to the **OPR** tab
2. Enter program details (nama, tarikh, tempat)
3. List activities conducted
4. Upload supporting images (max 8)
5. Add officer names and PGB signature
6. Export as **PDF** or **IMG**

### Managing Settings

- Click the ⚙️ gear icon in the top right
- Add/remove organization members
- Upload default logos and signatures
- Customize frequent phrases
- Switch between multiple profiles

## 🏗️ Architecture

### Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Runtime**: [Bun](https://bun.sh/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: shadcn/ui primitives
- **Document Generation**:
  - `docx` for Word documents
  - `jspdf` for PDF generation
  - `html-to-image` for PNG exports
- **State Management**: React Context + localStorage

### Project Structure

```
programkoku/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main application page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles & CSS variables
│   ├── components/
│   │   ├── minit-mesyuarat-form.tsx    # Meeting minutes form
│   │   ├── opr-form.tsx                # OPR form
│   │   ├── settings-panel.tsx          # Settings drawer
│   │   └── ui/                         # shadcn/ui components
│   ├── lib/
│   │   ├── settings-context.tsx        # Profile & settings management
│   │   ├── document-generator.ts       # DOCX/PDF/PNG generation
│   │   └── opr-html-template.ts        # OPR HTML templates
│   └── hooks/                 # Custom React hooks
├── public/
│   └── logos/                 # Default school logos
├── next.config.ts            # Next.js configuration
└── package.json
```

## 📱 Mobile Support

The app is fully responsive with mobile-optimized layouts:

- Sticky bottom action bar for easy document generation
- Collapsible sections for compact viewing
- Touch-friendly form controls
- Grid layouts adapt from single column (mobile) to multiple columns (desktop)

### Mobile Limitations

- **OPR Image Generation**: Due to browser memory constraints, PNG image generation is disabled on mobile devices. Use PDF export instead.
- **Safari iOS**: Follow the on-screen instructions to save PDFs using the Share menu.

## 🛠️ Development

### Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production (static export)
bun run lint         # Run ESLint
bun start            # Serve production build locally
```

### Building for Production

```bash
bun run build
```

This generates a static site in the `out/` directory, suitable for deployment to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting provider

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure as needed:

```bash
cp .env.local.example .env.local
```

## 🌐 Deployment

### GitHub Pages

1. Build the project:
   ```bash
   bun run build
   ```

2. Deploy the `out/` folder to GitHub Pages

The app automatically detects GitHub Pages and adjusts asset paths accordingly.

### Static Hosting

Simply upload the contents of the `out/` directory to your static hosting provider.

## 📝 Data Storage

All data is stored locally in your browser:

- **Profiles**: Organization settings, member lists, logos
- **Storage Key**: `document-generator-profiles`
- **Location**: Browser's localStorage

⚠️ **Clearing browser data will reset all profiles and settings.**

## 🎨 Customization

### CSS Variables

Global theme tokens in `src/app/globals.css`:

```css
:root {
  --background: #f4f6f2;
  --foreground: #1e293b;
  --primary: #0284c7;
  --grid-border: #e2e8f0;
  /* ... */
}
```

### Tailwind Config

Breakpoints and utilities in `tailwind.config.ts` for responsive design.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Malaysian school panitia teams
- Inspired by the need for simple, offline-capable document generation
- UI components powered by [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">
  <sub>Built with ❤️ for the Malaysian education community</sub>
</div>
