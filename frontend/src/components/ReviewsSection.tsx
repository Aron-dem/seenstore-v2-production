import { useState, useEffect } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { useLang } from "../context/LanguageContext";
import { toast } from "sonner";

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  createdAt: string;
}

interface ReviewsSectionProps {
  productId: number;
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { lang, isRTL } = useLang();

  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
    userName: "",
    userEmail: "",
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.comment || !formData.userName || !formData.userEmail) {
      toast.error(lang === "en" ? "Please fill all fields" : "يرجى ملء جميع الحقول");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(lang === "en" ? "Review submitted successfully!" : "تم إرسال التقييم بنجاح!");
        setFormData({ rating: 5, title: "", comment: "", userName: "", userEmail: "" });
        setShowForm(false);
        fetchReviews();
      } else {
        toast.error(lang === "en" ? "Failed to submit review" : "فشل إرسال التقييم");
      }
    } catch (error) {
      toast.error(lang === "en" ? "Error submitting review" : "خطأ في إرسال التقييم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12 pt-12 border-t border-zinc-700">
      <h3 className="text-2xl font-bold mb-8">{lang === "en" ? "Customer Reviews" : "آراء العملاء"}</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#E63946]" />
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="mb-8 p-6 bg-zinc-800 rounded-lg border border-zinc-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl font-bold text-white">{averageRating.toFixed(1)}</div>
              <div>
                {renderStars(Math.round(averageRating))}
                <p className="text-sm text-zinc-400 mt-2">
                  {lang === "en" ? `Based on ${reviews.length} reviews` : `بناءً على ${reviews.length} تقييم`}
                </p>
              </div>
            </div>
          </div>

          {/* Add Review Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-8 px-6 py-3 bg-[#E63946] text-white rounded-lg font-bold hover:bg-black transition-colors"
          >
            {lang === "en" ? "Write a Review" : "اكتب تقييماً"}
          </button>

          {/* Review Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    {lang === "en" ? "Rating" : "التقييم"}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: i })}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer ${
                            i <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    {lang === "en" ? "Name" : "الاسم"}
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                    className="w-full bg-zinc-900 text-white border-2 border-zinc-600 p-3 rounded-lg focus:border-[#E63946] outline-none placeholder:text-zinc-500"
                    placeholder={lang === "en" ? "Your name" : "اسمك"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    {lang === "en" ? "Email" : "البريد الإلكتروني"}
                  </label>
                  <input
                    type="email"
                    value={formData.userEmail}
                    onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
                    className="w-full bg-zinc-900 text-white border-2 border-zinc-600 p-3 rounded-lg focus:border-[#E63946] outline-none placeholder:text-zinc-500"
                    placeholder="you@example.com"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    {lang === "en" ? "Title" : "العنوان"}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-900 text-white border-2 border-zinc-600 p-3 rounded-lg focus:border-[#E63946] outline-none placeholder:text-zinc-500"
                    placeholder={lang === "en" ? "Review title" : "عنوان التقييم"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">
                    {lang === "en" ? "Comment" : "التعليق"}
                  </label>
                  <textarea
                    value={formData.comment}
                    onChange={e => setFormData({ ...formData, comment: e.target.value })}
                    className="w-full bg-zinc-900 text-white border-2 border-zinc-600 p-3 rounded-lg focus:border-[#E63946] outline-none resize-none placeholder:text-zinc-500"
                    rows={4}
                    placeholder={lang === "en" ? "Share your experience..." : "شارك تجربتك..."}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#E63946] text-white py-3 rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === "en" ? "Submitting..." : "جاري الإرسال..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {lang === "en" ? "Submit Review" : "إرسال التقييم"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-2 border-zinc-600 text-white py-3 rounded-lg font-bold hover:border-[#E63946] transition-colors"
                  >
                    {lang === "en" ? "Cancel" : "إلغاء"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">
                {lang === "en" ? "No reviews yet. Be the first to review!" : "لا توجد تقييمات حتى الآن. كن الأول في التقييم!"}
              </p>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="p-6 border border-zinc-700 rounded-lg bg-zinc-900">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-700">
                            {lang === "en" ? "Verified" : "موثّق"}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white">{review.title}</h4>
                      <p className="text-sm text-zinc-400">{lang === "en" ? "by" : "بواسطة"} {review.userName}</p>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {new Date(review.createdAt).toLocaleDateString(lang === "en" ? "en-US" : "ar-EG")}
                    </p>
                  </div>
                  <p className="text-zinc-300 mb-4">{review.comment}</p>
                  <button className="text-sm text-zinc-500 hover:text-[#E63946] transition-colors">
                    👍 {review.helpful} {lang === "en" ? "Helpful" : "مفيد"}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
