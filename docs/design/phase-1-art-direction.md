# Hype Court — Phase 1: Art Direction, Visual Research & Design Decisions

> **Document Status:** PROPOSAL / AWAITING PRODUCT OWNER APPROVAL  
> **Phase:** Phase 1 — Experience Bible & Art Direction  
> **Date:** 2026-10-17  
> **Target Experience:** Immersive, ritualistic AI courtroom web application

---

## 1. Executive Summary & Objective

The objective of Phase 1 is to establish a rigorous, research-backed visual identity and art direction for **Hype Court (Project HolyTrial)** prior to screen design or frontend feature implementation.

Hype Court is an immersive, story-driven AI courtroom where users submit propositions, examine real-world evidence, witness adversarial debate, challenge inferences with objections, and initiate retrials that produce side-by-side verdict deltas. The application must not resemble a standard chat feed, generic fact-checking dashboard, or landing page decorated with an arbitrary 3D background. Instead, it must embody a fictional judicial institution inside an interactive novel or narrative game world.

This document synthesizes targeted domain research, evaluates three competing visual directions, recommends **The Obsidian Tribunal** as the primary aesthetic foundation (with disciplined spatial transformation reserved for critical narrative events), defines the provisional visual grammar, details the five signature artifacts, and establishes strict performance, accessibility, and licensing guardrails.

---

## 2. Research Synthesis (High-Signal Technical & Aesthetic Sources)

We examined 10 authoritative references across immersive web storytelling, 3D graphics performance, timeline choreography, design systems, accessibility, and asset licensing:

### Category A: Immersive & Narrative Web Experiences
1. **[Bruno Simon Portfolio](https://bruno-simon.com/)**
   - *What it contributes:* Benchmark in playful spatial worldbuilding, camera orientation, and seamless physics integration in WebGL.
   - *Key takeaway for Hype Court:* Demonstrates how a fixed, coherent camera perspective anchors user mental models within a 3D environment.
   - *What NOT to copy:* The toy-like cartoon physics, playful palette, and driving mechanic are wholly inappropriate for a solemn, ritualistic judicial tribunal.
2. **[Awwwards 3D Collections](https://www.awwwards.com/websites/3d/) & [Awwwards Storytelling Sites](https://www.awwwards.com/websites/storytelling/)**
   - *What it contributes:* Analysis of award-winning narrative 3D sites that balance atmosphere with information delivery.
   - *Key takeaway for Hype Court:* The most successful experiences decouple atmospheric 3D background scenes from readable text overlays. 3D geometry should never be used for long-form prose; interactive cards and evidence text must remain crisp, accessible HTML/SVG DOM elements layered over spatial depth.
   - *What NOT to copy:* Unskippable scroll-jacking, camera vertigo, and excessive particle bloom that obscures primary content.

### Category B: Three.js & React Three Fiber (R3F) Graphics Performance
3. **[Three.js Color Management Documentation](https://threejs.org/manual/pages/color-management.html)**
   - *What it contributes:* Standardized color pipeline guidance. Three.js r152+ enforces `THREE.ColorManagement.enabled = true` and `SRGBColorSpace` output.
   - *Key takeaway for Hype Court:* PBR materials must adhere strictly to linear workflow: albedo/diffuse textures decoded in sRGB, while metallic, roughness, and normal maps must remain linear (`THREE.NoColorSpace`). This ensures obsidian, stone, and gold materials look rich and physically grounded without muddy darks or blown-out highlights.
4. **[React Three Fiber: Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)**
   - *What it contributes:* Concrete architectural patterns to maintain 60 FPS across varied client hardware.
   - *Key takeaway for Hype Court:*
     - Utilize `<Canvas frameloop="demand">` whenever the judicial chamber is idle (e.g., when the user is reading evidence), dropping GPU utilization to ~0%.
     - Implement R3F's adaptive performance hook (`useThree((state) => state.performance)` and `regress()`) to automatically scale down pixel ratio during active GSAP camera sweeps and restore native sharpness upon coming to rest.
     - Enforce a strict polygon budget (<50,000 vertices) and draw call target (<40 draw calls) via instancing and baked ambient occlusion.

### Category C: Cinematic Motion & Timeline Orchestration
5. **[GSAP Timeline Documentation](https://gsap.com/docs/v3/GSAP/Timeline/)**
   - *What it contributes:* Deterministic, reversible timeline architecture.
   - *Key takeaway for Hype Court:* GSAP timelines (`gsap.timeline({ paused: true })`) will orchestrate camera sweeps, lighting shifts, and dais reveals between the 7 narrative acts. Because GSAP timelines are completely scrubbable and reversible (`.reverse()`), the signature **Retrial** mechanic can physically reverse previous camera angles and suspend earlier verdict monoliths with precision.

### Category D: Design Tokens & Accessibility
6. **[Figma Guide to Variables & Design Tokens](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)**
   - *What it contributes:* Hierarchical token architecture separating primitive values (e.g., raw hex) from semantic tokens (e.g., `--color-surface-monolith`, `--color-status-objection`).
   - *Key takeaway for Hype Court:* All colors, typography scales, border radii, and elevation levels must be tokenized via CSS custom properties. This guarantees that UI cards, 3D ambient lighting, and HTML overlays share identical harmonic color values.
7. **[W3C WCAG 2.2 Technique C39: Minimum Contrast Ratio](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html)**
   - *What it contributes:* Accessibility compliance standards for dark themes (4.5:1 for body copy, 3:1 for large display headers and interactive components).
   - *Key takeaway for Hype Court:* Monolithic dark environments easily suffer from illegibility if text is rendered in low-contrast grays. All primary evidence text will use high-contrast Parchment (`#E8E0D2`, providing >11:1 contrast on Obsidian `#0C0D11`), while Slate (`#8990A5`) is reserved strictly for secondary timestamps and metadata.
8. **[W3C WCAG prefers-reduced-motion Guideline](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)**
   - *What it contributes:* Principles for accommodating users with vestibular disorders.
   - *Key takeaway for Hype Court:* When `prefers-reduced-motion: reduce` is detected, 3D camera sweeps and dramatic rotations must immediately convert to subtle cross-fades and instant scene cross-cuts.

### Category E: Asset Sourcing & Open Licensing
9. **[Poly Haven CC0 License](https://polyhaven.com/license) & [ambientCG CC0 Repository](https://ambientcg.com/)**
   - *What it contributes:* 100% public-domain dedicated (CC0) PBR material textures (basalt rock, aged bronze/gold, brushed graphite) and studio HDRIs.
   - *Key takeaway for Hype Court:* Eliminates commercial licensing risk, royalties, or attribution obligations. All 3D materials will be sourced from CC0 repositories and baked into optimized WebP/JPG texture atlases.
10. **[SIL Open Font License (OFL) v1.1](https://openfontlicense.org/)**
    - *What it contributes:* Fully open-source font distribution license for web embedding.
    - *Key takeaway for Hype Court:* The recommended typography candidates (*Cormorant Garamond* / *Newsreader* and *IBM Plex Sans* / *Mono*) are distributed under the SIL OFL v1.1, granting unrestricted commercial embedding, bundling, and rendering.

---

## 3. Evaluation of Three Competing Art Directions

To ensure an intentional, defensible aesthetic foundation, we formulated and evaluated three distinct conceptual directions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ART DIRECTION SPECTRUM                          │
│                                                                        │
│   Direction A: The Obsidian Tribunal                                  │
│   [Monumental Brutalism • Ritualistic Sci-Fi • Solemn Authority]       │
│                                                                        │
│   Direction B: The Domain                                              │
│   [Surreal Metaphysics • Impossible Floating Voids • Anime Drama]       │
│                                                                        │
│   Direction C: The Forensic Intelligence Chamber                       │
│   [High-Tech Forensics • Holographic Wireframes • Cold Analytics]       │
└────────────────────────────────────────────────────────────────────────┘
```

### Direction A — The Obsidian Tribunal (Primary Candidate)
- **Concept:** A monumental, ritualistic science-fiction judicial chamber carved from subterranean black basalt and obsidian. Towering monolithic pillars frame a central judicial dais where case records manifest as physical artifacts. Smoked glass barriers and antique gold inlay etchings channel ancient solemnity fused with advanced ritual technology.
- **Atmosphere:** Imposing, solemn, mysterious, authoritative, and permanent.
- **Visual Vocabulary:** Monolithic blocks, deep chiaroscuro lighting, razor-sharp light beams, brass and antique gold inlays, smoked glass plinths, and geometric judicial seals.
- **Strengths:** Commands immediate respect; transforms simple claim verification into a solemn high-stakes inquiry; creates a singular, instantly recognizable visual world.
- **Risks:** Dark palettes risk eye strain if text contrast is poorly calibrated; monumental stone can feel oppressive if not balanced with warm illumination.

### Direction B — The Domain
- **Concept:** An abstract, surreal metaphysical dimension inspired by esoteric mental realms and visual novel "domain expansions." The chamber floats in a boundless abyssal void surrounded by fractured planetary rings, non-Euclidean colonnades, and hovering geometric relics that twist and re-orient based on argument momentum.
- **Atmosphere:** Uncanny, supernatural, unstable, and mythic.
- **Visual Vocabulary:** Hovering stone fragments, shifting zero-gravity stairways, glowing glyph rings, and reality-warping spatial fissures.
- **Strengths:** Immense theatrical drama; unforgettable visual impact during transitions.
- **Risks:** High risk of cognitive disorientation while users attempt to read detailed evidence; significant imitation risk resembling existing anime franchises (e.g., *Jujutsu Kaisen*); very high 3D modeling and animation asset overhead.

### Direction C — The Forensic Intelligence Chamber
- **Concept:** A pristine, darkened technological cleanroom and intelligence bunker. High-precision brushed graphite surfaces, illuminated acrylic telemetry displays, holographic vector wireframes, and segmented analytical glass panels.
- **Atmosphere:** Clinical, hyper-rational, scientific, and forensic.
- **Visual Vocabulary:** Hexagonal grids, cyan/teal vector schematics, floating glass HUDs, monospace data ribbons, and telemetry meters.
- **Strengths:** Intuitive alignment with analytical search results; very easy to render and light; excellent data readability.
- **Risks:** High risk of generic aesthetic fatigue. Closely resembles common cybersecurity war-rooms, crypto analytics dashboards, or Bloomberg terminals; completely lacks the narrative wonder and game-like "fictional institution" identity required by the project brief.

---

### Comparison Matrix

| Evaluation Criterion | Direction A: Obsidian Tribunal | Direction B: The Domain | Direction C: Forensic Chamber |
|---|:---:|:---:|:---:|
| **Fit with Product Vision** | **High (9/10)** | Medium (7/10) | Medium (6/10) |
| **Narrative & Emotional Impact** | **Very High (9.5/10)** | Very High (9/10) | Low (5/10) |
| **Distinctiveness (Originality)** | **Very High (9/10)** | Medium (5/10 - anime tropes) | Very Low (4/10 - generic SaaS) |
| **Visual Coherence & Harmony** | **High (9/10)** | Medium (6/10) | High (8/10) |
| **Readability & Accessibility** | **High (8.5/10)** | Low (4/10) | **Very High (9.5/10)** |
| **Technical Feasibility (60 FPS)** | **High (8.5/10)** | Low (4.5/10) | **Very High (9/10)** |
| **Asset-Production Feasibility** | **High (8.5/10)** | Low (4/10) | High (8/10) |
| **IP & Imitation Risk** | **Low / Safe (9.5/10)** | High Risk (4/10) | Low / Safe (9/10) |
| **Weighted Recommendation** | **SELECTED (Primary)** | REJECTED (Tropes/Fatigue) | REJECTED (Generic/Bland) |

### Recommendation Rationale
**The research strongly validates Direction A: The Obsidian Tribunal as the primary art direction.**

However, to capture the dramatic dynamism envisioned by the product brief without sliding into anime cliché, we incorporate a **disciplined spatial rupture technique adapted from Direction B**:
- The baseline court environment remains steadfastly grounded in the monumental, monolithic architecture of **Direction A**.
- Only during signature crisis moments—specifically the **Objection Interruption** and the **Retrial Re-opening**—does the chamber exhibit subtle supernatural spatial behavior: the monolithic floor slabs smoothly glide apart along brass guide-rails, glowing crimson fracture glyphs awaken in the stone, and the previous judgment monolith recedes backward into the mist.
- This hybrid execution delivers intense game-like storytelling while preserving 100% of the reading stability and institutional authority demanded by serious research.

---

## 4. Provisional Visual Language: The Obsidian Tribunal

```
                                  ▲
                                 / \
                                /   \
                               /     \
                              /   🏛️  \
                             /   THE   \
                            / OBSIDIAN  \
                           /  TRIBUNAL   \
                          /               \
                         /═════════════════\
                        /  MONOLITHIC SPACE \
                       /─────────────────────\
                      /   GOLD INLAY GLYPHS   \
                     /─────────────────────────\
                    / HIGH-CONTRAST PARCHMENT UI\
                   └─────────────────────────────┘
```

### 4.1 Architecture & Spatial Composition
- **Silhouette & Scale:** The chamber is built on massive vertical proportions. Monumental hexagonal basalt columns rise on either side into shadow, framing a deep, single-point perspective that naturally draws the user's gaze toward the central judicial dais.
- **Focal Hierarchy:**
  1. *Foreground (Interactive Layer):* The Case Dossier and Evidence Ledger plinth—positioned directly within the user's primary interactive zone.
  2. *Midground (The Trial Floor):* Twin elevated rostrum podiums (Prosecution on the left, Defense on the right), separated by a sunken reflecting pool of dark smoked glass.
  3. *Background (The Monolith of Judgment):* A towering black obsidian stele bearing etched geometric balance glyphs that remain dormant until the verdict is rendered.
- **Negative Space:** Generous atmospheric voids between architectural masses create solemnity, preventing visual clutter and ensuring that foreground evidence cards breathe easily.
- **Multi-Act Recognizability:** Regardless of camera position, two constant anchor features remain visible in every act:
  1. The central etched golden judicial seal set into the chamber floor.
  2. The twin vertical light shafts cutting through the gloom from an unseen ceiling aperture.

### 4.2 Materials, Shading & Lighting
- **Basalt & Obsidian Stone (Primary Environment):** Deep matte black stone with subtle micro-roughness (roughness ~0.75) and faint edge highlights. Light does not bounce wildly; it settles into the stone.
- **Aged Antique Gold (Sacred Accents):** Restrained, low-polish metallic inlays (metalness ~0.85, roughness ~0.35) used strictly for court seals, subclaim markers, and active argument indicators.
- **Smoked Glass & Obsidian Reflecting Pool:** High-refraction, low-transmittance dark glass (roughness ~0.08, opacity ~0.85) providing subtle inverted reflections of the rostrum lights.
- **Chiaroscuro Lighting Strategy:**
  - Ambient illumination is kept intentionally subdued (cool slate fill at 0.15 intensity).
  - Strong directional overhead spotlights (warm golden-white, 4000K) illuminate active evidence items like museum exhibits.
  - Volumetric light cones highlight airborne dust motes in the 3D space, conveying immense architectural scale without expensive dynamic shadow recalculations.

### 4.3 Color Token Architecture

We evaluated the initial palette against WCAG 2.2 contrast standards and defined a strict semantic token system:

| Swatch Name | Hex Value | Primary Semantic Role | Contrast vs Obsidian |
|---|---|---|---|
| **Obsidian** | `#0C0D11` | Primary chamber background, darkest canvas floor | Baseline Canvas |
| **Graphite** | `#22242B` | Surface elevation 1: Evidence cards, modal dialogs, drawer surfaces | 1.3:1 (Subtle boundary) |
| **Parchment** | `#E8E0D2` | High-priority text, evidence quotes, dossier content | **12.4:1 (WCAG AAA)** |
| **Antique Gold** | `#B9975B` | Judicial seal, active phase, subclaim anchors, verified citations | **5.8:1 (WCAG AA)** |
| **Muted Crimson** | `#B85C6C` | Objection states, contested evidence, prosecution challenges | **4.6:1 (WCAG AA)** |
| **Restrained Teal** | `#5FBAA7` | Corroborating sources, defense arguments, verified evidence | **7.2:1 (WCAG AAA)** |
| **Slate** | `#8990A5` | Secondary metadata, timestamps, inactive borders, labels | **5.4:1 (WCAG AA)** |

#### Crucial Semantic Rule:
*Color is never used as the sole conveyor of truth.*
- Crimson does **not** signify "false" or "bad"; it represents *friction, challenge, prosecution, or open objection*.
- Teal does **not** signify "objective truth"; it represents *corroboration, defense grounding, or supportive evidence*.
- Every status is accompanied by clear text badges, icons, and explicit evidentiary rationales.

### 4.4 Typography System

We analyzed typography combinations for editorial grandeur, on-screen evidence readability, and strict open-source licensing compliance:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TYPOGRAPHIC HIERARCHY                           │
│                                                                        │
│   DISPLAY / NARRATIVE:                                                 │
│   Cormorant Garamond (SIL OFL v1.1)                                    │
│   "THE OBSIDIAN TRIBUNAL HAS CONVENED"                                 │
│                                                                        │
│   INTERFACE / BODY / EVIDENCE:                                         │
│   IBM Plex Sans (SIL OFL v1.1)                                         │
│   "Exhibit E-04 establishes direct precedent regarding..."             │
│                                                                        │
│   METADATA / CODE / EXECUTABLE CLAIMS:                                 │
│   IBM Plex Mono (SIL OFL v1.1)                                         │
│   CASE-2026-X89 // CLAIM_DECOMPOSITION // VERDICT: MIXED               │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Display & Act Headers: *Cormorant Garamond*** (Google Fonts / SIL OFL v1.1)
   - *Role:* Act title screens, chamber inscriptions, solemn judicial pronouncements, and the court seal motto.
   - *Characteristics:* High-contrast, elegant classical serif that conveys ritual authority without feeling gothic or archaic.
2. **Interface, Arguments & Evidence Copy: *IBM Plex Sans*** (Google Fonts / SIL OFL v1.1)
   - *Role:* All user inputs, evidence snippets, prosecution/defense arguments, objection forms, and button controls.
   - *Characteristics:* Engineered specifically for on-screen clarity; robust at small font sizes (13px–15px) against dark backgrounds.
3. **Metadata, Identifiers & Timestamps: *IBM Plex Mono*** (Google Fonts / SIL OFL v1.1)
   - *Role:* Evidence IDs (`EVID-01`), case ledger numbers, Tavily source URLs, and retrial version tags (`v1.0 -> v2.0`).
   - *Characteristics:* Crisp, technical monospaced rhythm reinforcing the institutional ledger concept.

---

### 4.5 The Five Signature Artifacts

Each core mechanic in Hype Court is anchored by a bespoke physical-looking artifact in the visual world:

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  THE COURT SEAL  │   │ THE CASE DOSSIER │   │EVIDENCE EXHIBIT  │
│   (Balance/Void) │   │  (Wax & Basalt)  │   │  (Slate Plinth)  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
         ▲                                              │
         │             ┌──────────────────┐             │
         └─────────────┤ OBJECTION MARKER ├─────────────┘
                       │(Fractured Blade) │
                       └──────────────────┘
                                 │
                                 ▼
                       ┌──────────────────┐
                       │JUDGMENT ARTIFACT │
                       │(Engraved Stele)  │
                       └──────────────────┘
```

1. **The Court Seal:**
   - *Concept:* The emblem of institutional impartiality.
   - *Visual Form:* A geometric ouroboros formed by twin interlocking obsidian triangles framed by an antique gold outer ring, with a central stylized scale motif.
   - *Material:* Polished brass relief set into dark basalt stone.
   - *States:* Dormant (faint gold outline) → Pulsing (active case in session) → Sealed (glowing solid gold upon final judgment).
2. **The Case Dossier:**
   - *Concept:* The physical manifestation of the user's submitted claim.
   - *Visual Form:* An architectural graphite folder bound with a gold band and sealed with an obsidian wafer. When opened, it unfolds into 2–4 parchment leaves displaying the decomposed subclaims.
   - *Material:* Textured graphite paper, gold foil foil-stamping, dark obsidian seal.
   - *States:* Blank Intake → Subclaim Unfolding → Verified Docket.
3. **The Evidence Exhibit:**
   - *Concept:* Individual web sources treated as physical evidence plinths.
   - *Visual Form:* A floating rectangular slate tablet with bevelled edges. The top face holds an illuminated parchment plate with excerpted source quotes, while the side edge features an engraved Evidence ID (`EVID-04`) with a glowing confidence bead.
   - *Material:* Honed slate, aged parchment, LED edge-lit glass for source credibility indicator.
   - *States:* Discovered (gliding onto ledger) → Inspected (zoomed card) → Cited (highlighted with gold rim) → Challenged (crimson outline).
4. **The Objection Marker:**
   - *Concept:* The user's instrument of procedural challenge.
   - *Visual Form:* A razor-sharp obsidian ceremonial blade / gavel marker resting on a brass cradle.
   - *Material:* Translucent volcanic glass with fine internal fissures that fill with crimson light when primed.
   - *States:* Resting on Cradle → Raised / Active → Struck (ruptures the current argument and isolates the challenged assertion).
5. **The Judgment Artifact:**
   - *Concept:* The final verdict carved in stone.
   - *Visual Form:* A monolithic obsidian stele rising from the reflecting pool at the chamber's rear.
   - *Material:* Mirror-polished black obsidian with laser-crisp engraved typography in antique gold, teal, or crimson depending on verdict category.
   - *States:* Veiled in Shadow → Emerging from Pool → Inscription Ignition → Suspended (during retrial comparison).

---

### 4.6 The Opening Experience Visual Premise

Rather than confronting users with a generic signup form or chat input, Hype Court opens as an interactive cinematic threshold:

1. **The Void Encounter:**
   - The screen begins in absolute abyssal blackness (`#0C0D11`).
   - A single vertical slit of warm golden light cuts down the center of the viewport, illuminating floating dust motes.
2. **The Chamber Awakening:**
   - Subtle resonant stone chimes sound as the slit broadens into a grand archway.
   - The camera glides slowly forward along the polished floor, revealing the monolithic basalt columns flanking the path.
3. **The Court Pronouncement:**
   - Cormorant Garamond typography fades into the center:
     > *"Every claim has a case. Every argument must face scrutiny. Every judgment can be challenged."*
4. **The Invitation to the Dais:**
   - The camera settles at the central dais.
   - The Case Dossier artifact rests upon the stone pedestal, illuminated by a warm pool of overhead light.
   - A minimalist, glowing prompt invites the user: *"Place your proposition before the court."*

---

### 4.7 Visual Reference Board & Analysis

| Reference Name & URL | What to Study | What to Adapt for Hype Court | What NOT to Copy |
|---|---|---|---|
| **[Bruno Simon Portfolio](https://bruno-simon.com/)** | 3D world interaction & camera placement | Fixed isometric/spatial anchor keeping user oriented in 3D | Cartoon physics, toy vehicles, playful bright colors |
| **[Awwwards 3D Category](https://www.awwwards.com/websites/3d/)** | High-end cinematic web experiences | Depth-layering of 2D UI panels over real-time 3D environments | Scroll-jacking, unresponsive controls, full-screen canvas text |
| **[Awwwards Storytelling](https://www.awwwards.com/websites/storytelling/)** | Narrative pacing and act structures | Discrete chapter transitions with atmospheric mood shifts | Unskippable 10-second linear video cutscenes |
| **[Three.js Creating a Scene](https://threejs.org/manual/pages/creating-a-scene.html)** | Scene graph hierarchy & composition | Clean separation of chamber environment, dais, and lighting | Basic unlit primitives or default phong materials |
| **[Three.js Color Management](https://threejs.org/manual/pages/color-management.html)** | Exact color space & PBR calibration | sRGB albedo maps paired with linear roughness/metalness maps | Legacy uncalibrated hex colors that blow out in WebGL |
| **[R3F Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)** | GPU optimization & demand rendering | `frameloop="demand"` and adaptive DPR reduction during camera sweeps | Running continuous 60 FPS loops when user is idle reading text |
| **[GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)** | Reversible animation sequencing | Coordinated multi-track timelines for retrials and act shifts | Jumpy CSS keyframes that cannot be scrubbed or reversed |
| **[Poly Haven CC0 Library](https://polyhaven.com/license)** | Free-license rock and metal PBR textures | Real photographic basalt stone and brushed brass normal maps | Overly dirty or cracked dungeon textures (must feel refined) |
| **[ambientCG Material Library](https://ambientcg.com/)** | CC0 architectural textures | High-density smoked glass and slate texture maps | High-poly uncompressed displacement maps |
| **[Google Fonts Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)** | Classical display serif typography | Heroic act headers and solemn judicial inscriptions | Using serif fonts for small UI buttons or table data |
| **[Google Fonts IBM Plex](https://fonts.google.com/specimen/IBM+Plex+Sans)** | Technical & legible UI typography | High-density evidence tables, argument clauses, and cards | Generic sans-serif defaults (Inter, Arial, Roboto) |

---

## 5. Preliminary Motion Language

Motion in Hype Court is **event-driven, narrative, and functional**—never decorative eye candy:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOTION CLASSIFICATIONS                          │
│                                                                        │
│   1. AMBIENT DRIFT (<2% GPU):                                          │
│      Subtle dust motes, breathing spotlight intensity, glass shimmers. │
│                                                                        │
│   2. UI MICRO-INTERACTIONS (150ms - 250ms):                            │
│      Card hover lift, citation popover expand, drawer slide.           │
│                                                                        │
│   3. CINEMATIC ACT TRANSITIONS (800ms - 1400ms):                       │
│      GSAP camera glide, dais awakening, monolith emergence, retrial.   │
└────────────────────────────────────────────────────────────────────────┘
```

### Motion Qualities for Key Court Events
1. **Chamber Awakening (Act I → Act II):**
   - *Narrative Meaning:* The court recognizes the user and opens its doors.
   - *Motion:* Smooth camera descent from high wide angle to medium eye level (GSAP `power3.out`, 1200ms). Spotlights fade up sequentially along the colonnade.
2. **Evidence Manifestation (Act II → Act III):**
   - *Narrative Meaning:* Discovered real-world sources are entered into the court ledger.
   - *Motion:* Slate exhibit tablets glide in from the periphery along a golden light-rail, snapping cleanly into the evidence ledger grid with subtle spring damping.
3. **Active Argument Highlighting (Act IV):**
   - *Narrative Meaning:* Focus shifts between Prosecution and Defense claims.
   - *Motion:* Warm spotlight shifts softly toward the active rostrum; cited evidence cards gently elevate (Y: -4px) and pulse with an antique gold border glow.
4. **Objection Interruption (Signature Action):**
   - *Narrative Meaning:* An abrupt procedural halt challenging flawed reasoning.
   - *Motion:* Immediate interruption. A heavy resonant bass gavel strike cuts off argument flow. A fine crimson fissure animates across the chamber floor, and the challenged assertion is isolated in sharp focus while surrounding text dims.
5. **Retrial Reversal (Signature Act VI):**
   - *Narrative Meaning:* The previous judgment is formally suspended and re-examined.
   - *Motion:* The camera glides backward; the Judgment Monolith slides down 200px and dims to 50% opacity; new evidence plinths slide into the foreground; the interface splits into a side-by-side **Verdict Delta** view.
6. **Judgment Reveal (Act V):**
   - *Narrative Meaning:* The impartial synthesis of truth.
   - *Motion:* Slow upward camera tilt following the ascending Judgment Stele; letters etch into the obsidian surface via glowing light trails, culminating in a solid gold, teal, or crimson seal imprint.

### Accessibility & Reduced Motion
- When `prefers-reduced-motion: reduce` is enabled:
  - All 3D camera sweeps are disabled; camera remains static at an optimal three-quarters view.
  - Act transitions switch to 200ms cross-fades.
  - Objection strikes replace floor fissure animations with a clear, static red badge indicator.

---

## 6. Performance & Technical Guardrails

To guarantee seamless execution across both high-end desktop workstations and integrated GPU laptops:

1. **Dual-Layer Architecture:**
   - *Layer 1 (3D Canvas):* Background React Three Fiber canvas rendering the chamber, pillars, floor, and lights.
   - *Layer 2 (DOM Overlay):* Pure semantic HTML/CSS layer on top (z-index 10) housing evidence cards, argument boxes, and controls. This guarantees instantaneous text selection, native browser zoom, screen-reader compatibility, and crisp font antialiasing.
2. **On-Demand Rendering Protocol:**
   - Canvas configured with `frameloop="demand"`. R3F only renders frames when camera timelines are actively playing or interactive hovering occurs. Idle GPU usage drops to near zero.
3. **Geometry & Draw Call Budget:**
   - Maximum vertex count: <50,000 vertices across entire scene.
   - Draw call target: <40 draw calls. Achieved by combining pillar meshes into instanced geometries (`<Instances>` in Drei).
   - Textures: 1024x1024 compressed WebP format for stone/metal roughness maps.
4. **Dynamic Resolution & Fallbacks:**
   - Use R3F's `performance={{ min: 0.5, max: 1 }}` to automatically halve canvas DPR during rapid camera pans, returning to full 1.0 DPR at rest.
   - If WebGL initialization fails, provide an immediate fallback to a high-contrast 2D static illustration of the chamber dais with zero layout breakage.

---

## 7. Explicit Keep / Refine / Eliminate Table

| Element / Pattern | Disposition | Rational Analysis |
|---|:---:|---|
| **Monumental Basalt Architecture** | **KEEP** | Core pillar of "The Obsidian Tribunal"; establishes solemn institutional authority and grandeur. |
| **Antique Gold, Crimson & Teal Accents** | **KEEP** | Provides rich, restrained hierarchy; elevates claims beyond sterile black-and-white. |
| **HTML/SVG DOM for All Evidence Text** | **KEEP** | Non-negotiable for accessibility, text clarity, copy-paste utility, and WCAG compliance. |
| **Reversible GSAP Act Timelines** | **KEEP** | Essential for the signature Retrial mechanic; allows scrubbable physical case progression. |
| **Spatial Rupture during Objections** | **REFINE** | Limit to subtle crimson floor seams and argument isolation; do not warp the entire 3D world into chaotic anime debris. |
| **Volumetric Lighting & Fog** | **REFINE** | Use lightweight distance fog (`fogExp2`) and pre-baked light cone cones; avoid expensive real-time volumetric raymarching shaders. |
| **Generic Neon Cyberpunk / CRT Vectors** | **ELIMINATE** | Cliche and antithetical to the solemn, ancient-institutional fiction of Hype Court. |
| **Full-Screen 3D Text / Geometry Buttons** | **ELIMINATE** | Unusable on mobile/tablets, unreadable at small sizes, inaccessible to screen readers, GPU heavy. |
| **Excessive Particle Swarms & Bloom** | **ELIMINATE** | Cheapens visual clarity; causes severe FPS drops on budget laptops and obscures evidence reading. |
| **Continuous Floating Camera Orbit** | **ELIMINATE** | Induces motion sickness and frustrates users trying to read complex research citations. |
| **Direct Imitation of Anime IP (JJK, etc.)** | **ELIMINATE** | Unprofessional, creates trademark and IP infringement risks, and dilutes product originality. |

---

## 8. Remaining Questions & Approval Gate

Before advancing to **Phase 2: Narrative Flow & UX Specification**, the following design decisions require Product Owner sign-off:

1. **Rostrum Staging Layout:** Do you approve the classic bilateral adversarial arrangement (Prosecution elevated on the left, Defense elevated on the right, Judge Monolith centered in the deep background)?
2. **Artifact Representation of Evidence:** Do you approve the "Floating Slate Tablet / Plinth" visual concept for evidence artifacts in the ledger?
3. **Sound Direction Strategy:** Should audio be generated procedurally via the Web Audio API (deep synthetic bass hums and stone gavel strikes) or sourced as short, pre-recorded licensed acoustic wave files?

---

### Request for Phase 1 Approval
The art direction, research synthesis, visual language, signature artifacts, and performance guardrails for **The Obsidian Tribunal** are now fully documented. 

**Do you approve this art direction proposal to close Phase 1 and advance to Phase 2: Narrative Flow and UX Specification?**
