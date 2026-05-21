# Plant Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-plant photo gallery — admins upload extra photos in the edit form; visitors see a thumbnail strip + lightbox on the plant detail page.

**Architecture:** Extend the `Plant` Mongoose model with a `gallery: string[]` field (Cloudinary URLs). The admin Add/Edit form gets a Gallery section using the existing upload flow. The plant detail page image column gains a thumbnail strip below the main image and a full-screen lightbox triggered by clicking the main image.

**Tech Stack:** Next.js 14 App Router, React, Mongoose/MongoDB, Cloudinary (existing), inline CSS (existing pattern), next/image

---

## File Map

| File | Change |
|------|--------|
| `src/models/Plant.ts` | Add `gallery: string[]` field |
| `src/types/plant.ts` | Add `gallery` to Plant type (if it exists) |
| `src/app/api/plants/[id]/route.ts` | Include `gallery` in PUT `$set` |
| `src/app/api/plants/route.ts` | Include `gallery` in POST body |
| `src/app/[locale]/admin/plants/page.tsx` | Add Gallery section to Add/Edit form |
| `src/app/[locale]/plants/[id]/page.tsx` | Add thumbnail strip + lightbox to detail page |

---

### Task 1: Extend the Plant model with `gallery`

**Files:**
- Modify: `src/models/Plant.ts`

- [ ] **Step 1: Add `gallery` to the TypeScript interface and Mongoose schema**

Open `src/models/Plant.ts`. Add `gallery` to `IPlantDocument` and the schema:

```ts
export interface IPlantDocument extends Document {
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  price: number;
  imageUrl: string;
  gallery: string[];          // ← add this
  category: string;
  careInstructions: {
    wateringFrequency: string;
    lightRequirements: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
  stock: number;
  createdAt: Date;
  qrCode?: {
    imageUrl: string;
    encodedUrl: string;
    generatedAt: Date;
  };
}
```

And in the schema body, after `imageUrl`:

```ts
gallery: { type: [String], default: [] },
```

- [ ] **Step 2: Verify the app still compiles**

```powershell
cd d:\verde-garden
npx tsc --noEmit
```

Expected: no errors about `gallery`.

- [ ] **Step 3: Commit**

```powershell
git add src/models/Plant.ts
git commit -m "feat: add gallery field to Plant model"
```

---

### Task 2: Pass `gallery` through the API routes

**Files:**
- Modify: `src/app/api/plants/[id]/route.ts`
- Modify: `src/app/api/plants/route.ts`

- [ ] **Step 1: Update PUT handler to persist gallery**

In `src/app/api/plants/[id]/route.ts`, inside the `PUT` handler, destructure `gallery` from the body and include it in `$set`:

```ts
const { price, imageUrl, gallery, category, stock, careInstructions } = body;
// ...
const plant = await Plant.findByIdAndUpdate(
  id,
  { $set: { name, description, price, imageUrl, gallery: gallery ?? [], category, stock, careInstructions } },
  { new: true, runValidators: true }
);
```

- [ ] **Step 2: Update POST handler to persist gallery**

Open `src/app/api/plants/route.ts`. Find the POST handler. Add `gallery` to the document being created. The exact shape depends on the current code — find where a new `Plant(...)` is instantiated or where the body fields are spread, and add:

```ts
gallery: body.gallery ?? [],
```

- [ ] **Step 3: Verify no type errors**

```powershell
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```powershell
git add src/app/api/plants/[id]/route.ts src/app/api/plants/route.ts
git commit -m "feat: pass gallery through plant API routes"
```

---

### Task 3: Gallery upload section in the Admin Add/Edit form

**Files:**
- Modify: `src/app/[locale]/admin/plants/page.tsx`

This task adds a "Gallery" form section below the main image upload. It reuses the existing Cloudinary upload helper (`uploadImage` / `uploadToCloudinary` flow via `/api/upload`).

- [ ] **Step 1: Add `gallery` to the `FormState` interface and `BLANK_FORM`**

Find `interface FormState` and add:
```ts
gallery: string[];
```

Find `const BLANK_FORM` and add:
```ts
gallery: [],
```

- [ ] **Step 2: Add gallery state for the pending upload**

Inside the component, below the existing `imageFile` / `imagePreview` state:

```ts
const [galleryFile, setGalleryFile] = useState<File | null>(null);
const [galleryUploading, setGalleryUploading] = useState(false);
const galleryInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 3: Populate `gallery` when editing a plant**

In `startEdit`, add:
```ts
gallery: plant.gallery ?? [],
```
to the `setForm(...)` call alongside the other fields.

- [ ] **Step 4: Reset gallery ref on `resetForm`**

In `resetForm`, add:
```ts
if (galleryInputRef.current) galleryInputRef.current.value = "";
setGalleryFile(null);
```

- [ ] **Step 5: Add `gallery` to the submit payload**

In `handleSubmit`, inside the `payload` object, add:
```ts
gallery: form.gallery,
```

- [ ] **Step 6: Add a handler to upload a single gallery photo**

Below `uploadImage`, add:

```ts
const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setGalleryFile(file);
  setGalleryUploading(true);
  try {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Upload failed");
    setForm((f) => ({ ...f, gallery: [...f.gallery, data.url as string] }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    showToast("error", msg);
  } finally {
    setGalleryUploading(false);
    setGalleryFile(null);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }
};

const handleGalleryRemove = (url: string) => {
  setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }));
};
```

- [ ] **Step 7: Add the Gallery CSS**

Inside the existing `<style>` block in the component, append:

```css
/* GALLERY SECTION */
.adm-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.65rem; margin-bottom: 0.85rem; }
.adm-gallery-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--parchment); background: var(--cream); }
.adm-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
.adm-gallery-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(10,18,11,0.65); border: none; color: #fff; font-size: 0.75rem; line-height: 1; cursor: pointer; display: grid; place-items: center; }
.adm-gallery-remove:hover { background: var(--terra); }
.adm-gallery-add { display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 500; color: var(--sage); background: var(--parchment); border: 1.5px dashed var(--sand); border-radius: var(--radius-sm); padding: 0.55rem 1rem; cursor: pointer; transition: all var(--transition); width: fit-content; }
.adm-gallery-add:hover { border-color: var(--fern); background: rgba(127,168,107,0.06); }
.adm-gallery-input { display: none; }
```

- [ ] **Step 8: Render the Gallery section in the form**

Add a new `<div className="adm-form-section">` block inside the `<form>`, right after the existing image upload section:

```tsx
<div className="adm-form-section">
  <div className="adm-section-label">Gallery</div>
  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.85rem" }}>
    Additional photos shown in the plant detail page gallery.
  </p>
  {form.gallery.length > 0 && (
    <div className="adm-gallery-grid">
      {form.gallery.map((url) => (
        <div key={url} className="adm-gallery-thumb">
          <img src={url} alt="Gallery photo" />
          <button
            type="button"
            className="adm-gallery-remove"
            onClick={() => handleGalleryRemove(url)}
            aria-label="Remove photo"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}
  <input
    ref={galleryInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="adm-gallery-input"
    id="gallery-upload"
    onChange={handleGalleryAdd}
    disabled={galleryUploading}
  />
  <label htmlFor="gallery-upload" className="adm-gallery-add">
    {galleryUploading ? (
      <>
        <span className="adm-spinner" />
        Uploading…
      </>
    ) : (
      <>
        <Upload size={15} aria-hidden="true" />
        Add Photo
      </>
    )}
  </label>
</div>
```

- [ ] **Step 9: Verify — load the edit form for an existing plant in the browser, upload a gallery photo, save, reload**

The gallery array should persist (visible in the edit form when reopened).

- [ ] **Step 10: Commit**

```powershell
git add src/app/[locale]/admin/plants/page.tsx
git commit -m "feat: add gallery upload section to admin plant form"
```

---

### Task 4: Thumbnail strip + lightbox on the plant detail page

**Files:**
- Modify: `src/app/[locale]/plants/[id]/page.tsx`

- [ ] **Step 1: Add `gallery` to the `Plant` interface**

Find the local `interface Plant` in the file and add:
```ts
gallery?: string[];
```

- [ ] **Step 2: Add lightbox state**

Inside the component, below existing state declarations:

```ts
const [activePhoto, setActivePhoto] = useState<string | null>(null);
const [lightboxOpen, setLightboxOpen] = useState(false);
```

- [ ] **Step 3: Derive the full photo list**

After the `plant` state is available (inside the render, after the guards), compute:

```ts
const allPhotos = plant
  ? [plant.imageUrl, ...(plant.gallery ?? [])].filter(Boolean)
  : [];
const mainPhoto = activePhoto ?? plant?.imageUrl ?? null;
const lightboxIndex = allPhotos.indexOf(mainPhoto ?? "");
```

- [ ] **Step 4: Add lightbox keyboard handler**

```ts
useEffect(() => {
  if (!lightboxOpen) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") setLightboxOpen(false);
    if (e.key === "ArrowRight") {
      setActivePhoto((cur) => {
        const idx = allPhotos.indexOf(cur ?? plant?.imageUrl ?? "");
        return allPhotos[(idx + 1) % allPhotos.length] ?? null;
      });
    }
    if (e.key === "ArrowLeft") {
      setActivePhoto((cur) => {
        const idx = allPhotos.indexOf(cur ?? plant?.imageUrl ?? "");
        return allPhotos[(idx - 1 + allPhotos.length) % allPhotos.length] ?? null;
      });
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [lightboxOpen, allPhotos, plant]);
```

Note: `allPhotos` must be stable — derive it outside `useEffect` or memoize it. Since it's derived from `plant` state it will be stable between renders unless plant changes.

- [ ] **Step 5: Add gallery + lightbox CSS**

Inside the existing `<style>` block, append:

```css
/* ─── GALLERY STRIP ──────────────────────────────── */
.pd-gallery-strip {
  display: flex; gap: 0.55rem; margin-top: 0.75rem;
  overflow-x: auto; padding-bottom: 4px;
}
.pd-gallery-strip::-webkit-scrollbar { height: 4px; }
.pd-gallery-strip::-webkit-scrollbar-track { background: transparent; }
.pd-gallery-strip::-webkit-scrollbar-thumb { background: var(--sand); border-radius: 4px; }
.pd-thumb {
  flex-shrink: 0; width: 64px; height: 64px;
  border-radius: 10px; overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer; transition: border-color 0.18s, opacity 0.18s;
  position: relative; background: var(--parchment);
}
.pd-thumb:hover { opacity: 0.85; }
.pd-thumb.active { border-color: var(--forest); }

/* ─── LIGHTBOX ───────────────────────────────────── */
.pd-lightbox {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(5,12,6,0.92);
  display: grid; place-items: center;
  backdrop-filter: blur(6px);
}
.pd-lightbox-inner {
  position: relative; max-width: min(90vw, 900px);
  max-height: 90vh; width: 100%;
  display: flex; align-items: center; justify-content: center;
}
.pd-lightbox-img {
  max-width: 100%; max-height: 88vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 8px 48px rgba(0,0,0,0.6);
}
.pd-lightbox-close {
  position: fixed; top: 1.25rem; right: 1.5rem;
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none;
  color: #fff; font-size: 1.4rem; line-height: 1;
  cursor: pointer; display: grid; place-items: center;
  transition: background 0.18s;
}
.pd-lightbox-close:hover { background: rgba(255,255,255,0.22); }
.pd-lightbox-arrow {
  position: fixed; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: none;
  color: #fff; font-size: 1.4rem; cursor: pointer;
  display: grid; place-items: center; transition: background 0.18s;
}
.pd-lightbox-arrow:hover { background: rgba(255,255,255,0.24); }
.pd-lightbox-arrow.prev { left: 1rem; }
.pd-lightbox-arrow.next { right: 1rem; }
.pd-lightbox-counter {
  position: fixed; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
  font-size: 0.78rem; color: rgba(255,255,255,0.6);
  font-weight: 500; letter-spacing: 0.06em;
}

/* Main image — make it clickable */
.pd-img-wrap { cursor: zoom-in; }
```

- [ ] **Step 6: Update the main image to be clickable and show `mainPhoto`**

In the JSX, replace the Image inside `.pd-img-wrap` with a version that uses `mainPhoto` and opens the lightbox on click:

```tsx
<div className="pd-img-wrap" onClick={() => { if (allPhotos.length) setLightboxOpen(true); }}>
  {mainPhoto ? (
    <Image
      src={mainPhoto}
      alt={plant.name?.[locale as "fr" | "en"] ?? ""}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      style={{ objectFit: "cover" }}
    />
  ) : (
    <div className="pd-img-placeholder">
      <Leaf size={56} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" />
    </div>
  )}
  {/* keep existing diffCfg badge and OOS overlay unchanged */}
  {diffCfg && diff && (
    <span className="pd-diff-badge" style={{ color: diffCfg.color, background: diffCfg.bg }}>
      {t(`plant.difficulty${diff}`)}
    </span>
  )}
  {plant.stock <= 0 && (
    <div className="pd-oos-overlay">
      <span className="pd-oos-label">{t("plant.outOfStock")}</span>
    </div>
  )}
</div>
```

- [ ] **Step 7: Add the thumbnail strip below `.pd-img-wrap`**

Immediately after the closing `</div>` of `.pd-img-wrap`, still inside `.pd-img-col`:

```tsx
{allPhotos.length > 1 && (
  <div className="pd-gallery-strip">
    {allPhotos.map((url, i) => (
      <div
        key={url + i}
        className={`pd-thumb${mainPhoto === url ? " active" : ""}`}
        onClick={() => setActivePhoto(url)}
      >
        <Image
          src={url}
          alt={`Photo ${i + 1}`}
          fill
          sizes="64px"
          style={{ objectFit: "cover" }}
        />
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 8: Render the lightbox**

At the bottom of the returned JSX, before the final closing `</>`, add:

```tsx
{lightboxOpen && allPhotos.length > 0 && (
  <div className="pd-lightbox" onClick={() => setLightboxOpen(false)}>
    <div className="pd-lightbox-inner" onClick={(e) => e.stopPropagation()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mainPhoto ?? ""}
        alt="Gallery"
        className="pd-lightbox-img"
      />
    </div>
    <button
      className="pd-lightbox-close"
      onClick={() => setLightboxOpen(false)}
      aria-label="Close"
    >
      ×
    </button>
    {allPhotos.length > 1 && (
      <>
        <button
          className="pd-lightbox-arrow prev"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            setActivePhoto(allPhotos[(lightboxIndex - 1 + allPhotos.length) % allPhotos.length]);
          }}
        >
          ‹
        </button>
        <button
          className="pd-lightbox-arrow next"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            setActivePhoto(allPhotos[(lightboxIndex + 1) % allPhotos.length]);
          }}
        >
          ›
        </button>
        <div className="pd-lightbox-counter">
          {lightboxIndex + 1} / {allPhotos.length}
        </div>
      </>
    )}
  </div>
)}
```

- [ ] **Step 9: Verify in the browser**
  - Plant with no gallery → page looks exactly as before
  - Plant with gallery photos → thumbnail strip appears below main image
  - Clicking a thumbnail → main image swaps
  - Clicking main image → lightbox opens
  - Arrow keys / arrow buttons navigate photos
  - Esc / clicking outside closes lightbox
  - Counter shows "1 / N"

- [ ] **Step 10: Commit**

```powershell
git add src/app/[locale]/plants/[id]/page.tsx
git commit -m "feat: add gallery thumbnail strip and lightbox to plant detail page"
```

---

## Self-Review Checklist

- [x] Model field added (`gallery: string[]`) ✓ Task 1
- [x] PUT API persists gallery ✓ Task 2
- [x] POST API persists gallery ✓ Task 2
- [x] Admin form Gallery section with upload + remove ✓ Task 3
- [x] `startEdit` populates gallery ✓ Task 3
- [x] `resetForm` clears gallery ✓ Task 3
- [x] Detail page thumbnail strip (only when >1 photo) ✓ Task 4
- [x] Detail page main image clickable → lightbox ✓ Task 4
- [x] Lightbox arrow nav + keyboard (Esc, ←, →) ✓ Task 4
- [x] Lightbox counter ✓ Task 4
- [x] Plants with no gallery are unaffected ✓ Task 4
