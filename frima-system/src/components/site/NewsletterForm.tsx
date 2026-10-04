"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { subscribeNewsletter } from "@/lib/actions/newsletter";
import { useAction } from "@/components/ui/useAction";

const field =
  "w-full border border-white/20 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-gold";

export function NewsletterForm() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const subscribe = useAction(subscribeNewsletter, { onSuccess: () => setDone(true) });

  if (done) {
    return (
      <p className="mt-5 border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
        {t("site.footer.subscribed")}
      </p>
    );
  }

  return (
    <form action={subscribe.run} className="mt-5 space-y-3">
      {subscribe.error && (
        <p className="border border-[#d98f85]/40 bg-[#d98f85]/10 px-3 py-2 text-xs text-[#f3c9c3]">
          {subscribe.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input
          name="firstName"
          placeholder={t("site.footer.firstName")}
          required
          className={field}
        />
        <input
          name="lastName"
          placeholder={t("site.footer.lastName")}
          required
          className={field}
        />
      </div>
      <input
        name="email"
        type="email"
        placeholder={t("common.email")}
        required
        className={field}
      />
      <button
        type="submit"
        disabled={subscribe.pending}
        className="w-full bg-gold px-4 py-2.5 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-soft disabled:opacity-50"
      >
        {subscribe.pending ? t("site.footer.subscribing") : t("site.footer.signUp")}
      </button>
    </form>
  );
}
