# IT-Vault

IT-Vault is a secure, bilingual (RU/EN) IT infrastructure management dashboard. It allows you to track projects, servers, services, and secure credentials, as well as generate read-only, shareable snapshots of your infrastructure.

## Features
- **Project Tracking:** Track active, inactive, and archived projects.
- **Server & Service Mapping:** Map IPs, ports, and domains to specific project architectures.
- **Secure Cryptographic Storage:** Uses server-side AES-256-GCM to securely encrypt passwords and secrets before they are stored in the database.
- **Secure Snapshot Sharing:** Generate ephemeral, read-only public snapshots of resources (sensitive data is automatically redacted).
- **Bilingual Interface:** Out-of-the-box support for English and Russian.
- **Firebase Backend:** Powered by scalable Firestore databases and unified Google Auth.

---

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/) 18+ and `npm`
- A [Firebase](https://firebase.google.com/) Project (with Firestore and Google Authentication enabled)

### 1. Install Dependencies
Clone the repository and install the required packages:
```bash
git clone https://github.com/your-username/It-Vault.git
cd It-Vault
npm install
```

### 2. Environment Variables
Create a `.env` file in the root of your project by copying the provided example:
```bash
cp .env.example .env
```

**Required Variables:**
- `AES_SECRET_KEY`: A 64-character (32-byte) hex string used for AES-256-GCM encryption mapping in the API Routes (`/api/crypto`). **CRITICAL: Do not lose this key, or your encrypted credentials will be permanently mathematically unrecoverable.** 
- `NEXT_PUBLIC_APP_URL`: The core URL of your project (e.g., `http://localhost:3000`).

### 3. Firebase Configuration
Ensure your `firebase-applet-config.json` is located in the root of the project with your valid Firebase project configurations.

If you are setting this up manually outside of the AI Studio environment, you may map standard Firebase environmental keys in `.env` and adjust `/lib/providers.tsx` to initialize using those standard Next.js secrets rather than a static JSON file.

*Reminder: Deploy your Firestore Security Rules (`firestore.rules`) to the Firebase console to secure your NoSQL database routes!*

### 4. Running the Development Server
Launch the Next.js development server on port 3000:
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment Procedures

Because IT-Vault relies on secured Next.js API Routes (`/api/crypto/encrypt` & `/api/crypto/decrypt`) to safely encrypt and decrypt credential secrets **server-side**, the application requires a Node.js runtime environment to function at 100% capacity. Read the deployment options below closely.

### Option 1: Deployment to a Cloud Provider (Recommended)

To fully support Next.js Server-Side Rendering (SSR) and internal API routes for AES cryptography, we recommend using a provider like Vercel or Google Cloud Run.

**Deploying to Vercel (Easiest):**
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
3. Import your `It-Vault` repository.
4. Expand the **Environment Variables** section. Add your `AES_SECRET_KEY` here so the production server can manage encryption.
5. Click **Deploy**. Vercel automatically runs `npm run build` and deploys your secure serverless architecture effortlessly.

**Deploying to Google Cloud Run:**
1. You can provision a `Dockerfile` for your Next.js application, or rely on Google Cloud Buildpacks.
2. Connect your Git repository via Google Cloud Console or use the AI Studio immediate "export" buttons.
3. Configure **Cloud Run** with port `3000`.
4. Navigate to the **Revisions > Security** section and securely provide your `AES_SECRET_KEY` as an environment variable.
5. Deploy the runtime container.

---

### Option 2: Deployment to GitHub Pages

> **⚠️ CRITICAL LIMITATION:** GitHub Pages **only** hosts static assets (HTML/CSS/JS). It strictly does not support Node.js backend processes or Next.js server-side API routes. If you deploy this repository as-is to GitHub Pages, the server-side AES encryption (`/api/crypto/*`) endpoints will return 404 errors, and your **Credentials interface will break**.

If you knowingly accept this physical constraint and still wish to deploy a static, limited version of IT-Vault (capable only of managing Projects, Servers, and Services without accessing server-side cryptography) to GitHub Pages:

1. **Update `next.config.ts`**:
   Configure Next.js to perform a static HTML export and disable image optimization (which GH Pages lacks):
   ```typescript
   const nextConfig = {
     output: 'export',
     images: { unoptimized: true }
   };
   export default nextConfig;
   ```

2. **Run a Static Build**:
   When you run the build command, Next.js generates static files into an `out/` directory.
   ```bash
   npm run build
   ```

3. **Deploy using GitHub Actions**:
   Create a workflow configuration file at `.github/workflows/deploy.yml` on your main branch:
   ```yaml
   name: Deploy Next.js to GitHub Pages

   on:
     push:
       branches: ["main"]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: '18'
         - name: Install Dependencies
           run: npm ci
         - name: Build Static App
           run: npm run build
         - name: Upload Artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: ./out

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

4. **Activate GitHub Pages**:
   - Navigate to your Repository's **Settings > Pages**.
   - Under **Build and deployment > Source**, select **GitHub Actions**.
   - GitHub Actions will interpret the `.yml` block, compile the app stringently, and launch your non-server GUI immediately.

*(To retain full cryptographic functionality and secure credentials storage, stick to **Option 1: Deployment to a Cloud Provider**).*
