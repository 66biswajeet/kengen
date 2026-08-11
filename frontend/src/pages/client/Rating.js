import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { apiError } from "../../lib/api";
import { toast } from "sonner";
import { Star, Camera, X } from "lucide-react";
import AppHeader from "../../components/AppHeader";
import { uploadImage } from "../../lib/integrations";

const TAGS = ["Punctual", "Professional", "Quality Work", "Polite", "Explained clearly"];

export default function Rating() {
  const { id } = useParams();
  const nav = useNavigate();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const toggle = (t) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url, mode } = await uploadImage(file);
      setImages((p) => [...p, url]);
      if (mode === "mock") toast.info("Uploaded (mock mode — set Cloudinary env for real hosting)");
    } catch (err) { toast.error("Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const submit = async () => {
    if (rating < 1) return toast.error("Please give a rating");
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/review`, { rating, tags, comment, image_urls: images });
      toast.success("Thanks for your feedback!");
      nav(`/booking/${id}`, { replace: true });
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="app-shell" data-testid="rating-screen">
      <AppHeader title="Rate your experience" />
      <div className="px-6 pt-6 pb-24">
        <h1 className="font-display text-2xl font-semibold text-charcoal">How was the service?</h1>
        <p className="text-slate text-sm mt-1 mb-6">Your feedback helps us improve.</p>

        <div className="flex items-center justify-center gap-3 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} data-testid={`star-${n}`} className="transition-transform active:scale-90">
              <Star size={44} strokeWidth={1.5} className={n <= rating ? "text-accent fill-accent" : "text-gray-300"} />
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-charcoal mb-2">What did you like?</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggle(t)}
                data-testid={`tag-${t.toLowerCase().replace(/\s/g, "-")}`}
                className={`chip transition-colors ${tags.includes(t) ? "!bg-primary !text-white" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-charcoal mb-2">Additional comments</div>
          <textarea rows={3} className="input-field" placeholder="Tell us more (optional)" value={comment} onChange={(e) => setComment(e.target.value)} data-testid="rating-comment" />
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-charcoal mb-2">Add photos (optional)</div>
          <div className="flex flex-wrap gap-2">
            {images.map((u, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={u} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setImages(images.filter((_, k) => k !== i))} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"><X size={10} /></button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate/30 flex flex-col items-center justify-center text-slate cursor-pointer hover:border-primary" data-testid="upload-photo-btn">
              <Camera size={20} />
              <span className="text-[10px] mt-1">{uploading ? "Uploading…" : "Photo"}</span>
              <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
            </label>
          </div>
        </div>

        <button className="btn-accent mt-8" onClick={submit} disabled={busy} data-testid="submit-review-btn">
          {busy ? "Submitting..." : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}
