"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function ContactForm() {
  return (
    <div className="linen-card p-8 sm:p-12 rounded-3xl">
      <h3 className="text-2xl font-black text-[#22183D] dark:text-white mb-2">Send Us a Direct Message</h3>
      <p className="text-xs sm:text-sm text-[#6B627A] dark:text-[#DDD3E9]/80 mb-8">
        Our academic project manager will reply to your email or WhatsApp within 15 minutes.
      </p>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] mb-1.5 uppercase tracking-wide">Your Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Kamau"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] mb-1.5 uppercase tracking-wide">Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] mb-1.5 uppercase tracking-wide">Phone / WhatsApp Number</label>
            <input
              type="tel"
              placeholder="+254 700 000 000"
              className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] mb-1.5 uppercase tracking-wide">Topic / Inquiry Type</label>
            <select className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all">
              <option>Order Academic Writing</option>
              <option>SPSS / Data Analysis Quote</option>
              <option>Thesis / Dissertation Guidance</option>
              <option>Specialist Application Question</option>
              <option>Partnership / Corporate Inquiries</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#22183D] dark:text-[#DDD3E9] mb-1.5 uppercase tracking-wide">Project Details / Message</label>
          <textarea
            rows={4}
            placeholder="Tell us about your project requirements, deadline, page count, or questions..."
            className="w-full text-sm bg-[#FAF8FD] dark:bg-[#1D1533] border border-[#DDD3E9] dark:border-[#3A2F5B] rounded-xl px-4 py-3 text-[#22183D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3594] transition-all resize-none"
            required
          ></textarea>
        </div>

        <Button type="submit" size="lg" className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl py-6 shadow-lg shadow-[#FF7A3D]/25 transition-all hover:scale-[1.01] text-base">
          <Send className="w-4 h-4 mr-2" />
          <span>Send Inquiry</span>
        </Button>

        <p className="text-xs text-[#6B627A] dark:text-[#DDD3E9]/70 text-center pt-2">
          🔒 Your privacy is strictly protected. We never share your contact details.
        </p>
      </form>
    </div>
  );
}

