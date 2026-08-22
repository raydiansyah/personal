/**
 * Module: Services page
 * Purpose: Explain service lines, four-step workflow, and common questions
 * Used by: TanStack route /services
 * Dependencies: Shared Feature component and TanStack Link
 * Public functions: ServicesPage()
 * Side effects: Client-side navigation only
 */
import { Feature } from '../components/site-shell';

export function ServicesPage() { return <section className="page section"><p className="eyebrow">Services</p><h1>From first thought to shipped experience.</h1><div className="grid"><Feature number="01" title="Digital presence" text="Websites dan company profile yang punya karakter dan bekerja untuk bisnis." /><Feature number="02" title="Web applications" text="Interface produk yang membuat workflow rumit terasa lebih sederhana." /><Feature number="03" title="Design direction" text="Sistem visual dan keputusan UX yang membuat tim bergerak lebih yakin." /></div><div className="section-heading"><div><p className="eyebrow">How we work</p><h2>Four clear moves.</h2></div></div><div className="grid"><Feature number="01" title="Align" text="Kita menyamakan konteks, tujuan, dan ukuran sukses." /><Feature number="02" title="Shape" text="Arah visual dan struktur pengalaman dibentuk bersama." /><Feature number="03" title="Build" text="Produk dirakit dengan ritme review yang singkat dan konkret." /><Feature number="04" title="Launch" text="Kita menyiapkan handoff, QA, dan langkah setelah live." /></div><div className="section-heading"><div><p className="eyebrow">FAQ</p><h2>Good questions welcome.</h2></div></div><div className="grid"><article className="card"><h3>Berapa lama prosesnya?</h3><p className="muted">Biasanya 4–10 minggu, tergantung ruang lingkup dan kecepatan review.</p></article><article className="card"><h3>Apakah bisa mulai kecil?</h3><p className="muted">Bisa. Kita bisa mulai dari satu halaman penting atau prototype terarah.</p></article><article className="card"><h3>Teknologi apa yang dipakai?</h3><p className="muted">Dipilih berdasarkan kebutuhan; fondasi saat ini React/TanStack dan Supabase.</p></article></div></section>; }
