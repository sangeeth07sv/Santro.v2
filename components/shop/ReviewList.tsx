import { Star } from "lucide-react";
import type { Review } from "@/types/database";

export function ReviewList({ productId, reviews }: { productId: string; reviews: Review[] }) {
  return (
    <section className="mt-16 border-t border-slate-100 pt-10 dark:border-slate-800">
      <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">
        Customer Reviews ({reviews.length})
      </h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">No reviews yet. Be the first to review this product.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {review.profile?.full_name ?? "Anonymous"}
                </p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>
              {review.title && <p className="mt-1 text-sm font-medium">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
