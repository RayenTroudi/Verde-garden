"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Leaf, LayoutGrid, Plus, List, Pencil, Trash2, Upload, QrCode, Download, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

interface Plant {
  _id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  price: number;
  imageUrl: string;
  gallery?: string[];
  category: string;
  stock: number;
  careInstructions: {
    wateringFrequency: string;
    lightRequirements: string;
    difficulty: "Easy" | "Medium" | "Hard";
  };
  createdAt: string;
  qrCode?: {
    imageUrl: string;
    encodedUrl: string;
    generatedAt: string;
  };
}

interface FormState {
  nameFr: string;
  nameEn: string;
  descFr: string;
  descEn: string;
  price: string;
  category: string;
  stock: string;
  imageUrl: string;
  wateringFrequency: string;
  lightRequirements: string;
  difficulty: "Easy" | "Medium" | "Hard";
  gallery: string[];
}

type Tab = "overview" | "add" | "manage";

const BLANK_FORM: FormState = {
  nameFr: "",
  nameEn: "",
  descFr: "",
  descEn: "",
  price: "",
  category: "",
  stock: "",
  imageUrl: "",
  wateringFrequency: "",
  lightRequirements: "",
  difficulty: "Easy",
  gallery: [],
};

const CATEGORIES = [
  "Indoor",
  "Outdoor",
  "Succulent",
  "Tropical",
  "Herb",
  "Fern",
  "Flowering",
  "Cactus",
  "Other",
];


export default function AdminPlantsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [nameLang, setNameLang] = useState<"fr" | "en">("fr");
  const [descLang, setDescLang] = useState<"fr" | "en">("fr");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const fetchPlants = useCallback(async () => {
    try {
      const res = await fetch("/api/plants");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlants(data);
    } catch {
      showToast("error", t("admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    fetchPlants();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [fetchPlants]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.imageUrl || null;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errors.uploadFailed"));
      return data.url as string;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.uploadFailed");
      showToast("error", msg);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleGalleryAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errors.uploadFailed"));
      setForm((f) => ({ ...f, gallery: [...f.gallery, data.url as string] }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.uploadFailed");
      showToast("error", msg);
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleGalleryRemove = (url: string) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }));
  };

  const resetForm = () => {
    setForm(BLANK_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameFr.trim() || !form.nameEn.trim() || !form.descFr.trim() || !form.descEn.trim() || !form.price) {
      showToast("error", t("admin.requiredFields"));
      return;
    }
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const payload = {
        name: { fr: form.nameFr.trim(), en: form.nameEn.trim() },
        description: { fr: form.descFr.trim(), en: form.descEn.trim() },
        price: parseFloat(form.price),
        imageUrl: imageUrl ?? "",
        gallery: form.gallery,
        category: form.category.trim() || "General",
        stock: parseInt(form.stock) || 0,
        careInstructions: {
          wateringFrequency: form.wateringFrequency.trim(),
          lightRequirements: form.lightRequirements.trim(),
          difficulty: form.difficulty,
        },
      };

      const url = editingId ? `/api/plants/${editingId}` : "/api/plants";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("admin.generalError"));

      showToast("success", editingId ? t("admin.plantUpdated") : t("admin.plantAdded"));
      resetForm();
      await fetchPlants();
      setTab("manage");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("admin.generalError");
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (plant: Plant) => {
    setForm({
      nameFr: plant.name?.fr ?? "",
      nameEn: plant.name?.en ?? "",
      descFr: plant.description?.fr ?? "",
      descEn: plant.description?.en ?? "",
      price: String(plant.price),
      category: plant.category,
      stock: String(plant.stock),
      imageUrl: plant.imageUrl,
      wateringFrequency: plant.careInstructions?.wateringFrequency ?? "",
      lightRequirements: plant.careInstructions?.lightRequirements ?? "",
      difficulty: plant.careInstructions?.difficulty ?? "Easy",
      gallery: plant.gallery ?? [],
    });
    setEditingId(plant._id);
    setImagePreview(plant.imageUrl || null);
    setImageFile(null);
    setTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/plants/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? t("admin.generalError"));
      }
      showToast("success", t("admin.plantDeleted"));
      setDeleteConfirm(null);
      await fetchPlants();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("admin.generalError");
      showToast("error", msg);
    }
  };

  const handleQRUpdated = useCallback((id: string, qrCode: Plant["qrCode"]) => {
    setPlants((prev) => prev.map((p) => p._id === id ? { ...p, qrCode } : p));
  }, []);

  const totalValue = plants.reduce((s, p) => s + p.price * p.stock, 0);
  const outOfStock = plants.filter((p) => p.stock === 0).length;
  const lowStock = plants.filter((p) => p.stock > 0 && p.stock <= 5).length;

  const difficultyColor: Record<string, string> = {
    Easy: "#7fa86b",
    Medium: "#c4914b",
    Hard: "#c4714b",
  };

  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "overview", icon: <LayoutGrid size={18} fill="currentColor" style={{ color: "#b8d4b0" }} aria-hidden="true" />, label: t("admin.overview") },
    { id: "add", icon: <Plus size={18} fill="currentColor" style={{ color: "#b8d4b0" }} aria-hidden="true" />, label: editingId ? t("admin.editPlant") : t("admin.addPlant") },
    { id: "manage", icon: <List size={18} fill="currentColor" style={{ color: "#b8d4b0" }} aria-hidden="true" />, label: t("admin.managePlants") },
  ];

  return (
    <>
      <style>{`
        /* CONTENT */
        .adm-content { padding: 0; flex: 1; }
        .adm-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
        .adm-stat { background: var(--white); border-radius: var(--radius); padding: 1.25rem 1.5rem; border-left: 3px solid var(--stat-color, var(--fern)); box-shadow: var(--shadow-xs); }
        .adm-stat-label { font-size: 0.7rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.4rem; }
        .adm-stat-value { font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--forest); line-height: 1; }
        .adm-stat-sub { font-size: 0.72rem; color: var(--text-light); margin-top: 0.2rem; }

        /* PLANT GRID */
        .adm-plant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .adm-plant-card { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-xs); border: 1px solid var(--parchment); transition: box-shadow var(--transition); display: flex; flex-direction: column; }
        .adm-plant-card:hover { box-shadow: var(--shadow-md); }
        .adm-plant-thumb { position: relative; aspect-ratio: 3/2; overflow: hidden; background: var(--parchment); }
        .adm-plant-thumb-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: var(--sand); }
        .adm-plant-info { padding: 0.9rem 1.1rem 1rem; flex: 1; }
        .adm-plant-cat { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--sage); margin-bottom: 0.2rem; }
        .adm-plant-name { font-family: var(--font-display); font-size: 1.1rem; font-weight: 500; color: var(--forest); margin-bottom: 0.25rem; line-height: 1.2; }
        .adm-plant-meta { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.6rem; flex-wrap: wrap; }
        .adm-plant-price { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--forest); }
        .adm-plant-stock-badge { font-size: 0.65rem; font-weight: 500; padding: 0.2rem 0.55rem; border-radius: 4px; background: var(--parchment); color: var(--text-muted); }
        .adm-plant-stock-badge.low { background: rgba(196,113,75,0.12); color: var(--terra); }
        .adm-plant-stock-badge.zero { background: rgba(196,113,75,0.18); color: var(--terra-dark); }
        .adm-plant-actions { display: flex; gap: 0.5rem; padding: 0.75rem 1.1rem; border-top: 1px solid var(--parchment); background: var(--cream); }
        .adm-btn-edit, .adm-btn-delete { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 500; padding: 0.5rem; border-radius: var(--radius-sm); transition: all var(--transition); border: none; cursor: pointer; }
        .adm-btn-edit { background: var(--parchment); color: var(--sage); }
        .adm-btn-edit:hover { background: var(--mint); color: var(--forest); }
        .adm-btn-delete { background: rgba(196,113,75,0.08); color: var(--terra); }
        .adm-btn-delete:hover { background: rgba(196,113,75,0.18); }

        /* FORM */
        .adm-form-card { background: var(--white); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-xs); border: 1px solid var(--parchment); max-width: 860px; }
        .adm-form-title { font-family: var(--font-display); font-size: 1.6rem; font-weight: 500; color: var(--forest); margin-bottom: 0.4rem; }
        .adm-form-sub { font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.75rem; }
        .adm-form-section { margin-bottom: 1.75rem; padding-bottom: 1.75rem; border-bottom: 1px solid var(--parchment); }
        .adm-form-section:last-of-type { border-bottom: none; margin-bottom: 0; }
        .adm-section-label { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--sage); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
        .adm-section-label::after { content: ''; flex: 1; height: 1px; background: var(--parchment); }
        .adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .adm-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .adm-field.span-2 { grid-column: span 2; }
        .adm-label { font-size: 0.78rem; font-weight: 500; color: var(--text); }
        .adm-label span { color: var(--terra); margin-left: 2px; }
        .adm-input, .adm-textarea, .adm-select { padding: 0.7rem 0.9rem; border-radius: var(--radius-sm); border: 1.5px solid var(--parchment); font-size: 0.875rem; color: var(--text); background: var(--cream); outline: none; transition: border-color var(--transition), box-shadow var(--transition); width: 100%; }
        .adm-input:focus, .adm-textarea:focus, .adm-select:focus { border-color: var(--fern); box-shadow: 0 0 0 3px rgba(127,168,107,0.12); background: var(--white); }
        .adm-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
        .adm-select { cursor: pointer; appearance: none; }
        .adm-upload-zone { border: 2px dashed var(--sand); border-radius: var(--radius); padding: 2rem; text-align: center; cursor: pointer; transition: all var(--transition); background: var(--cream); position: relative; }
        .adm-upload-zone:hover { border-color: var(--fern); background: rgba(127,168,107,0.04); }
        .adm-upload-zone.has-image { border-style: solid; border-color: var(--fern); padding: 0; overflow: hidden; }
        .adm-upload-icon { width: 48px; height: 48px; margin: 0 auto 0.75rem; background: var(--parchment); border-radius: 50%; display: grid; place-items: center; color: var(--sage); }
        .adm-upload-text { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .adm-upload-hint { font-size: 0.72rem; color: var(--text-light); }
        .adm-upload-input { display: none; }
        .adm-upload-preview { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
        .adm-upload-change { position: absolute; inset: 0; background: rgba(15,32,16,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition); color: white; font-size: 0.8rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; }
        .adm-upload-zone:hover .adm-upload-change { opacity: 1; }
        .adm-form-actions { display: flex; gap: 0.75rem; align-items: center; padding-top: 1.5rem; margin-top: 0.5rem; border-top: 1px solid var(--parchment); flex-wrap: wrap; }
        .adm-submit-btn { background: var(--forest); color: var(--cream); font-size: 0.85rem; font-weight: 500; padding: 0.75rem 2rem; border-radius: 100px; border: none; cursor: pointer; transition: background var(--transition), opacity var(--transition); display: flex; align-items: center; gap: 0.5rem; }
        .adm-submit-btn:hover:not(:disabled) { background: var(--forest-light); }
        .adm-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .adm-cancel-btn { background: var(--parchment); color: var(--text-muted); font-size: 0.85rem; font-weight: 500; padding: 0.75rem 1.5rem; border-radius: 100px; border: none; cursor: pointer; transition: background var(--transition); }
        .adm-cancel-btn:hover { background: var(--sand); }
        .adm-lang-tabs { display: flex; gap: 0; margin-bottom: 0.5rem; border: 1.5px solid var(--parchment); border-radius: var(--radius-sm); overflow: hidden; width: fit-content; }
        .adm-lang-tab { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.35rem 0.85rem; border: none; cursor: pointer; transition: all 0.15s ease; background: var(--white); color: var(--text-muted); }
        .adm-lang-tab.active { background: var(--forest); color: var(--cream); }
        .adm-lang-tab:not(:last-child) { border-right: 1.5px solid var(--parchment); }
        .adm-bilingual-field { display: flex; flex-direction: column; gap: 0.4rem; }

        /* PLANTS PAGE NAV TABS */
        .adm-tab-nav { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .adm-tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 1.1rem; border-radius: 100px; font-size: 0.8rem; font-weight: 500; border: 1.5px solid var(--parchment); background: var(--white); color: var(--text-muted); cursor: pointer; transition: all var(--transition); }
        .adm-tab-btn:hover { background: var(--parchment); color: var(--text); }
        .adm-tab-btn.active { background: var(--forest); color: var(--cream); border-color: var(--forest); }

        /* TOAST */
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .adm-toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 200; padding: 0.9rem 1.4rem; border-radius: var(--radius); font-size: 0.85rem; font-weight: 500; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease forwards; max-width: 320px; }
        .adm-toast.success { background: var(--forest); color: var(--cream); border-left: 3px solid var(--fern); }
        .adm-toast.error { background: #3a1010; color: #ffcccc; border-left: 3px solid var(--terra); }

        /* MODAL */
        .adm-modal-overlay { position: fixed; inset: 0; z-index: 150; background: rgba(10,20,11,0.6); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 2rem; }
        .adm-modal { background: var(--white); border-radius: var(--radius-lg); padding: 2rem; max-width: 380px; width: 100%; box-shadow: var(--shadow-xl); }
        .adm-modal-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 500; color: var(--forest); margin-bottom: 0.5rem; }
        .adm-modal-text { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem; }
        .adm-modal-actions { display: flex; gap: 0.75rem; }
        .adm-modal-delete { flex: 1; background: var(--terra); color: white; font-size: 0.82rem; font-weight: 500; padding: 0.65rem; border-radius: 100px; border: none; cursor: pointer; transition: background var(--transition); }
        .adm-modal-delete:hover { background: var(--terra-dark); }
        .adm-modal-cancel { flex: 1; background: var(--parchment); color: var(--text-muted); font-size: 0.82rem; font-weight: 500; padding: 0.65rem; border-radius: 100px; border: none; cursor: pointer; transition: background var(--transition); }
        .adm-modal-cancel:hover { background: var(--sand); }

        /* EMPTY / LOADING */
        .adm-empty { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
        .adm-empty-icon { width: 56px; height: 56px; margin: 0 auto 1.25rem; background: var(--parchment); border-radius: 50%; display: grid; place-items: center; color: var(--sand); }
        .adm-empty h3 { font-family: var(--font-display); font-size: 1.4rem; font-weight: 400; color: var(--forest); margin-bottom: 0.4rem; }
        .adm-empty p { font-size: 0.85rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .adm-spinner { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(247,243,236,0.3); border-top-color: var(--cream); animation: spin 0.7s linear infinite; flex-shrink: 0; }
        .adm-loading { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 4rem; color: var(--text-muted); font-size: 0.875rem; }
        .adm-loading-spinner { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--parchment); border-top-color: var(--sage); animation: spin 0.7s linear infinite; }

        /* GALLERY SECTION */
        .adm-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.65rem; margin-bottom: 0.85rem; }
        .adm-gallery-thumb { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--parchment); background: var(--cream); }
        .adm-gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .adm-gallery-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(10,18,11,0.65); border: none; color: #fff; font-size: 0.75rem; line-height: 1; cursor: pointer; display: grid; place-items: center; }
        .adm-gallery-remove:hover { background: var(--terra); }
        .adm-gallery-add { display: flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; font-weight: 500; color: var(--sage); background: var(--parchment); border: 1.5px dashed var(--sand); border-radius: var(--radius-sm); padding: 0.55rem 1rem; cursor: pointer; transition: all var(--transition); width: fit-content; }
        .adm-gallery-add:hover:not(.uploading) { border-color: var(--fern); background: rgba(127,168,107,0.06); }
        .adm-gallery-input { display: none; }

        /* RESPONSIVE */
        @media (max-width: 640px) {
          .adm-form-card { padding: 1.25rem; max-width: 100%; }
          .adm-stats { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .adm-stat { padding: 1rem 1.1rem; }
          .adm-stat-value { font-size: 1.6rem; }
          .adm-grid-2 { grid-template-columns: 1fr; }
          .adm-field.span-2 { grid-column: span 1; }
          .adm-plant-grid { grid-template-columns: 1fr; }
          .adm-toast { right: 1rem; left: 1rem; max-width: none; }
          .adm-form-actions { flex-direction: column; align-items: stretch; }
          .adm-submit-btn, .adm-cancel-btn { justify-content: center; }
        }

        @media (max-width: 400px) {
          .adm-stats { grid-template-columns: 1fr; }
        }
      `}</style>

      <AdminShell title="Plants" description="Manage your plant inventory">
        <div className="adm-content">
          {/* TAB NAV */}
          <div className="adm-tab-nav">
            {navItems.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`adm-tab-btn${tab === id ? " active" : ""}`}
                onClick={() => {
                  if (id !== "add") resetForm();
                  setTab(id);
                }}
              >
                {icon}
                {label}
              </button>
            ))}
            {tab !== "add" && (
              <button
                className="adm-tab-btn"
                style={{ marginLeft: "auto", background: "var(--forest)", color: "var(--cream)", borderColor: "var(--forest)" }}
                onClick={() => { resetForm(); setTab("add"); }}
              >
                <Plus size={16} aria-hidden="true" />
                {t("admin.addPlant")}
              </button>
            )}
          </div>

          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <>
              <div className="adm-stats">
                {[
                  { label: t("admin.totalPlants"), value: plants.length, sub: "in the marketplace", color: "#7fa86b" },
                  { label: t("admin.inventoryValue"), value: `${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`, sub: "stock × price", color: "#4a6741" },
                  { label: t("admin.outOfStock"), value: outOfStock, sub: outOfStock > 0 ? "need restocking" : "all stocked", color: outOfStock > 0 ? "#c4714b" : "#7fa86b" },
                  { label: t("admin.lowStock"), value: lowStock, sub: "5 or fewer remaining", color: lowStock > 0 ? "#c4914b" : "#7fa86b" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="adm-stat" style={{ "--stat-color": color } as React.CSSProperties}>
                    <div className="adm-stat-label">{label}</div>
                    <div className="adm-stat-value">{value}</div>
                    <div className="adm-stat-sub">{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  {t("admin.recentPlants")}
                </span>
                {plants.length > 0 && (
                  <button
                    style={{ fontSize: "0.75rem", color: "var(--sage)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setTab("manage")}
                  >
                    {t("common.all")}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="adm-loading">
                  <div className="adm-loading-spinner" />
                  {t("common.loading")}
                </div>
              ) : plants.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-icon"><Leaf size={24} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" /></div>
                  <h3>{t("admin.noPlants")}</h3>
                  <p>{t("admin.addFirstPlant")}</p>
                </div>
              ) : (
                <div className="adm-plant-grid">
                  {plants.slice(0, 6).map((p) => (
                    <PlantCard key={p._id} plant={p} onEdit={startEdit} onDelete={setDeleteConfirm} difficultyColor={difficultyColor} t={t} onQRUpdated={handleQRUpdated} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ADD / EDIT TAB */}
          {tab === "add" && (
            <div className="adm-form-card">
              <h2 className="adm-form-title">
                {editingId ? t("admin.editPlant") : t("admin.addNewPlant")}
              </h2>
              <p className="adm-form-sub">
                {editingId
                  ? "Update the details for this plant listing."
                  : "Fill in the details below to add a new plant to the marketplace."}
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="adm-form-section">
                  <div className="adm-section-label">Basic Information</div>
                  <div className="adm-grid-2">
                    <div className="adm-field span-2">
                      <label className="adm-label">{t("plant.name")} <span>*</span></label>
                      <div className="adm-lang-tabs">
                        <button type="button" className={`adm-lang-tab${nameLang === "fr" ? " active" : ""}`} onClick={() => setNameLang("fr")}>FR</button>
                        <button type="button" className={`adm-lang-tab${nameLang === "en" ? " active" : ""}`} onClick={() => setNameLang("en")}>EN</button>
                      </div>
                      {nameLang === "fr" ? (
                        <input key="name-fr" className="adm-input" type="text" placeholder={`${t("admin.namePlaceholder")} (Français)`} value={form.nameFr} onChange={(e) => setForm((f) => ({ ...f, nameFr: e.target.value }))} required />
                      ) : (
                        <input key="name-en" className="adm-input" type="text" placeholder={`${t("admin.namePlaceholder")} (English)`} value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} required />
                      )}
                      {form.nameFr && form.nameEn && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                          {form.nameFr && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "var(--parchment)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>🇫🇷 {form.nameFr}</span>}
                          {form.nameEn && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", background: "var(--parchment)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>🇬🇧 {form.nameEn}</span>}
                        </div>
                      )}
                    </div>
                    <div className="adm-field span-2">
                      <label className="adm-label">{t("plant.description")} <span>*</span></label>
                      <div className="adm-lang-tabs">
                        <button type="button" className={`adm-lang-tab${descLang === "fr" ? " active" : ""}`} onClick={() => setDescLang("fr")}>FR</button>
                        <button type="button" className={`adm-lang-tab${descLang === "en" ? " active" : ""}`} onClick={() => setDescLang("en")}>EN</button>
                      </div>
                      {descLang === "fr" ? (
                        <textarea key="desc-fr" className="adm-textarea" placeholder={`${t("admin.descPlaceholder")} (Français)`} value={form.descFr} onChange={(e) => setForm((f) => ({ ...f, descFr: e.target.value }))} required />
                      ) : (
                        <textarea key="desc-en" className="adm-textarea" placeholder={`${t("admin.descPlaceholder")} (English)`} value={form.descEn} onChange={(e) => setForm((f) => ({ ...f, descEn: e.target.value }))} required />
                      )}
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">{t("plant.price")} (USD) <span>*</span></label>
                      <input className="adm-input" type="number" min="0" step="0.01" placeholder={t("admin.pricePlaceholder")} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">{t("plant.stock")}</label>
                      <input className="adm-input" type="number" min="0" placeholder={t("admin.stockPlaceholder")} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                    </div>
                    <div className="adm-field span-2">
                      <label className="adm-label">{t("plant.category")}</label>
                      <select className="adm-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                        <option value="">Select a category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="adm-form-section">
                  <div className="adm-section-label">{t("plant.care")}</div>
                  <div className="adm-grid-2">
                    <div className="adm-field">
                      <label className="adm-label">{t("plant.wateringFrequency")}</label>
                      <input className="adm-input" type="text" placeholder={t("admin.wateringPlaceholder")} value={form.wateringFrequency} onChange={(e) => setForm((f) => ({ ...f, wateringFrequency: e.target.value }))} />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">{t("plant.lightRequirements")}</label>
                      <input className="adm-input" type="text" placeholder={t("admin.lightPlaceholder")} value={form.lightRequirements} onChange={(e) => setForm((f) => ({ ...f, lightRequirements: e.target.value }))} />
                    </div>
                    <div className="adm-field span-2">
                      <label className="adm-label">{t("plant.difficulty")}</label>
                      <select className="adm-select" value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as "Easy" | "Medium" | "Hard" }))}>
                        <option value="Easy">{t("plant.difficultyEasy")}</option>
                        <option value="Medium">{t("plant.difficultyMedium")}</option>
                        <option value="Hard">{t("plant.difficultyHard")}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="adm-form-section">
                  <div className="adm-section-label">{t("admin.uploadImage")}</div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="adm-upload-input" id="image-upload" onChange={handleImageChange} />
                  <label htmlFor="image-upload" className={`adm-upload-zone${imagePreview ? " has-image" : ""}`}>
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="adm-upload-preview" />
                        <div className="adm-upload-change">{t("admin.changeImage")}</div>
                      </>
                    ) : (
                      <>
                        <div className="adm-upload-icon"><Upload size={22} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" /></div>
                        <p className="adm-upload-text">{t("admin.dragDrop")}</p>
                        <p className="adm-upload-hint">{t("admin.imageFormats")}</p>
                      </>
                    )}
                  </label>
                </div>

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
                  <label htmlFor="gallery-upload" className={`adm-gallery-add${galleryUploading ? " uploading" : ""}`}>
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

                <div className="adm-form-actions">
                  <button type="submit" className="adm-submit-btn" disabled={submitting || imageUploading}>
                    {(submitting || imageUploading) && <span className="adm-spinner" />}
                    {imageUploading
                      ? t("common.loading")
                      : submitting
                      ? t("common.save")
                      : editingId
                      ? t("admin.saveChanges")
                      : t("admin.addToGarden")}
                  </button>
                  <button type="button" className="adm-cancel-btn" onClick={() => { resetForm(); setTab("overview"); }}>
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MANAGE TAB */}
          {tab === "manage" && (
            <>
              {loading ? (
                <div className="adm-loading">
                  <div className="adm-loading-spinner" />
                  {t("common.loading")}
                </div>
              ) : plants.length === 0 ? (
                <div className="adm-empty">
                  <div className="adm-empty-icon"><Leaf size={24} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" /></div>
                  <h3>{t("admin.noPlants")}</h3>
                  <p>{t("admin.addFirstPlant")}</p>
                </div>
              ) : (
                <div className="adm-plant-grid">
                  {plants.map((p) => (
                    <PlantCard key={p._id} plant={p} onEdit={startEdit} onDelete={setDeleteConfirm} difficultyColor={difficultyColor} t={t} onQRUpdated={handleQRUpdated} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </AdminShell>

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="adm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="adm-modal-title">{t("admin.deleteConfirm")}</h3>
            <p className="adm-modal-text">
              {t("admin.deleteConfirmDesc")}{" "}
              <strong>{plants.find((p) => p._id === deleteConfirm)?.name?.[locale as "fr" | "en"] ?? ""}</strong>
            </p>
            <div className="adm-modal-actions">
              <button className="adm-modal-cancel" onClick={() => setDeleteConfirm(null)}>
                {t("admin.deleteCancel")}
              </button>
              <button className="adm-modal-delete" onClick={() => handleDelete(deleteConfirm)}>
                {t("admin.deleteConfirmBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={`adm-toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}

function PlantCard({
  plant,
  onEdit,
  onDelete,
  difficultyColor,
  t,
  onQRUpdated,
}: {
  plant: Plant;
  onEdit: (p: Plant) => void;
  onDelete: (id: string) => void;
  difficultyColor: Record<string, string>;
  t: ReturnType<typeof useTranslations>;
  onQRUpdated: (id: string, qrCode: Plant["qrCode"]) => void;
}) {
  const [qrLoading, setQrLoading] = useState(false);
  const [qrToast, setQrToast] = useState<string | null>(null);

  const stockClass = plant.stock === 0 ? "zero" : plant.stock <= 5 ? "low" : "";

  const stockLabel = () => {
    if (plant.stock === 0) return t("plant.outOfStock");
    if (plant.stock <= 5) return t("plant.lowStock", { count: plant.stock });
    return t("plant.inStock", { count: plant.stock });
  };

  const handleDownloadQR = async () => {
    try {
      const res = await fetch(`/api/plants/${plant._id}/qr-download`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (plant.name?.en || plant.name?.fr || "plant").replace(/[^a-zA-Z0-9-_]/g, "-");
      a.download = `QR-${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setQrToast(t("admin.downloadSuccess"));
      setTimeout(() => setQrToast(null), 3000);
    } catch {
      setQrToast(t("common.error"));
      setTimeout(() => setQrToast(null), 3000);
    }
  };

  const handleRegenerateQR = async () => {
    setQrLoading(true);
    try {
      const res = await fetch(`/api/plants/${plant._id}/regenerate-qr`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onQRUpdated(plant._id, data.qrCode);
      setQrToast(t("admin.regenerateSuccess"));
      setTimeout(() => setQrToast(null), 3000);
    } catch {
      setQrToast(t("common.error"));
      setTimeout(() => setQrToast(null), 3000);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="adm-plant-card">
      <div className="adm-plant-thumb">
        {plant.imageUrl ? (
          <Image src={plant.imageUrl} alt={plant.name?.fr ?? ""} fill sizes="(max-width: 600px) 100vw, 320px" style={{ objectFit: "cover" }} />
        ) : (
          <div className="adm-plant-thumb-placeholder">
            <Leaf size={32} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="adm-plant-info">
        {plant.category && <div className="adm-plant-cat">{plant.category}</div>}
        <div className="adm-plant-name">{plant.name?.fr}{plant.name?.en && plant.name.en !== plant.name.fr && <span style={{ fontSize: "0.7rem", color: "var(--text-light)", marginLeft: "0.4rem" }}>/ {plant.name.en}</span>}</div>
        <div className="adm-plant-meta">
          <span className="adm-plant-price">{plant.price.toFixed(2)} TND</span>
          <span className={`adm-plant-stock-badge ${stockClass}`}>{stockLabel()}</span>
          {plant.careInstructions?.difficulty && (
            <span style={{ fontSize: "0.62rem", padding: "0.2rem 0.5rem", borderRadius: "4px", background: `${difficultyColor[plant.careInstructions.difficulty]}22`, color: difficultyColor[plant.careInstructions.difficulty], fontWeight: 500 }}>
              {plant.careInstructions.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* QR Code Section — always visible */}
      <div style={{ padding: "0.85rem 1.1rem", borderTop: "1px solid var(--parchment)", background: "rgba(127,168,107,0.04)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sage)", marginBottom: "0.65rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <QrCode size={12} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" />
          {t("admin.qrCode")}
        </div>

        {plant.qrCode?.imageUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 80, height: 80, borderRadius: 10, overflow: "hidden", border: "1px solid var(--parchment)", flexShrink: 0, position: "relative", transition: "transform 0.2s ease", cursor: "zoom-in" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Image src={plant.qrCode.imageUrl} alt="QR Code" fill sizes="80px" style={{ objectFit: "contain" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <button
                onClick={handleDownloadQR}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "var(--forest)", color: "var(--cream)", fontSize: "0.72rem", fontWeight: 500, padding: "0.45rem 0.85rem", borderRadius: 100, border: "none", cursor: "pointer", transition: "background 0.18s", width: "100%", justifyContent: "center" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--forest-light)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--forest)")}
              >
                <Download size={12} fill="currentColor" style={{ color: "#ffffff" }} aria-hidden="true" />
                {t("admin.downloadQR")}
              </button>
              <button
                onClick={handleRegenerateQR}
                disabled={qrLoading}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "transparent", color: "var(--sage)", fontSize: "0.72rem", fontWeight: 500, padding: "0.45rem 0.85rem", borderRadius: 100, border: "1px solid var(--parchment)", cursor: qrLoading ? "not-allowed" : "pointer", opacity: qrLoading ? 0.6 : 1, transition: "all 0.18s", width: "100%", justifyContent: "center" }}
                onMouseEnter={(e) => { if (!qrLoading) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(127,168,107,0.1)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {qrLoading ? (
                  <span style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid rgba(127,168,107,0.3)", borderTopColor: "var(--sage)", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <RefreshCw size={12} fill="currentColor" style={{ color: "#7fa86b" }} aria-hidden="true" />
                )}
                {qrLoading ? t("admin.generatingQR") : t("admin.regenerateQR")}
              </button>
              {plant.qrCode.generatedAt && (
                <span style={{ fontSize: "0.62rem", color: "var(--text-light)" }}>
                  {t("admin.qrGenerated")} {new Date(plant.qrCode.generatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* No QR yet — plant existed before this feature was added */
          <button
            onClick={handleRegenerateQR}
            disabled={qrLoading}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--forest)", color: "var(--cream)", fontSize: "0.75rem", fontWeight: 500, padding: "0.55rem 1rem", borderRadius: 100, border: "none", cursor: qrLoading ? "not-allowed" : "pointer", opacity: qrLoading ? 0.6 : 1, transition: "background 0.18s", width: "100%", justifyContent: "center" }}
            onMouseEnter={(e) => { if (!qrLoading) { (e.currentTarget as HTMLButtonElement).style.background = "var(--forest-light)"; } }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--forest)"; }}
          >
            {qrLoading ? (
              <span style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid rgba(247,243,236,0.3)", borderTopColor: "var(--cream)", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <QrCode size={13} fill="currentColor" style={{ color: "#ffffff" }} aria-hidden="true" />
            )}
            {qrLoading ? t("admin.generatingQR") : t("admin.generateQR")}
          </button>
        )}

        {qrToast && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: qrToast === t("common.error") ? "var(--terra)" : "var(--sage)", fontWeight: 500 }}>
            {qrToast}
          </div>
        )}
      </div>

      <div className="adm-plant-actions">
        <button className="adm-btn-edit" onClick={() => onEdit(plant)}>
          <Pencil size={15} style={{ color: "#5b9bd5" }} aria-hidden="true" />
          {t("common.edit")}
        </button>
        <button className="adm-btn-delete" onClick={() => onDelete(plant._id)}>
          <Trash2 size={15} style={{ color: "#c0543a" }} aria-hidden="true" />
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}
