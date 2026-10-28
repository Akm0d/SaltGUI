# SaltGUI Modernization Roadmap

This roadmap outlines the tasks required to modernize the SaltGUI codebase, update dependencies, and improve the development workflow.

## Phase 1: Infrastructure & Environment
- [ ] **Formalize Development Environment**
    - [ ] Ensure `node_modules` is consistently managed via `npm` or `yarn`.
    - [ ] Standardize the local development workflow (e.g., a single `npm run dev` command).
- [ ] **Improve Containerization**
    - [ ] Optimize Dockerfiles for faster builds and smaller image sizes.
    - [ ] Ensure development Docker environments match production parity.

## Phase 2: Runtime Dependency Modernization (High Risk)
*Note: These tasks require manual replacement of files in `saltgui/static/` and exhaustive functional testing.*

- [ ] **Replace Hilitor (Text Highlighting)**
    - [ ] Evaluate modern alternatives (e.g., Prism.js, Highlight.js).
    - [ ] Replace `saltgui/static/hilitor/` files.
    - [ ] Verify text highlighting in Command Box and Job outputs.
- [ ] **Update JSONPath**
    - [ ] Evaluate modern versions or more lightweight alternatives.
    - [ ] Replace `saltgui/static/jsonpath/` files.
    - [ ] Verify all Grains, Pillar, and Job filtering logic.
- [ ] **Modernize SortTable**
    - [ ] Decide between updating the existing reduced version or moving to a modern data-grid library (e.g., TanStack Table).
    - [ ] Replace `saltgui/static/sorttable/` files.
    - [ ] Verify all table sorting functionality across Minions, Jobs, and Keys pages.

## Phase 3: Development Tooling & Code Quality (Low Risk)
- [ ] **Refresh Dev Dependencies**
    - [ ] Run `npm outdated` and incrementally update `devDependencies`.
    - [ ] Fix linting/styling regressions introduced by new rules.
- [ ] **Upgrade Testing Suite**
    - [ ] Update `mocha`, `chai`, and `puppeteer` to latest stable versions.
    - [ ] Ensure functional tests (Puppeteer) pass under new versions.
- [ ] **Enhance CI/CD**
    - [ ] Update GitHub Actions workflows to reflect new dependency versions.

## Phase 4: Codebase Refactoring
- [ ] **ES Module Standardization**
    - [ ] Move toward full ESM (ECMAScript Modules) if not already fully implemented.
- [ ] **TypeScript Migration (Optional/Long-term)**
    - [ ] Evaluate the benefits of moving to TypeScript for better type safety in a complex SPA.

---
**Status Legend:**
- [ ] Todo
- [/] In Progress
- [x] Completed
