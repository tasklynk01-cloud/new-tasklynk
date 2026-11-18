import { PhoneCall } from "lucide-react";

export function SiteStatusNotice() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-green-500 bg-green-50 p-4 text-sm text-green-700">
      <div className="flex items-center gap-3 font-semibold">
        <PhoneCall className="h-4 w-4" />
        <span>TaskLynk is still under development.</span>
      </div>
      <p className="text-sm font-medium">
        We&apos;re focused on ensuring your best experience. If you encounter any issues please contact admin via WhatsApp or call at <a className="font-semibold underline" href="tel:0701066845">0701066845</a>.
      </p>
    </div>
  );
}
